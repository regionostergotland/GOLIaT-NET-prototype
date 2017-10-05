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

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

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

function CurrentAge(EHRdateofBirth) {
    if (EHRdateofBirth != "" || EHRdateofBirth != null) {
        EHRdateofBirth = parseInt(EHRdateofBirth);
        var today = new Date();
        var currentYear = today.getFullYear()
        var age = currentYear - EHRdateofBirth;

        console.log("Calculated age!", age)
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
            $scope.listItems = {};
            $scope.listItems.beslut = new Array();

            $scope.listItems.remisser = {};
            $scope.listItems.patienter = {};

            var beslutArray = [];

            if (instructions) {

                instructions.forEach(function (instruction) {
                    if (instruction) {
                        var date_to_filter = instruction.Composition.content[1].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        instruction.time = data_filtered;

                        beslutArray.push(instruction);
                        $scope.listItems.beslut.push(instruction);
                    }
                });

            }
            else {
                console.log("No added instructions, response was empty...")
            }
            resolve(beslutArray);
        });

        return promise;

    }).then(function (beslutArray) {

        
        var aql = "select a_b/ism_transition[at0002]/current_state/value as Service_planned_current_state" +
            ", e/ehr_id/value as EHRID, a as Composition from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION." +
            "request.v1] contains ( INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-procedure.v0] and ACTION a_b[openEHR-EHR-" +
            "ACTION.service.v0]) where a/name/value='Remiss' order by a_b/time/value desc offset 0 limit 100";

        GetInstructions.getInstruct(aql).then(function (remisser) {
            var promise = new Promise(function (resolve, reject) {
                $scope.listItems.remisser = remisser;
                console.log("remisser", remisser);
                resolve();
                
            }).then(function () {
                GetInstructions.getDemo(aql).then(function (demos) {
                    var promise = new Promise(function (resolve, reject) {
                        $scope.listItems.patienter = demos;
                        console.log("demos", demos)
                        resolve();
                    }).then(function () {
                        var promise = new Promise(function (resolve, reject) {

                            for (var i = 0; i < $scope.listItems.beslut.length; i++) {
                                console.log(i + " ");

                                for (var p = 0, len = $scope.listItems.patienter.parties.length; p < len; p++) {

                                    if ($scope.listItems.patienter.parties[p].partyAdditionalInfo[0].key == "ehrId") {
                                        if ($scope.listItems.patienter.parties[p].partyAdditionalInfo[0].value == $scope.listItems.beslut[i].EHRID) {

                                            $scope.listItems.beslut[i].patient = new Array();
                                            console.log("inLoop", $scope.listItems.beslut[i]);
                                            $scope.listItems.beslut[i].patient.push($scope.listItems.patienter.parties[p]);
                                        }
                                    }
                                    else {
                                        if ($scope.listItems.patienter.parties[p].partyAdditionalInfo[1].value == $scope.listItems.beslut[i].EHRID) {

                                            $scope.listItems.beslut[i].patient = new Array();
                                            console.log("inLoop", $scope.listItems.beslut[i]);
                                            $scope.listItems.beslut[i].patient.push($scope.listItems.patienter.parties[p]);
                                        }
                                    }
                                    
                                }
                            }
                            if (i == $scope.listItems.beslut.length) {
                                resolve($scope.listItems.beslut);
                            }
                            

                        }).then(function (array) {
                            $scope.listItems.beslut = array;
                            console.log("$scope.listItems", $scope.listItems.beslut)
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
