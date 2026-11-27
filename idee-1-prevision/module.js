/* ============================================================================
   Module « Prévision » (groupe Anticipation) : prévision statistique, sans IA.
   Le modèle de référence de la série (équations relues dans le classeur) reçoit
   les facteurs observés aux mêmes périodes du calendrier ; la fourchette ajoute
   l'erreur du modèle ; un test rétrospectif à origine glissante mesure le
   résultat et le compare à une méthode naïve.
   ============================================================================ */
const PREV = {
  niveau: 0.8, z: 1.2816,   // fourchette à 80 % : quantiles 10 % et 90 % ; z = quantile 90 % d'une loi normale
  voisins: { day: 10, week: 2, month: 1 },   // fenêtre du calendrier, en périodes de part et d'autre
  jours: { day: 1, week: 7, month: 30.4375 },
  periodes: { 3: { day: 91, week: 13, month: 3 }, 6: { day: 182, week: 26, month: 6 }, 12: { day: 365, week: 52, month: 12 } },
  minPoids: 1.4,   // poids d'historique qu'il faut à une place du calendrier (une année complète en donne environ 3 au pas hebdomadaire)
  minPoints: 12,   // périodes comparées qu'il faut pour mesurer une erreur
  minOrigines: 6,   // prévisions passées qu'il faut pour un test rétrospectif
  minEcheance: { day: 7, week: 4, month: 1 },   // échéance la plus courte qui mérite un test
  ecartNet: 0.1,   // en dessous de 10 % d'écart d'erreur, les deux méthodes sont dites équivalentes
  cible: [0.25, 4]   // un objectif n'est comparé que s'il vaut entre 0,25 et 4 fois la consommation habituelle
};
const prevEtat = { serie: null, horizon: 3, derive: false, cumul: "annee" };
let prevMemo = null;   // { modele, lecture, retros } : refait à chaque nouveau classeur
AU_CHARGEMENT.push(() => { prevMemo = null; Object.assign(prevEtat, { serie: null, horizon: 3, derive: false, cumul: "annee" }); });

/* ---- Lecture des équations (même logique que calculer, qui ne les expose pas) ---- */
function prevLecture() {
  const m = etat.modele;
  if (prevMemo && prevMemo.modele === m) return prevMemo.lecture;
  const G = grillesChargees || {}, C = G["CONSO"] || [], F = G["FACTEURS INF"] || [], E1 = G["EQUATION"] || [], E2 = G["EQUATION 2"] || [], W = G["WIKI"] || [];
  const val = (g, l, c) => { const r = g[l]; const x = r ? r[c] : null; return x == null || x === "" ? null : x; };
  const num = v => typeof v === "number" ? v : (typeof v === "string" && v.trim() !== "" && isFinite(+v.replace(",", ".")) ? +v.replace(",", ".") : 0);
  const versDate = v => {
    if (typeof v === "number") return v >= 1 ? Date.UTC(1899, 11, 30) + (Math.floor(v) + (d1904Charge ? 1462 : 0)) * JOUR : null;
    if (typeof v === "string") {
      let r = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
      if (r) return Date.UTC(+r[1], +r[2] - 1, +r[3]);
      r = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(v.trim());
      if (r) return Date.UTC(+r[3], +r[2] - 1, +r[1]);
    }
    return null;
  };
  const lignes = [];
  for (let l = 2; l < C.length; l++) if (versDate(val(C, l, 1)) != null) lignes.push(l);
  const nbFact = m.facteurs.length, X = lignes.map(l => { const x = []; for (let k = 1; k <= nbFact; k++) x.push(num(val(F, l, k + 1))); return x; });
  const eq = m.series.map((sr, i) => {
    const c = i + 2, col = g => { const out = []; for (let k = 1; k <= nbFact; k++) out.push(num(val(g, k + 2, c))); return out; };
    return { b1: num(val(E1, 2, c)), c1: col(E1), b2: num(val(E2, 2, c)), c2: col(E2), saisonnier: String(val(W, 10, c) == null ? "" : val(W, 10, c)).trim().toLowerCase() === "saisonnier",
      saisons: [[versDate(val(W, 11, c)), versDate(val(W, 12, c))], [versDate(val(W, 13, c)), versDate(val(W, 14, c))]].filter(p => p[0] != null && p[1] != null) };
  });
  // pas de la grille des dates : une série au même pas peut emprunter les facteurs de n'importe quelle ligne
  const ecarts = [];
  for (let j = 1; j < m.dates.length; j++) ecarts.push(Math.abs(m.dates[j] - m.dates[j - 1]) / JOUR);
  ecarts.sort((a, b) => a - b);
  const med = ecarts.length ? ecarts[Math.floor(ecarts.length / 2)] : 1;
  const lecture = { ok: lignes.length === m.dates.length, X, eq, pasGrille: med <= 1.5 ? "day" : med <= 10 ? "week" : "month", fidele: [] };
  // contrôle : la relecture doit redonner la référence du tableau de bord, sinon la série n'est pas prévue
  m.series.forEach((sr, i) => {
    let pire = 0;
    if (lecture.ok) sr.ref.forEach((r, j) => { if (r != null) pire = Math.max(pire, Math.abs(prevModele(eq[i], X[j], m.dates[j], false) - r) / Math.max(1, Math.abs(r))); });
    lecture.fidele.push({ ok: lecture.ok && pire <= 1e-9, pire });
  });
  prevMemo = { modele: m, lecture, retros: new Map() };
  return lecture;
}
/* Été d'un modèle saisonnier : les dates du WIKI ; pour une période à venir, au-delà de la dernière saison saisie, les mêmes dates reportées d'année en année. */
function prevEte(e, t, avenir) {
  if (!e.saisonnier || !e.saisons.length) return false;
  if (e.saisons.some(p => t >= p[0] && t <= p[1])) return true;
  if (!avenir || t <= Math.max(...e.saisons.map(p => p[1]))) return false;
  const d = new Date(t);
  for (let n = 1; n <= 6; n++) { const u = Date.UTC(d.getUTCFullYear() - n, d.getUTCMonth(), d.getUTCDate()); if (e.saisons.some(p => u >= p[0] && u <= p[1])) return true; }
  return false;
}
/* Valeur du modèle de référence, en Wh, pour un jeu de facteurs x à la date t. */
function prevModele(e, x, t, avenir) {
  const ete = prevEte(e, t, avenir), c = ete ? e.c2 : e.c1;
  let r = ete ? e.b2 : e.b1;
  for (let k = 0; k < x.length; k++) r += x[k] * c[k];
  return r * 1000;
}

/* ---- Calendrier et petits calculs ---- */
function prevDate(pas, t, k) {   // date de la k-ième période après t (avant t si k < 0), au pas de la série
  if (pas !== "month") return t + k * PREV.jours[pas] * JOUR;
  const d = new Date(t), c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k, 1));
  return Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), Math.min(d.getUTCDate(), new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 0)).getUTCDate()));
}
function prevLibelle(pas, t) {
  const d = new Date(t);
  if (pas === "month") return MOIS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  if (pas === "week") { const w = semaineISO(t); return "S" + String(w.sem).padStart(2, "0") + " " + w.an; }
  return fmtDate(t);
}
const prevAn = t => new Date(t).getUTCFullYear();
const prevJourAn = t => (t - Date.UTC(prevAn(t), 0, 1)) / JOUR;
/* Poids d'une ligne de l'historique pour une période à prévoir : 1 à la même place dans l'année, puis décroissant jusqu'à 0 hors de la fenêtre. */
function prevPoids(pas, tCible, tLigne) {
  let d = Math.abs(prevJourAn(tCible) - prevJourAn(tLigne));
  if (d > 182.625) d = 365.25 - d;
  return Math.max(0, 1 - d / PREV.jours[pas] / (PREV.voisins[pas] + 1));
}
function prevQuantile(paires, q) {   // paires [valeur, poids] : quantile pondéré, interpolé entre les points
  const p = paires.slice().sort((a, b) => a[0] - b[0]), total = p.reduce((x, v) => x + v[1], 0);
  let cumul = 0, avant = null;
  for (const [v, w] of p) {
    const pos = (cumul + w / 2) / total;
    if (pos >= q) return avant == null ? v : avant[0] + (v - avant[0]) * (q - avant[1]) / (pos - avant[1]);
    avant = [v, pos]; cumul += w;
  }
  return p[p.length - 1][0];
}
function prevLigne(lignes, t, tolJours) {   // parmi ces lignes, la plus proche d'une date, dans la tolérance ; -1 sinon
  const d = etat.modele.dates; let mieux = -1, e = tolJours * JOUR;
  for (const j of lignes) { const x = Math.abs(d[j] - t); if (x <= e) { e = x; mieux = j; } }
  return mieux;
}
function prevObs(sr) {   // lignes où la série a une consommation, dans l'ordre du temps
  const d = etat.modele.dates, out = [];
  sr.conso.forEach((v, j) => { if (v != null) out.push(j); });
  return out.sort((a, b) => d[a] - d[b]);
}
/* Un total prévu n'est pas affiché plus finement qu'il n'est connu : deux chiffres significatifs, davantage seulement si sa fourchette est plus étroite que cela. */
function prevRond(v, demi) {
  if (!v || !(demi > 0)) return v;
  const p = Math.pow(10, Math.min(Math.floor(Math.log10(Math.abs(v))) - 1, Math.floor(Math.log10(demi / 2))));
  return Math.round(v / p) * p;
}
const prevNomPas = (pas, n) => Lg(n + " " + (pas === "month" ? "mois" : NOM_PAS[pas] + (n > 1 ? "s" : "")), n + " " + M(NOM_PAS[pas]) + (n === 1 ? "" : "s"));
const prevColonnes = (noms, u) => noms.map(x => tr(x) + " (" + u.nom + ")");   // en-têtes de colonnes en énergie : le nom traduit, puis l'unité
/* Texte fixe long : sa traduction est déclarée là où il est écrit (une seule fois), plutôt que répétée dans la table du bas. */
const prevT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };
const prevMois = n => Lg(n + " mois", n + " months");
const prevDeA = (a, b) => fmtEnergie(a) + Lg(" à ", " to ") + fmtEnergie(b);
const prevEntre = (f, a, b) => Lg("entre " + f(a) + " et " + f(b), "between " + f(a) + " and " + f(b));

