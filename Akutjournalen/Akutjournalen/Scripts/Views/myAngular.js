
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
//var username = 'lio.se1'
//var password = 'lio.se123'
var username = 'Carlos.Ortiz@regionostergotland.se'
var password = 'Cortiz13112015'

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


