angular.module('bizmetryApp').controller('LandingCtrl', function ($scope, $window, $http, CONFIG, $mdToast, $mdDialog) {
  $scope.features = [
    {
      image: 'assets/features/kpi.png',
      title: 'Custom KPIs',
      desc: 'Define business metrics without relying on engineering teams.'
    },
    {
      image: 'assets/features/dashboard.png',
      title: 'Real-Time Dashboards',
      desc: 'Visualize metrics and connected agents live.'
    },
    {
      image: 'assets/features/ai-monitoring.png',
      title: 'AI Monitoring',
      desc: 'Track precision, consistency and completeness of AI responses.'
    },
    {
      image: 'assets/features/integration.png',
      title: 'Seamless Integration',
      desc: 'Connect any system through our open agent.'
    },
    {
      image: 'assets/features/asbo.png',
      title: 'Structured ASBO Definitions',
      desc: 'Define business entities, attributes and types with structured logic.'
    },
    {
      image: 'assets/features/metadata-import.png',
      title: 'Metadata Import from Databases',
      desc: 'Import schema metadata and generate entities directly from your data sources.'
    },
    {
      image: 'assets/features/templates.png',
      title: 'Template Inheritance',
      desc: 'Create business-specific templates derived from master telemetry templates.'
    },
    {
      image: 'assets/features/reports.png',
      title: 'Dashboards and Reports',
      desc: 'Generate real-time dashboards and export custom analytics reports.'
    },
    {
      image: 'assets/features/agent-management.png',
      title: 'Central Agent Management',
      desc: 'Deploy, monitor and control telemetry agents across all environments from a unified interface.'
    }
  ];

  $scope.screenshots = [
    { url: 'assets/screens/login-screen.png', caption: 'Federated Login' },
    { url: 'assets/screens/home-screen.png', caption: 'Home' },
    { url: 'assets/screens/agents-screen.png', caption: 'Agent Configuration' },
    { url: 'assets/screens/profile-editor.png', caption: 'Profile Editor' },
    { url: 'assets/screens/import-resources.png', caption: 'Importing Resources' },
    { url: 'assets/screens/agent-monitoring.png', caption: 'Monitoring Agents' },
    { url: 'assets/screens/environments-screen.png', caption: 'Managing Environments' },
    { url: 'assets/screens/resource-domains.png', caption: 'Mapping Business Domains' },
    { url: 'assets/screens/template-explorer.png', caption: 'Hierarchical Template Explorer' },
    { url: 'assets/screens/agents-panel.png', caption: 'Agent Panel' },
    { url: 'assets/screens/agent-download.png', caption: 'Download Agents' },
    { url: 'assets/screens/profile-wizard.png', caption: 'Profile Creation Wizard' }
  ];

  $scope.goToEvents = function ($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $window.location.replace('/events/events.html');
  };

  $scope.goToDocs = function ($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $window.location.replace('https://docs.bizmetry.io/');
  };


  $scope.goToBrochure = function ($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $window.location.replace('https://docs.bizmetry.io/multimedia/brochures/bizmetry-brochure.pdf');
  };

  $scope.goToLogin = function ($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $window.location.replace('https://www.bizmetry.io/');
  };

  $scope.goToDocs = function ($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $window.location.replace('https://docs.bizmetry.io');
  };

  // ✅ Función para abrir el PDF en un modal - CORREGIDA
  $scope.openPdfDialog = function (ev) {
    console.log('📄 Opening PDF in dialog');

    $mdDialog.show({
      controller: function ($scope, $mdDialog, $timeout) {
        $scope.close = function () {
          $mdDialog.hide();
        };

        // Inicializar PDF.js después de que el DOM esté listo
        $timeout(function () {
          console.log('📄 Initializing PDF.js');

          // Verificar si PDF.js está cargado
          if (typeof pdfjsLib === 'undefined') {
            console.error('❌ PDF.js not loaded! Ensure to include the script in your HTML');
            return;
          }

          // ✅ CRÍTICO: Configurar el workerSrc de PDF.js
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

          const url = '/assets/documents/agentic-registry-oss.pdf';
          const container = document.getElementById('pdfViewer');

          // Mostrar loading mientras carga el PDF
          container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #667eea;"><md-progress-circular md-mode="indeterminate"></md-progress-circular><span style="margin-left: 12px;">Loading PDF...</span></div>';

          // Cargar el documento PDF
          const loadingTask = pdfjsLib.getDocument(url);
          
          loadingTask.promise.then(function (pdf) {
            console.log('✅ PDF loaded successfully. Pages:', pdf.numPages);
            
            // Limpiar el contenedor
            container.innerHTML = '';
            
            // Renderizar todas las páginas
            const numPages = pdf.numPages;
            
            // Función para renderizar una página
            function renderPage(pageNumber) {
              pdf.getPage(pageNumber).then(function (page) {
                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });

                // Crear un canvas para renderizar el PDF
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto 20px';
                canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';

                // Añadir el canvas al contenedor
                container.appendChild(canvas);

                // Renderizar la página en el canvas
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                
                page.render(renderContext).promise.then(function() {
                  console.log('✅ Page ' + pageNumber + ' rendered');
                });
              });
            }
            
            // Renderizar todas las páginas
            for (let i = 1; i <= numPages; i++) {
              renderPage(i);
            }
            
          }).catch(function (error) {
            console.error('❌ Error loading PDF:', error);
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #e11d48;"><span class="material-icons" style="font-size: 48px;">error</span><p style="margin-top: 16px;">Error loading PDF. Please try again.</p><p style="font-size: 12px; color: #6b7280; margin-top: 8px;">' + error.message + '</p></div>';
          });
        }, 100);
      },
      template: `
      <md-dialog aria-label="Agentic Registry OSS Brochure" class="pdf-dialog">
        <md-toolbar style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="md-toolbar-tools">
            <md-icon style="color: white; margin-right: 12px;">description</md-icon>
            <h2 style="color: white; font-weight: 600;">Agentic Registry OSS Brochure</h2>
            <span flex></span>
            <md-button class="md-icon-button" ng-click="close()">
              <md-icon style="color: white;">close</md-icon>
            </md-button>
          </div>
        </md-toolbar>

        <md-dialog-content class="pdf-dialog-content" style="overflow-y: auto;">
          <div id="pdfViewer" style="min-height: 500px; width: 100%; padding: 20px;"></div>
        </md-dialog-content>

        <md-dialog-actions layout="row" layout-align="center center" style="padding: 16px; background: #f9fafb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">info</span>
            Agentic Registry OSS - Open Source Governance Solution
          </p>
        </md-dialog-actions>
      </md-dialog>
    `,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      escapeToClose: true,
      fullscreen: true
    });
  };

  // ✅ Abrir video técnico con Video.js
  $scope.openTechnicalVideo = function (ev) {
    console.log('🎬 Opening technical video with Video.js');

    $mdDialog.show({
      controller: function ($scope, $mdDialog, $timeout) {
        $scope.close = function () {
          if (window.technicalVideoPlayer) {
            window.technicalVideoPlayer.dispose();
            window.technicalVideoPlayer = null;
          }
          $mdDialog.hide();
        };

        $timeout(function () {
          console.log('🎥 Initializing Video.js player');

          if (typeof videojs === 'undefined') {
            console.error('❌ Video.js not loaded! Make sure to include it in index.html');
            return;
          }

          window.technicalVideoPlayer = videojs('technical-video-player', {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            aspectRatio: '16:9',
            playbackRates: [0.5, 1, 1.5, 2],
            controlBar: {
              volumePanel: {
                inline: false
              }
            }
          });

          window.technicalVideoPlayer.on('play', function () {
            console.log('▶️ Video playing');
          });

          window.technicalVideoPlayer.on('pause', function () {
            console.log('⏸️ Video paused');
          });

          window.technicalVideoPlayer.on('ended', function () {
            console.log('✅ Video ended');
          });

          window.technicalVideoPlayer.on('error', function (error) {
            console.error('❌ Video error:', error);
          });
        }, 100);
      },
      template: `
        <md-dialog aria-label="Technical Pitch Video" class="technical-video-dialog">
          <md-toolbar style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="md-toolbar-tools">
              <md-icon style="color: white; margin-right: 12px;">play_circle_filled</md-icon>
              <h2 style="color: white; font-weight: 600;">BizMetry Technical Pitch</h2>
              <span flex></span>
              <md-button class="md-icon-button" ng-click="close()">
                <md-icon style="color: white;">close</md-icon>
              </md-button>
            </div>
          </md-toolbar>
          
          <md-dialog-content class="technical-video-content">
            <div class="video-container">
              <video 
                id="technical-video-player" 
                class="video-js vjs-big-play-centered"
                poster="assets/videos/thumbnail.jpg">
                <source src="assets/videos/Bizmetry_Intro_Video.mp4" type="video/mp4">
                <p class="vjs-no-js">
                  To view this video please enable JavaScript, and consider upgrading to a 
                  web browser that <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
                </p>
              </video>
            </div>
          </md-dialog-content>
          
          <md-dialog-actions layout="row" layout-align="center center" style="padding: 16px; background: #f9fafb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">info</span>
              Technical overview of BizMetry platform capabilities
            </p>
          </md-dialog-actions>
        </md-dialog>
      `,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      escapeToClose: true,
      fullscreen: true
    });
  };

  // ✅ Función para mostrar screenshots en fullscreen
  $scope.showScreenshotFullsize = function (screenshot, ev) {
    console.log('✅ showScreenshotFullsize called');

    $mdDialog.show({
      controller: function ($scope, $mdDialog, screenshot) {
        $scope.screenshot = screenshot;
        $scope.close = function () {
          $mdDialog.hide();
        };
      },
      template: `
        <md-dialog aria-label="Screenshot Preview" class="landing-screenshot-dialog">
          <md-toolbar style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="md-toolbar-tools">
              <h2 style="color: white; font-weight: 500;">{{screenshot.caption}}</h2>
              <span flex></span>
              <md-button class="md-icon-button" ng-click="close()">
                <md-icon style="color: white;">close</md-icon>
              </md-button>
            </div>
          </md-toolbar>
          
          <md-dialog-content class="landing-screenshot-content">
            <img ng-src="{{screenshot.url}}" 
                 alt="{{screenshot.caption}}" 
                 class="landing-screenshot-fullsize">
          </md-dialog-content>
          
          <md-dialog-actions layout="row" layout-align="center center" style="padding: 16px; background: #f9fafb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">info</span>
              {{screenshot.caption}}
            </p>
          </md-dialog-actions>
        </md-dialog>
      `,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      escapeToClose: true,
      fullscreen: true,
      locals: {
        screenshot: screenshot
      }
    });
  };

  // ✅ Función alternativa para abrir video (iframe)
  $scope.openVideo = function () {
    $mdDialog.show({
      controller: function ($scope, $mdDialog, $sce) {
        $scope.close = function () {
          $mdDialog.hide();
        };
        $scope.videoUrl = $sce.trustAsResourceUrl("https://docs.bizmetry.io/multimedia/videos/bizmetry-intro.mp4");
      },
      template: `
      <md-dialog aria-label="BizMetry Introduction Video" class="video-dialog">
        <md-toolbar style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="md-toolbar-tools">
            <h2 style="color: white; font-weight: 600;">BizMetry Introduction</h2>
            <span flex></span>
            <md-button class="md-icon-button" ng-click="close()">
              <md-icon style="color: white;">close</md-icon>
            </md-button>
          </div>
        </md-toolbar>
        
        <md-dialog-content class="video-dialog-content">
          <iframe ng-src="{{videoUrl}}" width="100%" height="80%" frameborder="0" allowfullscreen></iframe>
        </md-dialog-content>
        
        <md-dialog-actions>
          <md-button class="md-primary" ng-click="close()">Close</md-button>
        </md-dialog-actions>
      </md-dialog>
    `,
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      escapeToClose: true
    });
  };

  // Contact form logic
  $scope.contact = {};
  $scope.sendingContact = false;
  $scope.contactTooltipVisible = false;

  function authenticateTemporaryUser() {
    return $http.post(CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/temp-auth')
      .then(function (response) {
        var tempToken = response.data.access_token;
        sessionStorage.setItem('temp_token', tempToken);
        console.log("✅ Temp token received");
      })
      .catch(function (error) {
        console.error("🚨 Error fetching temp token:", error);
      });
  }

  $scope.sendContact = function () {
    $scope.sendingContact = true;

    const payload = {
      name: $scope.contact.name,
      email: $scope.contact.email,
      subject: "Contact Form - BizMetry",
      message: "Contact Message from user: " + $scope.contact.message
    };

    const token = sessionStorage.getItem('temp_token');

    function sendRequest(token) {
      $http.post(CONFIG.BIZMETRY_BACKEND_URL + '/v1/api/bizmetry-account/account/contact', payload, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then(function () {
          $scope.contactTooltipVisible = true;

          setTimeout(() => {
            const tooltipEl = document.querySelector('.contact-tooltip');
            if (tooltipEl) tooltipEl.classList.add('fade-out');
          }, 4000);

          setTimeout(() => {
            $scope.$apply(() => {
              $scope.contactTooltipVisible = false;
              $scope.contact = {};
              $scope.contactForm.$setPristine();
              $scope.contactForm.$setUntouched();
            });
          }, 6000);

        })
        .catch(function (error) {
          console.error("Error sending contact:", error);
        })
        .finally(function () {
          $scope.sendingContact = false;
        });
    }

    if (token) {
      sendRequest(token);
    } else {
      authenticateTemporaryUser().then(() => {
        const newToken = sessionStorage.getItem('temp_token');
        sendRequest(newToken);
      });
    }
  };

});