# Regola di Progetto: Standard e Vincoli Ferrei (REGOLE_GENERALI_PROGETTO)

Tutti gli sviluppi, le modifiche e le analisi nel workspace `Noga_Gestionale` devono aderire rigidamente alle seguenti disposizioni:

1. **Tracciamento & Rollback**:
   - Mantenere un changelog chiaro con ID, data, motivazione, file modificati ed esito verifiche.
   - Assicurare la ripristinabilità dello stato precedente (zero perdita dati).

2. **Clean Architecture & Disaccoppiamento**:
   - Isolamento del core di dominio (zero I/O, calcoli e logica pura).
   - Use Cases indipendenti dal canale (Web REST vs CLI da terminale).
   - Controller senza logica di business.

3. **Frontend & Design System NOGA ROMA**:
   - Limite max 300 righe per componente/modulo.
   - Nessun colore o valore magico cablato (usare token CSS standard `var(--*)`).
   - Nessuna emoji nell'interfaccia formale: usare solo icone vettoriali SVG accessibili.
   - WCAG AA (contrasto 4.5:1, navigazione tastiera, ESC per chiudere i modali).

4. **Integrità Dati & Prevenzione Perdite**:
   - Guardie di navigazione per modifiche non salvate.
   - Errori espliciti e trasparenti (*Fail Loudly*), mai silenziosi.
   - Human-in-the-loop per operazioni distruttive o batch.
   - Idempotenza e filtro univoco anti-duplicati.

5. **Quality Gates & Test**:
   - Test sempre verdi prima del rilascio.
   - Nessun test allentato o disattivato.
