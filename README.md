# NOGA ROMA — Applicazione Desktop per macOS (`NOGA Gestionale.app`)

Applicazione desktop **nativa per macOS** progettata per **NOGA ROMA** per l'acquisizione di clienti all'ingrosso, la gestione degli ordini ricorrenti in Euro (€), la calendarizzazione in tempo reale dei ricontatti telefonici, l'analisi territoriale per Città/Regione e la bonifica automatica dei duplicati.

- **Applicazione Desktop Nativa macOS (`NSWindow` + `WKWebView`)**: Si apre nella **propria finestra desktop macOS** con barra menu dedicata (`Cmd+Q`, `Cmd+C`, `Cmd+V`), senza aprire Safari o schede del browser.
- **100% Autonoma & Locale**: Tutti i dati (contatti, storico ordini in €, calendario ricontatti, note) restano salvati esclusivamente sul tuo Mac (`~/Library/Application Support/NOGA_Gestionale/`).

---

## Contenuto del Pacchetto Cliente

Dentro questa cartella trovi esclusivamente ciò che serve per installare e utilizzare l'app sul Mac:

```text
├── NOGA Gestionale.app       # Applicazione Desktop Nativa macOS
├── Installa_NOGA_Mac.command # Installatore automatico 1-Click (sblocca permessi e installa in /Applications)
├── Avvia_NOGA_Mac.command    # Avvio rapido diretto dell'applicazione
└── README.md                 # Questa guida rapida
```

---

## Guida di Installazione su Mac (In 10 Secondi)

### Passo 1 — Scarica il Pacchetto sul tuo Mac

Puoi scaricare il pacchetto in due modi:

- **Opzione A (Da Terminale)**:
  ```bash
  cd ~/Documents
  git clone https://github.com/Tiziano995/NOGA_APP_Cliente.git
  cd NOGA_APP_Cliente
  ```
- **Opzione B (Download ZIP da GitHub)**:
  Clicca sul pulsante verde **`<> Code`** &rarr; **`Download ZIP`**, estrai la cartella sul tuo Mac e aprila.

---

### Passo 2 — Sblocca i Permessi e Installa l'App in 1 Click

Essendo un'applicazione aziendale privata (non distribuita su Apple App Store), **macOS Gatekeeper** richiede l'autorizzazione al primo avvio.

#### Metodo Consigliato (Da Terminale — Sblocca e installa tutto in 1 colpo)
Apri il **Terminale** nella cartella scaricata e incolla questo comando:

```bash
bash Installa_NOGA_Mac.command
```

**Cosa fa automaticamente questo comando:**
1. Sblocca il filtro Apple Gatekeeper (`xattr -cr`) e applica la firma digitale locale (`codesign`) per il tuo Mac.
2. Installa **`NOGA Gestionale.app`** nella cartella **Applicazioni** (`/Applications`) e ne crea una copia anche sulla **Scrivania (Desktop)**.
3. Avvia immediatamente l'applicazione **NOGA Gestionale**!

*(Alternativa senza Terminale)*:
1. Fai **Tasto Destro (o Ctrl + Click)** su **`NOGA Gestionale.app`** &rarr; clicca su **Apri**.
2. Se compare l'avviso di sicurezza Apple, vai in **Impostazioni di Sistema** &rarr; **Privacy e sicurezza**, scorri in fondo fino a **Sicurezza** e clicca su **Apri comunque**.

---

### Passo 3 — Utilizzo Quotidiano

1. Trascina **`NOGA Gestionale`** dalla cartella **Applicazioni** (o dalla Scrivania) nella barra del **Dock** del tuo Mac.
2. Clicca sull'icona **`NOGA Gestionale`** per lavorare: tutti i contatti, gli ordini in € e gli appuntamenti a calendario vengono salvati automaticamente sul tuo Mac.
