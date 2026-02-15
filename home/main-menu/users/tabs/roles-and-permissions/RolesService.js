angular.module('bizmetryApp').service('RolesService', ['$http', 'CONFIG', function ($http, CONFIG) {

  // 🌳 Obtener jerarquía completa de roles y permisos
  this.getRolesHierarchy = function (accountId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/roles/permissions-hierarchy`);
  };

  // 🔍 Obtener account ID de la sesión actual
  this.getCurrentAccountId = function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?.id;
  };

}]);