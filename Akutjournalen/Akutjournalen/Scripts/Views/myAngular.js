

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

app.factory('getInstructions', function ($http) {

    var obj = [];
    var newQuery;
    var query = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100"
    //var query = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a#Prescription contains INSTRUCTION a_a offset 0 limit 100"

    sessionId = getSessionId()

    //First//
    var getInstructions = {
        myFunction: function () {
            var promise = $http({
                    url: baseUrl + "/query?" + $.param({ "aql": query }),
                    method: "GET",
                    headers: {
                        "Ehr-Session": sessionId
                    }
                }).error(function (data, status, header, config) {
                    alert("Request failed: " + status);

                }).success(function (res) {
                    console.log(res.resultSet);
                    return res.resultSet;
                });

            return promise;

            }
            
    }
    return getInstructions;

    //END OF FIRST//

});


//app.factory('GetPatientByEHR', function () {


//    sessionId = getSessionId()

//    $http({
//        url: baseUrl + "/query?" + "demographics/ehr/" + {ehrId} + "/party"),
//        method: "GET",
//        headers: {
//            "Ehr-Session": sessionId
//        }
//    }).error(function (data, status, header, config) {
//        alert("Request failed: " + status);

//    })
//        .success(function (res) {
//            console.log(res.resultSet);
//            //$scope.instructions = res.resultSet;
//            return res.resultSet;
//        });


//});


app.controller('StartSidaUtredningCtrl', function ($scope, $http) {


    $scope.getData = function () {


    }

    $scope.getData();

});

app.controller('StartSidaBeslutCtrl', function ($scope, getInstructions) {
    //var obj = [];

    var searchData = [
          { key: "firstNames", value: "H*" },
          { key: "lastNames", value: "*" }
    ];
    sessionId = getSessionId()

    var config = {
        headers: {
            "Ehr-Session": getSessionId()
        }
    }
    getInstructions.myFunction().then(function (data) {
        console.log(data.data.resultSet);
        $scope.instructions = data.data.resultSet;
    });

    $scope.instructions = getInstructions.myFunction;

    //$http({
    //    url: baseUrl + "/demographics/ehr/" + "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4" + "/party",
    //    method: "GET",
    //    headers: {
    //        "Ehr-Session": getSessionId()
    //    }
    //}).error(function (data, status, header, config) {
    //    alert("Request failed: " + status);

    //})
    //       .success(function (res) {
    //           console.log("LOL");
    //           console.log(res);
    //           obj.push(res)
    //           //$scope.instructions = res.resultSet;
    //           console.log(obj);
    //           return res.resultSet;
    //       });

    //$http.post(baseUrl + '/demographics/party/query', JSON.stringify(searchData), config)
    //    .success(function (res) {
    //        var saveElementArray = [];
    //        console.log(res);

    //        for (var i = 0; i < res.parties.length; i++) {
    //            if (res.parties[i].partyAdditionalInfo.length > 1) {

    //                for (var k = 0; k < res.parties[i].partyAdditionalInfo.length; k++) {
    //                    if (res.parties[i].partyAdditionalInfo[k].key == "Personnummer") {
    //                        saveElementArray.push(res.parties[i].partyAdditionalInfo[k]);
    //                        res.parties[i].partyAdditionalInfo.splice(k, 1);
    //                        res.parties[i].partyAdditionalInfo.push(saveElementArray[0]);
    //                    }
    //                    else {

    //                    }
    //                }
    //            }
    //        }

    //        $scope.parties = res.parties;
    //    }).error(function (error) {
    //        console.log(error);
    //    });


});

app.controller('StartSidaPlaneringCtrl', function ($scope, $http) {


    $scope.getData = function () {

    }

    $scope.getData();

});