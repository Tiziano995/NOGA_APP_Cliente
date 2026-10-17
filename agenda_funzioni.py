import json
import os
import sqlite3
from datetime import datetime

# Nome del file database SQLite locale
NOME_DB = "crm_ingrosso.db"


# ==============================================================================
# 1. LIVELLO DATABASE & LOGICA DI BUSINESS (Pronto per CLI, Desktop o Web App)
# ==============================================================================

def connetti():
    """Restituisce una connessione al database con row_factory per accedere alle colonne per nome."""
    conn = sqlite3.connect(NOME_DB)
    conn.row_factory = sqlite3.Row  # Consente accesso sia come tupla che come dizionario
    return conn


def crea_tabella():
    """
    Crea la tabella per la gestione e acquisizione contatti all'ingrosso.
    Campi:
    - id: identificativo numerico univoco
    - azienda: nome dell'azienda o del referente
    - telefono: numero di recapito telefonico
    - citta: località del potenziale acquirente
    - note: appunti commerciali (es. tipo attività, volumi stimati)
    - chiamato: 'Sì' oppure 'No'
    - esito: 'In attesa', 'Interessato (Ordine preso)', 'Non interessato (Rifiutato)', 'Da richiamare'
    - data_aggiornamento: timestamp dell'ultima modifica o chiamata
    """
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS contatti_ingrosso (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                azienda TEXT NOT NULL,
                telefono TEXT NOT NULL,
                citta TEXT DEFAULT '',
                note TEXT DEFAULT '',
                chiamato TEXT DEFAULT 'No',
                esito TEXT DEFAULT 'In attesa',
                data_aggiornamento TEXT
            )
        """)
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in crea_tabella: {e}")
        return False


def telefono_esiste(telefono):
    """Controlla se un numero di telefono è già registrato nel database per evitare duplicati."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("SELECT id FROM contatti_ingrosso WHERE telefono = ?", (telefono,))
        esiste = cur.fetchone() is not None
        conn.close()
        return esiste
    except sqlite3.Error as e:
        print(f"Errore database in telefono_esiste: {e}")
        return False


def aggiungi_contatto(azienda, telefono, citta="", note=""):
    """Aggiunge un nuovo potenziale acquirente da contattare."""
    try:
        conn = connetti()
        cur = conn.cursor()
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        cur.execute("""
            INSERT INTO contatti_ingrosso (azienda, telefono, citta, note, chiamato, esito, data_aggiornamento)
            VALUES (?, ?, ?, ?, 'No', 'In attesa', ?)
        """, (azienda, telefono, citta, note, data_ora))
        conn.commit()
        nuovo_id = cur.lastrowid
        conn.close()
        return nuovo_id
    except sqlite3.Error as e:
        print(f"Errore database in aggiungi_contatto: {e}")
        return None


def ottieni_tutti_contatti():
    """Restituisce la lista di tutti i contatti."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, azienda, telefono, citta, note, chiamato, esito, data_aggiornamento 
            FROM contatti_ingrosso 
            ORDER BY id ASC
        """)
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_tutti_contatti: {e}")
        return []


def ottieni_contatti_da_chiamare():
    """Filtra e restituisce solo i contatti ancora da chiamare (chiamato = 'No' o esito = 'Da richiamare')."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, azienda, telefono, citta, note, chiamato, esito, data_aggiornamento 
            FROM contatti_ingrosso 
            WHERE chiamato = 'No' OR esito = 'Da richiamare'
            ORDER BY id ASC
        """)
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_contatti_da_chiamare: {e}")
        return []


def cerca_contatti(termine):
    """Cerca contatti per nome azienda/referente, telefono o città."""
    try:
        conn = connetti()
        cur = conn.cursor()
        query = f"%{termine}%"
        cur.execute("""
            SELECT id, azienda, telefono, citta, note, chiamato, esito, data_aggiornamento 
            FROM contatti_ingrosso 
            WHERE azienda LIKE ? OR telefono LIKE ? OR citta LIKE ?
            ORDER BY id ASC
        """, (query, query, query))
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in cerca_contatti: {e}")
        return []


