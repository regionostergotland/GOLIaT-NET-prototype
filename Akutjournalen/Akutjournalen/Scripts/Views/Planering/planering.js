var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = getUsername();
var password = getPassword();

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

//Translates the gender from english to swedish if binary genders are used.
function translateGender(engGender) {
    engGender = engGender.toLowerCase();
    //console.log("Enggender= " + engGender);

    if (engGender != null || engGender != '') {

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

//Must have id to do gets/posts or updates from/to EHRscape.
function getSessionId() {

    //alert(baseUrl + "/session?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password))

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}

//Get currentage based on EHR's "date of birth"- key.
function CurrentAge(EHRdateofBirth){ 
    if (EHRdateofBirth != "" || EHRdateofBirth != null) {
        EHRdateofBirth = parseInt(EHRdateofBirth);
        var today = new Date();
        var currentYear = today.getFullYear()
        var age = currentYear - EHRdateofBirth;

        //console.log("Calculated age!", age)
        return age;
    }
    else {
        console.log("Calculated age... wait nevermind...")
        return "";
    }
}

var app = angular.module("myApp", ["datatables"]);

app.factory('GetInstructions', function ($http) {

    var myService = {
        getInstruct: function (Query) {

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

            }).success(function (res) {
                console.log('res', res);
            }).error(function (error) {
                console.log(error);
            });

            return promise;
        },
        getDemo: function (Query) {
            var searchData = [
              { key: "firstNames", value: "*" },
              { key: "lastNames", value: "*" }
            ];

            sessionId = getSessionId();

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
                    //var today = new Date();
                    ////Kollar igenom alla patienter i listan.
                    //for (var i = 0; i < res.parties.length; i++) {
                    //    //Kollar igenom alla instructions i listan.
                    //    for (var t = 0; t < Object.size(object.instructions) ; t++) {

                    //        try {

                    //        }
                    //        catch (e) {

                    //        }
                    //    }
                    //}
                }
            });
            return insertParties;
        }
    }

    return myService;
});



////Demographics template
//if (res == "") {
//    console.log("Response was empty, there was no items to get from EHrscape")
//}
//else {
//    for (var k = 0; k < res.resultSet.length; k++) {
//        object.instructions.push(res.resultSet[k].Composition);
//        object.instructions[k].patientinfo = {};
//        object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
//        object.instructions[k].patientinfo.personnummer = "";
//        object.instructions[k].patientinfo.gender = "";
//        object.instructions[k].patientinfo.age = "";
//    }

//    //console.log(object.instructions);

//    $.ajaxSetup({
//        headers: {
//            "Ehr-Session": sessionId
//        }
//    });

//    var insertParties = $.ajax({
//        async: false,
//        url: baseUrl + "/demographics/party/query",
//        type: 'POST',
//        contentType: 'application/json',
//        data: JSON.stringify(searchData),
//        //Returnerar alla parties, dvs alla patienter.
//        success: function (res) {
//            var today = new Date();
//            //Kollar igenom alla patienter i listan.
//            for (var i = 0; i < res.parties.length; i++) {
//                //Kollar igenom alla instructions i listan.
//                for (var t = 0; t < Object.size(object.instructions) ; t++) {

//                    try {

//                    }
//                    catch (e) {

//                    }
//                }
//            }
//        }
//    });
//}




function testGrowl() {

    try {
        //throw Error('Typeerror')
        alertify.logPosition("top right");
        alertify.success("Succeded with that submission");
    } catch (err) {
        alertify.error("Failed with that submission " + err);
    }

}