/* ---- Dérive en cours vue depuis la ligne o : la règle de la page Détection, sur les seules données connues à cette date ---- */
function prevDerive(sr, o) {
  const d = etat.modele.dates, coupe = t => t.map((v, j) => d[j] <= d[o] ? v : null);
  const A = analyserSerie(Object.assign({}, sr, { conso: coupe(sr.conso), ref: coupe(sr.ref) }));
  if (!A.ok) return { connue: false, motif: A.motif, pct: null };
  const ep = A.episodes.find(e => e.iFin === A.dernier);
  return ep ? { connue: true, pct: ep.pct, n: ep.n, depuis: ep.libDebut, sens: ep.sens } : { connue: true, pct: null };
}

/* ---- Prévision des n périodes qui suivent la ligne o, avec les seules lignes datées de o ou d'avant ---- */
function prevPrevoir(sr, o, n, avecDerive) {
  const m = etat.modele, L = prevLecture(), e = L.eq[m.series.indexOf(sr)], pas = sr.pas, tO = m.dates[o];
  const out = { o, pas, periodes: [], sigma: null, sigmaClasseur: null, sigmaMesure: null, derive: null, facteur: 1, complet: true };
  // lignes dont les facteurs servent de scénario : celles de l'historique connu à l'origine
  const memePas = L.pasGrille === pas, analogues = [];
  for (let j = 0; j < m.dates.length; j++) if (m.dates[j] <= tO && m.dates[j] <= m.fin && (memePas || sr.conso[j] != null)) analogues.push(j);
  // erreur du modèle : la plus grande entre celle du classeur et celle mesurée jusqu'à l'origine (écart relatif non dépassé 8 fois sur 10, ramené à un écart-type)
  const connues = [];
  for (let j = 0; j < m.dates.length; j++) if (m.dates[j] <= tO && sr.conso[j] != null && sr.ref[j] > 0) connues.push(j);
  const tri = connues.map(j => sr.ref[j]).sort((a, b) => a - b), plancher = tri.length ? DERIVE.plancher * tri[Math.floor(tri.length / 2)] : 0;
  const rel = connues.filter(j => sr.ref[j] >= plancher).map(j => [Math.abs(sr.conso[j] - sr.ref[j]) / sr.ref[j], 1]);
  out.nCompares = rel.length;
  if (sr.err[RANG[pas]] > 0) out.sigmaClasseur = sr.err[RANG[pas]];
  if (rel.length >= PREV.minPoints) out.sigmaMesure = prevQuantile(rel, PREV.niveau) / PREV.z;
  if (out.sigmaClasseur != null || out.sigmaMesure != null) out.sigma = Math.max(out.sigmaClasseur || 0, out.sigmaMesure || 0);
  if (avecDerive) { out.derive = prevDerive(sr, o); if (out.derive.pct != null) out.facteur = Math.max(0, 1 + out.derive.pct); }
  for (let k = 1; k <= n; k++) {
    const t = prevDate(pas, tO, k), paires = [], x = e.c1.map(() => 0);
    let poids = 0, moyenne = 0;
    for (const j of analogues) {
      const w = prevPoids(pas, t, m.dates[j]);
      if (!(w > 0)) continue;
      const v = prevModele(e, L.X[j], t, true);
      paires.push([v, w]); poids += w; moyenne += w * v;
      for (let f = 0; f < x.length; f++) x[f] += w * L.X[j][f];
    }
    const p = { t, lib: prevLibelle(pas, t), n: paires.length, central: null, bas: null, haut: null, basFacteurs: null, hautFacteurs: null, x: x.map(v => poids ? v / poids : null) };
    if (paires.length >= 2 && poids >= PREV.minPoids && out.sigma != null) {
      const c = Math.max(0, moyenne / poids * out.facteur), marge = PREV.z * out.sigma * c;
      p.central = c;
      p.basFacteurs = Math.min(c, Math.max(0, prevQuantile(paires, (1 - PREV.niveau) / 2) * out.facteur));
      p.hautFacteurs = Math.max(c, prevQuantile(paires, (1 + PREV.niveau) / 2) * out.facteur);
      p.bas = Math.max(0, c - Math.hypot(c - p.basFacteurs, marge));   // deux incertitudes supposées indépendantes : elles s'ajoutent en carré
      p.haut = c + Math.hypot(p.hautFacteurs - c, marge);
    } else out.complet = false;
    out.periodes.push(p);
  }
  return out;
}

/* ---- Méthode naïve de comparaison : même période un an plus tôt si elle est connue à l'origine, sinon dernière valeur connue ---- */
function prevNaive(sr, o, t, obs) {
  const m = etat.modele, d = new Date(t);
  let c = Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate());
  if (new Date(c).getUTCMonth() !== d.getUTCMonth()) c -= JOUR;
  const j = prevLigne(obs || prevObs(sr), c, sr.pas === "month" ? 15 : 3);
  return j >= 0 && m.dates[j] <= m.dates[o] ? { v: sr.conso[j], an1: true } : { v: sr.conso[o], an1: false };
}

/* ---- Test rétrospectif à origine glissante ----
   Pour chaque origine possible, on prévoit les périodes suivantes avec les seules données connues à cette date, puis on compare au réel.
   L'échéance testée est la plus longue, jusqu'à nVoulu, pour laquelle il reste au moins PREV.minOrigines origines. */
