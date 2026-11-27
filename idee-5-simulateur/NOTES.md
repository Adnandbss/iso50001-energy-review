# Module 5 — Simulateur « et si »

Page « Simulateur » (groupe « Anticipation », identifiant `simulateur`, préfixe `sim`). Fichiers : `module.js` (59,5 Ko), `module.css`, `test.js`.

## Ce que fait le module

1. **Relit les équations.** `simLireEquations` lit dans `grillesChargees` la base et les coefficients de chaque série (EQUATION, EQUATION 2), le type de modèle et les saisons (WIKI), avec les mêmes règles de lecture que `calculer`. `simRejouer` recalcule la référence. Preuve faite à chaque chargement : facteurs inchangés, le rejeu doit redonner `ref` sur toutes les dates. Une série qui ne passe pas est retirée du simulateur, et l'écran la nomme. Si aucune ne passe, la page se désactive.
2. **Règle un scénario.** Par facteur : variation en % ou en unités à chaque période, sur toute la période, en hiver ou en été. Quatre réglages d'un clic : −10 %, +10 %, niveau haut habituel, niveau bas habituel (P90 et P10 des valeurs du facteur aux mêmes mois du calendrier). Prix et facteur d'émission par énergie, propres au scénario.
3. **Montre l'effet.** Tuiles par énergie (écart en énergie, coût, CO2e) ; courbe référence / simulation pour la série choisie ; tableau Site et UES ; écart par UES, avec la part non répartie ; écart par facteur ; tableau de sensibilité (toutes les séries × tous les facteurs, pour +1 % ou +1 unité).
4. **Reste honnête.** Avertissements : extrapolation (valeurs simulées d'un facteur hors de la plage observée, avec le nombre de périodes), modèle fragile (R² < 0,75 ou inconnu), Site et somme des UES qui ne s'additionnent pas, consommation simulée négative, réglage sans effet. Le chapeau et la note disent qu'il s'agit d'une simulation par le modèle de référence, pas d'une prévision.
5. **Compare.** Jusqu'à trois scénarios nommés, tableau côte à côte, bouton « Copier » (texte tabulé, prêt pour un tableur).
6. **Phrase → réglages.** Un champ de texte ; un modèle (ou, en démonstration, un script) appelle l'outil `sim_regler_scenario` ; la page valide, affiche ce qu'elle a compris et ce qu'elle laisse de côté ; rien n'est appliqué avant le clic « Appliquer ».

## Méthode

- Équation d'une série à la date j : `(base + Σ coefficient_k × facteur_k,j) × 1000` Wh, avec EQUATION 2 pendant les saisons d'été d'un modèle « saisonnier ». Pas de référence aux dates sans consommation.
- **Tolérance du rejeu : 1e-9 en valeur relative.** Les opérations sont les mêmes que dans `calculer`, dans le même ordre : seul l'arrondi en virgule flottante peut différer, et il est de l'ordre de 1e-16 par opération. Sur le classeur de test, l'écart mesuré est exactement 0 pour les 9 séries.
- Simulation = même équation, facteurs modifiés. Écart = simulation − référence, sur la période des filtres. Le modèle étant linéaire, l'écart se décompose exactement par facteur.
- Coût = consommation simulée × prix du scénario − référence × prix de référence (`valoDe`). Même chose pour les émissions. Les prix du scénario ne touchent pas aux hypothèses communes de la page Détection.
- Sensibilité : +1 % = Σ coefficient × facteur × 1 % sur la période ; +1 unité = coefficient (moyenne sur la période pour un modèle saisonnier).
- Extrapolation : comparaison des valeurs modifiées au minimum et au maximum du facteur sur l'historique (dates entre `debut` et `fin` ; après la dernière consommation, les facteurs du classeur de test valent 0 et sont ignorés).

## Limites

- C'est une simulation rétrospective : « qu'aurait donné le modèle si… », sur l'historique. Aucune date future.
- Le classeur ne contient pas l'incertitude des coefficients : l'écart est donné sans intervalle. Le R² est le seul indice de fiabilité affiché.
- Chaque facteur bouge seul. Dans la réalité, production et météo entraînent d'autres choses.
- Site et UES sont des modèles ajustés séparément : leurs écarts ne s'additionnent pas (sur le classeur de test, un hiver froid pèse plus sur la somme des UES électriques que sur le site). C'est affiché, pas corrigé.
- Historique court : avec un pas hebdomadaire, un mois du calendrier a 8 ou 9 valeurs. En dessous de 8, les mois voisins sont ajoutés.
- Hiver = octobre à mars, été = avril à septembre, pour tous les facteurs. Ces saisons ne sont pas celles du WIKI (propres à chaque modèle saisonnier).
- Les scénarios ne sont pas enregistrés : ils disparaissent au rechargement et ne figurent pas dans une copie figée. Le module n'écrit rien dans `localStorage`.
- Le script de démonstration ne comprend que des tournures simples (une proposition par facteur, « et », pourcentages, hausse ou baisse, hiver froid ou doux, canicule, prix). Un nombre qui fait partie du nom d'un facteur peut être pris pour une variation si la phrase ne contient pas de pourcentage.

## Ce qui quitte le poste (règle 6)

En mode IA seulement, après l'accord général (page Instruction) **et** un accord propre au simulateur, donné sur son avis : la phrase écrite, les noms des facteurs influents avec leur minimum et leur maximum observés, la consigne fixe et la description de l'outil. Rien d'autre. Les noms d'énergies ne partent pas : le modèle rend le mot de la phrase (« gaz »), la page le rapproche de ses énergies. L'accord vaut pour un fournisseur et une session ; il est remis à zéro au changement de classeur.

La requête reprend la forme de celles du coeur (`thinking` adaptatif, outil `strict`, pas de `tool_choice` forcé, que `claude-opus-5-5` refuse) avec `effort: "low"`. Deux tours au plus : si le modèle n'appelle pas l'outil, il est relancé une fois.

## Ce qui est testé (`test.js`, 146 vérifications, 0 échec)

- Rejeu = `ref` sur le classeur réel (écart mesuré : 0), y compris les deux modèles saisonniers ; scénario nul = `ref` date par date ; même preuve dans une copie figée (grilles passées par JSON).
- Classeur synthétique de 3 séries et 2 facteurs, réponses calculées à la main : totaux, effet de +10 % et +20 % (exactement le double), variation en valeur sur l'hiver, modèle saisonnier, date sans donnée, P90 des mêmes mois (302), coût et CO2e avec prix de référence puis prix du scénario, sensibilité, extrapolation haute et basse (nombre de périodes), non-additivité, consommation négative, R² faible, série non rejouable retirée et dite.
- Linéarité et décomposition par facteur sur le classeur réel, pour chaque facteur, en % et en valeur.
- Phrase → réglages : script de démonstration (français, anglais, facteur inexistant, prix), parcours complet à l'écran (saisie, traduction, proposition, confirmation, calcul) ; `fauxModele` (réglage valide gardé, facteur inexistant, pourcentage impossible, énergie inconnue et passage non compris refusés et dits ; modèle muet ; réponse mal formée) ; contenu exact de la requête.
- Mode IA avec un réseau simulé (`fetch` remplacé le temps du test) par les deux chemins existants, Anthropic et Gemini : blocages sans accord, accord par fournisseur, corps réellement envoyé, conversion du schéma pour Gemini, bouton « Arrêter ».
- Réglages d'un clic, champs, trois scénarios au plus, renommer, dupliquer, supprimer, copie du tableau.
- Rendu en français, en anglais (aucun texte fixe français restant parmi ceux contrôlés), en tableau, au pas mensuel ; les autres pages se rendent toujours ; aucun appel réseau.

## Ce qui n'est pas testé

- **L'apparence.** Le banc n'a pas de mise en page : ni la largeur de 390 px, ni le thème sombre, ni les barres signées n'ont été vus dans un navigateur. Le CSS n'utilise que les variables du style d'origine et passe la ligne de réglage sur une colonne sous 700 px, mais c'est à vérifier à l'oeil.
- **Un vrai modèle.** Aucun appel réel à Anthropic ou à Gemini : la qualité de la traduction par une IA n'est pas mesurée.
- L'assemblage avec les cinq autres modules.

## Changements du coeur souhaités

Aucun n'est nécessaire au fonctionnement. Un texte devient inexact dès que ce module est assemblé :

- Dans `accueil()` (et la même phrase dans `PAIRES`), remplacer
  `Seule exception (prototype) : dans l'onglet Dérives, l'instruction d'un épisode par l'IA envoie des valeurs à l'API d'IA que vous choisissez (Google Gemini ou Anthropic), uniquement après votre accord explicite.`
  par
  `Exceptions, uniquement après votre accord explicite et vers l'API d'IA que vous choisissez (Google Gemini ou Anthropic) : l'instruction d'un épisode de dérive envoie des valeurs ; le simulateur envoie la phrase que vous écrivez, avec les noms et les plages des facteurs influents.`
  Anglais : `Exceptions, only after your explicit consent and to the AI API you choose (Google Gemini or Anthropic): investigating a drift episode sends values; the simulator sends the sentence you write, with the names and ranges of the relevant variables.`
  Raison : la page d'accueil promet une seule exception. Les autres modules à IA sont sans doute dans le même cas.

Deux remarques pour l'assemblage : le groupe « Anticipation » est traduit ici par « Looking ahead » (le dernier module chargé l'emporte si un autre le traduit autrement) ; les textes fixes longs passent par `simT(fr, en)`, qui les enregistre avec `ajouterTraductions` à leur premier emploi (il lit `EN.has`), pour ne pas écrire deux fois chaque texte français et tenir dans 60 Ko.

