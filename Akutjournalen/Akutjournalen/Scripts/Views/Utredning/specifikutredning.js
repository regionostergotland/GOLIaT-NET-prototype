﻿var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var username = getUsername();
var password = getPassword();

function setPatientTitle(name, age, gendericon) {
    $('.title-gender').attr("class", gendericon);
    $('.title-name').text(name + ", ");
    $('.title-age').text(age + " år");
    $('.uppsignal').attr("src", "../Content/Img/signal.01245.png")
    
};
(function () {

});

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



var specifik = angular.module("specifik", ["formsApp", "aql_services_module"]);

specifik.controller('SpecifikUnderlagCtrl', ['$scope', '$filter', '$http', 'GetProverFact', 'ProvResultatAQLProvider', 'GetDemographics', function ($scope, $filter, $http, GetProverFact, ProvResultatAQLProvider, GetDemographics) {


    $scope.numberOfValues = 3;

    GetDemographics.promise().then(function (data) {

        var fullName = "";
        fullName += data.data.party.firstNames;
        fullName += " "
        fullName += data.data.party.lastNames;
        var age = $filter('date')(data.data.party.dateOfBirth, "yyyy");
        if (data.data.party.gender) {
            if (data.data.party.gender == "MALE") {
                var gendericon = "fa fa-mars";
            }
            else {
                var gendericon = "fa fa-venus";
            }
        }

        setPatientTitle(fullName, CurrentAge(age), gendericon)

    });
    
    //ERSÄTT MED GET AQLVALUES
    GetProverFact.getPSAValues().then(function (data) {

        if (data.data.resultSet) {
            
            $scope.PSAValueList = [];
            var counter = 0;
            data.data.resultSet.forEach(function (element, index) {

                if (counter < 3) {
                    $scope.PSAValueList.push(element);

                    var date_to_filter = $scope.PSAValueList[counter].time_value;
                    var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                    $scope.PSAValueList[counter].tid_for_prov = data_filtered;

                    counter += 1;
                }
            });
        }
    });

    GetProverFact.getBlood_Values().then(function (data) {
        if (data.data.resultSet) {
            $scope.BloodValuesList = [];
            var counter = 0;

            data.data.resultSet.forEach(function (element, index) {
                if (counter < 3) {

                    $scope.BloodValuesList.push(element);

                    var date_to_filter = $scope.BloodValuesList[counter].time_value;
                    var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                    $scope.BloodValuesList[counter].tid_for_prov = data_filtered;


                    counter += 1;

                }
            });
        }
    });

    GetProverFact.getKreatininValues().then(function (data) {

        if (data.data.resultSet) {
            $scope.KreatininValuesList = [];
            var counter = 0;

            console.warn("KREATININASDASDADASDSADASDAS         --", data.data.resultSet)
            data.data.resultSet.forEach(function (element, index) {

                if (counter < 3) {
                    if (element.test_value.magnitude) {
                        if (element.test_value.magnitude != null || element.test_value.magnitude != undefined) {
                            $scope.KreatininValuesList.push(element);

                            var date_to_filter = $scope.KreatininValuesList[counter].time_value;
                            var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                            $scope.KreatininValuesList[counter].tid_for_prov = data_filtered;

                            counter += 1;
                        }
                    }
                }
            });
        }
    });

    GetProverFact.getKaliumValues().then(function (data) {
        if (data.data.resultSet) {

            $scope.KaliumValuesList = [];
            var counter = 0;
            data.data.resultSet.forEach(function (element, index) {
                
                if (counter < 3) {
                    if (element.Typ_av_test == 'Kalium') {
                        console.log("dad---------sds", element)
                    }

                    //has 5 items in data == has value
                    if (element.composition.data.events[0].data.items.length == 5) {
                        $scope.KaliumValuesList.push(element);

                        // ehrid, compid, typavtest, värde, time

                        var value = $scope.KaliumValuesList[counter].composition.data.events["0"].data.items[3].items["0"].items["0"].value.value;
                        var typ_av_test = $scope.KaliumValuesList[counter].composition.data.events["0"].data.items["0"].value.value;
                        var date_to_filter = $scope.KaliumValuesList[counter].composition.data.events["0"].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        $scope.KaliumValuesList[counter].Typ_av_test = typ_av_test;
                        $scope.KaliumValuesList[counter].tid_for_prov = data_filtered;
                        $scope.KaliumValuesList[counter].test_value = value;

                        counter += 1;
                    }
                }


            });
        }

    });

    GetProverFact.getNatriumValues().then(function (data) {
        if (data.data.resultSet) {

            $scope.NatriumValuesList = [];
            var counter = 0;



            data.data.resultSet.forEach(function (element, index) {

                if (counter < 3) {

                    
                    if (element.composition.data.events[0].data.items.length == 5) {
                        $scope.NatriumValuesList.push(element);
                        var value = $scope.NatriumValuesList[counter].composition.data.events["0"].data.items[3].items["0"].items["0"].value.value;
                        var typ_av_test = $scope.NatriumValuesList[counter].composition.data.events["0"].data.items["0"].value.value;
                        var date_to_filter = $scope.NatriumValuesList[counter].composition.data.events["0"].time.value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        $scope.NatriumValuesList[counter].Typ_av_test = typ_av_test;
                        $scope.NatriumValuesList[counter].tid_for_prov = data_filtered;
                        $scope.NatriumValuesList[counter].test_value = value;

                        counter += 1;
                    }

                }

            });
        }


    });

    GetProverFact.getPKINRValues().then(function (data) {

        if (data.data.resultSet) {

            $scope.PKINRValuesList = [];
            var counter = 0;

            data.data.resultSet.forEach(function (element, index) {
                if (counter < 3) {
                    if (element.composition.data.events[0].data.items.length >= 4) {
                        $scope.PKINRValuesList.push(element);
                        var date_to_filter = $scope.PKINRValuesList[counter].time_value;
                        var data_filtered = $filter('date')(date_to_filter, 'yyyy-MM-dd: HH:mm');

                        $scope.PKINRValuesList[counter].tid_for_prov = data_filtered;


                        counter += 1;
                    }

                }
                else {
                }
            });
        }
    });

    var convertTime = function (old_value) {
        var new_value;

        new_value = old_value.split("T")[0];

        return new_value;
    }


    //GET SUMMARY AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).summary).then(function (data) {
        if (data.data.resultSet) {
            $scope.arftlighet_summary = data.data.resultSet["0"].Summary;
            //$scope.arftlighet_summary_name = data.data.resultSet["0"].name;
            $scope.arftlighet_summary_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET RELATION AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).relation_to_patient).then(function (data) {
        if (data.data.resultSet) {
            $scope.arftlighet_relation_to_patient = data.data.resultSet["0"].Relation_till_patienten;
            //$scope.arftlighet_relation_to_patient_name = data.data.resultSet["0"].name;

            $scope.arftlighet_relation_to_patient_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET arftlighet_ageofsickness AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).age_of_sickness).then(function (data) {
        if (data.data.resultSet) {
            var new_age = data.data.resultSet["0"].age_of_sickness.replace(/[^0-9]/g, '')
            $scope.arftlighet_ageofsickness = new_age;
            //$scope.arftlighet_ageofsickness_name = data.data.resultSet["0"].name;
            $scope.arftlighet_ageofsickness_time = convertTime(data.data.resultSet["0"].comp_time);
        }
    })
    //GET arftlighet_reason_for_death AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).reason_for_death).then(function (data) {
        if (data.data.resultSet) {
            $scope.arftlighet_reason_for_death = data.data.resultSet["0"].reason_for_death
            //$scope.arftlighet_reason_for_death_name = data.data.resultSet["0"].name
            $scope.arftlighet_reason_for_death_time = convertTime(data.data.resultSet["0"].comp_time);
        }
    })
    //GET arftlighet_commentary AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).heredity_commentary).then(function (data) {
        if (data.data.resultSet) {
            $scope.arftlighet_commentary = data.data.resultSet["0"].kommentar
            //$scope.arftlighet_commentary_name = data.data.resultSet["0"].name
            $scope.arftlighet_commentary_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET i_pss_incomplete_emptying AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_incomplete_emptying).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_incomplete_emptying = data.data.resultSet["0"].i_pss_incomplete_emptying
            //$scope.i_pss_incomplete_emptying_name = data.data.resultSet["0"].name
            $scope.i_pss_incomplete_emptying_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET i_pss_frequency AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_frequency).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_frequency = data.data.resultSet["0"].i_pss_frequency
            //$scope.i_pss_frequency_name = data.data.resultSet["0"].name
            $scope.i_pss_frequency_time = convertTime(data.data.resultSet["0"].comp_time);
        }
       
    })
    //GET i_pss_urgency AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_urgency).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_urgency = data.data.resultSet["0"].i_pss_urgency;
            //$scope.i_pss_urgency_name = data.data.resultSet["0"].name;
            $scope.i_pss_urgency_time = convertTime(data.data.resultSet["0"].comp_time);
        }
       
    })
    //GET i_pss_intermittency AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_intermittency).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_intermittency = data.data.resultSet["0"].i_pss_intermittency;
            //$scope.i_pss_intermittency_name = data.data.resultSet["0"].name;
            $scope.i_pss_intermittency_time = convertTime(data.data.resultSet["0"].comp_time);
        }
       
    })
    //GET i_pss_stream AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_stream).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_stream = data.data.resultSet["0"].i_pss_stream;
            //$scope.i_pss_stream_name = data.data.resultSet["0"].name;
            $scope.i_pss_stream_time = convertTime(data.data.resultSet["0"].comp_time);
        }
       
    })
    //GET i_pss_straining AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_straining).then(function (data) {
        if (data.data.resultSet) {
            
            $scope.i_pss_straining = data.data.resultSet["0"].i_pss_straining;
            //$scope.i_pss_straining_name = data.data.resultSet["0"].name;
            $scope.i_pss_straining_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET i_pss_nocturia AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_nocturia).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_nocturia = data.data.resultSet["0"].i_pss_nocturia;
            //$scope.i_pss_nocturia_name = data.data.resultSet["0"].name;
            $scope.i_pss_nocturia_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET SUMMARY AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_total_score).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_total_score = data.data.resultSet["0"].i_pss_total_score;
            //$scope.i_pss_total_score_name = data.data.resultSet["0"].name;
            $scope.i_pss_total_score_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET i_pss_QoL_Score AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_QoL_Score).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_QoL_Score = data.data.resultSet["0"].i_pss_QoL_Score;
            //$scope.i_pss_QoL_Score_name = data.data.resultSet["0"].name;
            $scope.i_pss_QoL_Score_time = convertTime(data.data.resultSet["0"].comp_time);
        }
        
    })
    //GET i_pss_confounding_cactors AQL
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).i_pss_confounding_factors).then(function (data) {
        if (data.data.resultSet) {
            $scope.i_pss_confounding_factors = data.data.resultSet["0"].i_pss_confounding_factors;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.i_pss_confounding_factors_time = convertTime(data.data.resultSet["0"].comp_time);
        }
       
    })
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).search_results).then(function (data) {
        if (data.data.resultSet) {
            $scope.search_results = data.data.resultSet["0"].search_results;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.search_results_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })

    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_bilddiagnostik_type_of).then(function (data) {
        if (data.data.resultSet) {
            $scope.prostate_bilddiagnostik_type_of = data.data.resultSet["0"].prostate_bilddiagnostik_type_of;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.prostate_bilddiagnostik_type_of_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_bilddiagnostik_resultstatus).then(function (data) {
        if (data.data.resultSet) {
            $scope.prostate_bilddiagnostik_resultstatus = data.data.resultSet["0"].prostate_bilddiagnostik_resultstatus;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.prostate_bilddiagnostik_resultstatus_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })

    //GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_bilddiagnostik_resultdate).then(function (data) {
    //    if (data.data.resultSet) {
    //        console.warn("data.data.resultSet", data.data.resultSet);
    //        $scope.prostate_bilddiagnostik_resultdate = data.data.resultSet["0"].prostate_bilddiagnostik_resultdate;
    //        //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
    //        $scope.prostate_bilddiagnostik_resultdate_time = convertTime(data.data.resultSet["0"].comp_time);
    //    }

    //})

    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_bilddiagnostik_findings).then(function (data) {
        if (data.data.resultSet) {
            $scope.prostate_bilddiagnostik_findings = data.data.resultSet["0"].prostate_bilddiagnostik_findings;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.prostate_bilddiagnostik_findings_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_bilddiagnostik_conclusion).then(function (data) {
        if (data.data.resultSet) {
            $scope.prostate_bilddiagnostik_conclusion = data.data.resultSet["0"].prostate_bilddiagnostik_conclusion;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.prostate_bilddiagnostik_conclusion_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })
    GetProverFact.getAQLResult(ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).prostate_smartskattning).then(function (data) {
        if (data.data.resultSet) {
            
            $scope.prostate_smartskattning = data.data.resultSet["0"].prostate_smartskattning.magnitude;
            $scope.prostate_smartskattning_units = data.data.resultSet["0"].prostate_smartskattning.units;
            //$scope.i_pss_confounding_cactors_name = data.data.resultSet["0"].name;
            $scope.prostate_smartskattning_time = convertTime(data.data.resultSet["0"].comp_time);
        }

    })


    
    //GetProverFact.getAllProstateResultsValues().then(function (data) {
        
    //    if (data.data.resultSet) {


    //        $scope.prostate_score_variables = {};

            

    //    }
    //});


    $scope.checkedBox = function (date, title, value, event) {

        if (event.toElement.checked) {
            _addElementToCitationList(date, title, value);
            $scope.test = "Added element";
                            
        }
        else {
            _removeElementFromCitationList(date, title, value);
            $scope.test = "Removed element";
        }

    }


    $scope.openForm = function (path, formName, formVersion) {
        window.open(path + '?EHRID=' + getParameterByName("EHRID") + '&formName=' + formName + '&formVersion=' + formVersion + '', "popupWindow", "scrollbars=yes,resizable=yes, width=900,height=800");
        
    };

    $scope.markedForCitationList = [];

    $scope.MarkedUnderlag = function (test_type, value, event) {
        var bgElement = event.currentTarget.parentElement.parentElement.parentElement
        var citation_element = bgElement.childNodes[1]

        if (test_type == null) {
            test_type = "-";
        }

        if (value == null) {
            value = "Inget värde har angetts";
        }

        test_type = test_type.trim();
        value = value.trim();


        if (isElement(citation_element)) {
            if (citation_element.id.startsWith("content") || citation_element.id.startsWith("panel")) { //.startsWith("panel")) {
                setElementBGandAdd(test_type, value, bgElement, citation_element);
                
            }
            else {
                console.log("Not correct element, Can't set background and add element...");
            }
        }
        else {
            console.log("Desired check was not legit, element variable is not an element");
        }
    };

    function _addElementToCitationList(date, title, value) {
        $scope.markedForCitationList.push(_parseElementToJSON(date, title, value));
    }

    function _removeElementFromCitationList(date, title, value) {

        for (itemNumber in $scope.markedForCitationList) {
            if ($scope.markedForCitationList[itemNumber]["Date"] == date &&
                $scope.markedForCitationList[itemNumber]["Title"] == title &&
                $scope.markedForCitationList[itemNumber]["Value"] == value) {

                $scope.markedForCitationList.splice(itemNumber, 1);
            }
        }
    }

    function _parseElementToJSON(date, title, value) {
        var parsedElement = {};
        parsedElement['Date'] = date;
        parsedElement['Title'] = title;
        parsedElement['Value'] = value;

        return parsedElement;
    }

    function isElement(element) {
        // works on major browsers back to IE7
        return element instanceof Element;
    }

    function setElementBGandAdd(test_type, value, bgelement, citation_element) {
        if (!elementHasBG(bgelement)) {
            bgelement.style.backgroundColor = "#91e58e";
            bgelement.style.color = "#2b2b2b";
            _addElementToCitationList(test_type, value, citation_element);
        }

        else {
            bgelement.style.backgroundColor = null;
            bgelement.style.color = null;

            _removeElementFromCitationList(test_type, value, citation_element);
        }
        
    }

    function elementHasBG(element) {
        if (element.style.backgroundColor) {
            return true;
        }
        else {
            return false;
        }
    }

   
}]);


specifik.factory('GetProverFact', ['$http', 'ProvResultatAQLProvider', function ($http, ProvResultatAQLProvider) {

    var aqlProver = "select a as Composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.report-result.v1]" +
    " where a/name/value='Provsvar prostatacancer' and (e/ehr_id/value='" + getParameterByName("EHRID") + "')" + "order by a/context/start_time/value desc offset 0 limit 100";

    var bestallingprovAQL = "select a as Composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.request.v1]" +
    "contains ACTION a_a[openEHR-EHR-ACTION.pathology_test.v1] where a/name/value='Beställning av labprover prostatacancer' and (e/ehr_id/value='" + getParameterByName("EHRID") + "')" +
    "order by a_a/time/value desc offset 0 limit 100";

    var myService = {

        getPSAValues: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.psaAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },

        getBlood_Values: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.bloodValueAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },

        getKreatininValues: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.kreatininAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },


        getKaliumValues: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.kaliumAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },

        getNatriumValues: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.natriumAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },

        getPKINRValues: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.pkinrAQL(getParameterByName("EHRID")) }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
                try {
                }
                catch (e) {

                }
            });
            return promise;
        },


        getAQLResult: function(aql) {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": aql }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {

            });
            return promise
        },


        //getAllProstateResultsValues: function () {
        //    var promise = $http({
        //        url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")) }),
        //        //url: baseUrl + "/query?" + $.param({ "aql": ProvResultatAQLProvider.prostateResultAQL(getParameterByName("EHRID")).summary }),
        //        method: "GET",
        //        headers: {
        //            "Ehr-Session": getSessionId()
        //        }
        //    }).error(function (data, status, header, config) {
        //        alert("Request failed: " + status);

        //    }).success(function (res) {

        //    });
        //    return promise;
        //}


    };

    return myService;

}]);

specifik.factory('GetDemographics', ['$http', function ($http) {

    var myService = {
        promise: function () {
            var promise = $http({
                url: baseUrl + "/demographics/ehr/"+ getParameterByName("EHRID") +"/party?",
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {
            });
            return promise;
        }

    };

    return myService;
}])

specifik.factory('GetObservationresultsFact', ['$scope', function ($scope) {

    var aqlProver = "select e/ehr_id/value as EHRID, a from EHR e contains COMPOSITION a[openEHR-EHR-COMPOSITION.encounter.v1] "
    + "where a/name/value='Besök' order by a/context/start_time/value desc offset 0 limit 100";

    var myService = {
        promise: function () {
            var promise = $http({
                url: baseUrl + "/query?" + $.param({ "aql": aqlProver }),
                method: "GET",
                headers: {
                    "Ehr-Session": getSessionId()
                }
            }).error(function (data, status, header, config) {
                alert("Request failed: " + status);

            }).success(function (res) {

            });
            return promise;
        }

    };

    return myService;

}]);

specifik.factory('GetPatientConsentFact', ['$http', function ($http) {

}]);