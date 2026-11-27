/* ============================================================================
   Module « Réglages d'IA » (préfixe ia).
   1. Un seul panneau, ouvert par un bouton en bas du menu : mode, modèle, clé, relecture, et un accord
      unique qui reprend l'avis de chaque page. L'accord donné ici positionne les drapeaux d'accord des pages.
   2. Réponse en continu (flux SSE) pour Gemini et Claude, avec repli sans flux ; ce qui arrive s'affiche.
   3. Travail d'agent visible depuis toutes les pages, et notification à la fin.
   La clé ne vit que dans le champ du cœur (champCle, champCleGemini) ; sur demande explicite,
   dans sessionStorage, jamais dans localStorage, l'adresse ou le HTML.
   ============================================================================ */

/* ---- 1. Accord unique : une case par fonction qui envoie à une IA ---- */
const iaPresent = nom => { try { return eval("typeof " + nom) !== "undefined"; } catch (e) { return false; } };    // module absent de l'assemblage, ou pas encore initialisé
const IA_FONCTIONS = [
  { id: "instruction", page: "agent", titre: ["Instruction d'une dérive, évaluation de l'agent et séries de la page Veille", "Investigating a drift, evaluating the agent and runs from the Watch page"],
    objet: () => agent, avis: () => avisEnvoi() },
  { id: "revue", page: "revue", titre: ["Revue énergétique (page Revue)", "Energy review (Review page)"],
    objet: () => iaPresent("rev") ? rev : null, avis: () => revAvis() },
  { id: "banc", page: "evaluation", titre: ["Banc d'évaluation (page Évaluation)", "Evaluation bench (Evaluation page)"],
    objet: () => iaPresent("evl") ? evl : null, avis: () => evlAvis() },
  { id: "simulateur", page: "simulateur", titre: ["Phrase du simulateur (page Simulateur)", "Simulator sentence (Simulator page)"],
    objet: () => iaPresent("sim") ? sim : null, avis: () => simAvisEnvoi() },
  { id: "integration", page: "itg", titre: ["Rôles des colonnes d'un fichier intégré (page Intégration), pour chaque fichier intégré pendant la session", "Column roles of an integrated file (Integration page), for each file integrated during the session"],
    objet: () => iaPresent("itg") ? itg : null, avis: () => itg.table ? itgAvis() : iaAvisIntegration() }
].filter(f => f.objet());
const iaAccord = { fournisseur: null, fonctions: new Set() };                  // accord donné dans le panneau : fournisseur et fonctions cochées
const iaCoches = new Set(IA_FONCTIONS.map(f => f.id));                          // cases du panneau, cochées par défaut
const iaCouvre = id => !!iaAccord.fournisseur && iaAccord.fournisseur === agent.fournisseur && iaAccord.fonctions.has(id);
/* Le drapeau « accord » de chaque page devient une propriété calculée : vrai si le panneau couvre la page, sinon la valeur que la page a posée elle-même.
   Les remises à zéro des pages (nouveau classeur) ne touchent que leur valeur propre : l'accord du panneau vaut pour la session. */
for (const f of IA_FONCTIONS) {
  const o = f.objet();
  let propre = o.accord;
  Object.defineProperty(o, "accord", { configurable: true, enumerable: true, get: () => iaCouvre(f.id) ? iaAccord.fournisseur : propre, set: v => { propre = v; } });
}
function iaAutoriser() {
  if (agent.demo || !iaCoches.has("instruction")) return;
  iaAccord.fournisseur = agent.fournisseur; iaAccord.fonctions = new Set(iaCoches);
  agent.erreur = null; iaChange();
}
function iaRetirer() {                                                          // retire l'accord partout, y compris ceux donnés sur les pages
  iaAccord.fournisseur = null; iaAccord.fonctions = new Set();
  for (const f of IA_FONCTIONS) f.objet().accord = false;
  iaChange();
}
/* Avis de la page Intégration quand aucun fichier n'est ouvert : le même texte que itgAvis(), sans les nombres propres au fichier. */
function iaAvisIntegration() {
  const f = F(), k = iaPresent("ITG") ? ITG.exemples : null;
  return h("div", { class: "avis" },
    h("p", null, Lg("Pour chaque fichier que vous intégrerez, cette page enverra à " + f.api + " (" + f.hote + ", société " + f.societe + "), avec votre clé :", "For each file you integrate, this page will send to " + M(f.api) + " (" + f.hote + ", " + f.societe + "), with your key:")),
    h("ul", null,
      h("li", null, "les intitulés des colonnes, tels qu'ils sont dans le fichier ;"),
      h("li", null, Lg("par colonne : type deviné, unité et énergie lues, part de manquants, minimum, maximum, moyenne et " + (k || "quelques") + " premières valeurs ;", "per column: guessed type, unit and energy read, share of missing values, minimum, maximum, mean and first " + (k || "few") + " values;")),
      h("li", null, "le nombre de lignes, le pas de temps, les dates extrêmes, la forme du tableau ; une consigne et un outil de réponse fixes.")),
    h("p", null, Lg("Ne partent pas : le fichier, son nom, les autres lignes, les modèles. La conservation par " + f.societe + " dépend de votre compte. La page Intégration montre tout ce qui sera envoyé avant chaque demande.", "Not sent: the file, its name, the other rows, the models. Retention by " + f.societe + " depends on your account. The Integration page shows everything that will be sent before each request.")));
}
/* Contenu d'un avis d'origine, sans son bouton d'accord : le texte reste celui de la page, mot pour mot. */
function iaContenuAvis(fn) {
  try { return [...fn.avis().childNodes].filter(c => !(c.nodeType === 1 && (c.tagName === "BUTTON" || c.querySelector("button")))); }
  catch (e) { return [h("p", null, "Le détail de cet envoi s'affiche sur la page concernée, avant tout envoi.")]; }
}

