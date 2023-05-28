(() => {

	const app = angular.module('femtoscope');
	app.value("templateLevelField", {
		view: "slider",
		unit: "dB",
		min: -200,
		max: 20,
		step: 1,
	});
	app.value("templateFrequencyField", {
		view: "slider",
		unit: "Hz",
		min: 10,
		max: 48000,
		step: 1,
	});
	app.service("serialGenerator", function () {
		let next_serial = 1;
		this.next = () => "M" + next_serial++;
	});
	app.directive('numericModel', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, element, attrs, ngModel) {
				ngModel.$parsers.push(function(val) {
					ngModel.$setValidity('number', false, ngModel);
					try {
						return parseInt(val, 10);
					} catch (err) {
						return undefined;
					}
					ngModel.$setValidity('number', true, ngModel);
				});
				ngModel.$formatters.push(function(val) {
					return String(val);
				});
			}
		};
	});
	app.constant("demoModel", {
		channels: [
			{
				type: 'source',
				device: 'Mic',
				index: 0,
			},
			{
				type: 'source',
				device: 'Mic',
				index: 1,
			},
			{
				type: 'source',
				device: 'Other mic',
				index: 0,
			},
			{
				type: 'source',
				device: 'Yet another mic',
				index: 0,
			},
			{
				type: 'sink',
				device: 'Speakers',
				index: 0,
			},
			{
				type: 'sink',
				device: 'Speakers',
				index: 1,
			},
			{
				type: 'sink',
				device: 'Headphones',
				index: 0,
			},
			{
				type: 'sink',
				device: 'Headphones',
				index: 1,
			},
		],
		unit_types: [
			{
				name: 'analyser',
				title: 'Analyser',
			},
			{
				name: 'generator',
				title: 'Generator',
			},
		],
		units: [
		],
	});
	app.controller("main", function ($scope, demoModel, serialGenerator) {
		Object.assign($scope, demoModel);
		Object.assign($scope, {
			add_functional_unit: (unit_type) => {
				$scope.units.push({
					serial: serialGenerator.next(),
					type: unit_type.name,
					title: unit_type.title,
				});
			},
		});
	});
})();
