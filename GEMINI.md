# REGOLE FERREE DI PROGETTO: NOGA GESTIONALE

Questo documento stabilisce le regole vincolanti, tassative e inderogabili per lo sviluppo, il refactoring, la manutenzione e l'evoluzione del progetto Noga Gestionale. Qualsiasi interazione, agente o sviluppatore è tenuto a rispettare tali principi.

---

## 1. Tracciamento, Changelog e Punti di Ripristino (Rollback)
- **Changelog Attivo e Tracciabile**: Ogni modifica significativa, refactoring o aggiunta di feature deve essere registrata con ID progressivo, data/ora, motivazione tecnica, file modificati ed esito dei Quality Gates.
- **Rollback Deterministico**: Prima di ogni modifica critica deve essere garantito un punto di ripristino chiaro (commit Git, tag o backup snapshot del database).
- **Zero Rischio Perdita Dati**: Le procedure di rollback devono essere sicure e non devono causare perdita di dati di produzione.

---

## 2. Confini Architetturali e Clean Architecture
- **Isolamento del Dominio (Zero I/O)**: Il core della logica di business e le regole di calcolo devono essere puri. Vietato inserire chiamate HTTP dirette, dettagli del DB grezzi o dipendenze da framework web nel dominio logico.
- **Disaccoppiamento Use Cases / Service Layer**: I casi d'uso orchestrano il flusso tra dominio e infrastruttura senza dipendere dal protocollo di trasporto (REST, CLI, ecc.).
- **Controller e Router Privi di Business Logic**: I controller API e i comandi CLI devono limitarsi a validare input, invocare il caso d'uso e formattare la risposta.
- **Parità tra le Superfici**: Web App e CLI devono condividere gli stessi casi d'uso e produrre comportamenti e validazioni identici.

---

## 3. Frontend, UI/UX e Design System NOGA ROMA
- **Limite di Complessità Componenti**: Nessun file di componente/vista deve superare le 300 righe di codice. Scomporre moduli monolitici in moduli atomici e gestori di stato separati.
- **Zero Valori o Colori Cablati (No Magic Numbers/Colors)**: È severamente vietato inserire colori inline arbitrari (`#hex`, `rgb`, ecc.). Utilizzare unicamente le variabili del Design System definite in CSS (`var(--bg-sand)`, `var(--text-noir)`, ecc.).
- **Zero Emoji nell'UI Formale**: Utilizzare esclusivamente icone vettoriali SVG accessibili (`aria-hidden="true"` o `aria-label`).
- **Accessibilità WCAG AA**: Contrasto minimo 4.5:1, navigazione fluida da tastiera e supporto per chiusura modali con tasto `ESC`.

---

## 4. Integrità dei Dati e Prevenzione Perdita di Lavoro
- **Guardie Anti-Data Loss**: Form e modali con dati modificati non salvati devono chiedere conferma esplicita prima della chiusura accidentale o del reset.
- **Fail Loudly & Explicitly**: Mai mascherare o inghiottire eccezioni in silenzio. Gli errori devono essere notificati in modo trasparente all'utente e tracciati a log.
- **Human-in-the-Loop**: Azioni distruttive o elaborazioni automatiche di massa richiedono conferma esplicita dell'operatore.
- **Idempotenza**: Prevenire doppie sottomissioni o scritture duplicate accidentali (filtro duplicati su numero di telefono garantito).

---

## 5. Quality Gates, Test Suite e Verifica Continua
- **Tolleranza Zero sui Test**: Nessun codice viene rilasciato se i test falliscono o se ci sono errori di linting o di tipo.
- **Non Allentare i Test**: I test non si disattivano per far passare una build; si corregge il codice o si rinegoziano formalmente i requisiti.
- **Test di Conformità Architetturale**: Mantenere verifiche su contratti API, integrità schema SQLite e limiti di dimensione/stile del frontend.
