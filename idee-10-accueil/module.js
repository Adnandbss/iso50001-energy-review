/* ============================================================================
   Module « Accueil » (préfixe acc) : un site fictif pour tout voir sans classeur,
   une visite guidée d'une minute, et la page « Vue d'ensemble » affichée après
   chaque chargement. Aucune IA, aucun réseau : la visite s'appuie sur le mode
   démonstration de la page Instruction.
   ============================================================================ */
/* Texte fixe : écrit dans les deux langues, déposé dans la table de tr() au premier emploi. */
const accT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };
const accIso = s0 => { const [a, m, j] = s0.split("-").map(Number); return Date.UTC(a, m - 1, j); };

/* ---- 1. Le site fictif : réglages de la fabrication ----
   110 semaines à partir du lundi 7 octobre 2024. Les modèles de référence sont calés sur la première année (52 semaines),
   comme une situation énergétique de référence ; la seconde année porte les histoires à découvrir. */
const ACC = {
  graine: 50001, debut: accIso("2024-10-07"), semaines: 110, reference: 52, feuille: "ACC FICTIF",   // feuille témoin : elle suit les grilles jusque dans une copie figée
  fuite: accIso("2026-08-31"), fuiteParSemaine: 1100,   // air comprimé : des fuites qui s'aggravent, +1 100 kWh de plus chaque semaine
  ligne: accIso("2026-06-01"), ligneKwh: 9000,           // chambre froide ajoutée, raccordée au compteur général mais suivie par aucune UES
  action: accIso("2025-12-01"), actionGain: 0.10,        // chaufferie : régulation refaite, 10 % de moins
  aberrante: accIso("2026-03-16"), aberranteFois: 2.6,   // four : un relevé faux, une seule semaine
  feries: ["2024-11-01", "2024-11-11", "2024-12-25", "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-08", "2025-05-29", "2025-06-09", "2025-07-14", "2025-08-15",
    "2025-11-11", "2025-12-25", "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-08", "2026-05-14", "2026-05-25", "2026-07-14", "2026-11-11"],
  arrets: [["2024-12-23", "2025-01-01"], ["2025-08-04", "2025-08-15"], ["2025-12-22", "2026-01-02"], ["2026-08-03", "2026-08-14"]],
  noms: {   // noms génériques, dans la langue choisie au moment du chargement
    fr: { fichier: "Site fictif – usine de démonstration", elec: "Électricité", gaz: "Gaz", dju: "Degrés-jours de chauffage", prod: "Production (t)", jours: "Jours ouvrés",
      siteElec: "Compteur général électricité", air: "Air comprimé", froid: "Froid industriel", eclairage: "Éclairage",
      siteGaz: "Compteur général gaz", chauffe: "Chaufferie", four: "Four de cuisson", eau: "Eau chaude de lavage" },
    en: { fichier: "Fictitious site – demo plant", elec: "Electricity", gaz: "Gas", dju: "Heating degree days", prod: "Production (t)", jours: "Working days",
      siteElec: "Main electricity meter", air: "Compressed air", froid: "Process cooling", eclairage: "Lighting",
      siteGaz: "Main gas meter", chauffe: "Boiler house", four: "Baking oven", eau: "Washing hot water" } }
};
/* Un nom d'énergie anglais « Gas » reçoit les mêmes hypothèses de prix et de carbone que « Gaz » (VALO_DEFAUT ne reconnaît que le français). */
(function accValoAnglaise() {
  const gaz = VALO_DEFAUT.find(x => x.motif.test("gaz"));
  if (gaz && !VALO_DEFAUT.some(x => x.motif.test("Gas"))) VALO_DEFAUT.push(Object.assign({}, gaz, { motif: /^(natural )?gas$/i }));
})();

/* Générateur pseudo-aléatoire à graine (mulberry32) et loi normale bornée à ± 3 : le même site à chaque chargement. */
function accAlea(graine) {
  let a = graine >>> 0;
  const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const normale = () => Math.max(-3, Math.min(3, Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u())));
  return { u, normale };
}

/* Facteurs influents de la semaine : degrés-jours de chauffage (base 18 °C, saison et anomalies qui durent),
   jours ouvrés (fériés et fermetures de Noël et d'août), production (selon les jours ouvrés, la saison et la demande). */
function accFacteurs(R) {
  const feries = new Set(ACC.feries.map(accIso)), arrets = ACC.arrets.map(p => p.map(accIso));
  const out = { dju: [], jours: [], prod: [] };
  let anomalie = 0;
  for (let k = 0; k < ACC.semaines; k++) {
    const t0 = ACC.debut + k * 7 * JOUR;
    let dju = 0, jours = 0;
    for (let d = 0; d < 7; d++) {
      const t = t0 + d * JOUR, an = Date.UTC(new Date(t).getUTCFullYear(), 0, 1), jourAn = (t - an) / JOUR;
      anomalie = 0.8 * anomalie + 1.7 * R.normale();
      const temp = 11.8 - 7.8 * Math.cos(2 * Math.PI * (jourAn - 18) / 365.25) + anomalie;
      dju += Math.max(0, 18 - temp);
      if (d < 5 && !feries.has(t) && !arrets.some(p => t >= p[0] && t <= p[1])) jours++;
    }
    const an = Date.UTC(new Date(t0).getUTCFullYear(), 0, 1), saison = 1 + 0.06 * Math.sin(2 * Math.PI * ((t0 - an) / JOUR - 70) / 365.25);
    out.dju.push(Math.round(dju * 10) / 10); out.jours.push(jours);
    out.prod.push(jours ? Math.round(86 * jours * saison * (1 + 0.05 * R.normale())) : 0);
  }
  return out;
}

