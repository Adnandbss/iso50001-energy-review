# Module « Allègement » (idee-14-allegement, préfixe `alg`) — vague 2, point 4 et finitions de la vague 1

Branche `vague2-allegement`. Ce module porte l'allègement des pages du cœur (Site, UES, Facteurs influents, Graphiques, Arborescence) et le test commun de toutes les pages allégées. Les pages des autres modules ont été allégées dans leur propre dossier (`idee-1`, `idee-2`, `idee-3`, `idee-5`, `idee-6`, `idee-10`) ; ce document les décrit toutes.

## Le principe appliqué

Chaque page commence par une phrase calculée (classe `constat`), qui reprend les chiffres de la page dans leur format, puis l'action la plus probable ; viennent ensuite le graphique principal et les réglages courants. Méthode, limites, hypothèses, tableaux détaillés, réglages rares et avertissements détaillés passent sous le composant commun `repli`. Un avertissement qui change la lecture d'un chiffre reste visible en une ligne. Aucun calcul n'a changé ; aucun contrôle n'a disparu (vérifié par le test, contrôle par contrôle).

## Page par page

- **Prévision** (`idee-1`) : en tête « Atterrissage 2024 de « série » : 7,2 GWh, entre 6,8 GWh et 7,4 GWh. » puis « Sur le passé, cette méthode s'est trompée de 7,3 % en moyenne ; elle ne fait pas nettement mieux que la méthode naïve (7,8 %). » Une ligne visible pour l'historique (« Historique court : 1,5 an de données… la fourchette ne couvre pas une année très différente ») et la dérive en cours (prolongée ou non). Tuiles : atterrissage, coût, émissions, objectif ; « dont déjà consommé » et « dont prévu » passent dans le détail de l'atterrissage. Puis les réglages, le graphique (260 px au lieu de 300) et sa méthode repliée ; trois replis : « Comment se décompose l'atterrissage ? », « La méthode est-elle fiable ? Le test sur le passé » (preuve et exemple), « Sur quelles hypothèses ? ». Le graphique d'exemple, replié, se dessine à l'ouverture (`prevDessinOuvert`), quand sa zone a une largeur.
- **Simulateur** (`idee-5`) : en tête le résultat du scénario affiché (« Avec « Scénario A », le modèle aurait donné : Électricité +1,25 GWh (+11,21 %), Gaz… » puis coût et émissions, et « simulation, pas une prévision »), ou « Aucun réglage : la simulation est égale à la référence. » ; la ligne « À lire avant de conclure : extrapolation (1 facteur), modèle fragile… » quand il y a lieu ; les tuiles ; le champ « Écrivez votre scénario » ; la période ; le graphique, avec le choix de la série sur la ligne de sa légende ; les réglages : barre des scénarios et facteurs réglés visibles, les autres facteurs (et les prix s'ils ne sont pas modifiés) sous « Régler un facteur à la main (n) ». Replis : effet par série et répartitions, « Quel facteur pèse le plus ? », « Comparer les scénarios (n) », détail des avertissements, méthode (avec l'ancien chapeau).
- **Revue** (`idee-2`) : réponse « Revue du … au … : pas encore rédigée. Le dossier compte N faits calculés et K épisodes de dérive… Étape suivante : « Rédiger la revue » », puis selon l'état : brouillon avec ses signalements ouverts, brouillon sans signalement, revue validée. Le chapeau et la note des contrôles sont repliés. La réponse ne s'imprime pas.
- **Évaluation** (`idee-3`) : réponse « Aucune passe pour l'instant : le banc a préparé 26 questions, dont 7 pièges. » ou « Passe n : X % de réussite sur N questions notées », taux d'invention, et la mention du script de démonstration. Nombre de questions et lancement restent visibles ; graine, tarifs et monnaie passent sous « Graine et tarifs (tarifs à saisir pour estimer le coût) » ; méthode et limites repliées.
- **Intégration** (`idee-6`) : réponse sur la page (pas sur l'accueil) : d'où viennent les données affichées, ou où en est le fichier en cours (lu, rôles proposés, modèles calculés) et l'étape suivante. La méthode des modèles est repliée ; « Une corrélation n'est pas une cause : modèles à faire relire » reste visible.
- **Vue d'ensemble** (`idee-10`) : la phrase de synthèse vient avant le bouton de visite ; la note de méthode est repliée. La visite éclaire la réponse de la page Évaluation (`.evl-reponse`).
- **Site et UES** (cœur, par `coeur.py`) : « « série » : +1,1 % par rapport à sa référence (+122 MWh, surconsommation). » puis la période, les périodes hors du tunnel (« 8 période(s) sur 79… par hasard, environ 1 sur 20 ») et la dérive en cours. Quatre tuiles visibles ; « R² du modèle » et « Hors tunnel » (déjà dans la phrase) sous « Qualité du modèle et périodes hors du tunnel » ; « Comparer à », « Écart en » et « Seuil d'alerte » sous « Autres réglages ».
- **Facteurs influents** : « « facteur » et « consommation » : liaison modérée, positive (r = …, sur N dates). À lui seul, ce facteur explique … de la variation (R²) ; le modèle complet, tous facteurs, atteint … » Les chiffres sont ceux des tuiles ; la phrase finit par « Une corrélation n'est pas une cause. »
- **Graphiques** : total du site sur la période, par énergie, et le premier usage suivi avec sa part des UES.
- **Arborescence** : total du site et part suivie par les UES, énergie par énergie ; signale une énergie où les UES dépassent le compteur site.
- **Mode d'emploi** : inchangé dans sa forme ; son sommaire cliquable est vérifié par le test (un lien par section, chaque lien se clique).
- Pages **Détection, Instruction, Veille** : non touchées (l'autre agent les fusionne).

`coeur.py` : cinq groupes de remplacements courts et commentés. Site/UES : les réglages rares forment un second groupe `rares`, et la page passe ses variables à `algNiveau` ; Facteurs, Graphiques, Arborescence : la page passe ses variables à `algFacteurs`, `algGraphiques`, `algArborescence`. Aucun calcul n'est refait dans le module.

## Mesures avant / après

Chrome sans fenêtre, 1 280 × 800, premier affichage (replis fermés). Mots visibles = mots du texte rendu de la zone de page ; total = mêmes mots avec tous les replis ouverts ; contrôles = boutons, champs, listes, liens et titres de repli de la zone de page ; hauteur en écrans de 800 px, menu de gauche exclu. Avant = commit `c992348`. Script de mesure hors dépôt.

| Page | Jeu | Mots visibles / total | Contrôles visibles / total | Écrans |
|---|---|---|---|---|
| Prévision | classeur | 1 035 / 1 035 → **232 / 1 066 (22 %)** | 10 / 10 → 13 / 14 | 3,89 → **1,34** |
| Prévision | fictif | 901 / 901 → **212 / 912 (23 %)** | 10 / 10 → 13 / 14 | 3,76 → **1,36** |
| Simulateur | classeur | 1 226 / 1 226 → **219 / 1 256 (17 %)** | 62 / 62 → 24 / 67 | 5,12 → **1,43** |
| Simulateur | fictif | 1 063 / 1 063 → **219 / 1 094 (20 %)** | 49 / 49 → 25 / 54 | 4,69 → **1,48** |
| Revue | classeur / fictif | 162 → 124 ; 163 → 125 | 8 → 10 ; 9 → 11 | 1,28 → 1,36 ; 1,32 → 1,41 |
| Évaluation | classeur / fictif | 361 → 160 ; 361 → 160 | 11 → 8 (13 au total) | 1,04 → 0,89 ; 1,09 → 0,94 |
| Intégration | classeur / fictif | 64 → 95 ; 64 → 99 | 1 → 1 | 0,89 → 0,89 |
| Vue d'ensemble | classeur / fictif | 298 → 231 ; 293 → 226 | 6 → 7 ; 7 → 8 | 1,06 → 1,02 ; 1,10 → 1,06 |
| Site | classeur / fictif | 188 → 213 ; 194 → 220 | 17 → 13 (19) ; 18 → 14 (20) | 1,60 → 1,61 ; 1,65 → 1,74 |
| UES | classeur / fictif | 199 → 218 ; 200 → 225 | 17 → 13 (19) ; 18 → 14 (20) | 1,60 → 1,61 ; 1,65 → 1,65 |
| Facteurs influents | classeur / fictif | 195 → 235 ; 170 → 208 | 13 → 13 ; 14 → 14 | 1,43 → 1,57 ; 1,47 → 1,62 |
| Graphiques | classeur / fictif | 164 → 199 ; 157 → 192 | 15 → 15 ; 16 → 16 | 1,31 → 1,46 ; 1,33 → 1,45 |
| Arborescence | classeur / fictif | 141 → 176 ; 136 → 171 | 7 → 7 ; 8 → 8 | 0,98 → 1,13 ; 0,99 → 1,14 |
| Mode d'emploi | les deux | 3 290 → 3 860 (quatre sections de plus) | 32 → 38 | 18,8 → 20,1 |

En anglais, mêmes ordres de grandeur : Prévision 992 → 226 mots visibles, 3,87 → 1,42 écran (classeur), 3,76 → 1,45 (fictif) ; Simulateur 1 198 → 209, 5,26 → 1,43 (classeur), 4,76 → 1,48 (fictif).

Objectif tenu pour Prévision et Simulateur (moins de 1,5 écran, moins du quart des mots visibles). Honnêtement : sur les pages du cœur, déjà courtes, la phrase de réponse ajoute 35 à 40 mots et jusqu'à 0,15 écran (Facteurs, Graphiques, Arborescence) ; Site et UES restent à hauteur égale grâce aux deux tuiles repliées. Le Simulateur réglé (un facteur actif, avertissements) est plus haut que la page vide mesurée ici, puisque le facteur réglé reste visible.

## Finitions de la vague 1

- **Réglages d'IA** : les textes qui renvoyaient à la page Instruction pour le fournisseur, la clé ou l'accord renvoient aux réglages d'IA, en français et en anglais, dans le simulateur, la revue, l'évaluation, l'intégration et le mode d'emploi ; leurs liens s'appellent « Réglages d'IA » et ouvrent le panneau (`iaOuvrir`, sinon la page Instruction si le module IA est absent). Le module Veille n'est pas modifié (autre agent).
- **Accueil** : un seul bouton principal (« Essayer avec un site fictif ») ; « Choisir un fichier de données » (Intégration) devient secondaire ; nouveau bouton secondaire « Ouvrir un projet », à côté de « Choisir le classeur Excel », qui appelle `cntChoisirProjet()` s'il existe (remplacement dans `idee-10-accueil/coeur.py`).
- **Phrase de confidentialité** (accueil et mode d'emploi) : « …accord explicite, donné dans les réglages d'IA (un accord, fonction par fonction) ou sur la page concernée… » (une fonction décochée dans le panneau garde son avis sur sa page). Le texte français est dans `assembler.py` (`CONFID_APRES`) ; la traduction anglaise est dans `idee-9-assemblage`.
- **Mode d'emploi** : sections 16 « Site fictif et vue d'ensemble », 17 « Réglages d'IA », 18 « Travail gardé et fichier projet » (textes des NOTES des modules 10, 11, 12 ; la dernière mentionne aussi « Ouvrir un projet » sur l'accueil), 19 « Page Dérives : un seul parcours » (une phrase prudente, à compléter par l'autre agent), puis 20 « Partager ». La numérotation est désormais calculée dans l'ordre des sections : une section ajoutée par un autre module s'y range sans trou ni doublon.

## Tests

`idee-14-allegement/test.js` (252 vérifications, aucun appel réseau) : sur le classeur de test et sur le site fictif, en français et en anglais, pour les onze pages allégées : une réponse existe, la page commence par elle (seul un bandeau de reprise peut la précéder), elle est visible, chaque grandeur avec unité de la réponse figure ailleurs sur la page, la réponse est en anglais quand la page l'est, et chacun des contrôles relevés avant l'allègement (liste figée dans le test, noms de données remplacés) existe encore. Puis, chiffres recalculés à part : atterrissage et erreurs de la Prévision (`prevCalcul`), écarts, coût et émissions du Simulateur (`simCalculer`), faits et épisodes de la Revue, questions et pièges de l'Évaluation, écart du Site et de l'UES par `totalPeriode`, coefficient de corrélation des Facteurs recalculé à la main, total du site des Graphiques et de l'Arborescence. Il vérifie aussi ce qui est replié au premier affichage (preuve et hypothèses de la Prévision, facteurs non réglés, sensibilité, comparaison et effets du Simulateur, graine de l'Évaluation, « Comparer à » du Site) et ce qui reste visible (ligne « historique court », ligne « À lire avant de conclure », facteur réglé, lancement du banc). Mode d'emploi : un lien de sommaire par section, sections numérotées sans trou, chaque lien se clique ; sections 10, 11, 12 et Dérives présentes dans les deux langues ; plus aucun renvoi des réglages d'IA vers la page Instruction ; phrase de confidentialité dans les deux langues.

Tests d'autres modules mis à jour, sans rien affaiblir : `idee-1-prevision/test.js` ouvre le repli de la preuve avant de compter les deux graphiques ; `idee-3-evaluation/test.js` attend « Réglez d'abord l'envoi dans les réglages d'IA » ; `idee-10-accueil/test.js` vérifie en plus qu'il n'y a qu'un bouton principal, que le choix d'un fichier brut est secondaire et que « Ouvrir un projet » appelle le sélecteur de projet, et attend l'éclairage de la réponse de l'Évaluation à l'étape 5 de la visite.

`outillage/tout-tester.sh .` passe en entier (dernière ligne : `idee-14-allegement/test.js : 252 vérification(s) réussie(s), 0 échec(s) ; appels réseau tentés : 0`).

**Non testé par le banc** : la mise en page. Regardé dans Chrome sans fenêtre (profil temporaire effacé, fichiers locaux) : Prévision, Simulateur, Site, Vue d'ensemble et Évaluation à 1 280 px ; Prévision (clair) et Simulateur (sombre) à 500 px (la fenêtre ne descend pas plus bas) ; aucune des onze pages ne déborde horizontalement à 500 px. Pas vu sur un vrai téléphone ni dans Safari.

## Changements demandés ailleurs

Les points 2 (`CONFID_APRES`), 3 (`IA_LIENS` retiré) et 4 (section « Page Dérives » du mode d'emploi, sections Détection, Instruction et Veille retirées avec leurs captures) sont appliqués (branche `finitions-textes`). Le mode d'emploi compte désormais 17 sections numérotées ; le test vérifie qu'aucune page Détection, Instruction ou Veille n'y est citée et que chaque bouton « vers » ouvre une page qui existe.

Restent, hors des fichiers des finitions, des textes visibles qui citent encore une page disparue :

1. `idee-1-prevision/module.js` : « prix non renseigné pour cette énergie (page Détection) » → « (page Dérives) » ; anglais « (Detection page) » → « (Drifts page) ».
2. `idee-5-simulateur/module.js` : « champ vide : valeur de référence, celle de la page Détection » → « celle de la page Dérives » ; anglais « the one from the Detection page » → « the one from the Drifts page ».
3. `idee-3-evaluation/module.js` : « Une instruction est en cours sur la page Instruction : attendez sa fin. » → « Une instruction est en cours sur la page Dérives : attendez sa fin. » ; « les mêmes résultats que sur la page Instruction » → « les mêmes résultats que pour l'instruction d'une dérive » (et l'anglais « on the Investigation page » → « for a drift investigation »). Le second texte s'affiche aussi dans les réglages d'IA.

Les captures `derives`, `episodes`, `serie`, `agent` et `evaluation` restent dans le script `images-guide` du prototype, sans plus être appelées : à retirer ou à refaire avec la page Dérives.

## Mode d'emploi

**Français.** Chaque page commence par sa réponse : une phrase calculée par la page, avec les chiffres qui comptent, puis l'étape suivante. Viennent ensuite le graphique principal et les réglages courants. Le reste — méthode, limites, hypothèses, tableaux détaillés, réglages rares — se déplie au besoin sous un titre précédé d'une flèche, par exemple « Comment c'est calculé » ou « La méthode est-elle fiable ? Le test sur le passé ». Un bloc déplié le reste tant que la page est ouverte. Les avertissements qui changent la lecture d'un chiffre (historique court, extrapolation, modèle fragile) restent visibles en une ligne à côté de lui ; leur détail est dans le bloc correspondant.

**English.** Every page starts with its answer: a sentence computed by the page, with the figures that matter, then the next step. The main chart and the usual settings come next. The rest — method, limits, assumptions, detailed tables, rarely used settings — unfolds when needed under a heading with an arrow, such as “How it is computed” or “Is the method reliable? The test on past data”. An unfolded block stays open while the page is open. Warnings that change how a figure reads (short history, extrapolation, weak model) stay visible on one line next to it; their details are in the matching block.

## À vérifier à l'écran

- Prévision et Simulateur, à 1 280 × 800 : la réponse, les tuiles, les réglages et le graphique tiennent dans le premier écran et demi ; ouvrir « La méthode est-elle fiable ? » dessine bien le graphique d'exemple à la bonne largeur.
- Simulateur : cliquer « +10 % » sur un facteur replié le fait passer au-dessus, le repli restant ouvert ; la ligne « À lire avant de conclure » apparaît avec un réglage extrême.
- Site : la phrase et les quatre tuiles disent la même chose ; « Autres réglages » ouvre « Comparer à », et la phrase passe à « l'année précédente ».
- Accueil : un seul bouton sombre ; « Ouvrir un projet » ouvre le choix d'un fichier `.json`.
- Mode d'emploi : le sommaire mène à chaque section, numérotée de 1 à 17 ; la section 5 est la page Dérives.
- Thème sombre et 390 px : replis lisibles, pas de débordement.
