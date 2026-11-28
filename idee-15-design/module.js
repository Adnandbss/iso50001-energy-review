/* ============================================================================
   Module « Design » (préfixe dsn) : thème « Lumière » et deux briques de la Vue d'ensemble.
   0. Jetons de couleur du thème, clair et sombre (DSN_THEME), posés dans une feuille de style de la page.
   1. Marque de l'outil (une jauge stylisée), icône d'onglet, unité en petit dans les tuiles.
   2. « Si on corrige » : gain sur 12 mois d'une dérive en cours, calculé par la page Prévision
      (dérive prolongée contre dérive arrêtée) ou, à défaut, par la projection simple de la page Dérives
      étendue à 12 mois, nommée comme telle. Aucun chiffre n'est inventé.
   3. « Posez une question sur ce site » : un agent questions-réponses qui reprend la boucle et l'outil
      « repondre » du banc d'évaluation (evlBoucle). En démonstration, un script répond à des questions
      toutes faites ; une question libre demande une IA. Chaque chiffre de la réponse est contrôlé.
   ============================================================================ */
const dsnT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };
const DSN = { pauseDemo: 140, maxChildren: 3 };

/* ---- 0. Jetons du thème ---- */
/* Jetons du thème : la seule source des couleurs. Posés en tête de page dans une feuille <style id="dsn-theme">, après le style d'origine
   (même spécificité, donc ils l'emportent) ; le sombre suit prefers-color-scheme. test.js vérifie que chaque jeton existe dans les deux thèmes
   et mesure les contrastes des couples texte / fond (AA). */
const DSN_THEME = {
  clair: {
    "f-texte": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Inter, \"Helvetica Neue\", Arial, sans-serif",
    "f-chiffre": "var(--f-texte)",
    "plan": "#f6f8fc",
    "surface": "#ffffff",
    "creux": "#f2f5fb",
    "encre": "#1b2340",
    "encre2": "#535d7c",
    "muet": "#646c88",
    "grille": "#edf0f6",
    "axe": "#d6dcea",
    "bord": "#e4e8f2",
    "voile": "rgba(63, 85, 224, .06)",
    "signal": "#ef7d3c",
    "s1": "#3f55e0",
    "s2": "#eb6834",
    "s3": "#1baf7a",
    "s4": "#eda100",
    "s5": "#e87ba4",
    "s6": "#008300",
    "s7": "#8a4fd8",
    "s8": "#e34948",
    "plus": "#d9502a",
    "moins": "#13987a",
    "contexte": "#5d6785",
    "neutre": "#c8cfdf",
    "bon": "#11754a",
    "critique": "#c0392b",
    "alerte": "#d97706",
    "dsn-accent": "#3f55e0",
    "dsn-accent-texte": "#3446c8",
    "dsn-accent-pale": "#eef1ff",
    "dsn-sur-accent": "#ffffff",
    "dsn-vert": "#11754a",
    "dsn-vert-pale": "#e7f6ee",
    "dsn-vert-aire": "rgba(19, 152, 122, .16)",
    "dsn-rouge": "#b23c16",
    "dsn-rouge-pale": "#fff1ec",
    "dsn-tete": "#f6f8fc",
    "dsn-panneau": "rgba(255, 255, 255, .72)",
    "dsn-panneau-plein": "#fdfdfe",
    "dsn-ombre": "0 1px 2px rgba(30, 40, 80, .05)",
    "dsn-ombre-haute": "0 4px 24px rgba(70, 90, 180, .09)",
    "dsn-halo": "radial-gradient(closest-side, rgba(120, 140, 255, .22), rgba(170, 120, 255, .10) 55%, transparent 78%)" },
  sombre: {
    "plan": "#0f1526",
    "surface": "#161d31",
    "creux": "#1b233b",
    "encre": "#e8ecf8",
    "encre2": "#b3bbd3",
    "muet": "#949dba",
    "grille": "#232c45",
    "axe": "#36405e",
    "bord": "#283252",
    "voile": "rgba(140, 155, 255, .08)",
    "signal": "#f29b56",
    "s1": "#6d7ff2",
    "s2": "#d95926",
    "s3": "#199e70",
    "s4": "#c98500",
    "s5": "#d55181",
    "s6": "#0ca30c",
    "s7": "#9a78e6",
    "s8": "#e66767",
    "plus": "#ee6a43",
    "moins": "#22b08f",
    "contexte": "#b3bbd3",
    "neutre": "#46506e",
    "bon": "#5fd39a",
    "critique": "#ff7b6b",
    "alerte": "#f2a33a",
    "dsn-accent": "#4f63e6",
    "dsn-accent-texte": "#a9b5ff",
    "dsn-accent-pale": "#262f5a",
    "dsn-sur-accent": "#ffffff",
    "dsn-vert": "#5fd39a",
    "dsn-vert-pale": "#14302a",
    "dsn-vert-aire": "rgba(34, 176, 143, .2)",
    "dsn-rouge": "#ff9b7a",
    "dsn-rouge-pale": "#3a2121",
    "dsn-tete": "#1b233b",
    "dsn-panneau": "rgba(22, 29, 49, .78)",
    "dsn-panneau-plein": "#141b2e",
    "dsn-ombre": "0 1px 2px rgba(0, 0, 0, .3)",
    "dsn-ombre-haute": "0 4px 24px rgba(0, 0, 0, .35)",
    "dsn-halo": "radial-gradient(closest-side, rgba(110, 125, 255, .10), rgba(150, 110, 255, .04) 55%, transparent 78%)" }
};
function dsnFeuilleTheme() {
  const bloc = (o, schema) => ":root{color-scheme:" + schema + ";" + Object.entries(o).map(([k, v]) => "--" + k + ":" + v).join(";") + "}";
  return bloc(DSN_THEME.clair, "light") + "\n@media (prefers-color-scheme: dark){" + bloc(DSN_THEME.sombre, "dark") + "}";
}
(function dsnPoserTheme() {
  try {
    const ancien = document.getElementById("dsn-theme");
    if (ancien) ancien.remove();
    const st = document.createElement("style"); st.setAttribute("id", "dsn-theme"); st.append(document.createTextNode(dsnFeuilleTheme()));
    (document.head || document.body).append(st);
  } catch (e) { console.error(e); }
})();

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

