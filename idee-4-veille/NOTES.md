# Module « Veille » (idee-4-veille, préfixe `vei`)

Page « Veille » du groupe « Agents » (identifiant `veille`). Fichiers : `module.js` (59,5 Ko), `module.css`, `test.js`. Aucune modification du coeur.

## Ce que fait le module

1. **Détecter ce qui est nouveau.** À chaque chargement (`AU_CHARGEMENT`), la page prend un relevé des épisodes de `derives()` et le compare au relevé précédent du même jeu de données : nouveaux, en cours et aggravés (ou prolongés, pour une économie), en cours inchangés, clos depuis, déjà vus, disparus. Au premier passage, tout est nouveau et la page le dit.
2. **Trier par enjeu.** File d'attente des épisodes « à traiter ». Règle affichée en une phrase numérotée et réglable par cinq cases et un critère (coût, CO₂e, |z| max). Ordre par défaut : les UES qui recoupent un épisode du Site en dernier ; les nouveautés d'abord ; les dérives en cours ; les surconsommations ; puis le coût estimé, projection à 3 mois comprise ; à égalité, le |z|.
3. **Instruire en série.** Un bouton instruit les N premiers épisodes sans fiche (N = 1, 3, 5 ou 10), avec `boucleAgent`, `mesurerFiche` et `jugerFiche` d'origine, non modifiés. Budget affiché (épisodes, tours, nombre maximal d'appels). Arrêt à tout moment. Une erreur sur un épisode n'efface pas les autres ; deux échecs de suite interrompent la série ; un bouton reprend les épisodes restés sans fiche, un autre relance un seul épisode.
4. **Point de situation.** Constat en une phrase, cinq tuiles (nouveaux, aggravés, clos, enjeu des surconsommations à traiter sans double compte, projection à 3 mois), puis une ligne par épisode instruit : cause la plus probable et sa preuve, confiance, relecture, contrôles de la page, action proposée, vérifications sur site. Cliquer la ligne ouvre la fiche complète (celle de `montrerFiche`). Statut fixé par la personne : à traiter, validé, écarté (motif obligatoire), conservé d'un chargement à l'autre.
5. **Export.** Copie en texte brut et impression (feuille de style d'impression : seuls le constat, les tuiles et les épisodes instruits restent).

## Méthode et limites

- **Identité d'un épisode** : empreinte (hachage) de « série + sens + première période ». Sa fin peut reculer d'un chargement à l'autre sans changer son identité. Si les données passées ou le modèle de référence changent et déplacent le début d'un épisode, il réapparaît comme « nouveau » et l'ancien est compté comme « disparu ».
- **Aggravé** = encore en cours, avec plus de périodes ou un |z| max plus fort qu'au relevé précédent. Ce n'est pas mesuré en kWh ni en euros : la mémoire ne garde aucune valeur de consommation.
- **Même jeu de données** = mêmes séries (nom, énergie, niveau). Ajouter ou renommer une série ouvre un nouveau jeu, donc un premier passage. Six jeux au plus sont gardés.
- **Relevé précédent** : il n'avance que si les données changent. Recharger le même classeur garde la même comparaison (sinon les nouveautés disparaîtraient au second clic).
- **Mémoire** (`revue-energetique.vei.memoire`) : par épisode, `[périodes, |z| max, date de fin, en cours]` sous une empreinte ; les statuts (statut, motif, nombre de périodes au moment de la décision, date). Ni nom de série, ni énergie, ni écart, ni coût, ni fiche. Conséquence : les épisodes disparus sont comptés, pas nommés. Les réglages de tri sont dans `revue-energetique.vei.reglages`. Copie figée : rien n'est lu ni écrit.
- **Doublon Site / UES** : même énergie, même sens, dates qui se recoupent. C'est un indice, annoncé comme tel.
- **Enjeu total sans double compte** : même règle que la page Détection (pour une énergie qui a un compteur de niveau Site, seuls ses épisodes de Site comptent). Une dérive d'UES sans épisode correspondant au niveau Site n'est donc pas comptée. Seules les surconsommations sont additionnées. Le total de la veille est égal à la tuile « Surconsommations » de la page Détection quand aucun statut n'est posé (vérifié par le test).
- **Projection à 3 mois** : celle de `projectionDe` (écart moyen prolongé). Ce n'est pas une prévision ; un épisode en cours d'une seule période peut ainsi passer devant un gros épisode clos. Une case la retire du tri.
- **Décision à revoir** : un épisode validé ou écarté qui s'allonge ensuite revient dans la file avec cette mention.
- **Relecture en démonstration** : `veiJugeDemo` joue le juge dans `jugerFiche`, avec la forme de réponse de l'API. Il fait deux contrôles déterministes (nombres de la fiche présents dans le dossier reçu, écart égal à celui de l'épisode) et dit qu'il n'a relu ni le raisonnement ni les causes. Il est un peu plus permissif que `mesurerFiche`, car le dossier du juge contient aussi les paramètres des appels d'outils.
- **Mode IA** : la série envoie, pour chaque épisode, exactement ce qu'envoie une instruction (rédaction, puis relecture si elle est active), donc ce que liste `avisEnvoi()`. Rien d'autre ne part. Les réglages restent sur la page Instruction ; la veille affiche le mode, le budget et un lien.
- **Fiches** : gardées en mémoire vive seulement. Elles sont retirées au changement de classeur et au changement de langue (comme sur la page Instruction, les contrôles de nombres dépendant de la langue).
- **Historique court** (18 mois, pas hebdomadaire) : la note de la file rappelle qu'un |z| élevé sur une seule période peut venir d'un relevé isolé.

