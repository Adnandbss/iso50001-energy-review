/* Tests du module idee-11-ia : panneau de réglages d'IA, accord unique, clé, réponse en continu, agent au travail. */
const app_ = document.getElementById("app");
const boutonsDe = (n, re) => trouver(n, x => x.tagName === "BUTTON" && re.test(x.textContent));
const pause = ms => new Promise(r => setTimeout(r, ms));
const egal = (a, b) => JSON.stringify(trier(a)) === JSON.stringify(trier(b));
function trier(v) { return Array.isArray(v) ? v.map(trier) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, trier(v[k])])) : v; }
const page = id => { etat.onglet = id; rendre(); return texteDe(app_); };
const CLE = "cle-factice";

async function test() {
  /* ---- 1. Page Instruction : un rappel d'une ligne, plus de champ de clé ni d'avis ---- */
  let t = page("agent");
  verifier(/Mode démonstration : aucun appel réseau/.test(t) && boutonsDe(app_, /^Réglages d'IA$/).length === 1, "Instruction : rappel du mode avec un lien vers le panneau");
  verifier(!trouver(app_, n => n.tagName === "INPUT" && n.getAttribute("type") === "password").length && !/Avant le premier envoi/.test(t), "Instruction : ni champ de clé ni avis d'envoi sur la page");
  verifier(boutonsDe(app_, /^Lancer l'instruction$/).length === 1, "Instruction : le lancement reste sur la page");
  verifier(app_.querySelector(".panneau").contains(iaBouton) && /IA : démonstration \(sans IA\)/.test(iaBouton.textContent), "bouton permanent en bas du menu, badge « démonstration »");

  /* ---- 2. Panneau : boîte de dialogue accessible ---- */
  cliquer(iaBouton);
  verifier(iaVoile && document.body.contains(iaVoile) && iaDialogue.getAttribute("role") === "dialog" && iaDialogue.getAttribute("aria-modal") === "true", "le bouton ouvre une boîte de dialogue modale");
  verifier(app_.hasAttribute("inert"), "le reste de la page est inerte pendant que le panneau est ouvert");
  cliquer(boutonsDe(iaDialogue, /^Gemini \(API Google\)$/)[0]);
  verifier(!agent.demo && agent.fournisseur === "gemini" && /IA : Gemini · clé manquante/.test(iaBouton.textContent), "choix de Gemini : badge « clé manquante »");
  verifier(iaDialogue.contains(champCleGemini) && trouver(iaDialogue, n => n.tagName === "SELECT").length === 1, "le panneau porte la clé et le modèle");
  // piège du focus
  const f = iaFocusables(), vus = [];
  f[0].focus = () => vus.push("premier"); f[f.length - 1].focus = () => vus.push("dernier");
  document.activeElement = f[f.length - 1]; iaClavier({ key: "Tab", shiftKey: false, preventDefault() {} });
  document.activeElement = f[0]; iaClavier({ key: "Tab", shiftKey: true, preventDefault() {} });
  verifier(vus.join(",") === "premier,dernier", "Tab sur le dernier élément revient au premier, Maj+Tab sur le premier va au dernier");
  delete f[0].focus; delete f[f.length - 1].focus; document.activeElement = null;
  // modèle
  const sel = trouver(iaDialogue, n => n.tagName === "SELECT")[0];
  sel.value = "gemini-3.5-flash-lite"; sel.dispatchEvent({ type: "change", target: sel });
  verifier(agent.modeleGemini === "gemini-3.5-flash-lite", "le modèle se choisit dans le panneau");

  /* ---- 3. Clé : en mémoire, avertissement avant de quitter, garde dans l'onglet sur demande ---- */
  champCleGemini.value = CLE; champCleGemini.dispatchEvent({ type: "input", target: champCleGemini });
  verifier(/IA : Gemini · gemini-3\.5-flash-lite · accord à donner/.test(iaBouton.textContent), "clé saisie : badge « accord à donner »");
  verifier(localStorage.getItem(IA_STOCK.gemini) === null && localStorage.getItem(IA_STOCK.reglages) === null, "clé non gardée : rien n'est écrit dans le stockage");
  let empeche = false;
  verifier(iaAvantDeQuitter({ preventDefault() { empeche = true; } }) === "" && empeche, "clé saisie et non gardée : avertissement avant de quitter ou de recharger");
  const garde = trouver(iaDialogue, n => n.getAttribute("data-ia") === "garder")[0];
  verifier(garde && !garde.checked && /Garder la clé jusqu'à la fermeture de cet onglet/.test(texteDe(iaDialogue)) && /toute personne qui utilise ce poste/.test(texteDe(iaDialogue)), "case « Garder la clé » décochée par défaut, avec le risque expliqué");
  garde.checked = true; garde.dispatchEvent({ type: "change", target: garde });
  // dans le banc, sessionStorage et localStorage partagent le même faux stockage : on vérifie la clé de stockage utilisée
  verifier(IA_STOCK.gemini === "revue-energetique.ia.cle-gemini" && localStorage.getItem(IA_STOCK.gemini) === CLE && iaAvantDeQuitter({ preventDefault() {} }) === undefined, "clé gardée dans l'onglet (sessionStorage) : plus d'avertissement");
  champCleGemini.value = ""; agent.fournisseur = "anthropic"; iaGarder = false;
  iaRestaurer();
  verifier(champCleGemini.value === CLE && iaGarder && agent.fournisseur === "gemini" && agent.modeleGemini === "gemini-3.5-flash-lite" && agent.accord !== "gemini", "au rechargement : clé et mode reviennent, l'accord est redemandé");
  const garde2 = trouver(iaDialogue, n => n.getAttribute("data-ia") === "garder")[0];
  garde2.checked = false; garde2.dispatchEvent({ type: "change", target: garde2 });
  verifier(localStorage.getItem(IA_STOCK.gemini) === null && localStorage.getItem(IA_STOCK.reglages) === null, "décocher efface la clé gardée");
  etat.figee = "01/01/2026"; iaGarder = true; iaMemoriser();
  verifier(localStorage.getItem(IA_STOCK.gemini) === null, "copie figée : rien n'est écrit");
  etat.figee = null; iaGarder = false;

  /* ---- 4. Accord unique : les avis d'origine, une case par fonction, un bouton ---- */
  iaPeindrePanneau();
  t = texteDe(iaDialogue);
  verifier(/la description de l'épisode à instruire/.test(t) && /le dossier de faits de l'étape 1/.test(t) && /le texte d'une question du banc/.test(t) && /la phrase que vous avez écrite, telle quelle/.test(t) && /les intitulés des colonnes/.test(t),
    "le panneau reprend ce que liste l'avis de chaque page (Instruction, Revue, Évaluation, Simulateur, Intégration)");
  verifier(/Clé Gemini gratuite/.test(t) && /Ne sont pas envoyés/.test(t), "les mises en garde des avis d'origine sont reprises");
  const cases = trouver(iaDialogue, n => n.tagName === "INPUT" && /^f-/.test(n.getAttribute("data-ia") || ""));
  verifier(cases.length === IA_FONCTIONS.length && IA_FONCTIONS.length === 5 && cases.every(c => c.checked), "une case par fonction, cochée par défaut");
  verifier(boutonsDe(iaDialogue, /^J'autorise/).length === 1 && boutonsDe(iaDialogue, /^J'autorise ces envois pour cette session$/).length === 1, "un seul bouton d'accord (les boutons des avis d'origine sont retirés)");
  // décocher la première case bloque les autres
  cases[0].checked = false; cases[0].dispatchEvent({ type: "change", target: cases[0] });
  verifier(boutonsDe(iaDialogue, /^J'autorise ces envois/)[0].disabled && trouver(iaDialogue, n => n.getAttribute("data-ia") === "f-revue")[0].disabled, "sans la première case, les autres et le bouton sont désactivés");
  const c0 = trouver(iaDialogue, n => n.getAttribute("data-ia") === "f-instruction")[0]; c0.checked = true; c0.dispatchEvent({ type: "change", target: c0 });
  const cSim = trouver(iaDialogue, n => n.getAttribute("data-ia") === "f-simulateur")[0]; cSim.checked = false; cSim.dispatchEvent({ type: "change", target: cSim });
  verifier(agent.accord !== "gemini" && rev.accord !== "gemini" && __reseau.length === 0, "avant le clic : aucun accord, aucun envoi");
  cliquer(boutonsDe(iaDialogue, /^J'autorise ces envois pour cette session$/)[0]);
  verifier(agent.accord === "gemini" && rev.accord === "gemini" && evl.accord === "gemini" && itg.accord === "gemini" && sim.accord !== "gemini", "après le clic : les fonctions cochées sont autorisées, la case décochée ne l'est pas");
  verifier(!blocageEnvoi() && !revBlocage() && !evlBlocage() && /IA : Gemini · gemini-3\.5-flash-lite · prête/.test(iaBouton.textContent), "toutes les pages cochées sont prêtes ; badge « prête »");
  verifier(/Envois autorisés pour cette session/.test(texteDe(iaDialogue)) && boutonsDe(iaDialogue, /^Retirer l'autorisation partout$/).length === 1, "le panneau résume l'accord et permet de le retirer");
  // Échap ferme et rend le focus
  let retour = false; iaBouton.focus = () => { retour = true; };
  iaClavier({ key: "Escape", preventDefault() {} });
  verifier(!iaVoile && !app_.hasAttribute("inert") && retour, "Échap ferme le panneau et rend le focus au bouton");
  delete iaBouton.focus;

  /* ---- 5. Les pages autorisées n'affichent plus leur encadré ---- */
  t = page("revue");
  verifier(/Envoi autorisé \(réglages d'IA\)/.test(t) && !/Avant le premier envoi : ce que la revue fait quitter ce poste/.test(t) && !boutonsDe(app_, /^Rédiger la revue$/)[0].disabled, "Revue : une ligne « Envoi autorisé (réglages d'IA) · Modifier », lancement permis");
  verifier(!/Changer sur la page Instruction/.test(t) && boutonsDe(app_, /^Réglages d'IA$/).length >= 1, "Revue : le lien vers la page Instruction ouvre le panneau");
  t = page("evaluation");
  verifier(/Envoi autorisé \(réglages d'IA\)/.test(t) && !/ce que ce banc fait quitter ce poste/.test(t), "Évaluation : l'encadré d'accord devient une ligne");
  t = page("simulateur");
  verifier(/Avant le premier envoi : ce qui quittera ce poste/.test(t), "Simulateur, décoché dans le panneau : son propre avis reste affiché");
  cliquer(boutonsDe(app_, /^Modifier$/)[0] || boutonsDe(app_, /^Réglages d'IA$/)[0]);
  verifier(!!iaVoile, "les liens des pages ouvrent le panneau"); iaFermer();
  t = page("agent");
  verifier(/Rédacteur : Gemini \(gemini-3\.5-flash-lite\), relecture par un second agent : oui\. Envoi autorisé \(réglages d'IA\) · Modifier/.test(t), "Instruction : rappel d'une ligne de l'état prêt");
  revZero(etat.modele);
  verifier(rev.accord === "gemini", "l'accord du panneau survit à la remise à zéro d'une page (il vaut pour la session)");
  agent.fournisseur = "anthropic";
  verifier(agent.accord !== "anthropic" && rev.accord !== "anthropic" && /IA : Claude · clé manquante/.test((iaMajBadge(), iaBouton.textContent)), "changer de fournisseur redemande l'accord");
  agent.fournisseur = "gemini";
  iaOuvrir(); cliquer(boutonsDe(iaDialogue, /^Retirer l'autorisation partout$/)[0]);
  verifier(agent.accord === false && rev.accord === false && evl.accord === false && itg.accord === false && sim.accord === false, "retirer l'autorisation dans le panneau la retire partout");
  iaFermer();
  t = page("revue");
  verifier(/Avant le premier envoi : ce que la revue fait quitter ce poste/.test(t) && boutonsDe(app_, /^Rédiger la revue$/)[0].disabled, "après retrait : la page Revue redemande son accord et bloque le lancement");

  /* ---- 6. Anglais ---- */
  LANGUE = "en"; CACHE_TR.clear(); cacheDerives = null;
  t = page("agent");
  verifier(/AI: Gemini · gemini-3\.5-flash-lite · consent needed/.test(iaBouton.textContent) && /Writer: Gemini/.test(t), "anglais : badge et rappel traduits");
  iaOuvrir(); t = texteDe(iaDialogue);
  verifier(/AI settings/.test(t) && /Keep the key until this tab is closed/.test(t) && /I authorise these sends for this session/.test(t) && !/Réglages d'IA|Garder la clé/.test(t), "anglais : le panneau est traduit");
  iaFermer();
  iaCoches.add("simulateur"); iaAutoriser(); t = page("revue");
  verifier(/Sending authorised \(AI settings\) · Change/.test(t) && /AI: Gemini · gemini-3\.5-flash-lite · ready/.test(iaBouton.textContent), "anglais : la ligne d'accord et le badge « ready »");
  iaRetirer();
  LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null;

  /* ---- 7. Réponse en continu ---- */
  await testFlux();

  /* ---- 8. Agent au travail, notification de fin (mode démonstration, sans réseau) ---- */
  champCleGemini.value = ""; agent.demo = true; iaRetirer(); iaFermer();
  page("agent");
  choisirEpisode(derives().episodes[0]);
  iaSurveiller();
  verifier(!iaTravail.hidden && /Agent au travail : Instruction/.test(iaTravail.textContent) && boutonsDe(iaTravail, /^Arrêter$/).length === 1, "pendant l'instruction : indicateur « Agent au travail » avec « Arrêter »");
  page("site");
  verifier(app_.querySelector(".panneau").contains(iaTravail) && !iaTravail.hidden && boutonsDe(iaTravail, /^Voir$/).length === 1, "l'indicateur reste visible depuis une autre page");
  while (agent.enCours) await pause(50);
  iaSurveiller();
  verifier(iaTravail.hidden && document.body.contains(iaNotes) && /Fiche prête/.test(iaNotes.textContent), "à la fin : notification « Fiche prête » dans la page");
  cliquer(boutonsDe(iaNotes, /^Voir$/)[0]);
  verifier(etat.onglet === "agent" && !document.body.contains(iaNotes) && zoneFiche.querySelector("dl"), "« Voir » mène à la fiche");
  // arrêt depuis l'indicateur : pas de notification
  page("agent"); choisirEpisode(derives().episodes[1]); page("site"); iaSurveiller();
  cliquer(boutonsDe(iaTravail, /^Arrêter$/)[0]);
  while (agent.enCours) await pause(50);
  iaSurveiller();
  verifier(iaTravail.hidden && !document.body.contains(iaNotes) && agent.erreur === "Instruction arrêtée.", "arrêt depuis l'indicateur : l'agent s'arrête, sans notification");
  // veille : le nom et l'épisode
  if (typeof veiLancerSerie === "function") {
    page("veille"); const serie = veiLancerSerie(); iaSurveiller();
    verifier(/Agent au travail : Veille, épisode 1 sur \d/.test(iaTravail.textContent), "Veille : « Agent au travail : Veille, épisode 1 sur n »");
    page("site"); await serie; iaSurveiller();
    verifier(/Veille : \d+ fiche\(s\) prête\(s\) sur \d+/.test(iaNotes.textContent), "Veille : notification de fin");
    iaNotes.replaceChildren(); iaNotes.remove();
  }
  // copie figée : notifications retirées le temps du clonage, remises ensuite
  iaNoter("essai", "agent");
  const vraiClone = document.documentElement.cloneNode; let dansLaCopie = null;
  document.documentElement.cloneNode = function () { dansLaCopie = document.body.contains(iaNotes); return { querySelector: () => ({ replaceChildren() {}, set textContent(v) {} }), querySelectorAll: () => [], outerHTML: "" }; };
  try { copieFigee(); } catch (e) {}
  document.documentElement.cloneNode = vraiClone;
  verifier(dansLaCopie === false && document.body.contains(iaNotes), "copie figée : les notifications ne sont pas dans le clone, puis reviennent");
  LANGUE = "en"; CACHE_TR.clear(); for (const o of ONGLETS) { etat.onglet = o[0]; rendre(); } LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null; rendre();
  verifier(true, "toutes les pages se rendent en anglais et en français avec le module");
  iaNotes.replaceChildren(); iaNotes.remove();
  verifier(__reseau.length === 0, "aucun appel réseau dans tout le test");
}

/* ---- Faux fetch : flux SSE construits à la main, découpés aux endroits gênants ---- */
const enc = new TextEncoder();
function flux(octets, coupures, options) {
  options = options || {};
  const morceaux = []; let d = 0;
  for (const c of coupures.concat([octets.length])) { if (c > d) morceaux.push(octets.slice(d, c)); d = c; }
  let k = 0;
  return new ReadableStream({
    pull(ctl) {
      if (options.surMorceau) options.surMorceau(k);
      if (options.panneApres != null && k === options.panneApres) { ctl.error(new TypeError("network error")); return; }
      if (options.signal && options.bloquerApres != null && k === options.bloquerApres) return new Promise(() => {});
      if (k < morceaux.length) ctl.enqueue(morceaux[k++]); else ctl.close();
    }
  });
}
const reponseSSE = (texte, coupures, options) => new Response(flux(enc.encode(texte), coupures, options), { status: 200, headers: { "content-type": "text/event-stream" } });
const sse = evenements => evenements.map(([nom, o]) => (nom ? "event: " + nom + "\r\n" : "") + "data: " + JSON.stringify(o) + "\r\n\r\n").join("");
const requeteTest = { model: IA.modele, max_tokens: 100, system: "consigne", messages: [{ role: "user", content: "Bonjour" }], tools: OUTILS_API };
/* Coupures : au milieu d'une ligne « data: », au milieu d'un objet JSON, entre \r et \n, au milieu d'un caractère multi-octet. */
function coupuresGenantes(texte) {
  const o = enc.encode(texte), c = new Set([3, 7]);
  const s = new TextDecoder().decode(o);
  const i = s.indexOf("data:"); c.add(enc.encode(s.slice(0, i + 2)).length);
  const j = s.indexOf("{\"type\":\"content_block_delta\""); if (j > 0) c.add(enc.encode(s.slice(0, j + 20)).length);
  const r = s.indexOf("\r\n"); c.add(enc.encode(s.slice(0, r + 1)).length);
  for (const ch of ["é", "€", "🔥"]) { const p = s.indexOf(ch); if (p > 0) c.add(enc.encode(s.slice(0, p)).length + 1); }
  return [...c].filter(x => x > 0 && x < o.length).sort((a, b) => a - b);
}

async function testFlux() {
  const vraiFetch = globalThis.fetch, appels = [];
  agent.demo = false; agent.fournisseur = "anthropic"; agent.accord = "anthropic"; champCle.value = CLE;
  ATTENTES[0] = 0.01; ATTENTES[1] = 0.01;
  /* Claude : réflexion masquée, texte avec accents, appel d'outil en JSON partiel */
  const attendu = { id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", content: [
    { type: "thinking", thinking: "", signature: "sigABC" },
    { type: "text", text: "Je lis la série « Été » : 12 € 🔥." },
    { type: "tool_use", id: "toolu_1", name: "lire_serie", input: { nom: "Série é", de: "2024-01-01" } },
    { type: "tool_use", id: "toolu_2", name: "lister_series", input: {} }],
    stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 25, output_tokens: 89, cache_read_input_tokens: 0 } };
  const flA = sse([
    ["message_start", { type: "message_start", message: { id: "msg_test", type: "message", role: "assistant", content: [], model: "claude-opus-5-5", stop_reason: null, stop_sequence: null, usage: { input_tokens: 25, output_tokens: 1, cache_read_input_tokens: 0 } } }],
    ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "", signature: "" } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "" } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "sigABC" } }],
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    ["ping", { type: "ping" }],
    ["content_block_start", { type: "content_block_start", index: 1, content_block: { type: "text", text: "" } }],
    ["content_block_delta", { type: "content_block_delta", index: 1, delta: { type: "text_delta", text: "Je lis la série « É" } }],
    ["content_block_delta", { type: "content_block_delta", index: 1, delta: { type: "text_delta", text: "té » : 12 € 🔥." } }],
    ["content_block_stop", { type: "content_block_stop", index: 1 }],
    ["content_block_start", { type: "content_block_start", index: 2, content_block: { type: "tool_use", id: "toolu_1", name: "lire_serie", input: {} } }],
    ["content_block_delta", { type: "content_block_delta", index: 2, delta: { type: "input_json_delta", partial_json: "" } }],
    ["content_block_delta", { type: "content_block_delta", index: 2, delta: { type: "input_json_delta", partial_json: "{\"nom\": \"Sér" } }],
    ["content_block_delta", { type: "content_block_delta", index: 2, delta: { type: "input_json_delta", partial_json: "ie é\", \"de\": \"2024-01-01\"}" } }],
    ["content_block_stop", { type: "content_block_stop", index: 2 }],
    ["content_block_start", { type: "content_block_start", index: 3, content_block: { type: "tool_use", id: "toolu_2", name: "lister_series", input: {} } }],
    ["content_block_delta", { type: "content_block_delta", index: 3, delta: { type: "input_json_delta", partial_json: "" } }],
    ["content_block_stop", { type: "content_block_stop", index: 3 }],
    ["message_delta", { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 89 } }],
    ["message_stop", { type: "message_stop" }]]) + ": commentaire final\n";
  const cA = coupuresGenantes(flA);
  let vuTexte = "";
  globalThis.fetch = async (url, o) => { appels.push({ url: String(url), corps: JSON.parse(o.body) }); return reponseSSE(flA, cA, { surMorceau: () => { if (iaFlux.courant) vuTexte = iaFlux.courant.texte; } }); };
  let r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(egal(r, attendu), "Claude : la réponse reconstruite depuis le flux est identique à la réponse non continue");
  verifier(cA.length >= 6 && appels.length === 1 && appels[0].corps.stream === true && appels[0].corps.fallbacks === "default", "Claude : le corps demande le flux (stream: true), découpage gênant en " + (cA.length + 1) + " morceaux");
  verifier(vuTexte.length > 0 && "Je lis la série « Été » : 12 € 🔥.".startsWith(vuTexte) && vuTexte.length < 30, "Claude : le début du texte du modèle est visible avant la fin du flux (« " + vuTexte + " »)");
  verifier(iaFlux.courant === null && iaFlux.actif, "Claude : fin du tour, flux toujours actif");

  /* 429 puis succès ; erreur « overloaded » dans le flux puis succès */
  appels.length = 0;
  globalThis.fetch = async (url, o) => { appels.push(1); return appels.length === 1 ? new Response(JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "trop" } }), { status: 429, headers: { "content-type": "application/json" } }) : reponseSSE(flA, []); };
  r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(appels.length === 2 && egal(r, attendu), "Claude : HTTP 429, on patiente, puis la réponse en continu arrive");
  appels.length = 0;
  const flErreur = sse([["message_start", { type: "message_start", message: { id: "m", type: "message", role: "assistant", content: [], model: "x", usage: {} } }], ["error", { type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]]);
  globalThis.fetch = async () => { appels.push(1); return appels.length === 1 ? reponseSSE(flErreur, [10]) : reponseSSE(flA, [50]); };
  r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(appels.length === 2 && egal(r, attendu), "Claude : erreur « overloaded » dans le flux, on patiente comme pour un 529, puis succès");
  globalThis.fetch = async () => reponseSSE(sse([["error", { type: "error", error: { type: "authentication_error", message: "clé refusée" } }]]), []);
  try { await appelAnthropic(requeteTest, new AbortController().signal); verifier(false, "aurait dû échouer"); }
  catch (e) { verifier(/Clé API refusée ou expirée\. \(HTTP 401 : clé refusée\)/.test(e.message), "Claude : erreur d'authentification annoncée dans le flux, même message qu'en HTTP"); }

  /* Coupure en plein flux : repli vers l'appel sans flux, même réponse */
  appels.length = 0;
  globalThis.fetch = async (url, o) => { const c = JSON.parse(o.body); appels.push(c);
    return c.stream ? reponseSSE(flA, cA, { panneApres: 3 }) : new Response(JSON.stringify(attendu), { status: 200, headers: { "content-type": "application/json" } }); };
  r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(appels.length === 2 && appels[0].stream === true && !("stream" in appels[1]) && egal(r, attendu), "Claude : flux coupé en plein milieu, le même tour est refait sans flux");
  verifier(!iaFlux.actif && /coupé/.test(iaFlux.motif), "après un repli, le flux est désactivé pour la session (et le panneau le dit)");
  iaFlux.actif = true; iaFlux.motif = null;
  appels.length = 0;
  globalThis.fetch = async (url, o) => { const c = JSON.parse(o.body); appels.push(c); return c.stream ? reponseSSE(flA.slice(0, flA.indexOf("event: message_delta")), [40]) : new Response(JSON.stringify(attendu), { status: 200, headers: { "content-type": "application/json" } }); };
  r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(appels.length === 2 && egal(r, attendu), "Claude : flux terminé sans message_stop, repli sans flux");
  iaFlux.actif = true; iaFlux.motif = null;

  /* Arrêt demandé pendant le flux : erreur d'arrêt, pas de repli */
  appels.length = 0;
  const arret = new AbortController();
  globalThis.fetch = async (url, o) => { appels.push(1); return reponseSSE(flA, cA, { signal: o.signal, bloquerApres: 4 }); };
  const enCours = appelAnthropic(requeteTest, arret.signal);
  await pause(30); arret.abort();
  try { await enCours; verifier(false, "aurait dû s'arrêter"); }
  catch (e) { verifier(e.name === "AbortError" && appels.length === 1 && iaFlux.actif, "Claude : l'arrêt demandé interrompt le flux, sans nouvel essai"); }

  /* Relais sans flux : réponse JSON ordinaire acceptée telle quelle */
  globalThis.fetch = async () => new Response(JSON.stringify(attendu), { status: 200, headers: { "content-type": "application/json" } });
  r = await appelAnthropic(requeteTest, new AbortController().signal);
  verifier(egal(r, attendu) && iaFlux.actif, "Claude : une réponse non continue (relais) est lue telle quelle");

  /* Gemini : textes recollés, signature et appel de fonction gardés dans leur partie */
  agent.fournisseur = "gemini"; agent.accord = "gemini"; champCleGemini.value = CLE; agent.modeleGemini = "gemini-4-hydrogen";
  const jNonContinu = { responseId: "rid", modelVersion: "gemini-4-hydrogen", candidates: [{ content: { role: "model", parts: [
    { text: "Je lis la série « Été » : 12 € 🔥." }, { text: "", thoughtSignature: "sig1" },
    { functionCall: { id: "fc1", name: "lire_serie", args: { nom: "Série é" } }, thoughtSignature: "sig2" }, { functionCall: { id: "fc2", name: "episodes", args: { nom: "Série é" } } }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, thoughtsTokenCount: 300, totalTokenCount: 370 } };
  const flG = [
    { responseId: "rid", modelVersion: "gemini-4-hydrogen", candidates: [{ content: { role: "model", parts: [{ text: "Je lis la série « É" }] } }], usageMetadata: { promptTokenCount: 50 } },
    { responseId: "rid", modelVersion: "gemini-4-hydrogen", candidates: [{ content: { role: "model", parts: [{ text: "té » : 12 € " }, { text: "🔥." }] } }] },
    { responseId: "rid", modelVersion: "gemini-4-hydrogen", candidates: [{ content: { role: "model", parts: [{ text: "", thoughtSignature: "sig1" }] } }] },
    { responseId: "rid", modelVersion: "gemini-4-hydrogen", candidates: [{ content: { role: "model", parts: [{ functionCall: { id: "fc1", name: "lire_serie", args: { nom: "Série é" } }, thoughtSignature: "sig2" }, { functionCall: { id: "fc2", name: "episodes", args: { nom: "Série é" } } }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, thoughtsTokenCount: 300, totalTokenCount: 370 } }].map(o => "data: " + JSON.stringify(o) + "\n\n").join("");
  const cG = coupuresGenantes(flG), urls = [];
  let phrase = "";
  globalThis.fetch = async (url, o) => { urls.push(String(url)); phrase = iaFluxPhrase(iaFlux.courant); return reponseSSE(flG, cG); };
  r = await appelGemini(requeteTest, new AbortController().signal);
  const attenduG = reponseGemini(jNonContinu, "gemini-4-hydrogen");
  verifier(egal(r, attenduG), "Gemini : la réponse reconstruite depuis le flux est identique à celle de l'appel non continu");
  verifier(/:streamGenerateContent\?alt=sse$/.test(urls[0]) && !/key=/.test(urls[0]), "Gemini : appel streamGenerateContent?alt=sse, la clé reste dans l'en-tête");
  verifier(r.content.filter(b => b.type === "tool_use").length === 2 && r.content[1]._g.thoughtSignature === "sig1" && r.usage.output_tokens === 320, "Gemini : signatures gardées dans leur partie, usage du dernier fragment");
  verifier(/Le modèle réfléchit depuis 0 s/.test(phrase) && /32 à 76 s/.test(phrase), "attente honnête avec compteur, et la durée constatée pour ce modèle");
  // 429 puis succès
  urls.length = 0;
  globalThis.fetch = async url => { urls.push(String(url)); return urls.length === 1 ? new Response(JSON.stringify({ error: { code: 429, message: "quota", status: "RESOURCE_EXHAUSTED" } }), { status: 429, headers: { "content-type": "application/json" } }) : reponseSSE(flG, cG); };
  r = await appelGemini(requeteTest, new AbortController().signal);
  verifier(urls.length === 2 && egal(r, attenduG), "Gemini : HTTP 429, on patiente, puis succès en continu");
  // coupure sans raison de fin : repli sans flux
  urls.length = 0;
  globalThis.fetch = async url => { urls.push(String(url)); return /alt=sse/.test(url) ? reponseSSE(flG.slice(0, flG.lastIndexOf("data:")), [20]) : new Response(JSON.stringify(jNonContinu), { status: 200, headers: { "content-type": "application/json" } }); };
  r = await appelGemini(requeteTest, new AbortController().signal);
  verifier(urls.length === 2 && /:generateContent$/.test(urls[1]) && egal(r, attenduG), "Gemini : flux sans raison de fin, le même tour est refait sans flux");
  iaFlux.actif = true; iaFlux.motif = null;
  // tableau JSON (streamGenerateContent sans alt=sse)
  globalThis.fetch = async () => new Response(JSON.stringify(flG.split("\n\n").filter(Boolean).map(l => JSON.parse(l.slice(6)))), { status: 200, headers: { "content-type": "application/json" } });
  r = await appelGemini(requeteTest, new AbortController().signal);
  verifier(egal(r, attenduG), "Gemini : un tableau de réponses partielles est recollé de la même façon");
  // prompt bloqué
  globalThis.fetch = async () => reponseSSE("data: " + JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }) + "\n\n", []);
  try { await appelGemini(requeteTest, new AbortController().signal); verifier(false, "aurait dû échouer"); }
  catch (e) { verifier(/Gemini a bloqué la demande \(SAFETY\)/.test(e.message), "Gemini : demande bloquée, même message que sans flux"); }

  /* Lecteur SSE : lignes \r, \n et \r\n, commentaires, données sur plusieurs lignes */
  const vus = [], L = iaLecteurSSE((n, d) => vus.push(n + "=" + d));
  ["event: a\r", "\ndata: 1\rdata: 2\r", "\r: rien\n\nda", "ta: {\"x\":", "1}\n", "\n", "data: fin"].forEach(x => L.pousser(x)); L.finir();
  verifier(vus.join("|") === "a=1\n2|message={\"x\":1}", "lecteur SSE : découpage et fins de ligne variées (" + vus.join("|") + ")");

  /* Instruction complète en continu (Claude), avec affichage dans le journal */
  agent.fournisseur = "anthropic"; agent.accord = "anthropic"; agent.juge = false;
  let tour = 0;
  globalThis.fetch = async (url, o) => {
    tour++;
    const c = JSON.parse(o.body), ep = JSON.parse(/Épisode \(JSON\) : (\{.*\})/.exec(c.messages[0].content)[1]);
    const rep = await modeleDemo({ messages: c.messages }, new AbortController().signal);
    const ev = [["message_start", { type: "message_start", message: { id: "msg_" + tour, type: "message", role: "assistant", content: [], model: "claude-opus-5-5", usage: { input_tokens: 10, output_tokens: 1 } } }]];
    rep.content.forEach((b, k) => {
      if (b.type === "text") { ev.push(["content_block_start", { type: "content_block_start", index: k, content_block: { type: "text", text: "" } }]); ev.push(["content_block_delta", { type: "content_block_delta", index: k, delta: { type: "text_delta", text: b.text } }]); }
      else { const s = JSON.stringify(b.input); ev.push(["content_block_start", { type: "content_block_start", index: k, content_block: { type: "tool_use", id: b.id, name: b.name, input: {} } }]);
        for (let i = 0; i < s.length; i += 37) ev.push(["content_block_delta", { type: "content_block_delta", index: k, delta: { type: "input_json_delta", partial_json: s.slice(i, i + 37) } }]); }
      ev.push(["content_block_stop", { type: "content_block_stop", index: k }]);
    });
    ev.push(["message_delta", { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 42 } }], ["message_stop", { type: "message_stop" }]);
    const texte = sse(ev);
    return reponseSSE(texte, coupuresGenantes(texte));
  };
  page("agent"); agent.episode = derives().episodes[0];
  await lancerInstruction();
  verifier(!agent.erreur && zoneFiche.querySelector("dl") && tour === 4 && !journal.querySelector(".ia-flux"), "instruction complète en continu (4 tours) : fiche rendue, zone d'attente retirée du journal");
  globalThis.fetch = vraiFetch;
  ATTENTES[0] = 3; ATTENTES[1] = 8;
  agent.demo = true; agent.accord = false; agent.juge = true; champCle.value = ""; champCleGemini.value = ""; agent.modeleGemini = GEMINI.modele;
}
