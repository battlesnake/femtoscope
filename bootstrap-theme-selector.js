(() => {
	const app = angular.module('femtoscope');
	app.constant("bootstrapThemes", [
		{
			name: 'auto',
			icon: 'circle-half',
		},
		{
			name: 'light',
			icon: 'sun-fill',
		},
		{
			name: 'dark',
			icon: 'moon-stars-fill',
		},
	]);
	app.controller("bootstrapThemeSelector", function ($scope, bootstrapThemes, $window, $document, $localStorage) {
		const media = $window.matchMedia('(prefers-color-scheme: dark)');
		const get_preferred_theme = () => media.matches ? 'dark' : 'light';
		$scope.themes = bootstrapThemes;
		$scope.current_theme = bootstrapThemes.find(theme => theme.name === ($localStorage.theme_name ?? 'auto')) ?? bootstrapThemes[0];
		$scope.is_selected = theme => theme === $scope.current_theme;
		$scope.set_theme = theme => {
			$scope.current_theme = theme;
			$localStorage.theme_name = theme.name;
			const bootstrap_theme = theme.name === 'auto' ? get_preferred_theme() : theme.name;
			$document.find('body').attr('data-bs-theme', bootstrap_theme);
		};
		media.addEventListener('change', () => {
			$scope.set_theme($scope.current_theme);
		});
		$scope.set_theme($scope.current_theme);
	});
	app.directive("bootstrapThemeSelector", function (bootstrap) {
		return {
			controller: 'bootstrapThemeSelector',
			restrict: "E",
			templateUrl: "bootstrap-theme-selector.html",
			replace: true,
			scope: { },
		};
	});
})();