/* ---- 3. « Posez une question sur ce site » ---- */
Object.assign(dsn, { accord: false, question: "", enCours: false, arret: null, res: null, erreur: null, bloque: false, libre: false, progres: null });
/* Accord : une case de plus dans l'écran d'accord du panneau d'IA (module 11), avec son avis exact, cochée par défaut comme les autres.
   Sans toucher au module 11 : l'écran d'accord (iaBlocAccord) est enveloppé, et la case suit la même règle que les siennes
   (iaCoches, puis iaAccord.fonctions au clic sur « J'autorise »). Sans module 11 : aucun envoi possible. */
const DSN_FN = { id: "question", titre: ["Questions posées sur ce site (Vue d'ensemble)", "Questions asked about this site (Overview)"] };
(function dsnAccordIA() {
  if (typeof iaBlocAccord !== "function" || typeof iaCoches === "undefined") return;
  iaCoches.add(DSN_FN.id);
  let propre = false;
  Object.defineProperty(dsn, "accord", { configurable: true, enumerable: true, get: () => iaCouvre(DSN_FN.id) ? iaAccord.fournisseur : propre, set: v => { propre = v; } });
  const origine = iaBlocAccord;
  iaBlocAccord = function () { const bloc = origine(); try { dsnBlocAccord(bloc); } catch (e) { console.error(e); } return bloc; };
})();
function dsnBlocAccord(bloc) {
  const titre = Lg(DSN_FN.titre[0], DSN_FN.titre[1]);
  if (bloc.classList.contains("ia-donne")) {                                // accord donné : la fonction figure dans la liste de ce qui est autorisé
    const p = bloc.querySelector("p");
    if (p && iaAccord.fonctions.has(DSN_FN.id)) p.append(document.createTextNode(" " + Lg("Et : ", "And: ") + titre + "."));
    return;
  }
  const base = iaCoches.has("instruction"), coche = base && iaCoches.has(DSN_FN.id);
  const fn = h("div", { class: "ia-fonction dsn-fonction" + (coche ? "" : " ia-off") },
    h("label", { class: "ia-case" }, h("input", { type: "checkbox", "data-ia": "dsn-question", checked: coche, disabled: !base,
      onchange: e => { if (e.target.checked) iaCoches.add(DSN_FN.id); else iaCoches.delete(DSN_FN.id); iaPeindrePanneau(); } }), h("b", null, titre)),
    h("div", { class: "ia-avis" }, [...dsnAvis().childNodes]));
  const enfants = [...bloc.childNodes], fonctions = enfants.filter(n => n.classList && n.classList.contains("ia-fonction")), ref = enfants[enfants.indexOf(fonctions[fonctions.length - 1]) + 1];
  if (fonctions.length && ref) bloc.insertBefore(fn, ref); else bloc.append(fn);
}
function dsnAvis() {
  const f = F();
  return h("div", { class: "avis" },
    h("p", null, Lg("Pour chaque question posée dans la barre « Posez une question sur ce site », la page enverra à " + f.api + " (" + f.hote + ", société " + f.societe + "), avec votre clé, jusqu'à " + evl.tours + " fois (un envoi par tour) :",
      "For each question asked in the “Ask a question about this site” bar, the page will send to " + M(f.api) + " (" + f.hote + ", " + f.societe + "), with your key, up to " + evl.tours + " times (one send per turn):")),
    h("ul", null,
      h("li", null, dsnT("la question, telle que vous l'écrivez ;", "the question, as you write it;")),
      h("li", null, dsnT("une consigne fixe et la description des outils de lecture (lister_series, lire_serie, lire_facteurs, comparer_ues, episodes, repondre) ;", "a fixed instruction and the description of the read-only tools (lister_series, lire_serie, lire_facteurs, comparer_ues, episodes, repondre);")),
      h("li", null, dsnT("les résultats des outils que le modèle appelle : noms des séries et des facteurs, consommations, références et écarts par période, épisodes de dérive, coûts et émissions estimés, hypothèses de prix et de facteur d'émission, sur les plages qu'il demande.", "the results of the tools the model calls: names of series and variables, consumption, baselines and gaps per period, drift episodes, estimated costs and emissions, price and emission-factor assumptions, over the ranges it asks for."))),
    h("p", null, dsnT("Ne partent pas : le classeur, son nom, les fiches, la revue, les autres questions. Chaque question repart de zéro.", "Not sent: the workbook, its name, the reports, the review, other questions. Each question starts from scratch.")));
}
function dsnBlocage() {
  if (agent.enCours || (typeof evl !== "undefined" && evl.enCours)) return dsnT("Un agent travaille déjà : attendez qu'il ait fini.", "An agent is already at work: wait until it has finished.");
  const b = blocageEnvoi();
  if (b) return b;
  return dsn.accord === agent.fournisseur ? null : dsnT("Autorisez d'abord l'envoi des questions dans les réglages d'IA (case « Questions posées sur ce site »).", "First authorise sending questions in the AI settings (“Questions asked about this site” box).");
}

