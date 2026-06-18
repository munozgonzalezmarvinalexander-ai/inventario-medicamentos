/* ============================================================
   Inventario de Medicamentos - frontend
   ============================================================ */

const API = {
    inventario:      "/api/inventario",
    dashboard:       "/api/dashboard",
    entradas:        "/api/entradas",
    salidas:         "/api/salidas",
    reportePorMes:   "/api/reportes/por-mes",
    reporteTop:      "/api/reportes/top-entregados",
    exportar:        "/api/exportar",
    exportarReporte: "/api/exportar/reporte",
};

let inventarioCache = [];

// ============================================================
// HELPERS
// ============================================================

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function toast(mensaje, tipo = "success") {
    const el = $("#toast");
    el.textContent = mensaje;
    el.className = "toast show " + tipo;
    setTimeout(() => el.classList.remove("show"), 3200);
}

function confirmar(titulo, mensaje) {
    return new Promise((resolve) => {
        const backdrop = $("#modal-backdrop");
        $("#modal-titulo").textContent = titulo;
        $("#modal-mensaje").textContent = mensaje;
        backdrop.classList.add("show");

        const close = (resultado) => {
            backdrop.classList.remove("show");
            $("#modal-confirmar").removeEventListener("click", onConfirm);
            $("#modal-cancelar").removeEventListener("click", onCancel);
            resolve(resultado);
        };
        const onConfirm = () => close(true);
        const onCancel = () => close(false);

        $("#modal-confirmar").addEventListener("click", onConfirm);
        $("#modal-cancelar").addEventListener("click", onCancel);
    });
}

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error " + res.status);
    return await res.json();
}

async function apiPost(url, data) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return await res.json();
}

async function apiDelete(url) {
    const res = await fetch(url, { method: "DELETE" });
    return await res.json();
}

function fechaHoyISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ============================================================
// NAVEGACIÓN DE TABS
// ============================================================

$$(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        $$(".nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".tab-content").forEach(t => t.classList.remove("active"));
        $("#tab-" + tab).classList.add("active");

        // Recargar datos al cambiar de tab
        if (tab === "dashboard") cargarDashboard();
        if (tab === "inventario") cargarInventario();
        if (tab === "entrada") { cargarInventario(false); cargarHistorialEntradas(); }
        if (tab === "entrega")  { cargarSelectMedicamentos(); cargarHistorialSalidas(); }
        if (tab === "reportes") cargarReportes();
    });
});

// ============================================================
// DASHBOARD
// ============================================================

async function cargarDashboard() {
    try {
        const data = await apiGet(API.dashboard);

        $("#stat-medicamentos").textContent = data.total_medicamentos;
        $("#stat-unidades").textContent     = data.unidades_totales;
        $("#stat-bajo").textContent         = data.bajo_stock;
        $("#stat-agotados").textContent     = data.agotados;
        $("#stat-entradas-mes").textContent = data.entradas_mes;
        $("#stat-salidas-mes").textContent  = data.salidas_mes;

        // Top entregados
        const topEl = $("#top-entregados");
        if (data.top_entregados.length === 0) {
            topEl.innerHTML = '<div class="empty">Sin entregas registradas todavía.</div>';
        } else {
            topEl.innerHTML = data.top_entregados.map(t => `
                <div class="list-item">
                    <div>
                        <div class="list-item-main">${escapeHtml(t.nombre)}</div>
                    </div>
                    <div class="list-item-value">${t.total} u.</div>
                </div>
            `).join("");
        }

        // Alertas
        const alEl = $("#alertas-stock");
        if (data.alertas.length === 0) {
            alEl.innerHTML = '<div class="empty">Todo en orden. Sin alertas.</div>';
        } else {
            alEl.innerHTML = data.alertas.map(a => {
                const clase = a.cantidad <= 0 ? "danger" : "warning";
                return `
                <div class="list-item ${clase}">
                    <div>
                        <div class="list-item-main">${escapeHtml(a.nombre)}</div>
                        <div class="list-item-sub">Umbral: ${a.stock_minimo > 0 ? a.stock_minimo : '—'}</div>
                    </div>
                    <div class="list-item-value">${a.cantidad} u.</div>
                </div>`;
            }).join("");
        }
    } catch (e) {
        toast("Error al cargar el dashboard", "error");
        console.error(e);
    }
}

