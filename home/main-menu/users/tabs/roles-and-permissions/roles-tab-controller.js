angular.module('bizmetryApp').controller('RolesTabController', function (
    $scope, $mdToast, RolesService
) {
    console.log('🔒 Initializing Roles Tab Controller');

    // El accountId viene del scope padre
    $scope.accountId = $scope.$parent.accountId;

    if (!$scope.accountId) {
        console.error('❌ Account ID not available in Roles Tab');
        return;
    }

    $scope.loading = true;
    $scope.rolesHierarchy = [];
    $scope.expandedNodes = {}; // Objeto para trackear nodos expandidos

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    (function init() {
        loadRolesHierarchy();
    })();

    // ========================================
    // CARGAR JERARQUÍA DE ROLES
    // ========================================

    function loadRolesHierarchy() {
        $scope.loading = true;
        
        RolesService.getRolesHierarchy($scope.accountId)
            .then(function (response) {
                console.log('✅ Roles hierarchy loaded:', response.data);
                var hierarchy = response.data.roles || response.data;
                
                // Ordenar por permisos (descendente)
                $scope.rolesHierarchy = $scope.sortRolesByPermissions(hierarchy);
                
                // Auto-expandir primer nivel
                autoExpandFirstLevel();
            })
            .catch(function (error) {
                console.error('❌ Error loading roles hierarchy:', error);
                $mdToast.showSimple('❌ Error loading roles hierarchy');
            })
            .finally(function () {
                $scope.loading = false;
            });
    }

    // ========================================
    // ESTADÍSTICAS
    // ========================================

    $scope.getTotalRolesCount = function () {
        // ✅ Contar solo los roles únicos en el nivel superior (sin recursión)
        // Ya que todos los roles aparecen en el array principal
        return $scope.rolesHierarchy ? $scope.rolesHierarchy.length : 0;
    };

    $scope.getTotalPermissionsCount = function () {
        // ✅ Contar permisos únicos de todos los roles en el nivel superior
        // Usamos un Set para evitar contar permisos duplicados
        var uniquePermissions = new Set();
        
        if ($scope.rolesHierarchy && $scope.rolesHierarchy.length > 0) {
            $scope.rolesHierarchy.forEach(function (role) {
                if (role.permissions && role.permissions.length > 0) {
                    role.permissions.forEach(function (permission) {
                        uniquePermissions.add(permission.id);
                    });
                }
            });
        }
        
        return uniquePermissions.size;
    };

    // Contar permisos de un rol específico (incluyendo sus sub-roles)
    $scope.getPermissionsCountForRole = function (role) {
        return countPermissionsForSingleRole(role);
    };

    // Contar roles hijos de un rol específico (incluyendo nietos, bisnietos, etc.)
    $scope.getChildRolesCountForRole = function (role) {
        return countChildRolesForSingleRole(role);
    };

    function countPermissionsRecursive(roles) {
        if (!roles || roles.length === 0) return 0;

        let count = 0;
        roles.forEach(function (role) {
            count += role.permissions ? role.permissions.length : 0;
            if (role.childRoles && role.childRoles.length > 0) {
                count += countPermissionsRecursive(role.childRoles);
            }
        });
        return count;
    }

    // Contar permisos totales de UN rol (incluyendo herencia de sub-roles)
    function countPermissionsForSingleRole(role) {
        if (!role) return 0;

        let count = role.permissions ? role.permissions.length : 0;

        // Sumar permisos de todos los child roles recursivamente
        if (role.childRoles && role.childRoles.length > 0) {
            role.childRoles.forEach(function (childRole) {
                count += countPermissionsForSingleRole(childRole);
            });
        }

        return count;
    }

    // Contar roles hijos totales de UN rol (incluyendo nietos, bisnietos, etc.)
    function countChildRolesForSingleRole(role) {
        if (!role || !role.childRoles || role.childRoles.length === 0) return 0;

        let count = role.childRoles.length;

        // Sumar roles hijos de cada child role recursivamente
        role.childRoles.forEach(function (childRole) {
            count += countChildRolesForSingleRole(childRole);
        });

        return count;
    }

    // ========================================
    // EXPANDIR/COLAPSAR
    // ========================================

    $scope.toggleNode = function (roleId) {
        $scope.expandedNodes[roleId] = !$scope.expandedNodes[roleId];
    };

    $scope.isNodeExpanded = function (roleId) {
        return $scope.expandedNodes[roleId] === true;
    };

    $scope.expandAll = function () {
        expandCollapseAll($scope.rolesHierarchy, true);
    };

    $scope.collapseAll = function () {
        $scope.expandedNodes = {};
    };

    function autoExpandFirstLevel() {
        if ($scope.rolesHierarchy && $scope.rolesHierarchy.length > 0) {
            $scope.rolesHierarchy.forEach(function (role) {
                $scope.expandedNodes[role.id] = true;
            });
        }
    }

    function expandCollapseAll(roles, expand) {
        if (!roles) return;

        roles.forEach(function (role) {
            $scope.expandedNodes[role.id] = expand;
            if (role.childRoles && role.childRoles.length > 0) {
                expandCollapseAll(role.childRoles, expand);
            }
        });
    }

    // ========================================
    // ACCIONES
    // ========================================

    $scope.onPermissionClick = function (permission) {
        console.log('🔑 Permission clicked:', permission);
        $mdToast.showSimple('Permission: ' + permission.name);
        // TODO: Mostrar detalles del permiso
    };

    $scope.createNewRole = function () {
        console.log('➕ Create new role - Not implemented yet');
        $mdToast.showSimple('🚧 Create role coming soon!');
    };

    // ========================================
    // ORDENAMIENTO
    // ========================================

    // Ordenar roles por cantidad total de permisos (descendente)
    $scope.sortRolesByPermissions = function (roles) {
        if (!roles || roles.length === 0) return roles;
        
        // Crear una copia para no mutar el array original
        var sortedRoles = roles.slice();
        
        sortedRoles.sort(function (a, b) {
            var permissionsA = countPermissionsForSingleRole(a);
            var permissionsB = countPermissionsForSingleRole(b);
            
            // Orden descendente (mayor primero)
            return permissionsB - permissionsA;
        });
        
        // Ordenar recursivamente los child roles
        sortedRoles.forEach(function (role) {
            if (role.childRoles && role.childRoles.length > 0) {
                role.childRoles = $scope.sortRolesByPermissions(role.childRoles);
            }
        });
        
        return sortedRoles;
    };

});