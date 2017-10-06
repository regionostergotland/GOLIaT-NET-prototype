
var timeData = []
var systolicData = []
var diastolicData = []

var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var username = getUsername();
var password = getPassword();

var myLineChart;
var sitePersonel = {};
var employees = []


$(document).ready(function () {    
    sitePersonel.employees = employees;    
    var sessionId = getSessionId()
    
    SetPatientTopLabel(ehrID, sessionId)
    
});

function SetEhrID(EHRID)
{    
    //window.location.href = window.location.href + "?EHRID=" + EHRID + "";
    var pathArray = window.location.pathname.split('?');
    pageToNavigate = pathArray[pathArray.length - 1].toLowerCase() + "?EHRID=" + EHRID + "";
    window.location = pageToNavigate;
}

function AddUsersToStruct(firstName, lastName, ehrId)
{  
    var employee = {
        "firstName": firstName,
        "lastName": lastName,
        "ehrId": ehrId

    }
    sitePersonel.employees.push(employee);
}






