var baseUrl = 'https://rest.ehrscape.com/rest/v1';
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

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}


$(document).ready(function () {
    $('#add-more-operations').hide();
    $('#fastingcontent').hide();

    $('input[type="checkbox"]').click(function () {

        if ($('#fastingcheck').checked(true)) {

            $('#fastingcontent').hide();
        }

        else {

            $('#fastingcontent').show();

        }
    });
    $('input[type="radio"]').click(function () {
        if ($(this).attr('id') == 'planning-yes-radio') {
            $('#add-more-operations').show();
        }
        else {
            $('#add-more-operations').hide();
        }
    });
    
    
});


function showGant() {
    $('#gant-schema-tidsbokning').show();
};


function tooglePanel(clickedpanelId, clickedbutton) {
    if ($('#' + clickedpanelId).is(":visible")) {
        $('#' + clickedpanelId).hide();
        $(clickedbutton).text("Visa");

    }
    else {
        $('#' + clickedpanelId).show();
        $(clickedbutton).text("Dölj");
    } 
    
};


var openWindow = function (prefix, path1, path2) {
    console.log("prefix:" + prefix);

    //getParameterByName("EHRID")
    window.open(prefix + '://' + path1 + getParameterByName("EHRID") + path2, "popupWindow", "scrollbars=yes,resizable=yes, width=900,height=800");
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

function setPatientTitle(name, age, gendericon,mainObj) {
    $('.main-objective-span').text(mainObj)
    $('.title-gender').attr("class", gendericon);
    $('.title-name').text(name + ", ");
    $('.title-age').text(age + " år");
    $('.uppsignal').attr("src", "../Content/Img/signal.01245.png")
    
};

function CurrentAge(EHRdateofBirth) {
    if (EHRdateofBirth != "" || EHRdateofBirth != null) {
        var today = new Date();
        var currentYear = today.getFullYear()
        return currentYear - EHRdateofBirth;
    }
    else {
        return "";
    }
}

var planering = angular.module('specificPlaneringApp', []);


planering.controller('specificPlaneringCtrl', ['$scope', '$filter', 'GetDemographics', function ($scope, $filter, GetDemographics) {

    $scope.openWindow = function (path) {
        console.log("Path", path);
        window.open('https://' + path);
    };


    GetDemographics.promise().then(function (data) {
        console.log("DATA", data)

        var fullName = "";
        fullName += data.data.party.firstNames;
        fullName += " "
        fullName += data.data.party.lastNames;
        var age = $filter('date')(data.data.party.dateOfBirth, "yyyy");
        console.log(age);
        if (data.data.party.gender) {
            if (data.data.party.gender == "MALE") {
                var gendericon = "fa fa-mars";
            }
            else {
                var gendericon = "fa fa-venus";
            }
        }

        setPatientTitle(fullName, CurrentAge(age), gendericon, getParameterByName('MAINOBJ'))

    });

}]);

planering.factory('GetDemographics', ['$http', function ($http) {

    var myService = {
        promise: function () {
            var promise = $http({
                url: baseUrl + "/demographics/ehr/" + getParameterByName("EHRID") + "/party?",
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                console.log("Party", res)
            });
            return promise;
        }

    };

    return myService;
}])
