angular.module('bizmetryApp').controller('ServiceAccountsTabController', function (
    $scope, $mdToast, $mdDialog, ServiceAccountService, dialogService
) {


    // 🔍 Obtener account ID de la sesión actual
    this.getCurrentAccountId = function () {
        const user = JSON.parse(sessionStorage.getItem("user"));
        return user?.id;

    };

    // El accountId viene del scope padre o de SessionService
    $scope.accountId = this.getCurrentAccountId();

    if (!$scope.accountId) {
        console.error('❌ Account ID not available in Service Accounts Tab');
        return;
    }

    console.log('✅ Service Accounts Tab - Account ID:', $scope.accountId);

    // ========================================
    // VARIABLES DE ESTADO
    // ========================================

    $scope.loading = true;
    $scope.serviceAccounts = [];
    $scope.totalServiceAccounts = 0;
    $scope.activeServiceAccounts = 0;
    $scope.totalPages = 0;

    // Filtros y paginación
    $scope.filters = {
        page: 0,
        size: 10,
        sortBy: 'createdTs_desc',
        serviceAccountName: ''
    };

    // Math para templates
    $scope.Math = window.Math;

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    (function init() {
        loadServiceAccounts();
    })();

    // ========================================
    // CARGAR SERVICE ACCOUNTS
    // ========================================

    function loadServiceAccounts() {
        console.log('📋 Loading service accounts with filters:', $scope.filters);
        $scope.loading = true;

        ServiceAccountService.getServiceAccountsWithPagination($scope.accountId, $scope.filters)
            .then(function (response) {
                console.log('✅ Service accounts response:', response.data);

                $scope.serviceAccounts = response.data.content || [];
                $scope.totalServiceAccounts = response.data.totalElements || 0;
                $scope.totalPages = response.data.totalPages || 0;

                // Calcular service accounts activos
                $scope.activeServiceAccounts = $scope.serviceAccounts.filter(function (sa) {
                    return sa.isEnabled === true;
                }).length;

                console.log('✅ Loaded:', $scope.serviceAccounts.length, 'service accounts');
                console.log('📊 Total:', $scope.totalServiceAccounts, 'Active:', $scope.activeServiceAccounts);
            })
            .catch(function (error) {
                console.error('❌ Error loading service accounts:', error);
                $mdToast.showSimple('❌ Error loading service accounts');
                $scope.serviceAccounts = [];
                $scope.totalServiceAccounts = 0;
                $scope.activeServiceAccounts = 0;
            })
            .finally(function () {
                $scope.loading = false;
            });
    }

    // ========================================
    // PAGINACIÓN
    // ========================================

    $scope.changePage = function (newPage) {
        if (newPage >= 0 && newPage < $scope.totalPages) {
            console.log('📄 Changing to page:', newPage);
            $scope.filters.page = newPage;
            loadServiceAccounts();
        }
    };

    // ========================================
    // BÚSQUEDA Y FILTROS
    // ========================================

    $scope.searchServiceAccounts = function () {
        console.log('🔍 Searching service accounts with name:', $scope.filters.serviceAccountName);
        $scope.filters.page = 0; // Reset a primera página
        loadServiceAccounts();
    };

    $scope.changeSortOrder = function () {
        console.log('🔄 Changing sort order to:', $scope.filters.sortBy);
        $scope.filters.page = 0; // Reset a primera página
        loadServiceAccounts();
    };

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    // Obtener los últimos N dígitos de un UUID
    $scope.getLastDigits = function (uuid, digits) {
        if (!uuid) return 'N/A';
        const uuidStr = uuid.toString().replace(/-/g, '');
        return uuidStr.slice(-digits);
    };

    // ========================================
    // ACCIONES DE SERVICE ACCOUNTS (READ-ONLY)
    // ========================================

    $scope.viewServiceAccount = function (serviceAccount) {
        console.log('👁️ View service account:', serviceAccount.serviceAccountId);

        // Mostrar dialog con detalles del service account
        $mdDialog.show({
            controller: 'ViewServiceAccountDialogController',
            templateUrl: '/home/main-menu/users/tabs/service-accounts/view-service-account-dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            fullscreen: true,
            locals: {
                serviceAccount: serviceAccount
            }
        });
    };

    // ========================================
    // REFRESH
    // ========================================

    $scope.refreshServiceAccounts = function () {
        console.log('🔄 Refreshing service accounts...');
        loadServiceAccounts();
    };

    // ========================================
    // ESCUCHAR EVENTOS DE ACTUALIZACIÓN
    // ========================================

    // Si el tab padre emite un evento de refresh
    $scope.$on('refreshServiceAccounts', function () {
        console.log('🔔 Received refresh event');
        loadServiceAccounts();
    });

    $scope.toggleServiceAccountStatus = function (serviceAccount) {
        const newStatus = serviceAccount.isEnabled;
        const serviceAccountId = serviceAccount.serviceAccountId;
        const previousStatus = !newStatus; // Guardamos el estado anterior

        // ⚠️ Si está intentando DESHABILITAR, mostrar advertencia
        if (!newStatus) {
            const warningMessage = `
      <div style="line-height: 1.8;">
        <p style="margin-bottom: 16px;">
          You are about to disable the service account 
          <strong style="color: #d32f2f;">${serviceAccount.serviceAccountName}</strong>.
        </p>
        
        <div style="background: #fff3cd; 
                    border-left: 4px solid #ffc107; 
                    padding: 12px 16px; 
                    border-radius: 6px;
                    margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; color: #856404; font-weight: 600;">
            ⚠️ Impact
          </p>
          <p style="margin: 0; color: #856404;">
            The <strong>${serviceAccount.parentObjectType}</strong> named 
            <strong>"${serviceAccount.parentObjectName || 'N/A'}"</strong> will lose connection 
            to the BizMetry platform and will <strong>stop working</strong>.
          </p>
        </div>
        
        <div style="background: #ffebee; 
                    border-left: 4px solid #f44336; 
                    padding: 12px 16px; 
                    border-radius: 6px;">
          <p style="margin: 0; color: #c62828; font-weight: 500;">
            🚨 This may affect all functionalities of this component.
          </p>
        </div>
      </div>
    `;

            dialogService.showDecisionDialog(
                '⚠️ Disable Service Account',
                warningMessage
            ).then(function (decision) {
                if (decision === 'proceed') {
                    // ✅ Usuario confirmó - proceder con la desactivación
                    performStatusUpdate(serviceAccount, newStatus, previousStatus, serviceAccountId);
                } else {
                    // ❌ Usuario canceló - revertir el toggle
                    serviceAccount.isEnabled = previousStatus;
                }
            });
        } else {
            // ✅ Está activando - no requiere confirmación
            performStatusUpdate(serviceAccount, newStatus, previousStatus, serviceAccountId);
        }
    };

    // Función helper para realizar la actualización
    function performStatusUpdate(serviceAccount, newStatus, previousStatus, serviceAccountId) {
        ServiceAccountService.updateServiceAccountStatus(
            $scope.accountId,
            serviceAccountId,
            newStatus
        ).then(function (response) {
            // ✅ Actualizar el service account en el array local (sin recargar todo)
            const updatedSA = response.data;

            // Encontrar el índice del service account en el array
            const index = $scope.serviceAccounts.findIndex(sa => sa.serviceAccountId === serviceAccountId);

            if (index !== -1) {
                // Actualizar solo las propiedades necesarias
                $scope.serviceAccounts[index].isEnabled = updatedSA.isEnabled;
            }

            // ✅ Actualizar solo las estadísticas (sin recargar la tabla)
            if (newStatus) {
                $scope.activeServiceAccounts++;
            } else {
                $scope.activeServiceAccounts--;
            }

            $mdToast.show(
                $mdToast.simple()
                    .textContent('Service account ' + (newStatus ? 'enabled' : 'disabled') + ' successfully')
                    .position('top right')
                    .hideDelay(3000)
            );

        }).catch(function (error) {
            // Revertir el estado si falla
            serviceAccount.isEnabled = previousStatus;

            const errorMessage = error.data && error.data.message
                ? error.data.message
                : 'Error updating service account status';

            $mdToast.show(
                $mdToast.simple()
                    .textContent(errorMessage)
                    .position('top right')
                    .theme('error-toast')
                    .hideDelay(3000)
            );
        });
    }

    // ========================================
    // VER CREDENCIALES
    // ========================================

    $scope.showCredentials = function (event, serviceAccount) {
        console.log('🔑 Loading credentials for:', serviceAccount.serviceAccountName);

        // Mostrar loading mientras se obtienen las credenciales
        const loadingToast = $mdToast.show(
            $mdToast.simple()
                .textContent('Loading credentials...')
                .position('top right')
                .hideDelay(0)
        );

        // Obtener el service account completo con el clientSecret
        ServiceAccountService.getServiceAccountById($scope.accountId, serviceAccount.serviceAccountId)
            .then(function (response) {
                $mdToast.hide(loadingToast);

                const saDetails = response.data;
                const hasSecret = saDetails.clientSecret && saDetails.clientSecret.trim() !== '';

                // Crear un diálogo personalizado más ancho
                $mdDialog.show({
                    multiple: true,
                    template: `
                    <md-dialog aria-label="Service Account Credentials" class="modern-dialog information-dialog" style="max-width: 700px; width: 90%;">
                        <!-- Header -->
                        <md-toolbar style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
                                           min-height: 64px; 
                                           flex-shrink: 0;">
                            <div class="md-toolbar-tools">
                                <h2 style="color: white; 
                                           font-weight: 500; 
                                           font-size: 20px; 
                                           margin: 0; 
                                           flex: 1;">
                                    🔑 Service Account Credentials
                                </h2>
                                <md-button class="md-icon-button" 
                                           ng-click="closeDialog()" 
                                           style="color: white; margin: 0;">
                                    <md-icon>close</md-icon>
                                </md-button>
                            </div>
                        </md-toolbar>

                        <!-- Content -->
                        <md-dialog-content style="padding: 24px; background-color: white; min-height: 200px;">
                            <div style="font-family: 'Roboto', sans-serif;">
                                <p style="margin-bottom: 16px; color: #666; font-size: 14px;">
                                    Service Account: <strong style="color: #333;">${saDetails.serviceAccountName}</strong>
                                </p>

                                <!-- Client ID Section -->
                                <div style="background: #f5f5f5; 
                                            border-radius: 8px; 
                                            padding: 16px; 
                                            margin-bottom: 16px;
                                            border: 1px solid #e0e0e0;">
                                    <div style="margin-bottom: ${hasSecret ? '12px' : '4px'};">
                                        <label style="display: block; 
                                                      font-size: 11px; 
                                                      font-weight: 600; 
                                                      color: #999; 
                                                      text-transform: uppercase; 
                                                      letter-spacing: 0.5px; 
                                                      margin-bottom: 8px;">
                                            Client ID
                                        </label>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <code id="clientIdValue" style="flex: 1;
                                                         font-family: 'Courier New', monospace; 
                                                         font-size: 13px;
                                                         font-weight: 700;
                                                         background: white; 
                                                         padding: 10px 12px; 
                                                         border-radius: 4px; 
                                                         color: #333;
                                                         border: 1px solid #e0e0e0;
                                                         word-break: break-all;
                                                         user-select: all;
                                                         min-width: 0;">
                                                ${saDetails.clientId}
                                            </code>
                                            <button id="copyClientIdBtn" 
                                                    ng-click="copyToClipboard('${saDetails.clientId.replace(/'/g, "\\'")}', 'Client ID', 'copyClientIdBtn')" 
                                                    style="flex-shrink: 0;
                                                           padding: 8px 16px;
                                                           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                           color: white;
                                                           border: none;
                                                           border-radius: 4px;
                                                           cursor: pointer;
                                                           font-size: 11px;
                                                           font-weight: 600;
                                                           text-transform: uppercase;
                                                           letter-spacing: 0.5px;
                                                           transition: all 0.3s ease;
                                                           min-width: 80px;"
                                                    onmouseover="if(this.innerText === 'COPY') { this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'; }"
                                                    onmouseout="if(this.innerText === 'COPY') { this.style.transform='scale(1)'; this.style.boxShadow='none'; }">
                                                COPY
                                            </button>
                                        </div>
                                    </div>

                                    ${hasSecret ? `
                                    <div>
                                        <label style="display: block; 
                                                      font-size: 11px; 
                                                      font-weight: 600; 
                                                      color: #999; 
                                                      text-transform: uppercase; 
                                                      letter-spacing: 0.5px; 
                                                      margin-bottom: 8px;">
                                            Client Secret
                                        </label>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <code id="clientSecretValue" style="flex: 1;
                                                         font-family: 'Courier New', monospace; 
                                                         font-size: 13px;
                                                         font-weight: 700;
                                                         background: white; 
                                                         padding: 10px 12px; 
                                                         border-radius: 4px; 
                                                         color: #d32f2f;
                                                         border: 1px solid #ffcdd2;
                                                         word-break: break-all;
                                                         user-select: all;
                                                         min-width: 0;">
                                                ${saDetails.clientSecret}
                                            </code>
                                            <button id="copyClientSecretBtn"
                                                    ng-click="copyToClipboard('${saDetails.clientSecret.replace(/'/g, "\\'")}', 'Client Secret', 'copyClientSecretBtn')" 
                                                    style="flex-shrink: 0;
                                                           padding: 8px 16px;
                                                           background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                                                           color: white;
                                                           border: none;
                                                           border-radius: 4px;
                                                           cursor: pointer;
                                                           font-size: 11px;
                                                           font-weight: 600;
                                                           text-transform: uppercase;
                                                           letter-spacing: 0.5px;
                                                           transition: all 0.3s ease;
                                                           min-width: 80px;"
                                                    onmouseover="if(this.innerText === 'COPY') { this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(244, 67, 54, 0.4)'; }"
                                                    onmouseout="if(this.innerText === 'COPY') { this.style.transform='scale(1)'; this.style.boxShadow='none'; }">
                                                COPY
                                            </button>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>

                                ${!hasSecret ? `
                                <!-- Client Secret Warning -->
                                <div style="background: #fff3cd; 
                                            border-left: 4px solid #ffc107; 
                                            padding: 12px 16px; 
                                            border-radius: 6px;
                                            margin-bottom: 16px;">
                                    <div style="display: flex; align-items: start; gap: 12px;">
                                        <span style="font-size: 20px; flex-shrink: 0;">⚠️</span>
                                        <div>
                                            <p style="margin: 0 0 8px 0; color: #856404; font-weight: 600; font-size: 13px;">
                                                Client Secret Not Available
                                            </p>
                                            <p style="margin: 0; color: #856404; font-size: 12px; line-height: 1.5;">
                                                For security reasons, the Client Secret is only displayed once during creation. 
                                                If you've lost it, you'll need to create a new service account.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}

                                <!-- Parent Info -->
                                <div style="background: #f9f9f9; 
                                            border-radius: 6px; 
                                            padding: 12px 16px;
                                            border: 1px solid #e0e0e0;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Associated With
                                    </p>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                        <span style="font-size: 11px; color: #999; min-width: 80px;">Type:</span>
                                        <span style="font-size: 13px; color: #333; font-weight: 500;">${saDetails.parentObjectType}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 11px; color: #999; min-width: 80px;">Name:</span>
                                        <span style="font-size: 13px; color: #333; font-weight: 500;">${saDetails.parentObjectName || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </md-dialog-content>

                        <!-- Actions -->
                        <md-dialog-actions layout="row" 
                                           layout-align="end center" 
                                           style="padding: 12px 16px; 
                                                  background-color: #fafafa; 
                                                  border-top: 1px solid #e0e0e0;
                                                  min-height: 52px;">
                            <md-button class="md-raised" 
                                       ng-click="closeDialog()"
                                       style="background-color: #2196f3; 
                                              color: white; 
                                              min-width: 88px;
                                              margin: 0;
                                              text-transform: uppercase;
                                              font-weight: 500;
                                              letter-spacing: 0.5px;">
                                OK
                            </md-button>
                        </md-dialog-actions>
                    </md-dialog>
                `,
                    clickOutsideToClose: true,
                    controller: function DialogController($scope, $mdDialog, $mdToast) {
                        $scope.closeDialog = function () {
                            $mdDialog.hide();
                        };

                        $scope.copyToClipboard = function (text, label, buttonId) {
                            // Crear un elemento temporal
                            const tempInput = document.createElement('textarea');
                            tempInput.value = text;
                            tempInput.style.position = 'fixed';
                            tempInput.style.opacity = '0';
                            document.body.appendChild(tempInput);

                            // Seleccionar y copiar
                            tempInput.select();
                            tempInput.setSelectionRange(0, 99999);

                            try {
                                document.execCommand('copy');

                                // Cambiar el texto del botón temporalmente
                                const button = document.getElementById(buttonId);
                                if (button) {
                                    const originalText = button.innerText;
                                    button.innerText = '✓ COPIED!';
                                    button.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';

                                    setTimeout(function () {
                                        button.innerText = originalText;
                                        if (buttonId === 'copyClientIdBtn') {
                                            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                        } else {
                                            button.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                                        }
                                    }, 2000);
                                }

                                // Mostrar toast de éxito
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Copied to clipboard!')
                                        .position('top right')
                                        .hideDelay(2000)
                                );
                            } catch (err) {
                                console.error('Error copying to clipboard:', err);

                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Error copying to clipboard')
                                        .position('top right')
                                        .theme('error-toast')
                                        .hideDelay(3000)
                                );
                            } finally {
                                document.body.removeChild(tempInput);
                            }
                        };
                    }
                });
            })
            .catch(function (error) {
                $mdToast.hide(loadingToast);

                const errorMessage = error.data && error.data.message
                    ? error.data.message
                    : 'Error loading service account credentials';

                $mdToast.show(
                    $mdToast.simple()
                        .textContent(errorMessage)
                        .position('top right')
                        .theme('error-toast')
                        .hideDelay(3000)
                );
            });
    };

    // ========================================
    // FUNCIÓN GLOBAL PARA COPIAR AL PORTAPAPELES
    // ========================================
    window.copyToClipboard = function (text, label) {
        // Crear un elemento temporal
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);

        // Seleccionar y copiar
        tempInput.select();
        tempInput.setSelectionRange(0, 99999); // Para móviles

        try {
            document.execCommand('copy');

            // Mostrar toast de éxito usando Angular Material
            const scope = angular.element(document.body).scope();
            scope.$apply(function () {
                scope.$root.$mdToast.show(
                    scope.$root.$mdToast.simple()
                        .textContent(label + ' copied to clipboard!')
                        .position('top right')
                        .hideDelay(2000)
                );
            });
        } catch (err) {
            console.error('Error copying to clipboard:', err);

            const scope = angular.element(document.body).scope();
            scope.$apply(function () {
                scope.$root.$mdToast.show(
                    scope.$root.$mdToast.simple()
                        .textContent('Error copying to clipboard')
                        .position('top right')
                        .theme('error-toast')
                        .hideDelay(3000)
                );
            });
        } finally {
            document.body.removeChild(tempInput);
        }
    };
});