## Texte pour le mode d'emploi

**Simulateur.** Cette page répond à la question « et si ? ». Elle rejoue les modèles de référence du classeur sur l'historique, avec des facteurs influents que vous modifiez : une production en hausse de 10 %, un hiver au niveau haut habituel, un prix du gaz différent. Réglez chaque facteur à la main, ou écrivez le scénario en une phrase : la page affiche les réglages qu'elle a compris, et vous les confirmez avant tout calcul. Vous lisez ensuite l'écart avec la référence en énergie, en euros et en CO2e, pour le site et pour chaque UES, et ce que pèse chaque facteur (effet de 1 % de plus). Gardez jusqu'à trois scénarios pour les comparer et copier le tableau. Ce n'est pas une prévision : la page dit ce que le modèle aurait donné, et vous avertit quand un scénario sort de ce que l'historique a connu, quand un modèle est fragile, ou quand le site et les UES ne s'additionnent pas.

**Simulator.** This page answers the question “what if?”. It replays the workbook's baseline models over the history, with relevant variables that you change: production up 10%, a winter at its usual high level, a different gas price. Set each variable by hand, or write the scenario in one sentence: the page shows the settings it understood, and you confirm them before anything is computed. You then read the gap from the baseline in energy, euros and CO2e, for the site and for each SEU, and what each variable weighs (effect of 1% more). Keep up to three scenarios to compare them and copy the table. This is not a forecast: the page says what the model would have given, and warns you when a scenario goes beyond what the history has seen, when a model is weak, or when the site and the SEUs do not add up.

