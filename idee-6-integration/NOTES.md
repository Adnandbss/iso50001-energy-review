# Module 6 — Intégration d'un fichier de données quelconque (préfixe `itg`)

## Ce que fait le module

Il ajoute le chemin d'entrée qui manquait : partir d'un fichier brut (export de compteurs, tableau de suivi) et arriver à un tableau de bord qui marche, sans le classeur préparé par la macro.

Parcours, sur l'écran d'accueil (`ACCUEIL_MODULES`) puis sur une page « Intégration » (groupe « Données ») une fois des données chargées :

1. **Lire.** CSV ou texte délimité (point-virgule, virgule, tabulation ; UTF-8 ou Windows-1252 ; guillemets, retours à la ligne dans un champ) et classeur Excel quelconque (toutes les feuilles, par `lireZip` et `lireGrille` ; une cellule au format de date devient une date). Tableau large (une colonne par compteur) ou long (une ligne par relevé, remis en colonnes ; l'unité et l'énergie sont reprises des colonnes voisines).
2. **Profiler.** Ligne d'en-tête retrouvée sous des lignes parasites ; pour chaque colonne : type deviné, part renseignée, étendue, unité lue dans l'intitulé, valeurs aberrantes, séparateur décimal ambigu ; pour le tableau : pas de temps, dates en double, périodes absentes, lignes sans date, historique de moins d'un an. Ce qui bloque (pas d'en-tête, pas de date, moins de 8 dates, aucun nombre, relevés plus fins que le jour) est séparé de ce qui avertit.
3. **Proposer le rôle de chaque colonne** : date, consommation (énergie, unité, niveau Site ou UES, nom affiché), facteur influent, ignorer. Deux moteurs : les règles du module (toujours disponibles ; c'est le mode démonstration, annoncé comme tel) et l'IA choisie sur la page Instruction, par un outil structuré `proposer_correspondance`. La page contrôle la réponse de l'IA et la personne corrige tout dans un tableau.
4. **Caler les modèles de référence** : une régression par consommation, avec le choix des facteurs expliqué, R², R² ajusté, R² validé, erreur type, facteurs écartés et pourquoi, limites.
5. **Charger** : le module écrit les grilles CONSO, FACTEURS INF, EQUATION, EQUATION 2 et WIKI au format lu par `calculer`, puis appelle `charger(grilles, false, nomDuFichier, null)`. Toutes les pages d'origine fonctionnent ensuite sur ces données.

Entrées sans modifier le coeur : un bouton propre au module (son `input type=file` n'est pas dans le document) et une écoute du dépôt en phase de capture, qui passe avant celle du coeur. Un classeur à la structure attendue, reçu par le module, repart sur le chemin d'origine (`lireClasseur` puis `charger`).

Après chargement : une alerte de provenance s'ajoute aux « points à vérifier » de toutes les pages, et la page Intégration affiche le compte rendu (fichier, moteur de la proposition, avertissements, modèles, méthode, limites). Ce compte rendu voyage dans une grille supplémentaire `INTEGRATION`, ignorée par `calculer` : une copie figée le garde.

## Méthode et limites

**Dates.** Lues : JJ/MM/AAAA (séparateurs `/ . -`, année sur 2 ou 4 chiffres), AAAA-MM-JJ avec ou sans heure, MM/AAAA, AAAA-MM, mois en lettres français ou anglais (« janv. 2024 », « 1er mars 2024 », « Jul 2024 »). Une date impossible (30 février) n'est pas lue. Limites : l'ordre américain MM/JJ n'est pas reconnu ; une date Excel sans format de date reste un nombre ; une seule colonne de dates, la première ; pas de colonnes « année » et « mois » séparées.

**Nombres.** La convention décimale est votée colonne par colonne (« 1 234,5 », « 1.234,56 », « 1,234.56 ») ; une colonne indécidable (« 1,234 » partout) suit la convention majoritaire du fichier et porte la remarque « séparateur décimal ambigu ». Les cellules vides, « - », « n.d. », « N/A », « #… » sont des valeurs manquantes.

**Règles.** Mots-clés français et anglais sur l'intitulé, plus l'unité : une unité d'énergie (Wh, kWh, MWh, GWh) fait une consommation ; « index » ou « cumul » dans le nom, une puissance, un texte, une constante sont écartés ; production, météo, degrés-jours et toute autre unité font un facteur ; le reste est « à vous de décider ». Niveau Site si le nom le dit (général, total, PDL, PCE, TGBT…), ou si la consommation est seule dans son énergie. Ce sont des heuristiques : elles se trompent sur un nom inhabituel, et l'énergie reste « À préciser » quand rien ne la donne.

**IA.** La page envoie les intitulés, le type deviné, l'unité et l'énergie lues, la part de manquants, le minimum, le maximum, la moyenne, les 5 premières valeurs de chaque colonne, le nombre de lignes, le pas, les dates extrêmes, la forme du tableau, une consigne et un outil fixes. Jamais le fichier ni son nom. L'avis du module liste ces éléments et montre la demande entière avant l'accord ; rien ne part sans trois conditions : l'autorisation générale et la clé de la page Instruction (garde-fou du coeur), et l'accord donné sur l'avis du module, redemandé à chaque fichier. Contrôle de la réponse : sans appel d'outil ou sans consommation valable, elle est refusée ; la colonne de dates reste celle du profil ; un texte ne devient ni consommation ni facteur ; une unité contraire à l'intitulé est remplacée par celle de l'intitulé ; une colonne oubliée ou un rôle inconnu reprend la proposition des règles ; noms et raisons sont tronqués ; chaque écart est affiché. Le modèle ne fournit aucun chiffre. Ce que le profil ne peut pas contredire (un facteur pris pour une consommation, par exemple) reste à la personne.

**Modèles.** Moindres carrés ordinaires au pas du fichier, facteurs centrés et réduits avant inversion. Les facteurs entrent un par un ; un facteur n'est retenu que s'il gagne 0,01 de R² ajusté, si |t| ≥ 2, s'il améliore le R² validé (chaque point prédit par un modèle calé sans lui) et s'il n'est pas corrélé à plus de 0,9 avec un facteur retenu. Garde-fou : un facteur au plus pour 8 points, 5 en tout, aucun sous 8 points (la référence est alors la moyenne). Valeurs aberrantes : premier calage sans les valeurs extrêmes, puis sont écartées du calage celles dont le résidu dépasse 5 écarts-types robustes ; elles restent dans le tableau de bord, où elles ressortent comme des dérives. Erreur type écrite dans le WIKI : écart-type robuste (1,4826 × médiane des écarts absolus) de l'écart relatif entre réel et référence, au pas de la série et aux pas plus larges ; avec moins de 6 périodes à un pas large, erreur du pas d'origine divisée par la racine du nombre de périodes regroupées.

Limites des modèles : corrélation et non cause ; calage sur toute la période, dérives comprises ; pas de modèle saisonnier (EQUATION 2 reste vide, type « Simple ») ni de changement de régime ; sélection ascendante seulement ; résidus supposés indépendants, donc t et R² validé optimistes pour des séries temporelles ; l'erreur type robuste est plus bruitée qu'un écart-type classique quand il y a peu de points.

**Grilles.** Dates en numéros de série Excel, consommations en kWh, constante en ligne 2 d'EQUATION, un facteur par ligne ensuite, niveau, énergie, erreurs et R² aux lignes du WIKI lues par `calculer`. Deux contraintes du coeur sont traitées, et dites à l'écran : `calculer` lit un facteur manquant comme 0, donc les valeurs manquantes des facteurs retenus sont interpolées dans la grille (comptées, hors calage) ; `calculer` lit une consommation à 0 comme une absence de donnée, ce qui est signalé dans les limites.

**Non pris en charge.** Relevés plus fins que le jour (refusés avec la marche à suivre : le regroupement par jour a été retiré pour tenir dans 60 Ko) ; index de compteur à convertir ; jointure de deux feuilles ou de deux fichiers par la date ; pas de temps mixtes dans un même tableau ; ligne d'unités sous l'en-tête ; anciens `.xls`.

## Ce qui est testé (banc, 236 vérifications, aucun échec)

`node idee-6-integration/generer.js` fabrique les fichiers d'essai (`essais/`) à partir de modèles connus, puis `test.js` = `test-corps.js` + ces fichiers en chaînes. `./lancer.sh` enchaîne génération, assemblage, `node --check` et banc.

- Lecture : décodage Windows-1252 et UTF-8, trois séparateurs, guillemets ; 18 écritures de dates ; nombres à la française et à l'anglaise, votes décimaux ; unités dans les intitulés ; classeur Excel fabriqué (deux feuilles, dates au format de date, format personnalisé) ; classeur de référence relu par la lecture générique.
- Profil : CSV large « sale » (3 lignes parasites, 1 total, 1 doublon, 2 semaines absentes, manquants, 1 valeur aberrante, colonne indécidable tranchée par le fichier), CSV long, tableau mensuel, quart d'heure refusé, cinq cas inutilisables avec leur message.
- Règles sur les trois fichiers ; correspondance par faux modèle : proposition sensée acceptée, contenu de la demande (ni nom de fichier ni lignes au-delà des 5 premières), réponse sans outil, proposition sans consommation, entrée mal formée, proposition absurde (date prise pour une consommation, texte pris pour un facteur, colonne inventée, rôle inconnu, unités fausses) : refusée ou corrigée et signalée.
- Garde-fous d'envoi, avec `appelGemini` remplacé : aucun appel sans l'autorisation générale, aucun sans l'accord du module ; après accord, un appel, identique à ce que l'avis montrait ; échec de l'IA et arrêt d'une demande en cours.
- Calculs : moindres carrés sur un cas fait à la main et sur des données sans bruit, colinéarité, R² validé comparé au recalage point par point, garde-fous à 12 et 6 points ; coefficients, constantes, R² et erreurs retrouvés sur les trois fichiers (9 modèles, chaque coefficient à moins de 3 écarts-types et de 20 % du vrai).
- Grilles : libellés et positions comparés au classeur de référence ; `charger` réussit ; `calculer` ne relève aucune incohérence ; la référence du tableau de bord égale constante + coefficients × facteurs ; la valeur aberrante injectée ressort comme une dérive ; toutes les pages (boucle sur `ONGLETS`) se rendent sur cinq jeux intégrés, en français et en anglais ; parcours complet par les boutons de l'interface.
- Copie figée : après un passage par JSON, les grilles redonnent le même modèle et la page retrouve son compte rendu. Aucun appel réseau (`__reseau.length === 0`), rien dans `localStorage`.

## Ce qui n'est pas testé

- L'apparence : mise en page, 390 px de large, thème sombre. Le banc n'a pas de mise en page ; le style réutilise les variables et les classes d'origine, les tableaux défilent dans `table-defile`.
- Le dépôt réel d'un fichier (l'écoute en capture) et le clic sur le bouton de choix : le banc ne simule ni l'un ni l'autre ; le test appelle `itgRecevoir`, que les deux appellent.
- Un appel réel à Gemini ou à Claude : seul `appelGemini` a été remplacé par un faux ; le chemin Anthropic n'a pas été exercé, ni la qualité d'une vraie proposition.
- `copieFigee()` elle-même (le faux DOM ne clone pas la page) : seul son équivalent JSON est vérifié.
- Des classeurs produits par Excel ou LibreOffice autres que le classeur de référence ; des fichiers de plus de 60 000 lignes (3 ans journaliers sur 30 colonnes : moins d'une seconde dans Node).

## Changements du coeur souhaités (aucun n'est nécessaire au module)

1. **Un point d'accroche dans `ouvrir`.** Aujourd'hui le bouton d'origine refuse un classeur sans les feuilles attendues, et le module double le dépôt par une écoute en capture. Texte à remplacer :

   ```js
   async function ouvrir(fichier) {
     try {
       const { grilles, d1904 } = await lireClasseur(await fichier.arrayBuffer());
       charger(grilles, d1904, fichier.name, null);
     } catch (e) {
   ```

   Remplacement (et `accept: ".xlsx,.xlsm"` du `selecteur` devient `accept: ".xlsx,.xlsm,.csv,.tsv,.txt"`) :

   ```js
   const OUVREURS = [];                         // modules : async (fichier, erreur) => true s'ils prennent le fichier en charge
   async function ouvrir(fichier) {
     try {
       const { grilles, d1904 } = await lireClasseur(await fichier.arrayBuffer());
       charger(grilles, d1904, fichier.name, null);
     } catch (e) {
       for (const f of OUVREURS) if (await f(fichier, e)) return;
   ```

   Le module ferait alors `OUVREURS.push(async f => { await itgOuvrir(f.name, await f.arrayBuffer()); rendre(); return true; })` et supprimerait son écoute du dépôt et son second bouton.

2. **Réglages de l'IA avant tout chargement.** `rendre()` commence par `if (!etat.modele) { app.replaceChildren(accueil()); return; }` : la page Instruction, qui porte le fournisseur, la clé et l'accord, est inaccessible depuis l'accueil. Le module ne peut donc proposer l'IA qu'après un premier chargement par les règles (il l'explique à l'écran). Sortir de `peindreAgent` une fonction `reglagesIA()` qui rend ce bloc de réglages permettrait de l'afficher aussi à l'étape 3 de l'accueil.

3. **Facteur manquant lu comme zéro.** Dans `calculer`, `const f = num(val(F, l, k + 1));` donne 0 à un facteur absent, et la référence est fausse à cette date. Remplacement proposé : `const brut = val(F, l, k + 1), f = num(brut); if (brut == null && (num(val(E1, k + 2, c)) || num(val(E2, k + 2, c)))) incomplet = true;`, avec `let incomplet = false;` avant la boucle et `ref.push(incomplet ? null : (ete ? rr2 : r1) * 1000);`. Le module n'aurait plus à interpoler.

4. **Mode d'emploi.** Ajouter à `GUIDE` le paragraphe ci-dessous.

## Texte de mode d'emploi

**Français.** *Intégrer un fichier brut.* Vous n'avez pas le classeur préparé ? Sur l'écran d'accueil, ou sur la page Intégration, choisissez ou déposez un export de compteurs ou un tableau de suivi, en CSV ou en Excel. La page le lit tel qu'il est, puis vous montre ce qu'elle a compris : les dates, le pas de temps, les colonnes, et ce qui cloche (dates en double, périodes absentes, valeurs aberrantes). Elle propose ensuite le rôle de chaque colonne : consommation, avec son énergie, son unité et son niveau Site ou UES, facteur influent, ou colonne à ignorer. Cette proposition vient de règles écrites dans la page, ou d'une IA si vous l'avez autorisée sur la page Instruction ; dans ce cas la page vous montre d'abord tout ce qui sera envoyé : les intitulés et quelques valeurs, jamais le fichier. Corrigez le tableau, c'est vous qui décidez. La page calcule alors un modèle de référence par consommation, affiche sa qualité et ses limites, puis charge le tableau de bord. Ces modèles sont calculés par la page, pas par la macro : faites-les relire par une personne qui connaît le site.

**English.** *Integrating a raw file.* No prepared workbook? On the home screen, or on the Integration page, choose or drop a meter export or a tracking table, as CSV or Excel. The page reads it as it is, then shows what it understood: the dates, the time step, the columns, and what looks wrong (duplicate dates, missing periods, outliers). It then proposes the role of each column: consumption, with its energy, unit and Site or SEU level, relevant variable, or column to ignore. This proposal comes from rules written in the page, or from an AI if you authorised it on the Investigation page; in that case the page first shows everything that will be sent: the headers and a few values, never the file. Correct the table, the decision is yours. The page then computes one baseline model per consumption, shows its quality and its limits, and loads the dashboard. These models are computed by the page, not by the macro: have someone who knows the site review them.

## À vérifier à l'écran

1. Accueil : le bloc « Vous n'avez pas ce classeur ? » sous la zone de dépôt, à 390 px et en thème sombre.
2. Déposer `essais/essai-large-sale.csv` sur la page : c'est le module qui doit le prendre, sans le message d'erreur du coeur. Même essai avec le bouton, puis avec `essai-classeur.xlsx`.
3. Étape 2 : 3 lignes ignorées au-dessus de l'en-tête, 1 ligne sans date, 1 doublon, 2 périodes absentes ; « séparateur décimal ambigu » sur la colonne de gaz.
4. Étape 3 : passer les deux colonnes dont l'énergie est « À préciser » en « Électricité » ; vérifier que les champs gardent la saisie et que le tableau défile sans faire déborder la page.
5. Étape 4 : coefficients proches de 150 kWh par tonne et 40 kWh par DJU pour l'électricité, 900 kWh par DJU pour le gaz ; « Humidité » écartée ; 1 valeur hors calage.
6. Charger : page Site, alerte de provenance repliée en haut ; page Détection, dérive de la semaine du 09/10/2023 ; page Intégration, compte rendu ; « Enregistrer une copie figée », rouvrir la copie, retrouver le compte rendu.
7. Avec une clé : page Instruction, choisir un fournisseur, autoriser, saisir la clé ; page Intégration, lire l'avis et « Voir tout ce qui sera envoyé », autoriser, demander une proposition, l'arrêter, la relancer ; vérifier ce que le fournisseur a effectivement reçu.
8. `essais/essai-inutilisable.csv` et un fichier quelconque (une image) : message clair, parcours arrêté.

## Points tranchés

- Une page « Intégration » (groupe « Données ») en plus de l'accroche d'accueil : sans elle, pas d'accès à l'IA (réglages sur la page Instruction, inaccessible avant un chargement) et pas de compte rendu après chargement.
- Le compte rendu est rangé dans une grille `INTEGRATION` (clé de données, non préfixée) pour suivre la copie figée ; l'alerte de provenance est ajoutée à `modele.alertes` dans `AU_CHARGEMENT`.
- Erreur type robuste plutôt qu'écart-type classique : une série proche de zéro une partie de l'année, ou les dérives elles-mêmes, gonflaient le tunnel au point de masquer toute dérive.
- Valeurs aberrantes écartées du calage d'office, par rapport au modèle et non à la moyenne (des semaines d'arrêt bien expliquées par la production restent dans le calage).
- Pour tenir dans 60 Ko (`module.js` : 59,9 Ko), ont été retirés : regroupement par jour des relevés plus fins, ordre de date américain, ligne d'unités sous l'en-tête, choix de la colonne de dates, détection statistique d'un index de compteur, affichage de la réponse brute du modèle, retrait de l'accord du module (celui de la page Instruction suffit à bloquer l'envoi).
- Textes fixes : `itgF(fr, en)` appelle `ajouterTraductions` au premier emploi, pour n'écrire chaque texte qu'une fois par langue.

## Vague 2

Page allégée : la réponse calculée en tête, le graphique et les réglages courants ensuite, le reste (méthode, limites, tableaux, réglages rares) sous le composant commun `repli` ; textes d'IA renvoyés aux réglages d'IA. Détail, mesures avant et après et tests : `idee-14-allegement/NOTES.md`.
