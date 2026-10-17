import json
import os
import sys
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sqlite3
from datetime import datetime

# Importa le funzioni di business logic già consolidate in main.py
import main

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GestionaleApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def _send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/contatti":
            filtro = query_params.get("filtro", ["tutti"])[0]
            termine = query_params.get("q", [""])[0].strip()

            if termine:
                righe = main.cerca_contatti(termine)
            elif filtro == "da_chiamare":
                righe = main.ottieni_contatti_da_chiamare()
            else:
                righe = main.ottieni_tutti_contatti()

            # Serializza i record
            contatti = []
            for r in righe:
                contatti.append({
                    "id": r["id"],
                    "azienda": r["azienda"],
                    "telefono": r["telefono"],
                    "citta": r["citta"],
                    "note": r["note"],
                    "chiamato": r["chiamato"],
                    "esito": r["esito"],
                    "data_aggiornamento": r["data_aggiornamento"]
                })
            self._send_json({"ok": True, "data": contatti, "totale": len(contatti)})
            return

        elif path == "/api/statistiche":
            stats = main.ottieni_statistiche()
            if stats is None:
                stats = {"totali": 0, "chiamati": 0, "interessati": 0, "rifiutati": 0, "da_contattare": 0}
            
            # Calcola anche metriche percentuali utili per la dashboard
            totali = stats.get("totali", 0)
            chiamati = stats.get("chiamati", 0)
            interessati = stats.get("interessati", 0)
            
            tasso_conversione = round((interessati / chiamati * 100), 1) if chiamati > 0 else 0.0
            percentuale_completamento = round((chiamati / totali * 100), 1) if totali > 0 else 0.0
            
            stats["tasso_conversione"] = tasso_conversione
            stats["percentuale_completamento"] = percentuale_completamento
            self._send_json({"ok": True, "data": stats})
            return

        elif path == "/api/esporta-json":
            contatti = main.ottieni_tutti_contatti()
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
            self._send_json({"ok": True, "data": lista_dati})
            return

        # Per tutte le altre richieste, servi i file statici normalmente
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            self._send_json({"ok": False, "errore": "JSON non valido"}, 400)
            return

        if path == "/api/contatti":
            azienda = str(payload.get("azienda", "")).strip()
            telefono = str(payload.get("telefono", "")).strip()
            citta = str(payload.get("citta", "")).strip()
            note = str(payload.get("note", "")).strip()

            if not azienda or not telefono:
                self._send_json({"ok": False, "errore": "Azienda e Telefono sono obbligatori."}, 400)
                return

            if main.telefono_esiste(telefono):
                self._send_json({"ok": False, "errore": f"Il numero '{telefono}' è già presente a sistema."}, 409)
                return

            nuovo_id = main.aggiungi_contatto(azienda, telefono, citta, note)
            if nuovo_id:
                self._send_json({"ok": True, "id": nuovo_id, "messaggio": "Contatto creato con successo."}, 201)
            else:
                self._send_json({"ok": False, "errore": "Errore durante il salvataggio nel database."}, 500)
            return

        elif path.startswith("/api/contatti/") and path.endswith("/chiamata"):
            # es: /api/contatti/3/chiamata
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            chiamato = payload.get("chiamato", "Sì")
            esito = payload.get("esito", "In attesa")
            nuove_note = payload.get("note", "")

            esito_valido = ["In attesa", "Interessato (Ordine preso)", "Non interessato (Rifiutato)", "Da richiamare"]
            if esito not in esito_valido:
                self._send_json({"ok": False, "errore": f"Esito non valido. Ammessi: {esito_valido}"}, 400)
                return

            ok = main.registra_esito_chiamata(id_contatto, chiamato, esito, nuove_note)
            if ok:
                self._send_json({"ok": True, "messaggio": "Esito chiamata aggiornato con successo."})
            else:
                self._send_json({"ok": False, "errore": "Impossibile aggiornare l'esito."}, 500)
            return

        elif path == "/api/importa-json":
            # Può accettare un array di contatti direttamente nel payload
            # oppure il percorso di un file locale
            contatti = payload.get("contatti")
            percorso_file = payload.get("percorso_file")

            if contatti and isinstance(contatti, list):
                # Importazione diretta dall'array inviato dal browser
                conn = main.connetti()
                cur = conn.cursor()
                inseriti, duplicati, errori = 0, 0, 0
                data_ora = datetime.now().strftime("%Y-%m-%d %H:%M")

                for c in contatti:
                    az = str(c.get("azienda", "")).strip()
                    tel = str(c.get("telefono", "")).strip()
                    cit = str(c.get("citta", "")).strip()
                    not_ = str(c.get("note", "")).strip()

                    if not az or not tel:
                        errori += 1
                        continue

                    cur.execute("SELECT id FROM contatti_ingrosso WHERE telefono = ?", (tel,))
                    if cur.fetchone():
                        duplicati += 1
                        continue

                    cur.execute("""
                        INSERT INTO contatti_ingrosso (azienda, telefono, citta, note, chiamato, esito, data_aggiornamento)
                        VALUES (?, ?, ?, ?, 'No', 'In attesa', ?)
                    """, (az, tel, cit, not_, data_ora))
                    inseriti += 1

                conn.commit()
                conn.close()
                self._send_json({
                    "ok": True,
                    "inseriti": inseriti,
                    "duplicati": duplicati,
                    "errori": errori,
                    "totale": len(contatti)
                })
                return

            elif percorso_file:
                res = main.importa_contatti_da_json(percorso_file)
                if "errore" in res:
                    self._send_json({"ok": False, "errore": res["errore"]}, 400)
                else:
                    self._send_json({"ok": True, **res})
                return
            else:
                self._send_json({"ok": False, "errore": "Dati mancanti: inviare 'contatti' (array) o 'percorso_file'."}, 400)
                return

        elif path == "/api/ripristina-demo":
            # Ripristina i dati demo di test caricando contatti_lead.json
            conn = main.connetti()
            cur = conn.cursor()
            cur.execute("DELETE FROM contatti_ingrosso")
            conn.commit()
            conn.close()
            res = main.importa_contatti_da_json(os.path.join(DIRECTORY, "contatti_lead.json"))
            self._send_json({"ok": True, "messaggio": "Dati demo ripristinati.", "dettaglio": res})
            return

        self._send_json({"ok": False, "errore": "Endpoint non trovato"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/contatti/"):
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            ok = main.elimina_contatto(id_contatto)
            if ok:
                self._send_json({"ok": True, "messaggio": f"Contatto #{id_contatto} eliminato con successo."})
            else:
                self._send_json({"ok": False, "errore": "Errore durante l'eliminazione."}, 500)
            return

        self._send_json({"ok": False, "errore": "Endpoint non trovato"}, 404)


def run():
    main.crea_tabella()
    server_address = ("127.0.0.1", PORT)
    try:
        httpd = HTTPServer(server_address, GestionaleApiHandler)
        print(f"[NOGA ROMA] Server Gestionale attivo su http://localhost:{PORT}")
        httpd.serve_forever()
    except OSError as e:
        print(f"Errore avvio server su porta {PORT}: {e}")
        # Prova su porta 8081 se 8080 fosse occupata
        try:
            httpd = HTTPServer(("127.0.0.1", 8081), GestionaleApiHandler)
            print(f"[NOGA ROMA] Server Gestionale attivo su http://localhost:8081")
            httpd.serve_forever()
        except Exception as e2:
            print(f"Errore definitivo: {e2}")

if __name__ == "__main__":
    run()
