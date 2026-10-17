import csv
import io
import json
import os
import re
import sqlite3
from datetime import datetime

# Nome del file database SQLite locale
NOME_DB = "crm_ingrosso.db"

# ==============================================================================
# 0. DOMINIO PURO: MAPPATURA GEOGRAFICA E NORMALIZZAZIONE (ZERO I/O)
# ==============================================================================

MAPPA_CITTA_REGIONE = {
    # Lazio
    "roma": "Lazio", "latina": "Lazio", "frosinone": "Lazio", "viterbo": "Lazio",
    "rieti": "Lazio", "civitavecchia": "Lazio", "tivoli": "Lazio", "velletri": "Lazio",
    "pomezia": "Lazio", "guidonia": "Lazio", "anzio": "Lazio", "terracina": "Lazio",
    # Lombardia
    "milano": "Lombardia", "brescia": "Lombardia", "bergamo": "Lombardia", "monza": "Lombardia",
    "como": "Lombardia", "varese": "Lombardia", "pavia": "Lombardia", "cremona": "Lombardia",
    "mantova": "Lombardia", "lecco": "Lombardia", "lodi": "Lombardia", "sondrio": "Lombardia",
    "busto arsizio": "Lombardia", "sesto san giovanni": "Lombardia", "vigevano": "Lombardia",
    "legnano": "Lombardia", "gallarate": "Lombardia", "desenzano": "Lombardia",
    # Campania
    "napoli": "Campania", "salerno": "Campania", "caserta": "Campania", "avellino": "Campania",
    "benevento": "Campania", "aversa": "Campania", "torre del greco": "Campania",
    "pozzuoli": "Campania", "castellammare di stabia": "Campania", "amalfi": "Campania",
    "sorrento": "Campania", "capri": "Campania", "ischia": "Campania", "nola": "Campania",
    # Piemonte
    "torino": "Piemonte", "novara": "Piemonte", "alessandria": "Piemonte", "asti": "Piemonte",
    "cuneo": "Piemonte", "biella": "Piemonte", "vercelli": "Piemonte", "verbania": "Piemonte",
    "moncalieri": "Piemonte", "alba": "Piemonte", "ivrea": "Piemonte",
    # Toscana
    "firenze": "Toscana", "prato": "Toscana", "livorno": "Toscana", "arezzo": "Toscana",
    "pisa": "Toscana", "pistoia": "Toscana", "lucca": "Toscana", "grosseto": "Toscana",
    "massa": "Toscana", "carrara": "Toscana", "siena": "Toscana", "viareggio": "Toscana",
    "forte dei marmi": "Toscana", "empoli": "Toscana", "santa croce sull'arno": "Toscana",
    "fucecchio": "Toscana", "monsummano terme": "Toscana",
    # Emilia-Romagna
    "bologna": "Emilia-Romagna", "modena": "Emilia-Romagna", "parma": "Emilia-Romagna",
    "reggio emilia": "Emilia-Romagna", "reggio nell'emilia": "Emilia-Romagna",
    "ravenna": "Emilia-Romagna", "rimini": "Emilia-Romagna", "ferrara": "Emilia-Romagna",
    "forli": "Emilia-Romagna", "forlì": "Emilia-Romagna", "cesena": "Emilia-Romagna",
    "piacenza": "Emilia-Romagna", "imola": "Emilia-Romagna", "carpi": "Emilia-Romagna",
    "riccione": "Emilia-Romagna", "san mauro pascoli": "Emilia-Romagna",
    # Veneto
    "venezia": "Veneto", "verona": "Veneto", "padova": "Veneto", "vicenza": "Veneto",
    "treviso": "Veneto", "rovigo": "Veneto", "belluno": "Veneto", "mestre": "Veneto",
    "bassano del grappa": "Veneto", "jesolo": "Veneto", "cortina d'ampezzo": "Veneto",
    "montebelluna": "Veneto", "stra": "Veneto",
    # Puglia
    "bari": "Puglia", "taranto": "Puglia", "foggia": "Puglia", "lecce": "Puglia",
    "brindisi": "Puglia", "barletta": "Puglia", "andria": "Puglia", "trani": "Puglia",
    "altamura": "Puglia", "molfetta": "Puglia", "casarano": "Puglia", "monopoli": "Puglia",
    # Sicilia
    "palermo": "Sicilia", "catania": "Sicilia", "messina": "Sicilia", "siracusa": "Sicilia",
    "ragusa": "Sicilia", "trapani": "Sicilia", "agrigento": "Sicilia", "caltanissetta": "Sicilia",
    "enna": "Sicilia", "taormina": "Sicilia", "marsala": "Sicilia", "acireale": "Sicilia",
    # Liguria
    "genova": "Liguria", "la spezia": "Liguria", "savona": "Liguria", "imperia": "Liguria",
    "sanremo": "Liguria", "rapallo": "Liguria", "portofino": "Liguria", "chiavari": "Liguria",
    # Marche (Distretto Calzaturiero)
    "ancona": "Marche", "pesaro": "Marche", "urbino": "Marche", "macerata": "Marche",
    "fermo": "Marche", "ascoli piceno": "Marche", "civitanova marche": "Marche",
    "porto sant'elpidio": "Marche", "sant'elpidio a mare": "Marche", "montegranaro": "Marche",
    "monte urano": "Marche", "san benedetto del tronto": "Marche", "senigallia": "Marche",
    "fano": "Marche", "jesi": "Marche", "tolentino": "Marche",
    # Abruzzo
    "l'aquila": "Abruzzo", "aquila": "Abruzzo", "pescara": "Abruzzo", "chieti": "Abruzzo",
    "teramo": "Abruzzo", "montesilvano": "Abruzzo", "vasto": "Abruzzo", "avezzano": "Abruzzo",
    # Umbria
    "perugia": "Umbria", "terni": "Umbria", "foligno": "Umbria", "assisi": "Umbria",
    "spoleto": "Umbria", "orvieto": "Umbria", "citta di castello": "Umbria", "città di castello": "Umbria",
    # Friuli-Venezia Giulia
    "trieste": "Friuli-Venezia Giulia", "udine": "Friuli-Venezia Giulia",
    "pordenone": "Friuli-Venezia Giulia", "gorizia": "Friuli-Venezia Giulia", "monfalcone": "Friuli-Venezia Giulia",
    # Trentino-Alto Adige
    "trento": "Trentino-Alto Adige", "bolzano": "Trentino-Alto Adige",
    "merano": "Trentino-Alto Adige", "rovereto": "Trentino-Alto Adige", "bressanone": "Trentino-Alto Adige",
    # Calabria
    "catanzaro": "Calabria", "reggio calabria": "Calabria", "cosenza": "Calabria",
    "crotone": "Calabria", "vibo valentia": "Calabria", "lamezia terme": "Calabria",
    # Sardegna
    "cagliari": "Sardegna", "sassari": "Sardegna", "olbia": "Sardegna", "nuoro": "Sardegna",
    "oristano": "Sardegna", "alghero": "Sardegna", "porto cervo": "Sardegna", "quartu sant'elena": "Sardegna",
    # Basilicata
    "potenza": "Basilicata", "matera": "Basilicata",
    # Molise
    "campobasso": "Molise", "isernia": "Molise", "termoli": "Molise",
    # Valle d'Aosta
    "aosta": "Valle d'Aosta", "courmayeur": "Valle d'Aosta"
}

REGIONI_ITALIANE_UFFICIALI = {
    "abruzzo": "Abruzzo",
    "basilicata": "Basilicata",
    "calabria": "Calabria",
    "campania": "Campania",
    "emilia-romagna": "Emilia-Romagna",
    "emilia romagna": "Emilia-Romagna",
    "friuli-venezia giulia": "Friuli-Venezia Giulia",
    "friuli venezia giulia": "Friuli-Venezia Giulia",
    "friuli": "Friuli-Venezia Giulia",
    "lazio": "Lazio",
    "liguria": "Liguria",
    "lombardia": "Lombardia",
    "marche": "Marche",
    "molise": "Molise",
    "piemonte": "Piemonte",
    "puglia": "Puglia",
    "sardegna": "Sardegna",
    "sicilia": "Sicilia",
    "toscana": "Toscana",
    "trentino-alto adige": "Trentino-Alto Adige",
    "trentino alto adige": "Trentino-Alto Adige",
    "trentino": "Trentino-Alto Adige",
    "alto adige": "Trentino-Alto Adige",
    "umbria": "Umbria",
    "valle d'aosta": "Valle d'Aosta",
    "val d'aosta": "Valle d'Aosta",
    "veneto": "Veneto",
}


def deduci_regione(citta):
    """
    Restituisce automaticamente la Regione italiana corrispondente a una città.
    Funzione pura di dominio (Zero I/O).
    """
    if not citta:
        return ""
    testo = str(citta).strip().lower()
    if not testo:
        return ""

    # Se la stringa contiene parentesi o separatori es. "Milano (Lombardia)" o "Roma - Lazio"
    parti = re.split(r"[\(\)\-\/,;]+", testo)
    for p in parti:
        p_clean = p.strip()
        if p_clean in MAPPA_CITTA_REGIONE:
            return MAPPA_CITTA_REGIONE[p_clean]
        if p_clean in REGIONI_ITALIANE_UFFICIALI:
            return REGIONI_ITALIANE_UFFICIALI[p_clean]

    # Ricerca per corrispondenza parziale di parola
    for chiave_citta, regione in MAPPA_CITTA_REGIONE.items():
        if re.search(r"\b" + re.escape(chiave_citta) + r"\b", testo):
            return regione

    return ""


def normalizza_telefono(tel):
    """
    Normalizza un numero telefonico rimuovendo spazi, punti, trattini, barre,
    parentesi e il prefisso internazionale italiano (+39 o 0039).
    """
    if not tel:
        return ""
    s = str(tel).strip()
    # Rimuove caratteri di formattazione comuni
    s = re.sub(r"[\s\.\-\/\(\)]+", "", s)
    # Rimuove prefisso internazionale +39 o 0039
    if s.startswith("+39"):
        s = s[3:]
    elif s.startswith("0039"):
        s = s[4:]
    # Mantiene solo cifre e eventuale + per numeri esteri non italiani
    s = re.sub(r"[^\d+]", "", s)
    return s


