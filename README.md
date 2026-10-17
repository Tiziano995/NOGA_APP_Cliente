# Noga Gestionale - CRM Acquisizione Clienti all'Ingrosso

Piattaforma gestionale commerciale B2B per l'acquisizione e il tracciamento di buyer all'ingrosso (Lead Generation & Outreach telefonico per calzature).

Dispone sia di una **Web App Privata** con interfaccia atelier ispirata al sito ufficiale [NOGA ROMA](https://nogashoes.com/) (0 immagini, tipografia Geist, palette sand/noir), sia della **CLI interattiva da terminale**.

---

## 📂 Struttura del Progetto

- [app_server.py](file:///c:/Progetti%20Lavoro/Noga_Gestionale/app_server.py): Server HTTP e REST API (sviluppato con la sola Python Standard Library, zero dipendenze `pip` da installare).
- [index.html](file:///c:/Progetti%20Lavoro/Noga_Gestionale/index.html): Interfaccia grafica Web App con KPI Ribbon, Coda Chiamate, Anagrafica Master, Cruscotto Funnel, Modali e Drawer laterale.
- [style.css](file:///c:/Progetti%20Lavoro/Noga_Gestionale/style.css): Foglio di stile ispirato all'identità NOGA ROMA (palette `#F8F7F5`, font Geist, zero immagini, bordi hairline).
- [app.js](file:///c:/Progetti%20Lavoro/Noga_Gestionale/app.js): Logica frontend client per gestione stato, filtri dinamici, chiamate REST asincrone e fallback offline.
- [main.py](file:///c:/Progetti%20Lavoro/Noga_Gestionale/main.py) (e [agenda_funzioni.py](file:///c:/Progetti%20Lavoro/Noga_Gestionale/agenda_funzioni.py)): Motore database SQLite (`crm_ingrosso.db`), funzioni di business logic e interfaccia a terminale (CLI).
- [contatti_lead.json](file:///c:/Progetti%20Lavoro/Noga_Gestionale/contatti_lead.json): File JSON di esempio per l'importazione massiva con controllo automatico dei duplicati telefonici.
- [DOCUMENTAZIONE.md](file:///c:/Progetti%20Lavoro/Noga_Gestionale/DOCUMENTAZIONE.md): Documentazione tecnica dettagliata su architettura a livelli, API REST, design system e modello relazionale.

---

## 🚀 Come Avviare il Gestionale

### Modalità 1: Web App Privata (Raccomandata)

Avvia il server locale integrato da terminale:
```bash
python app_server.py
```
Quindi apri nel browser:
👉 **`http://localhost:8080/index.html`**

*Caratteristiche Web App:*
- **Coda Chiamate Attiva**: vista rapida per l'operatore con click-to-call e registrazione istantanea dell'esito.
- **Anagrafica Completa**: ricerca in tempo reale multicampo, filtri per esito e apertura della scheda cliente dettagliata.
- **Cruscotto Metriche & Funnel**: calcolo in tempo reale del tasso di conversione, percentuale completamento coda e distribuzione esiti.
- **Gestione Dati Massiva**: importazione drag & drop o testo di file JSON con scarto duplicati ed esportazione backup con 1 click.

---

### Modalità 2: Interfaccia da Terminale (CLI)

Se preferisci lavorare da riga di comando:
```bash
python main.py
```
oppure:
```bash
python agenda_funzioni.py
```

---

## 🌟 Funzionalità Principali

1. **Gestione Anagrafiche B2B**: Inserimento buyer con Ragione Sociale, Recapito Telefonico, Città e Note storiche.
2. **Coda Chiamate Intelligente**: Filtro automatico sui soli contatti `In attesa` o `Da richiamare`.
3. **Tracciamento Telefonico Cronologico**: Registrazione esito (`Interessato (Ordine preso)`, `Da richiamare`, `Non interessato (Rifiutato)`, `In attesa`) con accodamento temporale delle note con separatore `|`.
4. **KPI e Tasso di Conversione**: Calcolo automatico delle performance di chiusura commerciale.
5. **Ingestione & Esportazione JSON**: Controllo di unicità sul recapito telefonico per prevenire contatti duplicati.
