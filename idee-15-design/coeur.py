# Correctifs du coeur portés par le module « Design » (préfixe dsn) : trois remplacements d'affichage, aucun calcul.

def patch(js, remplacer):
    # 1. Marque de l'outil (une jauge stylisée, dsnLogo) devant le nom, dans le menu latéral.
    js = remplacer(js, 'h("div", { class: "marque" }, h("div", { class: "nom" }, "Revue énergétique")',
                       'h("div", { class: "marque" }, dsnLogo(), h("div", { class: "nom" }, "Revue énergétique")')
    # 2. La même marque sur l'écran d'accueil.
    js = remplacer(js, '    h("h1", null, "Revue énergétique"),',
                       '    h("h1", null, dsnLogo(), h("span", null, "Revue énergétique")),')
    # 3. Grand chiffre des tuiles : l'unité en petit (le texte reste le même, espace compris).
    js = remplacer(js, 'h("div", { class: "val" }, val)', 'h("div", { class: "val" }, dsnUnite(val))')
    return js
