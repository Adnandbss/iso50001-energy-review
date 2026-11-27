/* ============================================================================
   Module « Continuité » (préfixe cnt) : ne plus perdre le travail, et le jargon expliqué sur place.
   1. Le travail (réglages des filtres, scénarios du simulateur, brouillon de la revue, passes du banc)
      est gardé dans ce navigateur, rattaché à l'empreinte du classeur chargé : il revient quand le même
      classeur est rechargé, jamais sur un autre. Rien n'est écrit dans une copie figée ; aucune clé d'API.
   2. Un fichier projet (.json) emporte les grilles du classeur et ce travail ; il se rouvre ici.
   3. Un lexique unique (français, anglais) : la première occurrence de chaque terme dans les titres,
      sous-titres et libellés de tuiles est soulignée et montre sa définition (survol, clavier, toucher).
   ============================================================================ */
const CNT = { format: 1,                         // version du format gardé dans le navigateur et du fichier projet
  prefixe: "revue-energetique.cnt.", jeux: 6,    // classeurs dont le travail est gardé (les plus récents)
  max: 300000,                                   // taille maximale du travail d'un classeur, en caractères
  maxProjet: 50 * 1024 * 1024,                   // taille maximale d'un fichier projet relu
  delai: 400,                                    // attente après la dernière modification avant d'écrire
  typeProjet: "revue-energetique.projet" };
const cnt = { empreinte: null, quand: {}, dernier: {}, retrouve: [], defauts: null, aImporter: null, bandeauFerme: false,
  minuterie: null, menuOuvert: false, message: null, erreurStockage: null, trop: false, lexique: true, langue: null };
const cntT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };

