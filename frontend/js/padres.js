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

let currentPadresData = [];

function renderPadres(data) {
    currentPadresData = data;
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
        padre.estudiantes.forEach(est => {
            const grado = est.curso ? est.curso.split(' ')[0] : '';
            if (grado) {
                cursosSet.add(`${grado} "${est.paralelo}"`);
            }
        });
        
        let cursosTexto = 'Ninguno';
        if (cursosSet.size > 0) {
            cursosTexto = Array.from(cursosSet).join(', ') + ' de Secundaria';
        }

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

window.exportarExcelPadres = function() {
    if (!currentPadresData || currentPadresData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    let xls_html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <meta charset="utf-8">
    <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Padres</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
    <table border="1">
        <tr>
            <th style="background-color:#FFD700; color:black;">N°</th>
            <th style="background-color:#FFD700; color:black;">Carnet (C.I.)</th>
            <th style="background-color:#FFD700; color:black;">Nombre del Padre / Tutor</th>
            <th style="background-color:#FFD700; color:black;">Cantidad de Hijos</th>
            <th style="background-color:#FFD700; color:black;">Cursos de sus Hijos</th>
        </tr>`;

    currentPadresData.forEach((padre, index) => {
        const cantidadHijos = padre.estudiantes.length;
        const hijosTexto = cantidadHijos === 1 ? '1 hijo' : `${cantidadHijos} hijos`;
        
        const cursosSet = new Set();
        padre.estudiantes.forEach(est => {
            const grado = est.curso ? est.curso.split(' ')[0] : '';
            if (grado) {
                cursosSet.add(`${grado} "${est.paralelo}"`);
            }
        });
        
        let cursosTexto = 'Ninguno';
        if (cursosSet.size > 0) {
            cursosTexto = Array.from(cursosSet).join(', ') + ' de Secundaria';
        }

        xls_html += `
        <tr>
            <td>${index + 1}</td>
            <td>${padre.carnet}</td>
            <td>${padre.nombre_completo}</td>
            <td>${hijosTexto}</td>
            <td>${cursosTexto}</td>
        </tr>`;
    });

    xls_html += `</table></body></html>`;

    const blob = new Blob([xls_html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Lista_Padres_Tutores.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
