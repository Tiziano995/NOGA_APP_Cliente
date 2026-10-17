/**
 * NOGA ROMA - LOGICA INTERFACCIA GESTIONALE PRIVATO B2B
 * Comunicazione REST con app_server.py (SQLite) + fallback offline completo.
 * Zero librerie esterne, zero colori hardcoded, zero emoji.
 */

const MAPPA_CITTA_REGIONE_CLIENT = {
  roma: "Lazio", latina: "Lazio", frosinone: "Lazio", viterbo: "Lazio", rieti: "Lazio",
  milano: "Lombardia", brescia: "Lombardia", bergamo: "Lombardia", monza: "Lombardia",
  como: "Lombardia", varese: "Lombardia", pavia: "Lombardia", cremona: "Lombardia",
  mantova: "Lombardia", lecco: "Lombardia", lodi: "Lombardia", sondrio: "Lombardia",
  vigevano: "Lombardia", napoli: "Campania", salerno: "Campania", caserta: "Campania",
  avellino: "Campania", benevento: "Campania", aversa: "Campania", torino: "Piemonte",
  novara: "Piemonte", alessandria: "Piemonte", asti: "Piemonte", cuneo: "Piemonte",
  biella: "Piemonte", vercelli: "Piemonte", firenze: "Toscana", prato: "Toscana",
  livorno: "Toscana", arezzo: "Toscana", pisa: "Toscana", pistoia: "Toscana",
  lucca: "Toscana", grosseto: "Toscana", siena: "Toscana", viareggio: "Toscana",
  bologna: "Emilia-Romagna", modena: "Emilia-Romagna", parma: "Emilia-Romagna",
  "reggio emilia": "Emilia-Romagna", ravenna: "Emilia-Romagna", rimini: "Emilia-Romagna",
  ferrara: "Emilia-Romagna", forli: "Emilia-Romagna", "forlì": "Emilia-Romagna",
  cesena: "Emilia-Romagna", piacenza: "Emilia-Romagna", venezia: "Veneto",
  verona: "Veneto", padova: "Veneto", vicenza: "Veneto", treviso: "Veneto",
  rovigo: "Veneto", belluno: "Veneto", montebelluna: "Veneto", bari: "Puglia",
  taranto: "Puglia", foggia: "Puglia", lecce: "Puglia", brindisi: "Puglia",
  barletta: "Puglia", andria: "Puglia", trani: "Puglia", palermo: "Sicilia",
  catania: "Sicilia", messina: "Sicilia", siracusa: "Sicilia", ragusa: "Sicilia",
  trapani: "Sicilia", agrigento: "Sicilia", genova: "Liguria", "la spezia": "Liguria",
  savona: "Liguria", imperia: "Liguria", sanremo: "Liguria", ancona: "Marche",
  pesaro: "Marche", urbino: "Marche", macerata: "Marche", fermo: "Marche",
  "ascoli piceno": "Marche", "civitanova marche": "Marche", "porto sant'elpidio": "Marche",
  montegranaro: "Marche", "l'aquila": "Abruzzo", pescara: "Abruzzo", chieti: "Abruzzo",
  teramo: "Abruzzo", perugia: "Umbria", terni: "Umbria", trieste: "Friuli-Venezia Giulia",
  udine: "Friuli-Venezia Giulia", pordenone: "Friuli-Venezia Giulia", gorizia: "Friuli-Venezia Giulia",
  trento: "Trentino-Alto Adige", bolzano: "Trentino-Alto Adige", catanzaro: "Calabria",
  "reggio calabria": "Calabria", cosenza: "Calabria", crotone: "Calabria",
  cagliari: "Sardegna", sassari: "Sardegna", olbia: "Sardegna", nuoro: "Sardegna",
  potenza: "Basilicata", matera: "Basilicata", campobasso: "Molise", isernia: "Molise",
  aosta: "Valle d'Aosta"
};

const state = {
  contatti: [],
  duplicati: [],
  statistiche: {
    totali: 0,
    chiamati: 0,
    interessati: 0,
    rifiutati: 0,
    da_contattare: 0,
    da_richiamare: 0,
    in_attesa: 0,
    fatturato_totale_ordini: 0.0,
    valore_medio_ordine: 0.0,
    totale_ordini_effettuati: 0,
    tasso_conversione: 0.0,
    percentuale_completamento: 0.0,
    analisi_regioni: [],
    analisi_citta: [],
    gruppi_duplicati: 0
  },
  activeTab: "tab-coda",
  searchQuery: "",
  filterEsito: "",
  filterPriorita: "",
  ordiniSortBy: "totale_ordini",
  territorioMode: "regioni",
  selectedContact: null,
  pendingDeleteId: null,
  isFormDirty: false,
  isApiAvailable: true
};

const API_BASE = window.location.origin.startsWith("http") ? "" : "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupEventListeners();
  loadData();
});

// ==============================================================================
// 1. UTILITY DI FORMATTAZIONE E DOMINIO CLIENT
// ==============================================================================

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEuro(valore) {
  const num = Number(valore) || 0;
  return "€ " + num.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function deduciRegioneClient(citta) {
  if (!citta) return "";
  const clean = String(citta).trim().toLowerCase();
  if (MAPPA_CITTA_REGIONE_CLIENT[clean]) {
    return MAPPA_CITTA_REGIONE_CLIENT[clean];
  }
  for (const [k, reg] of Object.entries(MAPPA_CITTA_REGIONE_CLIENT)) {
    if (clean.includes(k)) return reg;
  }
  return "";
}

function normalizzaTelefonoClient(tel) {
  if (!tel) return "";
  let s = String(tel).trim().replace(/[\s.\-/()]+/g, "");
  if (s.startsWith("+39")) s = s.slice(3);
  else if (s.startsWith("0039")) s = s.slice(4);
  return s.replace(/[^\d+]/g, "");
}

function normalizzaAziendaClient(nome) {
  if (!nome) return "";
  return String(nome)
    .toLowerCase()
    .replace(/\b(s\.?\s*r\.?\s*l\.?\s*s\.?|s\.?\s*r\.?\s*l\.?|s\.?\s*p\.?\s*a\.?|s\.?\s*n\.?\s*c\.?|s\.?\s*a\.?\s*s\.?)\b/g, "")
    .replace(/[^a-z0-9àèéìòù]/g, "");
}

// ==============================================================================
// 2. CARICAMENTO DATI DA BACKEND REST API
// ==============================================================================

async function loadData() {
  await Promise.all([caricaContatti(), caricaStatistiche(), caricaDuplicati()]);
  renderAll();
  if (state.selectedContact && document.getElementById("detailDrawer").classList.contains("open")) {
    const aggiornato = state.contatti.find(c => c.id === state.selectedContact.id);
    if (aggiornato) {
      apriDrawer(aggiornato.id);
    } else {
      chiudiDrawer();
    }
  }
}

async function caricaContatti() {
  try {
    const res = await fetch(`${API_BASE}/api/contatti`);
    if (!res.ok) throw new Error("Errore API contatti");
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.contatti = json.data;
      state.isApiAvailable = true;
      aggiornaBadgeStatoDb(true);
    }
  } catch (err) {
    state.isApiAvailable = false;
    aggiornaBadgeStatoDb(false);
    if (!state.contatti || state.contatti.length === 0) {
      caricaDatiDefaultLocali();
    }
  }
}

async function caricaStatistiche() {
  try {
    const res = await fetch(`${API_BASE}/api/statistiche`);
    if (!res.ok) throw new Error("Errore API statistiche");
    const json = await res.json();
    if (json.ok && json.data) {
      state.statistiche = json.data;
      return;
    }
  } catch (err) {
    calcolaStatisticheLocali();
  }
}

