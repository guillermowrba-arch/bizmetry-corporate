angular.module('bizmetryApp').controller('AgentsPanelController', function (
  $scope, $mdDialog, ProfileService, ReferenceDataService, $interval, $timeout,
  TelemetryAgentService, dialogService, $mdToast, ConfigurationService
) {
  $scope.loading = true; // Comienza con loading en true
  $scope.filteredAgents = [];
  $scope.refreshInterval = 10; // Intervalo por defecto en segundos

  // Filtros
  $scope.selectedProfile = null;
  $scope.selectedEnvType = null;
  $scope.selectedStatus = null;
  $scope.searchText = '';  // Variable para el texto de búsqueda

  let agentsInterval;

  // Inicializamos los valores de profiles y envTypes
  $scope.profiles = [];
  $scope.envTypes = [];

  // Definir los posibles estados
  $scope.statuses = ['OFFLINE', 'ONLINE', 'SYNCING_UP', 'STARTING', 'STOPPING', 'RESTARTING', 'DISCONNECTED', 'STALE', 'DECOMMISSIONING', 'RETIRED'];

  // Función para cargar los perfiles y los tipos de entorno desde las APIs
  function loadFilterData() {
    // Cargar los perfiles desde el servicio ProfileService
    ProfileService.getAllProfiles()
      .then(function (response) {
        // Verificamos si la respuesta tiene la estructura de paginación y perfiles
        if (response.data) {
          // Extraer solo `profileData` de cada perfil
          $scope.profiles = response.data.profiles || {};

          $scope.paging = response.data.paging || {};  // Asignamos la información de paginación
          console.log("✅ Profiles loaded:", $scope.profiles);
          console.log("Paging info:", $scope.paging);
        }
      })
      .catch(function (error) {
        console.error('❌ Error al cargar los perfiles:', error);
      });

    // Cargar los tipos de entorno desde el servicio ReferenceDataService
    ReferenceDataService.getReferenceData('ENVIRONMENT_TYPE')
      .then(function (response) {
        $scope.envTypes = response.data || [];
        console.log("✅ Environment types loaded:", $scope.envTypes);
      })
      .catch(function (error) {
        console.error('❌ Error al cargar los tipos de entorno:', error);
      });
  }


  // Función para calcular colores basados en el texto
  $scope.getHashColor = function (label) {
    // Verificamos si label es válido (no null o undefined)
    if (!label) {
      return '#607d8b';  // Color por defecto si label es inválido
    }

    var colors = [
      '#607d8b', '#8bc34a', '#03a9f4', '#ff9800', '#e91e63',
      '#9c27b0', '#009688', '#cddc39', '#ffc107', '#795548'
    ];

    var hash = 0;
    for (var i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Función para obtener el color del texto basado en el fondo
  $scope.getTextColor = function (label) {
    const hex = $scope.getHashColor(label);
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 140 ? '#000000' : '#ffffff';  // Negro si claro, blanco si oscuro
  };

  // Función para enriquecer los agentes con colores de perfil y entorno
  function enrichAgent(agent) {
    const profileColor = $scope.getHashColor(agent.profileName);
    const envColor = $scope.getHashColor(agent.environmentName);
    console.log('Enriqueciendo agente:', agent); // Log para depurar qué agente se está procesando

    return {
      ...agent,
      profilePillBg: profileColor,
      profilePillFg: $scope.getTextColor(profileColor),
      envPillBg: envColor,
      envPillFg: $scope.getTextColor(envColor)
    };
  }

  // Reemplaza tu función loadFilteredAgents con esta versión corregida:

  function loadFilteredAgents() {
    console.log('***** LoadFilteredAgents()');
    $scope.loading = true;

    const accountId = JSON.parse(sessionStorage.getItem('user') || '{}').id;

    console.log('$scope.selectedProfile=' + $scope.selectedProfile);
    console.log('$scope.selectedEnvType=' + $scope.selectedEnvType);
    console.log('$scope.selectedStatus=' + $scope.selectedStatus);

    // Verificar que 'ALL' no sea enviado a la API
    const filters = {
      profile: $scope.selectedProfile === 'ALL' || !$scope.selectedProfile ? null : $scope.selectedProfile,
      envType: $scope.selectedEnvType === 'ALL' || !$scope.selectedEnvType ? null : $scope.selectedEnvType,
      status: $scope.selectedStatus === 'ALL' || !$scope.selectedStatus ? null : $scope.selectedStatus
    };

    console.log('filters:', filters);

    // Llamar a la API con los filtros seleccionados
    TelemetryAgentService.searchAgents(
      accountId,
      filters.profile,
      null,
      filters.envType,
      filters.status,
      null
    )
      .then(function (response) {
        console.log('Datos filtrados recibidos de la API:', response.data);

        // ✅ FIX: Asegurar que siempre sea un array
        let agents = response.data || [];

        // Enriquecer los agentes con los colores
        agents = agents.map(enrichAgent);

        // ✅ FIX: Aplicar filtro de búsqueda ANTES de asignar a $scope.filteredAgents
        const searchText = ($scope.searchText || '').toLowerCase().trim();
        if (searchText) {
          agents = agents.filter(function (agent) {
            return agent.agentName.toLowerCase().includes(searchText);
          });
        }

        // ✅ Asignar el resultado final
        $scope.filteredAgents = agents;

        console.log('✅ Final filtered agents count:', $scope.filteredAgents.length);

        // Forzar la actualización del ciclo digest
        $timeout(function () {
          $scope.loading = false;
        }, 50); // ✅ Aumenté a 50ms para dar tiempo al DOM
      })
      .catch(function (error) {
        console.error('❌ Error fetching agents:', error);
        $scope.filteredAgents = [];
        $timeout(function () {
          $scope.loading = false;
        }, 50);
      });
  }

  // ✅ También actualiza esta función:
  $scope.filterAgentsBySearch = function () {
    // Esta función ya no es necesaria porque el filtro se aplica en loadFilteredAgents
    // Pero la mantenemos para compatibilidad con el ng-change del input
    loadFilteredAgents();
  };

  // ✅ Y actualiza clearFilters para resetear también el searchText:
  $scope.clearFilters = function () {
    $scope.selectedProfile = 'ALL';
    $scope.selectedEnvType = 'ALL';
    $scope.selectedStatus = 'ALL';
    $scope.searchText = ''; // ✅ Limpiar también el texto de búsqueda
    loadFilteredAgents();
  };

  // Función para actualizar el intervalo de refresco
  $scope.updateInterval = function () {
    console.log('UPDATE SLIDER!!!!', $scope.refreshInterval);  // Verifica que el valor se actualiza
    if (agentsInterval) {
      $interval.cancel(agentsInterval);
    }
    agentsInterval = $interval(function () {
      loadFilteredAgents(); // Refrescamos los datos cada intervalo
    }, $scope.refreshInterval * 1000);  // Multiplicamos por 1000 para convertir a milisegundos
  };

  // Función para cerrar el panel y cancelar el intervalo
  $scope.close = function () {
    // Cancelar el intervalo al cerrar el panel
    if (agentsInterval) {
      $interval.cancel(agentsInterval);
    }
    $mdDialog.hide();
  };

  // Función para formatear el tiempo de actividad
  $scope.formatUptime = function (ms) {
    if (!ms && ms !== 0) return '-'; // Si el valor es inválido o nulo, se muestra un guion.
    const totalMinutes = Math.floor(ms / 60000);  // Convertimos los milisegundos a minutos.
    const totalHours = Math.floor(totalMinutes / 60); // Calculamos las horas.
    const totalDays = Math.floor(totalHours / 24); // Calculamos los días.
    const hours = totalHours % 24;  // Calculamos las horas restantes dentro del día.
    const minutes = totalMinutes % 60; // Calculamos los minutos restantes dentro de la hora.

    // Si es menor a 1 día
    if (totalDays === 0) {
      // Si es menor a 1 hora, mostramos solo minutos
      if (totalHours === 0) {
        return `${minutes}M`;
      } else {
        return `${hours}H ${minutes}M`; // Formato: <x>H <y>M
      }
    } else {
      // Si es superior a 1 día, mostramos días, horas y minutos
      return `${totalDays}D ${hours}H ${minutes}M`; // Formato: <x>D <y>H <z>M
    }
  };


  let debounceTimer;

  // Actualiza los filtros con un delay
  $scope.updateFilters = function () {
    // Limpiar el debounce anterior si existe

    if (debounceTimer) {
      $timeout.cancel(debounceTimer);
    }
    let debounceTime = ConfigurationService.getFromCache('frontend.search_debounce_time');
    // Establecer un nuevo debounce
    debounceTimer = $timeout(function () {
      // Aquí va la lógica que se ejecutará después de que el usuario haya dejado de escribir
      loadFilteredAgents();
      // Lógica para actualizar los filtros (puedes implementar tu función aquí)
    }, debounceTime); // 500 ms de retraso, puedes ajustar el tiempo según tus necesidades
  };



  // Función para aplicar los filtros manualmente
  $scope.applyFilters = function () {
    console.log('Aplicando filtros...');

    const accountId = JSON.parse(sessionStorage.getItem('user') || '{}').id;

    const filters = {
      profile: $scope.selectedProfile === 'ALL' || !$scope.selectedProfile ? null : $scope.selectedProfile,
      envType: $scope.selectedEnvType === 'ALL' || !$scope.selectedEnvType ? null : $scope.selectedEnvType,
      status: $scope.selectedStatus === 'ALL' || !$scope.selectedStatus ? null : $scope.selectedStatus
    };
    // Llamar a la API de búsqueda de agentes con los filtros seleccionados
    TelemetryAgentService.searchAgents(accountId, filters.profile, null, filters.envType, filters.status, null)
      .then(function (response) {
        console.log('Datos filtrados recibidos:', response.data);
        $scope.filteredAgents = response.data;  // Asignar los agentes filtrados a la variable
        $scope.filteredAgents = $scope.filteredAgents.map(enrichAgent);  // Enriquecemos los agentes
      })
      .catch(function (error) {
        console.error('❌ Error aplicando filtros:', error);
        $scope.filteredAgents = [];
      });
  };



  // Inicialización
  loadFilterData();  // Cargar los datos de los filtros
  loadFilteredAgents();  // Inicializamos los agentes filtrados
  $scope.updateInterval(); // Llamar la función para iniciar el intervalo

  $scope.restartAgent = function (agent) {
    dialogService.showDecisionDialog('Restart Agent', 'Are you sure you want to restart agent "' + agent.agentName + '"?')
      .then(function (decision) {
        if (decision === 'proceed') {
          console.log("Restarting agent:", agent.agentName);
          TelemetryAgentService.restartAgent(agent.agentId)
            .then(() => {
              $mdToast.showSimple('Agent restarted successfully');
            })
            .catch(err => {
              console.error('Error restarting agent:', err);
              showErrorDialog('Restart Failed', 'An error occurred while restarting the agent.');
            });
        }
      });
  };

  $scope.saveAgentConfig = function (agent) {
    console.log('PASO!!!!!!');

    const payload = {
      agentMaxDiskBufferSize: agent.agentMaxDiskBufferSize,
      agentMaxMemBufferSize: agent.agentMaxMemBufferSize,
      agentSyncInterval: agent.agentSyncInterval,
      agentUploadBlockSize: agent.agentUploadBlockSize,
      agentLogLevel: agent.agentLogLevel,
      agentLogBufferSize: agent.agentLogBufferSize,
      agentLogBatchSize: agent.agentLogBatchSize,
      agentName: agent.agentName,
      isPubliclyExposed: agent.isPubliclyExposed,
      isInternallyExposed: agent.isInternallyExposed,

      securityConfig: {
        external: {
          host: agent.securityConfig.external.host,
          public: {
            certificates: agent.securityConfig.external.public.certificates,
          },
          privateKey: agent.securityConfig.external.privateKey,
          privateKeyPassphrase: agent.securityConfig.external.privateKeyPassphrase,
        },
        internal: {
          host: agent.securityConfig.internal.host,
          public: {
            certificates: agent.securityConfig.internal.public.certificates,
          },
          privateKey: agent.securityConfig.internal.privateKey,
          privateKeyPassphrase: agent.securityConfig.internal.privateKeyPassphrase,
        }
      },
      osConfig: {
        agentOsTypeId: agent.osConfig?.agentOsTypeId || null,
        registryURL: agent.osConfig?.registryURL || '',
        registryProject: agent.osConfig?.registryProject || '',
        registryUserName: agent.osConfig?.registryUserName || '',
        registryPassword: agent.osConfig?.registryPassword || ''
      }
    };

    console.log('📦 Payload to send:', payload);

    // Llamamos al servicio para actualizar el agente
    return ProfileService.patchAgent(agent.agentId, payload)
      .then(() => {
        $mdToast.showSimple("✅ Agent configuration updated.");
        agent.editConfig = false;
        agent.dirtyFlag = true;
        agent._originalCopy = null;
      })
      .catch(err => {
        console.error("❌ Failed to save agent config", err);
        $mdToast.showSimple("Failed to update agent.");
        throw err; // Re-throw para que se propague el error
      });
  };

  $scope.editAgent = function (agent) {
    TelemetryAgentService.getAgentDetails(agent.agentId)
      .then(response => {
        const freshAgent = response.data;

        $mdDialog.show({
          controller: 'AgentConfigDialogController',
          templateUrl: 'profile/tabs/agents/configuration/agent-config-dialog.html',
          parent: angular.element(document.body),
          escapeToClose: false,
          multiple: true,
          clickOutsideToClose: true,
          locals: {
            agent: freshAgent,
            saveAgentConfig: $scope.saveAgentConfig
          }
        }).then(function (updatedAgent) {
          if (updatedAgent) {
            loadFilteredAgents(); // ✅ ahora sí refresca la lista real con filtros
          }
        });
      })
      .catch(error => {
        console.error("❌ Error fetching agent data:", error);
        dialogService.showErrorDialog(
          'Agent data could not be loaded',
          'There was a problem retrieving the latest data for this agent.'
        );
      });
  };

  $scope.stopAgent = function (agent) {
    dialogService.showDecisionDialog('Stop Agent', 'Are you sure you want to stop agent "' + agent.agentName + '"?')
      .then(function (decision) {
        if (decision === 'proceed') {
          console.log("Stopping agent:", agent.agentName);
          TelemetryAgentService.stopAgent(agent.agentId)
            .then(() => {
              $mdToast.showSimple('Agent stopped successfully');
            })
            .catch(err => {
              console.error('Error stopping agent:', err);
              showErrorDialog('Stop Failed', 'An error occurred while stopping the agent.');
            });
        }
      });
  };

  $scope.viewLogs = function (agent) {
    $mdDialog.show({
      controller: 'AgentLogsDialogController',
      templateUrl: 'profile/tabs/agents/logs/agent-logs-dialog.html',
      clickOutsideToClose: true,
      escapeToClose: false,
      multiple: true, // ✅ Permite superponer este diálogo sobre otros
      locals: {
        agent: agent
      }
    });
  };


  $scope.isAnyDownloadInProgress = false;
  $scope.isDownloading = {}; // mapa por agente, para íconos individuales


  $scope.isAnyDownloadInProgress = false;

  $scope.openDownloadDialog = function (agent) {
    if ($scope.isAnyDownloadInProgress) {
      $mdToast.showSimple('Another agent is currently downloading.');
      return;
    }

    $scope.isDownloading[agent.agentId] = true;
    $scope.isAnyDownloadInProgress = true;

    $mdDialog.show({
      templateUrl: 'profile/tabs/agents/download/download-dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      controller: 'DownloadAgentDialogController',
      multiple: true,
      escapeToClose: false,
      locals: {
        agent: agent
      }
    }).finally(function () {
      $scope.isDownloading[agent.agentId] = false;
      $scope.isAnyDownloadInProgress = false;
    });
  };

  // Agregar estas funciones helper al controller del panel de agentes

  /**
   * Cuenta cuántos agentes están online
   */
  $scope.getOnlineCount = function () {
    if (!$scope.filteredAgents) return 0;
    return $scope.filteredAgents.filter(function (agent) {
      return agent.agentStatus === 'ONLINE';
    }).length;
  };

  /**
   * Cuenta cuántos agentes están offline
   */
  $scope.getOfflineCount = function () {
    if (!$scope.filteredAgents) return 0;
    return $scope.filteredAgents.filter(function (agent) {
      return agent.agentStatus === 'OFFLINE';
    }).length;
  };

  /**
   * Obtiene el color del gradiente para métricas basado en rango
   */
  $scope.getMetricColor = function (value, min, max) {
    if (max === min || value === 0) {
      return '#e0e0e0';
    }

    var percentage = ((value - min) / (max - min)) * 100;
    return $scope.getPercentageColor(percentage);
  };

  /**
   * Obtiene el color del gradiente basado en porcentaje
   */
  $scope.getPercentageColor = function (percentage) {
    if (percentage < 30) {
      return '#4caf50'; // Verde
    } else if (percentage < 60) {
      return '#ff9800'; // Naranja
    } else if (percentage < 85) {
      return '#ff5722'; // Naranja rojizo
    } else {
      return '#f44336'; // Rojo
    }
  };


  // En tu AgentPanelController

  $scope.openAgentMetrics = function (agent) {
    console.log('📊 Opening metrics for agent:', agent.agentName || agent.agentId);

    // ✅ NUEVO: Verificar PRIMERO si hay métricas disponibles
    TelemetryAgentService.getMetricsTimeRange(agent.agentId)
      .then(function (response) {
        // ✅ Si hay 204, mostrar dialog de información directamente
        if (response.status === 204) {
          console.warn('⚠️ No metrics available for this agent (204 No Content)');

          // ✅ Mensaje personalizado según estado del agente
          let message = 'There are no metrics available for agent <strong>"' +
            (agent.agentName || agent.agentId) + '"</strong>.<br><br>';

          if (agent.agentStatus !== 'ONLINE') {
            message += '⚠️ <strong>Agent Status:</strong> ' + agent.agentStatus + '<br><br>' +
              'The agent is currently <strong>not running</strong>. ' +
              'Please <strong>start the agent</strong> to begin collecting metrics data.';
          } else {
            message += 'Metrics will appear once the agent starts collecting data.';
          }

          dialogService.showInformationDialog(
            'No Metrics Available',
            message
          );

          return; // ✅ NO abrir el dialog de stats
        }

        // ✅ Si hay datos (200 OK), verificar que realmente hay timestamps
        const data = response.data;

        if (!data || !data.minTimestamp || !data.maxTimestamp) {
          console.warn('⚠️ No metrics data available');

          // ✅ Mensaje personalizado según estado del agente
          let message = 'There are no metrics available for agent <strong>"' +
            (agent.agentName || agent.agentId) + '"</strong>.<br><br>';

          if (agent.agentStatus !== 'ONLINE') {
            message += '⚠️ <strong>Agent Status:</strong> ' + agent.agentStatus + '<br><br>' +
              'The agent is currently <strong>not running</strong>. ' +
              'Please <strong>start the agent</strong> to begin collecting metrics data.';
          } else {
            message += 'Metrics will appear once the agent starts collecting data.';
          }

          dialogService.showInformationDialog(
            'No Metrics Available',
            message
          );

          return; // ✅ NO abrir el dialog de stats
        }

        // ✅ TODO OK: Abrir el dialog de stats normalmente
        console.log('✅ Metrics available, opening stats dialog');

        $mdDialog.show({
          controller: 'AgentStatsDialogController',
          templateUrl: '/profile/tabs/agents/stats/agent-stats-dialog.html',
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          multiple: true,
          fullscreen: false,
          locals: {
            agent: agent
          }
        });
      })
      .catch(function (error) {
        console.error('❌ Error checking metrics availability:', error);

        // ✅ Si es 204 en el catch
        if (error.status === 204) {
          // ✅ Mensaje personalizado según estado del agente
          let message = 'There are no metrics available for agent <strong>"' +
            (agent.agentName || agent.agentId) + '"</strong>.<br><br>';

          if (agent.agentStatus !== 'ONLINE') {
            message += '⚠️ <strong>Agent Status:</strong> ' + agent.agentStatus + '<br><br>' +
              'The agent is currently <strong>not running</strong>. ' +
              'Please <strong>start the agent</strong> to begin collecting metrics data.';
          } else {
            message += 'Metrics will appear once the agent starts collecting data.';
          }

          dialogService.showInformationDialog(
            'No Metrics Available',
            message
          );
          return;
        }

        // ✅ Error real
        dialogService.showErrorDialog(
          'Error Loading Metrics',
          'An error occurred while checking metrics availability for agent <strong>"' +
          (agent.agentName || agent.agentId) +
          '"</strong>.<br><br>Please try again later.'
        );
      });
  };

});
