
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

        return "select e/ehr_id/value as EHRID, a_a/items[at0002]/items[at0001, 'Värde (g/l)']"+
            "/value/value as test_value, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']"+
            "/value/value as Typ_av_test, a_b/data[at0001]/events[at0002]/time/value as time_value, a/uid/value as compid"+
            " from EHR e contains COMPOSITION a contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION"+
            " a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']"+
            "/value/value='Blodvärde (Hb)' and exists a_a/items[at0002]/items[at0001, 'Värde (g/l)']/value/value and e/ehr_id/value='b3b2aaad-8a79-4441-a499-8895a531da29' "+
            "order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";

    };

    //Gets the Kreatini values from "Provsvar Prostatcancer" template in descending order.
    this.kreatininAQL = function (ehrid) {
        return "select e/ehr_id/value as EHRID, a_a/items[at0002]/items[at0001, 'Värde (mmol/l)']/value as test_value" +
          ", a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value as Typ_av_test" +
          ", a_b/data[at0001]/events[at0002]/time/value as time_value, a/uid/value as compid from EHR e contains COMPOSITION a" +
          " contains ( CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where" +
          " a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value='Kreatinin' and exists" +
          " a_a/items[at0002]/items[at0001, 'Värde (mmol/l)']/value and e/ehr_id/value='" + ehrid + "'" +
          " order by a_b/data[at0001]/events[at0002]/time/value desc offset 0 limit 100";
    };

    ////Gets the Kalium values from "Provsvar Prostatcancer" template in descending order.
    //this.kaliumAQL = function (ehrid) {
    //    return "select a_b/data[at0001]/events[at0002]/time/value as time_value, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value as Typ_av_test" +
    //        ", a_a/items[at0002]/items[at0001, 'Värde (mmol/l)']/value/value as test_value, a/uid/value, e/ehr_id/value as EHRID" +
    //        " from EHR e contains COMPOSITION a contains (CLUSTER a_a[openEHR-EHR-CLUSTER.laboratory_test_panel.v0] and OBSERVATION "+
    //        "a_b[openEHR-EHR-OBSERVATION.laboratory_test.v0]) where exists a_a/items[at0002]/items[at0001, 'Värde (mmol/l)']/value/value "
    //    "and a_b/data[at0001]/events[at0002]/data[at0003]/items[at0005, 'Typ av test']/value/value='Kalium' and e/ehr_id/value='" + ehrid + "' "+
    //    "order by a_b/data[at0001]/events[at0002]/time/value offset 0 limit 100";
    //}
    
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
            summary: "select a_a/data[at0001]/items[at0002, 'Ärftlighet']/value/value as Summary, a_a/data[at0001]/items[at0002, 'Ärftlighet']/name/value as name, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0002, 'Ärftlighet']/value/value"+
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            relation_to_patient: "select a_a/data[at0001]/items[at0003]/items[at0016, 'Relation till patienten']/value/value as Relation_till_patienten, a_a/data[at0001]/items[at0003]/items[at0016, 'Relation till patienten']/name/value as name,a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0016, 'Relation till patienten']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            age_of_sickness: "select a_a/data[at0001]/items[at0003]/items[at0008]/items[at0010, 'Ålder vid insjuknandet']/value/value as age_of_sickness, a_a/data[at0001]/items[at0003]/items[at0008]/items[at0010, 'Ålder vid insjuknandet']/name/value as name, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0008]/items[at0010, 'Ålder vid insjuknandet']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            reason_for_death: "select a_a/data[at0001]/items[at0003]/items[at0008]/items[at0014, 'Dödsorsak']/value/value as reason_for_death, a_a/data[at0001]/items[at0003]/items[at0008]/items[at0014, 'Dödsorsak']/name/value as name, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0008]/items[at0014, 'Dödsorsak']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            heredity_commentary: "select a_a/data[at0001]/items[at0003]/items[at0046, 'Kommentar']/value/value as kommentar, a_a/data[at0001]/items[at0003]/items[at0046, 'Kommentar']/name/value as name, a/context/start_time/value as comp_time, e/ehr_id/value as EHRID from" +
                " EHR e contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.family_history.v2] where exists a_a/data[at0001]/items[at0003]/items[at0046, 'Kommentar']/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",

            i_pss_incomplete_emptying: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0013]/value/value as i_pss_incomplete_emptying, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0013]/name/value as name, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/"+
                "data[at0003]/items[at0013]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_frequency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0020]/value/value as i_pss_frequency, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0020]/name/value as name, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/" +
                "data[at0003]/items[at0020]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_urgency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0035]/value/value as i_pss_urgency, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0035]/name/value as name, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/" +
                "data[at0003]/items[at0035]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_intermittency: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0028]/value/value as i_pss_intermittency, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0028]/name/value as name, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0028]/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_stream: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value as i_pss_stream, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0042]/name/value as name, a/context/start_time/value as comp_time," +
                " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value" +
                " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_straining: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/value/value as i_pss_straining, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/name/value as name, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/name/value as name, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0049]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_nocturia: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0056]/value/value as i_pss_nocturia, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0056]/name/value as name, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0056]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_total_score: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0063]/value/magnitude as i_pss_total_score, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0063]/name/value as name, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0063]/value/magnitude" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_QoL_Score: "select a_b/data[at0001]/events[at0002]/data[at0003]/items[at0064]/value/value as i_pss_QoL_Score, a_b/data[at0001]/events[at0002]/data[at0003]/items[at0064]/name/value as name, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/data[at0003]/items[at0064]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            i_pss_confounding_factors: "select a_b/data[at0001]/events[at0002]/state[at0074]/items[at0075]/value/value as i_pss_confounding_factors, a_b/data[at0001]/events[at0002]/state[at0074]/items[at0075]/name/value as name, a/context/start_time/value as comp_time," +
                    " e/ehr_id/value as EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_b[openEHR-EHR-OBSERVATION.i_pss_prostate_score.v0] where exists a_b/data[at0001]/events[at0002]/state[at0074]/items[at0075]/value/value" +
                    " and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 1",
            search_results: "select a/context/start_time/value as comp_time, e/ehr_id/value as EHRID, a_a/data[at0001]/events[at0002]/data[at0003]/"+
                "items[at0004, 'Undersökningsresultat']/value/value as search_results from EHR e contains COMPOSITION a contains OBSERVATION" +
                " a_a[openEHR-EHR-OBSERVATION.exam.v1] where exists a_a/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Undersökningsresultat']"+
                "/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100",
            prostate_bilddiagnostik_type_of: "select a_c/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Typ av bilddiagnostisk undersökning']/value/value as prostate_bilddiagnostik_type_of"+
                ", a_c/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Typ av bilddiagnostisk undersökning']/name/value as name, a/context/start_time/value as comp_time, e/ehr_id/value as "+
                "EHRID from EHR e contains COMPOSITION a contains OBSERVATION a_c[openEHR-EHR-OBSERVATION.imaging_exam.v0] where exists a_c/data[at0001]/events[at0002]/data[at0003]/"+
                "items[at0004, 'Typ av bilddiagnostisk undersökning']/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100",
            prostate_bilddiagnostik_resultstatus: "select a/context/start_time/value as comp_time, e/ehr_id/value as EHRID, a_a/data[at0001]/events[at0002]/data[at0003]/items"+
                "[at0007, 'Status på undersökningsresultat']/value/value as prostate_bilddiagnostik_resultstatus from EHR e contains COMPOSITION a contains" +
                " OBSERVATION a_a[openEHR-EHR-OBSERVATION.imaging_exam.v0] where exists a_a/data[at0001]/events[at0002]/data[at0003]/items"+
                "[at0007, 'Status på undersökningsresultat']/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100",
            //
            //prostate_bilddiagnostik_resultdate: "select a/context/start_time/value as comp_time, e/ehr_id/value as EHRID, a_a/data[at0001]/events[at0002]/data[at0003]/items[at0024, 'Datum för undersökningsresultat']/value/value as prostate_bilddiagnostik_resultdate from EHR e contains COMPOSITION a contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.imaging_exam.v0] order by a/context/start_time/value desc offset 0 limit 100",
            prostate_bilddiagnostik_findings: "select a/context/start_time/value as comp_time, e/ehr_id/value as EHRID, a_a/data[at0001]/events[at0002]/data[at0003]/items[at0008, 'Fynd']"+
                "/value/value as prostate_bilddiagnostik_findings from EHR e contains COMPOSITION a contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.imaging_exam.v0] where exists a_a/data[at0001]" +
                "/events[at0002]/data[at0003]/items[at0008, 'Fynd']/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100",
            prostate_bilddiagnostik_conclusion: "select e/ehr_id/value as EHRID, a/context/start_time/value as comp_time, a_a/data[at0001]/events[at0002]/data[at0003]/items"+
                "[at0021]/value/value as prostate_bilddiagnostik_conclusion from EHR e contains COMPOSITION a contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.imaging_exam.v0]" +
                " where exists a_a/data[at0001]/events[at0002]/data[at0003]/items[at0021]/value/value and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100",
            prostate_smartskattning: "select e/ehr_id/value as EHRID, a_a/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Smärtskattning']"+
                "/value as prostate_smartskattning, a/context/start_time/value as comp_time from EHR e contains COMPOSITION a contains OBSERVATION"+
                " a_a[openEHR-EHR-OBSERVATION.enkel_numerisk_registrering.v1] where exists a_a/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Smärtskattning']"+
                "/value/magnitude and exists a_a/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Smärtskattning']/value/units and e/ehr_id/value='" + ehrid + "' order by a/context/start_time/value desc offset 0 limit 100"
        }

        
        return results;
    }

});