## Interactions avec la page Instruction

- Un seul verrou : `agent.enCours`. La série ne démarre pas si une instruction ou une évaluation tourne, et inversement. Si une autre exécution est en cours, le bouton est désactivé avec le motif, puis se libère tout seul.
- Un seul arrêt : `agent.arret`. Le bouton « Arrêter » de la page Instruction arrête aussi la série ; un changement de classeur l'arrête.
- La série écrit dans le journal et la progression d'origine (`noter`, `demarrerSuivi("evaluation")`). Comme `lancerInstruction`, elle vide au départ `journal`, `zoneFiche` et `zoneEval`. Les noeuds `journal` et `zoneProgres` sont montrés dans la veille seulement quand elle est la page ouverte.
- La fiche complète est composée par `montrerFiche` dans `zoneFiche`, retirée aussitôt, et le contenu précédent de `zoneFiche` est remis.
- Dans le journal d'une série, les repères `data-source` sont retirés : au survol d'un nombre de la fiche, l'infobulle dit toujours d'où il vient, mais ne surligne plus la ligne du journal (elle aurait pu viser un autre épisode).
- En arrivant sur la page, `reinitialiserAgent` est appelé si le classeur a changé, comme le fait la page Instruction (l'accord d'envoi est alors à redonner).

## Ce qui est testé (`test.js`, 231 vérifications, 0 échec, environ 22 s)

