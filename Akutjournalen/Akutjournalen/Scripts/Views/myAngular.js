
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getSessionId() {

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}

var app = angular.module("myApp", ["datatables"]);

app.factory('GetInstructions', function ($http) {

    var myService = {
        getInstruct: function (Query) {
            var searchData = [
              { key: "firstNames", value: "*" },
              { key: "lastNames", value: "*" }
            ];

            sessionId = getSessionId()

            var object = new Object();
            object.instructions = [];

            var promise = $http({
                async: false,
                url: baseUrl + "/query?" + $.param({ "aql": Query }),
                method: "GET",
                headers: {
                    "Ehr-Session": sessionId
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

                //Response (res) ger alla compositions/instructions som man hämtar från EHRscape och går igenom dessa i en for-loop och lägger in viktig data.
            }).success(function (res) {
                console.log('res', res);
                if (res == "") {
                    console.log("Response was empty, there was no items to get from EHrscape")
                }
                else {
                    for (var k = 0; k < res.resultSet.length; k++) {
                        object.instructions.push(res.resultSet[k].Composition);
                        object.instructions[k].patientinfo = {};
                        object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
                        object.instructions[k].patientinfo.personnummer = "";
                        object.instructions[k].patientinfo.gender = "";

                    }

                    //console.log(object.instructions);

                    $.ajaxSetup({
                        headers: {
                            "Ehr-Session": sessionId
                        }
                    });

                    var insertParties = $.ajax({
                        async: false,
                        url: baseUrl + "/demographics/party/query",
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(searchData),
                        //Returnerar alla parties, dvs alla patienter.
                        success: function (res) {
                            //Kollar igenom alla patienter i listan.
                            for (var i = 0; i < res.parties.length; i++) {
                                //Kollar igenom alla instructions i listan.
                                for (var t = 0; t < Object.size(object.instructions) ; t++) {

                                    try {

                                        if (res.parties[i].partyAdditionalInfo["0"].value === object.instructions[t].patientinfo.EHRID) {
                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["1"].value;
                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
                                        }

                                        else if (res.parties[i].partyAdditionalInfo["1"].value === object.instructions[t].patientinfo.EHRID) {

                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["0"].value;
                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
                                        }
                                    }
                                    catch (e) {
                                    }
                                }
                            }
                        }
                    });
                }

            }).error(function (error) {
                console.log(error);
            });

            return promise;
        }
    }

    return myService;
});









app.factory('DoneRemissFact', function ($http) {

    var myService = {
        doneRemisser: function (aql) {
            var searchData = [
                { key: "firstNames", value: "*" },
                { key: "lastNames", value: "*" }
            ];
            var object = new Object();
            object.instructions = [];


            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": aql }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).success(function (res) {

                console.log('Res1:', res);
                if (res == "") {
                    console.log("Response was empty, there was no items to get from EHrscape")
                }
                else {
                    for (var k = 0; k < res.resultSet.length; k++) {
                        object.instructions.push(res.resultSet[k].Composition);
                        object.instructions[k].patientinfo = {};
                        object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
                        object.instructions[k].patientinfo.personnummer = "";
                        object.instructions[k].patientinfo.gender = "";

                    }

                    $.ajaxSetup({
                        headers: {
                            "Ehr-Session": sessionId
                        }
                    });

                    var insertParties = $.ajax({
                        async: false,
                        url: baseUrl + "/demographics/party/query",
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(searchData),
                        //Returnerar alla parties, dvs alla patienter.
                        success: function (res) {
                            //Kollar igenom alla patienter i listan.
                            for (var i = 0; i < res.parties.length; i++) {
                                //Kollar igenom alla instructions i listan.
                                for (var t = 0; t < Object.size(object.instructions) ; t++) {

                                    try {

                                        if (res.parties[i].partyAdditionalInfo["0"].value === object.instructions[t].patientinfo.EHRID) {
                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["1"].value;
                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
                                        }

                                        else if (res.parties[i].partyAdditionalInfo["1"].value === object.instructions[t].patientinfo.EHRID) {

                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["0"].value;
                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
                                        }
                                    }
                                    catch (e) {
                                    }
                                }
                            }
                        }
                    });

                }
                
            }).error(function (error) {
                console.log(error)

            });

            return promise;
        }

    };

    return myService;
});




