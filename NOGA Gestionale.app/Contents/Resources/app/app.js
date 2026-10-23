/**
 * NOGA ROMA - MOTORE APPLICATIVO NATIVO macOS & GESTIONALE B2B
 * Funzionamento Ibrido Autonomo (In-App Persistence + SQLite REST Sync):
 * Funziona al 100% sia come App Nativa macOS autonoma (zero server esterno richiesto),
 * sia sincronizzato con app_server.py (SQLite).
 * Zero librerie esterne, zero colori hardcoded, zero emoji.
 */

const MAPPA_CITTA_REGIONE_CLIENT = {
  roma: "Lazio", latina: "Lazio", frosinone: "Lazio", viterbo: "Lazio", rieti: "Lazio",
  civitavecchia: "Lazio", tivoli: "Lazio", velletri: "Lazio", pomezia: "Lazio",
  milano: "Lombardia", brescia: "Lombardia", bergamo: "Lombardia", monza: "Lombardia",
  como: "Lombardia", varese: "Lombardia", pavia: "Lombardia", cremona: "Lombardia",
  mantova: "Lombardia", lecco: "Lombardia", lodi: "Lombardia", sondrio: "Lombardia",
  vigevano: "Lombardia", busto: "Lombardia", legnano: "Lombardia", desenzano: "Lombardia",
  napoli: "Campania", salerno: "Campania", caserta: "Campania", avellino: "Campania",
  benevento: "Campania", aversa: "Campania", sorrento: "Campania", capri: "Campania",
  amalfi: "Campania", pozzuoli: "Campania",
  torino: "Piemonte", novara: "Piemonte", alessandria: "Piemonte", asti: "Piemonte",
  cuneo: "Piemonte", biella: "Piemonte", vercelli: "Piemonte", alba: "Piemonte",
  firenze: "Toscana", prato: "Toscana", livorno: "Toscana", arezzo: "Toscana",
  pisa: "Toscana", pistoia: "Toscana", lucca: "Toscana", grosseto: "Toscana",
  siena: "Toscana", viareggio: "Toscana", "forte dei marmi": "Toscana", empoli: "Toscana",
  bologna: "Emilia-Romagna", modena: "Emilia-Romagna", parma: "Emilia-Romagna",
  "reggio emilia": "Emilia-Romagna", ravenna: "Emilia-Romagna", rimini: "Emilia-Romagna",
  ferrara: "Emilia-Romagna", forli: "Emilia-Romagna", "forlì": "Emilia-Romagna",
  cesena: "Emilia-Romagna", piacenza: "Emilia-Romagna", riccione: "Emilia-Romagna",
  venezia: "Veneto", verona: "Veneto", padova: "Veneto", vicenza: "Veneto",
  treviso: "Veneto", rovigo: "Veneto", belluno: "Veneto", montebelluna: "Veneto",
  mestre: "Veneto", cortina: "Veneto",
  bari: "Puglia", taranto: "Puglia", foggia: "Puglia", lecce: "Puglia",
  brindisi: "Puglia", barletta: "Puglia", andria: "Puglia", trani: "Puglia",
  palermo: "Sicilia", catania: "Sicilia", messina: "Sicilia", siracusa: "Sicilia",
  ragusa: "Sicilia", trapani: "Sicilia", agrigento: "Sicilia", taormina: "Sicilia",
  genova: "Liguria", "la spezia": "Liguria", savona: "Liguria", imperia: "Liguria",
  sanremo: "Liguria", portofino: "Liguria",
  ancona: "Marche", pesaro: "Marche", urbino: "Marche", macerata: "Marche",
  fermo: "Marche", "ascoli piceno": "Marche", "civitanova marche": "Marche",
  "porto sant'elpidio": "Marche", montegranaro: "Marche",
  "l'aquila": "Abruzzo", pescara: "Abruzzo", chieti: "Abruzzo", teramo: "Abruzzo",
  perugia: "Umbria", terni: "Umbria", assisi: "Umbria",
  trieste: "Friuli-Venezia Giulia", udine: "Friuli-Venezia Giulia",
  pordenone: "Friuli-Venezia Giulia", gorizia: "Friuli-Venezia Giulia",
  trento: "Trentino-Alto Adige", bolzano: "Trentino-Alto Adige",
  catanzaro: "Calabria", "reggio calabria": "Calabria", cosenza: "Calabria", crotone: "Calabria",
  cagliari: "Sardegna", sassari: "Sardegna", olbia: "Sardegna", nuoro: "Sardegna",
  potenza: "Basilicata", matera: "Basilicata",
  campobasso: "Molise", isernia: "Molise",
  aosta: "Valle d'Aosta"
};

const NOMI_MESI_IT = [
  "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"
];

const STORAGE_KEY_CONTATTI = "noga_roma_prod_db_v5";
const LEGACY_STORAGE_KEY = "noga_roma_macos_db_v3";

const AZIENDE_DEMO_OBSOLETE_CLIENT = new Set([
  "calzature brera luxury s.r.l.",
  "atelier del passo condotti",
  "toscana shoes & leather s.n.c.",
  "partenope moda calzature s.r.l.",
  "galleria sabauda footwear",
  "emilia boutique calzature s.a.s.",
  "san marco luxury shoes",
  "laguna glamour shoes",
  "bari moda & pelle s.r.l.",
  "adriatica showroom s.r.l.",
  "via libertà concept store",
  "trinacria luxury concept",
  "lanterna calzature s.n.c.",
  "distretto marche concept store",
  "brera luxury milano (showroom)",
  "atelier del passo condotti srl",
  "atelier del passo condotti s.r.l.",
  "calzature rossi s.r.l.",
  "boutique della scarpa",
  "moda & stile s.n.c.",
  "grandi magazzini sud",
  "step बाय step torino",
  "calzature montenapoleone srl",
  "boutique piazza navona",
  "pelletteria & scarpe ponte vecchio"
]);

function filtraContattiNonDemo(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(c => {
    if (!c || typeof c !== "object") return false;
    const nome = String(c.azienda || "").trim().toLowerCase();
    return nome && !AZIENDE_DEMO_OBSOLETE_CLIENT.has(nome);
  });
}

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
  calendarMonth: oggiInit.getMonth(),
  calendarSelectedDate: formatDateISO(oggiInit),
  agendaFilterMode: "tutti",
  selectedContact: null,
  pendingDeleteId: null,
  isFormDirty: false,
  isApiAvailable: false,
  deletedTelefoni: new Set(JSON.parse(localStorage.getItem("noga_deleted_telefoni") || "[]"))
};
window.state = state;

const API_BASE = window.location.origin.startsWith("http") ? "" : "http://127.0.0.1:8080";

function tracciaTelefonoEliminato(telefono) {
  const norm = normalizzaTelefonoClient(telefono);
  if (norm) {
    if (!state.deletedTelefoni) state.deletedTelefoni = new Set();
    state.deletedTelefoni.add(norm);
    try {
      localStorage.setItem("noga_deleted_telefoni", JSON.stringify([...state.deletedTelefoni]));
    } catch (e) {}
  }
}

