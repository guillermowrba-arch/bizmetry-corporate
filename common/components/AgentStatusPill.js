angular.module('bizmetryApp').component('agentStatusPill', {
  bindings: {
    status: '@',
    profileDirtyFlag: '<'
  },
  template: `
    <style>
    /* Estilo de las pastillas de estado (pills) */
.status-pill {
  padding: 4px 8px;  /* Reducir el padding */
  border-radius: 12px;
  font-size: 0.75em;  /* Reducir tamaño de la fuente */
  font-weight: 600;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;  /* Aseguramos que el contenido (texto e icono) esté centrado verticalmente */
  justify-content: center;
  min-width: 60px;  /* Reducir el ancho mínimo */
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); /* Sombra suave */
}

/* Estilos de transición y hover */
.status-pill:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* Sombra más pronunciada */
}

.status-pill-online         { background: linear-gradient(145deg, #4caf50, #388e3c); }
.status-pill-offline        { background: linear-gradient(145deg, #e53935, #d32f2f); }
.status-pill-starting       { background: linear-gradient(145deg, #fb8c00, #f57c00); }
.status-pill-restarting     { background: linear-gradient(145deg, #fb8c00, #f57c00); }
.status-pill-stopping       { background: linear-gradient(145deg, #8e24aa, #7b1fa2); }
.status-pill-syncing_up     { background: linear-gradient(145deg, #039be5, #0288d1); }
.status-pill-stale          { background: linear-gradient(145deg, #757575, #616161); }
.status-pill-disconnected   { background: linear-gradient(145deg, #efef96ff, #dcd747); }
.status-pill-decommissioning { background: linear-gradient(145deg, #f2f24cff, #d8c92b); }
.status-pill-retired        { background: linear-gradient(145deg, #1bf149ff, #388e3c); }

/* Estilos del icono */
.center-icon {
  margin-right: 6px;  /* Reducir el espacio entre el icono y el texto */
  font-size: 1.5em; /* Aumentar tamaño del icono */
  display: inline-flex;
  align-items: center;  /* Asegura que el icono se centre verticalmente */
  justify-content: center; /* Alineación centrada */
}

/* Indicador de sincronización */
.profile-dirty-pill {
  background-color: #ff9800;
  color: white;
  font-size: 0.8em;  /* Reducir tamaño de la fuente */
  padding: 4px 8px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
  transition: all 0.3s ease;
}

.profile-dirty-pill:hover {
  transform: scale(1.05);
}

    </style>

    <div layout="row" layout-align="start center" class="status-container">
      <!-- Estado del agente -->
      <span class="status-pill"
            ng-class="$ctrl.getStatusClass()"
            layout="row"
            layout-align="center center"
            ng-style="$ctrl.getTextColor()" 
            aria-label="Estado del agente: {{$ctrl.status}}">
        <md-icon class="center-icon"
                 ng-class="{ spinning: $ctrl.isSpinning() }">
          {{$ctrl.getIcon()}}
        </md-icon>
        {{$ctrl.status}}
      </span>

      <!-- Indicador de sincronización de perfil -->
      <span ng-if="$ctrl.profileDirtyFlag === true"
            layout="row"
            layout-align="center center"
            class="profile-dirty-pill"
            aria-label="Sincronización de perfil en curso">
        <md-icon class="spinning center-icon">autorenew</md-icon>
        Syncing Agent...
      </span>
    </div>
  `,
  controller: function () {
    const spinningStates = ['SYNCING_UP', 'STARTING', 'STOPPING', 'RESTARTING', 'DECOMMISSIONING'];

    this.getIcon = function () {
      switch ((this.status || '').toUpperCase()) {
        case 'ONLINE': return 'check_circle';
        case 'OFFLINE': return 'error_outline';
        case 'STARTING': return 'play_circle_outline';
        case 'STOPPING': return 'stop_circle';
        case 'SYNCING_UP': return 'sync';
        case 'STALE': return 'warning';
        case 'RESTARTING': return 'refresh';
        case 'DISCONNECTED': return 'link_off';
        case 'DECOMMISSIONING': return 'delete_forever';
        case 'RETIRED': return 'delete';
        default: return '';
      }
    };

    this.isSpinning = function () {
      return spinningStates.includes((this.status || '').toUpperCase());
    };

    this.getStatusClass = function () {
      return 'status-pill-' + (this.status || 'unknown').toLowerCase();  // Usamos guiones en lugar de puntos
    };

    // Función para calcular el contraste de color (brillo) y aplicar el color de texto adecuado
    this.getTextColor = function () {
      const bgColor = this.getBackgroundColor();  // Obtener el color de fondo
      const brightness = this.calculateBrightness(bgColor); // Calcular el brillo

      // Si el brillo es bajo (fondo oscuro), el texto será blanco
      return { color: (brightness < 128) ? 'white' : 'black' };
    };

    // Función para obtener el color de fondo basado en el estado
    this.getBackgroundColor = function () {
      switch ((this.status || '').toUpperCase()) {
        case 'ONLINE': return '#4caf50'; // verde
        case 'OFFLINE': return '#e53935'; // rojo
        case 'STARTING': return '#fb8c00'; // naranja
        case 'RESTARTING': return '#fb8c00'; // naranja
        case 'STOPPING': return '#8e24aa'; // púrpura
        case 'SYNCING_UP': return '#039be5'; // azul
        case 'STALE': return '#757575'; // gris
        case 'DISCONNECTED': return '#efef96ff'; // amarillo claro
        case 'DECOMMISSIONING': return '#f2f24cff'; // amarillo oscuro
        case 'RETIRED': return '#1bf149ff'; // verde claro
        default: return '#757575'; // gris
      }
    };

    // Función para calcular el brillo de un color hexadecimal
    this.calculateBrightness = function (hex) {
      const rgb = this.hexToRgb(hex);
      return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    };

    // Función para convertir un color hexadecimal a RGB
    this.hexToRgb = function (hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
  }
});
