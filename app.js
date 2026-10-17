/**
 * NOGA ROMA - LOGICA INTERFACCIA GESTIONALE PRIVATO B2B
 * Comunicazione con backend Python SQLite (main.py) con fallback locale
 */

// Stato Applicazione
const state = {
  contatti: [],
  statistiche: {
    totali: 0,
    chiamati: 0,
    interessati: 0,
    rifiutati: 0,
    da_contattare: 0,
    tasso_conversione: 0.0,
    percentuale_completamento: 0.0
  },
  activeTab: "tab-coda",
  searchQuery: "",
  filterEsito: "",
  selectedContact: null,
  isApiAvailable: true
};

// Configurazione Endpoint API
const API_BASE = window.location.origin.startsWith("http") ? "" : "http://localhost:8080";

// Inizializzazione al caricamento del DOM
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupEventListeners();
  loadData();
});

// ==============================================================================
// 1. CARICAMENTO DATI E API
// ==============================================================================

async function loadData() {
  await Promise.all([caricaStatistiche(), caricaContatti()]);
}

async function caricaStatistiche() {
  try {
    const res = await fetch(`${API_BASE}/api/statistiche`);
    if (!res.ok) throw new Error("Errore API statistiche");
    const json = await res.json();
    if (json.ok && json.data) {
      state.statistiche = json.data;
      state.isApiAvailable = true;
      aggiornaBadgeStatoDb(true);
    }
  } catch (err) {
    console.warn("[NOGA CRM] Backend API non rilevato, calcolo statistiche locali:", err);
    state.isApiAvailable = false;
    calcolaStatisticheLocali();
    aggiornaBadgeStatoDb(false);
  }
  renderKpis();
  renderAnalytics();
}

async function caricaContatti() {
  try {
    const res = await fetch(`${API_BASE}/api/contatti`);
    if (!res.ok) throw new Error("Errore API contatti");
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.contatti = json.data;
    }
  } catch (err) {
    console.warn("[NOGA CRM] Usando archivio locale (modalità offline):", err);
    if (!state.contatti || state.contatti.length === 0) {
      caricaDatiDefaultLocali();
    }
  }
  renderTables();
}

function aggiornaBadgeStatoDb(attivo) {
  const el = document.getElementById("dbStatusIndicator");
  if (!el) return;
  if (attivo) {
    el.innerHTML = '<span class="status-dot"></span> SQLite Attivo (crm_ingrosso.db)';
    el.style.color = "#A3D9A5";
  } else {
    el.innerHTML = '<span class="status-dot" style="background:#FF9800; box-shadow:none;"></span> Modalità Locale / Demo';
    el.style.color = "#FFD580";
  }
}

// Fallback per test immediato in caso il server non fosse ancora avviato
function caricaDatiDefaultLocali() {
  const salvati = localStorage.getItem("noga_crm_demo_contatti");
  if (salvati) {
    try {
      state.contatti = JSON.parse(salvati);
      calcolaStatisticheLocali();
      return;
    } catch (e) {
      // Ignora e usa default sotto
    }
  }

  state.contatti = [
    {
      id: 1,
      azienda: "Calzature Elegance Srl",
      telefono: "0298765431",
      citta: "Milano",
      note: "Catena con 3 negozi in centro, interessati a forniture di scarpe eleganti in pelle",
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: "2026-10-17 11:30"
    },
    {
      id: 2,
      azienda: "Boutique del Piede di Marco Neri",
      telefono: "0655443322",
      citta: "Roma",
      note: "Negozio storico, cercano stock di scarpe sportive e sneakers per primavera",
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: "2026-10-17 11:30"
    },
    {
      id: 3,
      azienda: "Outlet Scarpa Facile",
      telefono: "0511122334",
      citta: "Bologna",
      note: "Grandi volumi di vendita, chiedono listino prezzi all'ingrosso per ordini superiori a 100 paia",
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: "2026-10-17 11:30"
    },
    {
      id: 4,
      azienda: "Tendenza Calzature",
      telefono: "0819988776",
      citta: "Napoli",
      note: "Punto vendita al dettaglio, interessati a calzature estive e sandali",
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: "2026-10-17 11:30"
    },
    {
      id: 5,
      azienda: "Sport & Style Store",
      telefono: "0113344556",
      citta: "Torino",
      note: "Specializzati in scarpe running e ginnastica",
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: "2026-10-17 11:30"
    }
  ];
  salvaStorageLocale();
  calcolaStatisticheLocali();
}

