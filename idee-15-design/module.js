/* ============================================================================
   Module « Design » (préfixe dsn) : thème « Lumière ».
   1. Marque de l'outil (une jauge stylisée), icône d'onglet, unité en petit dans les tuiles.
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
