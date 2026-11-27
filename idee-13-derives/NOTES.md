# Module « Dérives » (idee-13-derives, préfixe `drv`) — vague 2, point 5 et seconde moitié du point 8

Fichiers : `module.js`, `module.css`, `coeur.py` (trois remplacements du cœur), `test.js`. Le module Veille (`idee-4-veille`) a été réduit à son moteur (mémoire, comparaison, tri, série, statuts, export) : sa page est remplacée par celle-ci.

## Ce que fait le module

**Une seule entrée de menu « Dérives »**, dans le groupe « Suivi » (après UES), à la place de Détection, Instruction et Veille. Le groupe « Dérives » disparaît (il n'aurait plus contenu qu'une entrée du même nom). Les trois adresses `#onglet=derives`, `#onglet=agent` et `#onglet=veille` restent connues (`ONGLETS`) et rendent la même page, titrée « Dérives » ; l'entrée du menu reste marquée. `aller("agent")`, `aller("veille")`, le « Voir » de l'indicateur d'agent au travail, les boutons « vers » du mode d'emploi mènent donc à la page.

Ordre de la page, au premier affichage :

1. **La réponse** : le constat de la détection, sans filtre (dérives en cours, la plus lourde et son coût par période, « si rien ne change … en 3 mois »), puis une ligne « Veille : » qui dit ce qui est neuf depuis le chargement précédent (`veiConstat`). Les séries non analysées restent signalées en une ligne.
2. Le mode d'IA en une ligne (`iaRappel` du module IA, avec son lien « Réglages d'IA »).
3. **Filtres simples** : En cours / Toutes ; Les deux / Surconsommations / Économies ; Énergie (si plusieurs). Ils réutilisent `etat.derEtat` et `etat.derSens` : la Vue d'ensemble (« Les N dérives en cours ») et le module Continuité continuent de les régler et de les garder.
4. **Instruire en série** : nombre (1, 3, 5, 10) et « Instruire les N premières » — les N premières dérives à traiter et sans fiche **de la liste filtrée**. Pendant la série : « Arrêter la série », progression et journal dans un repli ; ensuite le bilan et « Reprendre les N dérives sans fiche ». C'est `veiLancerSerie` d'origine (verrou, arrêt, deux échecs de suite, juge joué par script en démonstration).
5. **Une seule liste**, triée par la règle de la veille (`veiTrier` : la file à traiter d'abord, puis les dérives validées ou écartées). Dix lignes, puis « Afficher les N autres ». Chaque ligne : série (niveau, énergie, « même dérive que le Site » pour une UES déjà comptée au compteur général, nouveauté depuis le relevé précédent), période, écart en énergie et en %, coût estimé (et « + 3 mois » pour une dérive en cours), statut (À traiter, Instruction en cours, Instruite, Validée, Écartée, « · à revoir »), et un bouton **Instruire** (ou « Voir la fiche », ou « Refermer »).
6. **Le détail s'ouvre sous la ligne** : résumé (enjeu, projection, recoupement Site/UES ; pour un compteur Site, la part de l'écart qu'aucune UES suivie n'explique), les liens vers les autres pages, la décision (À traiter / Validée / Écartée avec motif obligatoire), puis le travail de l'agent : progression et fiche pendant l'instruction, fiche gardée ensuite, journal de l'agent dans un repli ; ou « Lancer l'instruction » si la dérive n'a pas de fiche.
7. **Sous des replis** (fermés) : courbes CUSUM et z de la série suivie (la dérive ouverte, avec un choix de série) ; tableaux de la détection (tuiles, dérives en cours et projection, tableau complet des épisodes, part des UES) ; coût et carbone : hypothèses (champs de prix et de facteurs) ; règle de tri (critère, cinq cases, phrase de la règle) et règle de détection ; veille : nouveautés, cinq tuiles, mémoire, copier et imprimer le point de situation, oublier la mémoire ; **évaluation d'origine** (`lancerEvaluation`, 3, 5 ou 10 épisodes, son tableau et son journal).

