// loading.interceptor.js
angular.module('bizmetryApp')
  .factory('LoadingHttpInterceptor', function($q, LoadingService) {

    function isApiRequest(config) {
      if (!config || !config.url) return false;
      // Ajustá el patrón según tus rutas (p.ej. '/v1/api/' ya aparece en tu backend)
      return /\/v1\/api\//.test(config.url);
    }

    function shouldSkip(config) {
      return !!config.bmSkipLoader;
    }

    return {
      request: function(config) {
        if (isApiRequest(config) && !shouldSkip(config)) {
          LoadingService.requestStarted();
          config.__bmCounted__ = true; // marcar que la contamos
        }
        return config;
      },
      response: function(response) {
        if (response.config && response.config.__bmCounted__) {
          LoadingService.requestEnded();
        }
        return response;
      },
      responseError: function(rejection) {
        if (rejection && rejection.config && rejection.config.__bmCounted__) {
          LoadingService.requestEnded();
        }
        return $q.reject(rejection);
      }
    };
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('LoadingHttpInterceptor');
  });
