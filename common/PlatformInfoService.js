angular.module('bizmetryApp')
  .service('PlatformInfoService', function(ConfigurationService) {
    var platformInfo = {
      version: '',
      buildDate: '',
      pceMode: false
    };

    // Cargar la información de la plataforma desde el ConfigurationService
    platformInfo.version = ConfigurationService.getFromCache('bizmetry.platform.version') || 'N/A';
    platformInfo.buildDate = ConfigurationService.getFromCache('bizmetry.platform.build-date') || 'N/A';
    platformInfo.pceMode = String(ConfigurationService.getFromCache('bizmetry.platform.pce_mode')) === 'true';

    // Devolver el objeto platformInfo
    this.getPlatformInfo = function() {
      return platformInfo;
    };

    // También podemos exponer un setter si necesitamos actualizar el `platformInfo`
    this.setPlatformInfo = function(newPlatformInfo) {
      platformInfo = newPlatformInfo;
    };
  });
