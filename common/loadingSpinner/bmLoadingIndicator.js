// loading.directive.js
angular.module('bizmetryApp')
  .directive('bmLoadingIndicator', function(LoadingService, $injector) {
    return {
      restrict: 'E',
      template:
        '<div class="bm-loading-overlay" ng-class="{visible: loading}" aria-busy="{{loading}}">' +
          // Si hay Angular Material, usamos md-progress-circular (gira solo)
          '<md-progress-circular ng-if="hasMaterial" md-mode="indeterminate" md-diameter="64"></md-progress-circular>' +
          // Fallback puro CSS si no hay ngMaterial
          '<div class="css-spinner" ng-if="!hasMaterial"></div>' +
        '</div>',
      link: function(scope) {
        scope.hasMaterial = $injector.has('$mdDialog'); // heurística simple
        scope.loading = LoadingService.isLoading();
        scope.$on('bm:loading:changed', function(_e, v){ scope.$evalAsync(()=> scope.loading = v); });
      }
    };
  });
