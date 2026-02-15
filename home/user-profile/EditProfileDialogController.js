angular.module('bizmetryApp').controller('EditProfileDialogController', [
  '$scope',
  '$rootScope',
  '$mdDialog',
  '$mdToast',
  '$timeout',
  'UserService',
  'userId',
  'accountId',
  'userEmail',
  'currentFirstName',
  'currentLastName',
  function (
    $scope,
    $rootScope,
    $mdDialog,
    $mdToast,
    $timeout,
    UserService,
    userId,
    accountId,
    userEmail,
    currentFirstName,
    currentLastName
  ) {
    console.log('✏️ EditProfileDialogController initialized');
    console.log('👤 User ID:', userId);
    console.log('🏢 Account ID:', accountId);
    console.log('📧 User Email:', userEmail);
    console.log('👤 Current Name:', currentFirstName, currentLastName);

    $scope.isLoading = false;
    $scope.errorMessage = '';
    $scope.successMessage = '';

    // Exponer locals en el scope
    $scope.userId = userId;
    $scope.accountId = accountId;
    $scope.userEmail = userEmail;
    // ✅ Password policy regex - Updated to include $ symbol
    $scope.passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[#@_!$])[A-Za-z\d#@_!$]{8,}$/;
    // Password visibility toggles
    $scope.showPassword = false;
    $scope.showPasswordConfirm = false;

    // Password validation state
    $scope.passwordValidation = {
      checked: false,
      match: false
    };

    // Guardar valores originales
    const originalData = {
      firstName: currentFirstName || '',
      lastName: currentLastName || ''
    };

    // Form data
    $scope.formData = {
      firstName: originalData.firstName,
      lastName: originalData.lastName,
      newPassword: '',
      confirmPassword: ''
    };


    /**
     * ✅ Validate password match - SAME LOGIC AS USER CREATE
     */
    $scope.validatePasswordMatch = function () {
      const pwd = $scope.formData.newPassword || '';
      const confirm = $scope.formData.confirmPassword || '';

      // Only check if at least one field has content
      if (pwd || confirm) {
        $scope.passwordValidation.checked = true;
        $scope.passwordValidation.match = pwd === confirm && pwd.length > 0;
      } else {
        $scope.passwordValidation.checked = false;
        $scope.passwordValidation.match = false;
      }

      // ✅ Actualizar detección de cambios cuando cambia el password
      $scope.checkForChanges();
    };

    /**
     * ✅ Calculate password strength - SAME AS USER CREATE
     */
    $scope.getPasswordStrength = function () {
      const password = $scope.formData.newPassword || '';
      if (!password) return 0;

      let strength = 0;

      // Length check (max 40 points)
      if (password.length >= 8) strength += 20;
      if (password.length >= 12) strength += 10;
      if (password.length >= 16) strength += 10;

      // Character variety (60 points)
      if (/[a-z]/.test(password)) strength += 10;
      if (/[A-Z]/.test(password)) strength += 15;
      if (/\d/.test(password)) strength += 15;
      if (/[#@_!$]/.test(password)) strength += 20;

      return Math.min(100, strength);
    };

    /**
     * ✅ Auto-generate secure password - SAME AS USER CREATE
     */
    $scope.autoGeneratePassword = function () {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '#@_!$';
      const allChars = uppercase + lowercase + numbers + special;

      let password = '';

      // Ensure at least one of each required type
      password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
      password += special.charAt(Math.floor(Math.random() * special.length));

      // Fill the rest (total 12 characters)
      for (let i = password.length; i < 12; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }

      // Shuffle the password
      password = password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');

      $scope.formData.newPassword = password;
      $scope.formData.confirmPassword = password;

      // Mark fields as touched to show validation
      if ($scope.editProfileForm.newPassword) {
        $scope.editProfileForm.newPassword.$setTouched();
      }
      if ($scope.editProfileForm.confirmPassword) {
        $scope.editProfileForm.confirmPassword.$setTouched();
      }

      // Validate password match
      $scope.validatePasswordMatch();

      console.log('🔐 Auto-generated password');

      // Show toast
      $mdToast.show(
        $mdToast
          .simple()
          .textContent('Secure password generated!')
          .position('top right')
          .hideDelay(2000)
          .theme('success-toast')
      );
    };

    /**
     * ✅ Reset password field state if empty - SAME AS USER CREATE
     */
    function resetPasswordFieldStateIfEmpty() {
      if (!$scope.editProfileForm) return;

      const bothEmpty = !$scope.formData.newPassword && !$scope.formData.confirmPassword;
      if (!bothEmpty) return;

      const np = $scope.editProfileForm.newPassword;
      const cp = $scope.editProfileForm.confirmPassword;

      if (!np || !cp) return;

      np.$setPristine();
      np.$setUntouched();
      cp.$setPristine();
      cp.$setUntouched();

      np.$validate();
      cp.$validate();

      $scope.editProfileForm.$setPristine();

      // Reset password validation state
      $scope.passwordValidation.checked = false;
      $scope.passwordValidation.match = false;
    }

    // Watchers: cuando el usuario borra password, reseteamos validación visual
    $scope.$watchGroup(['formData.newPassword', 'formData.confirmPassword'], function () {
      $timeout(resetPasswordFieldStateIfEmpty, 0);
    });

    /**
     * ✅ Detectar si hay cambios REALES en los datos Y validar passwords
     */
    $scope.hasChanges = false;

    $scope.checkForChanges = function () {
      const nameChanged =
        ($scope.formData.firstName || '') !== originalData.firstName ||
        ($scope.formData.lastName || '') !== originalData.lastName;

      const passwordChangeAttempt =
        !!($scope.formData.newPassword || $scope.formData.confirmPassword);

      // ✅ Si hay intento de cambio de password, validar que coincidan
      let passwordValid = true;
      if (passwordChangeAttempt) {
        passwordValid = $scope.passwordValidation.checked &&
          $scope.passwordValidation.match &&
          $scope.formData.newPassword &&
          $scope.formData.newPassword.length >= 8;
      }

      // ✅ Solo hay cambios válidos si:
      // - Cambió el nombre Y passwords válidos (si se intentó cambiar)
      // - O solo cambió el nombre (sin intento de password)
      $scope.hasChanges = (nameChanged || passwordChangeAttempt) && passwordValid;
    };
    
    $scope.saveChanges = function () {
      // ✅ marcar submit para que aparezcan errores solo cuando intentás guardar
      if ($scope.editProfileForm && $scope.editProfileForm.$setSubmitted) {
        $scope.editProfileForm.$setSubmitted();
      }

      // Si es inválido, no enviar
      if ($scope.editProfileForm && $scope.editProfileForm.$invalid) {
        console.warn('⚠️ Form is invalid, cannot submit');

        // opcional: marcar touched para que el usuario vea qué está mal
        if ($scope.editProfileForm.firstName) $scope.editProfileForm.firstName.$setTouched();
        if ($scope.editProfileForm.lastName) $scope.editProfileForm.lastName.$setTouched();
        if ($scope.editProfileForm.newPassword) $scope.editProfileForm.newPassword.$setTouched();
        if ($scope.editProfileForm.confirmPassword)
          $scope.editProfileForm.confirmPassword.$setTouched();

        return;
      }

      $scope.errorMessage = '';
      $scope.successMessage = '';
      $scope.isLoading = true;

      const nameChanged =
        ($scope.formData.firstName || '') !== originalData.firstName ||
        ($scope.formData.lastName || '') !== originalData.lastName;

      const passwordChangeAttempt =
        !!($scope.formData.newPassword || $scope.formData.confirmPassword);

      // Validación extra (defensiva)
      if (passwordChangeAttempt) {
        if (!$scope.formData.newPassword || !$scope.formData.confirmPassword) {
          $scope.errorMessage = 'Please fill both password fields to change password';
          $scope.isLoading = false;
          return;
        }
        if ($scope.formData.newPassword !== $scope.formData.confirmPassword) {
          $scope.errorMessage = 'New passwords do not match';
          $scope.isLoading = false;
          return;
        }
        // Validar patrón desde JS también (por si cambia el HTML)
        if (!$scope.passwordPattern.test($scope.formData.newPassword)) {
          $scope.errorMessage = 'Password does not meet complexity requirements';
          $scope.isLoading = false;
          return;
        }
      }

      // Payload PATCH
      const payload = {
        firstName: $scope.formData.firstName,
        lastName: $scope.formData.lastName
      };
      if (passwordChangeAttempt) {
        payload.password = $scope.formData.newPassword;
      }

      console.log('📦 Patch payload:', {
        firstName: payload.firstName,
        lastName: payload.lastName,
        hasPassword: !!payload.password
      });

      UserService.patchUser(userId, accountId, payload)
        .then(function (response) {
          console.log('✅ User updated successfully:', response);

          const messages = [];
          if (nameChanged) messages.push('Name updated');
          if (passwordChangeAttempt) messages.push('Password changed');

          $scope.successMessage =
            messages.length > 0
              ? messages.join(' and ') + ' successfully!'
              : 'Profile updated successfully!';

          // ✅ ACTUALIZAR SESSION STORAGE
          try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (user) {
              user.firstName = $scope.formData.firstName;
              user.lastName = $scope.formData.lastName;
              sessionStorage.setItem('user', JSON.stringify(user));
              console.log('✅ SessionStorage updated:', {
                firstName: user.firstName,
                lastName: user.lastName
              });
            }
          } catch (error) {
            console.warn('⚠️ Failed to update sessionStorage:', error);
          }

          // ✅ EMITIR EVENTO GLOBAL para que el HomeController se actualice
          $rootScope.$broadcast('user:profileUpdated', {
            firstName: $scope.formData.firstName,
            lastName: $scope.formData.lastName
          });
          console.log('📢 Event broadcasted: user:profileUpdated');

          $mdToast.show(
            $mdToast
              .simple()
              .textContent($scope.successMessage)
              .position('top right')
              .hideDelay(3000)
              .theme('success-toast')
          );

          // ✅ CERRAR EL DIÁLOGO después de un breve delay para que el toast sea visible
          $timeout(function () {
            $mdDialog.hide({
              firstName: $scope.formData.firstName,
              lastName: $scope.formData.lastName,
              passwordChanged: passwordChangeAttempt
            });
          }, 500);
        })
        .catch(function (error) {
          console.error('❌ Error saving changes:', error);
          $scope.isLoading = false;

          if (error && error.status === 400) {
            $scope.errorMessage = (error.data && error.data.message) || 'Invalid data format';
          } else if (error && error.status === 404) {
            $scope.errorMessage = 'User not found';
          } else if (error && (error.status === 401 || error.status === 403)) {
            $scope.errorMessage = 'Unauthorized to perform this action';
          } else {
            $scope.errorMessage = 'Failed to save changes. Please try again.';
          }

          $mdToast.show(
            $mdToast
              .simple()
              .textContent($scope.errorMessage)
              .position('top right')
              .hideDelay(4000)
              .theme('error-toast')
          );
        });
    };

    $scope.cancel = function () {
      console.log('🚫 Edit profile cancelled');
      $mdDialog.cancel();
    };
  }
]);