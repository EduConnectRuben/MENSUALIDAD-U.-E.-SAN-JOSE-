document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const btnLogin = document.getElementById('btnLogin');
    
    errorMsg.style.display = 'none';
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('username', data.username || username);
            
            // Redirect based on role
            if (data.rol === 'admin') {
                window.location.href = 'estado_pagos.html'; // Admin dashboard
            } else {
                window.location.href = 'index.html'; // Secretaria panel
            }
        } else {
            const errData = await response.json();
            errorMsg.innerText = errData.detail || 'Error al iniciar sesión';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Login error:", error);
        errorMsg.innerText = 'No se pudo conectar al servidor. Verifique su conexión.';
        errorMsg.style.display = 'block';
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'Entrar al Sistema <i class="fas fa-sign-in-alt"></i>';
    }
});

// --- LÓGICA DE RECUPERAR CONTRASEÑA ---
const modalReset = document.getElementById('modalReset');
const linkOlvidaste = document.getElementById('linkOlvidaste');
const btnCloseModal = document.getElementById('btnCloseModal');
const resetForm = document.getElementById('resetForm');
const resetErrorMsg = document.getElementById('resetErrorMsg');
const resetSuccessMsg = document.getElementById('resetSuccessMsg');
const btnReset = document.getElementById('btnReset');

linkOlvidaste.addEventListener('click', (e) => {
    e.preventDefault();
    modalReset.style.display = 'flex';
    resetErrorMsg.style.display = 'none';
    resetSuccessMsg.style.display = 'none';
    resetForm.reset();
});

btnCloseModal.addEventListener('click', () => {
    modalReset.style.display = 'none';
});

// Cerrar al hacer clic afuera del modal
window.addEventListener('click', (e) => {
    if (e.target === modalReset) {
        modalReset.style.display = 'none';
    }
});

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('resetUsername').value.trim();
    const email = document.getElementById('resetEmail').value.trim();
    
    resetErrorMsg.style.display = 'none';
    resetSuccessMsg.style.display = 'none';
    btnReset.disabled = true;
    btnReset.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
    try {
        const response = await fetch('/api/usuarios/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resetSuccessMsg.innerText = data.message;
            resetSuccessMsg.style.display = 'block';
            resetForm.reset();
            setTimeout(() => {
                modalReset.style.display = 'none';
            }, 4000);
        } else {
            resetErrorMsg.innerText = data.detail || 'Error al restablecer la contraseña';
            resetErrorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Reset error:", error);
        resetErrorMsg.innerText = 'No se pudo conectar al servidor.';
        resetErrorMsg.style.display = 'block';
    } finally {
        btnReset.disabled = false;
        btnReset.innerHTML = 'Restablecer Contraseña';
    }
});