def id_esiste(id_contatto):
    """Verifica l'esistenza di un contatto tramite il suo ID."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("SELECT id FROM contatti_ingrosso WHERE id = ?", (id_contatto,))
        esiste = cur.fetchone() is not None
        conn.close()
        return esiste
    except sqlite3.Error as e:
        print(f"Errore database in id_esiste: {e}")
        return False


def registra_esito_chiamata(id_contatto, chiamato, esito, nuove_note=""):
    """
    Aggiorna lo stato della telefonata:
    - chiamato: 'Sì' o 'No'
    - esito: 'Interessato (Ordine preso)', 'Non interessato (Rifiutato)', 'Da richiamare', 'In attesa'
    - nuove_note: note addizionali scaturite dalla chiamata
    """
    try:
        conn = connetti()
        cur = conn.cursor()
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        if nuove_note.strip():
            cur.execute("""
                UPDATE contatti_ingrosso 
                SET chiamato = ?, esito = ?, note = note || ' | ' || ?, data_aggiornamento = ?
                WHERE id = ?
            """, (chiamato, esito, nuove_note.strip(), data_ora, id_contatto))
        else:
            cur.execute("""
                UPDATE contatti_ingrosso 
                SET chiamato = ?, esito = ?, data_aggiornamento = ?
                WHERE id = ?
            """, (chiamato, esito, data_ora, id_contatto))

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in registra_esito_chiamata: {e}")
        return False


def importa_contatti_da_json(percorso_file, ignora_duplicati_telefono=True):
    """
    Legge un file JSON contenente una lista di contatti e li inserisce nel database.
    Formato atteso: lista di dizionari con chiavi: 'azienda', 'telefono', opzionali: 'citta', 'note'.
    Restituisce un dizionario con: 'inseriti', 'duplicati', 'errori', 'totale_file'.
    """
    if not os.path.exists(percorso_file):
        return {"errore": f"Il file '{percorso_file}' non esiste."}

    try:
        with open(percorso_file, "r", encoding="utf-8") as f:
            dati = json.load(f)

        if not isinstance(dati, list):
            return {"errore": "Il file JSON deve contenere una lista di contatti (array racchiuso da [ ])."}

        inseriti = 0
        duplicati = 0
        errori = 0
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")

        conn = connetti()
        cur = conn.cursor()

        for c in dati:
            azienda = str(c.get("azienda", "")).strip()
            telefono = str(c.get("telefono", "")).strip()
            citta = str(c.get("citta", "")).strip()
            note = str(c.get("note", "")).strip()

            if not azienda or not telefono:
                errori += 1
                continue

            if ignora_duplicati_telefono:
                cur.execute("SELECT id FROM contatti_ingrosso WHERE telefono = ?", (telefono,))
                if cur.fetchone():
                    duplicati += 1
                    continue

            cur.execute("""
                INSERT INTO contatti_ingrosso (azienda, telefono, citta, note, chiamato, esito, data_aggiornamento)
                VALUES (?, ?, ?, ?, 'No', 'In attesa', ?)
            """, (azienda, telefono, citta, note, data_ora))
            inseriti += 1

        conn.commit()
        conn.close()

        return {
            "inseriti": inseriti,
            "duplicati": duplicati,
            "errori": errori,
            "totale_file": len(dati)
        }
    except json.JSONDecodeError as je:
        return {"errore": f"Errore di sintassi nel file JSON: {je}"}
    except Exception as e:
        return {"errore": f"Errore imprevisto durante l'importazione: {e}"}


def esporta_contatti_in_json(percorso_file):
    """
    Esporta tutti i contatti presenti nel database in un file JSON formattato.
    """
    try:
        contatti = ottieni_tutti_contatti()
        lista_dati = []
        for c in contatti:
            lista_dati.append({
                "id": c["id"],
                "azienda": c["azienda"],
                "telefono": c["telefono"],
                "citta": c["citta"],
                "note": c["note"],
                "chiamato": c["chiamato"],
                "esito": c["esito"],
                "data_aggiornamento": c["data_aggiornamento"]
            })

        with open(percorso_file, "w", encoding="utf-8") as f:
            json.dump(lista_dati, f, ensure_ascii=False, indent=2)

        return True, len(lista_dati)
    except Exception as e:
        print(f"Errore durante l'esportazione JSON: {e}")
        return False, 0


def ottieni_statistiche():
    """Calcola statistiche rapide per il cruscotto commerciale."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso")
        totali = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE chiamato = 'Sì'")
        chiamati = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE esito = 'Interessato (Ordine preso)'")
        interessati = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE esito = 'Non interessato (Rifiutato)'")
        rifiutati = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE chiamato = 'No' OR esito = 'Da richiamare'")
        da_contattare = cur.fetchone()[0]

        conn.close()
        return {
            "totali": totali,
            "chiamati": chiamati,
            "interessati": interessati,
            "rifiutati": rifiutati,
            "da_contattare": da_contattare
        }
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_statistiche: {e}")
        return None


