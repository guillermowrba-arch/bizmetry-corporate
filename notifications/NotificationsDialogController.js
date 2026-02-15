angular.module('bizmetryApp').controller('NotificationsDialogController', function (
  $scope,
  $mdDialog,
  $timeout,
  NotificationService,
  ConfigurationService
) {
  const pageSize = 10;

  function getAccountId() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?.id;
  }

  const accountId = getAccountId();

  $scope.notifications = [];
  $scope.page = 0;
  $scope.totalPages = 0;
  $scope.totalElements = 0;
  $scope.loading = false;
  $scope.dataReady = false;
  $scope.subject_max_len = ConfigurationService.getFromCache('frontend.home.notifications.subject_max_len') || 30;
  $scope.object_name_max_len = ConfigurationService.getFromCache('frontend.home.notifications.object_name_max_len') || 30;

  $scope.filters = {
    status: null,
    type: null,
    severity: null,
    createdAfter: null,
    createdBefore: null
  };

  $scope.severityOptions = [
    { value: null, label: 'All' },
    { value: 'INFO', label: 'INFO' },
    { value: 'NOTICE', label: 'NOTICE' },
    { value: 'ERROR', label: 'ERROR' },
    { value: 'FATAL', label: 'FATAL' }
  ];

  $scope.noContentFound = false;

  $scope.loadPage = function (page) {
  $scope.dataReady = false;
  $scope.loading = true;
  
  $timeout(function() {
    $scope.notifications = [];
    
    NotificationService.getFilteredNotifications(accountId, $scope.filters, page, pageSize)
      .then(function (response) {
        const data = response.data;

        if (response.status === 204) {
          $scope.noContentFound = true;
          $scope.notifications = [];
          $scope.page = 0;
          $scope.totalPages = 0;
          $scope.totalElements = 0; // ← AGREGAR
          $scope.lastPage = true;
          $scope.firstPage = true;
        } else {
          $scope.noContentFound = false;
          
          $timeout(function() {
            $scope.notifications = (data.content || []);
            $scope.page = data.number;
            $scope.totalPages = data.totalPages;
            $scope.totalElements = data.totalElements; // ← AGREGAR
            $scope.lastPage = data.last;
            $scope.firstPage = data.first;
            $scope.dataReady = true;
          }, 50);
        }
      })
      .catch(function (error) {
        console.error('Error loading notifications:', error);
        $scope.noContentFound = true;
        $scope.notifications = [];
        $scope.page = 0;
        $scope.totalPages = 0;
        $scope.totalElements = 0; // ← AGREGAR
        $scope.dataReady = false;
      })
      .finally(function() {
        $scope.loading = false;
      });
  }, 0);
};

  $scope.nextPage = function () {
    if ($scope.page < $scope.totalPages - 1 && !$scope.loading) {
      $scope.loadPage($scope.page + 1);
    }
  };

  $scope.prevPage = function () {
    if ($scope.page > 0 && !$scope.loading) {
      $scope.loadPage($scope.page - 1);
    }
  };

  $scope.applyFilters = function () {
    $scope.page = 0;
    $scope.loadPage(0);
  };

  $scope.clearFilters = function () {
    $scope.filters = {
      status: null,
      type: null,
      severity: null,
      createdAfter: null,
      createdBefore: null
    };
    
    $scope.page = 0;
    $scope.loadPage(0);
  };

  $scope.close = function () {
    $mdDialog.hide();
  };

  // Helper para contar notificaciones por estado
  $scope.getCountByStatus = function(status) {
    if (!$scope.notifications || $scope.notifications.length === 0) {
      return 0;
    }
    return $scope.notifications.filter(function(n) {
      return n.notificationStatus === status;
    }).length;
  };

  $scope.openMessageDialog = function(notification) {
  $mdDialog.show({
    parent: angular.element(document.body),
    multiple: true,
    clickOutsideToClose: true,
    escapeToClose: true,
    template: `
      <md-dialog aria-label="Notification Message" style="max-width: 1000px; width: 90vw; max-height: 90vh; display: flex; flex-direction: column;">
        <md-toolbar class="notification-content-toolbar">
          <div class="md-toolbar-tools">
            
            <!-- Icono -->
            <md-icon class="notification-content-icon">{{ getNotificationIcon(notification.notificationType) }}</md-icon>
            
            <!-- Info del mensaje -->
            <div class="notification-content-header-info">
              <h2>{{ notification.messageSubject || 'Notification' }}</h2>
              <span class="notification-content-subtitle">
                {{ notification.notificationType }} • {{ notification.createdTs | date:'MMM d, yyyy HH:mm' }}
              </span>
            </div>
            
            <!-- Spacer -->
            <span flex></span>
            
            <!-- Severity Badge -->
            <div class="notification-content-badge badge-severity" ng-class="'severity-' + notification.severity.toLowerCase()">
              <md-icon>{{ getSeverityIcon(notification.severity) }}</md-icon>
              <span>{{ notification.severity }}</span>
            </div>
            
            <!-- Status Badge -->
            <div class="notification-content-badge badge-status" ng-class="'status-' + notification.notificationStatus.toLowerCase()">
              <md-icon>{{ getStatusIcon(notification.notificationStatus) }}</md-icon>
              <span>{{ notification.notificationStatus }}</span>
            </div>
            
          </div>
        </md-toolbar>
        
        <md-dialog-content style="padding: 24px; flex: 1; overflow-y: auto; background-color: #fafafa;">
          
          <!-- Metadata Inline - Compacta -->
          <div class="metadata-inline">
            <div class="metadata-item">
              <md-icon>person</md-icon>
              <span class="metadata-label">Recipient:</span>
              <span class="metadata-value">{{ notification.userName || 'N/A' }}</span>
            </div>
            <div class="metadata-item">
              <md-icon>category</md-icon>
              <span class="metadata-label">Type:</span>
              <span class="metadata-value">{{ notification.objectType }}</span>
            </div>
            <div class="metadata-item">
              <md-icon>label</md-icon>
              <span class="metadata-label">Object:</span>
              <span class="metadata-value">{{ notification.objectName || 'N/A' }}</span>
            </div>
          </div>
          
          <!-- Message Body -->
          <div class="message-container">
            <div class="message-header">
              <md-icon>description</md-icon>
              <span>Message Content</span>
            </div>
            <div class="message-body" ng-bind-html="messageBody"></div>
          </div>
          
        </md-dialog-content>
        
        <!-- Dialog Actions -->
        <md-dialog-actions layout="row" layout-align="end center" style="padding: 16px 24px; background-color: #fafafa; border-top: 1px solid #e0e0e0;">
          <md-button class="md-raised md-primary" ng-click="close()" style="min-width: 120px;">
            <md-icon>close</md-icon>
            CLOSE
          </md-button>
        </md-dialog-actions>
        
      </md-dialog>
    `,
    controller: function($scope, $mdDialog, $sce, $filter) {
      const raw = notification.messageBody;
      $scope.messageBody = angular.isString(raw)
        ? $sce.trustAsHtml(raw)
        : $sce.trustAsHtml('<p style="color: #999; font-style: italic;">No content available</p>');
      
      $scope.notification = notification;
      
      $scope.getNotificationIcon = function(type) {
        const icons = {
          'EMAIL': 'email',
          'ALERT': 'notification_important',
          'SMS': 'sms'
        };
        return icons[type] || 'mail';
      };
      
      $scope.getSeverityIcon = function(severity) {
        const icons = {
          'INFO': 'info',
          'NOTICE': 'announcement',
          'ERROR': 'error',
          'FATAL': 'dangerous'
        };
        return icons[severity] || 'info';
      };
      
      $scope.getStatusIcon = function(status) {
        const icons = {
          'QUEUED': 'schedule',
          'SENT': 'check_circle',
          'FAILED': 'error',
          'ABORTED': 'cancel',
          'DISPATCHING': 'sync'
        };
        return icons[status] || 'help';
      };

      $scope.close = function() {
        $mdDialog.hide();
      };
    }
  });
};
  // Init
  $scope.loadPage(0);

  // Clases CSS para los pills
  $scope.getSeverityClass = function (severity) {
    switch (severity) {
      case 'INFO': return 'pill-blue';
      case 'NOTICE': return 'pill-green';
      case 'ERROR': return 'pill-orange';
      case 'FATAL': return 'pill-red';
      default: return 'pill-gray';
    }
  };

  $scope.getStatusClass = function (status) {
    switch (status) {
      case 'QUEUED': return 'pill-blue';
      case 'SENT': return 'pill-green';
      case 'FAILED': return 'pill-red';
      default: return 'pill-gray';
    }
  };

  $scope.getTypeClass = function (type) {
    switch (type) {
      case 'EMAIL': return 'pill-purple';
      case 'SMS': return 'pill-yellow';
      default: return 'pill-gray';
    }
  };

  $scope.getObjectTypeClass = function (type) {
    switch (type) {
      case 'AGENT': return 'pill-purple';
      case 'PROFILE': return 'pill-yellow';
      case 'ENVIRONMENT': return 'pill-yellow';
      default: return 'pill-gray';
    }
  };
});