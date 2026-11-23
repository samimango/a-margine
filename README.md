# A margine

Lettura della Bibbia (Riveduta 2020, dal sito LaParola.net) con meditazioni personali. Si usa dal telefono e dal computer; le meditazioni si sincronizzano tramite il tuo account Google.

## Mettere l'app online (GitHub Pages)

1. Crea un repository su GitHub e carica tutti i file di questa cartella.
2. In **Settings → Pages** scegli il ramo `main` e la cartella `/ (root)`.
3. L'indirizzo sarà `https://<tuo-nome>.github.io/<repository>/`.

Su iPhone: apri l'indirizzo in Safari, tocca Condividi e poi **Aggiungi a Home**.

## Collegare il tuo Google (facoltativo)

Senza collegamento l'app funziona, ma i capitoli si leggono solo se li importi a mano e le meditazioni restano su quel dispositivo.

1. Vai su [script.google.com](https://script.google.com) e crea un nuovo progetto.
2. Incolla il contenuto di `backend/Code.gs` nel file `Code.gs`. In **Impostazioni progetto** attiva «Mostra il file manifest» e incolla `backend/appsscript.json` nel manifest.
3. Scegli la funzione `setupKey` e premi **Esegui** (accetta i permessi). Apri il **Registro di esecuzione**: trovi la chiave segreta.
4. **Distribuisci → Nuova distribuzione → Applicazione web**: *Esegui come* **Me**, *Chi ha accesso* **Chiunque**. Copia l'indirizzo che finisce con `/exec`.
5. Apri l'app, vai in **Impostazioni → Collega il tuo Google** e incolla indirizzo e chiave. Oppure apri sul telefono questo link (lo trovi già pronto nel registro): `https://<tuo-nome>.github.io/<repository>/#setup=<indirizzo>|<chiave>`. L'app salva i dati e ripulisce l'indirizzo.

Se perdi la chiave esegui `resetKey()` e ripeti il collegamento sui dispositivi. Dopo aver cambiato `Code.gs` serve una **nuova distribuzione** (stesso indirizzo: Gestisci distribuzioni → Modifica → Nuova versione).

La chiave protegge i tuoi dati: non metterla in pagine pubbliche. Le meditazioni stanno nelle proprietà utente del tuo progetto Apps Script.

## Provarla sul computer

Servono solo file statici: da questa cartella, ad esempio `python3 -m http.server 8000` e poi `http://localhost:8000`. Il service worker e gli appunti richiedono `localhost` o HTTPS.

## Prove automatiche

`python3 tests/run.py` (richiede Python con Playwright, Chrome e Node). Vedi `ARCHITECTURE.md`.

## Sviluppo

Come è fatta l'app e come aggiungere funzioni senza toccare il resto: `ARCHITECTURE.md`.
