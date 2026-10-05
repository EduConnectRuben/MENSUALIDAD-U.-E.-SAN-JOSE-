const API_URL = '/api';

const tbody = document.getElementById('tbodyPadres');
const inputSearch = document.getElementById('inputSearchPadre');
const totalPadres = document.getElementById('totalPadres');
const loadingMsg = document.getElementById('loadingMsg');
let debounceTimer;
let allPadres = [];

async function fetchPadres() {
    loadingMsg.style.display = 'block';
    tbody.innerHTML = '';
    
    try {
        const response = await fetchWithAuth(`${API_URL}/padres`);
        allPadres = await response.json();
        renderPadres(allPadres);
    } catch (error) {
        console.error("Error fetching padres:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al conectar con el servidor</td></tr>`;
    } finally {
        loadingMsg.style.display = 'none';
    }
}

function renderPadres(data) {
    tbody.innerHTML = '';
    totalPadres.innerText = `Total: ${data.length}`;
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay padres registrados</td></tr>`;
        return;
    }

    data.forEach((padre, index) => {
        const cantidadHijos = padre.estudiantes.length;
        const hijosTexto = cantidadHijos === 1 ? '1 hijo' : `${cantidadHijos} hijos`;
        
        // Extraer los cursos de los hijos (evitando duplicados)
        const cursosSet = new Set();
        padre.estudiantes.forEach(est => cursosSet.add(est.curso));
        const cursosTexto = Array.from(cursosSet).join(', ') || 'Ninguno';

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight: bold;">${padre.carnet}</td>
                <td>${padre.nombre_completo}</td>
                <td><span style="color: #00A8CC; font-weight: bold;">${hijosTexto}</span></td>
                <td><span class="badge badge-info" style="background: rgba(255,255,255,0.1); border: 1px solid #aaa; color: #ddd; padding: 4px 8px; border-radius: 10px;">${cursosTexto}</span></td>
            </tr>
        `;
    });
}

inputSearch.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = inputSearch.value.toLowerCase();
        const filtrados = allPadres.filter(p => 
            p.nombre_completo.toLowerCase().includes(query) || 
            p.carnet.toLowerCase().includes(query)
        );
        renderPadres(filtrados);
    }, 300);
});

fetchPadres();
