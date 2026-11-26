# Module « Revue » (préfixe `rev`, page `revue`, groupe « Agents »)

## Ce que fait le module

Il ajoute une page qui produit la revue énergétique de la période filtrée, en quatre étapes visibles.

1. **Dossier de faits.** La page calcule une cinquantaine de faits (53 sur le classeur de test, période entière). Chaque fait a un identifiant (`P1`, `R2`, `D4`…), un type, parfois une marque (`en_cours`, `hors_plage`, `r2_faible`, `non_analysee`, `non_explique`, `historique_court`) et une phrase qui porte les nombres déjà formatés. Familles : P périmètre et données, V hypothèses de valorisation, C consommation par énergie, U usages (UES), R performance par rapport à la référence, M qualité des modèles, D dérives, F facteurs influents.
2. **Rédaction.** Un agent reçoit ce dossier, et rien d'autre, avec une consigne. Il rend sept sections par l'outil `rendre_revue`. Chaque phrase qui contient un nombre doit citer le fait d'où il vient, entre crochets.
3. **Vérification.** Deux contrôles séparés.
   - La page (`revControler`) lit chaque nombre du texte avec son unité et le classe : `ok` (présent dans un fait cité par sa phrase), `hors` (présent dans le dossier, mais pas dans un fait cité), `absent` (nulle part). Un renvoi vers un fait inexistant est aussi repéré. Chaque cas est marqué dans le texte à sa position exacte.
   - Un second agent, dans une conversation séparée, reçoit le texte et le dossier, pas le raisonnement du rédacteur. Il rend un verdict par section (`rendre_verdicts`). Un point bloquant impose « à corriger », quel que soit le mot choisi par l'agent.
