// bootstrap.js
module.exports = function bootstrapApp(app) {

  // 🔁 Iniciar refresco automático de token
  app.run(['AuthService', function (AuthService) {
    AuthService.startTokenMonitor();
  }]);

  // 🔐 Preload config + control de rutas
  app.run([
    '$rootScope', '$location', '$http', 'CONFIG', 'ConfigurationService',
    function ($rootScope, $location, $http, CONFIG, ConfigurationService) {

      console.log('BOOTSTRAPPING bizmetryApp');

      // 🔄 Preload global config
      ConfigurationService.loadAllConfig()
        .then(function (config) {
          $rootScope.configMap = config;
          console.log("✅ Global config loaded:", config);
        })
        .catch(function (err) {
          console.error("❌ Failed to preload config:", err);
        });

      // 🔐 Control de rutas
      $rootScope.$on('$routeChangeStart', function (event, next, current) {
        const tokenInfo = JSON.parse(sessionStorage.getItem("authTokenInfo") || "null");
        const token = tokenInfo?.access_token;
        const path = $location.path();
        const publicRoutes = ['/', '/login', '/register', '/activate-account', '/activate-user'
        ];

        if (token) {
          $http.get(CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/session/validate', {
            headers: { Authorization: 'Bearer ' + token }
          }).then(function () {
            if (path === '/' || path === '/login') {
              event.preventDefault();
              $location.path('/home');
            }
          }).catch(function (error) {
            sessionStorage.removeItem("authTokenInfo");
            sessionStorage.removeItem("user");
            if (!publicRoutes.includes(path)) {
              event.preventDefault();
              $location.path('/login');
            }
          });
        } else if (!publicRoutes.includes(path)) {
          event.preventDefault();
          $location.path('/login');
        }
      });
    }
  ]);

  // ✅ Configuración de rutas
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
      .when('/login', {
        templateUrl: 'login/login-dialog.html',
        controller: 'LoginController'
      })
      .when('/home', {
        templateUrl: 'home/home.html',
        controller: 'HomeController'
      })
      .when('/activate-account', {
        templateUrl: 'activation/activation.html',
        controller: 'ActivationController'
      })
      .when('/activate-user', {
        templateUrl: 'activation/activate-user.html',
        controller: 'UserActivationController'
      })
      .when('/register', {
        templateUrl: 'register/register.html',
        controller: 'RegisterController'
      })
      .otherwise({ redirectTo: '/' });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
  }]);

  // ✅ Interceptores globales (X-User + Authorization)
  app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(['$q', function ($q) {
      return {
        request: function (config) {
          const user = JSON.parse(sessionStorage.getItem('user') || '{}');
          if (user.id) config.headers['X-User-Account-Id'] = user.id;
          if (user.email) config.headers['X-User-Id'] = user.email;

          const tokenInfo = JSON.parse(sessionStorage.getItem("authTokenInfo") || "null");
          if (tokenInfo?.access_token) {
            config.headers.Authorization = `Bearer ${tokenInfo.access_token}`;
          }
          return config;
        },
        responseError: function (rejection) {
          return $q.reject(rejection);
        }
      };
    }]);
  }]);

};
