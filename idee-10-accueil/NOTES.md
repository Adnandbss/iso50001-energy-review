# Module « Accueil » (idee-10-accueil, préfixe `acc`)

## Ce que fait le module

1. **Site fictif.** Sur l'écran d'accueil, au-dessus du choix de fichier, un bouton principal « Essayer avec un site fictif » fabrique dans le navigateur les données d'une usine inventée et les charge avec `charger(grilles, false, nom, null)`. Le choix du classeur Excel devient un bouton secondaire.
2. **Bandeau « Données fictives ».** Tant que ce jeu est chargé, chaque page porte sous son titre un bandeau discret (« Données fictives : site, compteurs et chiffres inventés par la page pour la démonstration ») avec un lien « Visite guidée ». Le jeu est reconnu à une feuille témoin `ACC FICTIF` glissée dans les grilles : le bandeau survit donc à une copie figée.
3. **Visite guidée.** Six étapes, environ une minute, proposées d'elles-mêmes au premier chargement du site fictif (une fois par navigateur), relançables depuis le bandeau et la vue d'ensemble. Bulle ancrée, fond assombri autour de l'élément visé, Suivant / Précédent / Passer, flèches et Échap, Tab qui reste dans la bulle, retour du focus à la sortie. Elle s'efface si la page change sous elle (clic dans le menu, nouveau chargement). À moins de 640 px de large, la bulle se pose en bas de l'écran et le projecteur s'arrête au-dessus d'elle.
4. **Vue d'ensemble.** Nouvelle page (identifiant `ensemble`) en tête du groupe « Suivi » et des onglets, affichée après chaque chargement : phrase de synthèse, quatre indicateurs, les trois dérives en cours qui coûtent le plus (bouton vers leur instruction), « Que faire ensuite ».

## Le site fictif

