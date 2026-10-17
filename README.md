# NOGA ROMA — Gestionale B2B & CRM Acquisizione Clienti all'Ingrosso (macOS Edition)

Piattaforma gestionale interna **100% locale e privata** progettata per **NOGA ROMA** per l'acquisizione di negozi e buyer all'ingrosso, la gestione degli ordini ricorrenti in Euro (€), la calendarizzazione in tempo reale dei ricontatti telefonici, l'analisi territoriale per Città/Regione e la bonifica automatica dei duplicati.

- **Zero Cloud / Totale Privacy**: Tutti i dati risiedono esclusivamente sul Mac in un database SQLite locale (`crm_ingrosso.db`). Il server ascolta solo in locale su `127.0.0.1:8080`.
- **Zero Dipendenze Esterne**: Richiede unicamente Python 3 (già incluso in macOS) senza necessità di installare librerie tramite `pip` o `npm`.
- **Applicazione Nativa macOS (`.app`)**: Include il generatore automatico del bundle **`NOGA Gestionale.app`** pronto da inserire nel **Dock** del Mac o nella cartella **Applicazioni**.

---

## Guida Completa di Installazione su macOS (Passo-Passo)

Segui questi passaggi per installare il gestionale sul Mac e aggiungerlo al **Dock**.

### 1. Scarica il Progetto sul Mac

Puoi scaricare il progetto in due modi:

#### Opzione A — Tramite Terminale (`git clone`)
Apri l'app **Terminale** su macOS (la trovi in `Applicazioni > Utility > Terminale` oppure premendo `Cmd + Spazio` e scrivendo `Terminale`) ed esegui:

```bash
cd ~/Documents
git clone https://github.com/Tiziano995/Noga_Gestionale.git
cd Noga_Gestionale
```

#### Opzione B — Tramite File ZIP da GitHub
1. Dalla pagina GitHub del repository clicca sul pulsante verde **`<> Code`** &rarr; **`Download ZIP`**.
2. Estrai l'archivio ZIP e sposta la cartella **`Noga_Gestionale`** nella tua cartella **Documenti** (`~/Documents/Noga_Gestionale`).
3. Apri il **Terminale** ed entra nella cartella:
   ```bash
   cd ~/Documents/Noga_Gestionale
   ```

---

### 2. Genera e Configura l'App Nativa per macOS (`NOGA Gestionale.app`)

Dentro il Terminale, assicurati di trovarti nella cartella del progetto ed esegui questo comando:

```bash
python3 crea_app_mac.py
```

**Cosa fa automaticamente questo comando sul tuo Mac:**
1. Crea (o aggiorna) il pacchetto applicativo nativo **`NOGA Gestionale.app`** completo di struttura Apple (`Contents/Info.plist`, `Contents/MacOS/NOGA_Launcher`, `Contents/Resources/app`).
2. Imposta automaticamente i permessi di esecuzione (`chmod +x`) sugli script di avvio.
3. Rimuove eventuali blocchi di sicurezza di macOS Gatekeeper (`xattr -cr "NOGA Gestionale.app"`) così l'app si apre subito al primo click senza avvisi.

---

### 3. Metti l'App nel Dock del Mac e Avviala

1. Apri il **Finder** nella cartella `Noga_Gestionale`.
2. Troverai l'applicazione **`NOGA Gestionale`** (`NOGA Gestionale.app`).
3. *(Opzionale)* Puoi trascinare **`NOGA Gestionale.app`** dentro la cartella **Applicazioni** (`/Applications`) del tuo Mac.
4. Trascina **`NOGA Gestionale.app`** direttamente nella barra del **Dock** in basso sul tuo Mac per averla sempre a portata di click.
5. **Fai doppio click su `NOGA Gestionale` (o cliccala dal Dock)**:
   - Il sistema avvierà silenziosamente in background il motore SQLite locale su `127.0.0.1:8080`.
   - Si aprirà automaticamente la finestra dedicata del gestionale **NOGA ROMA**.

---

### Metodi di Avvio Alternativi su Mac

Oltre all'icona **`NOGA Gestionale.app`** nel Dock, puoi avviare il gestionale anche in questi modi:

- **Doppio click su `Avvia_NOGA_Mac.command`**: avvia il server in background e apre il gestionale nel browser.
- **Avvio manuale da Terminale**:
  ```bash
  python3 app_server.py
  ```
  e poi apri **`http://127.0.0.1:8080/index.html`** su Safari o Chrome.

---

## Funzionalità Principali Incluse

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

## Struttura dei File del Repository

```text
Noga_Gestionale/
├── NOGA Gestionale.app/       # Applicazione nativa macOS pronta per il Dock
├── Avvia_NOGA_Mac.command     # Script rapido avviabile con doppio click su Mac
├── crea_app_mac.py            # Generatore/aggiornatore del bundle .app per macOS
├── app_server.py              # Server HTTP REST multithread privato (127.0.0.1:8080)
├── main.py                    # Core SQLite, migrazioni schema, ordini, calendario e duplicati
├── index.html                 # Interfaccia Web App NOGA ROMA a 6 viste
├── style.css                  # Design System NOGA ROMA (Geist & Geist Mono, zero immagini)
├── app.js                     # Logica frontend reattiva in tempo reale
├── crm_ingrosso.db            # Database SQLite locale
└── CHANGELOG.md               # Registro tracciabilità modifiche e quality gates
```