app.controller('StartSidaBeslutCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

    var aql = "select e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100";

    data = GetInstructions.getInstruct(aql);
    console.log('data', data);
    $scope.instructions = data.instructions;
   
}]);



////Insert value to current_state in the composition
function buildActionFromInstruction(instruction, code, actionString, uid) {
    return {
        "ctx/language": "sv",
        "ctx/territory": "se",
        "remiss/status_på_remiss_till_kirurgen/ism_transition/current_state|code": code,
        "remiss/status_på_remiss_till_kirurgen/ism_transition/current_state|value": actionString
    }
};

function SendComposition(actionString, code, uid, templateid, ehrId) {
    //Load/Get latest composition

    console.log(actionString);
    var getCompPromise = new Promise(function (resolve, reject) {

        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId(),
            }
        });

        $.ajax({
            url: baseUrl + "/composition/" + uid + "?format=RAW", //$.param(params),
            type: 'GET',
            contentType: 'application/json; charset=utf-8',
            success: function (res) {
                resolve(res);
            }, error: function (error) {
                reject(error);
            }
        });

    });
    getCompPromise.then(function (res) {

        //SEND COMPOSITION UPDATE
        console.log('Response', res)
        templateId = res.templateId;
        
        templateId = templateId.replace(/\s/g, '+');

        console.log('current_state1', res.composition.content[1].ism_transition.current_state.value);
        console.log('code_string1', res.composition.content[1].ism_transition.current_state.defining_code.code_string);

        res.composition.content[1].ism_transition.current_state.value = actionString;
        res.composition.content[1].ism_transition.current_state.defining_code.code_string = code;

        console.log('newstate', res.composition.content[1].ism_transition.current_state.value);
        console.log('code_string', res.composition.content[1].ism_transition.current_state.defining_code.code_string);

        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId(),
            }
        });


        //Send update to composition
        $.ajax({
            type: 'PUT',
            url: baseUrl + "/composition/" + uid + "?templateId=" + templateId + "&format=RAW", //
            data: JSON.stringify(res.composition),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                console.log('Success', response)
                console.log("SUCCESS!");
                window.location.reload();
            },
            error: function (error) {
                console.log(error);
            }
        });

    });
};

////////////---///// Todo:  Merge controllers into one  controller so that you can later just do one AQL-query and sort after that's done.

