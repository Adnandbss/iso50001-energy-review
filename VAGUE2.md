# Vague 2 — pages allégées, un seul parcours des dérives, liens entre pages

Deux agents travaillent en parallèle, chacun dans **son clone** du dépôt et sur **sa branche**. Lisez ce document en entier, puis `VAGUE1.md` (mécanismes de l'assembleur, règles générales, qui restent valables) et `CONTRAT.md`.

## Où en est l'outil

La vague 1 est fusionnée dans `main` : site fictif, visite guidée et page Vue d'ensemble (`idee-10-accueil`, préfixe `acc`) ; panneau unique de réglages d'IA, réponses en continu, indicateur d'agent au travail (`idee-11-ia`, préfixe `ia`) ; travail gardé par classeur, fichier projet, lexique souligné dans les pages (`idee-12-continuite`, préfixe `cnt`). Lisez les `NOTES.md` de ces trois modules : ils décrivent ce qui a changé et ce qu'ils demandent ailleurs.

Ordre d'assemblage (`outillage/ordre-modules.txt`) : prévision, simulateur, veille, revue, évaluation, intégration, accueil, ia, continuité, **13-dérives**, **14-allègement**, assemblage. `outillage/tout-tester.sh .` assemble et lance toutes les séries (1 507 vérifications aujourd'hui) ; il doit passer en entier.

**Nouveau composant commun**, dans l'assembleur : `repli(cle, titre, ...enfants)` rend un bloc `<details class="repli">` replié par défaut, titre par défaut « Comment c'est calculé » (traduit), dont l'état ouvert est retenu par `cle` pendant la session. Utilisez-le pour toute méthode, limite, hypothèse ou tableau secondaire. Ne créez pas d'autre composant de repli.

Mesures de départ (mots, contrôles visibles, hauteur en écrans à 1 280 × 800) : Détection 2 000 / 120 / 4,4 ; Veille 1 900 / 62 / 2,9 ; Simulateur 1 300 / 62 / 6 ; Prévision 1 100 / 10 / 4,2 ; Instruction 500 / 9 / 1. Reprenez-les sur vos pages avant et après, sur le classeur de test et sur le site fictif, et donnez-les dans `NOTES.md`.

## Le principe commun d'allègement

Chaque page commence par **la réponse** : une phrase calculée et un à quatre chiffres, puis l'action la plus probable. Viennent ensuite le graphique principal et les réglages courants. Tout le reste — méthode, limites, hypothèses, tableaux détaillés, avertissements secondaires — passe sous un `repli`. Aucun avertissement ne disparaît : un avertissement qui change la lecture d'un chiffre reste visible, en une ligne, à côté du chiffre ; son détail va dans le repli. Aucun calcul ne change. Les textes restent exacts ; raccourcis-les, ne les déforme pas.

## Règles propres à la vague 2

1. **Git, souvent.** L'utilisateur a demandé explicitement que les agents poussent souvent : tu as son accord pour pousser sur **ta** branche. Un commit par étape qui marche (tests de ce que tu as touché au vert, `node --check` sur l'assemblage), poussé aussitôt (`git push -u origin <ta-branche>`). `outillage/tout-tester.sh .` en entier avant tes derniers commits. Messages en anglais, à l'impératif, titre précis de moins de 72 caractères, puis la ligne vide et `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. N'ajoute que tes fichiers, par leur nom (jamais `git add -A` ni `git add .`). Jamais sur `main`, jamais `--force`, aucune autre branche. Pas de commit vide ni artificiel. Rien de privé (chemin de la machine, nom de personne, clé).
2. **Tes fichiers seulement** : la liste est dans ta mission. Pour un changement ailleurs, décris-le dans ton `NOTES.md` (fichier, texte à remplacer, remplacement, raison).
3. **Tests d'autres modules** : si tu changes un texte ou une structure qu'un test d'un autre module vérifie, et que ce module est dans ta liste, mets son test à jour en gardant ce qu'il vérifie. S'il n'est pas dans ta liste, décris dans `NOTES.md` pourquoi il échoue et quoi changer.
4. **Aperçu visuel** : comme en vague 1 (Chrome sans fenêtre, profil temporaire dans ton clone, effacé ensuite, `.gitignore` le couvre s'il s'appelle `.chrome-*`). Pas le navigateur intégré de l'application.

Réponse finale : dix lignes au plus, avec les mesures avant et après, le nombre de commits poussés et la dernière ligne de `tout-tester.sh`.
