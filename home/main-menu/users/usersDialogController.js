angular.module('bizmetryApp').controller('UsersRolesDialogController', function (
    $scope, $mdDialog, UserService
) {
    console.log('🚀 Initializing User Management Container');

    // Acceso a resolve desde $scope si viene de $mdDialog.show()
    $scope.resolve = $scope.resolve || {};

    // Obtener el accountId del resolve (locals) o del sessionStorage
    $scope.accountId = ($scope.resolve && $scope.resolve.accountId) || UserService.getCurrentAccountId();

    if (!$scope.accountId) {
        console.error('❌ Account ID not found');
        $mdDialog.hide();
        return;
    }

    console.log('✅ Account ID:', $scope.accountId);

    // Tab activo por defecto (0 = Users, 1 = Roles, 2 = Service Accounts)
    $scope.selectedTabIndex = 0;

    // Watch para cambios de tab (solo logging)
    $scope.$watch('selectedTabIndex', function (newIndex, oldIndex) {
        if (newIndex !== oldIndex) {
            console.log('📑 Tab changed from', oldIndex, 'to', newIndex);
            
            switch (newIndex) {
                case 0:
                    console.log('📋 Users tab active');
                    break;
                case 1:
                    console.log('🔒 Roles tab active');
                    break;
                case 2:
                    console.log('🔑 Service Accounts tab active');
                    break;
            }
        }
    });

    // ========================================
    // CERRAR DIÁLOGO
    // ========================================

    $scope.closeDialog = function () {
        $mdDialog.hide();
    };
});