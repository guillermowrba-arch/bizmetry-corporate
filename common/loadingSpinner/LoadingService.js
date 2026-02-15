// loading.service.js
angular.module('bizmetryApp')
  .service('LoadingService', function($rootScope, $timeout) {
    var inFlight = 0, hidePromise = null, visible = false;

    function setVisible(v) {
      if (visible === v) return;
      visible = v;

      // bloquear scroll y “apagar” fondo
      var body = angular.element(document.body);
      if (v) body.addClass('bm-loading-open'); else body.removeClass('bm-loading-open');

      $rootScope.$broadcast('bm:loading:changed', visible);
    }

    this.requestStarted = function() {
      inFlight++;
      if (hidePromise) { $timeout.cancel(hidePromise); hidePromise = null; }
      setVisible(true);
    };

    this.requestEnded = function() {
      if (inFlight > 0) inFlight--;
      if (inFlight === 0) {
        hidePromise = $timeout(function() {
          setVisible(false);
          hidePromise = null;
        }, 150); // anti-flicker
      }
    };

    this.isLoading = function() { return visible; };
  });
