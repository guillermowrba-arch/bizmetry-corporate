angular.module('bizmetryApp').service('UserService', ['$http', 'CONFIG', '$q', function ($http, CONFIG, $q) {

  // 📧 Obtener un usuario por email
  this.getUserByEmail = function (email, accountId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/email/${encodeURIComponent(email)}`);
  };

  // 🆔 Obtener un usuario por ID
  this.getUserById = function (userId, accountId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}`);
  };

  // ➕ Crear un nuevo usuario
  this.createUser = function (userDTO, accountId) {
    return $http.post(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users`,
      userDTO,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };

  // ❌ Eliminar un usuario por ID
  this.deleteUser = function (userId, accountId) {
    return $http.delete(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}`);
  };

  // 🗑️ Eliminar todos los usuarios de una cuenta
  this.deleteAllUsers = function (accountId) {
    return $http.delete(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users`);
  };

  // Fragmento corregido del UserService para el método patchUser

  // 🔄 Actualizar parcialmente un usuario (PATCH)
  this.patchUser = function (userId, accountId, updatedUserDTO) {
    return $http.patch(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}`,
      updatedUserDTO,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };

  this.getAllUsers = function (accountId, filters) {
    const params = {
      page: filters.page !== undefined ? filters.page : 0,
      size: filters.size || 10,
      sort: filters.sort || 'EMAIL_ASC'
    };

    // ✅ Solo campo name (sin firstName/lastName)
    if (filters.name) {
      params.name = filters.name;
    }

    if (filters.email) {
      params.email = filters.email;
    }

    console.log('🔍 UserService - getAllUsers params:', params);

    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users`, {
      params: params
    }).then(function (response) {
      console.log('✅ UserService - getAllUsers response:', response.data);
      return response;
    });
  };
  // 🎭 Obtener todos los roles disponibles
  this.getAllRoles = function (accountId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/roles`);
  };


  // 🎭 Obtener todos los roles disponibles
  this.getScopedRoles = function (accountId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/scoped-roles`);
  };

  // 🔑 Obtener permisos de un rol específico
  this.getRolePermissions = function (accountId, roleId) {
    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/roles/${roleId}/permissions`);
  };

  // 🔄 Toggle estado del usuario (enable/disable)
  this.toggleUserStatus = function (userId, accountId, currentStatus) {
    return this.patchUser(userId, accountId, {
      userEnabled: !currentStatus
    });
  };

  // Actualizar usuario (PATCH - usa el endpoint existente)
  this.updateUser = function (userId, accountId, updateDTO) {
    return $http.patch(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}`,
      updateDTO,
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json'
      }
    );
  };

  // 🔐 Cambiar contraseña de usuario
  this.changeUserPassword = function (userId, accountId, newPassword) {
    return this.patchUser(userId, accountId, {
      password: newPassword
    });
  };

  // 👥 Actualizar roles de un usuario
  this.updateUserRoles = function (userId, accountId, userRoles) {
    return this.patchUser(userId, accountId, {
      userRoles: userRoles
    });
  };

  // 📊 Obtener usuarios con paginación completa
  this.getUsersWithPagination = function (accountId, filters) {
    const params = {
      page: filters.page !== undefined ? filters.page : 0,
      size: filters.size || 10,
      sort: filters.sort || 'EMAIL_ASC'
    };

    // ✅ Solo agregar filtros si tienen valor
    if (filters.name) params.name = filters.name;
    if (filters.email) params.email = filters.email;

    console.log('🔍 UserService - Request params:', params);

    return $http.get(`${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users`, {
      params: params
    }).then(function (response) {
      // ✅ El backend ahora devuelve PagedUserResponse directamente
      console.log('✅ UserService - Response data:', response.data);

      // ✅ Simplemente devolver la respuesta tal cual viene del backend
      return response;

    }).catch(function (error) {
      console.error('❌ UserService - Error fetching users:', error);
      throw error;
    });
  };

  // 🔍 Buscar usuario por término general
  this.searchUsers = function (accountId, searchTerm, page, size) {
    return this.getAllUsers(accountId, {
      email: searchTerm,
      page: page || 0,
      size: size || 10
    });
  };

  // ✅ Verificar si un email ya existe
  this.checkEmailExists = function (email, accountId) {
    return this.getUserByEmail(email, accountId)
      .then(function (response) {
        return { exists: true, user: response.data };
      })
      .catch(function (error) {
        if (error.status === 404) {
          return { exists: false, user: null };
        }
        throw error;
      });
  };

  // 📈 Obtener estadísticas de usuarios
  this.getUserStats = function (accountId) {
    return this.getAllUsers(accountId, { page: 0, size: 1000 })
      .then(function (response) {
        const users = response.data;
        const stats = {
          total: users.length,
          active: users.filter(u => u.userEnabled).length,
          inactive: users.filter(u => !u.userEnabled).length,
          withRoles: users.filter(u => u.userRoles && u.userRoles.length > 0).length,
          withoutRoles: users.filter(u => !u.userRoles || u.userRoles.length === 0).length
        };
        return stats;
      });
  };

  // 🔄 Recargar usuario (útil después de actualizaciones)
  this.reloadUser = function (userId, accountId) {
    return this.getUserById(userId, accountId);
  };

  // 🎯 Validar datos de usuario antes de crear/actualizar
  this.validateUserData = function (userDTO) {
    const errors = [];

    if (!userDTO.email || !userDTO.email.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(userDTO.email)) {
      errors.push('Invalid email format');
    }

    if (!userDTO.firstName || !userDTO.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!userDTO.lastName || !userDTO.lastName.trim()) {
      errors.push('Last name is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // 📧 Validar formato de email
  this.isValidEmail = function (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 🔢 Calcular rango de páginas para paginación
  this.getPageRange = function (currentPage, totalPages, maxVisible) {
    maxVisible = maxVisible || 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(0, currentPage - halfVisible);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // 🎨 Obtener color de badge según el estado
  this.getUserStatusColor = function (userEnabled) {
    return userEnabled ? 'success' : 'danger';
  };

  // 🏷️ Obtener label de estado
  this.getUserStatusLabel = function (userEnabled) {
    return userEnabled ? 'Active' : 'Disabled';
  };

  // 🎭 Formatear roles para mostrar
  this.formatRoles = function (userRoles) {
    if (!userRoles || userRoles.length === 0) {
      return 'No roles';
    }
    return userRoles.map(r => r.roleName || r.name).join(', ');
  };

  // 📅 Formatear timestamp a fecha legible
  this.formatTimestamp = function (timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // 🔍 Filtrar usuarios localmente (útil para búsqueda rápida)
  this.filterUsersLocally = function (users, filters) {
    if (!users) return [];

    return users.filter(function (user) {
      let matches = true;

      if (filters.firstName) {
        matches = matches && user.firstName &&
          user.firstName.toLowerCase().includes(filters.firstName.toLowerCase());
      }

      if (filters.lastName) {
        matches = matches && user.lastName &&
          user.lastName.toLowerCase().includes(filters.lastName.toLowerCase());
      }

      if (filters.email) {
        matches = matches && user.email &&
          user.email.toLowerCase().includes(filters.email.toLowerCase());
      }

      if (filters.userEnabled !== undefined && filters.userEnabled !== null) {
        matches = matches && user.userEnabled === filters.userEnabled;
      }

      return matches;
    });
  };

  // 📊 Ordenar usuarios localmente
  this.sortUsersLocally = function (users, sortBy) {
    if (!users || !sortBy) return users;

    const sorted = [...users];

    switch (sortBy) {
      case 'EMAIL_ASC':
        return sorted.sort((a, b) => a.email.localeCompare(b.email));
      case 'EMAIL_DESC':
        return sorted.sort((a, b) => b.email.localeCompare(a.email));
      case 'CREATION_TS_ASC':
        return sorted.sort((a, b) => a.createdTs - b.createdTs);
      case 'CREATION_TS_DESC':
        return sorted.sort((a, b) => b.createdTs - a.createdTs);
      default:
        return sorted;
    }
  };

  // 🔐 Generar contraseña segura (helper local)
  this.generateSecurePassword = function (length) {
    length = length || 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // 📋 Exportar usuarios a CSV (helper)
  this.exportUsersToCSV = function (users) {
    if (!users || users.length === 0) return '';

    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Status', 'Created', 'Last Login', 'Roles'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.firstName,
      u.lastName,
      u.userEnabled ? 'Active' : 'Disabled',
      this.formatTimestamp(u.createdTs),
      this.formatTimestamp(u.lastLogin),
      this.formatRoles(u.userRoles)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  // 💾 Descargar CSV
  this.downloadCSV = function (csvContent, filename) {
    filename = filename || 'users_export.csv';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 📊 Batch operations - Activar múltiples usuarios
  this.enableMultipleUsers = function (userIds, accountId) {
    const promises = userIds.map(userId =>
      this.patchUser(userId, accountId, { userEnabled: true })
    );
    return $q.all(promises);
  };

  // 📊 Batch operations - Desactivar múltiples usuarios
  this.disableMultipleUsers = function (userIds, accountId) {
    const promises = userIds.map(userId =>
      this.patchUser(userId, accountId, { userEnabled: false })
    );
    return $q.all(promises);
  };

  // 🗑️ Batch operations - Eliminar múltiples usuarios
  this.deleteMultipleUsers = function (userIds, accountId) {
    const promises = userIds.map(userId =>
      this.deleteUser(userId, accountId)
    );
    return $q.all(promises);
  };

  // 🔍 Obtener usuario de la sesión actual
  this.getCurrentUser = function () {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  // 🔍 Obtener account ID de la sesión actual
  this.getCurrentAccountId = function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?.id;

  };

  // ✅ Activar un usuario con token
  // En UserService
  this.activateUser = function (userId, accountId, activateToken, bearerToken) {
    var headers = { 'Content-Type': 'application/json' };

    // Si se proporciona un bearerToken, agregarlo
    if (bearerToken) {
      headers['Authorization'] = 'Bearer ' + bearerToken;
    }

    return $http.post(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}/activate?activationToken=${activateToken}`,
      {},
      {
        headers: headers,
        responseType: 'json'
      }
    );
  };

  // 📧 Reenviar email de confirmación/activación
  this.resendConfirmationEmail = function (userId, accountId) {
    return $http.post(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/users/${userId}/resend-confirmation`,
      {},
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };

  // Habilitar todos los usuarios (excepto SuperUsers)
  this.enableAllUsers = function (accountId) {
    return $http.patch(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/toggle-all-users`,
      { userEnabled: true },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json'
      }
    );
  };

  // Deshabilitar todos los usuarios (excepto SuperUsers)
  this.disableAllUsers = function (accountId) {
    return $http.patch(
      `${CONFIG.BIZMETRY_BACKEND_URL}/v1/api/bizmetry-account/${accountId}/toggle-all-users`,
      { userEnabled: false },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json'
      }
    );
  };
}]);