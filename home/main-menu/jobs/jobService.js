angular.module('bizmetryApp').service('jobService', function ($http, CONFIG) {
  
  // ✅ Obtener todas las definiciones de jobs
  this.getAllJobDefinitions = function () {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-jobs/definitions`);
  };

  // ✅ Obtener instancias de un job (endpoint original)
  this.getJobInstances = function (jobId, page, size) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-jobs/jobs/${jobId}/instances`, {
      params: { page: page, size: size }
    });
  };

  // ✅ ACTUALIZADO: Obtener instancias agregadas con rango de tiempo opcional
  this.getJobInstancesAggregated = function (jobId, intervalMinutes, from, to, page, size) {
    var params = {
      intervalMinutes: intervalMinutes,
      page: page,
      size: size
    };

    // Agregar parámetros de tiempo solo si están definidos
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }

    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-jobs/jobs/${jobId}/instances/aggregated`, {
      params: params
    });
  };

});