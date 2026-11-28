# Module « Design » (idee-15-design, préfixe `dsn`) : thème « Lumière »

Direction choisie : maquette A (`docs/maquettes-design.html`). Le module est chargé juste avant l'assemblage (`outillage/ordre-modules.txt`) ; il ne change aucun calcul.

## Ce que fait le module

1. **Thème « Lumière », sur toutes les pages.** Fond `#f6f8fc`, halo radial bleu-violet discret en haut de la zone de contenu (absent à l'impression), menu latéral blanc translucide (entrée active sur bleu pâle, texte indigo ; titres de groupes en petites capitales grises), feuille et cartes blanches à rayon 14 px avec un filet très clair et une ombre légère, grands chiffres à 28–30 px, graisse 600, interlettrage serré, unité en petit gris, pastilles arrondies (rouge pâle : ce qui coûte ; vert pâle : ce qui économise ou va bien ; bleu pâle : neutre), accent indigo `#3f55e0` (boutons principaux, liens, entrée active, segments choisis, barres), en-têtes de tableaux gris très pâle et lignes séparées par un filet. Polices du système (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter…`), chiffres tabulaires ; **aucune ressource externe** (l'icône d'onglet est un SVG en `data:`).
2. **Marque propre à l'outil** : une jauge (arc, aiguille, pivot) blanche dans un carré indigo arrondi, dans le menu, sur l'accueil et en icône d'onglet (`dsnLogo`). Pas d'anneau ni de ruban dégradé.
3. **Jetons de couleur dans `module.js`** (`DSN_THEME.clair`, `DSN_THEME.sombre`), posés en tête de page dans une feuille `<style id="dsn-theme">` qui suit le style d'origine : à spécificité égale, ils l'emportent. Raison : le banc de test ne voit pas le CSS ; ainsi `test.js` vérifie que chaque jeton existe dans les deux thèmes et **mesure les contrastes** (AA, 4,5:1) des couples texte / fond. `module.css` ne porte que les règles.
4. **Thème sombre** (selon `prefers-color-scheme`) : surfaces bleu nuit (`#0f1526` / `#161d31`), même hiérarchie, halo plus discret, accent `#4f63e6` (texte `#a9b5ff`).
5. **Graphiques** : seules les variables changent (`--s1`…`--s8`, `--plus`, `--moins`, `--contexte`, `--neutre`) ; aucun code de graphique n'est touché. Palette : celle d'origine (déjà validée), dont le bleu devient l'indigo de l'accent et le violet s'éloigne de l'indigo (`#8a4fd8` ; sombre `#9a78e6`). Validée avec le contrôle de palette du guide de visualisation (bande de luminosité, chroma, séparation daltonisme des paires adjacentes ≥ 8, vision normale ≥ 15) en clair (surface blanche) et en sombre (surface `#151c2f`) : tout passe ; comme à l'origine, trois séries claires (aqua, jaune, magenta) sont sous 3:1 sur blanc, d'où les « Voir le tableau » existants. `--plus` orange-rouge / `--moins` vert-bleu : séparation daltonisme 11,1 (deutéranopie) en clair, 10,8 en sombre.
6. **Impression** : fond blanc, ni halo ni ombres ; la barre de question et le choix de dérive ne s'impriment pas ; les noms de dérives et les gains (boutons-liens, que la règle d'impression du cœur masque) restent imprimés.
7. **Tuiles** : le grand chiffre et son unité sont coupés après traduction (`dsnUnite`), le texte reste identique (espace compris).

## Vue d'ensemble (module 10, refaite sur la maquette A)

