// Asegúrate de NO volver a declarar el módulo, solo extenderlo
angular.module('bizmetryApp')
  .directive('bmStepper', function () {
    return {
      restrict: 'E',
      scope: {
        steps: '=',        // [{ label: 'Profile Source' }, ...]
        activeIndex: '=',  // índice actual (0-based)
        onStepClick: '&?'  // opcional: function(idx) para permitir navegar a pasos anteriores
      },
      templateUrl: 'common/stepper/bmStepper.html',
      link: function (scope) {
        scope.maybeGoto = function (idx) {
          if (scope.onStepClick && scope.activeIndex >= idx) {
            scope.onStepClick({ idx: idx });
          }
        };
        scope.connectorFill = function (idx) {
          if (scope.activeIndex > idx) return '100%';
          if (scope.activeIndex == idx) return '50%';
          return '0%';
        };
      }
    };
  });
