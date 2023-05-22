const example_model = {
	next_serial: 1,
	source_channels: [
		{
			device: 'A device',
			index: 0,
			serial: 100,
			marked: false,
			mapped: false
		}
	],
	units: [
		{
			type: 'analyser',
			name: 'Analyser',
			serial: 200,
			mapping: {
				description: 'potato'
			},
			parameters: [
				{
					name: 'Slider',
					view: 'slider',
					serial: 300,
					min: -10,
					max: 10,
					step: 2,
					value: 4
				},
				{
					name: 'Switch',
					view: 'switch',
					serial: 400,
					value: false
				}
			]
		}
	]
};


(() => {
	const app = angular.module('femtoscope', []);
	app.controller("main_controller", function ($scope) {
		Object.assign($scope, example_model);
		const create_serial = () => {
			return "m" + $scope.next_serial++;
		};
		$scope.marked_channels = () => $scope.source_channels.filter(channel => channel.marked && !channel.mapped);
		$scope.create_analyser = () => {
			const ports = $scope.marked_channels();
			if (ports.length === 0) {
				return;
			}
			for (const port of ports) {
				port.marked = false;
				port.mapped = true;
			}
			$scope.units.push({
				type: 'analyser',
				name: 'Analyser',
				serial: create_serial(),
				mapping: {
					ports: ports,
					description: ports.map(port => `{port.device} : #${port.index}`).join(", ")
				},
				parametersr: [
					{
						name: 'Switch',
						view: 'switch',
						serial: 400,
						value: false
					}
				]
			});
		};
	});
})();





