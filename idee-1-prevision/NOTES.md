# Module « Prévision » (idee-1-prevision, préfixe `prev`)

## Ce que fait le module

Il ajoute la page « Prévision » (groupe « Anticipation », identifiant `prevision`). Pour une série (Site ou UES), la page :

1. prévoit la consommation des prochaines périodes, au pas de la série, à 3, 6 ou 12 mois ;
2. donne un atterrissage (réel déjà relevé + prévision) sur l'année civile en cours ou sur 12 mois glissants, en énergie, en euros et en CO2e, avec sa fourchette ;
3. prouve, ou infirme, la méthode par un test rétrospectif à origine glissante, comparé à une méthode naïve ;
4. montre ce que la prévision suppose : les facteurs du scénario central à côté de leur niveau récent, et les coefficients du modèle.

Aucune IA, aucun réseau, aucun stockage : tout est calculé dans la page à partir du classeur. Il n'y a donc pas de mode démonstration à fournir.

## La méthode

- **Équations.** `prevLecture()` relit EQUATION, EQUATION 2, FACTEURS INF et les lignes 10 à 14 du WIKI avec la même logique que `calculer`. Elle recalcule ensuite la référence sur tout l'historique et la compare à `ref` : si l'écart relatif dépasse 1e-9 pour une série, cette série n'est pas prévue et la page le dit. Sur le classeur de test, l'écart est exactement 0 sur 643 points.
- **Scénarios de facteurs.** Pour chaque période à venir, on prend les lignes de l'historique situées à la même place du calendrier (2 semaines de part et d'autre au pas hebdomadaire, 1 mois au pas mensuel, 10 jours au pas journalier ; poids 1 à la même place, décroissant jusqu'à 0). Le modèle est calculé sur chaque ligne entière, ce qui garde le lien entre les facteurs (une semaine d'arrêt a ses propres degrés-jours). Prévision centrale = moyenne pondérée ; scénarios bas et haut = quantiles pondérés 10 % et 90 %.
- **Erreur du modèle.** On retient la plus grande de deux valeurs : celle du classeur (`err` au pas de la série) et celle mesurée sur l'historique connu (écart relatif non dépassé 8 fois sur 10, ramené à un écart-type). La fourchette combine en carré l'écart des scénarios et z × erreur × prévision, avec z = 1,2816 (80 %).
- **Dérive en cours.** C'est l'épisode ouvert de la page Détection, recalculé par `analyserSerie` sur les seules données connues à l'origine. Prolongée, elle multiplie la prévision par 1 + écart relatif de l'épisode. Réglage visible, **désactivé par défaut**.
- **Total.** La fourchette d'un total est la somme des bornes de chaque période (erreurs supposées toutes dans le même sens). Les totaux prévus sont arrondis à deux chiffres significatifs, ou plus finement si leur fourchette est plus étroite.
- **Méthode naïve.** Même période un an plus tôt si elle est connue à l'origine, sinon dernière valeur connue.
- **Test rétrospectif.** Chaque période relevée est une origine possible. On retient l'échéance la plus longue, jusqu'à l'horizon choisi, pour laquelle il reste au moins 6 origines ayant 12 périodes de série et un an de facteurs derrière elles. Mesures : erreur moyenne (somme des écarts absolus ÷ somme des réels), biais, part des réels dans la fourchette, erreur par tranche d'échéance, erreur et couverture sur le total. Verdict « mieux » ou « moins bien » seulement si l'écart d'erreur dépasse 10 % ; sinon « ne fait pas nettement mieux ».

Je n'ai pas pris une autre méthode que celle demandée. Elle a un avantage que la méthode naïve n'a pas : elle prévoit des mois que la série n'a jamais connus (une série commencée en janvier a quand même un automne, par les facteurs).

## Ce que le test dit sur le classeur de test (13 semaines, dérive non prolongée)