// Hook globale richiamato da macOS Cocoa/WebKit al risveglio dallo standby (NSWorkspaceDidWakeNotification)
window.__nogaRipristinaDaDisco = function(datiDisco) {
  if (Array.isArray(datiDisco)) {
    const puliti = filtraContattiNonDemo(datiDisco);
    window.__NOGA_DISK_DB__ = puliti;
    state.contatti = puliti.map(arricchisciContattoClient);
    salvaStorageLocale();
    ricalcolaTuttoInLocale();
    renderAll();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupEventListeners();
  caricaDatiDefaultLocali();
  renderAll();
  loadData();

  // Protezione anti-standby macOS: salva sempre su disco prima della sospensione e ripristina al risveglio
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      salvaStorageLocale();
    } else if (document.visibilityState === "visible") {
      const salvati = ottieniSnapshotLocaleSalvato();
      if (salvati && salvati.length > 0 && (!state.contatti || state.contatti.length === 0)) {
        state.contatti = salvati.map(arricchisciContattoClient);
      }
      ricalcolaTuttoInLocale();
      renderAll();
    }
  });

  window.addEventListener("pagehide", () => salvaStorageLocale());
  window.addEventListener("beforeunload", (e) => {
    salvaStorageLocale();
    const openModals = document.querySelectorAll(".modal-backdrop.open");
    if (state.isFormDirty || openModals.length > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
});

// ==============================================================================
// 1. UTILITY DI FORMATTAZIONE, DATE E DOMINIO PURO
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
  const num = Math.abs(Number(valore) || 0);
  const sign = (Number(valore) || 0) < 0 ? "-" : "";
  const parts = num.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}€ ${intPart},${parts[1]}`;
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

function getNowTimestampStr() {
  const now = new Date();
  return `${formatDateISO(now)} ${formatTimeISO(now)}`;
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

  if (dataParte < oggiStr) return "scaduto";
  if (dataParte === oggiStr) {
    if (dr.length >= 16 && dr < adessoStr) return "scaduto";
    return "oggi";
  }
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
    const day = target.getDay();
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

function accodaNotaClient(notaEsistente, nuovaNota) {
  const es = String(notaEsistente || "").trim();
  const nv = String(nuovaNota || "").trim();
  if (!nv) return es;
  if (!es) return nv;
  const chunksEs = es.split(/\s*\|\s*/).map(c => c.trim()).filter(Boolean);
  const chunksNv = nv.split(/\s*\|\s*/).map(c => c.trim()).filter(Boolean);
  const visti = new Set(chunksEs);
  const risultato = [...chunksEs];
  for (const c of chunksNv) {
    if (!visti.has(c)) {
      risultato.push(c);
      visti.add(c);
    }
  }
  return risultato.join(" | ");
}

function parseImportoClient(valore) {
  if (valore === null || valore === undefined || valore === "") return 0.0;
  if (typeof valore === "number") return Number(valore.toFixed(2));
  let s = String(valore).replace(/[€$£\sA-Za-z]/g, "");
  if (!s) return 0.0;
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parti = s.split(".");
    if (parti.length > 2 || (parti.length === 2 && parti[1].length === 3 && /^\d{3}$/.test(parti[1]))) {
      s = s.replace(/\./g, "");
    }
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0.0 : Number(n.toFixed(2));
}

function parsePrioritaClient(valore, def = 2) {
  if (valore === null || valore === undefined) return def;
  const s = String(valore).trim().toLowerCase();
  if (["1", "alta", "massima", "urgente", "high"].includes(s)) return 1;
  if (["2", "normale", "media", "normal"].includes(s)) return 2;
  if (["3", "bassa", "low"].includes(s)) return 3;
  return def;
}

// ==============================================================================
// 2. MOTORE DATI IBRIDO (AUTONOMO NATIVO macOS + SINCRONIZZAZIONE SQLITE)
// ==============================================================================

async function fetchConTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function loadData(options = {}) {
  const postMutazioneServer = Boolean(options && options.postMutazioneServer);

  // 1. Se non proveniamo da una mutazione appena eseguita sul server, salva in anticipo lo stato in memoria
  if (!postMutazioneServer && Array.isArray(state.contatti) && state.contatti.length > 0) {
    salvaStorageLocale();
  }

  const snapshotLocale = ottieniSnapshotLocaleSalvato();

  try {
    const res = await fetchConTimeout(`${API_BASE}/api/contatti`, {}, 8000);
    if (!res.ok) throw new Error("Server non attivo");
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      let listaServer = filtraContattiNonDemo(json.data);

      // Sincronizza contatti salvati localmente nel DB SQLite (es. aggiunti offline o durante standby)
      if (!postMutazioneServer && snapshotLocale && Array.isArray(snapshotLocale) && snapshotLocale.length > 0) {
        try {
          await fetchConTimeout(`${API_BASE}/api/sincronizza-snapshot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contatti: snapshotLocale,
              eliminati: Array.from(state.deletedTelefoni || [])
            })
          }, 15000);
          if (state.deletedTelefoni) state.deletedTelefoni.clear();
          try {
            localStorage.removeItem("noga_deleted_telefoni");
          } catch (_) {}
          const resSync = await fetchConTimeout(`${API_BASE}/api/contatti`, {}, 8000);
          const jsonSync = await resSync.json();
          if (jsonSync.ok && Array.isArray(jsonSync.data)) {
            listaServer = filtraContattiNonDemo(jsonSync.data);
          }
        } catch (syncErr) {
          const telefoniServer = new Set(listaServer.map(c => normalizzaTelefonoClient(c.telefono)));
          const mancanti = snapshotLocale.filter(c => {
            const tel = normalizzaTelefonoClient(c.telefono);
            return tel && !telefoniServer.has(tel);
          });
          listaServer = [...listaServer, ...mancanti];
        }
      }

      // Se un contatto è presente nel database o nello snapshot, rimuovilo dai telefoni eliminati
      if (state.deletedTelefoni && state.deletedTelefoni.size > 0) {
        listaServer.forEach(c => {
          const tel = normalizzaTelefonoClient(c.telefono);
          if (tel && state.deletedTelefoni.has(tel)) {
            state.deletedTelefoni.delete(tel);
          }
        });
        if (Array.isArray(snapshotLocale)) {
          snapshotLocale.forEach(c => {
            const tel = normalizzaTelefonoClient(c.telefono);
            if (tel && state.deletedTelefoni.has(tel)) {
              state.deletedTelefoni.delete(tel);
            }
          });
        }
        try {
          localStorage.setItem("noga_deleted_telefoni", JSON.stringify([...state.deletedTelefoni]));
        } catch (_) {}
      }

      // Preserva e fondi lo storico ordini dettagliato dai contatti locali se presente
      if (snapshotLocale && Array.isArray(snapshotLocale) && snapshotLocale.length > 0) {
        const mappaOrdiniLocali = new Map();
        snapshotLocale.forEach(c => {
          const tel = normalizzaTelefonoClient(c.telefono);
          if (tel && Array.isArray(c.ordini_storico) && c.ordini_storico.length > 0) {
            mappaOrdiniLocali.set(tel, c.ordini_storico);
          }
        });
        listaServer = listaServer.map(c => {
          const tel = normalizzaTelefonoClient(c.telefono);
          const locali = mappaOrdiniLocali.get(tel);
          if (Array.isArray(locali) && locali.length > 0) {
            const serverOrdini = Array.isArray(c.ordini_storico) ? c.ordini_storico : [];
            const firme = new Set(serverOrdini.map(o => `${Number(o.importo || 0).toFixed(2)}_${String(o.data_ordine || '').trim()}_${String(o.note_ordine || '').trim()}`));
            const uniti = [...serverOrdini];
            locali.forEach(loc => {
              const sig = `${Number(loc.importo || 0).toFixed(2)}_${String(loc.data_ordine || '').trim()}_${String(loc.note_ordine || '').trim()}`;
              if (!firme.has(sig)) {
                uniti.push(loc);
                firme.add(sig);
              }
            });
            return { ...c, ordini_storico: uniti };
          }
          return c;
        });
      }

      state.contatti = listaServer.map(arricchisciContattoClient);
      state.isApiAvailable = true;
      salvaStorageLocale();
      aggiornaBadgeStatoDb(true);
      ricalcolaContatoriCalendarioLocali();
      calcolaDuplicatiLocali();
      calcolaStatisticheLocali();
      renderAll();
      if (state.selectedContact && document.getElementById("detailDrawer").classList.contains("open")) {
        const aggiornato = state.contatti.find(c => c.id === state.selectedContact.id);
        if (aggiornato) apriDrawer(aggiornato.id);
      }
      await Promise.all([caricaStatistiche(), caricaCalendario(), caricaDuplicati()]);
    }
  } catch (err) {
    state.isApiAvailable = false;
    aggiornaBadgeStatoDb(false);
    const salvati = ottieniSnapshotLocaleSalvato();
    if (Array.isArray(salvati) && (salvati.length > 0 || !Array.isArray(state.contatti))) {
      state.contatti = salvati.map(arricchisciContattoClient);
    }
    ricalcolaTuttoInLocale();
    renderAll();
  }
}

async function caricaStatistiche() {
  if (!state.isApiAvailable) {
    calcolaStatisticheLocali();
    return;
  }
  try {
    const res = await fetchConTimeout(`${API_BASE}/api/statistiche`);
    const json = await res.json();
    if (json.ok && json.data) {
      state.statistiche = json.data;
      renderRibbonKpi();
      renderCruscottoTab();
      return;
    }
  } catch (err) {
    // Fallback al calcolo locale
  }
  calcolaStatisticheLocali();
}

async function caricaCalendario() {
  if (!state.isApiAvailable) {
    ricalcolaContatoriCalendarioLocali();
    return;
  }
  try {
    const res = await fetchConTimeout(`${API_BASE}/api/calendario`);
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.calendarioAppuntamenti = json.data.map(arricchisciContattoClient);
      if (json.contatori) {
        state.calendarioContatori = json.contatori;
      } else {
        ricalcolaContatoriCalendarioLocali();
      }
      renderCalendarioTab();
      renderRibbonKpi();
      return;
    }
  } catch (err) {
    // Fallback al calcolo locale
  }
  ricalcolaContatoriCalendarioLocali();
}

async function caricaDuplicati() {
  if (!state.isApiAvailable) {
    calcolaDuplicatiLocali();
    return;
  }
  try {
    const res = await fetchConTimeout(`${API_BASE}/api/duplicati`);
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      state.duplicati = json.data;
      renderDuplicatiTab();
      return;
    }
  } catch (err) {
    // Fallback al calcolo locale
  }
  calcolaDuplicatiLocali();
}

function arricchisciContattoClient(c) {
  const dr = String(c.data_ricontatto || "").trim();
  const tot = Number(c.totale_ordini) || 0;
  const num = Number(c.numero_ordini) || (tot > 0 ? 1 : 0);
  let storico = Array.isArray(c.ordini_storico) ? c.ordini_storico : [];
  if (storico.length === 0 && tot > 0) {
    storico = [
      {
        id: c.id * 100 + 1,
        contatto_id: c.id,
        importo: tot,
        note_ordine: "Ordine iniziale registrato in anagrafica",
        data_ordine: c.ultimo_ordine || c.data_aggiornamento || getNowTimestampStr()
      }
    ];
  }
  return {
    ...c,
    priorita: Number(c.priorita) || 2,
    totale_ordini: tot,
    numero_ordini: num,
    ordini_storico: storico,
    regione: c.regione || deduciRegioneClient(c.citta),
    data_ricontatto: dr,
    motivo_ricontatto: String(c.motivo_ricontatto || "").trim(),
    stato_ricontatto: calcolaStatoRicontattoClient(dr)
  };
}

