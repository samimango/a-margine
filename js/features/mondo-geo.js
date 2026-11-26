/* Geometria della mappa disegnata di «Mondo della Bibbia»: contorni grossolani (lon, lat) e proiezione Web Mercator.
   La stessa proiezione serve alle piastrelle OpenStreetMap, così punti, mappa disegnata e piastrelle coincidono. */

export const WORLD = 256;                       // lato del mondo a zoom 0, in pixel
export const BASE_Z = 6;                        // zoom di riferimento in cui sono scritti i percorsi SVG
export const BASE = WORLD * 2 ** BASE_Z;        // lato del mondo allo zoom di riferimento

/* lon/lat → coordinate normalizzate 0..1 (Web Mercator) */
export const nx = lon => (lon + 180) / 360;
export const ny = lat => { const s = Math.sin(lat * Math.PI / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };

/* Mar Mediterraneo (acqua), in senso orario da Gibraltar lungo la costa nord */
export const MEDITERRANEO = [
  [-5.35, 36.1], [-4.4, 36.7], [-2.5, 36.8], [-1.0, 37.6], [0.2, 38.7], [-0.3, 39.4], [0.9, 40.7], [2.2, 41.4], [3.3, 42.3], [3.9, 43.5], [5.4, 43.3], [6.9, 43.1], [7.3, 43.7], [8.9, 44.4], [9.8, 44.1],
  [10.3, 43.5], [10.5, 42.9], [11.8, 42.1], [12.4, 41.7], [13.6, 41.2], [14.2, 40.8], [14.8, 40.6], [15.6, 40.0], [16.0, 39.3], [16.2, 38.8], [15.7, 38.1], [16.1, 37.9], [16.6, 38.9], [17.1, 39.1],
  [16.5, 39.7], [17.2, 40.45], [18.35, 39.8], [18.0, 40.65], [16.85, 41.1], [16.0, 41.9], [14.2, 42.5], [13.5, 43.6], [12.3, 45.3], [13.7, 45.65], [13.85, 44.9], [14.4, 45.3], [16.4, 43.5], [18.1, 42.65],
  [19.1, 42.1], [19.4, 41.3], [19.45, 40.45], [20.2, 39.7], [20.75, 38.95], [21.4, 38.35], [21.35, 37.9], [21.3, 37.65], [21.7, 36.8], [22.45, 36.4], [23.2, 36.5], [22.8, 37.5], [23.4, 37.9],
  [24.0, 37.65], [24.0, 38.2], [23.3, 38.6], [22.95, 39.3], [22.7, 39.9], [22.9, 40.55], [23.7, 40.2], [24.35, 40.15], [24.0, 40.5], [24.4, 40.9], [25.9, 40.85], [26.7, 40.4], [26.2, 40.05],
  [26.15, 39.8], [26.9, 39.55], [26.85, 39.05], [27.0, 38.5], [26.3, 38.3], [27.25, 37.85], [27.4, 37.0], [28.3, 36.85], [29.1, 36.6], [29.6, 36.2], [30.7, 36.85], [32.0, 36.5], [32.8, 36.05],
  [34.6, 36.8], [35.3, 36.7], [36.15, 36.6], [35.95, 36.1], [35.75, 35.5], [35.9, 34.9], [35.84, 34.44], [35.64, 34.12], [35.5, 33.89], [35.37, 33.56], [35.19, 33.27], [35.1, 33.08], [35.07, 32.92], [35.0, 32.82],
  [34.97, 32.74], [34.92, 32.62], [34.89, 32.5], [34.85, 32.33], [34.77, 32.07], [34.75, 32.05], [34.64, 31.8], [34.55, 31.67],
  [34.46, 31.5], [34.24, 31.29], [33.8, 31.1], [32.3, 31.27], [31.8, 31.5], [30.4, 31.5], [29.9, 31.2], [27.2, 31.35], [25.2, 31.55], [24.0, 32.1], [22.65, 32.77], [21.85, 32.9], [20.05, 32.1], [20.2, 30.9],
  [19.0, 30.3], [17.5, 30.5], [16.0, 31.2], [15.1, 32.4], [13.2, 32.9], [10.1, 33.9], [10.8, 34.7], [10.6, 35.8], [11.1, 37.1], [10.2, 36.85], [9.9, 37.3], [7.8, 36.9], [3.05, 36.8], [-0.65, 35.7],
  [-2.9, 35.3], [-5.3, 35.9],
];
/* Mar Nero */
export const MARE_NERO = [
  [29.1, 41.2], [27.5, 42.5], [27.9, 43.2], [28.65, 44.2], [29.7, 45.2], [30.7, 46.5], [33.5, 45.3], [33.5, 44.6], [34.2, 44.5], [36.5, 45.3], [37.8, 44.7], [39.7, 43.6], [41.6, 41.6], [39.7, 41.0],
  [36.3, 41.3], [35.1, 42.0], [31.8, 41.45],
];
/* Mar Rosso con i golfi di Suez e di Aqaba */
export const MAR_ROSSO = [
  [32.55, 29.95], [32.35, 29.6], [32.65, 29.1], [32.85, 28.35], [33.8, 27.25], [33.95, 26.75], [34.9, 25.05], [35.5, 23.9], [37.2, 19.6], [37.3, 19.1], [39.5, 15.6], [42.7, 13.0], [43.4, 12.7],
  [43.25, 13.3], [42.95, 14.8], [42.55, 16.9], [39.15, 21.5], [38.05, 24.1], [36.45, 26.2], [35.7, 27.35], [34.95, 29.3], [35.0, 29.55], [34.9, 29.4], [34.65, 29.0], [34.5, 28.5], [34.3, 27.9],
  [34.25, 27.73], [33.5, 28.5], [33.2, 28.9], [32.7, 29.6],
];
/* Golfo Persico */
export const GOLFO_PERSICO = [
  [48.4, 30.0], [48.0, 29.4], [48.6, 28.2], [50.1, 26.5], [50.8, 26.0], [51.2, 26.1], [51.0, 25.0], [51.6, 24.6], [54.4, 24.45], [55.3, 25.3], [56.3, 26.3], [56.5, 27.0], [56.3, 27.2], [54.0, 26.6],
  [52.0, 27.4], [50.8, 28.95], [49.5, 30.2], [48.9, 30.4],
];
/* Isole (terra) */
export const ISOLE = [
  [[15.65, 38.27], [15.25, 38.27], [13.35, 38.15], [12.5, 38.0], [12.4, 37.8], [12.6, 37.65], [13.5, 37.3], [14.25, 37.05], [15.1, 36.7], [15.3, 37.05], [15.1, 37.5], [15.3, 37.85]],            // Sicilia
  [[8.4, 40.85], [9.2, 41.25], [9.55, 40.9], [9.75, 40.3], [9.65, 39.3], [9.15, 39.2], [8.9, 38.9], [8.4, 39.1], [8.45, 39.9], [8.3, 40.55]],                                           // Sardegna
  [[9.35, 42.95], [9.45, 42.7], [9.55, 42.1], [9.3, 41.6], [9.15, 41.4], [8.7, 41.9], [8.75, 42.55]],                                                                                   // Corsica
  [[23.55, 35.55], [24.0, 35.52], [24.5, 35.4], [25.15, 35.35], [25.7, 35.2], [26.3, 35.2], [25.7, 34.95], [24.75, 34.95], [24.2, 35.2], [23.65, 35.25]],                                // Creta
  [[32.3, 35.05], [32.4, 34.75], [33.0, 34.65], [33.6, 34.9], [33.95, 35.1], [34.55, 35.65], [33.3, 35.35], [32.85, 35.2]],                                                            // Cipro
  [[14.35, 35.85], [14.55, 35.95], [14.5, 36.05], [14.2, 36.0]],                                                                                                                        // Malta e Gozo (grossolano)
  [[27.7, 36.4], [28.2, 36.45], [28.25, 36.1], [27.8, 35.9]],                                                                                                                           // Rodi
];
/* Corsi d'acqua (linee) */
export const FIUMI = {
  nilo: [[32.5, 15.6], [33.97, 17.7], [31.8, 18.5], [31.35, 21.8], [32.9, 24.1], [32.65, 25.7], [32.7, 26.15], [31.2, 27.2], [31.1, 29.1], [31.25, 30.05], [30.9, 30.8], [30.4, 31.45]],
  nilo2: [[31.25, 30.05], [31.5, 30.8], [31.8, 31.45]],
  eufrate: [[38.5, 38.7], [38.0, 37.5], [38.0, 36.8], [39.0, 35.95], [40.15, 35.3], [40.9, 34.45], [42.4, 34.1], [43.3, 33.4], [43.8, 33.35], [44.4, 32.5], [45.3, 31.3], [46.25, 31.05], [47.4, 31.0], [48.4, 30.0]],
  tigri: [[40.2, 37.9], [42.2, 37.3], [43.15, 36.35], [43.9, 34.2], [44.4, 33.3], [45.8, 32.5], [47.15, 31.85], [47.45, 31.0]],
  /* Giordano: esce dal lago di Galilea a sud (35,58 E, 32,70 N), scende in una valle stretta e sfocia nel Mar Morto (35,56 E, 31,76 N) */
  giordano: [[35.58, 32.70], [35.575, 32.62], [35.565, 32.55], [35.52, 32.48], [35.545, 32.40], [35.56, 32.33], [35.555, 32.26], [35.58, 32.20], [35.56, 32.12], [35.54, 32.05], [35.57, 31.97], [35.55, 31.90], [35.56, 31.82], [35.56, 31.76]],
  /* affluenti: Yarmuk da est, Giabbok (Zarqa) da est */
  yarmuk: [[36.2, 32.85], [36.0, 32.80], [35.85, 32.75], [35.75, 32.72], [35.65, 32.66], [35.61, 32.63]],
  giabbok: [[36.25, 32.20], [36.0, 32.14], [35.85, 32.12], [35.72, 32.10], [35.62, 32.08], [35.57, 32.07]],
}
/* Laghi */
export const LAGHI = {
  /* mar di Galilea (kinneret): 21 km N–S, 12 km E–O, circa 210 m sotto il mare; contorno da coordinate note, curve morbide */
  galilea: [[35.575, 32.885], [35.60, 32.87], [35.615, 32.84], [35.625, 32.80], [35.62, 32.75], [35.605, 32.715], [35.575, 32.70], [35.545, 32.70], [35.525, 32.73], [35.52, 32.77], [35.53, 32.82], [35.545, 32.86]],
  /* mar Morto: bacino nord profondo (31,50–31,80 N, circa 15 km di larghezza), penisola del Lisan a est, bacino sud basso fino a 31,00 N */
  morto: [[35.57, 31.80], [35.60, 31.75], [35.61, 31.66], [35.61, 31.56], [35.56, 31.53], [35.47, 31.50], [35.55, 31.46], [35.59, 31.42], [35.59, 31.30], [35.56, 31.15], [35.52, 31.05], [35.47, 31.00], [35.42, 31.03], [35.39, 31.12], [35.37, 31.22], [35.39, 31.30], [35.40, 31.42], [35.42, 31.52], [35.44, 31.62], [35.45, 31.72], [35.49, 31.77]],
};

/* Percorso SVG (spazio BASE) da una lista [lon, lat].
   smooth: curve morbide (Catmull-Rom → Bézier) per fiumi, laghi e regioni. */
export function pathOf(points, close = true, smooth = false) {
  const P = points.map(([lon, lat]) => [nx(lon) * BASE, ny(lat) * BASE]);
  if (!smooth || P.length < 3) {
    let d = '';
    P.forEach(([x, y], i) => { d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); });
    return d + (close ? 'Z' : '');
  }
  const n = P.length, at = i => close ? P[(i + n) % n] : P[Math.min(Math.max(i, 0), n - 1)];
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  const segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (close ? 'Z' : '');
}

