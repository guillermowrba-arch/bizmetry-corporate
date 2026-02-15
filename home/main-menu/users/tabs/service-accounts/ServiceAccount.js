angular.module('bizmetryApp').service('ServiceAccountService', ['$http', 'CONFIG', '$q',
     function ($http, CONFIG, $q) {


    // 📊 Obtener service accounts con paginación completa
    this.getServiceAccountsWithPagination = function (accountId, filters) {
      const params = {
        page: filters.page !== undefined ? filters.page : 0,
        size: filters.size || 10,
        sortBy: filters.sortBy || 'createdTs_desc'
      };

      // ✅ Solo agregar filtros si tienen valor
      if (filters.serviceAccountName) {
        params.serviceAccountName = filters.serviceAccountName;
      }

      console.log('🔍 ServiceAccountService - Request params:', params);

      return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts`, {
        params: params
      }).then(function (response) {
        // ✅ El backend devuelve ServiceAccountPageResponse directamente
        console.log('✅ ServiceAccountService - Response data:', response.data);
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error fetching service accounts:', error);
        throw error;
      });
    };

    // 📝 Crear service account
    this.createServiceAccount = function (accountId, serviceAccountData) {
      console.log('➕ ServiceAccountService - Creating service account:', serviceAccountData);

      return $http.post(
        `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts`,
        serviceAccountData
      ).then(function (response) {
        console.log('✅ ServiceAccountService - Service account created:', response.data);
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error creating service account:', error);
        throw error;
      });
    };

    // 🗑️ Eliminar service account
    this.deleteServiceAccount = function (accountId, serviceAccountId) {
      console.log('🗑️ ServiceAccountService - Deleting service account:', serviceAccountId);

      return $http.delete(
        `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts/${serviceAccountId}`
      ).then(function (response) {
        console.log('✅ ServiceAccountService - Service account deleted');
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error deleting service account:', error);
        throw error;
      });
    };

    // 🔍 Obtener service account por ID (con clientSecret)
    this.getServiceAccountById = function (accountId, serviceAccountId) {
      console.log('🔍 ServiceAccountService - Getting service account by ID:', serviceAccountId);

      return $http.get(
        `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts/${serviceAccountId}`
      ).then(function (response) {
        console.log('✅ ServiceAccountService - Service account details retrieved:', response.data);
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error getting service account:', error);
        throw error;
      });
    };

    // 🔄 Actualizar service account
    this.updateServiceAccount = function (accountId, serviceAccountId, serviceAccountData) {
      console.log('🔄 ServiceAccountService - Updating service account:', serviceAccountId);

      return $http.put(
        `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts/${serviceAccountId}`,
        serviceAccountData
      ).then(function (response) {
        console.log('✅ ServiceAccountService - Service account updated:', response.data);
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error updating service account:', error);
        throw error;
      });
    };

    // 🔀 Actualizar estado (enabled/disabled) de service account
    this.updateServiceAccountStatus = function (accountId, serviceAccountId, enabled) {
      console.log('🔀 ServiceAccountService - Updating service account status:', serviceAccountId, 'enabled:', enabled);

      return $http.patch(
        `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/service-accounts/${serviceAccountId}/status`,
        { enabled: enabled }
      ).then(function (response) {
        console.log('✅ ServiceAccountService - Service account status updated:', response.data);
        return response;
      }).catch(function (error) {
        console.error('❌ ServiceAccountService - Error updating service account status:', error);
        throw error;
      });
    };

  }]);