- Premier passage ; contenu de la mémoire (aucun nom de série ni d'énergie, format des relevés) ; clés de stockage préfixées.
- Comparaison sur un cas construit (nouveau, aggravé, clos, connu, disparu, sens opposé, |z| plus fort).
- Comparaison sur trois chargements réels : classeur tronqué à mi-août, puis à fin septembre, puis complet ; résultats égaux à un calcul indépendant ; même classeur rechargé.
- Tri sur un cas construit : règle par défaut, sans priorité, par CO₂e, par |z|, effet de la projection, nouveautés, énergie sans prix.
- Double compte : cas construit (20 MWh et non 128) et classeur réel, égal à la page Détection.
- Série en démonstration : 3 fiches, relecture par script, contrôles, aucun appel réseau ; verrou dans les deux sens ; fiche complète ouverte sans toucher à `zoneFiche` ; arrêt pendant l'épisode 2 puis reprise ; erreur simulée par `fauxModele` puis reprise ; deux échecs de suite ; changement de classeur pendant une série ; mode IA sans accord (rien ne part).
- Le juge joué par script renvoie « à corriger » sur une fiche faussée.
- Statuts : motif obligatoire, parcours à l'écran, persistance après rechargement, décision à revoir, copie figée (aucune lecture ni écriture), oubli de la mémoire.
- Rendu en français et en anglais (aucun texte français restant hors données et journal d'origine), export en texte dans les deux langues, toutes les pages se rendent.
- Les mêmes tests passent aussi avec les six modules assemblés dans leur état du 25/11 (essai ponctuel : 236 vérifications, le nombre dépend des pages présentes).

## Ce qui n'est pas testé

- **L'apparence** : aucune vérification dans un navigateur (règle 10). La lisibilité à 390 px, le thème sombre et l'impression reposent sur la lecture du style, pas sur un essai.
- **Le mode IA réel** (Gemini ou Claude) : seul le blocage sans accord est testé. Une série avec une vraie IA et un vrai juge n'a pas été exécutée.
- Le presse-papiers réel, la saisie au clavier, le repli de copie.
- D'autres classeurs : pas journalier ou mensuel, énergie sans prix par défaut, classeur sans compteur de niveau Site (chemins couverts seulement par des cas construits).

## Changements du coeur souhaités (facultatifs, le module marche sans eux)

1. `avisEnvoi()` : citer la veille dans l'avis.
   - Texte exact : `Une évaluation répète ces envois pour chaque épisode évalué.`
   - Remplacement : `Une évaluation, ou une série lancée depuis la page Veille, répète ces envois pour chaque épisode.`
   - Même changement dans la paire anglaise de `PAIRES` : `An evaluation, or a run started from the Watch page, repeats these sends for each episode.`
   - Raison : l'accord donné sur la page Instruction nomme alors toutes les exécutions qu'il couvre.
2. Mode d'emploi (`GUIDE`) : ajouter la section ci-dessous.

## Texte de mode d'emploi

**Français.** La page Veille travaille dès qu'un classeur est chargé. Elle compare les épisodes de dérive à ceux du chargement précédent et dit lesquels sont nouveaux, lesquels s'aggravent et lesquels se sont clos. Elle classe ensuite les épisodes à traiter selon une règle affichée, que vous pouvez régler : coût estimé, CO₂e ou ampleur, dérives en cours d'abord, projection à 3 mois comptée ou non. Un bouton fait instruire les premiers épisodes de la file, l'un après l'autre, dans la limite du budget que vous fixez ; vous pouvez arrêter à tout moment et reprendre ensuite. Le point de situation résume chaque fiche : cause la plus probable, confiance, relecture, action proposée, vérifications sur site. Vous donnez à chaque épisode un statut (à traiter, validé, écarté avec un motif), que ce navigateur retient pour le prochain chargement. L'agent lit et rédige ; il ne décide rien à votre place. En mode démonstration, les fiches et les relectures viennent d'un script, sans IA.

**English.** The Watch page starts working as soon as a workbook is loaded. It compares the drift episodes with those of the previous load and says which are new, which are getting worse and which have closed. It then ranks the episodes to handle by a displayed rule that you can adjust: estimated cost, CO₂e or magnitude, ongoing drifts first, 3-month projection counted or not. One button has the first episodes in the queue investigated one after the other, within the budget you set; you can stop at any time and resume later. The status report sums up each note: most likely cause, confidence, review, proposed action, on-site checks. You give each episode a status (to handle, validated, dismissed with a reason), which this browser keeps for the next load. The agent reads and writes; it decides nothing on your behalf. In demo mode, the notes and reviews come from a script, with no AI.

## À vérifier à l'écran

1. Page Veille après chargement : le constat « Premier passage… », les cinq tuiles, et un total « Surconsommations à traiter » égal à la tuile « Surconsommations » de la page Détection.
2. « Instruire les 3 premiers épisodes de la file » en démonstration : la progression avance, « Arrêter la série » répond, puis « Reprendre… » complète.
3. Une ligne d'épisode instruit : clic sur l'en-tête, la fiche complète s'ouvre dessous ; survol d'un nombre souligné, l'infobulle s'affiche.
4. Statut « Écarté » : le champ de motif apparaît et reçoit le curseur ; l'épisode passe dans « Épisodes déjà traités » ; il y est encore après rechargement du classeur.
5. File d'attente : le tableau défile dans son cadre sans élargir la page, à 390 px comme en grand écran ; les numéros sur fond sombre marquent la prochaine série.
6. Thème sombre : les pastilles, le numéro de rang et les lignes d'épisode restent lisibles.
7. « Imprimer le point de situation » : l'aperçu ne montre ni menu, ni boutons, ni file, ni mémoire ; chaque épisode affiche son statut en clair.
8. Second chargement avec des données plus récentes : le constat devient « Depuis le relevé du … », et les nouveautés montent en tête de file.
9. Page Instruction pendant une série : le journal de la série s'y affiche et son bouton « Arrêter » arrête la série.