/* ---- 2. La clé : jamais dans localStorage ; dans sessionStorage seulement si la case est cochée ---- */
const IA_STOCK = { gemini: "revue-energetique.ia.cle-gemini", anthropic: "revue-energetique.ia.cle-anthropic", reglages: "revue-energetique.ia.reglages" };
let iaGarder = false;
const iaChamp = f => f === "gemini" ? champCleGemini : champCle;
function iaSession(f) { try { return f(sessionStorage); } catch (e) { return null; } }
function iaMemoriser() {
  if (etat.figee) return;
  iaSession(s => {
    for (const f of ["gemini", "anthropic"]) { const v = iaChamp(f).value.trim(); if (iaGarder && v) s.setItem(IA_STOCK[f], v); else s.removeItem(IA_STOCK[f]); }
    if (iaGarder) s.setItem(IA_STOCK.reglages, JSON.stringify({ demo: agent.demo, fournisseur: agent.fournisseur, modeleGemini: agent.modeleGemini, juge: agent.juge }));
    else s.removeItem(IA_STOCK.reglages);
  });
}
function iaRestaurer() {                                                        // au chargement : une clé gardée dans cet onglet revient, avec le mode choisi ; l'accord, lui, est redemandé
  const lu = iaSession(s => ({ gemini: s.getItem(IA_STOCK.gemini), anthropic: s.getItem(IA_STOCK.anthropic), reglages: s.getItem(IA_STOCK.reglages) }));
  if (!lu || !(lu.gemini || lu.anthropic)) return;
  if (lu.gemini) champCleGemini.value = lu.gemini;
  if (lu.anthropic) champCle.value = lu.anthropic;
  iaGarder = true;
  try {
    const r = JSON.parse(lu.reglages || "{}");
    if (r.fournisseur in FOURNISSEURS) agent.fournisseur = r.fournisseur;
    if (GEMINI.modeles.includes(r.modeleGemini)) agent.modeleGemini = r.modeleGemini;
    if (typeof r.juge === "boolean") agent.juge = r.juge;
    if (typeof r.demo === "boolean") agent.demo = r.demo;
  } catch (e) {}
}
iaRestaurer();
for (const c of [champCle, champCleGemini]) c.addEventListener("input", () => { iaMemoriser(); iaMajBadge(); });
/* Avant de quitter ou de recharger : une clé saisie et non gardée serait perdue, un agent au travail serait interrompu. */
function iaAvantDeQuitter(e) {
  const cle = !iaGarder && !!(champCle.value.trim() || champCleGemini.value.trim());
  if (!cle && !iaActivite()) return undefined;
  if (e) { e.preventDefault(); e.returnValue = ""; }
  return "";
}
addEventListener("beforeunload", iaAvantDeQuitter);

/* ---- 3. Bouton et badge d'état, en bas du menu ---- */
const iaNomModele = () => agent.fournisseur === "gemini" ? agent.modeleGemini : IA.modele;
function iaEtat() {
  if (agent.demo) return { classe: "demo", texte: Lg("IA : démonstration (sans IA)", "AI: demo (no AI)") };
  const nom = F().nom;
  if (!champDe().value.trim()) return { classe: "attention", texte: Lg("IA : " + nom + " · clé manquante", "AI: " + nom + " · key missing") };
  if (agent.accord !== agent.fournisseur) return { classe: "attention", texte: Lg("IA : " + nom + " · " + iaNomModele() + " · accord à donner", "AI: " + nom + " · " + iaNomModele() + " · consent needed") };
  return { classe: "pret", texte: Lg("IA : " + nom + " · " + iaNomModele() + " · prête", "AI: " + nom + " · " + iaNomModele() + " · ready") };
}
const iaBouton = h("button", { type: "button", class: "ia-bouton", "aria-haspopup": "dialog", onclick: () => iaOuvrir() });
const iaTravail = h("div", { class: "ia-travail", hidden: true });
const iaPied = h("div", { class: "ia-pied" }, iaBouton, iaTravail);
function iaMajBadge() {
  const e = iaEtat();
  iaBouton.className = "ia-bouton " + e.classe;
  iaBouton.replaceChildren(h("span", { class: "voyant " + (e.classe === "pret" ? "bon" : e.classe === "attention" ? "" : "ia-gris"), "aria-hidden": "true" }), h("span", null, e.texte));
  iaBouton.setAttribute("title", tr("Ouvrir les réglages d'IA : mode, modèle, clé et accord d'envoi"));
}
const iaLien = (texte, inactif) => h("button", { type: "button", class: "lien", disabled: !!inactif, onclick: () => iaOuvrir() }, texte || "Réglages d'IA");
/* Rappel d'une ligne sur la page Instruction (appelé par peindreAgent, voir coeur.py). */
function iaRappel(marge) {
  if (agent.demo) return h("div", { class: "note", style: marge }, "Mode démonstration : aucun appel réseau, aucune IA. Un script joue le rôle du modèle : il appelle les mêmes outils en trois tours, puis assemble une fiche à partir de leurs résultats, sans raisonnement.", " ", iaLien());
  const motif = blocageEnvoi();
  return h("div", { class: "note" + (motif ? " attention" : ""), style: marge },
    Lg("Rédacteur : " + F().nom + " (" + modeleIA() + "), relecture par un second agent : " + (agent.juge ? "oui" : "non") + ". ", "Writer: " + F().nom + " (" + modeleIA() + "), review by a second agent: " + (agent.juge ? "yes" : "no") + ". "),
    motif ? [Lg("Envoi pas encore prêt. ", "Sending not ready yet. "), iaLien("Ouvrir les réglages d'IA")] : ["Envoi autorisé (réglages d'IA) · ", iaLien("Modifier")]);
}
const iaLigneAccord = () => h("div", { class: "note ia-ligne" }, "Envoi autorisé (réglages d'IA) · ", iaLien("Modifier"));

/* Les pages des autres modules gardent leur code : on retouche leur rendu. Les liens « page Instruction » ouvrent le panneau ;
   l'encadré « autorisé · Retirer l'autorisation » devient une ligne quand le panneau couvre la page. */