function ricalcolaTuttoInLocale() {
  state.contatti = state.contatti.map(arricchisciContattoClient);
  salvaStorageLocale();
  ricalcolaContatoriCalendarioLocali();
  calcolaDuplicatiLocali();
  calcolaStatisticheLocali();
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

function aggiornaBadgeStatoDb(serverAttivo) {
  const el = document.getElementById("dbStatusIndicator");
  if (!el) return;
  el.className = "db-status-indicator online";
  if (serverAttivo) {
    el.innerHTML = '<span class="status-dot"></span> Motore SQLite Attivo (crm_ingrosso.db)';
  } else {
    el.innerHTML = '<span class="status-dot"></span> App Nativa macOS Attiva (Database Locale)';
  }
}

function ottieniSnapshotLocaleSalvato() {
  let daDisco = [];
  if (window.__NOGA_DISK_DB__ && Array.isArray(window.__NOGA_DISK_DB__)) {
    daDisco = filtraContattiNonDemo(window.__NOGA_DISK_DB__);
  }

  let daLocalStorage = [];
  try {
    const salvati = localStorage.getItem(STORAGE_KEY_CONTATTI);
    if (salvati) {
      const parsed = JSON.parse(salvati);
      if (Array.isArray(parsed)) {
        daLocalStorage = filtraContattiNonDemo(parsed);
      }
    } else {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) {
          daLocalStorage = filtraContattiNonDemo(parsedLegacy);
        }
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
  } catch (e) {
    // Ignora JSON corrotto
  }

  if (daDisco.length === 0 && daLocalStorage.length === 0) {
    return [];
  }
  if (daDisco.length > 0 && daLocalStorage.length === 0) {
    return daDisco;
  }
  if (daLocalStorage.length > 0 && daDisco.length === 0) {
    return daLocalStorage;
  }

  // Se presenti entrambi gli snapshot, fondi per numero di telefono
  // dando priorità alle schede con esiti registrati (chiamato="Sì") e note più ricche
  const mappa = new Map();
  daDisco.forEach(c => {
    const tel = normalizzaTelefonoClient(c.telefono);
    if (tel) mappa.set(tel, { ...c });
  });

  daLocalStorage.forEach(c => {
    const tel = normalizzaTelefonoClient(c.telefono);
    if (!tel) return;
    if (!mappa.has(tel)) {
      mappa.set(tel, { ...c });
    } else {
      const esistente = mappa.get(tel);
      const fuso = { ...esistente };

      if (c.chiamato === "Sì") fuso.chiamato = "Sì";
      if (c.esito && c.esito !== "In attesa") fuso.esito = c.esito;

      if (c.note && c.note !== esistente.note) {
        fuso.note = accodaNotaClient(esistente.note, c.note);
      }

      if (c.data_ricontatto && !esistente.data_ricontatto) {
        fuso.data_ricontatto = c.data_ricontatto;
        fuso.motivo_ricontatto = c.motivo_ricontatto || fuso.motivo_ricontatto;
      }

      if (Number(c.totale_ordini || 0) > Number(esistente.totale_ordini || 0)) {
        fuso.totale_ordini = c.totale_ordini;
        fuso.numero_ordini = Math.max(c.numero_ordini || 0, esistente.numero_ordini || 0);
      }
      if (Array.isArray(c.ordini_storico) && c.ordini_storico.length > (esistente.ordini_storico?.length || 0)) {
        fuso.ordini_storico = c.ordini_storico;
      }

      if (c.referente && !esistente.referente) fuso.referente = c.referente;
      if (c.citta && !esistente.citta) fuso.citta = c.citta;
      if (c.regione && !esistente.regione) fuso.regione = c.regione;

      mappa.set(tel, fuso);
    }
  });

  return Array.from(mappa.values());
}

function caricaDatiDefaultLocali() {
  const salvati = ottieniSnapshotLocaleSalvato();
  state.contatti = Array.isArray(salvati) ? salvati.map(arricchisciContattoClient) : [];
  salvaStorageLocale();
  ricalcolaTuttoInLocale();
}

function salvaStorageLocale() {
  const listaPulita = filtraContattiNonDemo(state.contatti || []);
  state.contatti = listaPulita;
  const serialized = JSON.stringify(listaPulita);
  window.__NOGA_DISK_DB__ = listaPulita;
  try {
    localStorage.setItem(STORAGE_KEY_CONTATTI, serialized);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (e) {
    // Storage non disponibile
  }
  try {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nogaSaveDisk) {
      window.webkit.messageHandlers.nogaSaveDisk.postMessage(serialized);
    }
  } catch (e) {
    // Bridge nativo non attivo
  }
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
        motivo = t1 && t1 === t2
          ? `Stesso Numero di Telefono (${t1})`
          : "Ragione Sociale Coincidente";
      }
    }
    if (membri.length > 1) {
      usati.add(i);
      membri.sort((x, y) => (Number(y.totale_ordini) || 0) - (Number(x.totale_ordini) || 0) || x.id - y.id);
      gruppi.push({
        id_gruppo: `DUP-${membri[0].id}`,
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
  const da_contattare = state.contatti.filter(
    c => c.chiamato === "No" || c.esito === "Da richiamare" || Boolean(c.data_ricontatto)
  ).length;
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
      if (c.chiamato !== "No" && c.esito !== "Da richiamare" && !c.data_ricontatto) return false;
      // Se è stato pianificato un ricontatto futuro rispetto ad ora (es. tra 2 ore o nei prossimi giorni),
      // il contatto non deve occupare la coda immediata di smaltimento, ma risiede in agenda finché non scade.
      if (c.data_ricontatto) {
        const adessoStr = getNowTimestampStr();
        if (c.data_ricontatto > adessoStr) return false;
      }
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
  const e = String(esito || "").trim();
  const lower = e.toLowerCase();
  if (lower.includes("ordine preso") || (lower.includes("interessato") && !lower.includes("non"))) {
    return '<span class="badge badge-success"><span class="badge-dot"></span> Ordine Preso</span>';
  }
  if (lower.includes("richiamare")) {
    return '<span class="badge badge-warning"><span class="badge-dot"></span> Da Richiamare</span>';
  }
  if (lower.includes("non interessato") || lower.includes("rifiutat")) {
    return '<span class="badge badge-danger"><span class="badge-dot"></span> Rifiutato</span>';
  }
  if (!e || lower === "in attesa") {
    return '<span class="badge badge-neutral"><span class="badge-dot"></span> In Attesa</span>';
  }
  return `<span class="badge badge-neutral"><span class="badge-dot"></span> ${escapeHtml(e)}</span>`;
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
          <button type="button" class="btn btn-primary btn-xs btn-action-primary" onclick="apriModalEsito(${c.id})">
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

// --- TAB CALENDARIO MENSILE INTERATTIVO & AGENDA OPERATIVA ---
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
  const month = state.calendarMonth;
  const label = document.getElementById("calMonthYearLabel");
  if (label) {
    label.textContent = `${NOMI_MESI_IT[month]} ${year}`;
  }

  const grid = document.getElementById("calendarDaysGrid");
  if (!grid) return;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const oggiStr = formatDateISO(new Date());

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
           tabindex="0"
           role="button"
           aria-label="Giorno ${isoDate}"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selezionaGiornoCalendario('${isoDate}')}"
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
      <div class="agenda-card agenda-item ${st}">
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
            <button type="button" class="btn btn-success-outline btn-xs btn-agenda-done" onclick="segnaRicontattoCompletato(${c.id})" title="Segna il ricontatto come completato e rimuovilo dall'agenda">
              Segna Completato
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- TAB ORDINI CONFERMATI + GRAFICO TOP CLIENTI ---
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

  chartContainer.innerHTML = chartList.slice(0, 10).map(c => {
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

// --- TAB ANAGRAFICA MASTER ---
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

// --- TAB CRUSCOTTO & ANALISI TERRITORIALE PER CITTÀ E REGIONE ---
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

// --- TAB DUPLICATI & RIDONDANZE ---
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
      <div class="duplicate-group-card dup-group-card">
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
// 4. AZIONI OPERATIVE (100% AUTONOME + SYNC SQLITE SE PRESENTE)
// ==============================================================================

async function ciclaPriorita(idContatto, prioritaAttuale) {
  const prossima = prioritaAttuale === 1 ? 2 : prioritaAttuale === 2 ? 3 : 1;
  const labels = { 1: "Alta (1)", 2: "Normale (2)", 3: "Bassa (3)" };

  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/contatti/${idContatto}/priorita`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorita: prossima })
      });
      const json = await res.json();
      if (json.ok) {
        showToast(`Priorità #${idContatto} impostata a ${labels[prossima]}`, "success");
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Prosegui in locale
    }
  }

  const c = state.contatti.find(x => x.id === idContatto);
  if (c) {
    c.priorita = prossima;
    c.data_aggiornamento = getNowTimestampStr();
    ricalcolaTuttoInLocale();
    renderAll();
    showToast(`Priorità #${idContatto} impostata a ${labels[prossima]}`, "success");
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

  const modal = document.getElementById("modalPianificaBackdrop");
  modal.dataset.initialData = document.getElementById("pianificaInputData").value;
  modal.dataset.initialOra = document.getElementById("pianificaInputOra").value;
  modal.dataset.initialMotivo = document.getElementById("pianificaSelectMotivo").value;
  modal.dataset.initialPriorita = document.getElementById("pianificaSelectPriorita").value;
  modal.classList.add("open");
}

function chiudiModalPianifica(forza = false) {
  const modal = document.getElementById("modalPianificaBackdrop");
  if (!modal || !modal.classList.contains("open")) return;
  if (!forza) {
    const nota = (document.getElementById("pianificaInputNota").value || "").trim();
    const dataCambiata = document.getElementById("pianificaInputData").value !== (modal.dataset.initialData || "");
    const oraCambiata = document.getElementById("pianificaInputOra").value !== (modal.dataset.initialOra || "");
    const motivoCambiato = document.getElementById("pianificaSelectMotivo").value !== (modal.dataset.initialMotivo || "");
    const prioritaCambiata = document.getElementById("pianificaSelectPriorita").value !== (modal.dataset.initialPriorita || "");

    if (nota || dataCambiata || oraCambiata || motivoCambiato || prioritaCambiata) {
      if (!confirm("Ci sono modifiche alla pianificazione non salvate. Vuoi chiudere comunque?")) return;
    }
  }
  modal.classList.remove("open");
}

async function salvaFormPianifica(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("btnSalvaPianifica");
  if (submitBtn && submitBtn.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Salvataggio...";
  }
  const resetBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Conferma e Salva";
    }
  };

  const idContatto = parseInt(document.getElementById("pianificaIdContatto").value, 10);
  const dataVal = document.getElementById("pianificaInputData").value.trim();
  const oraVal = document.getElementById("pianificaInputOra").value.trim() || "10:00";
  const motivo = document.getElementById("pianificaSelectMotivo").value;
  const priorita = parseInt(document.getElementById("pianificaSelectPriorita").value, 10) || 2;
  const notaExtra = document.getElementById("pianificaInputNota").value.trim();

  if (!dataVal) {
    showToast("Seleziona una data valida per il ricontatto", "error");
    resetBtn();
    return;
  }

  const dataRicontattoCompleta = `${dataVal} ${oraVal}`;
  try {
    await inviaPianificazioneBackend(idContatto, dataRicontattoCompleta, motivo, priorita, notaExtra);
    chiudiModalPianifica(true);
  } finally {
    resetBtn();
  }
}

async function rimuoviRicontattoDaModalePianifica() {
  const idContatto = parseInt(document.getElementById("pianificaIdContatto").value, 10);
  if (!idContatto) return;
  await inviaPianificazioneBackend(idContatto, "", "", null, "Ricontatto rimosso manualmente");
  chiudiModalPianifica(true);
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
  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/contatti/${idContatto}/ricontatto`, {
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
        showToast(
          dataRicontatto
            ? `Appuntamento fissato per ${dataRicontatto}`
            : "Appuntamento completato / rimosso dal calendario",
          "success"
        );
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback locale immediato
    }
  }

  const c = state.contatti.find(x => x.id === idContatto);
  if (c) {
    const adesso = getNowTimestampStr();
    c.data_ricontatto = dataRicontatto || "";
    c.motivo_ricontatto = dataRicontatto ? (motivoRicontatto || "Appuntamento concordato") : "";
    c.stato_ricontatto = calcolaStatoRicontattoClient(c.data_ricontatto);
    if (dataRicontatto) {
      if (c.esito !== "Interessato (Ordine preso)") {
        c.esito = "Da richiamare";
      }
      const suffisso = notaExtra ? ` - ${notaExtra}` : "";
      c.note = accodaNotaClient(
        c.note,
        `[${adesso}] RICONTATTO PROGRAMMATO PER ${c.data_ricontatto} (${c.motivo_ricontatto})${suffisso}`
      );
    } else {
      c.chiamato = "Sì";
      c.esito = c.esito === "Interessato (Ordine preso)" ? c.esito : "Chiamato";
      if (notaExtra) {
        c.note = accodaNotaClient(c.note, `[${adesso}] RICONTATTO COMPLETATO: ${notaExtra}`);
      }
    }
    if (priorita) c.priorita = priorita;
    c.data_aggiornamento = adesso;

    ricalcolaTuttoInLocale();
    renderAll();
    showToast(
      dataRicontatto
        ? `Appuntamento fissato per ${dataRicontatto}`
        : "Appuntamento completato / rimosso dal calendario",
      "success"
    );
  }
}

// --- GESTIONE BOZZE PERSISTENTI (ANTI-DATA LOSS) ---
function salvaBozzaNuovoContatto() {
  const editId = (document.getElementById("contattoEditId")?.value || "").trim();
  if (editId) return;
  try {
    const data = {
      azienda: document.getElementById("inputAzienda").value,
      referente: document.getElementById("inputReferente").value,
      telefono: document.getElementById("inputTelefono").value,
      priorita: document.getElementById("inputPriorita").value,
      citta: document.getElementById("inputCitta").value,
      regione: document.getElementById("inputRegione").value,
      note: document.getElementById("inputNote").value,
      totale_ordini: document.getElementById("inputOrdineIniziale").value,
    };
    const str = JSON.stringify(data);
    localStorage.setItem("noga_draft_nuovo_contatto", str);
    sessionStorage.setItem("noga_draft_nuovo_contatto", str);
  } catch (e) {}
}

function cancellaBozzaNuovoContatto() {
  try {
    localStorage.removeItem("noga_draft_nuovo_contatto");
    sessionStorage.removeItem("noga_draft_nuovo_contatto");
  } catch (e) {}
}

function salvaBozzaEsito() {
  const idContatto = (document.getElementById("esitoIdContatto")?.value || "").trim();
  if (!idContatto) return;
  try {
    const data = {
      chiamato: document.getElementById("selectChiamato").value,
      esito: document.getElementById("selectEsito").value,
      referente: document.getElementById("esitoInputReferente").value,
      priorita: document.getElementById("esitoSelectPriorita").value,
      importo: document.getElementById("inputImportoOrdineChiamata").value,
      dataRicontatto: document.getElementById("esitoInputDataRicontatto").value,
      oraRicontatto: document.getElementById("esitoInputOraRicontatto").value,
      motivoRicontatto: document.getElementById("esitoSelectMotivoRicontatto").value,
      note: document.getElementById("textareaNuoveNote").value,
    };
    const str = JSON.stringify(data);
    localStorage.setItem("noga_draft_esito_" + idContatto, str);
    sessionStorage.setItem("noga_draft_esito_" + idContatto, str);
  } catch (e) {}
}

function cancellaBozzaEsito(idContatto) {
  try {
    localStorage.removeItem("noga_draft_esito_" + idContatto);
    sessionStorage.removeItem("noga_draft_esito_" + idContatto);
  } catch (e) {}
}

// --- MODALE NUOVO / MODIFICA CONTATTO ---
function apriModalNuovo() {
  document.getElementById("formNuovoContatto").reset();
  document.getElementById("contattoEditId").value = "";
  document.getElementById("modalContattoEyebrow").textContent = "ACQUISIZIONE ANAGRAFICA";
  document.getElementById("modalContattoTitle").textContent = "Nuovo Cliente all'Ingrosso";
  document.getElementById("groupOrdineIniziale").classList.remove("hidden");
  state.isFormDirty = false;

  try {
    const bozzaStr = localStorage.getItem("noga_draft_nuovo_contatto") || sessionStorage.getItem("noga_draft_nuovo_contatto");
    if (bozzaStr) {
      const b = JSON.parse(bozzaStr);
      if (b && (b.azienda || b.telefono || b.referente || b.note)) {
        if (b.azienda) document.getElementById("inputAzienda").value = b.azienda;
        if (b.referente) document.getElementById("inputReferente").value = b.referente;
        if (b.telefono) document.getElementById("inputTelefono").value = b.telefono;
        if (b.priorita) document.getElementById("inputPriorita").value = b.priorita;
        if (b.citta) document.getElementById("inputCitta").value = b.citta;
        if (b.regione) document.getElementById("inputRegione").value = b.regione;
        if (b.note) document.getElementById("inputNote").value = b.note;
        if (b.totale_ordini) document.getElementById("inputOrdineIniziale").value = b.totale_ordini;
        state.isFormDirty = true;
      }
    }
  } catch (err) {}

  document.getElementById("modalNuovoBackdrop").classList.add("open");
  setTimeout(() => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") && active.id !== "inputAzienda") return;
    const el = document.getElementById("inputAzienda");
    if (el) el.focus();
  }, 40);
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
  setTimeout(() => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") && active.id !== "inputReferente") return;
    const el = document.getElementById("inputReferente");
    if (el) el.focus();
  }, 40);
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
  const submitBtn = document.getElementById("btnSalvaNuovo");
  if (submitBtn && submitBtn.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Salvataggio...";
  }
  const resetBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Salva Scheda Cliente";
    }
  };

  const editId = document.getElementById("contattoEditId").value.trim();
  const azienda = document.getElementById("inputAzienda").value.trim();
  const referente = document.getElementById("inputReferente").value.trim();
  const telefono = document.getElementById("inputTelefono").value.trim();
  const priorita = parseInt(document.getElementById("inputPriorita").value, 10) || 2;
  const citta = document.getElementById("inputCitta").value.trim();
  const regione = document.getElementById("inputRegione").value.trim() || deduciRegioneClient(citta);
  const note = document.getElementById("inputNote").value.trim();
  const totaleOrdiniInit = parseImportoClient(document.getElementById("inputOrdineIniziale").value);

  if (!azienda || !telefono) {
    resetBtn();
    showToast("Azienda e Telefono sono obbligatori", "error");
    return;
  }

  if (state.isApiAvailable) {
    try {
      if (editId) {
        const res = await fetchConTimeout(`${API_BASE}/api/contatti/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ azienda, referente, telefono, citta, regione, priorita, note })
        });
        const json = await res.json();
        if (json.ok) {
          resetBtn();
          cancellaBozzaNuovoContatto();
          showToast("Scheda cliente aggiornata con successo", "success");
          chiudiModalNuovo(true);
          await loadData({ postMutazioneServer: true });
          return;
        }
        resetBtn();
        showToast(json.errore || "Errore durante l'aggiornamento", "error");
        return;
      } else {
        const res = await fetchConTimeout(`${API_BASE}/api/contatti`, {
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
          resetBtn();
          cancellaBozzaNuovoContatto();
          showToast("Nuovo cliente registrato con successo", "success");
          chiudiModalNuovo(true);
          await loadData({ postMutazioneServer: true });
          return;
        }
        resetBtn();
        showToast(json.errore || "Errore durante il salvataggio", "error");
        return;
      }
    } catch (err) {
      // Fallback autonomo locale
    }
  }

  // Esecuzione autonoma in-app (macOS Native Standalone)
  const adesso = getNowTimestampStr();
  if (editId) {
    const idNum = parseInt(editId, 10);
    const c = state.contatti.find(x => x.id === idNum);
    if (c) {
      c.azienda = azienda;
      c.referente = referente;
      c.telefono = telefono;
      c.citta = citta;
      c.regione = regione;
      c.priorita = priorita;
      c.note = note;
      c.data_aggiornamento = adesso;
      ricalcolaTuttoInLocale();
      resetBtn();
      cancellaBozzaNuovoContatto();
      chiudiModalNuovo(true);
      renderAll();
      showToast("Scheda cliente aggiornata con successo", "success");
    }
  } else {
    const telNorm = normalizzaTelefonoClient(telefono);
    const duplicato = state.contatti.some(x => normalizzaTelefonoClient(x.telefono) === telNorm);
    if (duplicato) {
      resetBtn();
      showToast(`Il numero '${telefono}' è già presente a sistema`, "error");
      return;
    }
    const maxId = state.contatti.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
    const nuovoId = maxId + 1;
    const nuovoContatto = arricchisciContattoClient({
      id: nuovoId,
      azienda,
      referente,
      telefono,
      citta,
      regione,
      priorita,
      chiamato: totaleOrdiniInit > 0 ? "Sì" : "No",
      esito: totaleOrdiniInit > 0 ? "Interessato (Ordine preso)" : "In attesa",
      totale_ordini: totaleOrdiniInit,
      numero_ordini: totaleOrdiniInit > 0 ? 1 : 0,
      data_ricontatto: "",
      motivo_ricontatto: "",
      note: totaleOrdiniInit > 0
        ? accodaNotaClient(note, `[${adesso}] ORDINE CONFERMATO: € ${totaleOrdiniInit.toFixed(2)}`)
        : note,
      data_aggiornamento: adesso,
      ultimo_ordine: totaleOrdiniInit > 0 ? adesso : "",
      ordini_storico: totaleOrdiniInit > 0
        ? [{ id: Date.now(), contatto_id: nuovoId, importo: totaleOrdiniInit, note_ordine: note || "Ordine iniziale", data_ordine: adesso }]
        : []
    });
    state.contatti.push(nuovoContatto);
    ricalcolaTuttoInLocale();
    resetBtn();
    cancellaBozzaNuovoContatto();
    chiudiModalNuovo(true);
    renderAll();
    showToast("Nuovo cliente registrato con successo", "success");
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

  document.getElementById("esitoInputDataRicontatto").value = "";
  document.getElementById("esitoInputOraRicontatto").value = "";
  document.getElementById("esitoSelectMotivoRicontatto").value = "";
  document.getElementById("boxCalendarizzaEsito").classList.remove("highlight-schedule");

  // Ripristina eventuale bozza non salvata
  try {
    const bozzaStr = localStorage.getItem("noga_draft_esito_" + c.id) || sessionStorage.getItem("noga_draft_esito_" + c.id);
    if (bozzaStr) {
      const b = JSON.parse(bozzaStr);
      if (b) {
        if (b.note) document.getElementById("textareaNuoveNote").value = b.note;
        if (b.importo) document.getElementById("inputImportoOrdineChiamata").value = b.importo;
        if (b.esito) document.getElementById("selectEsito").value = b.esito;
        if (b.chiamato) document.getElementById("selectChiamato").value = b.chiamato;
        if (b.dataRicontatto) document.getElementById("esitoInputDataRicontatto").value = b.dataRicontatto;
        if (b.oraRicontatto) document.getElementById("esitoInputOraRicontatto").value = b.oraRicontatto;
        if (b.motivoRicontatto) document.getElementById("esitoSelectMotivoRicontatto").value = b.motivoRicontatto;
      }
    }
  } catch (err) {}

  aggiornaVisibilitaBoxOrdineEsito();
  document.getElementById("modalEsitoBackdrop").classList.add("open");
}

