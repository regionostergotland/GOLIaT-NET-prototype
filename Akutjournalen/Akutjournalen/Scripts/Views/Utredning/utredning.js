﻿var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = getUsername();
var password = getPassword();

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getSessionId() {

    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });

    return response.responseJSON.sessionId;
}


var underlag = angular.module("underlag", ['datatables', 'timer']);


underlag.controller('StartSidaUnderlagCtrl', ['$scope', '$location', function ($scope, $location) {

    $scope.pickUnderlag = function (path, formName, formVersion , ehrid, time, role, diagnos) {
        console.log(path);
        console.log(ehrid);
        console.log(time);
        if (role == "Kirurg") {
            window.location = path + "?id=" + time + "&EHRID=" + ehrid + "&formName=" + formName + "&formVersion=" + formVersion + "&diagnos=" + diagnos;
        }
        else {

        }
        
    }
    var promise = new Promise(function (resolve, reject) {
        resolve();
    });

    $scope.underlagen = {};

    $.ajax({
        async: false,
        type: 'POST',
        url: 'Inkommande/GetUnderlag',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: function (response) {
            var underlag = JSON.parse(response);
            console.log("Underlag", underlag);

            $scope.underlagen = underlag

            $scope.underlagen.forEach(function (underlag) {
                underlag.status = "Ej Påbörjad";
            });
            //$scope.underlagen = underlag;

            
        },
        error: function (error) {
            console.log(error);
        }
    });
}]);


