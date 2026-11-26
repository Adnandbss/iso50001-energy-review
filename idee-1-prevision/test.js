/* Tests du module « Prévision ». Lancement :
   python3 outillage/assembler.py idee-1-prevision/essai.html idee-1-prevision
   node outillage/banc.js idee-1-prevision/essai.js idee-1-prevision/test.js
   Tout est dans test() pour ne heurter aucun nom du script (la portée est partagée). */
async function test() {
  const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  const page = () => document.getElementById("app");
  const m = etat.modele, L = prevLecture(), grillesReelles = grillesChargees;

  /* ---- 1. Relecture des équations : elle doit redonner ref ---- */
  // Tolérance : 1e-9 en relatif. La relecture refait les mêmes opérations, dans le même ordre, que calculer() : on attend l'égalité exacte ;
  // la marge ne couvre qu'une différence d'arrondi en virgule flottante (1e-9 d'un MWh = un millième de Wh), très en dessous de tout chiffre affiché.
  verifier(L.ok && L.X.length === m.dates.length && L.eq.length === m.series.length, "lecture : une ligne de facteurs par date, une équation par série");
  let nRef = 0, pire = 0;
  m.series.forEach((sr, i) => sr.ref.forEach((r, j) => { if (r != null) { nRef++; pire = Math.max(pire, Math.abs(prevModele(L.eq[i], L.X[j], m.dates[j], false) - r) / Math.max(1, Math.abs(r))); } }));
  verifier(nRef > 500 && pire <= 1e-9, "relecture des équations : ref retrouvée sur " + nRef + " points, écart relatif maximal " + pire.toExponential(1) + " (tolérance 1e-9)");
  verifier(L.fidele.every(f => f.ok), "relecture : chaque série est déclarée fidèle");
  verifier(m.series.some((sr, i) => L.eq[i].saisonnier) && m.series.some((sr, i) => !L.eq[i].saisonnier), "le classeur de test contient des modèles simples et saisonniers (les deux chemins sont couverts)");
  // contre-épreuve : une équation faussée doit être détectée, et la série refusée
  { const i = 0, garde = L.eq[i].b1; L.eq[i].b1 = garde * 1.01;
    let p = 0; m.series[i].ref.forEach((r, j) => { if (r != null) p = Math.max(p, Math.abs(prevModele(L.eq[i], L.X[j], m.dates[j], false) - r) / Math.max(1, Math.abs(r))); });
    verifier(p > 1e-6, "contre-épreuve : une constante faussée de 1 % est vue par le contrôle (écart " + p.toExponential(1) + ")");
    L.fidele[i].ok = false;
    const hz = prevHorizons(m.series[i]);
    verifier(hz.every(x => x.motif && /relecture/.test(x.motif)), "une série dont la relecture ne redonne pas ref n'a aucun horizon proposé");
    L.eq[i].b1 = garde; L.fidele[i].ok = true; }

  /* ---- 2. Petits calculs dont la réponse est connue ---- */
  verifier(prevQuantile([[1, 1], [2, 1], [3, 1]], 0.5) === 2, "quantile : médiane de 1, 2, 3 = 2");
  verifier(proche(prevQuantile([[0, 1], [10, 1]], 0.5), 5) && prevQuantile([[0, 1], [10, 1]], 0.01) === 0 && prevQuantile([[0, 1], [10, 1]], 0.99) === 10, "quantile : interpolé entre deux points, borné par les extrêmes");
  verifier(prevQuantile([[0, 3], [10, 1]], 0.5) < 5, "quantile : le poids tire vers le point le plus lourd");
  const t0 = Date.UTC(2024, 5, 3);
  verifier(prevPoids("week", t0, t0) === 1 && proche(prevPoids("week", t0, t0 + 7 * JOUR), 2 / 3) && proche(prevPoids("week", t0, t0 - 14 * JOUR), 1 / 3) && prevPoids("week", t0, t0 + 21 * JOUR) === 0, "poids du calendrier (semaine) : 1, 2/3, 1/3 puis 0");
  verifier(prevPoids("week", Date.UTC(2024, 0, 2), Date.UTC(2022, 11, 30)) > 0.8, "poids du calendrier : le 30 décembre est voisin du 2 janvier (l'année boucle)");
  verifier(prevDate("week", t0, 2) === t0 + 14 * JOUR && prevDate("month", Date.UTC(2024, 0, 31), 1) === Date.UTC(2024, 1, 29) && prevDate("month", Date.UTC(2024, 0, 15), -2) === Date.UTC(2023, 10, 15), "dates : + 2 semaines ; 31 janvier + 1 mois = 29 février ; − 2 mois");
  verifier(prevLibelle("week", Date.UTC(2024, 8, 30)) === "S40 2024" && prevLibelle("month", t0) === "juin 2024", "libellés de période");
  const eqTest = { b1: 10, c1: [2, 0.5], b2: 7, c2: [0, 0], saisonnier: true, saisons: [[Date.UTC(2023, 5, 1), Date.UTC(2023, 8, 1)]] };
  verifier(prevModele(eqTest, [3, 4], Date.UTC(2023, 0, 10), false) === 18000 && prevModele(eqTest, [3, 4], Date.UTC(2023, 6, 10), false) === 7000, "modèle : 10 + 2×3 + 0,5×4 = 18 kWh en hiver, 7 kWh en été");
  verifier(prevEte(eqTest, Date.UTC(2025, 6, 10), false) === false && prevEte(eqTest, Date.UTC(2025, 6, 10), true) === true && prevEte(eqTest, Date.UTC(2025, 0, 10), true) === false, "saison : reportée d'année en année pour une date à venir seulement");
  verifier(prevRond(7312, 220) === 7300 && prevRond(7312, 1200) === 7300 && prevRond(7312, 15) === 7312 && prevRond(5, 0) === 5, "arrondi d'un total à la précision de sa fourchette");

  /* ---- 3. Prévision : forme, bornes, cohérence entre horizons ---- */
  let nPrev = 0, okBornes = true, okMarge = true, okDates = true, okPrefixe = true, okCumul = true, okFini = true;
  for (const sr of m.series) {
    const obs = prevObs(sr), o = obs[obs.length - 1], permis = prevHorizons(sr).filter(x => !x.motif);
    let avant = null;
    for (const hz of permis) {
      const P = prevPrevoir(sr, o, hz.n, false); nPrev++;
      if (P.periodes.length !== hz.n || !P.complet) okFini = false;
      let cumul = 0, largeurAvant = -1;
      P.periodes.forEach((p, k) => {
        if (![p.central, p.bas, p.haut].every(v => Number.isFinite(v) && v >= 0)) okFini = false;
        if (!(p.bas <= p.basFacteurs + 1e-6 && p.basFacteurs <= p.central + 1e-6 && p.central <= p.hautFacteurs + 1e-6 && p.hautFacteurs <= p.haut + 1e-6)) okBornes = false;
        if (p.haut - p.central < PREV.z * P.sigma * p.central * (1 - 1e-9)) okMarge = false;                       // jamais plus étroit que l'erreur du modèle seule
        if (p.t !== prevDate(sr.pas, m.dates[o], k + 1)) okDates = false;
        cumul += p.haut - p.bas; if (p.central > 0 && !(cumul > largeurAvant)) okCumul = false; largeurAvant = cumul;
        if (avant && k < avant.periodes.length && (p.central !== avant.periodes[k].central || p.haut !== avant.periodes[k].haut)) okPrefixe = false;
      });
      avant = P;
    }
  }
  verifier(nPrev >= 20 && okFini, nPrev + " prévisions (séries × horizons permis) : complètes, valeurs finies et positives");
  verifier(okBornes, "bornes ordonnées : bas ≤ scénario bas ≤ central ≤ scénario haut ≤ haut");
  verifier(okMarge, "la fourchette n'est jamais plus étroite que l'erreur du modèle seule (z × erreur × central)");
  verifier(okCumul, "la fourchette cumulée s'élargit à chaque période de plus : l'incertitude d'un total croît avec l'horizon");
  verifier(okPrefixe, "cohérence entre horizons : les premières périodes d'un horizon long sont celles de l'horizon court");
  verifier(okDates, "dates prévues : une période après l'autre, à partir de la dernière période connue");
  // largeur relative par période : elle ne rétrécit pas absurdement avec l'horizon (elle suit la saison, pas l'échéance)
  { const sr = m.series.find(x => x.nom === etat.nomSite) || m.series[0], obs = prevObs(sr), hz = prevHorizons(sr).filter(x => !x.motif).pop();
    const P = prevPrevoir(sr, obs[obs.length - 1], hz.n, false), rel = P.periodes.map(p => (p.haut - p.bas) / 2 / p.central);
    const debut = Math.min(...rel.slice(0, 4)), fin = Math.min(...rel.slice(-4));
    verifier(fin >= PREV.z * P.sigma * 0.999 && debut >= PREV.z * P.sigma * 0.999, "largeur relative de la fourchette : au moins ± " + (PREV.z * P.sigma * 100).toFixed(1) + " % au début (" + (debut * 100).toFixed(1) + " %) comme à la fin de l'horizon (" + (fin * 100).toFixed(1) + " %)"); }

  /* ---- 4. Dérive en cours : même épisode que la page Détection, et effet multiplicatif ---- */
  const D = derives();
  let nDer = 0, okDer = true;
  for (const A of D.analyses) {
    const sr = A.serie, obs = prevObs(sr), o = obs[obs.length - 1], ep = A.episodes.find(e => e.ouvert), d = prevDerive(sr, o);
    if (!A.ok) { if (d.connue) okDer = false; continue; }
    if ((ep ? ep.pct : null) !== d.pct) okDer = false;
    if (ep && !prevHorizons(sr)[0].motif) {
      nDer++;
      const a = prevPrevoir(sr, o, 4, true), b = prevPrevoir(sr, o, 4, false);
      a.periodes.forEach((p, k) => { if (!proche(p.central, Math.max(0, b.periodes[k].central * (1 + ep.pct)), 1e-9)) okDer = false; });
    }
  }
  verifier(nDer >= 1 && okDer, "dérive en cours : même épisode et même écart relatif que la page Détection (" + nDer + " séries) ; prolongée, elle multiplie la prévision centrale par 1 + écart");

  /* ---- 5. Le test rétrospectif n'utilise rien de postérieur à l'origine ---- */
  // Preuve par empoisonnement : on remplace tout ce qui est daté après l'origine (consommations, références, facteurs) par des valeurs absurdes,
  // on refait la prévision, et elle doit être identique au chiffre près. Fait pour chaque origine du test, avec et sans dérive.
  let nOrig = 0, okFuite = true, okNaive = true, okCible = true;
  const empoisonner = (sr, tO, f) => {
    const garde = { conso: sr.conso.slice(), ref: sr.ref.slice(), X: L.X.map(x => x.slice()), fact: m.facteurs.map(x => x.valeurs.slice()) };
    m.dates.forEach((t, j) => { if (t > tO) { sr.conso[j] = 9e15; sr.ref[j] = 7e15; L.X[j] = L.X[j].map(() => 5e9); m.facteurs.forEach(x => { x.valeurs[j] = 5e9; }); } });
    try { return f(); } finally { sr.conso = garde.conso; sr.ref = garde.ref; garde.X.forEach((x, j) => { L.X[j] = x; }); m.facteurs.forEach((x, k) => { x.valeurs = garde.fact[k]; }); }
  };
  for (const sr of m.series) for (const avecDerive of [false, true]) {
    const R = prevRetro(sr, 13, avecDerive);
    if (!R.possible) continue;
    const obs = prevObs(sr);
    for (const o of [...new Set(R.paires.map(p => p.o))]) {
      nOrig++;
      const mes = R.paires.filter(p => p.o === o), tO = m.dates[o];
      const { P, naives } = empoisonner(sr, tO, () => ({ P: prevPrevoir(sr, o, R.n, avecDerive), naives: mes.map(p => prevNaive(sr, o, p.t).v) }));
      mes.forEach((p, i) => {
        const q = P.periodes[p.k - 1];
        if (q.central !== p.central || q.bas !== p.bas || q.haut !== p.haut) okFuite = false;
        if (naives[i] !== p.naive) okNaive = false;
        if (!(p.t > tO) || p.reel !== sr.conso[prevLigne(obs, p.t, PREV.jours[sr.pas] / 2)]) okCible = false;
      });
    }
  }
  verifier(nOrig >= 100 && okFuite, "aucune fuite : " + nOrig + " prévisions du test refaites avec le futur empoisonné, identiques au chiffre près (central, bas, haut)");
  verifier(okNaive, "méthode naïve : identique elle aussi quand le futur est empoisonné");
  verifier(okCible, "chaque période testée est postérieure à son origine, et son réel est bien la consommation de cette période");
  { // l'empoisonnement mord bien : une prévision faite APRÈS les données empoisonnées change
    const sr = m.series[0], obs = prevObs(sr), o = obs[obs.length - 1], tO = m.dates[obs[obs.length - 20]];
    const net = prevPrevoir(sr, o, 4, false), sale = empoisonner(sr, tO, () => prevPrevoir(sr, o, 4, false));
    verifier(sale.periodes[0].central !== net.periodes[0].central, "contre-épreuve : la même prévision change si les données empoisonnées sont antérieures à l'origine (le test détecterait une fuite)");
    verifier(prevPrevoir(sr, o, 4, false).periodes[0].central === net.periodes[0].central, "les données sont remises en place après l'empoisonnement"); }

  /* ---- 6. Test rétrospectif : les mesures affichées sont celles des paires ---- */
  let nRetro = 0, okMesures = true, okRegles = true, okNaiveRegle = true;
  for (const sr of m.series) {
    const R = prevRetro(sr, 13, false);
    if (!R.possible) continue;
    nRetro++;
    const sa = somme(R.paires.map(p => p.reel)), se = somme(R.paires.map(p => Math.abs(p.central - p.reel))), sb = somme(R.paires.map(p => p.central - p.reel)), sn = somme(R.paires.map(p => Math.abs(p.naive - p.reel)));
    const dans = R.paires.filter(p => p.reel >= p.bas && p.reel <= p.haut).length;
    if (!proche(R.global.erreur, se / sa) || !proche(R.global.biais, sb / sa) || !proche(R.global.couverture, dans / R.paires.length) || !proche(R.global.erreurNaive, sn / sa)) okMesures = false;
    if (somme(R.tranches.map(t => t.n)) !== R.nPaires || R.nPaires !== R.paires.length || R.nAn1 + R.nDerniere !== R.nPaires) okMesures = false;
    if (R.origines < PREV.minOrigines || R.n > 13 || R.n < PREV.minEcheance[sr.pas] || new Set(R.paires.map(p => p.o)).size !== R.origines) okRegles = false;
    const V = prevVerdict(R);
    if ((V.sens === "mieux") !== (R.global.erreur < R.global.erreurNaive * (1 - PREV.ecartNet)) || (V.sens === "pire") !== (R.global.erreur > R.global.erreurNaive * (1 + PREV.ecartNet))) okRegles = false;
    // règle de la méthode naïve, refaite à la main au pas hebdomadaire : la ligne 52 semaines plus tôt si elle est connue, sinon la dernière valeur connue
    if (sr.pas === "week") for (const p of R.paires) {
      const j = m.dates.indexOf(p.t - 364 * JOUR), attendu = j >= 0 && j <= p.o && sr.conso[j] != null ? sr.conso[j] : sr.conso[p.o];
      if (p.naive !== attendu) okNaiveRegle = false;
    }
  }
  verifier(nRetro >= 5 && okMesures, "test rétrospectif (" + nRetro + " séries) : erreur moyenne, biais, part dans la fourchette et erreur naïve recalculés à la main à partir des paires");
  verifier(okRegles, "test rétrospectif : au moins " + PREV.minOrigines + " origines, échéance dans les bornes, verdict conforme aux chiffres");
  verifier(okNaiveRegle, "méthode naïve : même semaine un an plus tôt quand elle est connue à l'origine, sinon dernière valeur connue");
  { // horizon long : le test ne peut pas tout couvrir avec 18 mois, et le dit
    const sr = m.series.find(x => x.nom === etat.nomSite) || m.series[0], R = prevRetro(sr, 52, false);
    verifier(!R.possible || R.n < 52, "historique court : à 12 mois, le test rétrospectif ne couvre pas l'horizon (échéance testée : " + (R.possible ? R.n : 0) + " périodes sur 52)"); }
  console.log("   résultats du test rétrospectif à 13 périodes, sans prolonger la dérive (erreur méthode / naïve, part dans la fourchette) :");
  for (const sr of m.series) { const R = prevRetro(sr, 13, false);
    console.log("     série " + (m.series.indexOf(sr) + 1) + " (" + sr.nbPoints + " points) : " + (R.possible ? fmtPct(R.global.erreur) + " / " + fmtPct(R.global.erreurNaive) + ", " + fmtPct(R.global.couverture) + " → " + prevVerdict(R).sens + ", fourchette " + prevVerdict(R).fourchette + " (" + R.origines + " origines, " + R.n + " périodes)" : "impossible")); }

  /* ---- 7. Horizons refusés et atterrissage ---- */
  const courte = m.series.filter(x => x.pas === "week" && x.nbPoints >= PREV.minPoints && x.nbPoints < 52)[0];
  if (courte) { const hz = prevHorizons(courte);
    verifier(hz[2].motif && !hz[0].motif, "série courte (" + courte.nbPoints + " points) : l'horizon de 12 mois est refusé avec son motif, celui de 3 mois reste proposé"); }
  else verifier(false, "le classeur de test devait contenir une série hebdomadaire de moins de 52 points");
  { const sr = m.series.find(x => x.nom === etat.nomSite) || m.series[0], obs = prevObs(sr), o = obs[obs.length - 1], an = new Date(prevDate(sr.pas, m.dates[o], 1)).getUTCFullYear();
    Object.assign(prevEtat, { serie: sr.nom, horizon: 3, derive: false, cumul: "annee" });
    const K = prevCalcul(sr), att = K.att;
    const reelAn = somme(sr.conso.map((v, j) => v != null && new Date(m.dates[j]).getUTCFullYear() === an ? v : 0));
    let nAn = 0; while (new Date(prevDate(sr.pas, m.dates[o], nAn + 1)).getUTCFullYear() === an) nAn++;
    verifier(att.ok && proche(att.reel, reelAn) && att.n === nAn && proche(att.central, reelAn + somme(K.P.periodes.slice(0, nAn).map(p => p.central))), "atterrissage sur l'année civile " + an + " : réel de l'année + " + nAn + " périodes prévues jusqu'au 31 décembre");
    verifier(att.bas <= att.central && att.central <= att.haut && proche(att.haut - att.bas, somme(K.P.periodes.slice(0, nAn).map(p => p.haut - p.bas))), "atterrissage : fourchette du total = somme des bornes des périodes prévues (le réel n'ajoute pas d'incertitude)");
    prevEtat.cumul = "glissant";
    const G = prevCalcul(sr).att, n12 = PREV.periodes[12][sr.pas];
    verifier(G.ok && G.n === K.horizon.n && G.nReel + G.n + G.manquantes === n12, "atterrissage sur 12 mois glissants : " + G.nReel + " périodes réelles + " + G.n + " prévues = " + n12);
    verifier(K.cible && K.cible.plausible === false && K.cible.total == null, "objectif : la valeur du classeur (" + sr.cible + ", sans unité) n'est pas du même ordre que la consommation ; elle n'est comparée à rien");
    const garde = sr.cible; sr.cible = K.cible.hebdo / 1000;
    const C = prevCible(sr, att);
    verifier(C.plausible && proche(C.total, K.cible.hebdo * (att.nReel + att.n)), "objectif : une valeur du même ordre qu'une consommation hebdomadaire en kWh est comparée, multipliée par le nombre de semaines");
    sr.cible = garde; prevEtat.cumul = "annee"; }

  /* ---- 8. Rendu : chaque série, chaque réglage, en français puis en anglais ---- */
  verifier(ONGLETS.some(x => x[0] === "prevision") && PAGES.some(g => g.groupe === "Anticipation" && g.pages.some(x => x[0] === "prevision")) && PAGES[PAGES.length - 1].groupe === "Aide" && !!ICONES.prevision, "la page « prevision » est dans le groupe Anticipation, avant Aide, avec son icône");
  etat.onglet = "prevision";
  const francais = /\b(prévision|prévu|prévue|période|périodes|données|méthode|erreur|fourchette|atterrissage|dérive|semaines?|réels?|naïve|historique|objectif|classeur|année|facteurs?|aucune?|été)\b/i;
  const nomsDonnees = m.series.map(x => x.nom).concat(m.facteurs.map(x => x.nom), m.energies);
  let rendus = 0, erreurs = [], restes = new Set();
  for (const langue of ["fr", "en"]) {
    LANGUE = langue; CACHE_TR.clear();
    for (const sr of m.series) for (const horizon of [3, 6, 12]) for (const derive of [false, true]) for (const cumul of ["annee", "glissant"]) {
      Object.assign(prevEtat, { serie: sr.nom, horizon, derive, cumul });
      etat.tables = new Set(rendus % 3 === 0 ? ["prev-courbe", "prev-exemple"] : []);                 // une fois sur trois, les tableaux à la place des graphiques
      try {
        rendre(); rendus++;
        const texte = texteDe(page().querySelector(".feuille"));
        if (texte.length < 800 || /undefined|NaN|\[object|Infinity/.test(texte)) erreurs.push(sr.nom + " " + horizon + " " + langue + " : texte suspect");
        if (langue === "en") trouver(page().querySelector(".feuille"), n => n.children.some(c => c.nodeType === 3)).forEach(n => n.children.forEach(c => {
          if (c.nodeType !== 3) return;
          let t = c.textContent; for (const nom of nomsDonnees) t = t.split(nom).join("");
          const r = francais.exec(t); if (r) restes.add(r[0] + " ← « " + c.textContent.slice(0, 70) + " »");
        }));
      } catch (e) { erreurs.push(sr.nom + " " + horizon + " " + derive + " " + cumul + " " + langue + " : " + (e && e.stack || e)); }
    }
  }
  verifier(rendus === m.series.length * 24 && !erreurs.length, rendus + " rendus de la page (9 séries × 3 horizons × dérive × atterrissage × 2 langues) sans erreur" + (erreurs.length ? " — " + erreurs.slice(0, 3).join(" | ") : ""));
  verifier(restes.size === 0, "anglais : aucun mot français hors noms de données" + (restes.size ? " — " + [...restes].slice(0, 6).join(" | ") : ""));
  // contenu attendu, en français
  LANGUE = "fr"; CACHE_TR.clear(); etat.tables = new Set();
  const site = m.series.find(x => x.nom === etat.nomSite) || m.series[0];
  Object.assign(prevEtat, { serie: site.nom, horizon: 3, derive: false, cumul: "annee" });
  rendre();
  let texte = texteDe(page().querySelector(".feuille"));
  for (const attendu of ["Atterrissage", "Historique court", "moins de deux années", "La preuve : test rétrospectif", "méthode naïve", "Réels dans la fourchette", "Ce que la prévision suppose", "Coût estimé", "Émissions estimées", "Fourchette à 80 %"])
    verifier(texte.includes(attendu), "la page (français) contient « " + attendu + " »");
  verifier(trouver(page(), n => n.tagName === "SVG" && /Prévision de/.test(n.attrs["aria-label"] || "")).length === 1 && trouver(page(), n => n.tagName === "PATH" && n.attrs["stroke-dasharray"] === "5 5").length >= 2, "deux graphiques : la prévision centrale est tracée en tirets, à part du réel");
  const KS = prevCalcul(site);
  verifier(texte.includes(fmtEnergie(prevRond(KS.att.central, (KS.att.haut - KS.att.bas) / 2))) && texte.includes(fmtPct(KS.retro.global.erreur)) && texte.includes(fmtPct(KS.retro.global.erreurNaive)), "les chiffres de tête sont ceux du calcul : atterrissage arrondi, erreur de la méthode et de la méthode naïve");
  // boutons : un horizon permis se choisit, un horizon refusé est désactivé et ne change rien
  const bouton = t => trouver(page(), n => n.tagName === "BUTTON" && n.textContent === t)[0];
  cliquer(bouton("6 mois"));
  verifier(prevEtat.horizon === 6 && bouton("6 mois").attrs["aria-pressed"] === "true", "clic sur « 6 mois » : l'horizon change et la page se redessine");
  cliquer(bouton("12 mois glissants")); verifier(prevEtat.cumul === "glissant", "clic sur « 12 mois glissants »");
  cliquer(bouton("Prolongée")); verifier(prevEtat.derive === true && /dérive en cours prolongée/.test(texteDe(page())), "clic sur « Prolongée » : la dérive en cours est prolongée, et la page le dit");
  cliquer(trouver(page(), n => n.tagName === "BUTTON" && n.textContent === "Voir le tableau")[0]);
  verifier(etat.tables.has("prev-courbe") && /Prévision centrale \(/.test(texteDe(page())), "« Voir le tableau » remplace le graphique par le tableau des périodes");
  if (courte) {
    Object.assign(prevEtat, { serie: courte.nom, horizon: 3, derive: false, cumul: "annee" }); rendre();
    const b12 = bouton("12 mois");
    verifier(b12.disabled && !!b12.attrs.title && /Horizon refusé/.test(texteDe(page())), "série courte : le bouton « 12 mois » est désactivé, avec son motif en infobulle et dans une note");
    cliquer(b12); verifier(prevEtat.horizon === 3, "clic sur un horizon refusé : rien ne change");
    const sansDerive = bouton("Prolongée");
    verifier(sansDerive.disabled === !prevCalcul(courte).aDerive && !!sansDerive.attrs.title === sansDerive.disabled, "le réglage de dérive est désactivé, avec son motif, exactement quand la série n'a pas de dérive en cours");
  }
  { // le réglage de dérive : actif pour chaque série qui a une dérive en cours, désactivé pour les autres ; tracés sans valeur invalide
    let okReglage = true, okTraces = true, nTraces = 0;
    for (const sr of m.series) {
      Object.assign(prevEtat, { serie: sr.nom, horizon: 3, derive: false, cumul: "annee" }); etat.tables = new Set(); rendre();
      const K = prevCalcul(sr); if (K.ok && bouton("Prolongée").disabled !== !K.aDerive) okReglage = false;
      trouver(page().querySelector(".feuille"), n => ["PATH", "LINE", "RECT", "CIRCLE", "TEXT"].includes(n.tagName)).forEach(n => { nTraces++; if (/NaN|undefined|Infinity/.test(Object.values(n.attrs).join(" "))) okTraces = false; });
    }
    verifier(okReglage, "réglage « Dérive en cours » : actif exactement pour les séries qui ont une dérive en cours");
    verifier(nTraces > 300 && okTraces, "graphiques : " + nTraces + " éléments tracés, aucune coordonnée invalide");
  }

  /* ---- 9. Classeurs fabriqués : réponse connue, série trop courte, série mensuelle, facteurs de moins d'un an ---- */
  const serial = t => (t - Date.UTC(1899, 11, 30)) / JOUR;
  function fabriquer(nSem, series) {                                   // un facteur saisonnier (cosinus sur l'année), un facteur constant
    const C = [, [, "Date"].concat(series.map(x => x.nom))], F = [, [, "Date", "Saison", "Constant"]], dates = [];
    for (let i = 0; i < nSem; i++) {
      const t = Date.UTC(2021, 0, 4) + i * 7 * JOUR, f1 = 50 + 30 * Math.cos(2 * Math.PI * prevJourAn(t) / 365.25);
      dates.push(t); F.push([, serial(t), f1, 100]);
      C.push([, serial(t)].concat(series.map(x => x.garder(i, t, nSem) ? x.base + x.coef * f1 + 3 * 100 : 0)));
    }
    const E = [, [, "Facteurs"].concat(series.map(x => x.nom)), [, "Base"].concat(series.map(x => x.base)), [, "Saison"].concat(series.map(x => x.coef)), [, "Constant"].concat(series.map(() => 3))];
    const W = [, [, "NAME"].concat(series.map(x => x.nom)), [, "Energy type"].concat(series.map(() => "Electricité")), [, "Level"].concat(series.map((x, i) => i ? "UES" : "Site")), [, "Asset"], [, "Weekly target"],
      [, "Err day"], [, "Err week"].concat(series.map(x => x.errSemaine || 0)), [, "Err month"].concat(series.map(x => x.errMois || 0)), [, "Err year"], [, "Type"].concat(series.map(() => "Simple"))];
    return { grilles: { "CONSO": C, "FACTEURS INF": F, "EQUATION": E, "WIKI": W }, dates };
  }
  const exact = t => (1000 + 20 * (50 + 30 * Math.cos(2 * Math.PI * prevJourAn(t) / 365.25)) + 300) * 1000;
  const S = fabriquer(156, [
    { nom: "Synth exacte", base: 1000, coef: 20, errSemaine: 0.05, garder: () => true },
    { nom: "Synth courte", base: 500, coef: 5, errSemaine: 0.05, garder: (i, t, n) => i >= n - 10 },
    { nom: "Synth mensuelle", base: 5000, coef: 10, errMois: 0.1, garder: (i, t) => new Date(t).getUTCDate() <= 7 },
    { nom: "Synth sans erreur", base: 800, coef: 0, garder: (i, t, n) => i >= n - 8 }]);
  charger(S.grilles, false, "synthese.xlsx", null);
  const ms = etat.modele, [sA, sB, sC, sD] = ms.series;
  verifier(prevEtat.serie === null && prevLecture().fidele.every(f => f.ok) && sC.pas === "month" && sA.pas === "week", "nouveau classeur : l'état du module repart de zéro, la relecture est fidèle, une série est au pas mensuel sur une grille hebdomadaire");
  { const obs = prevObs(sA), o = obs[obs.length - 1], P = prevPrevoir(sA, o, 52, false);
    const ecart = Math.max(...P.periodes.map(p => Math.abs(p.central - exact(p.t)) / exact(p.t)));
    verifier(P.complet && ecart < 0.01, "réponse connue : sur une série qui suit exactement son modèle et un facteur parfaitement saisonnier, la prévision à 52 semaines retrouve la vraie valeur à " + (ecart * 100).toFixed(2) + " % près (moins de 1 % attendu)");
    verifier(P.sigma === 0.05 && P.periodes.every(p => p.haut - p.central >= PREV.z * 0.05 * p.central * (1 - 1e-9)), "réponse connue : l'erreur retenue est celle du classeur (5 %), la série n'ayant aucun écart mesuré");
    const R = prevRetro(sA, 52, false);
    verifier(R.possible && R.n === 52 && R.global.erreur < 0.01 && R.global.couverture === 1, "avec 3 ans d'historique, le test rétrospectif couvre les 52 semaines (" + R.origines + " origines), erreur " + fmtPct(R.global.erreur) + ", tous les réels dans la fourchette");
    verifier(prevHorizons(sA).every(x => !x.motif), "avec 3 ans d'historique, les trois horizons sont proposés"); }
  verifier(prevHorizons(sB).every(x => x.motif) && prevCalcul(sB).ok === false, "série de 10 points : aucun horizon proposé, avec un motif");
  verifier(prevHorizons(sD).every(x => x.motif), "série de 8 points sans erreur de modèle : aucun horizon proposé");
  { const hz = prevHorizons(sC), obs = prevObs(sC), P = prevPrevoir(sC, obs[obs.length - 1], 12, false);
    const vrai = t => (5000 + 10 * (50 + 30 * Math.cos(2 * Math.PI * prevJourAn(t) / 365.25)) + 300) * 1000, ecart = Math.max(...P.periodes.map(p => Math.abs(p.central - vrai(p.t)) / vrai(p.t)));
    verifier(hz.every(x => !x.motif) && P.complet && ecart < 0.03, "série mensuelle (" + obs.length + " points) : 12 mois prévus, à " + (ecart * 100).toFixed(2) + " % près de la vraie valeur (moins de 3 % attendu : la fenêtre d'un mois lisse la saison)");
    const R = prevRetro(sC, 12, false);
    verifier(R.possible && R.global.erreur < 0.03 && R.paires.every(p => p.t > ms.dates[p.o]), "série mensuelle : test rétrospectif possible (" + R.origines + " origines de " + R.n + " mois), erreur " + fmtPct(R.global.erreur)); }
  erreurs = []; rendus = 0;
  etat.onglet = "prevision";
  for (const langue of ["fr", "en"]) { LANGUE = langue; CACHE_TR.clear();
    for (const sr of ms.series) for (const horizon of [3, 12]) for (const cumul of ["annee", "glissant"]) {
      Object.assign(prevEtat, { serie: sr.nom, horizon, derive: true, cumul });
      try { rendre(); rendus++; if (/undefined|NaN|\[object/.test(texteDe(page()))) erreurs.push(sr.nom + " : texte suspect"); } catch (e) { erreurs.push(sr.nom + " " + horizon + " " + cumul + " " + langue + " : " + (e && e.stack || e)); }
    } }
  verifier(rendus === 32 && !erreurs.length, "classeur fabriqué : " + rendus + " rendus sans erreur, séries trop courtes comprises" + (erreurs.length ? " — " + erreurs.slice(0, 2).join(" | ") : ""));
  LANGUE = "fr"; CACHE_TR.clear();
  Object.assign(prevEtat, { serie: sB.nom, horizon: 3, derive: false, cumul: "annee" }); rendre();
  texte = texteDe(page());
  verifier(/Aucune prévision n'est proposée pour cette série/.test(texte) && /Horizon refusé : 3 mois, 6 mois, 12 mois/.test(texte) && trouver(page(), n => n.tagName === "BUTTON" && /mois$/.test(n.textContent) && n.textContent.length < 8).every(b => b.disabled),
    "série trop courte : la page le dit, donne le motif, et désactive les trois horizons");
  // facteurs de moins d'un an : certaines places du calendrier n'ont jamais été observées
  const S2 = fabriquer(30, [{ nom: "Synth 30 semaines", base: 1000, coef: 20, errSemaine: 0.05, garder: () => true }]);
  charger(S2.grilles, false, "synthese-30.xlsx", null);
  { const sr = etat.modele.series[0], hz = prevHorizons(sr);
    verifier(hz.every(x => x.motif) && /moins d'un an/.test(hz[0].motif) && prevRetro(sr, 13, false).possible === false, "30 semaines de facteurs : aucune prévision (places du calendrier jamais observées), aucun test rétrospectif");
    etat.onglet = "prevision"; let ok = true; try { rendre(); } catch (e) { ok = false; console.log(e); }
    verifier(ok && /Horizon refusé/.test(texteDe(page())), "30 semaines : la page se rend et explique le refus"); }
  // un an et demi fabriqué, série d'un an : prévision permise à 3 mois, test rétrospectif impossible, et la page le dit
  const S3 = fabriquer(70, [{ nom: "Synth 70 semaines", base: 1000, coef: 20, errSemaine: 0.05, garder: () => true }, { nom: "Synth récente", base: 700, coef: 4, errSemaine: 0.05, garder: (i, t, n) => i >= n - 14 }]);
  charger(S3.grilles, false, "synthese-70.xlsx", null);
  { const sr = etat.modele.series[1], hz = prevHorizons(sr), R = prevRetro(sr, 13, false);
    verifier(!hz[0].motif && hz[1].motif && !R.possible, "série de 14 points : 3 mois proposés, 6 et 12 mois refusés, test rétrospectif impossible");
    Object.assign(prevEtat, { serie: sr.nom, horizon: 3, derive: false, cumul: "annee" }); etat.onglet = "prevision"; rendre();
    verifier(/Test rétrospectif impossible/.test(texteDe(page())) && /Prévision non vérifiée/.test(texteDe(page())), "sans test rétrospectif possible, la page annonce une prévision non vérifiée"); }

  /* ---- 10. Retour au classeur réel, réseau ---- */
  charger(grillesReelles, false, "retour.xlsm", null);
  verifier(etat.modele.series.length === m.series.length && prevLecture().fidele.every(f => f.ok), "retour au classeur réel : le module se recale sur le nouveau modèle");
  verifier(__reseau.length === 0, "aucun appel réseau");
}