- **Barre « Posez une question sur ce site »** (`dsnBarre`, ce module). Formulaire `role="search"`, étiquette pour lecteurs d'écran, Entrée pour envoyer ; pendant la réponse : « Le script lit les données… / L'agent lit les données… », tour courant, bouton Arrêter.
  - **Démonstration** : 4 ou 5 questions toutes faites (puces) : bilan sur 12 mois, dérive en cours qui coûte le plus, usages qui expliquent la dérive d'un compteur général (seulement s'il y en a une), facteurs pendant la dérive la plus coûteuse, modèle le moins fiable. Les textes citent des noms du classeur, jamais écrits en dur. Un script (`dsnDemo`) joue le modèle : il appelle les outils de lecture existants et recopie leurs résultats, sans calcul ; la page dit « Réponse du script de démonstration (sans IA) ». Une question libre répond qu'il faut régler une IA, avec un bouton vers le panneau (`iaOuvrir()`) ; rien n'est lancé.
  - **Avec une IA** : la question passe par la boucle du banc d'évaluation, **`evlBoucle` telle quelle**, donc par `evlOUTILS_API` (outils de lecture + `repondre`) et `evlConsigne`. Le module neutralise le temps de la question la progression du banc (`evl.progres`), que `evlBoucle` met à jour.
  - **Contrôle** : chaque nombre de la phrase rendue est cherché, à l'arrondi près, dans les résultats d'outils (`nombresDe`, `controlerChiffres` du cœur ; la valeur structurée par `evlRecopie`). Les chiffres retrouvés sont soulignés en vert, les introuvables surlignés (classe `nb absent` du cœur), avec une pastille « n chiffre(s) sur n retrouvé(s) ». Les outils appelés et leurs paramètres sont dans un `repli`. Les résultats d'outils ne sont pas gardés une fois la réponse contrôlée.
  - **Accord** : une case « Questions posées sur ce site (Vue d'ensemble) » s'ajoute à l'écran d'accord unique du panneau d'IA, cochée par défaut comme les autres, avec un avis exact (la question telle quelle, la consigne et la description des outils, les résultats des outils appelés, jusqu'à 6 envois par question ; ce qui ne part pas). « J'autorise ces envois » la couvre, « Retirer l'autorisation partout » la retire. **Le module 11 n'est pas modifié** : `iaBlocAccord` est enveloppé et la case suit `iaCoches` / `iaAccord.fonctions`. Je n'ai pas ajouté l'entrée à `IA_FONCTIONS`, parce que `idee-11-ia/test.js` vérifie qu'il y en a exactement 5.