/* ---------- Livelli regionali ----------
   Poligoni approssimativi disegnati a mano a partire da punti ancorati a città, fiumi e mari reali (Mediterraneo, Giordano,
   Mar Morto, Arnon, Iabbok, Ermon, lago di Galilea). Non sono confini ufficiali. Ogni area ha:
   certezza: 'alta' (confini e sede sicuri nelle linee generali), 'media' (confini indicativi, discussi dagli studiosi),
   'discussa' (estensione o nome non confermati). nomeBiblico: false se il nome non compare nella Bibbia.
   Fonti: Encyclopedia of the Bible (Biblegateway), voci «Location of Tribes», «Perea», «Decapolis» (Britannica); testi biblici indicati. */
export const LIVELLI = {
  terra: {nome: 'Terra di Gesù', fonti: 'Fonti: Encyclopedia of the Bible (Biblegateway), voci «Perea» e «Location of Tribes»; Britannica, voce «Decapolis». I confini sono semplificati: le regioni del Nuovo Testamento non avevano limiti fissi.'},
  tribu: {nome: 'Le 12 tribù', fonti: 'Fonti: Giosuè 13–19 e Encyclopedia of the Bible, voce «Location of Tribes», che segnala confini incerti per Dan, Simeone, Aser, Neftali e Issacar. Levi non ha un territorio: aveva 48 città sparse (secondo alcune fonti 61; Gs 21).'},
  regni: {nome: 'Regni divisi', fonti: 'Fonti: 1Re 12 e 15–16. La linea di confine tra Israele e Giuda non è documentata con precisione: il tracciato è indicativo.'},
  popoli: {nome: 'Popoli vicini', fonti: 'Fonti: testi biblici citati; le sedi di Filistei, Moab, Ammon ed Edom sono ben documentate. I confini di Aram e di Ammon sono indicativi.'},
};
export const AREE = [
  /* Terra di Gesù */
  {id: 'galilea', nome: 'Galilea', livelli: ['terra'], certezza: 'alta', periodo: 'Epoca di Gesù', rif: ['Mt 4,15', 'Gv 4,46'],
    descrizione: 'Regione a nord della pianura di Esdrelon, con il lago di Galilea al centro. Nei Vangeli è il luogo principale del ministero di Gesù, con Nazaret e Cafarnao.',
    poligono: [[35.0, 32.8], [35.1, 33.0], [35.19, 33.27], [35.45, 33.27], [35.62, 33.25], [35.62, 32.95], [35.58, 32.7], [35.4, 32.65], [35.15, 32.65], [35.0, 32.75]], ancora: [35.3, 32.95]},
  {id: 'samaria', nome: 'Samaria', livelli: ['terra'], certezza: 'alta', periodo: 'Epoca di Gesù', rif: ['Gv 4,4', '1Re 16,24'],
    descrizione: 'Regione montuosa fra Galilea e Giudea, con Sichem e il monte Garizim. Gesù la attraversa nel racconto della donna di Samaria (Gv 4).',
    poligono: [[34.95, 32.7], [35.15, 32.65], [35.4, 32.65], [35.55, 32.6], [35.55, 32.3], [35.5, 31.95], [35.2, 31.9], [34.95, 32.0], [34.85, 32.3]], ancora: [35.2, 32.2]},
  {id: 'giudea', nome: 'Giudea', livelli: ['terra'], certezza: 'alta', periodo: 'Epoca di Gesù', rif: ['Lc 1,5', 'Gv 3,22'],
    descrizione: 'Regione a sud di Samaria, con Gerusalemme, Betlemme ed Ebron. Nei Vangeli indica la regione intorno a Gerusalemme, in contrasto con la Galilea.',
    poligono: [[34.7, 31.9], [35.2, 31.9], [35.5, 31.9], [35.5, 31.55], [35.45, 31.2], [35.25, 31.0], [35.1, 31.05], [34.95, 31.1], [34.75, 31.25], [34.7, 31.5]], ancora: [35.1, 31.55]},
  {id: 'perea', nome: 'Perea', livelli: ['terra'], certezza: 'discussa', periodo: 'Epoca di Gesù', rif: ['Mt 19,1', 'Mc 10,1'], nomeBiblico: false,
    descrizione: 'Regione a est del Giordano, indicata nei Vangeli come «al di là del Giordano». È il nome di età romana, usato da Giuseppe Flavio.',
    nota: 'Il nome Perea non compare nella Bibbia, salvo una variante di Lc 6,17. I suoi confini sono discussi.',
    poligono: [[35.55, 32.7], [35.85, 32.75], [35.95, 32.2], [35.8, 31.6], [35.6, 31.5], [35.55, 31.9]], ancora: [35.88, 32.1]},
  {id: 'decapoli', nome: 'Decapoli', livelli: ['terra'], certezza: 'discussa', periodo: 'Epoca di Gesù', rif: ['Mc 5,20', 'Mt 4,25'],
    descrizione: 'Gruppo di città di impianto greco a est e a sud-est del lago di Galilea. Il Nuovo Testamento la nomina (Mc 5,20), ma l’elenco delle città non è fisso.',
    nota: 'Secondo Plinio il Vecchio le città erano dieci, con Damasco; l’elenco è cambiato nel tempo. Gli studiosi non concordano sulla lista.',
    poligono: [[35.45, 32.65], [35.8, 32.95], [36.15, 32.5], [36.05, 31.85], [35.75, 31.85], [35.55, 32.2]], ancora: [35.85, 32.6]},
  {id: 'idumea', nome: 'Idumea', livelli: ['terra'], certezza: 'media', periodo: 'Epoca di Gesù', rif: ['Mc 3,8'],
    descrizione: 'Territorio degli idumei, discendenti di Edom, a sud della Giudea. Il Vangelo di Marco ne parla come di una zona da cui venivano folle a seguire Gesù (Mc 3,8).',
    poligono: [[34.85, 31.3], [35.2, 31.0], [35.4, 30.7], [35.3, 30.0], [35.0, 29.6], [34.8, 30.3], [34.8, 30.8]], ancora: [35.05, 30.45]},
  {id: 'fenicia', nome: 'Fenicia', livelli: ['terra', 'popoli'], certezza: 'media', periodo: 'Epoca di Gesù', rif: ['Mc 7,24', 'At 21,2'],
    descrizione: 'Fascia costiera a nord della Galilea, con le città di Tiro e Sidone. Gesù vi si ritira nel racconto della donna siro-fenicia (Mc 7,24–31).',
    poligono: [[35.05, 32.92], [35.18, 33.27], [35.37, 33.56], [35.6, 33.85], [35.9, 34.1], [35.95, 33.85], [35.7, 33.55], [35.65, 33.2], [35.35, 32.95]], ancora: [35.4, 33.4]},
  {id: 'iturea', nome: 'Iturea e Traconitide', livelli: ['terra'], certezza: 'discussa', periodo: 'Epoca di Gesù', rif: ['Lc 3,1'], nomeBiblico: true,
    descrizione: 'Regione a nord-est della Galilea, verso il monte Ermon. Il Vangelo di Luca la cita insieme alla Traconitide, nel passo che data l’inizio del ministero di Giovanni.',
    nota: 'I confini di Iturea e Traconitide non sono noti con precisione: qui sono riuniti in un’unica area indicativa.',
    poligono: [[35.9, 33.3], [36.5, 33.6], [36.6, 32.95], [36.1, 32.85], [35.95, 33.0]], ancora: [36.25, 33.2]},
  {id: 'gaulanitide', nome: 'Gaulanitide', livelli: ['terra'], certezza: 'discussa', periodo: 'Epoca romana', rif: [], nomeBiblico: false,
    descrizione: 'Regione a est del lago di Galilea, sull’altopiano del Golan. È il nome usato da Giuseppe Flavio, non dalla Bibbia.',
    nota: 'Il nome non compare nella Bibbia. Il suo confine con la Batanea e la Traconitide è discusso.',
    poligono: [[35.6, 33.25], [35.85, 33.3], [35.92, 33.0], [35.85, 32.72], [35.65, 32.72], [35.6, 32.95]], ancora: [35.75, 33.0]},

  /* Le 12 tribù (Gs 13–19); Levi non ha territorio */
  {id: 'ruben', nome: 'Ruben', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 13,15–23'],
    descrizione: 'Tribù a est del Giordano, fra l’Arnon a sud e il territorio di Gad a nord, con Chesbon e Aroer nei testi di Giosuè.',
    poligono: [[35.52, 31.85], [35.6, 31.85], [35.9, 31.8], [36.0, 31.6], [35.95, 31.45], [35.6, 31.45], [35.52, 31.6]], ancora: [35.75, 31.62]},
  {id: 'gad', nome: 'Gad', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 13,24–28'],
    descrizione: 'Tribù a est del Giordano, fra Ruben e lo Iabbok, fino alla punta sud del lago di Galilea.',
    poligono: [[35.5, 32.45], [35.6, 32.4], [35.9, 32.4], [36.1, 32.45], [36.2, 32.2], [36.0, 31.9], [35.9, 31.85], [35.6, 31.85], [35.52, 32.1]], ancora: [35.85, 32.5]},
  {id: 'manasse-est', nome: 'Manasse (est)', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 13,29–31'],
    descrizione: 'Metà della tribù di Manasse a est del Giordano, con Gàlaad e Basan. Il modo in cui fu insediata questa regione non è chiaro.',
    poligono: [[35.55, 32.5], [35.8, 32.55], [36.1, 32.5], [36.2, 32.45], [36.4, 32.8], [36.3, 33.1], [36.0, 33.25], [35.7, 33.2], [35.6, 33.0], [35.5, 32.7]], ancora: [36.0, 33.05]},
  {id: 'manasse-ovest', nome: 'Manasse (ovest)', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 17,1–13'],
    descrizione: 'Metà della tribù di Manasse a ovest del Giordano, fra la valle di Bet-Sean, il Carmelo e il confine con Efraim.',
    poligono: [[34.9, 32.72], [34.98, 32.72], [35.1, 32.7], [35.1, 32.55], [35.3, 32.5], [35.5, 32.5], [35.53, 32.35], [35.35, 32.3], [35.1, 32.3], [34.92, 32.4]], ancora: [35.1, 32.5]},
  {id: 'efraim', nome: 'Efraim', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 16,1–10'],
    descrizione: 'Tribù delle colline centrali, fra Manasse a nord e Beniamino a sud, con Sichem e Silo.',
    poligono: [[34.95, 32.4], [35.1, 32.3], [35.35, 32.3], [35.53, 32.35], [35.55, 32.1], [35.42, 31.95], [35.2, 31.95], [35.0, 32.0], [34.9, 32.2]], ancora: [35.25, 32.15]},
  {id: 'beniamino', nome: 'Beniamino', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 18,11–28'],
    descrizione: 'Tribù fra Efraim e Giuda, sul confine dove passa Gerusalemme. Alcune sue città furono poi assegnate a Giuda.',
    poligono: [[35.0, 31.95], [35.2, 31.95], [35.42, 31.95], [35.5, 31.9], [35.45, 31.8], [35.3, 31.75], [35.1, 31.75], [34.95, 31.8]], ancora: [35.22, 31.86]},
  {id: 'giuda', nome: 'Giuda', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 15,1–63'],
    descrizione: 'La tribù più grande, a sud di Beniamino fino al Negheb, con il Mar Morto a est. Il suo confine settentrionale passava presso Kiriat-Iearim.',
    poligono: [[34.7, 31.85], [34.95, 31.8], [35.1, 31.75], [35.3, 31.75], [35.45, 31.8], [35.5, 31.6], [35.45, 31.3], [35.3, 31.1], [35.15, 30.95], [35.0, 31.0], [34.85, 31.2], [34.7, 31.4]], ancora: [35.1, 31.55]},
  {id: 'simeone', nome: 'Simeone', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 19,1–9'],
    descrizione: 'Tribù senza territorio proprio: le sue città stavano dentro quello di Giuda, nel Negheb nord-occidentale. Non tutte sono identificate.',
    poligono: [[34.7, 31.35], [34.85, 31.3], [35.0, 31.25], [35.0, 31.0], [34.85, 30.9], [34.7, 31.05]], ancora: [34.8, 31.2]},
  {id: 'dan', nome: 'Dan', livelli: ['tribu'], certezza: 'discussa', periodo: 'Conquista e insediamento', rif: ['Gs 19,40–46'],
    descrizione: 'Territorio originario sulla Sefela, presso Zorea ed Eshtaol. Secondo la Bibbia gran parte fu perduta ai Filistei: la sua estensione è discussa.',
    nota: 'Il territorio di Dan è il meno sicuro fra quelli tribali: il testo di Giosuè non ne dà i confini con chiarezza.',
    poligono: [[34.75, 32.05], [34.95, 32.1], [35.0, 32.0], [35.05, 31.95], [35.0, 31.85], [34.85, 31.8], [34.7, 31.85]], ancora: [34.85, 31.98]},
  {id: 'dan-nord', nome: 'Dan (nord)', livelli: ['tribu'], certezza: 'media', periodo: 'Epoca dei Giudici', rif: ['Gdc 18,27–29'],
    descrizione: 'Dopo la conquista del nord, i Dan si stabilirono a Lais, presso le sorgenti del Giordano, e la città prese il nome di Dan.',
    poligono: [[35.62, 33.32], [35.72, 33.3], [35.72, 33.18], [35.62, 33.18]], ancora: [35.66, 33.25]},
  {id: 'aser', nome: 'Aser', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 19,24–31'],
    descrizione: 'Tribù del nord-ovest, lungo la costa da Tiro verso il Carmelo. Il confine settentrionale non è chiaro.',
    poligono: [[35.02, 32.9], [35.12, 33.0], [35.19, 33.27], [35.28, 33.25], [35.27, 33.0], [35.2, 32.85], [35.05, 32.82]], ancora: [35.1, 33.05]},
  {id: 'neftali', nome: 'Neftali', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 19,32–39'],
    descrizione: 'Tribù dell’alta Galilea, fra Aser e il Giordano. Il confine settentrionale non è indicato nel testo.',
    poligono: [[35.28, 33.25], [35.6, 33.27], [35.66, 33.1], [35.62, 32.9], [35.4, 32.85], [35.27, 32.9], [35.27, 33.0]], ancora: [35.42, 33.05]},
  {id: 'zabulon', nome: 'Zabulon', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 19,10–16'],
    descrizione: 'Tribù della bassa Galilea, fra Aser e Issacar, senza grandi città cananee.',
    poligono: [[35.02, 32.82], [35.2, 32.85], [35.27, 32.9], [35.4, 32.85], [35.3, 32.72], [35.1, 32.7], [34.98, 32.72]], ancora: [35.2, 32.78]},
  {id: 'issacar', nome: 'Issacar', livelli: ['tribu'], certezza: 'media', periodo: 'Conquista e insediamento', rif: ['Gs 19,17–23'],
    descrizione: 'Tribù della pianura di Esdrelon e delle valli fino al Giordano. Il suo confine è indicato solo a nord.',
    poligono: [[35.1, 32.7], [35.3, 32.72], [35.45, 32.72], [35.55, 32.65], [35.5, 32.5], [35.3, 32.5], [35.1, 32.55]], ancora: [35.3, 32.62]},

  /* Regni divisi (dopo Salomone, 1Re 12) */
  {id: 'regno-israele', nome: 'Regno di Israele', livelli: ['regni'], certezza: 'media', periodo: 'Dopo Salomone (931 circa a.C.)', rif: ['1Re 12,16–20'],
    descrizione: 'Il regno del nord, con capitale a Samaria. Comprende Galilea, Samaria, Efraim e le terre a est del Giordano, fino a Gàlaad.',
    poligono: [[34.8, 31.95], [35.5, 31.95], [35.6, 32.1], [35.8, 32.1], [36.1, 32.2], [36.3, 32.8], [36.3, 33.2], [35.9, 33.3], [35.6, 33.35], [35.2, 33.27], [35.1, 33.0], [34.9, 32.6]], ancora: [35.95, 32.5]},
  {id: 'regno-giuda', nome: 'Regno di Giuda', livelli: ['regni'], certezza: 'media', periodo: 'Dopo Salomone (931 circa a.C.)', rif: ['1Re 12,17–20'],
    descrizione: 'Il regno del sud, con capitale a Gerusalemme e la dinastia di Davide. Restò legato alla tribù di Giuda, con Beniamino e parte di Simeone.',
    poligono: [[34.7, 31.95], [35.5, 31.95], [35.5, 31.55], [35.45, 31.2], [35.2, 31.0], [35.0, 30.9], [34.6, 31.1], [34.5, 31.5], [34.6, 31.8]], ancora: [35.0, 31.45]},

  /* Popoli vicini (solo sedi ben localizzate) */
  {id: 'filistia', nome: 'Filistia', livelli: ['popoli'], certezza: 'alta', periodo: 'Antico Testamento', rif: ['Gs 13,3', 'Gdc 16,1'],
    descrizione: 'Pentapoli filistea sulla costa, con Gaza, Asdod, Ascalon, Ekron e Gat (Gs 13,3). Fu la principale rivale d’Israele nel periodo dei Giudici.',
    poligono: [[34.65, 31.85], [34.8, 31.95], [34.85, 31.7], [34.75, 31.4], [34.55, 31.3], [34.3, 31.2], [34.3, 31.35], [34.45, 31.5], [34.55, 31.65]], ancora: [34.6, 31.6]},
  {id: 'moab', nome: 'Moab', livelli: ['popoli'], certezza: 'alta', periodo: 'Antico Testamento', rif: ['Nm 21,13', 'Rut 1,1'],
    descrizione: 'Regione a est del Mar Morto, a sud dell’Arnon, con cui Israele aveva confine (Nm 21,13).',
    poligono: [[35.5, 31.45], [35.95, 31.45], [36.0, 31.1], [35.8, 30.9], [35.6, 31.1], [35.5, 31.3]], ancora: [35.75, 31.25]},
  {id: 'ammon', nome: 'Ammon', livelli: ['popoli'], certezza: 'alta', periodo: 'Antico Testamento', rif: ['Gdc 11,13', '2Sam 12,26'],
    descrizione: 'Regione a est del Giordano, con la capitale Rabba (oggi Amman), fra lo Iabbok e il deserto (Gdc 11,13).',
    poligono: [[35.7, 32.1], [36.2, 32.2], [36.3, 31.6], [35.95, 31.4], [35.7, 31.5], [35.7, 31.8]], ancora: [36.12, 31.5]},
  {id: 'edom', nome: 'Edom', livelli: ['popoli'], certezza: 'alta', periodo: 'Antico Testamento', rif: ['Nm 20,14–21', 'Gen 36,1'],
    descrizione: 'Regione montuosa di Seir, a sud del Mar Morto, fino al golfo di Aqaba. Il re di Edom rifiutò il passaggio a Israele (Nm 20,14–21).',
    poligono: [[35.0, 30.8], [35.6, 31.1], [35.6, 30.4], [35.3, 29.6], [35.0, 29.5], [34.9, 30.2]], ancora: [35.35, 30.5]},
  {id: 'aram', nome: 'Aram (Damasco)', livelli: ['popoli'], certezza: 'media', periodo: 'Antico Testamento', rif: ['Gen 14,15', '2Re 5,1'],
    descrizione: 'Regione di Damasco, a nord-est della Galilea. Gli Aramei sono nominati nei libri dei Re, in particolare nelle guerre con Israele.',
    nota: 'I confini esatti del regno di Aram variavano nel tempo: il tracciato è indicativo.',
    poligono: [[35.9, 33.9], [36.4, 33.8], [37.0, 33.9], [37.2, 33.2], [36.6, 32.8], [36.2, 32.9], [35.9, 33.2]], ancora: [36.6, 33.4]},
  {id: 'egitto', nome: 'Egitto ↙', livelli: ['popoli'], certezza: 'alta', periodo: 'Antico Testamento', rif: ['Gen 12,10'], poligono: null, ancora: [32.6, 30.0],
    descrizione: 'Egitto, a sud-ovest della Terra d’Israele, oltre il Sinai. È indicato solo con un’etichetta: la sua area è fuori dalla mappa.'},
];