async function caricaDuplicati() {
  try {
    const res = await fetch(`${API_BASE}/api/duplicati`);
    if (!res.ok) throw new Error("Errore API duplicati");
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.duplicati = json.data;
      return;
    }
  } catch (err) {
    calcolaDuplicatiLocali();
  }
}

function aggiornaBadgeStatoDb(attivo) {
  const el = document.getElementById("dbStatusIndicator");
  if (!el) return;
  if (attivo) {
    el.className = "db-status-indicator online";
    el.innerHTML = '<span class="status-dot"></span> SQLite Attivo (crm_ingrosso.db)';
  } else {
    el.className = "db-status-indicator offline";
    el.innerHTML = '<span class="status-dot"></span> Modalità Locale Offline';
  }
}

function caricaDatiDefaultLocali() {
  const salvati = localStorage.getItem("noga_crm_demo_contatti_v2");
  if (salvati) {
    try {
      state.contatti = JSON.parse(salvati);
      calcolaDuplicatiLocali();
      calcolaStatisticheLocali();
      return;
    } catch (e) {
      // Usa dataset fallback
    }
  }

  state.contatti = [
    {
      id: 1,
      azienda: "Calzature Brera Luxury S.r.l.",
      referente: "Dott.ssa Giulia Visconti",
      telefono: "+39 02 98765431",
      citta: "Milano",
      regione: "Lombardia",
      priorita: 1,
      chiamato: "Sì",
      esito: "Interessato (Ordine preso)",
      totale_ordini: 8050.0,
      numero_ordini: 2,
      note: "Catena 3 boutique Milano | [2026-10-16 15:15] ORDINE CONFERMATO: € 3200.00 - Riassortimento stivaletti pelle",
      data_aggiornamento: "2026-10-16 15:15",
      ultimo_ordine: "2026-10-16 15:15"
    },
    {
      id: 2,
      azienda: "Atelier del Passo Condotti",
      referente: "Marco Valeri",
      telefono: "06 55443322",
      citta: "Roma",
      regione: "Lazio",
      priorita: 1,
      chiamato: "Sì",
      esito: "Interessato (Ordine preso)",
      totale_ordini: 6400.0,
      numero_ordini: 2,
      note: "Showroom Piazza di Spagna | [2026-10-12 11:00] ORDINE CONFERMATO: € 6400.00 - Linea mocassini e décolleté",
      data_aggiornamento: "2026-10-12 11:00",
      ultimo_ordine: "2026-10-12 11:00"
    },
    {
      id: 3,
      azienda: "Toscana Shoes & Leather S.n.c.",
      referente: "Lorenzo Guicciardini",
      telefono: "055 2233445",
      citta: "Firenze",
      regione: "Toscana",
      priorita: 1,
      chiamato: "Sì",
      esito: "Interessato (Ordine preso)",
      totale_ordini: 5100.0,
      numero_ordini: 1,
      note: "Concept store lungarno | [2026-10-14 16:40] ORDINE CONFERMATO: € 5100.00 - Capsule artigianale NOGA",
      data_aggiornamento: "2026-10-14 16:40",
      ultimo_ordine: "2026-10-14 16:40"
    },
    {
      id: 4,
      azienda: "Galleria Sabauda Footwear",
      referente: "Elena Ferrero",
      telefono: "011 4455667",
      citta: "Torino",
      regione: "Piemonte",
      priorita: 1,
      chiamato: "No",
      esito: "Da richiamare",
      totale_ordini: 0.0,
      numero_ordini: 0,
      note: "Titolare interessata al listino B2B, richiamare nel pomeriggio",
      data_aggiornamento: "2026-10-16 17:00",
      ultimo_ordine: "2026-10-16 17:00"
    },
    {
      id: 5,
      azienda: "Brera Luxury Milano (Showroom)",
      referente: "",
      telefono: "02-98765431",
      citta: "Milano",
      regione: "Lombardia",
      priorita: 2,
      chiamato: "No",
      esito: "Da richiamare",
      totale_ordini: 1450.0,
      numero_ordini: 1,
      note: "Contatto fiera MICAM",
      data_aggiornamento: "2026-10-15 18:00",
      ultimo_ordine: "2026-10-15 18:00"
    }
  ];
  salvaStorageLocale();
  calcolaDuplicatiLocali();
  calcolaStatisticheLocali();
}

function salvaStorageLocale() {
  localStorage.setItem("noga_crm_demo_contatti_v2", JSON.stringify(state.contatti));
}

function calcolaDuplicatiLocali() {
  const gruppi = [];
  const usati = new Set();
  for (let i = 0; i < state.contatti.length; i++) {
    if (usati.has(i)) continue;
    const c1 = state.contatti[i];
    const t1 = normalizzaTelefonoClient(c1.telefono);
    const a1 = normalizzaAziendaClient(c1.azienda);
    const membri = [c1];
    let motivo = "";
    for (let j = i + 1; j < state.contatti.length; j++) {
      if (usati.has(j)) continue;
      const c2 = state.contatti[j];
      const t2 = normalizzaTelefonoClient(c2.telefono);
      const a2 = normalizzaAziendaClient(c2.azienda);
      if ((t1 && t1 === t2) || (a1 && a1 === a2)) {
        membri.push(c2);
        usati.add(j);
        motivo = t1 && t1 === t2 ? "Stesso Numero di Telefono" : "Stessa Ragione Sociale";
      }
    }
    if (membri.length > 1) {
      usati.add(i);
      gruppi.push({
        id_gruppo: `DUP-${c1.id}`,
        motivo,
        principale_suggerito_id: membri[0].id,
        contatti: membri
      });
    }
  }
  state.duplicati = gruppi;
}

function calcolaStatisticheLocali() {
  const totali = state.contatti.length;
  const chiamati = state.contatti.filter(c => c.chiamato === "Sì").length;
  const interessati = state.contatti.filter(c => c.esito === "Interessato (Ordine preso)").length;
  const rifiutati = state.contatti.filter(c => c.esito === "Non interessato (Rifiutato)").length;
  const da_contattare = state.contatti.filter(c => c.chiamato === "No" || c.esito === "Da richiamare").length;
  const da_richiamare = state.contatti.filter(c => c.esito === "Da richiamare").length;
  const in_attesa = state.contatti.filter(c => c.esito === "In attesa").length;

  const fatturato_totale_ordini = state.contatti.reduce((acc, c) => acc + (Number(c.totale_ordini) || 0), 0);
  const totale_ordini_effettuati = state.contatti.reduce((acc, c) => acc + (Number(c.numero_ordini) || 0), 0);
  const valore_medio_ordine = totale_ordini_effettuati > 0 ? fatturato_totale_ordini / totale_ordini_effettuati : 0;

  const tasso_conversione = chiamati > 0 ? Number(((interessati / chiamati) * 100).toFixed(1)) : 0.0;
  const percentuale_completamento = totali > 0 ? Number(((chiamati / totali) * 100).toFixed(1)) : 0.0;

  const mapReg = {};
  const mapCit = {};
  state.contatti.forEach(c => {
    const reg = c.regione || deduciRegioneClient(c.citta) || "Non specificata";
    const cit = c.citta || "Non specificata";
    const tot = Number(c.totale_ordini) || 0;
    const hasOrd = c.esito === "Interessato (Ordine preso)" || tot > 0 ? 1 : 0;

    if (!mapReg[reg]) mapReg[reg] = { nome: reg, totale_contatti: 0, chiamati: 0, ordini_confermati: 0, fatturato_ordini: 0 };
    mapReg[reg].totale_contatti++;
    if (c.chiamato === "Sì") mapReg[reg].chiamati++;
    mapReg[reg].ordini_confermati += hasOrd;
    mapReg[reg].fatturato_ordini += tot;

    if (!mapCit[cit]) mapCit[cit] = { nome: cit, regione: reg, totale_contatti: 0, chiamati: 0, ordini_confermati: 0, fatturato_ordini: 0 };
    mapCit[cit].totale_contatti++;
    if (c.chiamato === "Sì") mapCit[cit].chiamati++;
    mapCit[cit].ordini_confermati += hasOrd;
    mapCit[cit].fatturato_ordini += tot;
  });

  state.statistiche = {
    totali,
    chiamati,
    interessati,
    rifiutati,
    da_contattare,
    da_richiamare,
    in_attesa,
    fatturato_totale_ordini,
    valore_medio_ordine,
    totale_ordini_effettuati,
    tasso_conversione,
    percentuale_completamento,
    analisi_regioni: Object.values(mapReg).sort((a, b) => b.fatturato_ordini - a.fatturato_ordini),
    analisi_citta: Object.values(mapCit).sort((a, b) => b.fatturato_ordini - a.fatturato_ordini),
    gruppi_duplicati: state.duplicati.length
  };
}

