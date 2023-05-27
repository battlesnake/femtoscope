(() => {
	const app = angular.module('femtoscope');
	app.controller("channelMapping", function ($scope) {
		Object.assign($scope, {
			selected_channels: () => $scope.channels.filter(channel => channel.selected),
			can_create: (unit_type) => {
				return true;
				//
				const ports_constraint_name = { sources: 'inputs', sinks: 'outputs' }[$scope.type];
				if (!ports_constraint_name) {
					throw new Error("Invalid value for 'type'");
				}
				console.log(unit_type);
				const ports_constraint = unit_type[ports_constraint_name];
				const selected_count = $scope.selected_channels().length;
				console.log({ selected_count, ports_constraint });
				return selected_count >= ports_constraint.min && selected_count <= ports_constraint.max;
			},
		});
	});
	app.directive("channelMapping", function () {
		return {
			controller: "channelMapping",
			restrict: "E",
			templateUrl: "channel-mapping.html",
			scope: {
				title: "@title",
				type: "@type",  // sources | sinks
				channels: "=channels",
				unit_types: "=unitTypes",
				on_create: "=onCreate",
			},
		};
	});
})();
