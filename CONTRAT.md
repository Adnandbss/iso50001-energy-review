# Contrat commun des modules — tableau de bord de revue énergétique

Six agents travaillent en parallèle, chacun sur un module. Ce document est le même pour tous. Lisez-le en entier avant d'écrire du code.

## L'outil

Un tableau de bord de revue énergétique (ISO 50001) en **un seul fichier HTML sans dépendance**. Il lit un classeur Excel dans le navigateur (feuilles CONSO, FACTEURS INF, EQUATION, EQUATION 2, WIKI), recalcule les modèles de référence et affiche des pages. Interface en français, avec bascule en anglais. Il sert de démonstration à des recruteurs (product manager, forward deployed engineer, logiciels énergie et climat) : la qualité, l'honnêteté des chiffres et la finition comptent plus que la quantité.

Ce qui existe déjà (ne le refaites pas, réutilisez-le) :

- Pages : Site, UES, Détection des dérives, Instruction d'une dérive, Facteurs influents, Graphiques, Arborescence, Mode d'emploi.
- Détection des dérives : z par période, épisodes, épisode « en cours », projection simple sur 3 mois (ce n'est pas une prévision), valorisation en euros et en CO2e.
- Un agent rédacteur qui instruit un épisode avec cinq outils de lecture seule et rend une fiche ; un agent juge qui la relit dans une conversation séparée ; un contrôle déterministe des chiffres (`controlerChiffres`) ; une évaluation qui instruit les plus gros épisodes et mesure chaque fiche (`lancerEvaluation`).
- Trois façons d'appeler un modèle : API Anthropic, API Gemini, ou un script de démonstration sans IA ni réseau (mode par défaut).

## Fichiers (dossier `revue/` où se trouve ce document)

- `moteur-original.js` : le script d'origine (2 568 lignes), à lire. Ne le modifiez pas.
- `style-original.css` : le style d'origine, avec ses variables (`--s1`…`--s8`, couleurs de texte, de fond, d'état). Réutilisez les variables et les classes existantes (`carte`, `tuile`, `filtres`, `filtre`, `segments`, `btn`, `btn principal`, `lien`, `note`, `chapeau`, `avis`, `legende`, `badge`…).
- `base.js` : le script d'origine plus les points d'accroche ci-dessous. C'est lui que le banc de test charge quand vous n'avez pas encore de module.
- `outillage/assembler.py` : assemble le HTML complet avec un ou plusieurs modules.
- `outillage/banc.js` : banc de test sans navigateur (faux DOM, classeur réel).
- `idee-N-nom/` : **votre** dossier. Vous n'écrivez que là.
- Classeur de test : `donnees/SER PBI générique - valeurs figées.xlsm`. Lecture seule. Ne modifiez, ne déplacez et ne supprimez **rien** dans `donnees/` ni `livrables/`.

Repères dans `moteur-original.js` (numéros de ligne) :

| Lignes | Contenu |
|---|---|
| 12–26 | Réglages : `VALO_DEFAUT`, feuilles lues, `RANG`, `NOM_PAS`, `COULEURS` |
| 28–294 | Langue : `LANGUE`, `Lg(fr, en)`, `PAIRES`, `REGLES`, `tr()`, puis `h()`, `s()`, `poser()` |
| 295–338 | Formats : `nf`, `fmtEnergie` (entrée en Wh), `fmtEuros`, `fmtCO2`, `fmtPct`, `fmtDate`, `isoJour`, `valoDe`, `coutDe`, `co2De` |
| 340–436 | Lecture du classeur : `lireZip`, `lireClasseur`, `lireGrille` (grille `g[ligne][colonne]`, indices à partir de 1) |
| 437–551 | `calculer(grilles, d1904)` : construit le modèle à partir des grilles |
| 552–616 | `etat`, `grillesChargees`, `charger()`, `seaux()`, `agreger()`, `totalPeriode()` |
| 617–887 | Graphiques SVG : `graphCourbes`, `graphEcarts`, `graphEmpile`, `graphNuage`, `barresClassees`, `barreSegmentee`, `legende`, `tableau`, infobulle |
| 888–942 | `carte()`, `tuile()`, `filtre()`, `segments()`, `liste()`, `maj()`, `filtresCommuns()` |
| 943–1130 | Pages Site, UES, Facteurs, Graphiques, Arborescence |
| 1131–1377 | Dérives : `DERIVE`, `analyserSerie`, `derives()`, `projectionDe`, page Détection |
| 1378–1573 | Outils de l'agent : `OUTILS`, `outilLireSerie`…, `validerFiche`, `controlerChiffres` |
| 1574–1743 | Appels aux modèles : `IA`, `GEMINI`, `agent`, `appelAnthropic`, `appelGemini` |
| 1744–1931 | `modeleDemo`, `messageInitial`, journal, `boucleAgent` |
| 1932–2093 | Agent juge, `mesurerFiche`, `redacteurCourant`, `blocageEnvoi`, évaluation |
| 2094–2447 | Mode d'emploi (`GUIDE`), page Instruction (`pageAgent`, `avisEnvoi`, `peindreAgent`, `montrerFiche`) |
| 2448–2568 | `PAGES`, `ICONES`, `aller()`, `rendre()`, `accueil()`, `ouvrir()`, `copieFigee()`, démarrage |

