# Regole Generali di Sviluppo, Architettura e Qualità del Software

Questo documento definisce gli standard architetturali, qualitativi e metodologici da applicare in qualsiasi progetto software moderno, scalabile e manutenibile. È progettato per essere indipendente dallo stack tecnologico specifico e importabile come guida per sviluppatori e agenti AI.

---

## 1. Tracciamento, Changelog e Punti di Ripristino (Rollback)

In ogni progetto serio, il codice non vive isolato dalla sua storia operativa.

* **Registro Cronologico delle Modifiche (Changelog attivo)**:
  * Ogni intervento significativo, refactoring o aggiunta di funzionalità deve essere registrato in un documento di audit/changelog di progetto.
  * Informazioni obbligatorie per ogni voce: ID progressivo dell'intervento, data/ora, motivazione e descrizione della modifica, elenco dei file toccati/creati ed esito dei Quality Gates.
* **Punto di Ripristino Immediato (Strategia di Rollback)**:
  * Ad ogni modifica critica o rilascio, deve essere identificabile il punto esatto di ripristino (hash di commit Git, tag o snapshot del database).
  * Il comando o la procedura per annullare l'intervento deve essere deterministica, rapida e a rischio zero di perdita dati.

---

## 2. Confini Architetturali e Clean Architecture

I confini architetturali devono essere protetti da convenzioni chiare e verificati tramite test automatici:

* **Isolamento del Dominio / Business Core (Zero I/O)**:
  * Il modulo che contiene la logica di business e le regole di calcolo deve essere **puro**.
  * **Vietato** introdurre nel dominio: chiamate di rete (client HTTP), dettagli di storage/database (ORM, query dirette), code di messaggi asincrone o dipendenze verso framework web.
  * Il dominio riceve input, calcola secondo le regole di business e restituisce output tipizzati.
* **Disaccoppiamento dei Casi d'Uso (Use Cases / Service Layer)**:
  * I casi d'uso orchestrano il flusso tra il dominio e l'infrastruttura.
  * I casi d'uso non devono dipendere dal protocollo di trasporto che li ha invocati (HTTP REST, GraphQL, gRPC, CLI o Agent Tooling). Parlano esclusivamente con porte/interfacce astratte.
* **Adattatori e Trasporto Privi di Logica di Business**:
  * I controller API, i comandi CLI e i router di rete hanno il solo compito di: validare il payload in ingresso, chiamare il caso d'uso appropriato e mappare la risposta o l'errore nel formato previsto.
  * Nessuna logica o calcolo di business deve essere scritta all'interno dei controller.
* **Parità tra le Superfici**:
  * Se una stessa funzionalità viene esposta su più canali (es. interfaccia REST, riga di comando o protocolli RPC), tutte le superfici devono richiamare lo stesso caso d'uso sottostante, garantendo identità di comportamento e validazione.

---

## 3. Frontend, UI/UX e Design System

Per prevenire il degrado della base di codice e garantire un'esperienza utente coerente e accessibile:

* **Limite di Complessità e Dimensione dei File (Max 300 righe per componente)**:
  * Nessun componente UI deve diventare un monolite. Come regola generale, un singolo file di componente non dovrebbe superare le **300 righe di codice**.
  * Componenti complessi devono essere scomposti in: sotto-componenti atomici, hook/composables per la logica di stato e file di costanti/tipi separati.
* **Zero Valori o Colori Cablati a Mano (No Hardcoded Colors / Inline Magic Values)**:
  * È severamente vietato inserire valori di stile arbitrari (colori esadecimali, RGB, HSL o OKLCH cablati a mano) all'interno dei singoli componenti o viste.
  * Tutti i colori, spaziature e tipografie devono provenire unicamente dai **Design Tokens** (variabili CSS o token del tema). Questo garantisce consistenza visiva, manutenibilità e supporto immediato per Dark/Light Mode.
  * Vietata la generazione dinamica di classi di stile a runtime con interpolazioni di stringhe non tracciabili dai linter (es. `text-${color}-500`).
* **Iconografia Vettoriale e Semantica (Zero Emoji nell'UI Formale)**:
  * Non utilizzare emoji per rappresentare azioni, pulsanti, stati critici o elementi interattivi.
  * Utilizzare esclusivamente icone vettoriali (SVG) corredate di opportuni attributi di accessibilità (`aria-hidden="true"` se decorative, oppure etichettate tramite `aria-label`).
* **Accessibilità e Standard WCAG AA**:
  * Contrasto minimo di leggibilità garantito: rapporto di contrasto almeno di **4.5:1** per il testo normale rispetto allo sfondo.
  * Navigabilità completa da tastiera: focus visibile, gestione dell'ordine di tabulazione, e chiusura rapida di finestre modali o pannelli laterali premendo il tasto `ESC`.

---

## 4. Integrità dei Dati e Prevenzione della Perdita di Lavoro

* **Guardie Anti-Data Loss (Unsaved Changes)**:
  * Qualsiasi form, editor o vista con stato modificato deve implementare una guardia di navigazione che intercetta la chiusura accidentale o il cambio pagina prima del salvataggio, chiedendo conferma esplicita all'utente.
* **Nessun Fallimento Silenzioso (*Fail Loudly & Explicitly*)**:
  * Gli errori non devono mai essere inghiottiti senza notifica o mascherati con dati simulati/finti in ambienti di produzione.
  * Se un servizio, una chiamata di rete o un'operazione di persistenza fallisce, il sistema deve gestire l'errore in modo trasparente, comunicando chiaramente all'utente cosa è successo e registrando il dettaglio nei log applicativi.
* **Controllo Umano e Supervisione (*Human-in-the-Loop*)**:
  * Le operazioni automatiche (specialmente se guidate da modelli AI o processi batch) devono produrre stati di bozza o proposte, richiedendo la revisione e l'approvazione umana esplicita prima di qualsiasi effetto definitivo o pubblicazione.
* **Idempotenza delle Operazioni con Effetti Collaterali**:
  * Tutte le operazioni che creano risorse, eseguono transazioni o addebitano costi devono supportare chiavi di idempotenza, per prevenire duplicazioni accidentali in caso di riprova di rete o doppi clic dell'utente.

---

## 5. Quality Gates, Test Suite e Verifica Continua

La qualità non è affidata alla disciplina momentanea, ma all'automazione:

* **Quality Gates Bloccanti Pre-Commit / Pre-Merge**:
  * Nessun codice può essere integrato o rilasciato senza che l'intera suite di validazione sia al **100% verde**:
    1. **Type Checking**: nessun errore di tipi (es. TypeScript, MyPy o Pyright).
    2. **Linting & Formatting**: conformità totale alle regole di stile senza warning ignorati.
    3. **Test di Unità e Integrazione**: tutti i test eseguiti e superati.
    4. **Build Production**: compilazione del bundle frontend e backend senza errori.
* **Integrità dei Test**:
  * I test non devono mai essere disattivati, allentati o modificati al solo scopo di far passare una build. Se un test fallisce, il problema risiede nell'implementazione, salvo esplicita rinegoziazione documentata dei requisiti.
* **Test sui Vincoli Architetturali**:
  * Automatizzare la verifica dei vincoli strutturali (es. test che verificano le importazioni proibite nel dominio, test che scansionano i componenti per verificare l'assenza di colori hardcoded e la dimensione dei file).
