/* Fabrique les fichiers d'essai du module Intégration, à partir de modèles connus (consommation = constante + coefficients × facteurs + bruit),
   puis écrit test.js = test-corps.js + ces fichiers sous forme de chaînes (le banc n'a pas accès au disque).
   Usage : node generer.js     (aucune dépendance ; tirages pseudo-aléatoires à graine fixe, donc fichiers identiques à chaque fois) */
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const ICI = __dirname, ESSAIS = path.join(ICI, "essais");
fs.mkdirSync(ESSAIS, { recursive: true });

function hasard(graine) {                       // mulberry32 + Box-Muller
  let a = graine >>> 0;
  const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { u, n: (m = 0, s = 1) => m + s * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()) };
}
const JOUR = 864e5, p2 = n => String(n).padStart(2, "0");
const jma = t => { const d = new Date(t); return p2(d.getUTCDate()) + "/" + p2(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear(); };
const iso = t => new Date(t).toISOString().slice(0, 10);
const fr = (v, d = 1) => { const [e, f] = Math.abs(v).toFixed(d).split("."); return (v < 0 ? "-" : "") + e.replace(/\B(?=(\d{3})+$)/g, " ") + (f ? "," + f : ""); };

/* Les modèles vrais : le test vérifie que la page les retrouve. Coefficients en kWh par unité de facteur, bruit = écart-type en kWh. */
const VERITE = {
  large: { "Élec général": { c: 41000, Production: 150, "DJU chauffage": 40, bruit: 1800 }, "Gaz PCE": { c: 6000, "DJU chauffage": 900, bruit: 2500 }, "Atelier presses": { c: 6000, Production: 95, bruit: 900 }, "Froid process": { c: 9000, Production: 25, bruit: 700 } },
  long: { "TGBT general": { c: 2000, Production: 55, bruit: 150 }, Chaudiere: { c: 5200, "Temperature exterieure": -260, bruit: 300 }, "Air comprime, compresseurs": { c: 300, Production: 9, bruit: 40 } },
  mois: { Electricite: { c: 60000, Nuitees: 9, bruit: 4000 }, "Gaz naturel": { c: 15000, DJU: 420, bruit: 6000 } }
};

/* 1. CSV large « sale » : point-virgule, décimales à la française avec espace des milliers, dates JJ/MM/AAAA, lignes parasites, unités dans les intitulés,
      valeurs manquantes, une date en double, deux semaines absentes, une valeur aberrante, une colonne d'index, une constante, un commentaire, une ligne de total. Codé en Windows-1252. */
function large() {
  const h = hasard(601), V = VERITE.large, lignes = [], t0 = Date.UTC(2023, 0, 2);
  let index = 1250000;
  for (let w = 0; w < 104; w++) {
    const arret = [31, 32, 51, 83, 84, 103].includes(w), prod = arret ? 25 + 10 * h.u() : 220 + 45 * Math.sin(w / 7) + h.n(0, 25);
    const dju = Math.max(0, 55 + 60 * Math.cos(2 * Math.PI * (w - 3) / 52) + h.n(0, 8)), hum = 60 + h.n(0, 10);
    const elec = V["Élec général"].c + 150 * prod + 40 * dju + h.n(0, 1800), gaz = V["Gaz PCE"].c + 900 * dju + h.n(0, 2500);
    const presses = V["Atelier presses"].c + 95 * prod + h.n(0, 900), froid = V["Froid process"].c + 25 * prod + h.n(0, 700);
    index += elec;
    lignes.push({ w, t: t0 + w * 7 * JOUR, c: [fr(elec), fr(gaz / 1000, 3), fr(presses), fr(froid), fr(prod, 2), fr(dju, 1), fr(hum, 0), fr(index, 0), "FR-0142", arret ? "arrêt technique" : ""] });
  }
  lignes[40].c[0] = fr(41000 * 10 + 7);                                   // valeur aberrante (erreur de saisie d'un facteur dix)
  lignes[12].c[1] = ""; lignes[13].c[1] = "-"; lignes[57].c[3] = "n.d."; lignes[70].c[5] = "";   // manquants, dont un DJU
  const double = { ...lignes[20], c: lignes[20].c.slice() }; double.c[2] = fr(27500.5);     // même date, une valeur corrigée
  const garde = lignes.filter(l => l.w !== 60 && l.w !== 61);             // deux semaines absentes
  garde.splice(21, 0, double);
  const texte = ["Export GTB - Usine de démonstration", "Période : 02/01/2023 au 23/12/2024 ; extraction du 06/01/2025", "",
    "Semaine du;Élec général (kWh);Gaz PCE [MWh];Atelier presses kWh;Froid process (kWh);Production (t);DJU chauffage;Humidité (%);Index compteur élec (kWh);Code site;Commentaire",
    ...garde.map(l => [jma(l.t), ...l.c].join(";")), "Total;;;;;;;;;;"].join("\r\n") + "\r\n";
  fs.writeFileSync(path.join(ESSAIS, "essai-large-sale.csv"), Buffer.from(texte, "latin1"));
  return texte;
}

/* 2. CSV long : une ligne par relevé, virgule, décimales à l'anglaise, dates AAAA-MM-JJ, un champ entre guillemets, des relevés absents et des doublons. */
function long() {
  const h = hasard(602), V = VERITE.long, out = ["date,point_de_mesure,energie,unite,valeur"], t0 = Date.UTC(2024, 0, 1);
  for (let d = 0; d < 140; d++) {
    const t = t0 + d * JOUR, we = [0, 6].includes(new Date(t).getUTCDay()), prod = we ? 0 : 40 + h.n(0, 5), temp = 11 - 9 * Math.cos(2 * Math.PI * d / 365) + h.n(0, 2.5);
    const L = (nom, e, u, v, dec) => out.push([iso(t), nom.includes(",") ? '"' + nom + '"' : nom, e, u, v.toFixed(dec)].join(","));
    L("TGBT general", "Electricite", "kWh", V["TGBT general"].c + 55 * prod + h.n(0, 150), 1);
    if (d !== 33 && d !== 34) L("Chaudiere", "Gaz", "kWh", V.Chaudiere.c - 260 * temp + h.n(0, 300), 1);
    L("Air comprime, compresseurs", "Electricite", "kWh", V["Air comprime, compresseurs"].c + 9 * prod + h.n(0, 40), 2);
    L("Production", "", "t", prod, 2);
    L("Temperature exterieure", "", "°C", temp, 1);
    if (d === 50) out.push(out[out.length - 5]);                           // relevé en double
  }
  const texte = out.join("\n") + "\n";
  fs.writeFileSync(path.join(ESSAIS, "essai-long.csv"), texte, "utf8");
  return texte;
}

/* 3. Tableau de suivi mensuel : tabulations, mois en lettres, énergies en MWh. */
function mois() {
  const h = hasard(603), V = VERITE.mois, noms = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], out = ["Mois\tElectricite (MWh)\tGaz naturel (MWh)\tDJU\tNuitees"];
  for (let m = 0; m < 36; m++) {
    const dju = Math.max(0, 190 + 200 * Math.cos(2 * Math.PI * (m % 12) / 12) + h.n(0, 25)), nuitees = 5200 + 1800 * Math.sin(2 * Math.PI * ((m % 12) - 3) / 12) + h.n(0, 400);
    out.push([noms[m % 12] + " " + (2022 + Math.floor(m / 12)), fr((V.Electricite.c + 9 * nuitees + h.n(0, 4000)) / 1000, 2), fr((V["Gaz naturel"].c + 420 * dju + h.n(0, 6000)) / 1000, 2), fr(dju, 0), fr(nuitees, 0)].join("\t"));
  }
  const texte = out.join("\n") + "\n";
  fs.writeFileSync(path.join(ESSAIS, "essai-mensuel.tsv"), texte, "utf8");
  return texte;
}

