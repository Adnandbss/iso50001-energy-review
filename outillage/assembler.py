"""Assemble le tableau de bord : prototype d'origine + points d'accroche + modules.
Usage : python3 assembler.py <sortie.html> [dossier_module ...]
Chaque dossier de module contient module.js et, s'il y en a, module.css.
Écrit aussi <sortie>.js (le script complet) pour node --check et le banc de test."""
import pathlib, sys

ICI = pathlib.Path(__file__).resolve().parent
NOM_ORIGINE = "Tableau de bord revue énergétique - prototype agent.html"
# le prototype d'origine : dans livrables/ du dépôt, sinon dans le dossier de travail de l'auteur
ORIGINE = next((c for c in [ICI.parent / "livrables" / NOM_ORIGINE, pathlib.Path.home() / "Desktop/PBI" / NOM_ORIGINE] if c.exists()), ICI.parent / "livrables" / NOM_ORIGINE)
MARQUE = "/* ==== MODULES ==== */"

def remplacer(texte, ancien, nouveau):
    assert texte.count(ancien) == 1, "repère introuvable ou ambigu : " + ancien[:70]
    return texte.replace(ancien, nouveau)

def base(js):
    # 1. Pages ajoutées par les modules
    js = remplacer(js, 'const ONGLETS = PAGES.flatMap(g => g.pages);', '''const ONGLETS = PAGES.flatMap(g => g.pages);
/* ---- Points d'accroche des modules ---- */
const PAGES_MODULES = {};                                                 // identifiant de page -> fonction qui rend la liste de ses noeuds
const AU_CHARGEMENT = [];                                                 // fonctions appelées quand un classeur vient d'être chargé
const ACCUEIL_MODULES = [];
const APRES_RENDU = [];                                                   // fonctions appelées à la fin de chaque rendre(), une fois les graphiques dessinés                                               // fonctions qui rendent un noeud de plus sur l'écran d'accueil
function ajouterPage(groupe, id, menu, titre, cheminIcone, rendu) {
  let g = PAGES.find(x => x.groupe === groupe);
  if (!g) { g = { groupe, pages: [] }; PAGES.splice(PAGES.length - 1, 0, g); }     // un nouveau groupe se place avant « Aide »
  const entree = [id, menu, titre];
  g.pages.push(entree); ONGLETS.push(entree);
  PAGES_MODULES[id] = rendu;
}
function ajouterTraductions(paires) { for (const [fr, en] of paires) EN.set(fr, en); CACHE_TR.clear(); }
/* Bloc replié commun : la réponse d'abord, la méthode et les limites sous « Comment c'est calculé ». L'état ouvert est retenu par clé pendant la session. */
const REPLIS_OUVERTS = new Set();
function repli(cle, titre, ...enfants) {
  const d = h("details", { class: "repli", open: REPLIS_OUVERTS.has(cle) || null, ontoggle: e => { e.currentTarget.open ? REPLIS_OUVERTS.add(cle) : REPLIS_OUVERTS.delete(cle); } },
    h("summary", null, titre || "Comment c'est calculé"), h("div", { class: "repli-corps" }, ...enfants));
  return d;
}
EN.set("Comment c'est calculé", "How it is computed"); EN.set("Limites", "Limits"); EN.set("Détails", "Details");''')
    js = remplacer(js, 'const page = etat.onglet === "site" ? pageNiveau("site")', 'const page = PAGES_MODULES[etat.onglet] ? PAGES_MODULES[etat.onglet]() : etat.onglet === "site" ? pageNiveau("site")')
    js = remplacer(js, 'const ICONES = {', 'const ICONES = {\n  /* les modules ajoutent leur icône ici : ICONES[id] = "chemin SVG 16x16" */')
    # 2. Rappel au chargement d'un classeur
    js = remplacer(js, "  if (ONGLETS.some(o => o[0] === voulu)) etat.onglet = voulu;\n  rendre();", "  if (ONGLETS.some(o => o[0] === voulu)) etat.onglet = voulu;\n  for (const f of AU_CHARGEMENT) { try { f(m); } catch (e) { console.error(e); } }\n  rendre();")
    # 3. Écran d'accueil extensible
    js = remplacer(js, 'return h("div", null, zone, h("details", { class: "guide-accueil" }', 'return h("div", null, zone, ACCUEIL_MODULES.map(f => f()), h("details", { class: "guide-accueil" }')
    js = remplacer(js, "  for (const f of aDessiner) f();\n}", "  for (const f of aDessiner) f();\n  for (const f of APRES_RENDU) { try { f(); } catch (e) { console.error(e); } }\n}")
    # 4. Emplacement des modules : juste avant le démarrage
    js = remplacer(js, "/* Démarrage : données incluses", MARQUE + "\n\n/* Démarrage : données incluses")
    return js

