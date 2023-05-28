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
	app.factory("demoModel", function (analyserInterface, generatorInterface) {
		return {
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
				generatorInterface,
				analyserInterface,
			],
			units: [
			],
			////
			validate: (channels) => {
				if (channels.length !== 2) {
					throw new Error("Two channels required");
				}
				return true;
			},
			selected_channels: [],
		};
	});
	app.factory("unitGenerator", function (serialGenerator) {
		return function (unit_interface) {
			return {
				serial: serialGenerator.next(),
				type: unit_interface.type,
				title: unit_interface.title,
				channels: [],
				interface: unit_interface.interface.map(
					column => column.map(
						({ value, ...properties }) =>
						({ ...properties, serial: serialGenerator.next() })
					)
				),
				values: unit_interface.interface.flat()
					.map(({ name, value }) => ({ name, value }))
					.reduce((values, { name, value }) => {
						values[name] = value;
						return values;
					}, {}),
			};
			return unit;
		};
	});
	app.controller("main", function ($scope, demoModel, analyserInterface, generatorInterface, unitGenerator) {
		Object.assign($scope, demoModel);
		Object.assign($scope, {
			add_functional_unit: (unit_type) => {
				$scope.units.push(unitGenerator(unit_type));
			},
		});
	});
})();
