var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var username = getUsername();
var password = getPassword();

(function () {
    var growlContent = "";
});

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

//Must have id to do gets/posts or updates from/to EHRscape.
function getSessionId() {

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}

//Get currentage based on EHR's "date of birth"- key.
function CurrentAge(EHRdateofBirth) {
    if (EHRdateofBirth != "" || EHRdateofBirth != null) {
        EHRdateofBirth = parseInt(EHRdateofBirth);
        var today = new Date();
        var currentYear = today.getFullYear()
        var age = currentYear - EHRdateofBirth;

        return age;
    }
    else {
        return "";
    }
}

//Translates the gender from english to swedish if binary genders are used.
function translateGender(engGender) {

    if (engGender) {
        var sweGender;
        if (engGender == 'male') {
            sweGender = 'Man'
        }
        else if (engGender == 'female') {
            sweGender = 'Kvinna'
        }
        else {
            sweGender = '';
        }
        return sweGender;
    }
    else {
        return '-';
    }
}



var app = angular.module("myApp", ["datatables"]);

//Factory to get the list of items you want from EHRscape.
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

                //Response (res) gives us the responses from EHRscape.
            }).success(function (res) {
                console.log('res', res);
                if (res == "") {
                    console.warn("Response was empty, there was no items to get from EHrscape")
                }
                else {

                    //Initiate all values in each list item to be able to fill them later.
                    for (var k = 0; k < res.resultSet.length; k++) {
                        object.instructions.push(res.resultSet[k].Composition);
                        object.instructions[k].patientinfo = {};
                        object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
                        object.instructions[k].patientinfo.personnummer = "";
                        object.instructions[k].patientinfo.IsGoliatRelated = "false";
                        object.instructions[k].patientinfo.gender = "";
                        object.instructions[k].patientinfo.age = "";

                    }

                    console.log("object.instructions", object.instructions);

                    $.ajaxSetup({
                        headers: {
                            "Ehr-Session": sessionId
                        }
                    });

                    //Ajax call to get parties and then insert relevant data to corresponding patient.
                    var insertParties = $.ajax({
                        async: false,
                        url: baseUrl + "/demographics/party/query",
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(searchData),
                        //Response (res) gives us the patients (res.parties).
                        success: function (res) {
                            var today = new Date();
                            var rege = /[0-9]+-[0-9]/;

                            //Checks through all the incoming instructions (object.instructions)
                            for (var t = 0; t < Object.size(object.instructions) ; t++) {

                                try {

                                    for (var p = 0; p < res.parties.length; p++) {
                                        //For every patient...

                                        for (var k = 0; k < res.parties[p].partyAdditionalInfo.length; k++) {
                                            //For every element in partyadditionalinfo...

                                            //Set EHRID.
                                            if (res.parties[p].partyAdditionalInfo[k].key == "ehrId" &&
                                                res.parties[p].partyAdditionalInfo[k].value == object.instructions[t].patientinfo.EHRID) {
                                                //If it's EHRID and it matches the correct patients EHRID.
                                                console.log("EhrId matched");

                                                object.instructions[t].patientinfo.firstname = res.parties[p].firstNames;
                                                object.instructions[t].patientinfo.lastname = res.parties[p].lastNames;

                                                if (res.parties[t].dateOfBirth != "" || res.parties[p].dateOfBirth != null) {
                                                    var age = (CurrentAge(res.parties[p].dateOfBirth));
                                                    object.instructions[t].patientinfo.age = age;
                                                }

                                                object.instructions[t].patientinfo.gender = translateGender(res.parties[p].gender.toLowerCase());
                                            }

                                            //Set personnummer.
                                            else if (res.parties[p].partyAdditionalInfo[k].key == "Personnummer") {

                                                //Om det är personnummer och patienten matchar EHRID
                                                for (var x = 0; x < res.parties[p].partyAdditionalInfo.length; x++) {
                                                    if (res.parties[p].partyAdditionalInfo[x].key == "ehrId") {
                                                        if (res.parties[p].partyAdditionalInfo[x].value == object.instructions[t].patientinfo.EHRID) {
                                                            object.instructions[t].patientinfo.personnummer = res.parties[p].partyAdditionalInfo[k].value;
                                                        }
                                                    }

                                                }
                                            }
                                            

                                            //Set tags.
                                            else if (res.parties[p].partyAdditionalInfo[k].key == "tags" &&
                                                res.parties[p].partyAdditionalInfo[k].value == "GOLIaT") {
                                                object.instructions[t].patientinfo.tags = "GOLIaT";
                                            }

                                        }
                                    }
                                }
                                catch (e) {
                                    console.error(e);
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


////Gets the instructions that are considered "done" and are sent to underlag. 
////If theres a need to use this function, it needs to be updated close to above "GetInstructions" code.
//app.factory('DoneRemissFact', function ($http) {

//    var myService = {
//        doneRemisser: function (aql) {
//            var searchData = [
//                { key: "firstNames", value: "*" },
//                { key: "lastNames", value: "*" }
//            ];
//            var object = new Object();
//            object.instructions = [];


//            var promise = $http({
//                url: baseUrl + "/query?" + $.param({ "aql": aql }),
//                method: "GET",
//                headers: {
//                    "Ehr-Session": getSessionId()
//                }
//            }).success(function (res) {

//                console.log('Res: ', res);

//                if (res == "") {
//                    console.log("Response was empty, there was no items to get from EHrscape")
//                }
//                else {
//                    for (var k = 0; k < res.resultSet.length; k++) {
//                        object.instructions.push(res.resultSet[k].Composition);
//                        object.instructions[k].patientinfo = {};
//                        object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
//                        object.instructions[k].patientinfo.personnummer = "";
//                        object.instructions[k].patientinfo.gender = "";

//                    }

//                    $.ajaxSetup({
//                        headers: {
//                            "Ehr-Session": sessionId
//                        }
//                    });

//                    var insertParties = $.ajax({
//                        async: false,
//                        url: baseUrl + "/demographics/party/query",
//                        type: 'POST',
//                        contentType: 'application/json',
//                        data: JSON.stringify(searchData),
//                        //Returnerar alla parties, dvs alla patienter.
//                        success: function (res) {
//                            //Kollar igenom alla patienter i listan.
//                            for (var i = 0; i < res.parties.length; i++) {
//                                //Kollar igenom alla instructions i listan.
//                                for (var t = 0; t < Object.size(object.instructions) ; t++) {

//                                    try {

//                                        if (res.parties[i].partyAdditionalInfo["0"].value === object.instructions[t].patientinfo.EHRID) {
                                            
//                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
//                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
//                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["1"].value;
//                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
//                                        }

//                                        else if (res.parties[i].partyAdditionalInfo["1"].value === object.instructions[t].patientinfo.EHRID) {

//                                            object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
//                                            object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
//                                            object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["0"].value;
//                                            object.instructions[t].patientinfo.gender = res.parties[i].gender;
//                                        }
//                                    }
//                                    catch (e) {
//                                    }
//                                }
//                            }
//                        }
//                    });

//                }

//            }).error(function (error) {
//                console.log(error)

//            });

//            return promise;
//        }

//    };

//    return myService;
//});




//app.controller('StartSidaBeslutCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

//    var aql = "select e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100";

//    data = GetInstructions.getInstruct(aql);
//    console.log('data', data);
//    $scope.instructions = data.instructions;

//}]);



////Insert value to current_state in the composition
function buildActionFromInstruction(instruction, code, actionString, uid) {
    return {
        "ctx/language": "sv",
        "ctx/territory": "se",
        "remiss/status_på_remiss_till_kirurgen/ism_transition/current_state|code": code,
        "remiss/status_på_remiss_till_kirurgen/ism_transition/current_state|value": actionString
    }
};

//Function to test growls.
function testGrowl() {

    try {
        alertify.logPosition("top right");
        alertify.success("Succeded with submission");
    } catch (err) {
        alertify.error("Failed with submission " + err);
    }

}

function delay(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve, t)
    });
}


//Function used to send compositions to EHRscape.
function SendComposition(actionString, code, uid, templateid, ehrId, text) {

    //Load/Get latest composition
    growlContent = text;

    var getCompPromise = new Promise(function (resolve, reject) {

        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId(),
            }
        });

        $.ajax({
            url: baseUrl + "/composition/" + uid + "?format=RAW",
            type: 'GET',
            contentType: 'application/json; charset=utf-8',
            success: function (res) {
                resolve(res);
            }, error: function (error) {
                reject(error);
            }
        });

    });
    getCompPromise.then(function (res, text) {

        //SEND COMPOSITION UPDATE
        console.log('Response', res)

        var tempres = res;
        templateId = tempres.templateId;

        templateId = templateId.replace(/\s/g, '+');

        console.log('old_state', tempres.composition.content[1].ism_transition.current_state.value);
        console.log('code_string_old', tempres.composition.content[1].ism_transition.current_state.defining_code.code_string);

        tempres.composition.content[1].ism_transition.current_state.value = actionString;
        tempres.composition.content[1].ism_transition.current_state.defining_code.code_string = code;

        console.log('newstate', tempres.composition.content[1].ism_transition.current_state.value);
        console.log('code_string_new', tempres.composition.content[1].ism_transition.current_state.defining_code.code_string);

        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId(),
            }
        });

        //Send update to composition.
        $.ajax({
            type: 'PUT',
            url: baseUrl + "/composition/" + uid + "?templateId=" + templateId + "&format=RAW", //
            data: JSON.stringify(tempres.composition),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                alertify.logPosition("top right");
                alertify.success(growlContent);

                //delay(1500).then(function () {
                //    window.location.reload();
                //})
            },
            error: function (error) {
                alertify.logPosition("top right");
                alertify.error("Skapande av beslutsunderlag misslyckades");
                console.log(error);
            }
        });

    });
};



