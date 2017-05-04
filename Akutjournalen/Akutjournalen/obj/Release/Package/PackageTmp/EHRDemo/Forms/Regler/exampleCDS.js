
var cdsUrl = 'https://rest.ehrscape.com/thinkcds/rest/v1'; 


var username = "Carlos.Ortiz@regionostergotland.se";
var password = "Cortiz13112015";

var authorization = "Basic " + btoa(username + ":" + password);
//alert(authorization)
var ehrId = "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4";

//console.log(authorization)



//query EHR for BMI and get results in plain format
queryBMIPlain();

function queryBMIPlain() {
	return $.ajax({
        url: cdsUrl + "/guide/BMI.Calculation.v.1_V2/execute/" + ehrId +"/query",
		type: 'POST',
        headers: {
            "Authorization": authorization
        },
        success: function (data) {
            if (data instanceof Array) {
                if (data[0].hasOwnProperty('results')) {
                    data[0].results.forEach(function (v, k) {
                        if (v.archetypeId === 'openEHR-EHR-OBSERVATION.body_mass_index.v1') {
                            var rounded = Math.round(v.value.magnitude * 100.0) / 100.0;
                            $("#result").append('BMI: ' + rounded);
                        }
                    })
                }
            }
        }
    });
}


Key	Value
Request	POST /thinkcds/rest/v1/guide/BMI.Calculation.v.1_V2/execute/28ac8bbc-eb14-4f01-a30d-bcff446e0bd4/query

?templateId=Vital+Signs&format=composition&persist=false&trace=false 

//query EHR for BMI and get results in json composition format
queryBMIComposition();

function queryBMIComposition() {
	var queryParams = {
    templateId: 'Vital Signs',
    format: 'composition',
	persist: 'false',
	trace: 'false'
};
	return $.ajax({
        url: cdsUrl + "/guide/BMI.Calculation.v.1_V2/execute/" + ehrId +"/query?" + $.param(queryParams),
		type: 'POST',
        headers: {
            "Authorization": authorization
        },
        success: function (data) {
			 $("#result").append('<br>Vital Signs Composition result: <br><pre id="json">' + JSON.stringify(data,null, 2)+"</pre>");
        }
    });
}


// calculate BMI based on submited values in json composition format and get results in plain format


calculateBMI(180,80);

function calculateBMI(height,weight) {
	var jsonComposition = {
  "vital_signs/height_length:0/any_event:0/body_height_length|magnitude": height,
  "vital_signs/height_length:0/any_event:0/body_height_length|unit": "cm",
  "vital_signs/body_weight:0/any_event:0/body_weight|magnitude": weight,
  "vital_signs/body_weight:0/any_event:0/body_weight|unit": "kg"
};
var templateId = "Vital Signs";
    return $.ajax({
		type: 'POST',
	   data: JSON.stringify(jsonComposition),
	     contentType: 'application/json',
        url: cdsUrl + "/guide/BMI.Calculation.v.1_V2/execute/" + ehrId +"/composition/"+ templateId,
         headers: {
            "Authorization": authorization
        },
       success: function (data) {
            if (data instanceof Array) {
                if (data[0].hasOwnProperty('results')) {
                    data[0].results.forEach(function (v, k) {
                        if (v.archetypeId === 'openEHR-EHR-OBSERVATION.body_mass_index.v1') {
                           
                            $("#result").append('<br>If Height='+height+'cm and Weight='+weight+'kg then BMI= ' + v.value.magnitude);
                        }
                    })
                }
            }
        }
    });
}


$("#result").append(authorization);