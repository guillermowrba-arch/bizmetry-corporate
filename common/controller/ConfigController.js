$scope.getConfigValue = function (keyName) {
  if (!keyName) {
    console.warn("⚠️ No config key provided");
    return;
  }

  ConfigurationService.getConfigValue(keyName)
    .then(function (response) {
      console.log("✅ Config value for '" + keyName + "':", response.data);
      $scope.configValues = $scope.configValues || {};
      $scope.configValues[keyName] = response.data;
    })
    .catch(function (error) {
      console.error("❌ Failed to load config for '" + keyName + "':", error);
    });
};

