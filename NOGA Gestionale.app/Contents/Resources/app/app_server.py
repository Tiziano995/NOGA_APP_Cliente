import json
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer

# Importa le funzioni di business logic consolidate in main.py
import main

HOST = "127.0.0.1"
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

    def _send_csv(self, csv_text, filename="noga_roma_contatti_ordini.csv"):
        body = csv_text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"
        if not post_data:
            return {}
        return json.loads(post_data.decode("utf-8"))

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
            priorita_filtro = query_params.get("priorita", [""])[0].strip()
            ordina_per = query_params.get("ordina", ["priorita"])[0].strip()

            if termine:
                righe = main.cerca_contatti(termine)
            elif filtro == "da_chiamare":
                righe = main.ottieni_contatti_da_chiamare()
            elif filtro == "ordini_confermati":
                righe = main.ottieni_ordini_confermati(ordina_per=ordina_per)
            else:
                righe = main.ottieni_tutti_contatti()

            contatti = [main._riga_a_dict(r) for r in righe]

            if priorita_filtro in ("1", "2", "3"):
                p_int = int(priorita_filtro)
                contatti = [c for c in contatti if c["priorita"] == p_int]

            if ordina_per == "totale_ordini":
                contatti.sort(key=lambda x: (-x["totale_ordini"], x["priorita"], x["id"]))
            elif ordina_per == "numero_ordini":
                contatti.sort(key=lambda x: (-x["numero_ordini"], -x["totale_ordini"], x["priorita"], x["id"]))

            self._send_json({"ok": True, "data": contatti, "totale": len(contatti)})
            return

        elif path == "/api/calendario":
            mese = query_params.get("mese", [None])[0]
            anno = query_params.get("anno", [None])[0]
            data_specifica = query_params.get("data", [None])[0]

            tutti_app = main.ottieni_appuntamenti_calendario()
            contatori = {
                "scaduti": sum(1 for a in tutti_app if a["stato_ricontatto"] == "scaduto"),
                "oggi": sum(1 for a in tutti_app if a["stato_ricontatto"] == "oggi"),
                "futuri": sum(1 for a in tutti_app if a["stato_ricontatto"] == "futuro"),
                "totale": len(tutti_app),
            }

            if mese or anno or data_specifica:
                filtrati = main.ottieni_appuntamenti_calendario(
                    mese=mese,
                    anno=anno,
                    data_specifica=data_specifica,
                )
            else:
                filtrati = tutti_app

            self._send_json({
                "ok": True,
                "data": filtrati,
                "totale": len(filtrati),
                "contatori": contatori,
            })
            return

        elif path.startswith("/api/contatti/") and path.endswith("/ordini"):
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            ordini = main.ottieni_storico_ordini(id_contatto)
            self._send_json({"ok": True, "data": ordini, "totale": len(ordini)})
            return

        elif path == "/api/statistiche":
            stats = main.ottieni_statistiche()
            if stats is None:
                stats = {
                    "totali": 0,
                    "chiamati": 0,
                    "interessati": 0,
                    "rifiutati": 0,
                    "da_contattare": 0,
                    "da_richiamare": 0,
                    "in_attesa": 0,
                    "fatturato_totale_ordini": 0.0,
                    "valore_medio_ordine": 0.0,
                    "totale_ordini_effettuati": 0,
                    "ricontatti_oggi": 0,
                    "ricontatti_scaduti": 0,
                    "totale_pianificati": 0,
                    "analisi_regioni": [],
                    "analisi_citta": [],
                    "gruppi_duplicati": 0,
                }

            totali = stats.get("totali", 0)
            chiamati = stats.get("chiamati", 0)
            interessati = stats.get("interessati", 0)

            tasso_conversione = round((interessati / chiamati * 100), 1) if chiamati > 0 else 0.0
            percentuale_completamento = round((chiamati / totali * 100), 1) if totali > 0 else 0.0

            stats["tasso_conversione"] = tasso_conversione
            stats["percentuale_completamento"] = percentuale_completamento
            self._send_json({"ok": True, "data": stats})
            return

        elif path == "/api/duplicati":
            gruppi = main.rileva_duplicati()
            self._send_json({"ok": True, "data": gruppi, "totale_gruppi": len(gruppi)})
            return

        elif path == "/api/esporta-json":
            contatti = main.ottieni_tutti_contatti()
            lista_dati = [main._riga_a_dict(c) for c in contatti]
            self._send_json({"ok": True, "data": lista_dati})
            return

        elif path == "/api/esporta-csv":
            csv_content = main.genera_csv_contatti()
            self._send_csv(csv_content, filename="noga_roma_contatti_ordini.csv")
            return

        # Per tutte le altre richieste, servi i file statici normalmente
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            payload = self._read_json_body()
        except Exception:
            self._send_json({"ok": False, "errore": "JSON non valido"}, 400)
            return

        # 1. Creazione nuovo contatto
        if path == "/api/contatti":
            azienda = str(payload.get("azienda", "")).strip()
            referente = str(payload.get("referente", "")).strip()
            telefono = str(payload.get("telefono", "")).strip()
            citta = str(payload.get("citta", "")).strip()
            regione = str(payload.get("regione", "")).strip()
            note = str(payload.get("note", "")).strip()
            priorita = payload.get("priorita", 2)
            totale_ordini = payload.get("totale_ordini", 0.0)
            data_ricontatto = str(payload.get("data_ricontatto", "")).strip()
            motivo_ricontatto = str(payload.get("motivo_ricontatto", "")).strip()

            if not azienda or not telefono:
                self._send_json({"ok": False, "errore": "Azienda e Telefono sono obbligatori."}, 400)
                return

            if main.telefono_esiste(telefono):
                self._send_json({"ok": False, "errore": f"Il numero '{telefono}' è già presente a sistema."}, 409)
                return

            nuovo_id = main.aggiungi_contatto(
                azienda=azienda,
                telefono=telefono,
                citta=citta,
                note=note,
                referente=referente,
                regione=regione,
                priorita=priorita,
                totale_ordini=totale_ordini,
                data_ricontatto=data_ricontatto,
                motivo_ricontatto=motivo_ricontatto,
            )
            if nuovo_id:
                self._send_json({"ok": True, "id": nuovo_id, "messaggio": "Contatto creato con successo."}, 201)
            else:
                self._send_json({"ok": False, "errore": "Errore durante il salvataggio nel database."}, 500)
            return

        # 2. Registrazione chiamata + eventuale ordine (€) + eventuale calendarizzazione ricontatto
        elif path.startswith("/api/contatti/") and path.endswith("/chiamata"):
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
            importo_ordine = payload.get("importo_ordine", 0.0)
            referente = payload.get("referente", None)
            priorita = payload.get("priorita", None)
            data_ricontatto = payload.get("data_ricontatto", "")
            motivo_ricontatto = payload.get("motivo_ricontatto", "")

            esito_valido = [
                "In attesa",
                "Interessato (Ordine preso)",
                "Non interessato (Rifiutato)",
                "Da richiamare",
            ]
            if esito not in esito_valido:
                self._send_json({"ok": False, "errore": f"Esito non valido. Ammessi: {esito_valido}"}, 400)
                return

            ok = main.registra_esito_chiamata(
                id_contatto=id_contatto,
                chiamato=chiamato,
                esito=esito,
                nuove_note=nuove_note,
                importo_ordine=importo_ordine,
                referente=referente,
                priorita=priorita,
                data_ricontatto=data_ricontatto,
                motivo_ricontatto=motivo_ricontatto,
            )
            if ok:
                self._send_json({"ok": True, "messaggio": "Esito chiamata e calendario aggiornati con successo."})
            else:
                self._send_json({"ok": False, "errore": "Impossibile aggiornare l'esito."}, 500)
            return

        # 3. Pianificazione / Spostamento / Rimozione rapida Ricontatto in tempo reale
        elif path.startswith("/api/contatti/") and path.endswith("/ricontatto"):
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            data_ricontatto = str(payload.get("data_ricontatto", "")).strip()
            motivo_ricontatto = str(payload.get("motivo_ricontatto", "")).strip()
            priorita = payload.get("priorita", None)
            nota_extra = str(payload.get("nota", payload.get("nota_extra", ""))).strip()

            ok = main.pianifica_ricontatto(
                contatto_id=id_contatto,
                data_ricontatto=data_ricontatto,
                motivo_ricontatto=motivo_ricontatto,
                priorita=priorita,
                nota_extra=nota_extra,
            )
            if ok:
                msg = (
                    f"Ricontatto programmato per {data_ricontatto}."
                    if data_ricontatto
                    else "Appuntamento di ricontatto completato / rimosso."
                )
                self._send_json({"ok": True, "messaggio": msg})
            else:
                self._send_json({"ok": False, "errore": "Impossibile aggiornare il ricontatto."}, 500)
            return

        # 4. Aggiunta nuovo ordine nel tempo per un contatto esistente
        elif path.startswith("/api/contatti/") and path.endswith("/ordini"):
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            importo = payload.get("importo", payload.get("importo_ordine", 0.0))
            note_ordine = payload.get("note_ordine", payload.get("note", ""))

            risultato = main.aggiungi_nuovo_ordine(id_contatto, importo, note_ordine)
            if risultato:
                self._send_json({
                    "ok": True,
                    "messaggio": "Nuovo ordine registrato con successo.",
                    "data": risultato,
                }, 201)
            else:
                self._send_json({"ok": False, "errore": "Importo ordine non valido (deve essere > 0)."}, 400)
            return

        # 5. Modifica rapida priorità (1 = Alta, 2 = Normale, 3 = Bassa)
        elif path.startswith("/api/contatti/") and path.endswith("/priorita"):
            parti = path.strip("/").split("/")
            try:
                id_contatto = int(parti[2])
            except (IndexError, ValueError):
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            priorita = payload.get("priorita")
            if main.aggiorna_priorita(id_contatto, priorita):
                self._send_json({"ok": True, "messaggio": "Priorità aggiornata con successo."})
            else:
                self._send_json({"ok": False, "errore": "Valore priorità non valido (ammessi: 1, 2, 3)."}, 400)
            return

        # 6. Importazione universale multi-formato (JSON, CSV, TSV/Excel, TXT)
        elif path in ("/api/importa", "/api/importa-json"):
            contatti = payload.get("contatti")
            contenuto_testo = payload.get("contenuto_testo", payload.get("testo", ""))
            nome_file = payload.get("nome_file", "")
            percorso_file = payload.get("percorso_file", "")

            if isinstance(contenuto_testo, str) and contenuto_testo.strip():
                res = main.importa_contatti_universale(contenuto_testo, nome_file=nome_file)
                if "errore" in res:
                    self._send_json({"ok": False, "errore": res["errore"]}, 400)
                else:
                    self._send_json({"ok": True, **res})
                return

            elif contatti and isinstance(contatti, list):
                res = main._inserisci_lista_contatti_mappati(contatti, ignora_duplicati_telefono=True, formato_rilevato="JSON")
                if "errore" in res:
                    self._send_json({"ok": False, "errore": res["errore"]}, 400)
                else:
                    self._send_json({"ok": True, **res})
                return

            elif percorso_file:
                res = main.importa_contatti_da_json(percorso_file)
                if "errore" in res:
                    self._send_json({"ok": False, "errore": res["errore"]}, 400)
                else:
                    self._send_json({"ok": True, **res})
                return
            else:
                self._send_json(
                    {"ok": False, "errore": "Dati mancanti: inviare 'contenuto_testo', 'contatti' o 'percorso_file'."},
                    400,
                )
                return

        # 7. Fusione (Merge) di due schede contatto duplicate
        elif path == "/api/duplicati/unisci":
            try:
                id_principale = int(payload.get("id_principale"))
                id_secondario = int(payload.get("id_secondario"))
            except (TypeError, ValueError):
                self._send_json({"ok": False, "errore": "ID principale e secondario obbligatori e numerici."}, 400)
                return

            if id_principale == id_secondario:
                self._send_json({"ok": False, "errore": "Impossibile unire un contatto con se stesso."}, 400)
                return

            if main.unisci_contatti(id_principale, id_secondario):
                self._send_json({
                    "ok": True,
                    "messaggio": f"Scheda #{id_secondario} unita correttamente nella scheda #{id_principale}.",
                })
            else:
                self._send_json({"ok": False, "errore": "Impossibile completare la fusione dei contatti."}, 404)
            return

        # 8. Sincronizzazione snapshot client (persistenza unificata post-standby / offline)
        elif path == "/api/sincronizza-snapshot":
            lista_contatti = payload.get("contatti", [])
            res = main.sincronizza_snapshot_client(lista_contatti)
            if not res.get("ok"):
                self._send_json({"ok": False, "errore": res.get("errore", "Errore sincronizzazione")}, 400)
            else:
                self._send_json({"ok": True, **res})
            return

        # 9. Endpoint legacy mantenuto per compatibilità (disattivato demo)
        elif path == "/api/ripristina-demo":
            res = main.ripristina_dati_demo()
            self._send_json({"ok": True, "messaggio": "Database pronto.", "dettaglio": res})
            return

        self._send_json({"ok": False, "errore": "Endpoint non trovato"}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            payload = self._read_json_body()
        except Exception:
            self._send_json({"ok": False, "errore": "JSON non valido"}, 400)
            return

        if path.startswith("/api/contatti/"):
            parti = path.strip("/").split("/")
            if len(parti) != 3:
                self._send_json({"ok": False, "errore": "Percorso PUT non valido"}, 400)
                return
            try:
                id_contatto = int(parti[2])
            except ValueError:
                self._send_json({"ok": False, "errore": "ID contatto non valido"}, 400)
                return

            if not main.id_esiste(id_contatto):
                self._send_json({"ok": False, "errore": "Contatto non trovato."}, 404)
                return

            azienda = str(payload.get("azienda", "")).strip()
            referente = str(payload.get("referente", "")).strip()
            telefono = str(payload.get("telefono", "")).strip()
            citta = str(payload.get("citta", "")).strip()
            regione = str(payload.get("regione", "")).strip()
            priorita = payload.get("priorita", 2)
            note = payload.get("note", None)
            data_ricontatto = payload.get("data_ricontatto", None)
            motivo_ricontatto = payload.get("motivo_ricontatto", None)

            if not azienda or not telefono:
                self._send_json({"ok": False, "errore": "Azienda e Telefono sono obbligatori."}, 400)
                return

            ok = main.aggiorna_contatto(
                id_contatto=id_contatto,
                azienda=azienda,
                referente=referente,
                telefono=telefono,
                citta=citta,
                regione=regione,
                priorita=priorita,
                note=note,
                data_ricontatto=data_ricontatto,
                motivo_ricontatto=motivo_ricontatto,
            )
            if ok:
                self._send_json({"ok": True, "messaggio": f"Contatto #{id_contatto} aggiornato con successo."})
            else:
                self._send_json({"ok": False, "errore": "Impossibile aggiornare il contatto."}, 500)
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

    server_address = (HOST, PORT)
    try:
        httpd = ThreadingHTTPServer(server_address, GestionaleApiHandler)
        print(f"[NOGA ROMA macOS] Server Gestionale attivo su http://{HOST}:{PORT}/index.html")
        httpd.serve_forever()
    except OSError as e:
        print(f"Errore avvio server su porta {PORT}: {e}")
        try:
            httpd = ThreadingHTTPServer((HOST, 8081), GestionaleApiHandler)
            print(f"[NOGA ROMA macOS] Server Gestionale attivo su http://{HOST}:8081/index.html")
            httpd.serve_forever()
        except Exception as e2:
            print(f"Errore definitivo: {e2}")


if __name__ == "__main__":
    run()
