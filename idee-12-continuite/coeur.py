# Correctifs du coeur portés par le module Continuité (préfixe cnt). Chacun est court ; les fonctions appelées sont dans module.js.

def patch(js, remplacer):
    # 1. Avant de charger un classeur, écrire tout de suite le travail de celui qu'on quitte (sinon l'attente de 400 ms peut le perdre).
    js = remplacer(js, "function charger(grilles, d1904, fichier, figee) {\n  const m = calculer(grilles, d1904);",
                   "function charger(grilles, d1904, fichier, figee) {\n  cntAvantChargement(figee);\n  const m = calculer(grilles, d1904);")
    # 2. Changer de langue : écrire le travail avant, puis reprendre un brouillon de revue gardé dans la nouvelle langue.
    js = remplacer(js, "  LANGUE = l;\n  try { localStorage.setItem(CLE_LANGUE, l); } catch (e) {}\n  CACHE_TR.clear(); cacheDerives = null;\n",
                   "  cntEnregistrer();\n  LANGUE = l;\n  try { localStorage.setItem(CLE_LANGUE, l); } catch (e) {}\n  CACHE_TR.clear(); cacheDerives = null;\n  cntApresLangue();\n")
    # 3. Pied du menu : le petit menu « Projet et travail gardé ».
    js = remplacer(js, 'h("button", { class: "btn principal", onclick: () => selecteur.click() }, "Changer de fichier"))),',
                   'h("button", { class: "btn principal", onclick: () => selecteur.click() }, "Changer de fichier"), cntMenu())),')
    # 4. En tête de chaque page : le bandeau « travail retrouvé ».
    js = remplacer(js, 'h("main", { class: "feuille" }, page.filter(Boolean))', 'h("main", { class: "feuille" }, cntBandeau(), page.filter(Boolean))')
    # 5. Un fichier projet (.json) déposé ou choisi à la place du classeur s'ouvre comme projet.
    js = remplacer(js, "async function ouvrir(fichier) {\n  try {", "async function ouvrir(fichier) {\n  if (/\\.json$/i.test(fichier.name || \"\")) return cntOuvrirProjet(fichier);\n  try {")
    js = remplacer(js, 'accept: ".xlsx,.xlsm", hidden: true', 'accept: ".xlsx,.xlsm,.json", hidden: true')
    return js