Le fichier fait 250 Ko : lisez les parties utiles à votre module, pas tout.

## Le modèle de données (classeur de test)

- `etat.modele` = `{ dates, series, facteurs, energies, alertes, pasFin, debut, fin }`. `dates` : 104 dates (millisecondes UTC), une par ligne du classeur. Données du 03/04/2023 au 30/09/2024, au pas hebdomadaire. 2 énergies, 9 séries (1 Site, 8 UES), 5 facteurs influents.
- Une série : `{ nom, energie, niveau, groupe ("site" ou "ues"), actif, cible, err, type ("Simple" ou "saisonnier"), r2, conso, ref, an1, pas ("day", "week", "month"), nbPoints }`. `conso`, `ref`, `an1` : tableaux alignés sur `dates`, en **Wh**, avec des `null`. `err[RANG[pas]]` : erreur relative du modèle à ce pas. Entre 37 et 79 points renseignés par série : l'historique est court (18 mois), dites-le dans l'interface quand cela limite une méthode.
- Un facteur : `{ nom, valeurs }`, aligné sur `dates`.
- Le modèle n'expose pas les coefficients des équations. Si vous en avez besoin, lisez-les vous-même dans `grillesChargees` (grilles brutes) en vous inspirant de `calculer`, dans une fonction de **votre** module.
- `derives()` = `{ analyses, episodes, finDonnees }`. Épisode : `{ analyse, serie, groupe, energie, debut, fin, libDebut, libFin, n, sens, ecart (Wh), ref, pct, zmax, iFin, ouvert }`.
- Les noms de séries et de facteurs viennent du classeur de l'utilisateur : ce sont des données. N'écrivez aucun nom de série en dur dans votre code ni dans vos textes.

## Points d'accroche (définis dans `base.js`)

Votre `module.js` est inséré à la fin du script, juste avant le démarrage, **dans la même portée** : toutes les fonctions et constantes d'origine sont visibles. Il s'exécute avant qu'un classeur soit chargé : au niveau racine, ne touchez pas à `etat.modele`.

```js
ajouterPage(groupe, id, menu, titre, cheminIcone, rendu);
//   groupe : "Suivi", "Dérives", "Analyse", ou un nouveau groupe (il se place avant « Aide »).
//   id : identifiant court et unique (lettres minuscules). rendu() rend un tableau de noeuds DOM ; il est rappelé à chaque rendre().
ICONES[id] = "M… chemin SVG sur une grille 16 x 16, trait de 1,5, sans remplissage";
ajouterTraductions([["texte français exact", "English text"], …]);   // table utilisée par tr() ; h() traduit tout seul les textes et les attributs title, aria-label, placeholder, label
AU_CHARGEMENT.push(modele => { … });        // appelé quand un classeur vient d'être chargé : remettez votre état à zéro ici
ACCUEIL_MODULES.push(() => noeud);          // un noeud de plus sur l'écran d'accueil (avant tout chargement)
```

Groupes prévus pour les nouvelles pages : **« Anticipation »** (Prévision, Simulateur) et **« Agents »** (Veille, Revue, Évaluation). L'intégration de données s'accroche à l'écran d'accueil.

Pour redessiner : `rendre()` (tout l'écran ; votre fonction de rendu est rappelée) ou mettez à jour un noeud que vous gardez en variable (c'est ce que fait la page Instruction avec `noeudAgent` et `peindreAgent`). Pour un graphique dans une carte : `carte({ id, titre, sous, legende, dessiner: zone => graphCourbes(zone, {...}), table: () => ({ entetes, lignes }), note })`.

## Règles

