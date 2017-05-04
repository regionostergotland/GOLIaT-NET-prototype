
var timeData = []
var systolicData = []
var diastolicData = []

var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'

var myLineChart;
var sessionId;
var chat;

$(document).ready(function () {     

    chat = $.connection.chatHub;
    sessionId = getSessionId()


    SetPatientTopLabel(ehrID, sessionId)
    QueryDataAndPaintGraf(sessionId, ehrID)

    chat.client.addNewMessageToPage = function (name, message) {
        
        if (name == ehrID) {            
            QueryDataAndPaintGraf(sessionId, ehrID)
        }
        
    };

    // Sätt här för att synka första gången!
    $.connection.hub.start().done(function () {
        chat.server.send("", "");
        
    });
    //$.connection.hub.start().done(function () {
      //  $('#sendmessage').click(function () {
           
       // });
    //});

});


function QueryDataAndPaintGraf(sessionId,ehrID) {
    
    GetAQLData(sessionId, ehrID)
}

function GetAQLData(sessionId, ehrId) {

    console.log("Start");

    $.ajaxSetup({
        headers: {
            "Ehr-Session": sessionId
        }
    });


    //aql = "select bp/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value as Systolic from EHR [ehr_id/value='28ac8bbc-eb14-4f01-a30d-bcff446e0bd4'] contains COMPOSITION c contains OBSERVATION bp[openEHR-EHR-OBSERVATION.blood_pressure.v1] offset 0 limit 4"
    
    var aql = "select bp/data[at0001|history|]/events[at0006|any event|]/Time as Time, " +
    "bp/data[at0001|history|]/events[at0006|any event|]/data[at0003]/items[at0004|Systolic|]/value as Systolic, " +
    "bp/data[at0001|history|]/events[at0006|any event|]/data[at0003]/items[at0005|Diastolic|]/value as Diastolic, " +
    "c_a/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value as Pulse_Rate " +
    "from EHR e " +
    "contains COMPOSITION c " +    
    "contains (OBSERVATION bp[openEHR-EHR-OBSERVATION.blood_pressure.v1] or OBSERVATION c_a[openEHR-EHR-OBSERVATION.pulse.v1])" +
    "    where " +
    "    c/archetype_details/template_id/value = 'triage' AND " +
    " e/ehr_id/value = '" + ehrId + "'" +
    " ORDER BY bp/data[at0001|history|]/events[at0006|any event|]/Time DESC" +
    " offset 0 limit 4"

    $.ajax({
        url: baseUrl + "/query?" + $.param({ "aql": aql }),
        type: 'GET',
        success: function (res) {           
            data = res.resultSet;
            console.log("ajax success");

            paintGraf(data)
        }
    });
}


function isPulseNullCheck(pulseObj) {

    var Puls;

    try {
        var Pulse_Rate = pulseObj.Pulse_Rate.magnitude

        if (Pulse_Rate != null) {
            Puls = Pulse_Rate
        }
        else {
            Puls = "0";
        }
    }
    catch (err) {
        Puls = "0";
    }

    return Puls;

}

function paintGraf(data) {
    
    systolicData = []
    diastolicData = []
    pulsData = []
    timeData = []
    console.log("start paintGraf");

    for (var i in data)
    {
        Systolic = data[i].Systolic.magnitude;
        Diastolic = data[i].Diastolic.magnitude;

        Puls = isPulseNullCheck(data[i])
       
        ComDate = data[i].Time.value;
        value = this._formatDate(ComDate, true);

        timeData.push(value);
        systolicData.push(Systolic);
        diastolicData.push(Diastolic);
        pulsData.push(Puls);

    }
            
    var randomScalingFactor = function () { return Math.round(Math.random() * 20) };
    var lineChartData = {
        labels: timeData,
        datasets: [
            {
                label: "Övertrycket ",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: systolicData
            },
            {
                label: "Undertrycket",
                fillColor: "#FFF",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: diastolicData
            }
            ,
            {
                label: "Blodtryck",
                fillColor: "#FFF",
                strokeColor: "red",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: pulsData
            }
        ]
    }

    
    var ctx = document.getElementById("canvas").getContext("2d");    

    if (myLineChart)
    {
        myLineChart.destroy();       
    }
        

    //myLineChart.destroy();
    myLineChart = new Chart(ctx).Line(lineChartData, {
        responsive: true,
        barValueSpacing: 10,
        barStrokeWidth: 0,
        scaleShowLabels: true,
        scaleShowGridLines: true,
        scaleGridLineColor: "rgba(0,0,0,.05)",
        scaleGridLineWidth: 1,
    });

    //scaleOverride: true,
    //scaleSteps: 2,
    //scaleStepWidth: 8,
    //scaleStartValue: 85

    console.log("end paintGraf");
}


