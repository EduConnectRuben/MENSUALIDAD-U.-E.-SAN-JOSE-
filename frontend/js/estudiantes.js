const API_URL = '/api';

const tbody = document.getElementById('tbodyEstudiantes');
const inputSearch = document.getElementById('inputSearch');
const selectCurso = document.getElementById('selectCurso');
const selectParalelo = document.getElementById('selectParalelo');
const btnExportar = document.getElementById('btnExportar');
const btnVaciarLista = document.getElementById('btnVaciarLista');
const loadingMsg = document.getElementById('loadingMsg');

let debounceTimer;
const currentRol = localStorage.getItem('rol');

if (currentRol === 'admin') {
    btnVaciarLista.style.display = 'block';
    document.querySelector('.col-acciones').style.display = 'table-cell';
}

async function fetchEstudiantes() {
    loadingMsg.style.display = 'block';
    tbody.innerHTML = '';
    
    let url = new URL(`${API_URL}/estudiantes`, window.location.origin);
    if (inputSearch.value) url.searchParams.append('search', inputSearch.value);
    if (selectCurso.value) url.searchParams.append('curso', selectCurso.value);
    if (selectParalelo.value) url.searchParams.append('paralelo', selectParalelo.value);

    try {
        const response = await fetchWithAuth(url);
        const data = await response.json();
        window.currentInscritosData = data;
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${currentRol === 'admin' ? 7 : 6}" style="text-align: center;">No se encontraron estudiantes</td></tr>`;
        } else {
            data.forEach((est, index) => {
                let accionesHtml = '';
                if (currentRol === 'admin') {
                    const btnColor = est.estado_matricula === 'Retirado' ? '#ff9800' : '#888';
                    const btnIcon = est.estado_matricula === 'Retirado' ? 'fa-user-check' : 'fa-user-times';
                    const btnTitle = est.estado_matricula === 'Retirado' ? 'Reactivar' : 'Dar de Baja';
                    
                    const btnNuevoColor = est.estado_matricula === 'Nuevo' ? '#00A8CC' : '#444';
                    const btnNuevoTitle = est.estado_matricula === 'Nuevo' ? 'Quitar Nuevo' : 'Marcar Nuevo';
                    
                    accionesHtml = `
                        <td style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn" title="${btnTitle}" style="background: ${btnColor}; color: white; padding: 4px 8px; font-size: 0.8rem; white-space: nowrap;" onclick="darDeBaja(${est.id}, '${est.nombres}')">
                                <i class="fas ${btnIcon}"></i> ${btnTitle}
                            </button>
                            <button class="btn" title="${btnNuevoTitle}" style="background: ${btnNuevoColor}; color: white; padding: 4px 8px; font-size: 0.8rem; white-space: nowrap;" onclick="marcarNuevo(${est.id}, '${est.nombres}')">
                                <i class="fas fa-star"></i> ${btnNuevoTitle}
                            </button>
                            <button class="btn" title="Eliminar definitivamente" style="background: #ff4444; color: white; padding: 4px 8px; font-size: 0.8rem; white-space: nowrap;" onclick="deleteEstudiante(${est.id}, '${est.nombres} ${est.apellidos}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    `;
                }

                const styleRow = est.estado_matricula === 'Retirado' ? 'color: #ff4444; text-decoration: line-through;' : '';
                let badgeRetirado = est.estado_matricula === 'Retirado' ? ' <span class="badge badge-danger">Retirado</span>' : '';
                if (est.estado_matricula === 'Nuevo') badgeRetirado += ' <span class="badge badge-info" style="background: #00A8CC;">Nuevo Ingreso</span>';

                tbody.innerHTML += `
                    <tr style="${styleRow}">
                        <td>${index + 1}</td>
                        <td>${est.nombres}${badgeRetirado}</td>
                        <td>${est.apellidos}</td>
                        <td>${est.ci || '-'}</td>
                        <td>${est.curso}</td>
                        <td>${est.paralelo}</td>
                        ${accionesHtml}
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error fetching students:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al conectar con el servidor</td></tr>`;
    } finally {
        loadingMsg.style.display = 'none';
    }
}

function handleFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchEstudiantes, 300);
}

inputSearch.addEventListener('input', handleFilterChange);
selectCurso.addEventListener('change', handleFilterChange);
selectParalelo.addEventListener('change', handleFilterChange);