function cleanseInformationbox() {
    console.log("outside");
    $('#informationbox').css('border', 'none');
    $('#informationbox').css('padding', '0px');
    $('#informationbox').css('background-color', '0px');
    $('#informationbox').css('height', '0%');
    $('#informationbox').css('width', '0%');
    $('#informationbox').html('')
};

//Incoming instructions are handled here.
app.controller('InkommandeRemissCtrl', ['$scope', '$filter', "GetInstructions", function ($scope, $filter, GetInstructions) {

    $scope.generatePromptBox = function (instruction, event) {
        console.log("instruction", instruction);
        console.log("event", event);

        if (event.currentTarget.innerText == "Acceptera remiss") {
            console.log("Acceptera");

            alertify.confirm("Vill du acceptera remissen?",
                function () {
                    console.log("ok");
                    alertify.logPosition("top right");
                    alertify.success("Accepterade remiss!");
                    console.log('instruction', instruction);
                    console.log('event', event);
                    $scope.UpdateState(instruction, event);
                    $scope.CreateUnderlag(instruction);

                    alertify.confirm("Vill du gå till vyn för Utredning och beslut?",
                        function () {
                            console.log("Gå till beslut");
                            window.location.href = '/Utredning';

                    }, function () {
                        console.log("Gå bak, ladda om sidan");
                        window.location.reload();
                    })

            }, function () {

                alertify.logPosition("top right");
                alertify.success("Avbröt prompt.");
                console.log("no");
            });
        }

        else if (event.currentTarget.innerText == "Avvisa remiss") {
            console.log("Avvisa");
            alertify.prompt('Ange orsak för avvisad remiss:', function () {
                console.log("ok");
                alertify.logPosition("top right");
                alertify.success("Avvisade remiss");
                //$scope.AvvisaRemiss(instruction);
                $scope.UpdateState(instruction, event);
                

            }, function () {

                alertify.logPosition("top right");
                alertify.success("Avbröt prompt.");
                console.log("no");
            });
        }

        else if (event.currentTarget.innerText == "Vidarebefordra remiss") {
            console.log("Vidarebefordra");
            alertify.prompt('Ange mottagare:', function () {
                console.log("ok");
                alertify.logPosition("top right");
                alertify.success("");
                //$scope.AvvisaRemiss(instruction);
                $scope.UpdateState(instruction, event);

            }, function () {

                alertify.logPosition("top right");
                alertify.success("Avbröt prompt.");
                console.log("no");
            });
        }
    }

    $scope.notSeenCheck = function (element) {
        console.log(element);
    };

    $scope.shownewRemisser = function(event) {
        console.log("böööö");
        console.log("event", event)
        //console.log("Ehrid", ehrid);
        //console.log("compid", compid);
        //console.log(remiss)

        $('#newinformationBox').css('border', 'none');
        $('#newinformationBox').css('padding', '0px');
        $('#newinformationBox').html('');

        $('#newinformationBox').append(
            '<div>' +
            '</div>'
            );

        $('#newinformationBox').css('position', 'absolute');
        
        $('#newinformationBox').css('top', (event.pageY - event.offsetY));
        //$('#newinformationBox').css('top', (event.clientY + 20));
        $('#newinformationBox').css('left', ((event.pageX - event.offsetX) - (event.view.innerWidth / 3)));
        $('#newinformationBox').css('height', '60%');
        $('#newinformationBox').css('width', ((event.view.innerWidth / 3)));
        $('#newinformationBox').css('padding', '10px');
        $('#newinformationBox').css('background-color', '#FFFFFF');
        $('#newinformationBox').css('-webkit-box-shadow', '0px 3px 6px 1px rgba(0,0,0,0.22)');
        $('#newinformationBox').css('-moz-box-shadow', '0px 3px 6px 1px rgba(0,0,0,0.22)');
        $('#newinformationBox').css('box-shadow', '0px 3px 6px 1px rgba(0,0,0,0.22)');
    };

    $scope.removeInfobox = function () {
        $("#newinformationBox").css('border', 'none');
        $("#newinformationBox").css('padding', '0px');
        $("#newinformationBox").css('background-color', '0px');
        $("#newinformationBox").css('height', '0%');
        $("#newinformationBox").css('width', '0%');
        $("#newinformationBox").html('')
    }

    $scope.showInformationbox = function (element, remiss, event, ehrid, compid) {


        if ($("#" + compid).is(":visible")) {
            $scope.cleanseInformationbox(compid);
            //event.currentTarget.style.backgroundColor = "#dce8f1";
            //event.currentTarget.style.color = "black";
        }
        else {
            $("#" + compid).show();
            console.log(event);
            //event.currentTarget.style.backgroundColor = "#b2cee2";
            //event.currentTarget.style.color = "black";
            
        }
        //var compositionid = compid.substring(0, 36);
        
        //console.log("Event",event)
        //console.log("Ehrid", ehrid);
        //console.log("compid", compid);
        //console.log(remiss)

        //$('#informationbox').css('border', 'none');
        //$('#informationbox').css('padding', '0px');
        //$('#informationbox').html('');

        //$('#informationbox').append(
        //    '<button class="btn" onclick="cleanseInformationbox()">X</button><div> <hr><h4>Remissinformation -</h4>' + remiss.patientinfo.firstname + ' ' + remiss.patientinfo.lastname + ', Personnummer: ' + remiss.patientinfo.personnummer + '</div> <hr>' +
        //    '<div>' +
        //        '<p>' + remiss.content["0"].activities["0"].description.items["0"].name.value +': <b>'+  remiss.content["0"].activities["0"].description.items["0"].value.value + '</b></p>' +
        //        '<p>' + remiss.content["0"].activities["0"].description.items["0"].name.value + ': ' + '</p>' +
        //        '<p>' + remiss.content["0"].activities["0"].description.items["0"].name.value + ': ' + '</p>' +
        //    '</div>'
        //    );

        //$('#informationbox').css('position', 'absolute');
        //$('#informationbox').css('top', (event.clientY + 20));
        //$('#informationbox').css('left', ((event.view.innerWidth) - (event.view.innerWidth/1.5)));
        //$('#informationbox').css('height', '60%');
        //$('#informationbox').css('width', ((event.view.innerWidth / 2)));
        //$('#informationbox').css('padding', '10px');
        //$('#informationbox').css('background-color', '#dce8f1');

    };

    $scope.cleanseInformationbox = function (compid) {
        $("#" + compid).hide();

        //$("#" + compid).css('border', 'none');
        //$("#" + compid).css('padding', '0px');
        //$("#" + compid).css('background-color', '0px');
        //$("#" + compid).css('height', '0%');
        //$("#" + compid).css('width', '0%');
        //$("#" + compid).html('')


        //$('#informationbox').css('border', 'none');
        //$('#informationbox').css('padding', '0px');
        //$('#informationbox').css('background-color', '0px');
        //$('#informationbox').css('height', '0%');
        //$('#informationbox').css('width', '0%');
        //$('#informationbox').html('')
        //$('#personalbox').css('border', 'none');
        //$('#personalbox').css('padding', '0px');
        //$('#personalbox').html('')
    };


    var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state" +
        ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION." +
        "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-" +
        "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";

    //// Use this in case there's a need for showing the "done"-list.

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
        }
        else {
            console.log("No added instructions, response was empty...")
        }

        console.log('instructions', temparray);
        $scope.instructions = temparray;

    });


    $scope.UpdateState = function (instruction, event) {
        if (event.currentTarget.innerText) {
            if (event.currentTarget.innerText == "Avvisa remiss") {
                console.log("Avvisa remiss")
                SendComposition("cancelled", "528", instruction.uid.value, instruction.archetype_details.template_id.value, instruction.patientinfo.EHRID, "Remissen avvisades, remittent notifierades");
            }
            else if (event.currentTarget.innerText == "Acceptera remiss") {
                console.log("Acceptera remiss")
                SendComposition("active", "245", instruction.uid.value, instruction.archetype_details.template_id.value, instruction.patientinfo.EHRID, "Beslutsunderlag har skapats");

            }
            else if (event.currentTarget.innerText == "Vidarebefordra remiss") {
                console.log("Vidarebefodra remiss")
                SendComposition("cancelled", "528", instruction.uid.value, instruction.archetype_details.template_id.value, instruction.patientinfo.EHRID, "Remissen vidarebefodrades, remittent och ny enhet notifierades");
            }
            else {
                console.log("Did nothing with composition state...")
            }
        }
    }

    
    $scope.AvvisaRemiss = function (instruction) {
        console.log('AvvisaRemiss, Instruction', instruction);
    };

    $scope.CreateUnderlag = function (instruction) {
        console.log("instruction", instruction);
        console.log("SVF: ", instruction.content[0].activities[0].description.items[1].value.value)
        var currentdate = new Date();
        currentdate = $filter('date')(currentdate, "y-MM-dd, HH:mm");
        var json = '{"ehrid":"' + instruction.patientinfo.EHRID + '","current_state":"active",' +
        '"firstname":"' + instruction.patientinfo.firstname + '","lastname":"' + instruction.patientinfo.lastname + '","gender":"' + instruction.patientinfo.gender + '"' +
        ',"personnummer":"' + instruction.patientinfo.personnummer + '","SVF":"' + instruction.content[0].activities[0].description.items[1].value.value + '","diagnoskod":"' + 
        instruction.content["0"].activities["0"].description.items[2].value.value + '", "time_created":"' + currentdate + '"' +
        ',"start_date_countdown":"","utredning_id":"' + instruction.content["0"].uid.value + '","filled_form_status":"","instruction_id" : "' + instruction.uid.value + '"' +
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

////Controller to handle the "done" instructions.
//app.controller('DoneRemissCtrl', ['$scope', '$filter', 'DoneRemissFact', function ($scope, $filter, DoneRemissFact) {


//    var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state" +
//        ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION." +
//        "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-" +
//        "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";


//    DoneRemissFact.doneRemisser(aql).then(function (data) {
//        var instructions = data.data.resultSet;
//        console.log('instructions', instructions)
//        var instructionObject = {};
//        var objectArray = [];


//        if (instructions) {
//            instructions.forEach(function (item) {
//                if (item) {
//                    if (item.Composition.content[1].ism_transition.current_state.value == 'active') {

//                        var date_to_filter = item.Composition.content[1].time.value;
//                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

//                        item.time = data_filtered;

//                        objectArray.push(item);

//                    }
//                }

//            });
//        }
//        else {
//            console.warn("No added instructions, response was empty...")
//        }

//        console.log('objectArray', objectArray);
//        $scope.doneRemisser = objectArray;
//    });


//}]);