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
                <td>
                    <button class="btn btn-primary btn-sm" onclick="verRecibos(${padre.id}, '${padre.nombre_completo}')" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-eye"></i> Ver Pagos
                    </button>
                </td>
            </tr>
            <tr id="recibos-padre-${padre.id}" style="display: none; background: #1a1a1a;">
                <td colspan="6" style="padding: 1rem;">
                    <div style="background: #2a2a2a; border-radius: 8px; padding: 1rem;">
                        <h4 style="margin-top:0; color:#00A8CC;">Historial de Pagos - ${padre.nombre_completo}</h4>
                        <div id="recibos-list-${padre.id}">Cargando...</div>
                    </div>
                </td>
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

window.verRecibos = async function(padreId, nombre) {
    const row = document.getElementById(`recibos-padre-${padreId}`);
    const listDiv = document.getElementById(`recibos-list-${padreId}`);
    
    // Toggle
    if (row.style.display === 'table-row') {
        row.style.display = 'none';
        return;
    }
    
    row.style.display = 'table-row';
    listDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando recibos...';
    
    try {
        const res = await fetchWithAuth(`${API_URL}/padres/${padreId}/recibos`);
        const recibos = await res.json();
        
        if (recibos.length === 0) {
            listDiv.innerHTML = '<p style="color:#aaa;">Este padre aún no tiene pagos registrados.</p>';
            return;
        }
        
        let html = `<table class="table" style="margin-bottom:0;">
            <thead><tr><th>N° Recibo</th><th>Fecha</th><th>Monto</th><th>Acción</th></tr></thead><tbody>`;
            
        recibos.forEach(r => {
            html += `<tr>
                <td style="color:#FFD700;">${r.nro_recibo}</td>
                <td>${new Date(r.fecha).toLocaleString()}</td>
                <td style="color:#00A8CC; font-weight:bold;">${r.monto} Bs</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="window.open('reimprimir.html?id=${r.id}', '_blank')" style="padding: 4px 8px;" title="Reimprimir">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-info btn-sm" onclick="enviarWhatsApp('${padreId}', '${r.id}', '${r.nro_recibo}', '${r.monto}')" style="padding: 4px 8px;" title="Enviar por WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn btn-danger btn-sm admin-hide" onclick="anularRecibo('${r.id}')" style="padding: 4px 8px;" title="Anular Recibo">
                        <i class="fas fa-times-circle"></i>
                    </button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        listDiv.innerHTML = html;
        
    } catch(e) {
        listDiv.innerHTML = '<span style="color:red;">Error al cargar recibos.</span>';
    }
};

window.enviarWhatsApp = function(padreId, reciboId, nroRecibo, monto) {
    const padre = allPadres.find(p => p.id == padreId);
    let nombre = padre ? padre.nombre_completo : 'Padre/Tutor';
    let mensaje = `Estimado(a) ${nombre},

Le enviamos este mensaje desde la *Unidad Educativa San José* para confirmar su pago.

*Nro de Recibo:* ${nroRecibo}
*Monto:* ${monto} Bs
*Concepto:* Aporte Anual

Gracias por su puntualidad.`;
    let url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
};

window.anularRecibo = async function(reciboId) {
    if(!confirm('🚨 ¿ESTÁS SEGURO DE ANULAR ESTE RECIBO? 🚨\n\nEsta acción devolverá a los estudiantes a estado "Pendiente" y creará un egreso de anulación en caja. NO se puede deshacer.')) return;
    
    try {
        const res = await fetchWithAuth(`${API_URL}/recibos/${reciboId}`, {
            method: 'DELETE'
        });
        
        if(res.ok) {
            alert("✅ Recibo anulado correctamente.");
            location.reload();
        } else {
            const err = await res.json();
            alert("Error: " + (err.detail || 'No se pudo anular'));
        }
    } catch(e) {
        alert("Error de red al anular recibo.");
    }
};
