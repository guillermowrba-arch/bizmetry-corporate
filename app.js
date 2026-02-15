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

// 🔁 Iniciar refresco automático de token
app.run(['AuthService', function(AuthService) {
  AuthService.startTokenMonitor();
}]);

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
    .when('/login', {
      templateUrl: 'login/login-dialog.html',
      controller: 'LoginController'
    })
    .when('/home', {
      templateUrl: 'home/home.html',
      controller: 'HomeController'
    })
    .when('/activate-account', {
      templateUrl: 'activation/activate-account.html',
      controller: 'AccountActivationController'
    })
    .when('/activate-user', {
      templateUrl: 'activation/activate-user.html',
      controller: 'UserActivationController'
    })
    .when('/register', {
      templateUrl: 'register/register.html',
      controller: 'RegisterController'
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

// ✅ AuthService (login, registro, refresh, logout)
app.service('AuthService', ['$http', 'CONFIG', function ($http, CONFIG) {
  this.authenticate = function (username, password) {
    console.log ('EN AUTHENMTICATE!!!');
    return $http({
      method: 'POST',
      url: CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/login',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: { username, password }
    }).then(function (response) {
      console.log('LOGIN RESPONSE ->', response.data);
      
      // ✅ La respuesta viene directamente, no en response.data
      const data = response.data ;
      
      if (data.access_token) {
        const now = Date.now();
        
        // ✅ Construir objeto de usuario desde la respuesta plana
        const user = {
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          countryId: data.countryId,
          countryLabel: data.countryLabel,
          stateId: data.stateId,
          stateLabel: data.stateLabel,
          orgName: data.orgName,
          orgAddress: data.orgAddress,
          accountType: data.accountType,
          lastLogin: data.lastLogin,
          isSuperUser: data.isSuperUser || false,
          roles: data.roles || []
        };

        const tokenInfo = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: now + (data.expires_in * 1000),
          refresh_expires_at: now + (data.refresh_expires_in * 1000),
          user: user
        };
        
        sessionStorage.setItem("authTokenInfo", JSON.stringify(tokenInfo));
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + tokenInfo.access_token;
        sessionStorage.setItem("user", JSON.stringify(user));
        
        console.log("✅ TokenInfo stored in sessionStorage:", tokenInfo);
        console.log("✅ User stored in sessionStorage:", user);
      }
      return data;
    }).catch(function (error) {
      console.error("🚨 Login API Error:", error);
      throw error;
    });
  };

  this.register = function (user) {
    return $http({
      method: 'POST',
      url: CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/account',
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: user.email,
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }).catch(function (error) {
      console.error("🚨 Register API Error:", error);
      throw error;
    });
  };

  this.startTokenMonitor = function () {
    setInterval(() => {
      const raw = sessionStorage.getItem("authTokenInfo");
      if (!raw) return;

      let tokenInfo;
      try {
        tokenInfo = JSON.parse(raw);
      } catch (e) {
        console.warn("⚠️ Malformed authTokenInfo");
        return;
      }

      const now = Date.now();
      if (tokenInfo.expires_at && now >= tokenInfo.expires_at - 60000) {
        console.log("🔄 Attempting token refresh...");

        $http.post(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/refresh`, {
          refresh_token: tokenInfo.refresh_token
        })
        .then(response => {
          const updated = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: now + (response.data.expires_in * 1000),
            refresh_expires_at: now + (response.data.refresh_expires_in * 1000),
            user: response.data.user
          };
          sessionStorage.setItem("authTokenInfo", JSON.stringify(updated));
          $http.defaults.headers.common['Authorization'] = 'Bearer ' + updated.access_token;
          console.log("✅ Token refreshed successfully");
        })
        .catch(() => {
          console.warn("⚠️ Token refresh failed.");
        });
      }
    }, 60000);
  };

  this.logout = function () {
    sessionStorage.removeItem("authTokenInfo");
    sessionStorage.removeItem("user");
    delete $http.defaults.headers.common['Authorization'];
    console.log("👋 User logged out.");
  };
}]);

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