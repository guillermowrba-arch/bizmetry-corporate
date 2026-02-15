angular.module('bizmetryApp').controller('UsersTabController', function (
    $scope, $mdDialog, $timeout, $mdToast,
    UserService, dialogService, ConfigurationService
) {
    console.log('👥 Initializing Users Tab Controller');

    // El accountId viene del scope padre (UserManagementContainerController)
    $scope.accountId = $scope.$parent.accountId;

    if (!$scope.accountId) {
        console.error('❌ Account ID not available in Users Tab');
        return;
    }

    // Estado
    $scope.loading = true;
    $scope.users = [];
    $scope.filteredUsers = [];
    $scope.roles = [];

    // Filtros - ✅ SOLO name, sin firstName/lastName
    $scope.filters = {
        name: '',           // ✅ Campo unificado
        email: '',
        userEnabled: null
    };

    // Paginación
    $scope.pagination = {
        currentPage: 0,
        pageSize: 10,
        totalPages: 0,
        totalElements: 0,
        sort: 'EMAIL_ASC',
        first: true,
        last: false,
        empty: true
    };

    // Opciones de ordenación
    $scope.sortOptions = [
        { value: 'EMAIL_ASC', label: 'Email (A-Z)' },
        { value: 'EMAIL_DESC', label: 'Email (Z-A)' },
        { value: 'CREATION_TS_ASC', label: 'Oldest First' },
        { value: 'CREATION_TS_DESC', label: 'Newest First' }
    ];

    // Opciones de estado
    $scope.statusOptions = [
        { value: null, label: 'All Users' },
        { value: true, label: 'Active Only' },
        { value: false, label: 'Disabled Only' }
    ];

    let debounceTimer;

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    (function init() {
        loadRoles();
        loadFilteredUsers();
    })();

    // ========================================
    // CARGAR ROLES
    // ========================================

    function loadRoles() {
        UserService.getScopedRoles($scope.accountId)
            .then(function (response) {
                $scope.roles = response.data || [];
                console.log('✅ Roles loaded:', $scope.roles.length);
            })
            .catch(function (error) {
                console.error('❌ Error loading roles:', error);
            });
    }

    function loadFilteredUsers() {
        console.log('📋 Loading users...');
        $scope.loading = true;

        const filterParams = {
            page: $scope.pagination.currentPage,
            size: $scope.pagination.pageSize,
            sort: $scope.pagination.sort,
            name: $scope.filters.name || undefined,
            email: $scope.filters.email || undefined
        };

        console.log('📋 Filter params:', filterParams);

        UserService.getUsersWithPagination($scope.accountId, filterParams)
            .then(function (response) {
                console.log('✅ Users data received:', response.data);

                const pagedResponse = response.data;

                $scope.users = pagedResponse.content || [];

                $scope.pagination.totalElements = pagedResponse.totalElements || 0;
                $scope.pagination.totalPages = pagedResponse.totalPages || 0;
                $scope.pagination.currentPage = pagedResponse.currentPage || 0;
                $scope.pagination.pageSize = pagedResponse.pageSize || 10;
                $scope.pagination.first = pagedResponse.first || false;
                $scope.pagination.last = pagedResponse.last || false;
                $scope.pagination.empty = pagedResponse.empty || false;

                // ✅ FIX: Aplicar filtro de estado correctamente
                applyStatusFilter();

                console.log('✅ Page:', ($scope.pagination.currentPage + 1) + ' of ' + $scope.pagination.totalPages);
                console.log('✅ Total users:', $scope.pagination.totalElements);
                console.log('✅ Users in current page:', $scope.users.length);
                console.log('✅ Filtered users count:', $scope.filteredUsers.length);

                $timeout(function () {
                    $scope.loading = false;
                }, 50);
            })
            .catch(function (error) {
                console.error('❌ Error fetching users:', error);
                $scope.users = [];
                $scope.filteredUsers = [];

                $scope.pagination.totalElements = 0;
                $scope.pagination.totalPages = 0;
                $scope.pagination.empty = true;

                $mdToast.showSimple('❌ Error loading users: ' + (error.data?.message || error.message));

                $timeout(function () {
                    $scope.loading = false;
                }, 50);
            });
    }

    // ✅ NUEVA FUNCIÓN: Aplicar filtro de estado
    function applyStatusFilter() {
        if ($scope.filters.userEnabled === null || $scope.filters.userEnabled === undefined) {
            // Sin filtro de estado, mostrar todos
            $scope.filteredUsers = $scope.users.slice(); // Clonar array
        } else {
            // Aplicar filtro de estado
            $scope.filteredUsers = $scope.users.filter(function (user) {
                return user.userEnabled === $scope.filters.userEnabled;
            });
        }

        console.log('🔍 Status filter applied:', $scope.filters.userEnabled);
        console.log('📊 Filtered users:', $scope.filteredUsers.length, 'of', $scope.users.length);
    }

    $scope.applyFilters = function () {
        console.log('📌 Applying filters manually');
        $scope.pagination.currentPage = 0;
        loadFilteredUsers();
    };

    // ✅ NUEVA FUNCIÓN: Actualizar usuario localmente sin recargar
    function updateUserLocally(userId, updates) {
        // Actualizar en $scope.users
        const userIndex = $scope.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            Object.assign($scope.users[userIndex], updates);
        }

        // Actualizar en $scope.filteredUsers
        const filteredIndex = $scope.filteredUsers.findIndex(u => u.id === userId);
        if (filteredIndex !== -1) {
            Object.assign($scope.filteredUsers[filteredIndex], updates);
        }
    }

    // ========================================
    // FILTROS Y BÚSQUEDA
    // ========================================

    $scope.updateFilters = function () {
        if (debounceTimer) {
            $timeout.cancel(debounceTimer);
        }

        const debounceTime = ConfigurationService.getFromCache('frontend.search_debounce_time') || 500;

        debounceTimer = $timeout(function () {
            $scope.pagination.currentPage = 0;
            loadFilteredUsers();
        }, debounceTime);
    };

    $scope.applyFilters = function () {
        console.log('📌 Applying filters manually');
        $scope.pagination.currentPage = 0;
        loadFilteredUsers();
    };

    $scope.clearFilters = function () {
        console.log('🧹 Clearing filters');
        $scope.filters = {
            name: '',
            email: '',
            userEnabled: null
        };
        $scope.pagination.currentPage = 0;
        loadFilteredUsers();
    };

    $scope.onSortChange = function () {
        console.log('🔄 Sort changed to:', $scope.pagination.sort);
        $scope.pagination.currentPage = 0;
        loadFilteredUsers();
    };

    // ========================================
    // PAGINACIÓN
    // ========================================

    $scope.goToPage = function (page) {
        if (page >= 0 && page < $scope.pagination.totalPages) {
            $scope.pagination.currentPage = page;
            loadFilteredUsers();
        }
    };

    $scope.previousPage = function () {
        if (!$scope.pagination.first) {
            $scope.pagination.currentPage--;
            loadFilteredUsers();
        }
    };

    $scope.nextPage = function () {
        if (!$scope.pagination.last) {
            $scope.pagination.currentPage++;
            loadFilteredUsers();
        }
    };

    // ========================================
    // ACCIONES DE USUARIOS
    // ========================================

    $scope.editUser = function (user) {
        console.log('✏️ Edit user:', user.email);

        UserService.getUserById(user.id, $scope.accountId)
            .then(function (response) {
                const freshUser = response.data;

                $mdDialog.show({
                    controller: 'UserEditDialogController',
                    templateUrl: 'home/main-menu/users/tabs/user-management/edit/user-edit-dialog.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false,
                    escapeToClose: false,
                    multiple: true,
                    locals: {
                        user: freshUser,
                        roles: $scope.roles,
                        accountId: $scope.accountId
                    }
                }).then(function (updatedUser) {
                    if (updatedUser) {
                        $mdToast.showSimple('✅ User updated successfully');
                        updateUserLocally(updatedUser.id, updatedUser);
                    }
                });
            })
            .catch(function (error) {
                console.error('❌ Error fetching user data:', error);
                dialogService.showErrorDialog(
                    'Error Loading User',
                    'Could not load user data for editing.'
                );
            });
    };

    $scope.createNewUser = function () {
        console.log('➕ Create new user');

        $mdDialog.show({
            controller: 'UserCreateDialogController',
            templateUrl: 'home/main-menu/users/tabs/user-management/create/user-create-dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            escapeToClose: false,
            multiple: true,
            locals: {
                roles: $scope.roles,
                accountId: $scope.accountId
            }
        }).then(function (newUser) {
            if (newUser) {
                $mdToast.showSimple('✅ User created successfully');
                loadFilteredUsers();
            }
        });
    };

    $scope.toggleUserConfirmed = function (user) {
        const newStatus = user.isConfirmed;
        const action = newStatus ? 'confirm' : 'unconfirm';

        console.log('🔄 Toggling user confirmed status:', user.email, 'to', action);

        const patchDTO = {
            isConfirmed: newStatus
        };

        UserService.patchUser(user.id, $scope.accountId, patchDTO)
            .then(function (response) {
                console.log('✅ User confirmed status updated:', response.data);
                $mdToast.showSimple('✅ User ' + action + 'ed successfully');
                updateUserLocally(user.id, { isConfirmed: newStatus });
            })
            .catch(function (error) {
                console.error('❌ Error toggling user confirmed status:', error);
                user.isConfirmed = !newStatus;

                dialogService.showErrorDialog(
                    'Error',
                    'Failed to ' + action + ' user: ' + (error.data?.message || error.message)
                );
            });
    };

    $scope.toggleUserStatus = function (user) {
        const newStatus = user.userEnabled;
        const action = newStatus ? 'enable' : 'disable';

        console.log('🔄 Toggling user status:', user.email, 'to', action);

        const patchDTO = {
            userEnabled: newStatus
        };

        UserService.patchUser(user.id, $scope.accountId, patchDTO)
            .then(function (response) {
                console.log('✅ User status updated:', response.data);
                $mdToast.showSimple('✅ User ' + action + 'd successfully');
                updateUserLocally(user.id, { userEnabled: newStatus });
            })
            .catch(function (error) {
                console.error('❌ Error toggling user status:', error);
                user.userEnabled = !newStatus;

                dialogService.showErrorDialog(
                    'Error',
                    'Failed to ' + action + ' user: ' + (error.data?.message || error.message)
                );
            });
    };

    $scope.deleteUser = function (user) {
        dialogService.showDecisionDialog(
            'Delete User',
            'Are you sure you want to delete user "' + user.email + '"? This action cannot be undone.'
        ).then(function (decision) {
            if (decision === 'proceed') {
                console.log('🗑️ Deleting user:', user.email);

                UserService.deleteUser(user.id, $scope.accountId)
                    .then(function () {
                        $mdToast.showSimple('✅ User deleted successfully');
                        loadFilteredUsers();
                    })
                    .catch(function (error) {
                        console.error('❌ Error deleting user:', error);
                        dialogService.showErrorDialog(
                            'Error',
                            'Failed to delete user: ' + (error.data?.message || error.message)
                        );
                    });
            }
        });
    };

    $scope.resendConfirmationEmail = function (user) {
        console.log('📧 Resending confirmation email to:', user.email);

        UserService.resendConfirmationEmail(user.id, $scope.accountId)
            .then(function (response) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('✅ Confirmation email sent successfully!')
                        .position('top right')
                        .hideDelay(3000)
                );
            })
            .catch(function (error) {
                console.error('❌ Error sending confirmation email:', error);
                dialogService.showErrorDialog(
                    'Error',
                    'Failed to send confirmation email: ' + (error.data?.message || error.message)
                );
            });
    };

    $scope.disableAllUsers = function () {
        // ✅ Verificar que sea array antes de usar filter
        if (!Array.isArray($scope.users)) {
            $mdToast.showSimple('⚠️ No users loaded');
            return;
        }

        const enabledNonSuperUsers = $scope.users.filter(function (user) {
            return !user.isSuperUser && user.userEnabled === true;
        });

        if (enabledNonSuperUsers.length === 0) {
            $mdToast.showSimple('⚠️ No enabled users to disable');
            return;
        }

        const message = 'Are you sure you want to disable ALL ' + enabledNonSuperUsers.length +
            ' enabled users? SuperUsers will not be affected. This action can be reversed.';

        dialogService.showDecisionDialog('Disable All Users', message).then(function (decision) {
            if (decision === 'proceed') {
                console.log('🚫 Disabling all non-SuperUser users via API...');
                $scope.loading = true;

                UserService.disableAllUsers($scope.accountId)
                    .then(function (response) {
                        const result = response.data;
                        console.log('✅ Disable all completed:', result);

                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('✅ Successfully disabled ' + result.toggledCount + ' users')
                                .position('top right')
                                .hideDelay(3000)
                        );

                        loadFilteredUsers();
                    })
                    .catch(function (error) {
                        console.error('❌ Error disabling all users:', error);
                        $scope.loading = false;

                        dialogService.showErrorDialog(
                            'Error',
                            'Failed to disable users: ' + (error.data?.message || error.message)
                        );
                    });
            }
        });
    };

    $scope.enableAllUsers = function () {
        // ✅ Verificar que sea array antes de usar filter
        if (!Array.isArray($scope.users)) {
            $mdToast.showSimple('⚠️ No users loaded');
            return;
        }

        const disabledNonSuperUsers = $scope.users.filter(function (user) {
            return !user.isSuperUser && user.userEnabled === false;
        });

        if (disabledNonSuperUsers.length === 0) {
            $mdToast.showSimple('⚠️ No disabled users to enable');
            return;
        }

        const message = 'Are you sure you want to enable ALL ' + disabledNonSuperUsers.length +
            ' disabled users? SuperUsers will not be affected.';

        dialogService.showDecisionDialog('Enable All Users', message).then(function (decision) {
            if (decision === 'proceed') {
                console.log('✅ Enabling all non-SuperUser users via API...');
                $scope.loading = true;

                UserService.enableAllUsers($scope.accountId)
                    .then(function (response) {
                        const result = response.data;
                        console.log('✅ Enable all completed:', result);

                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('✅ Successfully enabled ' + result.toggledCount + ' users')
                                .position('top right')
                                .hideDelay(3000)
                        );

                        loadFilteredUsers();
                    })
                    .catch(function (error) {
                        console.error('❌ Error enabling all users:', error);
                        $scope.loading = false;

                        dialogService.showErrorDialog(
                            'Error',
                            'Failed to enable users: ' + (error.data?.message || error.message)
                        );
                    });
            }
        });
    };

    $scope.exportToCSV = function () {
        console.log('📥 Exporting users to CSV');

        if (!$scope.users || $scope.users.length === 0) {
            $mdToast.showSimple('⚠️ No users to export');
            return;
        }

        const csvContent = UserService.exportUsersToCSV($scope.users);
        const filename = 'bizmetry_users_' + new Date().toISOString().split('T')[0] + '.csv';

        UserService.downloadCSV(csvContent, filename);
        $mdToast.showSimple('✅ Users exported successfully');
    };

    // ========================================
    // HELPERS
    // ========================================

    $scope.getShortId = function (uuid) {
        if (!uuid) return 'N/A';
        const cleanId = uuid.replace(/-/g, '');
        return cleanId.slice(-10).toUpperCase();
    };

    $scope.formatDate = function (timestamp) {
        return UserService.formatTimestamp(timestamp);
    };

    $scope.getRolesBadge = function (user) {
        return UserService.formatRoles(user.userRoles);
    };

    $scope.getUserStatusColor = function (userEnabled) {
        return UserService.getUserStatusColor(userEnabled);
    };

    $scope.getUserStatusLabel = function (userEnabled) {
        return UserService.getUserStatusLabel(userEnabled);
    };

    // ✅ Contar basándose en los usuarios filtrados visibles
    $scope.getActiveCount = function () {
        if (!Array.isArray($scope.filteredUsers)) return 0;
        return $scope.filteredUsers.filter(function (user) {
            return user.userEnabled === true;
        }).length;
    };

    $scope.getInactiveCount = function () {
        if (!Array.isArray($scope.filteredUsers)) return 0;
        return $scope.filteredUsers.filter(function (user) {
            return user.userEnabled === false;
        }).length;
    };
});