def remplacer_tout(texte, ancien, nouveau, attendu):
    assert texte.count(ancien) == attendu, "nombre d'occurrences inattendu (%d) : %s" % (texte.count(ancien), ancien[:70])
    return texte.replace(ancien, nouveau)

CONFID_AVANT = "Seule exception (prototype) : dans l'onglet Dérives, l'instruction d'un épisode par l'IA envoie des valeurs à l'API d'IA que vous choisissez (Google Gemini ou Anthropic), uniquement après votre accord explicite."
CONFID_APRES = "Exceptions, uniquement après votre accord explicite, donné sur la page concernée, et vers l'API d'IA que vous choisissez (Google Gemini ou Anthropic) : l'instruction d'une dérive, la veille, la revue et l'évaluation envoient des valeurs du classeur ; le simulateur envoie la phrase que vous écrivez, avec les noms et les plages des facteurs ; l'intégration d'un fichier envoie les intitulés des colonnes et quelques valeurs."
EVAL_AVANT = "Une évaluation répète ces envois pour chaque épisode évalué."
EVAL_APRES = "Une évaluation, ou une série lancée depuis la page Veille, répète ces envois pour chaque épisode."

def correctifs(js):
    """Corrections du coeur décidées à l'assemblage des six modules."""
    # a. Plage habituelle des facteurs : les lignes du classeur sans consommation (après la fin des données) ne sont pas des mesures.
    js = remplacer(js, """      f.valeurs.forEach((v, i) => {
        if (v == null) return;
        const t = m.dates[i];
        if (t >= de && t <= a) dedans.push(v);""", """      f.valeurs.forEach((v, i) => {
        const t = m.dates[i];
        if (v == null || t < m.debut || t > m.fin) return;                // lignes sans consommation : facteurs non mesurés
        if (t >= de && t <= a) dedans.push(v);""")
    # b. Textes devenus inexacts avec les nouvelles pages (la traduction anglaise est posée par le module d'assemblage).
    js = remplacer_tout(js, CONFID_AVANT, CONFID_APRES, 2)
    js = remplacer_tout(js, EVAL_AVANT, EVAL_APRES, 2)
    js = remplacer(js, "Le menu de gauche donne accès à sept pages, décrites ci-dessous dans l'ordre où on s'en sert.", "Le menu de gauche donne accès aux pages, décrites ci-dessous dans l'ordre où on s'en sert.")
    js = remplacer(js, "The menu on the left gives access to seven pages, described below in the order you use them.", "The menu on the left gives access to the pages, described below in the order you use them.")
    # d. Requête coupée : distinguer une coupure après une longue attente (modèle qui réfléchit, navigateur qui abandonne) d'un réseau injoignable.
    for api in ("Anthropic", "Gemini"):
        url = "IA.url" if api == "Anthropic" else 'GEMINI.url + modele + ":generateContent"'
        js = remplacer(js, "    let rep;\n    try {\n      rep = await fetch(" + url + ", {", "    let rep; const t0 = Date.now();\n    try {\n      rep = await fetch(" + url + ", {")
        js = remplacer(js, """      throw new Error("Connexion à l'API """ + api + """ impossible (réseau coupé, proxy d'entreprise ou requête bloquée par le navigateur).");""",
                       """      throw new Error(erreurReseauIA(\"""" + api + """\", Date.now() - t0));""")
    js = remplacer(js, "/* ---- Appel réel : API Messages d'Anthropic", """/* Message d'une requête qui n'a pas abouti. Au-delà de 30 s, ce n'est pas le réseau : le serveur répondait trop lentement et la connexion a été coupée. */
function erreurReseauIA(api, ms) {
  const s = Math.round(ms / 1000);
  if (s < 30) return Lg("Connexion à l'API " + api + " impossible (réseau coupé, proxy d'entreprise ou requête bloquée par le navigateur).", "Cannot reach the " + api + " API (network down, corporate proxy, or request blocked by the browser).");
  return Lg("La requête à l'API " + api + " a été interrompue après " + s + " s sans réponse. Le modèle réfléchissait encore : certains navigateurs, dont Safari, abandonnent une requête restée silencieuse environ une minute. Relancez dans Chrome, Edge ou Firefox, ou choisissez un modèle plus rapide.",
    "The request to the " + api + " API was cut off after " + s + " s without a reply. The model was still thinking: some browsers, Safari among them, drop a request that stays silent for about a minute. Run it again in Chrome, Edge or Firefox, or pick a faster model.");
}
/* ---- Appel réel : API Messages d'Anthropic""")
    return js