function salvaStorageLocale() {
  localStorage.setItem("noga_crm_demo_contatti", JSON.stringify(state.contatti));
}

function calcolaStatisticheLocali() {
  const totali = state.contatti.length;
  const chiamati = state.contatti.filter(c => c.chiamato === "Sì").length;
  const interessati = state.contatti.filter(c => c.esito === "Interessato (Ordine preso)").length;
  const rifiutati = state.contatti.filter(c => c.esito === "Non interessato (Rifiutato)").length;
  const da_contattare = state.contatti.filter(c => c.chiamato === "No" || c.esito === "Da richiamare").length;

  const tasso_conversione = chiamati > 0 ? Number(((interessati / chiamati) * 100).toFixed(1)) : 0.0;
  const percentuale_completamento = totali > 0 ? Number(((chiamati / totali) * 100).toFixed(1)) : 0.0;

  state.statistiche = {
    totali,
    chiamati,
    interessati,
    rifiutati,
    da_contattare,
    tasso_conversione,
    percentuale_completamento
  };
}

// ==============================================================================
// 2. RENDERING INTERFACCIA
// ==============================================================================

function renderKpis() {
  const s = state.statistiche;
  document.getElementById("kpiTotali").textContent = s.totali;
  document.getElementById("kpiDaChiamare").textContent = s.da_contattare;
  document.getElementById("kpiChiamati").textContent = s.chiamati;
  document.getElementById("kpiInteressati").textContent = s.interessati;
  document.getElementById("kpiTasso").textContent = s.tasso_conversione.toFixed(1);

  document.getElementById("badgeCodaCount").textContent = s.da_contattare;
  document.getElementById("badgeTotaleCount").textContent = s.totali;
  document.getElementById("codaSummaryBadge").textContent = `${s.da_contattare} CONTATTI DA SMALTIRE`;
}

function renderTables() {
  renderCodaTable();
  renderAnagraficaTable();
}

// Filtra i contatti in base a ricerca testuale e selezione esito
function getFilteredContacts(soloDaChiamare = false) {
  return state.contatti.filter(c => {
    if (soloDaChiamare) {
      const condCoda = c.chiamato === "No" || c.esito === "Da richiamare";
      if (!condCoda) return false;
    }

    if (state.filterEsito && c.esito !== state.filterEsito) {
      return false;
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchAzienda = (c.azienda || "").toLowerCase().includes(q);
      const matchTelefono = (c.telefono || "").toLowerCase().includes(q);
      const matchCitta = (c.citta || "").toLowerCase().includes(q);
      const matchNote = (c.note || "").toLowerCase().includes(q);
      if (!matchAzienda && !matchTelefono && !matchCitta && !matchNote) {
        return false;
      }
    }

    return true;
  });
}

