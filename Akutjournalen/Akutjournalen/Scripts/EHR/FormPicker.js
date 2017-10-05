$(document).ready(function () {

    var baseUrl = 'https://rest.ehrscape.com/rest/v1';
    var queryUrl = baseUrl + '/query';
    


    var getHrefPromise = new Promise(function (resolve, reject) {
        var href = window.location.href;
        console.log("href", href)
        resolve(href);
    });

    getHrefPromise.then(function (href) {
        //getEHR
        var str = href.substring(href.indexOf('patientehr=') + 11, href.indexOf('patientehr=') + 13 + 34);
        console.log("str", str)
        return str;

    }).then(function (ehr) {
        //SetIframe
        ehr = "b51f3709-eeb6-49ed-afae-ef1468ec03fb";
        var baseurl = "http://localhost:20216/EHRDemo/Forms/index.html?EHRID=";
        console.log("ehrid", ehr)
        try {
            document.getElementById('add-iframe-div').innerHTML =
            "<iframe name='ehrform' id='ehrform' src='" + baseurl + ehr + "' height='1000px' width='100%' frameborder='0'></iframe>";
        }

        catch (e) {

        }
    });

});