function _normalizeDate(el) {

    el = el + "";

    if (el.length == 1){
        el = "0" + el;
    }
    return el;
}

function _formatDate(date, completeDate){

    if(date){
        var d = new Date(date);

        var curr_date = d.getDate();
        curr_date = this._normalizeDate(curr_date);

        var curr_month = d.getMonth();

        var curr_year = d.getFullYear();

        var curr_hour = d.getHours();
        curr_hour = this._normalizeDate(curr_hour);

        var curr_min = d.getMinutes();
        curr_min = this._normalizeDate(curr_min);

        var curr_sec = d.getSeconds();
        curr_sec = this._normalizeDate(curr_sec);

        var dateString, monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (completeDate){
            dateString = curr_date + "-" + monthNames[curr_month] + "-" + curr_year + "  " + curr_hour + ":" + curr_min; // + ":" + curr_sec;
        }
        else dateString = curr_date + "-" + monthNames[curr_month] + "-" + curr_year;
    }
    else{
        dateString = " - ";
    }
    return dateString;
}

// Save Triage


$("#SaveTriage").click(function () {
  

    alert('Spara')
    // Triage template
    var templateId = 'Medications';

    var sessionId = getSessionId();
    var ehrId = ehrID;
  
    var compositionData = {
        "medications":{"medication_instruction":[{"order":[{"dose":[{"description":["Medicin som skall tas"],"quantity":[{"|magnitude":10}]}],"medication_timing":[{"start_date":["2016-04-20T00:00:00.000+0200"],"stop_date":["2016-04-23T00:00:00.000+0200"]}]}]}]},"ctx":{"language":"en","territory":"en"}
    };
       
    //compositionData.vitalparametrar.vitalparametrar[0].blood_pressure[0].any_event[0].diastolic[0]['|magnitude'] = $("#diastolic").val()
    //compositionData.vitalparametrar.vitalparametrar[0].blood_pressure[0].any_event[0].systolic[0]['|magnitude'] = $("#systolic").val()
    //compositionData.vitalparametrar.vitalparametrar[0].pulse_heart_beat[0].any_event[0].pulse_rate[0]['|magnitude'] = $("#pulsrate").val()

    //pulsrate

    AddCompositionData(sessionId, ehrId, compositionData, templateId);
    
});

function AddCompositionData(sessionId, ehrId, compositionData, templateId) {


    $.ajaxSetup({
        headers: {
            "Ehr-Session": sessionId
        }
    });
   
    var queryParams = {
        "ehrId": ehrId,
        templateId: templateId,
        format: 'STRUCTURED',
        committer: 'Test Användare'
    };

    $.ajax({
        url: baseUrl + "/composition?" + $.param(queryParams),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(compositionData),
        success: function (res) {

            chat.server.send(ehrId, "Triage");

        },
        error: function (jqXHR, exception) {


            if (jqXHR.status === 0) {
                alert('Not connect.\n Verify Network.');
            } else if (jqXHR.status == 404) {
                alert('Requested page not found. [404]');
            } else if (jqXHR.status == 500) {
                alert('Internal Server Error [500].');
            } else if (exception === 'parsererror') {
                alert('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                alert('Time out error.');
            } else if (exception === 'abort') {
                alert('Ajax request aborted.');
            } else {
                alert('Uncaught Error.\n' + jqXHR.responseText);
            }
        }
    });
}