const IA_LIENS = ["Changer de mode (page Instruction)", "Changer sur la page Instruction", "Changer d'agent sur la page Instruction", "Changer de mode sur la page Instruction"];
function iaRetoucher(noeud, id) {
  if (!noeud || !noeud.querySelectorAll) return;
  const est = (b, fr) => b.textContent === fr || b.textContent === tr(fr);
  for (const b of noeud.querySelectorAll("button.lien")) {
    if (IA_LIENS.some(fr => est(b, fr))) b.replaceWith(iaLien(null, b.disabled));
    else if (id && iaCouvre(id) && est(b, "Retirer l'autorisation") && b.parentNode) b.parentNode.replaceWith(iaLigneAccord());
  }
  if (id === "integration" && iaCouvre(id) && !noeud.querySelector(".ia-ligne")) {
    const b = [...noeud.querySelectorAll("button")].find(x => /^(Demander une proposition à|Ask for a proposal from) /.test(x.textContent));
    if (b && b.parentNode) {
      let detail = null;
      try { detail = h("details", { class: "ia-detail" }, h("summary", null, "Voir tout ce qui sera envoyé"), h("pre", null, document.createTextNode(JSON.stringify(itgRequete(itgCharge()), null, 1)))); } catch (e) {}
      b.parentNode.after(h("div", { class: "note ia-ligne" }, "Envoi autorisé (réglages d'IA) · ", iaLien("Modifier")), detail);
    }
  }
}
function iaEnvelopperPeinture(nom, noeud, id) {
  let f; try { f = eval(nom); } catch (e) { return; }
  if (typeof f !== "function") return;
  const enveloppe = function () { const r = f.apply(this, arguments); iaRetoucher(noeud(), id); return r; };
  try { eval(nom + " = enveloppe"); } catch (e) {}
}
iaEnvelopperPeinture("simPeindreIA", () => simZoneIA, "simulateur");
iaEnvelopperPeinture("revPeindre", () => revNoeud, "revue");
iaEnvelopperPeinture("evlPeindre", () => evlNoeud, "banc");
iaEnvelopperPeinture("itgPeindre", () => itgNoeud, "integration");
iaEnvelopperPeinture("veiPeindre", () => veiNoeud, null);
APRES_RENDU.push(() => {
  const panneau = app.querySelector(".panneau");                                // dernier élément du panneau, collé en bas quand le menu défile
  if (panneau && iaPied.parentNode !== panneau) panneau.append(iaPied);
  iaMajBadge(); iaSurveiller();
  iaRetoucher(app.querySelector(".feuille"), null);
});

