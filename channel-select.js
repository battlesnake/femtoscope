(() => {
	const app = angular.module('femtoscope');
	app.filter("channelAggregate", function () {
		let value = null;
		return (channels, type) => {
			const new_value = _(channels)
				.filter({ type })
				.orderBy(['device', 'index'])
				.groupBy('device')
				.values()
				.value();
			value = angular.equals(value, new_value) ? value : new_value;
			return value;
		};
	});
	app.controller("channelSelect", function ($scope, $parse, $timeout) {
		const model = $parse($scope.selection);
		const channel_id = channel => `${channel.device}$$${channel.index}`;
		const get_view_value = model_value => _(model_value)
				.orderBy(['device', 'index'])
				.map(channel_id)
				.map(id => [id, true])
				.fromPairs()
				.value();
		const get_model_value = view_value => _($scope.channels)
				.orderBy(['device', 'index'])
				.filter(channel => view_value[channel_id(channel)])
				.value();
		const update_validation = () => {
			$scope.validation_error = null;
			try {
				$scope.validate(get_model_value($scope.view_value));
			} catch (err) {
				$scope.validation_error = err.message;
			}
		};
		const initialise = () => {
			$scope.view_value = get_view_value(model($scope));
		};
		const apply = () => {
			$scope.$broadcast('bootstrapDropdown', 'channel-select', 'hide');
			model.assign($scope, get_model_value($scope.view_value));
		};
		let visible = false;
		Object.assign($scope, {
			channel_id,
			apply,
			validation_error: null,
			view_value: {},
		});
		$scope.$on("bootstrapDropdown", (event, name, command) => {
			if (name !== "channel-select") {
				return;
			}
			if (command === "on-show") {
				event.stopPropagation();
				visible = true;
				initialise();
			} else if (command === "on-hide") {
				event.stopPropagation();
				visible = false;
			}
		});
		$scope.$watch("view_value", () => {
			update_validation();
		}, true);
	});
	app.directive("channelSelect", function () {
		return {
			restrict: "E",
			replace: true,
			controller: "channelSelect",
			templateUrl: "channel-select.html",
			scope: {
				title: "@title",
				type: "@type",
				channels: "=channels",
				validate: "=validate",
				selection: "@selection",
			},
		};
	});
})();