/* Consommations en kWh par semaine. La somme des UES n'explique pas tout le site : bureaux, ventilation, chambre froide non suivie. */
function accJeu(langue) {
  const N = ACC.noms[langue === "en" ? "en" : "fr"], R = accAlea(ACC.graine), F = accFacteurs(R);
  const dates = Array.from({ length: ACC.semaines }, (x, k) => ACC.debut + k * 7 * JOUR);
  const bruit = sd => 1 + sd * R.normale(), arr = v => Math.round(v);
  const S = { air: [], froid: [], eclairage: [], autresE: [], chauffe: [], four: [], eau: [], autresG: [] };
  dates.forEach((t, k) => {
    const dju = F.dju[k], jours = F.jours[k], prod = F.prod[k];
    const fuite = t >= ACC.fuite ? ACC.fuiteParSemaine * ((t - ACC.fuite) / 7 / JOUR + 1) : 0;
    S.air.push(arr((5500 + 38 * prod + 700 * jours) * bruit(0.035) + fuite));
    S.froid.push(arr((11000 + 50 * prod - 55 * dju) * bruit(0.04)));
    S.eclairage.push(arr((2200 + 950 * jours + 22 * dju) * bruit(0.03)));
    S.autresE.push(arr((26000 + 30 * prod + 40 * dju) * bruit(0.03) + (t >= ACC.ligne ? ACC.ligneKwh : 0)));
    S.chauffe.push(arr((1800 + 880 * dju) * bruit(0.05) * (t >= ACC.action ? 1 - ACC.actionGain : 1)));
    S.four.push(arr((14000 + 68 * prod + 900 * jours) * bruit(0.035) * (t === ACC.aberrante ? ACC.aberranteFois : 1)));
    S.eau.push(arr((3500 + 16 * prod + 35 * dju) * bruit(0.05)));
    S.autresG.push(arr((2500 + 12 * dju) * bruit(0.05)));
  });
  // compteur général : la somme réelle de ce qui passe, relevée avec une petite erreur de lecture ; le relevé faux du four n'y est pas
  const four = S.four.map((v, k) => dates[k] === ACC.aberrante ? v / ACC.aberranteFois : v);
  const siteE = dates.map((t, k) => arr((S.air[k] + S.froid[k] + S.eclairage[k] + S.autresE[k]) * bruit(0.004)));
  const siteG = dates.map((t, k) => arr((S.chauffe[k] + four[k] + S.eau[k] + S.autresG[k]) * bruit(0.004)));
  const c = (nom, energie, niveau, y) => ({ nom, energie, niveau, y });
  return { N, dates, facteurs: [{ nom: N.dju, v: F.dju }, { nom: N.prod, v: F.prod }, { nom: N.jours, v: F.jours }],
    consos: [c(N.siteElec, N.elec, "Site", siteE), c(N.air, N.elec, "UES", S.air), c(N.froid, N.elec, "UES", S.froid), c(N.eclairage, N.elec, "UES", S.eclairage),
      c(N.siteGaz, N.gaz, "Site", siteG), c(N.chauffe, N.gaz, "UES", S.chauffe), c(N.four, N.gaz, "UES", S.four), c(N.eau, N.gaz, "UES", S.eau)] };
}

/* Grilles lues par calculer() : les modèles sont calés par le module Intégration (itgModele : moindres carrés, facteurs choisis pas à pas,
   semaines aberrantes écartées, erreur type à chaque pas) sur la seule année de référence, puis écrits par itgGrilles. */
function accGrilles(langue) {
  if (typeof itgModele !== "function" || typeof itgGrilles !== "function") throw new Error(Lg("Le module Intégration, qui cale les modèles, est absent de cette page.", "The Integration module, which fits the models, is missing from this page."));
  const J = accJeu(langue), dansRef = (t, k) => k < ACC.reference;
  const Jref = { dates: J.dates, facteurs: J.facteurs, consos: J.consos.map(s => Object.assign({}, s, { y: s.y.map((v, k) => dansRef(J.dates[k], k) ? v : null) })) };
  const modeles = Jref.consos.map(s => itgModele(s, Jref));
  const G = itgGrilles({ dates: J.dates, facteurs: J.facteurs.map(f => ({ nom: f.nom, v: f.v })), consos: J.consos }, modeles, {});
  delete G.INTEGRATION;                                                   // ce n'est pas un fichier intégré : pas de compte rendu d'intégration
  G[ACC.feuille] = [null, [null, "Données fictives fabriquées par la page (graine " + ACC.graine + ")", langue === "en" ? "en" : "fr"]];
  return { grilles: G, nom: J.N.fichier, modeles };
}
const accFictif = () => !!(grillesChargees && grillesChargees[ACC.feuille]);
const accNoms = () => ACC.noms[accFictif() && grillesChargees[ACC.feuille][1][2] === "en" ? "en" : "fr"];

/* Bouton de l'accueil : fabrique, charge, puis propose la visite la première fois. */
const ACC_CLE_VISITE = "revue-energetique.acc.visite";
function accCharger() {
  let G;
  try { G = accGrilles(LANGUE); charger(G.grilles, false, G.nom, null); }
  catch (e) { console.error(e); etat.erreur = e && e.message ? e.message : String(e); if (!etat.modele) rendre(); else alert(etat.erreur); return; }
  let vue = false;
  try { vue = localStorage.getItem(ACC_CLE_VISITE) === "1"; } catch (e) {}
  if (!vue && !accVisite.dejaProposee) accVisiteOuvrir(0);
}
function accAccueil() {
  return h("div", { class: "acc-essai" },
    h("button", { class: "btn principal", type: "button", onclick: accCharger }, accT("Essayer avec un site fictif", "Try it with a fictitious site")),
    h("p", null, accT("Pas de classeur sous la main ? La page fabrique une usine inventée, deux ans de relevés hebdomadaires avec leurs modèles de référence, et propose une visite guidée d'une minute. Rien ne quitte votre navigateur.",
      "No workbook at hand? The page builds an invented plant, two years of weekly readings with their baseline models, and offers a one-minute guided tour. Nothing leaves your browser.")),
    h("p", { class: "acc-ou" }, accT("ou", "or")));
}

