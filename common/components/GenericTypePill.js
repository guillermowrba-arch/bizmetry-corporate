angular.module('bizmetryApp').component('genericTypePill', {
  bindings: {
    type: '<',  // Aquí pasamos el string del environment (por ejemplo: "Development", "Production", etc.)
  },
  template: `
    <div class="env-pill"
         ng-style="{
           'display': 'inline-block',
           'padding': '4px 10px',
           'border-radius': '16px',
           'font-size': '0.85em',
           'font-weight': '600',
           'white-space': 'nowrap',
           'overflow': 'hidden',
           'text-overflow': 'ellipsis',
           'max-width': '100%',
           'background-color': $ctrl.getHashColor($ctrl.type),
           'color': $ctrl.getTextColor($ctrl.type)
         }">
      {{ $ctrl.type }}
    </div>
  `,
  controller: function($scope) {
    // Función para calcular el color de fondo basado en el tipo (hashing)
    this.getHashColor = function(type) {
      var label = type || '';  // Usamos el tipo (type) directamente
      var colors = [
        '#607d8b', '#8bc34a', '#03a9f4', '#ff9800', '#e91e63',
        '#9c27b0', '#009688', '#cddc39', '#ffc107', '#795548'
      ];
      var hash = 0;
      for (var i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    // Función para calcular el color del texto (negro o blanco)
    this.getTextColor = function(label) {
      const hex = this.getHashColor(label);
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance > 140 ? '#000000' : '#ffffff';  // Si el fondo es claro, texto negro, si oscuro, blanco
    };
  }
});
