var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var ehrId = "fbd5f739-76e2-4702-a3f9-2963bbe6eae2";

var username = "samuel";
var password = "cyber111";

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

var sessionId = getSessionId();

saveComposition(sessionId);
//getBody_temperatures(sessionId);



function getBody_temperatures(sessionId){
	$.ajax({
    url: baseUrl + "/view/" + ehrId + "/body_temperature",
    type: 'GET',
    headers: {
        "Ehr-Session": sessionId
    },
    success: function (res) {
        $("#header").append("Body Temperatures");
        for (var i in res) {
            $("#result").append(res[i].time + ': ' + res[i].temperature  + res[i].unit + "<br>");
        }
    }
});
}


function saveComposition(sessionId){
	$.ajaxSetup({
    headers: {
        "Ehr-Session": sessionId,
		"Content-Type": "applcation/json"
    }
});
var compositionData = {
    "ctx/time": "2014-3-19T13:10Z",
    "ctx/language": "en",
    "ctx/territory": "CA",
    "vital_signs/body_temperature/any_event/temperature|magnitude": 37.1,
    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
    "vital_signs/blood_pressure/any_event/systolic": 120,
    "vital_signs/blood_pressure/any_event/diastolic": 90,
    "vital_signs/height_length/any_event/body_height_length": 171,
    "vital_signs/body_weight/any_event/body_weight": 57.2
};
var queryParams = {
    "ehrId": ehrId,
    templateId: 'Vital Signs',
    format: 'FLAT',
    committer: 'Belinda Nurse'
};
$.ajax({
    url: baseUrl + "/composition?" + $.param(queryParams),
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(compositionData),
    success: function (res) {
        $("#header").html("Store composition");
        $("#result").html(res.meta.href);
    }
});
	
	
	
}