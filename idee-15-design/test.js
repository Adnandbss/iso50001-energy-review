/* Tests du module « Design » : thème Lumière (jetons et contrastes), barre de question (démonstration, question libre, faux modèle, accord),
   gain « si on corrige » et colonne de gain du tableau, comparés aux calculs de la Prévision et de la projection.
   Lancer : python3 outillage/assembler.py assemble.html $(cat outillage/ordre-modules.txt) && node outillage/banc.js assemble.js idee-15-design/test.js */
verifier.bavard = false;
const pause = ms => new Promise(ok => setTimeout(ok, ms));
const finQuestion = async () => { for (let k = 0; k < 500 && dsn.enCours; k++) await pause(10); };
const texteApp = () => texteDe(app);
const boutons = (racine, texte) => trouver(racine, n => n.tagName === "BUTTON" && n.textContent === texte);

/* ---- 1. Thème : chaque jeton en clair et en sombre, feuille posée, polices système, contrastes AA ---- */
const C = DSN_THEME.clair, S = DSN_THEME.sombre, couleurs = Object.keys(C).filter(k => !k.startsWith("f-"));
verifier(couleurs.every(k => k in S) && Object.keys(S).every(k => k in C), "chaque jeton de couleur existe en clair et en sombre (" + couleurs.length + ")");
const attendus = ["plan", "surface", "creux", "encre", "encre2", "muet", "grille", "axe", "bord", "voile", "signal", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "plus", "moins", "contexte", "neutre", "bon", "critique", "alerte",
  "dsn-accent", "dsn-accent-texte", "dsn-accent-pale", "dsn-vert", "dsn-vert-pale", "dsn-rouge", "dsn-rouge-pale", "dsn-halo"];
