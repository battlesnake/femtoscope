(() => {
	const app = angular.module('femtoscope');
	app.factory("analyserInterface", function (templateLevelField, templateFrequencyField) {
		return {
			type: "analyser",
			title: "Analyser",
			inputs: {
				min: 1,
				max: 4,
			},
			outputs: {
				min: 0,
				max: 0,
			},
			interface: [
				[
					{
						title: "Time-domain",
						view: "section",
					},
					{
						title: "Active",
						name: "td_active",
						view: "switch",
						value: true,
					},
					{
						title: "Minimum amplitude (y)",
						name: "ymin",
						...templateLevelField,
						value: -120,
					},
					{
						title: "Maximum amplitude (y)",
						name: "ymax",
						...templateLevelField,
						value: 0,
					},
					{
						title: "Timeslice (x)",
						name: "tmax",
						view: "slider",
						value: 100,
						unit: "ms",
						min: 1,
						max: 1000,
						step: 1,
					},
					{
						title: "RMS",
						name: "rms",
						...templateLevelField,
						readonly: true,
						value: NaN,
					},
					{
						title: "Peak amplitude",
						name: "peak_amplitude",
						...templateLevelField,
						readonly: true,
						value: NaN,
					},
					{
						title: "Scope",
						view: "visual",
					},
				],
				[
					{
						title: "Frequency-domain",
						view: "section",
					},
					{
						title: "Active",
						name: "fd_active",
						view: "switch",
						value: true,
					},
					{
						title: "Spectral peak amplitude",
						name: "peak_frequency_amplitude",
						...templateLevelField,
						readonly: true,
						value: NaN,
					},
					{
						title: "Spectral peak frequency",
						name: "peak_frequency",
						...templateFrequencyField,
						readonly: true,
						value: NaN,
					},
					{
						title: "THD+N",
						name: "thdn",
						...templateLevelField,
						readonly: true,
						value: NaN,
					},
					{
						title: "Logarithmic frequency axis",
						name: "flog",
						view: "switch",
						value: true,
					},
					{
						title: "Spectrum",
						view: "visual",
					},
				],
			],
		};
	});
})();