/* ---- 4. Le panneau : boîte de dialogue modale, focus piégé, Échap, retour du focus ---- */
let iaVoile = null, iaDialogue = null, iaRetour = null;
const iaFocusables = () => iaDialogue ? [...iaDialogue.querySelectorAll("button, input, select, textarea, summary")].filter(n => !n.disabled && !n.closest("[hidden]")) : [];
function iaOuvrir() {
  if (iaVoile) return;
  iaRetour = document.activeElement;
  iaDialogue = h("div", { class: "ia-dialogue", role: "dialog", "aria-modal": "true", "aria-labelledby": "ia-titre", tabindex: "-1", onkeydown: iaClavier });
  iaVoile = h("div", { class: "ia-voile ia-hors-app", onclick: e => { if (e.target === iaVoile) iaFermer(); } }, iaDialogue);
  document.body.append(iaVoile);
  app.setAttribute("inert", ""); document.body.classList.add("ia-modal");
  iaPeindrePanneau();
  const premier = iaFocusables()[0];
  (premier || iaDialogue).focus();
}
function iaFermer() {
  if (!iaVoile) return;
  iaVoile.remove(); iaVoile = iaDialogue = null;
  app.removeAttribute("inert"); document.body.classList.remove("ia-modal");
  if (etat.modele) rendre();                                                    // la page reflète les nouveaux réglages
  const cible = iaRetour && iaRetour.isConnected !== false && document.body.contains(iaRetour) ? iaRetour : iaBouton;
  iaRetour = null;
  if (cible && cible.focus) cible.focus();
}
function iaClavier(e) {
  if (e.key === "Escape") { e.preventDefault(); iaFermer(); return; }
  if (e.key !== "Tab") return;
  const f = iaFocusables();
  if (!f.length) { e.preventDefault(); return; }
  const actif = document.activeElement, dedans = !!actif && iaDialogue.contains(actif);
  if (e.shiftKey && (!dedans || actif === f[0])) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && (!dedans || actif === f[f.length - 1])) { e.preventDefault(); f[0].focus(); }
}
function iaChange() { iaPeindrePanneau(); iaMajBadge(); }
const iaMarquer = (n, cle) => { n.querySelectorAll("button").forEach((b, k) => b.setAttribute("data-ia", cle + "-" + k)); return n; };
function iaPeindrePanneau() {
  if (!iaDialogue) return;
  const actif = document.activeElement, cle = actif && iaDialogue.contains(actif) && actif.getAttribute ? actif.getAttribute("data-ia") : null;
  const occupe = !!iaActivite(), demo = agent.demo;
  const mode = iaMarquer(segments([{ v: "demo", t: "Démonstration (sans IA)" }, { v: "gemini", t: "Gemini (API Google)" }, { v: "anthropic", t: "Claude (API Anthropic)" }], demo ? "demo" : agent.fournisseur,
    v => { if (iaActivite()) return; agent.demo = v === "demo"; if (!agent.demo) agent.fournisseur = v; agent.erreur = null; iaMemoriser(); iaChange(); }), "mode");
  const juge = iaMarquer(segments([{ v: true, t: "Oui" }, { v: false, t: "Non" }], agent.juge, v => { if (iaActivite()) return; agent.juge = v; iaMemoriser(); iaChange(); }), "juge");
  if (occupe) for (const b of [...mode.querySelectorAll("button"), ...juge.querySelectorAll("button")]) b.disabled = true;
  const modele = agent.fournisseur === "gemini"
    ? liste(GEMINI.modeles.map(x => ({ v: x, t: x })), agent.modeleGemini, v => { if (iaActivite()) return; agent.modeleGemini = v; iaMemoriser(); iaChange(); })
    : h("span", { class: "ia-fixe" }, IA.modele);
  if (modele.tagName === "SELECT") { modele.setAttribute("data-ia", "modele"); modele.disabled = occupe; }
  iaDialogue.replaceChildren(
    h("div", { class: "ia-tete" }, h("h2", { id: "ia-titre" }, "Réglages d'IA"), h("button", { type: "button", class: "btn petit", "data-ia": "fermer", onclick: iaFermer, "aria-label": "Fermer les réglages d'IA" }, "Fermer")),
    h("div", { class: "ia-corps" },
      h("p", { class: "note ia-sans-marge" }, "Ces réglages valent pour toutes les pages qui font appel à une IA : Instruction, Veille, Revue, Évaluation, Simulateur et Intégration."),
      h("div", { class: "filtres" }, filtre("Mode", mode), demo ? null : filtre("Modèle", modele), demo ? null : filtre("Relecture par un second agent", juge)),
      occupe ? h("div", { class: "note attention" }, "Un agent travaille : le mode, le modèle et la relecture se changent quand il a fini.") : null,
      demo ? h("div", { class: "note" }, "Mode démonstration : aucune IA, aucun appel réseau, aucun accord à donner. Chaque page utilise un script qui joue le rôle du modèle, et le dit.")
        : [iaBlocCle(), iaBlocAccord()],
      demo || iaFlux.actif ? null : h("div", { class: "note attention" }, Lg("Réponse en continu désactivée pour cette session (" + iaFlux.motif + ") : les réponses arrivent en une fois. ", "Streaming turned off for this session (" + iaFlux.motif + "): answers arrive all at once. "),
        h("button", { type: "button", class: "lien", "data-ia": "flux", onclick: () => { iaFlux.actif = true; iaFlux.motif = null; iaChange(); } }, "La réactiver"))));
  const retour = cle ? iaDialogue.querySelector('[data-ia="' + cle + '"]') : null;
  if (retour && !retour.disabled) retour.focus(); else if (actif && !document.body.contains(actif)) iaDialogue.focus();
}
function iaBlocCle() {
  const garder = h("input", { type: "checkbox", "data-ia": "garder", checked: iaGarder, onchange: e => { iaGarder = !!e.target.checked; iaMemoriser(); iaChange(); } });
  return h("div", { class: "ia-cle" },
    filtre(Lg("Clé " + F().court, M(F().court) + " key"), champDe()),
    h("p", { class: "note ia-sans-marge" }, Lg(agent.fournisseur === "gemini" ? "Clé à créer dans Google AI Studio. " : "Clé à créer dans la Console Anthropic. ", agent.fournisseur === "gemini" ? "Create the key in Google AI Studio. " : "Create the key in the Anthropic Console. "),
      h("button", { type: "button", class: "lien", "data-ia": "effacer", onclick: () => { champDe().value = ""; iaMemoriser(); iaChange(); } }, "Effacer la clé")),
    h("label", { class: "ia-case" }, garder, h("span", null, "Garder la clé jusqu'à la fermeture de cet onglet")),
    h("p", { class: "note ia-sans-marge" }, iaGarder
      ? "La clé est gardée dans la mémoire de session de cet onglet : elle survit à un rechargement et s'efface à la fermeture de l'onglet. Risque : tant que l'onglet reste ouvert, toute personne qui utilise ce poste, ou tout script exécuté dans cette page, peut la lire. Ne cochez pas sur un poste partagé."
      : "Sans cette case, la clé reste en mémoire et disparaît au rechargement de la page ; la page vous prévient avant. Si vous la cochez, la clé est gardée dans la mémoire de session de cet onglet jusqu'à sa fermeture : toute personne qui utilise ce poste, ou tout script exécuté dans cette page, pourrait alors la lire. Elle n'est jamais écrite dans le stockage durable du navigateur, dans l'adresse, ni dans une copie figée."));
}
function iaBlocAccord() {
  const f = F();
  if (iaAccord.fournisseur === agent.fournisseur) {
    const titres = IA_FONCTIONS.filter(x => iaAccord.fonctions.has(x.id)).map(x => Lg(x.titre[0], x.titre[1]));
    return h("div", { class: "ia-accord ia-donne" },
      h("p", null, h("span", { class: "voyant bon", "aria-hidden": "true" }), " ", h("b", null, Lg("Envois autorisés pour cette session vers " + f.api + " : ", "Sending to " + M(f.api) + " authorised for this session: ")), titres.join(" ; ") + "."),
      h("p", { class: "note ia-sans-marge" }, "L'accord vaut jusqu'au rechargement de la page, pour ce fournisseur seulement. Chaque page montre toujours le message exact envoyé dans son journal."),
      h("p", null, h("button", { type: "button", class: "btn", "data-ia": "retirer", onclick: iaRetirer }, "Retirer l'autorisation partout")));
  }
  const base = iaCoches.has("instruction");
  return h("div", { class: "avis ia-accord" },
    h("p", null, h("b", null, "Un seul accord pour toutes les pages. "), Lg("Voici, fonction par fonction, ce qui partira vers " + f.api + " (" + f.hote + ", société " + f.societe + "), avec votre clé, quand vous lancerez l'action sur la page concernée. Décochez ce que vous ne voulez pas autoriser.",
      "Here is, feature by feature, what will go to " + M(f.api) + " (" + f.hote + ", " + f.societe + "), with your key, when you start the action on the page concerned. Untick what you do not want to authorise.")),
    IA_FONCTIONS.map(fn => {
      const bloque = fn.id !== "instruction" && !base, coche = iaCoches.has(fn.id) && !bloque;
      return h("div", { class: "ia-fonction" + (coche ? "" : " ia-off") },
        h("label", { class: "ia-case" }, h("input", { type: "checkbox", "data-ia": "f-" + fn.id, checked: coche, disabled: bloque,
          onchange: e => { if (e.target.checked) iaCoches.add(fn.id); else iaCoches.delete(fn.id); iaPeindrePanneau(); } }), h("b", null, Lg(fn.titre[0], fn.titre[1]))),
        h("div", { class: "ia-avis" }, iaContenuAvis(fn)));
    }),
    base ? null : h("p", { class: "note attention" }, "La première case est nécessaire : toutes les fonctions passent par le même accès à l'IA."),
    h("p", null, h("button", { type: "button", class: "btn principal", "data-ia": "autoriser", disabled: !base, onclick: iaAutoriser }, "J'autorise ces envois pour cette session"),
      " ", "Rien n'est envoyé tant que vous n'avez pas cliqué, puis lancé une action sur une page. L'accord vaut jusqu'au rechargement de la page, pour ce fournisseur seulement."));
}