4. **Validation et export.** La personne voit la liste des signalements (nombres introuvables, renvois inconnus, points bloquants du vérificateur), corrige le texte section par section, lève ou rouvre un signalement, saisit son nom et valide. La validation est refusée tant qu'un signalement est ouvert. Le document s'imprime (`window.print()`, feuille de style d'impression) ou se copie en texte brut. Il indique le rédacteur, le résultat des deux contrôles, les dates des données, les hypothèses de valorisation, les signalements ouverts ou levés, les sections corrigées à la main, et il se termine par l'annexe des faits cités.

En mode démonstration, deux scripts du module jouent les agents, avec la même forme de réponse que l'API : `revTexteDemo` assemble les sections en recopiant des faits, `revVerdictsDemo` joue le vérificateur. Le bouton « Introduire une erreur » altère un nombre juste du brouillon et relance la vérification : les deux contrôles l'attrapent. Un second clic retire l'erreur.

## Méthode

- Sources des faits : `totalPeriode` (consommations, comme la page Arborescence), `outilLireSerie` (réel, référence, écart sur les périodes comparables), `outilComparerUes` (part de l'écart du site non expliquée par les UES), `outilEpisodes` (épisodes qui touchent la période ; cumuls sans double compte selon la règle de la page Détection), `outilLireFacteurs` (plage habituelle P10 à P90), `valoDe`, `coutDe`, `co2De`. Formats : `fmtEnergie`, `fmtEuros`, `fmtCO2`, `fmtPct`, `nf`.
- Épisodes retenus comme faits : les 6 plus gros en écart absolu, plus tous ceux en cours. Facteurs : sur la période, puis pendant les 3 plus gros épisodes.
- Repères propres à la page, écrits dans les faits concernés : R² inférieur à 0,75 signalé comme faible ; historique de moins de 24 mois signalé comme court (18 mois sur le classeur de test).
- Égalité d'un nombre écrit et d'un nombre d'un fait : même unité (GWh, MWh, kWh, %, €, k€, M€, tCO₂e, kgCO₂e, €/MWh, kgCO₂e/kWh), et même valeur ou arrondi plus court de celle-ci.
- La phrase est l'unité d'attribution : un renvoi ne couvre que les nombres de sa phrase. Les noms du classeur sont masqués avant lecture, pour qu'un nom contenant un point ou un chiffre ne soit pris ni pour une fin de phrase ni pour un nombre.

## Limites

- Le contrôle de la page vérifie la présence et le rattachement des nombres. Il ne contrôle ni le signe (une économie écrite comme une surconsommation passe), ni le sens de la phrase, ni les entiers sans unité inférieurs à 100, ni les années présentes dans les données. C'est le rôle du second agent, puis de la personne.
- Le vérificateur de démonstration est un script. Il contrôle trois choses : nombre absent du dossier, série nommée dans une phrase alors qu'elle ne figure pas dans les faits cités, formule de cause affirmée sans mot de prudence (liste courte de tournures françaises et anglaises). Il ne juge pas le sens. La page le dit.
- Le texte de démonstration est une suite de faits recopiés. Il montre la chaîne, pas la qualité rédactionnelle d'un modèle.
- Consommations (totaux de la période) et écarts (périodes où réel et référence existent) n'ont pas toujours la même base.
- Si la période couvre toutes les données, les facteurs n'ont pas de plage habituelle de comparaison : le dossier le dit au lieu d'en fabriquer une.
- Un nom de série que le modèle déforme n'est plus masqué : ses chiffres éventuels seraient alors contrôlés comme des nombres.
- Changer la période après la rédaction ne modifie pas le brouillon : il garde son dossier, et la page rappelle sa période. Changer de langue retire le brouillon, comme le fait la page Instruction pour sa fiche.
- Rien n'est enregistré : ni brouillon, ni nom du relecteur. Recharger la page ou le classeur efface la revue.

## Ce qui est testé (`test.js`, 159 vérifications, 0 échec, 0 appel réseau)

- Contrôle déterministe sur un dossier écrit à la main, donc à réponses connues : texte juste, arrondi plus court, chiffre altéré, mauvaise unité, k€ contre €, mauvais fait cité, phrase sans renvoi, renvoi inconnu, positions exactes, petits entiers, années, semaines, nom de série contenant un nombre ; mêmes cas en anglais (point décimal, virgule des milliers, « €23.2k »).
- Dossier de faits, sur toutes les données puis sur 2024 : consommations égales à `totalPeriode` et à une somme directe ; performance égale à `outilLireSerie` et à une somme directe ; part non expliquée égale à `outilComparerUes` ; nombre d'épisodes et cumul sans double compte égaux à ceux de la page Détection ; projection des dérives en cours ; hypothèses de valorisation.
- Chaîne complète en démonstration, en français, en anglais et sur 2024 : sept sections, tous les nombres retrouvés, sept verdicts conformes, journal, document, validation, impression, copie.
- Erreur introduite : un seul nombre introuvable, marqué au bon endroit, verdict « à corriger » sur la bonne section, validation bloquée, mention dans le document ; lever, rouvrir, retirer.
- Correction humaine : recontrôle immédiat par la page, verdict marqué périmé, nouvelle vérification.
- `fauxModele` en rédacteur qui rend d'abord une revue incomplète, puis invente un chiffre et une cause : nouvelle demande au modèle, chiffre attrapé et marqué, verdict transformé en signalement, conversation du vérificateur sans le raisonnement du rédacteur, nom du fichier absent des requêtes.
- Modèle qui ne rend jamais le bon format ; arrêt en cours de route.
- Accords : rien ne part sans l'accord de la page Instruction, ni sans l'accord propre à la revue. Pour ce test, les fonctions d'envoi d'origine sont remplacées le temps de l'appel : aucun envoi réel n'est tenté.
- Rendu des autres pages, remise à zéro au chargement d'un classeur.
- Essai d'assemblage avec les cinq autres modules présents au moment du test : le script se charge et ce test passe.

## Ce qui n'est pas testé

- **L'apparence.** Rien n'a été vu dans un navigateur : ni la mise en page, ni les 390 px de large, ni le thème sombre, ni la feuille d'impression et le PDF obtenu. Le banc ne vérifie que la logique et le rendu sans erreur.
- **Un vrai modèle.** Aucun appel à Gemini ni à Claude n'a été fait. Les consignes, le format des outils et la conversion Gemini des requêtes n'ont pas été éprouvés sur une API réelle.
- Les infobulles (attribut `title`), le presse-papiers réel, le sélecteur `:has()` et les pages nommées (`@page rev-revue`) en impression.

## Changements du coeur souhaités (le module fonctionne sans eux)

**1. `outilLireFacteurs` compte comme des mesures les lignes sans consommation.** Le classeur de test porte 25 lignes après la fin des données (du 07/10/2024 au 24/03/2025) où les cinq facteurs valent 0. L'outil les range dans « reste des données » et dans « mêmes mois hors de la plage » : la plage habituelle est tirée vers 0 (P10 souvent nul), ce qui fausse aussi les fiches de la page Instruction. Dans la revue, je contourne le défaut : l'outil est appelé sur une copie du modèle où ces lignes sont vides (`etat.modele` est remplacé le temps de l'appel, puis remis). Conséquence à connaître : pour un même épisode, la revue et la fiche d'instruction peuvent donner deux plages différentes tant que le coeur n'est pas corrigé.

Texte à remplacer :
```js
      f.valeurs.forEach((v, i) => {
        if (v == null) return;
        const t = m.dates[i];
```
Remplacement :
```js
      f.valeurs.forEach((v, i) => {
        const t = m.dates[i];
        if (v == null || t < m.debut || t > m.fin) return;      // lignes sans consommation : facteurs non mesurés
```

**2. Le texte de confidentialité de l'accueil devient inexact.** Il annonce une seule exception. Dans `accueil()` et dans `PAIRES`, remplacer « Seule exception (prototype) : dans l'onglet Dérives, l'instruction d'un épisode par l'IA envoie des valeurs à l'API d'IA que vous choisissez (Google Gemini ou Anthropic), uniquement après votre accord explicite. » par « Seules exceptions : sur les pages Instruction et Revue, le travail confié à une IA envoie des valeurs à l'API d'IA que vous choisissez (Google Gemini ou Anthropic), uniquement après votre accord explicite, donné sur chaque page. » (anglais : « Only exceptions: on the Investigation and Review pages, work handed to an AI sends values to the AI API you choose (Google Gemini or Anthropic), only after your explicit consent, given on each page. »). À ajuster si d'autres modules envoient aussi.

**3. Deux accords en mode réel.** `appelAnthropic` et `appelGemini` exigent `agent.accord`, donné sur la page Instruction. Il faut donc donner cet accord, puis celui de la revue. C'est conforme aux règles 4 et 6, mais lourd. Aucun changement demandé ; à garder en tête pour l'assemblage.

## Mode d'emploi (à ajouter à la page Mode d'emploi)

**Français.** La page Revue rédige la revue énergétique de la période choisie avec le filtre, en quatre étapes. 1. La page calcule un dossier de faits : consommations, écarts à la référence, qualité des modèles, épisodes de dérive avec leur coût et leurs émissions estimés, facteurs influents hors de leur plage habituelle. Dépliez-le pour le lire : chaque fait porte un identifiant. 2. Cliquez sur « Rédiger la revue ». Un agent écrit sept sections à partir de ce dossier seul et cite, entre crochets, le fait de chaque chiffre. En mode démonstration, un script fait ce travail sans IA ; pour utiliser une IA, réglez le fournisseur et la clé sur la page Instruction, puis donnez l'accord propre à la revue. 3. Deux contrôles suivent. La page cherche chaque nombre dans les faits que sa phrase cite : surligné, il est introuvable ; souligné en ambre, il existe dans le dossier mais pas dans un fait cité. Un second agent, qui n'a pas vu le rédacteur, rend un verdict par section. 4. Relisez. « Corriger le texte » ouvre une section ; chaque correction est recontrôlée. Corrigez ou levez les signalements, saisissez votre nom, validez, puis imprimez en PDF ou copiez le texte. Le document dit qui a rédigé, ce que les contrôles ont trouvé, de quand datent les données et quelles hypothèses de prix et d'émission ont servi. Les causes évoquées restent des hypothèses : l'outil ne connaît que le classeur.

**English.** The Review page writes the energy review of the period chosen with the filter, in four steps. 1. The page computes a fact file: consumption, gaps against the baseline, model quality, drift episodes with their estimated cost and emissions, relevant variables outside their usual range. Unfold it to read it: each fact has an identifier. 2. Click “Write the review”. An agent writes seven sections from that file alone and cites, in brackets, the fact behind each figure. In demo mode a script does this without AI; to use an AI, set the provider and the key on the Investigation page, then give the consent specific to the review. 3. Two checks follow. The page looks for each number in the facts its sentence cites: highlighted means not found; an amber underline means it is in the file but not in a cited fact. A second agent, who has not seen the writer, returns a verdict per section. 4. Review it. “Edit the text” opens a section; each correction is checked again. Fix or dismiss the flags, enter your name, validate, then print to PDF or copy the text. The document says who wrote it, what the checks found, how recent the data is and which price and emission assumptions were used. The causes mentioned remain hypotheses: the tool only knows the workbook.

## À vérifier à l'écran

1. Page Revue en mode démonstration : « Rédiger la revue », puis lire les sections. Chaque nombre contrôlé doit être souligné en pointillé, et son infobulle doit montrer le fait d'origine.
2. « Introduire une erreur » : un nombre surligné dans « 3. Performance », la section bordée de rouge, deux signalements, le bandeau en tête du document. Puis « Retirer l'erreur introduite ».
3. « Corriger le texte » sur une section : la zone de saisie tient dans la largeur, le texte corrigé est recontrôlé.
4. Saisir un nom, « Valider la revue », puis « Imprimer ou enregistrer en PDF » : l'aperçu ne doit montrer que le document (ni menu, ni étapes, ni filtres), avec l'annexe sur une nouvelle page. Le vérifier aussi en thème sombre : le texte imprimé doit rester foncé.
5. Largeur de 390 px : pas de défilement horizontal, en particulier dans la liste des faits, la liste des signalements et l'en-tête du document.
6. Bascule en anglais, puis nouvelle rédaction : faits, sections et document en anglais.
7. Avec une vraie clé : l'avis de la revue s'affiche, le bouton reste désactivé jusqu'aux deux accords, et le journal montre le message exact envoyé. C'est le seul moyen de juger les consignes.

## Points où j'ai tranché

- **60 Ko.** `module.js` fait 59 901 octets. Pour tenir, j'ai retiré des notes d'explication sur la page, le total « toutes énergies », le coût estimé de la consommation totale, l'action « renseigner l'erreur du modèle » du script, et la conservation du nom du relecteur.
- **Traductions.** `revT(fr, en)` inscrit chaque texte fixe par `ajouterTraductions` à son premier usage et rend le français, pour ne pas écrire deux fois chaque phrase. Les textes de données (faits, brouillon) sont posés en noeuds de texte, sans passer par `tr()`, pour qu'aucune règle de traduction ne les réécrive.
- **Signalement ou remarque.** Un nombre `hors` (dans le dossier, mal rattaché) est compté et souligné, mais n'est pas un signalement bloquant. Seuls bloquent la validation : nombre introuvable, renvoi inconnu, point bloquant du vérificateur.
- **Consigne des agents en français**, comme celles d'origine ; en anglais, une phrase demande la rédaction en anglais et les faits sont fournis en anglais.
- **Un seul appel par agent** (rédaction, puis vérification), pour ménager les quotas d'une clé gratuite.
