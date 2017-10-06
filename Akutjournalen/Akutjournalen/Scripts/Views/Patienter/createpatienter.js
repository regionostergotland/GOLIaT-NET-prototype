

var baseUrl = 'https://rest.ehrscape.com/rest/v1';
//var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = getUsername();
var password = getPassword();

function getSessionId() {

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}

var app = angular.module("myApp3", []);

app.controller('PatientFormController', function ($scope, $http) {


    $scope.CreatePatient = function (patient) {
        $.ajaxSetup({
            headers: {
                "Ehr-Session": getSessionId()
            }
        });

        $.ajax({

            url: baseUrl + "/ehr",
            type: 'POST',

            success: function (data) {
                var ehrId = data.ehrId;

                // build party data
                var partyData = {
                    firstNames: patient.firstname,
                    lastNames: patient.lastname,
                    gender: patient.gender,
                    dateOfBirth: patient.dateofbirth,
                    partyAdditionalInfo: [
					    {
					        key: "ehrId",
					        value: ehrId
					    },
                        {
                            key: "Personnummer",
                            value: patient.persnummer
                        }
                    ]
                };

                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),

                }).success(function (res) {
                    console.log("Successfully created patient");
                    console.log(res);
                }).error(function (error) {
                    console.log("Failed creating patient");
                    console.log(error);
                });
            }
        });
    }

});