function renderCodaTable() {
  const tbody = document.getElementById("tbodyCoda");
  const emptyState = document.getElementById("emptyCoda");
  const table = document.getElementById("tableCoda");
  const list = getFilteredContacts(true);

  if (list.length === 0) {
    tbody.innerHTML = "";
    table.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  tbody.innerHTML = list.map(c => `
    <tr>
      <td class="mono text-xs" style="color: var(--text-muted);">#${c.id}</td>
      <td class="company-cell">
        <span class="clickable-company" onclick="apriDrawer(${c.id})">${escapeHtml(c.azienda)}</span>
      </td>
      <td>
        <a href="tel:${escapeHtml(c.telefono)}" class="phone-link" title="Chiama numero">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          ${escapeHtml(c.telefono)}
        </a>
      </td>
      <td>${c.citta ? `<span class="city-pill">${escapeHtml(c.citta)}</span>` : '<span style="color:var(--text-muted);">&mdash;</span>'}</td>
      <td>
        <div class="notes-snippet" title="${escapeHtml(c.note || '')}">
          ${escapeHtml(c.note || 'Nessuna nota iniziale')}
        </div>
      </td>
      <td>${creaBadgeEsito(c.esito)}</td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-primary btn-sm" onclick="apriModalEsito(${c.id})">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Registra Chiamata
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAnagraficaTable() {
  const tbody = document.getElementById("tbodyAnagrafica");
  const emptyState = document.getElementById("emptyAnagrafica");
  const table = document.getElementById("tableAnagrafica");
  const counter = document.getElementById("anagraficaCounter");
  const list = getFilteredContacts(false);

  counter.textContent = `Visualizzati: ${list.length} di ${state.contatti.length} contatti`;

  if (list.length === 0) {
    tbody.innerHTML = "";
    table.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  tbody.innerHTML = list.map(c => `
    <tr>
      <td class="mono text-xs" style="color: var(--text-muted);">#${c.id}</td>
      <td class="company-cell">
        <span class="clickable-company" onclick="apriDrawer(${c.id})">${escapeHtml(c.azienda)}</span>
      </td>
      <td>
        <a href="tel:${escapeHtml(c.telefono)}" class="phone-link">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          ${escapeHtml(c.telefono)}
        </a>
      </td>
      <td>${c.citta ? `<span class="city-pill">${escapeHtml(c.citta)}</span>` : '<span style="color:var(--text-muted);">&mdash;</span>'}</td>
      <td style="text-align: center;">
        ${c.chiamato === "Sì" 
          ? '<span class="badge badge-success" style="padding:0.15rem 0.45rem;">SÌ</span>' 
          : '<span class="badge badge-neutral" style="padding:0.15rem 0.45rem;">NO</span>'}
      </td>
      <td>${creaBadgeEsito(c.esito)}</td>
      <td class="timestamp-cell">${escapeHtml(c.data_aggiornamento || '-')}</td>
      <td style="text-align: right;">
        <div class="row-actions">
          <button type="button" class="action-icon-btn" title="Registra Chiamata" onclick="apriModalEsito(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button type="button" class="action-icon-btn" title="Scheda Dettagli" onclick="apriDrawer(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button type="button" class="action-icon-btn danger" title="Elimina Contatto" onclick="richiediEliminazione(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function creaBadgeEsito(esito) {
  if (esito === "Interessato (Ordine preso)") {
    return `<span class="badge badge-success"><span class="badge-dot"></span> Ordine Preso</span>`;
  } else if (esito === "Da richiamare") {
    return `<span class="badge badge-warning"><span class="badge-dot"></span> Da Richiamare</span>`;
  } else if (esito === "Non interessato (Rifiutato)") {
    return `<span class="badge badge-danger"><span class="badge-dot"></span> Rifiutato</span>`;
  } else {
    return `<span class="badge badge-neutral"><span class="badge-dot"></span> In Attesa</span>`;
  }
}

function renderAnalytics() {
  const s = state.statistiche;
  document.getElementById("funnelTotali").textContent = s.totali;
  document.getElementById("funnelChiamati").textContent = s.chiamati;
  document.getElementById("funnelInteressati").textContent = s.interessati;

  const pctChiamati = s.totali > 0 ? (s.chiamati / s.totali) * 100 : 0;
  const pctInteressati = s.totali > 0 ? (s.interessati / s.totali) * 100 : 0;

  document.getElementById("funnelChiamatiBar").style.width = `${pctChiamati}%`;
  document.getElementById("funnelInteressatiBar").style.width = `${pctInteressati}%`;

  document.getElementById("statInteressati").textContent = s.interessati;
  document.getElementById("statDaRichiamare").textContent = state.contatti.filter(c => c.esito === "Da richiamare").length;
  document.getElementById("statRifiutati").textContent = s.rifiutati;
  document.getElementById("statInAttesa").textContent = state.contatti.filter(c => c.esito === "In attesa").length;
}

// ==============================================================================
// 3. NAVIGAZIONE E GESTIONE EVENTI
// ==============================================================================

function setupNavigation() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      state.activeTab = targetId;

      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");
    });
  });
}