def normalizza_azienda(nome):
    """
    Normalizza la ragione sociale in minuscolo, rimuovendo forme societarie
    (srl, s.r.l., srls, spa, snc, sas, ecc.), punteggiatura e spazi.
    """
    if not nome:
        return ""
    s = str(nome).lower().strip()
    # Rimuove le forme giuridiche con punteggiatura opzionale
    s = re.sub(
        r"\b(s\.?\s*r\.?\s*l\.?\s*s\.?|s\.?\s*r\.?\s*l\.?|s\.?\s*p\.?\s*a\.?|s\.?\s*n\.?\s*c\.?|s\.?\s*a\.?\s*s\.?|s\.?\s*c\.?\s*a\.?\s*r\.?\s*l\.?|unipersonale|ditta\s+individuale)\b",
        "",
        s,
    )
    # Rimuove qualsiasi punteggiatura e spazio residuo
    s = re.sub(r"[^a-z0-9àèéìòù]", "", s)
    return s


def _parse_priorita(valore, default=2):
    """Converte un valore testuale o numerico in priorità valida (1=Alta, 2=Normale, 3=Bassa)."""
    if valore is None:
        return default
    if isinstance(valore, int) and valore in (1, 2, 3):
        return valore
    s = str(valore).strip().lower()
    if s in ("1", "alta", "massima", "urgente", "high"):
        return 1
    if s in ("2", "normale", "media", "normal", "medium"):
        return 2
    if s in ("3", "bassa", "low"):
        return 3
    return default


def _parse_importo(valore, default=0.0):
    """Converte un valore numerico o stringa formattata in Euro in float."""
    if valore is None or valore == "":
        return default
    if isinstance(valore, (int, float)):
        return round(float(valore), 2)
    s = str(valore).strip()
    s = re.sub(r"[€$£\sA-Za-z]", "", s)
    if not s:
        return default
    # Gestisce formato italiano 1.250,50 vs formato inglese 1,250.50 o 1250,50
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return round(float(s), 2)
    except ValueError:
        return default


# ==============================================================================
# 1. LIVELLO DATABASE & LOGICA DI BUSINESS (Pronto per CLI, Desktop o Web App)
# ==============================================================================

def connetti():
    """Restituisce una connessione al database con row_factory e foreign keys attive."""
    conn = sqlite3.connect(NOME_DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def crea_tabella():
    """
    Crea e aggiorna lo schema del database:
    1. Tabella `contatti_ingrosso` con migrazione dinamica automatica via PRAGMA table_info
       per le colonne: referente, regione, priorita, totale_ordini, numero_ordini.
    2. Tabella `storico_ordini` con chiave esterna ON DELETE CASCADE.
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
                data_aggiornamento TEXT,
                referente TEXT DEFAULT '',
                regione TEXT DEFAULT '',
                priorita INTEGER DEFAULT 2,
                totale_ordini REAL DEFAULT 0.0,
                numero_ordini INTEGER DEFAULT 0
            )
        """)

        # Migrazione dinamica per database esistenti
        cur.execute("PRAGMA table_info(contatti_ingrosso)")
        colonne_esistenti = {row["name"] for row in cur.fetchall()}

        nuove_colonne = [
            ("referente", "TEXT DEFAULT ''"),
            ("regione", "TEXT DEFAULT ''"),
            ("priorita", "INTEGER DEFAULT 2"),
            ("totale_ordini", "REAL DEFAULT 0.0"),
            ("numero_ordini", "INTEGER DEFAULT 0"),
        ]
        for nome_col, definizione in nuove_colonne:
            if nome_col not in colonne_esistenti:
                cur.execute(f"ALTER TABLE contatti_ingrosso ADD COLUMN {nome_col} {definizione}")

        # Tabella storico_ordini
        cur.execute("""
            CREATE TABLE IF NOT EXISTS storico_ordini (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contatto_id INTEGER NOT NULL,
                importo REAL NOT NULL,
                note_ordine TEXT DEFAULT '',
                data_ordine TEXT NOT NULL,
                FOREIGN KEY (contatto_id) REFERENCES contatti_ingrosso(id) ON DELETE CASCADE
            )
        """)

        # Allinea eventuali valori NULL e deduce la regione per i contatti già presenti senza regione
        cur.execute("""
            UPDATE contatti_ingrosso
            SET referente = COALESCE(referente, ''),
                regione = COALESCE(regione, ''),
                priorita = COALESCE(priorita, 2),
                totale_ordini = COALESCE(totale_ordini, 0.0),
                numero_ordini = COALESCE(numero_ordini, 0)
        """)

        cur.execute("SELECT id, citta, regione FROM contatti_ingrosso WHERE (regione IS NULL OR regione = '') AND citta != ''")
        da_aggiornare = cur.fetchall()
        for r in da_aggiornare:
            reg = deduci_regione(r["citta"])
            if reg:
                cur.execute("UPDATE contatti_ingrosso SET regione = ? WHERE id = ?", (reg, r["id"]))

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in crea_tabella: {e}")
        return False


def _riga_a_dict(r):
    """Converte un sqlite3.Row di contatti_ingrosso in dizionario completo e retrocompatibile."""
    if r is None:
        return None
    chiavi = r.keys()
    citta = r["citta"] if "citta" in chiavi and r["citta"] else ""
    regione = r["regione"] if "regione" in chiavi and r["regione"] else ""
    if not regione and citta:
        regione = deduci_regione(citta)
    return {
        "id": r["id"],
        "azienda": r["azienda"],
        "referente": r["referente"] if "referente" in chiavi and r["referente"] is not None else "",
        "telefono": r["telefono"],
        "citta": citta,
        "regione": regione,
        "note": r["note"] if "note" in chiavi and r["note"] is not None else "",
        "chiamato": r["chiamato"] if "chiamato" in chiavi and r["chiamato"] else "No",
        "esito": r["esito"] if "esito" in chiavi and r["esito"] else "In attesa",
        "priorita": int(r["priorita"]) if "priorita" in chiavi and r["priorita"] in (1, 2, 3) else 2,
        "totale_ordini": round(float(r["totale_ordini"] or 0.0), 2) if "totale_ordini" in chiavi else 0.0,
        "numero_ordini": int(r["numero_ordini"] or 0) if "numero_ordini" in chiavi else 0,
        "data_aggiornamento": r["data_aggiornamento"] if "data_aggiornamento" in chiavi and r["data_aggiornamento"] else "",
        "ultimo_ordine": r["ultimo_ordine"] if "ultimo_ordine" in chiavi and r["ultimo_ordine"] else (r["data_aggiornamento"] if "data_aggiornamento" in chiavi else ""),
    }


def telefono_esiste(telefono, escludi_id=None):
    """
    Controlla se un numero di telefono è già registrato nel database usando
    normalizza_telefono() per bloccare duplicati anche con spazi o prefissi diversi.
    """
    tel_norm = normalizza_telefono(telefono)
    if not tel_norm:
        return False
    try:
        conn = connetti()
        cur = conn.cursor()
        if escludi_id is not None:
            cur.execute("SELECT id, telefono FROM contatti_ingrosso WHERE id != ?", (escludi_id,))
        else:
            cur.execute("SELECT id, telefono FROM contatti_ingrosso")
        righe = cur.fetchall()
        conn.close()
        for r in righe:
            if normalizza_telefono(r["telefono"]) == tel_norm:
                return True
        return False
    except sqlite3.Error as e:
        print(f"Errore database in telefono_esiste: {e}")
        return False


def aggiungi_contatto(
    azienda,
    telefono,
    citta="",
    note="",
    referente="",
    regione="",
    priorita=2,
    totale_ordini=0.0,
):
    """Aggiunge un nuovo potenziale acquirente da contattare (retrocompatibile)."""
    try:
        conn = connetti()
        cur = conn.cursor()
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        citta_clean = str(citta or "").strip()
        regione_clean = str(regione or "").strip()
        if not regione_clean and citta_clean:
            regione_clean = deduci_regione(citta_clean)
        referente_clean = str(referente or "").strip()
        priorita_val = _parse_priorita(priorita, default=2)
        importo_iniziale = _parse_importo(totale_ordini, default=0.0)

        chiamato_init = "Sì" if importo_iniziale > 0 else "No"
        esito_init = "Interessato (Ordine preso)" if importo_iniziale > 0 else "In attesa"
        num_ordini_init = 1 if importo_iniziale > 0 else 0

        cur.execute(
            """
            INSERT INTO contatti_ingrosso (
                azienda, referente, telefono, citta, regione, note,
                chiamato, esito, priorita, totale_ordini, numero_ordini, data_aggiornamento
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(azienda).strip(),
                referente_clean,
                str(telefono).strip(),
                citta_clean,
                regione_clean,
                str(note or "").strip(),
                chiamato_init,
                esito_init,
                priorita_val,
                importo_iniziale,
                num_ordini_init,
                data_ora,
            ),
        )
        nuovo_id = cur.lastrowid

        if importo_iniziale > 0 and nuovo_id:
            cur.execute(
                """
                INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine)
                VALUES (?, ?, ?, ?)
                """,
                (nuovo_id, importo_iniziale, "Ordine iniziale registrato in anagrafica", data_ora),
            )

        conn.commit()
        conn.close()
        return nuovo_id
    except sqlite3.Error as e:
        print(f"Errore database in aggiungi_contatto: {e}")
        return None


def ottieni_tutti_contatti():
    """Restituisce la lista di tutti i contatti ordinata per priorita ASC, id ASC."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.azienda, c.referente, c.telefono, c.citta, c.regione, c.note,
                   c.chiamato, c.esito, c.priorita, c.totale_ordini, c.numero_ordini,
                   c.data_aggiornamento,
                   (SELECT MAX(s.data_ordine) FROM storico_ordini s WHERE s.contatto_id = c.id) AS ultimo_ordine
            FROM contatti_ingrosso c
            ORDER BY c.priorita ASC, c.id ASC
        """)
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_tutti_contatti: {e}")
        return []


def ottieni_contatti_da_chiamare():
    """
    Filtra e restituisce solo i contatti ancora da chiamare
    (chiamato = 'No' o esito = 'Da richiamare'), ordinati per priorita ASC, id ASC.
    """
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.azienda, c.referente, c.telefono, c.citta, c.regione, c.note,
                   c.chiamato, c.esito, c.priorita, c.totale_ordini, c.numero_ordini,
                   c.data_aggiornamento,
                   (SELECT MAX(s.data_ordine) FROM storico_ordini s WHERE s.contatto_id = c.id) AS ultimo_ordine
            FROM contatti_ingrosso c
            WHERE c.chiamato = 'No' OR c.esito = 'Da richiamare'
            ORDER BY c.priorita ASC, c.id ASC
        """)
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_contatti_da_chiamare: {e}")
        return []