// ============================================================
// INVENTARIO
// ============================================================

async function cargarInventario(renderizar = true) {
    try {
        const data = await apiGet(API.inventario);
        inventarioCache = data.inventario;

        // Actualizar datalist (autocompletar en formulario de entrada)
        const dl = $("#lista-medicamentos");
        if (dl) {
            dl.innerHTML = inventarioCache.map(i =>
                `<option value="${escapeHtml(i.nombre)}">`).join("");
        }

        if (renderizar) renderTablaInventario(inventarioCache);
    } catch (e) {
        toast("Error al cargar el inventario", "error");
        console.error(e);
    }
}

function renderTablaInventario(items) {
    const tbody = $("#tabla-inventario");
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No hay medicamentos registrados. Agrega uno desde la sección "Agregar entrada".</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(it => {
        let claseFila = "";
        let badge = '<span class="badge badge-ok">OK</span>';
        if (it.cantidad <= 0) {
            claseFila = "danger";
            badge = '<span class="badge badge-danger">Agotado</span>';
        } else if (it.bajo_stock) {
            claseFila = "warning";
            badge = '<span class="badge badge-warn">Bajo stock</span>';
        }
        return `
            <tr class="${claseFila}">
                <td><strong>${escapeHtml(it.nombre)}</strong></td>
                <td><strong>${it.cantidad}</strong></td>
                <td>${it.stock_minimo > 0 ? it.stock_minimo : '—'}</td>
                <td>${badge}</td>
                <td>${escapeHtml(it.ultima_actualizacion)}</td>
                <td>${escapeHtml(it.observaciones)}</td>
                <td>
                    <button class="btn-icon" title="Eliminar"
                            data-nombre="${escapeHtml(it.nombre)}"
                            onclick="eliminarMedicamento('${escapeHtml(it.nombre).replace(/'/g, "\\'")}')">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

async function eliminarMedicamento(nombre) {
    const ok = await confirmar(
        "Eliminar medicamento",
        `¿Eliminar "${nombre}" del inventario? El historial de entradas y salidas se conservará.`
    );
    if (!ok) return;

    const r = await apiDelete(`/api/inventario/${encodeURIComponent(nombre)}`);
    if (r.ok) {
        toast("Medicamento eliminado", "success");
        cargarInventario();
    } else {
        toast(r.error || "No se pudo eliminar", "error");
    }
}

// Búsqueda en inventario
$("#buscar-inv")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtrado = inventarioCache.filter(i =>
        i.nombre.toLowerCase().includes(q) ||
        (i.observaciones || "").toLowerCase().includes(q)
    );
    renderTablaInventario(filtrado);
});

$("#btn-refrescar-inv")?.addEventListener("click", () => cargarInventario());
$("#btn-refrescar-dash")?.addEventListener("click", () => cargarDashboard());

// ============================================================
// FORMULARIO DE ENTRADA
// ============================================================

$("#form-entrada").addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = {
        nombre:        $("#ent-nombre").value.trim(),
        cantidad:      $("#ent-cantidad").value,
        stock_minimo:  $("#ent-stock-min").value || 0,
        fecha:         $("#ent-fecha").value,
        observaciones: $("#ent-obs").value.trim(),
    };

    if (!datos.nombre || !datos.cantidad) {
        toast("Completa nombre y cantidad", "error");
        return;
    }

    const r = await apiPost(API.entradas, datos);
    if (r.ok) {
        toast(r.mensaje || "Entrada registrada", "success");
        $("#form-entrada").reset();
        cargarInventario(false);
        cargarHistorialEntradas();
    } else {
        toast(r.error || "Error al registrar", "error");
    }
});

async function cargarHistorialEntradas() {
    try {
        const data = await apiGet(API.entradas);
        const el = $("#historial-entradas");
        if (data.entradas.length === 0) {
            el.innerHTML = '<div class="empty">Sin entradas registradas.</div>';
            return;
        }
        el.innerHTML = data.entradas.slice(0, 10).map(e => `
            <div class="list-item">
                <div>
                    <div class="list-item-main">${escapeHtml(e.medicamento)}</div>
                    <div class="list-item-sub">${escapeHtml(e.fecha)} ${e.observaciones ? '· ' + escapeHtml(e.observaciones) : ''}</div>
                </div>
                <div class="list-item-value">+${e.cantidad}</div>
            </div>
        `).join("");
    } catch (err) { console.error(err); }
}

// ============================================================
// FORMULARIO DE SALIDA (entrega)
// ============================================================

async function cargarSelectMedicamentos() {
    await cargarInventario(false);
    const sel = $("#sal-nombre");
    sel.innerHTML = '<option value="">— Selecciona —</option>' +
        inventarioCache
            .filter(i => i.cantidad > 0)
            .map(i => `<option value="${escapeHtml(i.nombre)}" data-stock="${i.cantidad}">${escapeHtml(i.nombre)} (stock: ${i.cantidad})</option>`)
            .join("");
}

$("#sal-nombre").addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    const stock = opt?.dataset?.stock;
    const disp = $("#sal-stock-disp");
    if (stock) {
        disp.textContent = `Stock disponible: ${stock} unidades`;
        disp.classList.toggle("danger", parseInt(stock) <= 5);
    } else {
        disp.textContent = "";
    }
});

$("#form-salida").addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = {
        nombre:        $("#sal-nombre").value,
        cantidad:      parseInt($("#sal-cantidad").value || "0"),
        recibido_por:  $("#sal-recibido").value.trim(),
        fecha:         $("#sal-fecha").value,
        observaciones: $("#sal-obs").value.trim(),
    };

    if (!datos.nombre) { toast("Selecciona un medicamento", "error"); return; }
    if (!datos.cantidad || datos.cantidad <= 0) { toast("Cantidad inválida", "error"); return; }
    if (!datos.recibido_por) { toast("Indica quién recibe", "error"); return; }

    // Confirmación antes de descontar
    const ok = await confirmar(
        "Confirmar entrega",
        `Vas a descontar ${datos.cantidad} unidad(es) de "${datos.nombre}" del inventario. Esta acción se registrará a nombre de ${datos.recibido_por}. ¿Continuar?`
    );
    if (!ok) return;

    const r = await apiPost(API.salidas, datos);
    if (r.ok) {
        toast(r.mensaje || "Entrega registrada", "success");
        $("#form-salida").reset();
        $("#sal-stock-disp").textContent = "";
        cargarSelectMedicamentos();
        cargarHistorialSalidas();
    } else {
        toast(r.error || "Error al registrar", "error");
    }
});

async function cargarHistorialSalidas() {
    try {
        const data = await apiGet(API.salidas);
        const el = $("#historial-salidas");
        if (data.salidas.length === 0) {
            el.innerHTML = '<div class="empty">Sin entregas registradas.</div>';
            return;
        }
        el.innerHTML = data.salidas.slice(0, 10).map(s => `
            <div class="list-item">
                <div>
                    <div class="list-item-main">${escapeHtml(s.medicamento)} → ${escapeHtml(s.recibido_por)}</div>
                    <div class="list-item-sub">${escapeHtml(s.fecha)} ${s.observaciones ? '· ' + escapeHtml(s.observaciones) : ''}</div>
                </div>
                <div class="list-item-value">−${s.cantidad}</div>
            </div>
        `).join("");
    } catch (err) { console.error(err); }
}

// ============================================================
// REPORTES
// ============================================================

async function cargarReportes() {
    await cargarReportePorMes();
    await cargarReporteTop();
    await cargarHistorialFiltrado();
}

async function cargarReportePorMes() {
    const desde = $("#rep-desde").value;
    const hasta = $("#rep-hasta").value;
    let url = API.reportePorMes;
    const params = [];
    if (desde) params.push("desde=" + encodeURIComponent(desde));
    if (hasta) params.push("hasta=" + encodeURIComponent(hasta));
    if (params.length) url += "?" + params.join("&");

    const data = await apiGet(url);
    const el = $("#reporte-por-mes");
    if (!data.por_mes.length) {
        el.innerHTML = '<div class="empty">Sin datos.</div>';
        return;
    }

    const maxTotal = Math.max(...data.por_mes.map(d => d.total));
    el.innerHTML = data.por_mes.map(d => {
        const ancho = Math.round((d.total / maxTotal) * 100);
        return `
            <div class="list-item">
                <div style="flex:1;">
                    <div class="list-item-main">${escapeHtml(d.mes)}</div>
                    <div style="height:6px; background: var(--slate-100); border-radius:3px; margin-top:6px; overflow:hidden;">
                        <div style="width:${ancho}%; height:100%; background: var(--teal-600); border-radius:3px;"></div>
                    </div>
                </div>
                <div class="list-item-value" style="margin-left: 16px;">${d.total} u.</div>
            </div>
        `;
    }).join("");
}

async function cargarReporteTop() {
    const desde = $("#rep-desde").value;
    const hasta = $("#rep-hasta").value;
    let url = API.reporteTop;
    const params = [];
    if (desde) params.push("desde=" + encodeURIComponent(desde));
    if (hasta) params.push("hasta=" + encodeURIComponent(hasta));
    if (params.length) url += "?" + params.join("&");

    const data = await apiGet(url);
    const el = $("#reporte-top");
    if (!data.top.length) {
        el.innerHTML = '<div class="empty">Sin datos.</div>';
        return;
    }
    el.innerHTML = data.top.slice(0, 10).map((t, i) => `
        <div class="list-item">
            <div>
                <div class="list-item-main">${i + 1}. ${escapeHtml(t.nombre)}</div>
            </div>
            <div class="list-item-value">${t.total} u.</div>
        </div>
    `).join("");
}

async function cargarHistorialFiltrado() {
    const desde = $("#rep-desde").value;
    const hasta = $("#rep-hasta").value;
    const med   = $("#rep-med").value.trim();

    let url = API.salidas;
    const params = [];
    if (desde) params.push("desde=" + encodeURIComponent(desde));
    if (hasta) params.push("hasta=" + encodeURIComponent(hasta));
    if (med)   params.push("medicamento=" + encodeURIComponent(med));
    if (params.length) url += "?" + params.join("&");

    const data = await apiGet(url);
    const tbody = $("#tabla-reporte");
    if (!data.salidas.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Sin resultados.</td></tr>';
        return;
    }
    tbody.innerHTML = data.salidas.map(s => `
        <tr>
            <td>${escapeHtml(s.fecha)}</td>
            <td><strong>${escapeHtml(s.medicamento)}</strong></td>
            <td>${s.cantidad}</td>
            <td>${escapeHtml(s.recibido_por)}</td>
            <td>${escapeHtml(s.observaciones)}</td>
        </tr>
    `).join("");
}

$("#btn-aplicar-filtros").addEventListener("click", cargarReportes);

$("#btn-limpiar-filtros").addEventListener("click", () => {
    $("#rep-desde").value = "";
    $("#rep-hasta").value = "";
    $("#rep-med").value = "";
    cargarReportes();
});

$("#btn-exportar-rep").addEventListener("click", () => {
    const desde = $("#rep-desde").value;
    const hasta = $("#rep-hasta").value;
    const med   = $("#rep-med").value.trim();
    const params = [];
    if (desde) params.push("desde=" + encodeURIComponent(desde));
    if (hasta) params.push("hasta=" + encodeURIComponent(hasta));
    if (med)   params.push("medicamento=" + encodeURIComponent(med));
    const url = API.exportarReporte + (params.length ? "?" + params.join("&") : "");
    window.location.href = url;
});

$("#btn-exportar-todo").addEventListener("click", () => {
    window.location.href = API.exportar;
});

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Fecha de hoy por defecto en los formularios
    $("#ent-fecha").value = fechaHoyISO();
    $("#sal-fecha").value = fechaHoyISO();

    // Cargar dashboard al abrir la app
    cargarDashboard();
});
