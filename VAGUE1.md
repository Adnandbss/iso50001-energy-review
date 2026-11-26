# Vague 1 — expérience utilisateur

Trois agents travaillent en parallèle, chacun dans **sa propre copie** du dossier de travail. Ce document est le même pour les trois. Lisez-le en entier, puis `CONTRAT.md` (le contrat d'origine des modules : il reste valable, sauf là où ce document le modifie).

## Où en est l'outil

Un tableau de bord de revue énergétique (ISO 50001) en un seul fichier HTML, sans dépendance, qui sert de démonstration à des recruteurs (product manager, forward deployed engineer, logiciels énergie et climat). Il est assemblé par `outillage/assembler.py` à partir du prototype d'origine (lecture seule) et de modules :

| Ordre | Module | Contenu |
|---|---|---|
| 1 | `idee-1-prevision` | page Prévision (`prev`) |
| 2 | `idee-5-simulateur` | page Simulateur (`sim`) |
| 3 | `idee-4-veille` | page Veille (`vei`) |
| 4 | `idee-2-revue` | page Revue (`rev`) |
| 5 | `idee-3-evaluation` | page Évaluation, banc de 26 questions (`evl`) |
| 6 | `idee-6-integration` | intégration d'un fichier brut, page Intégration (`itg`) |
| 7 | `idee-10-accueil` | **nouveau, vague 1** |
| 8 | `idee-11-ia` | **nouveau, vague 1** |
| 9 | `idee-12-continuite` | **nouveau, vague 1** |
| 10 | `idee-9-assemblage` | sections du mode d'emploi et traductions communes ; chargé en dernier |

L'ordre est dans `outillage/ordre-modules.txt`. `outillage/tout-tester.sh <dossier>` assemble tout dans cet ordre (`assemble.html`, `assemble.js`) et lance **toutes** les séries de tests ; il doit finir sans échec et sans appel réseau.

Mesures faites sur l'outil actuel, pour situer le problème : 14 pages en 7 groupes ; Détection 2 000 mots, 120 contrôles, 4,4 écrans de haut ; Veille 1 900 mots ; Simulateur 1 300 mots, 62 contrôles, 6 écrans ; Prévision 1 100 mots. L'accueil exige un classeur Excel que le visiteur n'a pas. La clé d'IA se saisit sur la page Instruction et chaque page qui envoie à une IA demande son propre accord (Instruction, Évaluation, Revue, Simulateur, Intégration). La clé, les scénarios du simulateur, le brouillon de la revue et les passes du banc disparaissent au rechargement. Un tour de Gemini peut prendre 76 s sans rien afficher.

## Nouveaux mécanismes de l'assembleur

- `APRES_RENDU.push(() => { … })` : appelé à la fin de chaque `rendre()`, une fois les graphiques dessinés.
- **Correctifs du cœur portés par un module** : si votre dossier contient `coeur.py`, l'assembleur l'exécute. Il y définit `patch(js, remplacer)` qui rend le script modifié, et au besoin `patch_css(css, remplacer)`. `remplacer(texte, ancien, nouveau)` exige que `ancien` figure exactement une fois. C'est **la seule façon** de modifier le cœur ; gardez ces remplacements courts et commentés.
- Les points d'accroche d'origine restent : `ajouterPage`, `ICONES`, `ajouterTraductions`, `AU_CHARGEMENT`, `ACCUEIL_MODULES`.

## Règles de la vague

1. **Votre copie, vos fichiers.** Vous travaillez uniquement dans le dossier qui vous est donné. Dans ce dossier, vous ne modifiez **que** les fichiers listés dans votre mission. Tout le reste est en lecture seule : les autres modules, `outillage/`, `CONTRAT.md`, ce document. Si un autre fichier doit changer, décrivez le changement exact dans votre `NOTES.md` (fichier, texte à remplacer, remplacement, raison) : je l'appliquerai à la fusion.
2. **Rien hors de votre copie.** Ne modifiez, ne déplacez et ne supprimez rien dans `/Users/adnan/Desktop/PBI` ni ailleurs. N'installez rien, ne téléchargez rien, ne lisez aucun `.env`, ne cherchez aucune clé d'API.
3. **Tests.** `outillage/tout-tester.sh <votre dossier>` doit passer en entier à la fin, sans appel réseau. Ajoutez un `test.js` dans votre module (même banc, mêmes aides que dans `CONTRAT.md`). Si vous changez un comportement qu'un test d'un autre module vérifie, ne touchez pas ce test : décrivez dans `NOTES.md` pourquoi il échoue et ce qu'il faudrait y changer.
4. **Aperçu visuel.** Le banc ne voit pas la mise en page. Pour regarder votre travail, vous pouvez lancer Chrome sans fenêtre (`--headless=new`), avec un profil temporaire créé dans votre dossier et effacé ensuite, uniquement sur des fichiers de votre dossier (`file://`) : captures à 1 280 px et 390 px, thème clair et sombre. N'utilisez pas le navigateur intégré de l'application (il est partagé).
5. **Données de l'utilisateur.** Le classeur de test (`/Users/adnan/Desktop/PBI/SER PBI générique - valeurs figées.xlsm`) se lit, ne se modifie pas. Aucune donnée réelle ne doit entrer dans le HTML assemblé : les données d'exemple sont fabriquées par le code.
6. **IA et confidentialité.** Rien ne part vers une IA sans accord explicite. Une clé d'API n'est jamais écrite dans `localStorage`, dans l'adresse ou dans le HTML. Le mode démonstration (sans IA ni réseau) reste le mode par défaut et doit tout faire marcher.
7. **Style.** Français simple, sans jargon, traduction anglaise de chaque texte fixe. Réutilisez les variables et composants du style existant. Lisible à 390 px, en thème sombre, sans débordement horizontal. Chaque action longue se voit et s'arrête.
8. **Honnêteté.** Données d'exemple annoncées comme fictives partout où elles s'affichent. Ne présentez pas comme vérifié ce que vous n'avez pas exécuté.

## À livrer

Dans votre module : `module.js`, `module.css` s'il le faut, `coeur.py` s'il le faut, `test.js`, `NOTES.md` (ce que vous avez fait, ce qui est testé et ce qui ne l'est pas, les changements demandés ailleurs, un paragraphe de mode d'emploi en français et en anglais, ce qu'une personne doit vérifier à l'écran). Pas de limite de taille stricte, mais restez sobre (moins de 60 Ko par module si possible).

Votre réponse finale : dix lignes au plus, dont la dernière ligne de `tout-tester.sh`.