function impostaEsitoRapidoNonRisponde() {
  document.getElementById("selectChiamato").value = "Sì";
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

function chiudiModalEsito(forza = false) {
  const modal = document.getElementById("modalEsitoBackdrop");
  if (!modal.classList.contains("open")) return;
  if (!forza) {
    const note = (document.getElementById("textareaNuoveNote").value || "").trim();
    const importo = (document.getElementById("inputImportoOrdineChiamata").value || "").trim();
    const dataRic = (document.getElementById("esitoInputDataRicontatto").value || "").trim();
    if (note || (importo && importo !== "0") || dataRic) {
      if (!confirm("Ci sono dati non salvati per questa chiamata. Vuoi chiudere comunque?")) return;
    }
  }
  modal.classList.remove("open");
}

async function salvaEsitoChiamata(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("btnSalvaEsito");
  if (submitBtn && submitBtn.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Salvataggio...";
  }
  const resetBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Salva Esito Telefonata";
    }
  };

  const idContatto = parseInt(document.getElementById("esitoIdContatto").value, 10);
  const chiamato = document.getElementById("selectChiamato").value;
  const esito = document.getElementById("selectEsito").value;
  const referente = document.getElementById("esitoInputReferente").value.trim();
  const priorita = parseInt(document.getElementById("esitoSelectPriorita").value, 10) || 2;
  const importoOrdine = parseImportoClient(document.getElementById("inputImportoOrdineChiamata").value);
  const nuoveNote = document.getElementById("textareaNuoveNote").value.trim();

  const dataRic = document.getElementById("esitoInputDataRicontatto").value.trim();
  const oraRic = document.getElementById("esitoInputOraRicontatto").value.trim() || "10:00";
  const motivoRic = document.getElementById("esitoSelectMotivoRicontatto").value.trim();
  const dataRicontattoCompleta = dataRic ? `${dataRic} ${oraRic}` : "";

  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/contatti/${idContatto}/chiamata`, {
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
        resetBtn();
        cancellaBozzaEsito(idContatto);
        showToast(
          dataRicontattoCompleta
            ? `Esito salvato e ricontatto fissato per ${dataRicontattoCompleta}`
            : "Esito telefonata salvato con successo",
          "success"
        );
        chiudiModalEsito(true);
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback autonomo locale
    }
  }

  // Esecuzione autonoma in-app (macOS Native Standalone)
  const c = state.contatti.find(x => x.id === idContatto);
  if (c) {
    const adesso = getNowTimestampStr();
    let esitoFinale = esito;
    if (dataRicontattoCompleta && esitoFinale !== "Interessato (Ordine preso)") {
      esitoFinale = "Da richiamare";
    }

    c.chiamato = chiamato;
    c.esito = esitoFinale;
    if (referente) c.referente = referente;
    c.priorita = priorita;
    c.data_ricontatto = dataRicontattoCompleta;
    c.motivo_ricontatto = dataRicontattoCompleta ? (motivoRic || "Appuntamento concordato") : "";
    c.data_aggiornamento = adesso;

    if (esitoFinale === "Interessato (Ordine preso)" && importoOrdine > 0) {
      if (!Array.isArray(c.ordini_storico)) c.ordini_storico = [];
      c.ordini_storico.unshift({
        id: Date.now(),
        contatto_id: c.id,
        importo: importoOrdine,
        note_ordine: nuoveNote || "Ordine confermato in chiamata",
        data_ordine: adesso
      });
      c.totale_ordini = Number((Number(c.totale_ordini || 0) + importoOrdine).toFixed(2));
      c.numero_ordini = (Number(c.numero_ordini) || 0) + 1;
      c.ultimo_ordine = adesso;
      const suff = nuoveNote ? ` - ${nuoveNote}` : "";
      c.note = accodaNotaClient(c.note, `[${adesso}] ORDINE CONFERMATO: € ${importoOrdine.toFixed(2)}${suff}`);
    } else if (!dataRicontattoCompleta && nuoveNote) {
      c.note = accodaNotaClient(c.note, nuoveNote);
    }

    if (dataRicontattoCompleta) {
      const suffRic = nuoveNote && !(esitoFinale === "Interessato (Ordine preso)" && importoOrdine > 0)
        ? ` - ${nuoveNote}`
        : "";
      c.note = accodaNotaClient(
        c.note,
        `[${adesso}] RICONTATTO PROGRAMMATO PER ${dataRicontattoCompleta} (${c.motivo_ricontatto})${suffRic}`
      );
    }

    salvaStorageLocale();
    ricalcolaTuttoInLocale();
    resetBtn();
    cancellaBozzaEsito(idContatto);
    chiudiModalEsito(true);
    renderAll();
    showToast(
      dataRicontattoCompleta
        ? `Esito salvato e ricontatto fissato per ${dataRicontattoCompleta}`
        : "Esito telefonata salvato con successo",
      "success"
    );
  } else {
    resetBtn();
  }
}

// --- MODALE + NUOVO ORDINE (€) ---
function apriModalNuovoOrdine(idContatto) {
  const c = state.contatti.find(x => x.id === idContatto);
  if (!c) return;

  const submitBtn = document.getElementById("btnSalvaNuovoOrdine");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.originalText || "Conferma e Salva Ordine";
  }

  document.getElementById("ordineIdContatto").value = c.id;
  document.getElementById("modalOrdineAzienda").textContent = c.azienda;
  document.getElementById("modalOrdineAttuale").textContent =
    `${formatEuro(c.totale_ordini)} (${c.numero_ordini || 0} ordini)`;
  document.getElementById("inputNuovoOrdineImporto").value = "";
  document.getElementById("inputNuovoOrdineNote").value = "";

  document.getElementById("modalNuovoOrdineBackdrop").classList.add("open");
  setTimeout(() => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") && active.id !== "inputNuovoOrdineImporto") return;
    const el = document.getElementById("inputNuovoOrdineImporto");
    if (el) el.focus();
  }, 40);
}

function chiudiModalNuovoOrdine(forza = false) {
  const modal = document.getElementById("modalNuovoOrdineBackdrop");
  if (!modal.classList.contains("open")) return;
  if (!forza) {
    const importo = (document.getElementById("inputNuovoOrdineImporto").value || "").trim();
    const note = (document.getElementById("inputNuovoOrdineNote").value || "").trim();
    if ((importo && importo !== "0") || note) {
      if (!confirm("Hai un nuovo ordine non ancora confermato. Vuoi chiudere comunque?")) return;
    }
  }
  modal.classList.remove("open");
}

async function salvaNuovoOrdine(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("btnSalvaNuovoOrdine");
  if (submitBtn && submitBtn.disabled) return;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Salvataggio...";
  }
  const resetBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Conferma e Salva Ordine";
    }
  };

  const idContatto = parseInt(document.getElementById("ordineIdContatto").value, 10);
  const importo = parseImportoClient(document.getElementById("inputNuovoOrdineImporto").value);
  const noteOrdine = document.getElementById("inputNuovoOrdineNote").value.trim();

  if (!importo || importo <= 0) {
    showToast("Inserisci un importo ordine in Euro maggiore di 0", "error");
    resetBtn();
    return;
  }

  try {
    if (state.isApiAvailable) {
      try {
        const res = await fetchConTimeout(`${API_BASE}/api/contatti/${idContatto}/ordini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importo, note_ordine: noteOrdine })
        });
        const json = await res.json();
        if (json.ok) {
          showToast(`Ordine di ${formatEuro(importo)} registrato con successo`, "success");
          chiudiModalNuovoOrdine(true);
          await loadData({ postMutazioneServer: true });
          if (state.selectedContact && state.selectedContact.id === idContatto) {
            await apriDrawer(idContatto);
          }
          return;
        }
      } catch (err) {
        // Fallback autonomo locale
      }
    }

    const c = state.contatti.find(x => x.id === idContatto);
    if (c) {
      const adesso = getNowTimestampStr();
      if (!Array.isArray(c.ordini_storico)) c.ordini_storico = [];
      c.ordini_storico.unshift({
        id: Date.now(),
        contatto_id: c.id,
        importo: Number(importo.toFixed(2)),
        note_ordine: noteOrdine || "Riassortimento B2B",
        data_ordine: adesso
      });
      c.chiamato = "Sì";
      c.esito = "Interessato (Ordine preso)";
      c.totale_ordini = Number((Number(c.totale_ordini || 0) + importo).toFixed(2));
      c.numero_ordini = (Number(c.numero_ordini) || 0) + 1;
      c.ultimo_ordine = adesso;
      c.data_aggiornamento = adesso;
      const suff = noteOrdine ? ` - ${noteOrdine}` : "";
      c.note = accodaNotaClient(c.note, `[${adesso}] ORDINE CONFERMATO: € ${importo.toFixed(2)}${suff}`);

      ricalcolaTuttoInLocale();
      chiudiModalNuovoOrdine(true);
      renderAll();
      if (state.selectedContact && state.selectedContact.id === idContatto) {
        await apriDrawer(idContatto);
      }
      showToast(`Ordine di ${formatEuro(importo)} registrato con successo`, "success");
    }
  } finally {
    resetBtn();
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

  const daEliminare = state.contatti.find(c => c.id === idContatto);

  // Rimuovi subito anche dallo storage locale su disco per evitare qualsiasi risincronizzazione
  state.contatti = state.contatti.filter(c => c.id !== idContatto);
  salvaStorageLocale();

  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/contatti/${idContatto}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        if (daEliminare && state.deletedTelefoni) {
          const telNorm = normalizzaTelefonoClient(daEliminare.telefono);
          state.deletedTelefoni.delete(telNorm);
          try {
            localStorage.setItem("noga_deleted_telefoni", JSON.stringify([...state.deletedTelefoni]));
          } catch (_) {}
        }
        showToast(`Cliente #${idContatto} eliminato definitivamente`, "success");
        chiudiModalElimina();
        chiudiDrawer();
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback autonomo locale
    }
  }

  // Traccia eliminazione locale solo se offline / mancata connessione al server
  if (daEliminare) {
    tracciaTelefonoEliminato(daEliminare.telefono);
  }

  ricalcolaTuttoInLocale();
  chiudiModalElimina();
  chiudiDrawer();
  renderAll();
  showToast(`Cliente #${idContatto} eliminato definitivamente`, "success");
}

