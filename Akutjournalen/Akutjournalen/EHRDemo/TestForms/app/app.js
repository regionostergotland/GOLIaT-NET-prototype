(function forms4DemoNamespace() {
	
    var app = angular.module("formsApp", ["ngResource", "tmh.dynamicLocale", "thinkehrForms4", "ui.bootstrap", "ui.bootstrap.datetimepicker"])
        .config(['$httpProvider', "tmhDynamicLocaleProvider", function ($httpProvider, tmhDynamicLocaleProvider) {
            //Enable cross domain calls
            $httpProvider.defaults.useXDomain = true;
            tmhDynamicLocaleProvider.localeLocationPattern("angular/1.3.2/i18n/angular-locale_{{locale}}.js");
        }])
		
        .factory("AppConfig", function () {            
		
            EHRID = getParameterByName('EHRID');
										
            return {
                url: "https://rest.ehrscape.com/rest/v1",
                username: "lio.se2",
                password: "ehr4lio.se2",
                ehrId: EHRID,
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
        .factory("CompositionResource", ["$resource", "AppConfig", function ($resource, AppConfig) {
									
            return $resource(
                AppConfig.url + "/composition",
                {}, // Defaults,
                // Actions
                {
                    add: {
                        method: "POST",
                        params: { ehrId: AppConfig.ehrId, format: "STRUCTURED" },
                        //params: { format: "STRUCTURED" },
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId;
                            }
                        }
                    },
                    load: {
                        url: AppConfig.url + "/composition/:uid",
                        method: "GET",
                        params: {format: "STRUCTURED"},
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId;
                            }
                        }
                    }
                }
            );
        }])
        .factory("QueryResource", ["$resource", "AppConfig", function ($resource, AppConfig) {
			
            return $resource(
                AppConfig.url + "/query",
                {}, // Defaults,
                // Actions
                {

                    
                    querySaved: {
                        method: "GET",
                        params: {
                            aql: function () {
								// return "select a" + 
									// "from EHR [ehr_id/value='" +
                                    // AppConfig.ehrId +
                                    // "'] " 
									// "contains COMPOSITION a[openEHR-EHR-COMPOSITION.request.v1]" +
									// "contains INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.request-lab_test.v1]" +
									// "where a/name/value='Request for service'" + 
									// "offset 0 limit 100";
									
                                return "select " +
                                    "c/uid/value as uid, " +
                                    "c/context/start_time/value as startTime, " +
                                    "c/archetype_details/template_id/value as templateId" +
                                    " from EHR[ehr_id/value='" +
                                    AppConfig.ehrId +
                                    "'] " +
                                    " CONTAINS Composition c " +
                                    " where templateId = '" + AppConfig.templateId +
                                    "'" +
                                    " order by startTime DESC offset 0 limit 10";
                            }
                        },
                        headers: {
                            "Ehr-Session": function () {
                                return AppConfig.sessionId;
                            }
                        }
                    }
                }
            );
        }])
        .controller('AppCtrl', ["$scope", "$compile", "$interval", "$timeout", "AppConfig", "FormResource", "SessionResource", "tmhDynamicLocale", "EhrContext",
            "CompositionResource", "EhrSaveHelper", "QueryResource",
            function ($scope, $compile, $interval, $timeout, AppConfig, FormResource, SessionResource, tmhDynamicLocale, EhrContext, CompositionResource, EhrSaveHelper, QueryResource) {
                this.AppConfig = AppConfig;
                var compositionUid;

                $scope.currentFormIndex = "";
                this.showValueModel = false;
                this.valueModel = {};
                var ctrl = this;

                $scope.$on('selectPretty', function (scope, element, attrs) {
                    $(element).selecter();


                });

				
                //EhrContext.language = "en";
                //EhrContext.territory = "US";
                //EhrContext.locale = "en-US";

                //EhrContext.language = "se";
                //EhrContext.territory = "SV";
				//EhrContext.language = "se";
                //EhrContext.territory = "se";
                //EhrContext.locale = "sv-SE";

                //tmhDynamicLocale.set("sv-SE");

                //this.EhrContext = EhrContext;
                //$scope.currentLocale = EhrContext.language + "-" + EhrContext.territory;
												
//                $scope.formsDataSource = new kendo.data.ObservableArray([]);
                

                /*this.refreshValues = function () {
                    this.valueModel = {};
                    thinkehr.f4.refreshValues(this.formModel, this.valueModel);

                };*/

                this.createGrowl = function(settings) {
                    $.growl({
                            icon: "fa fa-" + settings.icon,
                            title: "<strong> " + settings.title + "</strong><br>",
                            message: settings.message
                        },
                        {
                            type: settings.type,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            },
                            delay: 1500
                        }
                    );
                };

                //temporary save changes in form for later evalutation (sends to ehrscape but state is not changed)
                this.tempSaveValues = function () {

                    var temp_valuemodel = this.valueModel;

                    if ($scope.markedForCitationList) {
                        var citation = {};

                        if ($scope.markedForCitationList.length >= 1) {

                            for (elementNumber in $scope.markedForCitationList) {

                                if (elementNumber == 0) {
                                    console.log("citation 1.0", citation);
                                    citation["citat_länk"] = [];
                                    citation["citat_länk"]["0"] = {};
                                    citation["citat_länk"]["0"].citat = [];
                                    citation["citat_länk"]["0"].comment = [];
                                    citation["citat_länk"]["0"].description = [];
                                    citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                                    citation["citat_länk"]["0"].citat.push({
                                        "|formalism": "application/json",
                                        "|value": $scope.markedForCitationList[elementNumber]//JSON.stringify(
                                    });

                                    citation["citat_länk"]["0"].comment.push("");
                                    citation["citat_länk"]["0"].description.push("");
                                    citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                                }
                                else if (elementNumber >= 1) {

                                    citation["citat_länk:" + elementNumber] = [];
                                    citation["citat_länk:" + elementNumber]["0"] = {};
                                    citation["citat_länk:" + elementNumber]["0"].citat = [];
                                    citation["citat_länk:" + elementNumber]["0"].comment = [];
                                    citation["citat_länk:" + elementNumber]["0"].description = [];
                                    citation["citat_länk:" + elementNumber]["0"].länk_uri_till_källdata = [];

                                    citation["citat_länk:" + elementNumber]["0"].citat.push({
                                        "|formalism": "application/json",
                                        "|value": $scope.markedForCitationList[elementNumber] //JSON.stringify(
                                    });
                                    citation["citat_länk:" + elementNumber]["0"].comment.push("");
                                    citation["citat_länk:" + elementNumber]["0"].description.push("");
                                    citation["citat_länk:" + elementNumber]["0"].länk_uri_till_källdata.push("");
                                }
                                console.log("citation 2", citation);
                                console.log("markedForCitationList@number...", $scope.markedForCitationList[elementNumber]);
                            }
                        }

                        else {
                            citation["citat_länk"] = [];
                            citation["citat_länk"]["0"] = {};
                            citation["citat_länk"]["0"].citat = [];
                            citation["citat_länk"]["0"].comment = [];
                            citation["citat_länk"]["0"].description = [];
                            citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                            citation["citat_länk"]["0"].citat.push({ "|formalism": "", "|value": "" });
                            citation["citat_länk"]["0"].comment.push("");
                            citation["citat_länk"]["0"].description.push("");
                            citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                        }

                        temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["underlag_citat_länkar_relevanta_för_beslutet"][0] = citation;
                        temp_valuemodel["beslut_om_kirurgisk_åtgärd"].status_beslut["0"].ism_transition["0"].current_state = ""
                    }

                    var cr = new CompositionResource(EhrSaveHelper.prepareValueModel(temp_valuemodel));

                    cr.$add({ templateId: this.templateId },
                        function (success) {

                            console.log("Success", success)
                            var h = success.meta.href;
                            var parsedHref = h.split("/");
                            ctrl.lastSaved = parsedHref[parsedHref.length - 1];

                            var opts = {
                                icon: "check",
                                title: "Success!",
                                message: "Formulär har sparats!",
                                type: "success"
                            };

                            ctrl.createGrowl(opts);

                            if (!ctrl.compositions) {
                                ctrl.compositions = [];
                            }

                            var newComp = {
                                startTime: new Date(),
                                uid: ctrl.lastSaved,
                                templateId: ctrl.templateId
                            };

                            if (ctrl.compositions.length > 9) {
                                ctrl.compositions.pop();
                            }
                            ctrl.compositions.unshift(newComp);

                        },
                        function (error) {
                            ctrl.saveError = error;
                            console.error("err", error);

                            var opts = {
                                icon: "warning",
                                title: "Error!",
                                message: "Kunde inte spara formulär, formuläret är inkorrekt ifyllt",
                                type: "danger"
                            };

                            ctrl.createGrowl(opts);
                        }
                    );
                }

                //Send form to EHRscape 
                this.saveValues = function () {
                    	
                    console.log("TESTING SCOPE SHARING:", $scope.markedForCitationList);
                    var citation = {};

                    if ($scope.markedForCitationList) {
                        //if ($scope.markedForCitationList.length >= 1) {

                        //    for (elementNumber in $scope.markedForCitationList) {

                        //        if (elementNumber == 0) {
                        //            console.log("citation 1.0", citation);
                        //            citation["citat_länk"] = [];
                        //            citation["citat_länk"]["0"] = {};
                        //            citation["citat_länk"]["0"].citat = [];
                        //            citation["citat_länk"]["0"].comment = [];
                        //            citation["citat_länk"]["0"].description = [];
                        //            citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                        //            citation["citat_länk"]["0"].citat.push({
                        //                "|formalism": "application/json",
                        //                "|value": $scope.markedForCitationList[elementNumber]//JSON.stringify(
                        //            });

                        //            citation["citat_länk"]["0"].comment.push("");
                        //            citation["citat_länk"]["0"].description.push("");
                        //            citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                        //        }
                        //        else if (elementNumber >= 1) {
                        //            console.log("citation 1.5", citation);

                        //            //citation["citat_länk"]["0"]["citat:" + elementNumber] = [];
                        //            //citation["citat_länk"]["0"]["comment:" + elementNumber] = [];
                        //            //citation["citat_länk"]["0"]["description:" + elementNumber] = [];
                        //            //citation["citat_länk"]["0"]["länk_uri_till_källdata:" + elementNumber] = [];

                        //            //citation["citat_länk"]["0"]["citat:" + elementNumber].push({
                        //            //    "|formalism": "application/json",
                        //            //    "|value": $scope.markedForCitationList[elementNumber] //JSON.stringify(
                        //            //});
                        //            //citation["citat_länk"]["0"]["comment:" + elementNumber].push("");
                        //            //citation["citat_länk"]["0"]["description:" + elementNumber].push("");
                        //            //citation["citat_länk"]["0"]["länk_uri_till_källdata:" + elementNumber].push("");


                        //            citation["citat_länk:" + elementNumber] = [];
                        //            citation["citat_länk:" + elementNumber]["0"] = {};
                        //            citation["citat_länk:" + elementNumber]["0"].citat = [];
                        //            citation["citat_länk:" + elementNumber]["0"].comment = [];
                        //            citation["citat_länk:" + elementNumber]["0"].description = [];
                        //            citation["citat_länk:" + elementNumber]["0"].länk_uri_till_källdata = [];

                        //            citation["citat_länk:" + elementNumber]["0"].citat.push({
                        //                //"|formalism": "application/json",
                        //                //"|value": $scope.markedForCitationList[elementNumber] //JSON.stringify(
                        //            });
                        //            citation["citat_länk:" + elementNumber]["0"].comment.push("");
                        //            citation["citat_länk:" + elementNumber]["0"].description.push("");
                        //            citation["citat_länk:" + elementNumber]["0"].länk_uri_till_källdata.push("");
                        //        }
                        //        console.log("citation 2", citation);
                        //        console.log("markedForCitationList@number...", $scope.markedForCitationList[elementNumber]);
                        //    }
                        //}

                        //else {
                        //    citation["citat_länk"] = [];
                        //    citation["citat_länk"]["0"] = {};
                        //    citation["citat_länk"]["0"].citat = [];
                        //    citation["citat_länk"]["0"].comment = [];
                        //    citation["citat_länk"]["0"].description = [];
                        //    citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                        //    citation["citat_länk"]["0"].citat.push({ "|formalism": "", "|value": ""});
                        //    citation["citat_länk"]["0"].comment.push("");
                        //    citation["citat_länk"]["0"].description.push("");
                        //    citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                        //}

                        if ($scope.markedForCitationList.length >= 1) {

                            for (elementNumber in $scope.markedForCitationList) {

                                if (elementNumber == 0) {
                                    console.log("citation 1.0", citation);
                                    citation["citat_länk"] = [];
                                    citation["citat_länk"]["0"] = {};
                                    citation["citat_länk"]["0"]["citat"] = [];
                                    citation["citat_länk"]["0"]["citat"]["0"] = {};
                                    citation["citat_länk"]["0"]["citat"]["0"]["value"] = [];
                                    citation["citat_länk"]["0"]["citat"]["0"]["value"]["0"] = {};

                                    citation["citat_länk"]["0"].comment = [];
                                    citation["citat_länk"]["0"].description = [];
                                    citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                                    citation["citat_länk"]["0"]["citat"]["0"]["value"]["0"] = {
                                        "|formalism": "application/json",
                                        "|value": $scope.markedForCitationList[elementNumber].Value
                                    };

                                    citation["citat_länk"]["0"].comment.push("Test");
                                    citation["citat_länk"]["0"].description.push("Hej");
                                    citation["citat_länk"]["0"].länk_uri_till_källdata.push("https://www.google.com/nacon");
                                }
                                //else if (elementNumber >= 1) {
                                //    console.log("citation 1.5", citation);

                                //    citation["citat_länk"] = [];
                                //    citation["citat_länk"]["0"] = {};
                                //    citation["citat_länk"]["0"]["citat:" + elementNumber] = [];
                                //    citation["citat_länk"]["0"]["citat:" + elementNumber]["0"] = {};
                                //    citation["citat_länk"]["0"].comment = [];
                                //    citation["citat_länk"]["0"].description = [];
                                //    citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                                //    citation["citat_länk"]["0"]["citat:" + elementNumber]["0"] = {
                                //        "|formalism": "application/json",
                                //        "|value": $scope.markedForCitationList[elementNumber].Value
                                //    };
                                //    citation["citat_länk"]["0"].comment.push("");
                                //    citation["citat_länk"]["0"].description.push("");
                                //    citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                                //}
                                console.log("citation 2", citation);
                                console.log("markedForCitationList@number...", $scope.markedForCitationList[elementNumber]);
                            }
                        }

                        else {
                            citation["citat_länk"] = [];
                            citation["citat_länk"]["0"] = {};
                            citation["citat_länk"]["0"].citat = [];
                            citation["citat_länk"]["0"].comment = [];
                            citation["citat_länk"]["0"].description = [];
                            citation["citat_länk"]["0"].länk_uri_till_källdata = [];

                            citation["citat_länk"]["0"].citat.push({ "|formalism": "", "|value": "" });
                            citation["citat_länk"]["0"].comment.push("");
                            citation["citat_länk"]["0"].description.push("");
                            citation["citat_länk"]["0"].länk_uri_till_källdata.push("");
                        }
                    }


					// EhrContext.language = "se";
					// EhrContext.territory = "se";
                    // EhrContext.locale = "sv-se";
                    
                    var temp_valuemodel = this.valueModel;

                    
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"].status_beslut["0"].ism_transition["0"].current_state["0"] = {}
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"].status_beslut["0"].ism_transition["0"].current_state["0"] = {"|code": "531", "|terminology": "local", "|value": "initial"};
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"].status_beslut["0"].motivering_till_beslut["0"] = "";
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"].status_beslut["0"].motivering_till_beslut["0"] = "Motivering Lorem";
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["beställning_av_kirurgisk_åtgärd"]["0"].narrative["0"] = "";
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["beställning_av_kirurgisk_åtgärd"]["0"].narrative["0"] = "Narrative Lorem";
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["beställning_av_kirurgisk_åtgärd"]["0"].request["0"].timing["0"] = {};
                    temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["beställning_av_kirurgisk_åtgärd"]["0"].request["0"].timing["0"] = { "|formalism": "text/html", "|value": "Timing Lorem" };

                    console.log("temp_valuemodel 2", temp_valuemodel)
                    //if ($scope.markedForCitationList) {
                    //    console.log("citation", citation)
                    //    temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["underlag_citat_länkar_relevanta_för_beslutet"][0] = citation;
                    //}


                    //console.log("temp_valuemodel", temp_valuemodel);

                    //var citatValue = temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["underlag_citat_länkar_relevanta_för_beslutet"]["0"]["citat_länk"]["0"].citat[0];
                    //temp_valuemodel["beslut_om_kirurgisk_åtgärd"]["underlag_citat_länkar_relevanta_för_beslutet"]["0"]["citat_länk"]["0"].citat[0] = { "|value": citatValue ,"|formalism":"text/html"};


                    ///////

                    var cr = new CompositionResource(EhrSaveHelper.prepareValueModel(temp_valuemodel));

                    cr.$add({ templateId: this.templateId },
                        function (success) {

                            console.log("Success", success)
                            var h = success.meta.href;
                            var parsedHref = h.split("/");
                            ctrl.lastSaved = parsedHref[parsedHref.length - 1];

                            var opts = {
                                icon: "check",
                                title: "Success!",
                                message: "Beslut har skickats och sparats!",
                                type: "success"
                            };

                            ctrl.createGrowl(opts);

                            if (!ctrl.compositions) {
                                ctrl.compositions = [];
                            }
                                
                            var newComp = {
                                startTime: new Date(),
                                uid: ctrl.lastSaved,
                                templateId: ctrl.templateId
                            };

                            if (ctrl.compositions.length > 9) {
                                ctrl.compositions.pop();
                            }
                            ctrl.compositions.unshift(newComp);

                        },
                        function (error) {
                            ctrl.saveError = error;
                            console.error("err", error);

                            var opts = {
                                icon: "warning",
                                title: "Error!",
                                message: "Kunde inte spara och skicka beslut, formuläret är inkorrekt ifyllt",
                                type: "danger"
                            };

                            ctrl.createGrowl(opts);
                        }
                    );
                };

                this.openComposition = function ($event) {
                    $event.preventDefault();
                    compositionUid = $($event.target).attr("data-composition-uid");
                    if (compositionUid) {
                        CompositionResource.load({uid: compositionUid},
                            function (success) {
                                console.log("Loaded composition: ", success);
                                ctrl.composition = success.composition;
                                ctrl.valueModel = ctrl.composition;

                                thinkehr.f4.refreshValues(ctrl.formModel, ctrl.composition);  //loadFormData

                                $("body").animate({ scrollTop: 0 }, "slow",
                                    function () {

                                        var opts = {
                                            icon: "eye",
                                            title: "Composition view",
                                            message: "Form has been refreshed.",
                                            type: "info"
                                        };

                                        ctrl.createGrowl(opts);
                                    }
                                );
                            }
                        );
                    }
                };

                this.tableClass = function ($even) {
                    return $even ? "even" : "odd";
                };

                var login = SessionResource.login();
                login.$promise.then(function (success) {
                    console.log("Login", success);
                    AppConfig.sessionId = success.sessionId;

                    // Ping the session every 5 minutes
                    $scope.sessionPing = $interval(function () {
                        SessionResource.ping({},
                            function (success) {
                                console.info("Successfully pinged ehr session", AppConfig.sessionId);
                            },
                            function (failure) {
                                console.error("Failed to ping ehr session", AppConfig.sessionId, " please reload page to create a new session.", failure);
                            }
                        );
                    }, 300000, 0, false);

                    return FormResource.list().$promise;
                }).then(
                    function (success) {
                        var displayForms = [];
                        var done = {};
                        var id = 0;
                        angular.forEach(success.forms, function (form) {
                            if (!done[form.name]) {
                                form.xid = id++;
                                var formName = getParameterByName("formName");
                                var formVersion = getParameterByName("formVersion");
                                form.nameWithVersion = form.name + " " + form.version;
                                

                                //var nameWithVersionToParse = getParameterByName("formName") + " " + getParameterByName("formVersion")
                                //var temp = nameWithVersionToParse.replace(/"/g, "");
                                
                                //Get query string and put results in below
                                //console.log(formName + formVersion);
                                //console.log(temp);
                                
                                if (form.nameWithVersion == formName + " " + formVersion) {
									console.log(form);
									displayForms.push(form);
									done[form.name] = 1;
								}
									
								
								//console.log('form', form);
                            }
                        });

                        $scope.formsDataSource = displayForms;
                        //angular.forEach(success.forms, function (form) {
                        //    form.xid = id++;
                        //    form.nameWithVersion = form.name + " " + form.version;
                        //});
						
						console.log('displayForms',displayForms);
						
						
						var form = displayForms[0];

						ctrl.currentForm = form;
						
						FormResource.load({name: form.name, version: form.version}).$promise.then(
							function (success) {

								var formDesc = function () {

									for (var i = 0; i < success.form.resources.length; i++) {
										
										var r = success.form.resources[i];
										if (r.name == "form-description") {
											return r.content;
										}
									}
								}();
								
								ctrl.templateId = success.form.templateId;
								AppConfig.templateId = ctrl.templateId;

								if (!formDesc) {
									console.error("Could not find form-description for form " + AppConfig.formName + ":" + AppConfig.formVersion);
								} else {
									ctrl.valueModel = {};
									ctrl.formModel = thinkehr.f4.parseFormDescription(ctrl.ehrContext, formDesc, ctrl.valueModel);
									console.log("Form description", formDesc);
									console.log("valueModel", ctrl.valueModel);
									console.log("formmodel", ctrl.formModel);
								}

								return QueryResource.querySaved().$promise;
							}
						).then(
							function (success) {
							    ctrl.compositions = success.resultSet;
							},

							function (fail) {
								console.error("Fail", fail);
							});

                    },

                    function (fail) {
                        console.error("Fail", fail);
                    }
                );

                // This is kinda ugly, redraws the entire form, maybe there is a better way
                $scope.$on("$localeChangeSuccess", function (event) {
				
                    var scl = $scope.currentLocale;
                    EhrContext.language = scl.substr(0, 2);
                    EhrContext.territory = scl.substr(3, 2);
                    EhrContext.locale = scl;

					
			        //EhrContext.language = "sv";
			        //EhrContext.territory = "SE";
			        //EhrContext.locale = "sv-SE";

                    var formAttach = $("#form-attach");
                    var ehrFormEl = $("ehr-form");

                    $(ehrFormEl).remove();
                 
                    var el = $compile('<ehr-form model="appCtrl.formModel" ehr-context="appCtrl.EhrContext" form-id="{{appCtrl.AppConfig.formName}}_{{appCtrl.AppConfig.formVersion}}"></ehr-form>')($scope);
                    formAttach.append(el);
                                                                    

                });

                $scope.$watch("currentLocale", function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        console.log("Locale change", newVal, oldVal, newVal.toLowerCase());
                        tmhDynamicLocale.set(newVal.toLowerCase());
                    }
                });

                $scope.$watch("currentFormIndex", function (newVal, oldVal) {

                    if (newVal != oldVal) {
                        var cfi = parseInt(newVal.xid);
                        var form = $scope.formsDataSource[cfi];

                        if (cfi >= 0) {
                            ctrl.currentForm = form;
							
                            FormResource.load({name: form.name, version: form.version}).$promise.then(
                                function (success) {

                                    var formDesc = function () {

                                        for (var i = 0; i < success.form.resources.length; i++) {
                                            
                                            var r = success.form.resources[i];
                                            if (r.name == "form-description") {
                                                return r.content;
                                            }
                                        }
                                    }();

                                    
                                    console.log("Form description", formDesc);
                                    
                                    ctrl.templateId = success.form.templateId;
                                    AppConfig.templateId = ctrl.templateId;

                                    if (!formDesc) {
                                        console.error("Could not find form-description for form " + AppConfig.formName + ":" + AppConfig.formVersion);
                                    } else {
                                        ctrl.valueModel = {};
                                        ctrl.formModel = thinkehr.f4.parseFormDescription(ctrl.ehrContext, formDesc, ctrl.valueModel);
                                    }
                                    return QueryResource.querySaved().$promise;
                                }
                            ).then(
                                function (success) {
                                    ctrl.compositions = success.resultSet;
									console.log('Success',success);
                                },

                                function (fail) {
                                    console.error("Fail", fail);
                                })
                            ;
                        }
                    }
                });
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
        .directive('prettySelect', function () {
            return function (scope, element, attrs) {
                setTimeout(function () {
                    scope.$emit('selectPretty', element, attrs);
                }, 10);
            };
        })
        .directive('prettySelectForm', function ($timeout, $parse) {
            return {
                require: 'ngModel',
                link: function ($scope, element, $attrs, ngModel) {
                    return $timeout(function () {

                        $scope.$emit('selectPretty', element, $attrs);

                        $scope.$watch(function () {
                            return ngModel.$modelValue;
                        }, function(newValue) {
                            $(element).selecter("refresh");
                        });
                    });
                }
            };
        })
        .directive('iCheck', function ($timeout, $parse) {
            return {
                require: 'ngModel',
                link: function ($scope, element, $attrs, ngModel) {
                    return $timeout(function () {
                        var value;
                        value = $attrs['value'];

                        $scope.$watch($attrs['ngModel'], function (newValue) {
                            $(element).iCheck('update');
                        });

                        return $(element).iCheck({
                            checkboxClass: 'icheckbox_flat',
                            radioClass: 'iradio_flat',
                            increaseArea: '20%'
                        }).on('ifChanged', function (event) {
                            if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                                $scope.$apply(function () {
                                    return ngModel.$setViewValue(event.target.checked);
                                });
                            }
                            if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                                return $scope.$apply(function () {
                                    return ngModel.$setViewValue(value);
                                });
                            }
                        });
                    });
                }
            };
        });
})();