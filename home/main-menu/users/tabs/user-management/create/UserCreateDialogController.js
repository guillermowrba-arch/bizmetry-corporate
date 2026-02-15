angular.module('bizmetryApp').controller('UserCreateDialogController', function (
    $scope, $mdDialog, $timeout, $mdToast,
    UserService, dialogService, ConfigurationService, TelemetryAgentService,
    roles, accountId
) {
    console.log('🚀 UserCreateDialogController initialized');
    console.log('📋 Available roles:', roles);
    console.log('🆔 Account ID:', accountId);

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    $scope.accountId = accountId;
    $scope.roles = roles || [];
    $scope.loadingRoles = false;
    $scope.creating = false;

    $scope.showPassword = false;
    $scope.showPasswordConfirm = false;

    // Lista de emails existentes para validación local
    $scope.existingEmails = [];
    $scope.loadingEmails = true;

    // Nuevo usuario
    $scope.newUser = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        passwordConfirm: ''
    };

    // Password pattern: al menos 1 mayúscula, 1 número, 1 carácter especial (#@_!), mínimo 8 caracteres
    $scope.passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[#@_!]).{8,}$/;

    // Selección de roles (objeto con roleId como key)
    $scope.roleSelection = {};

    // Validación de email
    $scope.emailValidation = {
        checking: false,
        exists: false,
        available: false,
        validatingDomain: false,
        invalidDomain: false
    };

    // Validación de password
    $scope.passwordValidation = {
        checked: false,
        match: false
    };

    // ========================================
    // EMAIL VALIDATION
    // ========================================

    $scope.checkEmailAvailability = function () {
        const email = $scope.newUser.email;

        // Reset validation state
        $scope.emailValidation = {
            checking: false,
            exists: false,
            available: false,
            validatingDomain: false,
            invalidDomain: false
        };

        // Validar formato básico
        if (!email || !UserService.isValidEmail(email)) {
            return;
        }

        // Validación local contra la lista de emails existentes
        const emailLower = email.trim().toLowerCase();
        const emailExists = $scope.existingEmails.some(function (existingEmail) {
            return existingEmail.toLowerCase() === emailLower;
        });

        if (emailExists) {
            $scope.emailValidation.exists = true;
            $scope.emailValidation.available = false;
            console.log('❌ Email already exists:', email);
            return;
        }

        // Extraer dominio del email
        const domain = email.split('@')[1];
        if (!domain) {
            return;
        }

        // Validar dominio usando la API
        validateEmailDomain(domain, email);
    };

    // Validar dominio del email
    function validateEmailDomain(domain, fullEmail) {
        $scope.emailValidation.validatingDomain = true;

        // Construir URL con el dominio
        const domainUrl = 'https://' + domain;

        console.log('🔍 Validating email domain:', domain);

        TelemetryAgentService.validateAgentURL(domainUrl)
            .then(function (response) {
                $scope.emailValidation.validatingDomain = false;

                // Si la validación es exitosa, el dominio es válido
                $scope.emailValidation.invalidDomain = false;
                $scope.emailValidation.exists = false;
                $scope.emailValidation.available = true;
                console.log('✅ Email domain is valid:', domain);
            })
            .catch(function (error) {
                $scope.emailValidation.validatingDomain = false;
                $scope.emailValidation.invalidDomain = true;
                $scope.emailValidation.available = false;
                console.error('❌ Email domain is invalid:', domain, error);
            });
    }

    // ========================================
    // PASSWORD VALIDATION
    // ========================================

    $scope.validatePasswordMatch = function () {
        const password = $scope.newUser.password;
        const confirm = $scope.newUser.passwordConfirm;

        if (!password || !confirm) {
            $scope.passwordValidation.checked = false;
            $scope.passwordValidation.match = false;
            return;
        }

        $scope.passwordValidation.checked = true;
        $scope.passwordValidation.match = (password === confirm);
    };

    // Calcular fortaleza de contraseña (0-100)
    $scope.getPasswordStrength = function () {
        const password = $scope.newUser.password;
        if (!password) return 0;

        let strength = 0;

        // Longitud (máximo 30 puntos)
        if (password.length >= 8) strength += 15;
        if (password.length >= 12) strength += 10;
        if (password.length >= 16) strength += 5;

        // Tiene mayúsculas (20 puntos) - REQUERIDO
        if (/[A-Z]/.test(password)) strength += 20;

        // Tiene minúsculas (15 puntos)
        if (/[a-z]/.test(password)) strength += 15;

        // Tiene números (20 puntos) - REQUERIDO
        if (/[0-9]/.test(password)) strength += 20;

        // Tiene caracteres especiales requeridos (20 puntos) - REQUERIDO
        if (/[#@_!]/.test(password)) strength += 20;

        // Bonus: tiene otros caracteres especiales (5 puntos)
        if (/[^A-Za-z0-9#@_!]/.test(password)) strength += 5;

        return Math.min(strength, 100);
    };

    // ========================================
    // AUTO-GENERATE PASSWORD
    // ========================================

    $scope.autoGeneratePassword = function () {
        console.log('🔐 Auto-generating secure password...');

        // Generar password de 16 caracteres con todos los requisitos
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const specialChars = '#@_!';

        // Asegurar al menos 1 de cada tipo requerido
        let password = '';

        // 1 uppercase
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

        // 1 number
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));

        // 1 special char
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

        // Llenar el resto hasta 16 caracteres con caracteres aleatorios de todos los tipos
        const allChars = uppercase + lowercase + numbers + specialChars;
        for (let i = password.length; i < 16; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Mezclar el password para que no siempre empiece con uppercase-number-special
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        // Asignar a ambos campos
        $scope.newUser.password = password;
        $scope.newUser.passwordConfirm = password;

        // Marcar los campos como touched para que se muestren las validaciones
        if ($scope.userCreateForm && $scope.userCreateForm.password) {
            $scope.userCreateForm.password.$setTouched();
        }
        if ($scope.userCreateForm && $scope.userCreateForm.passwordConfirm) {
            $scope.userCreateForm.passwordConfirm.$setTouched();
        }

        // Validar match
        $scope.validatePasswordMatch();

        console.log('✅ Password auto-generated and filled:', password);

        // Mostrar toast de confirmación
        $mdToast.show(
            $mdToast.simple()
                .textContent('🔐 Secure password generated!')
                .position('top right')
                .hideDelay(2000)
        );
    };

    // ========================================
    // ROLE SELECTION
    // ========================================

    $scope.updateSelectedRoles = function () {
        // Se llama cuando cambia la selección de roles
        console.log('🔄 Role selection updated:', $scope.roleSelection);
    };

    $scope.getSelectedRolesCount = function () {
        let count = 0;
        for (let roleId in $scope.roleSelection) {
            if ($scope.roleSelection[roleId] === true) {
                count++;
            }
        }
        return count;
    };

    // Mostrar permisos de un rol
    $scope.showPermissions = function (event, role) {
        console.log('👁️ Showing permissions for role:', role.name);
        console.log('📋 Authorizations:', role.authorizations);

        // Prevenir que el click se propague al checkbox
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Abrir diálogo con los permisos
        $mdDialog.show({
            controller: 'RolePermissionsDialogController',
            templateUrl: '/home/main-menu/users/tabs/user-management/create/role-permissions-dialog.html',
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            escapeToClose: true,
            multiple: true,
            locals: {
                role: role
            }
        });
    };

    // Obtener lista de IDs de roles seleccionados
    function getSelectedRoleIds() {
        const selectedIds = [];
        for (let roleId in $scope.roleSelection) {
            if ($scope.roleSelection[roleId] === true) {
                selectedIds.push(roleId);
            }
        }
        return selectedIds;
    }

    // ========================================
    // FORM VALIDATION
    // ========================================

    $scope.isFormValid = function () {
        // Validar campos requeridos
        const hasFirstName = $scope.newUser.firstName && $scope.newUser.firstName.trim().length > 0;
        const hasLastName = $scope.newUser.lastName && $scope.newUser.lastName.trim().length > 0;
        const hasEmail = $scope.newUser.email && $scope.newUser.email.trim().length > 0;
        const hasValidEmail = hasEmail && UserService.isValidEmail($scope.newUser.email);

        // Email es válido SI:
        // - Tiene formato válido Y
        // - NO está marcado como existente (exists = true) Y
        // - NO tiene dominio inválido (invalidDomain = true) Y
        // - NO está validando el dominio actualmente
        const emailIsValid = hasValidEmail &&
            !$scope.emailValidation.exists &&
            !$scope.emailValidation.invalidDomain &&
            !$scope.emailValidation.validatingDomain;

        // Validar password con patrón
        const hasPassword = $scope.newUser.password && $scope.newUser.password.length >= 8;
        const passwordMatchesPattern = hasPassword && $scope.passwordPattern.test($scope.newUser.password);
        const hasPasswordConfirm = $scope.newUser.passwordConfirm && $scope.newUser.passwordConfirm.length > 0;
        const passwordsMatch = $scope.newUser.password && $scope.newUser.passwordConfirm &&
            ($scope.newUser.password === $scope.newUser.passwordConfirm);

        return hasFirstName &&
            hasLastName &&
            hasEmail &&
            hasValidEmail &&
            emailIsValid &&
            hasPassword &&
            passwordMatchesPattern &&
            hasPasswordConfirm &&
            passwordsMatch;
    };

    // ========================================
    // CREATE USER
    // ========================================

    $scope.createUser = function () {
        if (!$scope.isFormValid()) {
            $mdToast.showSimple('⚠️ Please fill in all required fields correctly');
            return;
        }

        console.log('➕ Creating new user...');
        $scope.creating = true;

        // Obtener roles seleccionados
        const selectedRoleIds = getSelectedRoleIds();

        // Construir userRoles array
        const userRoles = selectedRoleIds.map(function (roleId) {
            const role = $scope.roles.find(r => r.id === roleId);
            return {
                id: roleId,
                name: role ? role.name : 'Unknown',
                enabled: true
            };
        });

        // Construir DTO
        const userDTO = {
            firstName: $scope.newUser.firstName.trim(),
            lastName: $scope.newUser.lastName.trim(),
            email: $scope.newUser.email.trim().toLowerCase(),
            password: $scope.newUser.password,
            userEnabled: true,
            userRoles: userRoles
        };

        console.log('📤 User DTO:', userDTO);

        // Llamar al servicio
        UserService.createUser(userDTO, $scope.accountId)
            .then(function (response) {
                console.log('✅ User created successfully:', response.data);
                $scope.creating = false;

                $mdToast.show(
                    $mdToast.simple()
                        .textContent('✅ User created successfully!')
                        .position('top right')
                        .hideDelay(3000)
                );

                // Cerrar diálogo y devolver el usuario creado
                $mdDialog.hide(response.data);
            })
            .catch(function (error) {
                console.error('❌ Error creating user:', error);
                $scope.creating = false;

                const errorMessage = error.data?.message || error.message || 'Unknown error';

                dialogService.showErrorDialog(
                    'Error Creating User',
                    'Failed to create user: ' + errorMessage
                );
            });
    };

    // ========================================
    // DIALOG ACTIONS
    // ========================================

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    (function init() {
        console.log('🎬 User Create Dialog initialized');
        console.log('👥 Roles available:', $scope.roles.length);

        // Cargar todos los emails existentes para validación local
        loadExistingEmails();

        // Si no hay roles, intentar cargarlos
        if (!$scope.roles || $scope.roles.length === 0) {
            $scope.loadingRoles = true;

            UserService.getRoles($scope.accountId)
                .then(function (response) {
                    $scope.roles = response.data || [];
                    console.log('✅ Roles loaded:', $scope.roles.length);
                    $scope.loadingRoles = false;
                })
                .catch(function (error) {
                    console.error('❌ Error loading roles:', error);
                    $scope.roles = [];
                    $scope.loadingRoles = false;
                });
        }

        // Watchers para forzar re-evaluación del botón
        $scope.$watch('newUser.firstName', function () { $scope.$evalAsync(); });
        $scope.$watch('newUser.lastName', function () { $scope.$evalAsync(); });
        $scope.$watch('newUser.email', function () { $scope.$evalAsync(); });
        $scope.$watch('newUser.password', function () { $scope.$evalAsync(); });
        $scope.$watch('newUser.passwordConfirm', function () { $scope.$evalAsync(); });
        $scope.$watch('emailValidation.exists', function () { $scope.$evalAsync(); });
        $scope.$watch('emailValidation.invalidDomain', function () { $scope.$evalAsync(); });
        $scope.$watch('emailValidation.validatingDomain', function () { $scope.$evalAsync(); });
    })();

    // Cargar todos los emails existentes
    function loadExistingEmails() {
        $scope.loadingEmails = true;

        // Obtener todos los usuarios (con paginación grande para traer todos)
        UserService.getAllUsers($scope.accountId, {
            page: 0,
            size: 10000 // Traer todos los usuarios
        })
            .then(function (response) {
                // ✅ FIX: response.data ahora es PagedUserResponse, no array directo
                const pagedResponse = response.data;
                const users = pagedResponse.content || [];

                // Extraer solo los emails
                $scope.existingEmails = users.map(function (user) {
                    return user.email;
                });

                console.log('✅ Loaded ' + $scope.existingEmails.length + ' existing emails for validation');
                $scope.loadingEmails = false;
            })
            .catch(function (error) {
                console.error('❌ Error loading existing emails:', error);
                $scope.existingEmails = [];
                $scope.loadingEmails = false;

                // No bloqueamos la creación si falla la carga de emails
                $mdToast.showSimple('⚠️ Could not load existing emails for validation');
            });
    }

});

// ========================================
// ROLE PERMISSIONS DIALOG CONTROLLER
// ========================================

angular.module('bizmetryApp').controller('RolePermissionsDialogController', function (
    $scope, $mdDialog, role
) {
    console.log('🔐 RolePermissionsDialogController initialized');
    console.log('📋 Role:', role);
    console.log('🔑 Authorizations count:', role.authorizations ? role.authorizations.length : 0);

    // ========================================
    // SCOPE VARIABLES
    // ========================================

    $scope.role = role;
    $scope.searchQuery = '';

    // ========================================
    // SEARCH & FILTER
    // ========================================

    // Filtrar permisos en tiempo real (case-insensitive)
    $scope.getFilteredPermissions = function () {
        if (!$scope.role.authorizations || $scope.role.authorizations.length === 0) {
            return [];
        }

        let filtered = $scope.role.authorizations;

        // Si hay búsqueda, filtrar
        if ($scope.searchQuery && $scope.searchQuery.trim().length > 0) {
            const query = $scope.searchQuery.toLowerCase().trim();

            filtered = filtered.filter(function (auth) {
                const name = (auth.name || '').toLowerCase();
                const description = (auth.description || '').toLowerCase();

                return name.includes(query) || description.includes(query);
            });
        }

        // Ordenar alfabéticamente por nombre (ascendente)
        return filtered.sort(function (a, b) {
            const nameA = (a.name || '').toUpperCase();
            const nameB = (b.name || '').toUpperCase();

            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    };

    // Limpiar búsqueda
    $scope.clearSearch = function () {
        $scope.searchQuery = '';
    };

    // ========================================
    // DIALOG ACTIONS
    // ========================================

    $scope.close = function () {
        $mdDialog.cancel();
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    (function init() {
        console.log('🎬 Role Permissions Dialog initialized');

        // Log all permissions for debugging
        if ($scope.role.authorizations && $scope.role.authorizations.length > 0) {
            console.log('📋 Permissions list:');
            $scope.role.authorizations.forEach(function (auth, index) {
                console.log(`  ${index + 1}. ${auth.name}: ${auth.description}`);
            });
        } else {
            console.warn('⚠️ No authorizations found for role:', $scope.role.name);
        }
    })();
});