app.controller('InkommandeRemissCtrl', ['$scope', '$filter', "GetInstructions", function ($scope, $filter, GetInstructions) {
    

    var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state"+
        ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION."+
        "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-"+
        "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";


    //DoneRemissFact.doneRemisser(aql).then(function (data) {
    //    var instructions = data.data.resultSet;
    //    console.log('instructions', instructions)
    //    var instructionObject = {};
    //    var objectArray = [];


    //    if (instructions) {
    //        instructions.forEach(function (item) {
    //            if (item) {
    //                if (item.Composition.content[1].ism_transition.current_state.value == 'active') {
    //                    console.log("oldtime", item.Composition.content[1].time.value);

    //                    var date_to_filter = item.Composition.content[1].time.value;
    //                    var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

    //                    item.time = data_filtered;
    //                    console.log("NewTime", item.time);

    //                    objectArray.push(item);

    //                }
    //                else {
    //                    console.log("Not state: active")
    //                }
    //            }

    //        });
    //    }
    //    else {
    //        console.log("No added instructions, response was empty...")
    //    }

    //    console.log('objectArray', objectArray);
    //    $scope.doneRemisser = objectArray;


    //});


    GetInstructions.getInstruct(aql).then(function (data) {
        var instructions = data.data.resultSet;
        var temparray = [];

        if (instructions) {
            
            instructions.forEach(function (instruction) {
                if (instruction) {
                    if (instruction.Composition.content[1].ism_transition.current_state.value == 'planned') {

                        console.log("oldtime", instruction.Composition.content[1].time.value);

                        var date_to_filter = instruction.Composition.content[1].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        instruction.time = data_filtered;
                        console.log("NewTime", instruction.time);


                        temparray.push(instruction);
                    }
                    else {
                        console.log("Not state: Planned")
                    }
                }
            });
               
            //}
            //var temp_promise = new Promise(function (resolve, reject) {
            //    var objectArray = [];

            //    

            //    //resolve(objectArray);
            //})
        }
        else {
            console.log("No added instructions, response was empty...")
        }

        console.log('instructions', temparray);
        $scope.instructions = temparray;
        //temp_promise.then(function (instructions) {
            
            


        //});

    });
   
    
    $scope.UpdateState = function (instruction, event) {
        if (event.currentTarget.id) {
            if(event.currentTarget.id == "AvvisaButton") {
                SendComposition("cancelled","528",instruction.uid.value, instruction.archetype_details.template_id.value, instruction.patientinfo.EHRID);
            }
            else if (event.currentTarget.id == "UnderlagButton") {
                SendComposition("active", "245", instruction.uid.value, instruction.archetype_details.template_id.value, instruction.patientinfo.EHRID);

            }
            else {
                console.log("Did nothing...")
            }
        }
    }
      
  
    $scope.AvvisaRemiss = function (instruction) {
        console.log('AvvisaRemiss, Instruction', instruction);
    };

    $scope.CreateUnderlag = function (instruction) {
        var currentdate = new Date();
        currentdate = $filter('date')(currentdate, "y-MM-dd, HH:mm");
        var json = '{"ehrid":"' + instruction.patientinfo.EHRID + '","current_state":"active",' +
        '"firstname":"' + instruction.patientinfo.firstname + '","lastname":"' + instruction.patientinfo.lastname + '","gender":"' + instruction.patientinfo.gender + '"' +
        ',"personnummer":"' + instruction.patientinfo.personnummer + '","time_created":"' + currentdate + '"' +
        ',"start_date_countdown":"","utredning_id":"' + instruction.uid.value + '","filled_form_status":"","instruction_id" : "' + instruction.content["0"].uid.value + '"' +
        ',"activity_id" : "' + instruction.content["0"].uid.value + '", "ansvarig_enhet":"' + instruction.content[0].protocol.items[1].value.value + '" }';


        $.ajax({
            async: false,
            type: 'POST',
            url: 'Inkommande/CreateUnderlag',
            data: json,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                console.log("Successfully added remiss to underlag", response)
            },
            error: function (error) {
                alert("Error in creating underlag");
                console.log("Error in creating underlag", error.responseText);
            }
        });
    };

    $scope.checkIfClicked = function (ehrid, uid) {
        if ($scope.clickedInstruction == ehrid && $scope.clickedUid == uid) {
            return true;
        }
        else {
            return false;
        }
    }
    $scope.toogleButtons = function (ehrID, uid) {

        if (ehrID == $scope.clickedInstruction && uid == $scope.clickedUid) {
            $scope.clickedInstruction = "";
            $scope.clickedUid = "";
        }
        else {
            $scope.clickedInstruction = ehrID;
            $scope.clickedUid = uid;
        }
    }

}]);


////////////---///// Todo:  Merge controllers into one  controller so that you can later just do one AQL-query and sort after that's done.

app.controller('DoneRemissCtrl', ['$scope', '$filter', 'DoneRemissFact', function ($scope, $filter, DoneRemissFact) {


    var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state" +
        ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION." +
        "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-" +
        "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";


    DoneRemissFact.doneRemisser(aql).then(function (data) {
        var instructions = data.data.resultSet;
        console.log('instructions', instructions)
        var instructionObject = {};
        var objectArray = [];


        if(instructions) {
            instructions.forEach(function (item) {
                if (item) {
                    if (item.Composition.content[1].ism_transition.current_state.value == 'active') {
                        console.log("oldtime", item.Composition.content[1].time.value);

                        var date_to_filter = item.Composition.content[1].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        item.time = data_filtered;
                        console.log("NewTime", item.time);

                        objectArray.push(item);

                    }
                    else {
                        console.log("Not state: active")
                    }
                }

            });
        }
        else {
            console.log("No added instructions, response was empty...")
        }
    
        console.log('objectArray', objectArray);
        $scope.doneRemisser = objectArray;
    });


}]);

//app.controller('NyUtredningCtrl', ['$scope', function ($scope) {

//    $scope.GetPatients = function () {
//    }

//}]);

app.controller('StartSidaPlaneringCtrl', function ($scope, $http) {


});