/* ---- 5. Réponse en continu : lecture des flux SSE de Claude et de Gemini ---- */
const iaFlux = { actif: true, motif: null, courant: null };
/* Lecteur SSE : découpe en événements quel que soit le découpage des paquets (au milieu d'une ligne, d'un objet JSON ou d'un caractère). */
function iaLecteurSSE(surEvenement) {
  let tampon = "", donnees = [], nom = "";
  const ligne = l => {
    if (l === "") { if (donnees.length) surEvenement(nom || "message", donnees.join("\n")); donnees = []; nom = ""; return; }
    if (l[0] === ":") return;                                                   // commentaire
    const i = l.indexOf(":"), champ = i < 0 ? l : l.slice(0, i);
    let v = i < 0 ? "" : l.slice(i + 1);
    if (v[0] === " ") v = v.slice(1);
    if (champ === "data") donnees.push(v); else if (champ === "event") nom = v;
  };
  return {
    pousser(t) {
      tampon += t;
      for (;;) {
        const k = tampon.search(/\r\n|\n|\r/);
        if (k < 0 || (tampon[k] === "\r" && k === tampon.length - 1)) break;   // un \r en fin de paquet peut précéder un \n
        ligne(tampon.slice(0, k));
        tampon = tampon.slice(k + (tampon[k] === "\r" && tampon[k + 1] === "\n" ? 2 : 1));
      }
    },
    finir() { if (tampon) { ligne(tampon); tampon = ""; } if (donnees.length) { const d = donnees.join("\n"); donnees = []; try { JSON.parse(d); surEvenement(nom || "message", d); } catch (e) {} } }
  };
}
/* Claude : message_start, content_block_start / delta / stop, message_delta (usage cumulé), message_stop, ping, error (documentation de l'API Messages, « Streaming »). */
const IA_ERREURS_ANTHROPIC = { invalid_request_error: 400, authentication_error: 401, permission_error: 403, not_found_error: 404, request_too_large: 413, rate_limit_error: 429, api_error: 500, overloaded_error: 529 };
function iaAssembleurAnthropic() {
  let msg = null, fini = false, erreur = null;
  const json = {}, illisibles = [];
  return {
    objet(e) {
      if (!e || typeof e !== "object") return;
      if (e.type === "error") { const t = e.error || {}; erreur = { statut: IA_ERREURS_ANTHROPIC[t.type] || 500, detail: typeof t.message === "string" ? t.message : "" }; return; }
      if (e.type === "message_start") { msg = Object.assign({}, e.message); msg.content = []; return; }
      if (!msg) return;
      if (e.type === "content_block_start") {
        msg.content[e.index] = Object.assign({}, e.content_block);
        if (/tool_use$/.test(e.content_block.type)) { json[e.index] = ""; iaFluxOutil(e.content_block.name); }
      } else if (e.type === "content_block_delta") {
        const b = msg.content[e.index], d = e.delta || {};
        if (!b) return;
        if (d.type === "text_delta") { b.text = (b.text || "") + d.text; iaFluxTexte(d.text); }
        else if (d.type === "input_json_delta") json[e.index] = (json[e.index] || "") + d.partial_json;
        else if (d.type === "thinking_delta") b.thinking = (b.thinking || "") + d.thinking;
        else if (d.type === "signature_delta") b.signature = (b.signature || "") + d.signature;
        else if (d.type === "citations_delta") (b.citations = b.citations || []).push(d.citation);
      } else if (e.type === "content_block_stop") {
        if (e.index in json) {
          const s = json[e.index]; delete json[e.index];
          if (s) { try { msg.content[e.index].input = JSON.parse(s); } catch (x) { illisibles.push(e.index); } }
        }
      } else if (e.type === "message_delta") {
        Object.assign(msg, e.delta || {});
        if (e.usage) msg.usage = Object.assign({}, msg.usage, e.usage);           // les compteurs de message_delta sont cumulés
        for (const k in e) if (!["type", "delta", "usage"].includes(k)) msg[k] = e[k];
      } else if (e.type === "message_stop") fini = true;
    },
    resultat() {
      if (erreur) return { erreur };
      if (!msg || !fini) return { repli: Lg("flux interrompu avant la fin", "stream cut before the end") };
      if (illisibles.length && msg.stop_reason !== "max_tokens") return { repli: Lg("appel d'outil illisible dans le flux", "unreadable tool call in the stream") };
      return { reponse: msg };
    }
  };
}
/* Gemini : chaque événement porte un GenerateContentResponse partiel. Les textes qui se suivent sont recollés ; une partie qui porte
   une signature de réflexion, ou un appel de fonction, reste telle qu'elle est arrivée (règle de Google : renvoyer la signature dans sa partie). */
