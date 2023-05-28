(() => {
	const app = angular.module('femtoscope');
	app.factory('preventTemplateCache', function ($injector) {
		return {
			'request': function (config) {
				config.url = config.url + (config.url.includes('?') ? '&' : '?') + 'no-cache=' + +new Date();
				return config;
			}
		}
	})
	app.config(function ($httpProvider) {
		$httpProvider.interceptors.push('preventTemplateCache');
	});
})();