def ottieni_ordini_confermati(ordina_per="priorita"):
    """
    Restituisce i clienti con ordini confermati (esito = 'Interessato (Ordine preso)' o totale_ordini > 0).
    Supporta ordinamento per 'priorita' (priorita ASC, id ASC), 'totale_ordini' (DESC), 'numero_ordini' (DESC).
    """
    try:
        conn = connetti()
        cur = conn.cursor()
        if ordina_per == "totale_ordini":
            order_clause = "c.totale_ordini DESC, c.priorita ASC, c.id ASC"
        elif ordina_per == "numero_ordini":
            order_clause = "c.numero_ordini DESC, c.totale_ordini DESC, c.priorita ASC, c.id ASC"
        else:
            order_clause = "c.priorita ASC, c.id ASC"

        cur.execute(f"""
            SELECT c.id, c.azienda, c.referente, c.telefono, c.citta, c.regione, c.note,
                   c.chiamato, c.esito, c.priorita, c.totale_ordini, c.numero_ordini,
                   c.data_aggiornamento,
                   COALESCE(
                       (SELECT MAX(s.data_ordine) FROM storico_ordini s WHERE s.contatto_id = c.id),
                       c.data_aggiornamento
                   ) AS ultimo_ordine
            FROM contatti_ingrosso c
            WHERE c.esito = 'Interessato (Ordine preso)' OR c.totale_ordini > 0 OR c.numero_ordini > 0
            ORDER BY {order_clause}
        """)
        righe = cur.fetchall()
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_ordini_confermati: {e}")
        return []


def cerca_contatti(termine):
    """Cerca contatti per nome azienda, referente, telefono, città, regione o note."""
    try:
        conn = connetti()
        cur = conn.cursor()
        query = f"%{termine}%"
        cur.execute("""
            SELECT c.id, c.azienda, c.referente, c.telefono, c.citta, c.regione, c.note,
                   c.chiamato, c.esito, c.priorita, c.totale_ordini, c.numero_ordini,
                   c.data_aggiornamento,
                   (SELECT MAX(s.data_ordine) FROM storico_ordini s WHERE s.contatto_id = c.id) AS ultimo_ordine
            FROM contatti_ingrosso c
            WHERE c.azienda LIKE ?
               OR c.referente LIKE ?
               OR c.telefono LIKE ?
               OR c.citta LIKE ?
               OR c.regione LIKE ?
               OR c.note LIKE ?
            ORDER BY c.priorita ASC, c.id ASC
        """, (query, query, query, query, query, query))
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


def _accoda_nota_sql(nota_esistente, nuova_nota):
    """Unisce in modo pulito una nuova nota a quelle esistenti usando il separatore ' | '."""
    esistente = str(nota_esistente or "").strip()
    nuova = str(nuova_nota or "").strip()
    if not nuova:
        return esistente
    if not esistente:
        return nuova
    return f"{esistente} | {nuova}"


def _ricalcola_ordini_contatto(cur, contatto_id):
    """Ricalcola e aggiorna totale_ordini e numero_ordini per contatto_id a partire da storico_ordini."""
    cur.execute(
        "SELECT COUNT(*) AS cnt, COALESCE(SUM(importo), 0.0) AS tot FROM storico_ordini WHERE contatto_id = ?",
        (contatto_id,),
    )
    row = cur.fetchone()
    cnt = int(row["cnt"] or 0)
    tot = round(float(row["tot"] or 0.0), 2)
    cur.execute(
        "UPDATE contatti_ingrosso SET totale_ordini = ?, numero_ordini = ? WHERE id = ?",
        (tot, cnt, contatto_id),
    )
    return tot, cnt


def registra_esito_chiamata(
    id_contatto,
    chiamato,
    esito,
    nuove_note="",
    importo_ordine=0.0,
    referente=None,
    priorita=None,
):
    """
    Aggiorna lo stato della telefonata e gestisce eventuale ordine confermato:
    - chiamato: 'Sì' o 'No'
    - esito: 'Interessato (Ordine preso)', 'Non interessato (Rifiutato)', 'Da richiamare', 'In attesa'
    - nuove_note: note addizionali scaturite dalla chiamata
    - importo_ordine: float opzionale (in €). Se esito = 'Interessato (Ordine preso)' e importo_ordine > 0:
      inserisce in storico_ordini, ricalcola totale_ordini e numero_ordini, e formatta la nota ordine.
    - referente: stringa opzionale per aggiornare il referente del contatto
    - priorita: intero opzionale (1, 2, 3) per aggiornare la priorità
    """
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("SELECT * FROM contatti_ingrosso WHERE id = ?", (id_contatto,))
        record = cur.fetchone()
        if not record:
            conn.close()
            return False

        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        importo_val = _parse_importo(importo_ordine, default=0.0)
        note_input = str(nuove_note or "").strip()

        # Costruzione nota da accodare
        if esito == "Interessato (Ordine preso)" and importo_val > 0:
            suffisso_nota = f" - {note_input}" if note_input else ""
            nota_formattata = f"[{data_ora}] ORDINE CONFERMATO: € {importo_val:.2f}{suffisso_nota}"
            nota_finale = _accoda_nota_sql(record["note"], nota_formattata)
        else:
            nota_finale = _accoda_nota_sql(record["note"], note_input)

        nuovo_referente = record["referente"] or ""
        if referente is not None and str(referente).strip() != "":
            nuovo_referente = str(referente).strip()

        nuova_priorita = record["priorita"] if record["priorita"] in (1, 2, 3) else 2
        if priorita is not None:
            nuova_priorita = _parse_priorita(priorita, default=nuova_priorita)

        cur.execute(
            """
            UPDATE contatti_ingrosso
            SET chiamato = ?, esito = ?, note = ?, referente = ?, priorita = ?, data_aggiornamento = ?
            WHERE id = ?
            """,
            (chiamato, esito, nota_finale, nuovo_referente, nuova_priorita, data_ora, id_contatto),
        )

        # Se è stato confermato un ordine con importo > 0, registra in storico_ordini e ricalcola
        if esito == "Interessato (Ordine preso)" and importo_val > 0:
            # Se il contatto aveva un totale_ordini pregresso senza record in storico_ordini, sincronizzalo
            cur.execute("SELECT COUNT(*) AS cnt FROM storico_ordini WHERE contatto_id = ?", (id_contatto,))
            cnt_esistenti = cur.fetchone()["cnt"]
            tot_pregresso = float(record["totale_ordini"] or 0.0)
            if cnt_esistenti == 0 and tot_pregresso > 0:
                cur.execute(
                    "INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine) VALUES (?, ?, ?, ?)",
                    (id_contatto, tot_pregresso, "Storico pregresso", record["data_aggiornamento"] or data_ora),
                )

            cur.execute(
                """
                INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine)
                VALUES (?, ?, ?, ?)
                """,
                (id_contatto, importo_val, note_input, data_ora),
            )
            _ricalcola_ordini_contatto(cur, id_contatto)

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in registra_esito_chiamata: {e}")
        return False


def aggiungi_nuovo_ordine(contatto_id, importo, note_ordine=""):
    """
    Registra un nuovo ordine nel tempo per un cliente:
    - Imposta esito = 'Interessato (Ordine preso)' e chiamato = 'Sì'
    - Inserisce l'ordine in storico_ordini con timestamp %Y-%m-%d %H:%M
    - Somma il nuovo importo a totale_ordini e incrementa numero_ordini
    - Accoda nelle note del contatto: [DATA] ORDINE CONFERMATO: € {importo:.2f} - {note}
    """
    importo_val = _parse_importo(importo, default=0.0)
    if importo_val <= 0:
        return None
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("SELECT * FROM contatti_ingrosso WHERE id = ?", (contatto_id,))
        record = cur.fetchone()
        if not record:
            conn.close()
            return None

        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        note_clean = str(note_ordine or "").strip()

        # Sincronizza eventuale saldo iniziale se storico_ordini era vuoto ma totale_ordini > 0
        cur.execute("SELECT COUNT(*) AS cnt FROM storico_ordini WHERE contatto_id = ?", (contatto_id,))
        cnt_esistenti = cur.fetchone()["cnt"]
        tot_pregresso = float(record["totale_ordini"] or 0.0)
        if cnt_esistenti == 0 and tot_pregresso > 0:
            cur.execute(
                "INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine) VALUES (?, ?, ?, ?)",
                (contatto_id, tot_pregresso, "Ordine pregresso", record["data_aggiornamento"] or data_ora),
            )

        cur.execute(
            """
            INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine)
            VALUES (?, ?, ?, ?)
            """,
            (contatto_id, importo_val, note_clean, data_ora),
        )
        ordine_id = cur.lastrowid

        totale_aggiornato, numero_aggiornato = _ricalcola_ordini_contatto(cur, contatto_id)

        suffisso_nota = f" - {note_clean}" if note_clean else ""
        nota_ordine = f"[{data_ora}] ORDINE CONFERMATO: € {importo_val:.2f}{suffisso_nota}"
        nuove_note = _accoda_nota_sql(record["note"], nota_ordine)

        cur.execute(
            """
            UPDATE contatti_ingrosso
            SET chiamato = 'Sì',
                esito = 'Interessato (Ordine preso)',
                note = ?,
                data_aggiornamento = ?
            WHERE id = ?
            """,
            (nuove_note, data_ora, contatto_id),
        )

        conn.commit()
        conn.close()
        return {
            "ordine_id": ordine_id,
            "contatto_id": contatto_id,
            "importo": importo_val,
            "totale_ordini": totale_aggiornato,
            "numero_ordini": numero_aggiornato,
            "data_ordine": data_ora,
        }
    except sqlite3.Error as e:
        print(f"Errore database in aggiungi_nuovo_ordine: {e}")
        return None