| Série | Points | Erreur méthode | Erreur naïve | Biais | Réels dans la fourchette | Verdict |
|---|---|---|---|---|---|---|
| 1, Site électricité | 79 | 7,3 % | 7,8 % | +4 % | 79 % | pas nettement mieux |
| 2, Site gaz | 79 | 15,7 % | 15,6 % | +9 % | 85 % | pas nettement mieux |
| 3, UES électricité | 70 | 32,8 % | 40,7 % | +25 % | 65 % | mieux, fourchette trop étroite |
| 4, UES électricité | 71 | 66,8 % | 66,1 % | +37 % | 29 % | pas mieux, fourchette trop étroite |
| 5, UES gaz | 79 | 39,1 % | 44,3 % | +39 % | 57 % | mieux, fourchette trop étroite |
| 6, UES gaz | 71 | 65,1 % | 66,1 % | +47 % | 69 % | pas mieux, fourchette trop étroite |
| 7, UES gaz | 79 | 37,8 % | 48,3 % | +7 % | 86 % | mieux |
| 8, UES électricité | 78 | 19,0 % | 25,2 % | −6 % | 95 % | mieux, fourchette large |
| 9, UES gaz | 37 | 24,5 % | 31,9 % | +11 % | 73 % | mieux |

Lecture honnête : la méthode bat la méthode naïve sur 5 séries sur 9, et ne fait jamais nettement moins bien. Sur les deux compteurs de site, elle ne fait pas mieux que « même semaine l'an dernier ». Elle prévoit presque partout trop haut : 2024 est en dessous de ce que rejoue le calendrier de 2023. Sur quatre UES, la fourchette est trop étroite, parce que ces séries ont dérivé ou se sont arrêtées ; la page l'écrit en toutes lettres. Prolonger la dérive a dégradé l'erreur sur 6 séries, l'a améliorée sur 1, n'a rien changé sur 2 : d'où le réglage par défaut.

## Limites

- **18 mois d'historique.** Chaque semaine du calendrier n'a été vue qu'une ou deux fois. La fourchette ne contient aucune variabilité d'une année sur l'autre. La page l'affiche avant les graphiques.
- **Le test ne couvre que le printemps et l'été 2024** (périodes S13 à S40) : il faut un an de facteurs avant chaque origine. L'hiver n'est pas testé. À 6 ou 12 mois, le test s'arrête vers 23 semaines d'avance, avec 6 prévisions qui se chevauchent ; la page dit que le reste n'est pas vérifié.
- **Les prévisions testées se chevauchent** : 16 origines mais 28 semaines distinctes. Les pourcentages ne sont pas des mesures indépendantes.
- **Niveau d'activité.** Le scénario rejoue le calendrier passé. Il ne connaît ni le plan de production ni la météo à venir. La carte « Ce que la prévision suppose » sert à voir un décalage.
- **Facteurs postérieurs à la dernière consommation.** Dans le classeur de test, les lignes de facteurs après le 30/09/2024 valent 0 : ce sont des cases vides. Le module n'utilise donc aucun facteur daté après `modele.fin`. Si un classeur contenait de vrais facteurs futurs (plan de production), ils seraient ignorés.
- **Saisons.** Les dates d'été du WIKI sont saisies année par année. Pour une période à venir au-delà de la dernière saison saisie, le module reporte les mêmes dates d'une année sur l'autre.
- **Pas journalier et mensuel.** Le code les gère, et un classeur fabriqué teste le pas mensuel. Le pas journalier n'est pas testé, et il ignore le jour de la semaine.
- **Série qui n'est plus relevée.** La prévision part de la dernière période de la série, même si elle est ancienne.

## Points où j'ai tranché