function setupEventListeners() {
  // Ricerca veloce
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    clearBtn.style.display = state.searchQuery ? "block" : "none";
    renderTables();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearBtn.style.display = "none";
    searchInput.focus();
    renderTables();
  });

  // Filtro esito dropdown
  document.getElementById("filterEsitoSelect").addEventListener("change", (e) => {
    state.filterEsito = e.target.value;
    renderTables();
  });

  // Aggiorna dati
  document.getElementById("btnRefresh").addEventListener("click", () => {
    loadData();
    showToast("Dati sincronizzati con il database", "success");
  });

  // Ripristina Demo
  document.getElementById("btnRipristinaDemo").addEventListener("click", async () => {
    if (!confirm("Ripristinare i contatti dimostrativi originali? I dati attuali verranno reimpostati con contatti_lead.json.")) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/ripristina-demo`, { method: "POST" });
      if (res.ok) {
        showToast("Lead di test ripristinati con successo", "success");
        await loadData();
        return;
      }
    } catch (e) {
      // Fallback
    }
    caricaDatiDefaultLocali();
    renderKpis();
    renderTables();
    renderAnalytics();
    showToast("Lead di test ripristinati in locale", "success");
  });

  // Modal Nuovo Contatto
  document.getElementById("btnNuovoContatto").addEventListener("click", () => {
    apriModalNuovo();
  });
  document.getElementById("modalNuovoCloseBtn").addEventListener("click", chiudiModalNuovo);
  document.getElementById("btnAnnullaNuovo").addEventListener("click", chiudiModalNuovo);
  document.getElementById("formNuovoContatto").addEventListener("submit", salvaNuovoContatto);

  // Modal Registra Esito
  document.getElementById("modalEsitoCloseBtn").addEventListener("click", chiudiModalEsito);
  document.getElementById("btnAnnullaEsito").addEventListener("click", chiudiModalEsito);
  document.getElementById("formRegistraEsito").addEventListener("submit", salvaEsitoChiamata);

  // Modal Importa JSON
  document.getElementById("btnImportaJson").addEventListener("click", apriModalImport);
  document.getElementById("modalImportCloseBtn").addEventListener("click", chiudiModalImport);
  document.getElementById("btnAnnullaImport").addEventListener("click", chiudiModalImport);

  document.getElementById("btnCaricaFileJson").addEventListener("click", () => {
    document.getElementById("fileInputJson").click();
  });
  document.getElementById("fileInputJson").addEventListener("change", gestisciUploadFileJson);

  document.getElementById("btnImportaDefaultFile").addEventListener("click", importaFileDefault);
  document.getElementById("btnEseguiImportTesto").addEventListener("click", importaTestoJson);

  // Esporta JSON
  document.getElementById("btnEsportaJson").addEventListener("click", esportaFileJson);

  // Drawer Scheda Lead
  document.getElementById("drawerCloseBtn").addEventListener("click", chiudiDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", chiudiDrawer);

  document.getElementById("drawerBtnRegistraChiamata").addEventListener("click", () => {
    if (state.selectedContact) {
      chiudiDrawer();
      apriModalEsito(state.selectedContact.id);
    }
  });

  document.getElementById("drawerBtnElimina").addEventListener("click", () => {
    if (state.selectedContact) {
      richiediEliminazione(state.selectedContact.id);
    }
  });

  // Scorciatoie da tastiera (Escape per chiudere, / per cercare)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      chiudiModalNuovo();
      chiudiModalEsito();
      chiudiModalImport();
      chiudiDrawer();
    } else if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      document.getElementById("searchInput").focus();
    }
  });
}

// ==============================================================================
// 4. LOGICA MODAL & OPERAZIONI CRUD
// ==============================================================================

// --- MODAL NUOVO CONTATTO ---
function apriModalNuovo() {
  document.getElementById("formNuovoContatto").reset();
  document.getElementById("modalNuovoBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("inputAzienda").focus(), 50);
}

function chiudiModalNuovo() {
  document.getElementById("modalNuovoBackdrop").classList.remove("open");
}

async function salvaNuovoContatto(e) {
  e.preventDefault();
  const azienda = document.getElementById("inputAzienda").value.trim();
  const telefono = document.getElementById("inputTelefono").value.trim();
  const citta = document.getElementById("inputCitta").value.trim();
  const note = document.getElementById("inputNote").value.trim();

  if (!azienda || !telefono) {
    showToast("Azienda e Telefono sono campi obbligatori", "error");
    return;
  }

  // Verifica duplicato locale preventiva
  const esiste = state.contatti.some(c => c.telefono === telefono);
  if (esiste) {
    showToast(`Il numero '${telefono}' è già presente nel database`, "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/contatti`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ azienda, telefono, citta, note })
    });

    const json = await res.json();
    if (json.ok) {
      showToast("Buyer registrato con successo nel database", "success");
      chiudiModalNuovo();
      await loadData();
      return;
    } else {
      showToast(json.errore || "Errore durante il salvataggio", "error");
      return;
    }
  } catch (err) {
    // Salvataggio locale se server non disponibile
    const nuovoId = state.contatti.length > 0 ? Math.max(...state.contatti.map(c => c.id)) + 1 : 1;
    const ora = new Date().toISOString().slice(0, 16).replace("T", " ");
    const nuovo = {
      id: nuovoId,
      azienda,
      telefono,
      citta,
      note,
      chiamato: "No",
      esito: "In attesa",
      data_aggiornamento: ora
    };
    state.contatti.unshift(nuovo);
    salvaStorageLocale();
    calcolaStatisticheLocali();
    renderKpis();
    renderTables();
    renderAnalytics();
    chiudiModalNuovo();
    showToast("Buyer inserito nell'archivio locale", "success");
  }
}

