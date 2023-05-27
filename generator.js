(() => {
	const app = angular.module('femtoscope');
	app.factory("generatorInterface", function (templateLevelField, templateFrequencyField) {
		return {
			type: "generator",
			title: "Generator",
			inputs: {
				min: 0,
				max: 0,
			},
			outputs: {
				min: 1,
				max: 8,
			},
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
			]
		};
	});
})();
