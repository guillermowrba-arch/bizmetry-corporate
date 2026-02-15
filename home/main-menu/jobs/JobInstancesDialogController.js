angular.module('bizmetryApp').controller('JobInstancesDialogController', function (
  $scope, $mdDialog, jobDefinition, jobService, ConfigurationService, $timeout
) {
  $scope.job = jobDefinition;
  $scope.loading = true;
  $scope.aggregatedData = [];
  $scope.totalExecutions = 0;
  $scope.noDataMessage = '';  // ✅ Inicializar mensaje vacío

  $scope.page = 0;
  $scope.pageSize = 20;
  $scope.totalPages = 0;
  $scope.isChangingInterval = false;
  $scope.isLoadingChart = false;  // ✅ Flag para loading del gráfico

  let chartInstance = null;
  let intervalChangeTimeout = null;
  let timeRangeChangeTimeout = null;

  // ✅ Obtener configuración desde ConfigurationService
  const maxHistoryDays = ConfigurationService.getFromCache('frontend.jobs.max-job-history-window-days') || 30;
  const minIntervalMins = ConfigurationService.getFromCache('frontend.jobs.min-job-aggregation-interval-mins') || 1;
  const maxIntervalMins = ConfigurationService.getFromCache('frontend.jobs.max-job-aggregation-interval-mins') || 60;
  const defaultIntervalMins = ConfigurationService.getFromCache('frontend.jobs.default-job-aggregation-interval-mins') || 15;

  console.log('⚙️ Configuration loaded:', {
    maxHistoryDays,
    minIntervalMins,
    maxIntervalMins,
    defaultIntervalMins
  });

  // ✅ Fecha base (hoy a las 23:59:59)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayTimestamp = today.getTime();

  // ✅ Fecha hace N días (basado en configuración)
  const maxDaysAgo = new Date();
  maxDaysAgo.setDate(maxDaysAgo.getDate() - maxHistoryDays);
  maxDaysAgo.setHours(0, 0, 0, 0);
  const maxDaysAgoTimestamp = maxDaysAgo.getTime();

  console.log('📅 Date range initialized:', {
    from: maxDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
    days: maxHistoryDays
  });

  // ✅ Calcular step del interval slider (1% del rango)
  const intervalRange = maxIntervalMins - minIntervalMins;
  const intervalStep = Math.max(1, Math.round(intervalRange * 0.01));

  console.log('⚙️ Interval slider config:', {
    min: minIntervalMins,
    max: maxIntervalMins,
    range: intervalRange,
    step: intervalStep,
    default: defaultIntervalMins
  });

  // ===== TIME RANGE SLIDER =====

  $scope.timeRangeSlider = {
    minValue: maxDaysAgoTimestamp,
    maxValue: todayTimestamp,
    options: {
      floor: maxDaysAgoTimestamp,
      ceil: todayTimestamp,
      step: 86400000,
      minRange: 86400000,
      pushRange: true,
      draggableRange: false,
      showSelectionBar: true,
      noSwitching: true,
      enforceRange: true,
      enforceStep: true,
      translate: function (value, sliderId, label) {
        const date = new Date(value);
        return date.toISOString().split('T')[0];
      },
      onChange: function () {
        // Solo log durante drag - NO cargar datos
        console.log('🎯 Time range dragging:',
          new Date($scope.timeRangeSlider.minValue).toISOString().split('T')[0],
          'to',
          new Date($scope.timeRangeSlider.maxValue).toISOString().split('T')[0]);
      },
      onEnd: function () {
        // Solo cargar al soltar
        if ($scope.timeRangeSlider.minValue >= $scope.timeRangeSlider.maxValue) {
          console.warn('⚠️ Invalid time range');
          return;
        }

        console.log('✅ Time range released, loading data');
        triggerTimeRangeChange();
      }
    }
  };

  // ===== INTERVAL SLIDER =====

  $scope.intervalSlider = {
    value: defaultIntervalMins,
    options: {
      floor: minIntervalMins,
      ceil: maxIntervalMins,
      step: intervalStep,
      showSelectionBar: true,
      translate: function (value) {
        return value + (value === 1 ? ' min' : ' mins');
      },
      onChange: function () {
        // Solo log durante drag - NO cargar datos
        console.log('🎯 Interval dragging:', $scope.intervalSlider.value);
      },
      onEnd: function () {
        // Solo cargar al soltar
        onIntervalChange();
      }
    }
  };

  console.log('📊 JobInstancesDialog initialized for:', $scope.job.jobName);

  // ===== HELPER FUNCTIONS =====

  function timestampToISO(timestamp) {
    return new Date(timestamp).toISOString();
  }

  $scope.hasCustomTimeRange = function () {
    return $scope.timeRangeSlider.minValue !== maxDaysAgoTimestamp ||
      $scope.timeRangeSlider.maxValue !== todayTimestamp;
  };

  $scope.resetTimeRange = function () {
    $scope.timeRangeSlider.minValue = maxDaysAgoTimestamp;
    $scope.timeRangeSlider.maxValue = todayTimestamp;
    triggerTimeRangeChange();
  };

  $scope.setTimeRangePreset = function (days) {
    const effectiveDays = Math.min(days, maxHistoryDays);

    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - effectiveDays);
    fromDate.setHours(0, 0, 0, 0);

    $scope.timeRangeSlider.minValue = fromDate.getTime();
    $scope.timeRangeSlider.maxValue = todayTimestamp;

    console.log('📅 Preset selected:', effectiveDays, 'days');
    triggerTimeRangeChange();
  };

  function triggerTimeRangeChange() {
    if (timeRangeChangeTimeout) {
      $timeout.cancel(timeRangeChangeTimeout);
    }

    // ✅ Mostrar indicador de loading en los controles
    $scope.isChangingInterval = true;

    timeRangeChangeTimeout = $timeout(function () {
      $scope.page = 0;
      $scope.loadInstances();
    }, 500);
  }

  $scope.setIntervalPreset = function (minutes) {
    if ($scope.intervalSlider.value === minutes) return;

    const effectiveMinutes = Math.max(minIntervalMins, Math.min(minutes, maxIntervalMins));

    console.log('⏱️ Setting interval to:', effectiveMinutes + 'min');

    $scope.intervalSlider.value = effectiveMinutes;
    
    // ✅ Mostrar indicador de loading
    $scope.isChangingInterval = true;

    if (intervalChangeTimeout) {
      $timeout.cancel(intervalChangeTimeout);
    }

    $scope.page = 0;
    $scope.loadInstances();
  };

  function onIntervalChange() {
    console.log('🎚️ Interval changed to:', $scope.intervalSlider.value);

    if (intervalChangeTimeout) {
      $timeout.cancel(intervalChangeTimeout);
    }

    // ✅ Mostrar indicador de loading
    $scope.isChangingInterval = true;

    intervalChangeTimeout = $timeout(function () {
      $scope.page = 0;
      $scope.loadInstances();
    }, 300);
  }

  // ===== DATA LOADING =====

  $scope.loadInstances = function () {
    // ✅ PASO 1: Activar loading state del chart
    $scope.isLoadingChart = true;
    $scope.noDataMessage = '';  // ✅ Limpiar mensaje anterior

    var fromISO = timestampToISO($scope.timeRangeSlider.minValue);
    var toISO = timestampToISO($scope.timeRangeSlider.maxValue);

    console.log('📤 Loading aggregated instances:');
    console.log('  - Page:', $scope.page);
    console.log('  - Interval:', $scope.intervalSlider.value + 'min');
    console.log('  - Time Range:', fromISO, 'to', toISO);

    jobService.getJobInstancesAggregated(
      jobDefinition.jobId,
      $scope.intervalSlider.value,
      fromISO,
      toISO,
      $scope.page,
      $scope.pageSize
    )
      .then(function (response) {
        // ✅ PASO 2: Procesar respuesta exitosa
        
        // Verificar si la respuesta está vacía (204)
        if (response.status === 204) {
          console.log('ℹ️ No data (204) for selected range');
          $scope.noDataMessage = 'No data available for the selected time range';
          $scope.aggregatedData = [];
          $scope.totalPages = 0;
          $scope.totalExecutions = 0;
        } else {
          // Procesar datos normales
          $scope.aggregatedData = response.data.content || [];
          $scope.totalPages = response.data.totalPages;
          $scope.totalExecutions = response.data.totalElements;

          console.log('✅ Loaded', $scope.aggregatedData.length, 'aggregated intervals');
          
          // ✅ Solo renderizar si hay datos
          if ($scope.aggregatedData.length > 0) {
            $scope.renderChart();
          } else {
            // Si el array viene vacío, mostrar mensaje
            $scope.noDataMessage = 'No executions found in the selected time range';
          }
        }
      })
      .catch(function (error) {
        // ✅ PASO 3: Manejar errores
        console.error('❌ Error fetching aggregated job instances:', error);
        $scope.aggregatedData = [];
        $scope.totalPages = 0;
        $scope.totalExecutions = 0;
        $scope.noDataMessage = 'Error loading execution data. Please try again.';
      })
      .finally(function () {
        // ✅ PASO 4: Limpiar estados de loading
        $scope.loading = false;           // ✅ Primera carga completada
        $scope.isLoadingChart = false;    // ✅ Chart loading completado
        $scope.isChangingInterval = false; // ✅ Cambio de intervalo completado

        // ✅ Forzar refresh del slider después de cargar datos
        $timeout(function () {
          $scope.$broadcast('rzSliderForceRender');
        }, 100);
      });
  };


  // ===== CHART RENDERING =====

  $scope.renderChart = function () {
    const canvasEl = document.getElementById('jobInstancesChart');

    if (!canvasEl) {
      console.warn('⛔️ Canvas element not found - retrying...');
      $timeout($scope.renderChart, 100);
      return;
    }

    // ✅ Verificar si el canvas es visible (no tiene ng-hide)
    const container = canvasEl.closest('.chart-container');
    if (container && container.classList.contains('ng-hide')) {
      console.log('⏳ Canvas hidden, waiting...');
      $timeout($scope.renderChart, 50);
      return;
    }

    const ctx = canvasEl.getContext('2d');

    const labels = $scope.aggregatedData.map(function (dataPoint) {
      var date = new Date(dataPoint.intervalStart);
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      return month + '/' + day + ' ' +
        (hours < 10 ? '0' : '') + hours + ':' +
        (minutes < 10 ? '0' : '') + minutes;
    });

    const successData = $scope.aggregatedData.map(function (dataPoint) {
      return dataPoint.successCount;
    });

    const failureData = $scope.aggregatedData.map(function (dataPoint) {
      return dataPoint.failureCount;
    });

    const avgTimeData = $scope.aggregatedData.map(function (dataPoint) {
      return dataPoint.avgExecutionTime;
    });

    // ✅ Si el chart ya existe, actualizar datos in-place
    if (chartInstance) {
      console.log('🔄 Updating chart data in-place');
      
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = successData;
      chartInstance.data.datasets[1].data = failureData;
      chartInstance.data.datasets[2].data = avgTimeData;
      
      chartInstance.update('none');  // ✅ 'none' = sin animación, actualización inmediata
      
      console.log('📈 Chart updated with', $scope.aggregatedData.length, 'intervals');
      return;
    }

    // ✅ Si NO existe el chart, crearlo por primera vez
    console.log('🆕 Creating new chart instance');

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Successful Executions',
            data: successData,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#4caf50',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-count'
          },
          {
            label: 'Failed Executions',
            data: failureData,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            pointBackgroundColor: '#f44336',
            pointBorderColor: '#f44336',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-count'
          },
          {
            label: 'Avg Execution Time (ms)',
            data: avgTimeData,
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            pointBackgroundColor: '#2196f3',
            pointBorderColor: '#2196f3',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-time'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },  // ✅ Sin animaciones - actualización instantánea
        layout: {
          padding: {
            bottom: 10  // ✅ Reducido de 30 a 10
          }
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12, weight: '600' }
            },
            padding: {
              bottom: 20  // ✅ Reducido de 40px a 20px
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              title: function (tooltipItems) {
                var dataPoint = $scope.aggregatedData[tooltipItems[0].dataIndex];
                var start = new Date(dataPoint.intervalStart);
                var end = new Date(dataPoint.intervalEnd);
                return start.toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) + ' - ' + end.toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit'
                });
              },
              label: function (context) {
                var dataPoint = $scope.aggregatedData[context.dataIndex];
                var label = context.dataset.label || '';
                if (context.datasetIndex === 0) return label + ': ' + dataPoint.successCount;
                else if (context.datasetIndex === 1) return label + ': ' + dataPoint.failureCount;
                else return label + ': ' + Math.round(dataPoint.avgExecutionTime) + ' ms';
              },
              afterLabel: function (context) {
                if (context.datasetIndex === 2) {
                  var dataPoint = $scope.aggregatedData[context.dataIndex];
                  return [
                    'Min: ' + Math.round(dataPoint.minExecutionTime) + ' ms',
                    'Max: ' + Math.round(dataPoint.maxExecutionTime) + ' ms',
                    'Total Executions: ' + dataPoint.totalExecutions
                  ];
                }
                return '';
              }
            }
          }
        },
        scales: {
          'y-count': {
            type: 'linear', position: 'left', beginAtZero: true,
            title: { display: true, text: 'Execution Count', font: { size: 12, weight: '600' } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { font: { size: 11 }, callback: function (value) { return Math.round(value); } }
          },
          'y-time': {
            type: 'linear', position: 'right', beginAtZero: true,
            title: { display: true, text: 'Avg Time (ms)', font: { size: 12, weight: '600' } },
            grid: { display: false },
            ticks: { font: { size: 11 }, callback: function (value) { return Math.round(value) + ' ms'; } }
          },
          x: {
            title: { display: true, text: 'Time Interval', font: { size: 12, weight: '600' } },
            ticks: {
              maxRotation: 45, minRotation: 45, font: { size: 11 }, maxTicksLimit: 15,
              callback: function (value, index, ticks) {
                var label = this.getLabelForValue(value);
                return label.length > 15 ? label.substring(0, 12) + '...' : label;
              }
            },
            grid: { display: false }
          }
        }
      }
    });

    console.log('📈 Chart created with', $scope.aggregatedData.length, 'intervals');
  };

  // ===== PAGINATION =====

  $scope.nextPage = function () {
    if ($scope.page < $scope.totalPages - 1) {
      $scope.page++;
      $scope.loadInstances();
    }
  };

  $scope.prevPage = function () {
    if ($scope.page > 0) {
      $scope.page--;
      $scope.loadInstances();
    }
  };

  // ===== HELPERS =====

  $scope.getSuccessRate = function () {
    if (!$scope.aggregatedData || $scope.aggregatedData.length === 0) return 100;
    var totalSuccess = 0, totalExecutions = 0;
    $scope.aggregatedData.forEach(function (dataPoint) {
      totalSuccess += dataPoint.successCount;
      totalExecutions += dataPoint.totalExecutions;
    });
    return totalExecutions > 0 ? ((totalSuccess / totalExecutions) * 100).toFixed(1) : 100;
  };

  // ===== DIALOG ACTIONS =====

 $scope.close = function () {
  // No destruir el gráfico, solo limpiarlo o actualizarlo
  if (chartInstance) {
    chartInstance.clear(); // Limpiar el gráfico actual
    chartInstance.data.datasets.forEach((dataset) => {
      dataset.data = [];  // Limpiar los datos de cada conjunto de datos
    });
    chartInstance.update(); // Actualizar el gráfico (sin animación)
  }

  // Cancelar cualquier temporizador de cambio de intervalo o rango de tiempo
  if (intervalChangeTimeout) $timeout.cancel(intervalChangeTimeout);
  if (timeRangeChangeTimeout) $timeout.cancel(timeRangeChangeTimeout);

  // Cerrar el diálogo
  $mdDialog.hide();
};


  // ===== CLEANUP =====

  $scope.$on('$destroy', function () {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    if (intervalChangeTimeout) $timeout.cancel(intervalChangeTimeout);
    if (timeRangeChangeTimeout) $timeout.cancel(timeRangeChangeTimeout);
  });

  // ===== INITIALIZATION =====

  $scope.loadInstances();
});