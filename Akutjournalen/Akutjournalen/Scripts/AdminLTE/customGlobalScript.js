// Overide Admin LTE settings
var AdminLTEOptions = {
    //Enable sidebar expand on hover effect for sidebar mini
    //This option is forced to true if both the fixed layout and sidebar mini
    //are used together
    sidebarExpandOnHover: false,
    //BoxRefresh Plugin
    enableBoxRefresh: true,
    //Bootstrap.js tooltip
    enableBSToppltip: true
};



$(window).resize(function () {
    
    if ($(window).width() <= 1024) {
        $("body").addClass("sidebar-collapse");
    }
    else
    {
        $("body").removeClass("sidebar-collapse");
    }

});

$(document).ready(function () {

    // This is implemented by RÖ in order to auto close the menu when u use a mobile app and ajax to reload a specific area.
    $(".sidebar-menu").on('click', 'a', function (event) {
        if ($(this).attr('data-toggle')) {
            if ($(window).width() < 510) {
                $('.sidebar-toggle').click()
            }
        }
    });
    
    if ($(window).width() <= 1024) {
        $("body").addClass("sidebar-collapse");
    }
    


    //sidebar - mini

    // This is implemented by RÖ in order to auto select active menu item
    $(function () {
        function stripURL(str) {
            if (str.substr(-1) == '/') {
                return str.substr(0, str.length - 1);
            }
            return str;
        }

        var url = window.location.pathname;
        var activePage = stripURL(url);

        $('.sidebar-menu li a').each(function () {
            var currentPage = stripURL($(this).attr('href'));
            if (activePage == currentPage) {
                $(this).parent().addClass('active');
            }
        });
    });


});