- **Titre-réponse** en grand (« Le site consomme 0,7 % de plus que sa référence ») et sous-titre (« Sur 12 mois · +75,3 MWh · +29,9 k€ · 2 surconsommations en cours coûtent 7 202 € par mois si rien ne change »). Dans le document, la réponse vient avant la barre (on la lit en premier, et la règle « la réponse d'abord » du module 14 reste vraie) ; à l'écran, la barre est au-dessus (`order: -1`). L'ordre du focus suit l'ordre visuel (le titre n'est pas focalisable).
- **Trois cartes** : écart à la référence (énergie, pastille euros, % et CO₂e), atterrissage de l'année (page Prévision, réglages par défaut, fourchette à 80 %), modèles fiables (R² ≥ 0,75).
- **« Dérives qui coûtent le plus »** : barres horizontales, coût par mois si l'écart moyen se maintient, **sans double compte** : un usage suivi est montré « dont » sous le compteur général de son énergie (les compteurs généraux seuls s'additionnent, comme dans la page Dérives).
- **« Si on corrige … »** (`dsnCarteCorrige`, ce module) : pour la dérive en cours qui coûte le plus (ou celle choisie dans la liste ou par un clic sur son gain), gain sur 12 mois en euros, CO₂e évité et énergie ; graphique « si rien ne change » (tirets) contre « si la dérive cesse » (trait plein), l'écart en vert, avec légende, infobulle et le tableau période par période dans un repli.
- **Tableau des dérives en cours** : dérive (niveau, énergie, « compris dans le compteur général »), depuis, coût par mois, statut (à traiter / fiche rédigée), **gain si corrigée (12 mois)** avec sa méthode nommée, bouton Instruire / Voir la fiche ; puce « Trier par gain ». Sous 640 px, chaque ligne devient une petite carte.
- Inchangés et toujours fonctionnels : « Que faire ensuite », visite guidée (la bulle vise toujours `.acc-synthese` puis `.acc-suite`), liens vers les dérives, méthode repliée.

## Méthode du gain, et ses limites

- **Prévision** (`dsnGainPrevision`) si la page Prévision permet l'horizon de 12 mois pour la série (`prevHorizons`), si elle voit **la même** dérive en cours (`prevDerive(...).depuis === ep.libDebut`) et si chaque période est prévue : `prevPrevoir(sr, o, n12, true)` (dérive prolongée : son écart moyen en % se maintient) moins `prevPrevoir(sr, o, n12, false)`, même origine, même modèle, mêmes facteurs. Nommé « Prévision sur 12 mois ».
- Sinon, **projection simple** de la page Dérives (`projectionDe`, écart moyen par période) prolongée sur 12 mois, contre un écart nul ; nommée « si l'écart moyen se maintient », avec « Projection simple, pas une prévision » dans la carte.
- Euros et CO₂e : `coutDe`, `co2De`, hypothèses de la page. Les gains d'un usage suivi et de son compteur général ne s'additionnent pas (dit sous le tableau).
- Limite : une dérive qui s'aggrave (les fuites du site fictif) coûtera plus que l'écart moyen constant que supposent les deux méthodes ; le gain est donc plutôt sous-estimé. Le coût par mois (projection ÷ 3) et le gain sur 12 mois (Prévision) ne sont pas le même calcul : 12 × coût mensuel ≠ gain annuel, c'est attendu.

## Mesures avant / après (Chrome sans fenêtre, profil temporaire, hauteur de page en px, 800 px de haut)

Avant = `main` (2bf418e), après = cette branche, mêmes réglages, stockage vidé avant chaque capture. Les hauteurs sont les mêmes en clair et en sombre.

| Jeu | Page | 1 280 px | 500 px |
|---|---|---|---|
| site fictif | Vue d'ensemble | 846 → 1 793 | 1 506 → 2 977 |
| site fictif | Dérives | 1 499 → 1 461 | 2 635 → 2 749 |
| site fictif | Prévision | 1 088 → 1 181 | 1 672 → 1 746 |
| site fictif | Simulateur | 1 185 → 1 218 | 1 975 → 2 041 |
| classeur de test | Vue d'ensemble | 813 → 1 711 | 1 451 → 2 854 |
| classeur de test | Dérives | 1 502 → 1 464 | 2 665 → 2 813 |
| classeur de test | Prévision | 1 069 → 1 162 | 1 586 → 1 661 |
| classeur de test | Simulateur | 1 148 → 1 181 | 1 830 → 1 896 |

La Vue d'ensemble double de hauteur (environ 2,2 écrans à 1 280 px) : elle porte maintenant la barre de question et ses puces, « Si on corrige » et le tableau des dérives avec leur gain, demandés par la maquette. Ailleurs, +3 à +9 % : tuiles en cartes et cellules de tableau un peu plus aérées. Captures finales (PNG à 256 couleurs, 88 à 143 Ko) : `docs/captures/vue-ensemble-clair.png` (avec une réponse du script), `vue-ensemble-sombre.png`, `prevision-clair.png`, `vue-ensemble-telephone.png` (500 px).

Aucun débordement horizontal, aucune erreur de console, aucune requête réseau sur ces 32 captures, ni sur l'accueil, la visite guidée, le panneau d'IA, une réponse affichée et l'impression.

## Ce qui est testé (`test.js`, 142 vérifications, aucun appel réseau)

- Thème : chaque jeton en clair et en sombre ; variables des graphiques redéfinies ; feuille posée avec le bloc sombre ; polices système, ni `url(`, ni `@import`, ni `@font-face` ; contrastes AA de 18 couples texte / fond dans chaque thème ; traits principaux des graphiques à 3:1.
- Marque dans le menu ; unité des tuiles coupée sans changer le texte.
- Gains (classeur et site fictif) : égaux à `prevPrevoir` prolongée − arrêtée sur 12 mois, ou à la projection sur 12 mois ; la Prévision permet l'horizon et voit la même dérive ; euros et CO₂e ; projection 12 mois = 4 × projection 3 mois ; Prévision refusée → projection nommée « si l'écart moyen se maintient ». Page : colonne de gain et méthode pour chaque ligne, carte « Si on corrige » (dérive la plus coûteuse, euros, CO₂e, graphique), tri par gain, choix d'une autre dérive.
- Barre en démonstration, de bout en bout, sur les deux jeux : étiquette et rôle, puces annoncées comme un script, attente visible et arrêtable, chaque chiffre retrouvé et souligné, outils dans le repli ; réponses comparées aux pages (dérive la plus coûteuse, bilan recopié de `lire_serie`, modèle au R² le plus faible). Question libre envoyée au clavier : refus honnête, bouton vers le panneau.
- Faux modèle : la question part telle quelle avec `evlOUTILS_API` ; chiffres retrouvés ; chiffre inventé signalé et marqué ; réponse sans `repondre` ; la progression du banc n'est pas touchée.
- Mode IA : sans clé, rien ne part ; case « Questions » décochée, rien ne part ; avis exact dans le panneau ; case cochée par défaut ; « J'autorise » la couvre ; « Retirer » la retire.
- Toutes les pages en anglais ; aucun texte suspect ; `__reseau` vide.
- `idee-10-accueil/test.js` mis à jour (129 vérifications) : la phrase de synthèse est devenue un titre-réponse et un sous-titre ; le test vérifie les mêmes contenus (pourcentage, écart, coût mensuel des dérives, en français et en anglais) et, en plus, qu'ils sont affichés en tête.

## Ce qui ne l'est pas

- Aucun appel réel à une IA (pas de clé) : la réponse d'un vrai modèle à une question libre n'a été essayée qu'avec un faux modèle. Les questions libres restent bornées par l'outil `repondre` du banc (une valeur, un nom ou une abstention, plus une phrase).
- Vu dans Chrome sans fenêtre seulement (1 280 et 500 px ; Chrome sans fenêtre ne descend pas sous 500 px), pas sur un vrai téléphone, ni dans Safari ou Firefox (`backdrop-filter`, `:has()`, `color-mix()` : récents mais pris en charge par les trois). Pas essayé avec un lecteur d'écran.
- `docs/index.html` (la page publiée sur GitHub Pages) n'est pas régénérée : ce n'est pas un de mes fichiers.

## Ce qui serait plus propre (changements ailleurs, non appliqués)

1. **Boucle questions-réponses générale** (`idee-3-evaluation/module.js`) : `evlBoucle(q, appelerModele, signal)` lit `evl.tours`, `evlConsigne()`, `evlOUTILS` et met à jour `evl.progres` / `evlPeindreProgres()`. Une fonction `evlBoucleGenerale({ question, consigne, outils, tours, surTour }, appelerModele, signal)` dont `evlBoucle` serait un cas particulier éviterait au module Design de mettre `evl.progres` de côté, et permettrait une consigne propre à la barre (réponse en une à trois phrases) et un outil de réponse plus libre (`repondre_libre` : phrase, plus la liste des chiffres cités), toujours contrôlé par `controlerChiffres`.
2. **Accord** (`idee-11-ia/module.js`) : exposer `iaAjouterFonction({ id, page, titre, objet, avis })` qui pousse dans `IA_FONCTIONS`, ajoute à `iaCoches` et pose la propriété `accord` ; et, dans `idee-11-ia/test.js`, remplacer `IA_FONCTIONS.length === 5` par `IA_FONCTIONS.length >= 5`. Le module Design n'aurait plus à envelopper `iaBlocAccord`.
3. **Thème** : à terme, remplacer les variables de `style-original.css` par celles de `DSN_THEME` et retirer la feuille posée par script.

## Mode d'emploi

**Français.** La Vue d'ensemble répond d'abord : une phrase en grand dit où en est le site par rapport à sa référence, puis trois cartes donnent l'écart sur 12 mois, l'atterrissage prévu de l'année et la qualité des modèles. « Dérives qui coûtent le plus » classe les dérives en cours par coût mensuel, sans compter deux fois un usage et son compteur général. « Si on corrige » montre, pour la dérive la plus coûteuse (ou celle que vous choisissez), ce que rapporterait sa correction sur 12 mois, en euros et en CO₂e, d'après la page Prévision ou, quand elle ne prévoit pas si loin, d'après l'écart moyen de l'épisode, et le dit. Le tableau liste les dérives en cours avec ce gain ; « Trier par gain » les range par gain. En haut, la barre « Posez une question sur ce site » : en démonstration, cliquez une question toute faite, un script lit les données avec les outils de la page et répond ; avec une IA réglée et autorisée dans les réglages d'IA, posez votre propre question. Chaque chiffre de la réponse est vérifié dans les résultats d'outils et souligné ; les outils appelés sont sous la réponse.

**English.** The Overview answers first: a large sentence says where the site stands against its baseline, then three cards give the 12-month gap, the forecast landing for the year and model quality. “Drifts that cost the most” ranks ongoing drifts by monthly cost, without counting a use and its main meter twice. “If it is fixed” shows, for the costliest drift (or the one you pick), what fixing it would save over 12 months, in euros and CO₂e, from the Forecast page or, when it does not forecast that far, from the episode's average gap, and says which. The table lists ongoing drifts with that gain; “Sort by gain” orders them by gain. At the top, the “Ask a question about this site” bar: in demo mode, click a ready-made question and a script reads the data with the page's tools and answers; with an AI set up and authorised in the AI settings, ask your own question. Every figure in the answer is checked against the tool results and underlined; the tools called are listed under the answer.

## À vérifier à l'écran

- Le halo reste discret et ne gêne pas la lecture du titre ; il disparaît à l'impression.
- En sombre : l'entrée active du menu, les pastilles et la zone verte du graphique « si on corrige » restent lisibles.
- Visite guidée : l'étape 1 éclaire bien le titre-réponse, la dernière « Que faire ensuite ».
- À 500 px et moins : lignes du tableau en cartes, puces de questions qui passent à la ligne, pas de défilement horizontal.
- Clavier : Tab jusqu'à la barre (anneau indigo), Entrée envoie, les puces se suivent au clavier.
