(() => {
	const app = angular.module('femtoscope');
	app.factory("bootstrap", function () {
		return bootstrap;
	});
	app.controller('bootstrapDropdown', function ($scope) {
		$scope.$on('bootstrapDropdown', (event, name, command) => {
			if (name !== $scope.name) {
				return;
			}
			if (command === 'show') {
				$scope.dropdown.show();
			} else if (command === 'hide') {
				$scope.dropdown.hide();
			} else if (command === 'toggle') {
				$scope.dropdown.toggle();
			}
		});
	});
	app.directive("bootstrapDropdown", function (bootstrap) {
		return {
			controller: 'bootstrapDropdown',
			restrict: "A",
			scope: {
				'name': '@bootstrapDropdown',
			},
			link: (scope, element, attrs, controller) => {
				const dropdown = new bootstrap.Dropdown(element[0]);
				scope.dropdown = dropdown;
				element[0].addEventListener('show.bs.dropdown', () => {
					scope.$emit("bootstrapDropdown", scope.name, "on-show");
				});
				element[0].addEventListener('hide.bs.dropdown', () => {
					scope.$emit("bootstrapDropdown", scope.name, "on-hide");
				});
			},
		};
	});
})();