// --- MERGE DUPLICATI ---
async function eseguiMergeContatti(idPrincipale, idSecondario) {
  const p = state.contatti.find(x => x.id === idPrincipale);
  const sec = state.contatti.find(x => x.id === idSecondario);

  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/duplicati/unisci`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_principale: idPrincipale, id_secondario: idSecondario })
      });
      const json = await res.json();
      if (json.ok) {
        state.contatti = state.contatti.filter(x => x.id !== idSecondario);
        salvaStorageLocale();
        showToast(json.messaggio || "Schede unite con successo", "success");
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback autonomo locale
    }
  }

  if (!p || !sec) return;
  const s = sec;

  if (!p.referente && s.referente) p.referente = s.referente;
  if (!p.citta && s.citta) p.citta = s.citta;
  if (!p.regione && s.regione) p.regione = s.regione;
  p.priorita = Math.min(Number(p.priorita) || 2, Number(s.priorita) || 2);
  if (s.chiamato === "Sì") p.chiamato = "Sì";
  if (p.esito !== "Interessato (Ordine preso)" && s.esito === "Interessato (Ordine preso)") {
    p.esito = "Interessato (Ordine preso)";
  } else if (p.esito === "In attesa" && s.esito !== "In attesa") {
    p.esito = s.esito;
  }

  p.totale_ordini = Number(((Number(p.totale_ordini) || 0) + (Number(s.totale_ordini) || 0)).toFixed(2));
  p.numero_ordini = (Number(p.numero_ordini) || 0) + (Number(s.numero_ordini) || 0);
  p.ordini_storico = [...(p.ordini_storico || []), ...(s.ordini_storico || [])];

  const adessoStr = getNowTimestampStr();
  let notaAggiuntivaFusione = "";
  if (p.data_ricontatto && s.data_ricontatto) {
    const pAttivo = (p.data_ricontatto >= adessoStr);
    const sAttivo = (s.data_ricontatto >= adessoStr);
    if (pAttivo && !sAttivo) {
      notaAggiuntivaFusione = `[Fusione Ricontatto alternativo scheda #${s.id}]: ${s.data_ricontatto} - ${s.motivo_ricontatto || ""}`;
    } else if (sAttivo && !pAttivo) {
      p.data_ricontatto = s.data_ricontatto;
      p.motivo_ricontatto = s.motivo_ricontatto;
      notaAggiuntivaFusione = `[Fusione Ricontatto alternativo scheda #${p.id}]: ${p.data_ricontatto} - ${p.motivo_ricontatto || ""}`;
    } else if (p.data_ricontatto <= s.data_ricontatto) {
      notaAggiuntivaFusione = `[Fusione Ricontatto alternativo scheda #${s.id}]: ${s.data_ricontatto} - ${s.motivo_ricontatto || ""}`;
    } else {
      p.data_ricontatto = s.data_ricontatto;
      p.motivo_ricontatto = s.motivo_ricontatto;
      notaAggiuntivaFusione = `[Fusione Ricontatto alternativo scheda #${p.id}]: ${p.data_ricontatto} - ${p.motivo_ricontatto || ""}`;
    }
  } else if (!p.data_ricontatto && s.data_ricontatto) {
    p.data_ricontatto = s.data_ricontatto;
    p.motivo_ricontatto = s.motivo_ricontatto;
  }

  if (notaAggiuntivaFusione) {
    s.note = accodaNotaClient(s.note, notaAggiuntivaFusione);
  }

  const pezziEsistenti = new Set((p.note || "").split(" | ").map(x => x.trim()).filter(Boolean));
  const pezziSecondari = (s.note || "").split(" | ").map(x => x.trim()).filter(Boolean);
  const nuoviPezzi = [];
  for (const pz of pezziSecondari) {
    if (!pezziEsistenti.has(pz)) {
      if (pz.startsWith(`[Da scheda #${s.id}]`)) {
        nuoviPezzi.push(pz);
      } else {
        nuoviPezzi.push(`[Da scheda #${s.id}] ${pz}`);
      }
    }
  }
  if (nuoviPezzi.length > 0) {
    p.note = accodaNotaClient(p.note, nuoviPezzi.join(" | "));
  }
  p.data_aggiornamento = getNowTimestampStr();

  state.contatti = state.contatti.filter(x => x.id !== idSecondario);
  ricalcolaTuttoInLocale();
  renderAll();
  showToast(`Scheda #${idSecondario} unita correttamente nella scheda #${idPrincipale}`, "success");
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

  const ordersContainer = document.getElementById("drawerOrdersTimeline");
  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/contatti/${c.id}/ordini`);
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
        return;
      }
    } catch (err) {
      // Usa storico ordini in-memory
    }
  }

  if (Array.isArray(c.ordini_storico) && c.ordini_storico.length > 0) {
    ordersContainer.innerHTML = c.ordini_storico.map(ord => `
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
}