/* Questions toutes faites du mode démonstration. Le texte cite des noms du classeur (des données), jamais écrits en dur.
   plan[t](vus) : appels d'outils du tour t+1 ; lire(vus) : la réponse, recopiée des résultats d'outils (aucun calcul). */
const dsnSigne = (v, d) => v == null ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), d);
const dsnKwh = v => dsnSigne(v, 0) + " kWh", dsnPct = v => dsnSigne(v, 1) + " %", dsnEur = v => v == null ? null : nf(Math.abs(v), 0) + " €";
function dsnEnCours(vus) {                                                // épisodes en cours de surconsommation lus dans les résultats de l'outil « episodes »
  return (vus.episodes || []).flatMap(r => r && r.episodes ? r.episodes.filter(e => e.en_cours && e.ecart_kwh > 0).map(e => Object.assign({ serie: r.serie }, e)) : []);
}
const dsnCoutProj = e => { const p = e.projection_3_mois_si_l_ecart_moyen_se_maintient; return p && p.cout_estime_eur != null ? p.cout_estime_eur : p ? p.ecart_kwh : 0; };
function dsnQuestionsDemo() {
  const m = etat.modele, D = derives(), lister = () => [["lister_series", {}]];
  const tousEpisodes = vus => vus.lister_series[0].series.filter(x => x.analysable && x.nb_episodes).map(x => ["episodes", { nom: x.nom }]);
  const Q = [
    { id: "bilan", texte: Lg("Où en est le site sur les 12 derniers mois ?", "Where does the site stand over the last 12 months?"),
      plan: [lister, vus => { const L = vus.lister_series[0], site = L.series.filter(x => x.niveau === "Site" && x.analysable), liste = site.length ? site : L.series.filter(x => x.analysable);
        const de = isoJour(Math.max(Date.parse(L.donnees_du), Date.parse(L.donnees_au) - 364 * JOUR));
        return liste.map(x => ["lire_serie", { nom: x.nom, de, a: L.donnees_au }]); }],
      lire: vus => { const r = (vus.lire_serie || []).filter(x => x && x.total && x.total.nb_periodes);
        if (!r.length) return { type: "abstention", phrase: Lg("Aucune période ne compare le réel à la référence sur les 12 derniers mois.", "No period compares actuals with the baseline over the last 12 months.") };
        return { type: "nombre", valeur: r[0].total.ecart_pct, unite: "%", phrase: Lg("Du " + r[0].du + " au " + r[0].au + " : ", "From " + r[0].du + " to " + r[0].au + ": ")
          + r.map(x => "« " + x.serie + " » " + dsnKwh(x.total.ecart_kwh) + " (" + dsnPct(x.total.ecart_pct) + (x.total.cout_estime_eur != null ? ", " + dsnSigne(x.total.cout_estime_eur, 0) + " €" : "") + ")").join(" ; ")
          + Lg(" par rapport à la référence.", " against the baseline.") }; } },
    { id: "cher", texte: Lg("Quelle dérive en cours coûte le plus ?", "Which ongoing drift costs the most?"),
      plan: [lister, tousEpisodes],
      lire: vus => { const e = dsnEnCours(vus).sort((a, b) => dsnCoutProj(b) - dsnCoutProj(a))[0];
        if (!e) return { type: "abstention", phrase: Lg("Aucune surconsommation n'est en cours sur ce site.", "No overconsumption is under way on this site.") };
        const p = e.projection_3_mois_si_l_ecart_moyen_se_maintient, eur = p && dsnEur(p.cout_estime_eur);
        return { type: "nom", nom: e.serie, phrase: Lg("« " + e.serie + " » : surconsommation en cours depuis " + e.periode_debut + " (" + e.nb_periodes + " périodes), " + dsnKwh(e.ecart_kwh) + " (" + dsnPct(e.ecart_pct) + ")" + (eur ? " ; si l'écart moyen se maintient, environ " + eur + " de plus sur 3 mois." : "."),
          "“" + e.serie + "”: overconsumption under way since " + e.periode_debut + " (" + e.nb_periodes + " periods), " + dsnKwh(e.ecart_kwh) + " (" + dsnPct(e.ecart_pct) + ")" + (eur ? "; if the average gap persists, about " + eur + " more over 3 months." : ".")) }; } }];
  // dérive d'un compteur général : les usages qui l'expliquent (seulement s'il y en a une)
  const site = D.episodes.filter(ep => ep.ouvert && ep.ecart > 0 && ep.groupe === "site").sort((a, b) => b.ecart - a.ecart)[0];
  if (site && m.series.some(x => x.groupe === "ues" && x.energie === site.energie)) Q.push({ id: "site", texte: Lg("Quels usages expliquent la dérive de « " + site.serie + " » ?", "Which uses explain the drift on “" + site.serie + "”?"),
    plan: [() => [["lister_series", {}], ["episodes", { nom: site.serie }]], vus => { const e = dsnEnCours(vus)[0], x = vus.lister_series[0].series.find(y => y.nom === site.serie);
      return e && x ? [["comparer_ues", { energie: x.energie, de: e.debut, a: e.fin }]] : []; }],
    lire: vus => { const r = (vus.comparer_ues || [])[0], u = r && r.ues.filter(x => x.ecart_kwh > 0)[0];
      if (!r || !r.site || !u) return { type: "abstention", phrase: Lg("Les résultats d'outils ne permettent pas d'attribuer cette dérive à un usage suivi.", "The tool results do not attribute this drift to a tracked use.") };
      return { type: "nom", nom: u.nom, phrase: Lg("Du " + r.du + " au " + r.au + ", « " + site.serie + " » dépasse sa référence de " + dsnKwh(r.site.ecart_kwh) + ". « " + u.nom + " » en porte " + nf(u.part_de_l_ecart_site_pct, 1) + " % (" + dsnKwh(u.ecart_kwh) + ") ; " + dsnKwh(r.ecart_site_non_explique_par_les_ues_kwh) + " ne viennent d'aucun usage suivi.",
        "From " + r.du + " to " + r.au + ", “" + site.serie + "” is above its baseline by " + dsnKwh(r.site.ecart_kwh) + ". “" + u.nom + "” carries " + nf(u.part_de_l_ecart_site_pct, 1) + "% of it (" + dsnKwh(u.ecart_kwh) + "); " + dsnKwh(r.ecart_site_non_explique_par_les_ues_kwh) + " come from no tracked use.") }; } });
  Q.push({ id: "facteurs", texte: Lg("Les facteurs influents expliquent-ils la dérive qui coûte le plus ?", "Do the influencing variables explain the costliest drift?"),
    plan: [lister, tousEpisodes, vus => { const e = dsnEnCours(vus).sort((a, b) => dsnCoutProj(b) - dsnCoutProj(a))[0]; return e ? [["lire_facteurs", { de: e.debut, a: e.fin }]] : []; }],
    lire: vus => { const e = dsnEnCours(vus).sort((a, b) => dsnCoutProj(b) - dsnCoutProj(a))[0], r = (vus.lire_facteurs || [])[0];
      if (!e || !r) return { type: "abstention", phrase: Lg("Aucune surconsommation en cours : rien à rapprocher des facteurs.", "No overconsumption under way: nothing to compare with the variables.") };
      const hors = r.facteurs.filter(f => /dessus|dessous/.test(f.position));
      return { type: "nom", nom: hors.length ? hors[0].facteur : "dans la plage habituelle", phrase: (hors.length
        ? Lg("Pendant la dérive de « " + e.serie + " » (du " + r.du + " au " + r.au + "), " + hors.map(f => "« " + f.facteur + " » est " + f.position).join(", ") + ".", "During the drift on “" + e.serie + "” (" + r.du + " to " + r.au + "), " + hors.map(f => "“" + f.facteur + "” is " + M(f.position)).join(", ") + ".")
        : Lg("Pendant la dérive de « " + e.serie + " » (du " + r.du + " au " + r.au + "), aucun facteur influent n'est sorti de sa plage habituelle : rien d'inhabituel de ce côté.", "During the drift on “" + e.serie + "” (" + r.du + " to " + r.au + "), no influencing variable left its usual range: nothing unusual on that side."))
        + Lg(" La référence tient déjà compte de ces facteurs.", " The baseline already accounts for these variables.") }; } });
  Q.push({ id: "modeles", texte: Lg("Quel modèle de référence est le moins fiable ?", "Which baseline model is the least reliable?"),
    plan: [lister],
    lire: vus => { const l = vus.lister_series[0].series.filter(x => x.r2 != null).sort((a, b) => a.r2 - b.r2);
      if (!l.length) return { type: "abstention", phrase: Lg("Le classeur ne donne le R² d'aucun modèle.", "The workbook gives no model's R².") };
      const a = l[0], b = l[l.length - 1];
      return { type: "nom", nom: a.nom, phrase: Lg("« " + a.nom + " » a le R² le plus faible : " + nf(a.r2, 3) + (a.erreur_modele_pct != null ? ", erreur du modèle " + nf(a.erreur_modele_pct, 2) + " %" : "") + ". Le plus élevé : « " + b.nom + " », " + nf(b.r2, 3) + ".",
        "“" + a.nom + "” has the lowest R²: " + nf(a.r2, 3) + (a.erreur_modele_pct != null ? ", model error " + nf(a.erreur_modele_pct, 2) + "%" : "") + ". The highest: “" + b.nom + "”, " + nf(b.r2, 3) + ".") }; } });
  return Q;
}
/* Le script joue le modèle : même forme de réponse que l'API (blocs tool_use), sans IA ni réseau. */
async function dsnDemo(requete, signal) {
  await attendre(DSN.pauseDemo, signal);
  const mes = requete.messages, Q = dsnQuestionsDemo().find(x => x.texte === mes[0].content), noms = {}, vus = {};
  if (!Q) throw new Error(Lg("Le script de démonstration ne connaît que les questions toutes faites.", "The demo script only knows the ready-made questions."));
  for (const x of mes) if (Array.isArray(x.content)) for (const b of x.content) {
    if (b.type === "tool_use") noms[b.id] = b.name;
    else if (b.type === "tool_result" && !b.is_error) (vus[noms[b.tool_use_id]] = vus[noms[b.tool_use_id]] || []).push(JSON.parse(b.content));
  }
  const tour = mes.filter(x => x.role === "assistant").length + 1, appels = Q.plan[tour - 1] ? Q.plan[tour - 1](vus) : null;
  const blocs = appels && appels.length ? appels.map(([name, input], k) => ({ type: "tool_use", id: "toolu_demo_dsn_" + tour + "_" + k, name, input }))
    : [{ type: "tool_use", id: "toolu_demo_dsn_" + tour, name: "repondre", input: Q.lire(vus) }];
  return { id: "msg_demo_dsn_" + tour, type: "message", role: "assistant", model: "script de démonstration", content: blocs, stop_reason: "tool_use", usage: { input_tokens: 0, output_tokens: 0 } };
}