def elimina_contatto(id_contatto):
    """Elimina un contatto dal database."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("DELETE FROM contatti_ingrosso WHERE id = ?", (id_contatto,))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in elimina_contatto: {e}")
        return False


# ==============================================================================
# 2. INTERFACCIA UTENTE (CLI - TERMINALE)
# ==============================================================================

def mostra_menu():
    """Visualizza il menu principale delle opzioni."""
    print("\n" + "=" * 58)
    print("   CRM ACQUISIZIONE CLIENTI ALL'INGROSSO (OUTREACH)   ")
    print("=" * 58)
    print("1. Inserisci manualmente un nuovo contatto (Nome e Numero)")
    print("2. Coda chiamate (Mostra solo contatti DA CHIAMARE)")
    print("3. Mostra TUTTI i contatti")
    print("4. Cerca contatto (per Nome, Telefono o Città)")
    print("5. Registra chiamata ed esito (Interessato / Rifiutato)")
    print("6. Cruscotto statistiche commerciali")
    print("7. IMPORTA contatti in blocco da file JSON")
    print("8. ESPORTA contatti correnti in file JSON")
    print("9. Elimina un contatto")
    print("10. Esci")
    print("-" * 58)


def stampa_tabella_contatti(righe):
    """Stampa l'elenco dei contatti con formattazione chiara e leggibile."""
    if not righe:
        print("\nNessun contatto trovato.")
        return

    print("\n" + "-" * 110)
    print(f"{'ID':<4} | {'Azienda / Referente':<25} | {'Telefono':<15} | {'Città':<12} | {'Chiamato':<9} | {'Esito':<25}")
    print("-" * 110)
    for r in righe:
        print(
            f"{r['id']:<4} | "
            f"{r['azienda'][:24]:<25} | "
            f"{r['telefono'][:14]:<15} | "
            f"{(r['citta'] or '-')[:11]:<12} | "
            f"{r['chiamato']:<9} | "
            f"{r['esito'][:24]:<25}"
        )
        if r['note']:
            print(f"     Note: {r['note']} (Ultimo agg.: {r['data_aggiornamento']})")
    print("-" * 110)


def chiedi_id_valido():
    """Richiede all'utente un ID numerico valido."""
    while True:
        valore = input("Inserisci l'ID del contatto: ").strip()
        if valore.isdigit():
            return int(valore)
        print("Errore: devi inserire un numero intero valido!")


