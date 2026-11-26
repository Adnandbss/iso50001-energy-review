/* Assemblage des six modules : sections du mode d'emploi, noms de groupes et textes communs en anglais. Chargé en dernier. */
(function asmAssembler() {
  const sections = [
 {
  "id": "mod-prevision",
  "t": [
   "10. Page Prévision : estimer les prochains mois",
   "10. Forecast page: estimate the coming months"
  ],
  "b": [
   [
    "p",
    "La page Prévision estime la consommation des 3, 6 ou 12 prochains mois d'une série. Elle calcule le modèle de référence de la série avec les facteurs influents relevés aux mêmes semaines des années passées, puis ajoute l'erreur du modèle pour donner une fourchette qui vise 80 % des cas. Elle additionne le réel déjà relevé et la prévision pour donner un atterrissage, sur l'année civile ou sur 12 mois glissants, en énergie, en euros et en CO2e. Le réglage « Dérive en cours » dit si la dérive détectée se prolonge ou si la consommation revient au niveau du modèle. La carte « La preuve » refait la prévision dans le passé, en cachant la fin de l'historique, et compare au réel : lisez-y l'erreur moyenne, le biais, la part des réels tombés dans la fourchette, et la comparaison avec une méthode naïve (même période un an plus tôt). Si la méthode ne fait pas mieux, ou si la fourchette est trop étroite, la page l'écrit. Avec moins de deux ans de données, la fourchette ne dit rien d'une année très différente, et un horizon peut être refusé.",
    "The Forecast page estimates a series' consumption over the next 3, 6 or 12 months. It computes the series' baseline model with the relevant variables recorded in the same weeks of past years, then adds the model error to give a range that aims at 80% of cases. It adds the actuals already recorded to the forecast to give a landing, over the calendar year or over rolling 12 months, in energy, euros and CO2e. The “Ongoing drift” setting says whether the detected drift continues or consumption returns to the model level. The “Proof” card redoes the forecast in the past, hiding the end of the history, and compares it with actuals: read there the average error, the bias, the share of actuals that fell within the range, and the comparison with a naive method (same period a year earlier). If the method does no better, or if the range is too narrow, the page says so. With less than two years of data, the range says nothing about a very different year, and a horizon may be refused."
   ],
   [
    "vers",
    [
     [
      "prevision",
      "Ouvrir la page Prévision",
      "Open the Forecast page"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-simulateur",
  "t": [
   "11. Page Simulateur : tester un scénario",
   "11. Simulator page: test a scenario"
  ],
  "b": [
   [
    "p",
    "Cette page répond à la question « et si ? ». Elle rejoue les modèles de référence du classeur sur l'historique, avec des facteurs influents que vous modifiez : une production en hausse de 10 %, un hiver au niveau haut habituel, un prix du gaz différent. Réglez chaque facteur à la main, ou écrivez le scénario en une phrase : la page affiche les réglages qu'elle a compris, et vous les confirmez avant tout calcul. Vous lisez ensuite l'écart avec la référence en énergie, en euros et en CO2e, pour le site et pour chaque UES, et ce que pèse chaque facteur (effet de 1 % de plus). Gardez jusqu'à trois scénarios pour les comparer et copier le tableau. Ce n'est pas une prévision : la page dit ce que le modèle aurait donné, et vous avertit quand un scénario sort de ce que l'historique a connu, quand un modèle est fragile, ou quand le site et les UES ne s'additionnent pas.",
    "This page answers the question “what if?”. It replays the workbook's baseline models over the history, with relevant variables that you change: production up 10%, a winter at its usual high level, a different gas price. Set each variable by hand, or write the scenario in one sentence: the page shows the settings it understood, and you confirm them before anything is computed. You then read the gap from the baseline in energy, euros and CO2e, for the site and for each SEU, and what each variable weighs (effect of 1% more). Keep up to three scenarios to compare them and copy the table. This is not a forecast: the page says what the model would have given, and warns you when a scenario goes beyond what the history has seen, when a model is weak, or when the site and the SEUs do not add up."
   ],
   [
    "vers",
    [
     [
      "simulateur",
      "Ouvrir la page Simulateur",
      "Open the Simulator page"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-veille",
  "t": [
   "12. Page Veille : trier et faire instruire les dérives",
   "12. Watch page: sort the drifts and have them investigated"
  ],
  "b": [
   [
    "p",
    "La page Veille travaille dès qu'un classeur est chargé. Elle compare les épisodes de dérive à ceux du chargement précédent et dit lesquels sont nouveaux, lesquels s'aggravent et lesquels se sont clos. Elle classe ensuite les épisodes à traiter selon une règle affichée, que vous pouvez régler : coût estimé, CO₂e ou ampleur, dérives en cours d'abord, projection à 3 mois comptée ou non. Un bouton fait instruire les premiers épisodes de la file, l'un après l'autre, dans la limite du budget que vous fixez ; vous pouvez arrêter à tout moment et reprendre ensuite. Le point de situation résume chaque fiche : cause la plus probable, confiance, relecture, action proposée, vérifications sur site. Vous donnez à chaque épisode un statut (à traiter, validé, écarté avec un motif), que ce navigateur retient pour le prochain chargement. L'agent lit et rédige ; il ne décide rien à votre place. En mode démonstration, les fiches et les relectures viennent d'un script, sans IA.",
    "The Watch page starts working as soon as a workbook is loaded. It compares the drift episodes with those of the previous load and says which are new, which are getting worse and which have closed. It then ranks the episodes to handle by a displayed rule that you can adjust: estimated cost, CO₂e or magnitude, ongoing drifts first, 3-month projection counted or not. One button has the first episodes in the queue investigated one after the other, within the budget you set; you can stop at any time and resume later. The status report sums up each note: most likely cause, confidence, review, proposed action, on-site checks. You give each episode a status (to handle, validated, dismissed with a reason), which this browser keeps for the next load. The agent reads and writes; it decides nothing on your behalf. In demo mode, the notes and reviews come from a script, with no AI."
   ],
   [
    "vers",
    [
     [
      "veille",
      "Ouvrir la page Veille",
      "Open the Watch page"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-revue",
  "t": [
   "13. Page Revue : rédiger la revue de la période",
   "13. Review page: write the review of the period"
  ],
  "b": [
   [
    "p",
    "La page Revue rédige la revue énergétique de la période choisie avec le filtre, en quatre étapes. 1. La page calcule un dossier de faits : consommations, écarts à la référence, qualité des modèles, épisodes de dérive avec leur coût et leurs émissions estimés, facteurs influents hors de leur plage habituelle. Dépliez-le pour le lire : chaque fait porte un identifiant. 2. Cliquez sur « Rédiger la revue ». Un agent écrit sept sections à partir de ce dossier seul et cite, entre crochets, le fait de chaque chiffre. En mode démonstration, un script fait ce travail sans IA ; pour utiliser une IA, réglez le fournisseur et la clé sur la page Instruction, puis donnez l'accord propre à la revue. 3. Deux contrôles suivent. La page cherche chaque nombre dans les faits que sa phrase cite : surligné, il est introuvable ; souligné en ambre, il existe dans le dossier mais pas dans un fait cité. Un second agent, qui n'a pas vu le rédacteur, rend un verdict par section. 4. Relisez. « Corriger le texte » ouvre une section ; chaque correction est recontrôlée. Corrigez ou levez les signalements, saisissez votre nom, validez, puis imprimez en PDF ou copiez le texte. Le document dit qui a rédigé, ce que les contrôles ont trouvé, de quand datent les données et quelles hypothèses de prix et d'émission ont servi. Les causes évoquées restent des hypothèses : l'outil ne connaît que le classeur.",
    "The Review page writes the energy review of the period chosen with the filter, in four steps. 1. The page computes a fact file: consumption, gaps against the baseline, model quality, drift episodes with their estimated cost and emissions, relevant variables outside their usual range. Unfold it to read it: each fact has an identifier. 2. Click “Write the review”. An agent writes seven sections from that file alone and cites, in brackets, the fact behind each figure. In demo mode a script does this without AI; to use an AI, set the provider and the key on the Investigation page, then give the consent specific to the review. 3. Two checks follow. The page looks for each number in the facts its sentence cites: highlighted means not found; an amber underline means it is in the file but not in a cited fact. A second agent, who has not seen the writer, returns a verdict per section. 4. Review it. “Edit the text” opens a section; each correction is checked again. Fix or dismiss the flags, enter your name, validate, then print to PDF or copy the text. The document says who wrote it, what the checks found, how recent the data is and which price and emission assumptions were used. The causes mentioned remain hypotheses: the tool only knows the workbook."
   ],
   [
    "vers",
    [
     [
      "revue",
      "Ouvrir la page Revue",
      "Open the Review page"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-evaluation",
  "t": [
   "14. Page Évaluation : mesurer la fiabilité de l'agent",
   "14. Evaluation page: measure how reliable the agent is"
  ],
  "b": [
   [
    "p",
    "La page Évaluation pose à l'agent des questions dont la page connaît la bonne réponse, parce qu'elle la calcule elle-même à partir du classeur. Choisissez le nombre de questions, puis lancez une passe : chaque question est notée juste, fausse, abstention justifiée, abstention à tort ou invention. Les pièges sont des questions sans réponse dans les données ; l'agent doit le dire au lieu d'inventer. Le relevé donne le taux de réussite, le taux d'invention, la durée et, si vous saisissez les tarifs de votre modèle, le coût estimé par question. La liste des échecs montre pour chacun la question, la réponse attendue, la réponse donnée et les outils appelés. Changez d'agent sur la page Instruction, relancez une passe : les deux se comparent côte à côte. En mode démonstration, un script joue l'agent et se trompe exprès sur trois questions : ses notes montrent le banc en marche, elles ne disent rien d'une IA.",
    "The Evaluation page asks the agent questions whose correct answer the page knows, because it computes it itself from the workbook. Choose the number of questions, then start a run: each question is graded correct, wrong, justified abstention, wrong abstention or fabrication. The traps are questions with no answer in the data; the agent must say so instead of making one up. The summary gives the success rate, the fabrication rate, the time and, if you enter your model's prices, the estimated cost per question. The failure list shows, for each one, the question, the expected answer, the answer given and the tools called. Change the agent on the Investigation page and start another run: the two are compared side by side. In demo mode a script plays the agent and errs on purpose on three questions: its grades show the bench working and say nothing about an AI."
   ],
   [
    "vers",
    [
     [
      "evaluation",
      "Ouvrir la page Évaluation",
      "Open the Evaluation page"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-itg",
  "t": [
   "15. Intégrer un fichier brut",
   "15. Integrate a raw file"
  ],
  "b": [
   [
    "p",
    "Vous n'avez pas le classeur préparé ? Sur l'écran d'accueil, ou sur la page Intégration, choisissez ou déposez un export de compteurs ou un tableau de suivi, en CSV ou en Excel. La page le lit tel qu'il est, puis vous montre ce qu'elle a compris : les dates, le pas de temps, les colonnes, et ce qui cloche (dates en double, périodes absentes, valeurs aberrantes). Elle propose ensuite le rôle de chaque colonne : consommation, avec son énergie, son unité et son niveau Site ou UES, facteur influent, ou colonne à ignorer. Cette proposition vient de règles écrites dans la page, ou d'une IA si vous l'avez autorisée sur la page Instruction ; dans ce cas la page vous montre d'abord tout ce qui sera envoyé : les intitulés et quelques valeurs, jamais le fichier. Corrigez le tableau, c'est vous qui décidez. La page calcule alors un modèle de référence par consommation, affiche sa qualité et ses limites, puis charge le tableau de bord. Ces modèles sont calculés par la page, pas par la macro : faites-les relire par une personne qui connaît le site.",
    "No prepared workbook? On the home screen, or on the Integration page, choose or drop a meter export or a tracking table, as CSV or Excel. The page reads it as it is, then shows what it understood: the dates, the time step, the columns, and what looks wrong (duplicate dates, missing periods, outliers). It then proposes the role of each column: consumption, with its energy, unit and Site or SEU level, relevant variable, or column to ignore. This proposal comes from rules written in the page, or from an AI if you authorised it on the Investigation page; in that case the page first shows everything that will be sent: the headers and a few values, never the file. Correct the table, the decision is yours. The page then computes one baseline model per consumption, shows its quality and its limits, and loads the dashboard. These models are computed by the page, not by the macro: have someone who knows the site review them."
   ],
   [
    "vers",
    [
     [
      "itg",
      "Ouvrir la page Intégration",
      "Open the Integration page"
     ]
    ]
   ]
  ]
 }
];
  const rang = GUIDE.findIndex(s => s.id === "partager");
  GUIDE.splice(rang < 0 ? GUIDE.length : rang, 0, ...sections);
  const partager = GUIDE.find(s => s.id === "partager");
  if (partager) partager.t = ["16. Partager", "16. Share"];
  ajouterTraductions([["Anticipation", "Outlook"], ["Agents", "Agents"], ["Données", "Data"],
    ["le fichier est lu par votre navigateur et n'est envoyé nulle part. Exceptions, uniquement après votre accord explicite, donné sur la page concernée, et vers l'API d'IA que vous choisissez (Google Gemini ou Anthropic) : l'instruction d'une dérive, la veille, la revue et l'évaluation envoient des valeurs du classeur ; le simulateur envoie la phrase que vous écrivez, avec les noms et les plages des facteurs ; l'intégration d'un fichier envoie les intitulés des colonnes et quelques valeurs.", "the file is read by your browser and is sent nowhere. Exceptions, only after your explicit consent, given on the page concerned, and to the AI API you choose (Google Gemini or Anthropic): investigating a drift, the watch, the review and the evaluation send values from the workbook; the simulator sends the sentence you write, with the names and ranges of the relevant variables; integrating a file sends the column headers and a few values."],
    ["Si la relecture par un second agent est active, la fiche et les mêmes résultats d'outils sont envoyés une seconde fois, dans une conversation séparée. Une évaluation, ou une série lancée depuis la page Veille, répète ces envois pour chaque épisode.", "If the review by a second agent is on, the note and the same tool results are sent a second time, in a separate conversation. An evaluation, or a run started from the Watch page, repeats these sends for each episode."]]);
})();
