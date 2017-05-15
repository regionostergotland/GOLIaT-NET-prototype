

var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'


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

var app = angular.module("myApp", []);

app.controller('StartSidaUtredningCtrl', function ($scope, $http) {


    $scope.getData = function () {


    }

    $scope.getData();

});

app.controller('StartSidaBeslutCtrl', function ($scope, $http) {

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


});

app.controller('StartSidaPlaneringCtrl', function ($scope, $http) {


    $scope.getData = function () {

    }

    $scope.getData();

});