function iaAssembleurGemini() {
  const parts = [];
  let fin = null, usage = null, id = null, version = null, retour = null, erreur = null, n = 0;
  const texteSeul = p => !!p && typeof p.text === "string" && Object.keys(p).every(k => k === "text" || k === "thought");
  return {
    objet(j) {
      if (!j || typeof j !== "object") return;
      if (j.error) { erreur = { statut: +j.error.code || 500, detail: typeof j.error.message === "string" ? j.error.message : "" }; return; }   // hypothèse : même forme qu'une erreur HTTP
      n++;
      if (j.promptFeedback) retour = j.promptFeedback;
      if (j.usageMetadata) usage = j.usageMetadata;                               // le dernier relevé fait foi
      if (j.responseId && !id) id = j.responseId;
      if (j.modelVersion && !version) version = j.modelVersion;
      const c = Array.isArray(j.candidates) ? j.candidates[0] : null;
      if (!c) return;
      if (c.finishReason) fin = c.finishReason;
      for (const p of (c.content && Array.isArray(c.content.parts) ? c.content.parts : [])) {
        const prec = parts[parts.length - 1];
        if (texteSeul(p) && texteSeul(prec) && !!p.thought === !!prec.thought) prec.text += p.text;
        else parts.push(Object.assign({}, p));
        if (p.functionCall) iaFluxOutil(p.functionCall.name);
        else if (typeof p.text === "string" && !p.thought) iaFluxTexte(p.text);
      }
    },
    json() {
      const j = { candidates: n && (parts.length || fin) ? [{ content: { role: "model", parts }, finishReason: fin }] : [] };
      if (retour) j.promptFeedback = retour;
      if (usage) j.usageMetadata = usage;
      if (version) j.modelVersion = version;
      if (id) j.responseId = id;
      return j;
    },
    resultat(modele) {
      if (erreur) return { erreur };
      if (!fin && !(retour && retour.blockReason)) return { repli: Lg("flux interrompu avant la fin", "stream cut before the end") };
      return { reponse: reponseGemini(this.json(), modele) };
    }
  };
}
/* Lit la réponse d'un appel en continu. Rend { reponse }, { erreur: { statut, detail } } ou { repli: motif } (le même tour sera refait sans flux). */
async function iaLireFlux(rep, api, signal, modele) {
  const type = rep.headers && typeof rep.headers.get === "function" ? rep.headers.get("content-type") || "" : "";
  const A = api === "gemini" ? iaAssembleurGemini() : iaAssembleurAnthropic();
  if (!/text\/event-stream/i.test(type)) {                                     // réponse ordinaire (relais, serveur sans flux) : lue telle quelle
    const j = await rep.json();
    if (api !== "gemini") return { reponse: j };
    if (!Array.isArray(j)) return { reponse: reponseGemini(j, modele) };
    j.forEach(x => A.objet(x));                                                 // streamGenerateContent sans alt=sse : un tableau de réponses partielles
    return A.resultat(modele);
  }
  if (iaFlux.courant) iaFlux.courant.ouvert = true;
  let illisible = false;
  const sse = iaLecteurSSE((nom, d) => { let o; try { o = JSON.parse(d); } catch (e) { illisible = true; return; } A.objet(o); });
  if (!rep.body || typeof rep.body.getReader !== "function") sse.pousser(await rep.text());
  else {
    const lecteur = rep.body.getReader(), dec = new TextDecoder("utf-8");
    const couper = () => { try { lecteur.cancel().catch(() => {}); } catch (e) {} };
    if (signal) signal.addEventListener("abort", couper, { once: true });
    try {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        sse.pousser(dec.decode(value, { stream: true }));
      }
      sse.pousser(dec.decode());
    } catch (e) {
      if ((signal && signal.aborted) || (e && e.name === "AbortError")) throw arretDemande();
      return { repli: Lg("le flux a été coupé en cours de réponse", "the stream was cut during the answer") };
    } finally { if (signal) signal.removeEventListener("abort", couper); }
  }
  if (signal && signal.aborted) throw arretDemande();
  sse.finir();
  if (illisible) return { repli: Lg("événement illisible dans le flux", "unreadable event in the stream") };
  return api === "gemini" ? A.resultat(modele) : A.resultat();
}
function iaFluxRepli(motif) {                                                   // le flux a échoué : on refait le tour sans flux, et on n'essaie plus pendant la session
  iaFlux.actif = false; iaFlux.motif = motif;
  if (iaFlux.courant) Object.assign(iaFlux.courant, { texte: "", outil: null, ouvert: false });
  if (agent.enCours && etapeCourante) noter("attente", Lg("Réponse en continu indisponible (" + motif + ") : le même tour est refait sans flux.", "Streaming unavailable (" + motif + "): the same turn is run again without streaming."));
}
/* Ce qui arrive pendant un tour : texte du modèle, appel d'outil en préparation, ou une attente honnête avec un compteur. */
const IA_ATTENTES = { "gemini-4-hydrogen": ["Avec ce modèle, un tour a pris de 32 à 76 s lors d'essais réels.", "With this model, a turn took 32 to 76 s in real tests."] };
function iaFluxDebut(api) {
  const c = { api, modele: api === "gemini" ? agent.modeleGemini : IA.modele, debut: Date.now(), texte: "", outil: null, ouvert: false, noeud: null };
  if (agent.enCours && etapeCourante) { c.noeud = h("div", { class: "ia-flux", "aria-live": "off" }); etapeCourante.noeud.append(c.noeud); }
  iaFlux.courant = c; iaFluxPeindre();
  return c;
}
function iaFluxFin(c) { if (c.noeud) c.noeud.remove(); if (iaFlux.courant === c) iaFlux.courant = null; iaFluxPeindre(); }
function iaFluxTexte(t) { const c = iaFlux.courant; if (c && t) { c.texte = (c.texte + t).slice(-4000); iaFluxPeindre(); } }
function iaFluxOutil(nom) { const c = iaFlux.courant; if (c) { c.outil = nom || "?"; iaFluxPeindre(); } }
function iaFluxPhrase(c, court) {                                               // court : version pour l'indicateur du menu
  const s = nf(Math.max(0, (Date.now() - c.debut) / 1000), 0) + " s", n = court ? 90 : 280;
  if (c.texte.trim()) return Lg("Le modèle écrit (" + s + ") : ", "The model is writing (" + s + "): ") + "« " + (c.texte.length > n ? "…" + c.texte.slice(-n) : c.texte).trim() + " »";
  if (c.outil) return Lg("Le modèle prépare un appel d'outil (« " + c.outil + " »), " + s + ".", "The model is preparing a tool call (“" + c.outil + "”), " + s + ".");
  const a = IA_ATTENTES[c.modele];
  if (court) return Lg("Le modèle réfléchit : " + s + ".", "The model is thinking: " + s + ".") + (a ? " " + Lg("Avec ce modèle, 32 à 76 s par tour lors d'essais réels.", "With this model, 32 to 76 s per turn in real tests.") : "");
  return Lg("Le modèle réfléchit depuis " + s + " : rien ne s'affiche tant qu'il n'a pas commencé à écrire. ", "The model has been thinking for " + s + ": nothing shows until it starts writing. ")
    + (a ? Lg(a[0], a[1]) : Lg("Un tour peut prendre plus d'une minute.", "A turn can take more than a minute."));
}
function iaFluxPeindre() {
  const c = iaFlux.courant;
  if (c && c.noeud) c.noeud.textContent = iaFluxPhrase(c);
  iaPeindreTravail();
}
function iaEnvelopperAppel(f, api) {
  return async function (requete, signal) { const c = iaFluxDebut(api); try { return await f(requete, signal); } finally { iaFluxFin(c); } };
}
appelGemini = iaEnvelopperAppel(appelGemini, "gemini");
appelAnthropic = iaEnvelopperAppel(appelAnthropic, "anthropic");