/* ---- 2. Vue d'ensemble : chaque chiffre vient des fonctions des autres pages ---- */
const ACC_R2 = 0.75;                                                      // seuil d'usage courant pour dire un modèle de régression utilisable
let accMemo = null, accInstruits = new Set(), accPremier = true;
const accCleEp = ep => ep.serie + "|" + ep.debut + "|" + (ep.ecart > 0 ? "+" : "-");
/* Une dérive est instruite si sa fiche est affichée sur la page Instruction, ou rédigée par la Veille. */
function accNoterInstruits() {
  try { if (agent.episode && zoneFiche.querySelector("dl")) accInstruits.add(accCleEp(agent.episode)); } catch (e) {}
}
function accInstruit(ep) {
  if (accInstruits.has(accCleEp(ep))) return true;
  try { if (typeof veiCle === "function" && typeof vei !== "undefined") { const r = vei.resultats.get(veiCle(ep)); if (r && r.res && r.res.fiche) return true; } } catch (e) {}
  return false;
}
const accPage1 = id => ONGLETS.some(o => o[0] === id);
/* choisirEpisode suppose la page Instruction prête pour ce classeur (la page Détection s'en charge d'habitude). */
function accInstruire(ep) { if (agent.modele !== etat.modele) reinitialiserAgent(etat.modele); choisirEpisode(ep); }

