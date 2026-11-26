# 3 — Prix de l'énergie, facteurs d'émission et prix du carbone

Recherche documentaire du 25 novembre 2026. Aucun fichier de données n'a été téléchargé, aucune inscription, aucune condition acceptée.

**Comment lire ce rapport**

- Chaque chiffre est suivi de la page où il a été lu et de la date de la donnée. « Lu le 25/11/2026 » s'applique à tout le rapport.
- « Non vérifié » signifie que je n'ai pas pu lire le point sur la page de la source.
- Les pages ont été lues par un outil de lecture qui résume le contenu ; les valeurs marquées **(API)** ont été lues directement dans la réponse brute de l'interface de la source, sans résumé intermédiaire.
- **Test « appel depuis un navigateur »** : fait depuis une page web tierce (origine `https://example.org`) avec une requête minimale par source (une ligne, ou un agrégat calculé par le serveur). « CORS ouvert (testé) » veut dire que la page tierce a pu lire la réponse. Non testé depuis un fichier ouvert en `file://` (origine `null`) : à vérifier dans l'outil réel.
- Deux PDF (Banque de France, CRE) ont été enregistrés automatiquement par l'outil de lecture dans le dossier technique de la session lors d'une tentative de lecture ; ils n'ont pas pu être lus et ne sont pas utilisés.

---

## 0. L'essentiel

1. **Les quatre valeurs par défaut sont fidèles à leur source.** Trois sont confirmées à la source primaire ; le facteur électricité 0,0461 n'est confirmé que par une source secondaire (la Base Empreinte exige un compte).
2. **Mais les deux prix 2025 ne décrivent plus le marché de fin 2026.** Le gaz de gros a triplé en un an (TTF 87,71 €/MWh, +200,55 % sur un an, page Trading Economics datée du 26/11/2026) ; le gaz à terme pour 2027 au PEG cote 69,31 €/MWh, soit plus que le prix **livré** moyen de 2025 (65,7). L'électricité spot France est à 209 €/MWh en moyenne sur novembre 2026 (mois en cours, Selectra d'après EPEX). Une prévision à 3–12 mois chiffrée à 65,7 et 148,8 €/MWh sous-estimerait l'enjeu en euros, surtout pour le gaz.
3. **Le prix moyen « toutes entreprises » cache un écart de 1 à 3,5 selon la taille du site** (Eurostat, 1er semestre 2026, électricité France : de 72,2 à 252,7 €/MWh). Un site industriel de 2 à 20 GWh/an paie 123,9 €/MWh, pas 148,8.
4. **Six sources publiques répondent directement à une page web, sans clé** (Eurostat, INSEE, ODRÉ/RTE, ADEME, data.gouv.fr, SDES Dido). Les prix de gros à terme (EEX) n'ont pas d'accès libre réutilisable.

---

## 1. Contrôle des quatre valeurs par défaut

