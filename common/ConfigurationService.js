
angular.module('bizmetryApp')
  .service('ConfigurationService', function ($http, CONFIG) {

    console.log ('Dentro de ConfiogurationService...');
    var configCache = null;

    // Cargar desde sessionStorage si existe
    const cachedJson = sessionStorage.getItem('bizmetry_config');
    if (cachedJson) {
      try {
        configCache = JSON.parse(cachedJson);
      } catch (e) {
        configCache = null;
      }
    }

    this.loadAllConfig = function () {
      return $http.get(CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry/config')
        .then(function (response) {
          configCache = response.data;
          sessionStorage.setItem('bizmetry_config', JSON.stringify(configCache)); // guardar
          return configCache;
        });
    };

    this.getFromCache = function (keyPath) {
      if (!configCache || !keyPath) return null;

      const keys = keyPath.split('.');
      let current = configCache;

      for (let k of keys) {
        if (!current.hasOwnProperty(k)) return null;
        current = current[k];
      }

      return current;
    };

    this.getFromCacheAsync = function (keyPath) {
      if (configCache) {
        return Promise.resolve(this.getFromCache(keyPath));
      }
      return this.loadAllConfig().then(() => this.getFromCache(keyPath));
    };
  });