(() => {

const SAMPLE_RATE = 96000;
const FFT_SIZE = 16384;

let generator;
let analyser;

function on_async_error(error) {
	console.error(error);
	console.error(error.stack);
};

function to_db(level) {
	return 20 * Math.log10(level);
}

function to_level(db) {
	return Math.pow(10, db / 20);
}

function form_item(form_name) {
	return (item_name) => {
		const name = form_name + "-" + item_name;
		const element = document.getElementById(name);
		if (!element) {
			throw new Error("Invalid element: " + name);
		}
		return element;
	}
}

function create_context(options) {
	return new AudioContext({ sampleRate: SAMPLE_RATE, ...options });
}

function Generator(context) {
	const $ = form_item("generator");
	const ctrl_shape = $("shape");
	const ctrl_frequency = $("frequency");
	const ctrl_level = $("level");
	const ctrl_level_label = $("level-label");

	const oscillator1 = context.createOscillator();
	const oscillator2 = context.createOscillator();
	const gainNode1 = context.createGain();
	const gainNode2 = context.createGain();
	const mergeNode = context.createChannelMerger(2);

	oscillator1.type = "sine";
	oscillator2.type = "sine";
	gainNode1.gain.value = 0;
	gainNode2.gain.value = 0;

	oscillator1.connect(gainNode1);
	oscillator2.connect(gainNode2);
	gainNode1.connect(mergeNode, 0, 0);
	gainNode2.connect(mergeNode, 0, 1);
	mergeNode.connect(context.destination);

	oscillator1.start();
	oscillator2.start();

	const update = () => {
		const shape = ctrl_shape.value;
		const frequency = parseFloat(ctrl_frequency.value);
		const level_db = parseFloat(ctrl_level.value);
		const level = to_level(level_db);
		if (![frequency, level_db, level].every(x => isFinite(x))) {
			return;
		}
		oscillator1.type = shape;
		oscillator2.type = shape;
		oscillator1.frequency.value = frequency;
		oscillator2.frequency.value = frequency;
		gainNode1.gain.value = level;
		gainNode2.gain.value = -level;
		ctrl_level_label.textContent = level_db.toFixed(1) + " dB";
	};

	const fields = [
		"frequency",
		"level",
		"shape",
	];

	const bind = () => {
		for (const ctrl of fields.map($)) {
			ctrl.addEventListener("input", update);
		}
	};

	const unbind = () => {
		for (const ctrl of fields.map($)) {
			ctrl.removeEventListener("input", update);
		}
	};

	this.close = () => {
		unbind();
		context.close();
	};

	bind();
	update();
}

function Analyser(context, source_stream) {
	const $ = form_item("analyser");
	const ctrl_frame_rate = $("frame-rate");
	const ctrl_frame_rate_label = $("frame-rate-label");
	const ctrl_frequency = $("frequency");
	const ctrl_level = $("level");
	const ctrl_thd = $("thd");
	const ctrl_ylog = $("log-frequency");
	const ctrl_ymin = $("ymin");
	const ctrl_ymin_label = $("ymin-label");
	const ctrl_ymax = $("ymax");
	const ctrl_ymax_label = $("ymax-label");
	const ctrl_scope = $("scope");
	const ctrl_scope_ne = $("scope-ne");
	const ctrl_scope_nw = $("scope-nw");
	const ctrl_scope_se = $("scope-se");
	const ctrl_scope_sw = $("scope-sw");
	const ctrl_spectrum = $("spectrum");
	const ctrl_spectrum_ne = $("spectrum-ne");
	const ctrl_spectrum_nw = $("spectrum-nw");
	const ctrl_spectrum_se = $("spectrum-se");
	const ctrl_spectrum_sw = $("spectrum-sw");

	const ctx_scope = ctrl_scope.getContext('2d');
	const ctx_spectrum = ctrl_spectrum.getContext('2d');

	const fft_size = FFT_SIZE;

	const channel_count = source_stream.getAudioTracks()[0].getSettings().channelCount;
	const source = context.createMediaStreamSource(source_stream);
	const splitter = context.createChannelSplitter(2);
	const analysers = new Array(channel_count).fill(null).map(() => context.createAnalyser());

	for (const analyser of analysers) {
		analyser.fftSize = fft_size;
		analyser.smoothingTimeConstant = 0;
	}

	const sample_rate = context.sampleRate;
	const fmin = 0;
	const fmax = sample_rate / 2;
	const fft_bin_count = analysers[0].frequencyBinCount;
	const fft_bin_size = fmax / fft_bin_count;

	const data_t = new Float32Array(fft_size);
	const data_f = new Float32Array(fft_size);

	let frame_rate = 15;

	let ymin_db = 0;
	let ymin = 1;

	let ymax_db = 0;
	let ymax = 1;

	let ylog = false;

	let timer = null;

	source.connect(splitter);
	analysers.forEach((analyser, index) => {
		splitter.connect(analyser, index);
	});

	if (false) {
		const oscillator1 = context.createOscillator();
		oscillator1.type = "sine";
		oscillator1.frequency.value = 100;
		oscillator1.connect(analysers[0]);
		oscillator1.start();

		const oscillator2 = context.createOscillator();
		oscillator2.type = "square";
		oscillator2.frequency.value = 100;
		oscillator2.connect(analysers[1]);
		oscillator2.start();
	}

	const colors = [
		'lime',
		'red',
		'cyan',
		'fuchsia',
		'white',
	];

	const clear_screens = () => {
		for (const context of [ctx_scope, ctx_spectrum]) {
			const { width, height } = context.canvas;
			context.globalCompositeOperation = "source-over";
			context.fillStyle = 'black';
			context.fillRect(0, 0, width, height);
			context.globalCompositeOperation = "lighter";
		}
	};

	const render_scope = (data, index) => {
		const context = ctx_scope;
		const { width, height } = context.canvas;
		context.lineWidth = 2;
		context.strokeStyle = colors[index % colors.length];
		const x_scale = width / data.length;
		const y_scale = height / 2 / ymax;
		const x_offset = 0;
		const y_offset = height / 2;
		context.beginPath();
		for (let i = 0; i < data.length; i++) {
			const x = i * x_scale + x_offset;
			const y = data[i] * y_scale + y_offset;
			if (i === 0) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}
		context.stroke();
	};

	const render_spectrum = (data, index) => {
		const context = ctx_spectrum;
		const { width, height } = context.canvas;
		context.lineWidth = 2;
		context.strokeStyle = colors[index % colors.length];
		const f_scale = (f) => ylog ? Math.log(f) : f - 1;
		const x_scale = width / f_scale(fft_bin_count);
		const y_scale = height / -(ymax_db - ymin_db);
		const x_offset = 0;
		const y_offset = 0;
		context.beginPath();
		for (let i = 1; i < fft_bin_count; i++) {
			const x = f_scale(i) * x_scale + x_offset;
			const y = (data[i] - ymax_db) * y_scale + y_offset;
			if (i === 0) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}
		context.stroke();
	};

	const get_spectrum_peak = (data) => {
		let max_level = -Infinity;
		let max_freq = 0;
		for (let i = 0; i < fft_bin_count; i++) {
			const level = data[i];
			if (level > max_level) {
				max_freq = i * fft_bin_size;
				max_level = level;
			}
		}
		return [max_freq, max_level];
	};

	const calculate_thdn = (data, main_level) => {
		let sum = 0;
		for (let i = 0; i < data.length; i++) {
			sum += data[i] * data[i];
		}
		sum /= data.length;
		sum -= Math.sqrt(2) * main_level;
		const rms = Math.sqrt(sum);
		return to_db(rms / main_level);
	};

	const plot = () => {
		clearInterval(timer);
		clear_screens();
		timer = setInterval(plot, 1000 / frame_rate);
		let frequencies = [];
		let dbs = [];
		let thdns = [];
		analysers.forEach((analyser, index) => {
			analyser.getFloatTimeDomainData(data_t);
			analyser.getFloatFrequencyData(data_f);
			let [frequency, db] = get_spectrum_peak(data_f);
			if (db < ymin_db) {
				frequency = NaN;
				db = -Infinity;
			}
			const thdn = calculate_thdn(data_t, to_level(db));
			render_scope(data_t, index);
			render_spectrum(data_f, index);
			frequencies.push(frequency);
			dbs.push(db);
			thdns.push(thdn);
		});
		ctrl_frequency.value = frequencies.map(frequency => frequency.toFixed(2)).join("  /  ");
		ctrl_level.value = dbs.map(db => db.toFixed(2)).join("  /  ");
		ctrl_thd.value = thdns.map(thdn => thdn.toFixed(2)).join("  /  ");
	};

	const update = () => {
		frame_rate = parseFloat(ctrl_frame_rate.value);
		ymin_db = parseFloat(ctrl_ymin.value);
		ymin = to_level(ymin_db);
		ymax_db = parseFloat(ctrl_ymax.value);
		ymax = to_level(ymax_db);
		ylog = ctrl_ylog.checked;
		if (![ymin_db, ymin, ymax_db, ymax].every(x => isFinite(x))) {
			return;
		}
		ctrl_frame_rate_label.textContent = frame_rate.toFixed(0) + " Hz";
		ctrl_scope_ne.textContent = "+" + ymax.toFixed(6);
		ctrl_scope_se.textContent = "-" + ymax.toFixed(6);
		ctrl_spectrum_nw.textContent = "0 Hz";
		ctrl_spectrum_ne.textContent = (sample_rate / 2).toFixed(0) + " Hz / " + ymax_db.toFixed(1) + "dB";
		ctrl_spectrum_se.textContent = ymin_db.toFixed(1) + " dB";
		ctrl_ymin_label.textContent = ymin_db.toFixed(1) + " dB";
		ctrl_ymax_label.textContent = ymax_db.toFixed(1) + " dB";
		clearInterval(timer);
		plot();
	};

	const fields = [
		"frame-rate",
		"ymin",
		"ymax",
		"log-frequency",
	];

	const bind = () => {
		for (const ctrl of fields.map($)) {
			ctrl.addEventListener("input", update);
		}
	};

	const unbind = () => {
		for (const ctrl of fields.map($)) {
			ctrl.removeEventListener("input", update);
		}
	};

	this.close = () => {
		unbind();
		clearInterval(timer);
		context.close();
	};

	bind();
	update();
}

async function create_generator() {
	if (generator) {
		generator.close();
		generator = null;
	}
	const $ = form_item("generator");
	const sink = $("sink").value;
	localStorage.setItem("generator-sink", sink);
	const context = create_context({
		sinkId: sink,
	})
	if ($("enabled").checked) {
		console.log("Creating generator", sink);
		generator = new Generator(context);
	}
}

async function create_analyser() {
	if (analyser) {
		analyser.close();
		analyser = null;
	}
	const $ = form_item("analyser");
	const source = $("source").value;
	localStorage.setItem("analyser-source", source);
	const context = create_context();
	const devices = await navigator.mediaDevices.enumerateDevices();
	const device = devices.find(device => device.deviceId == source);
	const channel_count = device.getCapabilities().channelCount.max;
	const sample_rate = device.getCapabilities().sampleRate.max;
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: {
			deviceId: { exact: source },
			autoGainControl: false,
			echoCancellation: false,
			noiseSuppression: false,
			channelCount: { ideal: channel_count, min: 1 },
			sampleRate: { ideal: sample_rate },
		}
	});
	if ($("enabled").checked) {
		console.log("Creating analyser", source, stream.getAudioTracks()[0].getSettings());
		analyser = new Analyser(context, stream);
	}
}