// ==============================================================================
// 3. RENDERING INTERFACCIA E GRAFICI CSS/SVG
// ==============================================================================

function renderAll() {
  renderKpis();
  renderCodaTable();
  renderOrdiniTab();
  renderAnagraficaTable();
  renderAnalytics();
  renderDuplicatiTab();
}

function renderKpis() {
  const s = state.statistiche;
  const ordiniClientiCount = state.contatti.filter(
    c => c.esito === "Interessato (Ordine preso)" || (Number(c.totale_ordini) || 0) > 0
  ).length;

  document.getElementById("kpiTotali").textContent = s.totali || 0;
  document.getElementById("kpiDaChiamare").textContent = s.da_contattare || 0;
  document.getElementById("kpiChiamati").textContent = s.chiamati || 0;
  document.getElementById("kpiInteressati").textContent = ordiniClientiCount;
  document.getElementById("kpiFatturato").textContent = formatEuro(s.fatturato_totale_ordini || 0);
  document.getElementById("kpiFatturatoMeta").textContent =
    `${s.totale_ordini_effettuati || 0} ordini · Media ${formatEuro(s.valore_medio_ordine || 0)}`;
  document.getElementById("kpiTasso").textContent = Number(s.tasso_conversione || 0).toFixed(1);

  document.getElementById("badgeCodaCount").textContent = s.da_contattare || 0;
  document.getElementById("badgeOrdiniCount").textContent = ordiniClientiCount;
  document.getElementById("badgeTotaleCount").textContent = s.totali || 0;
  document.getElementById("badgeDuplicatiCount").textContent = state.duplicati.length;
  document.getElementById("codaSummaryBadge").textContent = `${s.da_contattare || 0} CONTATTI DA SMALTIRE`;
}

function getFilteredContacts(mode = "tutti") {
  const filtrati = state.contatti.filter(c => {
    if (mode === "da_chiamare") {
      if (c.chiamato !== "No" && c.esito !== "Da richiamare") return false;
    } else if (mode === "ordini_confermati") {
      if (c.esito !== "Interessato (Ordine preso)" && !(Number(c.totale_ordini) > 0)) return false;
    }

    if (state.filterPriorita && String(c.priorita || 2) !== String(state.filterPriorita)) {
      return false;
    }

    if (state.filterEsito && c.esito !== state.filterEsito) {
      return false;
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const campi = [c.azienda, c.referente, c.telefono, c.citta, c.regione, c.note]
        .map(v => (v || "").toLowerCase());
      if (!campi.some(testo => testo.includes(q))) return false;
    }

    return true;
  });

  return filtrati.sort((a, b) => (a.priorita || 2) - (b.priorita || 2) || a.id - b.id);
}

function creaBottonePriorita(c) {
  const p = Number(c.priorita) || 2;
  const labels = { 1: "1 · ALTA", 2: "2 · NORMALE", 3: "3 · BASSA" };
  return `
    <button type="button" class="prio-btn prio-${p}" onclick="ciclaPriorita(${c.id}, ${p})" title="Clicca per cambiare priorità (1=Alta, 2=Normale, 3=Bassa)">
      ${labels[p] || "2 · NORMALE"}
    </button>
  `;
}

function creaCellaLocalita(c) {
  const citta = c.citta || "";
  const regione = c.regione || deduciRegioneClient(citta);
  if (!citta && !regione) {
    return '<span class="text-muted">&mdash;</span>';
  }
  return `
    <div class="location-stack">
      ${citta ? `<span class="city-pill">${escapeHtml(citta)}</span>` : ""}
      ${regione ? `<span class="region-tag">${escapeHtml(regione)}</span>` : ""}
    </div>
  `;
}

function creaBadgeEsito(esito) {
  if (esito === "Interessato (Ordine preso)") {
    return '<span class="badge badge-success"><span class="badge-dot"></span> Ordine Preso</span>';
  }
  if (esito === "Da richiamare") {
    return '<span class="badge badge-warning"><span class="badge-dot"></span> Da Richiamare</span>';
  }
  if (esito === "Non interessato (Rifiutato)") {
    return '<span class="badge badge-danger"><span class="badge-dot"></span> Rifiutato</span>';
  }
  return '<span class="badge badge-neutral"><span class="badge-dot"></span> In Attesa</span>';
}