def ottieni_storico_ordini(contatto_id):
    """Restituisce la lista cronologica degli ordini di un cliente."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, contatto_id, importo, note_ordine, data_ordine
            FROM storico_ordini
            WHERE contatto_id = ?
            ORDER BY data_ordine DESC, id DESC
            """,
            (contatto_id,),
        )
        righe = [
            {
                "id": r["id"],
                "contatto_id": r["contatto_id"],
                "importo": round(float(r["importo"] or 0.0), 2),
                "note_ordine": r["note_ordine"] or "",
                "data_ordine": r["data_ordine"] or "",
            }
            for r in cur.fetchall()
        ]
        conn.close()
        return righe
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_storico_ordini: {e}")
        return []


def aggiorna_priorita(contatto_id, priorita):
    """Aggiorna la priorità di un contatto (1 = Alta/Urgente, 2 = Normale, 3 = Bassa)."""
    priorita_val = _parse_priorita(priorita, default=0)
    if priorita_val not in (1, 2, 3):
        return False
    try:
        conn = connetti()
        cur = conn.cursor()
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")
        cur.execute(
            "UPDATE contatti_ingrosso SET priorita = ?, data_aggiornamento = ? WHERE id = ?",
            (priorita_val, data_ora, contatto_id),
        )
        modificati = cur.rowcount
        conn.commit()
        conn.close()
        return modificati > 0
    except sqlite3.Error as e:
        print(f"Errore database in aggiorna_priorita: {e}")
        return False


def aggiorna_contatto(id_contatto, azienda, referente, telefono, citta, regione="", priorita=2, note=None):
    """
    Aggiorna i dati anagrafici, il referente, la città/regione e la priorità di un contatto esistente.
    Se regione è vuota, usa automaticamente deduci_regione(citta).
    """
    azienda_clean = str(azienda or "").strip()
    telefono_clean = str(telefono or "").strip()
    if not azienda_clean or not telefono_clean:
        return False
    citta_clean = str(citta or "").strip()
    regione_clean = str(regione or "").strip()
    if not regione_clean and citta_clean:
        regione_clean = deduci_regione(citta_clean)
    referente_clean = str(referente or "").strip()
    priorita_val = _parse_priorita(priorita, default=2)
    data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")

    try:
        conn = connetti()
        cur = conn.cursor()
        if note is not None:
            cur.execute(
                """
                UPDATE contatti_ingrosso
                SET azienda = ?, referente = ?, telefono = ?, citta = ?, regione = ?,
                    priorita = ?, note = ?, data_aggiornamento = ?
                WHERE id = ?
                """,
                (
                    azienda_clean,
                    referente_clean,
                    telefono_clean,
                    citta_clean,
                    regione_clean,
                    priorita_val,
                    str(note).strip(),
                    data_ora,
                    id_contatto,
                ),
            )
        else:
            cur.execute(
                """
                UPDATE contatti_ingrosso
                SET azienda = ?, referente = ?, telefono = ?, citta = ?, regione = ?,
                    priorita = ?, data_aggiornamento = ?
                WHERE id = ?
                """,
                (
                    azienda_clean,
                    referente_clean,
                    telefono_clean,
                    citta_clean,
                    regione_clean,
                    priorita_val,
                    data_ora,
                    id_contatto,
                ),
            )
        modificati = cur.rowcount
        conn.commit()
        conn.close()
        return modificati > 0
    except sqlite3.Error as e:
        print(f"Errore database in aggiorna_contatto: {e}")
        return False


# ==============================================================================
# 1B. IMPORTAZIONE UNIVERSALE MULTI-FORMATO & ESPORTAZIONE (JSON / CSV / TXT)
# ==============================================================================

ALIAS_COLONNE_IMPORT = {
    "azienda": "azienda",
    "ragionesociale": "azienda",
    "ragione_sociale": "azienda",
    "negozio": "azienda",
    "cliente": "azienda",
    "nome": "azienda",
    "company": "azienda",
    "store": "azienda",
    "telefono": "telefono",
    "tel": "telefono",
    "cellulare": "telefono",
    "recapito": "telefono",
    "phone": "telefono",
    "numero": "telefono",
    "mobile": "telefono",
    "referente": "referente",
    "titolare": "referente",
    "contatto": "referente",
    "buyer": "referente",
    "responsabile": "referente",
    "citta": "citta",
    "città": "citta",
    "comune": "citta",
    "luogo": "citta",
    "localita": "citta",
    "località": "citta",
    "city": "citta",
    "regione": "regione",
    "region": "regione",
    "note": "note",
    "commenti": "note",
    "appunti": "note",
    "annotazioni": "note",
    "notes": "note",
    "priorita": "priorita",
    "priorità": "priorita",
    "priority": "priorita",
    "urgenza": "priorita",
    "totaleordini": "totale_ordini",
    "totale_ordini": "totale_ordini",
    "importo": "totale_ordini",
    "ordine": "totale_ordini",
    "fatturato": "totale_ordini",
}


def _normalizza_chiave_colonna(col):
    """Pulisce il nome di un'intestazione colonna per il mapping case-insensitive."""
    if not col:
        return ""
    s = str(col).strip().lower()
    s = re.sub(r"[\s\-\.\/]+", "_", s)
    s_no_underscore = s.replace("_", "")
    if s in ALIAS_COLONNE_IMPORT:
        return ALIAS_COLONNE_IMPORT[s]
    if s_no_underscore in ALIAS_COLONNE_IMPORT:
        return ALIAS_COLONNE_IMPORT[s_no_underscore]
    return s


def _mappa_dizionario_grezzo(d):
    """Mappa un dizionario con chiavi arbitrarie nello schema standard contatti."""
    risultato = {
        "azienda": "",
        "telefono": "",
        "referente": "",
        "citta": "",
        "regione": "",
        "note": "",
        "priorita": 2,
        "totale_ordini": 0.0,
    }
    for k, v in d.items():
        chiave_std = _normalizza_chiave_colonna(k)
        if chiave_std in risultato and v is not None:
            risultato[chiave_std] = v
    return risultato


def _estrai_record_da_testo(contenuto_testo, nome_file=""):
    """
    Riconosce automaticamente il formato (JSON, CSV, TSV/Excel, TXT libero)
    e restituisce (lista_dizionari_mappati, formato_rilevato).
    """
    testo = str(contenuto_testo or "").lstrip("\ufeff").strip()
    if not testo:
        return [], "vuoto"

    # 1. Tentativo JSON se inizia con [ o { o se l'estensione è .json
    if testo.startswith("[") or testo.startswith("{") or str(nome_file).lower().endswith(".json"):
        try:
            parsed = json.loads(testo)
            if isinstance(parsed, dict):
                # Supporta eventuale wrapper {"contatti": [...]} o {"data": [...]}
                if "contatti" in parsed and isinstance(parsed["contatti"], list):
                    parsed = parsed["contatti"]
                elif "data" in parsed and isinstance(parsed["data"], list):
                    parsed = parsed["data"]
                else:
                    parsed = [parsed]
            if isinstance(parsed, list):
                return [_mappa_dizionario_grezzo(item) for item in parsed if isinstance(item, dict)], "JSON"
        except json.JSONDecodeError:
            if str(nome_file).lower().endswith(".json") or testo.startswith("["):
                raise ValueError("Errore di sintassi nel contenuto JSON fornito.")

    # 2. Analisi righe per CSV / TSV / Copia-Incolla Excel / TXT
    linee = [ln.strip() for ln in testo.splitlines() if ln.strip()]
    if not linee:
        return [], "vuoto"

    prima_linea = linee[0]
    # Rileva il separatore prevalente
    if "\t" in prima_linea:
        delimitatore = "\t"
        formato = "TSV / Excel"
    elif ";" in prima_linea:
        delimitatore = ";"
        formato = "CSV (;)"
    elif "|" in prima_linea:
        delimitatore = "|"
        formato = "TXT (|)"
    elif "," in prima_linea:
        delimitatore = ","
        formato = "CSV (,)"
    else:
        delimitatore = None
        formato = "TXT"

    if delimitatore:
        reader = csv.reader(io.StringIO(testo), delimiter=delimitatore)
        righe_csv = [row for row in reader if any(cell.strip() for cell in row)]
        if not righe_csv:
            return [], formato

        # Verifica se la prima riga è un'intestazione
        prime_colonne_mappate = [_normalizza_chiave_colonna(c) for c in righe_csv[0]]
        ha_header = ("azienda" in prime_colonne_mappate) or ("telefono" in prime_colonne_mappate)

        records = []
        if ha_header:
            headers = prime_colonne_mappate
            for row in righe_csv[1:]:
                d = {}
                for idx, val in enumerate(row):
                    if idx < len(headers) and headers[idx]:
                        d[headers[idx]] = val.strip()
                records.append(_mappa_dizionario_grezzo(d))
            return records, formato
        else:
            # Righe senza header: euristica posizionale / riconoscimento telefono
            for row in righe_csv:
                records.append(_interpreta_campi_senza_header(row))
            return records, formato

    # 3. Formato lista testo semplice (es. "Azienda - Telefono - Città - Note")
    records = []
    for ln in linee:
        parti = [p.strip() for p in re.split(r"\s+-\s+|\s*[;|]\s*", ln) if p.strip()]
        if len(parti) == 1:
            # Prova a separare l'ultimo o il primo numero di telefono nella riga
            match_tel = re.search(r"(\+?\d[\d\s\.\-\/]{6,}\d)", ln)
            if match_tel:
                tel_trovato = match_tel.group(1).strip()
                resto = (ln[:match_tel.start()] + " " + ln[match_tel.end():]).strip(" -,\t")
                parti = [resto, tel_trovato]
        records.append(_interpreta_campi_senza_header(parti))
    return records, "TXT"


