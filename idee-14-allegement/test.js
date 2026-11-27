/* Tests du module idee-14-allegement : chaque page allégée commence par sa phrase de réponse, ses chiffres sont ceux de la page,
   aucun contrôle n'a disparu, le secondaire est replié au premier affichage, rendu en français et en anglais, aucun appel réseau. */
/* Contrôles de chaque page avant l'allègement (commit c992348), relevés sur le même banc ; noms de données remplacés par «nom», nombres par #. */
const ALG_AVANT = {"classeur:prevision":["SELECT:","BUTTON:#mois","BUTTON:#mois","BUTTON:#mois","BUTTON:Non prolongée","BUTTON:Prolongée","BUTTON:Année civile","BUTTON:#mois glissants"],"classeur:simulateur":["BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","INPUT:text:Scénario en une phrase","BUTTON:Traduire en réglages","BUTTON:Réglages d'IA","BUTTON:Scénario A","INPUT:text:Nom du scénario","BUTTON:Nouveau scénario","BUTTON:Dupliquer","BUTTON:Supprimer","BUTTON:Tout remettre à zéro","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","INPUT:number:Prix de l'énergie «nom»","INPUT:number:Facteur d'émission «nom»","INPUT:number:Prix de l'énergie «nom»","INPUT:number:Facteur d'émission «nom»","SELECT:","BUTTON:+#%","BUTTON:+#unité","BUTTON:Copier"],"classeur:revue":["BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Réglages d'IA","BUTTON:Rédiger la revue"],"classeur:evaluation":["INPUT:number:","BUTTON:#","BUTTON:#","BUTTON:Toutes (#)","INPUT:number:","INPUT:number:","BUTTON:$","BUTTON:€","BUTTON:Lancer une passe de #questions","BUTTON:Réglages d'IA"],"classeur:itg":["BUTTON:Choisir un fichier de données"],"classeur:ensemble":["BUTTON:détail","BUTTON:Instruire","BUTTON:Instruire","BUTTON:Instruire","BUTTON:Voir la décomposition","BUTTON:Voir les facteurs"],"classeur:site":["SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Référence","BUTTON:Année précédente","BUTTON:%","BUTTON:Énergie","BUTTON:± #écart-type","BUTTON:± #écarts-types"],"classeur:ues":["SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Référence","BUTTON:Année précédente","BUTTON:%","BUTTON:Énergie","BUTTON:± #écart-type","BUTTON:± #écarts-types"],"classeur:facteurs":["SELECT:","SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année"],"classeur:graphiques":["BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Toutes","BUTTON:«nom»","BUTTON:«nom»"],"classeur:arbo":["BUTTON:Tout","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:"],"fictif:prevision":["SELECT:","BUTTON:#mois","BUTTON:#mois","BUTTON:#mois","BUTTON:Non prolongée","BUTTON:Prolongée","BUTTON:Année civile","BUTTON:#mois glissants"],"fictif:simulateur":["BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","INPUT:text:Scénario en une phrase","BUTTON:Traduire en réglages","BUTTON:Réglages d'IA","BUTTON:Scénario A","INPUT:text:Nom du scénario","BUTTON:Nouveau scénario","BUTTON:Dupliquer","BUTTON:Supprimer","BUTTON:Tout remettre à zéro","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","BUTTON:−#%","BUTTON:+#%","BUTTON:Niveau haut habituel","BUTTON:Niveau bas habituel","INPUT:number:Variation de «nom»","SELECT:","SELECT:","INPUT:number:Prix de l'énergie «nom»","INPUT:number:Facteur d'émission «nom»","INPUT:number:Prix de l'énergie «nom»","INPUT:number:Facteur d'émission «nom»","SELECT:","BUTTON:+#%","BUTTON:+#unité","BUTTON:Copier"],"fictif:revue":["BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Réglages d'IA","BUTTON:Rédiger la revue"],"fictif:evaluation":["INPUT:number:","BUTTON:#","BUTTON:#","BUTTON:Toutes (#)","INPUT:number:","INPUT:number:","BUTTON:$","BUTTON:€","BUTTON:Lancer une passe de #questions","BUTTON:Réglages d'IA"],"fictif:itg":["BUTTON:Choisir un fichier de données"],"fictif:ensemble":["BUTTON:Visite guidée (#min)","BUTTON:détail","BUTTON:Instruire","BUTTON:Instruire","BUTTON:Instruire","BUTTON:Voir la décomposition","BUTTON:Ouvrir la Revue"],"fictif:site":["SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Référence","BUTTON:Année précédente","BUTTON:%","BUTTON:Énergie","BUTTON:± #écart-type","BUTTON:± #écarts-types"],"fictif:ues":["SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Référence","BUTTON:Année précédente","BUTTON:%","BUTTON:Énergie","BUTTON:± #écart-type","BUTTON:± #écarts-types"],"fictif:facteurs":["SELECT:","SELECT:","BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année"],"fictif:graphiques":["BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:","BUTTON:Semaine","BUTTON:Mois","BUTTON:Année","BUTTON:Toutes","BUTTON:«nom»","BUTTON:«nom»"],"fictif:arbo":["BUTTON:Tout","BUTTON:#","BUTTON:#","BUTTON:#","INPUT:date:","INPUT:date:"]};
const ALG_PAGES = ["prevision", "simulateur", "revue", "evaluation", "itg", "ensemble", "site", "ues", "facteurs", "graphiques", "arbo"];
const algSig = (n, noms) => { let t = n.tagName === "BUTTON" ? n.textContent : n.tagName === "INPUT" ? (n.attrs.type || "text") + ":" + (n.attrs["aria-label"] || "") : n.tagName === "SELECT" ? "" : n.textContent;
  for (const x of noms) t = t.split(x).join("«nom»"); return n.tagName + ":" + t.replace(/\d[\d\s,.]*/g, "#").trim(); };