// --- TAB 1: CODA CHIAMATE ---
function renderCodaTable() {
  const tbody = document.getElementById("tbodyCoda");
  const emptyState = document.getElementById("emptyCoda");
  const table = document.getElementById("tableCoda");
  const list = getFilteredContacts("da_chiamare");

  if (list.length === 0) {
    tbody.innerHTML = "";
    table.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>${creaBottonePriorita(c)}</td>
      <td class="company-cell">
        <span class="company-id-sub">#${c.id}</span>
        <button type="button" class="clickable-company" onclick="apriDrawer(${c.id})">${escapeHtml(c.azienda)}</button>
      </td>
      <td>
        ${c.referente
          ? `<span class="referente-text">${escapeHtml(c.referente)}</span>`
          : '<span class="referente-empty">Da rilevare</span>'}
      </td>
      <td>
        <a href="tel:${escapeHtml(c.telefono)}" class="phone-link" title="Chiama ora">
          <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          ${escapeHtml(c.telefono)}
        </a>
      </td>
      <td>${creaCellaLocalita(c)}</td>
      <td>
        <div class="notes-snippet" title="${escapeHtml(c.note || "")}">
          ${escapeHtml(c.note || "Nessuna nota iniziale")}
        </div>
      </td>
      <td>${creaBadgeEsito(c.esito)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-primary btn-xs" onclick="apriModalEsito(${c.id})">
            Esito Chiamata
          </button>
          <button type="button" class="action-icon-btn" title="Modifica Referente / Anagrafica" onclick="apriModalModifica(${c.id})">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button type="button" class="action-icon-btn danger" title="Elimina Cliente" onclick="richiediEliminazione(${c.id})">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// --- TAB 2: ORDINI CONFERMATI + GRAFICO TOP CLIENTI ---
function renderOrdiniTab() {
  const tbody = document.getElementById("tbodyOrdini");
  const emptyState = document.getElementById("emptyOrdini");
  const table = document.getElementById("tableOrdini");
  const chartContainer = document.getElementById("chartTopClientiContainer");

  const list = getFilteredContacts("ordini_confermati");

  // Grafico Top Clienti ordinato per Totale Ordini (€) o N° Ordini
  const chartList = [...list].sort((a, b) => {
    if (state.ordiniSortBy === "numero_ordini") {
      return (Number(b.numero_ordini) || 0) - (Number(a.numero_ordini) || 0) ||
             (Number(b.totale_ordini) || 0) - (Number(a.totale_ordini) || 0);
    }
    return (Number(b.totale_ordini) || 0) - (Number(a.totale_ordini) || 0);
  });

  if (chartList.length === 0) {
    chartContainer.innerHTML = '<div class="text-xs text-muted">Nessun ordine confermato presente per generare il grafico.</div>';
    tbody.innerHTML = "";
    table.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  const maxEuro = Math.max(...chartList.map(c => Number(c.totale_ordini) || 0), 1);
  const maxNum = Math.max(...chartList.map(c => Number(c.numero_ordini) || 0), 1);

  chartContainer.innerHTML = chartList.map(c => {
    const euro = Number(c.totale_ordini) || 0;
    const num = Number(c.numero_ordini) || 0;
    const pct = state.ordiniSortBy === "numero_ordini"
      ? Math.max(Math.round((num / maxNum) * 100), 4)
      : Math.max(Math.round((euro / maxEuro) * 100), 4);
    const loc = c.citta ? `${c.citta}${c.regione ? " · " + c.regione : ""}` : "Italia";

    return `
      <div class="chart-row">
        <div class="chart-label-col">
          <span class="chart-label-main">${escapeHtml(c.azienda)}</span>
          <span class="chart-label-sub">${escapeHtml(c.referente || "Referente N/D")} &mdash; ${escapeHtml(loc)}</span>
        </div>
        <div class="chart-bar-col">
          <div class="chart-bar-track">
            <div class="chart-bar-fill fill-emerald" style="width: ${pct}%;"></div>
          </div>
        </div>
        <div class="chart-metrics-col">
          <span class="chart-metric-primary">${formatEuro(euro)}</span>
          <span class="chart-metric-secondary">${num} ${num === 1 ? "ordine" : "ordini"}</span>
        </div>
      </div>
    `;
  }).join("");

  table.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = list.map(c => {
    const tot = Number(c.totale_ordini) || 0;
    const num = Number(c.numero_ordini) || 0;
    return `
      <tr>
        <td>${creaBottonePriorita(c)}</td>
        <td class="company-cell">
          <span class="company-id-sub">#${c.id}</span>
          <button type="button" class="clickable-company" onclick="apriDrawer(${c.id})">${escapeHtml(c.azienda)}</button>
        </td>
        <td>
          ${c.referente
            ? `<span class="referente-text">${escapeHtml(c.referente)}</span>`
            : '<span class="referente-empty">Aggiungi referente</span>'}
        </td>
        <td>
          <a href="tel:${escapeHtml(c.telefono)}" class="phone-link">${escapeHtml(c.telefono)}</a>
        </td>
        <td>${creaCellaLocalita(c)}</td>
        <td class="col-center"><span class="orders-count-pill">${num}</span></td>
        <td class="amount-cell has-orders">${formatEuro(tot)}</td>
        <td class="timestamp-cell">${escapeHtml(c.ultimo_ordine || c.data_aggiornamento || "-")}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn-success-outline btn-xs" onclick="apriModalNuovoOrdine(${c.id})">
              + Nuovo Ordine (&euro;)
            </button>
            <button type="button" class="action-icon-btn" title="Modifica Referente / Dati" onclick="apriModalModifica(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button type="button" class="action-icon-btn" title="Storico Ordini e Scheda" onclick="apriDrawer(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button type="button" class="action-icon-btn danger" title="Elimina Cliente" onclick="richiediEliminazione(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- TAB 3: ANAGRAFICA MASTER ---
function renderAnagraficaTable() {
  const tbody = document.getElementById("tbodyAnagrafica");
  const emptyState = document.getElementById("emptyAnagrafica");
  const table = document.getElementById("tableAnagrafica");
  const counter = document.getElementById("anagraficaCounter");
  const list = getFilteredContacts("tutti");

  counter.textContent = `Visualizzati: ${list.length} di ${state.contatti.length} contatti`;

  if (list.length === 0) {
    tbody.innerHTML = "";
    table.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = list.map(c => {
    const tot = Number(c.totale_ordini) || 0;
    const num = Number(c.numero_ordini) || 0;
    return `
      <tr>
        <td>${creaBottonePriorita(c)}</td>
        <td class="company-cell">
          <span class="company-id-sub">#${c.id}</span>
          <button type="button" class="clickable-company" onclick="apriDrawer(${c.id})">${escapeHtml(c.azienda)}</button>
        </td>
        <td>
          ${c.referente
            ? `<span class="referente-text">${escapeHtml(c.referente)}</span>`
            : '<span class="referente-empty">&mdash;</span>'}
        </td>
        <td>
          <a href="tel:${escapeHtml(c.telefono)}" class="phone-link">${escapeHtml(c.telefono)}</a>
        </td>
        <td>${creaCellaLocalita(c)}</td>
        <td class="amount-cell ${tot > 0 ? "has-orders" : ""}">
          ${tot > 0 ? `${formatEuro(tot)} <span class="text-xs text-muted">(${num})</span>` : "&mdash;"}
        </td>
        <td>${creaBadgeEsito(c.esito)}</td>
        <td class="timestamp-cell">${escapeHtml(c.data_aggiornamento || "-")}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="action-icon-btn" title="Registra Chiamata" onclick="apriModalEsito(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
            <button type="button" class="action-icon-btn" title="+ Nuovo Ordine (€)" onclick="apriModalNuovoOrdine(${c.id})">&euro;+</button>
            <button type="button" class="action-icon-btn" title="Modifica Anagrafica / Referente" onclick="apriModalModifica(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button type="button" class="action-icon-btn" title="Scheda Cliente" onclick="apriDrawer(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button type="button" class="action-icon-btn danger" title="Elimina Cliente" onclick="richiediEliminazione(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- TAB 4: CRUSCOTTO & ANALISI TERRITORIALE PER CITTÀ E REGIONE ---
function renderAnalytics() {
  const s = state.statistiche;
  document.getElementById("funnelTotali").textContent = s.totali || 0;
  document.getElementById("funnelChiamati").textContent = s.chiamati || 0;
  document.getElementById("funnelInteressati").textContent = s.interessati || 0;

  const pctChiamati = s.totali > 0 ? Math.round((s.chiamati / s.totali) * 100) : 0;
  const pctInteressati = s.totali > 0 ? Math.round((s.interessati / s.totali) * 100) : 0;

  document.getElementById("funnelChiamatiBar").style.width = `${pctChiamati}%`;
  document.getElementById("funnelInteressatiBar").style.width = `${pctInteressati}%`;

  document.getElementById("statInteressati").textContent = s.interessati || 0;
  document.getElementById("statDaRichiamare").textContent =
    s.da_richiamare !== undefined ? s.da_richiamare : state.contatti.filter(c => c.esito === "Da richiamare").length;
  document.getElementById("statRifiutati").textContent = s.rifiutati || 0;
  document.getElementById("statInAttesa").textContent =
    s.in_attesa !== undefined ? s.in_attesa : state.contatti.filter(c => c.esito === "In attesa").length;

  document.getElementById("specFatturatoTotale").textContent = formatEuro(s.fatturato_totale_ordini || 0);
  document.getElementById("specNumeroOrdini").textContent = s.totale_ordini_effettuati || 0;
  document.getElementById("specValoreMedio").textContent = formatEuro(s.valore_medio_ordine || 0);
  document.getElementById("specCompletamento").textContent = `${Number(s.percentuale_completamento || 0).toFixed(1)}%`;
  document.getElementById("specDuplicatiCount").textContent = `${state.duplicati.length} gruppi`;

  renderTerritorialChart();
}

function renderTerritorialChart() {
  const container = document.getElementById("chartTerritorialeContainer");
  if (!container) return;

  const dati = state.territorioMode === "citta"
    ? (state.statistiche.analisi_citta || [])
    : (state.statistiche.analisi_regioni || []);

  if (!dati || dati.length === 0) {
    container.innerHTML = '<div class="text-xs text-muted">Nessun dato geografico disponibile.</div>';
    return;
  }

  const maxFatturato = Math.max(...dati.map(d => Number(d.fatturato_ordini) || 0), 1);
  const maxContatti = Math.max(...dati.map(d => Number(d.totale_contatti) || 0), 1);

  container.innerHTML = dati.map(item => {
    const fatt = Number(item.fatturato_ordini) || 0;
    const ordClienti = Number(item.ordini_confermati) || 0;
    const totContatti = Number(item.totale_contatti) || 0;
    const pctBar = fatt > 0
      ? Math.max(Math.round((fatt / maxFatturato) * 100), 6)
      : Math.max(Math.round((totContatti / maxContatti) * 35), 4);
    const subLabel = state.territorioMode === "citta" && item.regione
      ? `${item.regione} · ${totContatti} lead (${item.chiamati} chiamati)`
      : `${totContatti} lead totali · ${item.chiamati} chiamati`;

    return `
      <div class="chart-row">
        <div class="chart-label-col">
          <span class="chart-label-main">${escapeHtml(item.nome)}</span>
          <span class="chart-label-sub">${escapeHtml(subLabel)}</span>
        </div>
        <div class="chart-bar-col">
          <div class="chart-bar-track">
            <div class="chart-bar-fill ${fatt > 0 ? "fill-emerald" : ""}" style="width: ${pctBar}%;"></div>
          </div>
        </div>
        <div class="chart-metrics-col">
          <span class="chart-metric-primary">${formatEuro(fatt)}</span>
          <span class="chart-metric-secondary">${ordClienti} ${ordClienti === 1 ? "cliente acquisito" : "clienti acquisiti"}</span>
        </div>
      </div>
    `;
  }).join("");
}

// --- TAB 5: DUPLICATI & RIDONDANZE ---
function renderDuplicatiTab() {
  const wrapper = document.getElementById("duplicatiGroupsContainer");
  const emptyCard = document.getElementById("emptyDuplicatiCard");
  const badge = document.getElementById("duplicatiSummaryBadge");

  badge.textContent = `${state.duplicati.length} GRUPPI RILEVATI`;

  if (state.duplicati.length === 0) {
    wrapper.innerHTML = "";
    emptyCard.classList.remove("hidden");
    return;
  }

  emptyCard.classList.add("hidden");

  wrapper.innerHTML = state.duplicati.map(gruppo => {
    const principale = gruppo.contatti[0];
    return `
      <div class="duplicate-group-card">
        <div class="dup-group-header">
          <div>
            <span class="dup-group-title">${escapeHtml(gruppo.id_gruppo)} &mdash; ${escapeHtml(gruppo.motivo)}</span>
          </div>
          <span class="badge badge-warning"><span class="badge-dot"></span> ${gruppo.contatti.length} schede in conflitto</span>
        </div>
        <div class="dup-compare-grid">
          ${gruppo.contatti.map((c, idx) => {
            const isPrim = idx === 0;
            const altroId = isPrim ? gruppo.contatti[1].id : principale.id;
            return `
              <div class="dup-contact-box ${isPrim ? "is-primary" : ""}">
                <div>
                  <div class="dup-box-top">
                    <span class="dup-role-tag ${isPrim ? "" : "secondary-tag"}">
                      ${isPrim ? "SCHEDA PRINCIPALE SUGGERITA" : "SCHEDA RIDONDANTE / DOPPIONE"}
                    </span>
                    <span class="mono text-xs text-muted">#${c.id}</span>
                  </div>
                  <h4 class="modal-title" style="margin: 0.55rem 0 0.35rem 0;">${escapeHtml(c.azienda)}</h4>
                  <div class="dup-meta-list">
                    <div><strong>Referente:</strong> ${escapeHtml(c.referente || "Non specificato")}</div>
                    <div><strong>Telefono:</strong> <span class="mono">${escapeHtml(c.telefono)}</span></div>
                    <div><strong>Località:</strong> ${escapeHtml(c.citta || "-")} (${escapeHtml(c.regione || "-")})</div>
                    <div><strong>Ordini Confermati:</strong> <span class="mono">${formatEuro(c.totale_ordini)} (${c.numero_ordini} ordini)</span></div>
                    <div><strong>Note:</strong> ${escapeHtml(c.note || "Nessuna nota")}</div>
                  </div>
                </div>
                <div class="dup-actions-bar">
                  ${!isPrim ? `
                    <button type="button" class="btn btn-primary btn-xs" onclick="eseguiMergeContatti(${principale.id}, ${c.id})">
                      Unisci Schede (Mantieni #${principale.id})
                    </button>
                    <button type="button" class="btn btn-outline btn-xs" onclick="eseguiMergeContatti(${c.id}, ${principale.id})">
                      Mantieni #${c.id} come Principale
                    </button>
                  ` : `
                    <button type="button" class="btn btn-primary btn-xs" onclick="eseguiMergeContatti(${c.id}, ${altroId})">
                      Unisci Doppione #${altroId} in questa scheda
                    </button>
                  `}
                  <button type="button" class="btn btn-danger-outline btn-xs" onclick="richiediEliminazione(${c.id})">
                    Elimina Doppione #${c.id}
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
}

// ==============================================================================
// 4. AZIONI OPERATIVE: PRIORITÀ 1-CLICK, ORDINI (€), CRUD, IMPORT/EXPORT, MERGE
// ==============================================================================

async function ciclaPriorita(idContatto, prioritaAttuale) {
  const prossima = prioritaAttuale === 1 ? 2 : prioritaAttuale === 2 ? 3 : 1;
  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}/priorita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priorita: prossima })
    });
    const json = await res.json();
    if (json.ok) {
      const labels = { 1: "Alta (1)", 2: "Normale (2)", 3: "Bassa (3)" };
      showToast(`Priorità #${idContatto} impostata a ${labels[prossima]}`, "success");
      await loadData();
      return;
    }
  } catch (err) {
    const c = state.contatti.find(x => x.id === idContatto);
    if (c) {
      c.priorita = prossima;
      salvaStorageLocale();
      renderAll();
    }
  }
}

// --- MODALE NUOVO / MODIFICA CONTATTO ---
function apriModalNuovo() {
  document.getElementById("formNuovoContatto").reset();
  document.getElementById("contattoEditId").value = "";
  document.getElementById("modalContattoEyebrow").textContent = "ACQUISIZIONE ANAGRAFICA";
  document.getElementById("modalContattoTitle").textContent = "Nuovo Cliente all'Ingrosso";
  document.getElementById("groupOrdineIniziale").classList.remove("hidden");
  state.isFormDirty = false;
  document.getElementById("modalNuovoBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("inputAzienda").focus(), 40);
}

function apriModalModifica(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  document.getElementById("contattoEditId").value = String(c.id);
  document.getElementById("modalContattoEyebrow").textContent = `MODIFICA SCHEDA CLIENTE #${c.id}`;
  document.getElementById("modalContattoTitle").textContent = c.azienda;
  document.getElementById("inputAzienda").value = c.azienda || "";
  document.getElementById("inputReferente").value = c.referente || "";
  document.getElementById("inputTelefono").value = c.telefono || "";
  document.getElementById("inputPriorita").value = String(c.priorita || 2);
  document.getElementById("inputCitta").value = c.citta || "";
  document.getElementById("inputRegione").value = c.regione || deduciRegioneClient(c.citta);
  document.getElementById("inputNote").value = c.note || "";
  document.getElementById("groupOrdineIniziale").classList.add("hidden");

  state.isFormDirty = false;
  document.getElementById("modalNuovoBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("inputReferente").focus(), 40);
}

function chiudiModalNuovo(forza = false) {
  const modal = document.getElementById("modalNuovoBackdrop");
  if (!modal.classList.contains("open")) return;
  if (!forza && state.isFormDirty) {
    if (!confirm("Ci sono modifiche non salvate nel modulo. Vuoi chiudere comunque?")) return;
  }
  state.isFormDirty = false;
  modal.classList.remove("open");
}

async function salvaFormContatto(e) {
  e.preventDefault();
  const editId = document.getElementById("contattoEditId").value.trim();
  const azienda = document.getElementById("inputAzienda").value.trim();
  const referente = document.getElementById("inputReferente").value.trim();
  const telefono = document.getElementById("inputTelefono").value.trim();
  const priorita = parseInt(document.getElementById("inputPriorita").value, 10) || 2;
  const citta = document.getElementById("inputCitta").value.trim();
  const regione = document.getElementById("inputRegione").value.trim() || deduciRegioneClient(citta);
  const note = document.getElementById("inputNote").value.trim();
  const totaleOrdiniInit = parseFloat(document.getElementById("inputOrdineIniziale").value) || 0.0;

  if (!azienda || !telefono) {
    showToast("Azienda e Telefono sono obbligatori", "error");
    return;
  }

  try {
    if (editId) {
      const res = await fetch(`${API_BASE}/api/contatti/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ azienda, referente, telefono, citta, regione, priorita, note })
      });
      const json = await res.json();
      if (json.ok) {
        showToast("Scheda cliente aggiornata con successo", "success");
        chiudiModalNuovo(true);
        await loadData();
      } else {
        showToast(json.errore || "Errore durante l'aggiornamento", "error");
      }
    } else {
      const res = await fetch(`${API_BASE}/api/contatti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          azienda,
          referente,
          telefono,
          citta,
          regione,
          priorita,
          note,
          totale_ordini: totaleOrdiniInit
        })
      });
      const json = await res.json();
      if (json.ok) {
        showToast("Nuovo cliente registrato con successo", "success");
        chiudiModalNuovo(true);
        await loadData();
      } else {
        showToast(json.errore || "Errore durante il salvataggio", "error");
      }
    }
  } catch (err) {
    showToast("Errore di comunicazione con il server", "error");
  }
}

// --- MODALE REGISTRA ESITO CHIAMATA ---
function apriModalEsito(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  state.selectedContact = c;
  document.getElementById("esitoIdContatto").value = c.id;
  document.getElementById("modalEsitoAziendaTitle").textContent = c.azienda;
  document.getElementById("modalEsitoTelefono").textContent = c.telefono;
  document.getElementById("modalEsitoCitta").textContent =
    c.citta ? `${c.citta}${c.regione ? " (" + c.regione + ")" : ""}` : "Non indicata";
  document.getElementById("modalEsitoTotaleOrdini").textContent =
    `${formatEuro(c.totale_ordini)} (${c.numero_ordini || 0} ordini)`;

  document.getElementById("esitoInputReferente").value = c.referente || "";
  document.getElementById("esitoSelectPriorita").value = String(c.priorita || 2);
  document.getElementById("selectChiamato").value = "Sì";
  document.getElementById("selectEsito").value = c.esito === "In attesa" ? "Interessato (Ordine preso)" : c.esito;
  document.getElementById("inputImportoOrdineChiamata").value = "";
  document.getElementById("textareaNuoveNote").value = "";
  document.getElementById("modalEsitoStoricoNote").textContent = c.note || "Nessuna nota precedente.";

  aggiornaVisibilitaBoxOrdineEsito();
  document.getElementById("modalEsitoBackdrop").classList.add("open");
}

function aggiornaVisibilitaBoxOrdineEsito() {
  const esito = document.getElementById("selectEsito").value;
  const box = document.getElementById("boxImportoOrdineEsito");
  if (esito === "Interessato (Ordine preso)") {
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
}

function chiudiModalEsito() {
  document.getElementById("modalEsitoBackdrop").classList.remove("open");
}

async function salvaEsitoChiamata(e) {
  e.preventDefault();
  const idContatto = parseInt(document.getElementById("esitoIdContatto").value, 10);
  const chiamato = document.getElementById("selectChiamato").value;
  const esito = document.getElementById("selectEsito").value;
  const referente = document.getElementById("esitoInputReferente").value.trim();
  const priorita = parseInt(document.getElementById("esitoSelectPriorita").value, 10) || 2;
  const importoOrdine = parseFloat(document.getElementById("inputImportoOrdineChiamata").value) || 0.0;
  const nuoveNote = document.getElementById("textareaNuoveNote").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}/chiamata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chiamato,
        esito,
        note: nuoveNote,
        importo_ordine: esito === "Interessato (Ordine preso)" ? importoOrdine : 0.0,
        referente,
        priorita
      })
    });
    const json = await res.json();
    if (json.ok) {
      showToast("Esito telefonata salvato con successo", "success");
      chiudiModalEsito();
      await loadData();
    } else {
      showToast(json.errore || "Errore durante l'aggiornamento", "error");
    }
  } catch (err) {
    showToast("Impossibile contattare il server", "error");
  }
}

