var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'

var temparray = window.location.pathname.split('/SpecificUnderlag/', 2);
var getEHRandTime = temparray[1].split('-');
var time = getEHRandTime.splice(0, 1);

time = time[0];
var ehrid = getEHRandTime.join("-");


Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

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


var specifik = angular.module("specifik", ["formsApp"]);


specifik.controller('SpecifikUnderlagCtrl', ['$scope', '$filter', '$http', 'GetProverFact', function ($scope, $filter, $http, GetProverFact) {

    console.log(time)
    console.log(ehrid);

    GetProverFact.aqlprover().then(function (data) {
        console.log('Data1', data.data.resultSet);

        if (data.data.resultSet) {
            $scope.prover = data.data.resultSet[0].Composition.content;

            data.data.resultSet.forEach(function (element, index) {

                $scope.prover[index].time_info = {};
                var date_for_test = element.Composition.content[1].data.events[0].time.value;
                var date_for_testNew = $filter('date')(date_for_test, 'yyyy-MM-dd: HH:mm:ss');

                $scope.prover[index].time_info.date_for_test = date_for_testNew;
            });
        }


        //GetProverFact.bestallingprovAQL().then(function (data) {

        //    //console.log('Data2', data);

        //    if (data.data.resultSet) {

        //        var _actions = new Object();
        //        _actions.actions = [];

        //        data.data.resultSet.forEach(function (element, index) {
        //            $scope.prover[index].action_info = {};

        //            var date_for_order = element.Composition.content[1].time.value;
        //            var date_for_test = element.Composition.content[1].protocol.items[0].value.value;

        //            var date_for_orderNew = $filter('date')(date_for_order, 'yyyy-MM-dd: HH:mm:ss');
        //            var date_for_testNew = $filter('date')(date_for_test, 'yyyy-MM-dd: HH:mm:ss');

        //            $scope.prover[index].action_info.orderDate = date_for_orderNew;
        //            $scope.prover[index].action_info.testDate = date_for_testNew;

        //        });

        //        console.log($scope.prover)
        //    }
        //});
    });

}]);


specifik.factory('GetProverFact', ['$http', function ($http) {

    var aqlProver = "select a as Composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.report-result.v1]" +
    " where a/name/value='Provsvar prostatacancer' and (e/ehr_id/value='" + ehrid + "')" + "order by a/context/start_time/value desc offset 0 limit 100";

    var bestallingprovAQL = "select a as Composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.request.v1]" +
    "contains ACTION a_a[openEHR-EHR-ACTION.pathology_test.v1] where a/name/value='Beställning av labprover prostatacancer' and (e/ehr_id/value='" + ehrid + "')" +
    "order by a_a/time/value desc offset 0 limit 100";


    var myService = {
        aqlprover: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": aqlProver }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                    //console.log('Res1:', res);
                }
                catch (e) {

                }

            });
            return promise;
        },
        bestallingprovAQL: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": bestallingprovAQL }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                    //console.log('Res2:', res);
                }
                catch (e) {

                }
            });
            return promise;
        }


    };

    return myService;

}]);




specifik.factory('GetICDtenFact', ['$http', function ($http) {

}]);

specifik.factory('GetObservationresultsFact', ['$scope', function ($scope) {

    var aqlProver = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.encounter.v1] "
    + "where a/name/value='Besök' order by a/context/start_time/value desc offset 0 limit 100";

    var myService = {
        promise: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": aqlProver }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {

            });
            return promise;
        }

    };

    return myService;

}]);

specifik.factory('GetPatientConsentFact', ['$http', function ($http) {

}]);