def procedura_registra_chiamata():
    """Guida passo-passo per registrare l'esito di una telefonata commerciale."""
    print("\n--- REGISTRAZIONE ESITO CHIAMATA COMMERCIALE ---")
    
    # Offri la possibilità di vedere la coda prima
    scelta_elenco = input("Vuoi visualizzare la lista dei contatti da chiamare? (s/n): ").strip().lower()
    if scelta_elenco == "s":
        da_chiamare = ottieni_contatti_da_chiamare()
        stampa_tabella_contatti(da_chiamare)
        if not da_chiamare:
            return

    id_contatto = chiedi_id_valido()
    if not id_esiste(id_contatto):
        print(f"Errore: nessun contatto trovato con ID {id_contatto}.")
        return

    # 1. Chiamato: Sì o No
    print("\nIl contatto è stato chiamato?")
    print("1. Sì")
    print("2. No (o non ha risposto)")
    scelta_chiamata = input("Seleziona (1 o 2): ").strip()
    while scelta_chiamata not in ["1", "2"]:
        print("Scelta non valida! Inserisci 1 per 'Sì' oppure 2 per 'No'.")
        scelta_chiamata = input("Seleziona (1 o 2): ").strip()

    chiamato = "Sì" if scelta_chiamata == "1" else "No"

    # 2. Esito commerciale
    print("\nQual è l'interesse per gli acquisti all'ingrosso?")
    print("1. Interessato (Ordine preso)")
    print("2. Non interessato (Rifiutato)")
    print("3. Da richiamare (Occupato / Valuterà il listino)")
    print("4. In attesa (Non ancora contattabile)")
    
    scelta_esito = input("Seleziona esito (1-4): ").strip()
    while scelta_esito not in ["1", "2", "3", "4"]:
        print("Scelta non valida! Inserisci un numero tra 1 e 4.")
        scelta_esito = input("Seleziona esito (1-4): ").strip()

    mappa_esiti = {
        "1": "Interessato (Ordine preso)",
        "2": "Non interessato (Rifiutato)",
        "3": "Da richiamare",
        "4": "In attesa"
    }
    esito = mappa_esiti[scelta_esito]

    # 3. Note aggiuntive
    note_call = input("Aggiungi note della chiamata (es. quantità richieste, motivo rifiuto, etc. - Invio per saltare): ").strip()

    if registra_esito_chiamata(id_contatto, chiamato, esito, note_call):
        print(f"\nEsito registrato con successo!")
        print(f"-> ID {id_contatto} | Chiamato: {chiamato} | Esito: {esito}")
    else:
        print("Si è verificato un errore durante l'aggiornamento.")


def procedura_importazione_json():
    """Guida interattiva per l'importazione in blocco da file JSON."""
    print("\n--- IMPORTAZIONE CONTATTI DA FILE JSON ---")
    file_default = "contatti_lead.json"
    print(f"File predefinito rilevato nella cartella: '{file_default}'")
    percorso = input(f"Inserisci il nome del file JSON (Premi INVIO per usare '{file_default}'): ").strip()
    
    if percorso == "":
        percorso = file_default

    print(f"Lettura del file '{percorso}' in corso...")
    risultato = importa_contatti_da_json(percorso)

    if "errore" in risultato:
        print(f"Errore nell'importazione: {risultato['errore']}")
    else:
        print("\n" + "=" * 45)
        print("      ESITO IMPORTAZIONE IN BLOCCO      ")
        print("=" * 45)
        print(f"Contatti totali nel file    : {risultato['totale_file']}")
        print(f"Contatti importati con succ.: {risultato['inseriti']}")
        print(f"Duplicati saltati (tel. già): {risultato['duplicati']}")
        print(f"Voci ignorate per dati manc.: {risultato['errori']}")
        print("=" * 45)


def procedura_esportazione_json():
    """Guida interattiva per l'esportazione del database in JSON."""
    print("\n--- ESPORTAZIONE CONTATTI IN FORMATO JSON ---")
    nome_default = "backup_contatti.json"
    percorso = input(f"Nome file dove esportare (INVIO per '{nome_default}'): ").strip()
    if percorso == "":
        percorso = nome_default

    successo, conteggio = esporta_contatti_in_json(percorso)
    if successo:
        print(f"Esportazione completata con successo! Salvati {conteggio} contatti in '{percorso}'.")
    else:
        print("Errore durante l'esportazione del file.")


# ==============================================================================
# 3. LOOP PRINCIPALE
# ==============================================================================

