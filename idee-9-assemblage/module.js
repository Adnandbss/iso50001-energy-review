/* Assemblage des modules : sections du mode d'emploi (numérotées ici, dans l'ordre), noms de groupes et textes communs en anglais. Chargé en dernier. */
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
  "id": "mod-revue",
  "t": [
   "13. Page Revue : rédiger la revue de la période",
   "13. Review page: write the review of the period"
  ],
  "b": [
   [
    "p",
    "La page Revue rédige la revue énergétique de la période choisie avec le filtre, en quatre étapes. 1. La page calcule un dossier de faits : consommations, écarts à la référence, qualité des modèles, épisodes de dérive avec leur coût et leurs émissions estimés, facteurs influents hors de leur plage habituelle. Dépliez-le pour le lire : chaque fait porte un identifiant. 2. Cliquez sur « Rédiger la revue ». Un agent écrit sept sections à partir de ce dossier seul et cite, entre crochets, le fait de chaque chiffre. En mode démonstration, un script fait ce travail sans IA ; pour utiliser une IA, réglez le mode, la clé et l'accord dans les réglages d'IA (bouton « IA », en bas du menu). 3. Deux contrôles suivent. La page cherche chaque nombre dans les faits que sa phrase cite : surligné, il est introuvable ; souligné en ambre, il existe dans le dossier mais pas dans un fait cité. Un second agent, qui n'a pas vu le rédacteur, rend un verdict par section. 4. Relisez. « Corriger le texte » ouvre une section ; chaque correction est recontrôlée. Corrigez ou levez les signalements, saisissez votre nom, validez, puis imprimez en PDF ou copiez le texte. Le document dit qui a rédigé, ce que les contrôles ont trouvé, de quand datent les données et quelles hypothèses de prix et d'émission ont servi. Les causes évoquées restent des hypothèses : l'outil ne connaît que le classeur.",
    "The Review page writes the energy review of the period chosen with the filter, in four steps. 1. The page computes a fact file: consumption, gaps against the baseline, model quality, drift episodes with their estimated cost and emissions, relevant variables outside their usual range. Unfold it to read it: each fact has an identifier. 2. Click “Write the review”. An agent writes seven sections from that file alone and cites, in brackets, the fact behind each figure. In demo mode a script does this without AI; to use an AI, set the mode, the key and the consent in the AI settings (“AI” button, at the bottom of the menu). 3. Two checks follow. The page looks for each number in the facts its sentence cites: highlighted means not found; an amber underline means it is in the file but not in a cited fact. A second agent, who has not seen the writer, returns a verdict per section. 4. Review it. “Edit the text” opens a section; each correction is checked again. Fix or dismiss the flags, enter your name, validate, then print to PDF or copy the text. The document says who wrote it, what the checks found, how recent the data is and which price and emission assumptions were used. The causes mentioned remain hypotheses: the tool only knows the workbook."
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
    "La page Évaluation pose à l'agent des questions dont la page connaît la bonne réponse, parce qu'elle la calcule elle-même à partir du classeur. Choisissez le nombre de questions, puis lancez une passe : chaque question est notée juste, fausse, abstention justifiée, abstention à tort ou invention. Les pièges sont des questions sans réponse dans les données ; l'agent doit le dire au lieu d'inventer. Le relevé donne le taux de réussite, le taux d'invention, la durée et, si vous saisissez les tarifs de votre modèle, le coût estimé par question. La liste des échecs montre pour chacun la question, la réponse attendue, la réponse donnée et les outils appelés. Changez d'agent dans les réglages d'IA, relancez une passe : les deux se comparent côte à côte. En mode démonstration, un script joue l'agent et se trompe exprès sur trois questions : ses notes montrent le banc en marche, elles ne disent rien d'une IA.",
    "The Evaluation page asks the agent questions whose correct answer the page knows, because it computes it itself from the workbook. Choose the number of questions, then start a run: each question is graded correct, wrong, justified abstention, wrong abstention or fabrication. The traps are questions with no answer in the data; the agent must say so instead of making one up. The summary gives the success rate, the fabrication rate, the time and, if you enter your model's prices, the estimated cost per question. The failure list shows, for each one, the question, the expected answer, the answer given and the tools called. Change the agent in the AI settings and start another run: the two are compared side by side. In demo mode a script plays the agent and errs on purpose on three questions: its grades show the bench working and say nothing about an AI."
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
    "Vous n'avez pas le classeur préparé ? Sur l'écran d'accueil, ou sur la page Intégration, choisissez ou déposez un export de compteurs ou un tableau de suivi, en CSV ou en Excel. La page le lit tel qu'il est, puis vous montre ce qu'elle a compris : les dates, le pas de temps, les colonnes, et ce qui cloche (dates en double, périodes absentes, valeurs aberrantes). Elle propose ensuite le rôle de chaque colonne : consommation, avec son énergie, son unité et son niveau Site ou UES, facteur influent, ou colonne à ignorer. Cette proposition vient de règles écrites dans la page, ou d'une IA si vous l'avez autorisée dans les réglages d'IA ; dans ce cas la page vous montre d'abord tout ce qui sera envoyé : les intitulés et quelques valeurs, jamais le fichier. Corrigez le tableau, c'est vous qui décidez. La page calcule alors un modèle de référence par consommation, affiche sa qualité et ses limites, puis charge le tableau de bord. Ces modèles sont calculés par la page, pas par la macro : faites-les relire par une personne qui connaît le site.",
    "No prepared workbook? On the home screen, or on the Integration page, choose or drop a meter export or a tracking table, as CSV or Excel. The page reads it as it is, then shows what it understood: the dates, the time step, the columns, and what looks wrong (duplicate dates, missing periods, outliers). It then proposes the role of each column: consumption, with its energy, unit and Site or SEU level, relevant variable, or column to ignore. This proposal comes from rules written in the page, or from an AI if you authorised it in the AI settings; in that case the page first shows everything that will be sent: the headers and a few values, never the file. Correct the table, the decision is yours. The page then computes one baseline model per consumption, shows its quality and its limits, and loads the dashboard. These models are computed by the page, not by the macro: have someone who knows the site review them."
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
 },
 {
  "id": "mod-accueil",
  "t": [
   "16. Site fictif et vue d'ensemble",
   "16. Fictitious site and overview"
  ],
  "b": [
   [
    "p",
    "Pas de classeur sous la main ? Sur l'écran d'accueil, cliquez « Essayer avec un site fictif » : la page fabrique une usine inventée, avec deux ans de relevés hebdomadaires, deux compteurs généraux, six usages suivis et leurs modèles de référence, et charge le tableau de bord. Un bandeau rappelle sur chaque page que ces données sont fictives. Une visite guidée d'une minute montre où en est le site, l'usage dont la dérive coûte le plus, ce qu'en dit l'agent (en mode démonstration, sans IA), ce que prévoit la page Prévision et comment le banc d'évaluation vérifie l'IA ; relancez-la depuis le bandeau. Après chaque chargement, la page « Vue d'ensemble » répond à « où en est le site et que dois-je faire ? » : une phrase de synthèse, l'écart à la référence sur 12 mois, les dérives en cours et leur coût mensuel, l'atterrissage de l'année, la qualité des modèles, les trois dérives les plus coûteuses et les prochaines actions. Chaque chiffre vient des pages Dérives et Prévision.",
    "No workbook at hand? On the welcome screen, click “Try it with a fictitious site”: the page builds an invented plant, with two years of weekly readings, two main meters, six tracked uses and their baseline models, and loads the dashboard. A banner on every page reminds you that this data is fictitious. A one-minute guided tour shows where the site stands, the use whose drift costs the most, what the agent says about it (in demo mode, with no AI), what the Forecast page expects and how the evaluation bench checks the AI; restart it from the banner. After every load, the “Overview” page answers “where does the site stand and what should I do?”: a summary sentence, the gap to the baseline over 12 months, ongoing drifts and their monthly cost, the landing for the year, model quality, the three costliest drifts and the next actions. Every figure comes from the Drifts and Forecast pages."
   ],
   [
    "vers",
    [
     [
      "ensemble",
      "Ouvrir la vue d'ensemble",
      "Open the overview"
     ]
    ]
   ]
  ]
 },
 {
  "id": "mod-ia",
  "t": [
   "17. Réglages d'IA",
   "17. AI settings"
  ],
  "b": [
   [
    "p",
    "Le bouton « IA », en bas du menu, dit à tout moment quel moteur sert les pages d'agents : démonstration (un script, sans IA ni réseau), Gemini ou Claude, avec le modèle, et s'il est prêt. Il ouvre les réglages d'IA : choisissez le mode et le modèle, collez votre clé, puis lisez, fonction par fonction, ce que chaque page enverra (instruction d'une dérive et veille, revue, banc d'évaluation, simulateur, intégration). Décochez ce que vous refusez et cliquez une fois sur « J'autorise ces envois pour cette session » : toutes les pages cochées sont autorisées jusqu'au rechargement, et « Retirer l'autorisation partout » annule tout. La clé n'est enregistrée nulle part ; cochez « Garder la clé jusqu'à la fermeture de cet onglet » pour qu'elle survive à un rechargement, sauf sur un poste partagé. Pendant qu'un agent travaille, le texte du modèle s'affiche au fil de l'eau, ou un compteur de secondes ; l'encadré « Agent au travail », en bas du menu, le suit depuis n'importe quelle page et permet de l'arrêter, et une notification « Voir » mène au résultat quand il a fini.",
    "The “AI” button at the bottom of the menu always shows which engine serves the agent pages: demo (a script, no AI and no network), Gemini or Claude, with the model, and whether it is ready. It opens the AI settings: choose the mode and the model, paste your key, then read, feature by feature, what each page will send (drift investigation and watch, review, evaluation bench, simulator, integration). Untick what you refuse and click “I authorise these sends for this session” once: every ticked page is authorised until the page is reloaded, and “Withdraw authorisation everywhere” cancels it all. The key is stored nowhere; tick “Keep the key until this tab is closed” to keep it across a reload, except on a shared computer. While an agent works, the model's text appears as it arrives, or a seconds counter; the “Agent at work” box at the bottom of the menu follows it from any page and can stop it, and a “View” notice leads to the result when it is done."
   ]
  ]
 },
 {
  "id": "mod-continuite",
  "t": [
   "18. Travail gardé et fichier projet",
   "18. Kept work and project file"
  ],
  "b": [
   [
    "p",
    "Votre travail est gardé dans ce navigateur, pour le classeur ouvert : réglages des filtres, scénarios du simulateur, brouillon de la revue (avec vos corrections, les signalements levés et le nom du relecteur) et passes du banc d'évaluation. Rouvrez le même classeur, même après avoir fermé la page : un bandeau dit ce qui a été retrouvé, et chaque ligne peut être effacée. Un autre classeur ne reprend jamais ce travail. Aucune clé d'API n'est gardée. Pour emporter votre travail sur un autre poste ou le confier à quelqu'un, ouvrez « Projet et travail gardé » en bas du menu, puis « Exporter le projet » : le fichier .json contient les données du classeur et votre travail. « Ouvrir un projet », dans ce menu ou sur l'écran d'accueil, le recharge. La copie figée, elle, est une page à transmettre, qui ne garde pas votre travail. Dans les titres, les mots soulignés en pointillé ont une définition : survolez-les, touchez-les ou atteignez-les avec la touche Tab.",
    "Your work is kept in this browser, for the open workbook: filter settings, simulator scenarios, the review draft (with your corrections, dismissed flags and reviewer's name) and evaluation bench runs. Reopen the same workbook, even after closing the page: a banner says what was restored, and each line can be deleted. Another workbook never picks up this work. No API key is kept. To take your work to another computer or hand it over, open “Project and kept work” at the bottom of the menu, then “Export the project”: the .json file holds the workbook data and your work. “Open a project”, in that menu or on the welcome screen, loads it back. The frozen copy is a page to pass on, which does not keep your work. In titles, words with a dotted underline have a definition: hover, tap or reach them with the Tab key."
   ]
  ]
 }
];
  // Page Dérives : remplace les sections Détection, Instruction et Veille (texte des NOTES du module 13 ; les repères encore justes des anciennes captures, sans elles)
  const derives = {
   "id": "mod-derives",
   "t": [
    "5. Page Dérives : repérer, classer et faire instruire les dérives",
    "5. Drifts page: spot, rank and investigate the drifts"
   ],
   "b": [
    [
     "p",
     "La page Dérives répond d'abord : combien de dérives sont en cours, la plus lourde et ce qu'elle coûte si rien ne change, puis ce que la veille a vu de neuf depuis le chargement précédent. Dessous, une seule liste de toutes les dérives, classées par enjeu sans compter deux fois la même dérive au compteur général et dans une UES : les nouvelles et celles en cours d'abord, puis par coût estimé. Filtrez par état, par sens ou par énergie. « Instruire » fait enquêter l'agent sur une dérive : sa fiche s'ouvre sous la ligne, avec ses causes probables, ses preuves chiffrées et les vérifications à faire ; « Instruire les N premières » le fait pour les premières de la liste, l'une après l'autre, et s'arrête quand vous le demandez. Dans le détail d'une dérive, donnez votre décision (à traiter, validée, écartée avec un motif), que ce navigateur retient, et ouvrez d'un clic sa prévision, sa simulation ou la revue de l'année qui la couvre. Les courbes (écarts cumulés, z), les tableaux de la détection, les hypothèses de prix, les règles de tri et de détection, la mémoire de la veille et l'évaluation de l'agent sont plus bas, sous des titres à déplier. En mode démonstration, les fiches viennent d'un script, sans IA.",
     "The Drifts page answers first: how many drifts are ongoing, the largest one and what it costs if nothing changes, then what the watch has seen that is new since the previous load. Below, one list of all drifts, ranked by stake without counting the same drift twice on the main meter and on a significant energy use: new and ongoing ones first, then by estimated cost. Filter by state, direction or energy. “Investigate” has the agent look into one drift: its note opens under the line, with the probable causes, the figures that support them and the checks to make; “Investigate the first N” does it for the first ones in the list, one after the other, and stops when you ask. In a drift's details, record your decision (to handle, validated, dismissed with a reason), which this browser keeps, and open its forecast, its simulation or the review of the year that covers it in one click. The charts (cumulative gaps, z), the detection tables, the price assumptions, the ranking and detection rules, the watch memory and the agent evaluation are further down, under headings that expand. In demo mode, the notes come from a script, with no AI."
    ],
    [
     "ul",
     [
      [
       "La règle de détection rapporte l'écart à l'erreur du modèle (le z) et retient les suites de périodes du même côté de la référence ; elle est écrite sous « Règle de tri et règle de détection ». Une dérive « en cours » touche la dernière période de données.",
       "The detection rule relates the gap to the model error (the z) and keeps runs of periods on the same side of the baseline; it is written under “Ranking rule and detection rule”. An “ongoing” drift reaches the last period of data."
      ],
      [
       "« + 3 mois » et la projection à 3 mois prolongent simplement l'écart moyen d'une dérive en cours : ce n'est pas une prévision.",
       "“+ 3 months” and the 3-month projection simply extend the average gap of an ongoing drift: it is not a forecast."
      ],
      [
       "Pour une dérive d'un compteur site, le détail dit quelle part de l'écart aucune UES suivie n'explique : elle vient d'usages qui ne sont pas suivis.",
       "For a site-meter drift, the details say what share of the gap no tracked SEU explains: it comes from uses that are not tracked."
      ],
      [
       "Sous « Courbes » : le cumul des écarts (CUSUM), dont la pente monte pendant une surconsommation qui dure et descend pendant une économie, avec en tirets la projection de l'écart moyen sur 3 mois ; puis le z de chaque période, avec les limites à ± 2 en pointillés.",
       "Under “Charts”: the cumulative sum of gaps (CUSUM), whose slope rises during a lasting overconsumption and falls during a saving, with the 3-month projection of the average gap as a dashed line; then each period's z, with the ± 2 limits as dashed lines."
      ],
      [
       "Sous « Coût et carbone : hypothèses » : le prix et le facteur d'émission de chaque énergie. Remplacez les valeurs par défaut par celles du site : tous les montants se recalculent.",
       "Under “Cost and carbon: assumptions”: each energy's price and emission factor. Replace the defaults with the site's values: every amount is recalculated."
      ],
      [
       "Dans la fiche, l'écart, le coût, les émissions et la projection sont calculés par la page, pas par l'agent. Survolez un nombre souligné pour voir d'où il vient ; un nombre surligné n'a été retrouvé dans aucun résultat. Les contrôles disent si les nombres sont présents, si l'écart est identique à celui de la page et ce qu'en pense le second agent ; « Copier » place la fiche dans le presse-papiers.",
       "In the note, the gap, cost, emissions and projection are computed by the page, not by the agent. Hover an underlined number to see where it comes from; a highlighted number was found in no result. The checks say whether the numbers are present, whether the gap matches the page's and what the second agent thinks; “Copy” puts the note on the clipboard."
      ],
      [
       "Le journal de l'agent, sous la fiche : une étape par tour, avec ce que l'agent a lu ; chaque ligne se déplie pour montrer l'appel exact.",
       "The agent log, under the note: one step per turn, with what the agent read; each line expands to show the exact call."
      ],
      [
       "Le mode, le modèle, la clé et l'autorisation d'envoi se règlent dans les réglages d'IA (bouton « IA », en bas du menu) ; une ligne de la page en rappelle l'état. Gemini et Claude demandent une clé API, à créer dans Google AI Studio ou dans la Console Anthropic. Si le serveur est surchargé, l'agent attend et réessaie tout seul.",
       "The mode, the model, the key and the authorisation to send are set in the AI settings (“AI” button, at the bottom of the menu); a line on the page shows their state. Gemini and Claude need an API key, created in Google AI Studio or in the Anthropic Console. If the server is overloaded, the agent waits and retries on its own."
      ],
      [
       "« Évaluer l'agent sur les plus gros épisodes » instruit à la suite 3, 5 ou 10 épisodes et donne quatre scores : fiches au bon format, nombres retrouvés dans les résultats, écarts identiques à ceux de la page, fiches jugées conformes par le second agent. Un épisode en échec peut être relancé seul.",
       "“Evaluate the agent on the largest episodes” investigates 3, 5 or 10 episodes in a row and gives four scores: notes in the right format, numbers found in the results, gaps matching the page's, notes the second agent finds compliant. A failed episode can be retried on its own."
      ]
     ]
    ],
    [
     "vers",
     [
      [
       "derives",
       "Ouvrir la page Dérives",
       "Open the Drifts page"
      ]
     ]
    ]
   ]
  };
  for (const id of ["detection", "instruction"]) { const k = GUIDE.findIndex(s => s.id === id); if (k >= 0) GUIDE.splice(k, 1); }   // trois pages devenues une
  const rang = GUIDE.findIndex(s => s.id === "partager");
  GUIDE.splice(rang < 0 ? GUIDE.length : rang, 0, ...sections);
  const apresUes = GUIDE.findIndex(s => s.id === "ues");                // dans l'ordre du menu : Site, UES, Dérives
  GUIDE.splice(apresUes < 0 ? (rang < 0 ? GUIDE.length : rang) : apresUes + 1, 0, derives);
  // les sections numérotées le sont dans l'ordre du mode d'emploi, sans trou ni doublon (une section ajoutée par un autre module s'y range)
  let numero = 0;
  for (const s of GUIDE) if (/^\d+\. /.test(s.t[0])) { numero++; s.t = s.t.map(x => x.replace(/^\d+\. /, numero + ". ")); }
  ajouterTraductions([["Anticipation", "Outlook"], ["Agents", "Agents"], ["Données", "Data"],
    ["le fichier est lu par votre navigateur et n'est envoyé nulle part. Exceptions, uniquement après votre accord explicite, donné dans les réglages d'IA (un accord, fonction par fonction) ou sur la page concernée, et vers l'API d'IA que vous choisissez (Google Gemini ou Anthropic) : l'instruction d'une dérive, la veille, la revue et l'évaluation envoient des valeurs du classeur ; le simulateur envoie la phrase que vous écrivez, avec les noms et les plages des facteurs ; l'intégration d'un fichier envoie les intitulés des colonnes et quelques valeurs.", "the file is read by your browser and is sent nowhere. Exceptions, only after your explicit consent, given in the AI settings (one consent, feature by feature) or on the page concerned, and to the AI API you choose (Google Gemini or Anthropic): investigating a drift, the watch, the review and the evaluation send values from the workbook; the simulator sends the sentence you write, with the names and ranges of the relevant variables; integrating a file sends the column headers and a few values."],
    ["Si la relecture par un second agent est active, la fiche et les mêmes résultats d'outils sont envoyés une seconde fois, dans une conversation séparée. Une évaluation, ou une série lancée depuis la page Dérives, répète ces envois pour chaque épisode.", "If the review by a second agent is on, the note and the same tool results are sent a second time, in a separate conversation. An evaluation, or a run started from the Drifts page, repeats these sends for each episode."]]);
})();
