(() => {
	const app = angular.module('femtoscope');
	app.controller("fieldSet", function ($scope) {
		Object.assign($scope, {
		});
	});
	app.directive("fieldSet", function () {
		return {
			controller: "fieldSet",
			restrict: "E",
			templateUrl: "field-set.html",
			scope: {
				fields: "=fields",
				values: "=values",
			},
		};
	});
})();