1. **Le champ `cible`.** `calculer` le lit (WIKI ligne 5, « Weekly target ») mais aucune page ne s'en sert, et le mode d'emploi web le dit « non utilisé ». Dans le classeur de test il vaut 0,2 pour une seule série, sans unité : ce n'est pas une consommation. Le module ne le compare donc à rien et l'explique dans la note de l'atterrissage. Il ne le compare que s'il vaut entre 0,25 et 4 fois la consommation hebdomadaire médiane, lu en kWh par semaine ; cette lecture est alors écrite dans la note. Ce cas n'existe pas dans le classeur de test : il est testé avec une valeur fabriquée.
2. **Dérive non prolongée par défaut**, au vu du test (voir plus haut). La page donne l'effet du réglage sur l'atterrissage et sur l'erreur du test.
3. **Erreur du modèle = la plus grande des deux** (classeur, mesure). Cela élargit la fourchette de plusieurs séries. La série sans erreur dans le classeur est prévue grâce à la mesure.
4. **Horizon refusé** quand il dépasse le nombre de périodes de la série (37 semaines : 12 mois refusés), quand la série a moins de 12 périodes, ou quand les facteurs couvrent moins d'un an. Le bouton est désactivé, avec le motif en infobulle et dans une note.
5. **Année civile** : une semaine appartient à l'année de sa date, comme dans `seaux`. L'atterrissage annuel va toujours jusqu'au 31 décembre, quel que soit l'horizon choisi.
6. **12 mois glissants** : 52 semaines (ou 12 mois, 365 jours) qui finissent à la fin de l'horizon choisi.
7. **Graphique propre au module** (`prevGraph`), bâti sur `cadre`, `survol` et `montrerTip`. `graphCourbes` ne sait pas tracer de repère vertical, et l'ambre de ses marques est réservé à « en cours ».
8. **Traductions des textes longs** déclarées là où ils sont écrits, par `prevT(fr, en)`, qui appelle `ajouterTraductions` au premier passage. Raison : tenir dans 60 Ko sans écrire chaque phrase française deux fois. Le fichier fait 59,7 Ko.
9. **Groupe « Anticipation »** traduit par « Outlook ». Si le module Simulateur choisit un autre mot, le dernier chargé l'emporte : à harmoniser à l'assemblage.
10. **Aperçus visuels.** Je n'ai pas utilisé le navigateur intégré. J'ai fait des captures avec Chrome en ligne de commande (sans fenêtre, profil temporaire dans mon dossier, effacé ensuite) sur la page assemblée. Si ce n'était pas souhaité, dites-le : le banc seul ne voit pas la mise en page.

## Ce qui est testé (80 vérifications, `test.js`)