**Aucun calcul ne change.** Les cartes de la détection sont celles de `pageDerives()`, appelée sans filtre ni période (puis une seconde fois pour les courbes si la série suivie n'est pas celle du plus gros épisode) ; la page les retrouve par leur identifiant en enveloppant `carte` le temps de l'appel. Le constat de tête reprend les formules de `pageDerives` (le test vérifie la même phrase et le même coût sur 3 mois). La liste et les enjeux sont ceux de `veiLignes` / `veiEnjeu` / `veiTrier`.

### Instruction sur place, compatibilité

- **Instruire** (ligne ou détail) : la dérive s'ouvre, `lancerInstruction` d'origine part (en mode IA non prêt, elle s'arrête et le message s'affiche dans le détail). La page ne change pas ; l'adresse passe à `#onglet=agent` (même page) pour que l'indicateur d'agent au travail reconnaisse la page et ne notifie pas une fin qu'on a sous les yeux. Une série met de même `#onglet=veille`.
- **`choisirEpisode`** (Vue d'ensemble, visite guidée, tableaux de la détection, `#onglet=derives&demo=auto`) garde son contrat : il sélectionne la dérive, va sur la page si besoin (`aller("agent")`), l'ouvre sous sa ligne et lance l'instruction en démonstration ou quand l'envoi est prêt. L'original reste dans le cœur sous le nom `choisirEpisodeOrigine`.
- **`peindreAgent`** redessine la partie vivante de la page (liste, détail, série, évaluation) ; tous ses appelants (instruction, évaluation, panneau d'IA, banc d'évaluation) continuent de marcher. `veiPeindre` fait de même.
- **Fiches gardées** : chaque fiche rendue par `montrerFiche` lors d'une instruction est rangée avec celles de la veille (`vei.resultats`). Une dérive reste ainsi « Instruite » quand on en instruit une autre, la série ne la refait pas, le point de situation la compte, et la Vue d'ensemble affiche « fiche rédigée ». Comme avant, les fiches vivent en mémoire vive et sont retirées au changement de classeur ou de langue (la page le dit).
- **Un seul journal** : il s'affiche là où l'agent travaille — détail de la dérive instruite, zone de la série ou repli de l'évaluation.
- Arrivée par `#onglet=agent` (ou un lien « page Instruction » d'ailleurs) : la dérive en cours d'instruction s'ouvre, sinon la première de la liste, prête à « Lancer l'instruction » ; si la dernière exécution était une évaluation, son repli s'ouvre. Une série demandée ailleurs (`etat.derSerie`, par exemple « Voir la décomposition » de la Vue d'ensemble) ouvre la dérive la plus importante de cette série.

### Relier les pages (point 8b)

Dans le détail de chaque dérive, quatre liens d'un clic, réglés en écrivant l'état public de chaque module, **sans modifier leurs fichiers** :

- **Voir sa prévision** : `prevEtat.serie` = la série, `prevEtat.derive` = vrai si la dérive est en cours (la Prévision la prolonge), faux sinon ; page Prévision.
- **La simuler** : `sim.serie` = la série, période commune (`etat.de`, `etat.a`) = celle de la dérive ; page Simulateur.
- **L'ajouter à la revue** : période commune = l'année civile (ou les années) qui couvre la dérive, comme le filtre « Période » ; page Revue. Le dossier de faits de cette période contient l'épisode. Si un brouillon de revue existe déjà pour une autre période, la page Revue le garde tel quel (comportement de son module).
- **Voir ses graphiques** : ouvre le repli des courbes CUSUM et z sur cette série.

Chemin inverse : les boutons de la Vue d'ensemble (« Instruire », « Voir la fiche ») et « Voir la décomposition » mènent à la dérive ouverte dans la page Dérives (testé). Je n'ai pas rendu cliquable le nom de la dérive dans la Vue d'ensemble : c'est le fichier du module Accueil (voir plus bas).

Note : changer la période commune règle aussi les pages Site, UES et Simulateur, comme le faisait déjà le filtre partagé.

## Mesures (avant / après)

Chrome sans fenêtre, 1 280 × 800, en français, profil temporaire, premier affichage de la page juste après le chargement. Mots : `innerText` de la zone de contenu ; contrôles : boutons, champs, listes, `summary` visibles (hors replis fermés) ; hauteur : hauteur de la page ÷ 800.

| | Classeur de test | Site fictif |
|---|---|---|
| Détection avant | 2 022 mots, 120 contrôles, 4,3 écrans | 1 329 mots, 56 contrôles, 4,1 écrans |
| Veille avant | 1 917 mots, 63 contrôles, 2,9 écrans | 1 208 mots, 34 contrôles, 3,0 écrans |
| Instruction avant | 495 mots, 7 contrôles, 1,0 écran | 280 mots, 8 contrôles, 1,0 écran |
| Détection + Veille avant | 3 939 mots, 183 contrôles | 2 537 mots, 90 contrôles |
| **Dérives après** | **463 mots, 36 contrôles, 2,1 écrans** | **433 mots, 37 contrôles, 2,1 écrans** |
| Dérives, une fiche ouverte | – | 904 mots, 46 contrôles, 3,2 écrans |

Objectif (moins de la moitié de Détection + Veille) : atteint sur les deux jeux (12 % des mots et 20 % des contrôles sur le classeur ; 17 % et 41 % sur le site fictif). À 390 px : aucun débordement horizontal (vérifié dans Chrome, émulation mobile, fiche ouverte).

## Points où j'ai tranché

1. **Entrée dans le groupe « Suivi »** plutôt qu'un groupe « Dérives » d'une seule entrée du même nom.
2. **Statut affiché ≠ statut décidé.** Les statuts gardés restent ceux de la veille (à traiter, validé, écarté avec motif) ; « Instruite » est calculé (une fiche existe et aucune décision n'est posée). Libellés au féminin (« une dérive »).
3. **Le statut se change dans le détail**, pas sur chaque ligne : une seule commande par ligne (le bouton), ce qui divise par deux les contrôles de la liste.
4. **Dix lignes** au premier affichage, filtre « Toutes » par défaut : l'ordre de la veille met déjà en tête ce qui compte. Conséquence visible sur le site fictif : la dérive « Air comprimé » est classée après les autres parce qu'elle recoupe la dérive du compteur général (règle « une seule fois la même dérive »), et la ligne le dit (« même dérive que le Site »). La case de la règle de tri permet de l'enlever.
5. **`choisirEpisode` relance l'instruction** même si une fiche existe, comme l'original (le test du module IA en dépend). Dans la page, « Voir la fiche » ouvre la fiche gardée sans la refaire.
6. **L'ancien filtre « Clos »** de la Détection (gardé par le module Continuité) est ramené à « Toutes » sur cette page.
7. **Courbes dans un repli** : dessinées à la bonne largeur à l'ouverture (la page se redessine une fois, puis rend le focus au titre du repli).
8. **Impression du point de situation** : garde la liste, le détail ouvert et sa fiche, sans les commandes. L'ancienne feuille d'impression de la veille (constat, tuiles, épisodes instruits seuls) n'a plus d'objet ; le texte copié, lui, est inchangé (`veiTexte`).

## Remplacements du cœur (`coeur.py`)

1. `function choisirEpisode(ep) {` → renvoie à `drvChoisir(ep)` ; l'original devient `choisirEpisodeOrigine`.
2. `function peindreAgent() {` → première ligne : `return drvPeindre()`.
3. `function montrerFiche(…) {` → première ligne : `drvFicheRendue(…)` (range la fiche avec celles de la veille ; ignoré quand la veille recompose une fiche gardée).

## Module Veille modifié (`idee-4-veille`)

- `module.js` : la page et ses cartes sont retirées (`veiPage`, file, point de situation, mémoire, `ajouterPage`) ; restent la mémoire, la comparaison, le tri, le total sans double compte, la série, le juge de démonstration, les statuts, les textes et l'export. `veiPeindre` redessine la page Dérives ; `veiSuivreLangue` retire les fiches de l'autre langue ; `veiNoeudFiche` signale sa recomposition. Textes « page Instruction » mis à jour (réglages d'IA, comme demandé dans les notes du module IA) ; « hypothèses de la page Détection » → « de la page Dérives ».
- `module.css` : seules les classes encore utilisées.
- `test.js` : même couverture, adaptée à la nouvelle page (l'adresse « veille » mène à la page Dérives ; fiche ouverte sous sa ligne ; statuts posés dans le détail ; budget de la série sur le bouton). Il compte 175 vérifications au lieu de 237 : la table de traductions du module a perdu les textes de l'ancienne page (une vérification par texte).

## Ce qui est testé

`idee-13-derives/test.js` (95 vérifications, aucun appel réseau) :
- menu (une entrée, groupe Suivi, plus de groupe « Dérives ») ; les trois adresses par `aller()` et au premier chargement (`#onglet=veille`, `#onglet=agent`) ; titre et entrée marquée ;
- constat identique à celui de `pageDerives` sans filtre (phrase et coût sur 3 mois), ligne de la veille ;
- la liste contient exactement les épisodes de `derives()`, avec les enjeux de `veiEnjeu`, dans l'ordre de la veille ; dix lignes puis « Afficher les autres » ; contenu de chaque ligne ; filtres En cours, Économies, Énergie ;
- graphiques, tableaux, hypothèses (champs de prix) et règle présents, replis fermés ;
- « Instruire » en démonstration : pas de changement de page, fiche sous la ligne, statut « Instruite », fiche gardée, journal dans un repli ; une seconde instruction garde la première ; « Voir la fiche » la rouvre sans la refaire ; « Refermer » ;
- série : lancée sur les N premières de la liste, arrêtée après la première fiche, bilan, reprise ;
- statuts « Validée » et « Écartée » (motif obligatoire) posés dans le détail, retrouvés après un nouveau chargement, en fin de liste ;
- boutons d'ailleurs : Vue d'ensemble → dérive ouverte et instruite sur place ; « Instruire » des tableaux d'origine ; série demandée ailleurs (décomposition Site/UES) ; `#onglet=derives&demo=auto` ;
- les quatre liens : Prévision (série, dérive prolongée ou non), Simulateur (série et période, série affichée), Revue (année civile qui couvre la dérive), courbes ;
- évaluation d'origine depuis son repli ;
- mode IA non prêt : message dans le détail, série bloquée, rien n'est envoyé ;
- anglais : textes attendus, aucun texte français restant hors données, journal et fiche ; fiches de l'autre langue retirées ; traductions des textes fixes ;
- site fictif : toutes les dérives, bandeau, signalement « même dérive que le Site », toutes les pages se rendent.

`outillage/tout-tester.sh .` passe en entier (voir le rapport final). Les tests des modules Accueil (visite guidée, Vue d'ensemble, lien direct), IA (page `agent`, indicateur, « Voir ») et Continuité (lexique sur la page `derives`) passent sans modification.

## Ce qui n'est pas testé

- Pas de mise en page dans le banc. Regardé dans Chrome sans fenêtre (profil temporaire dans le clone, effacé) : page à 1 280 px en clair et en sombre, en français et en anglais, fiche ouverte, replis ouverts ; à 390 px en sombre avec une fiche ouverte. Pas sur un vrai téléphone ni dans Safari.
- Le redessin des courbes à l'ouverture du repli et le défilement vers une dérive ouverte depuis une autre page (pas d'événement `toggle` ni de défilement dans le banc).
- La visite guidée n'a pas été rejouée dans un navigateur après ce changement (son test passe).
- Un vrai modèle d'IA (aucune clé).

## Changements demandés ailleurs

Appliqués aux finitions (branche `finitions-textes`) :

1. **Visite guidée**, étape 2 : texte « Sa ligne s'ouvre plus bas ; la courbe des écarts cumulés (CUSUM), sous « Courbes », monte… » ; la ligne de la dérive suivie s'ouvre vraiment (`accOuvrirDerive`). Titre devenu « L'usage dont la dérive coûte le plus » : la visite suit l'UES la plus coûteuse par mois, alors que le constat nomme la plus lourde des dérives comptées une fois (le compteur général) ; la bulle le dit.
2. **Vue d'ensemble** : « Parcourir les dérives » / « Ouvrir les dérives », « des pages Dérives et Prévision », méthode « hypothèses de la page Dérives » ; « Régler l'IA » ouvre le panneau (`iaOuvrir`) ; le nom de chaque dérive de « Les dérives en cours qui coûtent le plus » ouvre son détail sur la page Dérives, sans lancer d'instruction.
3. **Module IA** : l'activité (instruction, évaluation, série) est rattachée à la page `derives` ; la comparaison passe par `DRV_PAGES`, « Voir » ouvre l'adresse `agent` (la dérive instruite ou l'évaluation, dépliée). Titre de la case : « Instruction d'une dérive, séries et évaluation de l'agent (page Dérives) ». `drvAlias` est gardé : l'adresse suit encore ce qu'on fait sur la page, sans que l'indicateur en dépende.
4. **Mode d'emploi** : une section « Page Dérives », juste après la page UES, remplace Détection, Instruction et Veille (texte ci-dessous, plus les repères encore justes des anciennes captures, sans les captures).
5. **Assembleur** (`CONFID_APRES`) : inchangé sur ce point ; l'avis d'envoi dit « une série lancée depuis la page Dérives » (`idee-9-assemblage/coeur.py`).

## Mode d'emploi

**Français.** La page Dérives répond d'abord : combien de dérives sont en cours, la plus lourde et ce qu'elle coûte si rien ne change, puis ce que la veille a vu de neuf depuis le chargement précédent. Dessous, une seule liste de toutes les dérives, classées par enjeu sans compter deux fois la même dérive au compteur général et dans une UES : les nouvelles et celles en cours d'abord, puis par coût estimé. Filtrez par état, par sens ou par énergie. « Instruire » fait enquêter l'agent sur une dérive : sa fiche s'ouvre sous la ligne, avec ses causes probables, ses preuves chiffrées et les vérifications à faire ; « Instruire les N premières » le fait pour les premières de la liste, l'une après l'autre, et s'arrête quand vous le demandez. Dans le détail d'une dérive, donnez votre décision (à traiter, validée, écartée avec un motif), que ce navigateur retient, et ouvrez d'un clic sa prévision, sa simulation ou la revue de l'année qui la couvre. Les courbes (écarts cumulés, z), les tableaux de la détection, les hypothèses de prix, les règles de tri et de détection, la mémoire de la veille et l'évaluation de l'agent sont plus bas, sous des titres à déplier. En mode démonstration, les fiches viennent d'un script, sans IA.

**English.** The Drifts page answers first: how many drifts are ongoing, the largest one and what it costs if nothing changes, then what the watch has seen that is new since the previous load. Below, one list of all drifts, ranked by stake without counting the same drift twice on the main meter and on a significant energy use: new and ongoing ones first, then by estimated cost. Filter by state, direction or energy. “Investigate” has the agent look into one drift: its note opens under the line, with the probable causes, the figures that support them and the checks to make; “Investigate the first N” does it for the first ones in the list, one after the other, and stops when you ask. In a drift's details, record your decision (to handle, validated, dismissed with a reason), which this browser keeps, and open its forecast, its simulation or the review of the year that covers it in one click. The charts (cumulative gaps, z), the detection tables, the price assumptions, the ranking and detection rules, the watch memory and the agent evaluation are further down, under headings that expand. In demo mode, the notes come from a script, with no AI.

## À vérifier à l'écran

1. Menu : une seule entrée « Dérives » sous « Suivi » ; `#onglet=agent` et `#onglet=veille` ouvrent la page et l'entrée est marquée.
2. Premier affichage : constat, ligne « Veille : », mode d'IA, filtres, série, dix lignes, replis fermés ; moins de deux écrans et demi à 1 280 px.
3. « Instruire » sur une ligne : la page ne bouge pas, la progression puis la fiche apparaissent sous la ligne ; survol d'un nombre souligné de la fiche : infobulle et ligne du journal (repli ouvert).
4. Ouvrir le repli des courbes : les courbes occupent toute la largeur, le focus reste sur le titre du repli.
5. « Voir sa prévision », « La simuler », « L'ajouter à la revue » : la page cible est déjà réglée (série, dérive prolongée, période).
6. Vue d'ensemble → « Instruire » : la page Dérives défile jusqu'à la dérive ouverte.
7. Visite guidée, étapes 2 et 3 : le constat est éclairé, puis la fiche sous sa ligne.
8. À 390 px, en sombre : lignes sur deux colonnes, détail et fiche lisibles, aucun débordement.
9. « Imprimer le point de situation » : ni filtres, ni boutons, ni liens dans l'aperçu.
