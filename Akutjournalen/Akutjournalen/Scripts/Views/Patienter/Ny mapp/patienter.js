

var baseUrl = 'https://rest.ehrscape.com/rest/v1';
//var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'

function getSessionId() {

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}


function GetPatientByEHR(ehrId) {

    $.ajaxSetup({
        headers: {
            "Ehr-Session": getSessionId()
        }
    });


    $.ajax({
        url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
        type: 'GET',
        headers: {
            "Authorization": getSessionId()
        },
        success: function (data) {
            var party = data.party;
            return party;
        }
    });
}

var app = angular.module("myApp2", []);

app.controller('patientViewCtrl', function ($scope, $http) {

    //Initial call from API.
    var searchData = [
          { key: "firstNames", value: "H*" },
          { key: "lastNames", value: "*" }
    ];

    var config = {
        headers: {
            "Ehr-Session": getSessionId()
        }
    }

    $http.post(baseUrl + '/demographics/party/query', JSON.stringify(searchData), config)
        .success(function (res) {
            var saveElementArray = [];
            console.log(res);

            for (var i = 0; i < res.parties.length; i++) {
                if (res.parties[i].partyAdditionalInfo.length > 1) {

                    for (var k = 0; k < res.parties[i].partyAdditionalInfo.length; k++) {
                        if (res.parties[i].partyAdditionalInfo[k].key == "Personnummer") {
                            saveElementArray.push(res.parties[i].partyAdditionalInfo[k]);
                            res.parties[i].partyAdditionalInfo.splice(k, 1);
                            res.parties[i].partyAdditionalInfo.push(saveElementArray[0]);
                        }
                        else {

                        }
                    }
                }
            }

            $scope.parties = res.parties;
        }).error(function (error) {
            console.log(error);
        });
   
    //DELETE PATIENT
    $scope.DeletePatient = function (id) {
        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId()
            }
        });

        $.ajax({

            url: baseUrl + "/demographics/party/" + id,
            type: 'DELETE'
        }).success(function(res) {
            console.log(res);
        }).error(function (error) {
            console.log(error);
        });
    }
    //GET PATIENTS FROM FILTERING
    $scope.FilterPatientsByName = function (firstname, lastname) {
        $scope.parties = {};
        var searchData = [
          { key: "firstNames", value: firstname },
          { key: "lastNames", value: lastname }
        ];
        console.log(firstname +" "+ lastname)

        var config = {
            headers: {
                "Ehr-Session": getSessionId()
            }
        }

        $http.post(baseUrl + '/demographics/party/query', JSON.stringify(searchData), config)
            .success(function (res) {
                var saveElementArray = [];
                console.log(res);

                //Make sure that partyAdditionalInfo array starts with key: EHRID and not key: Personnummer.
                for (var i = 0; i < res.parties.length; i++) {
                    if (res.parties[i].partyAdditionalInfo.length > 1) {

                        for (var k = 0; k < res.parties[i].partyAdditionalInfo.length; k++) {
                            if (res.parties[i].partyAdditionalInfo[k].key == "Personnummer") {
                                saveElementArray.push(res.parties[i].partyAdditionalInfo[k]);
                                res.parties[i].partyAdditionalInfo.splice(k, 1);
                                res.parties[i].partyAdditionalInfo.push(saveElementArray[0]);
                            }
                            else {

                            }
                        }
                    }
                }
                $scope.parties = res.parties;
            }).error(function (error) {
                console.log(error);
            });

    }

});












//// $scope.ehrId = "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4"
// //ehrID
// var aql = "aql=" +
//     "select e/ehr_id/value as EHRid" +
//     " from EHR e offset 0 limit 10 ";
// //var aql = "select e"+
// //"from EHR e"+
// //"offset 0 limit 10"

// sessionId = getSessionId()

// $http({
//     url: baseUrl + "/query?" + aql ,
//     method: "GET",
//     headers: {
//         "Ehr-Session": sessionId
//     }
// }).error(function (data, status, header, config) {
//     alert("Request failed: " + status );

// })
//     .success(function (res) {
//         data = res.resultSet;
//         $scope.posts = data;
//     });
