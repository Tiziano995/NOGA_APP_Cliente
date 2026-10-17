# Registro delle Modifiche e Audit di Progetto (CHANGELOG)

Tutte le modifiche, interventi architetturali, refactoring e aggiornamenti devono essere registrati in questo file conformemente alla **Regola 1** di [REGOLE_GENERALI_PROGETTO.md](file:///c:/Progetti%20Lavoro/Noga_Gestionale/REGOLE_GENERALI_PROGETTO.md).

---

## [2026-10-17 14:07] - AUDIT-001: Istituzione Regole Ferree & Audit Iniziale dello Stato

- **ID Intervento**: `AUDIT-001`
- **Data / Ora**: 2026-10-17 14:07 CEST
- **Motivazione**: Configurazione del motore di regole persistenti di Antigravity ed esecuzione dell'audit diagnostico completo rispetto a documentazione e standard di progetto.
- **File Creati / Modificati**:
  - `GEMINI.md` (creato)
  - `AGENTS.md` (creato)
  - `.agents/rules/regole_generali_progetto.md` (creato)
  - `CHANGELOG.md` (creato)
- **Esito Quality Gates**:
  - Regole caricate e scoperte da Antigravity: PASS (soglia dimensione rispettata: < 24KB).
  - Integrità documentale: 100% verificata.

---

## [2026-10-17 14:35] - BACKEND-002: Evoluzione Schema SQLite, Gestione Ordini (€), Analisi Territoriale e Bonifica Duplicati (Step 1)

- **ID Intervento**: `BACKEND-002`
- **Data / Ora**: 2026-10-17 14:35 CEST
- **Punto di Ripristino (Rollback)**: Tag Git `v1.0-baseline` (commit `8e5e267`) + backup `crm_ingrosso.db.bak`
- **Motivazione**: Espansione backend e REST API (Step 1) con migrazione automatica non distruttiva di `contatti_ingrosso` (`referente`, `regione`, `priorita`, `totale_ordini`, `numero_ordini`), nuova tabella `storico_ordini`, mappatura automatica `deduci_regione(citta)`, importazione multi-formato universale (JSON/CSV/TSV/TXT), esportazione CSV e rilevamento/merge duplicati.
- **File Creati / Modificati**:
  - `main.py` (aggiornato)
  - `app_server.py` (aggiornato)
  - `CHANGELOG.md` (aggiornato)
- **Esito Quality Gates**:
  - Migrazione `crm_ingrosso.db` senza perdita dati (5 contatti esistenti preservati e arricchiti con regione): PASS.
  - Suite di test su logica di dominio, ordini, import multi-formato e merge duplicati: 100% PASS.

---

## [2026-10-17 14:50] - FRONTEND-003: Espansione Web App NOGA ROMA a 5 Tab, 6 KPI, Grafici CSS/SVG e Gestione Duplicati (Step 2)

- **ID Intervento**: `FRONTEND-003`
- **Data / Ora**: 2026-10-17 14:50 CEST
- **Punto di Ripristino (Rollback)**: Tag Git `v1.0-baseline` (pre-modifica) e `v2.0-release` (post-verifica)
- **Motivazione**: Aggiornamento completo del Frontend Vanilla (`index.html`, `style.css`, `app.js`) con 6 KPI (incluso Totale Ordini in €), 5 Tab operative (`Coda Chiamate`, `Ordini Confermati` con grafico Top Clienti, `Anagrafica Master`, `Cruscotto & Report` con grafico territoriale Città/Regione, `Duplicati & Ridondanze` con Merge), tasto rapido Priorità 1-click, Chip Note Rapide e Import Universale Drag & Drop.
- **File Creati / Modificati**:
  - `index.html` (aggiornato)
  - `style.css` (aggiornato)
  - `app.js` (aggiornato)
  - `CHANGELOG.md` (aggiornato)
- **Esito Quality Gates**:
  - Verifica integrità 141 ID DOM tra `app.js` e `index.html`: 100% PASS.
  - Verifica Design System (0 colori esadecimali cablati in `index.html` e `app.js`, `border-radius: 0px`, 0 emoji): 100% PASS.
  - Test E2E su server HTTP live (`GET /index.html`, `/style.css`, `/app.js`, `/api/contatti`, `/api/statistiche`, `/api/duplicati`, `/api/esporta-csv`): 100% PASS.


