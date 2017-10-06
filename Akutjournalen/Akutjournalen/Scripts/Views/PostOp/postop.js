var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = getUsername();
var password = getPassword();

(function () {
    var growlContent = "";
});

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function translateGender(engGender) {

    if (engGender) {
        var sweGender;
        if (engGender == 'male') {
            sweGender = 'Man'
        }
        else if (engGender == 'female') {
            sweGender = 'Kvinna'
        }
        else {
            sweGender = '';
        }
        return sweGender;
    }
    else {
        return '-';
    }
}

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


function CurrentAge(EHRdateofBirth) {
    if (EHRdateofBirth != "" || EHRdateofBirth != null) {
        EHRdateofBirth = parseInt(EHRdateofBirth);
        var today = new Date();
        var currentYear = today.getFullYear()
        var age = currentYear - EHRdateofBirth;

        return age;
    }
    else {
        return "";
    }
}

function translateGender(engGender) {

    if (engGender) {
        var sweGender;
        if (engGender == 'male') {
            sweGender = 'Man'
        }
        else if (engGender == 'female') {
            sweGender = 'Kvinna'
        }
        else {
            sweGender = '';
        }
        return sweGender;
    }
    else {
        return '-';
    }
}


var app = angular.module("myApp", ["datatables"]);

app.factory('GetInstructions', function ($http) {

});

app.controller('PostOperationsCtrl', ['$scope', '$filter', function ($scope, $filter) {
    $scope.operationer = {};

    $scope.showPersonalbox = function (event, personnel, id) {
        var personalArray = personnel.split(",")
        for (var i = 0; i < personalArray.length; i++) {
            $('#personalbox').append('<p>' + personalArray[i] + '</p>');
        }
        $('#personalbox').css('position', 'absolute');
        $('#personalbox').css('top', (event.clientY + 20));
        $('#personalbox').css('left', (event.clientX + 20));
        $('#personalbox').css('border', '1px solid #000000');
        $('#personalbox').css('padding', '10px');
        $('#personalbox').css('background-color', '#FFFFFF');


    };
    $scope.cleansePersonalbox = function () {
        $('#personalbox').css('border', 'none');
        $('#personalbox').css('padding', '0px');
        $('#personalbox').html('');
    };

    $.ajax({
        async: false,
        type: 'POST',
        url: 'PostOp/GetPostOp',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: function (response) {
            console.log(response);
            var postop = response;
            if (typeof response == 'string') {
                var operationer = JSON.parse(postop);
            }
            console.log("postop", postop);
            $scope.operationer = postop.patients;

        },

        error: function (error) {
            console.log(error);
        }
    });
}]);


function testGrowl() {
    try {
        //throw Error('Typeerror')
        alertify.logPosition("top right");
        alertify.success("Succeded with that submission");
    } catch (err) {
        alertify.error("Failed with that submission " + err);
    }

}

function delay(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve, t)
    });
}