def _interpreta_campi_senza_header(campi):
    """Interpreta una riga di campi privi di intestazione individuando il telefono e la città."""
    puliti = [str(c).strip() for c in campi if str(c).strip()]
    risultato = {
        "azienda": "",
        "telefono": "",
        "referente": "",
        "citta": "",
        "regione": "",
        "note": "",
        "priorita": 2,
        "totale_ordini": 0.0,
    }
    if not puliti:
        return risultato

    # Individua quale elemento è un numero di telefono
    idx_tel = None
    for i, val in enumerate(puliti):
        solo_num = normalizza_telefono(val)
        if len(solo_num) >= 6 and re.fullmatch(r"[\d\+\s\.\-\/\(\)]+", val):
            idx_tel = i
            risultato["telefono"] = val
            break

    restanti = [val for i, val in enumerate(puliti) if i != idx_tel]
    if restanti:
        risultato["azienda"] = restanti[0]
    if len(restanti) >= 2:
        # Se il secondo campo è una città nota o breve, usalo come città
        if deduci_regione(restanti[1]) or len(restanti[1]) <= 28:
            risultato["citta"] = restanti[1]
        else:
            risultato["note"] = restanti[1]
    if len(restanti) >= 3:
        risultato["note"] = " | ".join(restanti[2:])
    return risultato


def importa_contatti_universale(contenuto_testo, nome_file="", ignora_duplicati_telefono=True):
    """
    Importa contatti da testo in formato JSON, CSV (, o ;), TSV/Excel o TXT.
    Mappa automaticamente le colonne case-insensitive, deduce la regione se mancante
    e filtra i duplicati tramite normalizza_telefono().
    """
    try:
        records, formato = _estrai_record_da_testo(contenuto_testo, nome_file=nome_file)
    except ValueError as ve:
        return {"errore": str(ve)}
    except Exception as e:
        return {"errore": f"Impossibile interpretare il contenuto fornito: {e}"}

    if not records:
        return {"errore": "Nessun contatto valido rilevato nel testo o file caricato."}

    return _inserisci_lista_contatti_mappati(
        records,
        ignora_duplicati_telefono=ignora_duplicati_telefono,
        formato_rilevato=formato,
    )


