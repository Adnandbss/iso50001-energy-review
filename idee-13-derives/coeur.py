"""Remplacements du coeur portés par le module Dérives (idee-13-derives).
Les pages Détection, Instruction et Veille deviennent une seule page : les fonctions d'origine restent,
seuls leurs points d'entrée renvoient vers elle. Trois remplacements courts."""


def patch(js, remplacer):
    # 1. choisirEpisode, appelé par la Vue d'ensemble, la visite guidée et les tableaux de la détection : la dérive s'ouvre
    #    sur place dans la page Dérives (drvChoisir). L'original reste disponible sous un autre nom.
    js = remplacer(js, "function choisirEpisode(ep) {\n  if (agent.enCours) return;",
                   "function choisirEpisode(ep) { return drvChoisir(ep); }                  // page Dérives : la dérive s'ouvre sous sa ligne (module idee-13-derives)\n"
                   "function choisirEpisodeOrigine(ep) {\n  if (agent.enCours) return;")
    # 2. peindreAgent redessinait la page Instruction ; il redessine désormais la page Dérives, qui montre le journal, la fiche et l'évaluation.
    js = remplacer(js, "function peindreAgent() {\n",
                   "function peindreAgent() {\n  if (typeof drvPeindre === \"function\") return drvPeindre();          // page Dérives (module idee-13-derives)\n")
    # 3. Chaque fiche rendue par une instruction est gardée avec celles de la veille : la dérive reste « instruite » quand on en instruit une autre.
    js = remplacer(js, "function montrerFiche(ep, res, redacteur, jugement) {\n",
                   "function montrerFiche(ep, res, redacteur, jugement) {\n  if (typeof drvFicheRendue === \"function\") drvFicheRendue(ep, res, redacteur, jugement);\n")
    return js
