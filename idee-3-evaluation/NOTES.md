# Module « Évaluation » (préfixe `evl`)

Page « Évaluation », groupe « Agents », identifiant `evaluation`. Fichiers : `module.js` (59,9 Ko), `module.css`, `test.js`.

## Ce que fait le module

Un banc de questions-réponses dont la bonne réponse est connue, pour mesurer si l'agent répond juste et s'il sait dire qu'il ne peut pas répondre. L'évaluation existante (`lancerEvaluation`) reste telle quelle : elle mesure le format et les chiffres d'une fiche ; ce banc mesure l'exactitude d'une réponse.

1. **Jeu de questions** (`evlJeu`). 17 questions sur le classeur de test, tirées avec un générateur à graine (mulberry32, graine 1 par défaut, réglable). Six familles, de difficulté croissante :
   - lecture simple (3) : écart en kWh, écart en %, consommation réelle d'une série sur une plage ;
   - comparaison (3) : UES qui porte la plus grande part de l'écart du site, part d'une UES donnée, écart du site non expliqué par les UES ;
   - épisodes de dérive (3) : nombre d'épisodes d'une série, écart du plus gros épisode, série qui en compte le plus ;
   - facteurs influents (2) : moyenne d'un facteur sur une plage, position par rapport à sa plage habituelle ;
   - plusieurs étapes (2) : trouver le plus gros épisode d'une série, puis lire autre chose sur ses dates (trois appels d'outils) ;
   - pièges (4) : plage sans données (après la fin du classeur), série qui n'existe pas (nom fabriqué avec des mots de deux séries), cause réelle d'un épisode, puissance souscrite d'un contrat. La bonne réponse est l'abstention.
   Chaque question porte son plan d'appels d'outils et le champ où lire la réponse. La page déroule ce plan avec les vraies fonctions d'outils (`outilLireSerie`…) : c'est la réponse attendue, affichée avec son calcul (« Voir les 17 questions »). Une question ambiguë n'est pas posée : égalité en tête, UES en tête de moins de 5 %, valeur nulle. Aucun nom de série n'est écrit en dur.
2. **Agent questions-réponses** (`evlBoucle`). Même boucle que `boucleAgent`, non modifié : les cinq outils de lecture de `OUTILS` (sans `rediger_fiche`), plus un outil `repondre` (type nombre avec unité, nom, ou abstention, et une phrase), validé par la page. Six tours au plus, une relance si le modèle n'appelle pas d'outil, un rappel à l'avant-dernier tour. La consigne interdit de calculer : la valeur rendue se recopie d'un résultat d'outil (règle 7).
3. **Notation** (`evlNoter`) : juste, faux, abstention justifiée, abstention à tort, invention, sans réponse. Par question : appels d'outils de lecture, tours, jetons d'entrée et de sortie (champ `usage`), durée, et si la valeur rendue figure dans un résultat d'outil.
4. **Tableau de bord** : réussite globale et par famille, taux d'invention, abstentions à tort, coût estimé et durée par question, liste des échecs (question, réponse attendue, réponse donnée, raison, outils appelés), toutes les questions. Jusqu'à six passes en mémoire, comparées côte à côte, puis question par question. Export par le presse-papiers : texte tabulé (14 colonnes) ou JSON.
5. **Conduite** : arrêt à tout moment, plafond de 6, 12 ou toutes les questions (les premières de chaque famille, à tour de rôle), reprise des seules questions sans note. Les nouvelles tentatives sur HTTP 429 ou 5xx sont celles de `appelAnthropic` et `appelGemini`. Après deux erreurs d'API de suite, la passe s'arrête au lieu d'épuiser le jeu ; le bouton « Relancer » la reprend.
6. **Mode démonstration** (`evlDemo`). Un script joue l'agent avec la même forme de réponse que l'API. Il suit le plan d'appels de la question et lit sa réponse dans les résultats d'outils qu'il reçoit. Il se trompe exprès sur trois questions marquées « erreur voulue » (mauvais champ, abstention à tort, 0 kWh sur une plage vide), pour que les cinq notes se voient. La page dit en quatre endroits que ces notes sont celles d'un script et ne disent rien d'une IA.
7. **Ce qui quitte le poste.** Le banc envoie des questions, que `avisEnvoi()` ne liste pas : il a son propre avis (`evlAvis`) et son propre accord (`evl.accord`), en plus de l'accord et de la clé de la page Instruction, que `appelAnthropic` et `appelGemini` exigent. Les réponses attendues, les notes et les tarifs ne partent jamais.

## Méthode et limites