function prevRetro(sr, nVoulu, avecDerive) {
  prevLecture();
  const cle = etat.modele.series.indexOf(sr) + "|" + nVoulu + "|" + avecDerive;
  if (prevMemo.retros.has(cle)) return prevMemo.retros.get(cle);
  const m = etat.modele, pas = sr.pas, tol = PREV.jours[pas] / 2, obs = prevObs(sr), R = { possible: false, n: 0, origines: 0, min: PREV.minEcheance[pas] };
  prevMemo.retros.set(cle, R);
  if (obs.length < 2) return R;
  const tFin = m.dates[obs[obs.length - 1]], cand = [];
  for (const o of obs.slice(0, -1)) {
    let reste = 0;
    while (reste < nVoulu && prevDate(pas, m.dates[o], reste + 1) <= tFin + tol * JOUR) reste++;
    const P = prevPrevoir(sr, o, reste, avecDerive);
    let ok = 0;
    while (ok < P.periodes.length && P.periodes[ok].central != null) ok++;
    if (P.nCompares >= PREV.minPoints && ok) cand.push({ o, P, ok });
  }
  let H = 0, retenues = [];
  for (let n = Math.min(nVoulu, Math.max(0, ...cand.map(c => c.ok))); n >= R.min && !H; n--) { const l = cand.filter(c => c.ok >= n); if (l.length >= PREV.minOrigines) { H = n; retenues = l; } }
  R.origines = cand.filter(c => c.ok >= R.min).length;   // origines disponibles à l'échéance la plus courte
  if (!H) return R;
  const nT = Math.min(3, H), vide = () => ({ n: 0, reel: 0, abs: 0, signe: 0, dans: 0, absN: 0, signeN: 0 });
  const tout = vide(), tranches = Array.from({ length: nT }, (x, i) => Object.assign(vide(), { de: Math.floor(i * H / nT) + 1, a: Math.floor((i + 1) * H / nT) }));
  const totaux = { n: 0, reel: 0, abs: 0, absN: 0, dans: 0 }, cibles = new Set(), paires = [];
  let nAn1 = 0, exemple = null;
  for (const { o, P } of retenues) {
    let A = 0, C = 0, B = 0, Hh = 0, N = 0, entier = true;
    const reels = [], naives = [];
    for (let k = 0; k < H; k++) {
      const p = P.periodes[k], j = prevLigne(obs, p.t, tol), a = j >= 0 ? sr.conso[j] : null, nv = prevNaive(sr, o, p.t, obs);
      reels.push(a); naives.push(nv.v);
      if (a == null) { entier = false; continue; }
      const dans = a >= p.bas && a <= p.haut;
      for (const g of [tout, tranches[Math.min(nT - 1, Math.floor(k * nT / H))]]) { g.n++; g.reel += a; g.abs += Math.abs(p.central - a); g.signe += p.central - a; g.dans += dans ? 1 : 0; g.absN += Math.abs(nv.v - a); g.signeN += nv.v - a; }
      if (nv.an1) nAn1++;
      cibles.add(p.t); paires.push({ o, k: k + 1, t: p.t, reel: a, central: p.central, bas: p.bas, haut: p.haut, naive: nv.v });
      A += a; C += p.central; B += p.bas; Hh += p.haut; N += nv.v;
    }
    if (entier) { totaux.n++; totaux.reel += A; totaux.abs += Math.abs(C - A); totaux.absN += Math.abs(N - A); totaux.dans += A >= B && A <= Hh ? 1 : 0; }
    if (!exemple || (entier && !exemple.entier) || (entier === exemple.entier && m.dates[o] > m.dates[exemple.o])) exemple = { o, P, reels, naives, entier };
  }
  if (!tout.n || !(tout.reel > 0)) return R;
  const mesure = g => ({ n: g.n, erreur: g.abs / g.reel, biais: g.signe / g.reel, couverture: g.dans / g.n, erreurNaive: g.absN / g.reel, biaisNaive: g.signeN / g.reel });
  const dates = [...cibles].sort((a, b) => a - b);
  Object.assign(R, { possible: true, n: H, origines: retenues.length, paires, nPaires: tout.n, nCibles: dates.length, de: dates[0], a: dates[dates.length - 1], nAn1, nDerniere: tout.n - nAn1,
    global: mesure(tout), tranches: tranches.filter(g => g.n && g.reel > 0).map(g => Object.assign(mesure(g), { de: g.de, a: g.a })),
    totaux: totaux.n && totaux.reel > 0 ? { n: totaux.n, dans: totaux.dans, erreur: totaux.abs / totaux.reel, erreurNaive: totaux.absN / totaux.reel, couverture: totaux.dans / totaux.n } : null, exemple });
  return R;
}
/* Ce que le test permet de dire, sans arrondir en faveur de la méthode. */
function prevVerdict(R) {
  const g = R.global, gain = g.erreurNaive > 0 ? 1 - g.erreur / g.erreurNaive : 0;
  return { gain, sens: gain > PREV.ecartNet ? "mieux" : gain < -PREV.ecartNet ? "pire" : "egal",
    fourchette: g.couverture < PREV.niveau - 0.1 ? "etroite" : g.couverture > PREV.niveau + 0.12 ? "large" : "juste" };
}

/* ---- Horizons proposés pour une série : nombre de périodes, et motif quand l'horizon est refusé ---- */
function prevHorizons(sr) {
  const m = etat.modele, L = prevLecture(), obs = prevObs(sr), fid = L.fidele[m.series.indexOf(sr)];
  let base = !fid.ok ? "La relecture des équations ne redonne pas la référence du tableau de bord pour cette série : aucune prévision n'est proposée."
    : obs.length < PREV.minPoints ? Lg("La série n'a que " + prevNomPas(sr.pas, obs.length) + " de données : il en faut au moins " + PREV.minPoints + ".", "The series has only " + prevNomPas(sr.pas, obs.length) + " of data: at least " + PREV.minPoints + " are needed.") : null;
  return [3, 6, 12].map(mois => {
    const n = PREV.periodes[mois][sr.pas];
    let motif = base;
    if (!motif) {
      const P = prevPrevoir(sr, obs[obs.length - 1], n, false);
      motif = P.sigma == null ? "L'erreur du modèle n'est pas renseignée dans le classeur et l'historique est trop court pour la mesurer."
        : n > obs.length ? Lg("La série n'a que " + prevNomPas(sr.pas, obs.length) + " d'historique : la page ne prévoit pas plus loin que ce qu'elle a observé.", "The series has only " + prevNomPas(sr.pas, obs.length) + " of history: the page does not forecast further than what it has observed.")
        : !P.complet ? "Les facteurs influents couvrent moins d'un an : certaines périodes de l'année n'ont jamais été observées." : null;
    }
    return { mois, n, motif };
  });
}

/* ---- Atterrissage : réel déjà constaté + prévision, sur l'année civile en cours ou sur 12 mois glissants ---- */
function prevAtterrissage(sr, mode, P, nHorizon) {
  const m = etat.modele, pas = sr.pas, tO = m.dates[P.o], an = prevAn(P.periodes[0].t);
  let n = 0, de, lib;
  if (mode === "annee") {
    while (n < P.periodes.length && prevAn(P.periodes[n].t) === an) n++;
    if (prevAn(prevDate(pas, tO, n + 1)) === an) return { ok: false };   // la fin de l'année est plus loin que l'horizon permis
    de = Date.UTC(an, 0, 1); lib = String(an);
  } else {
    n = nHorizon; de = prevDate(pas, P.periodes[n - 1].t, 1 - PREV.periodes[12][pas]);
    lib = Lg("sur 12 mois jusqu'à " + P.periodes[n - 1].lib, "12 months to " + P.periodes[n - 1].lib);
  }
  const lignes = prevObs(sr).filter(j => m.dates[j] >= de && m.dates[j] <= tO), reel = somme(lignes.map(j => sr.conso[j]));
  const pr = P.periodes.slice(0, n), c = somme(pr.map(p => p.central)), b = somme(pr.map(p => p.bas)), hh = somme(pr.map(p => p.haut));
  const premier = lignes.length ? m.dates[lignes[0]] : null, attendues = premier == null ? 0 : Math.round((tO - premier) / JOUR / PREV.jours[pas]) + 1;
  return { ok: true, mode, lib, n, nReel: lignes.length, reel, prevu: { central: c, bas: b, haut: hh }, central: reel + c, bas: reel + b, haut: reel + hh,   // bornes du total = somme des bornes : prudent
    depuis: premier != null && premier > de + 1.5 * PREV.jours[pas] * JOUR ? premier : null, manquantes: Math.max(0, attendues - lignes.length) };
}
/* Objectif : la ligne 5 du WIKI (« Weekly target ») n'a pas d'unité. Elle n'est comparée que si, lue en kWh par semaine (unité de CONSO),
   elle est du même ordre que la consommation de la série. Sinon la page le dit et ne compare rien. */
function prevCible(sr, att) {
  if (sr.cible == null) return null;
  const v = sr.conso.filter(x => x != null).sort((a, b) => a - b), hebdo = v.length ? v[Math.floor(v.length / 2)] * 7 / PREV.jours[sr.pas] : 0;
  const part = hebdo > 0 ? sr.cible * 1000 / hebdo : null, plausible = part != null && part >= PREV.cible[0] && part <= PREV.cible[1];
  return { valeur: sr.cible, hebdo, part, plausible, total: plausible && att && att.ok ? sr.cible * 1000 * (att.nReel + att.n) * PREV.jours[sr.pas] / 7 : null };
}

/* ---- Tout ce que la page montre pour une série, avec les réglages courants ---- */
function prevCalcul(sr) {
  const m = etat.modele, horizons = prevHorizons(sr), permis = horizons.filter(x => !x.motif), K = { sr, horizons, ok: permis.length > 0 };
  if (!K.ok) return K;
  K.horizon = permis.find(x => x.mois === prevEtat.horizon) || permis.filter(x => x.mois < prevEtat.horizon).pop() || permis[0];
  const obs = prevObs(sr), o = obs[obs.length - 1], nMax = permis[permis.length - 1].n;
  K.obs = obs; K.derive = prevDerive(sr, o); K.aDerive = K.derive.pct != null; K.avec = K.aDerive && prevEtat.derive;
  let nAn = 1;
  while (nAn <= nMax && prevAn(prevDate(sr.pas, m.dates[o], nAn + 1)) === prevAn(prevDate(sr.pas, m.dates[o], 1))) nAn++;
  const n = Math.max(K.horizon.n, nAn <= nMax ? nAn : 0);
  K.P = prevPrevoir(sr, o, n, K.avec);
  K.att = prevAtterrissage(sr, prevEtat.cumul, K.P, K.horizon.n);
  if (K.aDerive) K.attAutre = prevAtterrissage(sr, prevEtat.cumul, prevPrevoir(sr, o, n, !K.avec), K.horizon.n);
  K.cible = prevCible(sr, K.att);
  K.retro = prevRetro(sr, K.horizon.n, K.avec); K.retroAutre = prevRetro(sr, K.horizon.n, !K.avec);
  return K;
}

