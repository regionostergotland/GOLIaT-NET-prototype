
var app = angular.module("aql_services_module", []);

app.service('ProvResultatAQLProvider', function () {

    //Gets the PSA values from "Provsvar Prostatcancer" template in descending order.
    this.psaAQL = function (ehrid) {

        return "select e/ehr_id/value as EHRID, a_a/items[at0002]/items[at0001, 'Värde (mikrogram/liter)']/value/value as test_value"+
            ", a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value as Typ_av_test"+
            ", a_b/data[at0001]/events[at0002]/time/value as time_value, a/uid/value as compid from EHR e contains COMPOSITION a"+
            " contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where"+
            " a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value='PSA' and exists"+
            " a_a/items[at0002]/items[at0001, 'Värde (mikrogram/liter)']/value/value and e/ehr_id/value='" + ehrid + "'"+
            " order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";
    };


    //Gets the Bloodvalue (Hb) values from "Provsvar Prostatcancer" template in descending order.
    this.bloodValueAQL = function (ehrid) {

        return "select e/ehr_id/value as EHRID, a_a/items[at0002]/items[at0001, 'Värde']/value/value as test_value" +
           ", a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value as Typ_av_test" +
           ", a_b/data[at0001]/events[at0002]/time/value as time_value, a/uid/value as compid from EHR e contains COMPOSITION a" +
           " contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where" +
           " a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value='Blodvärde (Hb)' and exists" +
           " a_a/items[at0002]/items[at0001, 'Värde']/value/value and e/ehr_id/value='" + ehrid + "'"+
           " order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";

    };

    //Gets the Kreatini values from "Provsvar Prostatcancer" template in descending order.
    this.kreatininAQL = function (ehrid) {
        return "select e/ehr_id/value as EHRID, a_a/items[at0002]/items[at0001, 'Värde']/value as test_value" +
          ", a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value as Typ_av_test" +
          ", a_b/data[at0001]/events[at0002]/time/value as time_value, a/uid/value as compid from EHR e contains COMPOSITION a" +
          " contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where" +
          " a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value='Kreatinin' and exists" +
          " a_a/items[at0002]/items[at0001, 'Värde']/value/magnitude and e/ehr_id/value='" + ehrid + "'" +
          " order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";
    };

    //Gets the Kalium values from "Provsvar Prostatcancer" template in descending order.
    this.kaliumAQL = function (ehrid) {


        return "select a_a as composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains ( OBSERVATION a_a[openEHR-EHR-OBSERVATION.laboratory_test.v0] a"+
        "nd CLUSTER a_b[openEHR-EHR-CLUSTER.laboratory_test_panel.v0]) where a_a/data[at0001]/events[at0002]/data[at0003]/items[at0005,"+
        "'Typ av test']/value/value='Kalium' and exists a_b/items[at0002]/items[at0001, 'Värde (mmol/l)']/value/value and e/ehr_id/value='" + ehrid + "' order by a_a/data[at0001]/"+
        "events[at0002]/time/value desc offset 0 limit 100";

    };

    //Gets the Natrium values from "Provsvar Prostatcancer" template in descending order.
    this.natriumAQL = function (ehrid) {


        return "select a_a as composition, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains ( OBSERVATION a_a[openEHR-EHR" +
        "-OBSERVATION.laboratory_test.v0] and CLUSTER a_b[openEHR-EHR-CLUSTER.laboratory_test_panel.v0]) where a_a/data[at0001]/events[at0002]/data[at0003]/items"+
            "[at0005, 'Typ av test']/value/value='Natrium' and exists a_b/items[at0002]/items[at0001, 'Värde (mmol/l)']/value/value and e/ehr_id/value="+
        "'" + ehrid + "' order by a_a/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";

    };
    this.pkinrAQL = function (ehrid) {

        return "select a_b as composition, a_b/data[at0001]/events[at0002]/time/value as time_value, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005" +
            ", 'Typ av prov']/value/value as Typ_av_test, a_a/items[at0002]/items[at0001, 'Värde']/value/value as test_value, a/uid/value as " +
            "compid, e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel." +
            "v0] and OBSERVATION a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, " +
            "'Typ av prov']/value/value='PK-INR' and exists a_a/items[at0002]/items[at0001, 'Värde']/value/value and e/ehr_id/value=" +
            "'" + ehrid + "' order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";

    };
    this.prostateResultAQL = function (ehrid) {

        var results = {
            summary: "select a_a/data[at0001]/items[at0002, 'Ärftlighet']/value/value as Summary, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from"+
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0002, 'Ärftlighet']/value/value"+
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            relation_to_patient: "select a_a/data[at0001]/items[at0003]/items[at0016, 'Relation till patienten']/value/value as Relation_till_patienten, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0016, 'Relation till patienten']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            age_of_sickness: "select a_a/data[at0001]/items[at0003]/items[at0008]/items[at0010, 'Ålder vid insjuknandet']/value/value as age_of_sickness, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0008]/items[at0010, 'Ålder vid insjuknandet']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            reason_for_death: "select a_a/data[at0001]/items[at0003]/items[at0008]/items[at0014, 'Dödsorsak']/value/value as reason_for_death, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0008]/items[at0014, 'Dödsorsak']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            heredity_commentary: "select a_a/data[at0001]/items[at0003]/items[at0046, 'Kommentar']/value/value as kommentar, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0046, 'Kommentar']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            i_pss_incomplete_emptying: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0013]/value/value as i_pss_incomplete_emptying, a/context/start_time/value as comp_time,"+
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/"+
                "data[at0003]/items[at0013]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_frequency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0020]/value/value as i_pss_frequency, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/" +
                "data[at0003]/items[at0020]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_urgency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0035]/value/value as i_pss_urgency, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/" +
                "data[at0003]/items[at0035]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_intermittency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0028]/value/value as i_pss_intermittency, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0028]/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_stream: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value as i_pss_stream, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_straining: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/value/value as i_pss_straining, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_nocturia: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0056]/value/value as i_pss_nocturia, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0056]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_total_score: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0063]/value/magnitude as i_pss_total_score, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0063]/value/magnitude" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_QoL_Score: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0064]/value/value as i_pss_QoL_Score, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0064]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_confounding_cactors: "select a_b/data[at0001]/events[at0002]/state[at0074]/items[at0075]/value/value as i_pss_confounding_cactors, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/state[at0074]/items[at0075]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1"
            }
        
        return results;
    }

});