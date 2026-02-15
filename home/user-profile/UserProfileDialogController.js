angular.module('bizmetryApp').controller('UserProfileDialogController', function (
    $scope,
    $mdDialog,
    $location,
    AuthService,
    currentUser,
    dialogService,
    $mdToast
) {
    console.log('🔵 UserProfileDialogController initialized');
    console.log('👤 Current User received:', currentUser);

    $scope.loading = false;
    $scope.user = angular.copy(currentUser || {});

    // ✅ Verificar si es superusuario
    $scope.isSuperUser = function () {
        return $scope.user.isSuperUser === true;
    };

    $scope.closeDialog = function () {
        $mdDialog.hide();
    };

    $scope.getAccountTypeColor = function (accountTypeName) {
        if (!accountTypeName) return '#757575';
        const hash = accountTypeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const palette = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#0097a7'];
        return palette[hash % palette.length];
    };

    /**
     * 🔐 EDIT PROFILE (nombre y/o password)
     * Abre el diálogo de edición ENCIMA sin cerrar el perfil
     */
    $scope.changePassword = function () {
        console.log('🔐 User Profile: Edit initiated');

        // ✅ NO cerramos el diálogo actual - se queda abierto debajo
        $mdDialog.show({
            controller: 'EditProfileDialogController',
            templateUrl: '/home/user-profile/edit-profile-dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            fullscreen: false,
            multiple: true,
            locals: {
                userId: $scope.user.userId,
                userEmail: $scope.user.email,
                accountId: $scope.user.id,
                currentFirstName: $scope.user.firstName,
                currentLastName: $scope.user.lastName
            }
        })
            .then(function (result) {
                // result => { firstName, lastName, passwordChanged }
                if (!result) return;

                console.log('✅ Profile updated:', result);

                // actualizamos los datos locales del diálogo de perfil
                if (typeof result.firstName !== 'undefined') {
                    $scope.user.firstName = result.firstName;
                }
                if (typeof result.lastName !== 'undefined') {
                    $scope.user.lastName = result.lastName;
                }
            })
            .catch(function () {
                console.log('🚫 Edit profile dialog cancelled');
                // no hacemos nada, el diálogo de perfil sigue abierto
            });
    };

    /**
     * 🏢 EDIT ORGANIZATION (solo para superusuarios)
     * Abre el diálogo de edición de organización ENCIMA sin cerrar el perfil
     */
    $scope.editOrganization = function () {
        var currentData = {
            organizationName: $scope.user.orgName,
            accountTypeId: $scope.user.accountTypeId,
            accountTypeName: $scope.user.accountType,
            countryId: $scope.user.countryId,
            countryName: $scope.user.countryLabel,
            stateId: $scope.user.stateId,
            stateName: $scope.user.stateLabel
        };

        $mdDialog.show({
            controller: 'EditOrganizationDialogController',
            templateUrl: '/home/user-profile/edit-organization/edit-organization-dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            escapeToClose: true,
            multiple: true,
            locals: {
                accountId: $scope.user.id,
                currentData: currentData
            }
        }).then(function (updatedData) {
            // ✅ ACTUALIZAR USER EN MEMORIA CON LOS CAMBIOS
            console.log('✅ Organization updated, refreshing user profile with:', updatedData);

            if (updatedData) {
                // ✅ 1. Actualizar $scope.user (para el template del dialog)
                $scope.user.orgName = updatedData.organizationName;
                $scope.user.accountTypeId = updatedData.accountTypeId;
                $scope.user.accountType = updatedData.accountTypeName;
                $scope.user.countryId = updatedData.countryId;
                $scope.user.countryLabel = updatedData.countryName;
                $scope.user.stateId = updatedData.stateId;
                $scope.user.stateLabel = updatedData.stateName;

                // ✅ 2. Actualizar currentUser (parámetro inyectado)
                currentUser.orgName = updatedData.organizationName;
                currentUser.accountTypeId = updatedData.accountTypeId;
                currentUser.accountType = updatedData.accountTypeName;
                currentUser.countryId = updatedData.countryId;
                currentUser.countryLabel = updatedData.countryName;
                currentUser.stateId = updatedData.stateId;
                currentUser.stateLabel = updatedData.stateName;

                // ✅ 3. Actualizar sessionStorage
                try {
                    const user = JSON.parse(sessionStorage.getItem('user'));
                    if (user) {
                        user.orgName = updatedData.organizationName;
                        user.accountTypeId = updatedData.accountTypeId;
                        user.accountType = updatedData.accountTypeName;
                        user.countryId = updatedData.countryId;
                        user.countryLabel = updatedData.countryName;
                        user.stateId = updatedData.stateId;
                        user.stateLabel = updatedData.stateName;
                        sessionStorage.setItem('user', JSON.stringify(user));
                        console.log('✅ SessionStorage updated:', {
                            orgName: user.orgName,
                            accountType: user.accountType,
                            countryLabel: user.countryLabel,
                            stateLabel: user.stateLabel
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to update sessionStorage:', error);
                }

                console.log('✅ User profile updated in all locations');
            }
        }).catch(function () {
            // Usuario canceló o hubo un error
            console.log('ℹ️ Edit organization dialog was cancelled or failed');
        });
    };
    $scope.logout = function () {
        console.log('🚪 User Profile: Logout initiated');

        dialogService.showDecisionDialog('Logout Confirmation', 'Are you sure you want to terminate the session?')
            .then(function (decision) {
                if (decision === 'proceed') {
                    AuthService.logout()
                        .then(function () {
                            $mdDialog.hide();
                            $location.path('/login');
                        })
                        .catch(function (error) {
                            console.error('❌ Logout failed:', error);
                            dialogService.showErrorDialog('Logout Error', 'An error occurred while logging out. Please try again.');
                        });
                }
            })
            .catch(function () {
                console.log('🚫 Logout dialog cancelled');
            });
    };

    /**
     * Copiar Organization ID al clipboard
     */
    $scope.copyOrgId = function () {
        const orgId = $scope.user.id;

        if (!orgId) {
            dialogService.showErrorDialog('Error', 'Organization ID not available.');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(orgId)
                .then(function () {
                    console.log('✅ Organization ID copied to clipboard:', orgId);
                    $mdToast.show(
                        $mdToast
                            .simple()
                            .textContent('Organization ID copied to clipboard')
                            .position('top right')
                            .hideDelay(3000)
                            .theme('success-toast')
                    );

                })
                .catch(function (error) {
                    console.error('❌ Failed to copy to clipboard:', error);
                    dialogService.showErrorDialog('Copy Failed', 'Failed to copy ID to clipboard.');
                });
        } else {
            // Fallback para navegadores antiguos
            var textArea = document.createElement('textarea');
            textArea.value = orgId;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                console.log('✅ Organization ID copied to clipboard (fallback):', orgId);
                dialogService.showSuccessDialog('Copied!', 'Organization ID copied to clipboard.');
            } catch (error) {
                console.error('❌ Failed to copy to clipboard:', error);
                dialogService.showErrorDialog('Copy Failed', 'Failed to copy ID to clipboard.');
            }

            document.body.removeChild(textArea);
        }
    };
});
