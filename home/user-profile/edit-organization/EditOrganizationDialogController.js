angular.module('bizmetryApp').controller('EditOrganizationDialogController', function (
    $scope,
    $mdDialog,
    $http,
    $timeout,
    accountId,
    currentData,
    dialogService,
    CONFIG,
    ReferenceDataService,
    $mdToast
) {
    console.log('🏢 EditOrganizationDialogController initialized');
    console.log('📋 Account ID:', accountId);
    console.log('📋 Current Data:', currentData);

    $scope.accountId = accountId;

    $scope.loading = false;
    $scope.formData = {
        organizationName: currentData.organizationName || '',
        selectedAccountType: null,
        selectedCountry: null,
        selectedState: null
    };

    // Listas para los dropdowns
    $scope.accountTypes = [];
    $scope.countries = [];
    $scope.states = [];

    /**
     * Cargar Account Types
     */
    $scope.loadAccountTypes = function () {
        ReferenceDataService.getReferenceData('USER_TYPE')
            .then(function (response) {
                $scope.accountTypes = response.data;
                console.log('✅ Account Types loaded:', $scope.accountTypes.length);
                console.log('📋 Account Types:', $scope.accountTypes);

                // ✅ Pre-seleccionar el account type actual
                if (currentData.accountTypeId) {
                    console.log('🔍 Looking for accountTypeId:', currentData.accountTypeId);

                    // Usar $timeout para asegurar que Angular procese el binding
                    $timeout(function () {
                        $scope.formData.selectedAccountType = $scope.accountTypes.find(function (type) {
                            return type.refId === currentData.accountTypeId;
                        });

                        if ($scope.formData.selectedAccountType) {
                            console.log('✅ Account Type pre-selected:', $scope.formData.selectedAccountType.refObjectLabel);
                        } else {
                            console.warn('⚠️ Account Type not found with ID:', currentData.accountTypeId);
                            console.log('Available IDs:', $scope.accountTypes.map(t => t.refId));
                        }
                    });
                }
            })
            .catch(function (error) {
                console.error('❌ Error loading account types:', error);
                dialogService.showErrorDialog('Load Error', 'Failed to load account types.');
            });
    };

    /**
     * Cargar Countries
     */
    $scope.loadCountries = function () {
        ReferenceDataService.getReferenceData('COUNTRY')
            .then(function (response) {
                $scope.countries = response.data;
                console.log('✅ Countries loaded:', $scope.countries.length);

                // ✅ Pre-seleccionar el país actual
                if (currentData.countryId) {
                    console.log('🔍 Looking for countryId:', currentData.countryId);

                    $timeout(function () {
                        $scope.formData.selectedCountry = $scope.countries.find(function (country) {
                            return country.refId === currentData.countryId;
                        });

                        if ($scope.formData.selectedCountry) {
                            console.log('✅ Country pre-selected:', $scope.formData.selectedCountry.refObjectLabel);
                            // Cargar estados para el país seleccionado
                            $scope.onCountryChange();
                        } else {
                            console.warn('⚠️ Country not found with ID:', currentData.countryId);
                        }
                    });
                }
            })
            .catch(function (error) {
                console.error('❌ Error loading countries:', error);
                dialogService.showErrorDialog('Load Error', 'Failed to load countries.');
            });
    };

    /**
 * Cargar States cuando se selecciona un país
 */
    $scope.onCountryChange = function () {
        const selectedCountry = $scope.formData.selectedCountry;

        // Reset state selection
        $scope.formData.selectedState = null;
        $scope.states = [];

        if (!selectedCountry || !selectedCountry.refObjectId) {
            return;
        }

        console.log('🔍 Loading states for country:', selectedCountry.refObjectLabel);

        $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry/refdata/STATE`, {
            params: {
                refParentObjectType: 'COUNTRY',
                refParentObjectId: selectedCountry.refObjectId
            }
        })
            .then(function (response) {
                $scope.states = response.data || [];
                console.log('✅ States loaded:', $scope.states.length);

                // ✅ SELECCIONAR AUTOMÁTICAMENTE EL PRIMER ESTADO
                if ($scope.states.length > 0) {
                    $timeout(function () {
                        // Si estamos en carga inicial y hay un estado pre-seleccionado, usarlo
                        if (currentData.stateId) {
                            $scope.formData.selectedState = $scope.states.find(function (state) {
                                return state.refId === currentData.stateId;
                            });
                        }

                        // Si no encontramos el estado pre-seleccionado o no había uno, usar el primero
                        if (!$scope.formData.selectedState) {
                            $scope.formData.selectedState = $scope.states[0];
                            console.log('✅ First state auto-selected:', $scope.formData.selectedState.refObjectLabel);
                        } else {
                            console.log('✅ State pre-selected:', $scope.formData.selectedState.refObjectLabel);
                        }
                    });
                } else {
                    console.warn('⚠️ No states available for this country');
                }
            })
            .catch(function (error) {
                console.error('❌ Error loading states:', error);
                dialogService.showErrorDialog('Load Error', 'Failed to load states for selected country.');
            });
    };

    /**
 * Detectar si hay cambios en el formulario
 */
    $scope.hasChanges = function () {
        // Verificar cambio en organization name
        if ($scope.formData.organizationName !== currentData.organizationName) {
            return true;
        }

        // Verificar cambio en account type
        if ($scope.formData.selectedAccountType) {
            if ($scope.formData.selectedAccountType.refId !== currentData.accountTypeId) {
                return true;
            }
        }

        // Verificar cambio en country
        if ($scope.formData.selectedCountry) {
            if ($scope.formData.selectedCountry.refId !== currentData.countryId) {
                return true;
            }
        }

        // Verificar cambio en state
        if ($scope.formData.selectedState) {
            if ($scope.formData.selectedState.refId !== currentData.stateId) {
                return true;
            }
        }

        // No hay cambios
        return false;
    };
    /**
     * Guardar cambios
     */
    $scope.saveOrganization = function () {
        console.log('💾 Saving organization data...');

        if (!$scope.formData.organizationName || $scope.formData.organizationName.trim() === '') {
            dialogService.showErrorDialog('Validation Error', 'Organization name is required.');
            return;
        }

        $scope.loading = true;

        // Construir payload solo con campos que han cambiado
        var payload = {};

        // Organization Name
        if ($scope.formData.organizationName !== currentData.organizationName) {
            payload.organizationName = $scope.formData.organizationName;
        }

        // Account Type
        if ($scope.formData.selectedAccountType) {
            const newAccountTypeId = $scope.formData.selectedAccountType.refId;
            if (newAccountTypeId !== currentData.accountTypeId) {
                payload.accountTypeId = newAccountTypeId;
                payload.accountTypeName = $scope.formData.selectedAccountType.refObjectLabel;
            }
        }

        // Country
        if ($scope.formData.selectedCountry) {
            const newCountryId = $scope.formData.selectedCountry.refId;
            if (newCountryId !== currentData.countryId) {
                payload.countryId = newCountryId;
                payload.countryName = $scope.formData.selectedCountry.refObjectLabel;
            }
        }

        // State
        if ($scope.formData.selectedState) {
            const newStateId = $scope.formData.selectedState.refId;
            if (newStateId !== currentData.stateId) {
                payload.stateId = newStateId;
                payload.stateName = $scope.formData.selectedState.refObjectLabel;
            }
        }

        // Verificar que hay al menos un campo para actualizar
        if (Object.keys(payload).length === 0) {
            dialogService.showInfoDialog('No Changes', 'No changes were made to the organization data.');
            $scope.loading = false;
            return;
        }

        console.log('📤 Payload:', payload);

        $http.patch(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/account/${accountId}`, payload)
            .then(function (response) {
                $scope.loading = false;

                // Preparar datos actualizados para retornar al dialog padre
                var updatedData = {
                    organizationName: $scope.formData.organizationName,
                    accountTypeId: $scope.formData.selectedAccountType ? $scope.formData.selectedAccountType.refId : currentData.accountTypeId,
                    accountTypeName: $scope.formData.selectedAccountType ? $scope.formData.selectedAccountType.refObjectLabel : currentData.accountTypeName,
                    countryId: $scope.formData.selectedCountry ? $scope.formData.selectedCountry.refId : currentData.countryId,
                    countryName: $scope.formData.selectedCountry ? $scope.formData.selectedCountry.refObjectLabel : currentData.countryName,
                    stateId: $scope.formData.selectedState ? $scope.formData.selectedState.refId : currentData.stateId,
                    stateName: $scope.formData.selectedState ? $scope.formData.selectedState.refObjectLabel : currentData.stateName
                };

                $mdDialog.hide(updatedData);
            })
            .catch(function (error) {
                console.error('❌ Error updating organization:', error);
                $scope.loading = false;

                var errorMessage = 'Failed to update organization information.';
                if (error.data && error.data.message) {
                    errorMessage = error.data.message;
                }

                dialogService.showErrorDialog('Update Error', errorMessage);
            });
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    // Cargar datos iniciales
    $scope.loadAccountTypes();
    $scope.loadCountries();

    /**
 * Copiar Organization ID al clipboard
 */
    $scope.copyOrgId = function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(accountId)
                .then(function () {
                    console.log('✅ Organization ID copied to clipboard:', accountId);
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
            textArea.value = accountId;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                console.log('✅ Organization ID copied to clipboard (fallback):', accountId);
                dialogService.showSuccessDialog('Copied!', 'Organization ID copied to clipboard.');
            } catch (error) {
                console.error('❌ Failed to copy to clipboard:', error);
                dialogService.showErrorDialog('Copy Failed', 'Failed to copy ID to clipboard.');
            }

            document.body.removeChild(textArea);
        }
    };
});