// --- MODALE + NUOVO ORDINE (€) ---
function apriModalNuovoOrdine(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  document.getElementById("ordineIdContatto").value = c.id;
  document.getElementById("modalOrdineAzienda").textContent = c.azienda;
  document.getElementById("modalOrdineAttuale").textContent =
    `${formatEuro(c.totale_ordini)} (${c.numero_ordini || 0} ordini)`;
  document.getElementById("inputNuovoOrdineImporto").value = "";
  document.getElementById("inputNuovoOrdineNote").value = "";

  document.getElementById("modalNuovoOrdineBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("inputNuovoOrdineImporto").focus(), 40);
}

function chiudiModalNuovoOrdine() {
  document.getElementById("modalNuovoOrdineBackdrop").classList.remove("open");
}

async function salvaNuovoOrdine(e) {
  e.preventDefault();
  const idContatto = parseInt(document.getElementById("ordineIdContatto").value, 10);
  const importo = parseFloat(document.getElementById("inputNuovoOrdineImporto").value);
  const noteOrdine = document.getElementById("inputNuovoOrdineNote").value.trim();

  if (!importo || importo <= 0) {
    showToast("Inserisci un importo ordine in Euro maggiore di 0", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}/ordini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importo, note_ordine: noteOrdine })
    });
    const json = await res.json();
    if (json.ok) {
      showToast(`Ordine di ${formatEuro(importo)} registrato con successo`, "success");
      chiudiModalNuovoOrdine();
      await loadData();
    } else {
      showToast(json.errore || "Errore registrazione ordine", "error");
    }
  } catch (err) {
    showToast("Impossibile contattare il server", "error");
  }
}