/* Écart à la référence sur les 12 derniers mois de données, par énergie, au niveau Site (à défaut, somme des UES). */
function accBilan(m) {
  const site = m.series.filter(x => x.groupe === "site" && x.nbPoints), series = site.length ? site : m.series.filter(x => x.groupe === "ues" && x.nbPoints);
  const de = Math.max(m.debut, m.fin - 365 * JOUR + 1), parEnergie = new Map();
  for (const sr of series) {
    const e = parEnergie.get(sr.energie) || { energie: sr.energie, reel: 0, ref: 0, n: 0 };
    m.dates.forEach((t, j) => { if (t >= de && t <= m.fin && sr.conso[j] != null && sr.ref[j] != null) { e.reel += sr.conso[j]; e.ref += sr.ref[j]; e.n++; } });
    parEnergie.set(sr.energie, e);
  }
  const lignes = [...parEnergie.values()].filter(e => e.n).map(e => Object.assign(e, { ecart: e.reel - e.ref, cout: coutDe(e.energie, e.reel - e.ref), co2: co2De(e.energie, e.reel - e.ref) }));
  const tous = (k) => lignes.length && lignes.every(e => e[k] != null) ? somme(lignes.map(e => e[k])) : null;
  const reel = somme(lignes.map(e => e.reel)), ref = somme(lignes.map(e => e.ref));
  return { niveau: site.length ? "site" : "ues", de, mois: Math.round((m.fin - de) / JOUR / 30.44), lignes, reel, ref, ecart: reel - ref, pct: ref > 0 ? (reel - ref) / ref : null, cout: tous("cout"), co2: tous("co2") };
}
/* Dérives en cours : mêmes règles que la page Détection (sur toutes les données), coût mensuel = projection sur 3 mois ÷ 3. */
function accDerives() {
  const D = derives(), avecSite = new Set(D.analyses.filter(A => A.serie.groupe === "site").map(A => A.serie.energie));
  const ouverts = D.episodes.filter(ep => ep.ouvert && ep.ecart > 0);
  const comptes = ouverts.filter(ep => ep.groupe === "site" || !avecSite.has(ep.energie));     // sans double compte, comme la page Détection
  const c3 = comptes.map(ep => coutDe(ep.energie, projectionDe(ep).wh3mois)).filter(v => v != null);
  const fiche = ep => { const p = projectionDe(ep), wh = p.wh3mois / 3; return { ep, p, whMois: wh, euroMois: coutDe(ep.energie, wh), co2Mois: co2De(ep.energie, wh), instruit: accInstruit(ep) }; };
  const liste = ouverts.map(fiche), parCout = liste.every(x => x.euroMois != null);
  liste.sort((a, b) => parCout ? b.euroMois - a.euroMois : b.whMois - a.whMois);
  const sites = liste.filter(x => x.ep.groupe === "site").map(x => Object.assign(x, { d: decomposerSite(x.ep) })).filter(x => x.d.lignes.length && x.ep.ecart > 0 && x.d.reste > 0);
  return { D, liste, nb: ouverts.length, cout3: c3.length ? somme(c3) : null, wh3: somme(comptes.map(ep => projectionDe(ep).wh3mois)), sites,
    economies: D.episodes.filter(ep => ep.ouvert && ep.ecart < 0).length };
}
/* Atterrissage de l'année civile, par compteur de niveau Site, avec la fonction de la page Prévision et ses réglages par défaut. */
function accAtterrissage(m) {
  if (typeof prevCalcul !== "function" || typeof prevEtat === "undefined") return { ok: false, motif: "absent" };
  const site = m.series.filter(x => x.groupe === "site" && x.nbPoints);
  if (!site.length) return { ok: false, motif: "sans-site" };
  const garde = Object.assign({}, prevEtat), lignes = [];
  try {
    Object.assign(prevEtat, { horizon: 3, derive: false, cumul: "annee" });
    for (const sr of site) {
      const K = prevCalcul(sr);
      if (!K.ok || !K.att || !K.att.ok) return { ok: false, motif: "non-prevu", serie: sr.nom };
      const att = K.att, demi = (att.haut - att.bas) / 2;
      lignes.push({ sr, att, demi, txt: fmtEnergie(prevRond(att.central, demi)), cout: coutDe(sr.energie, att.central), coutDemi: coutDe(sr.energie, demi), coutBas: coutDe(sr.energie, att.bas), coutHaut: coutDe(sr.energie, att.haut) });
    }
  } catch (e) { console.error(e); return { ok: false, motif: "erreur" }; }
  finally { Object.assign(prevEtat, garde); }
  const tous = k => lignes.every(l => l[k] != null) ? somme(lignes.map(l => l[k])) : null;
  return { ok: true, lib: lignes[0].att.lib, lignes, cout: tous("cout"), coutDemi: tous("coutDemi"), coutBas: tous("coutBas"), coutHaut: tous("coutHaut"),
    wh: somme(lignes.map(l => l.att.central)), whBas: somme(lignes.map(l => l.att.bas)), whHaut: somme(lignes.map(l => l.att.haut)) };
}
/* Qualité des modèles : erreur renseignée (série analysable) et R² au moins égal au seuil. */
function accQualite(D) {
  const A = D.analyses, r2 = A.map(a => a.serie.r2).filter(v => v != null).sort((x, y) => x - y), err = A.filter(a => a.ok).map(a => a.erreur).sort((x, y) => x - y);
  const faibles = A.filter(a => !a.ok || a.serie.r2 == null || a.serie.r2 < ACC_R2);
  return { total: A.length, fiables: A.length - faibles.length, faibles, r2Median: r2.length ? r2[Math.floor(r2.length / 2)] : null, errMediane: err.length ? err[Math.floor(err.length / 2)] : null };
}
/* Que faire ensuite : actions possibles, dans l'ordre où l'état les rend utiles ; les trois premières sont montrées. */
function accActions(K) {
  const a = [], nom = n => "« " + n + " »";
  const aInstruire = K.der.liste.find(x => !x.instruit);
  if (aInstruire) a.push({ id: "instruire", ep: aInstruire.ep, titre: Lg("Instruire la dérive " + nom(aInstruire.ep.serie), "Investigate the drift on " + nom(aInstruire.ep.serie)),
    det: Lg("La plus coûteuse des dérives en cours sans fiche : ", "The costliest ongoing drift without a report: ") + (aInstruire.euroMois != null ? fmtEuros(aInstruire.euroMois, true) : fmtEnergie(aInstruire.whMois, true)) + Lg(" par mois depuis ", " per month since ") + aInstruire.ep.libDebut + ".",
    bouton: accT("Instruire", "Investigate"), faire: () => accInstruire(aInstruire.ep) });
  const s = K.der.sites.map(x => Object.assign(x, { part: x.d.reste / x.ep.ecart })).filter(x => x.part >= 0.3).sort((x, y) => y.d.reste - x.d.reste)[0];
  if (s) a.push({ id: "non-suivi", titre: Lg("Chercher l'usage non suivi derrière " + nom(s.ep.serie), "Look for the untracked use behind " + nom(s.ep.serie)),
    det: Lg(fmtPct(Math.min(1, s.part)) + " de l'écart en cours (" + fmtEnergie(s.d.reste, true) + ") ne vient d'aucune UES suivie.", fmtPct(Math.min(1, s.part)) + " of the ongoing gap (" + fmtEnergie(s.d.reste, true) + ") comes from no tracked SEU."),
    bouton: accT("Voir la décomposition", "See the breakdown"), faire: () => { Object.assign(etat, { derSerie: s.ep.serie, derSens: "*", derEtat: "*" }); aller("derives"); } });
  if (K.qualite.faibles.length) a.push({ id: "modeles", titre: Lg(K.qualite.faibles.length + " modèle(s) de référence à revoir", K.qualite.faibles.length + " baseline model(s) to review"),
    det: Lg("R² sous " + nf(ACC_R2, 2) + " ou erreur non renseignée : ", "R² below " + nf(ACC_R2, 2) + " or error missing: ") + K.qualite.faibles.slice(0, 3).map(A => nom(A.serie.nom)).join(", ") + (K.qualite.faibles.length > 3 ? "…" : "") + ".",
    bouton: accT("Voir les facteurs", "See the variables"), faire: () => aller("facteurs") });
  if (accPage1("revue") && typeof rev !== "undefined" && !rev.revue) a.push({ id: "revue", titre: accT("Rédiger la revue énergétique de la période", "Draft the energy review for the period"),
    det: accT("Aucune revue n'a encore été rédigée pour ces données.", "No review has been drafted yet for this data."), bouton: accT("Ouvrir la Revue", "Open the Review"), faire: () => aller("revue") });
  if (agent.demo) a.push({ id: "ia", titre: accT("Brancher une IA", "Connect an AI"),
    det: accT("Vous êtes en mode démonstration : un script joue l'agent, sans IA ni réseau.", "You are in demo mode: a script plays the agent, with no AI and no network."), bouton: accT("Régler l'IA", "Set up the AI"), faire: () => aller("agent") });
  if (accPage1("evaluation") && typeof evl !== "undefined" && !evl.passes.length) a.push({ id: "evaluation", titre: accT("Vérifier l'agent sur le banc d'évaluation", "Check the agent on the evaluation bench"),
    det: accT("Des questions dont la page connaît la réponse : on mesure ce que l'agent répond juste.", "Questions whose answer the page knows: it measures what the agent gets right."), bouton: accT("Ouvrir le banc", "Open the bench"), faire: () => aller("evaluation") });
  if (!a.length) a.push({ id: "detection", titre: accT("Parcourir la détection des dérives", "Browse the drift detection"), det: accT("Rien d'urgent : les épisodes passés restent à lire.", "Nothing urgent: past episodes are still worth reading."), bouton: accT("Ouvrir la Détection", "Open Detection"), faire: () => aller("derives") });
  return a.slice(0, 3);
}
function accCalcul() {
  const m = etat.modele;
  accNoterInstruits();
  if (!accMemo || accMemo.modele !== m || accMemo.langue !== LANGUE || accMemo.valo !== JSON.stringify(valoSaisie)) {
    const D = derives();
    accMemo = { modele: m, langue: LANGUE, valo: JSON.stringify(valoSaisie), bilan: accBilan(m), att: accAtterrissage(m), qualite: accQualite(D) };
  }
  const K = Object.assign({}, accMemo, { der: accDerives() });           // dérives : recalculées à chaque rendu, l'état « instruite » change
  K.actions = accActions(K);
  return K;
}
/* Phrase de synthèse. */
function accPhrase(K) {
  const B = K.bilan, sujet = B.niveau === "site" ? Lg("le site", "the site") : Lg("les usages suivis", "the tracked uses");
  const duree = B.mois >= 11.5 ? Lg("Sur les 12 derniers mois", "Over the last 12 months") : Lg("Sur les " + B.mois + " derniers mois", "Over the last " + B.mois + " months");
  let p;
  if (B.pct == null) p = Lg("Aucune période ne compare le réel à la référence.", "No period compares actuals with the baseline.");
  else {
    const plus = B.ecart >= 0, enjeu = [fmtEnergie(B.ecart, true), B.cout == null ? null : fmtEuros(B.cout, true)].filter(Boolean).join(", ");
    p = duree + ", " + sujet + Lg(B.niveau === "site" ? " consomme " : " consomment ", B.niveau === "site" ? " uses " : " use ") + fmtPct(Math.abs(B.pct)) + Lg(plus ? " de plus que sa référence" : " de moins que sa référence", plus ? " more than its baseline" : " less than its baseline") + " (" + enjeu + ").";
  }
  const d = K.der;
  const suite = !d.nb ? Lg(" Aucune surconsommation en cours.", " No overconsumption under way.")
    : " " + Lg(d.nb === 1 ? "Une surconsommation en cours coûte " : d.nb + " surconsommations en cours coûtent ", d.nb === 1 ? "One ongoing overconsumption costs " : d.nb + " ongoing overconsumptions cost ")
      + (d.cout3 != null ? fmtEuros(d.cout3 / 3) : fmtEnergie(d.wh3 / 3)) + Lg(" par mois si rien ne change.", " per month if nothing changes.");
  return p + suite;
}
function accPage() {
  const m = etat.modele;
  let K;
  try { K = accCalcul(); }
  catch (e) { console.error(e); return [h("div", { class: "vide" }, accT("La vue d'ensemble n'a pas pu être calculée sur ces données. Les autres pages restent disponibles.", "The overview could not be computed on this data. The other pages remain available."))]; }
  const B = K.bilan, d = K.der, A = K.att, Q = K.qualite;
  const visite = accFictif() ? h("button", { class: "btn acc-bouton-visite", type: "button", onclick: () => accVisiteOuvrir(0) }, accT("Visite guidée (1 min)", "Guided tour (1 min)")) : null;
  const constat = h("div", { class: "constat acc-synthese" + (d.nb ? " alerte" : "") }, h("p", { class: "titre" }, accPhrase(K)),
    h("p", { class: "suite" }, accT("Où en est le site, et que faire ensuite : chaque chiffre vient des pages Détection et Prévision.", "Where the site stands, and what to do next: every figure comes from the Detection and Forecast pages.")));
  // indicateurs
  const enjeu = [B.cout == null ? null : fmtEuros(B.cout, true), B.co2 == null ? null : fmtCO2(B.co2, true)].filter(Boolean).join(" · ");
  const tEcart = tuile(accT("Écart à la référence, 12 derniers mois", "Gap to baseline, last 12 months"), B.pct == null ? "–" : fmtPct(B.pct, true), [fmtEnergie(B.ecart, true), enjeu].filter(Boolean).join(" · "));
  const tDer = tuile(accT("Surconsommations en cours", "Ongoing overconsumptions"), String(d.nb),
    d.nb ? (d.cout3 != null ? fmtEuros(d.cout3 / 3, true) : fmtEnergie(d.wh3 / 3, true)) + Lg(" par mois si rien ne change", " per month if nothing changes") + (d.economies ? Lg(" · " + d.economies + " économie(s) en cours", " · " + d.economies + " saving(s) under way") : "")
      : d.economies ? Lg(d.economies + " économie(s) en cours", d.economies + " saving(s) under way") : accT("rien à signaler", "nothing to report"));
  let tAtt;
  if (A.ok) {
    const val = A.cout != null ? fmtEuros(prevRond(A.cout, A.coutDemi)) : fmtEnergie(prevRond(A.wh, (A.whHaut - A.whBas) / 2));
    tAtt = tuile(Lg("Atterrissage " + A.lib + " prévu", "Forecast landing " + A.lib), val,
      h("span", null, A.lignes.map(l => l.sr.energie + " " + l.txt).join(" · "), " ", h("button", { class: "lien", type: "button", onclick: () => aller("prevision") }, accT("détail", "details"))));
  } else tAtt = tuile(accT("Atterrissage de l'année", "Landing for the year"), "–", h("span", null,
    A.motif === "sans-site" ? accT("pas de compteur de niveau Site", "no site-level meter") : A.motif === "non-prevu" ? accT("fin d'année hors de l'horizon prévu", "year end beyond the forecast horizon") : accT("non calculé ici", "not computed here"), " ",
    accPage1("prevision") ? h("button", { class: "lien", type: "button", onclick: () => aller("prevision") }, accT("page Prévision", "Forecast page")) : null));
  const tQual = tuile(accT("Modèles de référence fiables", "Reliable baseline models"), Q.fiables + " / " + Q.total,
    (Q.r2Median != null ? Lg("R² médian ", "median R² ") + nf(Q.r2Median, 2) : "") + (Q.errMediane != null ? Lg(" · erreur ± ", " · error ± ") + fmtPct(Q.errMediane) : ""));
  const tuiles = h("div", { class: "tuiles acc-tuiles" }, tEcart, tDer, tAtt, tQual);
  // dérives qui coûtent le plus
  const top = d.liste.slice(0, 3);
  const derivesCarte = h("section", { class: "carte demi acc-top" }, h("div", { class: "carte-tete" }, h("h2", null, accT("Les dérives en cours qui coûtent le plus", "The costliest ongoing drifts"),
    h("span", { class: "sous" }, accT("coût par mois si l'écart moyen de l'épisode se maintient", "cost per month if the episode's average gap persists")))),
    top.length ? h("ol", { class: "acc-liste" }, top.map(x => h("li", null,
      h("div", { class: "acc-quoi" }, h("b", null, x.ep.serie), " ", h("span", { class: "badge" }, (x.ep.groupe === "site" ? "Site" : "UES") + " · " + x.ep.energie), x.instruit ? h("span", { class: "badge acc-fait" }, accT("fiche rédigée", "report written")) : null),
      h("div", { class: "acc-chiffres" }, h("span", { class: "acc-montant" }, x.euroMois != null ? fmtEuros(x.euroMois, true) : fmtEnergie(x.whMois, true)), Lg(" par mois · depuis ", " per month · since ") + x.ep.libDebut + " · " + fmtPct(x.ep.pct, true)),
      h("button", { class: "btn petit", type: "button", onclick: () => accInstruire(x.ep) }, x.instruit ? accT("Voir la fiche", "See the report") : accT("Instruire", "Investigate")))))
      : h("div", { class: "vide" }, accT("Aucune surconsommation en cours.", "No overconsumption under way."), " ", h("button", { class: "lien", type: "button", onclick: () => aller("derives") }, accT("Voir tous les épisodes", "See all episodes"))),
    d.liste.length > 3 ? h("button", { class: "lien", type: "button", onclick: () => { Object.assign(etat, { derSerie: "*", derEtat: "o" }); aller("derives"); } }, Lg("Les " + d.liste.length + " dérives en cours", "All " + d.liste.length + " ongoing drifts")) : null);
  const suiteCarte = h("section", { class: "carte demi acc-suite" }, h("div", { class: "carte-tete" }, h("h2", null, accT("Que faire ensuite", "What to do next"),
    h("span", { class: "sous" }, accT("dans l'ordre où l'état des données les rend utiles", "in the order the state of the data makes them useful")))),
    h("ol", { class: "acc-liste acc-actions" }, K.actions.map(x => h("li", { "data-action": x.id },
      h("div", { class: "acc-quoi" }, h("b", null, x.titre)), h("div", { class: "acc-chiffres" }, x.det),
      h("button", { class: "btn petit" + (x === K.actions[0] ? " principal" : ""), type: "button", onclick: x.faire }, x.bouton)))));
  const note = h("div", { class: "note" }, accT("Méthode : écart = réel − référence sur les 12 derniers mois des compteurs de niveau Site (à défaut, des UES) ; coût et CO₂e avec les hypothèses de la page Détection. Coût par mois d'une dérive en cours = projection sur 3 mois de la page Détection ÷ 3 : ce n'est pas une prévision. Atterrissage = page Prévision, réglages par défaut (dérive non prolongée), fourchette à 80 %. Modèle fiable : erreur renseignée et R² d'au moins 0,75.",
    "Method: gap = actual − baseline over the last 12 months of the site-level meters (otherwise the SEUs); cost and CO₂e use the Detection page's assumptions. Monthly cost of an ongoing drift = the Detection page's 3-month projection ÷ 3: it is not a forecast. Landing = Forecast page, default settings (drift not extended), 80% range. Reliable model: error filled in and R² of at least 0.75."));
  return [visite ? h("div", { class: "acc-outils" }, visite) : null, constat, tuiles, h("div", { class: "grille" }, derivesCarte, suiteCarte), note];
}