def _inserisci_lista_contatti_mappati(records, ignora_duplicati_telefono=True, formato_rilevato="JSON"):
    """Inserisce nel DB una lista di dizionari contatti con verifica anti-duplicato normalizzata."""
    try:
        inseriti = 0
        duplicati = 0
        errori = 0
        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")

        conn = connetti()
        cur = conn.cursor()

        cur.execute("SELECT telefono FROM contatti_ingrosso")
        telefoni_esistenti = {
            normalizza_telefono(r["telefono"])
            for r in cur.fetchall()
            if normalizza_telefono(r["telefono"])
        }

        for raw in records:
            c = _mappa_dizionario_grezzo(raw) if isinstance(raw, dict) else {}
            azienda = str(c.get("azienda", "")).strip()
            telefono = str(c.get("telefono", "")).strip()
            referente = str(c.get("referente", "")).strip()
            citta = str(c.get("citta", "")).strip()
            regione = str(c.get("regione", "")).strip()
            note = str(c.get("note", "")).strip()
            priorita = _parse_priorita(c.get("priorita", 2), default=2)
            totale_ordini = _parse_importo(c.get("totale_ordini", 0.0), default=0.0)

            if not azienda or not telefono:
                errori += 1
                continue

            tel_norm = normalizza_telefono(telefono)
            if not tel_norm:
                errori += 1
                continue

            if ignora_duplicati_telefono and tel_norm in telefoni_esistenti:
                duplicati += 1
                continue

            if not regione and citta:
                regione = deduci_regione(citta)

            chiamato = "Sì" if totale_ordini > 0 else "No"
            esito = "Interessato (Ordine preso)" if totale_ordini > 0 else "In attesa"
            numero_ordini = 1 if totale_ordini > 0 else 0

            cur.execute(
                """
                INSERT INTO contatti_ingrosso (
                    azienda, referente, telefono, citta, regione, note,
                    chiamato, esito, priorita, totale_ordini, numero_ordini, data_aggiornamento
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    azienda,
                    referente,
                    telefono,
                    citta,
                    regione,
                    note,
                    chiamato,
                    esito,
                    priorita,
                    totale_ordini,
                    numero_ordini,
                    data_ora,
                ),
            )
            nuovo_id = cur.lastrowid
            if totale_ordini > 0 and nuovo_id:
                cur.execute(
                    """
                    INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine)
                    VALUES (?, ?, ?, ?)
                    """,
                    (nuovo_id, totale_ordini, "Ordine importato", data_ora),
                )

            telefoni_esistenti.add(tel_norm)
            inseriti += 1

        conn.commit()
        conn.close()

        return {
            "inseriti": inseriti,
            "duplicati": duplicati,
            "errori": errori,
            "totale_file": len(records),
            "totale": len(records),
            "formato_rilevato": formato_rilevato,
        }
    except Exception as e:
        return {"errore": f"Errore imprevisto durante l'importazione: {e}"}


def importa_contatti_da_json(percorso_file, ignora_duplicati_telefono=True):
    """
    Legge un file JSON contenente una lista di contatti e li inserisce nel database.
    Retrocompatibile al 100% con la versione precedente.
    """
    if not os.path.exists(percorso_file):
        return {"errore": f"Il file '{percorso_file}' non esiste."}

    try:
        with open(percorso_file, "r", encoding="utf-8") as f:
            dati = json.load(f)

        if not isinstance(dati, list):
            return {"errore": "Il file JSON deve contenere una lista di contatti (array racchiuso da [ ])."}

        return _inserisci_lista_contatti_mappati(
            dati,
            ignora_duplicati_telefono=ignora_duplicati_telefono,
            formato_rilevato="JSON",
        )
    except json.JSONDecodeError as je:
        return {"errore": f"Errore di sintassi nel file JSON: {je}"}
    except Exception as e:
        return {"errore": f"Errore imprevisto durante l'importazione: {e}"}


def esporta_contatti_in_json(percorso_file):
    """Esporta tutti i contatti presenti nel database in un file JSON formattato."""
    try:
        contatti = ottieni_tutti_contatti()
        lista_dati = [_riga_a_dict(c) for c in contatti]

        with open(percorso_file, "w", encoding="utf-8") as f:
            json.dump(lista_dati, f, ensure_ascii=False, indent=2)

        return True, len(lista_dati)
    except Exception as e:
        print(f"Errore durante l'esportazione JSON: {e}")
        return False, 0


def genera_csv_contatti():
    """
    Genera una stringa CSV compatibile con Excel Italiano (separatore ';', UTF-8 BOM)
    contenente l'anagrafica completa e i riepiloghi ordini.
    """
    contatti = ottieni_tutti_contatti()
    output = io.StringIO()
    # BOM UTF-8 per apertura immediata corretta in Microsoft Excel
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID",
        "Priorita",
        "Azienda",
        "Referente",
        "Telefono",
        "Citta",
        "Regione",
        "Chiamato",
        "Esito",
        "Numero_Ordini",
        "Totale_Ordini_EUR",
        "Ultimo_Aggiornamento",
        "Note",
    ])
    mappa_prio = {1: "1 - Alta", 2: "2 - Normale", 3: "3 - Bassa"}
    for r in contatti:
        d = _riga_a_dict(r)
        writer.writerow([
            d["id"],
            mappa_prio.get(d["priorita"], "2 - Normale"),
            d["azienda"],
            d["referente"],
            d["telefono"],
            d["citta"],
            d["regione"],
            d["chiamato"],
            d["esito"],
            d["numero_ordini"],
            f"{d['totale_ordini']:.2f}".replace(".", ","),
            d["data_aggiornamento"],
            d["note"],
        ])
    return output.getvalue()


# ==============================================================================
# 1C. STATISTICHE, FATTURATO ORDINI E ANALISI TERRITORIALE (CITTÀ & REGIONI)
# ==============================================================================

def ottieni_statistiche():
    """
    Calcola statistiche complete per il cruscotto commerciale:
    - totali, chiamati, interessati, rifiutati, da_contattare
    - fatturato_totale_ordini (€), valore_medio_ordine (€), totale_ordini_effettuati
    - analisi_regioni e analisi_citta per i grafici territoriali
    """
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

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE esito = 'Da richiamare'")
        da_richiamare = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE esito = 'In attesa'")
        in_attesa = cur.fetchone()[0]

        cur.execute("""
            SELECT COALESCE(SUM(totale_ordini), 0.0) AS fatturato,
                   COALESCE(SUM(numero_ordini), 0) AS num_ordini
            FROM contatti_ingrosso
        """)
        row_ord = cur.fetchone()
        fatturato_totale_ordini = round(float(row_ord["fatturato"] or 0.0), 2)
        totale_ordini_effettuati = int(row_ord["num_ordini"] or 0)

        # Se ci sono clienti con totale_ordini > 0 ma numero_ordini = 0, conteggia almeno 1 ordine
        if fatturato_totale_ordini > 0 and totale_ordini_effettuati == 0:
            cur.execute("SELECT COUNT(*) FROM contatti_ingrosso WHERE totale_ordini > 0")
            totale_ordini_effettuati = cur.fetchone()[0]

        valore_medio_ordine = (
            round(fatturato_totale_ordini / totale_ordini_effettuati, 2)
            if totale_ordini_effettuati > 0
            else 0.0
        )

        # Analisi aggregata per Regione e per Città
        cur.execute("""
            SELECT citta, regione, chiamato, esito, totale_ordini, numero_ordini
            FROM contatti_ingrosso
        """)
        tutte_righe = cur.fetchall()
        conn.close()

        mappa_regioni = {}
        mappa_citta = {}

        for r in tutte_righe:
            citta_raw = (r["citta"] or "").strip()
            regione_raw = (r["regione"] or "").strip()
            if not regione_raw and citta_raw:
                regione_raw = deduci_regione(citta_raw)

            nome_regione = regione_raw if regione_raw else "Non specificata"
            nome_citta = citta_raw if citta_raw else "Non specificata"

            is_chiamato = 1 if r["chiamato"] == "Sì" else 0
            tot_ord = round(float(r["totale_ordini"] or 0.0), 2)
            ha_ordine = 1 if (r["esito"] == "Interessato (Ordine preso)" or tot_ord > 0) else 0

            # Aggrega Regione
            if nome_regione not in mappa_regioni:
                mappa_regioni[nome_regione] = {
                    "nome": nome_regione,
                    "totale_contatti": 0,
                    "chiamati": 0,
                    "ordini_confermati": 0,
                    "fatturato_ordini": 0.0,
                }
            mappa_regioni[nome_regione]["totale_contatti"] += 1
            mappa_regioni[nome_regione]["chiamati"] += is_chiamato
            mappa_regioni[nome_regione]["ordini_confermati"] += ha_ordine
            mappa_regioni[nome_regione]["fatturato_ordini"] = round(
                mappa_regioni[nome_regione]["fatturato_ordini"] + tot_ord, 2
            )

            # Aggrega Città
            chiave_citta = nome_citta.lower()
            if chiave_citta not in mappa_citta:
                mappa_citta[chiave_citta] = {
                    "nome": nome_citta,
                    "regione": nome_regione,
                    "totale_contatti": 0,
                    "chiamati": 0,
                    "ordini_confermati": 0,
                    "fatturato_ordini": 0.0,
                }
            mappa_citta[chiave_citta]["totale_contatti"] += 1
            mappa_citta[chiave_citta]["chiamati"] += is_chiamato
            mappa_citta[chiave_citta]["ordini_confermati"] += ha_ordine
            mappa_citta[chiave_citta]["fatturato_ordini"] = round(
                mappa_citta[chiave_citta]["fatturato_ordini"] + tot_ord, 2
            )

        analisi_regioni = sorted(
            mappa_regioni.values(),
            key=lambda x: (x["fatturato_ordini"], x["ordini_confermati"], x["totale_contatti"]),
            reverse=True,
        )
        analisi_citta = sorted(
            mappa_citta.values(),
            key=lambda x: (x["fatturato_ordini"], x["ordini_confermati"], x["totale_contatti"]),
            reverse=True,
        )

        duplicati_rilevati = len(rileva_duplicati())

        return {
            "totali": totali,
            "chiamati": chiamati,
            "interessati": interessati,
            "rifiutati": rifiutati,
            "da_contattare": da_contattare,
            "da_richiamare": da_richiamare,
            "in_attesa": in_attesa,
            "fatturato_totale_ordini": fatturato_totale_ordini,
            "valore_medio_ordine": valore_medio_ordine,
            "totale_ordini_effettuati": totale_ordini_effettuati,
            "analisi_regioni": analisi_regioni,
            "analisi_citta": analisi_citta,
            "gruppi_duplicati": duplicati_rilevati,
        }
    except sqlite3.Error as e:
        print(f"Errore database in ottieni_statistiche: {e}")
        return None


def elimina_contatto(id_contatto):
    """Elimina un contatto dal database (e i suoi ordini in storico_ordini via CASCADE)."""
    try:
        conn = connetti()
        cur = conn.cursor()
        cur.execute("DELETE FROM storico_ordini WHERE contatto_id = ?", (id_contatto,))
        cur.execute("DELETE FROM contatti_ingrosso WHERE id = ?", (id_contatto,))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in elimina_contatto: {e}")
        return False


# ==============================================================================
# 1D. RILEVAMENTO DUPLICATI / RIDONDANZE E FUSIONE SCHEDE (MERGE)
# ==============================================================================

def rileva_duplicati():
    """
    Individua i gruppi di contatti ridondanti nel DB che condividono:
    - lo stesso numero di telefono normalizzato (normalizza_telefono)
    - oppure lo stesso nome azienda normalizzato (normalizza_azienda).
    Restituisce una lista di gruppi di duplicati.
    """
    try:
        righe = ottieni_tutti_contatti()
        contatti = [_riga_a_dict(r) for r in righe]
        n = len(contatti)
        if n < 2:
            return []

        parent = list(range(n))

        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        def union(i, j):
            ri, rj = find(i), find(j)
            if ri != rj:
                if ri < rj:
                    parent[rj] = ri
                else:
                    parent[ri] = rj

        mappa_tel = {}
        mappa_az = {}
        motivi_coppia = {}

        for idx, c in enumerate(contatti):
            t_norm = normalizza_telefono(c["telefono"])
            a_norm = normalizza_azienda(c["azienda"])

            if t_norm:
                if t_norm in mappa_tel:
                    prev_idx = mappa_tel[t_norm]
                    union(prev_idx, idx)
                    motivi_coppia.setdefault(find(prev_idx), set()).add("Telefono identico")
                else:
                    mappa_tel[t_norm] = idx

            if a_norm:
                if a_norm in mappa_az:
                    prev_idx = mappa_az[a_norm]
                    union(prev_idx, idx)
                    motivi_coppia.setdefault(find(prev_idx), set()).add("Azienda omonima")
                else:
                    mappa_az[a_norm] = idx

        gruppi_indice = {}
        for idx in range(n):
            radice = find(idx)
            gruppi_indice.setdefault(radice, []).append(idx)

        risultato = []
        for radice, indici in gruppi_indice.items():
            if len(indici) < 2:
                continue
            elementi = [contatti[i] for i in indici]
            # Determina i motivi specifici del gruppo
            tels = [normalizza_telefono(e["telefono"]) for e in elementi if normalizza_telefono(e["telefono"])]
            azs = [normalizza_azienda(e["azienda"]) for e in elementi if normalizza_azienda(e["azienda"])]
            dup_tel = len(tels) != len(set(tels))
            dup_az = len(azs) != len(set(azs))

            if dup_tel and dup_az:
                motivo = "Telefono e Ragione Sociale coincidenti"
            elif dup_tel:
                motivo = "Stesso Numero di Telefono (formattazione diversa)"
            else:
                motivo = "Stessa Ragione Sociale / Azienda omonima"

            # Ordina suggerendo come principale quello con più ordini o inserito prima
            elementi_ordinati = sorted(
                elementi,
                key=lambda x: (-x["totale_ordini"], -x["numero_ordini"], x["priorita"], x["id"]),
            )
            risultato.append({
                "id_gruppo": f"DUP-{elementi_ordinati[0]['id']}",
                "motivo": motivo,
                "principale_suggerito_id": elementi_ordinati[0]["id"],
                "contatti": elementi_ordinati,
            })

        return risultato
    except Exception as e:
        print(f"Errore in rileva_duplicati: {e}")
        return []


def unisci_contatti(id_principale, id_secondario):
    """
    Unisce due contatti duplicati mantenendo id_principale:
    1. Completa referente, citta, regione se vuoti con quelli di id_secondario.
    2. Concatena le note con ' | '.
    3. Trasferisce gli ordini in storico_ordini da id_secondario a id_principale
       e ricalcola totale_ordini e numero_ordini.
    4. Imposta la priorità più alta (valore numerico minore tra 1, 2, 3) ed elimina id_secondario.
    """
    if id_principale == id_secondario:
        return False
    try:
        conn = connetti()
        cur = conn.cursor()

        cur.execute("SELECT * FROM contatti_ingrosso WHERE id = ?", (id_principale,))
        principale = cur.fetchone()
        cur.execute("SELECT * FROM contatti_ingrosso WHERE id = ?", (id_secondario,))
        secondario = cur.fetchone()

        if not principale or not secondario:
            conn.close()
            return False

        data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")

        # 1. Campi anagrafici complementari
        referente = (principale["referente"] or "").strip() or (secondario["referente"] or "").strip()
        citta = (principale["citta"] or "").strip() or (secondario["citta"] or "").strip()
        regione = (principale["regione"] or "").strip() or (secondario["regione"] or "").strip()
        if not regione and citta:
            regione = deduci_regione(citta)

        # 2. Concatenazione note senza duplicare blocchi identici
        nota_p = (principale["note"] or "").strip()
        nota_s = (secondario["note"] or "").strip()
        if nota_s and nota_s not in nota_p:
            note_unite = _accoda_nota_sql(nota_p, f"[Da scheda #{id_secondario}] {nota_s}")
        else:
            note_unite = nota_p

        # 3. Priorità più alta (1 = Alta vince su 2 e 3)
        prio_p = _parse_priorita(principale["priorita"], default=2)
        prio_s = _parse_priorita(secondario["priorita"], default=2)
        priorita_finale = min(prio_p, prio_s)

        # Stato chiamata ed esito più avanzato
        chiamato_finale = "Sì" if (principale["chiamato"] == "Sì" or secondario["chiamato"] == "Sì") else "No"
        ordine_esiti = {
            "Interessato (Ordine preso)": 1,
            "Da richiamare": 2,
            "In attesa": 3,
            "Non interessato (Rifiutato)": 4,
        }
        esito_p = principale["esito"] or "In attesa"
        esito_s = secondario["esito"] or "In attesa"
        esito_finale = (
            esito_p
            if ordine_esiti.get(esito_p, 3) <= ordine_esiti.get(esito_s, 3)
            else esito_s
        )

        # 4. Sincronizza eventuali saldi ordini non presenti in storico_ordini prima del trasferimento
        for rec in (principale, secondario):
            cur.execute("SELECT COUNT(*) AS cnt FROM storico_ordini WHERE contatto_id = ?", (rec["id"],))
            cnt_st = cur.fetchone()["cnt"]
            tot_rec = float(rec["totale_ordini"] or 0.0)
            if cnt_st == 0 and tot_rec > 0:
                cur.execute(
                    "INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine) VALUES (?, ?, ?, ?)",
                    (rec["id"], tot_rec, f"Ordine scheda #{rec['id']}", rec["data_aggiornamento"] or data_ora),
                )

        # Trasferisce gli ordini da id_secondario a id_principale
        cur.execute(
            "UPDATE storico_ordini SET contatto_id = ? WHERE contatto_id = ?",
            (id_principale, id_secondario),
        )

        # Ricalcola totale_ordini e numero_ordini su id_principale
        tot_ord, num_ord = _ricalcola_ordini_contatto(cur, id_principale)
        if tot_ord > 0:
            esito_finale = "Interessato (Ordine preso)"
            chiamato_finale = "Sì"

        # Aggiorna il record principale
        cur.execute(
            """
            UPDATE contatti_ingrosso
            SET referente = ?, citta = ?, regione = ?, note = ?,
                priorita = ?, chiamato = ?, esito = ?, data_aggiornamento = ?
            WHERE id = ?
            """,
            (
                referente,
                citta,
                regione,
                note_unite,
                priorita_finale,
                chiamato_finale,
                esito_finale,
                data_ora,
                id_principale,
            ),
        )

        # Elimina il contatto secondario
        cur.execute("DELETE FROM contatti_ingrosso WHERE id = ?", (id_secondario,))

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Errore database in unisci_contatti: {e}")
        return False


def ripristina_dati_demo():
    """
    Popola il database con un dataset dimostrativo ricco:
    - 12 contatti distribuiti in più città e regioni italiane
    - Referenti, priorità miste (1=Alta, 2=Normale, 3=Bassa)
    - Ordini multipli già confermati in € per testare i grafici e la Tab Ordini Confermati
    - 2 coppie di contatti duplicati per testare subito la Tab Duplicati & Ridondanze
    """
    try:
        crea_tabella()
        conn = connetti()
        cur = conn.cursor()
        cur.execute("DELETE FROM storico_ordini")
        cur.execute("DELETE FROM contatti_ingrosso")

        demo_leads = [
            {
                "azienda": "Calzature Brera Luxury S.r.l.",
                "referente": "Dott.ssa Giulia Visconti",
                "telefono": "+39 02 98765431",
                "citta": "Milano",
                "regione": "Lombardia",
                "priorita": 1,
                "chiamato": "Sì",
                "esito": "Interessato (Ordine preso)",
                "note": "Catena con 3 boutique in centro a Milano | [2026-10-10 10:30] ORDINE CONFERMATO: € 4850.00 - Collezione Autunno/Inverno Donna | [2026-10-16 15:15] ORDINE CONFERMATO: € 3200.00 - Riassortimento stivaletti pelle",
                "data_aggiornamento": "2026-10-16 15:15",
                "ordini": [
                    (4850.00, "Collezione Autunno/Inverno Donna - 45 paia", "2026-10-10 10:30"),
                    (3200.00, "Riassortimento stivaletti pelle NOGA ROMA", "2026-10-16 15:15"),
                ],
            },
            {
                "azienda": "Atelier del Passo Condotti",
                "referente": "Marco Valeri",
                "telefono": "06 55443322",
                "citta": "Roma",
                "regione": "Lazio",
                "priorita": 1,
                "chiamato": "Sì",
                "esito": "Interessato (Ordine preso)",
                "note": "Showroom storico vicino Piazza di Spagna | [2026-10-12 11:00] ORDINE CONFERMATO: € 6400.00 - Linea mocassini e décolleté artigianali",
                "data_aggiornamento": "2026-10-12 11:00",
                "ordini": [
                    (3900.00, "Primo impianto linea cerimonia e mocassini", "2026-10-04 09:45"),
                    (2500.00, "Integrazione taglie 37-40 color sabbia e noir", "2026-10-12 11:00"),
                ],
            },
            {
                "azienda": "Toscana Shoes & Leather S.n.c.",
                "referente": "Lorenzo Guicciardini",
                "telefono": "055 2233445",
                "citta": "Firenze",
                "regione": "Toscana",
                "priorita": 1,
                "chiamato": "Sì",
                "esito": "Interessato (Ordine preso)",
                "note": "Concept store lungarno, clientela internazionale | [2026-10-14 16:40] ORDINE CONFERMATO: € 5100.00 - Capsule artigianale NOGA",
                "data_aggiornamento": "2026-10-14 16:40",
                "ordini": [
                    (5100.00, "Capsule artigianale NOGA ROMA 50 paia", "2026-10-14 16:40"),
                ],
            },
            {
                "azienda": "Partenope Moda Calzature S.r.l.",
                "referente": "Cav. Gennaro Esposito",
                "telefono": "081 7766554",
                "citta": "Napoli",
                "regione": "Campania",
                "priorita": 2,
                "chiamato": "Sì",
                "esito": "Interessato (Ordine preso)",
                "note": "2 punti vendita a Chiaia e Vomero | [2026-10-15 12:20] ORDINE CONFERMATO: € 2950.00 - Campionatura + primo ordine",
                "data_aggiornamento": "2026-10-15 12:20",
                "ordini": [
                    (2950.00, "Campionatura + primo ordine stagione", "2026-10-15 12:20"),
                ],
            },
            {
                "azienda": "Galleria Sabauda Footwear",
                "referente": "Elena Ferrero",
                "telefono": "011 4455667",
                "citta": "Torino",
                "regione": "Piemonte",
                "priorita": 1,
                "chiamato": "No",
                "esito": "Da richiamare",
                "note": "Titolare molto interessata al catalogo B2B, richiamare nel pomeriggio per definire quantità",
                "data_aggiornamento": "2026-10-16 17:00",
                "ordini": [],
            },
            {
                "azienda": "Emilia Boutique Calzature S.a.s.",
                "referente": "Andrea Bentivoglio",
                "telefono": "051 3344556",
                "citta": "Bologna",
                "regione": "Emilia-Romagna",
                "priorita": 2,
                "chiamato": "Sì",
                "esito": "Interessato (Ordine preso)",
                "note": "Negozio sotto i portici del centro | [2026-10-13 10:10] ORDINE CONFERMATO: € 2150.00 - Ordine prova collezione donna",
                "data_aggiornamento": "2026-10-13 10:10",
                "ordini": [
                    (2150.00, "Ordine prova collezione donna", "2026-10-13 10:10"),
                ],
            },
            {
                "azienda": "Laguna Glamour Shoes",
                "referente": "Alvise Contarini",
                "telefono": "041 8899001",
                "citta": "Venezia",
                "regione": "Veneto",
                "priorita": 1,
                "chiamato": "No",
                "esito": "In attesa",
                "note": "Boutique di fascia alta a San Marco, inviare lookbook prima della chiamata",
                "data_aggiornamento": "2026-10-16 09:30",
                "ordini": [],
            },
            {
                "azienda": "Adriatica Showroom S.r.l.",
                "referente": "Dott. Nicola De Santis",
                "telefono": "080 6677889",
                "citta": "Bari",
                "regione": "Puglia",
                "priorita": 2,
                "chiamato": "Sì",
                "esito": "Da richiamare",
                "note": "Inviare catalogo WhatsApp e listino B2B aggiornato, valuta ordine entro venerdì",
                "data_aggiornamento": "2026-10-16 11:45",
                "ordini": [],
            },
            {
                "azienda": "Distretto Marche Concept Store",
                "referente": "Federica Della Valle",
                "telefono": "0733 998877",
                "citta": "Civitanova Marche",
                "regione": "Marche",
                "priorita": 3,
                "chiamato": "Sì",
                "esito": "Non interessato (Rifiutato)",
                "note": "Trattano solo produzione propria per questa stagione",
                "data_aggiornamento": "2026-10-11 14:20",
                "ordini": [],
            },
            {
                "azienda": "Trinacria Luxury Concept",
                "referente": "Ruggero Altavilla",
                "telefono": "091 5566778",
                "citta": "Palermo",
                "regione": "Sicilia",
                "priorita": 2,
                "chiamato": "No",
                "esito": "In attesa",
                "note": "Punto vendita in Via Libertà, cerca calzature made in Italy",
                "data_aggiornamento": "2026-10-16 10:00",
                "ordini": [],
            },
            # Duplicato 1: Stesso telefono di Calzature Brera Luxury ma scritto con trattini e senza +39
            {
                "azienda": "Brera Luxury Milano (Showroom)",
                "referente": "",
                "telefono": "02-98765431",
                "citta": "Milano",
                "regione": "Lombardia",
                "priorita": 2,
                "chiamato": "No",
                "esito": "Da richiamare",
                "note": "Contatto raccolto in fiera MICAM - chiedere di Giulia Visconti per secondo punto vendita",
                "data_aggiornamento": "2026-10-15 18:00",
                "ordini": [
                    (1450.00, "Pre-ordine fiera MICAM", "2026-10-15 18:00"),
                ],
            },
            # Duplicato 2: Stessa ragione sociale normalizzata di Atelier del Passo Condotti (con S.R.L. e punteggiatura)
            {
                "azienda": "Atelier del Passo Condotti S.R.L.",
                "referente": "Marco Valeri (Buyer)",
                "telefono": "06 55443399",
                "citta": "Roma",
                "regione": "Lazio",
                "priorita": 3,
                "chiamato": "No",
                "esito": "In attesa",
                "note": "Interno ufficio acquisti secondario Via Condotti",
                "data_aggiornamento": "2026-10-14 09:00",
                "ordini": [],
            },
        ]

        for item in demo_leads:
            ordini = item.get("ordini", [])
            tot_ord = round(sum(o[0] for o in ordini), 2)
            num_ord = len(ordini)
            cur.execute(
                """
                INSERT INTO contatti_ingrosso (
                    azienda, referente, telefono, citta, regione, note,
                    chiamato, esito, priorita, totale_ordini, numero_ordini, data_aggiornamento
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["azienda"],
                    item["referente"],
                    item["telefono"],
                    item["citta"],
                    item["regione"],
                    item["note"],
                    item["chiamato"],
                    item["esito"],
                    item["priorita"],
                    tot_ord,
                    num_ord,
                    item["data_aggiornamento"],
                ),
            )
            cid = cur.lastrowid
            for imp, n_ord, d_ord in ordini:
                cur.execute(
                    """
                    INSERT INTO storico_ordini (contatto_id, importo, note_ordine, data_ordine)
                    VALUES (?, ?, ?, ?)
                    """,
                    (cid, imp, n_ord, d_ord),
                )

        conn.commit()
        conn.close()
        return {"inseriti": len(demo_leads), "duplicati": 0, "errori": 0, "totale_file": len(demo_leads)}
    except sqlite3.Error as e:
        print(f"Errore in ripristina_dati_demo: {e}")
        return {"errore": str(e)}