/* ---- 1. Empreinte du jeu de données : même contenu, même empreinte (indépendante du nom du fichier) ---- */
function cntHache(t) {                           // cyrb53 : 53 bits, assez pour distinguer des classeurs, pas un secret
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
const cntEmpreinte = (grilles, d1904) => cntHache((d1904 ? "1904|" : "1900|") + JSON.stringify(grilles));   // les trous des grilles deviennent null, comme dans une copie figée

/* ---- 2. Stockage du navigateur : chaque accès dans un try ; rien en copie figée ---- */
const cntCle = e => CNT.prefixe + "jeu." + e, CNT_INDEX = CNT.prefixe + "index";
function cntLire(cle) { try { const t = localStorage.getItem(cle); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function cntEcrire(cle, v) {
  if (etat.figee) return false;
  try { if (v == null) localStorage.removeItem(cle); else localStorage.setItem(cle, typeof v === "string" ? v : JSON.stringify(v)); return true; }
  catch (e) { cnt.erreurStockage = e && e.name === "QuotaExceededError" ? "plein" : "refus"; return false; }
}
const cntIndex = () => { const x = cntLire(CNT_INDEX); return Array.isArray(x) ? x.filter(y => y && typeof y.e === "string") : []; };
function cntEntree(e) {                          // travail gardé d'un classeur, si son format est lisible
  const d = cntLire(cntCle(e));
  return d && d.format === CNT.format && d.empreinte === e && d.parties && typeof d.parties === "object" ? d : null;
}

/* ---- 3. Les parties du travail. Chaque module expose xAGarder(precedent) → données ou null, xReprendre(d) → vrai si repris, xOublier() ---- */
const CNT_FILTRES = ["de", "a", "gran", "comparer", "unite", "seuil", "nomSite", "nomUES", "factConso", "facteur", "energie", "derSerie", "derSens", "derEtat"];
const CNT_PREV = ["serie", "horizon", "derive", "cumul"];
function cntFiltres() {
  const f = {}; for (const k of CNT_FILTRES) if (etat[k] !== undefined) f[k] = etat[k];
  f.tables = [...etat.tables].sort();
  if (typeof prevEtat === "object") { f.prev = {}; for (const k of CNT_PREV) f.prev[k] = prevEtat[k]; }
  return f;
}
function cntFiltresAGarder() { const f = cntFiltres(); return JSON.stringify(f) === JSON.stringify(cnt.defauts) ? null : f; }
function cntFiltresReprendre(f) {
  const m = etat.modele, noms = new Set(m.series.map(x => x.nom)), facteurs = new Set(m.facteurs.map(x => x.nom)), v = {};
  const date = x => typeof x === "number" && x >= m.debut && x <= m.fin, nom = x => x === null || noms.has(x);
  const regles = { de: date, a: date, gran: x => ["day", "week", "month", "year"].includes(x) && RANG[x] >= RANG[m.pasFin], comparer: x => x === "ref" || x === "an1", unite: x => x === "pct" || x === "wh",
    seuil: x => x === 1 || x === 2, nomSite: nom, nomUES: nom, factConso: nom, facteur: x => x === null || facteurs.has(x), energie: x => x === "*" || m.energies.includes(x),
    derSerie: x => x === "*" || noms.has(x), derSens: x => ["*", "+", "-"].includes(x), derEtat: x => ["*", "o", "c"].includes(x) };
  for (const k of CNT_FILTRES) if (k in f) { if (!regles[k](f[k])) return false; v[k] = f[k]; }
  if (v.de != null && v.a != null && v.de > v.a) return false;
  if (f.tables && !(Array.isArray(f.tables) && f.tables.every(x => typeof x === "string" && x.length < 80))) return false;
  const p = f.prev;
  if (p && !(typeof p === "object" && (p.serie == null || noms.has(p.serie)) && [3, 6, 12].includes(p.horizon) && typeof p.derive === "boolean" && typeof p.cumul === "string" && p.cumul.length < 20)) return false;
  Object.assign(etat, v);
  if (f.tables) etat.tables = new Set(f.tables);
  if (p && typeof prevEtat === "object") { Object.assign(prevEtat, { serie: p.serie == null ? null : p.serie, horizon: p.horizon, derive: p.derive, cumul: p.cumul }); }
  return true;
}
function cntFiltresOublier() { const d = cnt.defauts; if (!d) return; const x = JSON.parse(JSON.stringify(d)); cntFiltresReprendre(x); }
/* Les fonctions des autres modules sont appelées seulement si elles existent : ce module marche même si l'un d'eux est absent. */
const CNT_PARTIES = [
  { id: "filtres", fr: "Réglages des filtres", en: "Filter settings", garder: cntFiltresAGarder, reprendre: cntFiltresReprendre, oublier: cntFiltresOublier },
  { id: "sim", fr: "Scénarios du simulateur", en: "Simulator scenarios", garder: p => typeof simAGarder === "function" ? simAGarder(p) : null, reprendre: d => typeof simReprendre === "function" && simReprendre(d), oublier: () => typeof simOublier === "function" && simOublier() },
  { id: "rev", fr: "Brouillon de revue", en: "Review draft", garder: p => typeof revAGarder === "function" ? revAGarder(p) : null, reprendre: d => typeof revReprendre === "function" && revReprendre(d), oublier: () => typeof revOublier === "function" && revOublier(), langue: true,
    sansBrouillon: () => typeof rev === "undefined" || !rev.revue },
  { id: "evl", fr: "Passes du banc d'évaluation", en: "Evaluation bench runs", garder: p => typeof evlAGarder === "function" ? evlAGarder(p) : null, reprendre: d => typeof evlReprendre === "function" && evlReprendre(d), oublier: () => typeof evlOublier === "function" && evlOublier(),
    reduire: d => { if (Array.isArray(d.passes) && d.passes.length > 1) { d.passes.shift(); return true; } return false; } }];
const cntPartie = id => CNT_PARTIES.find(p => p.id === id);

/* Photographie du travail courant : { id : { quand, d } }. « quand » ne change que si la partie a changé. */
function cntPhotographier(stockees) {
  const parties = {};
  for (const P of CNT_PARTIES) {
    const prec = stockees && stockees[P.id] ? stockees[P.id] : null;
    let d = null;
    try { d = P.garder(prec ? prec.d : null); } catch (e) { console.error(e); d = prec ? prec.d : null; }
    if (d == null) { delete cnt.dernier[P.id]; continue; }
    const j = JSON.stringify(d);
    if (cnt.dernier[P.id] !== j) { cnt.dernier[P.id] = j; cnt.quand[P.id] = prec && JSON.stringify(prec.d) === j ? prec.quand : Date.now(); }
    parties[P.id] = { quand: cnt.quand[P.id] || Date.now(), d: JSON.parse(j) };
  }
  return parties;
}
function cntEnregistrer() {
  clearTimeout(cnt.minuterie); cnt.minuterie = null;
  if (etat.figee || !etat.modele || !cnt.empreinte) return false;
  const e = cnt.empreinte, avant = cntEntree(e), parties = cntPhotographier(avant && avant.parties);
  if (JSON.stringify(parties) === JSON.stringify(avant ? avant.parties : {})) return true;   // rien de neuf : aucune écriture
  let index = cntIndex().filter(x => x.e !== e);
  if (!Object.keys(parties).length) { cntEcrire(cntCle(e), null); cntEcrire(CNT_INDEX, index); return true; }
  const entree = { format: CNT.format, empreinte: e, fichier: String(etat.fichier || "").slice(0, 260), maj: Date.now(), parties };
  let texte = JSON.stringify(entree); cnt.trop = false;
  for (const P of CNT_PARTIES) {                 // trop gros : on retire d'abord le plus ancien de ce qui se réduit, puis des parties entières
    while (texte.length > CNT.max && parties[P.id] && P.reduire && P.reduire(parties[P.id].d)) { texte = JSON.stringify(entree); cnt.trop = true; }
  }
  for (const P of CNT_PARTIES.slice().reverse()) if (texte.length > CNT.max && parties[P.id]) { delete parties[P.id]; texte = JSON.stringify(entree); cnt.trop = true; }
  index.unshift({ e, f: entree.fichier, t: entree.maj });
  for (const x of index.splice(CNT.jeux)) cntEcrire(cntCle(x.e), null);   // au-delà de six classeurs, le plus ancien s'efface
  cnt.erreurStockage = null;
  let ok = cntEcrire(cntCle(e), texte);
  while (!ok && cnt.erreurStockage === "plein" && index.length > 1) { const x = index.pop(); cntEcrire(cntCle(x.e), null); cnt.erreurStockage = null; ok = cntEcrire(cntCle(e), texte); }
  cntEcrire(CNT_INDEX, ok ? index : index.filter(x => x.e !== e));
  return ok;
}
function cntPlusTard() {                         // appelé après chaque modification visible : on écrit après un court silence
  if (etat.figee || !etat.modele) return;
  clearTimeout(cnt.minuterie); cnt.minuterie = setTimeout(cntEnregistrer, CNT.delai);
}

/* Reprise : depuis un projet importé, sinon depuis ce navigateur, pour ce classeur seulement. */
function cntReprendre(parties) {
  const rejetees = [];
  for (const P of CNT_PARTIES) {
    const x = parties && parties[P.id];
    if (!x) continue;
    let ok = false;
    try { ok = !!(x && typeof x === "object" && typeof x.quand === "number" && x.d && typeof x.d === "object" && P.reprendre(x.d)); } catch (e) { console.error(e); ok = false; }
    if (ok) { cnt.retrouve.push({ id: P.id, quand: x.quand }); cnt.quand[P.id] = x.quand; }
    else if (P.langue && x && x.d && x.d.langue && x.d.langue !== LANGUE) cnt.retrouve.push({ id: P.id, quand: x.quand, autreLangue: x.d.langue });
    else rejetees.push(P.id);
  }
  return rejetees;
}
function cntAuChargement(m) {
  Object.assign(cnt, { empreinte: cntEmpreinte(grillesChargees, d1904Charge), quand: {}, dernier: {}, retrouve: [], bandeauFerme: false, message: null, langue: LANGUE });
  cnt.defauts = JSON.parse(JSON.stringify(cntFiltres()));
  const importe = cnt.aImporter; cnt.aImporter = null;
  if (importe) {
    const rejetees = cntReprendre(importe);
    cnt.message = rejetees.length ? Lg("Projet ouvert, mais ces travaux étaient illisibles et ont été ignorés : ", "Project opened, but this work was unreadable and was ignored: ")
      + rejetees.map(id => Lg(cntPartie(id).fr, cntPartie(id).en).toLowerCase()).join(", ") + "." : null;
    for (const r of cnt.retrouve) r.projet = true;
    cntEnregistrer();
    return;
  }
  if (etat.figee) return;                        // une copie figée ne lit ni n'écrit le travail gardé
  const E = cntEntree(cnt.empreinte);
  if (E) cntReprendre(E.parties);
  for (const P of CNT_PARTIES) { try { const d = P.garder(E && E.parties[P.id] ? E.parties[P.id].d : null); if (d != null) cnt.dernier[P.id] = JSON.stringify(d); } catch (e) {} }
}
AU_CHARGEMENT.push(cntAuChargement);
/* Appelé par charger() avant tout calcul (coeur.py) : le travail du classeur qu'on quitte est écrit tout de suite. */
function cntAvantChargement(figee) { if (!figee && etat.modele) cntEnregistrer(); }   // une copie figée qui s'ouvre n'écrit rien, même pour le classeur d'avant
/* Appelé par changerLangue() (coeur.py) : un brouillon écarté parce qu'il était dans l'autre langue revient avec elle. */
function cntApresLangue() {
  cnt.langue = LANGUE;
  if (etat.figee || !cnt.empreinte) return;
  const E = cntEntree(cnt.empreinte);
  for (const P of CNT_PARTIES) {
    if (!P.langue || !E || !E.parties[P.id]) continue;
    const x = E.parties[P.id];
    if (x.d.langue !== LANGUE || !P.sansBrouillon()) continue;   // dans l'autre langue, ou un brouillon déjà en mémoire
    let ok = false; try { ok = P.reprendre(x.d); } catch (e) { ok = false; }
    if (ok) { cnt.retrouve = cnt.retrouve.filter(r => r.id !== P.id); cnt.retrouve.push({ id: P.id, quand: x.quand }); cnt.bandeauFerme = false; }
  }
}
addEventListener("pagehide", () => cntEnregistrer());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") cntEnregistrer(); });
document.addEventListener("input", () => cntPlusTard(), true);           // saisies en cours (nom du relecteur, correction, phrase du simulateur)
document.addEventListener("change", () => cntPlusTard(), true);

function cntEffacer(id) {                        // une partie, ou tout le travail gardé de ce classeur
  for (const P of CNT_PARTIES) if (!id || P.id === id) { try { P.oublier(); } catch (e) { console.error(e); } delete cnt.dernier[P.id]; delete cnt.quand[P.id]; }
  cnt.retrouve = cnt.retrouve.filter(r => id && r.id !== id);
  cntEnregistrer();
  if (!id) cntEcrire(cntCle(cnt.empreinte), null);
  rendre();
}

/* ---- 4. Bandeau « travail retrouvé » (en tête de chaque page) ---- */
const cntJour = t => { const d = new Date(t), z = x => String(x).padStart(2, "0");
  return Lg(z(d.getDate()) + "/" + z(d.getMonth() + 1) + " à " + z(d.getHours()) + ":" + z(d.getMinutes()), d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + z(d.getHours()) + ":" + z(d.getMinutes())); };
function cntBandeau() {
  if (!etat.modele || cnt.bandeauFerme || !cnt.retrouve.length) return null;
  const lignes = cnt.retrouve.map(r => { const P = cntPartie(r.id), nom = Lg(P.fr, P.en);
    const texte = r.autreLangue ? Lg(nom + " du " + cntJour(r.quand) + " gardé : rédigé en " + (r.autreLangue === "en" ? "anglais" : "français") + ", il reviendra avec cette langue",
      nom + " from " + cntJour(r.quand) + " kept: written in " + (r.autreLangue === "en" ? "English" : "French") + ", it will come back with that language")
      : Lg(nom + " du " + cntJour(r.quand) + (r.projet ? " repris du projet" : " retrouvé"), nom + " from " + cntJour(r.quand) + (r.projet ? " restored from the project" : " restored"))
        + (r.id === "rev" && typeof rev !== "undefined" && rev.revue && rev.revue.dossierChange ? Lg(" ; le dossier de faits a changé depuis (prix ou facteurs d'émission modifiés ?) : les contrôles portent sur le dossier actuel",
          "; the fact file has changed since (prices or emission factors edited?): the checks use the current file") : "");
    return h("li", null, document.createTextNode(texte), " · ", h("button", { class: "lien", onclick: () => { if (confirm(tr(cntT("Effacer ce travail ? Il ne pourra pas être retrouvé.", "Delete this work? It cannot be recovered.")))) cntEffacer(r.id); } }, "Effacer")); });
  return h("div", { class: "avis cnt-bandeau", role: "status" },
    h("div", { class: "cnt-bandeau-tete" }, h("b", null, cntT("Travail retrouvé pour ce classeur", "Work restored for this workbook")),
      h("button", { class: "lien", onclick: () => { cnt.bandeauFerme = true; rendre(); } }, "Fermer")),
    h("ul", null, lignes),
    cnt.message ? h("p", { class: "erreur" }, document.createTextNode(cnt.message)) : null);
}

/* ---- 5. Fichier projet : les grilles chargées (comme une copie figée) et tout le travail gardé ---- */
function cntProjet() {                          // aucune clé d'API, aucun résultat d'outil : seulement les grilles, les prix saisis et le travail
  return { format: CNT.typeProjet, version: CNT.format, cree: new Date().toISOString(), fichier: etat.fichier, d1904: !!d1904Charge, empreinte: cntEmpreinte(grillesChargees, d1904Charge),
    langue: LANGUE, valo: valoSaisie, grilles: grillesChargees, travail: cntPhotographier(null) };
}
function cntExporter() {
  if (!etat.modele) return;
  cntEnregistrer();
  const P = cntProjet();
  const blob = new Blob([JSON.stringify(P)], { type: "application/json" });
  const a = h("a", { href: URL.createObjectURL(blob), download: "Projet revue énergétique - " + String(etat.fichier).replace(/\.[^.]+$/, "") + " - " + isoJour(Date.now()) + ".json" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
/* Validation stricte : rend { projet } ou { erreur } (message pour la personne). */
function cntLireProjet(texte) {
  const abime = cntT("Ce fichier projet est abîmé : il ne peut pas être ouvert.", "This project file is damaged: it cannot be opened.");
  let P;
  try { P = JSON.parse(texte); } catch (e) { return { erreur: cntT("Ce fichier n'est pas un projet lisible : son contenu JSON est abîmé ou incomplet.", "This file is not a readable project: its JSON content is damaged or incomplete.") }; }
  if (!P || typeof P !== "object" || Array.isArray(P) || P.format !== CNT.typeProjet) return { erreur: cntT("Ce fichier n'est pas un projet de revue énergétique.", "This file is not an energy review project.") };
  if (!Number.isInteger(P.version) || P.version < 1) return { erreur: abime };
  if (P.version > CNT.format) return { erreur: Lg("Ce projet vient d'une version plus récente de l'outil (format " + P.version + ") ; cette page lit le format " + CNT.format + ".", "This project comes from a newer version of the tool (format " + P.version + "); this page reads format " + CNT.format + ".") };
  const cellule = v => v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
  const g = P.grilles;
  if (!g || typeof g !== "object" || Array.isArray(g) || !Array.isArray(g.CONSO) || !Array.isArray(g.WIKI)) return { erreur: abime };
  for (const k in g) if (!Array.isArray(g[k]) || !g[k].every(l => l === null || Array.isArray(l) && l.every(cellule))) return { erreur: abime };
  if (typeof P.fichier !== "string" || P.fichier.length > 260 || typeof P.d1904 !== "boolean" || typeof P.empreinte !== "string") return { erreur: abime };
  if (cntEmpreinte(g, P.d1904) !== P.empreinte) return { erreur: cntT("Le contenu de ce projet ne correspond plus à son empreinte : le fichier a été abîmé ou modifié à la main.", "The content of this project no longer matches its fingerprint: the file was damaged or edited by hand.") };
  if (P.valo != null && !(typeof P.valo === "object" && !Array.isArray(P.valo) && Object.values(P.valo).every(v => v && typeof v === "object" && Object.entries(v).every(([k, x]) => ["prix", "fe"].includes(k) && (x === null || typeof x === "number" && isFinite(x)))))) return { erreur: abime };
  const T = P.travail;
  if (!T || typeof T !== "object" || Array.isArray(T)) return { erreur: abime };
  for (const k in T) if (!cntPartie(k) || !T[k] || typeof T[k] !== "object" || typeof T[k].quand !== "number" || !T[k].d || typeof T[k].d !== "object") return { erreur: abime };
  return { projet: P };
}
async function cntOuvrirProjet(fichier) {
  let r;
  try { r = fichier.size > CNT.maxProjet ? { erreur: cntT("Ce fichier est trop gros pour un projet.", "This file is too large for a project.") } : cntLireProjet(await fichier.text()); }
  catch (e) { r = { erreur: cntT("Ce fichier n'a pas pu être lu.", "This file could not be read.") }; }
  return cntAppliquerProjet(r);
}
function cntAppliquerProjet(r) {
  if (r.erreur) {
    if (!etat.modele) { etat.erreur = tr(r.erreur); rendre(); } else { cnt.message = tr(r.erreur); cnt.menuOuvert = true; rendre(); }
    return false;
  }
  const P = r.projet;
  try {
    if (P.valo) { valoSaisie = JSON.parse(JSON.stringify(P.valo)); ecrireValo(); }
    cnt.aImporter = P.travail;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}   // l'onglet de l'adresse ne s'impose pas au projet
    charger(P.grilles, P.d1904, P.fichier, null);
    return true;
  } catch (e) {
    console.error(e); cnt.aImporter = null;
    const msg = Lg("Le projet n'a pas pu être chargé : ", "The project could not be loaded: ") + (e && e.message ? e.message : String(e));
    if (!etat.modele) { etat.erreur = msg; rendre(); } else { cnt.message = msg; cnt.menuOuvert = true; rendre(); }
    return false;
  }
}
const cntChoixProjet = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: e => { if (e.target.files[0]) cntOuvrirProjet(e.target.files[0]); e.target.value = ""; } });
document.body.append(cntChoixProjet);
const cntChoisirProjet = () => cntChoixProjet.click();   // pour un bouton « Ouvrir un projet » ailleurs (accueil)

/* ---- 6. Petit menu du pied : projet et travail gardé ---- */
function cntResume() {
  const E = cnt.empreinte ? cntEntree(cnt.empreinte) : null;
  return E ? CNT_PARTIES.filter(P => E.parties[P.id]).map(P => Lg(P.fr, P.en).toLowerCase()) : [];
}
function cntMenu() {
  const garde = etat.figee ? null : cntResume();
  const etatGarde = etat.figee ? cntT("Copie figée : rien n'est gardé dans ce navigateur. Exportez le projet pour garder votre travail.", "Frozen copy: nothing is kept in this browser. Export the project to keep your work.")
    : cnt.erreurStockage ? cntT("Ce navigateur refuse de garder le travail (stockage plein ou bloqué) : exportez le projet.", "This browser refuses to keep the work (storage full or blocked): export the project.")
    : garde.length ? Lg("Gardé dans ce navigateur pour ce classeur : " + garde.join(", ") + ".", "Kept in this browser for this workbook: " + garde.join(", ") + ".")
    : cntT("Rien à garder pour l'instant : vos scénarios, brouillon de revue, passes et filtres seront gardés dans ce navigateur, pour ce classeur.", "Nothing to keep yet: your scenarios, review draft, runs and filters will be kept in this browser, for this workbook.");
  return h("details", { class: "cnt-menu", open: cnt.menuOuvert, ontoggle: e => { cnt.menuOuvert = e.target.open; } },
    h("summary", null, "Projet et travail gardé"),
    h("div", { class: "cnt-menu-corps" },
      h("p", { class: "note" }, document.createTextNode(tr(etatGarde))),
      cnt.trop ? h("p", { class: "note attention" }, cntT("Travail trop volumineux pour ce navigateur : les plus anciennes passes ne sont pas gardées.", "Work too large for this browser: the oldest runs are not kept.")) : null,
      h("button", { class: "btn", onclick: cntExporter }, "Exporter le projet"),
      h("button", { class: "btn", onclick: cntChoisirProjet }, "Ouvrir un projet"),
      h("p", { class: "note" }, cntT("Le projet (.json) se rouvre ici pour reprendre le travail ; la copie figée est une page à transmettre, qui ne garde pas votre travail.", "The project (.json) reopens here to pick up the work; the frozen copy is a page to pass on, which does not keep your work.")),
      cnt.message && !cnt.retrouve.length ? h("p", { class: "erreur" }, document.createTextNode(cnt.message)) : null,
      !etat.figee && garde.length ? h("button", { class: "lien", onclick: () => { if (confirm(tr(cntT("Effacer tout le travail gardé pour ce classeur ? Il ne pourra pas être retrouvé.", "Delete all the work kept for this workbook? It cannot be recovered.")))) cntEffacer(null); } }, "Effacer le travail gardé") : null));
}

/* ---- 7. Lexique : une seule liste, reprise dans le mode d'emploi et posée sur les titres des pages ---- */
/* [clé, terme fr, terme en, définition fr, définition en, motif fr, motif en] ; les motifs distinguent les majuscules. */
const CNT_LEXIQUE = [
  ["ref", "Référence", "Baseline", "consommation attendue, calculée par le modèle à partir des facteurs influents. On compare le réel à elle.", "expected consumption, computed by the model from the relevant variables. Actual use is compared with it.", "[Rr]éférences?", "[Bb]aselines?"],
  ["ues", "UES", "SEU", "usage énergétique significatif : un usage qui pèse lourd dans la consommation, ou qui offre un fort potentiel d'économie.", "significant energy use: a use that weighs heavily in consumption, or offers a large saving potential.", "UES", "SEUs?"],
  ["ipe", "IPE", "EnPI", "indicateur de performance énergétique : un chiffre suivi dans le temps pour dire si l'énergie est mieux utilisée, par exemple des kWh par tonne produite.", "energy performance indicator: a figure tracked over time to tell whether energy is used better, for example kWh per tonne produced.", "IPE", "EnPIs?"],
  ["facteur", "Facteur influent", "Relevant variable", "grandeur qui fait varier la consommation sans être un réglage : production, météo, heures d'ouverture…", "quantity that drives consumption without being a setting: output, weather, opening hours…", "[Ff]acteurs? influents?", "[Rr]elevant variables?"],
  ["erreur", "Erreur du modèle", "Model error", "écart habituel entre le modèle et le réel, en pourcentage. Plus elle est faible, plus le modèle est fiable.", "usual gap between the model and actual use, as a percentage. The smaller it is, the more reliable the model.", "[Ee]rreur du modèle", "[Mm]odel error"],
  ["r2", "R²", "R²", "part des variations de la consommation que le modèle explique, de 0 à 1. Près de 1, il suit bien le réel ; sous 0,75, il faut s'en méfier.", "share of the changes in consumption that the model explains, from 0 to 1. Close to 1, it follows actual use well; below 0.75, treat it with care.", "R²", "R²"],
  ["tunnel", "Tunnel", "Band", "marge autour de la référence, égale à l'erreur du modèle multipliée par le seuil choisi. Hors du tunnel, l'écart mérite un regard.", "margin around the baseline, equal to the model error times the chosen threshold. Outside the band, the gap deserves a look.", "[Tt]unnels?", "[Bb]ands?"],
  ["z", "z", "z", "taille d'un écart comparée à l'erreur habituelle du modèle. Au-delà de 2 (ou sous −2), l'écart a peu de chances d'être dû au hasard.", "size of a gap compared with the model's usual error. Beyond 2 (or below −2), the gap is unlikely to be chance.", "z", "z"],
  ["episode", "Épisode de dérive", "Drift episode", "suite de périodes où le réel reste du même côté de la référence. C'est l'unité qu'on instruit et qu'on chiffre.", "run of periods where actual use stays on the same side of the baseline. It is the unit that gets investigated and valued.", "[ÉéEe]pisodes? de dérive|[ÉéEe]pisodes?", "[Dd]rift episodes?|[Ee]pisodes?"],
  ["derive", "Dérive", "Drift", "écart qui dure entre la consommation réelle et la référence : à la hausse (surconsommation) ou à la baisse (économie).", "lasting gap between actual consumption and the baseline: upwards (overconsumption) or downwards (saving).", "[Dd]érives?", "[Dd]rifts?"],
  ["cusum", "CUSUM", "CUSUM", "cumul des écarts au fil du temps : une pente qui monte signale une surconsommation qui dure, une pente qui descend une économie.", "running total of the gaps over time: a rising slope signals lasting overconsumption, a falling slope a saving.", "CUSUM", "CUSUM"],
  ["projection", "Projection", "Projection", "prolongement simple de l'écart moyen actuel, sans modèle : un ordre de grandeur, pas une prévision.", "simple extension of the current average gap, without a model: an order of magnitude, not a forecast.", "[Pp]rojections?", "[Pp]rojections?"],
  ["atterrissage", "Atterrissage", "Landing", "estimation de la consommation de l'année entière : ce qui est déjà consommé, plus la prévision des mois restants.", "estimate of the whole year's consumption: what has already been used, plus the forecast for the remaining months.", "[Aa]tterrissage", "[Ll]anding"],
  ["retro", "Test rétrospectif", "Backtest", "on cache la fin de l'historique, on prévoit avec ce qui reste, puis on compare au réel caché : c'est la preuve qu'une méthode marche.", "the end of the history is hidden, a forecast is made from the rest, then compared with the hidden actuals: it proves whether a method works.", "[Tt]ests? rétrospectifs?", "[Bb]acktests?"],
  ["p10", "P10–P90", "P10–P90", "niveaux bas et haut habituels : un dixième des valeurs est sous P10, un dixième au-dessus de P90.", "usual low and high levels: a tenth of the values are below P10, a tenth above P90.", "P10(?: ?[–-] ?P90| et P90|, P90)?|P90", "P10(?: ?[–-] ?P90| and P90|, P90)?|P90"],
  ["dj", "Degrés-jours", "Degree days", "mesure du froid (ou du chaud) sur une période : plus il y en a, plus il faut chauffer (ou refroidir).", "measure of how cold (or hot) a period was: the more there are, the more heating (or cooling) is needed.", "[Dd]egrés[- ]jours|DJU", "[Dd]egree[- ]days|HDD|CDD"],
  ["co2e", "CO₂e", "CO₂e", "équivalent CO₂ : tous les gaz à effet de serre, ramenés à l'effet qu'aurait la même quantité de CO₂.", "CO₂ equivalent: all greenhouse gases, expressed as the effect the same amount of CO₂ would have.", "CO₂e|CO2e", "CO₂e|CO2e"]];
const cntMotifs = {};
function cntMotif(l) {                           // une alternative par terme, sans lettre ni chiffre collés de part et d'autre
  if (!cntMotifs[l]) { const k = l === "en" ? 6 : 5;
    cntMotifs[l] = new RegExp("(?<![\\p{L}\\p{N}_])(?:" + CNT_LEXIQUE.map(x => "(" + x[k] + ")").join("|") + ")(?![\\p{L}\\p{N}_])", "gu"); }
  const re = cntMotifs[l]; re.lastIndex = 0; return re;
}
/* Le mode d'emploi reprend la même liste (elle remplace le « Petit lexique » d'origine). */
(function cntLexiqueDansGuide() {
  const s = GUIDE.find(x => x.id === "lexique");
  if (s) s.b = [["dl", CNT_LEXIQUE.map(x => [x[1], x[2], x[3], x[4]])]];
})();
const CNT_CIBLES = "h1, h2, h3, .sous, .lib";
const CNT_SANS = ["fiche", "journal", "rev-document", "constat", "tip", "cnt-terme", "cnt-bandeau"];
const CNT_BALISES_SANS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON", "PRE", "CODE", "SVG", "SCRIPT", "STYLE"]);
function cntExclu(n, racine) {
  for (let x = n; x && x !== racine; x = x.parentNode) {
    if (x.nodeType !== 1) continue;
    if (CNT_BALISES_SANS.has(String(x.tagName).toUpperCase()) || x.namespaceURI === "http://www.w3.org/2000/svg") return true;
    if (CNT_SANS.some(c => x.classList.contains(c)) || x.hasAttribute("data-ia") || x.isContentEditable === true) return true;
  }
  return false;
}
function cntMarquer(racine) {
  if (!cnt.lexique || !racine || !racine.querySelectorAll) return 0;
  const zone = racine.querySelector(".contenu") || racine, vus = new Set(), re0 = cntMotif(LANGUE);
  let n = 0;
  for (const x of zone.querySelectorAll(".cnt-terme")) vus.add(x.getAttribute("data-terme"));
  for (const el of zone.querySelectorAll(CNT_CIBLES)) {
    if (el.classList.contains("lib") && !(el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("tuile"))) continue;
    if (cntExclu(el, zone)) continue;
    const textes = [];
    (function voir(p) { for (const c of [...p.childNodes]) { if (c.nodeType === 3) textes.push(c); else if (c.nodeType === 1 && !cntExclu(c, p)) voir(c); } })(el);
    for (const t of textes) {
      const brut = t.nodeType === 3 ? (t.data != null ? t.data : t.textContent) : "";
      if (!brut || brut.length < 1) continue;
      const re = new RegExp(re0.source, re0.flags), morceaux = []; let i = 0, r;
      while ((r = re.exec(brut))) {
        const k = r.slice(1).findIndex(g => g !== undefined), cle = CNT_LEXIQUE[k][0];
        if (vus.has(cle)) continue;
        vus.add(cle);
        if (r.index > i) morceaux.push(document.createTextNode(brut.slice(i, r.index)));
        morceaux.push(cntTerme(cle, r[0])); i = r.index + r[0].length; n++;
      }
      if (!morceaux.length) continue;
      if (i < brut.length) morceaux.push(document.createTextNode(brut.slice(i)));
      t.replaceWith(...morceaux);
    }
  }
  return n;
}
function cntTerme(cle, texte) {
  const e = h("span", { class: "cnt-terme", tabindex: "0", "data-terme": cle, "aria-describedby": "tip" }, document.createTextNode(texte));
  const montrer = ev => cntMontrerDefinition(e, ev), cacher = () => { if (cnt.tipDe === e) { cnt.tipDe = null; cacherTip(); } };
  e.addEventListener("pointerenter", ev => { if (ev.pointerType !== "touch") montrer(ev); });
  e.addEventListener("pointerleave", ev => { if (ev.pointerType !== "touch") cacher(); });
  e.addEventListener("focus", montrer); e.addEventListener("blur", cacher);
  e.addEventListener("click", ev => { ev.stopPropagation(); cnt.tipDe === e ? cacher() : montrer(ev); });   // toucher : un appui montre, un second cache
  e.addEventListener("keydown", ev => { if (ev.key === "Escape") cacher(); });
  return e;
}
function cntDefinition(cle) { const x = CNT_LEXIQUE.find(y => y[0] === cle); return x ? { terme: LANGUE === "en" ? x[2] : x[1], def: LANGUE === "en" ? x[4] : x[3] } : null; }
function cntMontrerDefinition(e, ev) {
  const d = cntDefinition(e.getAttribute("data-terme"));
  if (!d) return;
  tip.replaceChildren(h("div", { class: "t" }, document.createTextNode(d.terme)), h("div", { class: "cnt-def" }, document.createTextNode(d.def.charAt(0).toUpperCase() + d.def.slice(1))));
  tip.setAttribute("role", "tooltip"); tip.hidden = false; cnt.tipDe = e;
  const b = e.getBoundingClientRect(), r = tip.getBoundingClientRect(), souris = ev && typeof ev.clientX === "number" && ev.type !== "focus" && ev.type !== "click";
  let x = souris ? ev.clientX + 14 : b.left, y = souris ? ev.clientY + 14 : b.bottom + 6;
  if (x + r.width > innerWidth - 8) x = innerWidth - 8 - r.width;
  if (y + r.height > innerHeight - 8) y = b.top - r.height - 6;
  tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
}
if (typeof document.addEventListener === "function") document.addEventListener("click", () => { if (cnt.tipDe) { cnt.tipDe = null; cacherTip(); } });

/* Après chaque rendu : marquer les termes, puis garder le travail. Les pages qui se repeignent seules (revue, banc) sont suivies par un observateur. */
APRES_RENDU.push(() => { cnt.marquage = true; try { cntMarquer(app); } finally { cnt.marquage = false; } cntPlusTard(); });
if (typeof MutationObserver === "function") {
  let attente = 0;
  new MutationObserver(() => { if (cnt.marquage || attente || !etat.modele) return; attente = requestAnimationFrame(() => { attente = 0; cnt.marquage = true; try { cntMarquer(app); } finally { cnt.marquage = false; } }); })
    .observe(app, { childList: true, subtree: true });
}

ajouterTraductions([["Projet et travail gardé", "Project and kept work"], ["Exporter le projet", "Export the project"], ["Ouvrir un projet", "Open a project"],
  ["Effacer le travail gardé", "Delete the kept work"], ["Effacer", "Delete"], ["Fermer", "Close"]]);