- La relecture des équations redonne `ref` sur 643 points (tolérance 1e-9 relative, justifiée dans le test : mêmes opérations dans le même ordre, l'égalité exacte est attendue) ; une constante faussée de 1 % est détectée et la série refusée.
- Quantile pondéré, poids du calendrier, dates, libellés, modèle simple et saisonnier, report des saisons, arrondi : cas dont la réponse est connue.
- 26 prévisions réelles : bornes ordonnées, jamais plus étroites que l'erreur du modèle, fourchette cumulée croissante, mêmes valeurs d'un horizon à l'autre.
- Dérive : même épisode et même écart que la page Détection ; effet multiplicatif.
- **Aucune fuite** : pour les 248 prévisions du test rétrospectif, tout ce qui est daté après l'origine (consommations, références, facteurs) est remplacé par des valeurs absurdes ; la prévision et la méthode naïve restent identiques au chiffre près. Une contre-épreuve vérifie que l'empoisonnement change bien le résultat quand il touche le passé.
- Mesures du test rétrospectif recalculées à la main à partir des paires ; règle de la méthode naïve refaite à la main.
- Atterrissage annuel et glissant recalculés à la main ; objectif non comparé, puis comparé avec une valeur fabriquée.
- 216 rendus sur le classeur réel (9 séries × 3 horizons × dérive × atterrissage × 2 langues), sans erreur ; en anglais, aucun mot français hors noms de données ; clics sur les réglages ; bouton désactivé inerte ; aucune coordonnée invalide dans les tracés.
- Classeurs fabriqués : série qui suit exactement son modèle (prévision à 0,4 % près, test rétrospectif couvrant 52 semaines avec 3 ans d'historique) ; séries de 8, 10 et 14 points ; série mensuelle sur grille hebdomadaire ; facteurs de 30 semaines.
- Aucun appel réseau. `outillage/test-base.js` passe aussi sur la page assemblée.

## Ce qui n'est pas testé

- L'apparence dans le banc (faux DOM). Vue seulement sur mes captures : thème clair et sombre à 1 280 px, thème sombre à 390 px, anglais à 1 100 px. Pas d'essai au doigt, pas d'infobulle de graphique survolée, pas d'impression.
- Le pas journalier ; un classeur daté en système 1904 ; des dates non triées.
- La page avec les cinq autres modules assemblés.
- La justesse de la prévision en hiver, et au-delà de 23 semaines : les données ne le permettent pas.

## Changements du coeur souhaités (le module fonctionne sans eux)

1. **Débordement des cartes à 390 px, sur toutes les pages existantes.** La grille à 12 colonnes a 11 gouttières de 36 px, soit 396 px. Constaté sur la page Détection. Dans le style, remplacer
   `@media (max-width: 900px) { .carte.demi { grid-column: span 12; } }`
   par
   `@media (max-width: 900px) { .grille { grid-template-columns: minmax(0, 1fr); } .carte, .carte.demi { grid-column: auto; } }`.
   Mon module applique la même règle à sa propre grille (`.prev-grille`), où je l'ai vue fonctionner. Je ne l'ai pas essayée sur les pages du coeur.
2. **`segments()` sans état désactivé.** J'ai écrit `prevSegments`. Le Simulateur en aura sans doute besoin aussi : un champ `motif` par option dans `segments` éviterait deux copies.
3. **Coefficients non exposés par `calculer`.** `prevLecture` les relit. Si un autre module fait de même, mieux vaut que `calculer` rende `equations` dans le modèle.

## Mode d'emploi (à ajouter au guide)

**Français.** La page Prévision estime la consommation des 3, 6 ou 12 prochains mois d'une série. Elle calcule le modèle de référence de la série avec les facteurs influents relevés aux mêmes semaines des années passées, puis ajoute l'erreur du modèle pour donner une fourchette qui vise 80 % des cas. Elle additionne le réel déjà relevé et la prévision pour donner un atterrissage, sur l'année civile ou sur 12 mois glissants, en énergie, en euros et en CO2e. Le réglage « Dérive en cours » dit si la dérive détectée se prolonge ou si la consommation revient au niveau du modèle. La carte « La preuve » refait la prévision dans le passé, en cachant la fin de l'historique, et compare au réel : lisez-y l'erreur moyenne, le biais, la part des réels tombés dans la fourchette, et la comparaison avec une méthode naïve (même période un an plus tôt). Si la méthode ne fait pas mieux, ou si la fourchette est trop étroite, la page l'écrit. Avec moins de deux ans de données, la fourchette ne dit rien d'une année très différente, et un horizon peut être refusé.

**English.** The Forecast page estimates a series' consumption over the next 3, 6 or 12 months. It computes the series' baseline model with the relevant variables recorded in the same weeks of past years, then adds the model error to give a range that aims at 80% of cases. It adds the actuals already recorded to the forecast to give a landing, over the calendar year or over rolling 12 months, in energy, euros and CO2e. The “Ongoing drift” setting says whether the detected drift continues or consumption returns to the model level. The “Proof” card redoes the forecast in the past, hiding the end of the history, and compares it with actuals: read there the average error, the bias, the share of actuals that fell within the range, and the comparison with a naive method (same period a year earlier). If the method does no better, or if the range is too narrow, the page says so. With less than two years of data, the range says nothing about a very different year, and a horizon may be refused.

## À vérifier à l'écran

1. Menu : « Prévision » sous « Anticipation », avant « Aide » ; l'icône se lit.
2. Série du site, 3 mois : la phrase de tête, les six tuiles, l'encadré « Historique court ». Les chiffres de tête sont arrondis (7,2 GWh et non 7,23).
3. Graphique : le repère vertical sépare bien le réel de la prévision ; tirets et bande lisibles en clair et en sombre ; survol d'une période passée puis d'une période prévue.
4. « Voir le tableau » sur les deux graphiques.
5. Passer à 12 mois : la phrase de tête dit que le test s'arrête vers 23 semaines.
6. « Prolongée » sur une série en dérive : l'atterrissage bouge, la ligne « si la dérive n'est pas prolongée » apparaît, le tableau de la preuve change de colonne choisie.
7. La série la plus courte (37 points) : bouton « 12 mois » grisé, infobulle et note de refus.
8. Une série où la fourchette est trop étroite (série 4) : la phrase « Lisez-la comme un minimum » est bien visible.
9. Anglais : bascule EN, relire la page entière.
10. Téléphone (390 px) : pas de défilement horizontal de la page ; les tableaux défilent dans leur cadre.

## Vague 2

Page allégée : la réponse calculée en tête, le graphique et les réglages courants ensuite, le reste (méthode, limites, tableaux, réglages rares) sous le composant commun `repli` ; textes d'IA renvoyés aux réglages d'IA. Détail, mesures avant et après et tests : `idee-14-allegement/NOTES.md`.
