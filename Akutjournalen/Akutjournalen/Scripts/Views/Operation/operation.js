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

//Must have id to do gets/posts or updates from/to EHRscape.
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

//Get currentage based on EHR's "date of birth"- key.
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

//Translates the gender from english to swedish if binary genders are used.
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


function toogleView() {
    if ($('#overviewopimg').is(":visible")) {
        $('#overviewopimg').hide();
        $('#overviewoplist').show();
    }
    else if ($('#overviewoplist').is(":visible")) {
        $('#overviewoplist').hide();
        $('#overviewopimg').show();
    }
    else {
        $('#overviewopimg').hide();
        $('#overviewoplist').show();
    }

    
};

var app = angular.module("myApp", ["datatables"]);

//Get all operation items and add to scope.
app.controller('OperationsCtrl', ['$scope', '$filter', function ($scope, $filter) {
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
        url: 'Operation/GetOperationer',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: function (response) {
            console.log(response);
            var operationer = response;
            if (typeof response == 'string') {
                var operationer = JSON.parse(operationer);
            }
            console.log("Operationer", operationer);
            $scope.operationer = operationer.patients;

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
