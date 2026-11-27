/* Tests du module « Accueil » : site fictif, vue d'ensemble, visite guidée.
   Lancer : python3 outillage/assembler.py idee-10-accueil/essai.html $(cat outillage/ordre-modules.txt) && node outillage/banc.js idee-10-accueil/essai.js idee-10-accueil/test.js */
verifier.bavard = false;
const pause = ms => new Promise(ok => setTimeout(ok, ms));
const repos = async () => { for (let k = 0; k < 400 && agent.enCours; k++) await pause(20); };
const texteApp = () => texteDe(app);
const touche = key => accVisiteClavier({ key, shiftKey: false, preventDefault() {} });
const dansCorps = sel => document.body.querySelectorAll(sel).length;

/* ---- 1. Classeur réel (chargé par le banc) : vue d'ensemble en tête, et ses chiffres contre ceux des pages d'origine ---- */
function comparerAuxPages(nomJeu) {
  const m = etat.modele, K = accCalcul();
  // Détection, filtres par défaut : même nombre de surconsommations en cours, même coût sur 3 mois
  Object.assign(etat, { derSerie: "*", derSens: "*", derEtat: "*", de: m.debut, a: m.fin, onglet: "derives" }); rendre();
  const tD = texteApp();
  if (K.der.nb) verifier(tD.includes(pluriel(K.der.nb, "surconsommation")), nomJeu + " : la Détection compte aussi " + K.der.nb + " surconsommation(s) en cours");
  if (K.der.cout3 != null) verifier(tD.includes(fmtEuros(K.der.cout3)), nomJeu + " : coût sur 3 mois identique à la Détection (" + fmtEuros(K.der.cout3) + ")");
  // Prévision, réglages par défaut : même atterrissage, compteur par compteur
  if (K.att.ok) for (const l of K.att.lignes) {
    Object.assign(prevEtat, { serie: l.sr.nom, horizon: 3, derive: false, cumul: "annee" }); etat.onglet = "prevision"; rendre();
    verifier(texteApp().includes(l.txt), nomJeu + " : atterrissage de « " + l.sr.nom + " » identique à la Prévision (" + l.txt + ")");
  }
  // Écart sur 12 mois : recalcul indépendant avec totalPeriode du coeur, sur la même fenêtre
  const B = K.bilan, series = m.series.filter(x => x.groupe === B.niveau && x.nbPoints);
  Object.assign(etat, { de: B.de, a: m.fin });
  const ecart = somme(series.map(sr => { const ok = sr.conso.map((v, j) => v != null && sr.ref[j] != null); return (totalPeriode(sr.conso.map((v, j) => ok[j] ? v : null)) || 0) - (totalPeriode(sr.ref.map((v, j) => ok[j] ? v : null)) || 0); }));
  verifier(Math.abs(ecart - B.ecart) <= 1e-6 * Math.max(1, Math.abs(ecart)), nomJeu + " : écart sur 12 mois recalculé avec totalPeriode");
  Object.assign(etat, { de: m.debut, a: m.fin });
  // qualité : comptée à la main
  const D = derives(), fiables = D.analyses.filter(A => A.ok && A.serie.r2 != null && A.serie.r2 >= 0.75).length;
  verifier(K.qualite.fiables === fiables && K.qualite.total === m.series.length, nomJeu + " : modèles fiables " + fiables + " / " + m.series.length);
  // la page affiche ces chiffres
  etat.onglet = "ensemble"; rendre();
  const t = texteApp();
  verifier(t.includes(K.qualite.fiables + " / " + K.qualite.total) && (B.pct == null || t.includes(fmtPct(B.pct, true))), nomJeu + " : la vue d'ensemble affiche ses indicateurs");
  return K;
}
verifier(etat.onglet === "ensemble", "après le chargement du classeur, la vue d'ensemble s'affiche");
verifier(PAGES[0].groupe === "Suivi" && PAGES[0].pages[0][0] === "ensemble" && ONGLETS[0][0] === "ensemble", "Vue d'ensemble en tête du menu et des onglets");
rendre();
verifier(!/Données fictives/.test(texteApp()) && !accFictif(), "classeur réel : pas de bandeau « données fictives »");
verifier(!trouver(app, n => n.classList.contains("acc-bouton-visite")).length, "classeur réel : pas de bouton de visite");
comparerAuxPages("classeur réel");

