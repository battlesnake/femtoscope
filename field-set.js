(() => {
	const app = angular.module('femtoscope');
	app.directive("fieldSet", function () {
		return {
			restrict: "E",
			replace: true,
			templateUrl: "field-set.html",
			scope: {
				fields: "=fields",
				values: "=values",
			},
		};
	});
})();
