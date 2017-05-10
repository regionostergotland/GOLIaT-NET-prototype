

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

function showDoc() {
    akutDoc = akutDoc;
}

function setJournalMetadata(dataObj) {
    console.log("AkutJournalen : " + dataObj.data.formfields.diastolic.value);
}
var app = angular.module("myApp", []);

app.controller('myCtrl', function ($scope, $http) {


    $scope.getData = function () {
        //ehrID
        //$scope.ehrId = "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4"
        

       // var aql = "select bp/data[at0001|history|]/events[at0006|any event|]/Time as Time, " +
       //"bp/data[at0001|history|]/events[at0006|any event|]/data[at0003]/items[at0004|Systolic|]/value as Systolic, " +
       //"bp/data[at0001|history|]/events[at0006|any event|]/data[at0003]/items[at0005|Diastolic|]/value as Diastolic, " +
       //"c_a/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value as Pulse_Rate " +

       //" from EHR e " +
       //"contains COMPOSITION c " +
       //"contains (OBSERVATION bp[openEHR-EHR-OBSERVATION.blood_pressure.v1] or OBSERVATION c_a[openEHR-EHR-OBSERVATION.pulse.v1])" +
       //"    where " +
       //"    c/archetype_details/template_id/value = 'triage' AND " +
       //" e/ehr_id/value = '" + $scope.ehrId + "'" +
       //" ORDER BY bp/data[at0001|history|]/events[at0006|any event|]/Time DESC" +
       // " offset 0 limit 4"

       // sessionId = getSessionId()

       // $http({
       //     url: baseUrl + "/query?" + $.param({ "aql": aql }),
       //     method: "GET",
       //     headers: {
       //         "Ehr-Session": sessionId
       //     }
       // }).error(function (data, status, header, config) {
       //     alert("HI");

       // })
       //     .success(function (res) {
       //         data = res.resultSet;
       //         $scope.posts = data;
       //     });

    }

    $scope.getData();

});