btnExportar.addEventListener('click', () => {
    if (!window.currentInscritosData || window.currentInscritosData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    let xls_html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <meta charset="utf-8">
    <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inscritos</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
    <table border="1">
        <tr>
            <th style="background-color:#FFD700; color:black;">N°</th>
            <th style="background-color:#FFD700; color:black;">Nombres</th>
            <th style="background-color:#FFD700; color:black;">Apellidos</th>
            <th style="background-color:#FFD700; color:black;">C.I.</th>
            <th style="background-color:#FFD700; color:black;">Curso</th>
            <th style="background-color:#FFD700; color:black;">Paralelo</th>
            <th style="background-color:#FFD700; color:black;">Situación (Matrícula)</th>
        </tr>`;

    window.currentInscritosData.forEach((est, index) => {
        xls_html += `
        <tr>
            <td>${index + 1}</td>
            <td>${est.nombres}</td>
            <td>${est.apellidos}</td>
            <td>${est.ci || '-'}</td>
            <td>${est.curso || '-'}</td>
            <td>${est.paralelo || '-'}</td>
            <td>${est.estado_matricula}</td>
        </tr>`;
    });

    xls_html += `</table></body></html>`;

    const blob = new Blob([xls_html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const curso = document.getElementById('selectCurso').value || 'Todos_Cursos';
    const paralelo = document.getElementById('selectParalelo').value || 'Todos_Paralelos';
    let filename = `Lista_Inscritos_${curso}_${paralelo}.xls`.replace(/ /g, '_');
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- DAR DE BAJA ---
window.darDeBaja = async function(id, nombre) {
    if (!confirm(`¿Cambiar estado de Retirado/Activo para ${nombre}?`)) return;
    try {
        const response = await fetchWithAuth(`${API_URL}/estudiantes/${id}/baja`, { method: 'PUT' });
        if (response.ok) fetchEstudiantes();
        else alert("Error al cambiar estado.");
    } catch (error) {
        console.error(error);
    }
};

window.marcarNuevo = async function(id, nombre) {
    if (!confirm(`¿Cambiar estado de Nuevo Ingreso para ${nombre}?`)) return;
    try {
        const response = await fetchWithAuth(`${API_URL}/estudiantes/${id}/nuevo`, { method: 'PUT' });
        if (response.ok) fetchEstudiantes();
        else alert("Error al cambiar estado.");
    } catch (error) {
        console.error(error);
    }
};

// --- ELIMINAR ESTUDIANTE (Solo Admin) ---
window.deleteEstudiante = async function(id, nombre) {
    if (!confirm(`¿Está seguro que desea eliminar DEFINITIVAMENTE a ${nombre}?`)) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/estudiantes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert("Estudiante eliminado correctamente.");
            fetchEstudiantes(); // recargar lista
        } else {
            const data = await response.json();
            alert(data.detail || "Error al eliminar el estudiante.");
        }
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error de conexión al eliminar.");
    }
};

// --- VACIAR LISTA (Solo Admin, con doble confirmación) ---
btnVaciarLista.addEventListener('click', async () => {
    const confirmation = prompt('PELIGRO: Esto eliminará a TODOS los estudiantes del sistema.\nEscriba la palabra CONFIRMAR (en mayúsculas) para continuar:');
    
    if (confirmation === 'CONFIRMAR') {
        try {
            btnVaciarLista.disabled = true;
            btnVaciarLista.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vaciando...';
            
            const response = await fetchWithAuth(`${API_URL}/estudiantes`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert("¡Todos los estudiantes han sido eliminados del sistema!");
                fetchEstudiantes(); // recargar lista
            } else {
                const data = await response.json();
                alert(data.detail || "Error al vaciar la lista.");
            }
        } catch (error) {
            console.error("Error vaciando lista:", error);
            alert("Error de conexión al vaciar la lista.");
        } finally {
            btnVaciarLista.disabled = false;
            btnVaciarLista.innerHTML = '<i class="fas fa-trash-alt"></i> Vaciar Año Escolar';
        }
    } else if (confirmation !== null) {
        alert("Operación cancelada. La palabra no coincide.");
    }
});

// Initial fetch
fetchEstudiantes();