// --- MODALE CONFERMA ELIMINAZIONE CLIENTE ---
function richiediEliminazione(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  state.pendingDeleteId = c.id;
  document.getElementById("eliminaNomeAzienda").textContent = c.azienda;
  document.getElementById("eliminaTelefonoAzienda").textContent = c.telefono;
  document.getElementById("modalEliminaBackdrop").classList.add("open");
}

function chiudiModalElimina() {
  state.pendingDeleteId = null;
  document.getElementById("modalEliminaBackdrop").classList.remove("open");
}

async function confermaEliminazioneCliente() {
  const idContatto = state.pendingDeleteId;
  if (!idContatto) return;

  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      showToast(`Cliente #${idContatto} eliminato definitivamente`, "success");
      chiudiModalElimina();
      chiudiDrawer();
      await loadData();
    } else {
      showToast(json.errore || "Errore durante l'eliminazione", "error");
    }
  } catch (err) {
    state.contatti = state.contatti.filter(c => c.id !== idContatto);
    salvaStorageLocale();
    calcolaDuplicatiLocali();
    calcolaStatisticheLocali();
    chiudiModalElimina();
    chiudiDrawer();
    renderAll();
    showToast("Cliente rimosso dall'archivio locale", "success");
  }
}

// --- MERGE DUPLICATI ---
async function eseguiMergeContatti(idPrincipale, idSecondario) {
  try {
    const res = await fetch(`${API_BASE}/api/duplicati/unisci`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_principale: idPrincipale, id_secondario: idSecondario })
    });
    const json = await res.json();
    if (json.ok) {
      showToast(json.messaggio || "Schede unite con successo", "success");
      await loadData();
    } else {
      showToast(json.errore || "Errore durante l'unione delle schede", "error");
    }
  } catch (err) {
    showToast("Errore di rete durante l'unione", "error");
  }
}

