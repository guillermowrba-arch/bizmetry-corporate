angular.module('bizmetryApp').controller('UserEditDialogController', function (
    $scope, $mdDialog, $mdToast,
    UserService, user, roles, accountId
) {
    console.log('🎯 UserEditDialogController initialized');
    console.log('User to edit:', user);
    console.log('Available roles:', roles);
    console.log('Account ID:', accountId);

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    // Placeholder password (12 asteriscos para simular password existente)
    const PLACEHOLDER_PASSWORD = '************';

    // Clonar el usuario para edición (evitar modificar el original)
    $scope.editableUser = angular.copy(user);
    $scope.accountId = accountId;
    $scope.availableRoles = roles || [];

    // Password visibility toggles
    $scope.showPassword = false;
    $scope.showPasswordConfirm = false;

    // Guardar estado original para detectar cambios
    $scope.originalUser = {
        firstName: user.firstName,
        lastName: user.lastName
    };

    // Password pattern: al menos 1 mayúscula, 1 número, 1 carácter especial (#@_!), mínimo 8 caracteres
    $scope.passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[#@_!]).{8,}$/;

    // Estado de passwords - inicializados con placeholder
    $scope.passwords = {
        newPassword: PLACEHOLDER_PASSWORD,
        confirmPassword: PLACEHOLDER_PASSWORD
    };

    $scope.passwordValidation = {
        checked: false,
        match: true  // Inicialmente coinciden (ambos son placeholder)
    };

    $scope.hasChanges = false;  // Flag global de cambios

    // Guardar roles originales para detectar cambios
    $scope.originalRoles = {};
    if ($scope.editableUser.userRoles && $scope.editableUser.userRoles.length > 0) {
        $scope.editableUser.userRoles.forEach(function (userRole) {
            $scope.originalRoles[userRole.id] = true;
        });
    }

    // Inicializar selección de roles (marcar roles ya asignados)
    $scope.roleSelection = angular.copy($scope.originalRoles);

    console.log('📋 Original roles:', $scope.originalRoles);
    console.log('✅ Initial role selection:', $scope.roleSelection);

    // ========================================
    // HELPERS
    // ========================================

    $scope.getShortId = function (uuid) {
        if (!uuid) return 'N/A';
        const cleanId = uuid.replace(/-/g, '');
        return cleanId.slice(-10).toUpperCase();
    };

    $scope.getSelectedRolesCount = function() {
        let count = 0;
        for (let roleId in $scope.roleSelection) {
            if ($scope.roleSelection[roleId] === true) {
                count++;
            }
        }
        return count;
    };

    // Verificar si el password actual es el placeholder
    $scope.isPlaceholderPassword = function() {
        return $scope.passwords.newPassword === PLACEHOLDER_PASSWORD;
    };

    // ========================================
    // PASSWORD VALIDATION & STRENGTH
    // ========================================

    $scope.onPasswordChange = function () {
        // Si el usuario empieza a escribir, limpiar el placeholder
        if ($scope.passwords.newPassword === PLACEHOLDER_PASSWORD) {
            // El input ya tiene el nuevo valor, no hacer nada
        } else if ($scope.passwords.newPassword && $scope.passwords.newPassword.length > 0) {
            // Si escribió algo diferente al placeholder
            // Limpiar confirmPassword si aún tiene el placeholder
            if ($scope.passwords.confirmPassword === PLACEHOLDER_PASSWORD) {
                $scope.passwords.confirmPassword = '';
            }
        }

        $scope.validatePasswordMatch();
        $scope.checkForChanges();
    };

    $scope.validatePasswordMatch = function() {
        const password = $scope.passwords.newPassword;
        const confirm = $scope.passwords.confirmPassword;

        // Si ambos son placeholder, están "en match"
        if (password === PLACEHOLDER_PASSWORD && confirm === PLACEHOLDER_PASSWORD) {
            $scope.passwordValidation.checked = false;
            $scope.passwordValidation.match = true;
            return;
        }

        // Si alguno no es placeholder, validar normalmente
        if (!password || !confirm) {
            $scope.passwordValidation.checked = false;
            $scope.passwordValidation.match = false;
            return;
        }

        $scope.passwordValidation.checked = true;
        $scope.passwordValidation.match = (password === confirm);
    };

    // Calcular fortaleza de contraseña (0-100) - IGUAL QUE CREATE
    $scope.getPasswordStrength = function() {
        const password = $scope.passwords.newPassword;
        
        // No calcular para placeholder
        if (!password || password === PLACEHOLDER_PASSWORD) return 0;

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

    $scope.autoGeneratePassword = function() {
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
        $scope.passwords.newPassword = password;
        $scope.passwords.confirmPassword = password;
        
        // Marcar los campos como touched para que se muestren las validaciones
        if ($scope.editUserForm && $scope.editUserForm.password) {
            $scope.editUserForm.password.$setTouched();
        }
        if ($scope.editUserForm && $scope.editUserForm.passwordConfirm) {
            $scope.editUserForm.passwordConfirm.$setTouched();
        }
        
        // Validar match
        $scope.validatePasswordMatch();
        
        // Marcar como cambio
        $scope.checkForChanges();
        
        console.log('✅ Password auto-generated and filled');
        
        // Mostrar toast de confirmación
        $mdToast.show(
            $mdToast.simple()
                .textContent('🔐 Secure password generated!')
                .position('top right')
                .hideDelay(2000)
        );
    };

    // ========================================
    // CHANGE DETECTION
    // ========================================

    $scope.checkForChanges = function () {
        const firstNameChanged =
            $scope.editableUser.firstName !== $scope.originalUser.firstName;
        const lastNameChanged =
            $scope.editableUser.lastName  !== $scope.originalUser.lastName;

        // Password cambió SI ya no es el placeholder
        const passwordChanged = !$scope.isPlaceholderPassword();

        const rolesChanged =
            !angular.equals($scope.roleSelection, $scope.originalRoles);

        $scope.hasChanges =
            firstNameChanged || lastNameChanged || passwordChanged || rolesChanged;

        console.log('🔍 Change detection:', {
            firstNameChanged,
            lastNameChanged,
            passwordChanged,
            rolesChanged,
            hasChanges: $scope.hasChanges
        });
    };

    // ========================================
    // FORM VALIDATION
    // ========================================

    $scope.isFormValid = function () {
        // 1️⃣ Nombres requeridos
        if (!$scope.editableUser.firstName || !$scope.editableUser.lastName) {
            return false;
        }

        // 2️⃣ Validar password
        const isPlaceholder = $scope.isPlaceholderPassword();
        
        if (!isPlaceholder) {
            // Si cambió el password, validarlo
            if (!$scope.passwords.newPassword || $scope.passwords.newPassword.length < 8) {
                return false;
            }
            if (!$scope.passwordPattern.test($scope.passwords.newPassword)) {
                return false;
            }
            if (!$scope.passwordValidation.match) {
                return false;
            }
            if (!$scope.passwords.confirmPassword) {
                return false;
            }
        }

        // 3️⃣ Form Angular válido (excepto si password es placeholder)
        if ($scope.editUserForm && $scope.editUserForm.$invalid && !isPlaceholder) {
            return false;
        }

        // 4️⃣ Debe haber algún cambio real
        if (!$scope.hasChanges) {
            console.log('⚠️ No changes detected, form invalid');
            return false;
        }

        return true;
    };

    // ========================================
    // SAVE USER
    // ========================================

    $scope.saveUser = function () {
        if (!$scope.isFormValid()) {
            $mdToast.showSimple('⚠️ Please fix form errors or make changes before saving');
            return;
        }

        console.log('💾 Saving user changes...');

        const updateDTO = {
            firstName:   $scope.editableUser.firstName,
            lastName:    $scope.editableUser.lastName,
            email:       $scope.editableUser.email,
            userEnabled: $scope.editableUser.userEnabled
        };

        // Solo mandamos password si NO es el placeholder (es decir, si la cambiaron)
        if (!$scope.isPlaceholderPassword()) {
            updateDTO.password = $scope.passwords.newPassword;
            console.log('🔑 Password will be updated');
        } else {
            console.log('🔑 Password unchanged (keeping current)');
        }

        // Roles seleccionados
        const selectedRoles = [];
        angular.forEach($scope.roleSelection, function (isSelected, roleId) {
            if (isSelected) {
                const role = $scope.availableRoles.find(function (r) {
                    return r.id === roleId;
                });
                if (role) {
                    selectedRoles.push(role);
                }
            }
        });
        updateDTO.userRoles = selectedRoles;

        console.log('📦 Update DTO:', updateDTO);

        UserService.updateUser($scope.editableUser.id, $scope.accountId, updateDTO)
            .then(function (response) {
                console.log('✅ User updated successfully:', response.data);
                $mdToast.showSimple('✅ User updated successfully');
                $mdDialog.hide(response.data);
            })
            .catch(function (error) {
                console.error('❌ Error updating user:', error);
                let errorMessage = 'Failed to update user';
                
                if (error.data && error.data.message) {
                    errorMessage = error.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('❌ ' + errorMessage)
                        .position('top right')
                        .hideDelay(4000)
                );
            });
    };

    // ========================================
    // DIALOG ACTIONS
    // ========================================

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

     // Mostrar permisos de un rol
    $scope.showPermissions = function(event, role) {
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
            multiple:true,
            locals: {
                role: role
            }
        });
    };
});