function chiudiDrawer() {
  state.selectedContact = null;
  document.getElementById("drawerBackdrop").classList.remove("open");
  document.getElementById("detailDrawer").classList.remove("open");
}

// ==============================================================================
// 5. PARSER UNIVERSALE MULTI-FORMATO IN-APP (JSON, CSV, TSV/EXCEL, TXT)
// ==============================================================================

function apriModalImport() {
  document.getElementById("textareaJsonRaw").value = "";
  const feedback = document.getElementById("importFeedbackBox");
  feedback.classList.add("hidden");
  document.getElementById("modalImportBackdrop").classList.add("open");
}

function chiudiModalImport(forza = false) {
  const modal = document.getElementById("modalImportBackdrop");
  if (!modal || !modal.classList.contains("open")) return;
  const feedbackBox = document.getElementById("importFeedbackBox");
  const feedbackVisibile = feedbackBox && !feedbackBox.classList.contains("hidden");
  if (!forza && !feedbackVisibile) {
    const raw = (document.getElementById("textareaJsonRaw").value || "").trim();
    if (raw) {
      if (!confirm("Hai incollato o caricato dei dati non ancora importati. Vuoi chiudere comunque?")) return;
    }
  }
  document.getElementById("textareaJsonRaw").value = "";
  if (feedbackBox) {
    feedbackBox.classList.add("hidden");
    feedbackBox.innerHTML = "";
  }
  modal.classList.remove("open");
}

function leggiFileImportato(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById("textareaJsonRaw").value = event.target.result || "";
    showToast(`File '${file.name}' pronto. Clicca "Analizza e Importa Contatti"`, "success");
  };
  reader.readAsText(file);
}

function parseCSVUniversal(text, delimiter) {
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  
  currentRow.push(currentVal.trim());
  if (currentRow.some(col => col.length > 0)) {
    rows.push(currentRow);
  }
  return rows;
}

