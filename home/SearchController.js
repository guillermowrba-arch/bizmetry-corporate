angular.module('bizmetryApp')
  .controller('ProfileSearchController', function(
    $scope,
    ProfileService,
    $timeout
  ) {

    // 🔀 Mapear $scope.selectedSort a { criteria, direction }
    function mapSort(selectedSort) {
      switch (selectedSort) {
        case 'NAME_ASC':     return { criteria: 'profileName', direction: 'ASC' };
        case 'NAME_DESC':    return { criteria: 'profileName', direction: 'DESC' };
        case 'PROJECT_ASC':  return { criteria: 'projectName', direction: 'ASC' };
        case 'PROJECT_DESC': return { criteria: 'projectName', direction: 'DESC' };
        case 'CREATED_ASC':  return { criteria: 'createdTs',   direction: 'ASC' };
        case 'CREATED_DESC': return { criteria: 'createdTs',   direction: 'DESC' };
        default:             return { criteria: 'createdTs',   direction: 'DESC' }; // fallback
      }
    }

    // --- Estado inicial
    $scope.searchText      = '';
    $scope.selectedSort    = 'NAME_ASC';
    $scope.currentPage     = 0;
    $scope.currentPageSize = 6;

    $scope.loading  = false;
    $scope.profiles = [];

    let searchDebouncePromise = null;

    // --- Cargar perfiles usando el servicio
    $scope.fetchProfiles = function() {
      $scope.loading = true;

      var sort = mapSort($scope.selectedSort);

      ProfileService.getAllProfiles({
        sortCriteria : sort.criteria,
        sortDirection: sort.direction,
        page         : $scope.currentPage,
        size         : $scope.currentPageSize,
        search       : $scope.searchText && $scope.searchText.trim()
                         ? $scope.searchText.trim()
                         : null
      })
      .then(function(res) {
        $scope.profiles = res.data || [];
        console.log('✅ Profiles loaded:', $scope.profiles);
      })
      .catch(function(err) {
        console.error('❌ Error loading profiles:', err);
      })
      .finally(function() {
        $scope.loading = false;
      });
    };

    // --- Cambio de criterio de sort (6 opciones combinadas)
    $scope.onSortChange = function() {
      $scope.currentPage = 0;   // reset de página
      $scope.fetchProfiles();
    };

    // --- Debounce de 2s en búsqueda (usando ng-change="onSearchChange()")
    $scope.onSearchChange = function() {
      if (searchDebouncePromise) {
        $timeout.cancel(searchDebouncePromise);
      }
      searchDebouncePromise = $timeout(function() {
        $scope.currentPage = 0; // reset de página
        $scope.fetchProfiles();
      }, 2000);
    };

    // --- Carga inicial
    $scope.fetchProfiles();
  });
