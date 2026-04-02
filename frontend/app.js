const API = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:8787"
  : "https://frases-backend.diegoaporterol.workers.dev";

// --- Estado ---
let frases = [];
let editandoId = null;

// --- Elementos ---
const lista = document.getElementById("lista");
const buscador = document.getElementById("buscador");
const filtroEtiqueta = document.getElementById("filtro-etiqueta");
const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modal-titulo");
const inputTexto = document.getElementById("input-texto");
const inputEtiquetas = document.getElementById("input-etiquetas");
const btnNueva = document.getElementById("btn-nueva");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");
const toast = document.getElementById("toast");

// --- API ---
async function cargarFrases() {
  const q = buscador.value.trim();
  const etiqueta = filtroEtiqueta.value.trim();
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (etiqueta) params.set("etiqueta", etiqueta);

  const res = await fetch(`${API}/frases?${params}`);
  frases = await res.json();
  renderizar();
}

async function crearFrase(texto, etiquetas) {
  const res = await fetch(`${API}/frases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, etiquetas: etiquetas || null }),
  });
  if (!res.ok) throw new Error("Error al crear");
  return res.json();
}

async function actualizarFrase(id, texto, etiquetas) {
  const res = await fetch(`${API}/frases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, etiquetas: etiquetas || null }),
  });
  if (!res.ok) throw new Error("Error al actualizar");
  return res.json();
}

async function eliminarFrase(id) {
  const res = await fetch(`${API}/frases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}

// --- Render ---
function renderizar() {
  if (frases.length === 0) {
    lista.innerHTML = `<p class="empty">No hay frases guardadas.</p>`;
    return;
  }

  lista.innerHTML = frases.map((f) => {
    const etiquetas = f.etiquetas
      ? f.etiquetas.split(",").map((e) => `<span class="etiqueta">${e.trim()}</span>`).join("")
      : "";
    return `
      <div class="frase-card" data-id="${f.id}">
        <div class="frase-body">
          <p class="frase-texto">${escapeHtml(f.texto)}</p>
          ${etiquetas ? `<div class="frase-etiquetas">${etiquetas}</div>` : ""}
        </div>
        <div class="frase-actions">
          <button class="btn-icon edit" title="Editar" onclick="abrirEdicion(${f.id})">✏️</button>
          <button class="btn-icon delete" title="Eliminar" onclick="confirmarEliminar(${f.id})">🗑️</button>
        </div>
      </div>`;
  }).join("");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- Modal ---
function abrirModal(titulo, texto = "", etiquetas = "") {
  modalTitulo.textContent = titulo;
  inputTexto.value = texto;
  inputEtiquetas.value = etiquetas;
  modal.classList.remove("hidden");
  inputTexto.focus();
}

function cerrarModal() {
  modal.classList.add("hidden");
  editandoId = null;
}

function abrirEdicion(id) {
  const frase = frases.find((f) => f.id === id);
  if (!frase) return;
  editandoId = id;
  abrirModal("Editar frase", frase.texto, frase.etiquetas || "");
}

// --- Acciones ---
async function confirmarEliminar(id) {
  if (!confirm("¿Eliminar esta frase?")) return;
  try {
    await eliminarFrase(id);
    mostrarToast("Frase eliminada");
    cargarFrases();
  } catch {
    mostrarToast("Error al eliminar");
  }
}

async function guardar() {
  const texto = inputTexto.value.trim();
  const etiquetas = inputEtiquetas.value.trim();
  if (!texto) { inputTexto.focus(); return; }

  try {
    if (editandoId) {
      await actualizarFrase(editandoId, texto, etiquetas);
      mostrarToast("Frase actualizada");
    } else {
      await crearFrase(texto, etiquetas);
      mostrarToast("Frase guardada");
    }
    cerrarModal();
    cargarFrases();
  } catch {
    mostrarToast("Error al guardar");
  }
}

// --- Toast ---
let toastTimer;
function mostrarToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// --- Eventos ---
btnNueva.addEventListener("click", () => {
  editandoId = null;
  abrirModal("Nueva frase");
});
btnCancelar.addEventListener("click", cerrarModal);
btnGuardar.addEventListener("click", guardar);

modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });

inputTexto.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) guardar();
});

let debounceTimer;
function buscarConDebounce() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(cargarFrases, 300);
}
buscador.addEventListener("input", buscarConDebounce);
filtroEtiqueta.addEventListener("input", buscarConDebounce);

// --- Init ---
cargarFrases();