/* ---------- geometria delle aree: punto d'etichetta interno e inquadratura ---------- */
export function pointInPoly(pt, poly) {
  let inside = false; const [x, y] = pt;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/* distanza minima dal punto ai lati del poligono (lon scalata per la latitudine) */
function distEdges(pt, poly) {
  const k = Math.cos(31.5 * Math.PI / 180); let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0] * k, ay = poly[j][1], bx = poly[i][0] * k, by = poly[i][1], px = pt[0] * k, py = pt[1];
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
}
/* punto più lontano dai bordi, dentro il poligono e fuori dal mare */
export function labelPoint(poly, sea = []) {
  const lons = poly.map(p => p[0]), lats = poly.map(p => p[1]);
  const x0 = Math.min(...lons), x1 = Math.max(...lons), y0 = Math.min(...lats), y1 = Math.max(...lats);
  let best = null, bd = -1;
  for (let x = x0; x <= x1; x += 0.02) for (let y = y0; y <= y1; y += 0.02) {
    const pt = [x, y];
    if (!pointInPoly(pt, poly) || sea.some(sp => pointInPoly(pt, sp))) continue;
    const d = distEdges(pt, poly);
    if (d > bd) { bd = d; best = pt; }
  }
  return best ? best.map(v => Math.round(v * 1000) / 1000) : [(x0 + x1) / 2, (y0 + y1) / 2];
}
const ANCORA_MANUALE = {perea: [35.88, 32.1], 'regno-israele': [36.02, 32.4]};
for (const a of AREE) if (a.poligono) a.ancora = ANCORA_MANUALE[a.id] ?? labelPoint(a.poligono, [MEDITERRANEO]);
/* riquadro di un livello: racchiude tutte le sue aree */
export function levelBounds(lv) {
  const pts = AREE.filter(a => a.livelli.includes(lv) && a.poligono).flatMap(a => a.poligono);
  const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]);
  return {x0: Math.min(...lons), x1: Math.max(...lons), y0: Math.min(...lats), y1: Math.max(...lats)};
}
/* punti candidati per l'etichetta di un'area: interni, fuori dal mare, distanziati; il primo è il centro migliore */
export function labelCandidates(poly, sea = [], n = 160) {
  const lons = poly.map(p => p[0]), lats = poly.map(p => p[1]);
  const x0 = Math.min(...lons), x1 = Math.max(...lons), y0 = Math.min(...lats), y1 = Math.max(...lats);
  const cand = [];
  for (let x = x0; x <= x1; x += 0.02) for (let y = y0; y <= y1; y += 0.02) {
    const pt = [x, y];
    if (!pointInPoly(pt, poly) || sea.some(sp => pointInPoly(pt, sp))) continue;
    cand.push({pt, d: distEdges(pt, poly)});
  }
  cand.sort((a, b) => b.d - a.d);
  const out = [];
  for (const c of cand) {
    if (out.length >= n) break;
    if (out.every(o => Math.hypot(o[0] - c.pt[0], o[1] - c.pt[1]) >= 0.03)) out.push(c.pt.map(v => Math.round(v * 1000) / 1000));
  }
  return out.length ? out : [labelPoint(poly, sea)];
}

