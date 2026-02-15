angular.module('bizmetryApp')
  .service('dialogService', ['$mdDialog', '$q', function ($mdDialog, $q) {

    /**
 * Formatea un objeto de error en HTML estructurado
 * @param {Object} errorData - Objeto con la estructura del error
 * @param {string} errorData.error - Tipo de error
 * @param {string} errorData.message - Mensaje descriptivo del error
 * @param {string} errorData.path - Path del endpoint que falló
 * @param {string} errorData.timestamp - Timestamp ISO 8601
 * @returns {string} HTML formateado listo para usar con $sce.trustAsHtml()
 */
    this.formatErrorMessage = function (errorData) {
      console.log('**** RAW ERRORDATA->', errorData);
      console.log('**** TYPE OF->', typeof errorData);

      // ✅ FIX: Si errorData es un string JSON, parsearlo
      let parsedError = errorData;

      if (typeof errorData === 'string') {
        try {
          parsedError = JSON.parse(errorData);
          console.log('**** PARSED ERROR->', parsedError);
        } catch (e) {
          console.error('Error parsing JSON:', e);
          parsedError = { message: errorData }; // Usar el string como mensaje
        }
      }

      const errorType = parsedError.error || 'Unknown Error';
      const errorMessage = parsedError.message || 'An unexpected error occurred';
      const errorPath = parsedError.path || 'N/A';
      const errorTimestamp = parsedError.timestamp || new Date().toISOString();

      console.log('**** EXTRACTED VALUES ->');
      console.log('  errorType:', errorType);
      console.log('  errorMessage:', errorMessage);
      console.log('  errorPath:', errorPath);
      console.log('  errorTimestamp:', errorTimestamp);

      const formattedTime = this.formatTimestamp(errorTimestamp);

      return `
        <div style="text-align: left; font-family: 'Roboto', sans-serif;">
          <div style="margin-bottom: 16px;">
            <span style="display: inline-block; 
                         background: linear-gradient(135deg, #f44336 0%, #e53935 100%); 
                         color: white; 
                         padding: 6px 16px; 
                         border-radius: 20px; 
                         font-weight: 600;
                         font-size: 13px;
                         letter-spacing: 0.5px;">
              ${errorType}
            </span>
          </div>

          <div style="background: #ffebee; 
                      border-left: 4px solid #f44336; 
                      padding: 12px 16px; 
                      border-radius: 6px;
                      margin-bottom: 16px;">
            <p style="margin: 0; color: #424242; font-size: 14px; line-height: 1.5;">
              ${errorMessage}
            </p>
          </div>

          <table style="width: 100%; 
                        border-collapse: collapse; 
                        background: #fafafa; 
                        border-radius: 6px; 
                        overflow: hidden;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px 12px; 
                         font-weight: 600; 
                         color: #616161; 
                         font-size: 12px; 
                         width: 80px;
                         text-transform: uppercase;">
                Path
              </td>
              <td style="padding: 10px 12px; 
                         color: #757575; 
                         font-family: monospace; 
                         font-size: 11px;
                         word-break: break-all;">
                ${errorPath}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; 
                         font-weight: 600; 
                         color: #616161; 
                         font-size: 12px;
                         text-transform: uppercase;">
                Time
              </td>
              <td style="padding: 10px 12px; 
                         color: #757575; 
                         font-family: monospace; 
                         font-size: 11px;">
                ${formattedTime}
              </td>
            </tr>
          </table>
        </div>
      `;
    };

    /**
     * Formatea timestamp a formato legible
     * @param {string} timestamp - ISO 8601 timestamp
     * @returns {string} Formatted timestamp
     */
    this.formatTimestamp = function (timestamp) {
      try {
        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
          return timestamp;
        }

        const dateStr = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        const timeStr = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        return `${dateStr} · ${timeStr}`;
      } catch (e) {
        console.error('Error formatting timestamp:', e);
        return timestamp;
      }
    };

    // =====================================================
    // ERROR DIALOG - PROFESSIONAL DESIGN
    // =====================================================
    this.showErrorDialog = function (title, message) {
      var deferred = $q.defer();

      $mdDialog.show({
        multiple: true,
        template: `
          <md-dialog aria-label="Error" class="modern-dialog error-dialog" style="max-width: 540px;">
            <!-- Header -->
            <md-toolbar style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
                               min-height: 64px; 
                               flex-shrink: 0;">
              <div class="md-toolbar-tools">
                <h2 style="color: white; 
                           font-weight: 500; 
                           font-size: 20px; 
                           margin: 0; 
                           flex: 1;">
                  ${title}
                </h2>
                <md-button class="md-icon-button" 
                           ng-click="closeDialog()" 
                           style="color: white; margin: 0;">
                  <md-icon>close</md-icon>
                </md-button>
              </div>
            </md-toolbar>

            <!-- Content -->
            <md-dialog-content style="padding: 24px; background-color: white; min-height: 120px;">
              <div layout="row" layout-align="start center" style="gap: 16px;">
                
                <!-- Icon Container -->
                <div style="flex-shrink: 0;">
                  <div style="background: #ffebee;
                              border-radius: 50%;
                              width: 48px;
                              height: 48px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              box-shadow: 0 2px 8px rgba(244, 67, 54, 0.15);">
                    <md-icon style="font-size: 28px; 
                                    color: #d32f2f; 
                                    width: 28px; 
                                    height: 28px;">
                      error_outline
                    </md-icon>
                  </div>
                </div>

                <!-- Message Content -->
                <div style="flex: 1;">
                  <div style="background-color: #fff5f5;
                              border-left: 3px solid #f44336;
                              border-radius: 4px;
                              padding: 14px 16px;">
                    <p style="font-size: 14px;
                              color: #424242;
                              line-height: 1.6;
                              margin: 0;"
                       ng-bind-html="errorMessage">
                    </p>
                  </div>
                </div>
              </div>
            </md-dialog-content>

            <!-- Actions -->
            <md-dialog-actions layout="row" 
                               layout-align="end center" 
                               style="padding: 12px 16px; 
                                      background-color: #fafafa; 
                                      border-top: 1px solid #e0e0e0;
                                      min-height: 52px;">
              <md-button class="md-raised md-warn" 
                         ng-click="closeDialog()"
                         style="background-color: #f44336; 
                                color: white; 
                                min-width: 88px;
                                margin: 0;
                                text-transform: uppercase;
                                font-weight: 500;
                                letter-spacing: 0.5px;">
                OK
              </md-button>
            </md-dialog-actions>
          </md-dialog>
        `,
        clickOutsideToClose: true,
        controller: function DialogController($scope, $mdDialog, $sce) {
          $scope.errorMessage = $sce.trustAsHtml(message);

          $scope.closeDialog = function () {
            $mdDialog.hide();
            deferred.resolve();
          };
        }
      });

      return deferred.promise;
    };

    // =====================================================
    // SUCCESS DIALOG - PROFESSIONAL DESIGN
    // =====================================================
    this.showSuccessDialog = function (title, message, redirectTo) {
      var deferred = $q.defer();

      $mdDialog.show({
        multiple: true,
        template: `
          <md-dialog aria-label="Success" class="modern-dialog success-dialog" style="max-width: 540px;">
            <!-- Header -->
            <md-toolbar style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
                               min-height: 64px; 
                               flex-shrink: 0;">
              <div class="md-toolbar-tools">
                <h2 style="color: white; 
                           font-weight: 500; 
                           font-size: 20px; 
                           margin: 0; 
                           flex: 1;">
                  ${title}
                </h2>
                <md-button class="md-icon-button" 
                           ng-click="closeDialog()" 
                           style="color: white; margin: 0;">
                  <md-icon>close</md-icon>
                </md-button>
              </div>
            </md-toolbar>

            <!-- Content -->
            <md-dialog-content style="padding: 24px; background-color: white; min-height: 120px;">
              <div layout="row" layout-align="start center" style="gap: 16px;">
                
                <!-- Icon Container -->
                <div style="flex-shrink: 0;">
                  <div style="background: #e8f5e9;
                              border-radius: 50%;
                              width: 48px;
                              height: 48px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);">
                    <md-icon style="font-size: 28px; 
                                    color: #2e7d32; 
                                    width: 28px; 
                                    height: 28px;">
                      check_circle
                    </md-icon>
                  </div>
                </div>

                <!-- Message Content -->
                <div style="flex: 1;">
                  <div style="background-color: #f1f8f4;
                              border-left: 3px solid #4caf50;
                              border-radius: 4px;
                              padding: 14px 16px;">
                    <p style="font-size: 14px;
                              color: #424242;
                              line-height: 1.6;
                              margin: 0;"
                       ng-bind-html="successMessage">
                    </p>
                  </div>
                </div>
              </div>
            </md-dialog-content>

            <!-- Actions -->
            <md-dialog-actions layout="row" 
                               layout-align="end center" 
                               style="padding: 12px 16px; 
                                      background-color: #fafafa; 
                                      border-top: 1px solid #e0e0e0;
                                      min-height: 52px;">
              <md-button class="md-raised" 
                         ng-click="closeDialog()"
                         style="background-color: #4caf50; 
                                color: white; 
                                min-width: 88px;
                                margin: 0;
                                text-transform: uppercase;
                                font-weight: 500;
                                letter-spacing: 0.5px;">
                OK
              </md-button>
            </md-dialog-actions>
          </md-dialog>
        `,
        clickOutsideToClose: true,
        controller: function DialogController($scope, $mdDialog, $location, $sce) {
          $scope.successMessage = $sce.trustAsHtml(message);

          $scope.closeDialog = function () {
            $mdDialog.hide();
            if (redirectTo) {
              $location.path(redirectTo);
            }
            deferred.resolve();
          };
        }
      });

      return deferred.promise;
    };

    // =====================================================
    // DECISION DIALOG - PROFESSIONAL DESIGN
    // =====================================================
    this.showDecisionDialog = function (title, message) {
      var deferred = $q.defer();

      $mdDialog.show({
        multiple: true,
        template: `
          <md-dialog aria-label="Decision" class="modern-dialog decision-dialog" style="max-width: 540px;">
            <!-- Header -->
            <md-toolbar style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
                               min-height: 64px; 
                               flex-shrink: 0;">
              <div class="md-toolbar-tools">
                <h2 style="color: white; 
                           font-weight: 500; 
                           font-size: 20px; 
                           margin: 0; 
                           flex: 1;">
                  ${title}
                </h2>
              </div>
            </md-toolbar>

            <!-- Content -->
            <md-dialog-content style="padding: 24px; background-color: white; min-height: 120px;">
              <div layout="row" layout-align="start center" style="gap: 16px;">
                
                <!-- Icon Container -->
                <div style="flex-shrink: 0;">
                  <div style="background: #fff3e0;
                              border-radius: 50%;
                              width: 48px;
                              height: 48px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);">
                    <md-icon style="font-size: 28px; 
                                    color: #ef6c00; 
                                    width: 28px; 
                                    height: 28px;">
                      help_outline
                    </md-icon>
                  </div>
                </div>

                <!-- Message Content -->
                <div style="flex: 1;">
                  <div style="background-color: #fffbf0;
                              border-left: 3px solid #ff9800;
                              border-radius: 4px;
                              padding: 14px 16px;">
                    <p style="font-size: 14px;
                              color: #424242;
                              line-height: 1.6;
                              margin: 0;"
                       ng-bind-html="dialogMessage">
                    </p>
                  </div>
                </div>
              </div>
            </md-dialog-content>

            <!-- Actions -->
            <md-dialog-actions layout="row" 
                               layout-align="end center" 
                               style="padding: 12px 16px; 
                                      background-color: #fafafa; 
                                      border-top: 1px solid #e0e0e0;
                                      min-height: 52px;
                                      gap: 8px;">
              <md-button class="md-raised" 
                         ng-click="makeDecision('goBack')"
                         style="background-color: #9e9e9e; 
                                color: white; 
                                min-width: 100px;
                                margin: 0;
                                text-transform: uppercase;
                                font-weight: 500;
                                letter-spacing: 0.5px;">
                Go Back
              </md-button>
              <md-button class="md-raised md-warn" 
                         ng-click="makeDecision('proceed')"
                         style="background-color: #d32f2f; 
                                color: white; 
                                min-width: 100px;
                                margin: 0;
                                text-transform: uppercase;
                                font-weight: 500;
                                letter-spacing: 0.5px;">
                Proceed
              </md-button>
            </md-dialog-actions>
          </md-dialog>
        `,
        clickOutsideToClose: true,
        controller: function DialogController($scope, $mdDialog, $sce) {
          $scope.dialogMessage = $sce.trustAsHtml(message);

          $scope.makeDecision = function (decision) {
            $mdDialog.hide();
            deferred.resolve(decision);
          };
        }
      });

      return deferred.promise;
    };

    // =====================================================
    // INFORMATION DIALOG - PROFESSIONAL DESIGN
    // =====================================================
    this.showInformationDialog = function (title, message) {
      var deferred = $q.defer();

      $mdDialog.show({
        multiple: true,
        template: `
          <md-dialog aria-label="Information" class="modern-dialog information-dialog" style="max-width: 540px;">
            <!-- Header -->
            <md-toolbar style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
                               min-height: 64px; 
                               flex-shrink: 0;">
              <div class="md-toolbar-tools">
                <h2 style="color: white; 
                           font-weight: 500; 
                           font-size: 20px; 
                           margin: 0; 
                           flex: 1;">
                  ${title}
                </h2>
                <md-button class="md-icon-button" 
                           ng-click="closeDialog()" 
                           style="color: white; margin: 0;">
                  <md-icon>close</md-icon>
                </md-button>
              </div>
            </md-toolbar>

            <!-- Content -->
            <md-dialog-content style="padding: 24px; background-color: white; min-height: 120px;">
              <div layout="row" layout-align="start center" style="gap: 16px;">
                
                <!-- Icon Container -->
                <div style="flex-shrink: 0;">
                  <div style="background: #e3f2fd;
                              border-radius: 50%;
                              width: 48px;
                              height: 48px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
                    <md-icon style="font-size: 28px; 
                                    color: #1565c0; 
                                    width: 28px; 
                                    height: 28px;">
                      info_outline
                    </md-icon>
                  </div>
                </div>

                <!-- Message Content -->
                <div style="flex: 1;">
                  <div style="background-color: #f0f7ff;
                              border-left: 3px solid #2196f3;
                              border-radius: 4px;
                              padding: 14px 16px;">
                    <p style="font-size: 14px;
                              color: #424242;
                              line-height: 1.6;
                              margin: 0;"
                       ng-bind-html="infoMessage">
                    </p>
                  </div>
                </div>
              </div>
            </md-dialog-content>

            <!-- Actions -->
            <md-dialog-actions layout="row" 
                               layout-align="end center" 
                               style="padding: 12px 16px; 
                                      background-color: #fafafa; 
                                      border-top: 1px solid #e0e0e0;
                                      min-height: 52px;">
              <md-button class="md-raised" 
                         ng-click="closeDialog()"
                         style="background-color: #2196f3; 
                                color: white; 
                                min-width: 88px;
                                margin: 0;
                                text-transform: uppercase;
                                font-weight: 500;
                                letter-spacing: 0.5px;">
                OK
              </md-button>
            </md-dialog-actions>
          </md-dialog>
        `,
        clickOutsideToClose: true,
        controller: function DialogController($scope, $mdDialog, $sce) {
          $scope.infoMessage = $sce.trustAsHtml(message);

          $scope.closeDialog = function () {
            $mdDialog.hide();
            deferred.resolve();
          };
        }
      });

      return deferred.promise;
    };

    // =====================================================
// CONFIRMATION DIALOG WITH MANUAL INPUT - PROFESSIONAL DESIGN
// =====================================================
this.showConfirmationDialog = function (title, message, confirmationText, dangerMode) {
  var deferred = $q.defer();
  
  // Normalize confirmation text (replace spaces with hyphens, lowercase)
  var normalizedConfirmation = confirmationText.replace(/\s+/g, '-').toLowerCase();
  var displayText = confirmationText.replace(/\s+/g, '-');

  $mdDialog.show({
    multiple: true,
    template: `
      <md-dialog aria-label="Confirmation Required" class="modern-dialog confirmation-dialog" style="max-width: 560px;">
        <!-- Header -->
        <md-toolbar style="background: linear-gradient(135deg, ${dangerMode ? '#d32f2f' : '#ff9800'} 0%, ${dangerMode ? '#c62828' : '#f57c00'} 100%); 
                           min-height: 64px; 
                           flex-shrink: 0;">
          <div class="md-toolbar-tools">
            <h2 style="color: white; 
                       font-weight: 500; 
                       font-size: 20px; 
                       margin: 0; 
                       flex: 1;">
              ${title}
            </h2>
            <md-button class="md-icon-button" 
                       ng-click="closeDialog()" 
                       style="color: white; margin: 0;">
              <md-icon>close</md-icon>
            </md-button>
          </div>
        </md-toolbar>

        <!-- Content -->
        <md-dialog-content style="padding: 24px; background-color: white;">
          <div layout="column" style="gap: 20px;">
            
            <!-- Warning Icon & Message -->
            <div layout="row" layout-align="start center" style="gap: 16px;">
              <div style="flex-shrink: 0;">
                <div style="background: ${dangerMode ? '#ffebee' : '#fff3e0'};
                            border-radius: 50%;
                            width: 48px;
                            height: 48px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 2px 8px rgba(${dangerMode ? '211, 47, 47' : '255, 152, 0'}, 0.15);">
                  <md-icon style="font-size: 28px; 
                                  color: ${dangerMode ? '#d32f2f' : '#ef6c00'}; 
                                  width: 28px; 
                                  height: 28px;">
                    ${dangerMode ? 'warning' : 'help_outline'}
                  </md-icon>
                </div>
              </div>

              <!-- Message Content -->
              <div style="flex: 1;">
                <div style="background-color: ${dangerMode ? '#fff5f5' : '#fffbf0'};
                            border-left: 3px solid ${dangerMode ? '#d32f2f' : '#ff9800'};
                            border-radius: 4px;
                            padding: 14px 16px;">
                  <p style="font-size: 14px;
                            color: #424242;
                            line-height: 1.6;
                            margin: 0;"
                     ng-bind-html="dialogMessage">
                  </p>
                </div>
              </div>
            </div>

            <!-- Confirmation Input Section -->
            <div style="background: #fafafa; 
                        border: 1px solid #e0e0e0; 
                        border-radius: 8px; 
                        padding: 20px;">
              
              <p style="margin: 0 0 12px 0; 
                        font-size: 14px; 
                        font-weight: 600; 
                        color: #424242;">
                To confirm, please type: <code style="background: white; 
                                                      padding: 4px 8px; 
                                                      border-radius: 4px; 
                                                      color: ${dangerMode ? '#d32f2f' : '#ef6c00'}; 
                                                      font-weight: 700;
                                                      border: 1px solid #e0e0e0;">${displayText}</code>
              </p>

              <md-input-container class="md-block" style="margin: 0;">
                <label>Confirmation text</label>
                <input type="text" 
                       ng-model="userInput" 
                       ng-change="checkInput()"
                       placeholder="Type here..."
                       style="font-family: monospace;">
              </md-input-container>

              <div ng-if="userInput && !inputMatches" 
                   style="display: flex; 
                          align-items: center; 
                          gap: 8px; 
                          margin-top: 8px; 
                          color: #f44336;">
                <md-icon style="font-size: 18px; width: 18px; height: 18px;">close</md-icon>
                <span style="font-size: 13px;">Text does not match</span>
              </div>

              <div ng-if="inputMatches" 
                   style="display: flex; 
                          align-items: center; 
                          gap: 8px; 
                          margin-top: 8px; 
                          color: #4caf50;">
                <md-icon style="font-size: 18px; width: 18px; height: 18px;">check</md-icon>
                <span style="font-size: 13px;">Text matches!</span>
              </div>
            </div>

          </div>
        </md-dialog-content>

        <!-- Actions -->
        <md-dialog-actions layout="row" 
                           layout-align="end center" 
                           style="padding: 12px 16px; 
                                  background-color: #fafafa; 
                                  border-top: 1px solid #e0e0e0;
                                  min-height: 52px;
                                  gap: 8px;">
          <md-button class="md-raised" 
                     ng-click="closeDialog()"
                     style="background-color: #9e9e9e; 
                            color: white; 
                            min-width: 100px;
                            margin: 0;
                            text-transform: uppercase;
                            font-weight: 500;
                            letter-spacing: 0.5px;">
            Cancel
          </md-button>
          <md-button class="md-raised" 
                     ng-click="confirmAction()"
                     ng-disabled="!inputMatches"
                     style="background-color: ${dangerMode ? '#d32f2f' : '#ff9800'}; 
                            color: white; 
                            min-width: 100px;
                            margin: 0;
                            text-transform: uppercase;
                            font-weight: 500;
                            letter-spacing: 0.5px;"
                     ng-class="{'md-button-disabled': !inputMatches}">
            ${dangerMode ? 'Delete' : 'Confirm'}
          </md-button>
        </md-dialog-actions>
      </md-dialog>
    `,
    clickOutsideToClose: false,
    escapeToClose: false,
    controller: function DialogController($scope, $mdDialog, $sce) {
      $scope.dialogMessage = $sce.trustAsHtml(message);
      $scope.userInput = '';
      $scope.inputMatches = false;

      $scope.checkInput = function() {
        var normalizedInput = ($scope.userInput || '').replace(/\s+/g, '-').toLowerCase();
        $scope.inputMatches = normalizedInput === normalizedConfirmation;
      };

      $scope.confirmAction = function() {
        if ($scope.inputMatches) {
          $mdDialog.hide();
          deferred.resolve('confirmed');
        }
      };

      $scope.closeDialog = function() {
        $mdDialog.hide();
        deferred.resolve('cancelled');
      };
    }
  });

  return deferred.promise;
};

  }]);