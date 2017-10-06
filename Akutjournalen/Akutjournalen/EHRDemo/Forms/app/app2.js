(function forms4DemoNamespace() {

    console.log("Here we are");
    var app = angular.module("formsApp", ["ngResource", "tmh.dynamicLocale", "thinkehrForms4", "ui.bootstrap", "ui.bootstrap.datetimepicker"])
        .config(['$httpProvider', "tmhDynamicLocaleProvider", function ($httpProvider, tmhDynamicLocaleProvider) {
            //Enable cross domain calls
            $httpProvider.defaults.useXDomain = true;
            tmhDynamicLocaleProvider.localeLocationPattern("angular/1.3.2/i18n/angular-locale_{{locale}}.js");
        }])

    

        .factory("AppConfig", function () {            
            return {
                url: "https://rest.ehrscape.com/rest/v1",
                username: getUsername(), //ehrscapelogin.js, see readme
                password: getPassword(), //ehrscapelogin.js, see readme
                ehrId: "28ac8bbc-eb14-4f01-a30d-bcff446e0bd4",
                locales: ["sv-SE"]
            };
        })
        .factory("SessionResource", ["$resource", "AppConfig", function ($resource, AppConfig) {
            return $resource(
                AppConfig.url + "/session",
                {}, // Defaults
                // Actions
                {
                    login: {method: "POST", params: {username: AppConfig.username, password: AppConfig.password}},
                    ping: {
                        method: "PUT",
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId
                            }
                        }
                    }
                }
            )
        }])
        .factory("FormResource", ["$resource", "AppConfig", function ($resource, AppConfig) {
            return $resource(
                AppConfig.url + "/form",
                {}, // Defaults,
                // Actions
                {
                    load: {
                        url: AppConfig.url + "/form/:name/:version",
                        method: "GET",
                        params: {resources: "form-description"},
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId
                            }
                        }
                    },

                    list: {
                        method: "GET",
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId
                            }
                        }
                    }
                }
            );
        }])
     
        
        .controller("demographicsController", ["$scope", "$http", "$interval", "AppConfig", "FormResource", "SessionResource",
            function ($scope, $http, $interval, AppConfig, FormResource, SessionResource) {

                /* cache */
                
                $scope.cache = {};
                $scope.cache.demographics = {};

                /* patient */

                $scope.patient = {};
                $scope.patient.name = "-";
                $scope.patient.sex = "-";
                $scope.patient.age = "-";
                $scope.patient.dob = "-";

                $scope.$watch('searchString', function (tmpStr) {
                    
                    if (!tmpStr || tmpStr.length == 0) {
                        $('.typehead').hide();
                        return 0;
                    }            // if searchStr is still the same..
                    // go ahead and retrieve the data
                    if (tmpStr === $scope.searchString) {
                        var term = $scope.searchString;

                        if (term in $scope.cache.demographics) {  //cache
                            $scope.party = $scope.cache.demographics[term];
                            $('.typehead').show();
                            return;
                        }

                        var login = SessionResource.login();
                        login.$promise.then(function (success) {
                            //console.log("Login", success);
                            AppConfig.sessionId = success.sessionId;

                            // Ping the session every 5 minutes
                            $scope.sessionPing = $interval(function () {
                                SessionResource.ping({},
                                    function (success) {
                                        //console.info("Successfully pinged ehr session", AppConfig.sessionId);
                                    },
                                    function (failure) {
                                        //console.error("Failed to ping ehr session", AppConfig.sessionId, " please reload page to create a new session.", failure);
                                    }
                                );
                            }, 300000, 0, false);

                            return FormResource.list().$promise;
                        }).then(
                            function () {
                                $http({
                                    url: AppConfig.url + "/demographics/party/query",
                                    method: "GET",
                                    params: {search: "*" + term + "*"},
                                    headers: {
                                        "Ehr-Session": AppConfig.sessionId
                                    }
                                }).success(function (data) {
                                    $scope.party = data.parties;
                                    $scope.cache.demographics[term] = $scope.party;
                                    $('.typehead').show();
                                });
                            }
                        );
                    }
                });

                $scope.selectParty = function (patient) {

                    $scope.patient = patient;

                    $scope.patient.name = patient.firstNames + " " + patient.lastNames;
                    //$scope.patient.sex = ehrscapeDemo.capitaliseFirstLetter(patient.gender.toLowerCase());
                    $scope.patient.age = ehrscapeDemo.getAge(ehrscapeDemo.formatDateUS(patient.dateOfBirth));
                    $scope.patient.dob = ehrscapeDemo.formatDate(patient.dateOfBirth);

                    $http({
                        url: AppConfig.url + "/ehr",
                        method: "GET",
                        params: {
                            subjectId: patient.id,
                            subjectNamespace: 'ehscape'
                        },
                        headers: {
                            "Ehr-Session": AppConfig.sessionId
                        }
                    }).success(function (data) {
                        if (data) {
                            $scope.patient.ehrId = data.ehrId;
                            AppConfig.ehrId = $scope.patient.ehrId;
                        }
                        else {
                            console.log("ehrId not found!");
                        }

                    });

                    $('.search-query').val('');
                    $('.typehead').hide();

                };

                $scope.buildSuggestion = function (party) {
                    return party.firstNames + " " + party.lastNames + " (ID: " + party.id + ")";
                }
            }])
        .filter('highlight', function ($sce) {
            return function (text, phrase) {
                //if (phrase) text = text.replace(new RegExp('('+phrase+')', 'gi'),
                //  '<span class="highlighted">$1</span>');

                if (phrase) text = text.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + phrase + ")(?![^<>]*>)(?![^&;]+;)", "gi"), '<span class="highlighted">$1</span>');

                return $sce.trustAsHtml(text)
            }
        })
       
       
        
})();