/* ---- Graphique : réel en trait plein, prévision en tirets avec sa fourchette, séparés par un repère vertical ---- */
function prevGraph(zone, o) {
  const listes = [o.reel, o.ref, o.central, o.bas, o.haut], u = unitePour(listes), e = etendue(listes, false), n = o.etiquettes.length;
  const c = cadre(zone, { etiquettes: o.etiquettes, min: e.min, max: e.max, fmtY: v => nf(v / u.div, 2), titreY: u.nom, margeDroite: 20, hauteur: o.hauteur || 300, titre: o.titre });
  const chemin = (vals, attrs) => {
    let d = "";
    for (let i = 0; i < n; i++) if (vals[i] != null) {
      const seul = (i === 0 || vals[i - 1] == null) && (i === n - 1 || vals[i + 1] == null);
      if (seul) c.svg.append(s("circle", { cx: c.x(i), cy: c.y(vals[i]), r: 2.5, fill: attrs.stroke }));
      d += (i === 0 || vals[i - 1] == null ? "M" : "L") + c.x(i) + " " + c.y(vals[i]);
    }
    c.svg.append(s("path", Object.assign({ d, fill: "none", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, attrs)));
  };
  let a = 0;
  while (a < n) {   // fourchette : une surface par tronçon continu
    if (o.bas[a] == null) { a++; continue; }
    let b = a; while (b + 1 < n && o.bas[b + 1] != null) b++;
    if (a === b) c.svg.append(s("rect", { x: c.x(a) - c.pas / 3, y: c.y(o.haut[a]), width: c.pas * 2 / 3, height: Math.max(1, c.y(o.bas[a]) - c.y(o.haut[a])), fill: "var(--s1)", opacity: 0.16 }));
    else {
      let d = "";
      for (let k = a; k <= b; k++) d += (k === a ? "M" : "L") + c.x(k) + " " + c.y(o.haut[k]);
      for (let k = b; k >= a; k--) d += "L" + c.x(k) + " " + c.y(o.bas[k]);
      c.svg.append(s("path", { d: d + "Z", fill: "var(--s1)", opacity: 0.16 }));
    }
    a = b + 1;
  }
  const xC = c.x(o.coupure) - c.pas / 2;   // repère : tout ce qui est à droite était inconnu au moment de prévoir
  c.svg.append(s("line", { x1: xC, x2: xC, y1: c.mg.h - 12, y2: c.mg.h + c.plotH, stroke: "var(--encre2)", "stroke-width": 1, "stroke-dasharray": "2 3" }));
  const large = c.plotL > 420;
  if (large || xC - c.mg.g > 150) c.svg.append(s("text", { x: xC - 6, y: c.mg.h - 4, "text-anchor": "end", class: "prev-repere" }, o.avant));
  if (large || xC - c.mg.g <= 150) c.svg.append(s("text", { x: xC + 6, y: c.mg.h - 4, class: "prev-repere" }, o.apres));
  if (o.ref) chemin(o.ref, { stroke: "var(--contexte)", "stroke-width": 1.25, opacity: 0.75 });
  chemin(o.reel, { stroke: "var(--s1)" });
  chemin(o.central, { stroke: "var(--s1)", "stroke-dasharray": "5 5" });
  const repere = s("line", { y1: c.mg.h, y2: c.mg.h + c.plotH, stroke: "var(--axe)", "stroke-width": 1, visibility: "hidden" });
  c.svg.append(repere);
  survol(c, n, (i, evt) => {
    if (i < 0) { repere.setAttribute("visibility", "hidden"); return; }
    repere.setAttribute("x1", c.x(i)); repere.setAttribute("x2", c.x(i)); repere.setAttribute("visibility", "visible");
    const l = [];
    if (o.reel[i] != null) l.push({ couleur: "var(--s1)", valeur: fmtEnergie(o.reel[i]), nom: "Réel" });
    if (o.ref && o.ref[i] != null) l.push({ couleur: "var(--contexte)", valeur: fmtEnergie(o.ref[i]), nom: "Référence (modèle)" });
    if (o.central[i] != null) l.push({ couleur: "var(--s1)", valeur: fmtEnergie(o.central[i]), nom: "Prévision centrale" }, { valeur: prevDeA(o.bas[i], o.haut[i]), nom: "Fourchette à 80 %" });
    if (o.complement) l.push(...o.complement(i));
    if (!l.length) l.push({ valeur: "–", nom: "pas de donnée" });
    montrerTip(evt, o.etiquettes[i], l);
  });
}
function prevSegments(options, courant, choisir) {   // comme segments(), avec des choix désactivés qui disent pourquoi
  return h("div", { class: "segments prev-segments", role: "group" }, options.map(o => h("button", { type: "button", "aria-pressed": String(o.v === courant), disabled: !!o.motif, title: o.motif || null,
    onclick: () => { if (!o.motif) choisir(o.v); } }, o.t)));
}

/* ---- Page ---- */
function prevPage() {
  const m = etat.modele, dispo = m.series.filter(x => x.nbPoints > 0);
  if (!dispo.length) return [h("div", { class: "vide" }, "Aucune consommation à prévoir dans ce classeur.")];
  const sr = dispo.find(x => x.nom === prevEtat.serie) || dispo.find(x => x.nom === etat.nomSite) || dispo[0], pas = sr.pas;
  prevEtat.serie = sr.nom;
  const K = prevCalcul(sr), L = prevLecture(), np = n => prevNomPas(pas, n), eqn = L.eq[m.series.indexOf(sr)], regler = (cle, v) => { prevEtat[cle] = v; rendre(); };
  const sansDerive = !K.ok ? "Aucune prévision pour cette série." : !K.derive.connue ? "Dérive non mesurable : l'erreur du modèle n'est pas renseignée dans le classeur pour cette série." : !K.aDerive ? "Aucune dérive en cours sur cette série : rien à prolonger." : null;
  const filtres = h("div", { class: "filtres prev-filtres" },
    filtre("Série", liste([["site", "Site"], ["ues", "UES"]].map(([g, t]) => ({ groupe: t, options: dispo.filter(x => x.groupe === g).map(x => ({ v: x.nom, t: x.nom })) })).filter(g => g.options.length), sr.nom, v => regler("serie", v))),
    filtre("Horizon", prevSegments(K.horizons.map(x => ({ v: x.mois, t: prevMois(x.mois), motif: x.motif })), K.ok ? K.horizon.mois : null, v => regler("horizon", v))),
    filtre("Dérive en cours", prevSegments([{ v: false, t: "Non prolongée", motif: sansDerive }, { v: true, t: "Prolongée", motif: sansDerive }], K.ok && K.avec, v => regler("derive", v))),
    filtre("Atterrissage sur", segments([{ v: "annee", t: "Année civile" }, { v: "glissant", t: "12 mois glissants" }], prevEtat.cumul, v => regler("cumul", v))));
  const refus = K.horizons.filter(x => x.motif), motifs = [...new Set(refus.map(x => x.motif))];
  const noteRefus = refus.length ? h("div", { class: "note attention prev-note" }, motifs.map(t => [Lg("Horizon refusé : ", "Horizon refused: ") + refus.filter(x => x.motif === t).map(x => prevMois(x.mois)).join(", ") + ". ", t, " "])) : null;
  if (!K.ok) return [h("div", { class: "constat prev-reponse alerte" }, h("p", { class: "titre" }, "Aucune prévision n'est proposée pour cette série.")), filtres, noteRefus];

  const P = K.P, att = K.att, R = K.retro, nH = K.horizon.n, e = sr.energie, o = P.o, tO = m.dates[o];
  const prevus = P.periodes.slice(0, nH), tot = { central: somme(prevus.map(p => p.central)), bas: somme(prevus.map(p => p.bas)), haut: somme(prevus.map(p => p.haut)) };
  const T = att.ok ? att : tot, demi = (T.haut - T.bas) / 2, rd = v => prevRond(v, demi);   // chiffres de tête
  const titreT = att.ok ? Lg("Atterrissage " + att.lib, "Landing, " + att.lib) : Lg("Prévision sur " + np(nH), "Forecast over " + np(nH));
  const wh = v => fmtEnergie(rd(v)), eur = v => fmtEuros(prevRond(coutDe(e, v), coutDe(e, demi))), co2 = v => fmtCO2(prevRond(co2De(e, v), co2De(e, demi)));
  // la preuve, en une phrase
  let preuve, V = null;
  if (R.possible) {
    V = prevVerdict(R);
    const g = R.global;
    preuve = Lg("Sur le passé, cette méthode s'est trompée de " + fmtPct(g.erreur) + " en moyenne ; elle " + (V.sens === "mieux" ? "fait mieux que" : V.sens === "pire" ? "fait moins bien que" : "ne fait pas nettement mieux que") + " la méthode naïve (" + fmtPct(g.erreurNaive) + ").",
      "On past data, this method was off by " + fmtPct(g.erreur) + " on average; it " + (V.sens === "mieux" ? "beats" : V.sens === "pire" ? "does worse than" : "is not clearly better than") + " the naive method (" + fmtPct(g.erreurNaive) + ").")
      + (R.n < nH ? Lg(" Test fait jusqu'à " + np(R.n) + " d'avance seulement : au-delà, la prévision n'est pas vérifiée.", " Tested only up to " + np(R.n) + " ahead: beyond that, the forecast is unverified.") : "");
  } else preuve = Lg("Prévision non vérifiée : l'historique est trop court pour un test rétrospectif. Lisez-la comme un ordre de grandeur.", "Unverified forecast: the history is too short for a backtest. Read it as an order of magnitude.");
  const constat = h("div", { class: "constat prev-reponse" + (R.possible && V.sens !== "pire" ? "" : " alerte") },
    h("p", { class: "titre" }, titreT + Lg(" de « " + sr.nom + " » : ", " for “" + sr.nom + "”: ") + wh(T.central) + Lg(", entre ", ", between ") + wh(T.bas) + Lg(" et ", " and ") + wh(T.haut) + "."),
    h("p", { class: "suite" }, preuve));

  const sansValo = valoDe(e).prix == null ? "prix non renseigné pour cette énergie (page Détection)" : null;
  let tuileCible;
  if (!K.cible) tuileCible = tuile("Objectif", "–", "aucun objectif pour cette série dans le classeur");
  else if (K.cible.total == null) tuileCible = tuile("Objectif", "–", K.cible.plausible ? "non comparé" : "valeur du classeur non exploitable, voir la note");
  else { const d = att.central - K.cible.total;
    tuileCible = tuile("Objectif", fmtEnergie(K.cible.total), att.bas > K.cible.total ? Lg("dépassé de " + fmtPct(d / K.cible.total) + ", même en fourchette basse", "exceeded by " + fmtPct(d / K.cible.total) + ", even at the low end")
      : att.haut < K.cible.total ? Lg("tenu avec " + fmtPct(-d / K.cible.total) + " de marge, même en fourchette haute", "met with a " + fmtPct(-d / K.cible.total) + " margin, even at the high end") : "dans la fourchette : la prévision ne permet pas de trancher"); }
  const tuiles = h("div", { class: "tuiles" },
    tuile(titreT, wh(T.central), prevEntre(wh, T.bas, T.haut)),
    tuile("Coût estimé", eur(T.central), sansValo || prevEntre(eur, T.bas, T.haut)),
    tuile("Émissions estimées", co2(T.central), valoDe(e).fe == null ? "facteur d'émission non renseigné" : prevEntre(co2, T.bas, T.haut)),
    tuileCible);
  const tuilesDetail = att.ok ? h("div", { class: "tuiles" },
    tuile("Dont déjà consommé", fmtEnergie(att.reel), Lg(np(att.nReel) + " de réel", np(att.nReel) + " of actuals")),
    tuile("Dont prévu", wh(att.prevu.central), Lg(np(att.n) + " à venir", np(att.n) + " ahead"))) : null;

  // ce que l'historique permet : dit avant les graphiques
  const ans = (tO - m.dates[K.obs[0]]) / JOUR / 365.25, court = ans < 2, effet = K.attAutre && K.attAutre.ok && att.ok ? (K.avec ? 1 : -1) * (att.central - K.attAutre.central) : null;
  const ligneHisto = h("p", { class: "note prev-ligne" + (court ? " attention" : "") }, h("b", null, court ? "Historique court" : "Historique"),
    Lg(" : " + nf(ans, 1) + " an" + (ans >= 2 ? "s" : "") + " de données (" + np(K.obs.length) + ")" + (court ? ", chaque période de l'année vue une ou deux fois ; la fourchette ne couvre pas une année très différente." : "."),
      ": " + nf(ans, 1) + " years of data (" + np(K.obs.length) + ")" + (court ? ", each time of year seen once or twice; the range does not cover a very different year." : ".")),
    K.aDerive ? Lg(" Dérive en cours (" + fmtPct(K.derive.pct, true) + ") : ", " Ongoing drift (" + fmtPct(K.derive.pct, true) + "): ") + tr(K.avec ? "prolongée dans cette prévision." : "non prolongée dans cette prévision.") : null);
  const noteHisto = h("div", { class: "avis prev-avis" },
    h("p", null, h("b", null, court ? "Historique court. " : "Historique. "), Lg("Cette série compte " + np(K.obs.length) + " de données, du " + fmtDate(m.dates[K.obs[0]]) + " au " + fmtDate(tO) + ", soit " + nf(ans, 1) + " an" + (ans >= 2 ? "s" : "") + ".",
      "This series has " + np(K.obs.length) + " of data, from " + fmtDate(m.dates[K.obs[0]]) + " to " + fmtDate(tO) + ", i.e. " + nf(ans, 1) + " years."),
      court ? prevT(" C'est moins de deux années : chaque période du calendrier n'a été observée qu'une ou deux fois. La fourchette décrit ce qui a varié d'une période à l'autre dans cet historique ; elle ne dit rien d'une année très différente (hiver rigoureux, production en forte hausse ou en baisse).",
      " That is less than two years: each time of year has been observed only once or twice. The range describes what varied from one period to the next in this history; it says nothing about a very different year (harsh winter, production sharply up or down).") : null),
    K.aDerive ? h("p", null, Lg("Dérive en cours : " + K.derive.sens + " de " + fmtPct(K.derive.pct, true) + " depuis " + K.derive.depuis + " (" + np(K.derive.n) + "). ", "Ongoing drift: " + M(K.derive.sens) + " of " + fmtPct(K.derive.pct, true) + " since " + K.derive.depuis + " (" + np(K.derive.n) + "). "),
      K.avec ? "La prévision suppose qu'elle se maintient telle quelle." : "La prévision suppose un retour au niveau du modèle.",
      effet == null ? null : Lg(" La prolonger déplace l'atterrissage de ", " Extending it moves the landing by ") + fmtEnergie(effet, true) + (coutDe(e, 1) == null ? "" : " (" + fmtEuros(coutDe(e, effet), true) + ")") + ".") : h("p", null, sansDerive));

  // 1. le graphique : historique, prévision centrale et fourchette
  const memePas = L.pasGrille === pas, lignesH = memePas ? m.dates.map((t, j) => j).filter(j => m.dates[j] >= m.dates[K.obs[0]] && m.dates[j] <= tO).sort((a, b) => m.dates[a] - m.dates[b]) : K.obs;
  const nHist = lignesH.length, vides = prevus.map(() => null), histo = lignesH.map(() => null);
  const G = { etiquettes: lignesH.map(j => prevLibelle(pas, m.dates[j])).concat(prevus.map(p => p.lib)), reel: lignesH.map(j => sr.conso[j]).concat(vides), ref: lignesH.map(j => sr.ref[j]).concat(vides),
    central: histo.concat(prevus.map(p => p.central)), bas: histo.concat(prevus.map(p => p.bas)), haut: histo.concat(prevus.map(p => p.haut)), coupure: nHist, avant: "Réel", apres: "Prévision", titre: Lg("Prévision de ", "Forecast of ") + sr.nom,
    complement: i => i < nHist ? [] : [{ valeur: prevDeA(prevus[i - nHist].basFacteurs, prevus[i - nHist].hautFacteurs), nom: "scénarios des facteurs seuls" }] };
  const u = unitePour([G.reel, G.haut]), nb = v => v == null ? "" : nf(v / u.div, 2), queue = Math.max(0, nHist - 4);   // tableau : les 4 dernières périodes réelles, puis toute la prévision
  const sigmaTxt = P.sigmaMesure != null && P.sigmaMesure > (P.sigmaClasseur || 0)
    ? Lg("mesurée sur l'historique (± " + fmtPct(P.sigma) + (P.sigmaClasseur ? ", plus que les ± " + fmtPct(P.sigmaClasseur) + " du classeur" : ", le classeur n'en donne pas") + ")", "measured on the history (± " + fmtPct(P.sigma) + (P.sigmaClasseur ? ", more than the workbook's ± " + fmtPct(P.sigmaClasseur) : ", the workbook gives none") + ")")
    : Lg("donnée par le classeur (± " + fmtPct(P.sigma) + ")", "given by the workbook (± " + fmtPct(P.sigma) + ")");
  const cartes = [carte({ id: "prev-courbe", titre: Lg(sr.nom + " : réel, puis prévision sur " + np(nH), sr.nom + ": actuals, then forecast over " + np(nH)),
    sous: Lg("par " + NOM_PAS[pas] + " ; à droite du repère vertical, rien n'est mesuré : tout est prévu", "by " + M(NOM_PAS[pas]) + "; to the right of the vertical marker, nothing is measured: everything is forecast"),
    legende: [{ nom: "Réel", couleur: "var(--s1)" }, { nom: "Référence (modèle)", couleur: "var(--contexte)" }, { nom: "Prévision centrale", couleur: "var(--s1)", type: "tirets" }, { nom: "Fourchette à 80 %", couleur: "var(--s1)", type: "bande" }],
    dessiner: z => prevGraph(z, Object.assign({ hauteur: 260 }, G)),
    table: () => ({ entetes: ["Période", "Nature"].concat(prevColonnes(["Réel", "Référence", "Prévision basse", "Prévision centrale", "Prévision haute"], u)),
      lignes: G.etiquettes.map((lib, i) => [lib, i < nHist ? "réel" : "prévision", nb(G.reel[i]), nb(G.ref[i]), nb(G.bas[i]), nb(G.central[i]), nb(G.haut[i])]).slice(queue) }),
    note: repli("prev-methode", null, noteHisto, h("p", null, Lg("Méthode : pour chaque " + NOM_PAS[pas] + " à venir, le modèle de référence de la série est calculé avec les facteurs influents relevés à la même place du calendrier dans l'historique (" + PREV.voisins[pas] + " " + NOM_PAS[pas] + (PREV.voisins[pas] > 1 && pas !== "month" ? "s" : "") + " de part et d'autre, les plus proches pesant le plus). "
        + "Prévision centrale = moyenne de ces calculs ; scénarios bas et haut = leurs quantiles 10 % et 90 %. La fourchette y ajoute l'erreur du modèle, " + sigmaTxt + ". Elle vise 80 % des cas : une période sur cinq peut en sortir. "
        + (eqn.saisonnier ? "Modèle saisonnier : les dates de saison du classeur sont reportées d'une année sur l'autre." : ""),
      "Method: for each coming " + M(NOM_PAS[pas]) + ", the series' baseline model is computed with the relevant variables recorded at the same place in the calendar in the history (" + PREV.voisins[pas] + " " + M(NOM_PAS[pas]) + (PREV.voisins[pas] > 1 ? "s" : "") + " either side, the closest weighing most). "
        + "Central forecast = mean of these computations; low and high scenarios = their 10% and 90% quantiles. The range adds the model error, " + sigmaTxt + ". It aims at 80% of cases: one period in five may fall outside. "
        + (eqn.saisonnier ? "Seasonal model: the workbook's season dates are carried over from one year to the next." : "")))) })];

  // 2. l'atterrissage, ligne par ligne
  if (att.ok) {
    const ligne = (lib, v, arrondi) => arrondi ? [lib, wh(v), eur(v), co2(v)] : [lib, fmtEnergie(v), fmtEuros(coutDe(e, v)), fmtCO2(co2De(e, v))];
    const lignes = [ligne(Lg("Réel constaté (" + np(att.nReel) + ")", "Actuals (" + np(att.nReel) + ")"), att.reel, false),
      ligne(Lg("Prévision centrale (" + np(att.n) + ")", "Central forecast (" + np(att.n) + ")"), att.prevu.central, true),
      ligne("Atterrissage, prévision centrale", att.central, true), ligne("Atterrissage, fourchette basse", att.bas, true), ligne("Atterrissage, fourchette haute", att.haut, true)];
    if (K.attAutre && K.attAutre.ok) lignes.push(ligne(K.avec ? "Atterrissage si la dérive n'est pas prolongée" : "Atterrissage si la dérive est prolongée", K.attAutre.central, true));
    if (K.cible && K.cible.total != null) { const d = rd(att.central) - K.cible.total;
      lignes.push(ligne("Objectif du classeur sur la même durée", K.cible.total, false), ["Écart à l'objectif (prévision centrale)", fmtEnergie(d, true), fmtEuros(coutDe(e, d), true), fmtCO2(co2De(e, d), true)]); }
    const notes = [Lg("Atterrissage = consommation déjà relevée + prévision des périodes restantes" + (att.mode === "annee" ? " jusqu'à la fin de l'année " + att.lib + " (une période appartient à l'année de sa date)" : ", sur " + np(PREV.periodes[12][pas]) + " en tout") + ". ",
        "Landing = consumption already recorded + forecast of the remaining periods" + (att.mode === "annee" ? " to the end of " + att.lib + " (a period belongs to the year of its date)" : ", over " + np(PREV.periodes[12][pas]) + " in all") + ". "),
      prevT("Fourchette du total = somme des bornes de chaque période : c'est prudent, cela suppose que les erreurs vont toutes dans le même sens. Les totaux prévus sont arrondis à deux chiffres significatifs, ou à la précision de leur fourchette si elle est plus fine. Coût et émissions : estimations, avec les hypothèses de prix et de facteur d'émission de la page Détection.",
      "Range of the total = sum of each period's bounds: this is cautious, it assumes all errors go the same way. Forecast totals are rounded to two significant figures, or to the precision of their range when it is finer. Cost and emissions: estimates, with the price and emission-factor assumptions of the Detection page.")];
    if (att.depuis != null) notes.push(Lg(" La série ne commence que le " + fmtDate(att.depuis) + " : le total ne couvre pas toute la durée annoncée.", " The series only starts on " + fmtDate(att.depuis) + ": the total does not cover the whole stated span."));
    if (att.manquantes) notes.push(Lg(" " + np(att.manquantes) + " sans relevé dans le réel : elles ne sont pas comptées.", " " + np(att.manquantes) + " with no reading in the actuals: they are not counted."));
    if (K.cible && !K.cible.plausible) notes.push(Lg(" Objectif : le classeur donne un « Weekly target » de " + nf(K.cible.valeur, 3) + " pour cette série, sans unité. Lu comme une consommation par semaine en kWh (l'unité de la feuille CONSO), il est sans commune mesure avec la consommation habituelle de la série (environ "
      + fmtEnergie(K.cible.hebdo) + " par semaine). La page ne sait pas ce qu'il mesure : elle ne le compare à rien.",
      " Target: the workbook gives a “Weekly target” of " + nf(K.cible.valeur, 3) + " for this series, with no unit. Read as a weekly consumption in kWh (the unit of the CONSO sheet), it is out of all proportion to the usual consumption of the series (about "
      + fmtEnergie(K.cible.hebdo) + " per week). The page does not know what it measures: it compares it with nothing."));
    else if (K.cible && K.cible.total != null) notes.push(prevT(" Objectif : la ligne « Weekly target » du WIKI est lue comme une consommation par semaine en kWh (l'unité de la feuille CONSO), multipliée par le nombre de semaines de l'atterrissage. Vérifiez que c'est bien son sens dans votre classeur.",
      " Target: the “Weekly target” row of the WIKI sheet is read as a weekly consumption in kWh (the unit of the CONSO sheet), multiplied by the number of weeks of the landing. Check that this is what it means in your workbook."));
    cartes.push(carte({ id: "prev-att", titre: titreT + Lg(" : le détail", ": the detail"), sous: K.aDerive ? (K.avec ? "dérive en cours prolongée" : "dérive en cours non prolongée") : null,
      contenu: h("div", null, tuilesDetail, tableau(["", "Énergie", "Coût estimé", "CO₂e"], lignes)), note: h("span", null, notes) }));
  } else cartes.push(carte({ id: "prev-att", titre: "Atterrissage sur l'année civile", contenu: h("div", { class: "vide" }, prevT("La fin de l'année est plus loin que l'horizon permis pour cette série : pas d'atterrissage annuel. Les chiffres de tête sont le total de l'horizon choisi.",
      "The end of the year is further than the horizon allowed for this series: no yearly landing. The headline figures are the total of the chosen horizon.")),
    note: "Choisissez « 12 mois glissants » pour un total qui mêle le réel récent et la prévision." }));

  // 3. la preuve : test rétrospectif
  if (R.possible) {
    const g = R.global, RA = K.retroAutre, autreUtile = RA.possible && Math.abs(RA.global.erreur - g.erreur) > 1e-12;
    const ech = t => Lg("Erreur à " + t.de + "–" + t.a, "Error at " + t.de + "–" + t.a) + " " + Lg(pas === "month" ? "mois" : NOM_PAS[pas] + "s", M(NOM_PAS[pas]) + "s");
    const nomReglage = avec => avec ? "Méthode, dérive prolongée" : "Méthode, dérive non prolongée";
    // une colonne par méthode, une ligne par mesure : le tableau reste lisible sur un écran étroit
    const cols = [{ t: h("span", null, nomReglage(K.avec), " (réglage choisi)"), x: R }].concat(autreUtile ? [{ t: nomReglage(!K.avec), x: RA }] : [], [{ t: "Méthode naïve", x: R, naive: true }]);
    const mesures = [["Erreur moyenne", c => fmtPct(c.naive ? c.x.global.erreurNaive : c.x.global.erreur)]].concat(
      R.tranches.map((tc, i) => [ech(tc), c => { const u = c.x.tranches[i]; return u ? fmtPct(c.naive ? u.erreurNaive : u.erreur) : "–"; }]),
      [["Biais", c => fmtPct(c.naive ? c.x.global.biaisNaive : c.x.global.biais, true)], ["Réels dans la fourchette", c => c.naive ? "sans fourchette" : fmtPct(c.x.global.couverture)],
        [Lg("Erreur sur le total des " + np(R.n), "Error on the total of the " + np(R.n)), c => c.x.totaux ? fmtPct(c.naive ? c.x.totaux.erreurNaive : c.x.totaux.erreur) : "–"],
        ["Totaux dans la fourchette", c => c.naive || !c.x.totaux ? "–" : c.x.totaux.dans + " / " + c.x.totaux.n]]);
    const phrases = [h("p", { class: "prev-verdict " + V.sens }, preuve)];
    phrases.push(h("p", null, Lg(fmtPct(g.couverture) + " des réels sont tombés dans la fourchette, pour " + fmtPct(PREV.niveau) + " attendus : ", fmtPct(g.couverture) + " of actuals fell within the range, against " + fmtPct(PREV.niveau) + " expected: "),
      V.fourchette === "etroite" ? "la fourchette affichée est trop étroite pour cette série. Lisez-la comme un minimum." : V.fourchette === "large" ? "la fourchette est large, donc prudente." : "la fourchette est cohérente.",
      Math.abs(g.biais) > 0.05 ? Lg(" La méthode a prévu trop " + (g.biais > 0 ? "haut" : "bas") + " de " + fmtPct(Math.abs(g.biais)) + " en moyenne.", " The method forecast " + fmtPct(Math.abs(g.biais)) + " too " + (g.biais > 0 ? "high" : "low") + " on average.") : null));
    if (autreUtile) { const mieux = RA.global.erreur < g.erreur;
      phrases.push(h("p", null, Lg("Dans ce test, l'autre réglage de la dérive (" + (K.avec ? "non prolongée" : "prolongée") + ") aurait fait " + (mieux ? "mieux" : "moins bien") + " : " + fmtPct(RA.global.erreur) + " d'erreur moyenne.",
        "In this test, the other drift setting (" + (K.avec ? "not extended" : "extended") + ") would have done " + (mieux ? "better" : "worse") + ": " + fmtPct(RA.global.erreur) + " average error."))); }
    cartes.push(carte({ id: "prev-preuve", titre: "La preuve : test rétrospectif",
      sous: Lg("on cache la fin de l'historique, on prévoit avec les seules données connues à cette date, on compare au réel ; " + R.origines + " prévisions de " + np(R.n) + ", périodes testées de " + prevLibelle(pas, R.de) + " à " + prevLibelle(pas, R.a),
        "the end of the history is hidden, the forecast uses only the data known at that date, then it is compared with actuals; " + R.origines + " forecasts of " + np(R.n) + ", periods tested from " + prevLibelle(pas, R.de) + " to " + prevLibelle(pas, R.a)),
      contenu: h("div", null, phrases, tableau([""].concat(cols.map(c => c.t)), mesures.map(([lib, f]) => [lib].concat(cols.map(f))))),
      note: Lg("Erreur moyenne = somme des écarts absolus ÷ somme des réels. Biais = (somme des prévisions − somme des réels) ÷ somme des réels ; positif = prévu trop haut. Méthode naïve = même période un an plus tôt quand elle est connue (" + R.nAn1 + " fois), sinon dernière valeur connue (" + R.nDerniere + " fois). "
        + "Limites : les " + R.origines + " prévisions se chevauchent et ne couvrent en tout que " + np(R.nCibles) + " ; le reste de l'année n'a pas pu être testé" + (R.n < nH ? ", ni rien au-delà de " + np(R.n) + " d'avance, alors que l'horizon affiché en compte " + nH : "")
        + ". Chaque prévision testée demande un an de facteurs déjà connus : c'est ce qui limite le test.",
        "Average error = sum of absolute gaps ÷ sum of actuals. Bias = (sum of forecasts − sum of actuals) ÷ sum of actuals; positive = forecast too high. Naive method = same period a year earlier when it is known (" + R.nAn1 + " times), otherwise last known value (" + R.nDerniere + " times). "
        + "Limits: the " + R.origines + " forecasts overlap and cover only " + np(R.nCibles) + " in all; the rest of the year could not be tested" + (R.n < nH ? ", nor anything beyond " + np(R.n) + " ahead, although the displayed horizon has " + nH : "")
        + ". Each tested forecast needs a year of variables already known: this is what limits the test.") }));
    // un exemple : la prévision la plus récente dont on connaît tout le réel
    const X = R.exemple, tX = m.dates[X.o], avant = (memePas ? lignesH : K.obs).filter(j => m.dates[j] <= tX).slice(-Math.max(8, R.n)), pX = X.P.periodes.slice(0, R.n), nA = avant.length, nul = avant.map(() => null);
    const GX = { etiquettes: avant.map(j => prevLibelle(pas, m.dates[j])).concat(pX.map(p => p.lib)), reel: avant.map(j => sr.conso[j]).concat(X.reels), ref: null,
      central: nul.concat(pX.map(p => p.central)), bas: nul.concat(pX.map(p => p.bas)), haut: nul.concat(pX.map(p => p.haut)), coupure: nA, avant: "Connu à cette date", apres: "Caché, puis comparé", titre: "Exemple de prévision passée",
      complement: i => i < nA ? [] : [{ valeur: fmtEnergie(X.naives[i - nA]), nom: "méthode naïve" }] };
    const uX = unitePour([GX.reel, GX.haut]), nbX = v => v == null ? "" : nf(v / uX.div, 2);
    cartes.push(carte({ id: "prev-exemple", titre: Lg("Exemple : la prévision qui aurait été faite après " + prevLibelle(pas, tX), "Example: the forecast that would have been made after " + prevLibelle(pas, tX)),
      sous: Lg("la plus récente des " + R.origines + " prévisions testées ; la suite (" + np(R.n) + ") était cachée au calcul", "the most recent of the " + R.origines + " tested forecasts; what follows (" + np(R.n) + ") was hidden from the computation"),
      legende: [{ nom: "Réel", couleur: "var(--s1)" }, { nom: "Prévision faite à cette date", couleur: "var(--s1)", type: "tirets" }, { nom: "Fourchette à 80 %", couleur: "var(--s1)", type: "bande" }],
      dessiner: prevDessinOuvert(z => prevGraph(z, GX)),
      table: () => ({ entetes: ["Période"].concat(prevColonnes(["Réel", "Prévision basse", "Prévision centrale", "Prévision haute", "Méthode naïve"], uX), "Réel dans la fourchette"),
        lignes: pX.map((p, k) => [p.lib, nbX(X.reels[k]), nbX(p.bas), nbX(p.central), nbX(p.haut), nbX(X.naives[k]), X.reels[k] == null ? "" : X.reels[k] >= p.bas && X.reels[k] <= p.haut ? "oui" : "non"]) }),
      note: "Un seul exemple ne prouve rien : le tableau de la preuve porte sur toutes les prévisions testées." }));
  } else cartes.push(carte({ id: "prev-preuve", titre: "La preuve : test rétrospectif", attention: true,
    contenu: h("div", { class: "vide" }, "Test rétrospectif impossible pour cette série : la prévision ci-dessus n'est pas vérifiée."),
    note: Lg("Il faut au moins " + PREV.minOrigines + " prévisions passées d'au moins " + np(R.min) + ", chacune faite avec " + PREV.minPoints + " périodes de la série et un an de facteurs déjà connus. Cette série n'en permet que " + R.origines + ".",
      "At least " + PREV.minOrigines + " past forecasts of at least " + np(R.min) + " are needed, each made with " + PREV.minPoints + " periods of the series and a year of variables already known. This series allows only " + R.origines + ".") }));

  // 4. ce que la prévision suppose : les facteurs du scénario central, à côté de leur niveau récent
  const sg = (v, d) => (v < 0 ? "−" : "") + nf(Math.abs(v), d), recents = K.obs.slice(-Math.min(K.obs.length, PREV.periodes[3][pas])), moy = t => t.length ? somme(t) / t.length : null;
  const lignesF = m.facteurs.map((f, k) => ({ f, k })).filter(({ k }) => eqn.c1[k] !== 0 || eqn.c2[k] !== 0).map(({ f, k }) => {
    const rec = moy(recents.map(j => L.X[j][k])), sc = moy(prevus.map(p => p.x[k]));
    return [f.nom, sg(eqn.c1[k], 2) + (eqn.saisonnier ? Lg(" ; été : ", "; summer: ") + sg(eqn.c2[k], 2) : ""), nf(rec, 1), nf(sc, 1), rec ? fmtPct((sc - rec) / Math.abs(rec), true) : "–"];
  });
  cartes.push(carte({ id: "prev-facteurs", titre: "Ce que la prévision suppose",
    sous: Lg("facteurs influents du modèle de « " + sr.nom + " » ; niveau récent = moyenne sur " + np(recents.length) + " de réel ; scénario central = moyenne sur " + np(nH) + " de prévision",
      "relevant variables of the model of “" + sr.nom + "”; recent level = mean over " + np(recents.length) + " of actuals; central scenario = mean over " + np(nH) + " of forecast"),
    contenu: lignesF.length ? tableau(["Facteur influent", "Coefficient (kWh/unité)", "Niveau récent", "Scénario central", "Écart"], lignesF)
      : h("div", { class: "vide" }, "Le modèle de cette série ne dépend d'aucun facteur influent : la prévision est la constante du modèle."),
    note: Lg("Constante du modèle : " + sg(eqn.b1, 0) + " kWh par " + NOM_PAS[pas] + (eqn.saisonnier ? " (été : " + sg(eqn.b2, 0) + " kWh)" : "") + ". ", "Model constant: " + sg(eqn.b1, 0) + " kWh per " + M(NOM_PAS[pas]) + (eqn.saisonnier ? " (summer: " + sg(eqn.b2, 0) + " kWh)" : "") + ". ")
      + tr(prevT("La prévision rejoue le calendrier passé : elle ne connaît ni le plan de production, ni la météo à venir. Un écart vient de la saison (météo) ou d'un changement de niveau d'activité : dans le second cas, le scénario ne le suit pas.",
      "The forecast replays the past calendar: it knows neither the production plan nor the coming weather. A gap comes from the season (weather) or from a change in activity level: in the latter case, the scenario does not follow it.")) }));
  // la réponse, puis le graphique et les réglages courants ; le détail de l'atterrissage, la preuve et les hypothèses sous des replis
  const [courbe, carteAtt, ...preuves] = cartes, carteHyp = preuves.pop(), grille = (...c) => h("div", { class: "grille prev-grille" }, c);
  return [constat, ligneHisto, tuiles, filtres, noteRefus, grille(courbe),
    repli("prev-r-att", "Comment se décompose l'atterrissage ?", grille(carteAtt)),
    repli("prev-r-preuve", "La méthode est-elle fiable ? Le test sur le passé", grille(...preuves)),
    repli("prev-r-hyp", "Sur quelles hypothèses ?", grille(carteHyp))];
}
/* Graphique dans un repli fermé : dessiné à l'ouverture, quand sa zone a une largeur. */
const prevDessinOuvert = f => z => {
  const d = z.closest ? z.closest("details") : null;
  if (!d || d.open || d.hasAttribute("open")) return f(z);
  d.addEventListener("toggle", function ouvert() { if (!d.open) return; d.removeEventListener("toggle", ouvert); z.replaceChildren(); f(z); });
};

ICONES.prevision = "M2 11.5l3-3 2.5 2 2-2.5M9.5 8l4.5-4.5M9.5 8l4.5 3M12 3.5h2v2";
ajouterPage("Anticipation", "prevision", "Prévision", "Prévision de consommation", ICONES.prevision, prevPage);
ajouterTraductions([
  ["Anticipation", "Outlook"], ["Prévision", "Forecast"], ["Prévision de consommation", "Consumption forecast"],
  ["Aucune consommation à prévoir dans ce classeur.", "No consumption to forecast in this workbook."],
  ["Horizon", "Horizon"], ["Dérive en cours", "Ongoing drift"], ["Non prolongée", "Not extended"], ["Prolongée", "Extended"],
  ["Atterrissage sur", "Landing over"], ["Année civile", "Calendar year"], ["12 mois glissants", "Rolling 12 months"],
  ["Aucune prévision pour cette série.", "No forecast for this series."], ["Aucune prévision n'est proposée pour cette série.", "No forecast is offered for this series."],
  ["Dérive non mesurable : l'erreur du modèle n'est pas renseignée dans le classeur pour cette série.", "Drift cannot be measured: the workbook gives no model error for this series."],
  ["Aucune dérive en cours sur cette série : rien à prolonger.", "No ongoing drift on this series: nothing to extend."],
  ["La relecture des équations ne redonne pas la référence du tableau de bord pour cette série : aucune prévision n'est proposée.", "Re-reading the equations does not reproduce the dashboard's baseline for this series: no forecast is offered."],
  ["L'erreur du modèle n'est pas renseignée dans le classeur et l'historique est trop court pour la mesurer.", "The workbook gives no model error and the history is too short to measure it."],
  ["Les facteurs influents couvrent moins d'un an : certaines périodes de l'année n'ont jamais été observées.", "The relevant variables cover less than a year: some times of year have never been observed."],
  ["Dont déjà consommé", "Of which already consumed"], ["Dont prévu", "Of which forecast"], ["Objectif", "Target"],
  ["prix non renseigné pour cette énergie (page Détection)", "no price set for this energy (Detection page)"], ["facteur d'émission non renseigné", "no emission factor set"],
  ["aucun objectif pour cette série dans le classeur", "no target for this series in the workbook"], ["non comparé", "not compared"],
  ["valeur du classeur non exploitable, voir la note", "workbook value unusable, see the note"], ["dans la fourchette : la prévision ne permet pas de trancher", "within the range: the forecast cannot tell"],
  ["Historique court. ", "Short history. "], ["Historique. ", "History. "], ["Historique court", "Short history"], ["Historique", "History"],
  ["prolongée dans cette prévision.", "extended in this forecast."], ["non prolongée dans cette prévision.", "not extended in this forecast."],
  ["Comment se décompose l'atterrissage ?", "How does the landing break down?"], ["La méthode est-elle fiable ? Le test sur le passé", "Is the method reliable? The test on past data"], ["Sur quelles hypothèses ?", "On what assumptions?"],
  ["La prévision suppose qu'elle se maintient telle quelle.", "The forecast assumes it continues unchanged."], ["La prévision suppose un retour au niveau du modèle.", "The forecast assumes a return to the model level."],
  ["Prévision centrale", "Central forecast"], ["Fourchette à 80 %", "80% range"],
  ["scénarios des facteurs seuls", "variable scenarios alone"], ["pas de donnée", "no data"],
  ["Nature", "Kind"], ["Prévision basse", "Low forecast"], ["Prévision haute", "High forecast"], ["prévision", "forecast"], ["CO₂e", "CO₂e"],
  ["Atterrissage, prévision centrale", "Landing, central forecast"], ["Atterrissage, fourchette basse", "Landing, low end"], ["Atterrissage, fourchette haute", "Landing, high end"],
  ["Atterrissage si la dérive n'est pas prolongée", "Landing if the drift is not extended"], ["Atterrissage si la dérive est prolongée", "Landing if the drift is extended"],
  ["Objectif du classeur sur la même durée", "Workbook target over the same span"], ["Écart à l'objectif (prévision centrale)", "Gap to target (central forecast)"],
  ["dérive en cours prolongée", "ongoing drift extended"], ["dérive en cours non prolongée", "ongoing drift not extended"],
  ["Atterrissage sur l'année civile", "Calendar-year landing"],
  ["Choisissez « 12 mois glissants » pour un total qui mêle le réel récent et la prévision.", "Choose “Rolling 12 months” for a total that combines recent actuals and the forecast."],
  ["La preuve : test rétrospectif", "The proof: backtest"], ["Erreur moyenne", "Average error"], ["Biais", "Bias"], ["Réels dans la fourchette", "Actuals within the range"], ["Totaux dans la fourchette", "Totals within the range"],
  ["Méthode, dérive prolongée", "Method, drift extended"], ["Méthode, dérive non prolongée", "Method, drift not extended"], [" (réglage choisi)", " (chosen setting)"], ["Méthode naïve", "Naive method"], ["sans fourchette", "no range"],
  ["la fourchette affichée est trop étroite pour cette série. Lisez-la comme un minimum.", "the displayed range is too narrow for this series. Read it as a minimum."], ["la fourchette est large, donc prudente.", "the range is wide, hence cautious."], ["la fourchette est cohérente.", "the range is consistent."],
  ["Connu à cette date", "Known at that date"], ["Caché, puis comparé", "Hidden, then compared"], ["Exemple de prévision passée", "Example of a past forecast"], ["méthode naïve", "naive method"],
  ["Prévision faite à cette date", "Forecast made at that date"], ["Réel dans la fourchette", "Actual within the range"], 
  ["Un seul exemple ne prouve rien : le tableau de la preuve porte sur toutes les prévisions testées.", "A single example proves nothing: the proof table covers all tested forecasts."],
  ["Test rétrospectif impossible pour cette série : la prévision ci-dessus n'est pas vérifiée.", "Backtest impossible for this series: the forecast above is unverified."],
  ["Ce que la prévision suppose", "What the forecast assumes"], ["Coefficient (kWh/unité)", "Coefficient (kWh/unit)"], ["Niveau récent", "Recent level"], ["Scénario central", "Central scenario"],
  ["Le modèle de cette série ne dépend d'aucun facteur influent : la prévision est la constante du modèle.", "This series' model depends on no relevant variable: the forecast is the model constant."],
]);
