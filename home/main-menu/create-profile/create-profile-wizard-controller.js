angular.module('bizmetryApp').controller('CreateAgentWizardController',
  function ($scope, $mdDialog, $mdToast, ProfileService, TemplateInstanceService, ReferenceDataService,
    dialogService
  ) {
    // ===== Modelo del Wizard =====
    $scope.wizard = {
      stepIndex: 0,                 // 0: Source, 1: Basic Info, 2: Connectivity, 3: Review
      totalSteps: 4,
      selection: null,              // valor elegido en Step 1
      steps: [
        { label: 'Profile Source' },
        { label: 'Basic Info' },
        { label: 'Details' },
        { label: 'Review' }
      ],
      // Modelo de Step 2
      profile: {
        name: '',                   // Se inicializa como vacío
        description: '',            // Se inicializa como vacío
        projectName: ''             // Se inicializa como vacío
      },
      // Modelo de Step 3 (para clonar perfiles)
      availableProfiles: [],        // Listado de perfiles obtenidos
      selectedProfileId: null,      // Solo guardamos el ID del perfil seleccionado
      selectedProfile: null,        // Perfil completo seleccionado (para mostrar detalles)
      availableTemplates: [],
      selectedTemplate: null,
      selectedLanguage: null,
      selectedBusinessDomain: null,
      selectedTechnologyStack: null,
      languages: [],
      businessDomains: [],
      technologyStacks: []
    };

    sessionStorage.removeItem('selectedProfileId');

    // Opciones Step 1
    $scope.options = [
      {
        value: 'clone-existing',
        label: 'Clone from an existing profile',
        help: 'Duplicate an existing agent profile and adjust settings.'
      },
      {
        value: 'empty-template',
        label: 'Start from an empty template',
        help: 'Create a brand-new profile with blank settings.'
      },
      {
        value: 'master-template',
        label: 'Start from a master template',
        help: 'Use a curated master template tailored to your technology stack and platform as a starting point.'
      }
    ];

    // ===== Acciones generales del diálogo =====
    $scope.onCancel = function () {
      dialogService.showDecisionDialog(
        'Cancel Profile Creation',
        'Are you sure you want to cancel the telemetry profile creation? All configuration progress will be lost and cannot be recovered.'
      ).then(function (decision) {
        if (decision === 'proceed') {
          $mdDialog.cancel();
        }
        // If decision === 'goBack', do nothing and user stays in the wizard
      });
    }
    // ===== Navegación (Step 1 → Step 2) =====
    $scope.onContinueStep1 = function () {
      if (!$scope.wizard.selection) return;
      $scope.wizard.stepIndex = 1;
    };

    $scope.continueFromDetails = function () {

      $scope.wizard.stepIndex = 3;
    }

    // ===== Navegación (Step 2 → Step 3), con validación =====
    $scope.continueFromBasicInfo = function (form) {
      $scope.wizard.stepIndex = 2; // Avanzar a Connectivity
      if ($scope.wizard.selection === 'clone-existing') {
        $scope.loadProfiles(); // Cargar los perfiles si se seleccionó clonar
      }
      else
        if ($scope.wizard.selection === 'master-template') {
          $scope.loadMasterTemplates();
        }

    };

    // ===== Navegación (Step 3 → Step 4) =====
    $scope.continueFromConnectivity = function () {
      if (!$scope.wizard.selectedProfileId) {
        return; // No se puede continuar si no se seleccionó un perfil
      }
      $scope.wizard.stepIndex = 3; // Avanzar a la pantalla de Review
    };

    $scope.loadMasterTemplates = function () {
      TemplateInstanceService.getAllMasterTemplates()
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            console.log('Response from GetAllMasterTemplates->', response.data);
            $scope.wizard.availableTemplates = response.data || {};
          }
          else {
            console.warn('No templates returned from API.');
            $scope.wizard.availableTemplates = [];
          }

        })
        .catch(function (error) {
          console.error('Error loading templates:', error);
          $scope.wizard.availableTemplates = [];
        });

    }

    // ===== Obtener todos los perfiles desde el servicio =====
    $scope.loadProfiles = function () {
      ProfileService.getAllProfiles()
        .then(function (response) {
          // Verificamos si la respuesta contiene datos de perfiles y paginación
          if (response.data && response.data.profiles && response.data.profiles.length > 0) {
            // Extraer solo `profileData` de cada perfil
            $scope.wizard.availableProfiles = response.data.profiles || {};

            console.log('** availableProfiles =>', $scope.wizard.availableProfiles);

            // Guardamos la información de paginación
            $scope.paging = response.data.paging || {}; // Guarda la paginación si está presente
            console.log('Paging info =>', $scope.paging);

            // Si hay un perfil previamente seleccionado en sessionStorage, restauramos su ID
            let savedProfileId = sessionStorage.getItem('selectedProfileId');
            if (savedProfileId) {
              $scope.wizard.selectedProfileId = savedProfileId;
              $scope.setSelectedProfile();  // Actualizamos los datos del perfil basado en el ID
            }
          } else {
            console.warn('No profiles returned from API.');
            $scope.wizard.availableProfiles = [];
          }
        })
        .catch(function (error) {
          console.error('Error loading profiles:', error);
          $scope.wizard.availableProfiles = [];
        });
    };

    // ===== Actualiza el perfil seleccionado basado en el ID =====
    $scope.setSelectedProfile = function () {
      const selectedProfile = $scope.wizard.availableProfiles.find(profile => profile.id === $scope.wizard.selectedProfileId);
      if (selectedProfile) {
        $scope.wizard.selectedProfile = selectedProfile;
      }
    };

    // ===== Back (permite volver a pasos anteriores) =====
    $scope.goBack = function () {
      if ($scope.wizard.stepIndex > 0) {
        $scope.wizard.stepIndex -= 1;
      }
    };

    // ===== Navegación del Stepper (solo a pasos ya alcanzados) =====
    $scope.gotoStep = function (idx) {
      if (idx <= $scope.wizard.stepIndex) {
        $scope.wizard.stepIndex = idx;
      }
    };

    // ===== Finalizar en Review =====
    $scope.finishWizard = function () {
      $mdDialog.hide({
        profileSource: $scope.wizard.selection,
        profile: angular.copy($scope.wizard.profile),
        selectedProfile: $scope.wizard.selectedProfile // Agregar el perfil seleccionado para clonar
      });
    };

    // ===== Validación del formulario =====
    $scope.isFormValid = function () {
      // Validación de los tres campos: name, projectName y description
      return $scope.wizard.profile.name && $scope.wizard.profile.projectName && $scope.wizard.profile.description;
    };

    // ===== Validar si el formulario de Connectivity es válido (perfil seleccionado) =====
    $scope.isConnectivityFormValid = function () {
      return !!$scope.wizard.selectedProfileId;
    };

    // ===== Continue - Solo habilitado si el formulario es válido =====
    $scope.onContinue = function () {
      if (!$scope.wizard.selection) return;
      $mdDialog.hide({ profileSource: $scope.wizard.selection });
    };

    // Guardar el ID del perfil seleccionado en sessionStorage
    $scope.saveProfileSelection = function () {
      sessionStorage.setItem('selectedProfileId', $scope.wizard.selectedProfileId);
    };

    // Llamar a esta función cuando se cambie el perfil
    $scope.$watch('wizard.selectedProfileId', function (newValue) {
      if (newValue) {
        $scope.setSelectedProfile();  // Actualiza el perfil completo
        $scope.saveProfileSelection();  // Guarda el ID seleccionado
      }
    });


    $scope.openTreeDialog = function (template) {

      console.log('TEMPLATE=>', template);
      // Filtrar recursos por resource_owner y atributos correspondientes
      const resourceOwners = template.template.resource_owners;
      const resources = template.template.resource_types;
      const attributes = template.template.attribute_types;
      const client_types = template.template.client_types;

      // Construir el árbol jerárquico
      $scope.treeData = resourceOwners.map(function (owner) {
        // Filtrar recursos que tienen el resource_owner como padre
        let resourcesForOwner = resources.filter(function (resource) {
          return resource.resource_owner.id === owner.id;
        });

        // Agregar atributos a cada recurso
        resourcesForOwner = resourcesForOwner.map(function (resource) {
          let attributesForResource = attributes.filter(function (attribute) {
            return attribute.resource_id === resource.id;
          });

          return {
            ...resource,
            attributes: attributesForResource
          };
        });

        return {
          ...owner,
          resources: resourcesForOwner
        };
      });
      console.log('TreeData=', $scope.treeData);
      // Abrir el diálogo con el árbol
      $mdDialog.show({
        controller: 'TreeTemplateViewController',
        templateUrl: 'template/treeView/tree-template-view.html',
        parent: angular.element(document.body),
        escapeToClose: false,
        clickOutsideToClose: true,
        multiple: true,
        locals: {
          treeData: $scope.treeData,
          clientTypes: template.template.client_types
        }
      });
    };

    // Load reference data for Language, Business Domain, and Technology Stack
    ReferenceDataService.getReferenceData('LANGUAGE').then(function (response) {
      $scope.wizard.languages = response.data;
      console.log('LANGUAGES=>', $scope.wizard.languages);
    });

    ReferenceDataService.getReferenceData('BUSINESS_DOMAIN').then(function (response) {
      $scope.wizard.businessDomains = response.data;
      console.log('Domains=>', $scope.wizard.businessDomains);
    });

    ReferenceDataService.getReferenceData('BUSINESS_TECHNOLOGY').then(function (response) {
      $scope.wizard.technologyStacks = response.data;
    });

    $scope.createProfile = function () {
      // Funciones helper para evitar null/undefined
      function safeGet(obj, path, fallback = null) {
        try {
          return path.split('.').reduce((acc, key) => acc && acc[key], obj) ?? fallback;
        } catch {
          return fallback;
        }
      }

      const profileData = {
        profileName: safeGet($scope, 'wizard.profile.name', ''),
        profileDescription: safeGet($scope, 'wizard.profile.description', ''),
        profileProject: safeGet($scope, 'wizard.profile.projectName', ''),
        createFrom: safeGet($scope, 'wizard.selection', ''), // 'clone-existing' o lo que haya
        master_template: {
          id: safeGet($scope, 'wizard.selectedTemplate.templateId'),
          name: safeGet($scope, 'wizard.selectedTemplate.templateName')
        },
        source_profile: {
          id: safeGet($scope, 'wizard.selectedProfile.id'),
          name: safeGet($scope, 'wizard.selectedProfile.profileName')
        },
        new_profile: {
          language: {
            id: safeGet($scope, 'wizard.selectedLanguage.refId'),
            name: safeGet($scope, 'wizard.selectedLanguage.refObjectLabel')
          },
          bizDomain: {
            id: safeGet($scope, 'wizard.selectedBusinessDomain.refId'),
            name: safeGet($scope, 'wizard.selectedBusinessDomain.refObjectLabel')
          },
          bizTechStack: {
            id: safeGet($scope, 'wizard.selectedTechnologyStack.refId'),
            name: safeGet($scope, 'wizard.selectedTechnologyStack.refObjectLabel')
          }
        }
      };

      console.log('Llamando a CreateProfile. ProfileData=', profileData);

      // Invocar el servicio createProfile con los datos mapeados
      ProfileService.createProfile(profileData)
        .then(function (response) {
          console.log('Perfil creado exitosamente:', response.data);

          // ✅ Toast de éxito
          $mdToast.show(
            $mdToast.simple()
              .textContent(`New Profile ${profileData.profileName} created successfully!`)
              .position('bottom right')
              .hideDelay(3000)
          );

          // ✅ Cerrar el diálogo (volver a home)
          $mdDialog.hide();

        })
        .catch(function (error) {
          console.error('Error al crear el perfil:', error);

          // ✅ Mostrar dialogo de error usando tu servicio centralizado
          dialogService.showErrorDialog(
            'Profile Creation Error',
            'An error occurred while creating the profile. Please try again later. Details= < ' + error.data.message + ' >'
          );
        });
    };

  });