// --- MODAL REGISTRA ESITO CHIAMATA ---
function apriModalEsito(idContatto) {
  const contatto = state.contatti.find(c => c.id === idContatto);
  if (!contatto) return;

  state.selectedContact = contatto;
  document.getElementById("esitoIdContatto").value = contatto.id;
  document.getElementById("modalEsitoAziendaTitle").textContent = contatto.azienda;
  document.getElementById("modalEsitoTelefono").textContent = contatto.telefono;
  document.getElementById("modalEsitoCitta").textContent = contatto.citta || "Non indicata";
  
  document.getElementById("selectChiamato").value = contatto.chiamato === "Sì" ? "Sì" : "Sì";
  document.getElementById("selectEsito").value = contatto.esito || "In attesa";
  document.getElementById("textareaNuoveNote").value = "";
  
  const storico = contatto.note ? contatto.note : "Nessuna nota precedente.";
  document.getElementById("modalEsitoStoricoNote").textContent = storico;

  document.getElementById("modalEsitoBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("textareaNuoveNote").focus(), 50);
}

function chiudiModalEsito() {
  document.getElementById("modalEsitoBackdrop").classList.remove("open");
}

async function salvaEsitoChiamata(e) {
  e.preventDefault();
  const idContatto = parseInt(document.getElementById("esitoIdContatto").value);
  const chiamato = document.getElementById("selectChiamato").value;
  const esito = document.getElementById("selectEsito").value;
  const nuoveNote = document.getElementById("textareaNuoveNote").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}/chiamata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chiamato, esito, note: nuoveNote })
    });
    const json = await res.json();
    if (json.ok) {
      showToast("Esito telefonata salvato con successo", "success");
      chiudiModalEsito();
      await loadData();
      return;
    }
  } catch (err) {
    // Fallback locale
    const contatto = state.contatti.find(c => c.id === idContatto);
    if (contatto) {
      contatto.chiamato = chiamato;
      contatto.esito = esito;
      const ora = new Date().toISOString().slice(0, 16).replace("T", " ");
      contatto.data_aggiornamento = ora;
      if (nuoveNote) {
        contatto.note = contatto.note ? `${contatto.note} | ${nuoveNote}` : nuoveNote;
      }
      salvaStorageLocale();
      calcolaStatisticheLocali();
      renderKpis();
      renderTables();
      renderAnalytics();
      chiudiModalEsito();
      showToast("Esito telefonata aggiornato in locale", "success");
    }
  }
}

