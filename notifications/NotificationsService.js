angular.module('bizmetryApp').service('NotificationService', ['$http', 'CONFIG', function ($http, CONFIG) {

  // 🔍 Filtrar notificaciones por accountId + filtros opcionales
  this.getFilteredNotifications = function (accountId, filters, page, size) {
    const params = {
      page: page || 0,
      size: size || 10
    };

    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.type) {
      params.type = filters.type;
    }
    if (filters.severity) {
      params.severity = filters.severity;
    }
    if (filters.createdAfter) {
      params.createdAfter = filters.createdAfter;
    }
    if (filters.createdBefore) {
      params.createdBefore = filters.createdBefore;
    }

    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-notifications/notifications/filter`, {
      headers: {
        'X-User-Account-Id': accountId
      },
      params: params
    });
  };

}]);