- 110 semaines à partir du lundi 07/10/2024 (jusqu'au 09/11/2026), au pas hebdomadaire ; générateur à graine fixe (mulberry32, graine 50001) : le même site à chaque chargement.
- Facteurs : degrés-jours de chauffage (base 18 °C, saison et anomalies qui durent), production en tonnes, jours ouvrés (fériés français, fermetures de Noël et de deux semaines en août).
- Deux compteurs généraux (électricité, gaz) et trois UES par énergie. Le compteur général contient aussi des usages non suivis (bureaux, ventilation), donc la somme des UES reste sous le site chaque semaine.
- **Modèles de référence** : calés par `itgModele` du module Intégration (moindres carrés, facteurs choisis pas à pas, semaines aberrantes écartées, erreur type à chaque pas) sur la **première année seulement**, comme une situation énergétique de référence, puis écrits par `itgGrilles`. Je n'ai rien réécrit ni modifié dans ce module ; la feuille `INTEGRATION` qu'il ajoute est retirée (ce n'est pas un fichier intégré). R² obtenus : 0,90 à 0,996.
- **Histoires** (vérifiées par `test.js`) :
  - dérive en cours sur « Air comprimé » : des fuites qui s'aggravent à partir du 31/08/2026 (+1 100 kWh de plus chaque semaine) ; épisode en cours depuis S36 2026, +27,9 %, environ 4,4 k€ par mois si rien ne change. C'est l'UES en dérive la plus coûteuse ;
  - usage non suivi : une chambre froide raccordée au compteur général électricité à partir du 01/06/2026, suivie par aucune UES. Le compteur général dérive (+11 %), et la page Détection montre que 69 % de cet écart ne vient d'aucune UES ;
  - économie après une action : régulation de la chaufferie refaite au 01/12/2025 (−10 %) ; épisodes d'économie sur la chaufferie et sur le compteur général gaz, aucun avant l'action ;
  - semaine aberrante : un relevé faux du four (× 2,6) la semaine du 16/03/2026, z ≈ 40 sur cette semaine, |z| < 6 partout ailleurs ; il n'atteint pas le compteur général gaz.
- Noms génériques dans la langue choisie **au moment du chargement** (« Air comprimé » ou « Compressed air »). Ce sont des données : changer de langue ensuite ne les traduit pas, comme pour un vrai classeur. Les énergies s'appellent « Électricité » / « Gaz » ou « Electricity » / « Gas » ; pour que « Gas » soit valorisé, le module ajoute à `VALO_DEFAUT` une entrée qui reprend les valeurs du gaz (prix, facteur, source) pour le nom anglais. Cela profite aussi à un classeur anglais.

## La vue d'ensemble : d'où vient chaque chiffre

- **Écart à la référence, 12 derniers mois** : somme de (réel − référence) sur les 365 derniers jours de données, compteurs de niveau Site (à défaut, somme des UES), en énergie, euros et CO2e avec `coutDe` et `co2De`. Le test le recalcule avec `totalPeriode` du coeur.
- **Surconsommations en cours** : épisodes en cours de `derives()` ; coût par mois = coût de la projection sur 3 mois de la page Détection ÷ 3, sans double compte (même règle que la Détection : pour une énergie qui a un compteur Site, seul le Site compte). Le test vérifie que la page Détection affiche le même nombre et le même coût sur 3 mois.
- **Atterrissage de l'année** : `prevCalcul` de la page Prévision, appelée compteur général par compteur général avec ses réglages par défaut (horizon 3 mois, dérive non prolongée, année civile), arrondie comme la Prévision (`prevRond`). Les réglages de la page Prévision sont sauvés et remis en place autour de l'appel. Le test vérifie que la page Prévision affiche le même atterrissage. Si la fin d'année dépasse l'horizon permis, ou s'il n'y a pas de compteur Site, la tuile affiche « – » et un lien vers la page Prévision.
- **Modèles fiables** : séries analysables (erreur renseignée) dont le R² atteint 0,75, seuil d'usage courant.
- **Que faire ensuite** : candidats dans cet ordre, les trois premiers affichés : instruire la dérive en cours la plus coûteuse qui n'a pas de fiche (fiche affichée sur la page Instruction, ou rédigée par la Veille) ; chercher l'usage non suivi derrière un compteur général dont au moins 30 % de l'écart en cours n'est expliqué par aucune UES (`decomposerSite`) ; revoir les modèles faibles ; rédiger la revue si `rev.revue` est vide ; brancher une IA en mode démonstration ; ouvrir le banc d'évaluation s'il n'a jamais tourné.
- Hauteur mesurée à 1 280 px de large (fenêtre de 800 px) : 883 px, moins d'un écran et demi.

## Points où j'ai tranché

1. **Page en tête du groupe « Suivi »**, pas un nouveau groupe : moins de bruit dans le menu. Elle est déplacée en tête de `PAGES` et d'`ONGLETS` par le module, sans toucher au coeur.
2. **Page après chargement** : `AU_CHARGEMENT` met `etat.onglet = "ensemble"`, sauf au tout premier chargement si l'adresse demande une page (`#onglet=…`, lien direct ou copie figée rechargée). Sans cette exception, les liens directs comme `#onglet=derives&demo=auto` ne marcheraient plus ; sans la règle « premier chargement », le `#onglet=` que pose chaque navigation garderait la page courante à chaque changement de fichier.
3. **Deux remplacements dans le coeur** (`coeur.py`) : `accAccueil()` inséré avant la phrase « Déposez ici… » (les noeuds d'`ACCUEIL_MODULES` se posent sous le choix de fichier), et le bouton « Choisir le classeur Excel » passe de `btn principal` à `btn`.
4. **La visite ne lance aucune IA.** À l'étape « Ce qu'en dit l'agent », en mode démonstration, elle appelle `choisirEpisode` (le script de démonstration instruit la dérive en 1 à 2 s) ; si une fiche existe déjà pour cette dérive, elle la montre sans la refaire. Si une IA est réglée, elle affiche la dérive sur la page Instruction sans rien lancer, et le dit.
5. **`choisirEpisode` depuis la vue d'ensemble** : il suppose que la page Instruction est prête pour le classeur courant (d'habitude, la page Détection appelle `reinitialiserAgent` avant). Sans précaution, l'épisode choisi était effacé par `pageAgent`. Le module appelle donc `reinitialiserAgent` d'abord si besoin (`accInstruire`).
6. **Visite proposée une fois par navigateur** : clé `revue-energetique.acc.visite` dans `localStorage` (jamais écrite dans une copie figée).

## Ce qui est testé (`test.js`, 115 vérifications, aucun appel réseau)

- Classeur réel : vue d'ensemble affichée après le chargement, en tête du menu, sans bandeau ; ses chiffres contre ceux des pages Détection et Prévision, écart sur 12 mois recalculé, modèles fiables comptés à la main.
- Accueil : le bouton d'essai est au-dessus du choix de fichier ; le choix du classeur est secondaire.
- Site fictif : deux fabrications donnent les mêmes grilles ; deux chargements, les mêmes épisodes ; aucune alerte de cohérence ; les quatre histoires ; les mêmes comparaisons aux pages d'origine.
- Toutes les pages d'`ONGLETS` se rendent sur le site fictif, en français et en anglais, avec le bandeau.
- Visite : six étapes dans l'ordre, boutons de chaque étape, flèches, Précédent, retour sur l'étape agent sans refaire la fiche, Terminer, Échap, effacement quand la page change, changement de langue, bulle en bas à 390 px, aucune IA lancée quand une IA est réglée.
- « Que faire ensuite » change avec l'état (fiches rédigées, revue rédigée) ; « Voir la décomposition » ouvre la Détection sur le compteur général.
- Chargement en anglais : noms anglais, hypothèses de prix pour « Gas », synthèse en anglais.
- Lien direct au premier chargement, vue d'ensemble aux suivants.
- `outillage/tout-tester.sh .` passe en entier : le changement de page par défaut ne casse aucun test des autres modules.

## Ce qui ne l'est pas

- Le banc n'a pas de mise en page : le placement de la bulle et du projecteur a été regardé dans Chrome sans fenêtre (profil temporaire, fichiers locaux), à 1 280 px et à 390 px (dans un cadre, Chrome sans fenêtre ne descend pas sous 500 px), en thème clair et sombre, pas sur un vrai téléphone. Le piège de Tab dans la bulle n'est pas testé par le banc (pas de focus dans son faux DOM).
- Lecteurs d'écran : rôles et attributs posés (`role="dialog"`, `aria-modal`, `aria-labelledby`), non essayés avec un lecteur.

## Changements demandés ailleurs

- `idee-6-integration/module.js` : sur l'accueil, le bouton « Choisir un fichier de données » est un `btn principal`. Pour qu'un seul bouton principal reste sur l'accueil, remplacer dans `itgPeindre` (ou là où ce bouton est construit) `class: "btn principal"` par `class: "btn"` pour ce bouton seulement. Raison : le visiteur sans classeur doit voir un seul point d'entrée évident. Aucun test à changer à ma connaissance.
- `idee-9-assemblage/module.js` : ajouter au mode d'emploi la section ci-dessous (texte français et anglais).

## Mode d'emploi

**Français.** Pas de classeur sous la main ? Sur l'écran d'accueil, cliquez « Essayer avec un site fictif » : la page fabrique une usine inventée, avec deux ans de relevés hebdomadaires, deux compteurs généraux, six usages suivis et leurs modèles de référence, et charge le tableau de bord. Un bandeau rappelle sur chaque page que ces données sont fictives. Une visite guidée d'une minute montre où en est le site, la dérive qui coûte le plus, ce qu'en dit l'agent (en mode démonstration, sans IA), ce que prévoit la page Prévision et comment le banc d'évaluation vérifie l'IA ; relancez-la depuis le bandeau. Après chaque chargement, la page « Vue d'ensemble » répond à « où en est le site et que dois-je faire ? » : une phrase de synthèse, l'écart à la référence sur 12 mois, les dérives en cours et leur coût mensuel, l'atterrissage de l'année, la qualité des modèles, les trois dérives les plus coûteuses et les prochaines actions. Chaque chiffre vient des pages Détection et Prévision.

**English.** No workbook at hand? On the welcome screen, click “Try it with a fictitious site”: the page builds an invented plant, with two years of weekly readings, two main meters, six tracked uses and their baseline models, and loads the dashboard. A banner on every page reminds you that this data is fictitious. A one-minute guided tour shows where the site stands, the costliest drift, what the agent says about it (in demo mode, with no AI), what the Forecast page expects and how the evaluation bench checks the AI; restart it from the banner. After every load, the “Overview” page answers “where does the site stand and what should I do?”: a summary sentence, the gap to the baseline over 12 months, ongoing drifts and their monthly cost, the landing for the year, model quality, the three costliest drifts and the next actions. Every figure comes from the Detection and Forecast pages.

## À vérifier à l'écran

- Accueil : le bouton « Essayer avec un site fictif » se voit d'abord, seul bouton sombre de la carte.
- Visite : à chaque étape, l'élément éclairé est bien celui dont parle la bulle, la bulle ne le recouvre pas, et l'écran défile jusqu'à lui ; l'étape 3 attend 1 à 2 s que la fiche arrive puis l'éclaire.
- À 390 px : bulle en bas, lisible, boutons accessibles au pouce ; vue d'ensemble sans débordement horizontal.
- Thème sombre : le fond assombri reste perceptible autour du projecteur.
- Vue d'ensemble : tient en un écran et demi à 1 280 px ; la tuile « Atterrissage » et la page Prévision donnent le même chiffre.

## Vague 2

Page allégée : la réponse calculée en tête, le graphique et les réglages courants ensuite, le reste (méthode, limites, tableaux, réglages rares) sous le composant commun `repli` ; textes d'IA renvoyés aux réglages d'IA. Détail, mesures avant et après et tests : `idee-14-allegement/NOTES.md`.