async function update_device_lists() {

	const set_devices = (devices) => {
		const ctrl_sink = form_item("generator")("sink");
		const ctrl_source = form_item("analyser")("source");
		const value_sink = localStorage.getItem("generator-sink");
		const value_source = localStorage.getItem("analyser-source");
		let selected_sink = null;
		let selected_source = null;
		ctrl_sink.replaceChildren();
		ctrl_source.replaceChildren();
		for (const device of devices) {
			const option = document.createElement('option');
			const label = device.label || "(noname)";
			const value = device.deviceId;
			option.text = label;
			option.value = value;
			if (device.kind === 'audioinput') {
				ctrl_source.appendChild(option);
				if (value === value_source) {
					selected_source = value;
				}
			} else if (device.kind === 'audiooutput') {
				ctrl_sink.appendChild(option);
				if (value === value_sink) {
					selected_sink = value;
				}
			}
		}
		if (selected_source) {
			ctrl_source.value = selected_source;
		}
		if (selected_sink) {
			ctrl_sink.value = selected_sink;
		}
	};

	const update_devices = async () => {
		set_devices(await navigator.mediaDevices.enumerateDevices());
	};

	await update_devices();
	await navigator.mediaDevices.getUserMedia({ audio: true });
	await update_devices();
}

function bind_ui() {
	{
		const action = () => create_generator().catch(on_async_error);
		const $ = form_item("generator");
		$("enabled").addEventListener("change", action);
		$("sink").addEventListener("change", action);
	}
	{
		const action = () => create_analyser().catch(on_async_error);
		const $ = form_item("analyser");
		$("enabled").addEventListener("change", action);
		$("source").addEventListener("change", action);
	}
}

bind_ui();
update_device_lists().catch(on_async_error);

});