// --- SLIDE-OVER DRAWER CON STORICO ORDINI (€) E TIMELINE NOTE ---
async function apriDrawer(idContatto) {
  const c = state.contatti.find(item => item.id === idContatto);
  if (!c) return;
  state.selectedContact = c;

  document.getElementById("drawerAzienda").textContent = c.azienda;
  document.getElementById("drawerId").textContent = `#${c.id}`;
  document.getElementById("drawerPriorita").innerHTML = creaBottonePriorita(c);
  document.getElementById("drawerReferente").textContent = c.referente || "Non specificato";
  document.getElementById("drawerTelefono").textContent = c.telefono;
  const reg = c.regione || deduciRegioneClient(c.citta);
  document.getElementById("drawerCitta").textContent =
    c.citta ? `${c.citta}${reg ? " (" + reg + ")" : ""}` : "Non specificata";
  document.getElementById("drawerChiamato").textContent = c.chiamato;
  document.getElementById("drawerEsito").innerHTML = creaBadgeEsito(c.esito);
  document.getElementById("drawerTotaleOrdini").textContent =
    `${formatEuro(c.totale_ordini)} (${c.numero_ordini || 0} ordini)`;
  document.getElementById("drawerData").textContent = c.data_aggiornamento || "-";
  document.getElementById("drawerLinkChiama").href = `tel:${c.telefono}`;

  // Storico Note separato da |
  const notesContainer = document.getElementById("drawerNotesTimeline");
  if (!c.note) {
    notesContainer.innerHTML = '<div class="text-xs text-muted">Nessuna nota registrata.</div>';
  } else {
    const partiNote = c.note.split("|").map(n => n.trim()).filter(Boolean);
    notesContainer.innerHTML = partiNote.map((nota, idx) => `
      <div class="timeline-note-item">
        <span class="timeline-note-tag">Annotazione #${idx + 1}</span>
        ${escapeHtml(nota)}
      </div>
    `).join("");
  }

  document.getElementById("drawerBackdrop").classList.add("open");
  document.getElementById("detailDrawer").classList.add("open");

  // Carica Storico Ordini dal server
  const ordersContainer = document.getElementById("drawerOrdersTimeline");
  ordersContainer.innerHTML = '<div class="text-xs text-muted">Caricamento storico ordini...</div>';
  try {
    const res = await fetch(`${API_BASE}/api/contatti/${c.id}/ordini`);
    const json = await res.json();
    if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
      ordersContainer.innerHTML = json.data.map(ord => `
        <div class="order-history-item">
          <div>
            <div class="order-history-amount">${formatEuro(ord.importo)}</div>
            <div class="order-history-meta">${escapeHtml(ord.note_ordine || "Ordine B2B confermato")}</div>
          </div>
          <div class="order-history-date">${escapeHtml(ord.data_ordine)}</div>
        </div>
      `).join("");
    } else if ((Number(c.totale_ordini) || 0) > 0) {
      ordersContainer.innerHTML = `
        <div class="order-history-item">
          <div>
            <div class="order-history-amount">${formatEuro(c.totale_ordini)}</div>
            <div class="order-history-meta">Totale ordini registrati</div>
          </div>
          <div class="order-history-date">${escapeHtml(c.ultimo_ordine || c.data_aggiornamento || "-")}</div>
        </div>
      `;
    } else {
      ordersContainer.innerHTML = '<div class="text-xs text-muted">Nessun ordine confermato per questo cliente.</div>';
    }
  } catch (err) {
    ordersContainer.innerHTML = '<div class="text-xs text-muted">Storico ordini non disponibile offline.</div>';
  }
}

function chiudiDrawer() {
  document.getElementById("drawerBackdrop").classList.remove("open");
  document.getElementById("detailDrawer").classList.remove("open");
}

// --- IMPORTAZIONE UNIVERSALE MULTI-FORMATO & ESPORTAZIONE CSV / JSON ---
function apriModalImport() {
  document.getElementById("textareaJsonRaw").value = "";
  const feedback = document.getElementById("importFeedbackBox");
  feedback.classList.add("hidden");
  document.getElementById("modalImportBackdrop").classList.add("open");
}

function chiudiModalImport() {
  document.getElementById("modalImportBackdrop").classList.remove("open");
}

function leggiFileImportato(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById("textareaJsonRaw").value = event.target.result || "";
    showToast(`File '${file.name}' caricato nell'editor. Clicca "Analizza e Importa"`, "success");
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
    showToast("Impossibile contattare il server", "error");
  }
}

async function eseguiImportUniversale() {
  const testo = document.getElementById("textareaJsonRaw").value.trim();
  if (!testo) {
    showToast("Seleziona un file o incolla i dati da importare", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/importa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenuto_testo: testo })
    });
    const json = await res.json();
    if (json.ok) {
      mostraFeedbackImport(json);
      await loadData();
    } else {
      showToast(json.errore || "Errore durante l'importazione", "error");
    }
  } catch (err) {
    showToast("Errore di connessione durante l'importazione", "error");
  }
}

function mostraFeedbackImport(res) {
  const box = document.getElementById("importFeedbackBox");
  box.classList.remove("hidden");
  box.className = "import-feedback-box success";
  box.innerHTML = `
    <strong>Report Importazione (${escapeHtml(res.formato_rilevato || "Multi-formato")}):</strong><br>
    &bull; Nuovi Clienti Inseriti: <strong>${res.inseriti || 0}</strong><br>
    &bull; Duplicati Telefonici Scartati: <strong>${res.duplicati || 0}</strong><br>
    &bull; Righe Ignorate / Incomplete: <strong>${res.errori || 0}</strong>
  `;
  showToast(`Importazione completata: +${res.inseriti || 0} contatti`, "success");
}

function esportaFileJson() {
  const dataOggi = new Date().toISOString().slice(0, 10);
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.contatti, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `noga_roma_backup_${dataOggi}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Esportati ${state.contatti.length} contatti in JSON`, "success");
}

function esportaFileCsv() {
  if (state.isApiAvailable) {
    window.location.href = `${API_BASE}/api/esporta-csv`;
    showToast("Download CSV compatibile Excel avviato", "success");
    return;
  }
  const headers = ["ID", "Priorita", "Azienda", "Referente", "Telefono", "Citta", "Regione", "Chiamato", "Esito", "Numero_Ordini", "Totale_Ordini_EUR"];
  const rows = state.contatti.map(c => [
    c.id, c.priorita, `"${(c.azienda || "").replace(/"/g, '""')}"`, `"${(c.referente || "").replace(/"/g, '""')}"`,
    `"${c.telefono || ""}"`, `"${c.citta || ""}"`, `"${c.regione || ""}"`, c.chiamato, `"${c.esito || ""}"`,
    c.numero_ordini || 0, String(c.totale_ordini || 0).replace(".", ",")
  ].join(";"));
  const csv = "\ufeff" + headers.join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "noga_roma_contatti_ordini.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function ripristinaDemoRicca() {
  try {
    const res = await fetch(`${API_BASE}/api/ripristina-demo`, { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      showToast("Dataset demo ricco (con ordini, regioni e duplicati) caricato", "success");
      await loadData();
      return;
    }
  } catch (err) {
    localStorage.removeItem("noga_crm_demo_contatti_v2");
    caricaDatiDefaultLocali();
    renderAll();
    showToast("Dataset demo ripristinato in locale", "success");
  }
}

// ==============================================================================
// 5. NAVIGAZIONE TAB & EVENT LISTENERS
// ==============================================================================

function attivaTab(targetId) {
  state.activeTab = targetId;
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === targetId);
  });
  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("active", content.id === targetId);
  });
}

