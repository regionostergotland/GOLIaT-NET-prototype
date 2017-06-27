
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

//function getPatientEHR(string) {
//    var str = string.substring(string.indexOf('patientehr=') + 11, string.indexOf('patientehr=') + 13 + 34);
   
//    return str;
//}

//function AddiFrame() {
//    getHref().then
//    getPatientEHR(getHref());
//    document.getElementById('add-iframe-div').innerHTML = '<ol><li>html data</li></ol>';
//}

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

//app.factory('GetPatients', function ($http) {
//    //Initial call from API.
//    var searchData = [
//          { key: "firstNames", value: "*" },
//          { key: "lastNames", value: "*" }
//    ];

//    var config = {
//        headers: {
//            "Ehr-Session": getSessionId()
//        }
//    }

//    var _getPatients = function () {

//    }
//    return {
//        getPatients: _getPatients
//    }
//});

app.factory('GetInstructions', function ($http) {

    //var InstructionsQuery = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100"
    //var ActionsQuery = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a contains ACTION a_b offset 0 limit 100"

    var searchData = [
        { key: "firstNames", value: "*" },  
        { key: "lastNames", value: "*" }
    ];

    sessionId = getSessionId()
    
    var getInstructions = function (Query) {
        var object = new Object();
        object.instructions = [];

        $http({
            async :false,
            url: baseUrl + "/query?" + $.param({ "aql": Query }),
            method: "GET",
            headers: {
                "Ehr-Session": sessionId
            }
        }).error(function (data, status, header, config) {
            alert("Request failed: " + status);

        //Response (res) ger alla compositions/instructions som man hämtar från EHRscape och går igenom dessa i en for-loop och lägger in viktig data.
        }).success(function (res) {
            console.log(res.resultSet);
            for (var k = 0; k < res.resultSet.length; k++) {
                object.instructions.push(res.resultSet[k]["#1"]);//.content["0"]);
                object.instructions[k].patientinfo = {};
                object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;
                object.instructions[k].patientinfo.personnummer = "";

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
                    //console.log("Res: ", res.parties);
                    //Kollar igenom alla patienter i listan.
                    for (var i = 0; i < res.parties.length; i++) {
                        
                        //Kollar igenom alla instructions i listan.
                        for (var t = 0; t < Object.size(object.instructions) ; t++) {
                            try {
                                if (res.parties[i].partyAdditionalInfo["0"].value === object.instructions[t].patientinfo.EHRID) {
                                    object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                    object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                    object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["1"].value;
                                }

                                else if (res.parties[i].partyAdditionalInfo["1"].value === object.instructions[t].patientinfo.EHRID) {

                                    object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                    object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                    object.instructions[t].patientinfo.personnummer = res.parties[i].partyAdditionalInfo["0"].value;
                                }
                            }
                            catch(e) {
                                //console.log("Error: ", e);
                            }
                        }
                    }
                }
            });
        });
        return object;
    }
    
    return {
        getInstruct: getInstructions
    }
});


app.controller('StartSidaBeslutCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

    var aql = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100";

    data = GetInstructions.getInstruct(aql);
    console.log(data);
    $scope.instructions = data.instructions;
    
}]);

app.controller('EditActionCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

}]);

app.controller('StartSidaUtredningCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

    var aql = "select e/ehr_id/value as EHRID, a_a from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.request.v1] contains INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-lab_test.v1] offset 0 limit 100";

    data = GetInstructions.getInstruct(aql);
    $scope.instructions = data.instructions;

}]);

app.controller('NyUtredningCtrl', ['$scope', function ($scope) {
    $scope.count = 0;
    $scope.myFunc = function () {
        $scope.count++;
    }

    $scope.GetPatients = function () {
    }

}]);

app.controller('StartSidaPlaneringCtrl', function ($scope, $http) {


    $scope.getData = function () {
    }
    $scope.getData();

});