- **Tolérance.** Une valeur est juste à 0,5 % près de la valeur attendue (marge d'au moins 0,01), avec le bon signe et l'unité de la question. Un comptage doit être exact. Un nom doit être le nom exact, à la casse et aux accents près : « EC Principale » ne vaut pas « Chaufferie EC Principale Process ». La position d'un facteur se reconnaît à son mot clé (dessus, dessous, dans, ou leurs équivalents anglais).
- **Réussite** = réponses justes et abstentions justifiées, sur les questions notées. **Invention** = toute réponse donnée à un piège. Une erreur d'API n'est pas notée.
- **Coût** = jetons × tarifs saisis par la personne, par million de jetons. Aucun tarif n'est écrit dans le code. Le coût ne tient compte ni des remises, ni du cache, ni d'un palier gratuit. Un tarif saisi vaut pour la passe affichée si elle vient de l'agent courant, et pour les suivantes.
- **Petit échantillon.** 17 questions sur 18 mois d'historique : quelques points d'écart entre deux passes ne prouvent rien. La page le dit.
- **Le banc mesure la lecture exacte et le refus d'inventer**, pas la qualité d'une analyse des causes.
- **« Chiffres recopiés »** est un contrôle de présence, comme `controlerChiffres` : un petit entier se retrouve facilement dans un résultat d'outil.
- **Le script de démonstration suit le plan qui a servi à calculer la réponse attendue** : ses bonnes réponses sont justes par construction. Il vérifie la chaîne (outils, format, notation), pas un modèle.
- Les questions partent dans la langue de l'interface ; la consigne et les descriptions d'outils restent en français, comme dans l'existant.

## Ce qui est testé (`test.js`, 215 vérifications, 0 échec, 0 appel réseau)

- **Second chemin.** Chaque réponse attendue est recalculée à partir des tableaux bruts du modèle (dates, conso, ref, err, facteurs), sans `seaux`, `agreger`, `analyserSerie`, `derives` ni fonction d'outil : 102 réponses sur 6 graines. La détection des épisodes y est réécrite ; elle part de la même lecture de la règle que le cœur, ce n'est donc pas une preuve indépendante de la règle elle-même.
- **Reproductibilité** : même graine, même jeu ; autre graine, autre jeu ; même jeu après rechargement du classeur.
- **Notation** sur des cas connus : tolérance, signe, unité, comptage, nom approchant, position, abstentions, invention, et la présence d'une valeur dans les résultats d'outils.
- **Agent avec `fauxModele`** : réponse juste, arrondie, fausse, abstention à tort, abstention justifiée, invention (0 kWh sur une plage vide ; valeur pour une série inconnue), nom, plusieurs étapes ; réponse mal formée, outil inconnu, `repondre` appelé avec un autre outil, texte sans appel d'outil, plafond de tours, refus du modèle, arrêt ; jetons additionnés sur les tours ; la requête ne contient ni `rediger_fiche` ni la réponse attendue.
- **Démonstration de bout en bout** par clic sur le bouton : 17 questions, 14 réussies, les trois erreurs voulues notées faux, abstention à tort et invention ; arrêt en cours de passe puis reprise ; plafond à 6.
- **Mode IA simulé** (`redacteurCourant` remplacé par un faux, aucun réseau) : rien n'est appelé sans les réglages de la page Instruction, ni sans l'accord propre au banc ; arrêt après deux erreurs d'API, reprise, jetons, coût avec des tarifs saisis après coup, comparaison de passes.
- **Export** tabulé et JSON, **rendu en français et en anglais** (aucun texte resté en français dans la page anglaise, hors données du classeur), toutes les pages du cœur se rendent encore. Le test passe aussi sur l'assemblage des six modules dans leur état du 25/11 à 18 h 55.

## Ce qui n'est pas testé

- **Aucun appel à un vrai modèle** (ni Claude, ni Gemini) : pas de clé, par règle. Le comportement d'une IA sur ces questions, la conversion du schéma de `repondre` par l'adaptateur Gemini et les jetons réels restent à vérifier avec une clé.
- **L'apparence** : le banc de test n'a pas de mise en page. Largeur de 390 px, thème sombre, défilement des tableaux, infobulle « erreur voulue », copie dans le presse-papiers réel : à voir à l'écran.
- Un classeur très différent (un seul compteur, pas d'UES, pas de facteur) : le générateur saute les familles impossibles, mais ce n'est vérifié que par lecture du code.

## Changements du cœur souhaités

Aucun n'est nécessaire. Trois remarques, sans urgence :

- `ajouterPage` reçoit `cheminIcone` mais ne le range pas dans `ICONES` : le module le fait lui-même (`ICONES.evaluation = …`).
- `patienter()` écrit ses attentes dans le journal de la page Instruction. D'après la lecture du code (non exécuté, faute de réseau), une attente sur HTTP 429 pendant une passe du banc y laisse donc une ligne. Un paramètre « où noter » réglerait cela.
- Les erreurs de `reponseGemini` finissent par « Aucune fiche n'a été rédigée » : le banc les affiche telles quelles, comme erreurs d'API.

Le module pose `agent.enCours` et `agent.arret` pendant une passe (et les rend à la fin), pour que la page Instruction n'envoie rien en même temps et que la langue ne change pas en cours de passe. Il n'écrit rien dans `localStorage`.

## Texte pour le mode d'emploi

**Français.** La page Évaluation pose à l'agent des questions dont la page connaît la bonne réponse, parce qu'elle la calcule elle-même à partir du classeur. Choisissez le nombre de questions, puis lancez une passe : chaque question est notée juste, fausse, abstention justifiée, abstention à tort ou invention. Les pièges sont des questions sans réponse dans les données ; l'agent doit le dire au lieu d'inventer. Le relevé donne le taux de réussite, le taux d'invention, la durée et, si vous saisissez les tarifs de votre modèle, le coût estimé par question. La liste des échecs montre pour chacun la question, la réponse attendue, la réponse donnée et les outils appelés. Changez d'agent sur la page Instruction, relancez une passe : les deux se comparent côte à côte. En mode démonstration, un script joue l'agent et se trompe exprès sur trois questions : ses notes montrent le banc en marche, elles ne disent rien d'une IA.

**English.** The Evaluation page asks the agent questions whose correct answer the page knows, because it computes it itself from the workbook. Choose the number of questions, then start a run: each question is graded correct, wrong, justified abstention, wrong abstention or fabrication. The traps are questions with no answer in the data; the agent must say so instead of making one up. The summary gives the success rate, the fabrication rate, the time and, if you enter your model's prices, the estimated cost per question. The failure list shows, for each one, the question, the expected answer, the answer given and the tools called. Change the agent on the Investigation page and start another run: the two are compared side by side. In demo mode a script plays the agent and errs on purpose on three questions: its grades show the bench working and say nothing about an AI.

## À vérifier à l'écran

1. Menu : groupe « Agents », entrée « Évaluation », icône visible ; en anglais « Evaluation ».
2. Mode démonstration, « Lancer une passe de 17 questions » : la barre de progression avance, le bouton devient « Arrêter », puis le relevé affiche 82,4 % de réussite, 25 % d'invention, 3 échecs. L'avertissement « script » se lit sans chercher.
3. Les trois fiches d'échec : bordure rouge, réponse attendue, réponse donnée avec sa phrase en gris, ligne « Pourquoi », outils appelés.
4. « Voir les 17 questions » : le tableau se déplie, les questions passent à la ligne, la colonne de calcul reste lisible. Il reste ouvert pendant une passe.
5. Deux passes (par exemple 17 puis 6 questions) : le sélecteur « Passe affichée » et la carte « Comparaison des passes » apparaissent.
6. À 390 px de large : aucun défilement horizontal de la page ; seuls les tableaux défilent dans leur cadre. Thème sombre : étiquettes de note et piste de réussite lisibles.
7. Avec une vraie clé (page Instruction, puis retour) : l'avis propre au banc s'affiche, le bouton reste gris jusqu'au clic d'accord ; les jetons et le coût se remplissent après saisie des deux tarifs ; l'infobulle d'une étiquette « Erreur d'API » donne le message.
8. Boutons « Copier » de la carte d'export : coller le texte tabulé dans un tableur (14 colonnes), le JSON dans un éditeur.

## Points tranchés

- **Les textes fixes passent par `evlT(fr, en)`**, qui dépose la traduction avec `ajouterTraductions` au premier emploi. Le français n'est écrit qu'une fois ; sans cela le module dépassait 60 Ko. Si un autre module dépose avant lui une autre traduction du même texte français, la première gagne.
- **Deux accords** en mode IA : celui de la page Instruction (résultats d'outils) et celui du banc (questions, une conversation par question). Plus lourd, mais rien ne part sur un accord donné pour autre chose.
- **Une abstention est attendue sur la plage sans données**, alors que l'outil renvoie un total de 0 kWh sur 0 période : répondre « 0 » est noté invention. C'est le piège le plus instructif, et le plus discutable ; la consigne le prévoit (« aucune donnée sur la plage demandée »).
- **Aucune persistance** : graine, plafond, tarifs et passes vivent en mémoire. Les passes contiennent des données du classeur ; les tarifs se ressaisissent.
- **Monnaie** : la personne choisit $ ou € pour l'affichage ; la page ne convertit rien.
- **Clés du JSON** : le bilan et les lignes sont exportés tels que la page les garde (`jIn`, `jOut` = jetons d'entrée et de sortie ; notes `juste`, `faux`, `abst_ok`, `abst_tort`, `invention`, `sans`).
