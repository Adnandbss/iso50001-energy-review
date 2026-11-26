# Essais avec une vraie IA — 26/11/2026

Version testée : `Tableau de bord revue énergétique - agents et prévision.html`, classeur `SER PBI générique - valeurs figées.xlsm`, navigateur intégré de l'app Claude (Chromium), clé Gemini gratuite fournie par l'utilisateur.

## 1. Banc d'évaluation — gemini-3.5-flash-lite, 17 questions, graine 1

| Indicateur | Résultat |
|---|---|
| Réussite | **17 / 17** (13 réponses justes, 4 abstentions justifiées) |
| Taux d'invention sur les pièges | **0 sur 4** |
| Abstentions à tort | 0 sur 13 |
| Chiffres recopiés d'un résultat d'outil | 9 / 9 |
| Appels d'outils et tours par question | 1,6 et 2,7 en moyenne |
| Jetons par question | 5 757 en entrée, 128 en sortie |
| Durée par question | 9,7 s en moyenne (1,2 s à 3,7 s sans attente ; jusqu'à 77 s quand la clé gratuite atteignait sa limite par minute) |
| Erreurs d'API | 0 (les refus pour limite de débit ont été réessayés automatiquement) |

Par famille : lecture simple 3/3, comparaison 3/3, épisodes de dérive 3/3, facteurs influents 2/2, plusieurs étapes 2/2, pièges 4/4.

Les quatre pièges et ce que le modèle a répondu :

- **P1, plage sans données** (CVC Process, 28/10 au 23/12/2024) : « les données du classeur s'arrêtent au 2024-09-30 ».
- **P2, série inexistante** (« PDL Process ») : « série inconnue dans ce classeur ».
- **P3, cause d'une dérive** : « les résultats d'outils ne contiennent pas d'explication sur la panne ou l'événement ».
- **P4, puissance souscrite** : « le classeur ne contient pas cette information ».

Une remarque relevée à la lecture : pour E2, la valeur structurée est juste (−22 418 kWh), mais la phrase d'accompagnement parle d'un écart « en valeur absolue de 22418 kWh » sans le signe. La notation porte sur la valeur, pas sur la phrase.

**Limite à dire en entretien :** chaque question se résout en un à trois appels d'outils dont la page connaît le chemin. Un 17 sur 17 prouve que l'agent lit et recopie sans inventer, pas qu'il raisonne bien sur un cas ouvert. Pour durcir le banc : plus de questions à plusieurs étapes, des questions ambiguës, plusieurs graines.

## 1 bis. Banc durci — gemini-3.5-flash-lite, 26 questions, graine 1

Deux familles ajoutées : **Raisonnement** (comparer deux séries en %, repérer la période au |z| maximal, enchaîner série la plus dérivante puis épisode le plus récent, UES de signe opposé au site, UES au coût le plus élevé qui n'est pas celle au plus grand écart) et **Pièges subtils** (épisode « en cours » d'une série dont tout est clos, nom de série presque juste, z d'une série au modèle incomplet, plage qui dépasse la fin des données mais dont le total existe). Les 156 réponses attendues de 6 graines sont recalculées par un second chemin indépendant dans les tests.

| Indicateur | Résultat |
|---|---|
| Réussite | **26 / 26** (19 réponses justes, 7 abstentions justifiées) |
| Inventions sur les pièges | 0 sur 7 |
| Abstentions à tort | 0 sur 19 (dont S4, où s'abstenir était le piège) |
| Appels d'outils et tours par question | 1,7 et 2,7 en moyenne |
| Jetons par question | 5 857 en entrée, 128 en sortie |
| Erreurs d'API | 0 |

Réponses aux pièges subtils : « aucun épisode n'est en cours pour la série » (S1) ; « la série « EC Principale Process » est inconnue » (S2, sans substitution) ; « le z ne peut pas être calculé car l'erreur du modèle n'est pas renseignée au pas semaine » (S3) ; total rendu malgré une plage débordante (S4).

**Lecture.** Même durci, le banc ne départage pas : le plus petit modèle Gemini fait un sans-faute. L'explication tient à la conception de l'outil : toute la difficulté numérique est prise en charge par la page (les outils rendent des totaux, des écarts, des z déjà calculés, et une erreur explicite quand une série est inconnue ou non analysable), et la consigne interdit au modèle de calculer. Le modèle n'a plus qu'à lire, comparer et savoir s'abstenir. C'est l'argument à défendre : **l'architecture rend fiable un modèle léger et bon marché** ; le banc le prouve sur 26 questions dont 7 pièges. Pour qu'il départage des modèles, il faudrait des tâches ouvertes (rédiger une fiche, choisir quoi investiguer), notées par une grille ou un juge, plutôt que des questions à réponse unique.

## 2. Essais qui n'ont pas abouti

- **gemini-3.8-flash** : refus « modèle surchargé » (HTTP 503) presque à chaque appel, une requête restée 2 min 30 sans réponse ; passe arrêtée à la question 2.
- **gemini-4-hydrogen** : quota gratuit de 20 requêtes par jour atteint (message de Google : `generate_content_free_tier_requests, limit: 20`). Une passe complète en demande plus de 50.

## 3. Instruction d'une dérive — gemini-4-hydrogen

Épisode : PDL Gaz, S28 à S30 2023, +42,1 MWh (+19,3 %).

- Fiche complète en 4 tours, 13 appels d'outils ; tours de 32 à 76 s chacun.
- Contrôle de la page : **100 nombres sur 100** retrouvés dans les résultats d'outils.
- Constat principal du modèle : les trois UES gaz analysées n'expliquent que 5 620 kWh des 42 120 kWh d'écart du site ; une quatrième UES gaz n'est pas analysable faute d'erreur de modèle renseignée au pas hebdomadaire. Causes présentées comme des hypothèses, confiance « moyenne », cinq vérifications sur site proposées.
- Relecture par le second agent : non faite, bloquée par la limite de débit de la clé gratuite.

## 4. Diagnostic de l'échec dans le navigateur de l'utilisateur

L'API Gemini est joignable depuis ce Mac et accepte les appels venant de la page (testé sans clé). L'échec à 75 s venait d'une requête coupée pendant que le modèle réfléchissait (tours jusqu'à 76 s). Le message d'erreur, qui accusait le réseau, est corrigé : au-delà de 30 s, la page dit que la requête a été interrompue faute de réponse et conseille un autre navigateur ou un modèle plus rapide.