verifier(attendus.every(k => k in C && k in S), "les variables des graphiques (--s1…--s8, --plus, --moins…) et du thème sont redéfinies dans les deux thèmes");
verifier(C.plan === "#f6f8fc" && C["dsn-accent"] === "#3f55e0" && C.s1 === C["dsn-accent"], "fond très clair bleuté, accent indigo, première série à l'accent");
const feuille = document.getElementById("dsn-theme"), tf = texteDe(feuille);
verifier(feuille && feuille.parentNode === document.head && tf.includes("@media (prefers-color-scheme: dark)") && tf.includes("--s1:" + C.s1) && tf.includes("--s1:" + S.s1) && tf.includes("color-scheme:dark"), "feuille du thème posée dans la page, sombre selon prefers-color-scheme");
verifier(/^-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter/.test(C["f-texte"]) && !/url\(|@import|https?:|@font-face/.test(tf), "polices du système, aucune ressource externe");
const lum = x => { const c = x.replace("#", "").match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const couples = [["encre", "surface"], ["encre", "plan"], ["encre2", "surface"], ["encre2", "plan"], ["encre2", "creux"], ["encre2", "dsn-tete"], ["muet", "surface"], ["muet", "plan"], ["muet", "creux"],
  ["dsn-accent-texte", "surface"], ["dsn-accent-texte", "plan"], ["dsn-accent-texte", "dsn-accent-pale"], ["dsn-sur-accent", "dsn-accent"], ["dsn-vert", "surface"], ["dsn-vert", "dsn-vert-pale"], ["dsn-rouge", "dsn-rouge-pale"], ["bon", "surface"], ["critique", "surface"]];
for (const [nom, T] of [["clair", C], ["sombre", S]]) {
  const faibles = couples.filter(([a, b]) => contraste(T[a], T[b]) < 4.5).map(([a, b]) => a + "/" + b + " " + contraste(T[a], T[b]).toFixed(2));
  verifier(!faibles.length, nom + " : contrastes AA (4,5:1) des textes sur leurs fonds" + (faibles.length ? " — trop faibles : " + faibles.join(", ") : ""));
  const traits = ["s1", "plus", "moins", "contexte"].filter(k => contraste(T[k], T.surface) < 3);
  verifier(!traits.length, nom + " : traits principaux des graphiques à 3:1 au moins sur la carte" + (traits.length ? " — " + traits.join(", ") : ""));
}
// marque et unité des tuiles
rendre();
verifier(trouver(app, n => n.classList.contains("marque"))[0] && trouver(app, n => n.classList.contains("dsn-logo")).length === 1, "la marque (jauge) est dans le menu latéral");
const u = dsnUnite("5,41 GWh");
verifier(Array.isArray(u) && u.map(n => n.textContent).join("") === "5,41 GWh" && u[1].tagName === "SMALL", "tuile : l'unité passe en petit, le texte reste « 5,41 GWh »");
verifier(dsnUnite("8 / 8") === "8 / 8" && dsnUnite("–") === "–", "tuile : « 8 / 8 » et « – » restent entiers");

/* ---- 2. Gain « si on corrige », contre les calculs de la Prévision et de la projection ---- */
function verifierGains(jeu) {
  aller("ensemble");
  const K = accCalcul(), m = etat.modele;
  verifier(K.der.liste.length > 0, jeu + " : des dérives en cours à corriger");
  for (const x of K.der.liste) {
    const G = dsnGain(x.ep), sr = m.series.find(s0 => s0.nom === x.ep.serie);
    if (G.methode === "prevision") {
      const obs = prevObs(sr), o = obs[obs.length - 1], n = PREV.periodes[12][sr.pas];
      const a = somme(prevPrevoir(sr, o, n, true).periodes.map(p => p.central)), b = somme(prevPrevoir(sr, o, n, false).periodes.map(p => p.central));
      verifier(G.n === n && Math.abs(G.wh - (a - b)) < 1e-6 * Math.max(1, a) && Math.abs(G.wh - G.pct * b) < 1e-6 * Math.max(1, a), jeu + " · " + x.ep.serie + " : gain = Prévision dérive prolongée − dérive arrêtée sur 12 mois (" + fmtEnergie(G.wh) + ")");
      verifier(prevHorizons(sr).find(h0 => h0.mois === 12).motif == null && prevDerive(sr, o).depuis === x.ep.libDebut, jeu + " · " + x.ep.serie + " : la Prévision permet 12 mois et voit la même dérive");
    } else verifier(Math.abs(G.wh - projectionDe(x.ep).parPeriode * PREV.periodes[12][G.pas]) < 1e-6, jeu + " · " + x.ep.serie + " : gain = projection simple sur 12 mois");
    verifier(G.euro === coutDe(x.ep.energie, G.wh) && G.co2 === co2De(x.ep.energie, G.wh) && G.wh > 0, jeu + " · " + x.ep.serie + " : euros et CO₂e avec les hypothèses de la page");
    // la projection, étendue à 12 mois, vaut quatre fois la projection sur 3 mois de la page Dérives (pas hebdomadaire ou mensuel)
    const P = dsnGainProjection(x.ep);
    if (P.pas === "week" || P.pas === "month") verifier(Math.abs(P.wh - 4 * projectionDe(x.ep).wh3mois) < 1e-6 * Math.max(1, P.wh), jeu + " · " + x.ep.serie + " : projection sur 12 mois = 4 × projection sur 3 mois de la page Dérives");
  }
  // la page : la colonne de gain et la carte « si on corrige » affichent ces chiffres
  rendre();
  const table = trouver(app, n => n.classList.contains("acc-table"))[0], t = texteDe(table);
  verifier(table && t.includes("Gain si corrigée (12 mois)") && K.der.liste.every(x => { const G = dsnGain(x.ep); return t.includes(G.euro != null ? fmtEuros(G.euro) : fmtEnergie(G.wh)) && t.includes(dsnNomMethode(G)); }), jeu + " : colonne « Gain si corrigée (12 mois) », avec la méthode nommée, pour chaque dérive");
  const carte = trouver(app, n => n.classList.contains("dsn-corrige"))[0], G0 = dsnGain(K.der.liste[0].ep);
  verifier(carte && texteDe(carte).includes("Si on corrige « " + K.der.liste[0].ep.serie + " »") && texteDe(carte).includes(fmtEuros(G0.euro)) && texteDe(carte).includes(fmtCO2(G0.co2)), jeu + " : « Si on corrige » porte sur la dérive qui coûte le plus, gain en euros et en CO₂e");
  const svg = trouver(carte, n => n.tagName === "SVG")[0];
  verifier(svg && trouver(svg, n => n.tagName === "PATH").length >= 3 && /si la dérive cesse|si l'écart cesse/.test(texteDe(carte)) && texteDe(carte).includes("si rien ne change"), jeu + " : graphique « si rien ne change » contre « si la dérive cesse », écart entre les deux");
  // tri par gain, puis choix de la dérive montrée dans « si on corrige »
  if (K.der.liste.length > 1) {
    cliquer(trouver(app, n => n.classList.contains("acc-tri"))[0]);
    const noms = trouver(trouver(app, n => n.classList.contains("acc-table"))[0], n => n.tagName === "BUTTON" && n.classList.contains("acc-nom")).map(b => b.textContent);
    const voulu = K.der.liste.slice().sort((a, b) => (dsnGain(b.ep).euro ?? dsnGain(b.ep).wh) - (dsnGain(a.ep).euro ?? dsnGain(a.ep).wh)).map(x => x.ep.serie);
    verifier(dsn.tri === "gain" && noms.join("|") === voulu.join("|"), jeu + " : « Trier par gain » range les dérives par gain décroissant");
    const liens = trouver(app, n => n.classList.contains("acc-gain-lien")), dernier = liens[liens.length - 1], nomDernier = noms[noms.length - 1];
    cliquer(dernier);
    verifier(texteDe(trouver(app, n => n.classList.contains("dsn-corrige"))[0]).includes("Si on corrige « " + nomDernier + " »"), jeu + " : un clic sur un gain le montre dans « Si on corrige »");
    dsn.tri = "cout"; dsn.sujet = null; rendre();
  }
}

/* ---- 3. Barre de question en démonstration, de bout en bout ---- */
async function verifierDemo(jeu) {
  aller("ensemble");
  const Q = dsnQuestionsDemo(), puces = trouver(app, n => n.classList.contains("dsn-puce") && !n.classList.contains("acc-tri"));
  const form = trouver(app, n => n.tagName === "FORM" && n.classList.contains("dsn-demande"))[0];
  verifier(form && form.getAttribute("role") === "search" && trouver(form, n => n.tagName === "LABEL" && n.getAttribute("for") === "dsn-question").length === 1 && dsnChamp.getAttribute("placeholder") === "Posez une question sur ce site…", jeu + " : barre « Posez une question sur ce site », avec son étiquette, en tête");
  verifier(Q.length >= 4 && Q.length <= 5 && puces.length === Q.length && /script répond à ces questions toutes faites/.test(texteApp()), jeu + " : " + Q.length + " questions toutes faites, annoncées comme répondues par un script");
  for (let k = 0; k < Q.length; k++) {
    cliquer(trouver(app, n => n.classList.contains("dsn-puce") && !n.classList.contains("acc-tri"))[k]);
    verifier(dsn.enCours && /Le script lit les données/.test(texteDe(dsnNoeud)) && boutons(dsnNoeud, "Arrêter").length === 1, jeu + " · " + Q[k].id + " : l'attente se voit et peut s'arrêter");
    await finQuestion();
    const r = dsn.res, t = texteDe(dsnNoeud);
    verifier(r && r.reponse && r.demo && r.appels.length > 0 && r.appels.every(a => !a.erreur), jeu + " · " + Q[k].id + " : réponse du script, " + (r ? r.appels.length : 0) + " appel(s) d'outils sans erreur");
    if (!r || !r.reponse) continue;
    verifier(r.reponse.abstention || (r.controle.total > 0 && r.controle.absents === 0), jeu + " · " + Q[k].id + " : chaque chiffre de la réponse est retrouvé dans les résultats d'outils (" + r.controle.total + ")");
    verifier(t.includes("Réponse du script de démonstration (sans IA)") && (r.reponse.abstention || /retrouvé\(s\) dans les résultats d'outils/.test(t)) && t.includes("Outils appelés (" + r.appels.length + ")"), jeu + " · " + Q[k].id + " : la page dit que c'est un script, le contrôle, et les outils appelés (repli)");
    verifier(trouver(dsnNoeud, n => n.classList.contains("dsn-nb") && n.classList.contains("ok")).length === r.controle.total, jeu + " · " + Q[k].id + " : les chiffres vérifiés sont soulignés");
    // la réponse rejoint les chiffres de la page
    const K = accCalcul();
    if (Q[k].id === "cher") verifier(r.reponse.nom === K.der.liste[0].ep.serie, jeu + " : la dérive qui coûte le plus selon le script est celle de la page (" + r.reponse.nom + ")");
    if (Q[k].id === "bilan") { const a = r.appels[1]; verifier(r.reponse.valeur === outilLireSerie(a.entree).total.ecart_pct && a.entree.a === isoJour(etat.modele.fin), jeu + " : bilan sur 12 mois recopié de l'outil lire_serie, jusqu'à la fin des données"); }
    if (Q[k].id === "modeles") { const min = derives().analyses.map(A => A.serie).filter(s0 => s0.r2 != null).sort((a, b) => a.r2 - b.r2)[0]; verifier(r.reponse.nom === min.nom, jeu + " : le modèle le moins fiable est celui au R² le plus faible (" + min.nom + ")"); }
  }
  // une question libre, sans IA : réponse honnête et bouton vers les réglages d'IA, rien d'envoyé
  dsnChamp.value = "Pourquoi l'électricité dérive-t-elle ?";
  form.dispatchEvent({ type: "submit", preventDefault() {} });
  await finQuestion();
  verifier(dsn.libre && !dsn.res && !dsn.enCours && /aucune IA ne lit les questions libres/.test(texteDe(dsnNoeud)), jeu + " : question libre en démonstration (au clavier, Entrée) : il faut régler une IA, rien n'est lancé");
  cliquer(boutons(dsnNoeud, "Régler une IA")[0]);
  verifier(!!iaDialogue, jeu + " : « Régler une IA » ouvre le panneau d'IA");
  iaFermer();
}

async function test() {
  verifierGains("classeur");
  await verifierDemo("classeur");

  /* ---- 4. Avec un modèle (faux modèle de test) : chiffres contrôlés, invention signalée ---- */
  aller("ensemble");
  const site = etat.modele.series.find(x => x.groupe === "site"), de = isoJour(etat.modele.fin - 364 * JOUR), a = isoJour(etat.modele.fin);
  const resultat = req => JSON.parse(req.messages[req.messages.length - 1].content.find(b => b.type === "tool_result").content);
  const appel = (name, input, id) => ({ type: "tool_use", id: id || "t_" + name, name, input });
  let vu = null;
  await dsnPoser("De combien le site dépasse-t-il sa référence ?", fauxModele((req, tour) => {
    if (tour === 1) { vu = req; return [appel("lire_serie", { nom: site.nom, de, a })]; }
    const r = resultat(req);
    return [appel("repondre", { type: "nombre", valeur: r.total.ecart_kwh, unite: "kWh", phrase: "Du " + r.du + " au " + r.au + ", « " + r.serie + " » s'écarte de " + nf(r.total.ecart_kwh, 0) + " kWh de sa référence (" + nf(r.total.ecart_pct, 1) + " %)." }, "t_fin")];
  }));
  const r1 = dsn.res;
  verifier(vu && vu.tools.some(t => t.name === "repondre") && vu.tools.some(t => t.name === "lire_serie") && vu.messages[0].content === "De combien le site dépasse-t-il sa référence ?", "faux modèle : la question part telle quelle, avec les outils de lecture et « repondre » (evlOUTILS_API)");
  verifier(r1 && r1.reponse && r1.controle.total >= 8 && r1.controle.absents === 0 && r1.controle.valeur === true && !r1.demo, "faux modèle : réponse dont chaque chiffre est retrouvé dans les résultats d'outils (" + (r1 && r1.controle.total) + ")");
  verifier(/Réponse de faux modèle de test/.test(texteDe(dsnNoeud)) && !/script de démonstration/.test(texteDe(trouver(dsnNoeud, n => n.classList.contains("dsn-source"))[0])), "faux modèle : la réponse est attribuée au modèle, pas au script");
  await dsnPoser("Et sur un an ?", fauxModele((req, tour) => tour === 1 ? [appel("lire_serie", { nom: site.nom, de, a })]
    : [appel("repondre", { type: "nombre", valeur: 123456789, unite: "kWh", phrase: "L'écart est de 123 456 789 kWh." }, "t_fin")]));
  verifier(dsn.res.controle.absents === 1 && dsn.res.controle.valeur === false && /1 chiffre\(s\) sur 1 introuvable/.test(texteDe(dsnNoeud)) && trouver(dsnNoeud, n => n.classList.contains("absent")).length === 1, "faux modèle : un chiffre inventé est signalé introuvable, et marqué dans la phrase");
  await dsnPoser("Bonjour ?", fauxModele(() => [{ type: "text", text: "Je ne sais pas." }]));
  verifier(dsn.res && !dsn.res.reponse && /Pas de réponse structurée/.test(texteDe(dsnNoeud)), "faux modèle : sans appel à « repondre », la page le dit");
  const gardeProgres = evl.progres; evl.progres = { tour: 0, fait: 0, total: 1 };
  await dsnPoser("Encore ?", fauxModele((req, tour) => [appel("repondre", { type: "abstention", phrase: "Rien dans les données." }, "t_fin")]));
  verifier(evl.progres && evl.progres.tour === 0, "la barre ne touche pas à la progression du banc d'évaluation");
  evl.progres = gardeProgres;

  /* ---- 5. Mode IA : rien ne part sans l'accord du panneau, qui liste exactement ce qui part ---- */
  agent.demo = false; agent.fournisseur = "gemini"; rendre();
  verifier(/Envoi pas encore autorisé/.test(texteDe(dsnNoeud)), "IA réglée sans accord : la barre le dit");
  await dsnPoser("Pourquoi ?");
  verifier(dsn.bloque && !dsn.res && /clé/i.test(dsn.erreur) && boutons(dsnNoeud, "Réglages d'IA").length >= 1, "sans clé : rien n'est envoyé, bouton vers les réglages d'IA");
  champDe().value = "cle-de-test";
  iaCoches.delete("question"); iaAutoriser();
  verifier(agent.accord === "gemini" && dsn.accord !== "gemini" && /Autorisez d'abord l'envoi des questions/.test(dsnBlocage()), "case « Questions » décochée : l'accord des autres fonctions ne la couvre pas");
  iaRetirer(); iaCoches.add("question");
  iaOuvrir();
  const tp = texteDe(iaDialogue), cas = trouver(iaDialogue, n => n.tagName === "INPUT" && n.getAttribute("data-ia") === "dsn-question")[0];
  verifier(/Questions posées sur ce site \(Vue d'ensemble\)/.test(tp) && /la question, telle que vous l'écrivez/.test(tp) && /les résultats des outils que le modèle appelle/.test(tp) && /Ne partent pas : le classeur, son nom/.test(tp), "écran d'accord du panneau : la fonction et son avis exact (la question, les résultats d'outils)");
  verifier(cas && cas.checked && trouver(iaDialogue, n => n.tagName === "INPUT" && /^f-/.test(n.getAttribute("data-ia") || "")).length === IA_FONCTIONS.length, "la case des questions est cochée par défaut, à côté des cases du module 11");
  cliquer(boutons(iaDialogue, "J'autorise ces envois pour cette session")[0]);
  verifier(dsn.accord === "gemini" && dsnBlocage() === null && /Questions posées sur ce site/.test(texteDe(iaDialogue)), "« J'autorise » couvre les questions ; l'accord donné les cite");
  iaFermer();
  verifier(/Envoi autorisé \(réglages d'IA\)/.test(texteDe(dsnNoeud)), "la barre dit que l'envoi est autorisé");
  iaRetirer();
  verifier(dsn.accord !== "gemini", "« Retirer l'autorisation partout » retire aussi les questions");
  champDe().value = ""; agent.demo = true; rendre();
  verifier(__reseau.length === 0, "aucun appel réseau jusqu'ici (le mode IA n'a rien envoyé)");

  /* ---- 6. Site fictif : gains et questions ---- */
  try { localStorage.setItem("revue-energetique.acc.visite", "1"); } catch (e) {}
  accCharger(); try { accVisiteFermer(); } catch (e) {}
  verifier(!dsn.res && dsnChamp.value === "", "nouveau chargement : la barre repart vide");
  verifierGains("fictif");
  verifier(dsnGain(accCalcul().der.liste[0].ep).methode === "prevision", "fictif : la Prévision permet l'horizon de 12 mois, elle est utilisée");
  // la Prévision refuse l'horizon : la projection prend le relais et se nomme
  const garde = prevHorizons;
  prevHorizons = sr => garde(sr).map(x => x.mois === 12 ? Object.assign({}, x, { motif: "essai" }) : x);
  dsnMemo = { cle: null, gains: new Map() };
  const G = dsnGain(accCalcul().der.liste[0].ep);
  verifier(G.methode === "projection" && G.cumul && dsnNomMethode(G) === "si l'écart moyen se maintient", "horizon refusé : projection simple, nommée « si l'écart moyen se maintient »");
  rendre();
  verifier(texteDe(trouver(app, n => n.classList.contains("dsn-corrige"))[0]).includes("Projection simple, pas une prévision"), "la carte dit que c'est une projection, pas une prévision");
  prevHorizons = garde; dsnMemo = { cle: null, gains: new Map() };
  await verifierDemo("fictif");
  verifier(dsnQuestionsDemo().some(q => q.id === "site"), "fictif : question sur les usages qui expliquent la dérive du compteur général");

  /* ---- 7. Anglais, et toutes les pages ---- */
  LANGUE = "en"; CACHE_TR.clear(); cacheDerives = null; aller("ensemble");
  const te = texteApp();
  verifier(/Ask a question about this site/.test(te) && /If “.*” is fixed/.test(te) && /Gain if fixed \(12 months\)/.test(te) && /Drifts that cost the most/.test(te) && /ready-made questions/.test(te), "vue d'ensemble en anglais");
  for (const o of ONGLETS) { let ok = true; try { etat.onglet = o[0]; rendre(); } catch (e) { ok = false; console.log(e); } verifier(ok && !/\[object|undefined|NaN/.test(texteApp()), "en : la page « " + o[0] + " » se rend sans texte suspect"); }
  LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null; aller("ensemble");
  verifier(!/\[object|undefined|NaN/.test(texteApp()), "fr : vue d'ensemble sans texte suspect");
  verifier(__reseau.length === 0, "aucun appel réseau");
}
