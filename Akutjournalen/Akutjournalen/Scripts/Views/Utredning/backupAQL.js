data.data.resultSet.forEach(function (element, index) {

	//Heritendy
	if (!$scope.arftlighet_summary) {
		try {
			console.log("HEJEJEJ");
			$scope.arftlighet_summary = element.composition.content["0"].data.items[0].value.value;
			$scope.arftlighet_summary_time = convertTime(element.time_comp_created);
		} catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	if (!$scope.arftlighet_relation_to_patient) {
		try {
			$scope.arftlighet_relation_to_patient = element.composition.content["0"].data.items[1].items[0].value.value
		   
		} catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
		$scope.arftlighet_relation_to_patient_time = convertTime(element.time_comp_created);

	}
	if (!$scope.arftlighet_ageofsickness) {
		try { $scope.arftlighet_ageofsickness = element.composition.content["0"].data.items[1].items[1].items[1].value.value; } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.arftlighet_reason_for_death) {
		try { $scope.arftlighet_reason_for_death = element.composition.content["0"].data.items[1].items[1].items[2].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	if (!$scope.arftlighet_commentary) {
		try { $scope.arftlighet_commentary = element.composition.content["0"].data.items[1].items[2].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	//I-PSS
	if (!$scope.prostate_score_variables.Incomplete_emptying) {
		try { $scope.prostate_score_variables.Incomplete_emptying = element.composition.content["1"].data.events[0].data.items[0].value.symbol.value; } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Frequency) {
		try { $scope.prostate_score_variables.Frequency = element.composition.content["1"].data.events[0].data.items[1].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Urgency) {
		try { $scope.prostate_score_variables.Urgency = element.composition.content["1"].data.events[0].data.items[2].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Intermittency) {
		try { $scope.prostate_score_variables.Intermittency = element.composition.content["1"].data.events[0].data.items[3].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Weak_Stream) {
		try { $scope.prostate_score_variables.Weak_Stream = element.composition.content["1"].data.events[0].data.items[4].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Straining) {
		try { $scope.prostate_score_variables.Straining = element.composition.content["1"].data.events[0].data.items[5].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Nocturia) {
		try { $scope.prostate_score_variables.Nocturia = element.composition.content["1"].data.events[0].data.items[6].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Total_score) {
		try { $scope.prostate_score_variables.Total_score = element.composition.content["1"].data.events["0"].data.items[7].value.magnitude } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.QoL_Score) {
		try { $scope.prostate_score_variables.QoL_Score = element.composition.content["1"].data.events["0"].data.items[8].value.symbol.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_score_variables.Confounding_Factors) {
		try {
			$scope.prostate_score_variables.Confounding_Factors = element.composition.content["1"].data.events["0"].state.items["0"].value.value} catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
		$scope.prostate_score_variables.Confounding_Factors_time = convertTime(element.time_comp_created);
	}

	//Palpation
	if (!$scope.search_results) {
		try { $scope.search_results = element.composition.content["2"].data.events["0"].data.items["0"].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	//Bilddiagnostik
	if (!$scope.prostate_bilddiagnostik_typeof) {
		try { $scope.prostate_bilddiagnostik_typeof = element.composition.content["3"].data.events[0].data.items[0].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	if (!$scope.prostate_bilddiagnostik_resultdate) {
		try {
			var new_date = element.composition.content["3"].data.events[0].data.items[1].value.value.substring(0, 10);
			$scope.prostate_bilddiagnostik_resultdate = new_date
			//$scope.prostate_bilddiagnostik_resultdate = element.bilddiagnostik.data.events[0].data.items[1].value.value
		} catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_bilddiagnostik_resultstatus) {
		try { $scope.prostate_bilddiagnostik_resultstatus = element.composition.content["3"].data.events[0].data.items[2].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_bilddiagnostik_findings) {
		try { $scope.prostate_bilddiagnostik_findings = element.composition.content["3"].data.events["0"].data.items[3].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}
	if (!$scope.prostate_bilddiagnostik_conclusion) {
		try { $scope.prostate_bilddiagnostik_conclusion = element.composition.content["3"].data.events["0"].data.items[4].value.value } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	//Skelettsmärta
	if (!$scope.prostate_numerical) {
		try { $scope.prostate_numerical = element.composition.content["4"].data.events["0"].data.items["0"].value.magnitude; console.log("pop",element.composition.content["4"].data.events["0"].data.items["0"].value.magnitude) } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}
	}

	if (!$scope.prostate_numerical_units) {
		try { $scope.prostate_numerical_units = element.composition.content["4"].data.events["0"].data.items["0"].value.units } catch (err) {
			console.warn("Caught error exception but continues for-each loop... ", err);
		}

	}

});