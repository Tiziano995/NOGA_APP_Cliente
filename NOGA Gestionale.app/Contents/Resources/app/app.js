/**
 * NOGA ROMA - LOGICA INTERFACCIA GESTIONALE PRIVATO B2B
 * Modulo Completo: Acquisizione, Ordini (€), Grafici Territoriali, Duplicati
 * e Calendarizzazione & Gestione Ricontatti in Tempo Reale.
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

const NOMI_MESI_IT = [
  "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"
];

const oggiInit = new Date();

const state = {
  contatti: [],
  calendarioAppuntamenti: [],
  calendarioContatori: {
    scaduti: 0,
    oggi: 0,
    futuri: 0,
    totale: 0
  },
  duplicati: [],
  statistiche: {
    totali: 0,
    chiamati: 0,
    interessati: 0,
    rifiutati: 0,
    da_contattare: 0,
    da_richiamare: 0,
    in_attesa: 0,
    ricontatti_oggi: 0,
    ricontatti_scaduti: 0,
    totale_pianificati: 0,
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
  calendarYear: oggiInit.getFullYear(),
  calendarMonth: oggiInit.getMonth(), // 0-11
  calendarSelectedDate: formatDateISO(oggiInit),
  agendaFilterMode: "tutti", // 'tutti' | 'oggi_scaduti' | 'giorno'
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
// 1. UTILITY DI FORMATTAZIONE, DATE E DOMINIO CLIENT
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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateISO(dateObj) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
}

function formatTimeISO(dateObj) {
  return `${pad2(dateObj.getHours())}:${pad2(dateObj.getMinutes())}`;
}

function formatDateIT(isoDateStr) {
  if (!isoDateStr || isoDateStr.length < 10) return isoDateStr || "-";
  const [y, m, d] = isoDateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function calcolaStatoRicontattoClient(dataRicontatto) {
  const dr = String(dataRicontatto || "").trim();
  if (!dr || dr.length < 10) return "";
  const now = new Date();
  const oggiStr = formatDateISO(now);
  const adessoStr = `${oggiStr} ${formatTimeISO(now)}`;
  const dataParte = dr.slice(0, 10);

  if (dr < adessoStr) return "scaduto";
  if (dataParte === oggiStr) return "oggi";
  return "futuro";
}

function formattaEtichettaRicontatto(dataRicontatto, stato) {
  const dr = String(dataRicontatto || "").trim();
  if (!dr) return "";
  const dataParte = dr.slice(0, 10);
  const oraParte = dr.length >= 16 ? dr.slice(11, 16) : "09:00";
  const [y, m, d] = dataParte.split("-");
  const ggMm = `${d}/${m}`;

  if (stato === "scaduto") {
    return `SCADUTO · ${ggMm} ${oraParte}`;
  }
  if (stato === "oggi") {
    return `OGGI · ${oraParte}`;
  }
  return `${ggMm}/${y.slice(2)} · ${oraParte}`;
}

function calcolaSlotRapido(slotKey, baseDateStr = "", baseTimeStr = "") {
  const now = new Date();
  let target = new Date(now.getTime());

  if (slotKey === "tra_1_ora") {
    target.setHours(target.getHours() + 1);
    const min = target.getMinutes();
    target.setMinutes(min < 30 ? 30 : 0);
    if (min >= 30) target.setHours(target.getHours() + 1);
    return { date: formatDateISO(target), time: formatTimeISO(target) };
  }

  if (slotKey === "tra_2_ore") {
    target.setHours(target.getHours() + 2);
    const min = target.getMinutes();
    target.setMinutes(min < 30 ? 30 : 0);
    if (min >= 30) target.setHours(target.getHours() + 1);
    return { date: formatDateISO(target), time: formatTimeISO(target) };
  }

  if (slotKey === "oggi_pomeriggio") {
    return { date: formatDateISO(target), time: "15:30" };
  }

  if (slotKey === "domani_mattina") {
    target.setDate(target.getDate() + 1);
    return { date: formatDateISO(target), time: "10:00" };
  }

  if (slotKey === "domani_pomeriggio") {
    target.setDate(target.getDate() + 1);
    return { date: formatDateISO(target), time: "16:00" };
  }

  if (slotKey === "lunedi_prossimo") {
    const day = target.getDay(); // 0=Dom, 1=Lun, ...
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    target.setDate(target.getDate() + daysUntilMonday);
    return { date: formatDateISO(target), time: "10:00" };
  }

  if (slotKey === "piu_1_giorno") {
    if (baseDateStr && baseDateStr.length === 10) {
      const [y, m, d] = baseDateStr.split("-").map(Number);
      target = new Date(y, m - 1, d);
    }
    target.setDate(target.getDate() + 1);
    return { date: formatDateISO(target), time: baseTimeStr || "10:00" };
  }

  return { date: formatDateISO(target), time: "10:00" };
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
// 2. CARICAMENTO DATI DA BACKEND REST API (SINCRONIZZAZIONE REAL-TIME)
// ==============================================================================

async function loadData() {
  await Promise.all([
    caricaContatti(),
    caricaStatistiche(),
    caricaCalendario(),
    caricaDuplicati()
  ]);
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
      state.contatti = json.data.map(arricchisciContattoClient);
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

async function caricaCalendario() {
  try {
    const res = await fetch(`${API_BASE}/api/calendario`);
    if (!res.ok) throw new Error("Errore API calendario");
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.calendarioAppuntamenti = json.data.map(arricchisciContattoClient);
      if (json.contatori) {
        state.calendarioContatori = json.contatori;
      } else {
        ricalcolaContatoriCalendarioLocali();
      }
      return;
    }
  } catch (err) {
    ricalcolaContatoriCalendarioLocali();
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

function arricchisciContattoClient(c) {
  const dr = String(c.data_ricontatto || "").trim();
  return {
    ...c,
    data_ricontatto: dr,
    motivo_ricontatto: String(c.motivo_ricontatto || "").trim(),
    stato_ricontatto: c.stato_ricontatto || calcolaStatoRicontattoClient(dr)
  };
}

function ricalcolaContatoriCalendarioLocali() {
  const pianificati = state.contatti
    .map(arricchisciContattoClient)
    .filter(c => c.data_ricontatto);

  pianificati.sort((a, b) => {
    const ordA = a.stato_ricontatto === "scaduto" ? 0 : a.stato_ricontatto === "oggi" ? 1 : 2;
    const ordB = b.stato_ricontatto === "scaduto" ? 0 : b.stato_ricontatto === "oggi" ? 1 : 2;
    if (ordA !== ordB) return ordA - ordB;
    if (a.data_ricontatto !== b.data_ricontatto) return a.data_ricontatto.localeCompare(b.data_ricontatto);
    return (a.priorita || 2) - (b.priorita || 2);
  });

  state.calendarioAppuntamenti = pianificati;
  state.calendarioContatori = {
    scaduti: pianificati.filter(x => x.stato_ricontatto === "scaduto").length,
    oggi: pianificati.filter(x => x.stato_ricontatto === "oggi").length,
    futuri: pianificati.filter(x => x.stato_ricontatto === "futuro").length,
    totale: pianificati.length
  };
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
  const salvati = localStorage.getItem("noga_crm_demo_contatti_v3");
  if (salvati) {
    try {
      state.contatti = JSON.parse(salvati).map(arricchisciContattoClient);
      ricalcolaContatoriCalendarioLocali();
      calcolaDuplicatiLocali();
      calcolaStatisticheLocali();
      return;
    } catch (e) {
      // Usa dataset fallback
    }
  }

  const now = new Date();
  const ieri = new Date(now.getTime() - 86400000);
  const domani = new Date(now.getTime() + 86400000);

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
      data_ricontatto: `${formatDateISO(domani)} 11:00`,
      motivo_ricontatto: "Follow-up nuovo ordine",
      note: "Catena 3 boutique Milano | [ORDINE CONFERMATO] € 8050.00",
      data_aggiornamento: `${formatDateISO(now)} 09:30`,
      ultimo_ordine: `${formatDateISO(now)} 09:30`
    },
    {
      id: 2,
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
      data_ricontatto: `${formatDateISO(ieri)} 15:00`,
      motivo_ricontatto: "Titolare assente - Richiamare",
      note: "Titolare interessata al listino B2B, richiamare con urgenza",
      data_aggiornamento: `${formatDateISO(ieri)} 15:00`,
      ultimo_ordine: ""
    },
    {
      id: 3,
      azienda: "Boutique Via Toledo",
      referente: "Gennaro Esposito",
      telefono: "081 9988776",
      citta: "Napoli",
      regione: "Campania",
      priorita: 1,
      chiamato: "No",
      esito: "Da richiamare",
      totale_ordini: 0.0,
      numero_ordini: 0,
      data_ricontatto: `${formatDateISO(now)} 17:30`,
      motivo_ricontatto: "Appuntamento concordato",
      note: "Inviato catalogo WhatsApp, richiamare per conferma taglie",
      data_aggiornamento: `${formatDateISO(now)} 10:00`,
      ultimo_ordine: ""
    }
  ].map(arricchisciContattoClient);

  salvaStorageLocale();
  ricalcolaContatoriCalendarioLocali();
  calcolaDuplicatiLocali();
  calcolaStatisticheLocali();
}

function salvaStorageLocale() {
  localStorage.setItem("noga_crm_demo_contatti_v3", JSON.stringify(state.contatti));
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
  ricalcolaContatoriCalendarioLocali();
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
    ricontatti_oggi: state.calendarioContatori.oggi,
    ricontatti_scaduti: state.calendarioContatori.scaduti,
    totale_pianificati: state.calendarioContatori.totale,
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
// 3. RENDERING INTERFACCIA, CALENDARIO, TABELLE E GRAFICI CSS/SVG
// ==============================================================================

function renderAll() {
  renderKpis();
  renderCodaTable();
  renderCalendarioTab();
  renderOrdiniTab();
  renderAnagraficaTable();
  renderAnalytics();
  renderDuplicatiTab();
}

function renderKpis() {
  const s = state.statistiche;
  const cal = state.calendarioContatori;
  const ordiniClientiCount = state.contatti.filter(
    c => c.esito === "Interessato (Ordine preso)" || (Number(c.totale_ordini) || 0) > 0
  ).length;

  document.getElementById("kpiTotali").textContent = s.totali || 0;
  document.getElementById("kpiDaChiamare").textContent = s.da_contattare || 0;

  const urgentiOggiScaduti = (cal.scaduti || 0) + (cal.oggi || 0);
  const kpiDaChiamareMeta = document.getElementById("kpiDaChiamareMeta");
  if (kpiDaChiamareMeta) {
    kpiDaChiamareMeta.textContent = urgentiOggiScaduti > 0
      ? `${urgentiOggiScaduti} ricontatti oggi/scaduti`
      : "Ordinati per scadenza e priorità";
  }

  document.getElementById("kpiChiamati").textContent = s.chiamati || 0;
  document.getElementById("kpiInteressati").textContent = ordiniClientiCount;
  document.getElementById("kpiFatturato").textContent = formatEuro(s.fatturato_totale_ordini || 0);
  document.getElementById("kpiFatturatoMeta").textContent =
    `${s.totale_ordini_effettuati || 0} ordini · Media ${formatEuro(s.valore_medio_ordine || 0)}`;
  document.getElementById("kpiTasso").textContent = Number(s.tasso_conversione || 0).toFixed(1);

  document.getElementById("badgeCodaCount").textContent = s.da_contattare || 0;
  document.getElementById("badgeCalendarioCount").textContent = urgentiOggiScaduti;
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
      const campi = [
        c.azienda,
        c.referente,
        c.telefono,
        c.citta,
        c.regione,
        c.note,
        c.motivo_ricontatto,
        c.data_ricontatto
      ].map(v => (v || "").toLowerCase());
      if (!campi.some(testo => testo.includes(q))) return false;
    }

    return true;
  });

  if (mode === "da_chiamare") {
    return filtrati.sort((a, b) => {
      const rank = (c) => {
        const st = c.stato_ricontatto || calcolaStatoRicontattoClient(c.data_ricontatto);
        if (st === "scaduto") return 0;
        if (st === "oggi") return 1;
        if (st === "futuro") return 2;
        return 3;
      };
      const rA = rank(a);
      const rB = rank(b);
      if (rA !== rB) return rA - rB;
      if (rA < 3 && a.data_ricontatto !== b.data_ricontatto) {
        return a.data_ricontatto.localeCompare(b.data_ricontatto);
      }
      return (a.priorita || 2) - (b.priorita || 2) || a.id - b.id;
    });
  }

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

function creaCellaRicontatto(c) {
  const dr = String(c.data_ricontatto || "").trim();
  if (!dr) {
    return `
      <button type="button" class="action-icon-btn" onclick="apriModalPianifica(${c.id})" title="Pianifica ricontatto in calendario">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Pianifica</span>
      </button>
    `;
  }

  const stato = c.stato_ricontatto || calcolaStatoRicontattoClient(dr) || "futuro";
  const etichetta = formattaEtichettaRicontatto(dr, stato);
  const motivo = c.motivo_ricontatto || "Appuntamento in agenda";

  return `
    <div>
      <button type="button" class="callback-pill ${stato}" onclick="apriModalPianifica(${c.id})" title="Clicca per modificare o spostare l'orario">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>${escapeHtml(etichetta)}</span>
      </button>
      <span class="callback-reason-sub" title="${escapeHtml(motivo)}">${escapeHtml(motivo)}</span>
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
      <td>${creaCellaRicontatto(c)}</td>
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
          <button type="button" class="action-icon-btn" title="Pianifica / Sposta Ricontatto" onclick="apriModalPianifica(${c.id})">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
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

// --- TAB 2: CALENDARIO MENSILE INTERATTIVO & AGENDA OPERATIVA ---
function renderCalendarioTab() {
  const cal = state.calendarioContatori;
  document.getElementById("calCountScaduti").textContent = cal.scaduti || 0;
  document.getElementById("calCountOggi").textContent = cal.oggi || 0;
  document.getElementById("calCountFuturi").textContent = cal.futuri || 0;
  document.getElementById("calCountTotale").textContent = cal.totale || 0;

  renderCalendarMonthGrid();
  renderCalendarAgendaList();
}

function renderCalendarMonthGrid() {
  const year = state.calendarYear;
  const month = state.calendarMonth; // 0-11
  const label = document.getElementById("calMonthYearLabel");
  if (label) {
    label.textContent = `${NOMI_MESI_IT[month]} ${year}`;
  }

  const grid = document.getElementById("calendarDaysGrid");
  if (!grid) return;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Lunedì = 0 ... Domenica = 6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const oggiStr = formatDateISO(new Date());

  // Mappa appuntamenti per data YYYY-MM-DD
  const mapByDate = {};
  state.calendarioAppuntamenti.forEach(app => {
    const dStr = (app.data_ricontatto || "").slice(0, 10);
    if (!dStr) return;
    if (!mapByDate[dStr]) mapByDate[dStr] = [];
    mapByDate[dStr].push(app);
  });

  const cellsHtml = [];
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for (let idx = 0; idx < totalCells; idx++) {
    let cellYear = year;
    let cellMonth = month;
    let dayNum = 0;
    let isOutside = false;

    if (idx < startOffset) {
      isOutside = true;
      dayNum = prevMonthDays - startOffset + idx + 1;
      cellMonth = month - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear--;
      }
    } else if (idx >= startOffset + daysInMonth) {
      isOutside = true;
      dayNum = idx - (startOffset + daysInMonth) + 1;
      cellMonth = month + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear++;
      }
    } else {
      dayNum = idx - startOffset + 1;
    }

    const isoDate = `${cellYear}-${pad2(cellMonth + 1)}-${pad2(dayNum)}`;
    const isToday = isoDate === oggiStr;
    const isSelected = isoDate === state.calendarSelectedDate && state.agendaFilterMode === "giorno";
    const dayEvents = mapByDate[isoDate] || [];

    const maxVisible = 2;
    const visibleEvents = dayEvents.slice(0, maxVisible);
    const hiddenCount = dayEvents.length - visibleEvents.length;

    const eventsHtml = visibleEvents.map(ev => {
      const ora = (ev.data_ricontatto || "").slice(11, 16) || "09:00";
      const st = ev.stato_ricontatto || calcolaStatoRicontattoClient(ev.data_ricontatto) || "futuro";
      return `
        <div class="cal-event-chip ${st}" title="${escapeHtml(ora + " - " + ev.azienda + " (" + (ev.motivo_ricontatto || "Ricontatto") + ")")}">
          ${escapeHtml(ora)} ${escapeHtml(ev.azienda)}
        </div>
      `;
    }).join("");

    cellsHtml.push(`
      <div class="cal-day-cell ${isOutside ? "outside-month" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
           onclick="selezionaGiornoCalendario('${isoDate}')">
        <div class="cal-day-top">
          <span class="cal-day-num">${pad2(dayNum)}</span>
          ${isToday ? '<span class="cal-today-tag">OGGI</span>' : ""}
        </div>
        <div class="cal-day-events">
          ${eventsHtml}
          ${hiddenCount > 0 ? `<div class="cal-more-count">+${hiddenCount} altri</div>` : ""}
        </div>
      </div>
    `);
  }

  grid.innerHTML = cellsHtml.join("");
}

function selezionaGiornoCalendario(isoDate) {
  state.calendarSelectedDate = isoDate;
  const [y, m] = isoDate.split("-").map(Number);
  if (y && m) {
    state.calendarYear = y;
    state.calendarMonth = m - 1;
  }
  impostaFiltroAgenda("giorno");
}

function impostaFiltroAgenda(mode) {
  state.agendaFilterMode = mode;

  document.getElementById("btnAgendaFilterTutti").classList.toggle("active", mode === "tutti");
  document.getElementById("btnAgendaFilterOggiScaduti").classList.toggle("active", mode === "oggi_scaduti");
  document.getElementById("btnAgendaFilterGiorno").classList.toggle("active", mode === "giorno");

  const labelGiorno = document.getElementById("labelAgendaFilterGiorno");
  if (labelGiorno) {
    labelGiorno.textContent = state.calendarSelectedDate
      ? `Giorno (${formatDateIT(state.calendarSelectedDate)})`
      : "Giorno Selezionato";
  }

  renderCalendarioTab();
}

function renderCalendarAgendaList() {
  const container = document.getElementById("agendaCardsContainer");
  const emptyState = document.getElementById("emptyAgenda");
  const headerTitle = document.getElementById("agendaHeaderTitle");
  const headerEyebrow = document.getElementById("agendaHeaderEyebrow");

  let lista = [...state.calendarioAppuntamenti];

  // Applica eventuali filtri globali di ricerca / priorità
  if (state.filterPriorita) {
    lista = lista.filter(c => String(c.priorita || 2) === String(state.filterPriorita));
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    lista = lista.filter(c => {
      const campi = [c.azienda, c.referente, c.telefono, c.citta, c.regione, c.motivo_ricontatto, c.note]
        .map(v => (v || "").toLowerCase());
      return campi.some(t => t.includes(q));
    });
  }

  if (state.agendaFilterMode === "oggi_scaduti") {
    headerEyebrow.textContent = "PRIORITÀ IMMEDIATA";
    headerTitle.textContent = "APPUNTAMENTI DI OGGI & SCADUTI DA RICHIAMARE";
    lista = lista.filter(c => c.stato_ricontatto === "scaduto" || c.stato_ricontatto === "oggi");
  } else if (state.agendaFilterMode === "giorno") {
    headerEyebrow.textContent = "AGENDA GIORNALIERA";
    headerTitle.textContent = `APPUNTAMENTI DEL ${formatDateIT(state.calendarSelectedDate)}`;
    lista = lista.filter(c => (c.data_ricontatto || "").slice(0, 10) === state.calendarSelectedDate);
  } else {
    headerEyebrow.textContent = "AGENDA OPERATIVA COMPLETA";
    headerTitle.textContent = `TUTTI I RICONTATTI PIANIFICATI (${lista.length})`;
  }

  if (lista.length === 0) {
    container.innerHTML = "";
    container.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  container.classList.remove("hidden");
  emptyState.classList.add("hidden");

  container.innerHTML = lista.map(c => {
    const st = c.stato_ricontatto || calcolaStatoRicontattoClient(c.data_ricontatto) || "futuro";
    const dataParte = (c.data_ricontatto || "").slice(0, 10);
    const oraParte = (c.data_ricontatto || "").slice(11, 16) || "09:00";

    const badgeStatoHtml = st === "scaduto"
      ? '<span class="badge badge-danger"><span class="badge-dot"></span> Scaduto / In Ritardo</span>'
      : st === "oggi"
      ? '<span class="badge badge-warning"><span class="badge-dot"></span> Oggi in Scadenza</span>'
      : '<span class="badge badge-neutral"><span class="badge-dot"></span> Programmato</span>';

    const ultimaNota = c.note
      ? c.note.split("|").map(s => s.trim()).filter(Boolean).slice(-1)[0]
      : "Nessuna nota aggiuntiva";

    return `
      <div class="agenda-card ${st}">
        <div class="agenda-card-top">
          <div class="agenda-time-group">
            <span class="agenda-time-badge">${escapeHtml(formatDateIT(dataParte))} · ${escapeHtml(oraParte)}</span>
            ${badgeStatoHtml}
          </div>
          ${creaBottonePriorita(c)}
        </div>

        <div class="agenda-company-row">
          <span class="agenda-company-name" onclick="apriDrawer(${c.id})">
            #${c.id} &mdash; ${escapeHtml(c.azienda)}
          </span>
          <a href="tel:${escapeHtml(c.telefono)}" class="phone-link">
            <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            ${escapeHtml(c.telefono)}
          </a>
        </div>

        <div class="agenda-meta-grid">
          <span><strong>Referente:</strong> ${escapeHtml(c.referente || "Da rilevare")}</span>
          <span><strong>Località:</strong> ${escapeHtml(c.citta || "-")} ${c.regione ? "(" + escapeHtml(c.regione) + ")" : ""}</span>
          <span><strong>Ordini:</strong> <span class="mono">${formatEuro(c.totale_ordini)}</span></span>
        </div>

        <div class="agenda-reason-banner">
          <span class="agenda-reason-title">${escapeHtml(c.motivo_ricontatto || "Appuntamento telefonico")}</span>
          <span>${escapeHtml(ultimaNota)}</span>
        </div>

        <div class="agenda-card-actions">
          <div class="agenda-actions-left">
            <button type="button" class="btn btn-primary btn-xs" onclick="apriModalEsito(${c.id})">
              Chiama / Registra Esito
            </button>
            <button type="button" class="btn btn-outline btn-xs" onclick="spostaRicontattoPiuUnGiorno(${c.id})" title="Posticipa di +1 giorno mantenendo lo stesso orario">
              +1 Giorno
            </button>
            <button type="button" class="btn btn-outline btn-xs" onclick="apriModalPianifica(${c.id})">
              Sposta Orario
            </button>
          </div>
          <div class="agenda-actions-right">
            <button type="button" class="btn btn-success-outline btn-xs" onclick="segnaRicontattoCompletato(${c.id})" title="Segna il ricontatto come completato e rimuovilo dall'agenda">
              Segna Completato
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- TAB 3: ORDINI CONFERMATI + GRAFICO TOP CLIENTI ---
function renderOrdiniTab() {
  const tbody = document.getElementById("tbodyOrdini");
  const emptyState = document.getElementById("emptyOrdini");
  const table = document.getElementById("tableOrdini");
  const chartContainer = document.getElementById("chartTopClientiContainer");

  const list = getFilteredContacts("ordini_confermati");

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
            <button type="button" class="action-icon-btn" title="Pianifica Follow-up Ordine" onclick="apriModalPianifica(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
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

// --- TAB 4: ANAGRAFICA MASTER ---
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
        <td>${creaCellaRicontatto(c)}</td>
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
            <button type="button" class="action-icon-btn" title="Pianifica Ricontatto" onclick="apriModalPianifica(${c.id})">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
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

// --- TAB 5: CRUSCOTTO & ANALISI TERRITORIALE PER CITTÀ E REGIONE ---
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

// --- TAB 6: DUPLICATI & RIDONDANZE ---
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
// 4. AZIONI OPERATIVE: PRIORITÀ, ESITO + CALENDARIO, ORDINI (€), CRUD, MERGE
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

// --- MODALE RAPIDO PIANIFICA / SPOSTA RICONTATTO ---
function apriModalPianifica(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  state.selectedContact = c;
  document.getElementById("pianificaIdContatto").value = c.id;
  document.getElementById("modalPianificaAzienda").textContent = c.azienda;
  document.getElementById("modalPianificaTelefono").textContent = c.telefono;
  document.getElementById("modalPianificaAttuale").textContent = c.data_ricontatto
    ? `${c.data_ricontatto} (${c.motivo_ricontatto || "Pianificato"})`
    : "Nessuno programmato";

  const dr = String(c.data_ricontatto || "").trim();
  if (dr.length >= 16) {
    document.getElementById("pianificaInputData").value = dr.slice(0, 10);
    document.getElementById("pianificaInputOra").value = dr.slice(11, 16);
  } else {
    const def = calcolaSlotRapido("domani_mattina");
    document.getElementById("pianificaInputData").value = def.date;
    document.getElementById("pianificaInputOra").value = def.time;
  }

  document.getElementById("pianificaSelectMotivo").value =
    c.motivo_ricontatto || (c.esito === "Interessato (Ordine preso)" ? "Follow-up nuovo ordine" : "Appuntamento concordato");
  document.getElementById("pianificaSelectPriorita").value = String(c.priorita || 1);
  document.getElementById("pianificaInputNota").value = "";

  document.getElementById("modalPianificaBackdrop").classList.add("open");
}

function chiudiModalPianifica() {
  document.getElementById("modalPianificaBackdrop").classList.remove("open");
}

async function salvaFormPianifica(e) {
  e.preventDefault();
  const idContatto = parseInt(document.getElementById("pianificaIdContatto").value, 10);
  const dataVal = document.getElementById("pianificaInputData").value.trim();
  const oraVal = document.getElementById("pianificaInputOra").value.trim() || "10:00";
  const motivo = document.getElementById("pianificaSelectMotivo").value;
  const priorita = parseInt(document.getElementById("pianificaSelectPriorita").value, 10) || 2;
  const notaExtra = document.getElementById("pianificaInputNota").value.trim();

  if (!dataVal) {
    showToast("Seleziona una data valida per il ricontatto", "error");
    return;
  }

  const dataRicontattoCompleta = `${dataVal} ${oraVal}`;
  await inviaPianificazioneBackend(idContatto, dataRicontattoCompleta, motivo, priorita, notaExtra);
  chiudiModalPianifica();
}

async function rimuoviRicontattoDaModalePianifica() {
  const idContatto = parseInt(document.getElementById("pianificaIdContatto").value, 10);
  if (!idContatto) return;
  await inviaPianificazioneBackend(idContatto, "", "", null, "Ricontatto rimosso manualmente");
  chiudiModalPianifica();
}

async function spostaRicontattoPiuUnGiorno(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;
  const dr = String(c.data_ricontatto || "").trim();
  const baseDate = dr.length >= 10 ? dr.slice(0, 10) : formatDateISO(new Date());
  const baseTime = dr.length >= 16 ? dr.slice(11, 16) : "10:00";
  const nuovoSlot = calcolaSlotRapido("piu_1_giorno", baseDate, baseTime);

  await inviaPianificazioneBackend(
    idContatto,
    `${nuovoSlot.date} ${nuovoSlot.time}`,
    c.motivo_ricontatto || "Appuntamento posticipato (+1g)",
    c.priorita || 1,
    "Posticipato di +1 giorno"
  );
}

async function segnaRicontattoCompletato(idContatto) {
  await inviaPianificazioneBackend(idContatto, "", "", null, "Appuntamento in agenda completato");
}

async function inviaPianificazioneBackend(idContatto, dataRicontatto, motivoRicontatto, priorita, notaExtra) {
  try {
    const res = await fetch(`${API_BASE}/api/contatti/${idContatto}/ricontatto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_ricontatto: dataRicontatto,
        motivo_ricontatto: motivoRicontatto,
        priorita,
        nota_extra: notaExtra
      })
    });
    const json = await res.json();
    if (json.ok) {
      if (dataRicontatto) {
        showToast(`Appuntamento fissato per ${dataRicontatto}`, "success");
      } else {
        showToast("Appuntamento completato / rimosso dal calendario", "success");
      }
      await loadData();
      return;
    }
    showToast(json.errore || "Errore salvataggio ricontatto", "error");
  } catch (err) {
    const c = state.contatti.find(x => x.id === idContatto);
    if (c) {
      c.data_ricontatto = dataRicontatto;
      c.motivo_ricontatto = dataRicontatto ? motivoRicontatto : "";
      c.stato_ricontatto = calcolaStatoRicontattoClient(dataRicontatto);
      if (dataRicontatto && c.esito !== "Interessato (Ordine preso)") {
        c.esito = "Da richiamare";
      }
      if (priorita) c.priorita = priorita;
      salvaStorageLocale();
      calcolaStatisticheLocali();
      renderAll();
      showToast("Calendario aggiornato in locale", "success");
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

// --- MODALE REGISTRA ESITO CHIAMATA (+ ORDINE € + CALENDARIZZA RICONTATTO) ---
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

  // Campi ricontatto (vuoti di default così se l'operatore conclude senza fissare una nuova data, il vecchio appuntamento si chiude)
  document.getElementById("esitoInputDataRicontatto").value = "";
  document.getElementById("esitoInputOraRicontatto").value = "";
  document.getElementById("esitoSelectMotivoRicontatto").value = "";
  document.getElementById("boxCalendarizzaEsito").classList.remove("highlight-schedule");

  aggiornaVisibilitaBoxOrdineEsito();
  document.getElementById("modalEsitoBackdrop").classList.add("open");
}

function impostaEsitoRapidoNonRisponde() {
  document.getElementById("selectChiamato").value = "No";
  document.getElementById("selectEsito").value = "Da richiamare";
  document.getElementById("esitoSelectMotivoRicontatto").value = "Non risponde - Riprovare";
  aggiornaVisibilitaBoxOrdineEsito();

  const slot = calcolaSlotRapido("tra_2_ore");
  document.getElementById("esitoInputDataRicontatto").value = slot.date;
  document.getElementById("esitoInputOraRicontatto").value = slot.time;

  const box = document.getElementById("boxCalendarizzaEsito");
  box.classList.add("highlight-schedule");
  document.getElementById("esitoInputDataRicontatto").focus();
  showToast("Impostato 'Non risponde -> Richiama tra 2 ore': premi Salva per confermare", "success");
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

  const dataRic = document.getElementById("esitoInputDataRicontatto").value.trim();
  const oraRic = document.getElementById("esitoInputOraRicontatto").value.trim() || "10:00";
  const motivoRic = document.getElementById("esitoSelectMotivoRicontatto").value.trim();
  const dataRicontattoCompleta = dataRic ? `${dataRic} ${oraRic}` : "";

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
        priorita,
        data_ricontatto: dataRicontattoCompleta,
        motivo_ricontatto: dataRicontattoCompleta ? (motivoRic || "Appuntamento concordato") : ""
      })
    });
    const json = await res.json();
    if (json.ok) {
      if (dataRicontattoCompleta) {
        showToast(`Esito salvato e ricontatto fissato per ${dataRicontattoCompleta}`, "success");
      } else {
        showToast("Esito telefonata salvato con successo", "success");
      }
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

// --- SLIDE-OVER DRAWER CON RICONTATTO, STORICO ORDINI (€) E TIMELINE NOTE ---
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

  document.getElementById("drawerRicontatto").innerHTML = creaCellaRicontatto(c);
  document.getElementById("drawerMotivoRicontatto").textContent =
    c.motivo_ricontatto || (c.data_ricontatto ? "Appuntamento concordato" : "Nessuno");

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
  const headers = ["ID", "Priorita", "Azienda", "Referente", "Telefono", "Citta", "Regione", "Chiamato", "Esito", "Data_Ricontatto", "Motivo_Ricontatto", "Numero_Ordini", "Totale_Ordini_EUR"];
  const rows = state.contatti.map(c => [
    c.id, c.priorita, `"${(c.azienda || "").replace(/"/g, '""')}"`, `"${(c.referente || "").replace(/"/g, '""')}"`,
    `"${c.telefono || ""}"`, `"${c.citta || ""}"`, `"${c.regione || ""}"`, c.chiamato, `"${c.esito || ""}"`,
    `"${c.data_ricontatto || ""}"`, `"${(c.motivo_ricontatto || "").replace(/"/g, '""')}"`,
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
      showToast("Dataset demo completo (ordini, ricontatti in calendario e duplicati) caricato", "success");
      await loadData();
      return;
    }
  } catch (err) {
    localStorage.removeItem("noga_crm_demo_contatti_v3");
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
    showToast("Sincronizzazione database e calendario completata", "success");
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

  // Navigazione Mese Calendario (< Mese Prec. | Vai a Oggi | Mese Succ. >)
  document.getElementById("btnCalPrevMonth").addEventListener("click", () => {
    state.calendarMonth--;
    if (state.calendarMonth < 0) {
      state.calendarMonth = 11;
      state.calendarYear--;
    }
    renderCalendarioTab();
  });

  document.getElementById("btnCalNextMonth").addEventListener("click", () => {
    state.calendarMonth++;
    if (state.calendarMonth > 11) {
      state.calendarMonth = 0;
      state.calendarYear++;
    }
    renderCalendarioTab();
  });

  document.getElementById("btnCalToday").addEventListener("click", () => {
    const oggi = new Date();
    state.calendarYear = oggi.getFullYear();
    state.calendarMonth = oggi.getMonth();
    state.calendarSelectedDate = formatDateISO(oggi);
    impostaFiltroAgenda("giorno");
  });

  // Filtri rapidi Agenda Operativa
  document.getElementById("btnAgendaFilterTutti").addEventListener("click", () => impostaFiltroAgenda("tutti"));
  document.getElementById("btnAgendaFilterOggiScaduti").addEventListener("click", () => impostaFiltroAgenda("oggi_scaduti"));
  document.getElementById("btnAgendaFilterGiorno").addEventListener("click", () => impostaFiltroAgenda("giorno"));

  document.getElementById("calPillScaduti").addEventListener("click", () => impostaFiltroAgenda("oggi_scaduti"));
  document.getElementById("calPillOggi").addEventListener("click", () => {
    state.calendarSelectedDate = formatDateISO(new Date());
    impostaFiltroAgenda("giorno");
  });
  document.getElementById("calPillFuturi").addEventListener("click", () => impostaFiltroAgenda("tutti"));

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

  // Modale Registra Esito Chiamata + Pulsante Rapido Non Risponde + Slot 1-Click + Chip Note Rapide
  document.getElementById("modalEsitoCloseBtn").addEventListener("click", chiudiModalEsito);
  document.getElementById("btnAnnullaEsito").addEventListener("click", chiudiModalEsito);
  document.getElementById("selectEsito").addEventListener("change", aggiornaVisibilitaBoxOrdineEsito);
  document.getElementById("btnQuickNonRisponde").addEventListener("click", impostaEsitoRapidoNonRisponde);
  document.getElementById("btnEsitoRimuoviRicontatto").addEventListener("click", () => {
    document.getElementById("esitoInputDataRicontatto").value = "";
    document.getElementById("esitoInputOraRicontatto").value = "";
    document.getElementById("esitoSelectMotivoRicontatto").value = "";
  });
  document.getElementById("formRegistraEsito").addEventListener("submit", salvaEsitoChiamata);

  // Modale Pianifica Ricontatto Rapido
  document.getElementById("modalPianificaCloseBtn").addEventListener("click", chiudiModalPianifica);
  document.getElementById("btnAnnullaPianifica").addEventListener("click", chiudiModalPianifica);
  document.getElementById("btnPianificaRimuovi").addEventListener("click", rimuoviRicontattoDaModalePianifica);
  document.getElementById("formPianificaRicontatto").addEventListener("submit", salvaFormPianifica);

  // Slot Rapidi 1-Click (Condivisi tra Modale Esito e Modale Pianifica)
  document.querySelectorAll(".slot-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const prefix = btn.dataset.targetPrefix; // 'esito' | 'pianifica'
      const slotKey = btn.dataset.quickSlot;
      const inputData = document.getElementById(prefix === "esito" ? "esitoInputDataRicontatto" : "pianificaInputData");
      const inputOra = document.getElementById(prefix === "esito" ? "esitoInputOraRicontatto" : "pianificaInputOra");

      const res = calcolaSlotRapido(slotKey, inputData.value, inputOra.value);
      inputData.value = res.date;
      inputOra.value = res.time;

      if (prefix === "esito") {
        const motivoSel = document.getElementById("esitoSelectMotivoRicontatto");
        if (!motivoSel.value) {
          motivoSel.value = document.getElementById("selectChiamato").value === "No"
            ? "Non risponde - Riprovare"
            : "Appuntamento concordato";
        }
        if (document.getElementById("selectEsito").value !== "Interessato (Ordine preso)") {
          document.getElementById("selectEsito").value = "Da richiamare";
          aggiornaVisibilitaBoxOrdineEsito();
        }
      }
    });
  });

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

  document.getElementById("drawerBtnRegistraChiamata").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    chiudiDrawer();
    apriModalEsito(id);
  });

  document.getElementById("drawerBtnPianifica").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    chiudiDrawer();
    apriModalPianifica(id);
  });

  document.getElementById("drawerBtnModificaContatto").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    chiudiDrawer();
    apriModalModifica(id);
  });

  document.getElementById("drawerBtnNuovoOrdine").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    chiudiDrawer();
    apriModalNuovoOrdine(id);
  });

  document.getElementById("drawerBtnElimina").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    richiediEliminazione(id);
  });

  // Chiusura modali e drawer tramite tasto ESC (Accessibilità WCAG AA)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      chiudiModalEsito();
      chiudiModalPianifica();
      chiudiModalNuovo(false);
      chiudiModalNuovoOrdine();
      chiudiModalImport();
      chiudiModalElimina();
      chiudiDrawer();
    }
  });
}

// ==============================================================================
// 6. SISTEMA DI NOTIFICA TOAST
// ==============================================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 3400);
}