# ==============================================================================
# 2. INTERFACCIA UTENTE (CLI - TERMINALE)
# ==============================================================================

def mostra_menu():
    """Visualizza il menu principale delle opzioni."""
    print("\n" + "=" * 64)
    print("   CRM ACQUISIZIONE CLIENTI ALL'INGROSSO - NOGA ROMA (CLI)   ")
    print("=" * 64)
    print("1. Inserisci manualmente un nuovo contatto")
    print("2. Coda chiamate ( Ordinata per Priorità )")
    print("3. Mostra TUTTI i contatti")
    print("4. Cerca contatto (Azienda, Referente, Telefono, Città, Regione)")
    print("5. Registra chiamata ed esito (+ eventuale Ordine in €)")
    print("6. Cruscotto statistiche commerciali, Fatturato e Regioni")
    print("7. IMPORTA contatti da file (JSON / CSV / TXT)")
    print("8. ESPORTA contatti correnti in file JSON")
    print("9. Elimina un contatto")
    print("10. Esci")
    print("-" * 64)


def stampa_tabella_contatti(righe):
    """Stampa l'elenco dei contatti con formattazione chiara e leggibile."""
    if not righe:
        print("\nNessun contatto trovato.")
        return

    mappa_p = {1: "ALTA", 2: "NORM", 3: "BASSA"}
    print("\n" + "-" * 130)
    print(
        f"{'ID':<4} | {'PRIO':<5} | {'Azienda':<24} | {'Referente':<16} | {'Telefono':<14} | {'Città (Regione)':<22} | {'Ordini €':<12} | {'Esito':<20}"
    )
    print("-" * 130)
    for r in righe:
        d = _riga_a_dict(r)
        loc = f"{d['citta']} ({d['regione']})" if d["regione"] else (d["citta"] or "-")
        ord_str = f"€ {d['totale_ordini']:.2f} ({d['numero_ordini']})" if d["totale_ordini"] > 0 else "-"
        print(
            f"{d['id']:<4} | "
            f"{mappa_p.get(d['priorita'], 'NORM'):<5} | "
            f"{d['azienda'][:23]:<24} | "
            f"{(d['referente'] or '-')[:15]:<16} | "
            f"{d['telefono'][:13]:<14} | "
            f"{loc[:21]:<22} | "
            f"{ord_str[:11]:<12} | "
            f"{d['esito'][:19]:<20}"
        )
        if d["note"]:
            print(f"     Note: {d['note']} (Ultimo agg.: {d['data_aggiornamento']})")
    print("-" * 130)


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

    print("\nIl contatto è stato chiamato?")
    print("1. Sì")
    print("2. No (o non ha risposto)")
    scelta_chiamata = input("Seleziona (1 o 2): ").strip()
    while scelta_chiamata not in ["1", "2"]:
        scelta_chiamata = input("Seleziona (1 o 2): ").strip()

    chiamato = "Sì" if scelta_chiamata == "1" else "No"

    print("\nQual è l'interesse per gli acquisti all'ingrosso?")
    print("1. Interessato (Ordine preso)")
    print("2. Non interessato (Rifiutato)")
    print("3. Da richiamare (Occupato / Valuterà il listino)")
    print("4. In attesa (Non ancora contattabile)")

    scelta_esito = input("Seleziona esito (1-4): ").strip()
    while scelta_esito not in ["1", "2", "3", "4"]:
        scelta_esito = input("Seleziona esito (1-4): ").strip()

    mappa_esiti = {
        "1": "Interessato (Ordine preso)",
        "2": "Non interessato (Rifiutato)",
        "3": "Da richiamare",
        "4": "In attesa",
    }
    esito = mappa_esiti[scelta_esito]

    referente = input("Nome Referente / Buyer (Invio per lasciare invariato): ").strip()
    importo_ordine = 0.0
    if esito == "Interessato (Ordine preso)":
        imp_str = input("Importo Ordine Confermato in € (es. 1250.00 - Invio se 0): ").strip()
        importo_ordine = _parse_importo(imp_str, default=0.0)

    note_call = input("Aggiungi note della chiamata (Invio per saltare): ").strip()

    if registra_esito_chiamata(
        id_contatto,
        chiamato,
        esito,
        note_call,
        importo_ordine=importo_ordine,
        referente=referente if referente else None,
    ):
        print("\nEsito registrato con successo!")
        print(f"-> ID {id_contatto} | Chiamato: {chiamato} | Esito: {esito}")
    else:
        print("Si è verificato un errore durante l'aggiornamento.")


