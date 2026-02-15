angular.module('bizmetryApp').controller('HomeController', function ($scope, $http, $location, CONFIG, $mdDialog, ProfileService,
  ConfigurationService, AuthService, dialogService,
  PlatformInfoService, ProfileService, $timeout,
  TemplateInstanceService, $mdToast, $sce, $rootScope  // ✅ Agregar $rootScope
) {
  console.log("🏁 HomeController activo");

  $scope.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  console.log("✅ currentUser>>>>>>> :", $scope.currentUser);

  // ✅ LISTENER PARA ACTUALIZAR EL USUARIO CUANDO SE EDITA EL PERFIL
  $rootScope.$on('user:profileUpdated', function (event, updatedData) {
    console.log('🔄 Home: User profile updated event received:', updatedData);
    
    if ($scope.currentUser) {
      $scope.currentUser.firstName = updatedData.firstName;
      $scope.currentUser.lastName = updatedData.lastName;
      console.log('✅ Home: currentUser updated:', $scope.currentUser);
    }
  });

  $scope.profiles = [];

  var defaultLength = 20;

  $scope.config = {
    truncate: {
      profileName: ConfigurationService.getFromCache('frontend.home.cards.card_title_max_length') || defaultLength,
      projectName: ConfigurationService.getFromCache('frontend.home.cards.card_project_max_length') || defaultLength,
      description: ConfigurationService.getFromCache('frontend.home.cards.card_description_max_length') || defaultLength,
      bizDomain: ConfigurationService.getFromCache('frontend.home.cards.card_bizdomain_max_length') || defaultLength,
      techStack: ConfigurationService.getFromCache('frontend.home.cards.card_techstack_max_length') || defaultLength,
      language: ConfigurationService.getFromCache('frontend.home.cards.card_language_max_length') || defaultLength,
      templateName: ConfigurationService.getFromCache('frontend.home.cards.card_template_name_max_length') || defaultLength,
      createdBy: ConfigurationService.getFromCache('frontend.home.cards.card_createdby_max_length') || defaultLength
    }
  };

  $scope.logout = function () {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    $location.path('/login');
  };

  $scope.openCreateProfileDialog = function () {
    console.log("➕ Crear nuevo perfil (modal o redirección)");
  };

  $scope.getCardColor = function (profile) {
    const pastelColors = [
      '#FFEBEE', // rosa claro
      '#E3F2FD', // celeste claro
      '#F3E5F5', // lavanda
      '#E8F5E9', // verde claro
      '#FFF8E1', // amarillo vainilla
      '#FBE9E7', // coral suave
      '#E0F7FA'  // turquesa claro
    ];

    // Cálculo determinístico en base al UUID

    const hash = Array.from(profile.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    color = pastelColors[hash % pastelColors.length];

    return color;
  };


  $scope.getAccountTypeColor = function (accountTypeName) {
    const hash = accountTypeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const palette = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#0097a7'];
    return palette[hash % palette.length];
  };

  $scope.editProfile = function (profile) {
    console.log("✏️ Edit profile:", profile);
    // TODO: implementar modal o redirección
  };

  $scope.showProfileDetails = function (profile, tabIndex) {
    let profileNow = null;
    let templateNow = null;

    ProfileService.getProfileById(profile.id)
      .then(function (response) {
        profileNow = response.data;
        return TemplateInstanceService.getTemplateInstanceById(profileNow.templateId);
      })
      .then(function (response) {
        templateNow = response.data;

        return $mdDialog.show({
          controller: 'ProfileDetailsDialogController',
          templateUrl: 'profile/profile-details-dialog.html',
          parent: angular.element(document.body),
          clickOutsideToClose: true,
          escapeToClose: false,
          locals: {
            profile: profileNow,
            template: templateNow,
            initialTabIndex: tabIndex || 0
          }
        });
      })
      .catch(function (err) {
        console.error('❌ Failed to retrieve data:', err);
        dialogService.showErrorDialog(
          'Data Retrieval Error',
          'An error occurred while fetching the profile or template details. Please try again later.'
        );
      })
      .finally(function () {
        // siempre refrescamos la lista del home al cerrar el diálogo
        if (typeof $scope.fetchProfiles === 'function') {
          $scope.fetchProfiles();
        } else {
          console.warn('fetchProfiles no está definido en $scope');
        }
      });
  };


  $scope.openProfileDetails = function (profile, tabIndex) {
    $scope.selectedProfile = profile;
    $scope.selectedTabIndex = tabIndex;
    $scope.showProfileDetails(profile, tabIndex);
  };



  // 🆕 Nuevo: toggle de enable/disable
  $scope.toggleProfileEnabled = function (profile) {
    profile.loading = true;

    $http({
      method: 'PATCH',
      url: `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry/profile/${profile.id}`,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Account-Id': $scope.currentUser.id
      },
      data: {
        isEnabled: profile.isEnabled
      },
      bmSkipLoader: true // ⬅️ omite el overlay global; usás tu spinner local
    })
      .then(function (response) {
        console.log("✅ Profile isEnabled actualizado:", response.data);
      })
      .catch(function (error) {
        console.error("❌ Error actualizando isEnabled:", error);
        profile.isEnabled = !profile.isEnabled; // revertir visualmente
      })
      .finally(function () {
        profile.loading = false;
      });
  };



  $scope.deleteProfile = function (profile) {
    dialogService.showConfirmationDialog(
      'Delete Profile',
      `Are you sure you want to delete profile "<strong>${profile.profileName}</strong>"? All associated configurations including templates and agents will be <strong>irreversibly destroyed</strong> and <strong>permanently discarded</strong>.<br><br>Before proceeding, make sure you have backed up your profile configuration if needed.`,
      profile.profileName, // El nombre a confirmar
      true                 // dangerMode = true (rojo)
    ).then(function (decision) {
      if (decision === 'confirmed') {
        console.log('✅ User confirmed deletion for profile:', profile.profileName);

        // Eliminar el perfil
        ProfileService.deleteProfile(profile.id)
          .then(function () {
            console.log(`✅ Profile ${profile.profileName} deleted successfully`);

            // Remover de la lista local
            $scope.profiles = $scope.profiles.filter(p => p.id !== profile.id);

            // Mostrar toast de éxito
            $mdToast.show(
              $mdToast.simple()
                .textContent(`✅ Profile "${profile.profileName}" deleted successfully`)
                .position('top right')
                .hideDelay(3000)
            );
          })
          .catch(function (error) {
            console.error('❌ Failed to delete profile:', error);

            var errorMessage = 'Failed to delete profile. Please try again.';
            if (error.data) {
              if (typeof error.data === 'string' || (error.data.error && error.data.message)) {
                errorMessage = dialogService.formatErrorMessage(error.data);
              } else if (error.data.message) {
                errorMessage = error.data.message;
              }
            }

            dialogService.showErrorDialog('Delete Failed', errorMessage);
          });
      } else {
        console.log('❌ User cancelled profile deletion');
      }
    });
  };

  $scope.cloneProfile = function (profile) {
    $http({
      method: 'POST',
      url: `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry/profile/${profile.id}/clone`,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Account-Id': $scope.currentUser.id
      }
    })
      .then(function (response) {
        const newProfile = response.data;
        $scope.profiles.push(newProfile); // agregar a la lista local

        // ✅ Toast de éxito
        $mdToast.show(
          $mdToast.simple()
            .textContent(`✅ Profile Cloned Successfully`)
            .position('top right')
            .hideDelay(3000)
        );
      })
      .catch(function (err) {
        console.error('❌ Clone failed', err);

        // ❌ Dialogo de error (usando tu servicio)
        const backendMsg =
          (err && err.data && (err.data.message || err.data.error)) ||
          (err && err.status ? `HTTP ${err.status} ${err.statusText || ''}`.trim() : null) ||
          'Failed to clone the profile. Please try again later.';

        dialogService.showErrorDialog('Profile Clone Error', backendMsg);
      });
  };

  $scope.forceCloseMenus = function ($event) {
    $event.stopPropagation();
    $event.preventDefault();

    // Busca cualquier menú activo y lo cierra forzadamente
    const openMenus = document.querySelectorAll('md-menu._md-open');
    openMenus.forEach(menu => {
      const scope = angular.element(menu).scope();
      if (scope && scope.$mdMenu) {
        scope.$mdMenu.close();
      }
    });
  };

  $scope.openDatasourceDialog = function () {
    $mdDialog.show({
      controller: 'DatasourceDialogController',
      templateUrl: 'datasources/datasource-dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      escapeToClose: false,
      fullscreen: true
    });
  };

  $scope.openJobsDialog = function () {
    $mdDialog.show({
      controller: 'JobDefinitionsDialogController',
      templateUrl: 'home/main-menu/jobs/job-definitions-dialog.html',
      parent: angular.element(document.body),
      escapeToClose: false,
      clickOutsideToClose: true
    });
  };

  // Obtener platformInfo desde el servicio
  $scope.platformInfo = PlatformInfoService.getPlatformInfo();

  $scope.openNotificationsDialog = function (ev) {
    $mdDialog.show({
      controller: 'NotificationsDialogController',
      templateUrl: 'notifications/view-notifications-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      escapeToClose: false,
      clickOutsideToClose: true,
      fullscreen: true
    });
  };

  $scope.openAgentsDialog = function (ev) {
    $mdDialog.show({
      controller: 'AgentsPanelController',
      templateUrl: 'home/main-menu/agent-panel/agents-panel.html', // ajustá esta ruta si cambia
      parent: angular.element(document.body),
      targetEvent: ev,
      escapeToClose: false,
      clickOutsideToClose: true,
      fullscreen: true
    });
  };

  $scope.deleteAccount = function () {
    // Get organization name from current user and format it (replace spaces with hyphens)
    $scope.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    var orgName = $scope.currentUser.orgName || 'organization';

    dialogService.showConfirmationDialog(
      'Delete Account',
      'Are you sure you want to delete your account? All related configurations will be <strong>irreversibly destroyed</strong>, and all agents shall be <strong>decommissioned and retired</strong>, making them unusable.<br><br>Before proceeding, make sure you have backed up your account by using the Export option.',
      orgName, // El nombre a confirmar (el diálogo automáticamente reemplaza espacios con guiones)
      true     // dangerMode = true (rojo)
    ).then(function (decision) {
      if (decision === 'confirmed') {
        console.log('✅ User confirmed deletion for org:', orgName);

        // Llamada al servicio para eliminar la cuenta
        AuthService.deleteAccount($scope.currentUser.id)
          .then(function () {
            console.log('✅ Account deleted successfully.');

            dialogService.showSuccessDialog(
              'Account Deleted',
              'Your account has been successfully deleted.'
            ).then(function () {
              // Clear session storage
              sessionStorage.clear();
              $location.path('/login');
            });
          })
          .catch(function (error) {
            console.error('❌ Failed to delete account:', error);

            var errorMessage = 'Failed to delete account. Please try again.';
            if (error.data) {
              if (typeof error.data === 'string' || (error.data.error && error.data.message)) {
                errorMessage = dialogService.formatErrorMessage(error.data);
              } else if (error.data.message) {
                errorMessage = error.data.message;
              }
            }

            dialogService.showErrorDialog('Delete Failed', errorMessage);
          });
      } else {
        console.log('❌ User cancelled account deletion');
      }
    });
  };


  $scope.openCreateProfileWizard = function (ev) {
    $mdDialog.show({
      controller: 'CreateAgentWizardController',   // tu ctrl del paso 1
      templateUrl: '/home/main-menu/create-profile/create-profile-wizard.html',      // el HTML que ya armaste
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: false,
      escapeToClose: false
    }).then(function (result) {
      $scope.fetchProfiles();
    }, function () {
      // Cancelado: no hacer nada
    });
  };


  $scope.logout = function () {
    // Muestra el diálogo de confirmación de cierre de sesión
    dialogService.showDecisionDialog('Logout Confirmation', 'Are you sure you want to terminate the session?')
      .then(function (decision) {
        if (decision === 'proceed') {
          console.log('User chose to terminate the session');
          // Terminar la sesión llamando a la función logout en AuthService
          AuthService.logout()
            .then(function (response) {
              // Si la sesión se termina correctamente, redirigir al login
              $location.path('/login');
            })
            .catch(function (error) {
              // Manejo de errores si la API de logout falla
              console.error('Logout failed:', error);
            });
        } else {
          console.log('User chose to go back');
          // No se hace nada si el usuario elige "Go Back", el diálogo se cierra automáticamente
        }
      });
  };



  // 🔀 Mapear $scope.selectedSort a { criteria, direction }
  function mapSort(selectedSort) {
    switch (selectedSort) {
      case 'NAME_ASC': return { criteria: 'profileName', direction: 'ASC' };
      case 'NAME_DESC': return { criteria: 'profileName', direction: 'DESC' };
      case 'PROJECT_ASC': return { criteria: 'projectName', direction: 'ASC' };
      case 'PROJECT_DESC': return { criteria: 'projectName', direction: 'DESC' };
      case 'CREATED_ASC': return { criteria: 'createdTs', direction: 'ASC' };
      case 'CREATED_DESC': return { criteria: 'createdTs', direction: 'DESC' };
      default: return { criteria: 'createdTs', direction: 'DESC' }; // fallback
    }
  }

  // --- Estado inicial

  let debounceTime = ConfigurationService.getFromCache('frontend.search_debounce_time');
  let defaultPageSize = ConfigurationService.getFromCache('frontend.profile_page_size');
  let defaultSortCriteria = ConfigurationService.getFromCache('frontend.profile_sort_criteria');

  console.log('PAGE SIZE->', defaultPageSize);

  $scope.searchText = '';
  $scope.selectedSort = defaultSortCriteria;

  $scope.paging = {
    pageOffset: 0,         // Página actual (0-based)
    pageSize: defaultPageSize || 10, // Tamaño de la página (ajusta según tu valor por defecto)
    pageCount: 0          // Total de páginas
  };

  console.log('Scope.paging.pageSize=', $scope.paging.pageSize);

  $scope.loading = false;
  $scope.profiles = [];

  let searchDebouncePromise = null;

  // --- Cargar perfiles usando el servicio
  $scope.fetchProfiles = function () {
    $scope.loading = true;

    var sort = mapSort($scope.selectedSort);

    ProfileService.getAllProfiles({
      sortCriteria: sort.criteria,
      sortDirection: sort.direction,
      page: $scope.paging.pageOffset,
      size: $scope.paging.pageSize,
      search: $scope.searchText && $scope.searchText.trim() ? $scope.searchText.trim() : null
    })
      .then(function (res) {
        // Manejar la respuesta con `paging` y `profiles`
        if (res.data) {
          // Extraer solo `profileData` de cada perfil
          $scope.profiles = res.data.profiles || {};

          // Guardar la información de paginación
          $scope.paging = res.data.paging || {};

          // Si necesitas usar el total de páginas o tamaño de página, puedes hacerlo desde `paging`
          console.log('✅ Profiles loaded:', $scope.profiles);
          console.log('Paging info:', $scope.paging);
        }
      })
      .catch(function (err) {
        console.error('❌ Error loading profiles:', err);
      })
      .finally(function () {
        $scope.loading = false;
      });
  };

  // --- Cambio de criterio de sort (6 opciones combinadas)
  $scope.onSortChange = function () {
    $scope.paging.pageOffset = 0;   // reset de página
    $scope.fetchProfiles();
  };

  $scope.changePageSize = function () {
    $scope.paging.pageOffset = 0;
    $scope.fetchProfiles();
  }

  // --- Debounce de 2s en búsqueda (usando ng-change="onSearchChange()")
  $scope.onSearchChange = function () {
    if (searchDebouncePromise) {
      $timeout.cancel(searchDebouncePromise);
    }
    searchDebouncePromise = $timeout(function () {
      $scope.paging.pageOffset = 0; // reset de página
      $scope.fetchProfiles();
    }, debounceTime);
  };

  // --- Carga inicial
  $scope.fetchProfiles();

  $scope.clearFilters = function () {
    $scope.selectedSort = '';
    $scope.searchText = '';
    $scope.paging.pageOffset = 0;
    $scope.paging.pageSize = defaultPageSize;
    $scope.fetchProfiles();
  }

  $scope.pageInputDisplay = $scope.paging.pageOffset + 1;  // Mostrar 1-based en el input

  // Ir a la primera página
  $scope.goFirst = function () {
    if ($scope.paging.pageOffset > 0) {
      $scope.paging.pageOffset = 0;
      $scope.fetchProfiles();
    }
  };

  // Ir a la página anterior
  $scope.goPrev = function () {
    if ($scope.paging.pageOffset > 0) {
      $scope.paging.pageOffset--;
      $scope.fetchProfiles();
    }
  };

  // Ir a la página siguiente
  $scope.goNext = function () {
    if ($scope.paging.pageOffset < ($scope.paging.pageCount - 1)) {
      $scope.paging.pageOffset++;
      $scope.fetchProfiles();
    }
  };

  // Ir a la última página
  $scope.goLast = function () {
    if ($scope.paging.pageOffset < ($scope.paging.pageCount - 1)) {
      $scope.paging.pageOffset = $scope.paging.pageCount - 1;
      $scope.fetchProfiles();
    }
  };

  $scope.openDocumentation = function (ev) {
    var docUrl = ConfigurationService.getFromCache('bizmetry.urls.docs_base_url') || 'https://docs.bizmetry.io';
    console.log('>>>>>>> DOCURL =', docUrl);

    $mdDialog.show({
      controller: function DialogController($scope, $mdDialog, $sce) {
        // Marcar URL como segura
        $scope.docUrl = $sce.trustAsResourceUrl(docUrl);

        $scope.closeDialog = function () {
          $mdDialog.hide();
        };
      },
      template: `
    <md-dialog aria-label="BizMetry Help" style="width: 90vw; max-width: 1400px; height: 80vh;">
      <md-toolbar class="md-primary" style="color: white; background-color: #1976d2;">
        <div class="md-toolbar-tools">
          <h2 style="font-weight: 500; color: white;">BizMetry Help</h2>
          <span flex></span>
          <md-button class="md-icon-button" ng-click="closeDialog()" aria-label="Close">
            <md-icon class="material-icons" style="color: white;">close</md-icon>
          </md-button>
        </div>
      </md-toolbar>

      <md-dialog-content style="height: calc(100% - 64px); padding: 0;">
        <!-- Solo mostrar el iframe con el contenido de MKDocs -->
        <iframe ng-src="{{docUrl}}" style="width:100%; height:100%; border:0;"></iframe>
      </md-dialog-content>
    </md-dialog>
    `,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
  };

  $scope.openUsersDialog = function (ev) {
  $mdDialog.show({
    controller: 'UsersRolesDialogController',
    templateUrl: 'home/main-menu/users/user-management-dialog.html',
    parent: angular.element(document.body),
    targetEvent: ev,
    escapeToClose: false,
    clickOutsideToClose: false,
    fullscreen: false,
    multiple:true,
    locals: {
      accountId: $scope.currentUser.id
    }
  });
};

// Agregar esta función al HomeController.js

/**
 * Abrir el diálogo de perfil del usuario
 */
$scope.openUserProfileDialog = function (ev) {
  console.log('👤 Opening user profile dialog for:', $scope.currentUser.email);

  $mdDialog.show({
    controller: 'UserProfileDialogController',
    templateUrl: 'home/user-profile/user-profile-dialog.html',
    parent: angular.element(document.body),
    targetEvent: ev,
    clickOutsideToClose: true,
    escapeToClose: true,
    multiple:true,
    locals: {
      currentUser: $scope.currentUser  // Pasamos el objeto completo
    }
  });
};



});