## À vérifier à l'écran

Fichier assemblé : `idee-5-simulateur/essai.html` (à ouvrir, puis déposer le classeur).

1. À 390 px de large : la ligne d'un facteur (puces, champ, deux listes) passe sur une colonne sans défilement horizontal ; les tableaux défilent dans leur cadre.
2. Thème sombre : puces actives, barres signées (rouge = hausse, bleu = baisse, trait central), encadré « À lire avant de conclure ».
3. Les barres « Écart simulé par UES » : la ligne « Non réparti » est lisible et son signe est le bon.
4. La courbe : la simulation (orange) se détache de la référence (bleu) seulement sur la saison réglée.
5. Phrase d'exemple en démonstration : trois facteurs de production à +10 % et le chauffage au niveau haut en hiver ; « Appliquer » met à jour les tuiles.
6. Avec une vraie clé : l'avis d'envoi s'affiche avant tout envoi, et la proposition du modèle nomme le modèle.
7. Les noms de facteurs très longs dans le tableau de sensibilité (en-têtes sur une ligne, défilement horizontal du tableau).

## Points où j'ai tranché

- Simulation sur l'historique, pas sur des dates futures (la page « Prévision » s'en charge).
- « Niveau haut habituel » remplace la valeur du facteur par le P90 des mêmes mois (il ne la relève pas seulement quand elle est plus basse) : par construction, il reste dans la plage observée.
- Prix et facteur d'émission sont des leviers du scénario, pas une modification des hypothèses communes.
- Appliquer une proposition remplace les réglages du scénario affiché (pas de fusion).
- Seuils : R² 0,75 ; non-additivité signalée au-delà de 10 % d'écart entre Site et somme des UES.
- Le vocabulaire du script de démonstration (chauffage, climatisation, hausse, baisse) est générique ; aucun nom de série ni de facteur du classeur n'est écrit dans le code.

## Vague 2

Page allégée : la réponse calculée en tête, le graphique et les réglages courants ensuite, le reste (méthode, limites, tableaux, réglages rares) sous le composant commun `repli` ; textes d'IA renvoyés aux réglages d'IA. Détail, mesures avant et après et tests : `idee-14-allegement/NOTES.md`.
