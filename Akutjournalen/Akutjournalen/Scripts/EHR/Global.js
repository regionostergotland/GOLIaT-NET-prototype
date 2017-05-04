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

function SetPatientTopLabel(ehrID, sessionId, color) {

    color = "green";


    if (ehrID == '28ac8bbc-eb14-4f01-a30d-bcff446e0bd4') {
        color = "green";
    }

    if (ehrID == 'b3b2aaad-8a79-4441-a499-8895a531da29') {
        color = "orange";
    }


    if (ehrID == '458ed141-14a9-45cc-a3ca-50dd5306ba97') {
        color = "red";
    }

    if (ehrID == 'b51f3709-eeb6-49ed-afae-ef1468ec03fb') {
        color = "yellow";
    }

    if (ehrID == 'ff320498-8254-4f35-9345-9bb7a2e59cf4') {
        color = "orange";
    }

    if (ehrID == '12990aaf-5c74-44d4-b406-407fd347033e') {
        color = "red";
    }
    
    
    if (ehrID == "")
    {
        SetPatientLabel("", "", "","")
    }
    else{
    $.ajaxSetup({
        headers: {
            "Ehr-Session": sessionId
        }
    });
    var searchData = [
        { key: "ehrId", value: ehrID }
    ];
    $.ajax({
        url: baseUrl + "/demographics/party/query",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(searchData),      
        success: function (res) {            
            for (i in res.parties) {
                var party = res.parties[i];
                var patientName = party.lastNames + ' ' + party.firstNames;
                var dateOfBirth = party.dateOfBirth;
                var gender = party.gender;                
                SetPatientLabel(patientName, dateOfBirth, gender, color)
            }
        }
    });
    }
}

function normalizeDate(el) {

    el = el + "";

    if (el.length == 1) {
        el = "0" + el;
    }

    return el;
}

function ShowDialog() {

    //alert('123')
    $("#varningModal").modal("show");
    
}

function getValues(type)
{
    if(type=='pulsrate')
    {
        max = 100;
        min = 900;
        $("#pulsrateIcon1").hide()
        $("#pulsrateIcon2").show()
        //window.setTimeout(getValueFromPulseDevice, Math.floor(Math.random() * (max - min + 1) + min));
    }
    
    if (type == 'bt') {
        max = 100;
        min = 800;
        $("#systolicIcon1").hide()
        $("#systolicIcon2").show()
        //window.setTimeout(getValueFromBTDevice, Math.floor(Math.random() * (max - min + 1) + min));
    }
}

function stopValues(type) {
    if (type == 'pulsrate') {
        max = 100;
        min = 900;
        $("#pulsrateIcon2").hide()
        $("#pulsrateIcon1").show()
        //window.setTimeout(getValueFromPulseDevice, Math.floor(Math.random() * (max - min + 1) + min));
    }

    if (type == 'bt') {
        max = 100;
        min = 800;
        $("#systolicIcon2").hide()
        $("#systolicIcon1").show()
        //window.setTimeout(getValueFromBTDevice, Math.floor(Math.random() * (max - min + 1) + min));
    }
}



function getValueFromPulseDevice() {

    max = 65;
    min = 90;
    $("#pulsrate").val(Math.floor(Math.random() * (max - min + 1) + min))
    $("#pulsrateIcon1").show()
    $("#pulsrateIcon2").hide()
}

function getValueFromBTDevice()
{
    maxD = 100;
    minD = 110;
    maxS = 85;
    minS = 100;

    $("#diastolic").val(Math.floor(Math.random() * (maxS - minS + 1) + minS))
    $("#systolic").val(Math.floor(Math.random() * (maxD - minD + 1) + minD))

    $("#systolicIcon1").show()
    $("#systolicIcon2").hide()
}