// --- ELIMINAZIONE CONTATTO ---
async function richiediEliminazione(idContatto) {
  const contatto = state.contatti.find(c => c.id === idContatto);
  if (!contatto) return;

  if (!confirm(`Sei sicuro di voler eliminare definitivamente '${contatto.azienda}'?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      showToast("Contatto rimosso dal database", "success");
      chiudiDrawer();
      await loadData();
      return;
    }
  } catch (err) {
    // Fallback locale
    state.contatti = state.contatti.filter(c => c.id !== idContatto);
    salvaStorageLocale();
    calcolaStatisticheLocali();
    renderKpis();
    renderTables();
    renderAnalytics();
    chiudiDrawer();
    showToast("Contatto rimosso dall'archivio locale", "success");
  }
}

// --- SLIDE-OVER DRAWER ---
function apriDrawer(idContatto) {
  const c = state.contatti.find(item => item.id === idContatto);
  if (!c) return;
  state.selectedContact = c;

  document.getElementById("drawerAzienda").textContent = c.azienda;
  document.getElementById("drawerId").textContent = `#${c.id}`;
  document.getElementById("drawerTelefono").textContent = c.telefono;
  document.getElementById("drawerCitta").textContent = c.citta || "Non specificata";
  document.getElementById("drawerChiamato").textContent = c.chiamato;
  document.getElementById("drawerEsito").innerHTML = creaBadgeEsito(c.esito);
  document.getElementById("drawerData").textContent = c.data_aggiornamento || "Nessun contatto recente";
  document.getElementById("drawerLinkChiama").href = `tel:${c.telefono}`;

  // Formatta storico note
  const notesContainer = document.getElementById("drawerNotesTimeline");
  if (!c.note) {
    notesContainer.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted);">Nessuna nota registrata.</div>';
  } else {
    const partiNote = c.note.split("|");
    notesContainer.innerHTML = partiNote.map((nota, idx) => `
      <div class="timeline-note-item">
        <span class="timeline-note-tag">Annotazione #${idx + 1}</span>
        ${escapeHtml(nota.trim())}
      </div>
    `).join("");
  }

  document.getElementById("drawerBackdrop").classList.add("open");
  document.getElementById("detailDrawer").classList.add("open");
}

function chiudiDrawer() {
  document.getElementById("drawerBackdrop").classList.remove("open");
  document.getElementById("detailDrawer").classList.remove("open");
}

// --- IMPORTAZIONE ED ESPORTAZIONE JSON ---
function apriModalImport() {
  document.getElementById("textareaJsonRaw").value = "";
  const feedback = document.getElementById("importFeedbackBox");
  feedback.style.display = "none";
  feedback.className = "import-feedback-box";
  document.getElementById("modalImportBackdrop").classList.add("open");
}

function chiudiModalImport() {
  document.getElementById("modalImportBackdrop").classList.remove("open");
}

function gestisciUploadFileJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const dati = JSON.parse(event.target.result);
      if (!Array.isArray(dati)) {
        showToast("Il file deve contenere un array JSON racchiuso da [ ]", "error");
        return;
      }
      document.getElementById("textareaJsonRaw").value = JSON.stringify(dati, null, 2);
      showToast(`File caricato: ${dati.length} contatti trovati`, "success");
    } catch (err) {
      showToast("Errore di sintassi JSON nel file selezionato", "error");
    }
  };
  reader.readAsText(file);
}

