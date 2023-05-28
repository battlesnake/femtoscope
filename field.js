(() => {
	const app = angular.module('femtoscope');
	app.controller("field", function ($scope, serialGenerator) {
		Object.assign($scope, {
			serial: serialGenerator.next(),
			is_disabled: () => $scope.definition.readonly || $scope.definition.is_disabled?.($scope.values),
		});
	});
	app.directive("field", function () {
		return {
			controller: "field",
			restrict: "E",
			replace: true,
			templateUrl: "field.html",
			scope: {
				definition: "=definition",
				values: "=values",
			},
		};
	});
})();