const algDans = (n, sel) => { for (let x = n.parentNode; x; x = x.parentNode) if (x.tagName === sel) return x; return null; };
const algRepliFerme = n => { const d = algDans(n, "DETAILS"); return !!d && !d.hasAttribute("open"); };
// grandeurs avec unité, sans le signe : 7,2 GWh, 12,5 %, 1,07 M€…
const algGrandeurs = t => (t.match(/\d[\d   ]*(?:,\d+)?\s?(?:%|GWh|MWh|kWh|Wh|k€|M€|€|tCO₂e|kgCO₂e)/g) || []).map(x => x.trim());

async function test() {
  verifier.bavard = false;
  const feuille = () => app.querySelector(".feuille");
  const rendrePage = (id, l) => { LANGUE = l; CACHE_TR.clear(); REPLIS_OUVERTS.clear(); etat.onglet = id; rendre(); return feuille(); };
  const reponseDe = f => trouver(f, n => n.classList.contains("constat"))[0] || null;

  for (const jeu of ["classeur", "fictif"]) {
    if (jeu === "fictif") { LANGUE = "fr"; CACHE_TR.clear(); try { localStorage.setItem("revue-energetique.acc.visite", "1"); } catch (e) {} accCharger(); try { accVisiteFermer(); } catch (e) {} }
    const m = etat.modele, noms = m.series.map(x => x.nom).concat(m.facteurs.map(x => x.nom), m.energies, [etat.fichier]).sort((a, b) => b.length - a.length);
    console.log("— " + jeu);
    for (const l of ["fr", "en"]) for (const id of ALG_PAGES) {
      const f = rendrePage(id, l), R = reponseDe(f), t = texteDe(f), nom = jeu + " " + id + " (" + l + ")";
      verifier(!!R, nom + " : une phrase de réponse");
      if (!R) continue;
      // la réponse vient d'abord : rien avant elle, sauf un bandeau de reprise du travail
      const avantR = t.slice(0, t.indexOf(texteDe(R))), bandeaux = trouver(f, n => /bandeau/.test(n.className)).map(texteDe).join("");
      verifier(t.indexOf(texteDe(R)) >= 0 && avantR.trim() === bandeaux.trim(), nom + " : la page commence par sa réponse" + (avantR.trim() ? " — avant : « " + avantR.slice(0, 60) + " »" : ""));
      verifier(!algRepliFerme(R) && !/undefined|NaN|\[object|Infinity/.test(t), nom + " : réponse visible, aucun texte suspect");
      // chaque grandeur de la réponse se retrouve ailleurs sur la page (tuiles, cartes, tableaux, replis compris)
      const reste = t.split(texteDe(R)).join(" "), absents = algGrandeurs(texteDe(R)).filter(g => !reste.includes(g));
      verifier(!absents.length, nom + " : les chiffres de la réponse sont ceux de la page" + (absents.length ? " — absents : " + absents.join(", ") : ""));
      if (l === "en") verifier(!/\b(par rapport|consommé|pas encore|Aucune|réussite|Données affichées|aurait donné|Atterrissage|Sur le passé|liaison)\b/.test(texteDe(R)), nom + " : réponse en anglais (« " + texteDe(R).slice(0, 70) + " »)");
      // rien n'a disparu : chaque contrôle d'avant existe encore, replié ou non
      if (l === "fr") {
        const apres = trouver(f, n => ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(n.tagName)).map(n => algSig(n, noms)), reste_ = apres.slice(), manque = [];
        for (const s of ALG_AVANT[jeu + ":" + id] || []) { const k = reste_.indexOf(s); if (k < 0) manque.push(s); else reste_.splice(k, 1); }
        verifier(ALG_AVANT[jeu + ":" + id] && !manque.length, nom + " : les " + (ALG_AVANT[jeu + ":" + id] || []).length + " contrôles d'avant existent encore" + (manque.length ? " — manquent : " + manque.join(" | ") : ""));
      }
    }
  }

  console.log("— chiffres recalculés à part (classeur de test, français)");
  const { grilles, d1904 } = await lireClasseur(__buf); charger(grilles, d1904, __nom, null);
  const m = etat.modele; Object.assign(etat, { de: m.debut, a: m.fin, comparer: "ref" });
  // Prévision : atterrissage arrondi, erreur de la méthode et de la méthode naïve
  let f = rendrePage("prevision", "fr"), R = texteDe(reponseDe(f));
  const srP = m.series.find(x => x.nom === prevEtat.serie), K = prevCalcul(srP), demi = (K.att.haut - K.att.bas) / 2;
  verifier(R.includes(fmtEnergie(prevRond(K.att.central, demi))) && R.includes(fmtPct(K.retro.global.erreur)) && R.includes(fmtPct(K.retro.global.erreurNaive)), "Prévision : atterrissage " + fmtEnergie(prevRond(K.att.central, demi)) + ", erreur " + fmtPct(K.retro.global.erreur) + " contre " + fmtPct(K.retro.global.erreurNaive));
  const court = trouver(f, n => n.classList.contains("prev-ligne"))[0];
  verifier(court && /Historique court/.test(texteDe(court)) && !algRepliFerme(court), "Prévision : l'avertissement « historique court » reste visible, en une ligne");
  const preuve = trouver(f, n => n.tagName === "H2" && /La preuve : test rétrospectif/.test(texteDe(n)))[0], hyp = trouver(f, n => n.tagName === "H2" && /Ce que la prévision suppose/.test(texteDe(n)))[0];
  verifier(preuve && algRepliFerme(preuve) && hyp && algRepliFerme(hyp) && trouver(f, n => n.tagName === "SVG").length === 1, "Prévision : la preuve et les hypothèses sont repliées au premier affichage ; seul le graphique principal est dessiné");
  // Simulateur : un réglage, puis la réponse contre simCalculer
  const sc = sim.scenarios[sim.courant]; sc.reglages = { [m.facteurs[0].nom]: { type: "pct", v: 60, saison: "tout" } };
  f = rendrePage("simulateur", "fr"); R = texteDe(reponseDe(f));
  const res = simCalculer(sc);
  verifier(res.energies.every(x => R.includes(fmtEnergie(x.ecart, true))) && R.includes(fmtEuros(res.euros, true)) && R.includes(fmtCO2(res.co2, true)), "Simulateur : écarts par énergie, coût et émissions de la réponse = simCalculer");
  const ligneAvis = trouver(f, n => n.classList.contains("sim-ligne"))[0];
  verifier(ligneAvis && /À lire avant de conclure/.test(texteDe(ligneAvis)) && !algRepliFerme(ligneAvis) && /Extrapolation/.test(texteDe(f)), "Simulateur : l'avertissement reste visible en une ligne, son détail est dans un repli");
  const actif = trouver(f, n => n.tagName === "INPUT" && n.attrs["aria-label"] === "Variation de " + m.facteurs[0].nom)[0], autre = trouver(f, n => n.tagName === "INPUT" && n.attrs["aria-label"] === "Variation de " + m.facteurs[1].nom)[0];
  verifier(actif && !algRepliFerme(actif) && autre && algRepliFerme(autre), "Simulateur : le facteur réglé est visible, les autres sont repliés");
  for (const titre of ["Sensibilité : ce que pèse chaque facteur", "Comparaison des scénarios", "Effet sur le site et sur chaque UES"]) {
    const n = trouver(f, x => x.tagName === "H2" && texteDe(x).startsWith(titre))[0];
    verifier(n && algRepliFerme(n), "Simulateur : « " + titre + " » est replié");
  }
  sc.reglages = {};
  // Revue et Évaluation : les nombres de la réponse
  f = rendrePage("revue", "fr"); R = texteDe(reponseDe(f));
  const D = revDossier();
  verifier(new RegExp("compte " + D.faits.length + " faits calculés et " + D.nbEpisodes + " épisodes").test(R), "Revue : " + D.faits.length + " faits et " + D.nbEpisodes + " épisodes, comme les tuiles du dossier");
  f = rendrePage("evaluation", "fr"); R = texteDe(reponseDe(f));
  verifier(R.includes(evlJeu().length + " questions, dont " + evlJeu().filter(q => q.piege).length + " pièges"), "Évaluation : questions et pièges du jeu");
  const graine = trouver(f, n => n.tagName === "INPUT")[0];
  verifier(graine && algRepliFerme(graine) && trouver(f, n => n.tagName === "BUTTON" && /^Lancer une passe/.test(n.textContent)).every(b => !algRepliFerme(b)), "Évaluation : graine et tarifs repliés, lancement visible");
  // Site : écart à la référence recalculé à part
  for (const g of ["site", "ues"]) {
    f = rendrePage(g, "fr"); R = texteDe(reponseDe(f));
    const sr = m.series.find(x => x.nom === etat[g === "site" ? "nomSite" : "nomUES"]) || m.series.filter(x => x.groupe === g)[0];
    const tC = totalPeriode(sr.conso.map((v, i) => sr.ref[i] != null ? v : null)), tR = totalPeriode(sr.ref);
    verifier(R.includes(fmtPct((tC - tR) / tR, true)) && R.includes(fmtEnergie(tC - tR, true)), g + " : écart " + fmtPct((tC - tR) / tR, true) + " recalculé avec totalPeriode");
    const comparer = trouver(f, n => n.tagName === "BUTTON" && n.textContent === "Année précédente")[0];
    verifier(comparer && algRepliFerme(comparer), g + " : « Comparer à » est un réglage replié");
  }
  // Facteurs : coefficient de corrélation recalculé
  f = rendrePage("facteurs", "fr"); R = texteDe(reponseDe(f));
  { const sr = m.series.find(x => x.nom === etat.factConso) || m.series[0], fa = m.facteurs.find(x => x.nom === etat.facteur) || m.facteurs[0], P = [];
    m.dates.forEach((t, i) => { if (t >= etat.de && t <= etat.a && sr.conso[i] != null && fa.valeurs[i] != null) P.push([fa.valeurs[i], sr.conso[i]]); });
    const n = P.length, mx = somme(P.map(p => p[0])) / n, my = somme(P.map(p => p[1])) / n;
    const r = somme(P.map(p => (p[0] - mx) * (p[1] - my))) / Math.sqrt(somme(P.map(p => (p[0] - mx) ** 2)) * somme(P.map(p => (p[1] - my) ** 2)));
    verifier(R.includes("r = " + nf(r, 3)) && R.includes(n + " dates") && texteDe(f).split(R).join("").includes(nf(r, 3)), "Facteurs : r = " + nf(r, 3) + " sur " + n + " dates, comme la tuile"); }
  // Graphiques et Arborescence : total du site
  const totalSite = somme(m.series.filter(x => x.groupe === "site").map(x => totalPeriode(x.conso) || 0));
  for (const id of ["graphiques", "arbo"]) { f = rendrePage(id, "fr"); R = texteDe(reponseDe(f));
    verifier(R.includes(fmtEnergie(totalSite)), id + " : total du site " + fmtEnergie(totalSite)); }

  console.log("— mode d'emploi : sommaire cliquable");
  for (const l of ["fr", "en"]) {
    f = rendrePage("guide", l);
    const liens = trouver(f, n => n.tagName === "BUTTON" && n.parentNode && n.parentNode.classList.contains("sommaire")), sections = trouver(f, n => n.tagName === "SECTION" && /^guide-/.test(n.attrs.id || ""));
    verifier(liens.length === GUIDE.length && sections.length === GUIDE.length && GUIDE.every(s => sections.some(x => x.attrs.id === "guide-" + s.id)), "mode d'emploi (" + l + ") : un lien de sommaire par section (" + liens.length + ")");
    const numeros = sections.map(x => parseInt(texteDe(x.querySelector("h2")), 10)).filter(x => !isNaN(x));
    verifier(numeros.every((x, k) => x === k + 1), "mode d'emploi (" + l + ") : sections numérotées de 1 à " + numeros.length + " sans trou ni doublon");
    let ok = true; for (const b of liens) { try { cliquer(b); } catch (e) { ok = false; } }
    verifier(ok, "mode d'emploi (" + l + ") : chaque lien du sommaire se clique sans erreur");
  }
  LANGUE = "fr"; CACHE_TR.clear(); rendre();
  verifier(__reseau.length === 0, "aucun appel réseau");
}