async function importaFileDefault() {
  try {
    const res = await fetch(`${API_BASE}/api/importa-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percorso_file: "contatti_lead.json" })
    });
    const json = await res.json();
    if (json.ok) {
      mostraFeedbackImport(json);
      await loadData();
    } else {
      showToast(json.errore || "Errore importazione file default", "error");
    }
  } catch (err) {
    showToast("Impossibile contattare il server per il file default", "error");
  }
}

async function importaTestoJson() {
  const testo = document.getElementById("textareaJsonRaw").value.trim();
  if (!testo) {
    showToast("Incolla prima del codice JSON o seleziona un file", "error");
    return;
  }

  let lista;
  try {
    lista = JSON.parse(testo);
  } catch (err) {
    showToast("JSON non valido: verifica la sintassi", "error");
    return;
  }

  if (!Array.isArray(lista)) {
    showToast("Il JSON deve contenere una lista (array [])", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/importa-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contatti: lista })
    });
    const json = await res.json();
    if (json.ok) {
      mostraFeedbackImport(json);
      await loadData();
    } else {
      showToast(json.errore || "Errore durante l'importazione", "error");
    }
  } catch (err) {
    // Fallback locale
    let inseriti = 0, duplicati = 0;
    const ora = new Date().toISOString().slice(0, 16).replace("T", " ");

    lista.forEach(item => {
      const az = (item.azienda || "").trim();
      const tel = (item.telefono || "").trim();
      if (!az || !tel) return;

      if (state.contatti.some(c => c.telefono === tel)) {
        duplicati++;
      } else {
        const id = state.contatti.length > 0 ? Math.max(...state.contatti.map(c => c.id)) + 1 : 1;
        state.contatti.push({
          id,
          azienda: az,
          telefono: tel,
          citta: (item.citta || "").trim(),
          note: (item.note || "").trim(),
          chiamato: "No",
          esito: "In attesa",
          data_aggiornamento: ora
        });
        inseriti++;
      }
    });

    salvaStorageLocale();
    calcolaStatisticheLocali();
    renderKpis();
    renderTables();
    renderAnalytics();
    mostraFeedbackImport({ inseriti, duplicati, errori: 0, totale: lista.length });
  }
}

function mostraFeedbackImport(res) {
  const box = document.getElementById("importFeedbackBox");
  box.style.display = "block";
  box.className = "import-feedback-box success";
  box.innerHTML = `
    <strong>Report Ingestione:</strong><br>
    &bull; Nuovi Lead Inseriti: <strong>${res.inseriti || 0}</strong><br>
    &bull; Duplicati Telefonici Scartati: <strong>${res.duplicati || 0}</strong><br>
    &bull; Record con Errori Formato: <strong>${res.errori || 0}</strong>
  `;
  showToast(`Import completato: +${res.inseriti || 0} lead acquisiti`, "success");
}

function esportaFileJson() {
  const contattiDaEsportare = state.contatti.map(c => ({
    id: c.id,
    azienda: c.azienda,
    telefono: c.telefono,
    citta: c.citta,
    note: c.note,
    chiamato: c.chiamato,
    esito: c.esito,
    data_aggiornamento: c.data_aggiornamento
  }));

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contattiDaEsportare, null, 2));
  const downloadAnchor = document.createElement("a");
  const dataOggi = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `noga_crm_export_${dataOggi}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast(`File JSON generato: ${contattiDaEsportare.length} lead esportati`, "success");
}

// ==============================================================================
// 5. TOAST NOTIFICATIONS & UTILITY
// ==============================================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <span style="opacity: 0.6; cursor: pointer;" onclick="this.parentElement.remove()">&times;</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.25s ease-out";
      setTimeout(() => toast.remove(), 250);
    }
  }, 3500);
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
