/* ============================================================================
   Module « Design » (préfixe dsn) : thème « Lumière » et une brique de la Vue d'ensemble.
   1. Marque de l'outil (une jauge stylisée), icône d'onglet, unité en petit dans les tuiles.
   2. « Si on corrige » : gain sur 12 mois d'une dérive en cours, calculé par la page Prévision
      (dérive prolongée contre dérive arrêtée) ou, à défaut, par la projection simple de la page Dérives
      étendue à 12 mois, nommée comme telle. Aucun chiffre n'est inventé.
   ============================================================================ */
const dsnT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };
const DSN = { pauseDemo: 140, maxChildren: 3 };

/* ---- 1. Marque, icône d'onglet, unité des tuiles ---- */
/* Une jauge : un compteur stylisé, aiguille vers la droite. Pas d'anneau ni de ruban dégradé. */
function dsnLogo() {
  return s("svg", { class: "dsn-logo", viewBox: "0 0 28 28", "aria-hidden": "true", focusable: "false" },
    s("rect", { x: 0, y: 0, width: 28, height: 28, rx: 8, style: "fill: var(--dsn-accent)" }),
    s("path", { d: "M7.5 18.5a6.5 6.5 0 0 1 13 0", fill: "none", stroke: "#fff", "stroke-width": 2.2, "stroke-linecap": "round", opacity: ".55" }),
    s("path", { d: "M7.5 18.5a6.5 6.5 0 0 1 3.2-5.6", fill: "none", stroke: "#fff", "stroke-width": 2.2, "stroke-linecap": "round" }),
    s("path", { d: "M14 18.5l4.2-5", fill: "none", stroke: "#fff", "stroke-width": 2.2, "stroke-linecap": "round" }),
    s("circle", { cx: 14, cy: 18.5, r: 1.9, fill: "#fff" }));
}
(function dsnIcone() {                                                     // icône d'onglet : la même jauge, en SVG inline (aucune ressource externe)
  try {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><rect width='28' height='28' rx='8' fill='%233f55e0'/><path d='M7.5 18.5a6.5 6.5 0 0 1 13 0' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' opacity='.55'/><path d='M14 18.5l4.2-5' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round'/><circle cx='14' cy='18.5' r='1.9' fill='%23fff'/></svg>";
    if (document.head && !document.querySelector("link[rel=icon]")) document.head.append(h("link", { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml," + svg }));
  } catch (e) {}
})();
/* « 5,41 GWh » : le nombre en grand, l'unité en petit. Le texte ne change pas (espace compris). */
function dsnUnite(val) {
  if (typeof val !== "string") return val;
  const v = tr(val), r = /^([−+–-]?\d[\d   .,]*)( )([A-Za-zµ€%][^\d]{0,11})$/.exec(v);   // traduit d'abord, puis coupé : les morceaux ne repassent pas par tr()
  if (!r) return val;
  const petit = h("small", { class: "dsn-unite" }); petit.append(document.createTextNode(r[2] + r[3]));
  return [document.createTextNode(r[1]), petit];
}

/* ---- 2. « Si on corrige » : gain sur 12 mois ---- */
/* État de la Vue d'ensemble porté par ce module : dérive montrée dans « Si on corrige », tri du tableau, puis la barre de question (partie 3). */
const dsn = { sujet: null, tri: "cout" };
AU_CHARGEMENT.push(() => { Object.assign(dsn, { sujet: null, tri: "cout" }); dsnMemo = { cle: null, gains: new Map() }; });
const dsnN12 = pas => typeof PREV !== "undefined" && PREV.periodes[12][pas] ? PREV.periodes[12][pas] : Math.round(PERIODES_3_MOIS[pas] * 4);
let dsnMemo = { cle: null, gains: new Map() };
const dsnCleEp = ep => ep.serie + "|" + ep.debut + "|" + ep.n;
/* Gain si la dérive cesse, sur 12 mois, en énergie, euros et CO2e, avec la série « si rien ne change » et « si la dérive cesse ». */
function dsnGain(ep) {
  const cle = [etat.modele && etat.modele.fin, etat.fichier, LANGUE, JSON.stringify(valoSaisie)].join("|");
  if (dsnMemo.cle !== cle || dsnMemo.modele !== etat.modele) dsnMemo = { cle, modele: etat.modele, gains: new Map() };
  const k = dsnCleEp(ep);
  if (dsnMemo.gains.has(k)) return dsnMemo.gains.get(k);
  let G = null;
  try { G = dsnGainPrevision(ep); } catch (e) { console.error(e); G = null; }
  if (!G) G = dsnGainProjection(ep);
  G.euro = coutDe(ep.energie, G.wh); G.co2 = co2De(ep.energie, G.wh); G.ep = ep;
  dsnMemo.gains.set(k, G);
  return G;
}
/* Page Prévision : même origine, même horizon (12 mois), dérive prolongée (« si rien ne change ») contre non prolongée (« si la dérive cesse »).
   Retenue seulement si l'horizon de 12 mois est permis pour la série, si la Prévision voit la même dérive en cours, et si chaque période est prévue. */
function dsnGainPrevision(ep) {
  if (typeof prevPrevoir !== "function" || !ep.ouvert || !(ep.ecart > 0)) return null;
  const sr = etat.modele.series.find(x => x.nom === ep.serie);
  if (!sr) return null;
  const h12 = prevHorizons(sr).find(x => x.mois === 12);
  if (!h12 || h12.motif) return null;
  const obs = prevObs(sr), o = obs[obs.length - 1];
  const rien = prevPrevoir(sr, o, h12.n, true), cesse = prevPrevoir(sr, o, h12.n, false);
  if (!rien.derive || rien.derive.pct == null || !(rien.derive.pct > 0) || rien.derive.depuis !== ep.libDebut) return null;
  if (rien.periodes.some(p => p.central == null) || cesse.periodes.some(p => p.central == null)) return null;
  const a = rien.periodes.map(p => p.central), b = cesse.periodes.map(p => p.central);
  return { methode: "prevision", pas: sr.pas, n: h12.n, libs: rien.periodes.map(p => p.lib), rien: a, cesse: b, cumul: false, wh: somme(a) - somme(b), pct: rien.derive.pct };
}
/* Projection simple de la page Dérives (écart moyen par période de l'épisode), étendue à 12 mois : écart cumulé si l'écart moyen se maintient, contre zéro. */
function dsnGainProjection(ep) {
  const p = projectionDe(ep), n = dsnN12(p.pas), rien = [];
  for (let k = 1; k <= n; k++) rien.push(p.parPeriode * k);
  return { methode: "projection", pas: p.pas, n, libs: etiquettesFutures(p.pas, ep.fin, n), rien, cesse: rien.map(() => 0), cumul: true, wh: p.parPeriode * n, parPeriode: p.parPeriode };
}
const dsnNomMethode = G => G.methode === "prevision" ? dsnT("Prévision sur 12 mois", "12-month forecast") : dsnT("si l'écart moyen se maintient", "if the average gap persists");
function dsnMethodeLongue(G) {
  return G.methode === "prevision"
    ? Lg("Calculé par la page Prévision sur " + G.n + " " + (G.pas === "month" ? "mois" : NOM_PAS[G.pas] + "s") + " : dérive prolongée (son écart de " + fmtPct(G.pct, true) + " se maintient) contre dérive arrêtée. Même modèle, mêmes facteurs : seul l'écart change.",
      "Computed by the Forecast page over " + G.n + " " + M(NOM_PAS[G.pas]) + "s: drift extended (its " + fmtPct(G.pct, true) + " gap persists) against drift stopped. Same model, same variables: only the gap changes.")
    : Lg("Projection simple, pas une prévision : l'écart moyen de l'épisode (" + fmtEnergie(G.parPeriode, true) + " par " + (G.pas === "month" ? "mois" : NOM_PAS[G.pas]) + ") prolongé " + G.n + " fois, contre un écart nul. La page Prévision ne permet pas l'horizon de 12 mois pour cette série.",
      "Simple projection, not a forecast: the episode's average gap (" + fmtEnergie(G.parPeriode, true) + " per " + M(NOM_PAS[G.pas]) + ") carried over " + G.n + " times, against a zero gap. The Forecast page does not allow a 12-month horizon for this series.");
}
/* Graphique : « si rien ne change » en tirets, « si la dérive cesse » en trait plein, l'écart entre les deux en vert. */
function dsnGraphCorrige(zone, G) {
  const W = Math.max(260, zone.clientWidth || 400), H = 150, g = 8, d = 28, hh = 18, bas = H - 20;
  const vals = G.rien.concat(G.cesse), min = Math.min(0, ...vals), max = Math.max(...vals) || 1;
  const lo = G.cumul ? min : Math.min(...vals) - (max - Math.min(...vals)) * 0.25, hi = max + (max - lo) * 0.08;
  const x = i => g + (W - g - d) * (G.n === 1 ? 0.5 : i / (G.n - 1)), y = v => hh + (bas - hh) * (1 - (v - lo) / (hi - lo || 1));
  const ligne = t => t.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  const aire = ligne(G.rien) + " " + G.cesse.map((v, i) => "L" + x(G.n - 1 - i).toFixed(1) + " " + y(G.cesse[G.n - 1 - i]).toFixed(1)).join(" ") + " Z";
  const u = uniteEnergie(Math.abs(max)), lib = v => nf(v / u.div, v / u.div >= 100 ? 0 : 1);
  const svg = s("svg", { viewBox: "0 0 " + W + " " + H, height: H, role: "img", "aria-label": Lg("Si rien ne change, contre si la dérive cesse, sur 12 mois. Écart : ", "If nothing changes, against if the drift stops, over 12 months. Gap: ") + fmtEnergie(G.wh) },
    s("line", { x1: g, x2: W - d, y1: y(G.cumul ? 0 : lo), y2: y(G.cumul ? 0 : lo), stroke: "var(--grille)" }),
    s("path", { d: aire, style: "fill: var(--dsn-vert-aire)" }),
    s("path", { d: ligne(G.rien), fill: "none", style: "stroke: var(--contexte)", "stroke-width": 2, "stroke-dasharray": "5 4" }),
    s("path", { d: ligne(G.cesse), fill: "none", style: "stroke: var(--s1)", "stroke-width": 2.5, "stroke-linejoin": "round" }),
    s("circle", { cx: x(G.n - 1), cy: y(G.rien[G.n - 1]), r: 3.5, style: "fill: var(--contexte)" }),
    s("circle", { cx: x(G.n - 1), cy: y(G.cesse[G.n - 1]), r: 4, style: "fill: var(--s1)" }),
    s("text", { x: g, y: 11 }, G.cumul ? Lg("écart cumulé, en " + u.nom, "cumulative gap, in " + u.nom) : u.nom + Lg(" par " + (G.pas === "month" ? "mois" : NOM_PAS[G.pas]), " per " + M(NOM_PAS[G.pas]))),
    s("text", { x: g, y: H - 4 }, G.libs[0]), s("text", { x: W - d, y: H - 4, "text-anchor": "end" }, G.libs[G.n - 1]),
    s("text", { x: W - d + 4, y: y(hi) + 4 }, lib(hi)));
  const cible = s("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
  cible.addEventListener("mousemove", e => {
    const r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(G.n - 1, Math.round(((e.clientX - r.left) * W / (r.width || W) - g) / ((W - g - d) / Math.max(1, G.n - 1)))));
    montrerTip(e, G.libs[i], [{ couleur: "var(--contexte)", valeur: fmtEnergie(G.rien[i]), nom: dsnT("si rien ne change", "if nothing changes") },
      { couleur: "var(--s1)", valeur: fmtEnergie(G.cesse[i]), nom: G.cumul ? dsnT("si l'écart cesse", "if the gap stops") : dsnT("si la dérive cesse", "if the drift stops") }]);
  });
  cible.addEventListener("mouseleave", cacherTip);
  svg.append(cible);
  zone.replaceChildren(svg);
}
/* Carte « Si on corrige » d'une dérive en cours. */
function dsnCarteCorrige(ep, autres) {
  const G = dsnGain(ep), zone = h("div", { class: "zone dsn-zone" });
  aDessiner.push(() => dsnGraphCorrige(zone, G));
  const choix = autres && autres.length > 1 ? h("label", { class: "dsn-choix" }, h("span", null, dsnT("Autre dérive", "Other drift")),
    liste(autres.map(x => ({ v: dsnCleEp(x), t: x.serie })), dsnCleEp(ep), v => { dsn.sujet = v; rendre(); })) : null;
  const lignes = G.libs.map((l, i) => [l, fmtEnergie(G.rien[i]), fmtEnergie(G.cesse[i]), fmtEnergie(G.rien[i] - G.cesse[i], true)]);
  return h("section", { class: "acc-carte dsn-corrige" },
    h("div", { class: "dsn-tete-carte" }, h("h2", null, Lg("Si on corrige « " + ep.serie + " »", "If “" + ep.serie + "” is fixed")), choix),
    h("div", { class: "dsn-gains" },
      h("div", null, h("div", { class: "dsn-lib" }, dsnT("Gain sur 12 mois", "Gain over 12 months")), h("div", { class: "dsn-chiffre dsn-vert" }, G.euro != null ? fmtEuros(G.euro) : fmtEnergie(G.wh))),
      h("div", null, h("div", { class: "dsn-lib" }, dsnT("Carbone évité", "Carbon avoided")), h("div", { class: "dsn-chiffre" }, G.co2 != null ? fmtCO2(G.co2) : "–")),
      h("div", null, h("div", { class: "dsn-lib" }, dsnT("Énergie", "Energy")), h("div", { class: "dsn-chiffre petit" }, fmtEnergie(G.wh)))),
    legende([{ type: "tirets", couleur: "var(--contexte)", nom: dsnT("si rien ne change", "if nothing changes") }, { couleur: "var(--s1)", nom: G.cumul ? dsnT("si l'écart cesse", "if the gap stops") : dsnT("si la dérive cesse", "if the drift stops") }, { type: "bloc", couleur: "color-mix(in srgb, var(--moins) 45%, transparent)", nom: dsnT("gain", "gain") }]),
    zone,
    h("p", { class: "dsn-methode" }, h("span", { class: "dsn-pastille " + (G.methode === "prevision" ? "bleu" : "") }, dsnNomMethode(G)), " ", dsnMethodeLongue(G)),
    repli("dsn-corrige-table", dsnT("Le détail, période par période", "Period-by-period detail"),
      tableau([dsnT("Période", "Period"), dsnT("Si rien ne change", "If nothing changes"), G.cumul ? dsnT("Si l'écart cesse", "If the gap stops") : dsnT("Si la dérive cesse", "If the drift stops"), dsnT("Écart", "Gap")], lignes)));
}