/* Contrôle : chaque nombre écrit dans la réponse doit figurer, à l'arrondi près, dans un résultat d'outil (même règle que les fiches). */
function dsnControle(res) {
  const phrase = res.reponse ? res.reponse.phrase : "", sources = res.sources || [];
  const nombres = nombresDe(phrase.replace(/CO2/gi, "CO₂"), true).map(x => ({ ecrit: x.ecrit, ok: controlerChiffres([x.ecrit], sources).nbAbsents === 0 }));
  const valeur = res.reponse && res.reponse.valeur != null ? evlRecopie(res.reponse.valeur, sources) : null;
  return { nombres, total: nombres.length, absents: nombres.filter(x => !x.ok).length, valeur };
}
/* La phrase, avec ses nombres soulignés : vérifiés, ou signalés introuvables. */
function dsnPhrase(phrase, C) {
  const out = []; let i = 0;
  for (const x of C.nombres) {
    const j = phrase.indexOf(x.ecrit, i);
    if (j < 0) continue;
    if (j > i) out.push(phrase.slice(i, j));
    out.push(h("span", { class: x.ok ? "dsn-nb ok" : "nb absent", title: x.ok ? dsnT("Retrouvé dans un résultat d'outil", "Found in a tool result") : dsnT("Introuvable dans les résultats d'outils", "Not found in the tool results") }, x.ecrit));
    i = j + x.ecrit.length;
  }
  out.push(phrase.slice(i));
  return out.map(n => typeof n === "string" ? document.createTextNode(n) : n);    // texte du modèle : jamais traduit ni interprété
}

