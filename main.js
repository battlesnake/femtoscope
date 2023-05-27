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
	app.factory("demoModel", function (serialGenerator) {
		return {
			source_channels: [
				{
					device: 'Mic',
					index: 0,
					serial: serialGenerator.next(),
					selected: false,
					mapped: false
				},
				{
					device: 'Mic',
					index: 1,
					serial: serialGenerator.next(),
					selected: false,
					mapped: false
				},
			],
			sink_channels: [
				{
					device: 'Speakers',
					index: 0,
					serial: serialGenerator.next(),
					selected: false,
					mapped: false
				},
				{
					device: 'Speakers',
					index: 1,
					serial: serialGenerator.next(),
					selected: false,
					mapped: false
				},
			],
			source_unit_types: [
				{
					title: "Generator",
					type: "generator",
				},
			],
			sink_unit_types: [
				{
					title: "Analyser",
					type: "analyser",
				},
			],
			units: [
			]
		};
	});
	app.factory("unitGenerator", function (serialGenerator) {
		return function (channels, unit_interface) {
			for (const channel of channels) {
				channel.selected = false;
				channel.mapped = true;
			}
			return {
				serial: serialGenerator.next(),
				type: unit_interface.type,
				title: unit_interface.title,
				channels: [...channels],
				interface: unit_interface.interface.map(
					({ value, ...properties }) =>
					({ ...properties, serial: serialGenerator.next() })
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
			map_channels_to_new_unit: (type, channels) => {
				if (type.type === "analyser") {
					$scope.units.push(unitGenerator(channels, analyserInterface));
				} else if (type.type === "generator") {
					$scope.units.push(unitGenerator(channels, generatorInterface));
				} else {
					throw new Error(`Invalid unit-type: ${type.type}`);
				}
			},
		});
	});
})();
