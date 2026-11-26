# Correctifs du coeur portés par le module « Accueil » (préfixe acc). Deux remplacements, sur l'écran d'accueil seulement.

def patch(js, remplacer):
    # 1. Le bouton « Essayer avec un site fictif » se place au-dessus du choix de fichier (ACCUEIL_MODULES ne pose ses noeuds qu'en dessous).
    js = remplacer(js, '    h("p", null, "Déposez ici le classeur Excel de la revue (SER PBI), ou choisissez-le."),',
                       '    accAccueil(),\n    h("p", null, "Déposez ici le classeur Excel de la revue (SER PBI), ou choisissez-le."),')
    # 2. Un seul bouton principal sur l'accueil : le choix du classeur devient secondaire.
    js = remplacer(js, 'h("button", { class: "btn principal", onclick: () => selecteur.click() }, "Choisir le classeur Excel")',
                       'h("button", { class: "btn", onclick: () => selecteur.click() }, "Choisir le classeur Excel")')
    return js
