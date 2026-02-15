// entry.js

// ---------------------
// 1️⃣ Definir módulo Angular
// ---------------------
var app = angular.module('bizmetryApp', ['ngMaterial', 'ngRoute', 'ngclipboard']);

console.log('✅ bizmetryApp module defined!:', app);

// ---------------------
// 2️⃣ Servicios
// ---------------------
require('./datasources/DatasourceService.js');
require('./template/TemplateInstanceService.js');
require('./agents/TelemetryAgentService.js');
require('./common/ConfigurationService.js');
require('./common/PlatformInfoService.js');
require('./jobs/jobService.js');
require('./notifications/NotificationsService.js');
require('./login/AuthService.js');
require('./profile/ProfileService.js');
require('./referenceData/reference-data-service.js');
require('./agents/AgentLogsService.js');
require('./agents/DownloadService.js');
require('./agents/AgentConfigService.js');
//require('./ApiService'); // si tienes ApiService separado

// ---------------------
// 3️⃣ Controladores
// ---------------------
require('./datasources/DatasourceDialogController.js');
require('./datasources/DatasourceEditDialogController.js');
require('./home/HomeController.js');
require('./landing/LandingController.js');
require('./template/ResourceAttributesDialogController.js');
require('./template/ImportResourcesDialogController.js');
require('./template/ResourceAttributesDialogViewCtrl.js');
require('./template/view-template-dialog-controller.js');
require('./template/EditTemplateDialogController.js');
require('./activation/activationController.js');
require('./agents/AgentStatusPill.js');
require('./agents/DownloadDialogController.js');
require('./agents/AgentLogsDialogController.js');
require('./agents/AgentsPanelController.js');
require('./agents/LogDetailDialogController.js');
require('./agents/AgentConfigDialogController.js');
require('./common/stepper/bmStepper.js');
require('./common/dialog/standard-dialog.js');
require('./common/filters.js');
require('./register/register.js');
require('./profile/profile-details-dialog.controller.js');
require('./profile/create-profile-wizard-controller.js');
require('./jobs/JobInstancesDialogController.js');
require('./jobs/JobDefinitionsDialogController.js');
require('./notifications/NotificationsDialogController.js');
require('./login/loginController.js');

// ---------------------
// 4️⃣ Templates HTML
// ---------------------
require('./datasources/datasource-edit-dialog.html');
require('./datasources/datasource-dialog.html');
require('./home/home.html');
require('./landing/landing.html');
require('./index.html'); 
require('./template/edit-template-dialog.html');
require('./template/view-template-dialog.html');
require('./template/resource-attributes-dialog-view.html');
require('./template/resource-attributes-dialog.html');
require('./template/import-resource-dialog.html');
require('./activation/activation.html');
require('./agents/agents-panel.html');
require('./agents/download-dialog.html');
require('./agents/agent-logs-dialog.html');
require('./agents/agent-config-dialog.html');
require('./agents/log-detail-dialog.html');
require('./agents/ViewCertDetails.html');
require('./common/stepper/bmStepper.html');
require('./register/register.html');
require('./profile/create-profile-wizard.html');
require('./profile/profile-details-dialog.html');
require('./jobs/job-instances-dialog.html');
require('./jobs/job-definitions-dialog.html');
require('./notifications/view-notifications-dialog.html');
require('./login/login-dialog.html');

// ---------------------
// 5️⃣ Constantes
// ---------------------
app.constant('CONFIG', {
  BIZMETRY_BACKEND_URL: '__BIZMETRY_BACKEND_URL__'
});

// ---------------------
// 6️⃣ Bootstrap: app.run()
// ---------------------
require('./bootstrap')(app); 
