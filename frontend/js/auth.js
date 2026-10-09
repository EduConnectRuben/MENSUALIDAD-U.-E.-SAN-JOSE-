// auth.js - Middleware to check authentication on protected pages

const token = localStorage.getItem('token');
const rol = localStorage.getItem('rol');

if (!token) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Function to handle 401 Unauthorized responses globally
async function fetchWithAuth(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    
    // Si la data es FormData, no seteamos Content-Type para que el browser lo haga (con el boundary)
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    options.headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, options);
    
    if (response.status === 401) {
        alert("Su sesión ha expirado o no está autorizado.");
        logout();
        throw new Error("Unauthorized");
    }
    return response;
}

document.addEventListener("DOMContentLoaded", () => {
    // Modify UI based on role
    const currentPath = window.location.pathname;
    
    if (rol === 'admin') {
        // Ocultar elementos que admin no debe ver
        const adminHideElements = document.querySelectorAll('.admin-hide');
        adminHideElements.forEach(el => el.style.display = 'none');
        
        // Proteger páginas exclusivas de secretaría
        if (currentPath === '/' || currentPath === '' || currentPath.includes('index.html') || currentPath.includes('importar_excel.html') || currentPath.includes('caja_informe.html')) {
            alert("Acceso denegado: Panel exclusivo de Secretaría.");
            window.location.href = 'estado_pagos.html';
        }
    }
});

let deferredPrompt = null;

// Agregar el botón de instalar SIEMPRE (a menos que ya esté instalado)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya está instalado (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (!isStandalone) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && !document.getElementById('btnInstallApp')) {
            const installBtn = document.createElement('a');
            installBtn.href = '#';
            installBtn.id = 'btnInstallApp';
            installBtn.style.color = '#00A8CC';
            installBtn.innerHTML = '<i class="fas fa-download"></i> Instalar';
            
            installBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (deferredPrompt) {
                    // Mostrar prompt nativo
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        installBtn.style.display = 'none';
                    }
                    deferredPrompt = null;
                } else {
                    // Si el navegador no dio el prompt automático, enseñarle cómo hacerlo
                    alert("Para instalar en Celular: Toca los 3 puntitos del navegador (arriba a la derecha) y elige 'Añadir a la pantalla principal' o 'Instalar aplicación'.\n\nPara instalar en Computadora: Haz clic en el ícono de descarga que aparece arriba en la barra de direcciones.");
                }
            });
            // Insertarlo al principio
            navLinks.insertBefore(installBtn, navLinks.firstChild);
        }
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('btnInstallApp');
    if (installBtn) installBtn.style.display = 'none';
});

// =====================================================
// KEEP-ALIVE: Ping al servidor cada 9 min para que
// Render no ponga el servidor a dormir (plan gratuito)
// =====================================================
function keepAlive() {
    fetch('/api/ping', { method: 'GET' })
        .then(r => r.json())
        .then(() => console.log('[KeepAlive] Servidor activo ✓'))
        .catch(() => console.warn('[KeepAlive] Sin conexión, reintentando...'));
}

// Primer ping inmediato al abrir la app, luego cada 9 minutos
keepAlive();
setInterval(keepAlive, 9 * 60 * 1000);
