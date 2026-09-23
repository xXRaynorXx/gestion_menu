let appData = {
    productos: [
        { id: 1, nombre: "Arroz", disponible: true, congelador: false, notes: "Paquete de 1kg" },
        { id: 2, nombre: "Pollo", disponible: true, congelador: true, notes: "Pechugas congeladas" },
        { id: 3, nombre: "Ternera", disponible: false, congelador: true, notes: "Agotado temporalmente" }
    ],
    planificacion: {
        "Semana 1": {}, "Semana 2": {}, "Semana 3": {}, "Semana 4": {}
    }
};

const diasSemana = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

document.addEventListener("DOMContentLoaded", () => {
    const local = localStorage.getItem("planificador_mensual_db");
    if(local) {
        try { appData = JSON.parse(local); } catch(e) { console.error(e); }
    }
    renderProductos();
    renderPlanificador();
});

function sincronizar() {
    localStorage.setItem("planificador_mensual_db", JSON.stringify(appData));
}

function renderProductos() {
    const list = document.getElementById("productList");
    if(!list) return;
    list.innerHTML = "";
    
    appData.productos.forEach(prod => {
        const li = document.createElement("li");
        li.className = "product-item";
        li.innerHTML = `
            <div class="product-info">
                <h4 style="text-decoration: ${prod.disponible ? 'none' : 'line-through'}; color: ${prod.disponible ? 'var(--text)' : '#94a3b8'}">
                    ${prod.nombre} ${prod.congelador ? '❄️' : '🏠'}
                </h4>
                <p>${prod.notes ? prod.notes : 'Sin anotaciones.'}</p>
            </div>
            <div class="product-actions">
                <button class="btn-warning" style="padding:4px 8px; font-size:11px;" onclick="cargarEditarProducto(${prod.id})">✏️</button>
                <button class="btn-success" style="padding:4px 8px; font-size:11px;" onclick="cambiarEstado(${prod.id})">
                    ${prod.disponible ? 'Agotar' : 'Activar'}
                </button>
                <button class="btn-danger" style="padding:4px 8px; font-size:11px;" onclick="eliminarProducto(${prod.id})">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function guardarProducto(e) {
    e.preventDefault();
    const idEdicion = document.getElementById("editingProductId").value;
    const nombre = document.getElementById("prodName").value.trim();
    const disponible = document.getElementById("prodDisponible").checked;
    const congelador = document.getElementById("prodCongelador").checked;
    const notas = document.getElementById("prodNotas").value.trim();

    if (idEdicion) {
        const prod = appData.productos.find(p => p.id == idEdicion);
        if (prod) {
            prod.nombre = nombre;
            prod.disponible = disponible;
            prod.congelador = congelador;
            prod.notes = notas;
        }
        cancelarEdicion();
    } else {
        appData.productos.push({ id: Date.now(), nombre, disponible, congelador, notes: notas });
    }

    sincronizar();
    renderProductos();
    renderPlanificador();
    document.getElementById("productForm").reset();
    document.getElementById("prodDisponible").checked = true;
}

function cargarEditarProducto(id) {
    const prod = appData.productos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById("editingProductId").value = prod.id;
    document.getElementById("prodName").value = prod.nombre;
    document.getElementById("prodDisponible").checked = prod.disponible;
    document.getElementById("prodCongelador").checked = prod.congelador;
    document.getElementById("prodNotas").value = prod.notes || '';

    document.getElementById("formTitle").innerText = "Modificar Producto";
    document.getElementById("btnSubmitForm").innerText = "Actualizar Cambios";
    document.getElementById("btnSubmitForm").style.background = "var(--warning)";
    document.getElementById("btnCancelEdit").style.display = "block";
}

function cancelarEdicion() {
    document.getElementById("editingProductId").value = "";
    document.getElementById("productForm").reset();
    document.getElementById("prodDisponible").checked = true;
    
    document.getElementById("formTitle").innerText = "Registrar Producto";
    document.getElementById("btnSubmitForm").innerText = "Registrar Producto";
    document.getElementById("btnSubmitForm").style.background = "var(--primary)";
    document.getElementById("btnCancelEdit").style.display = "none";
}

function cambiarEstado(id) {
    const prod = appData.productos.find(p => p.id === id);
    if(prod) {
        prod.disponible = !prod.disponible;
        sincronizar();
        renderProductos();
        renderPlanificador();
    }
}

function eliminarProducto(id) {
    appData.productos = appData.productos.filter(p => p.id !== id);
    sincronizar();
    renderProductos();
    renderPlanificador();
}

function renderPlanificador() {
    const container = document.getElementById("plannerGrid");
    if(!container) return;
    container.innerHTML = "";

    const semanaActiva = document.getElementById("currentMonth").value;

    diasSemana.forEach(dia => {
        const col = document.createElement("div");
        col.className = "day-column";
        
        const header = document.createElement("div");
        header.className = "day-header";
        header.innerText = dia;
        col.appendChild(header);

        ["comida", "cena"].forEach(momento => {
            const mealSec = document.createElement("div");
            mealSec.className = "meal-section";
            
            const title = document.createElement("div");
            title.className = "meal-title";
            title.innerHTML = `<span>${momento}</span>`;
            
            const btn = document.createElement("button");
            btn.innerText = "+";
            btn.style.padding = "2px 6px";
            btn.style.fontSize = "12px";
            btn.onclick = () => abrirModal(dia, momento);
            title.appendChild(btn);
            
            mealSec.appendChild(title);

            const slot = document.createElement("div");
            slot.className = "meal-slot";
            
            const clave = `${dia}-${momento}`;
            const platos = appData.planificacion[semanaActiva][clave] || [];
            
            if(platos.length === 0) {
                slot.innerHTML = `<div style="font-size:11px; color:#94a3b8; text-align:center; padding-top:25px;">Vacío</div>`;
            } else {
                platos.forEach((plato, idx) => {
                    const tag = document.createElement("div");
                    tag.className = "dish-tag";
                    tag.innerHTML = `
                        <span><strong>${plato.nombre}</strong><br><small style="font-size:10px; opacity:0.8;">(${plato.ingredientes.join(', ')})</small></span>
                        <button onclick="eliminarPlato('${semanaActiva}', '${clave}', ${idx})">×</button>
                    `;
                    slot.appendChild(tag);
                });
            }
            
            mealSec.appendChild(slot);
            col.appendChild(mealSec);
        });

        container.appendChild(col);
    });
}

function abrirModal(dia, momento) {
    document.getElementById("modalDia").value = dia;
    document.getElementById("modalMomento").value = momento;
    document.getElementById("modalTitle").innerText = `Asignar ${momento} - ${dia}`;
    document.getElementById("dishName").value = "";
    
    const box = document.getElementById("modalIngredients");
    box.innerHTML = "";
    
    const disponibles = appData.productos.filter(p => p.disponible);
    
    if(disponibles.length === 0) {
        box.innerHTML = "<p style='font-size:12px; color:var(--danger); font-weight:bold;'>⚠️ No hay ingredientes 'Disponibles'. Activa alguno en el panel lateral.</p>";
    } else {
        disponibles.forEach(prod => {
            const item = document.createElement("div");
            item.innerHTML = `
                <label style="font-weight:normal; font-size:13px; display:flex; align-items:center; gap:5px; margin-bottom:4px;">
                    <input type="checkbox" name="ingredientesSeleccionados" value="${prod.nombre}">
                    ${prod.nombre} ${prod.congelador ? '(❄️)' : '(🏠)'}
                </label>
            `;
            box.appendChild(item);
        });
    }
    document.getElementById("dishModal").classList.add("active");
}

function cerrarModal() {
    document.getElementById("dishModal").classList.remove("active");
}

function guardarPlato() {
    const dia = document.getElementById("modalDia").value;
    const momento = document.getElementById("modalMomento").value;
    const nombrePlato = document.getElementById("dishName").value.trim();
    const semanaActiva = document.getElementById("currentMonth").value;

    if(!nombrePlato) return alert("Por favor, introduce el nombre del plato.");

    const checks = document.querySelectorAll('input[name="ingredientesSeleccionados"]:checked');
    const ingredientes = Array.from(checks).map(c => c.value);

    if(ingredientes.length === 0) return alert("Debes seleccionar al menos un ingrediente disponible.");

    const clave = `${dia}-${momento}`;
    if(!appData.planificacion[semanaActiva][clave]) appData.planificacion[semanaActiva][clave] = [];

    appData.planificacion[semanaActiva][clave].push({ nombre: nombrePlato, ingredientes });
    
    sincronizar();
    renderPlanificador();
    cerrarModal();
}

function eliminarPlato(semana, clave, index) {
    appData.planificacion[semana][clave].splice(index, 1);
    sincronizar();
    renderPlanificador();
}

function exportarJSON() {
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify(appData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'planificador_comidas_db.json');
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarJSON() {
    const inputUploader = document.createElement('input');
    inputUploader.type = 'file';
    inputUploader.accept = '.json';
    
    inputUploader.onchange = event => {
        const archivo = event.target.files[0]; // SELECCIÓN DEL PRIMER ARCHIVO CORREGIDA
        if (!archivo) return;
        
        const lector = new FileReader();
        lector.readAsText(archivo, 'UTF-8');
        
        lector.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                
                if (parsed.productos && parsed.planificacion) {
                    appData = parsed;
                    sincronizar();
                    renderProductos();
                    renderPlanificador();
                    alert("Base de datos JSON cargada correctamente.");
                } else {
                    alert("Estructura de JSON inválida.");
                }
            } catch (err) {
                alert("Error leyendo el JSON.");
            }
        };
    };
    
    inputUploader.click();
}