/* ---- 6. Agent au travail : visible depuis toutes les pages, arrêtable, notification à la fin ---- */
function iaActivite() {
  const p = agent.progres, sur = (k, n, fr, en) => Lg(fr + " " + k + " sur " + n, en + " " + k + " of " + n);
  if (iaPresent("vei") && vei.serie && vei.serie.active)
    return { id: "veille", page: "veille", nom: Lg("Veille", "Watch"), etape: p && p.total ? sur(Math.min(p.etats.length + 1, p.total), p.total, "épisode", "episode") : "", arret: () => agent.arret };
  if (iaPresent("evl") && evl.enCours)
    return { id: "banc", page: "evaluation", nom: Lg("Évaluation", "Evaluation"), etape: evl.progres ? sur(Math.min(evl.progres.fait + 1, evl.progres.total), evl.progres.total, "question", "question") : "", arret: () => evl.arret };
  if (agent.enCours && agent.evaluation && !agent.evaluation.fini)
    return { id: "evaluation", page: "agent", nom: Lg("Évaluation de l'agent", "Agent evaluation"), etape: p && p.total ? sur(Math.min(p.etats.length + 1, p.total), p.total, "épisode", "episode") : "", arret: () => agent.arret };
  if (agent.enCours)
    return { id: "instruction", page: "agent", nom: Lg("Instruction", "Investigation"), etape: p && p.tour ? sur(p.tour, IA.tours, "tour", "turn") : "", arret: () => agent.arret };
  if (iaPresent("rev") && rev.enCours) return { id: "revue", page: "revue", nom: Lg("Revue", "Review"), etape: "", arret: () => rev.arret };
  if (iaPresent("sim") && sim.enCours) return { id: "simulateur", page: "simulateur", nom: Lg("Simulateur", "Simulator"), etape: Lg("traduction de la phrase", "translating the sentence"), arret: () => sim.arret };
  if (iaPresent("itg") && itg.enCours) return { id: "integration", page: "itg", nom: Lg("Intégration", "Integration"), etape: Lg("proposition des rôles des colonnes", "proposing the column roles"), arret: () => itg.arret };
  return null;
}
/* Ce que dit la notification de fin ; rien quand l'exécution a été arrêtée à la demande. */
function iaBilan(a) {
  const arrete = x => /arrêt|stopped/i.test(String(x || ""));
  if (a.id === "instruction") return arrete(agent.erreur) ? null : zoneFiche.querySelector("dl") && !agent.erreur ? Lg("Fiche prête", "Note ready") : Lg("Instruction terminée sans fiche", "Investigation ended without a note");
  if (a.id === "evaluation") return agent.evaluation && agent.evaluation.arrete ? null : Lg("Évaluation de l'agent terminée", "Agent evaluation finished");
  if (a.id === "veille") {
    const S = vei.serie;
    if (!S || S.arrete) return null;
    const k = S.cles.filter(c => (vei.resultats.get(c) || {}).etat === "fiche").length;
    return Lg("Veille : " + k + " fiche(s) prête(s) sur " + S.cles.length, "Watch: " + k + " of " + S.cles.length + " note(s) ready");
  }
  if (a.id === "banc") return evl.vue && evl.vue.arrete === "demande" ? null : Lg("Passe du banc d'évaluation terminée", "Evaluation bench run finished");
  if (a.id === "revue") return arrete(rev.erreur) ? null : rev.revue && !rev.erreur ? Lg("Revue rédigée", "Review written") : Lg("Revue : rédaction non aboutie", "Review: writing not completed");
  if (a.id === "simulateur") return arrete(sim.erreur) ? null : sim.prop ? Lg("Réglages du simulateur proposés", "Simulator settings proposed") : Lg("Simulateur : traduction non aboutie", "Simulator: translation not completed");
  if (a.id === "integration") return arrete(itg.erreur) ? null : itg.erreur ? Lg("Intégration : demande non aboutie", "Integration: request not completed") : Lg("Proposition de l'IA prête", "AI proposal ready");
  return null;
}
let iaVu = null, iaArretDemande = false, iaTexteTravail = "";
function iaPeindreTravail() {
  const a = iaVu;
  if (!a) { if (!iaTravail.hidden) { iaTravail.hidden = true; iaTravail.setAttribute("hidden", ""); iaTravail.replaceChildren(); } iaTexteTravail = ""; return; }
  const titre = Lg("Agent au travail : ", "Agent at work: ") + a.nom + (a.etape ? ", " + a.etape : "");
  const c = iaFlux.courant, detail = c ? iaFluxPhrase(c, true) : "";
  if (iaTravail.hidden) { iaTravail.hidden = false; iaTravail.removeAttribute("hidden"); }
  if (titre + etat.onglet !== iaTexteTravail) {
    iaTexteTravail = titre + etat.onglet;
    const s = a.arret(), arretEnCours = iaArretDemande || (s && s.signal && s.signal.aborted);
    iaTravail.replaceChildren(
      h("div", { class: "ia-titre-travail", role: "status" }, h("span", { class: "voyant actif", "aria-hidden": "true" }), h("span", null, titre)),
      h("div", { class: "ia-actions" },
        etat.onglet !== a.page ? h("button", { type: "button", class: "lien", onclick: () => aller(a.page) }, "Voir") : null,
        h("button", { type: "button", class: "lien", disabled: !!arretEnCours, onclick: e => { const x = a.arret(); if (x) x.abort(); iaArretDemande = true; e.target.disabled = true; e.target.textContent = tr("Arrêt demandé…"); } }, arretEnCours ? "Arrêt demandé…" : "Arrêter")),
      h("div", { class: "ia-detail-travail", "aria-hidden": "true" }));
  }
  const d = iaTravail.querySelector(".ia-detail-travail");
  if (d) d.textContent = detail;
}
function iaSurveiller() {
  const a = iaActivite();
  if (iaVu && (!a || a.id !== iaVu.id)) {
    const fini = iaVu, msg = iaArretDemande ? null : iaBilan(fini);
    iaArretDemande = false; iaTexteTravail = "";
    if (msg && etat.onglet !== fini.page) iaNoter(msg, fini.page);
  }
  if (a && iaVu && a.id === iaVu.id && a.etape !== iaVu.etape) iaTexteTravail = "";
  if (a && (!iaVu || a.id !== iaVu.id)) iaTexteTravail = "";
  iaVu = a;
  iaPeindreTravail();
  if (iaFlux.courant && iaFlux.courant.noeud) iaFlux.courant.noeud.textContent = iaFluxPhrase(iaFlux.courant);
}
setInterval(iaSurveiller, 500);
/* Notifications discrètes, hors de la page (elles survivent aux changements de page). */
const iaNotes = h("div", { class: "ia-notes ia-hors-app", role: "status", "aria-live": "polite" });
function iaNoter(texte, page) {
  const n = h("div", { class: "ia-note" });
  const fermer = () => { n.remove(); if (!iaNotes.childNodes.length) iaNotes.remove(); };
  n.append(h("span", null, texte), h("button", { type: "button", class: "btn petit", onclick: () => { fermer(); aller(page); } }, "Voir"),
    h("button", { type: "button", class: "lien", "aria-label": "Fermer la notification", onclick: fermer }, "×"));
  iaNotes.append(n);
  if (iaNotes.parentNode !== document.body) document.body.append(iaNotes);
  setTimeout(fermer, 20000);
  return n;
}
/* La copie figée clone la page : on en retire le panneau et les notifications le temps du clonage. */
copieFigee = (f => function () {
  const hors = [...document.querySelectorAll(".ia-hors-app")], places = hors.map(n => n.parentNode);
  hors.forEach(n => n.remove());
  try { return f.apply(this, arguments); } finally { hors.forEach((n, k) => { if (places[k]) places[k].append(n); }); }
})(copieFigee);