/* Pose une question. appeler : un faux modèle (tests) ; sinon le script en démonstration, ou l'IA réglée. */
async function dsnPoser(question, appeler) {
  const q = String(question == null ? "" : question).trim();
  if (!q || dsn.enCours || !etat.modele) return;
  Object.assign(dsn, { question: q, res: null, erreur: null, bloque: false, libre: false });
  const connue = dsnQuestionsDemo().some(x => x.texte === q);
  if (!appeler && agent.demo && !connue) { dsn.libre = true; dsnPeindre(); return; }      // démonstration : pas d'IA pour une question libre
  if (!appeler && !agent.demo) { const b = dsnBlocage(); if (b) { dsn.erreur = b; dsn.bloque = true; dsnPeindre(); return; } }
  const arret = new AbortController(), R = redacteurCourant(arret.signal), demo = !appeler && R.demo;
  const base = appeler || (demo ? req => dsnDemo(req, arret.signal) : R.appeler);
  const suivi = async req => { dsn.progres.tour++; dsnPeindre(); return base(req); };
  const garde = typeof evl !== "undefined" ? evl.progres : null;           // evlBoucle signale ses tours au banc : pas pendant une question
  Object.assign(dsn, { enCours: true, arret, progres: { tour: 0, debut: performance.now() } });
  dsnPeindre();
  try {
    if (garde) evl.progres = null;
    const res = await evlBoucle({ fr: q, en: q }, suivi, arret.signal);
    const C = dsnControle(res);
    delete res.sources;                                                   // les résultats d'outils ne sont pas gardés une fois la réponse contrôlée
    dsn.res = Object.assign(res, { question: q, demo, controle: C, agent: demo ? null : appeler ? "faux modèle de test" : F().nom + " (" + (res.modele || modeleIA()) + ")", duree: (performance.now() - dsn.progres.debut) / 1000 });
  } catch (e) {
    dsn.erreur = arret.signal.aborted ? dsnT("Question arrêtée.", "Question stopped.") : e && e.message ? e.message : String(e);
  } finally {
    if (garde && evl.progres == null) evl.progres = garde;
    Object.assign(dsn, { enCours: false, arret: null });
    if (etat.modele) dsnPeindre();
  }
}
function dsnArreter() { if (dsn.arret) dsn.arret.abort(); }

