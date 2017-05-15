
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
};

function setJournalMetadata(dataObj) {
    console.log("AkutJournalen : " + dataObj.data.formfields.diastolic.value);
};

//your object
//var o = {
//    foo: "bar",
//    arr: [1, 2, 3],
//    subo: {
//        foo2: "bar2"
//    }
//};

//called with every property and its value
//function process(key, value) {

//    console.log(key + " : ");
//    console.log( value);
//}


//function traverseTree(o, func) {
//    //For every object in the object o (including children "o")
//    for (var i in o) {

//        //console logging
//        func.apply(this, [i, o[i]]);

//        //Kollar om ett objekt finns, om object är av typen object
//        if (o[i] !== null && typeof (o[i]) == "object" ) {
//            //om det stämmer
//            //Gå ner ett steg i trädet
//            traverseTree(o[i], func);
//        }
//    }
//}

//that's all... no magic, no bloated framework
//traverse(o, process);


//var app = angular.module("myApp", []);

//app.controller('BeslutCtrl', function ($scope, $http) {

//    //ehrID
//    //$scope.ehrId = "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4"




//    $scope.getData = function () {

//        var query = "select e/ehr_id/value, a from EHR e contains COMPOSITION a contains INSTRUCTION a_a offset 0 limit 100"

//        sessionId = getSessionId()

//        $http({
//            url: baseUrl + "/query?" + $.param({ "aql": query }),
//            method: "GET",
//            headers: {
//                "Ehr-Session": sessionId
//            }
//        }).error(function (data, status, header, config) {
//            alert("Request failed: " + status);

//        })
//            .success(function (res) {
//                console.log(res.resultSet);
//                $scope.instructions = res.resultSet;
//            });


//    }

//    $scope.getData();

//});