function normalizzaDataRicontattoClient(valore) {
  if (!valore) return "";
  let s = String(valore).trim().replace("T", " ");
  if (!s) return "";
  const mIt = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (mIt) {
    const d = mIt[1].padStart(2, "0");
    const m = mIt[2].padStart(2, "0");
    const y = mIt[3];
    const hh = (mIt[4] || "09").padStart(2, "0");
    const mm = mIt[5] || "00";
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s} 09:00`;
  }
  return s.slice(0, 16);
}

function parseTestoImportUniversaleClient(testoRaw) {
  const testo = String(testoRaw || "").replace(/^\ufeff/, "").trim();
  if (!testo) return { records: [], formato: "vuoto" };

  if (testo.startsWith("[") || testo.startsWith("{")) {
    let parsed = JSON.parse(testo);
    if (!Array.isArray(parsed)) {
      parsed = parsed.contatti || parsed.data || [parsed];
    }
    return { records: parsed, formato: "JSON" };
  }

  const primaRiga = testo.split(/\r?\n/)[0] || "";
  let delim = null;
  let formato = "TXT";
  if (primaRiga.includes("\t")) {
    delim = "\t";
    formato = "TSV / Excel";
  } else if (primaRiga.includes(";")) {
    delim = ";";
    formato = "CSV (;)";
  } else if (primaRiga.includes("|")) {
    delim = "|";
    formato = "TXT (|)";
  } else if (primaRiga.includes(",")) {
    delim = ",";
    formato = "CSV (,)";
  }

  if (delim) {
    const righe = parseCSVUniversal(testo, delim);
    if (righe.length === 0) return { records: [], formato: "vuoto" };

    const headerCandidate = righe[0].map(h => h.toLowerCase());
    const hasHeader = headerCandidate.some(h =>
      ["azienda", "ragione sociale", "negozio", "cliente", "nome", "telefono", "tel", "cellulare"].includes(h)
    );

    if (hasHeader) {
      const headers = headerCandidate;
      const records = righe.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          const val = row[i] || "";
          if (["azienda", "ragione sociale", "ragionesociale", "negozio", "cliente", "nome", "company"].includes(h)) obj.azienda = val;
          else if (["telefono", "tel", "cellulare", "recapito", "numero", "phone", "mobile"].includes(h)) obj.telefono = val;
          else if (["referente", "titolare", "buyer", "contatto", "responsabile"].includes(h)) obj.referente = val;
          else if (["citta", "città", "comune", "localita", "località", "city"].includes(h)) obj.citta = val;
          else if (["regione", "region"].includes(h)) obj.regione = val;
          else if (["priorita", "priorità", "urgenza", "priority"].includes(h)) obj.priorita = val;
          else if (["importo", "ordine", "totale_ordini", "totale_ordini_eur", "totaleordini", "totaleordinieur", "fatturato"].includes(h)) obj.totale_ordini = val;
          else if (["numero_ordini", "numeroordini", "num_ordini", "numordini", "ordini"].includes(h)) obj.numero_ordini = val;
          else if (["chiamato", "chiamata", "called", "stato_chiamata", "statochiamata"].includes(h)) obj.chiamato = val;
          else if (["esito", "esito_chiamata", "esitochiamata", "esito_commerciale", "outcome", "status"].includes(h)) obj.esito = val;
          else if (["data_ricontatto", "dataricontatto", "ricontatto", "appuntamento"].includes(h)) obj.data_ricontatto = normalizzaDataRicontattoClient(val);
          else if (["motivo_ricontatto", "motivoricontatto", "motivo"].includes(h)) obj.motivo_ricontatto = val;
          else if (["note", "commenti", "appunti", "annotazioni", "notes"].includes(h)) obj.note = val;
          else if (["ordini_storico", "storico_ordini"].includes(h)) obj.ordini_storico = val;
          else if (["data_aggiornamento", "ultimo_aggiornamento"].includes(h)) obj.data_aggiornamento = val;
          else if (["ultimo_ordine", "ultimoordine"].includes(h)) obj.ultimo_ordine = val;
        });
        return obj;
      });
      return { records, formato };
    }

    return {
      records: righe.map(parts => ({
        azienda: parts[0] || "",
        telefono: parts[1] || "",
        citta: parts[2] || "",
        note: parts.slice(3).join(" | ")
      })),
      formato
    };
  }

  const records = linee.map(ln => {
    const parti = ln.split(/\s+-\s+|\s*[;|]\s*/).map(p => p.trim()).filter(Boolean);
    return {
      azienda: parti[0] || "",
      telefono: parti[1] || "",
      citta: parti[2] || "",
      note: parti.slice(3).join(" | ")
    };
  });
  return { records, formato: "TXT" };
}

function importaListaRecordsLocale(records, formato = "Multi-formato") {
  let inseriti = 0;
  let aggiornati = 0;
  let duplicati = 0;
  let errori = 0;
  const adesso = getNowTimestampStr();

  const telefoniEsistenti = new Set(
    state.contatti.map(c => normalizzaTelefonoClient(c.telefono)).filter(Boolean)
  );
  let maxId = state.contatti.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);

  records.forEach(r => {
    const azienda = String(r.azienda || r.ragione_sociale || r.negozio || r.nome || "").trim();
    const telefono = String(r.telefono || r.tel || r.cellulare || "").trim();
    const referente = String(r.referente || r.titolare || r.buyer || "").trim();
    const citta = String(r.citta || r["città"] || r.comune || "").trim();
    const regione = String(r.regione || "").trim() || deduciRegioneClient(citta);
    const priorita = parsePrioritaClient(r.priorita || r["priorità"], 2);
    const totOrdini = parseImportoClient(r.totale_ordini || r.importo || r.ordine || r.totale_ordini_eur);
    const numOrdini = parseInt(r.numero_ordini || (totOrdini > 0 ? 1 : 0), 10) || 0;
    const note = String(r.note || r.commenti || r.annotazioni || "").trim();
    const dataRic = String(r.data_ricontatto || r.appuntamento || "").trim();
    const motivoRic = String(r.motivo_ricontatto || r.motivo || "").trim();

    if (!azienda || !telefono) {
      errori++;
      return;
    }
    const telNorm = normalizzaTelefonoClient(telefono);
    if (!telNorm) {
      errori++;
      return;
    }

    let chiamato = "No";
    if (r.chiamato !== undefined && r.chiamato !== null && String(r.chiamato).trim() !== "") {
      const chStr = String(r.chiamato).trim().toLowerCase();
      chiamato = (chStr === "sì" || chStr === "si" || chStr === "true" || chStr === "1" || chStr === "yes") ? "Sì" : "No";
    } else if (totOrdini > 0 || (r.esito && String(r.esito).trim() !== "" && String(r.esito).trim() !== "In attesa")) {
      chiamato = "Sì";
    }

    let esito = "In attesa";
    if (r.esito && String(r.esito).trim() !== "") {
      esito = String(r.esito).trim();
    } else if (totOrdini > 0) {
      esito = "Interessato (Ordine preso)";
    } else if (dataRic) {
      esito = "Da richiamare";
    }

    // Se il contatto esiste già, aggiorna/ripristina chiamate, esiti e note senza sovrascritture distruttive
    if (telefoniEsistenti.has(telNorm)) {
      const cExist = state.contatti.find(x => normalizzaTelefonoClient(x.telefono) === telNorm);
      if (cExist) {
        let modificato = false;
        if (chiamato === "Sì" && cExist.chiamato !== "Sì") {
          cExist.chiamato = "Sì";
          modificato = true;
        }
        if (esito && esito !== "In attesa" && (cExist.esito === "In attesa" || !cExist.esito)) {
          cExist.esito = esito;
          modificato = true;
        }
        if (note) {
          const notePrima = cExist.note || "";
          cExist.note = accodaNotaClient(cExist.note, note);
          if (cExist.note !== notePrima) modificato = true;
        }
        if (dataRic && !cExist.data_ricontatto) {
          cExist.data_ricontatto = dataRic;
          cExist.motivo_ricontatto = motivoRic || cExist.motivo_ricontatto;
          modificato = true;
        }
        if (totOrdini > (cExist.totale_ordini || 0)) {
          cExist.totale_ordini = totOrdini;
          cExist.numero_ordini = Math.max(cExist.numero_ordini || 0, numOrdini);
          if (esito === "Interessato (Ordine preso)") {
            cExist.esito = esito;
          }
          modificato = true;
        }
        if (Array.isArray(r.ordini_storico) && r.ordini_storico.length > (cExist.ordini_storico?.length || 0)) {
          cExist.ordini_storico = r.ordini_storico;
          modificato = true;
        }
        if (state.deletedTelefoni && state.deletedTelefoni.has(telNorm)) {
          state.deletedTelefoni.delete(telNorm);
        }
        if (modificato) {
          cExist.data_aggiornamento = adesso;
          aggiornati++;
        } else {
          duplicati++;
        }
        return;
      }
    }

    if (state.deletedTelefoni && state.deletedTelefoni.has(telNorm)) {
      state.deletedTelefoni.delete(telNorm);
    }

    maxId++;
    telefoniEsistenti.add(telNorm);
    state.contatti.push(arricchisciContattoClient({
      id: maxId,
      azienda,
      referente,
      telefono,
      citta,
      regione,
      priorita,
      chiamato,
      esito,
      totale_ordini: totOrdini,
      numero_ordini: numOrdini,
      data_ricontatto: dataRic,
      motivo_ricontatto: motivoRic,
      note,
      data_aggiornamento: adesso,
      ultimo_ordine: totOrdini > 0 ? adesso : "",
      ordini_storico: Array.isArray(r.ordini_storico) && r.ordini_storico.length > 0
        ? r.ordini_storico
        : (totOrdini > 0
            ? [{ id: Date.now() + maxId, contatto_id: maxId, importo: totOrdini, note_ordine: "Ordine importato", data_ordine: adesso }]
            : [])
    }));
    inseriti++;
  });

  if (state.deletedTelefoni) {
    try {
      localStorage.setItem("noga_deleted_telefoni", JSON.stringify([...state.deletedTelefoni]));
    } catch (_) {}
  }

  salvaStorageLocale();
  ricalcolaTuttoInLocale();
  renderAll();
  return { inseriti, aggiornati, duplicati, errori, formato_rilevato: formato };
}

async function importaFileDefault() {
  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/importa-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percorso_file: "contatti_lead.json" })
      });
      const json = await res.json();
      if (json.ok && (json.inseriti > 0 || json.duplicati > 0)) {
        mostraFeedbackImport(json);
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback selezione file locale
    }
  }

  document.getElementById("fileInputJson").click();
}

async function eseguiImportUniversale() {
  const testo = document.getElementById("textareaJsonRaw").value.trim();
  if (!testo) {
    showToast("Seleziona un file o incolla i dati da importare", "error");
    return;
  }

  if (state.isApiAvailable) {
    try {
      const res = await fetchConTimeout(`${API_BASE}/api/importa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenuto_testo: testo })
      });
      const json = await res.json();
      if (json.ok) {
        mostraFeedbackImport(json);
        document.getElementById("textareaJsonRaw").value = "";
        try {
          const { records } = parseTestoImportUniversaleClient(testo);
          if (Array.isArray(records)) {
            records.forEach(r => {
              const tel = normalizzaTelefonoClient(r.telefono);
              if (tel && state.deletedTelefoni) state.deletedTelefoni.delete(tel);
            });
            localStorage.setItem("noga_deleted_telefoni", JSON.stringify([...state.deletedTelefoni]));
          }
        } catch (_) {}
        await loadData({ postMutazioneServer: true });
        return;
      }
    } catch (err) {
      // Fallback parser locale
    }
  }

  try {
    const { records, formato } = parseTestoImportUniversaleClient(testo);
    if (!records || records.length === 0) {
      showToast("Nessun contatto valido rilevato nel testo", "error");
      return;
    }
    const report = importaListaRecordsLocale(records, formato);
    mostraFeedbackImport(report);
    document.getElementById("textareaJsonRaw").value = "";
  } catch (err) {
    showToast("Formato dati non valido: verifica il testo incollato", "error");
  }
}