def main():
    if not crea_tabella():
        print("Errore critico: impossibile inizializzare il database.")
        return

    print("Database CRM contatti pronto all'uso.")

    while True:
        mostra_menu()
        scelta = input("Scegli un'opzione (1-10): ").strip()

        # OPZIONE 1: Aggiungi contatto manuale
        if scelta == "1":
            azienda = input("Nome Azienda / Negozio / Referente: ").strip()
            while azienda == "":
                print("Errore: il nome azienda non può essere vuoto!")
                azienda = input("Nome Azienda / Negozio / Referente: ").strip()

            telefono = input("Numero di telefono da chiamare: ").strip()
            while telefono == "":
                print("Errore: il numero di telefono non può essere vuoto!")
                telefono = input("Numero di telefono da chiamare: ").strip()

            if telefono_esiste(telefono):
                conferma = input("Attenzione: questo numero è già presente a database! Vuoi aggiungerlo comunque? (s/n): ").strip().lower()
                if conferma != "s":
                    print("Operazione annullata.")
                    continue

            citta = input("Città / Regione (opzionale): ").strip()
            note = input("Note iniziali (es. tipo punto vendita, referenza): ").strip()

            nuovo_id = aggiungi_contatto(azienda, telefono, citta, note)
            if nuovo_id:
                print(f"\nContatto '{azienda}' inserito con successo con ID {nuovo_id}!")
                print("Stato iniziale: Chiamato = No | Esito = In attesa")

        # OPZIONE 2: Coda chiamate
        elif scelta == "2":
            da_chiamare = ottieni_contatti_da_chiamare()
            print(f"\n>>> CODA TELEFONATE: {len(da_chiamare)} contatti da contattare o richiamare <<<")
            stampa_tabella_contatti(da_chiamare)

        # OPZIONE 3: Mostra tutti
        elif scelta == "3":
            tutti = ottieni_tutti_contatti()
            stampa_tabella_contatti(tutti)

        # OPZIONE 4: Cerca contatti
        elif scelta == "4":
            termine = input("Inserisci termine di ricerca (Nome, Telefono o Città): ").strip()
            while termine == "":
                print("Errore: inserisci un valore da cercare!")
                termine = input("Inserisci termine di ricerca: ").strip()

            risultati = cerca_contatti(termine)
            stampa_tabella_contatti(risultati)

        # OPZIONE 5: Registra esito chiamata
        elif scelta == "5":
            procedura_registra_chiamata()

        # OPZIONE 6: Statistiche
        elif scelta == "6":
            stats = ottieni_statistiche()
            if stats:
                print("\n" + "=" * 40)
                print("      CRUSCOTTO ACQUISIZIONE CLIENTI    ")
                print("=" * 40)
                print(f"Totale numeri/contatti a database : {stats['totali']}")
                print(f"Contatti già chiamati             : {stats['chiamati']}")
                print(f"Da contattare o richiamare        : {stats['da_contattare']}")
                print(f"Interessati (Ordine preso)        : {stats['interessati']}")
                print(f"Non interessati (Rifiutati)       : {stats['rifiutati']}")
                if stats['chiamati'] > 0:
                    tasso_conversione = (stats['interessati'] / stats['chiamati']) * 100
                    print(f"Tasso di conversione ordini       : {tasso_conversione:.1f}%")
                print("=" * 40)

        # OPZIONE 7: Importa contatti da JSON
        elif scelta == "7":
            procedura_importazione_json()

        # OPZIONE 8: Esporta contatti in JSON
        elif scelta == "8":
            procedura_esportazione_json()

        # OPZIONE 9: Elimina contatto
        elif scelta == "9":
            tutti = ottieni_tutti_contatti()
            if not tutti:
                print("Nessun contatto presente da eliminare.")
                continue

            stampa_tabella_contatti(tutti)
            id_elimina = chiedi_id_valido()

            if not id_esiste(id_elimina):
                print(f"Errore: nessun contatto trovato con ID {id_elimina}.")
            else:
                conferma = input(f"Sei sicuro di voler eliminare il contatto ID {id_elimina}? (s/n): ").strip().lower()
                if conferma == "s":
                    if elimina_contatto(id_elimina):
                        print("Contatto rimosso con successo.")
                else:
                    print("Operazione annullata.")

        # OPZIONE 10: Esci
        elif scelta == "10":
            print("\nChiusura gestionale acquisizione clienti. Buon lavoro!")
            break

        else:
            print("Opzione non valida! Inserisci un numero da 1 a 10.")


if __name__ == "__main__":
    main()