/* ---- 3. Bandeau « données fictives », sur chaque page tant que le site fictif est chargé ---- */
function accBandeau() {
  const tete = app.querySelector(".entete");
  if (!tete || !accFictif() || tete.querySelector(".acc-bandeau")) return;
  tete.append(h("div", { class: "acc-bandeau", role: "note" }, h("b", null, accT("Données fictives", "Fictitious data")),
    h("span", null, accT("site, compteurs et chiffres inventés par la page pour la démonstration", "site, meters and figures invented by the page for the demo")),
    h("button", { class: "lien", type: "button", onclick: () => accVisiteOuvrir(0) }, accT("Visite guidée", "Guided tour"))));
}

/* ---- 4. Visite guidée : six étapes de page en page, bulle ancrée, fond assombri autour de ce dont elle parle ----
   Elle ne lance aucune IA : l'étape « agent » s'appuie sur le mode démonstration, et ne fait rien si une IA est réglée. */
const accVisite = { ouverte: false, i: 0, etapes: [], dejaProposee: false, retour: null, voile: null, spot: null, bulle: null, ancre: null, horloge: null, ctx: null };
const accQ = sel => app.querySelector(sel);
function accVisiteEtapes() {
  const m = etat.modele, K = accCalcul(), ues = K.der.liste.find(x => x.ep.groupe === "ues") || K.der.liste[0] || null, ep = ues ? ues.ep : null;
  const site = m.series.find(x => x.groupe === "site" && ep && x.energie === ep.energie) || m.series.find(x => x.groupe === "site") || null;
  const nS = m.series.filter(x => x.groupe === "site").length, nU = m.series.length - nS;
  accVisite.ctx = { ep, site };
  const E = [
    { page: "ensemble", cible: () => accQ(".acc-synthese"), titre: () => accT("Où en est le site", "Where the site stands"),
      texte: () => Lg((accFictif() ? "Une usine inventée : " : "Le site : ") + nS + " compteur(s) général(aux) et " + nU + " usages suivis (UES). Cette phrase est calculée par la page : l'écart à la référence sur 12 mois, et ce que coûtent les dérives en cours.",
        (accFictif() ? "An invented plant: " : "The site: ") + nS + " main meter(s) and " + nU + " tracked uses (SEUs). This sentence is computed by the page: the gap to the baseline over 12 months, and what the ongoing drifts cost.") },
    { page: "derives", avant: () => { if (ep) { Object.assign(etat, { derSerie: ep.serie, derSens: "*", derEtat: "*" }); if (ep.fin < etat.de || ep.debut > etat.a) Object.assign(etat, { de: m.debut, a: m.fin }); } },
      cible: () => accQ(".constat"), titre: () => accT("La dérive qui coûte le plus", "The costliest drift"),
      texte: () => !ues ? accT("Aucune dérive en cours : la page Détection liste les épisodes passés, classés par écart.", "No ongoing drift: the Detection page lists past episodes, ranked by gap.")
        : Lg("« " + ep.serie + " » dépasse sa référence depuis " + ep.libDebut + " : " + (ues.euroMois != null ? fmtEuros(ues.euroMois) : fmtEnergie(ues.whMois)) + " par mois si rien ne change. Plus bas, la courbe des écarts cumulés (CUSUM) monte : une surconsommation qui dure, pas un accident.",
          "“" + ep.serie + "” has been above its baseline since " + ep.libDebut + ": " + (ues.euroMois != null ? fmtEuros(ues.euroMois) : fmtEnergie(ues.whMois)) + " per month if nothing changes. Further down, the cumulative gap (CUSUM) keeps rising: a lasting overconsumption, not an accident.") },
    { page: "agent", avant: () => {
        if (!ep || agent.enCours) return;
        if (agent.modele !== m) reinitialiserAgent(m);
        if (agent.episode && accCleEp(agent.episode) === accCleEp(ep) && zoneFiche.querySelector("dl")) return;   // fiche déjà rédigée : on la montre
        if (agent.demo) choisirEpisode(ep);                                // script de démonstration : ni IA ni réseau
        else { agent.episode = ep; agent.erreur = null; journal.replaceChildren(); zoneFiche.replaceChildren(); peindreAgent(); }
      },
      cible: () => zoneFiche.querySelector(".fiche dl") || zoneFiche.querySelector(".fiche") || accQ(".journal") || accQ(".chapeau"), titre: () => accT("Ce qu'en dit l'agent", "What the agent says"),
      texte: () => agent.demo ? accT("Un agent enquête avec des outils de lecture seule et rédige une fiche : causes probables, preuves chiffrées, vérifications à faire. Ici, un script de démonstration joue l'agent, sans IA ni réseau. Chaque nombre de la fiche est recherché dans les résultats d'outils ; un nombre introuvable est signalé.",
          "An agent investigates with read-only tools and writes a report: likely causes, figures as evidence, checks to make. Here a demo script plays the agent, with no AI and no network. Every number in the report is looked up in the tool results; a number that cannot be found is flagged.")
        : accT("Vous avez réglé une IA : la visite ne l'appelle pas. Cliquez « Lancer l'instruction » pour l'essayer sur cette dérive, ou choisissez le mode démonstration.", "You have set up an AI: the tour does not call it. Click “Run the investigation” to try it on this drift, or pick demo mode.") },
    { page: "prevision", avant: () => { if (site && typeof prevEtat !== "undefined") prevEtat.serie = site.nom; }, cible: () => accQ(".constat"), titre: () => accT("Ce qui va se passer", "What happens next"),
      texte: () => accT("La page Prévision estime l'atterrissage de l'année : réel déjà relevé, plus les semaines restantes calculées avec les facteurs des mêmes semaines passées, dans une fourchette à 80 %. Un test sur le passé dit si la méthode fait mieux qu'une méthode naïve.",
        "The Forecast page estimates the landing for the year: actuals already recorded, plus the remaining weeks computed with the variables of the same past weeks, within an 80% range. A test on past data says whether the method beats a naive one.") },
    { page: "evaluation", cible: () => accQ(".chapeau"), titre: () => accT("Comment on vérifie l'IA", "How the AI is checked"),
      texte: () => accT("Le banc d'évaluation pose à l'agent des questions dont la page calcule elle-même la réponse, y compris des pièges où il faut savoir s'abstenir. Il note chaque réponse et son coût : on mesure l'IA au lieu de la croire.",
        "The evaluation bench asks the agent questions whose answer the page computes itself, including traps where it must abstain. It scores every answer and its cost: the AI is measured instead of trusted.") },
    { page: "ensemble", cible: () => accQ(".acc-suite"), titre: () => accT("Et maintenant", "Now what"),
      texte: () => accT("La vue d'ensemble propose les prochaines actions, dans l'ordre que dicte l'état des données. La visite est finie : explorez librement, elle reste disponible dans le bandeau.",
        "The overview suggests the next actions, in the order the state of the data dictates. The tour is over: explore freely, it remains available in the banner.") }];
  return E.filter(x => accPage1(x.page));
}
function accVisiteOuvrir(i) {
  if (!etat.modele) return;
  const V = accVisite;
  V.dejaProposee = true;
  try { if (!etat.figee) localStorage.setItem(ACC_CLE_VISITE, "1"); } catch (e) {}
  V.etapes = accVisiteEtapes();
  if (!V.ouverte) {
    V.retour = document.activeElement;
    V.voile = h("div", { class: "acc-voile" }); V.spot = h("div", { class: "acc-spot", "aria-hidden": "true" });
    V.bulle = h("div", { class: "acc-bulle", role: "dialog", "aria-modal": "true", "aria-labelledby": "acc-visite-titre", "aria-describedby": "acc-visite-texte", tabindex: "-1" });
    document.body.append(V.voile, V.spot, V.bulle);
    document.addEventListener("keydown", accVisiteClavier, true);
    addEventListener("scroll", accVisitePlacer, { passive: true });
    V.horloge = setInterval(accVisitePlacer, 300);                        // le contenu bouge (fiche qui arrive, graphique redessiné) : la bulle suit
    V.ouverte = true;
  }
  accVisiteAller(Math.max(0, Math.min(i || 0, V.etapes.length - 1)));
}
function accVisiteAller(i) {
  const V = accVisite;
  if (!V.ouverte || i < 0 || i >= V.etapes.length) return;
  V.i = i; V.ancre = null;
  const E = V.etapes[i];
  if (E.avant) E.avant();
  if (!V.ouverte) return;
  aller(E.page);                                                         // aller() remonte en haut de page après le rendu :
  if (!V.ouverte) return;
  V.ancre = null;                                                         // l'élément visé doit être ramené à l'écran ensuite
  accVisitePeindre(true);
  accVisitePlacer();
}
function accVisitePeindre(focaliser) {
  const V = accVisite, E = V.etapes[V.i], dernier = V.i === V.etapes.length - 1;
  const avait = V.bulle.contains(document.activeElement);
  V.bulle.replaceChildren(
    h("div", { class: "acc-compte" }, Lg("Visite guidée · étape " + (V.i + 1) + " sur " + V.etapes.length, "Guided tour · step " + (V.i + 1) + " of " + V.etapes.length)),
    h("h2", { id: "acc-visite-titre" }, E.titre()),
    h("p", { id: "acc-visite-texte" }, E.texte()),
    h("div", { class: "acc-boutons" },
      dernier ? null : h("button", { class: "lien", type: "button", onclick: () => accVisiteFermer() }, accT("Passer la visite", "Skip the tour")),
      h("span", { class: "acc-espace" }),
      V.i > 0 ? h("button", { class: "btn", type: "button", onclick: () => accVisiteAller(V.i - 1) }, accT("Précédent", "Previous")) : null,
      h("button", { class: "btn principal", type: "button", onclick: () => dernier ? accVisiteFermer() : accVisiteAller(V.i + 1) }, dernier ? accT("Terminer", "Finish") : accT("Suivant", "Next"))));
  if (focaliser || avait) { const b = V.bulle.querySelector(".principal"); if (b) b.focus(); }
}
/* Place le projecteur sur l'élément visé et la bulle à côté. */
function accVisitePlacer() {
  const V = accVisite;
  if (!V.ouverte) return;
  const E = V.etapes[V.i];
  if (etat.onglet !== E.page || !etat.modele) { accVisiteFermer(); return; }  // la page a changé sous la visite : elle s'efface
  const el = E.cible ? E.cible() : null, etroit = innerWidth < 640;
  if (el && el !== V.ancre) {                                             // nouvel élément visé : on l'amène en haut de l'écran
    V.ancre = el;
    const r0 = el.getBoundingClientRect();
    if (r0.top < 60 || r0.top > innerHeight * (etroit ? 0.3 : 0.45)) scrollTo(0, Math.max(0, (window.scrollY || 0) + r0.top - (etroit ? 64 : 96)));
  }
  const r = el ? el.getBoundingClientRect() : null, bulle = V.bulle, bh = bulle.offsetHeight || 220, bw = bulle.offsetWidth || 380;
  const visible = r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  V.voile.classList.toggle("plein", !visible);
  V.spot.hidden = !visible;
  bulle.classList.toggle("acc-bas", etroit);
  let haut = 0, bas = 0;
  if (visible) {                                                          // un élément plus haut que l'écran : le projecteur s'arrête où commence la bulle
    haut = Math.max(4, r.top - 6); bas = Math.min(innerHeight - 4, r.bottom + 6);
    const place = innerHeight - bh - (etroit ? 24 : 40);
    if (bas > place && (etroit || bas - haut > place)) bas = Math.max(haut + 48, place);
    Object.assign(V.spot.style, { left: Math.max(4, r.left - 6) + "px", top: haut + "px", width: Math.min(innerWidth - 8, r.width + 12) + "px", height: Math.max(0, bas - haut) + "px" });
  }
  if (etroit) { Object.assign(bulle.style, { left: "", top: "" }); return; }   // à moins de 640 px, la bulle se pose en bas de l'écran (CSS)
  let top, left = visible ? Math.max(12, Math.min(r.left, innerWidth - bw - 12)) : innerWidth - bw - 24;
  if (!visible) top = innerHeight - bh - 24;
  else if (bas + 14 + bh < innerHeight - 8) top = bas + 14;
  else if (haut - 14 - bh > 8) top = haut - 14 - bh;
  else { top = innerHeight - bh - 16; left = innerWidth - bw - 16; }
  Object.assign(bulle.style, { left: left + "px", top: Math.max(8, top) + "px" });
}
function accVisiteFermer() {
  const V = accVisite;
  if (!V.ouverte) return;
  V.ouverte = false; clearInterval(V.horloge); V.horloge = null;
  document.removeEventListener("keydown", accVisiteClavier, true);
  removeEventListener("scroll", accVisitePlacer);
  for (const n of [V.voile, V.spot, V.bulle]) if (n) n.remove();
  V.voile = V.spot = V.bulle = V.ancre = null;
  const r = V.retour; V.retour = null;
  const cible = r && r.isConnected ? r : app.querySelector(".acc-bouton-visite") || app.querySelector(".entete h1");
  if (cible && cible.focus) { if (cible.tagName === "H1") cible.setAttribute("tabindex", "-1"); cible.focus(); }
}
/* Clavier : flèches pour avancer ou reculer, Échap pour sortir, Tab reste dans la bulle. */
function accVisiteClavier(e) {
  const V = accVisite;
  if (!V.ouverte) return;
  const k = e.key;
  if (k === "Escape") { e.preventDefault(); accVisiteFermer(); }
  else if (k === "ArrowRight") { e.preventDefault(); if (V.i < V.etapes.length - 1) accVisiteAller(V.i + 1); }
  else if (k === "ArrowLeft") { e.preventDefault(); if (V.i > 0) accVisiteAller(V.i - 1); }
  else if (k === "Tab") {
    const f = [...V.bulle.querySelectorAll("button")].filter(b => !b.disabled);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement), j = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length;
    e.preventDefault(); f[j].focus();
  }
}