/* Allineamento ai corsi d'acqua reali: un vertice di un'area a meno di circa 4 km da una riva del Giordano, del Mar Morto o del
   mar di Galilea si posa sulla riva più vicina. Così i confini delle tribù a est e a ovest del Giordano seguono il fiume. */
const RIVE = [...[FIUMI.giordano, FIUMI.yarmuk, FIUMI.giabbok].map(l => ({pts: l, closed: false})), {pts: LAGHI.morto, closed: true}, {pts: LAGHI.galilea, closed: true}];
const COS = Math.cos(32 * Math.PI / 180);
function snapPunto([x, y]) {
  let best = null, bd = 0.04;
  for (const {pts, closed} of RIVE) {
    const n = pts.length - (closed ? 0 : 1);
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      const dx = (bx - ax) * COS, dy = by - ay, L = dx * dx + dy * dy || 1e-12;
      const t = Math.max(0, Math.min(1, (((x - ax) * COS) * dx + (y - ay) * dy) / L));
      const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      const d = Math.hypot((x - px) * COS, y - py);
      if (d < bd) { bd = d; best = [px, py]; }
    }
  }
  return best || [x, y];
}
for (const a of AREE) if (a.poligono) a.poligono = a.poligono.map(snapPunto);

/* Costa per l’anteprima in Oggi: Natural Earth 1:10m (dominio pubblico, npm world-atlas), ritaglio lon 33–38, lat 30,5–34,5,
   tolleranza 0,0002°. Il dato 10m ha pochi vertici in questa zona: il file è piccolo perché è quasi senza semplificazione. */
