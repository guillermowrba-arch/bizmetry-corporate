angular.module('bizmetryApp').component('userAvatar', {
  bindings: {
    firstName: '<',
    lastName: '<',
    email: '<',
    size: '@'  // 'small', 'medium', 'large', 'xlarge' o un número en px
  },
  template: `
    <div class="user-avatar-component" ng-style="$ctrl.getAvatarStyle()">
      <span class="avatar-initials" ng-style="$ctrl.getInitialsStyle()">
        {{ $ctrl.getInitials() }}
      </span>
    </div>
  `,
  controller: function() {
    var ctrl = this;

    // Paleta de colores consistente
    var colors = [
      '#1976d2', '#7b1fa2', '#388e3c', '#d32f2f',
      '#f57c00', '#0097a7', '#5d4037', '#c2185b',
      '#512da8', '#00796b', '#e64a19', '#455a64'
    ];

    // Tamaños predefinidos
    var sizes = {
      'small': { container: 32, font: 14 },
      'medium': { container: 48, font: 18 },
      'large': { container: 64, font: 24 },
      'xlarge': { container: 80, font: 32 }
    };

    /**
     * Obtener las iniciales del usuario
     */
    ctrl.getInitials = function() {
      var firstName = ctrl.firstName || '';
      var lastName = ctrl.lastName || '';
      
      var firstInitial = firstName.charAt(0).toUpperCase();
      var lastInitial = lastName.charAt(0).toUpperCase();
      
      if (firstInitial && lastInitial) {
        return firstInitial + lastInitial;
      } else if (firstInitial) {
        return firstInitial;
      } else if (lastInitial) {
        return lastInitial;
      } else {
        // Fallback: usar primera letra del email
        var email = ctrl.email || '';
        return email.charAt(0).toUpperCase() || '?';
      }
    };

    /**
     * Generar color determinístico basado en el nombre
     */
    ctrl.getAvatarColor = function() {
      var firstName = ctrl.firstName || '';
      var lastName = ctrl.lastName || '';
      var fullName = firstName + lastName;
      
      if (!fullName) {
        return '#9e9e9e'; // Color gris por defecto
      }
      
      var hash = fullName.split('').reduce(function(acc, char) {
        return acc + char.charCodeAt(0);
      }, 0);
      
      return colors[hash % colors.length];
    };

    /**
     * Obtener el tamaño del avatar
     */
    ctrl.getSize = function() {
      // Si es un tamaño predefinido
      if (sizes[ctrl.size]) {
        return sizes[ctrl.size];
      }
      
      // Si es un número en px
      var customSize = parseInt(ctrl.size);
      if (!isNaN(customSize)) {
        return {
          container: customSize,
          font: Math.round(customSize * 0.375) // ~37.5% del tamaño del contenedor
        };
      }
      
      // Default: medium
      return sizes['medium'];
    };

    /**
     * Estilos para el contenedor del avatar
     */
    ctrl.getAvatarStyle = function() {
      var size = ctrl.getSize();
      return {
        'width': size.container + 'px',
        'height': size.container + 'px',
        'background-color': ctrl.getAvatarColor()
      };
    };

    /**
     * Estilos para las iniciales
     */
    ctrl.getInitialsStyle = function() {
      var size = ctrl.getSize();
      return {
        'font-size': size.font + 'px'
      };
    };
  }
});