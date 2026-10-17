# NOGA ROMA — Applicazione Desktop Nativa per macOS (`.app`)

Applicazione desktop **nativa per macOS** progettata per **NOGA ROMA** per l'acquisizione di negozi e buyer all'ingrosso, la gestione degli ordini ricorrenti in Euro (€), la calendarizzazione in tempo reale dei ricontatti telefonici, l'analisi territoriale per Città/Regione e la bonifica automatica dei duplicati.

- **Vera Applicazione Desktop Nativa macOS (`NSWindow` + `WKWebView`)**: Si apre nella **propria finestra nativa macOS** con barra menu dedicata (`Cmd+Q`, `Cmd+C`, `Cmd+V`), **NON apre Safari né schede del browser** e **non richiede alcun server esterno**.
- **Zero Errori "Impossibile Raggiungere il Server"**: Il motore ibrido integrato carica l'applicazione direttamente dal bundle locale (`NOGA Gestionale.app`) e salva automaticamente tutti i dati sul Mac (`~/Library/Application Support/NOGA_Gestionale/` e persistenza locale nativa), funzionando su qualsiasi Mac anche senza Xcode o Python configurati.
- **100% Locale & Privata**: Tutti i dati (contatti, storico ordini in €, calendario ricontatti, note) restano salvati esclusivamente sul tuo Mac.

---

## Guida Rapida di Installazione su Mac (1 Click)

### Passo 1 — Scarica o Aggiorna il Progetto sul tuo Mac

Se hai già scaricato la cartella sul Mac, aprila nel **Terminale** e aggiorna all'ultima versione:

```bash
cd ~/Documents/Noga_Gestionale
git pull
```

*(Oppure, se è la prima volta che lo scarichi)*:
- **Tramite Terminale**:
  ```bash
  cd ~/Documents
  git clone https://github.com/Tiziano995/Noga_Gestionale.git
  cd Noga_Gestionale
  ```
- **Oppure tramite ZIP da GitHub**: clicca sul pulsante verde **`<> Code`** &rarr; **`Download ZIP`**, estrai la cartella **`Noga_Gestionale`** e aprila nel Finder.

---

### Passo 2 — Installa l'App sul Mac in 1 Click

Hai due modi semplicissimi per installare **`NOGA Gestionale.app`** nella cartella **Applicazioni** (`/Applications`) e sulla **Scrivania** (`Desktop`) del tuo Mac:

#### Metodo A — Da Terminale (Consigliato, zero avvisi di sicurezza)
Copia e incolla questa riga nel **Terminale** (dentro la cartella `Noga_Gestionale`):

```bash
bash Installa_NOGA_Mac.command
```

#### Metodo B — Dal Finder con Doppio Click
1. Apri la cartella `Noga_Gestionale` nel **Finder**.
2. Fai **doppio click** su **`Installa_NOGA_Mac.command`** (oppure tasto destro &rarr; **Apri**).

**Cosa fa automaticamente l'installatore:**
1. Sblocca automaticamente i permessi di sicurezza di macOS Gatekeeper (`xattr -cr`).
2. Compila la finestra nativa macOS (`Cocoa` + `WebKit`).
3. Installa **`NOGA Gestionale.app`** nella cartella **Applicazioni** (`/Applications`) e ne crea una copia pronta all'uso anche sulla tua **Scrivania (Desktop)**.
4. Avvia immediatamente l'applicazione desktop nativa **NOGA Gestionale**!

---

### Passo 3 — Usa l'App dal Dock o da Applicazioni come qualsiasi App Mac

1. Ora trovi **`NOGA Gestionale`** direttamente nella cartella **Applicazioni** (e sulla **Scrivania**).
2. Trascina l'icona **`NOGA Gestionale`** nella barra del **Dock** in basso sul tuo Mac.
3. Ogni volta che clicchi su **`NOGA Gestionale`**, si aprirà istantaneamente la **finestra desktop nativa macOS** del gestionale (senza passare per Safari e senza alcun bisogno di avviare server manuali).

---

## Funzionalità Complete Incluse nell'App

| Sezione | Descrizione Operativa |
| :--- | :--- |
| **1. Coda Chiamate** | Lista outreach ordinata automaticamente: in cima appaiono i **ricontatti scaduti o fissati per oggi**, seguiti dai contatti con **Priorità 1 (Alta)**. Cambio priorità ciclico con 1 click (`1 Alta` &rarr; `2 Normale` &rarr; `3 Bassa`). |
| **2. Ordini Confermati** | Grafico interattivo Top Clienti (ordinabile per **Totale €** o **N° Ordini**) + Tabella Buyer acquisiti con pulsante rapido **`+ Nuovo Ordine (€)`** per registrare riassortimenti nel tempo. |
| **3. Calendario & Ricontatti** | **Griglia Mensile Interattiva** a sinistra + **Agenda Operativa in Tempo Reale** a destra con badge colorati (*Scaduto* in bordeaux, *Oggi* in ambra, *Futuro* in noir) e tasti rapidi **`+1 Giorno`**, **`Sposta Orario`**, **`Segna Completato`**. |
| **4. Registra Esito & Slot Rapidi** | Registrazione telefonata con pulsante 1-click **`Non risponde → Richiama tra 2 ore`**, slot rapidi (`Tra 1 Ora`, `Tra 2 Ore`, `Oggi 15:30`, `Domani 10:00`, `Lunedì 10:00`), importo ordine in € e chip di note rapide. |
| **5. Anagrafica Master** | Ricerca istantanea su ragione sociale, referente, telefono, città, regione e note, con filtri combinabili per priorità ed esito. |
| **6. Cruscotto & Analisi Territoriale** | Funnel di conversione telefonica, KPI finanziari (Fatturato Totale €, AOV, N° Ordini) e grafico di distribuzione per **Regione** e **Città** (con auto-mappatura dei capoluoghi italiani). |
| **7. Duplicati & Ridondanze** | Rilevamento automatico di numeri telefonici identici (anche se scritti con prefissi `+39`, spazi o trattini diversi) e ragioni sociali omonime, con **Unione (Merge) in 1 click** senza perdita di storico ordini o note. |
| **8. Import / Export Universale** | Importazione Drag & Drop o Copia-Incolla diretto da **Excel**, file `.csv`, `.json`, `.txt`/`.tsv` ed esportazione immediata in **CSV per Excel** o backup **JSON**. |

---

## Struttura del Progetto

```text
Noga_Gestionale/
├── NOGA Gestionale.app/       # Vera Applicazione Desktop Nativa macOS (Cocoa + WebKit)
├── Installa_NOGA_Mac.command  # Installer automatico 1-click (installa in /Applications e Desktop)
├── Avvia_NOGA_Mac.command     # Avvio rapido diretto dell'app nativa
├── crea_app_mac.py            # Generatore del bundle nativo .app per macOS
├── app_server.py              # Servizio SQLite locale opzionale
├── main.py                    # Core SQLite, migrazioni schema, ordini, calendario e duplicati
├── index.html                 # Interfaccia NOGA ROMA a 6 viste
├── style.css                  # Design System NOGA ROMA (Geist & Geist Mono, zero immagini)
├── app.js                     # Motore ibrido autonomo in tempo reale
├── crm_ingrosso.db            # Database SQLite locale
└── CHANGELOG.md               # Registro tracciabilità modifiche
```