/* ---- 5. Accroches ---- */
ICONES.ensemble = "M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z";
ajouterPage("Suivi", "ensemble", "Vue d'ensemble", "Vue d'ensemble", ICONES.ensemble, accPage);
(function accEnTete() {                                                   // première entrée du menu, et premier onglet
  const g = PAGES.find(x => x.groupe === "Suivi"), i = g.pages.findIndex(p => p[0] === "ensemble"), j = ONGLETS.findIndex(p => p[0] === "ensemble");
  g.pages.unshift(g.pages.splice(i, 1)[0]); ONGLETS.unshift(ONGLETS.splice(j, 1)[0]);
})();
/* Après chaque chargement : la vue d'ensemble, sauf au premier chargement si l'adresse demande une page (lien direct, copie figée rechargée). */
AU_CHARGEMENT.push(m => {
  accMemo = null; accInstruits = new Set();
  if (accVisite.ouverte) accVisiteFermer();
  const voulu = new URLSearchParams(location.hash.slice(1)).get("onglet");
  if (!(accPremier && voulu && ONGLETS.some(o => o[0] === voulu))) etat.onglet = "ensemble";
  accPremier = false;
});
APRES_RENDU.push(() => {
  accBandeau(); accNoterInstruits();
  if (accVisite.ouverte) { if (etat.onglet !== accVisite.etapes[accVisite.i].page) accVisiteFermer(); else { accVisitePeindre(false); accVisitePlacer(); } }
});
ajouterTraductions([["Vue d'ensemble", "Overview"]]);