| # | Valeur de l'outil | Valeur lue | Page | Verdict |
|---|---|---|---|---|
| 1 | Électricité **148,8 €/MWh**, « prix moyen des entreprises en France en 2025, hors TVA (SDES) » | **148,8 €/MWh** hors TVA, −9,6 % sur un an. Champ : tous clients non résidentiels. Publié le 23/07/2026. | SDES, « Prix de l'électricité en France et dans l'Union européenne en 2025 » — https://www.statistiques.developpement-durable.gouv.fr/prix-de-lelectricite-en-france-et-dans-lunion-europeenne-en-2025 | **Confirmée.** Valeur plus récente : **147,4 €/MWh au 1er semestre 2026** (Eurostat `nrg_pc_205`, France, toutes tranches, hors TVA et taxes récupérables, mise à jour du 19/10/2026) **(API)**. |
| 2 | Gaz **65,7 €/MWh PCS**, « prix moyen des entreprises en France en 2025, hors TVA (SDES) » | **65,7 €/MWh PCS** hors TVA, +1,5 % sur un an. Champ : tous clients professionnels. Publié le 23/07/2026. | SDES, « Prix du gaz naturel en France et dans l'Union européenne en 2025 » — https://www.statistiques.developpement-durable.gouv.fr/prix-du-gaz-naturel-en-france-et-dans-lunion-europeenne-en-2025 | **Confirmée**, unité PCS confirmée. Pas de moyenne « toutes tranches » plus récente pour la France (absente d'Eurostat). Par tranche, 1er semestre 2026 : voir § 2.2. **Périmée pour une prévision** : voir § 2.3. |
| 3 | Électricité **0,0461 kgCO2e/kWh**, « mix moyen de consommation 2025, amont compris (Base Empreinte de l'ADEME) » | **0,0461**, libellé « Electricité/2025 - mix moyen/consommation », lissage des années 2022 à 2025. Unité non affichée sur la page. | Source secondaire : documentation Nos Gestes Climat (modèle publicodes de l'incubateur de l'ADEME) — https://nosgestesclimat.fr/documentation/commun/mix-électrique/empreinte-carbone | **Confirmée par une source secondaire seulement.** Source primaire non lue : la Base Empreinte renvoie « Pour accéder à cette page, veuillez-vous inscrire ou vous connecter ». La version ouverte (Base Carbone V23.6, données du 03/07/2025) s'arrête à **2024 : 0,0519** (identifiant 43642) **(API)**. |
| 4 | Gaz **0,215 kgCO2e/kWh PCS**, « Base Carbone de l'ADEME, amont compris : 0,239 kgCO2e par kWh PCI » | **0,215 kgCO2e/kWh PCS** (identifiant 37133) = combustion 0,181 + amont 0,0344. **0,239 kgCO2e/kWh PCI** (identifiant 37132) = combustion 0,201 + amont 0,0382. Libellé « Gaz naturel - 2022, mix moyen, consommation », France continentale, modifié le 15/03/2023. | ADEME, Base Carbone V23.6 en données ouvertes — https://data.ademe.fr/datasets/base-carboner (interface `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines`) | **Confirmée**, les deux valeurs et la mention « amont compris ». Millésime **2022** ; le champ « période de validité » de la fiche affiche « 28/02/2025 » alors que le statut reste « Valide générique ». Existence d'un millésime plus récent dans la Base Empreinte : non vérifié. |

Repères utiles pour situer la valeur n° 3 (même base, mêmes libellés « mix moyen, consommation », France continentale) **(API)** : 2021 : 0,0569 ; 2022 : 0,0520 ; 2023 : 0,0580 ; 2024 : 0,0519. Le commentaire de la fiche 2024 indique un lissage sur 2021–2024 et un amont couvrant l'amont des combustibles, l'amortissement des centrales et les émissions annexes de fonctionnement.

---

## 2. Prix de l'énergie

### 2.1 Tableau des sources de prix

| Source | Ce qu'elle donne | Unités et périmètre | Fréquence, profondeur | Appel depuis une page web | Licence, attribution |
|---|---|---|---|---|---|
| **SDES — enquête Transparence des prix** (pages annuelles et semestrielles) | Prix moyen payé par les entreprises, France ; comparaison UE | €/MWh hors TVA ; gaz en **PCS** ; « ensemble des clients professionnels » ; pour l'électricité, accise et CTA incluses (non précisé sur la page gaz) | Annuelle (juillet N+1) et semestrielle (S1 2025 publié le 20/11/2025). Page S1 2026 : pas encore en ligne (erreur 404 le 25/11/2026) | Non (page + fichier xlsx par publication) | Non indiquée sur les pages lues |
| **SDES — Dido** (catalogue de données) | « Conjoncture mensuelle de l'énergie » (mise à jour 06/11/2026). Contenu exact des séries de prix : non vérifié | — | Mensuelle | **CORS ouvert (testé)**, sans clé — `data.statistiques.developpement-durable.gouv.fr/dido/api/v1/` | Licence Ouverte (`fr-lo`, lu dans le catalogue) |
| **Eurostat `nrg_pc_205`** (électricité, non résidentiel) | Prix par pays et par **tranche de consommation** IA à IG, plus « toutes tranches » | €/kWh ; trois niveaux de taxes dont « hors TVA et autres taxes récupérables » (`X_VAT`) | Semestrielle ; dernier point 2026-S1, mis à jour le 19/10/2026 ; séries depuis 2007 | **CORS ouvert (testé)**, sans clé, JSON-stat — `ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_205` | Réutilisation libre, y compris commerciale, en citant la source : « Source: Eurostat, [code], [date d'accès] » (page copyright Eurostat) |
| **Eurostat `nrg_pc_203`** (gaz, non résidentiel) | Idem, tranches I1 à I6 | €/kWh ; tranches définies en GJ ; base calorifique (PCS) **non vérifiée** dans les métadonnées (pages 404) ; pas de moyenne « toutes tranches » pour la France | Semestrielle ; dernier point 2026-S1 ; tranches actuelles depuis 2007 d'après l'intitulé du jeu (profondeur exacte non vérifiée) | **CORS ouvert (testé)**, sans clé | Idem |
| **INSEE — indices de prix de production (BDM)** | Indices **mensuels** : gaz vendu aux entreprises (série 010764296), électricité production et commerce (010763990), vapeur et air conditionné (010763994) | Indice sans unité (base non lue) ; l'indice électricité couvre tout le commerce d'électricité, pas seulement les entreprises ; traitement des taxes non vérifié | Mensuelle, décalage d'un mois et demi (dernier point septembre 2026, provisoire, mis à jour le 30/10/2026) | **CORS ouvert (testé)**, sans clé, mais réponse en **XML SDMX** — `bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbank}` ; 400 séries au plus par requête | Service présenté comme gratuit ; conditions de réutilisation non lues |
| **CRE** | Prix repère de vente de gaz (mensuel, **clients résidentiels**, TTC) ; observatoires et bulletins des marchés de gros (PDF trimestriels) ; page « Open Data » | Prix repère : 194,90 €/MWh TTC au 01/11/2026, 206,26 au 01/12/2026 (presse citant la CRE) — non transposable à un industriel | Mensuelle (prix repère) ; trimestrielle (gros) | Non vérifié (pas d'interface repérée) ; jeux « réutilisables librement » d'après la page Open Data | Licence non nommée sur la page lue |
| **energy-charts.info (Fraunhofer ISE)** | Prix **jour pour le lendemain** par zone, dont France | €/MWh, pas de 15 minutes | Quotidienne ; 2 requêtes par minute | **Échec depuis la page tierce** (deux essais, cause non déterminée : CORS ou filtrage). Fonctionne côté serveur, sans clé | Champ `license` de la réponse France : « CC BY 4.0 […] from Bundesnetzagentur \| SMARD.de » ; la documentation prévient que certaines zones sont réservées à un usage privé |
| **Ember — European wholesale electricity price data** | Prix jour pour le lendemain horaires, journaliers, **mensuels** par pays | €/MWh ; moyennes pondérées par la charge ; source ENTSO-E | Mise à jour mensuelle (page datée du 25/11/2026) | Fichiers CSV à télécharger ; pas d'interface mentionnée | CC BY 4.0 (pied de page du site) |
| **ENTSO-E Transparency Platform** | Prix jour pour le lendemain, production par filière | €/MWh, horaire ou 15 minutes | Quotidienne | **Échec depuis la page tierce** sans jeton. Jeton gratuit sur inscription (d'après résultats de recherche ; page d'aide refusée, 403) | Non vérifié ; la réutilisation peut dépendre du propriétaire de la donnée |
| **EEX** (électricité à terme France, gaz PEG, quotas) | Cours de règlement des contrats mensuels, trimestriels, calendaires | €/MWh hors taxes ; base PCS du gaz : non vérifiée | Quotidienne | Pas d'accès libre ; offre « DataSource » sur abonnement | « for information purposes only » ; **republication systématique interdite sans accord** (page Market Data Hub) |
| **Selectra, Trading Economics** (relais) | Reprennent les clôtures EEX, EPEX, TTF | — | Quotidienne | Non | Sites commerciaux ; à citer comme relais, pas comme source |
| **DGEC — prix des produits pétroliers** | Fioul domestique, gazole non routier, carburants ; note hebdomadaire (dernière : 20/11/2026) | HTT et TTC ; c€/l ; fioul lourd et propane **absents** de la page de la base | Hebdomadaire (prix du vendredi, publié le lundi) ; fichier depuis janvier 2020 | Non (fichier xlsx) | Licence Ouverte 2.0 (« sauf mention contraire ») |
| **Commission européenne — Weekly Oil Bulletin** | Prix des produits pétroliers, 27 pays, avec et sans taxes | Produits de chauffage et unités : non vérifiés sur la page | Hebdomadaire ; historique depuis 2005 | Non (fichiers xlsx) | Non indiquée sur la page |
| **Réseaux de chaleur** (SDES, Fedene, Amorce) | Enquête annuelle : 1 041 réseaux, 28,3 TWh livrés en 2024 (page SDES). **Prix moyen de la chaleur : non trouvé** sur la page | — | Annuelle | Non | — |

### 2.2 Ce que disent les tranches de consommation (Eurostat, France, hors TVA et taxes récupérables) **(API)**

Électricité, €/MWh :

| Tranche (consommation annuelle) | 2025-S1 | 2025-S2 | 2026-S1 |
|---|---|---|---|
| Toutes tranches | 155,6 | 141,4 | **147,4** |
| IA : moins de 20 MWh | 251,2 | 268,8 | 252,7 |
| IB : 20 à 499 MWh | 223,4 | 194,6 | 204,9 |
| IC : 500 à 1 999 MWh | 166,1 | 153,4 | 156,7 |
| ID : 2 000 à 19 999 MWh | 129,6 | 121,2 | **123,9** |
| IE : 20 000 à 69 999 MWh | 99,5 | 85,3 | 97,9 |
| IF : 70 000 à 149 999 MWh | 82,0 | 71,5 | 79,4 |
| IG : 150 000 MWh et plus | 69,3 | 61,4 | 72,2 |

La moyenne des deux semestres 2025 « toutes tranches » (148,5) recoupe les 148,8 du SDES.

Gaz, €/MWh (tranches définies en GJ ; conversion en MWh faite par moi, 1 GJ = 0,2778 MWh) :

| Tranche | 2025-S1 | 2025-S2 | 2026-S1 |
|---|---|---|---|
| I1 : moins de 1 000 GJ (≈ 278 MWh) | 102,3 | 111,5 | 95,5 |
| I2 : 1 000 à 9 999 GJ (≈ 0,3 à 2,8 GWh) | 87,9 | 91,6 | 79,9 |
| I3 : 10 000 à 99 999 GJ (≈ 2,8 à 28 GWh) | 69,7 | 62,9 | **60,6** |
| I4 : 100 000 à 999 999 GJ (≈ 28 à 278 GWh) | 50,5 | 44,8 | 47,0 |
| I5 : 1 à 4 millions de GJ | 46,3 | 40,7 | 41,6 |
| I6 : 4 millions de GJ et plus | 43,5 | 36,0 | 39,4 |

Décomposition, seule lue : en 2024, le prix non résidentiel de l'électricité était de 164,6 €/MWh, dont environ 121 de fourniture, 31 de réseau et 13 de taxes (SDES, page 2024, publiée le 09/07/2025). Pour 2025 la page indique seulement que la fourniture baisse de 20,5 % ; la décomposition chiffrée est dans le fichier joint, non ouvert.

### 2.3 Prix de gros : le marché a décroché des valeurs 2025

| Donnée | Valeur | Date | Page |
|---|---|---|---|
| Gaz TTF, mois proche | 87,71 €/MWh ; −8,47 % sur un mois ; **+200,55 % sur un an** | page datée du 26/11/2026 | https://fr.tradingeconomics.com/commodity/eu-natural-gas |
| Gaz PEG à terme (règlement EEX repris par Selectra) | décembre 2026 : 90,21 ; T1 2027 : 88,71 ; T2 2027 : 67,84 ; T3 2027 : 62,49 ; **année 2027 : 69,31** ; année 2028 : 38,62 | clôture du 24/11/2026 | https://selectra.info/energie/actualites/prix-gaz/2026-10-22 (page mise à jour en continu) |
| Gaz PEG, contrat année 2027, moyenne mensuelle | 34,84 en juin 2026 → 68,82 en octobre 2026 | 2026 | même page |
| Électricité France, jour pour le lendemain | 190 €/MWh le 21/11 ; moyennes mensuelles : septembre 143, octobre 166, **novembre 209** (mois en cours) | novembre 2026 | https://selectra.info/energie/actualites/prix-electricite/2026-11-21 (source citée : EPEX SPOT) |
| Électricité France, jour pour le lendemain | moyenne ≈ 245 €/MWh, min 199,45, max 321,51 (moyenne calculée par l'outil de lecture) | 24/11/2026 | `api.energy-charts.info/v2/price?bzn=FR` |
| Électricité France à terme (EEX repris par Selectra), base / pointe | **année 2027 : 114,12 / 120,43** ; année 2028 : 62,61 / 74,79 ; année 2029 : 57,58 ; T1 2027 : 178,42 / 198,25 | clôture du 20/11/2026 | même page Selectra ; mêmes 114,12 et 62,61 sur https://www.optima-energie.fr/blog/actualites/prix-electricite-evolution/ |
| Indice INSEE, gaz vendu aux entreprises (010764296) | moyenne 2025 : 222,0 ; juin 2026 : 248,9 ; **septembre 2026 : 290,9** (provisoire), soit **+31 %** sur la moyenne 2025 (calcul fait par moi) | mis à jour le 30/10/2026 | `bdm.insee.fr` **(API)** |
| Indice INSEE, électricité production et commerce (010763990) | moyenne 2025 : 127,9 ; septembre 2026 : 124,6 (provisoire), soit −3 % | idem | idem **(API)** |
| Indice INSEE, vapeur et air conditionné (010763994) | moyenne 2025 : 119,3 ; septembre 2026 : 155,8 (provisoire), soit **+31 %** | idem | idem **(API)** |

Contexte lu : le SDES précise que sa moyenne 2025 des produits pétroliers porte sur la période « avant le déclenchement de la guerre en Iran » (page du 16/06/2026) ; Trading Economics mentionne des expéditions de GNL depuis le golfe Persique perturbées et des stockages européens sous 69 %. La courbe à terme anticipe une détente en 2028 (gaz 38,62, électricité 62,61).

### 2.4 Ce qu'un outil peut honnêtement en tirer

- **Le meilleur prix futur est celui du contrat du site.** La plupart des sites industriels ont un prix fixé ou partiellement fixé ; aucune source publique ne le connaît. Les valeurs par défaut ne sont qu'un repli, à dire tel quel.
- **Un prix à terme n'est pas une prévision** : c'est le prix auquel on peut se couvrir aujourd'hui. Il est défendable comme scénario central pour la part **non couverte** de la consommation, et seulement pour la composante énergie. Il faut y ajouter l'acheminement, les taxes et la marge, qui ne suivent pas le marché de gros.
- **Méthode simple et traçable**, sans prétendre prévoir : prix futur = prix de référence 2025 + (prix à terme d'aujourd'hui − prix à terme d'avant la hausse). Illustration pour le gaz, calcul fait par moi à partir des chiffres ci-dessus : 65,7 + (69,31 − 34,84) ≈ **100 €/MWh PCS** pour 2027. Ce n'est pas une valeur à coder en dur : elle vieillit en quelques jours.
- **Méthode par indice, automatisable** : prix de référence 2025 × (dernier indice INSEE ÷ moyenne 2025 de l'indice). Pour le gaz : 65,7 × 290,9 ÷ 222,0 ≈ **86 €/MWh PCS** en septembre 2026 (calcul fait par moi). Limite : l'indice a un mois et demi de retard et ne contient pas encore la hausse d'octobre–novembre.
- **Fourchette plutôt que chiffre** : bas = référence officielle (prix fixé avant la hausse) ; central = référence indexée INSEE ; haut = référence + écart des prix à terme. Pour l'électricité, la même logique donne un haut vers 170 €/MWh (fourniture 2025 ≈ 96, déduite de 121 × 0,795, remplacée par 114 ; calcul fait par moi, fragile car la décomposition 2025 n'a pas été lue).
- **Les cours EEX ne peuvent pas être repris automatiquement** (conditions d'utilisation) : l'utilisateur les saisit, ou l'outil se limite aux sources publiques.
- **Vapeur** : pas de prix public. La dériver du combustible (prix du gaz ÷ rendement de la chaudière) ou utiliser l'indice INSEE 010763994 comme indicateur de tendance.
- **Fioul, propane** : la base DGEC couvre le fioul domestique et le gazole non routier chaque semaine ; propane et fioul lourd non trouvés dans cette base (le SDES donne seulement des variations 2025 : fioul domestique −6 % environ, propane stable).

---

## 3. Facteurs d'émission

### 3.1 Tableau des sources

| Source | Ce qu'elle donne | Périmètre | Fréquence, profondeur | Appel depuis une page web | Licence |
|---|---|---|---|---|---|
| **ADEME — Base Carbone en données ouvertes** (V23.6) | Électricité mix moyen 2008–2024 et par usage (dernier millésime par usage lu : 2023) ; gaz ; fioul ; propane ; réseaux de chaleur un par un | **Amont compris**, détail combustion / amont disponible ; mix de **consommation** ; lissage sur 4 ans pour l'électricité | Irrégulière ; données du 03/07/2025 ; 18 616 lignes | **CORS ouvert (testé)**, sans clé — `data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines` | Licence Ouverte Etalab 2.0 |
| **ADEME — Base Empreinte** (site) | Version courante, dont l'électricité 2025 | Idem | « Nouvelle version de la Base Empreinte (v1.2) » le 31/08/2026 (page d'accueil) | **Non** : consultation « requiert la création d'un compte » (gratuit) | Non lue |
| **RTE éCO2mix — `eco2mix-national-tr` et `eco2mix-national-cons-def`** (ODRÉ) | Champ `taux_co2` en g/kWh, pas de 15 minutes | **Émissions directes de combustion uniquement**, rapportées au kWh **produit** en France, hors imports, hors amont (page méthode RTE) | Temps réel (15 min) ; consolidé puis définitif l'année suivante ; quota de 50 000 appels par mois | **CORS ouvert (testé)**, sans clé — `odre.opendatasoft.com/api/explore/v2.1/` ; agrégats par mois calculables côté serveur | Licence Ouverte v2.0, éditeur RTE |
| **RTE — `part-enr-intensite-ges-conso-tr`** (ODRÉ, nouveau) | Intensité en émissions **directes** de l'électricité **consommée** (imports compris) et part renouvelable | Directes, consommation, France continentale hors Corse | Horaire, depuis le 01/01/2021 ; mis à jour chaque heure (dernier point lu : 25/11/2026 23 h) | **CORS ouvert (testé)**, sans clé | Licence Ouverte v2.0, éditeur RTE |
| **Electricity Maps** | Intensité horaire par zone, méthode de traçage des flux ; France 2025 : 32,0 gCO2éq/kWh | Consommation, flux tracés ; cycle de vie : non précisé sur la page lue | Horaire | Réponse lisible depuis la page tierce mais **401 sans clé**. Offre gratuite limitée au **non commercial** (d'après résultats de recherche ; conditions refusées à la lecture, 403) | Non vérifiée |
| **Agence européenne pour l'environnement** | Intensité GES de la production d'électricité, par pays | **Directes**, hors amont, nucléaire et renouvelables à zéro | Annuelle ; page publiée le 09/11/2026 ; valeurs dans un graphique non lisible | Non (pas d'interface simple repérée) | Non lue |
| **AIB — European Residual Mixes** | Mix résiduel par pays (approche « marché ») ; 2025 : mélange d'attributs européen 468,4 gCO2/kWh, moyenne des mix résiduels 435 | « direct CO2 emissions from electricity production » ; **valeur France non lue** | Annuelle ; édition 2025 publiée le 28/05/2026 | Non (PDF et xlsx) | Non précisée |
| **AIE — Emissions Factors** | Facteurs par pays, électricité et chaleur | Directs ; l'amont est un produit séparé | Annuelle (septembre) ; décalage de deux ans | Non | **Payant**, licence par utilisateur |
| **Réseaux de chaleur — arrêté « DPE » et France Chaleur Urbaine** | Contenu CO2 par réseau, direct et en cycle de vie, taux d'énergies renouvelables et de récupération | Par réseau ; arrêté du 30/03/2026 signalé par la presse (non lu) ; la page de l'API cite encore l'arrêté de 2023 | Annuelle, deux ans de décalage environ | API annoncée ouverte, non testée | Licence Ouverte 2.0 (site) |

### 3.2 Valeurs lues, autres énergies (Base Carbone V23.6, France continentale, amont compris) **(API)**

| Énergie | Valeur | Unité | Identifiant | Remarque |
|---|---|---|---|---|
| Fioul domestique | 0,325 | kgCO2e/kWh **PCI** | 14085 | fiche modifiée en 2014 |
| Fioul lourd (commercial) | 0,324 | kgCO2e/kWh PCI | 14099 | 2015 |
| Propane (maritime inclus) | 0,271 | kgCO2e/kWh PCI | 13558 | 2019 |
| Électricité 2023, usage « Industrie base » | 0,0570 (méthode moyenne) ; 0,0442 (méthode saisonnalisée) | kgCO2e/kWh | 43291 ; 43290 | dernier millésime par usage lu |
| Électricité 2023, usage « chauffage » | 0,0645 ; 0,115 | kgCO2e/kWh | 43277 ; 43276 | |
| Réseau de chaleur | de 0,004 à 0,141 sur cinq fiches lues | kgCO2e/kWh | — | une fiche par réseau (2 397 résultats) |

### 3.3 Approche « localisation » et approche « marché »

- **Localisation** : on applique le facteur moyen du réseau où l'on consomme (ADEME mix moyen, AEE, AIE). C'est ce que fait l'outil, et c'est ce qu'attend un bilan réglementaire français.
- **Marché** : on applique le facteur du contrat (garanties d'origine, contrat d'achat direct) et, à défaut, le **mix résiduel** (AIB), nettement plus carboné que le mix moyen. Un outil qui affiche un seul chiffre doit dire lequel.
- La page du GHG Protocol sur le Scope 2 ne redonne pas les définitions ; elle indique qu'une consultation publique s'est tenue du 20/10/2025 au 31/01/2026. Un billet du 01/08/2025 annonçait des textes finalisés « mid-2026 » et la norme complète fin 2027 ; état actuel non vérifié.

### 3.4 L'intensité horaire ou en temps réel est-elle utile au pas hebdomadaire ou mensuel ?

Chiffres lus **(API)**, moyennes simples des points :

- Production, directes (`taux_co2`) : 2025 de 8,5 g/kWh (septembre) à 31,0 (février) ; novembre 2026 (en cours) 40,7.
- Consommation, directes (nouveau jeu RTE) : années 2021 : 38,0 ; 2022 : 60,3 ; 2023 : 31,6 ; 2024 : 20,5 ; 2025 : 18,7 ; mois 2026 de 7,3 (mai) à 35,3 (janvier).
- RTE, bilan 2025 : 19,6 gCO2e/kWh en direct, 29,0 en cycle de vie (https://analysesetdonnees.rte-france.com/en/annual-review-2025/ghg-emissions) ; la page « chiffres clés » affiche 17.
- ADEME 2025 : 46,1 (amont compris, consommation, lissé sur quatre ans).

Conclusion : **utile comme éclairage, pas comme facteur de référence.** L'écart entre mois va de 1 à 4 ou 5, donc un facteur mensuel change réellement le CO2e d'un mois d'hiver. Mais l'écart de **périmètre** (18,7 direct contre 46,1 amont compris) est plus grand que l'écart saisonnier : mélanger les deux fausserait les totaux. Si l'outil propose l'option, il faut la présenter comme une variante « émissions directes, mensuelle (RTE) » séparée du facteur ADEME, ou appliquer au facteur ADEME annuel le profil mensuel relatif de RTE. En valeur absolue l'enjeu reste faible devant le gaz (0,215 contre 0,02 à 0,05).

---

## 4. Prix du carbone

**Quotas européens.** Dernier cours lu : **82,77 €/tCO2** au règlement du 25/11/2026, plus bas et plus haut sur 30 jours 81,18 et 90,29 (https://www.purelyenergy.co.uk/tools/carbon/eu-ets, relais ; contrat non précisé). Un résultat de recherche donne 82,21 pour le contrat décembre 2026 sur ICE à la même date ; la page ICE n'a pas pu être lue. Moyenne 2025 des enchères : environ **74 €** (73,86), contre 65 € en 2024 (Agence fédérale allemande de l'environnement, communiqué du 07/01/2026 ; périmètre : vraisemblablement les enchères allemandes sur EEX). EEX publie un rapport d'enchères 2026 et une archive 2012–2025 ; pas d'accès libre automatisable, et les mêmes restrictions de republication que pour l'énergie.

**Valeur tutélaire française.** La « valeur de l'action pour le climat » a été révisée par France Stratégie (commission présidée par Alain Quinet), publication du 20/03/2025. La page officielle lue ne donne pas les chiffres ; la presse du même jour donne **256 €/tCO2 en 2025** (contre 187 € auparavant) et **300 € en 2030** (https://www.linfodurable.fr/climat/climat-france-strategie-rehausse-la-valeur-du-carbone-49978). Année de l'euro et valeurs 2040–2050 : non vérifiées (un résultat de recherche évoque des euros de 2023 et 563 puis 771 € ; non lu). La page officielle précise que ce n'est pas un niveau de taxe mais une référence pour évaluer les actions.

**Usage dans l'outil.** Deux lectures différentes, à ne pas additionner : le quota (≈ 80 €/t) chiffre un coût de marché, pertinent si le site est soumis au système d'échange ; la valeur tutélaire (256 €/t) chiffre la valeur collective d'une tonne évitée. Attention au double compte : le prix de l'électricité contient déjà le coût des quotas des producteurs.

---

## 5. Pièges d'unités et de périmètre à signaler à l'utilisateur

1. **Gaz : PCS ou PCI.** Les factures et le prix SDES sont en PCS ; beaucoup de facteurs d'émission et de rendements sont en PCI. Rapport lu dans la Base Carbone : 0,239 ÷ 0,215 = 1,11. Une consommation saisie en PCI avec le facteur PCS sous-estime le CO2e de 10 %.
2. **Fioul et propane sont en PCI** dans la Base Carbone, le gaz de l'outil en PCS : ne pas les afficher côte à côte sans le dire.
3. **Hors TVA ne veut pas dire hors taxes** : 148,8 et 65,7 sont des prix livrés, acheminement et taxes hors TVA compris (accise et CTA, lu pour l'électricité). Un prix de gros (114 ou 69 €/MWh) n'est donc pas comparable directement.
4. **Moyenne toutes tailles** : écart de 1 à 3,5 entre petites et très grandes consommations (§ 2.2). Dire quelle tranche a été retenue.
5. **Année de la valeur** : un prix 2025 appliqué à 2027 n'est pas une prévision. Afficher la date à côté de chaque hypothèse.
6. **Facteur électricité lissé sur quatre ans** (2022–2025) : il ne suit pas l'année réelle et ne doit pas être comparé tel quel aux 18,7 g de RTE.
7. **Amont compris ou non** : ADEME oui ; RTE, AEE, AIE, AIB non. Écart de 1 à 2,5 pour l'électricité française.
8. **Production ou consommation** : le `taux_co2` d'éCO2mix est par kWh produit en France, sans les imports ; le nouveau jeu RTE et l'ADEME sont par kWh consommé.
9. **Mix moyen ou mix résiduel** : préciser « approche localisation ».
10. **Millésime du facteur gaz** : 2022, dont la fiche affiche une validité au 28/02/2025.
11. **Prix de gros du gaz** : base PCS des cotations PEG et TTF non vérifiée dans les spécifications de contrat.
12. **Euros courants** : aucune des séries lues n'est corrigée de l'inflation.

---

## 6. Recommandation

### 6.1 Valeurs par défaut à retenir aujourd'hui

| Hypothèse | Valeur conseillée | Pourquoi |
|---|---|---|
| Électricité, prix de référence | **148,8 €/MWh** (inchangé) | Confirmé ; cohérent avec Eurostat ; le 1er semestre 2026 (147,4) ne justifie pas un changement |
| Gaz, prix de référence | **65,7 €/MWh PCS** (inchangé) pour valoriser l'historique | Confirmé |
| Gaz, prix pour la **prévision** | Champ distinct, prérempli à **86 €/MWh PCS** (référence indexée INSEE, septembre 2026), fourchette **66 à 100** | La valeur 2025 sous-estime : indice +31 %, prix à terme 2027 au-dessus du prix livré 2025. Valeur calculée, à présenter comme telle |
| Électricité, prix pour la **prévision** | Champ distinct, prérempli à 148,8, fourchette **124 à 170** | Bas = tranche 2–20 GWh ; haut = fourniture remplacée par le prix à terme 2027. Calcul fragile |
| Électricité, facteur | **0,0461** (inchangé), sous réserve d'une lecture sur compte Base Empreinte ; repli vérifiable : **0,0519** (2024, données ouvertes) | Source primaire non lue |
| Gaz, facteur | **0,215 kgCO2e/kWh PCS** (inchangé) | Confirmé |
| Prix du carbone (nouveau, facultatif) | **80 €/t** (quota) et **256 €/t** (valeur de l'action pour le climat), au choix | § 4 |

Deux ajouts qui comptent plus que le choix du chiffre : un **sélecteur de tranche de consommation** alimenté par Eurostat, et un **avertissement** lorsque la date de la valeur a plus de douze mois ou que l'indice INSEE s'en écarte de plus de 10 %.

### 6.2 Comment les présenter

Une ligne par hypothèse, toujours avec source, date et périmètre :

- « Électricité : 148,8 €/MWh — prix moyen 2025 de l'ensemble des clients professionnels en France, hors TVA, acheminement et accise compris, toutes tailles confondues. SDES, enquête Transparence des prix, publié le 23/07/2026. »
- « Gaz naturel : 65,7 €/MWh PCS — même définition, même source. Les prix de marché de fin 2026 sont nettement supérieurs : saisissez le prix de votre contrat. »
- « Électricité : 0,0461 kgCO2e/kWh — ADEME, Base Empreinte, "Électricité 2025, mix moyen, consommation", France continentale, amont compris, moyenne lissée 2022–2025, approche localisation. »
- « Gaz naturel : 0,215 kgCO2e/kWh PCS (0,239 par kWh PCI) — ADEME, Base Carbone V23.6, "Gaz naturel 2022, mix moyen", combustion 0,181 + amont 0,034. »

Attributions demandées : Eurostat (« Source: Eurostat, code du jeu, date d'accès »), Licence Ouverte pour ADEME, RTE et SDES (mention de la source et de la date de mise à jour).

### 6.3 Sources à brancher en direct

**Possible dès maintenant, sans serveur** (CORS ouvert testé, sans clé) :

1. Eurostat `nrg_pc_205` et `nrg_pc_203` : prix par tranche, pour proposer la bonne valeur par défaut et la mettre à jour deux fois par an.
2. INSEE BDM, séries 010764296, 010763990, 010763994 : indexation mensuelle des prix de référence (réponse XML à analyser).
3. ODRÉ, `part-enr-intensite-ges-conso-tr` : intensité mensuelle ou hebdomadaire en option (agrégat calculé par le serveur).
4. ADEME, Base Carbone : contrôle des facteurs et affichage de la fiche source.

Réserve : test fait depuis une page servie en `https`. Depuis un fichier ouvert localement, le comportement reste à vérifier ; prévoir des valeurs en dur et un message clair si l'appel échoue.

**Si l'outil avait un serveur** :

1. Prix jour pour le lendemain France : energy-charts (CC BY 4.0 pour la France d'après la réponse) ou Ember (CSV mensuel), ENTSO-E avec jeton.
2. Prix à terme électricité et gaz, quotas : pas de source libre automatisable ; abonnement EEX, ou saisie manuelle à partir des publications de la CRE.
3. DGEC : fichier hebdomadaire du fioul et du gazole non routier.
4. SDES : fichiers des publications annuelles (décomposition fourniture, réseau, taxes).
5. Electricity Maps : seulement avec une licence adaptée à un usage professionnel.

---

## 7. Pages que je n'ai pas pu lire

| Page | Ce qui s'est passé | Conséquence |
|---|---|---|
| `base-empreinte.ademe.fr/donnees/…` | Accès restreint, compte obligatoire | 0,0461 non vérifié à la source primaire ; millésimes récents du gaz et des usages non vérifiés |
| `statistiques.developpement-durable.gouv.fr/prix-du-gaz-et-de-lelectricite-au-premier-semestre-2026` | Erreur 404 (pas encore publiée, semble-t-il) | Pas de prix SDES 2026 |
| Fichiers xlsx du SDES (prix 2025, produits pétroliers) | Non ouverts (consigne) | Décomposition 2025, prix par tranche SDES, prix du fioul et du propane en valeur |
| `banque-france.fr/…/Methodologie_energie.pdf` | PDF illisible par l'outil | Recoupement des facteurs non fait |
| `cre.fr/…/Bulletin_marches_de_gros_electricite_T2_2026.pdf` | PDF illisible par l'outil | Prix de gros officiels de la CRE non lus ; chiffres de gros repris de relais commerciaux |
| `ice.com/products/197/EUA-Futures/data` | « Navigateur non supporté » | Cours officiel du quota non lu |
| `eex.com` (rapport d'enchères, cours à terme) | Données derrière le Market Data Hub | Cours EEX lus seulement par relais |
| `help.electricitymaps.com` (conditions, deux pages) | Erreur 403 | Conditions de l'offre gratuite non vérifiées |
| `electricitymaps.com/free-tier` | Redirige vers une page d'inscription, non suivie | Idem |
| `transparencyplatform.zendesk.com` (ENTSO-E) | Erreur 403 | Modalités du jeton et licence non vérifiées |
| `ec.europa.eu/eurostat/cache/metadata/en/nrg_pc_20x_sims.htm` (quatre adresses) | Erreur 404 | Base calorifique du gaz Eurostat et définition fine des taxes non vérifiées |
| `strategie-plan.gouv.fr` (page française du rapport) | Erreur 404 ; page anglaise lue, sans chiffres | Trajectoire officielle de la valeur de l'action pour le climat non lue |
| `insee.fr/fr/information/2868055` | Erreur 404 | Conditions de réutilisation de la BDM non lues |
| AIB et EEX, documents du mix résiduel 2025 | PDF non ouverts | Mix résiduel français non lu |
| Agence européenne pour l'environnement, indicateur | Valeurs dans un graphique interactif | Valeur France et licence non lues |
| `api.energy-charts.info` et `web-api.tp.entsoe.eu` depuis une page web | Échec de l'appel | Ouverture CORS non établie |
| Arrêté du 30/03/2026 (réseaux de chaleur), spécifications des contrats gaz EEX et ICE | Non ouverts | Contenu CO2 des réseaux à jour, base PCS des cotations |