def procedura_importazione_json():
    """Guida interattiva per l'importazione in blocco da file JSON/CSV/TXT."""
    print("\n--- IMPORTAZIONE CONTATTI DA FILE ---")
    file_default = "contatti_lead.json"
    percorso = input(f"Inserisci il nome del file (Premi INVIO per '{file_default}'): ").strip()
    if percorso == "":
        percorso = file_default

    if not os.path.exists(percorso):
        print(f"Errore: il file '{percorso}' non esiste.")
        return

    with open(percorso, "r", encoding="utf-8") as f:
        contenuto = f.read()

    risultato = importa_contatti_universale(contenuto, nome_file=percorso)
    if "errore" in risultato:
        print(f"Errore nell'importazione: {risultato['errore']}")
    else:
        print("\n" + "=" * 45)
        print("      ESITO IMPORTAZIONE IN BLOCCO      ")
        print("=" * 45)
        print(f"Formato rilevato            : {risultato.get('formato_rilevato', 'JSON')}")
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

    print("Database CRM contatti NOGA ROMA pronto all'uso.")

    while True:
        mostra_menu()
        scelta = input("Scegli un'opzione (1-10): ").strip()

        if scelta == "1":
            azienda = input("Nome Azienda / Negozio: ").strip()
            while azienda == "":
                print("Errore: il nome azienda non può essere vuoto!")
                azienda = input("Nome Azienda / Negozio: ").strip()

            referente = input("Nome Referente / Buyer (opzionale): ").strip()

            telefono = input("Numero di telefono da chiamare: ").strip()
            while telefono == "":
                print("Errore: il numero di telefono non può essere vuoto!")
                telefono = input("Numero di telefono da chiamare: ").strip()

            if telefono_esiste(telefono):
                conferma = input("Attenzione: questo numero è già presente a database! Vuoi aggiungerlo comunque? (s/n): ").strip().lower()
                if conferma != "s":
                    print("Operazione annullata.")
                    continue

            citta = input("Città (opzionale): ").strip()
            regione_auto = deduci_regione(citta)
            regione = input(f"Regione (Invio per '{regione_auto or 'Nessuna'}'): ").strip() or regione_auto
            prio_str = input("Priorità (1=Alta, 2=Normale, 3=Bassa - Invio per 2): ").strip()
            priorita = _parse_priorita(prio_str, default=2)
            note = input("Note iniziali: ").strip()

            nuovo_id = aggiungi_contatto(azienda, telefono, citta, note, referente=referente, regione=regione, priorita=priorita)
            if nuovo_id:
                print(f"\nContatto '{azienda}' inserito con successo con ID {nuovo_id}!")

        elif scelta == "2":
            da_chiamare = ottieni_contatti_da_chiamare()
            print(f"\n>>> CODA TELEFONATE: {len(da_chiamare)} contatti da contattare o richiamare <<<")
            stampa_tabella_contatti(da_chiamare)

        elif scelta == "3":
            tutti = ottieni_tutti_contatti()
            stampa_tabella_contatti(tutti)

        elif scelta == "4":
            termine = input("Inserisci termine di ricerca: ").strip()
            while termine == "":
                termine = input("Inserisci termine di ricerca: ").strip()
            risultati = cerca_contatti(termine)
            stampa_tabella_contatti(risultati)

        elif scelta == "5":
            procedura_registra_chiamata()

        elif scelta == "6":
            stats = ottieni_statistiche()
            if stats:
                print("\n" + "=" * 50)
                print("      CRUSCOTTO ACQUISIZIONE CLIENTI NOGA ROMA    ")
                print("=" * 50)
                print(f"Totale contatti a database        : {stats['totali']}")
                print(f"Contatti già chiamati             : {stats['chiamati']}")
                print(f"Da contattare o richiamare        : {stats['da_contattare']}")
                print(f"Interessati (Ordine preso)        : {stats['interessati']}")
                print(f"Non interessati (Rifiutati)       : {stats['rifiutati']}")
                print(f"Totale Ordini Effettuati          : {stats['totale_ordini_effettuati']}")
                print(f"Fatturato Totale Ordini           : € {stats['fatturato_totale_ordini']:.2f}")
                print(f"Valore Medio Ordine               : € {stats['valore_medio_ordine']:.2f}")
                if stats["chiamati"] > 0:
                    tasso_conversione = (stats["interessati"] / stats["chiamati"]) * 100
                    print(f"Tasso di conversione ordini       : {tasso_conversione:.1f}%")
                print("=" * 50)

        elif scelta == "7":
            procedura_importazione_json()

        elif scelta == "8":
            procedura_esportazione_json()

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

        elif scelta == "10":
            print("\nChiusura gestionale acquisizione clienti. Buon lavoro!")
            break
        else:
            print("Opzione non valida! Inserisci un numero da 1 a 10.")


if __name__ == "__main__":
    main()