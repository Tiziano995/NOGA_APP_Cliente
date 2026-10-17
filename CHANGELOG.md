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

---

## [2026-10-17 15:21] - CALENDAR-004: Modulo di Calendarizzazione e Gestione Ricontatti in Tempo Reale (Backend + Frontend)

- **ID Intervento**: `CALENDAR-004`
- **Data / Ora**: 2026-10-17 15:21 CEST
- **Punto di Ripristino (Rollback)**: Tag Git `v2.0-release` (pre-calendario) e `v3.0-calendar` (post-verifica)
- **Motivazione**: Implementazione del modulo completo di Calendarizzazione e Gestione Ricontatti in Tempo Reale:
  - Migrazione automatica SQLite per `data_ricontatto` (`%Y-%m-%d %H:%M`) e `motivo_ricontatto`.
  - Funzioni di business logic `pianifica_ricontatto`, `ottieni_appuntamenti_calendario`, `calcola_stato_ricontatto` (`scaduto`, `oggi`, `futuro`), ordinamento intelligente della Coda Chiamate (scaduti/oggi in cima) e contatori `ricontatti_oggi`, `ricontatti_scaduti`, `totale_pianificati`.
  - Nuovi endpoint REST `GET /api/calendario` e `POST /api/contatti/{id}/ricontatto`.
  - Nuova Tab **Calendario** a 2 colonne (Griglia Mensile Interattiva a 7 colonne + Agenda Operativa in Tempo Reale con azioni 1-click `+1 Giorno`, `Sposta Orario`, `Segna Completato`, `Chiama / Registra Esito`).
  - Sezione **Calendarizza Ricontatto** con slot rapidi a 1 click (`Tra 1 Ora`, `Oggi Pomeriggio 15:30`, `Domani Mattina 10:00`, `Domani Pomeriggio 16:00`, `Lunedì Prossimo 10:00`) nei modali e colonna **Prossimo Ricontatto** in Coda Chiamate, Anagrafica Master e Drawer.
- **File Creati / Modificati**:
  - `main.py` (aggiornato)
  - `agenda_funzioni.py` (sincronizzato con `main.py`)
  - `app_server.py` (aggiornato)
  - `index.html` (aggiornato)
  - `style.css` (aggiornato)
  - `app.js` (aggiornato)
  - `CHANGELOG.md` (aggiornato)
- **Esito Quality Gates**:
  - Verifica integrità 186 ID DOM tra `app.js` e `index.html`: 100% PASS.
  - Verifica Design System (0 colori esadecimali cablati in `index.html` e `app.js`, 0 emoji, icone SVG accessibili): 100% PASS.
  - Test E2E su backend SQLite e server HTTP live (`GET /api/calendario`, `POST /api/contatti/{id}/ricontatto`, `POST /api/contatti/{id}/chiamata`): 100% PASS.

---

## [2026-10-17 15:40] - MACOS-005: Configurazione Nativa per macOS, Generatore Bundle `NOGA Gestionale.app` (`crea_app_mac.py`) e Slot Rapido `Tra 2 Ore`

- **ID Intervento**: `MACOS-005`
- **Data / Ora**: 2026-10-17 15:40 CEST
- **Punto di Ripristino (Rollback)**: Tag Git `v3.0-calendar` (pre-macOS bundle) e `v3.1-macos-app` (post-verifica)
- **Motivazione**:
  - Creazione dello script [`crea_app_mac.py`](file:///c:/Progetti%20Lavoro/Noga_Gestionale/crea_app_mac.py) (100% Python Standard Library) che genera automaticamente il bundle nativo macOS **`NOGA Gestionale.app`** (`Contents/Info.plist`, `Contents/PkgInfo`, `Contents/MacOS/NOGA_Launcher` con line-endings Unix `LF` e permessi `0755`, e copia autonoma in `Contents/Resources/app`) + lo script Finder **`Avvia_NOGA_Mac.command`**.
  - Risoluzione assoluta del percorso `NOME_DB` in `main.py` e utilizzo di `ThreadingHTTPServer` su `127.0.0.1:8080` in `app_server.py` per garantire esecuzione impeccabile quando avviato dal Dock o da `/Applications` su macOS.
  - Aggiunta del bottone rapido `"Non risponde -> Richiama tra 2 ore"` e dello slot `"Tra 2 Ore"` nei modali di pianificazione chiamata.
- **File Creati / Modificati**:
  - `crea_app_mac.py` (creato)
  - `NOGA Gestionale.app/` (bundle nativo macOS generato)
  - `Avvia_NOGA_Mac.command` (creato)
  - `main.py` & `agenda_funzioni.py` (aggiornati)
  - `app_server.py` (aggiornato)
  - `index.html` & `app.js` (aggiornati)
  - `CHANGELOG.md` (aggiornato)
- **Esito Quality Gates**:
  - Validazione XML `Info.plist`, verifica assenza `CRLF` negli script Bash macOS e test E2E su `127.0.0.1`: 100% PASS.

---

## [2026-10-17 16:07] - MACOS-NATIVE-006: Finestra Desktop Nativa macOS (`NSWindow` + `WKWebView`), Motore Ibrido Autonomo Zero-Server-Error e Installer 1-Click

- **ID Intervento**: `MACOS-NATIVE-006`
- **Data / Ora**: 2026-10-17 16:07 CEST
- **Punto di Ripristino (Rollback)**: Tag Git `v3.1-macos-app` (pre-finestra nativa) e `v4.0-native-macos` (post-verifica)
- **Motivazione**:
  - Risoluzione definitiva dell'errore `"Impossibile raggiungere il server"` su macOS e trasformazione di **`NOGA Gestionale.app`** in una **vera applicazione desktop nativa macOS** che si apre nella propria finestra `NSWindow` + `WKWebView` (con barra menu macOS nativa) senza aprire Safari o schede del browser.
  - Implementazione del **Motore Ibrido Autonomo** in `app.js` + `app_nativa_mac.html` (embedded in `Contents/Resources/app/app_nativa_mac.html`) che permette all'applicazione di funzionare al 100% anche senza server HTTP attivo o senza Xcode Command Line Tools installati sul Mac, sincronizzandosi automaticamente con SQLite (`~/Library/Application Support/NOGA_Gestionale/crm_ingrosso.db`) quando disponibile.
  - Creazione dell'installatore automatico 1-click **`Installa_NOGA_Mac.command`** che rimuove la quarantena Gatekeeper (`xattr -cr`), installa `NOGA Gestionale.app` direttamente in `/Applications` e sulla Scrivania (`~/Desktop`) e avvia subito l'app nativa.
- **File Creati / Modificati**:
  - `app.js` (aggiornato con motore ibrido autonomo persistente)
  - `main.py` & `agenda_funzioni.py` (supporto percorso scrivibile `~/Library/Application Support/NOGA_Gestionale/crm_ingrosso.db` su macOS)
  - `crea_app_mac.py` (generatore finestra nativa Cocoa/WebKit `noga_native_macos.m` + `noga_native_window.jxa` + `app_nativa_mac.html` + `Installa_NOGA_Mac.command`)
  - `NOGA Gestionale.app/` (rigenerato v4.0)
  - `Installa_NOGA_Mac.command` (creato)
  - `README.md` (aggiornato con guida di installazione 1-click)
  - `CHANGELOG.md` (aggiornato)
- **Esito Quality Gates**:
  - Verifica sintassi JS (`node --check app.js`), compilazione bundle `.app`, assenza `CRLF` negli eseguibili macOS e test API/persistenza: 100% PASS.