/* La barre : un seul noeud gardé d'un rendu à l'autre (la saisie et la réponse survivent aux changements de page). */
const dsnChamp = h("input", { type: "text", id: "dsn-question", class: "dsn-champ", autocomplete: "off", maxlength: 400, oninput: e => { dsn.question = e.target.value; } });
const dsnNoeud = h("div", { class: "dsn-barre" });
function dsnBarre() { dsnPeindre(); return dsnNoeud; }
function dsnPeindre() {
  const ici = document.activeElement === dsnChamp;
  dsnChamp.setAttribute("placeholder", tr(dsnT("Posez une question sur ce site…", "Ask a question about this site…")));
  dsnChamp.disabled = dsn.enCours;
  if (dsnChamp.value !== dsn.question && !ici) dsnChamp.value = dsn.question;
  const loupe = s("svg", { viewBox: "0 0 16 16", width: 18, height: 18, fill: "none", stroke: "currentColor", "stroke-width": 1.6, "stroke-linecap": "round", "aria-hidden": "true", class: "dsn-loupe" }, s("path", { d: "M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.4 10.4l3.1 3.1" }));
  const fleche = s("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, s("path", { d: "M8 13V3M4 7l4-4 4 4" }));
  const envoyer = dsn.enCours
    ? h("button", { type: "button", class: "dsn-envoyer arret", onclick: dsnArreter, "aria-label": dsnT("Arrêter", "Stop") }, s("svg", { viewBox: "0 0 16 16", width: 14, height: 14, "aria-hidden": "true" }, s("rect", { x: 3, y: 3, width: 10, height: 10, rx: 2, fill: "currentColor" })))
    : h("button", { type: "submit", class: "dsn-envoyer", "aria-label": dsnT("Envoyer la question", "Send the question") }, fleche);
  const form = h("form", { class: "dsn-demande", role: "search", onsubmit: e => { e.preventDefault(); dsnPoser(dsnChamp.value); } },
    h("label", { for: "dsn-question", class: "dsn-cache" }, dsnT("Posez une question sur ce site", "Ask a question about this site")), loupe, dsnChamp, envoyer);
  dsnNoeud.replaceChildren(form, dsnMode(), h("div", { class: "dsn-reponse", "aria-live": "polite" }, dsnReponse()));
  if (ici) dsnChamp.focus();
}
function dsnMode() {
  if (agent.demo) return h("div", { class: "dsn-mode" },
    h("p", { class: "dsn-note" }, h("b", null, dsnT("Démonstration, sans IA : ", "Demo, no AI: ")), dsnT("un script répond à ces questions toutes faites en lisant les données avec les outils de la page.", "a script answers these ready-made questions by reading the data with the page's tools.")),
    h("div", { class: "dsn-puces" }, dsnQuestionsDemo().map(Q => h("button", { type: "button", class: "dsn-puce", "aria-pressed": String(dsn.question === Q.texte && !!(dsn.res || dsn.enCours)), disabled: dsn.enCours || null, onclick: () => { dsn.question = Q.texte; dsnChamp.value = Q.texte; dsnPoser(Q.texte); } },
      h("span", { class: "dsn-etoile", "aria-hidden": "true" }, "✦"), document.createTextNode(Q.texte)))));
  const b = dsnBlocage();
  return h("p", { class: "dsn-note dsn-mode" }, Lg("Un agent (" + F().nom + ", " + modeleIA() + ") lit les données avec les outils de la page et répond ; chaque chiffre de sa réponse est contrôlé. ", "An agent (" + F().nom + ", " + modeleIA() + ") reads the data with the page's tools and answers; every figure in its answer is checked. "),
    b ? h("span", null, dsnT("Envoi pas encore autorisé. ", "Sending not authorised yet. "), h("button", { type: "button", class: "lien", onclick: () => iaOuvrir() }, "Réglages d'IA"))
      : h("span", null, dsnT("Envoi autorisé (réglages d'IA) · ", "Sending authorised (AI settings) · "), h("button", { type: "button", class: "lien", onclick: () => iaOuvrir() }, "Modifier")));
}
function dsnReponse() {
  if (dsn.enCours) {
    const P = dsn.progres;
    return h("div", { class: "dsn-carte-rep" }, h("div", { class: "progres" }, h("span", { class: "voyant actif", "aria-hidden": "true" }),
      h("b", null, agent.demo ? dsnT("Le script lit les données…", "The script is reading the data…") : dsnT("L'agent lit les données…", "The agent is reading the data…")),
      h("span", { class: "phase" }, Lg("tour " + Math.max(1, P.tour) + " sur " + evl.tours + " au plus", "turn " + Math.max(1, P.tour) + " of " + evl.tours + " at most")),
      h("button", { type: "button", class: "btn petit", onclick: dsnArreter }, dsnT("Arrêter", "Stop"))));
  }
  if (dsn.libre) return h("div", { class: "dsn-carte-rep" },
    h("p", { class: "dsn-q" }, dsnT("Question : ", "Question: "), document.createTextNode(dsn.question)),
    h("p", null, dsnT("En mode démonstration, aucune IA ne lit les questions libres : seules les questions toutes faites ci-dessus ont une réponse, calculée par un script. Pour poser votre propre question, réglez une IA.", "In demo mode, no AI reads free questions: only the ready-made questions above have an answer, computed by a script. To ask your own question, set up an AI.")),
    h("button", { type: "button", class: "btn principal", onclick: () => iaOuvrir() }, dsnT("Régler une IA", "Set up an AI")));
  if (dsn.erreur) return h("div", { class: "dsn-carte-rep" }, h("p", { class: "erreur" }, document.createTextNode(dsn.erreur)),
    dsn.bloque ? h("button", { type: "button", class: "btn", onclick: () => iaOuvrir() }, "Réglages d'IA") : null);
  const r = dsn.res;
  if (!r) return null;
  const C = r.controle, R = r.reponse;
  const verdict = !R ? null : !C.total ? h("span", { class: "dsn-pastille" }, dsnT("aucun chiffre à contrôler", "no figure to check"))
    : C.absents ? h("span", { class: "dsn-pastille rouge" }, Lg(C.absents + " chiffre(s) sur " + C.total + " introuvable(s) dans les résultats d'outils", C.absents + " of " + C.total + " figure(s) not found in the tool results"))
    : h("span", { class: "dsn-pastille vert" }, Lg(C.total + " chiffre(s) sur " + C.total + " retrouvé(s) dans les résultats d'outils", C.total + " of " + C.total + " figure(s) found in the tool results"));
  const outils = r.appels.map(a => h("li", null, h("code", null, a.outil), " ", h("span", { class: "dsn-entree" }, document.createTextNode(JSON.stringify(a.entree))), a.erreur ? h("span", { class: "erreur" }, " — " + a.erreur) : null));
  return h("div", { class: "dsn-carte-rep" },
    h("p", { class: "dsn-q" }, dsnT("Question : ", "Question: "), document.createTextNode(r.question)),
    R ? h("p", { class: "dsn-texte" }, R.abstention ? h("b", null, dsnT("Pas de réponse dans les données : ", "No answer in the data: ")) : null, dsnPhrase(R.phrase, C))
      : h("p", { class: "dsn-texte" }, Lg("Pas de réponse structurée : " + r.motif + ".", "No structured answer: " + r.motif + "."), r.texte ? h("span", { class: "dsn-entree" }, document.createTextNode(" " + r.texte.slice(0, 600))) : null),
    h("div", { class: "dsn-pied" }, verdict,
      h("span", { class: "dsn-source" }, r.demo ? dsnT("Réponse du script de démonstration (sans IA)", "Answer from the demo script (no AI)") : Lg("Réponse de " + r.agent, "Answer from " + r.agent),
        Lg(" · " + r.appels.length + " appel(s) d'outils · " + nf(r.duree, 1) + " s", " · " + r.appels.length + " tool call(s) · " + nf(r.duree, 1) + " s"))),
    repli("dsn-outils", Lg("Outils appelés (" + r.appels.length + ")", "Tools called (" + r.appels.length + ")"), h("ul", { class: "dsn-outils" }, outils)));
}

AU_CHARGEMENT.push(() => {
  if (dsn.arret) dsn.arret.abort();
  Object.assign(dsn, { question: "", res: null, erreur: null, bloque: false, libre: false });
  dsnChamp.value = "";
});