function SetPatientLabel(patientName,dateOfBirth, gender, color) {
    
    var logo;

    if (gender == "FEMALE")
    {
        logo = "fa fa-female";
    }
    else
    {
        logo = "fa fa-male";
    }

    
    patientAge = getAge(formatDateUS(dateOfBirth));

    if (ehrID != "") {
        Obj = $(".logoROTabDesc")
        Obj.html("<div><div class='foo " + color + "'></div><i class='" + logo + "'></i> " + patientAge + ", <b>" + patientName + "</b> <img onclick='ShowDialog()' style ='position: relative;top: -2px;' height='30px' src='Content/Img/signal.01245.png'></div>")

        Obj = $(".logoROPhone")
        Obj.html("<div><div class='foo " + color + "'></div><i class='" + logo + "'></i> " + patientAge + ", <b>" + patientName + "</b> <img onclick='ShowDialog()' style ='position: relative;top: -2px;' height='30px' src='Content/Img/signal.01245.png'></div>")

    }
    else {
        Obj = $(".logoROTabDesc")
        Obj.html("<b>Patient ej vald!</b>")
    }
}

function formatDateUS(date) {
    var d = new Date(date);

    var curr_date = d.getDate();
    curr_date = normalizeDate(curr_date);

    var curr_month = d.getMonth();
    curr_month++;
    curr_month = normalizeDate(curr_month);

    var curr_year = d.getFullYear();

    return curr_month + "-" + curr_date + "-" + curr_year;

}


function getAge(dateString) {
    var now = new Date();
    var today = new Date(now.getYear(), now.getMonth(), now.getDate());

    var yearNow = now.getYear();
    var monthNow = now.getMonth();
    var dateNow = now.getDate();

    var dob = new Date(dateString.substring(6, 10),
            dateString.substring(0, 2) - 1,
        dateString.substring(3, 5)
    );

    var yearDob = dob.getYear();
    var monthDob = dob.getMonth();
    var dateDob = dob.getDate();
    var age = {};
    var ageString = "";
    var yearString = "";
    var monthString = "";
    var dayString = "";


    var yearAge = yearNow - yearDob;

    if (monthNow >= monthDob)
        var monthAge = monthNow - monthDob;
    else {
        yearAge--;
        var monthAge = 12 + monthNow - monthDob;
    }

    if (dateNow >= dateDob)
        var dateAge = dateNow - dateDob;
    else {
        monthAge--;
        var dateAge = 31 + dateNow - dateDob;

        if (monthAge < 0) {
            monthAge = 11;
            yearAge--;
        }
    }

    age = {
        years: yearAge,
        months: monthAge,
        days: dateAge
    };

    if (age.years > 1) yearString = " år";
    else yearString = "y";
    if (age.months > 1) monthString = "m";
    else monthString = "m";
    if (age.days > 1) dayString = " days";
    else dayString = " day";


    ageString = age.years + " år";

    //if ((age.years > 0) && (age.months > 0) && (age.days > 0))
    //    ageString = age.years + yearString + " " + age.months + monthString;// + ", and " + age.days + dayString + " old";
    //else if ((age.years == 0) && (age.months == 0) && (age.days > 0))
    //    ageString = age.days + dayString + " old";
    //else if ((age.years > 0) && (age.months == 0) && (age.days == 0))
    //    ageString = age.years + yearString;// + " old. Happy Birthday!";
    //else if ((age.years > 0) && (age.months > 0) && (age.days == 0))
    //    ageString = age.years + yearString + " and " + age.months + monthString;// + " old";
    //else if ((age.years == 0) && (age.months > 0) && (age.days > 0))
    //    ageString = age.months + monthString; // + " and " + age.days + dayString + " old";
    //else if ((age.years > 0) && (age.months == 0) && (age.days > 0))
    //    ageString = age.years + yearString;// + " and " + age.days + dayString + " old";
    //else if ((age.years == 0) && (age.months > 0) && (age.days == 0))
    //    ageString = age.months + monthString;// + " old";
    //else ageString = "Oops! Could not calculate age!";

    return ageString;
}



function GetPatientByName(sessionId, firstNames, lastNames) {

    $.ajaxSetup({
        headers: {
            "Ehr-Session": sessionId
        }
    });
    var searchData = [
        { key: "firstNames", value: firstNames },
        { key: "lastNames", value: lastNames }
    ];
    $.ajax({
        url: baseUrl + "/demographics/party/query",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(searchData),
        success: function (res) {
            for (i in res.parties) {
                var party = res.parties[i];

                for (j in party.partyAdditionalInfo) {
                    if (party.partyAdditionalInfo[j].key === 'ehrId') {
                        ehrId = party.partyAdditionalInfo[j].value;
                        AddUsersToStruct(party.firstNames, party.lastNames, ehrId)
                        break;
                    }
                }
            }
        }
    });



}