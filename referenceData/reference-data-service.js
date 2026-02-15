// app/reference/reference-data.service.js
angular.module('bizmetryApp').service('ReferenceDataService', ['$http', 'CONFIG', function($http, CONFIG) {

    this.getReferenceData = function(dataType) {
      return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry/refdata/${dataType}`);
    };
  
  }]);
  