def correctifs_css(css):
    css += """
/* bloc replié commun (repli) */
details.repli { margin-top: 10px; border-top: 1px solid var(--bord); padding-top: 8px; }
details.repli > summary { cursor: pointer; color: var(--encre2); font-size: .92em; list-style: none; display: inline-flex; align-items: center; gap: 6px; }
details.repli > summary::-webkit-details-marker { display: none; }
details.repli > summary::before { content: "▸"; display: inline-block; transition: transform .15s; }
details.repli[open] > summary::before { transform: rotate(90deg); }
details.repli > summary:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 3px; }
details.repli > .repli-corps { margin-top: 8px; }
@media (prefers-reduced-motion: reduce) { details.repli > summary::before { transition: none; } }
"""
    # c. Sur petit écran, la grille à 12 colonnes débordait (11 gouttières de 36 px) : une seule colonne.
    return remplacer(css, "@media (max-width: 900px) { .carte.demi { grid-column: span 12; } }",
                     "@media (max-width: 900px) { .grille { grid-template-columns: minmax(0, 1fr); } .grille > * { grid-column: 1 / -1 !important; } }")

PATCHS_CSS = []

def main():
    sortie = pathlib.Path(sys.argv[1]).resolve()
    dossiers = [pathlib.Path(d).resolve() for d in sys.argv[2:]]
    t = ORIGINE.read_text(encoding="utf-8")
    i = t.index("<script>", 1400000) + 8; j = t.rindex("</script>")
    js = base(t[i:j])
    if dossiers: js = correctifs(js)
    for d in dossiers:
        if (d / "coeur.py").exists():
            ns = {}
            exec(compile((d / "coeur.py").read_text(encoding="utf-8"), str(d / "coeur.py"), "exec"), ns)
            if "patch" in ns: js = ns["patch"](js, remplacer)
            if "patch_css" in ns: PATCHS_CSS.append(ns["patch_css"])
    css_plus, js_plus = "", ""
    for d in dossiers:
        js_plus += "\n/* ==== module : " + d.name + " ==== */\n" + (d / "module.js").read_text(encoding="utf-8") + "\n"
        if (d / "module.css").exists():
            css_plus += "\n/* ==== module : " + d.name + " ==== */\n" + (d / "module.css").read_text(encoding="utf-8") + "\n"
    assert "</script" not in js_plus.lower(), "un module contient </script"
    js = js.replace(MARQUE, MARQUE + js_plus)
    k0 = t.index("<style>") + 7; k = t.index("</style>")
    css = correctifs_css(t[k0:k]) if dossiers else t[k0:k]
    for f in PATCHS_CSS: css = f(css, remplacer)
    html = t[:k0] + css + css_plus + t[k:i] + js + t[j:]
    sortie.write_text(html, encoding="utf-8")
    sortie.with_suffix(".js").write_text(js, encoding="utf-8")
    print("écrit :", sortie, len(html), "octets ;", len(dossiers), "module(s)")

if __name__ == "__main__":
    main()
