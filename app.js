var app = angular.module('bizmetryApp', [
  'ngMaterial', 
  'ngRoute', 
  'ngclipboard',
  'ui.tree',
  'rzModule'
]);

app.constant('CONFIG', {
  BIZMETRY_BACKEND_URL: '__BIZMETRY_BACKEND_URL__'
});

// truncate filter
app.filter('truncate', function () {
  return function (input, limit) {
    if (!input) return '';
    if (!limit || input.length <= limit) return input;
    return input.substring(0, limit) + '...';
  };
});



// 🔐 Verificar token antes de cambiar de ruta
app.run([
  '$rootScope', '$location', '$http', 'CONFIG', 'ConfigurationService',
  function ($rootScope, $location, $http, CONFIG, ConfigurationService) {

    // 🔄 Preload global config once on app startup
    ConfigurationService.loadAllConfig()
      .then(function (config) {
        $rootScope.configMap = config;
        console.log("✅ Global config loaded:", config);
      })
      .catch(function (err) {
        console.error("❌ Failed to preload config:", err);
      });

    $rootScope.$on('$routeChangeStart', function (event, next, current) {
      const tokenInfo = JSON.parse(sessionStorage.getItem("authTokenInfo") || "null");
      const token = tokenInfo?.access_token;
      const path = $location.path();
      const publicRoutes = ['/', '/login', '/register', '/activate-account','/activate-user'];

      if (token) {
        $http.get(CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/session/validate', {
          headers: { Authorization: 'Bearer ' + token }
        }).then(function () {
          if (path === '/' || path === '/login') {
            console.log("✅ Token valid, redirecting to /home from", path);
            event.preventDefault();
            $location.path('/home');
          }
        }).catch(function (error) {
          console.warn("❌ Invalid token:", error);
          sessionStorage.removeItem("authTokenInfo");
          sessionStorage.removeItem("user");
          if (!publicRoutes.includes(path)) {
            event.preventDefault();
            $location.path('/login');
          }
        });
      } else if (!publicRoutes.includes(path)) {
        console.warn("🚨 No token, redirecting to /login");
        event.preventDefault();
        $location.path('/login');
      }
    });
  }
]);

// ✅ Rutas
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'landing/landing.html',
      controller: 'LandingCtrl'
    })
    .when('/landing', {
      templateUrl: 'landing/landing.html',
      controller: 'LandingCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}]);

// ✅ Interceptor X-User headers
app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push(['$q', function($q) {
    return {
      request: function(config) {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.id) config.headers['X-User-Account-Id'] = user.id;
        if (user.email) config.headers['X-User-Id'] = user.email;
        return config;
      },
      responseError: function(rejection) {
        return $q.reject(rejection);
      }
    };
  }]);
}]);

// ✅ Interceptor de token
app.factory('AuthInterceptor', ['$q', function ($q) {
  return {
    request: function (config) {
      const tokenInfo = JSON.parse(sessionStorage.getItem("authTokenInfo") || "null");
      const token = tokenInfo?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ Attaching Authorization Header:", config.headers.Authorization);
      } else {
        console.warn("🚨 No token in sessionStorage!");
      }
      return config;
    },
    responseError: function (response) {
      return $q.reject(response);
    }
  };
}]);

// ✅ Registrar interceptor global
app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}]);

  this.logout = function () {
    sessionStorage.removeItem("authTokenInfo");
    sessionStorage.removeItem("user");
    delete $http.defaults.headers.common['Authorization'];
    console.log("👋 User logged out.");
  };

// ✅ API helper
app.service('ApiService', ['$http', 'CONFIG', function ($http, CONFIG) {
  this.getData = function (endpoint) {
    return $http.get(CONFIG.BIZMETRY_BACKEND_URL + endpoint)
      .then(response => response.data)
      .catch(error => {
        console.error("🚨 API Call Error:", error);
        throw error;
      });
  };
}]);