function mostraFeedbackImport(res) {
  const box = document.getElementById("importFeedbackBox");
  box.classList.remove("hidden");
  box.className = "import-feedback-box success";
  const inseriti = res.inseriti || 0;
  const aggiornati = res.aggiornati || 0;
  const duplicati = res.duplicati || 0;
  const errori = res.errori || 0;
  const totAttivi = inseriti + aggiornati;
  box.innerHTML = `
    <strong>Report Importazione (${escapeHtml(res.formato_rilevato || "Multi-formato")}):</strong><br>
    &bull; Nuovi Clienti Inseriti: <strong>${inseriti}</strong><br>
    ${aggiornati > 0 ? `&bull; Schede Aggiornate / Ripristinate: <strong>${aggiornati}</strong><br>` : ""}
    &bull; Duplicati Ignorati: <strong>${duplicati}</strong><br>
    &bull; Righe Ignorate / Incomplete: <strong>${errori}</strong>
  `;
  showToast(`Importazione completata: +${totAttivi} contatti`, "success");
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
  const headers = ["ID", "Priorita", "Azienda", "Referente", "Telefono", "Citta", "Regione", "Chiamato", "Esito", "Data_Ricontatto", "Motivo_Ricontatto", "Numero_Ordini", "Totale_Ordini_EUR", "Ultimo_Aggiornamento", "Note"];
  const mappaPrio = { 1: "1 - Alta", 2: "2 - Normale", 3: "3 - Bassa" };
  const rows = state.contatti.map(c => [
    c.id, mappaPrio[c.priorita] || "2 - Normale", `"${(c.azienda || "").replace(/"/g, '""')}"`, `"${(c.referente || "").replace(/"/g, '""')}"`,
    `"${c.telefono || ""}"`, `"${c.citta || ""}"`, `"${c.regione || ""}"`, c.chiamato || "No", `"${c.esito || "In attesa"}"`,
    `"${c.data_ricontatto || ""}"`, `"${(c.motivo_ricontatto || "").replace(/"/g, '""')}"`,
    c.numero_ordini || 0, String((c.totale_ordini || 0).toFixed ? c.totale_ordini.toFixed(2) : (c.totale_ordini || 0)).replace(".", ","),
    `"${c.data_aggiornamento || ""}"`, `"${(c.note || "").replace(/"/g, '""')}"`
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
  showToast("Esportazione CSV completata", "success");
}

// ==============================================================================
// 6. NAVIGAZIONE TAB & EVENT LISTENERS
// ==============================================================================

function attivaTab(targetId) {
  chiudiDrawer();
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

  let searchDebounceTimer = null;
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    clearBtn.classList.toggle("hidden", !state.searchQuery);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderAll();
    }, 200);
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
    showToast("Dati e calendario aggiornati in tempo reale", "success");
  });

  document.getElementById("btnImportaJson").addEventListener("click", apriModalImport);
  document.getElementById("btnEsportaJson").addEventListener("click", esportaFileJson);
  document.getElementById("btnEsportaCsv").addEventListener("click", esportaFileCsv);

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

  document.getElementById("btnAgendaFilterTutti").addEventListener("click", () => impostaFiltroAgenda("tutti"));
  document.getElementById("btnAgendaFilterOggiScaduti").addEventListener("click", () => impostaFiltroAgenda("oggi_scaduti"));
  document.getElementById("btnAgendaFilterGiorno").addEventListener("click", () => impostaFiltroAgenda("giorno"));

  document.getElementById("calPillScaduti").addEventListener("click", () => impostaFiltroAgenda("oggi_scaduti"));
  document.getElementById("calPillOggi").addEventListener("click", () => {
    state.calendarSelectedDate = formatDateISO(new Date());
    impostaFiltroAgenda("giorno");
  });
  document.getElementById("calPillFuturi").addEventListener("click", () => impostaFiltroAgenda("tutti"));

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

  document.getElementById("btnNuovoContatto").addEventListener("click", apriModalNuovo);
  document.getElementById("modalNuovoCloseBtn").addEventListener("click", () => chiudiModalNuovo(false));
  document.getElementById("btnAnnullaNuovo").addEventListener("click", () => chiudiModalNuovo(false));
  document.getElementById("formNuovoContatto").addEventListener("submit", salvaFormContatto);
  document.getElementById("formNuovoContatto").addEventListener("input", () => {
    state.isFormDirty = true;
    salvaBozzaNuovoContatto();
  });

  document.getElementById("inputCitta").addEventListener("input", (e) => {
    const regDedotta = deduciRegioneClient(e.target.value);
    if (regDedotta) {
      document.getElementById("inputRegione").value = regDedotta;
    }
  });

  document.getElementById("modalEsitoCloseBtn").addEventListener("click", () => chiudiModalEsito(false));
  document.getElementById("btnAnnullaEsito").addEventListener("click", () => chiudiModalEsito(false));
  document.getElementById("selectEsito").addEventListener("change", aggiornaVisibilitaBoxOrdineEsito);
  document.getElementById("btnQuickNonRisponde").addEventListener("click", impostaEsitoRapidoNonRisponde);
  document.getElementById("btnEsitoRimuoviRicontatto").addEventListener("click", () => {
    document.getElementById("esitoInputDataRicontatto").value = "";
    document.getElementById("esitoInputOraRicontatto").value = "";
    document.getElementById("esitoSelectMotivoRicontatto").value = "";
    salvaBozzaEsito();
  });
  document.getElementById("formRegistraEsito").addEventListener("submit", salvaEsitoChiamata);
  document.getElementById("formRegistraEsito").addEventListener("input", salvaBozzaEsito);

  document.getElementById("modalPianificaCloseBtn").addEventListener("click", () => chiudiModalPianifica(false));
  document.getElementById("btnAnnullaPianifica").addEventListener("click", () => chiudiModalPianifica(false));
  document.getElementById("btnPianificaRimuovi").addEventListener("click", rimuoviRicontattoDaModalePianifica);
  document.getElementById("formPianificaRicontatto").addEventListener("submit", salvaFormPianifica);

  document.querySelectorAll(".slot-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const prefix = btn.dataset.targetPrefix;
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

  document.getElementById("modalNuovoOrdineCloseBtn").addEventListener("click", () => chiudiModalNuovoOrdine(false));
  document.getElementById("btnAnnullaNuovoOrdine").addEventListener("click", () => chiudiModalNuovoOrdine(false));
  document.getElementById("formNuovoOrdine").addEventListener("submit", salvaNuovoOrdine);

  document.getElementById("modalImportCloseBtn").addEventListener("click", () => chiudiModalImport(false));
  document.getElementById("btnAnnullaImport").addEventListener("click", () => chiudiModalImport(false));
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

  document.getElementById("btnEseguiImportTesto").addEventListener("click", eseguiImportUniversale);

  document.getElementById("modalEliminaCloseBtn").addEventListener("click", chiudiModalElimina);
  document.getElementById("btnAnnullaElimina").addEventListener("click", chiudiModalElimina);
  document.getElementById("btnConfermaElimina").addEventListener("click", confermaEliminazioneCliente);

  document.getElementById("drawerCloseBtn").addEventListener("click", chiudiDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", chiudiDrawer);

  document.getElementById("drawerBtnRegistraChiamata").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    apriModalEsito(id);
  });

  document.getElementById("drawerBtnPianifica").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    apriModalPianifica(id);
  });

  document.getElementById("drawerBtnModificaContatto").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    apriModalModifica(id);
  });

  document.getElementById("drawerBtnNuovoOrdine").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    apriModalNuovoOrdine(id);
  });

  document.getElementById("drawerBtnElimina").addEventListener("click", () => {
    if (!state.selectedContact) return;
    const id = state.selectedContact.id;
    richiediEliminazione(id);
  });

  // Guardie sui Backdrop modali: se clicchi all'esterno con modifiche non salvate, scatta la conferma anti-data-loss
  function attachBackdropGuard(backdropId, closeFn) {
    const el = document.getElementById(backdropId);
    if (!el) return;
    el.addEventListener("click", (e) => {
      if (e.target === el) {
        closeFn(false);
      }
    });
  }

  attachBackdropGuard("modalNuovoBackdrop", chiudiModalNuovo);
  attachBackdropGuard("modalEsitoBackdrop", chiudiModalEsito);
  attachBackdropGuard("modalPianificaBackdrop", chiudiModalPianifica);
  attachBackdropGuard("modalNuovoOrdineBackdrop", chiudiModalNuovoOrdine);
  attachBackdropGuard("modalImportBackdrop", chiudiModalImport);
  attachBackdropGuard("modalEliminaBackdrop", chiudiModalElimina);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modals = [
        { id: "modalEsitoBackdrop", fn: () => chiudiModalEsito(false) },
        { id: "modalPianificaBackdrop", fn: () => chiudiModalPianifica(false) },
        { id: "modalNuovoBackdrop", fn: () => chiudiModalNuovo(false) },
        { id: "modalNuovoOrdineBackdrop", fn: () => chiudiModalNuovoOrdine() },
        { id: "modalImportBackdrop", fn: () => chiudiModalImport() },
        { id: "modalEliminaBackdrop", fn: () => chiudiModalElimina() }
      ];
      for (const m of modals) {
        const el = document.getElementById(m.id);
        if (el && el.classList.contains("open")) {
          m.fn();
          return;
        }
      }
      const drawer = document.getElementById("detailDrawer");
      if (drawer && drawer.classList.contains("open")) {
        chiudiDrawer();
      }
    }
  });
}

// ==============================================================================
// 7. SISTEMA DI NOTIFICA TOAST
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
