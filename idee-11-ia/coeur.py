# Remplacements du coeur portés par le module idee-11-ia (réglages d'IA, réponse en continu).
# Chaque remplacement est court ; le code qu'ils appellent (iaFlux, iaLireFlux, iaFluxRepli, iaRappel) est dans module.js.

def patch(js, remplacer):
    # 1. API Anthropic : corps avec « stream: true » quand le flux est actif, lecture du flux, repli sans flux.
    js = remplacer(js, """  const corps = JSON.stringify(Object.assign({}, requete, { fallbacks: "default" }));                  // repli côté serveur si le modèle décline""",
                   """  let flux = iaFlux.actif;                                                 // réponse en continu (module IA), repli sans flux si elle échoue
  const corps = () => JSON.stringify(Object.assign({}, requete, { fallbacks: "default" }, flux ? { stream: true } : {}));   // repli côté serveur si le modèle décline""")
    js = remplacer(js, """rep = await fetch(IA.url, { method: "POST", signal, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", body: corps,""",
                   """rep = await fetch(IA.url, { method: "POST", signal, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", body: corps(),""")
    js = remplacer(js, """    if (rep.ok) return await rep.json();""",
                   """    if (rep.ok) {
      const r = flux ? await iaLireFlux(rep, "anthropic", signal) : { reponse: await rep.json() };
      if (r.repli) { iaFluxRepli(r.repli); flux = false; essai--; continue; }       // flux illisible ou coupé : le même tour, sans flux
      if (r.reponse) return r.reponse;
      if ((r.erreur.statut === 429 || r.erreur.statut >= 500) && await patienter(essai, r.erreur.statut, signal)) continue;   // erreur annoncée dans le flux
      throw new Error(messageErreurApi(r.erreur.statut, r.erreur.detail));
    }""")
    # 2. API Gemini : streamGenerateContent?alt=sse quand le flux est actif, mêmes règles.
    js = remplacer(js, """  if (!GEMINI.modeles.includes(modele)) throw new Error("Modèle Gemini inconnu.");""",
                   """  if (!GEMINI.modeles.includes(modele)) throw new Error("Modèle Gemini inconnu.");
  let flux = iaFlux.actif;                                                 // réponse en continu (module IA)""")
    js = remplacer(js, """rep = await fetch(GEMINI.url + modele + ":generateContent", {""",
                   """rep = await fetch(GEMINI.url + modele + (flux ? ":streamGenerateContent?alt=sse" : ":generateContent"), {""")
    js = remplacer(js, """    if (rep.ok) return reponseGemini(await rep.json(), modele);""",
                   """    if (rep.ok) {
      const r = flux ? await iaLireFlux(rep, "gemini", signal, modele) : { reponse: reponseGemini(await rep.json(), modele) };
      if (r.repli) { iaFluxRepli(r.repli); flux = false; essai--; continue; }
      if (r.reponse) return r.reponse;
      if ((r.erreur.statut === 429 || r.erreur.statut >= 500) && await patienter(essai, r.erreur.statut, signal)) continue;
      throw new Error(messageErreurGemini(r.erreur.statut, r.erreur.detail));
    }""")
    # 3. Le blocage renvoie vers le panneau de réglages d'IA, et non plus vers un encadré de la page Instruction.
    js = remplacer(js, """agent.accord !== agent.fournisseur ? "Autorisez d'abord l'envoi à " + F().api + " (encadré ci-dessus)." : !champDe().value.trim() ? "Saisissez votre clé " + F().court + "." : null;""",
                   """!champDe().value.trim() ? Lg("Saisissez votre clé " + F().court + " dans les réglages d'IA (bouton « IA », en bas du menu).", "Enter your " + M(F().court) + " key in the AI settings (“AI” button, at the bottom of the menu).")
  : agent.accord !== agent.fournisseur ? Lg("Autorisez d'abord l'envoi à " + F().api + " dans les réglages d'IA (bouton « IA », en bas du menu).", "First authorise sending to " + M(F().api) + " in the AI settings (“AI” button, at the bottom of the menu).") : null;""")
    # 4. Page Instruction : le choix du rédacteur, la clé, le modèle, la relecture et l'avis passent dans le panneau ; il reste un rappel d'une ligne.
    js = remplacer(js, """      filtre("Rédacteur", segments([{ v: "demo", t: "Mode démonstration (sans IA)" }, { v: "gemini", t: "Gemini (API Google)" }, { v: "anthropic", t: "Claude (API Anthropic)" }], agent.demo ? "demo" : agent.fournisseur, v => { if (!agent.enCours) { agent.demo = v === "demo"; if (!agent.demo) agent.fournisseur = v; agent.erreur = null; peindreAgent(); } })),
      agent.demo ? null : filtre("Clé " + F().court + " · gardée en mémoire, jamais enregistrée", champDe()),
      agent.demo || agent.fournisseur !== "gemini" ? null : filtre("Modèle Gemini", liste(GEMINI.modeles.map(x => ({ v: x, t: x })), agent.modeleGemini, v => { if (!agent.enCours) agent.modeleGemini = v; peindreAgent(); })),
      agent.demo ? null : filtre("Relecture par un second agent", segments([{ v: true, t: "Oui" }, { v: false, t: "Non" }], agent.juge, v => { if (!agent.enCours) { agent.juge = v; peindreAgent(); } })),
""", "")
    js = remplacer(js, """    agent.demo ? h("div", { class: "note", style: marge }, "Mode démonstration : aucun appel réseau, aucune IA. Un script joue le rôle du modèle : il appelle les mêmes outils en trois tours, puis assemble une fiche à partir de leurs résultats, sans raisonnement.")
      : agent.accord === agent.fournisseur ? h("div", { class: "note", style: marge }, "Envoi à " + F().api + " autorisé pour cette session (modèle " + modeleIA() + "). ",
          h("button", { class: "lien", onclick: () => { agent.accord = false; peindreAgent(); } }, "Retirer l'autorisation"), " · ", h("button", { class: "lien", onclick: () => { champDe().value = ""; } }, "Effacer la clé"))
      : avisEnvoi(),""", """    iaRappel(marge),""")
    # 5. Mode d'emploi : le texte de la page Instruction dit où se règle l'IA (la capture d'écran, elle, reste à refaire).
    js = remplacer(js, """["Le rédacteur. Le mode démonstration fonctionne sans IA et sans clé : il montre le déroulé. Gemini et Claude demandent une clé API, à créer dans Google AI Studio ou dans la Console Anthropic ; le champ de la clé et l'autorisation d'envoi apparaissent alors ici.",
        "The writer. Demo mode works with no AI and no key: it shows how a run unfolds. Gemini and Claude need an API key, created in Google AI Studio or in the Anthropic Console; the key field and the authorisation to send then appear here."],""",
                   """["Le rédacteur. Le mode démonstration fonctionne sans IA et sans clé : il montre le déroulé. Gemini et Claude demandent une clé API, à créer dans Google AI Studio ou dans la Console Anthropic. Le mode, le modèle, la clé et l'autorisation d'envoi se règlent dans le panneau « Réglages d'IA », ouvert par le bouton « IA » en bas du menu ; cette ligne en rappelle l'état.",
        "The writer. Demo mode works with no AI and no key: it shows how a run unfolds. Gemini and Claude need an API key, created in Google AI Studio or in the Anthropic Console. The mode, the model, the key and the authorisation to send are set in the “AI settings” panel, opened with the “AI” button at the bottom of the menu; this line shows their state."],""")
    js = remplacer(js, """["p", "Avec une IA, lisez l'encadré qui liste ce qui sera envoyé avant d'autoriser. La clé reste en mémoire le temps de la session, elle n'est enregistrée nulle part. Si le serveur est surchargé, l'agent attend et réessaie tout seul.",
      "With an AI, read the box listing what will be sent before you authorise it. The key stays in memory for the session; it is stored nowhere. If the server is overloaded, the agent waits and retries on its own."],""",
                   """["p", "Avec une IA, lisez dans les réglages d'IA ce que chaque fonction enverra avant d'autoriser : un seul accord vaut pour toutes les pages cochées, jusqu'au rechargement de la page. La clé reste en mémoire, elle n'est enregistrée nulle part, sauf si vous cochez « Garder la clé jusqu'à la fermeture de cet onglet ». La réponse du modèle s'affiche au fil de l'eau ; si le serveur est surchargé, l'agent attend et réessaie tout seul.",
      "With an AI, read in the AI settings what each feature will send before you authorise it: a single consent covers every ticked page, until the page is reloaded. The key stays in memory and is stored nowhere, unless you tick “Keep the key until this tab is closed”. The model's answer is shown as it arrives; if the server is overloaded, the agent waits and retries on its own."],""")
    return js
