(() => {
	const app = angular.module('femtoscope');
	app.controller("generator", function ($scope, generatorSpecification) {
		$scope.interface = generatorSpecification.interface;
		$scope.validate_channels = (channels) => {
			if (channels.length === 0) {
				throw new Error("No channels selected");
			}
			if (channels.length > 4) {
				throw new Error("Too many channels selected");
			}
		};
		$scope.config = generatorSpecification.interface
			.flat()
			.map(({ name, value }) => ({ name, value }))
			.reduce((values, { name, value }) => {
				values[name] = value;
				return values;
			}, { channels: [] });
	});
	app.directive("generator", function () {
		return {
			controller: 'generator',
			restrict: 'E',
			templateUrl: 'generator.html',
			replace: true,
			scope: {
				channels: '=channels',
			},
		};
	});
	app.factory("generatorSpecification", function (templateLevelField, templateFrequencyField) {
		return {
			type: "generator",
			title: "Generator",
			interface: [
				[
					{
						title: "Active",
						name: "active",
						view: "switch",
						value: false,
					},
					{
						title: "Frequency",
						name: "frequency",
						...templateFrequencyField,
						value: 440,
					},
					{
						title: "Amplitude",
						name: "amplitude",
						...templateLevelField,
						value: -6,
					},
					{
						title: "Differential",
						name: "differential",
						view: "switch",
						value: false,
					},
					{
						title: "Shape",
						name: "shape",
						view: "choice",
						value: "sine",
						choices: [
							{
								value: "sine",
								label: "Sine",
							},
							{
								value: "square",
								label: "Square",
							},
							{
								value: "sawtooth",
								label: "Sawtooth",
							},
						],
					},
				],
				[
				],
			]
		};
	});
})();
