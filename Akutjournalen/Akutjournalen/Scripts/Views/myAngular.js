

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

//var string = "http://localhost:20216/Forms/editAction?patientehr=b51f3709-eeb6-49ed-afae-ef1468ec03fb&instructionid=3e7fc4e1-0ac0-455c-8098-bc851ac144ad&activityid=";


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

app.factory('getForm', function ($http) {

});

app.factory('GetInstructions', function ($http) {

    var InstructionsQuery = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100"

    var searchData = [
        { key: "firstNames", value: "*" },
        { key: "lastNames", value: "*" }
    ];

    sessionId = getSessionId()
    

    var getInstructions = function () {
        var object = new Object();
        object.instructions = [];

        $http({
            async :false,
            url: baseUrl + "/query?" + $.param({ "aql": InstructionsQuery }),
            method: "GET",
            headers: {
                "Ehr-Session": sessionId
            }
        }).error(function (data, status, header, config) {
            alert("Request failed: " + status);
            //returnerar party insertion
        }).success(function (res) {
            for (var k = 0; k < res.resultSet.length; k++) {

                object.instructions.push(res.resultSet[k]["#1"].content["0"]);
                object.instructions[k].patientinfo = {};
                object.instructions[k].patientinfo.EHRID = res.resultSet[k].EHRID;

            }

             $.ajaxSetup({
                headers: {
                    "Ehr-Session": sessionId
                }
            });

            var insertParties =$.ajax({
                async: false,
                url: baseUrl + "/demographics/party/query",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(searchData),
                //Returnerar object
                success: function (res) {
                    for (var i = 0; i < res.parties.length; i++) {
                        for (var t = 0; t < Object.size(object.instructions) ; t++) {

                            try {
                                if (res.parties[i].partyAdditionalInfo["0"].value == object.instructions[t].patientinfo.EHRID) {
                                    object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                    object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                    //object.instructions[t].patientinfo.personnummer = parties.parties[i].partyAdditionalInfo["1"].value;
                                }

                                else if (res.parties[i].partyAdditionalInfo["1"].value == object.instructions[t].patientinfo.EHRID) {

                                    object.instructions[t].patientinfo.firstname = res.parties[i].firstNames;
                                    object.instructions[t].patientinfo.lastname = res.parties[i].lastNames;
                                    //object.instructions[t].patientinfo.personnummer = parties.parties[i].partyAdditionalInfo["0"].value;
                                }

                                else {
                                    console.log(res.parties[i].partyAdditionalInfo["1"].value);
                                }
                            }
                            catch(e) {

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

    //return {
    //    GetInstruct: func.GetInstruct,
    //    GetPatients: func.GetPatients
    //}

    //END OF FIRST//

});


app.controller('StartSidaBeslutCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {

    data = GetInstructions.getInstruct();
    console.log(data);
    $scope.instructions = data.instructions;
    
}]);

app.controller('EditActionCtrl', ['$scope', "GetInstructions", function ($scope, GetInstructions) {


}]);


app.controller('StartSidaUtredningCtrl', function ($scope, $http) {


    $scope.getData = function () {


    }

    $scope.getData();

});



app.controller('StartSidaPlaneringCtrl', function ($scope, $http) {


    $scope.getData = function () {

    }

    $scope.getData();

});