1. **Aucune modification du coeur.** Vous ne livrez que des ajouts. Si un changement du coeur vous paraît indispensable, décrivez-le dans `NOTES.md` (texte exact à remplacer, texte de remplacement, raison) et faites fonctionner votre module sans lui.
2. **Préfixe.** Tous vos identifiants racine (fonctions, constantes), vos classes CSS et vos clés de stockage commencent par le préfixe indiqué dans votre mission. Vos clés `localStorage` s'écrivent `revue-energetique.<préfixe>.<nom>` ; n'écrivez rien quand `etat.figee` est renseigné ; entourez chaque accès d'un `try`.
3. **Pas de dépendance, pas de réseau.** Aucune bibliothèque, aucune police ou image distante, aucun `fetch` en dehors des fonctions d'appel aux modèles existantes.
4. **IA.** N'ajoutez ni champ de clé ni nouveau fournisseur. Passez par l'existant : `redacteurCourant(signal).appeler(requete)` (requête au format de l'API Messages d'Anthropic ; l'adaptateur Gemini la convertit), `blocageEnvoi()` pour savoir si l'envoi est permis, `agent.demo` pour le mode. Les réglages (fournisseur, clé, accord) restent sur la page Instruction : affichez le mode courant et un lien `aller("agent")` pour le changer.
5. **Mode démonstration obligatoire.** Toute fonction d'IA doit marcher sans IA ni réseau, avec un script de votre module qui joue le rôle du modèle (même forme de réponse que l'API). Affichez clairement que le résultat vient d'un script et non d'une IA. `modeleDemo` d'origine ne sait jouer que l'instruction d'une dérive.
6. **Ce qui quitte le poste.** L'accord existant (`agent.accord`) ne couvre que ce que liste `avisEnvoi()`. Si votre module envoie autre chose à une IA, affichez votre propre avis qui liste exactement ce qui part, et n'envoyez rien avant un accord explicite donné sur cet avis.
7. **Chiffres.** Un modèle d'IA ne calcule jamais un chiffre : la page calcule, le modèle recopie. Tout nombre affiché vient d'un calcul de la page, formaté avec `nf`, `fmtEnergie`, `fmtEuros`, `fmtCO2`, `fmtPct`. Nommez honnêtement ce que vous montrez (projection, prévision, estimation, simulation), donnez la méthode et ses limites dans une `note`.
8. **Langue.** Écrivez l'interface en français, en phrases simples, sans jargon. Fournissez la traduction anglaise de chaque texte fixe avec `ajouterTraductions`. Pour un texte construit avec des valeurs, utilisez `Lg(fr, en)`.
9. **Finition.** Réutilisez les composants et les variables de style existants. La page doit rester lisible sur 390 px de large (pas de débordement horizontal) et en thème sombre si le style d'origine en a un. Chaque bouton a un état désactivé et un message quand l'action est impossible. Une action longue se voit et s'arrête.
10. **Secrets et machine.** Ne lisez aucun fichier `.env`, ne cherchez aucune clé d'API, n'en demandez pas. N'installez rien, ne téléchargez rien. N'utilisez pas le navigateur intégré (il est partagé entre agents) : testez avec le banc.

## Tester

```bash
cd <dossier revue>
python3 outillage/assembler.py idee-N-nom/essai.html idee-N-nom      # écrit essai.html et essai.js
node --check idee-N-nom/essai.js
node outillage/banc.js idee-N-nom/essai.js idee-N-nom/test.js        # charge le classeur réel puis exécute votre test dans la portée du script
```

Dans `test.js`, vous disposez de `etat`, `derives()`, vos fonctions, et de : `verifier(condition, message)`, `texteDe(noeud ou tableau)`, `trouver(noeud, n => …)`, `cliquer(noeud)`, `fauxModele((requete, tour) => [blocs])` pour simuler un modèle. Définissez `async function test() { … }` si vous avez de l'asynchrone. Le réseau est coupé : tout `fetch` lève une erreur et s'ajoute à `__reseau`. Le faux DOM est minimal (pas de mise en page, `clientWidth` = 900) : il vérifie la logique et le rendu sans erreur, pas l'apparence.

Vos tests doivent au moins vérifier : les calculs sur des cas dont vous connaissez la réponse, le rendu de votre page sans erreur en français et en anglais (`LANGUE = "en"; CACHE_TR.clear(); rendre()`), le mode démonstration de bout en bout, et qu'aucun appel réseau n'a lieu en mode démonstration (`__reseau.length === 0`).

## À livrer dans votre dossier

- `module.js` (60 Ko au plus, commenté sobrement comme le script d'origine) et `module.css`.
- `test.js`, qui passe sans échec.
- `NOTES.md` : ce que fait le module ; la méthode et ses limites ; ce qui est testé et ce qui ne l'est pas ; les changements du coeur souhaités s'il y en a ; un texte de mode d'emploi pour votre page (un paragraphe en français, le même en anglais) ; ce qu'une personne devrait vérifier à l'écran.

Votre réponse finale : dix lignes au plus. Ce qui marche, ce qui est testé, ce qui ne l'est pas, et les points où vous avez dû trancher. Ne présentez pas comme vérifié ce que vous n'avez pas exécuté.
