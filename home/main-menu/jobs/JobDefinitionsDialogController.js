angular.module('bizmetryApp').controller('JobDefinitionsDialogController', function (
  $scope, $mdDialog, jobService, $interval
) {
  $scope.loading = true;
  $scope.jobs = [];
  
  // ✅ Map para trackear failedRuns previos de cada job
  var previousFailedRuns = {};
  
  // ✅ Intervalo de auto-refresh
  var autoRefreshInterval = null;

  // Cargar definiciones al iniciar el modal
  jobService.getAllJobDefinitions()
    .then(function (response) {
      $scope.jobs = response.data;
      
      // ✅ Inicializar el tracking de errores
      $scope.jobs.forEach(function(job) {
        previousFailedRuns[job.jobId] = job.failedRuns || 0;
      });
      
      console.log('✅ Loaded', $scope.jobs.length, 'job definitions');
      
      // ✅ Iniciar auto-refresh después de la carga inicial
      startAutoRefresh();
    })
    .catch(function (error) {
      console.error('❌ Error al obtener definiciones de jobs:', error);
    })
    .finally(function () {
      $scope.loading = false;
    });

  // ===== STATS CALCULATIONS =====
  
  /**
   * Cuenta cuántos jobs están habilitados (enabled = true)
   */
  $scope.getEnabledJobsCount = function() {
    if (!$scope.jobs || $scope.jobs.length === 0) {
      return 0;
    }
    return $scope.jobs.filter(function(job) {
      return job.enabled === true;
    }).length;
  };

  /**
   * Suma total de ejecuciones de todos los jobs
   */
  $scope.getTotalRuns = function() {
    if (!$scope.jobs || $scope.jobs.length === 0) {
      return 0;
    }
    return $scope.jobs.reduce(function(sum, job) {
      return sum + (job.totalRuns || 0);
    }, 0);
  };

  /**
   * Suma total de fallos de todos los jobs
   */
  $scope.getTotalFailures = function() {
    if (!$scope.jobs || $scope.jobs.length === 0) {
      return 0;
    }
    return $scope.jobs.reduce(function(sum, job) {
      return sum + (job.failedRuns || 0);
    }, 0);
  };

  /**
   * Calcula el porcentaje de éxito global
   */
  $scope.getSuccessRate = function() {
    var totalRuns = $scope.getTotalRuns();
    var totalFailures = $scope.getTotalFailures();
    
    if (totalRuns === 0) {
      return 100;
    }
    
    var successRate = ((totalRuns - totalFailures) / totalRuns) * 100;
    return successRate.toFixed(1);
  };

  /**
   * Determina si un job tiene errores recientes
   * Hay errores recientes si failedRuns se incrementó desde el último refresh
   */
  $scope.hasRecentErrors = function(job) {
    if (!job || !job.jobId) {
      return false;
    }
    
    var currentFailedRuns = job.failedRuns || 0;
    var previousCount = previousFailedRuns[job.jobId] || 0;
    
    // Hay errores recientes si la cuenta de errores aumentó
    return currentFailedRuns > previousCount;
  };

  /**
   * Calcula cuántos errores nuevos tiene el job
   */
  $scope.getNewFailuresCount = function(job) {
    if (!job || !job.jobId) {
      return 0;
    }
    
    var currentFailedRuns = job.failedRuns || 0;
    var previousCount = previousFailedRuns[job.jobId] || 0;
    
    return Math.max(0, currentFailedRuns - previousCount);
  };

  /**
   * Refresca las definiciones de jobs
   */
  $scope.refreshJobs = function() {
    // ✅ No mostrar loading spinner en auto-refresh para evitar parpadeo
    var isManualRefresh = arguments[0] === true;
    
    if (isManualRefresh) {
      $scope.loading = true;
    }
    
    // ✅ Guardar la posición de scroll actual
    var scrollContainer = document.querySelector('.jobs-content');
    var scrollPosition = scrollContainer ? scrollContainer.scrollTop : 0;
    
    jobService.getAllJobDefinitions()
      .then(function (response) {
        var newJobs = response.data;
        
        // ✅ Comparar failedRuns con el estado anterior
        newJobs.forEach(function(job) {
          var previousCount = previousFailedRuns[job.jobId] || 0;
          var currentCount = job.failedRuns || 0;
          
          if (currentCount > previousCount) {
            console.log('⚠️ Job', job.jobName, 'has new failures:',
              currentCount - previousCount, 'new errors');
          }
          
          // ✅ Actualizar el tracking para el próximo refresh
          previousFailedRuns[job.jobId] = currentCount;
        });
        
        $scope.jobs = newJobs;
        console.log('🔄 Jobs refreshed');
        
        // ✅ Restaurar la posición de scroll después de que Angular actualice el DOM
        $scope.$applyAsync(function() {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollPosition;
          }
        });
      })
      .catch(function (error) {
        console.error('❌ Error refreshing jobs:', error);
      })
      .finally(function () {
        if (isManualRefresh) {
          $scope.loading = false;
        }
      });
  };

  /**
   * Inicia el auto-refresh cada 10 segundos
   */
  function startAutoRefresh() {
    if (autoRefreshInterval) {
      $interval.cancel(autoRefreshInterval);
    }
    
    autoRefreshInterval = $interval(function() {
      console.log('🔄 Auto-refreshing jobs...');
      $scope.refreshJobs(false);  // false = no mostrar loading
    }, 10000);  // 10 segundos
    
    console.log('✅ Auto-refresh started (every 10 seconds)');
  }

  /**
   * Detiene el auto-refresh
   */
  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      $interval.cancel(autoRefreshInterval);
      autoRefreshInterval = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }

  // ===== DIALOG ACTIONS =====

  $scope.close = function () {
    stopAutoRefresh();
    $mdDialog.hide();
  };

  /**
   * Abre el diálogo de instancias para un job específico
   * Usa multiple: true para permitir diálogos anidados
   */
  $scope.openJobInstances = function(job, $event) {
    console.log('📊 Opening instances for job:', job.jobName);
    
    $mdDialog.show({
      controller: 'JobInstancesDialogController',
      templateUrl: 'home/main-menu/jobs/job-instances-dialog.html',
      parent: angular.element(document.body),
      escapeToClose: false,
      targetEvent: $event,
      clickOutsideToClose: true,
      multiple: true,  // 🔥 Clave para diálogos anidados
      fullscreen: true,
      locals: { 
        jobDefinition: job 
      }
    }).then(function() {
      console.log('✅ Job instances dialog closed');
      // ✅ Refrescar al cerrar el diálogo de instancias
      $scope.refreshJobs(false);
    }).catch(function() {
      console.log('❌ Job instances dialog cancelled');
    });
  };

  // ===== CLEANUP =====
  
  $scope.$on('$destroy', function() {
    stopAutoRefresh();
    console.log('🧹 JobDefinitionsDialog cleaned up');
  });

});