ajouterTraductions([
  ["Réglages d'IA", "AI settings"], ["Ouvrir les réglages d'IA", "Open the AI settings"], ["Modifier", "Change"], ["Fermer", "Close"], ["Fermer les réglages d'IA", "Close the AI settings"],
  ["Ouvrir les réglages d'IA : mode, modèle, clé et accord d'envoi", "Open the AI settings: mode, model, key and consent to send"],
  ["Envoi autorisé (réglages d'IA) · ", "Sending authorised (AI settings) · "], ["Mode", "Mode"], ["Modèle", "Model"], ["Démonstration (sans IA)", "Demo (no AI)"],
  ["Ces réglages valent pour toutes les pages qui font appel à une IA : Instruction, Veille, Revue, Évaluation, Simulateur et Intégration.", "These settings apply to every page that uses an AI: Investigation, Watch, Review, Evaluation, Simulator and Integration."],
  ["Un agent travaille : le mode, le modèle et la relecture se changent quand il a fini.", "An agent is working: the mode, model and review can be changed once it has finished."],
  ["Mode démonstration : aucune IA, aucun appel réseau, aucun accord à donner. Chaque page utilise un script qui joue le rôle du modèle, et le dit.", "Demo mode: no AI, no network call, no consent to give. Each page uses a script that plays the model, and says so."],
  ["Garder la clé jusqu'à la fermeture de cet onglet", "Keep the key until this tab is closed"],
  ["La clé est gardée dans la mémoire de session de cet onglet : elle survit à un rechargement et s'efface à la fermeture de l'onglet. Risque : tant que l'onglet reste ouvert, toute personne qui utilise ce poste, ou tout script exécuté dans cette page, peut la lire. Ne cochez pas sur un poste partagé.",
    "The key is kept in this tab's session storage: it survives a reload and is erased when the tab closes. Risk: as long as the tab stays open, anyone using this computer, or any script running in this page, can read it. Do not tick this on a shared computer."],
  ["Sans cette case, la clé reste en mémoire et disparaît au rechargement de la page ; la page vous prévient avant. Si vous la cochez, la clé est gardée dans la mémoire de session de cet onglet jusqu'à sa fermeture : toute personne qui utilise ce poste, ou tout script exécuté dans cette page, pourrait alors la lire. Elle n'est jamais écrite dans le stockage durable du navigateur, dans l'adresse, ni dans une copie figée.",
    "Without this box, the key stays in memory and is lost when the page reloads; the page warns you first. If you tick it, the key is kept in this tab's session storage until the tab closes: anyone using this computer, or any script running in this page, could then read it. It is never written to the browser's lasting storage, to the address, or to a frozen copy."],
  ["Un seul accord pour toutes les pages. ", "One consent for every page. "], ["Retirer l'autorisation partout", "Withdraw authorisation everywhere"],
  ["L'accord vaut jusqu'au rechargement de la page, pour ce fournisseur seulement. Chaque page montre toujours le message exact envoyé dans son journal.", "The consent lasts until the page is reloaded, for this provider only. Each page still shows the exact message sent in its log."],
  ["La première case est nécessaire : toutes les fonctions passent par le même accès à l'IA.", "The first box is required: every feature goes through the same access to the AI."],
  ["J'autorise ces envois pour cette session", "I authorise these sends for this session"],
  ["Rien n'est envoyé tant que vous n'avez pas cliqué, puis lancé une action sur une page. L'accord vaut jusqu'au rechargement de la page, pour ce fournisseur seulement.", "Nothing is sent until you have clicked, then started an action on a page. The consent lasts until the page is reloaded, for this provider only."],
  ["Le détail de cet envoi s'affiche sur la page concernée, avant tout envoi.", "The details of this send are shown on the page concerned, before anything is sent."],
  ["les intitulés des colonnes, tels qu'ils sont dans le fichier ;", "the column headers, as they are in the file;"],
  ["le nombre de lignes, le pas de temps, les dates extrêmes, la forme du tableau ; une consigne et un outil de réponse fixes.", "the number of rows, the time step, the first and last dates, the shape of the table; a fixed instruction and answer tool."],
  ["Voir tout ce qui sera envoyé", "See everything that will be sent"], ["La réactiver", "Turn it back on"], ["Arrêt demandé…", "Stop requested…"], ["Voir", "View"],
  ["Fermer la notification", "Close the notification"], ["Effacer la clé", "Clear the key"]
]);