/* 4. Fichier volontairement inutilisable : un relevé sans aucune date. */
function inutilisable() {
  const texte = "Compteur;Relevé;Remarque\nTGBT;125 430;relevé à la main\nChaufferie;88 102;\nAtelier;15 220;compteur changé\nBureaux;4 310;\n";
  fs.writeFileSync(path.join(ESSAIS, "essai-inutilisable.csv"), texte, "utf8");
  return texte;
}

/* 5. Classeur Excel quelconque : une feuille de notes, une feuille de relevés hebdomadaires avec des dates au format de date. Archive ZIP écrite ici (deflate). */
function crc32(buf) { let c, crc = ~0; for (let i = 0; i < buf.length; i++) { c = (crc ^ buf[i]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function zip(fichiers) {
  const locaux = [], centraux = []; let pos = 0;
  for (const [nom, texte] of fichiers) {
    const brut = Buffer.from(texte, "utf8"), comp = zlib.deflateRawSync(brut), n = Buffer.from(nom, "utf8"), e = Buffer.alloc(30), c = Buffer.alloc(46), crc = crc32(brut);
    e.writeUInt32LE(0x04034b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(8, 8); e.writeUInt32LE(crc, 14); e.writeUInt32LE(comp.length, 18); e.writeUInt32LE(brut.length, 22); e.writeUInt16LE(n.length, 26);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(brut.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(pos, 42);
    locaux.push(e, n, comp); centraux.push(c, n); pos += 30 + n.length + comp.length;
  }
  const dir = Buffer.concat(centraux), fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(fichiers.length, 8); fin.writeUInt16LE(fichiers.length, 10); fin.writeUInt32LE(dir.length, 12); fin.writeUInt32LE(pos, 16);
  return Buffer.concat([...locaux, dir, fin]);
}
function classeur() {
  const h = hasard(604), x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"), col = j => String.fromCharCode(65 + j);
  const chaines = [], ch = s => { let i = chaines.indexOf(s); if (i < 0) i = chaines.push(s) - 1; return i; };
  const entetes = ["Date relevé", "Compteur général élec (kWh)", "Chaufferie gaz (kWh)", "Tonnes produites", "DJU"], lignes = [];
  lignes.push('<row r="1">' + entetes.map((e, j) => '<c r="' + col(j) + '1" t="s"><v>' + ch(e) + "</v></c>").join("") + "</row>");
  for (let w = 0; w < 60; w++) {
    const serie = 45292 + 7 * w, prod = 300 + h.n(0, 40), dju = Math.max(0, 50 + 55 * Math.cos(2 * Math.PI * w / 52) + h.n(0, 6));     // 45292 = 01/01/2024
    const v = [30000 + 80 * prod + h.n(0, 1200), 4000 + 700 * dju + h.n(0, 1500), prod, dju], r = w + 2;
    lignes.push('<row r="' + r + '"><c r="A' + r + '" s="1"><v>' + serie + "</v></c>" + v.map((y, j) => '<c r="' + col(j + 1) + r + '"' + (j === 0 ? ' s="2"' : "") + "><v>" + y.toFixed(3) + "</v></c>").join("") + "</row>");
  }
  const notes = ["Suivi énergie - site de démonstration", "Les relevés sont dans la feuille « Relevés ».", "Source : export GTB, une ligne par semaine."].map((t, i) => '<row r="' + (i + 1) + '"><c r="A' + (i + 1) + '" t="inlineStr"><is><t>' + x(t) + "</t></is></c></row>");
  const feuille = corps => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + corps.join("") + "</sheetData></worksheet>";
  const buf = zip([
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Lisez-moi" sheetId="1" r:id="rId1"/><sheet name="Relevés" sheetId="2" r:id="rId2"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>'],
    ["xl/styles.xml", '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.0&quot; kWh&quot;"/></numFmts><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>'],
    ["xl/sharedStrings.xml", '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + chaines.map(s => "<si><t>" + x(s) + "</t></si>").join("") + "</sst>"],
    ["xl/worksheets/sheet1.xml", feuille(notes)],
    ["xl/worksheets/sheet2.xml", feuille(lignes)]
  ]);
  fs.writeFileSync(path.join(ESSAIS, "essai-classeur.xlsx"), buf);
  return buf.toString("base64");
}

const essais = { large: large(), long: long(), mois: mois(), inutilisable: inutilisable(), classeur64: classeur() };
const corps = fs.readFileSync(path.join(ICI, "test-corps.js"), "utf8");
fs.writeFileSync(path.join(ICI, "test.js"), "/* FICHIER FABRIQUÉ par generer.js : test-corps.js, suivi des fichiers d'essai en chaînes. Modifiez test-corps.js, puis relancez node generer.js. */\n"
  + corps + "\n/* ---- Fichiers d'essai (les mêmes que dans essais/) et modèles vrais ---- */\nconst ITG_VERITE = " + JSON.stringify(VERITE) + ";\nconst ITG_ESSAIS = " + JSON.stringify(essais) + ";\n");
console.log("écrits :", fs.readdirSync(ESSAIS).join(", "), "; test.js :", fs.statSync(path.join(ICI, "test.js")).size, "octets");