async function test() {
  /* ---- 2. Accueil : le bouton d'essai est au-dessus du choix de fichier, et il est seul en bouton principal ---- */
  const modeleReel = etat.modele;
  etat.modele = null; rendre();
  const tA = texteApp(), principaux = trouver(app, n => n.tagName === "BUTTON" && n.classList.contains("principal"));
  verifier(tA.indexOf("Essayer avec un site fictif") >= 0 && tA.indexOf("Essayer avec un site fictif") < tA.indexOf("Choisir le classeur Excel"), "accueil : « Essayer avec un site fictif » au-dessus du choix de fichier");
  verifier(principaux[0] && principaux[0].textContent === "Essayer avec un site fictif", "accueil : le premier bouton principal est l'essai");
  verifier(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Choisir le classeur Excel")[0].className === "btn", "accueil : le choix du classeur devient un bouton secondaire");
  verifier(principaux.length === 1, "accueil : un seul bouton principal (" + principaux.map(n => n.textContent).join(", ") + ")");
  verifier(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Choisir un fichier de données")[0].className === "btn", "accueil : le choix d'un fichier brut (Intégration) est un bouton secondaire");
  const bProjet = trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Ouvrir un projet")[0];
  let ouvert = 0; cntChoixProjet.click = () => { ouvert++; };      // cntChoisirProjet() ouvre le sélecteur de projet du module Continuité
  if (bProjet) cliquer(bProjet);
  delete cntChoixProjet.click;
  verifier(bProjet && bProjet.className === "btn" && ouvert === 1, "accueil : « Ouvrir un projet », bouton secondaire, appelle cntChoisirProjet()");
  etat.modele = modeleReel;

  /* ---- 3. Le site fictif est identique d'un chargement à l'autre ---- */
  const g1 = JSON.stringify(accGrilles("fr").grilles), g2 = JSON.stringify(accGrilles("fr").grilles);
  verifier(g1 === g2, "deux fabrications donnent les mêmes grilles (" + g1.length + " caractères)");
  try { localStorage.removeItem(ACC_CLE_VISITE); } catch (e) {}
  accVisite.dejaProposee = false;
  etat.modele = null; rendre();
  cliquer(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Essayer avec un site fictif")[0]);
  const m = etat.modele, N = ACC.noms.fr;
  verifier(accFictif() && etat.fichier === N.fichier && JSON.stringify(grillesChargees) === g1, "le clic charge le site fictif, identique à la fabrication");
  verifier(m.alertes.length === 0, "aucune alerte de cohérence sur les grilles fabriquées : " + m.alertes.join(" | "));
  verifier(m.series.length === 8 && m.series.filter(x => x.groupe === "site").length === 2 && m.facteurs.length === 3 && m.dates.length === ACC.semaines, "2 compteurs généraux, 6 UES, 3 facteurs, " + ACC.semaines + " semaines");
  verifier(m.series.every(x => x.pas === "week" && x.r2 > 0.8), "pas hebdomadaire, modèles calés (R² > 0,8)");
  verifier(etat.onglet === "ensemble", "site fictif : la vue d'ensemble s'affiche");
  verifier(accVisite.ouverte && accVisite.i === 0 && dansCorps(".acc-bulle") === 1, "premier chargement : la visite s'ouvre d'elle-même");
  accVisiteFermer();
  verifier(!accVisite.ouverte && dansCorps(".acc-bulle") === 0 && dansCorps(".acc-voile") === 0, "Passer : la visite disparaît de la page");
  const resume = () => JSON.stringify(derives().episodes.map(ep => [ep.serie, ep.debut, ep.n, Math.round(ep.ecart)]));
  const r1 = resume(); accCharger(); const r2 = resume();
  verifier(r1 === r2, "second chargement : mêmes épisodes de dérive");
  verifier(!accVisite.ouverte, "second chargement : la visite n'est pas reproposée d'elle-même");

  /* ---- 4. Les histoires du site fictif se voient ---- */
  const D = derives(), A = nom => D.analyses.find(a => a.serie.nom === nom), epDe = nom => D.episodes.filter(ep => ep.serie === nom);
  const air = epDe(N.air).find(ep => ep.ouvert && ep.ecart > 0);
  verifier(air && air.debut >= ACC.fuite - 14 * JOUR, "dérive en cours détectée sur « " + N.air + " » depuis l'apparition des fuites");
  const K = accCalcul(), premiereUes = K.der.liste.find(x => x.ep.groupe === "ues");
  verifier(premiereUes && premiereUes.ep === air && premiereUes.euroMois > 1000, "c'est l'UES en dérive qui coûte le plus : " + (premiereUes && fmtEuros(premiereUes.euroMois)) + " par mois");
  const siteE = epDe(N.siteElec).find(ep => ep.ouvert && ep.ecart > 0), dec = siteE && decomposerSite(siteE);
  verifier(siteE && dec.reste > 0.4 * siteE.ecart, "usage non suivi : plus de 40 % de l'écart en cours du compteur général n'est expliqué par aucune UES (" + (dec && fmtPct(dec.reste / siteE.ecart)) + ")");
  const sansUes = m.dates.every((t, j) => m.series.filter(x => x.groupe === "ues" && x.energie === N.elec).reduce((s0, x) => s0 + x.conso[j], 0) < m.series.find(x => x.nom === N.siteElec).conso[j]);
  verifier(sansUes, "la somme des UES électriques reste sous le compteur général chaque semaine");
  const eco = epDe(N.chauffe).find(ep => ep.ecart < 0 && ep.debut >= ACC.action - 7 * JOUR && ep.pct < -0.05);
  verifier(!!eco, "économie détectée sur « " + N.chauffe + " » après l'action du " + fmtDate(ACC.action) + (eco ? " : " + fmtPct(eco.pct, true) : ""));
  verifier(epDe(N.chauffe).filter(ep => ep.ecart < 0 && ep.debut < ACC.action - 7 * JOUR).length === 0, "pas d'économie sur la chaufferie avant l'action");
  const af = A(N.four), iAb = af.S.debuts.findIndex(t => t === ACC.aberrante), zAutres = af.z.filter((z, i) => z != null && i !== iAb).map(Math.abs);
  verifier(iAb >= 0 && af.z[iAb] > 10 && Math.max(...zAutres) < 6, "semaine aberrante : z = " + nf(af.z[iAb], 1) + " sur la semaine du relevé faux, |z| < 6 ailleurs");
  verifier(epDe(N.siteGaz).every(ep => !(ep.debut <= ACC.aberrante && ep.fin >= ACC.aberrante && ep.ecart > 0)), "le relevé faux du four n'atteint pas le compteur général gaz");
  verifier(K.actions[0].id === "instruire" && K.actions.some(a => a.id === "non-suivi"), "que faire : instruire d'abord, puis chercher l'usage non suivi (" + K.actions.map(a => a.id).join(", ") + ")");
  const ph = accPhrase(K);
  verifier(/^Sur les 12 derniers mois, le site consomme .* que sa référence/.test(ph) && ph.includes(fmtEuros(K.der.cout3 / 3)), "phrase de synthèse : " + ph);

  /* ---- 5. Chiffres de la vue d'ensemble contre ceux des pages d'origine, sur le site fictif ---- */
  comparerAuxPages("site fictif");
  verifier(K.att.ok && K.att.lignes.length === 2, "atterrissage de l'année calculé pour les deux compteurs généraux");

  /* ---- 6. Toutes les pages se rendent sur le site fictif, en français et en anglais, avec le bandeau ---- */
  for (const [langue, bandeau] of [["fr", "Données fictives"], ["en", "Fictitious data"]]) {
    LANGUE = langue; CACHE_TR.clear(); cacheDerives = null;
    for (const o of ONGLETS) {
      let ok = true;
      try { etat.onglet = o[0]; rendre(); } catch (e) { ok = false; console.log(e); }
      const t = texteApp();
      verifier(ok && t.length > 300 && t.includes(bandeau), langue + " : la page « " + o[0] + " » se rend avec le bandeau « " + bandeau + " »");
    }
    etat.onglet = "ensemble"; rendre();
    verifier(texteApp().includes(langue === "en" ? "What to do next" : "Que faire ensuite"), langue + " : vue d'ensemble traduite");
  }
  LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null;
  etat.onglet = "ensemble"; rendre();

  /* ---- 7. Visite guidée : étapes, retour arrière, sortie ---- */
  const air2 = derives().episodes.find(ep => ep.serie === N.air && ep.ouvert);
  accVisiteOuvrir(0);
  const V = accVisite;
  verifier(V.etapes.map(e => e.page).join(",") === "ensemble,derives,agent,prevision,evaluation,ensemble", "six étapes : " + V.etapes.map(e => e.page).join(", "));
  verifier(V.bulle.getAttribute("role") === "dialog" && V.bulle.getAttribute("aria-modal") === "true", "la bulle est une boîte de dialogue modale");
  const boutonsBulle = () => trouver(V.bulle, n => n.tagName === "BUTTON").map(b => b.textContent);
  verifier(boutonsBulle().join("|") === "Passer la visite|Suivant", "étape 1 : Passer et Suivant, pas de Précédent");
  verifier(!V.spot.hidden && V.ancre && V.ancre.classList.contains("acc-synthese"), "étape 1 : le projecteur vise la phrase de synthèse");
  touche("ArrowRight");
  verifier(V.i === 1 && etat.onglet === "derives" && etat.derSerie === N.air, "flèche droite : page Dérives, sur « " + N.air + " »");
  verifier(texteDe(V.bulle).includes(N.air) && texteDe(V.bulle).includes(fmtEuros(premiereUes.euroMois)), "étape 2 : la bulle cite la dérive et son coût mensuel");
  verifier(V.ancre && V.ancre.classList.contains("constat"), "étape 2 : le projecteur vise le constat de la page Dérives");
  // le titre dit ce que la visite montre : l'usage le plus coûteux, pas la plus lourde des dérives du constat (le compteur général)
  const lourde = drvConstat(derives()).lourde, tB = texteDe(V.bulle);
  verifier(lourde && lourde.serie === N.siteElec && texteDe(V.bulle.querySelector("h2")) === "L'usage dont la dérive coûte le plus" && !/La dérive qui coûte le plus/.test(tB),
    "étape 2 : titre « L'usage dont la dérive coûte le plus » (le constat nomme « " + (lourde && lourde.serie) + " »)");
  verifier(tB.includes("En tête, la plus lourde est « " + N.siteElec + " », au compteur général.") && tB.includes("Parmi les usages suivis, « " + N.air + " » coûte le plus"), "étape 2 : la bulle distingue la plus lourde du constat et l'usage suivi");
  verifier(/Sa ligne s'ouvre plus bas ; la courbe des écarts cumulés \(CUSUM\), sous « Courbes », monte/.test(tB), "étape 2 : la courbe CUSUM est annoncée sous « Courbes »");
  verifier(drv.ouverte === veiCle(air2) && !!app.querySelector(".drv-item.ouverte") && !agent.enCours, "étape 2 : la ligne de la dérive suivie est ouverte, sans instruction lancée");
  touche("ArrowRight");
  verifier(V.i === 2 && etat.onglet === "agent" && agent.episode === air2, "étape 3 : page Instruction, sur la dérive de « " + N.air + " »");
  await repos();
  verifier(agent.demo && zoneFiche.querySelector("dl") && journal.childNodes.length > 0, "étape 3 : fiche rédigée par le script de démonstration");
  verifier(/script de démonstration/.test(texteDe(zoneFiche)), "étape 3 : la fiche dit venir du script, pas d'une IA");
  accVisitePlacer();
  verifier(V.ancre && V.ancre.tagName === "DL" && zoneFiche.contains(V.ancre), "étape 3 : le projecteur passe sur la fiche quand elle arrive");
  const journalAvant = journal.childNodes[0];
  touche("ArrowLeft");
  verifier(V.i === 1 && etat.onglet === "derives", "flèche gauche : retour à la Détection");
  cliquer(trouver(V.bulle, n => n.tagName === "BUTTON" && n.textContent === "Suivant")[0]);
  verifier(V.i === 2 && !agent.enCours && journal.childNodes[0] === journalAvant, "retour sur l'étape 3 : la fiche déjà rédigée n'est pas refaite");
  touche("ArrowRight");
  verifier(V.i === 3 && etat.onglet === "prevision" && prevEtat.serie === N.siteElec, "étape 4 : Prévision du compteur général de la même énergie");
  touche("ArrowRight");
  verifier(V.i === 4 && etat.onglet === "evaluation" && V.ancre && V.ancre.classList.contains("evl-reponse"), "étape 5 : banc d'évaluation, éclairé sur sa réponse");
  cliquer(trouver(V.bulle, n => n.tagName === "BUTTON" && n.textContent === "Précédent")[0]);
  verifier(V.i === 3 && etat.onglet === "prevision", "bouton Précédent : retour à la Prévision");
  touche("ArrowRight"); touche("ArrowRight");
  verifier(V.i === 5 && etat.onglet === "ensemble" && boutonsBulle().join("|") === "Précédent|Terminer", "dernière étape : Précédent et Terminer, sans Passer");
  verifier(V.ancre && V.ancre.classList.contains("acc-suite"), "dernière étape : le projecteur vise « Que faire ensuite »");
  touche("ArrowRight");
  verifier(V.i === 5 && V.ouverte, "flèche droite sur la dernière étape : rien ne se passe");
  cliquer(trouver(V.bulle, n => n.tagName === "BUTTON" && n.textContent === "Terminer")[0]);
  verifier(!V.ouverte && dansCorps(".acc-bulle") === 0, "Terminer ferme la visite");
  accVisiteOuvrir(2);
  touche("Escape");
  verifier(!V.ouverte && dansCorps(".acc-spot") === 0, "Échap ferme la visite");
  accVisiteOuvrir(0);
  aller("site");
  verifier(!V.ouverte && dansCorps(".acc-bulle") === 0, "la visite s'efface quand la page change sous elle");
  accVisiteOuvrir(0);
  LANGUE = "en"; CACHE_TR.clear(); rendre();
  verifier(V.ouverte && texteDe(V.bulle).includes("Where the site stands") && texteDe(V.bulle).includes("Next"), "la bulle suit le changement de langue");
  LANGUE = "fr"; CACHE_TR.clear(); rendre();
  const largeur = innerWidth; innerWidth = 390; accVisitePlacer();
  verifier(V.bulle.classList.contains("acc-bas"), "à 390 px, la bulle se pose en bas de l'écran");
  innerWidth = largeur; accVisitePlacer();
  verifier(!V.bulle.classList.contains("acc-bas"), "sur grand écran, la bulle est ancrée à côté de l'élément");
  accVisiteFermer();
  // une IA réglée : la visite ne l'appelle pas
  reinitialiserAgent(etat.modele); agent.demo = false;
  accVisiteOuvrir(2);
  verifier(V.ouverte && etat.onglet === "agent" && !agent.enCours && !zoneFiche.querySelector("dl") && agent.episode === derives().episodes.find(ep => ep.serie === N.air && ep.ouvert), "IA réglée : l'étape 3 montre la dérive sans rien lancer");
  verifier(/la visite ne l'appelle pas/.test(texteDe(V.bulle)), "IA réglée : la bulle le dit");
  accVisiteFermer(); agent.demo = true;

  /* ---- 8. « Que faire ensuite » suit l'état ---- */
  etat.onglet = "ensemble"; rendre();
  let k1 = accCalcul();
  verifier(k1.actions[0].id === "instruire" && k1.actions[0].ep.serie === N.siteElec, "avant toute fiche : instruire d'abord la dérive la plus coûteuse (" + k1.actions[0].ep.serie + ")");
  cliquer(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Instruire")[0]);
  verifier(etat.onglet === "agent" && agent.episode && agent.episode.serie === N.siteElec, "le bouton Instruire mène à l'instruction de la dérive");
  await repos();
  aller("ensemble");
  k1 = accCalcul();
  verifier(k1.der.liste.filter(x => x.instruit).length === 2, "les deux dérives instruites sont marquées « fiche rédigée »");
  verifier(k1.actions[0].id === "non-suivi", "fiches rédigées : l'action suivante passe en tête (" + k1.actions.map(a => a.id).join(", ") + ")");
  verifier(texteApp().includes("fiche rédigée"), "la page affiche « fiche rédigée »");
  const garde = rev.revue; rev.revue = { factice: true };
  verifier(!accCalcul().actions.some(a => a.id === "revue"), "une revue rédigée retire l'action « Rédiger la revue »");
  rev.revue = garde;
  cliquer(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Voir la décomposition")[0]);
  verifier(etat.onglet === "derives" && etat.derSerie === N.siteElec && texteApp().includes("Dérives du site : ce que les UES expliquent"), "« Voir la décomposition » ouvre la page Dérives sur le compteur général");
  // la page Détection n'existe plus : la vue d'ensemble renvoie à la page Dérives, dans les deux langues
  for (const [l, re, mauvais] of [["fr", /chaque chiffre vient des pages Dérives et Prévision/, /Détection/], ["en", /every figure comes from the Drifts and Forecast pages/, /Detection/]]) {
    LANGUE = l; CACHE_TR.clear(); aller("ensemble");
    const tE = texteApp() + texteDe(trouver(app, n => n.tagName === "DETAILS"));
    verifier(re.test(tE) && !mauvais.test(tE), l + " : la vue d'ensemble cite la page Dérives, plus la Détection");
  }
  LANGUE = "fr"; CACHE_TR.clear(); aller("ensemble");
  { const g = { demo: agent.demo, revue: rev.revue, passes: evl.passes }; agent.demo = false; rev.revue = { factice: true }; evl.passes = [{}];
    const a0 = accActions(Object.assign({}, accCalcul(), { der: { liste: [], sites: [] }, qualite: { faibles: [] } }));
    agent.demo = g.demo; rev.revue = g.revue; evl.passes = g.passes;
    verifier(a0.length === 1 && a0[0].id === "derives" && a0[0].titre === "Parcourir les dérives" && a0[0].bouton === "Ouvrir les dérives", "rien d'urgent : « Parcourir les dérives » et « Ouvrir les dérives »"); }
  // le nom d'une dérive de la carte « coûtent le plus » ouvre son détail, sans lancer d'instruction
  const kTop = accCalcul().der.liste[1], episodeAvant = agent.episode;
  const nomTop = trouver(app.querySelector(".acc-top"), n => n.tagName === "BUTTON" && n.textContent === kTop.ep.serie)[0];
  verifier(nomTop && nomTop.classList.contains("lien"), "carte « coûtent le plus » : le nom de la dérive est un lien");
  cliquer(nomTop);
  verifier(etat.onglet === "derives" && drv.ouverte === veiCle(kTop.ep) && !!app.querySelector(".drv-item.ouverte") && !agent.enCours && agent.episode === episodeAvant,
    "clic sur le nom : page Dérives, « " + kTop.ep.serie + " » dépliée sous sa ligne, aucune instruction lancée");
  // « Régler l'IA » ouvre le panneau d'IA
  const gardeRevue = rev.revue; rev.revue = { factice: true }; agent.demo = true; aller("ensemble");
  const regler = trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Régler l'IA")[0];
  if (regler) cliquer(regler);
  verifier(regler && !!iaDialogue && etat.onglet === "ensemble", "« Régler l'IA » ouvre le panneau des réglages d'IA, sans changer de page");
  iaFermer(); rev.revue = gardeRevue;

  /* ---- 9. En anglais : noms anglais, hypothèses de prix pour « Gas » ---- */
  LANGUE = "en"; CACHE_TR.clear(); accCharger();
  verifier(etat.fichier === ACC.noms.en.fichier && etat.modele.series.some(x => x.nom === "Compressed air") && etat.modele.energies.join(",") === "Electricity,Gas", "chargé en anglais : noms anglais");
  verifier(valoDe("Gas").prix != null && valoDe("Gas").fe != null, "« Gas » reçoit les hypothèses de prix et de carbone du gaz");
  const kEn = accCalcul();
  verifier(kEn.der.cout3 != null && kEn.att.ok && /^Over the last 12 months, the site uses/.test(accPhrase(kEn)), "synthèse en anglais : " + accPhrase(kEn));
  verifier(texteApp().includes("Fictitious data"), "bandeau en anglais");
  LANGUE = "fr"; CACHE_TR.clear();

  /* ---- 10. Lien direct : au premier chargement, la page demandée dans l'adresse est respectée ---- */
  accPremier = true; location.hash = "#onglet=derives"; accCharger();
  verifier(etat.onglet === "derives", "premier chargement avec #onglet=derives : la Détection");
  accCharger();
  verifier(etat.onglet === "ensemble", "chargements suivants : la vue d'ensemble");
  location.hash = "";

  verifier(__reseau.length === 0, "aucun appel réseau");
}
