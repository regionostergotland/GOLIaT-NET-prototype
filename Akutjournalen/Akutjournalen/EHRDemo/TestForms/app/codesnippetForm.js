
var form = newVal;

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
			console.log(success);
		},

		function (fail) {
			console.error("Fail", fail);
		})
	;
}