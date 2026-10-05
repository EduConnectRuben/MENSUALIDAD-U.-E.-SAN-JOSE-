// =============================================
// PWA Install Button - Mensualidad 27 de Mayo
// =============================================

// Crear el botón flotante de instalación
const installButton = document.createElement('button');
installButton.id = 'pwa-install-button';
installButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle;">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
  <span>Instalar App</span>
`;

Object.assign(installButton.style, {
  position: 'fixed',
  bottom: '25px',
  right: '25px',
  padding: '12px 22px',
  background: 'linear-gradient(135deg, #FFA500, #e08800)',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '50px',
  fontSize: '15px',
  fontWeight: '700',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  display: 'none',
  zIndex: '9999',
  boxShadow: '0 4px 20px rgba(255, 165, 0, 0.5)',
  alignItems: 'center',
  transition: 'transform 0.2s, box-shadow 0.2s'
});

// Efecto hover
installButton.addEventListener('mouseover', () => {
  installButton.style.transform = 'translateY(-3px)';
  installButton.style.boxShadow = '0 8px 25px rgba(255, 165, 0, 0.7)';
});
installButton.addEventListener('mouseout', () => {
  installButton.style.transform = 'translateY(0)';
  installButton.style.boxShadow = '0 4px 20px rgba(255, 165, 0, 0.5)';
});

document.body.appendChild(installButton);

// ---- Capturar el evento de instalación ----
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Listo para instalar');
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'flex';
});

// ---- Clic en el botón ----
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      installButton.innerHTML = '✅ ¡Instalada!';
      setTimeout(() => { installButton.style.display = 'none'; }, 2500);
    } else {
      installButton.style.display = 'none';
    }
  } catch (error) {
    console.error('[PWA] Error al instalar:', error);
  } finally {
    deferredPrompt = null;
  }
});

// Ocultar si ya está instalada
window.addEventListener('appinstalled', () => {
  installButton.style.display = 'none';
  console.log('[PWA] App instalada correctamente');
});

// ---- Registro del Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/instalar/sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker registrado:', reg.scope);
      })
      .catch(err => {
        console.error('[PWA] Error al registrar SW:', err);
      });
  });
}

// ---- Instrucciones para iOS (Safari no dispara beforeinstallprompt) ----
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInStandalone = window.matchMedia('(display-mode: standalone)').matches;

if (isIOS && !isInStandalone) {
  const iosBanner = document.createElement('div');
  iosBanner.innerHTML = `
    <div style="
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 14px 20px; background: #1e1e1e;
      border-top: 2px solid #FFA500; text-align: center;
      z-index: 9999; font-family: Inter, sans-serif;
    ">
      <p style="margin:0; color: #fff; font-size: 14px;">
        📱 Para instalar: toca <strong style="color:#FFA500;">Compartir</strong> 
        → <strong style="color:#FFA500;">Añadir a pantalla de inicio</strong>
      </p>
    </div>
  `;
  document.body.appendChild(iosBanner);
}