app.controller('PlaneringController', ['$scope', '$filter', "GetInstructions", function ($scope, $filter, GetInstructions) {

    $scope.pickUnderlag = function (path, role, EHRID, main_objective) {
        console.log(path + '?' + EHRID);
        if (role == "Kirurg") {
            window.location = path + '?' + 'EHRID=' + EHRID + '&' + 'MAINOBJ='+ main_objective;
        }
        else {

        }
    }

    var aql = "select e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.request.v1]"+
        "where a/name/value='Beslut om kirurgisk åtgärd' order by a/context/start_time desc offset 0 limit 100";

    GetInstructions.getInstruct(aql).then(function (data) {
        var promise = new Promise(function (resolve, reject) {
            var instructions = data.data.resultSet;
            var listItems = {};
            listItems.beslut = new Array();

            listItems.remisser = {};
            listItems.patienter = {};

            var beslutArray = [];

            if (instructions) {

                instructions.forEach(function (instruction) {
                    if (instruction) {
                        var date_to_filter = instruction.Composition.content[1].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        instruction.time = data_filtered;

                        beslutArray.push(instruction);
                        listItems.beslut.push(instruction);
                    }
                });

            }
            else {
                console.log("No added instructions, response was empty...")
            }
            resolve(listItems);
        });

        return promise;

    }).then(function (listItems) {

        


        var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state" +
            ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION." +
            "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-" +
            "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";

        GetInstructions.getInstruct(aql).then(function (remisser) {
            var promise = new Promise(function (resolve, reject) {
                

                listItems.remisser = remisser;
                //$scope.listItems = listItems;
                resolve(listItems);
                
            }).then(function (listItems) {

                GetInstructions.getDemo(aql).then(function (demos) {

                    var promise = new Promise(function (resolve, reject) {

                        listItems.patienter = demos;
                        resolve(listItems);
                    }).then(function (listItems) {
                        var promise = new Promise(function (resolve, reject) {

                            var object = new Object();
                            object.instructions = [];

                            for (var k = 0; k < listItems.beslut.length; k++) {
                                object.instructions.push(listItems.beslut[k].Composition);
                                object.instructions[k].patientinfo = {};
                                object.instructions[k].patientinfo.EHRID = listItems.beslut[k].EHRID;
                                object.instructions[k].patientinfo.personnummer = "";
                                object.instructions[k].patientinfo.IsGoliatRelated = "false";
                                object.instructions[k].patientinfo.gender = "";
                                object.instructions[k].patientinfo.age = "";

                            }
                            console.log("listitem beslut", listItems.beslut);
                            console.log("listitem parties", listItems.patienter.parties);
                            console.log("listitem remisser", listItems.remisser);

                            var today = new Date();
                            var rege = /[0-9]+-[0-9]/;
                            //Kollar igenom alla patienter i listan.

                            for (var i = 0; i < object.instructions.length; i++) {
                                //För varje beslut...

                                try {
                                    for (var p = 0; p < listItems.patienter.parties.length; p++) {
                                        //För varje patient...

                                        for (var k = 0; k < listItems.patienter.parties[p].partyAdditionalInfo.length; k++) {
                                            //För varje element i partyadditionalinfo...

                                            if (listItems.patienter.parties[p].partyAdditionalInfo[k].key == "ehrId" && 
                                                listItems.patienter.parties[p].partyAdditionalInfo[k].value == object.instructions[i].patientinfo.EHRID) {
                                                //Om det är EHRID och det matchar.

                                                console.log("EhrId matched");
                                                object.instructions[i].patientinfo.firstname = listItems.patienter.parties[p].firstNames;
                                                object.instructions[i].patientinfo.lastname = listItems.patienter.parties[p].lastNames;
                                                if (listItems.patienter.parties[i].dateOfBirth != "" || listItems.patienter.parties[p].dateOfBirth != null) {
                                                    //console.log(res.parties[i].firstNames)
                                                    var age = (CurrentAge(listItems.patienter.parties[p].dateOfBirth));
                                                    object.instructions[i].patientinfo.age = age;
                                                }
                                                object.instructions[i].patientinfo.gender = translateGender(listItems.patienter.parties[p].gender.toLowerCase());


                                            }
                                            else if (listItems.patienter.parties[p].partyAdditionalInfo[k].key == "Personnummer") {

                                                //Om det är personnummer och patienten matchar EHRID
                                                for (var x = 0; x < listItems.patienter.parties[p].partyAdditionalInfo.length; x++) {
                                                    if (listItems.patienter.parties[p].partyAdditionalInfo[x].key == "ehrId") {
                                                        if (listItems.patienter.parties[p].partyAdditionalInfo[x].value == object.instructions[i].patientinfo.EHRID) {

                                                            console.log(listItems.patienter.parties[p].partyAdditionalInfo[k].value, object.instructions[i].patientinfo.personnummer);
                                                            object.instructions[i].patientinfo.personnummer = listItems.patienter.parties[p].partyAdditionalInfo[k].value;
                                                        }
                                                    }

                                                }
                                            }

                                            else if (listItems.patienter.parties[p].partyAdditionalInfo[k].key == "tags" &&
                                                listItems.patienter.parties[p].partyAdditionalInfo[k].value == "GOLIaT") {
                                                //Om det är GOLIAT.
                                                object.instructions[i].patientinfo.tags = "GOLIaT";
                                            }

                                        }
                                    }
                                    
                                }
                                catch (e) {
                                    console.log(e);
                                }

                                console.log(listItems.beslut[i]);
                            }


                            for (var i = 0; i < listItems.beslut.length; i++) {
                                object.instructions[i].patientinfo.status = {};
                                object.instructions[i].patientinfo.status = "Ej påbörjad";
                            }
                            resolve(object)

                        }).then(function (object) {
                            $scope.listItems = object.instructions;
                            $scope.$apply();
                            
                            console.log("listItems", listItems)
                        });
                    })
                })
            })

            //return promise;

        });

        //}).then(function (data) {
        //    GetInstructions.getDemo(aql).then(function (data) {
        //        var promise = new Promise(function (resolve, reject) {
        //            $scope.listItems.patienter = data;

        //            resolve(data);
        //        });
        //        return promise;
        //    }).then(function (data) {
        //        var promise = new Promise(function (resolve, reject) {
        //            var tempPartyArray = [];
        //            var tempBeslutArray = $scope.listItems.beslut;

        //            for (var i = 0; i < tempBeslutArray.length; i++) {
        //                console.log(i + " ");

        //                for (var p = 0, len = $scope.listItems.patienter.parties.length; p < len; p++) {
        //                    if ($scope.listItems.patienter.parties[p].partyAdditionalInfo[0].value == tempBeslutArray[i].EHRID) {

        //                        tempBeslutArray[i].patient = [];
        //                        console.log("inLoop", tempBeslutArray[i]);
        //                        //tempPartyArray.push($scope.listItems.patienter.parties[p]);
        //                        tempBeslutArray[i].patient.push($scope.listItems.patienter.parties[p]);
        //                    }
        //                }
        //            }
                    
        //            resolve(tempBeslutArray);
        //        });

        //        return promise;
        //    }).catch(function (err) {
        //        console.log(err);
        //    }).then(function (beslut) {

        //        console.log("test",beslut);

        //        // $scope.listItems.beslut.patient = tempPartyArray;
        //        //console.log("tempPartyArray", tempPartyArray)
        //        //console.log("  $scope.listItems", $scope.listItems.beslut);
        //    });
        //});
    })





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