export const COSTA_ANTEPRIMA = [
  [[[38,34.5],[38,30.5],[33,30.5],[33,31.06],[33.01,31.06],[33.02,31.07],[33.02,31.07],[33.01,31.08],[33.01,31.08],[33.01,31.09],[33.05,31.1],[33.06,31.1],[33.05,31.11],[33.05,31.12],[33.06,31.12],[33.06,31.13],[33.06,31.13],[33.05,31.13],[33.03,31.11],[33.03,31.11],[33.02,31.11],[33.02,31.1],[33.03,31.1],[33.02,31.1],[33,31.1],[33,31.12],[33,31.12],[33.01,31.14],[33.03,31.16],[33.04,31.17],[33.07,31.17],[33.08,31.18],[33.1,31.19],[33.11,31.2],[33.13,31.2],[33.13,31.19],[33.1,31.19],[33.1,31.18],[33.11,31.18],[33.15,31.13],[33.16,31.12],[33.15,31.11],[33.14,31.11],[33.13,31.1],[33.13,31.11],[33.12,31.11],[33.12,31.1],[33.14,31.09],[33.14,31.08],[33.14,31.06],[33.13,31.05],[33.17,31.06],[33.19,31.06],[33.2,31.06],[33.22,31.06],[33.22,31.07],[33.21,31.07],[33.2,31.07],[33.2,31.07],[33.19,31.07],[33.19,31.07],[33.25,31.09],[33.26,31.1],[33.27,31.1],[33.26,31.09],[33.27,31.09],[33.28,31.09],[33.28,31.09],[33.29,31.09],[33.29,31.08],[33.31,31.08],[33.31,31.1],[33.3,31.1],[33.32,31.1],[33.31,31.11],[33.3,31.1],[33.29,31.1],[33.28,31.11],[33.38,31.11],[33.38,31.13],[33.39,31.14],[33.41,31.14],[33.41,31.15],[33.42,31.15],[33.42,31.15],[33.43,31.15],[33.44,31.15],[33.48,31.13],[33.5,31.13],[33.57,31.12],[33.59,31.11],[33.59,31.12],[33.62,31.12],[33.65,31.12],[33.85,31.16],[34.05,31.23],[34.2,31.31],[34.22,31.33],[34.24,31.34],[34.28,31.38],[34.3,31.41],[34.35,31.44],[34.37,31.47],[34.44,31.53],[34.48,31.58],[34.48,31.58],[34.49,31.6],[34.52,31.63],[34.6,31.76],[34.61,31.77],[34.67,31.87],[34.69,31.93],[34.71,31.95],[34.74,32.04],[34.75,32.04],[34.74,32.05],[34.74,32.06],[34.76,32.07],[34.84,32.28],[34.87,32.43],[34.9,32.56],[34.91,32.57],[34.91,32.62],[34.92,32.63],[34.92,32.64],[34.94,32.73],[34.95,32.81],[34.95,32.83],[34.97,32.84],[34.98,32.84],[35,32.83],[35.02,32.82],[35.03,32.83],[35.06,32.86],[35.08,32.89],[35.08,32.91],[35.08,32.92],[35.07,32.92],[35.07,32.94],[35.08,33],[35.09,33.03],[35.09,33.05],[35.09,33.07],[35.11,33.08],[35.1,33.09],[35.11,33.09],[35.11,33.09],[35.1,33.09],[35.1,33.1],[35.1,33.1],[35.11,33.11],[35.12,33.12],[35.12,33.13],[35.15,33.14],[35.16,33.15],[35.16,33.16],[35.17,33.17],[35.16,33.18],[35.17,33.18],[35.17,33.18],[35.17,33.17],[35.21,33.23],[35.21,33.26],[35.19,33.28],[35.21,33.29],[35.22,33.31],[35.24,33.36],[35.25,33.37],[35.25,33.4],[35.25,33.41],[35.27,33.43],[35.27,33.44],[35.27,33.46],[35.32,33.49],[35.35,33.51],[35.36,33.54],[35.36,33.56],[35.4,33.64],[35.39,33.65],[35.41,33.66],[35.42,33.7],[35.44,33.71],[35.44,33.72],[35.48,33.8],[35.48,33.82],[35.48,33.86],[35.48,33.87],[35.48,33.88],[35.47,33.89],[35.47,33.9],[35.48,33.91],[35.49,33.91],[35.5,33.91],[35.51,33.91],[35.52,33.9],[35.52,33.9],[35.53,33.91],[35.55,33.91],[35.56,33.91],[35.57,33.91],[35.58,33.92],[35.59,33.94],[35.59,33.94],[35.59,33.95],[35.58,33.95],[35.6,33.96],[35.61,33.98],[35.61,33.99],[35.62,33.99],[35.63,33.99],[35.64,34],[35.64,34.01],[35.63,34.01],[35.63,34.02],[35.63,34.02],[35.63,34.04],[35.64,34.09],[35.65,34.12],[35.65,34.13],[35.63,34.15],[35.63,34.17],[35.63,34.2],[35.63,34.21],[35.65,34.22],[35.65,34.22],[35.65,34.25],[35.65,34.29],[35.66,34.31],[35.69,34.33],[35.71,34.32],[35.72,34.34],[35.74,34.37],[35.75,34.39],[35.81,34.42],[35.82,34.43],[35.8,34.46],[35.8,34.46],[35.83,34.46],[35.9,34.48],[35.93,34.5]]],
  [[[33.38,31.19],[33.41,31.19],[33.43,31.17],[33.47,31.14],[33.45,31.15],[33.3,31.21],[33.27,31.22],[33.3,31.22],[33.35,31.2]]],
  [[[33.08,31.23],[33.1,31.24],[33.26,31.22],[33.26,31.22],[33.24,31.22],[33.21,31.22],[33.18,31.23],[33.15,31.23],[33.12,31.22],[33.1,31.23],[33.08,31.22],[33,31.18],[33,31.19],[33.01,31.2],[33.07,31.22]]]
];