function setupNavigation() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => attivaTab(btn.dataset.tab));
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    clearBtn.classList.toggle("hidden", !state.searchQuery);
    renderAll();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearBtn.classList.add("hidden");
    searchInput.focus();
    renderAll();
  });

  document.getElementById("filterPrioritaSelect").addEventListener("change", (e) => {
    state.filterPriorita = e.target.value;
    renderAll();
  });

  document.getElementById("filterEsitoSelect").addEventListener("change", (e) => {
    state.filterEsito = e.target.value;
    renderAll();
  });

  document.getElementById("btnRefresh").addEventListener("click", () => {
    loadData();
    showToast("Sincronizzazione database completata", "success");
  });

  // Pulsanti Header e Top Announcement Bar
  document.getElementById("btnRipristinaDemo").addEventListener("click", ripristinaDemoRicca);
  document.getElementById("topBtnRipristinaDemo").addEventListener("click", ripristinaDemoRicca);

  document.getElementById("btnImportaJson").addEventListener("click", apriModalImport);
  document.getElementById("topBtnImporta").addEventListener("click", apriModalImport);

  document.getElementById("btnEsportaJson").addEventListener("click", esportaFileJson);
  document.getElementById("topBtnEsportaJson").addEventListener("click", esportaFileJson);

  document.getElementById("btnEsportaCsv").addEventListener("click", esportaFileCsv);
  document.getElementById("topBtnEsportaCsv").addEventListener("click", esportaFileCsv);

  // Switch ordinamento grafico Top Clienti (Tab Ordini Confermati)
  document.getElementById("btnOrdiniSortEuro").addEventListener("click", () => {
    state.ordiniSortBy = "totale_ordini";
    document.getElementById("btnOrdiniSortEuro").classList.add("active");
    document.getElementById("btnOrdiniSortNum").classList.remove("active");
    renderOrdiniTab();
  });

  document.getElementById("btnOrdiniSortNum").addEventListener("click", () => {
    state.ordiniSortBy = "numero_ordini";
    document.getElementById("btnOrdiniSortNum").classList.add("active");
    document.getElementById("btnOrdiniSortEuro").classList.remove("active");
    renderOrdiniTab();
  });

  document.getElementById("btnVaiAnalisiTerritoriale").addEventListener("click", () => {
    attivaTab("tab-analitiche");
    document.getElementById("panelAnalisiTerritoriale").scrollIntoView({ behavior: "smooth" });
  });

  // Switch grafico territoriale (Per Regione / Per Città)
  document.getElementById("btnGeoRegione").addEventListener("click", () => {
    state.territorioMode = "regioni";
    document.getElementById("btnGeoRegione").classList.add("active");
    document.getElementById("btnGeoCitta").classList.remove("active");
    renderTerritorialChart();
  });

  document.getElementById("btnGeoCitta").addEventListener("click", () => {
    state.territorioMode = "citta";
    document.getElementById("btnGeoCitta").classList.add("active");
    document.getElementById("btnGeoRegione").classList.remove("active");
    renderTerritorialChart();
  });

  // Modale Nuovo / Modifica Contatto + Auto-deduzione Regione da Città
  document.getElementById("btnNuovoContatto").addEventListener("click", apriModalNuovo);
  document.getElementById("modalNuovoCloseBtn").addEventListener("click", () => chiudiModalNuovo(false));
  document.getElementById("btnAnnullaNuovo").addEventListener("click", () => chiudiModalNuovo(false));
  document.getElementById("formNuovoContatto").addEventListener("submit", salvaFormContatto);
  document.getElementById("formNuovoContatto").addEventListener("input", () => {
    state.isFormDirty = true;
  });

  document.getElementById("inputCitta").addEventListener("input", (e) => {
    const regDedotta = deduciRegioneClient(e.target.value);
    if (regDedotta) {
      document.getElementById("inputRegione").value = regDedotta;
    }
  });

  // Modale Registra Esito Chiamata + Chip Note Rapide
  document.getElementById("modalEsitoCloseBtn").addEventListener("click", chiudiModalEsito);
  document.getElementById("btnAnnullaEsito").addEventListener("click", chiudiModalEsito);
  document.getElementById("selectEsito").addEventListener("change", aggiornaVisibilitaBoxOrdineEsito);
  document.getElementById("formRegistraEsito").addEventListener("submit", salvaEsitoChiamata);

  document.querySelectorAll(".chip-btn").forEach(chip => {
    chip.addEventListener("click", () => {
      const txt = chip.dataset.chip;
      const area = document.getElementById("textareaNuoveNote");
      area.value = area.value.trim() ? `${area.value.trim()} — ${txt}` : txt;
      area.focus();
    });
  });

  // Modale + Nuovo Ordine (€)
  document.getElementById("modalNuovoOrdineCloseBtn").addEventListener("click", chiudiModalNuovoOrdine);
  document.getElementById("btnAnnullaNuovoOrdine").addEventListener("click", chiudiModalNuovoOrdine);
  document.getElementById("formNuovoOrdine").addEventListener("submit", salvaNuovoOrdine);

  // Modale Importazione Universale + Drag & Drop
  document.getElementById("modalImportCloseBtn").addEventListener("click", chiudiModalImport);
  document.getElementById("btnAnnullaImport").addEventListener("click", chiudiModalImport);
  document.getElementById("btnCaricaFileJson").addEventListener("click", () => {
    document.getElementById("fileInputJson").click();
  });
  document.getElementById("fileInputJson").addEventListener("change", (e) => {
    leggiFileImportato(e.target.files[0]);
  });

  const dropzone = document.getElementById("importDropzone");
  dropzone.addEventListener("click", () => document.getElementById("fileInputJson").click());
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      leggiFileImportato(e.dataTransfer.files[0]);
    }
  });

  document.getElementById("btnImportaDefaultFile").addEventListener("click", importaFileDefault);
  document.getElementById("btnEseguiImportTesto").addEventListener("click", eseguiImportUniversale);

  // Modale Conferma Eliminazione
  document.getElementById("modalEliminaCloseBtn").addEventListener("click", chiudiModalElimina);
  document.getElementById("btnAnnullaElimina").addEventListener("click", chiudiModalElimina);
  document.getElementById("btnConfermaElimina").addEventListener("click", confermaEliminazioneCliente);

  // Slide-over Drawer
  document.getElementById("drawerCloseBtn").addEventListener("click", chiudiDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", chiudiDrawer);

  document.getElementById("drawerBtnNuovoOrdine").addEventListener("click", () => {
    if (state.selectedContact) {
      apriModalNuovoOrdine(state.selectedContact.id);
    }
  });

  document.getElementById("drawerBtnRegistraChiamata").addEventListener("click", () => {
    if (state.selectedContact) {
      chiudiDrawer();
      apriModalEsito(state.selectedContact.id);
    }
  });

  document.getElementById("drawerBtnModificaContatto").addEventListener("click", () => {
    if (state.selectedContact) {
      chiudiDrawer();
      apriModalModifica(state.selectedContact.id);
    }
  });

  document.getElementById("drawerBtnElimina").addEventListener("click", () => {
    if (state.selectedContact) {
      richiediEliminazione(state.selectedContact.id);
    }
  });

  // Navigazione da tastiera (ESC chiude modali/drawer, / attiva ricerca)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      chiudiModalNuovo(false);
      chiudiModalEsito();
      chiudiModalNuovoOrdine();
      chiudiModalImport();
      chiudiModalElimina();
      chiudiDrawer();
    } else if (
      e.key === "/" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA" &&
      document.activeElement.tagName !== "SELECT"
    ) {
      e.preventDefault();
      document.getElementById("searchInput").focus();
    }
  });
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="modal-close-btn" aria-label="Chiudi notifica">&times;</button>
  `;
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 3600);
}
