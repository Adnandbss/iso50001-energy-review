/* ============================================================================
   Module « Dérives » (préfixe drv) : un seul parcours pour les dérives.
   Les pages Détection, Instruction et Veille deviennent une page : la réponse d'abord
   (constat de la détection, nouveautés de la veille), puis une seule liste triée par la
   règle de la veille, où chaque dérive s'instruit et s'ouvre sous sa ligne. Les graphiques,
   tableaux, hypothèses et règles d'origine restent sous des replis. Aucun calcul ne change :
   la page appelle derives(), pageDerives(), lancerInstruction(), veiLancerSerie() et
   lancerEvaluation() d'origine. Les anciennes adresses (#onglet=derives, agent, veille)
   mènent à cette page ; choisirEpisode et peindreAgent y renvoient (voir coeur.py).
   ============================================================================ */
const DRV_PAGES = ["derives", "agent", "veille"];                          // une page, trois adresses : l'ancienne adresse dit ce qu'on vient y faire
const DRV_LIMITE = 10;                                                     // lignes montrées au premier affichage
const drv = { modele: null, ouverte: null, serieVue: null, energie: "*", limite: DRV_LIMITE, precedent: null, choisi: false, defiler: false, contexte: null, grapheLarge: false };
const drvNoeud = h("div", { class: "drv" }), drvNoeudBas = h("div", { class: "drv-bas" });
const drvIci = () => !!etat.modele && DRV_PAGES.includes(etat.onglet);
const drvPage1 = id => ONGLETS.some(o => o[0] === id);
const drvFiche = l => !!(l && l.resultat && l.resultat.res && l.resultat.res.fiche);
const drvCle = ep => ep ? veiCle(ep) : null;

/* ---- Menu : une entrée « Dérives » dans le groupe « Suivi », à la place de Détection, Instruction et Veille ---- */
(function drvMenu() {
  const vues = {};
  for (const g of PAGES) g.pages = g.pages.filter(p => { if (!DRV_PAGES.includes(p[0])) return true; vues[p[0]] = p; return false; });
  for (let i = PAGES.length - 1; i >= 0; i--) if (!PAGES[i].pages.length) PAGES.splice(i, 1);
  for (const id of DRV_PAGES) {
    let e = vues[id] || ONGLETS.find(o => o[0] === id);
    if (!e) { e = [id, "Dérives", "Dérives"]; ONGLETS.push(e); }            // l'adresse reste valable même si la page n'était plus au menu
    e[1] = "Dérives"; e[2] = "Dérives";
    PAGES_MODULES[id] = drvPage;
  }
  (PAGES.find(g => g.groupe === "Suivi") || PAGES[0]).pages.push(ONGLETS.find(o => o[0] === "derives"));
})();
/* Sur la page, l'adresse suit ce qu'on y fait (« agent » pendant une instruction, « veille » pendant une série) :
   l'indicateur d'agent au travail reconnaît ainsi la page et ne notifie pas une fin qu'on a sous les yeux. */
function drvAlias(id) {
  if (!drvIci() || etat.onglet === id) return;
  etat.onglet = id;
  try { history.replaceState(null, "", "#onglet=" + id); } catch (e) {}
}

/* ---- La liste : toutes les dérives, dans l'ordre de la veille (la file à traiter d'abord, puis les dérives traitées) ---- */
function drvLignes() {
  const L = veiLignes();
  return veiTrier(L.filter(l => l.aTraiter), vei.regle).concat(veiTrier(L.filter(l => !l.aTraiter), vei.regle));
}
const drvFiltrer = lignes => lignes.filter(l => (etat.derEtat !== "o" || l.ep.ouvert) && (etat.derSens === "*" || (etat.derSens === "+") === (l.ep.ecart > 0)) && (drv.energie === "*" || l.ep.energie === drv.energie));
/* Où montrer le journal (un seul noeud) : sous l'évaluation, dans la série, ou dans le détail de la dérive instruite. */
function drvJournalA() {
  if (agent.evaluation) return "evaluation";
  const S = vei.serie;
  if (S && (S.active || (journal.firstChild && journal.firstChild === S.marque))) return "serie";
  if (agent.episode && (agent.enCours || journal.childNodes.length)) return "instruction";
  return null;
}
const drvSerieActive = () => !!(vei.serie && vei.serie.active);
const drvEnInstruction = l => agent.enCours && !agent.evaluation && !drvSerieActive() && drvCle(agent.episode) === l.cle;
function drvEtat(l) {
  const r = l.resultat, st = l.statut, revoir = st.plus ? Lg(" · à revoir", " · to review") : "";
  if (st.s === "valide") return { c: "valide", t: Lg("Validée", "Validated") + revoir };
  if (st.s === "ecarte") return { c: "ecarte", t: Lg("Écartée", "Dismissed") + revoir };
  if (drvEnInstruction(l) || (r && r.etat === "cours")) return { c: "cours", t: Lg("Instruction en cours…", "Being investigated…") };
  if (r && r.etat === "attente") return { c: "cours", t: Lg("En attente (série)", "Waiting (run)") };
  if (drvFiche(l)) return { c: "instruite", t: Lg("Instruite", "Investigated") };
  if (r && ["echec", "arrete", "non-lance", "hors-format"].includes(r.etat)) return { c: "atraiter", t: Lg("À traiter · sans fiche", "To handle · no note") };
  return { c: "atraiter", t: Lg("À traiter", "To handle") };
}
/* Une dérive à montrer : les filtres la laissent voir, et la liste va jusqu'à elle. */
function drvMontrer(l, lignes) {
  if (!drvFiltrer([l]).length) { etat.derEtat = "*"; etat.derSens = "*"; drv.energie = "*"; }
  const k = drvFiltrer(lignes || drvLignes()).findIndex(x => x.cle === l.cle);
  if (k >= drv.limite) drv.limite = k + 1;
}
function drvOuvrirLigne(l, lignes) {
  Object.assign(drv, { ouverte: l.cle, serieVue: l.ep.serie, defiler: true });
  etat.derSerie = l.ep.serie;                                              // les graphiques suivent la dérive ouverte
  drvMontrer(l, lignes);
}
function drvBasculer(l) {
  if (drv.ouverte === l.cle) drv.ouverte = null;
  else { Object.assign(drv, { ouverte: l.cle, serieVue: l.ep.serie }); etat.derSerie = l.ep.serie; }
  rendre();
}

/* ---- Instruire : sur place, sous la ligne ---- */
function drvRemettreAgent(ep) {                                            // comme choisirEpisode d'origine : le journal et la fiche changent de sujet
  agent.episode = ep; agent.erreur = null; journal.replaceChildren(); zoneFiche.replaceChildren(); zoneEval.replaceChildren(); agent.evaluation = null; agent.progres = null; peindreProgres();
}
function drvInstruire(ep) {
  if (!ep || agent.enCours) return;
  const cle = drvCle(ep), r = vei.resultats.get(cle);
  if (r && !(r.res && r.res.fiche)) vei.resultats.delete(cle);            // un essai sans fiche est remplacé par le nouveau
  Object.assign(drv, { ouverte: cle, serieVue: ep.serie, contexte: "instruction" }); etat.derSerie = ep.serie;
  drvRemettreAgent(ep);
  drvAlias("agent"); rendre();
  return lancerInstruction();                                              // en mode IA non prêt, elle s'arrête et dit pourquoi
}
/* choisirEpisode (Vue d'ensemble, visite guidée, tableaux de la détection) : la dérive s'ouvre dans la page Dérives.
   Comme l'original, l'instruction part seule en démonstration ou quand l'envoi est prêt (sinon la dérive attend « Lancer l'instruction »). */
function drvChoisir(ep) {
  if (!ep || !etat.modele) return;
  if (agent.modele !== etat.modele) reinitialiserAgent(etat.modele);
  if (vei.modele !== etat.modele) veiAuChargement(etat.modele);
  const cle = drvCle(ep), lignes = drvLignes(), l = lignes.find(x => x.cle === cle), lancer = !agent.enCours;
  if (l) drvOuvrirLigne(l, lignes); else Object.assign(drv, { ouverte: cle, serieVue: ep.serie, defiler: true });
  drv.choisi = true;
  if (lancer) { drvRemettreAgent(ep); drv.contexte = "instruction"; }
  if (!drvIci()) aller("agent"); else { drvAlias(lancer ? "agent" : etat.onglet); rendre(); }
  if (lancer && (agent.demo || (agent.accord === agent.fournisseur && champDe().value.trim()))) lancerInstruction();
}
/* Fiche rendue par une instruction : gardée avec celles de la veille (statut « instruite », point de situation, série qui ne la refait pas). */
function drvFicheRendue(ep, res, redacteur, jugement) {
  if (vei.composition || !res || !etat.modele || vei.modele !== etat.modele) return;
  veiSuivreLangue();
  vei.resultats.set(drvCle(ep), { cle: drvCle(ep), etat: res.fiche ? "fiche" : "hors-format", res, jugement: jugement || null, mesures: res.fiche ? mesurerFiche(ep, res) : null,
    erreur: null, tours: res.tours, duree: null, demo: !!agent.demo, redacteur, seule: true });
}
function drvLancerSerie(cles) {
  drv.contexte = "serie"; drvAlias("veille");
  return veiLancerSerie(cles);
}

/* ---- Liens vers les autres pages, déjà réglées sur la dérive ---- */
function drvVersPrevision(ep) { prevEtat.serie = ep.serie; prevEtat.derive = !!ep.ouvert; aller("prevision"); }
function drvVersSimulateur(ep) {
  const m = etat.modele;
  etat.de = Math.max(m.debut, Math.min(m.fin, ep.debut)); etat.a = Math.max(etat.de, Math.min(m.fin, ep.fin));
  sim.serie = ep.serie; aller("simulateur");
}
function drvVersRevue(ep) {
  const m = etat.modele, an = t => new Date(t).getUTCFullYear();       // l'année civile (ou les années) qui couvre la dérive, comme le filtre « Période »
  etat.de = Math.max(m.debut, Date.UTC(an(ep.debut), 0, 1)); etat.a = Math.min(m.fin, Date.UTC(an(ep.fin), 11, 31));
  aller("revue");
}
function drvVoirGraphiques(ep) {
  REPLIS_OUVERTS.add("drv-graphiques"); etat.derSerie = ep.serie; drv.serieVue = ep.serie;
  rendre();
  setTimeout(() => { const d = app.querySelector('[data-drv="graphiques"]'); if (d && d.scrollIntoView) d.scrollIntoView({ block: "start" }); }, 0);
}
function drvLiens(ep) {
  const lien = (texte, titre, f) => h("button", { type: "button", class: "lien", title: titre, onclick: () => f(ep) }, texte), out = [];
  if (drvPage1("prevision") && typeof prevEtat !== "undefined") out.push(lien("Voir sa prévision", ep.ouvert ? "Page Prévision, sur cette série, dérive en cours prolongée" : "Page Prévision, sur cette série", drvVersPrevision));
  if (drvPage1("simulateur") && typeof sim !== "undefined") out.push(lien("La simuler", "Simulateur, sur cette série et la période de la dérive", drvVersSimulateur));
  if (drvPage1("revue")) out.push(lien("L'ajouter à la revue", "Page Revue, sur l'année qui couvre la dérive : ses faits y figurent", drvVersRevue));
  out.push(lien("Voir ses graphiques", "Écarts cumulés (CUSUM) et z de cette série, plus bas", drvVoirGraphiques));
  return h("p", { class: "drv-liens" }, out);
}

/* ---- Une ligne, et son détail ouvert dessous ---- */
function drvLigne(l) {
  const ep = l.ep, ouverte = drv.ouverte === l.cle, E = drvEtat(l), e = l.enjeu, C = vei.comparaison;
  const action = ouverte ? h("button", { type: "button", class: "btn petit", "aria-expanded": "true", onclick: () => drvBasculer(l) }, "Refermer")
    : drvFiche(l) ? h("button", { type: "button", class: "btn petit", "aria-expanded": "false", onclick: () => drvBasculer(l) }, "Voir la fiche")
    : h("button", { type: "button", class: "btn petit", disabled: agent.enCours, title: agent.enCours ? "Une instruction est déjà en cours" : null, onclick: () => drvInstruire(ep) }, "Instruire");
  return h("li", { class: "drv-item" + (ouverte ? " ouverte" : ""), "data-cle": l.cle },
    h("div", { class: "drv-ligne" },
      h("span", { class: "drv-qui" }, h("button", { type: "button", class: "lien drv-nom", "aria-expanded": String(ouverte), onclick: () => drvBasculer(l) }, ep.serie),
        h("span", { class: "drv-niveau" }, nomNiveau(ep.analyse.serie) + " · " + ep.energie, l.doublon ? [" · ", h("span", { title: veiRecoupe(l) }, Lg("même dérive que le Site", "same drift as the Site"))] : null,
          !C.premier && l.neuf ? [" ", veiMarque(veiNouveaute(l), true)] : null)),
      h("span", { class: "drv-periode" }, veiLib(ep), ep.ouvert ? [" ", h("span", { class: "en-cours" }, "en cours")] : null),
      h("span", { class: "drv-nb" }, h("span", { class: "fleche " + (ep.ecart > 0 ? "plus" : "moins") }, ep.ecart > 0 ? "▲" : "▼"), fmtEnergie(ep.ecart, true), h("span", { class: "drv-pct" }, " " + fmtPct(ep.pct, true))),
      h("span", { class: "drv-nb" }, e.cout == null ? "–" : fmtEuros(e.cout, true),
        e.cout3 != null ? h("span", { class: "vei-detail" }, Lg("+ 3 mois : ", "+ 3 months: ") + fmtEuros(e.cout3, true)) : null),
      h("span", { class: "drv-statut drv-" + E.c }, E.t),
      h("span", { class: "drv-action" }, action)),
    ouverte ? drvDetail(l) : null);
}
function drvDetail(l) {
  const ep = l.ep, rec = veiRecoupe(l), r0 = veiResume(l), resume = r0[0].toUpperCase() + r0.slice(1) + "." + (rec ? " " + rec[0].toUpperCase() + rec.slice(1) + "." : "");
  let decomposition = null;
  if (ep.groupe === "site") {                                              // la part de l'écart du site que les UES suivies expliquent (même calcul que le tableau de la détection)
    const d = decomposerSite(ep);
    if (d.lignes.length) decomposition = Lg("Écart non expliqué par les UES suivies : " + fmtEnergie(d.reste, true) + ", soit " + fmtPct(d.reste / ep.ecart) + " de l'écart du site" + (d.principale ? " ; l'UES qui pèse le plus : " + d.principale.nom + " (" + fmtEnergie(d.principale.ecart, true) + ")." : "."),
      "Gap not explained by the tracked SEUs: " + fmtEnergie(d.reste, true) + ", i.e. " + fmtPct(d.reste / ep.ecart) + " of the site's gap" + (d.principale ? "; the SEU that weighs most: " + d.principale.nom + " (" + fmtEnergie(d.principale.ecart, true) + ")." : "."));
  }
  return h("div", { class: "drv-detail" },
    h("p", { class: "drv-resume" }, resume, decomposition ? h("span", { class: "vei-detail" }, decomposition) : null),
    drvLiens(ep), drvStatut(l), drvTravail(l));
}
function drvStatut(l) {
  const lib = h("span", { class: "vei-libelle" }, "Votre décision :");
  if (vei.motif && vei.motif.cle === l.cle) return h("div", { class: "drv-pied" }, lib, veiSaisieMotif());
  const courant = l.statut.s, c = segments([{ v: "atraiter", t: "À traiter" }, { v: "valide", t: "Validée" }, { v: "ecarte", t: "Écartée" }], courant, v => { if (v !== courant || v === "ecarte") veiChoisirStatut(l, v, "drv"); });
  c.setAttribute("aria-label", Lg("Statut : ", "Status: ") + l.ep.serie + ", " + l.ep.libDebut);
  return h("div", { class: "drv-pied" }, lib, c,
    courant === "ecarte" ? h("span", { class: "note", style: "margin:0" }, Lg("Motif : ", "Reason: ") + l.statut.motif) : null,
    l.statut.plus ? veiMarque(Lg("à revoir : +" + veiNb(l.statut.plus, "période", "") + " depuis votre décision", "to review: +" + veiNb(l.statut.plus, "", "period") + " since your decision"), true) : null);
}
/* Le travail de l'agent sur cette dérive : instruction en cours, fiche gardée, ou bouton pour la lancer. */
function drvTravail(l) {
  const r = l.resultat, cours = drvEnInstruction(l), ou = drvJournalA(), aMoi = ou === "instruction" && drvCle(agent.episode) === l.cle, out = [];
  const vivante = aMoi && zoneFiche.childNodes.length > 0;                // la fiche de la dernière instruction : celle de la zone d'origine, reliée au journal
  if (aMoi) out.push(zoneProgres);
  if (vivante) out.push(zoneFiche);
  else if (r && r.res) out.push(veiNoeudFiche(l));
  else if (r && r.etat !== "fiche") out.push(h("p", { class: "vei-etat" + (r.etat === "echec" ? " erreur" : "") }, r.etat === "cours" ? h("span", { class: "voyant actif" }) : null, " " + veiEtatTexte(r)));
  if (cours) out.push(h("p", { class: "drv-pied" }, h("button", { type: "button", class: "btn", onclick: () => { if (agent.arret) agent.arret.abort(); } }, "Arrêter")));
  else if (!drvFiche(l) && !(r && (r.etat === "cours" || r.etat === "attente")))
    out.push(h("p", { class: "drv-pied" }, h("button", { type: "button", class: "btn principal", disabled: agent.enCours, title: agent.enCours ? "Une instruction est déjà en cours" : null, onclick: () => drvInstruire(l.ep) }, "Lancer l'instruction")));
  if (aMoi && agent.erreur && drv.contexte !== "evaluation") out.push(h("div", { class: "erreur", style: "margin:0 0 10px" }, agent.erreur));
  if (aMoi) out.push(repli("drv-journal", "Journal de l'agent", journal, h("div", { class: "note", style: "margin-top:0" }, "Chaque ligne se déplie : elle montre l'appel exact et ce qui a été transmis au modèle.")));
  return h("div", { class: "drv-travail" }, out);
}

/* ---- Instruire en série : la fonction de la veille, appliquée aux premières dérives de la liste ---- */
function drvSerie(visibles, ou) {
  const S = vei.serie, actif = drvSerieActive(), aFiche = l => !!(l.resultat && l.resultat.etat === "fiche");
  const cibles = visibles.filter(l => l.aTraiter && !aFiche(l) && !(l.resultat && ["cours", "attente"].includes(l.resultat.etat))).slice(0, vei.n), np = cibles.length;
  const manquants = S && !actif ? S.cles.filter(c => { const r = vei.resultats.get(c); return !r || r.etat !== "fiche"; }) : [], ailleurs = agent.enCours && !actif, pret = blocageEnvoi();
  const motif = ailleurs ? VEI_T.ailleurs[0] : pret ? VEI_T.pasPret[0] : !np ? (visibles.some(l => l.aTraiter) ? "Les dérives à traiter de la liste ont déjà leur fiche." : "Aucune dérive à traiter dans la liste.") : null;
  const arretEnCours = actif && agent.arret && agent.arret.signal.aborted;
  const juge = agent.demo || agent.juge, appels = np * (IA.tours + (juge ? VEI_TOURS_JUGE : 0));
  const budget = Lg("Au plus " + IA.tours + " tours par dérive" + (juge ? ", " + VEI_TOURS_JUGE + " pour la relecture" : "") + ", soit au plus " + appels + " appels " + (agent.demo ? "au script (aucun appel réseau)." : "au modèle, hors nouveaux essais quand le serveur est surchargé."),
    "At most " + IA.tours + " turns per drift" + (juge ? ", " + VEI_TOURS_JUGE + " for the review" : "") + ", i.e. at most " + appels + " calls " + (agent.demo ? "to the script (no network call)." : "to the model, not counting retries when the server is overloaded."));
  const fiches = S ? S.cles.filter(c => (vei.resultats.get(c) || {}).etat === "fiche").length : 0;
  const bilan = !S || actif ? null : Lg((S.arrete ? "Série arrêtée" : S.interrompue ? "Série interrompue après " + VEI_ECHECS_DE_SUITE + " échecs de suite" : "Série terminée") + " : " + veiNb(fiches, "fiche", "") + " sur " + S.cles.length + "."
      + (manquants.length ? " Les fiches déjà rendues sont gardées ; vous pouvez reprendre les autres." : ""), (S.arrete ? "Run stopped" : S.interrompue ? "Run interrupted after " + VEI_ECHECS_DE_SUITE + " failures in a row" : "Run finished") + ": " + fiches + " of " + veiNb(S.cles.length, "", "note")
      + "." + (manquants.length ? " The notes already returned are kept; you can resume the others." : ""));
  const commandes = actif ? [h("button", { type: "button", class: "btn", disabled: arretEnCours, onclick: () => { if (agent.arret) agent.arret.abort(); veiPeindre(); } }, arretEnCours ? "Arrêt en cours…" : "Arrêter la série")]
    : [filtre("Instruire en série", liste(VEI_BUDGETS.map(n => ({ v: String(n), t: Lg(n + (n > 1 ? " dérives" : " dérive"), n + (n > 1 ? " drifts" : " drift")) })), String(vei.n), v => veiRegler("n", +v))),
      h("button", { type: "button", class: "btn" + (manquants.length ? "" : " principal"), disabled: !!motif, title: motif || budget, onclick: () => drvLancerSerie(cibles.map(l => l.cle)) },
        Lg(np <= 1 ? "Instruire la première" : "Instruire les " + np + " premières", np <= 1 ? "Investigate the first one" : "Investigate the first " + np)),
      manquants.length ? h("button", { type: "button", class: "btn principal", disabled: ailleurs || !!pret, title: ailleurs || pret ? motif : null, onclick: () => drvLancerSerie(manquants) },
        Lg(manquants.length === 1 ? "Reprendre la dérive sans fiche" : "Reprendre les " + manquants.length + " dérives sans fiche", manquants.length === 1 ? "Resume the drift without a note" : "Resume the " + manquants.length + " drifts without a note")) : null];
  return h("div", { class: "drv-serie" },
    h("div", { class: "filtres" }, commandes),
    !actif && (ailleurs || pret) ? h("div", { class: "note attention", style: "margin:0 0 8px" }, motif) : null,
    vei.erreur && vei.erreur !== motif ? h("div", { class: "erreur", style: "margin:0 0 8px" }, tr(vei.erreur)) : null,
    bilan ? h("p", { class: "vei-bilan" }, bilan) : null,
    vei.retirees ? h("div", { class: "note attention" }, VEI_T.retirees[0]) : null,
    ou === "serie" ? [zoneProgres, repli("drv-journal-serie", "Journal détaillé de la série", journal, h("div", { class: "note", style: "margin-top:0" }, "Chaque ligne se déplie : elle montre l'appel exact et ce qui a été transmis au modèle."))] : null);
}

/* ---- Replis du bas : règle de tri, mémoire de la veille, évaluation d'origine ---- */
function drvRepliRegle() {
  const R = vei.regle, coche = (cle, texte) => h("label", { class: "vei-coche" }, h("input", { type: "checkbox", checked: R[cle], onchange: e => veiRegler(cle, !!e.target.checked) }), h("span", null, texte));
  return repli("drv-regle", "Règle de tri et règle de détection",
    h("div", { class: "filtres", style: "margin-bottom:10px" }, filtre("Classer par", segments([{ v: "cout", t: "Coût estimé" }, { v: "co2", t: "CO₂e" }, { v: "z", t: "Ampleur (|z| max)" }], R.critere, v => veiRegler("critere", v)))),
    h("div", { class: "vei-coches" }, coche("doublons", "Site et UES : une seule fois la même dérive"), coche("nouveautes", "Nouveautés d'abord"), coche("enCours", "Dérives en cours d'abord"), coche("sur", "Surconsommations d'abord"),
      R.critere === "z" ? null : coche("projection", "Compter la projection à 3 mois")),
    h("p", { class: "vei-regle" }, veiPhraseRegle(R)),
    h("p", { class: "note" }, REGLE_DERIVE),
    h("p", { class: "note" }, VEI_T.noteFile[0]));
}
function drvRepliVeille(D) {
  const C = vei.comparaison, c = veiConstat(C, D), J = vei.memo, lignes = veiLignes(), file = veiTrier(lignes.filter(l => l.aTraiter), vei.regle);
  const tot = veiTotal(file, new Set(D.analyses.filter(A => A.serie.groupe === "site").map(A => A.serie.energie))), sans = "pas de relevé antérieur";
  const enCoursParmi = eps => eps.filter(ep => ep.ouvert).length, nbStatuts = Object.keys(J.statuts).length, vide = !C.avant && !nbStatuts;
  const memoire = etat.figee ? VEI_T.figee[0]
    : Lg("Relevé précédent : " + (C.avant ? "le " + (dateFr(C.avant.le) || "–") + ", données jusqu'au " + (dateFr(C.avant.fin) || "–") : "aucun") + ". Relevé de ce chargement : " + veiNb(Object.keys(J.courant.eps).length, "épisode", "") + ". Statuts gardés : " + nbStatuts + ".",
      "Previous record: " + (C.avant ? (dateFr(C.avant.le) || "–") + ", data up to " + (dateFr(C.avant.fin) || "–") : "none") + ". Record of this load: " + veiNb(Object.keys(J.courant.eps).length, "", "episode") + ". Statuses kept: " + nbStatuts + ".");
  const copier = h("button", { type: "button", class: "btn", onclick: () => copierTexte(veiTexte(lignes, file, C, D, tot), copier).then(() => setTimeout(() => { copier.textContent = tr("Copier le point de situation"); }, 1650)) }, "Copier le point de situation");
  const mode = agent.demo ? VEI_T.demo[0] : Lg("Rédacteur : " + F().nom + " (" + modeleIA() + "), par " + F().api + ". Relecture par un second agent : " + (agent.juge ? "oui" : "non") + ". Pour chaque dérive, la série envoie ce que liste l'avis de l'instruction (réglages d'IA), rien de plus.",
    "Writer: " + F().nom + " (" + modeleIA() + "), through " + M(F().api) + ". Review by a second agent: " + (agent.juge ? "yes" : "no") + ". For each drift, the run sends what the investigation notice lists (AI settings), nothing more.");
  return repli("drv-veille", "Veille : nouveautés, mémoire et point de situation",
    h("p", { class: "vei-bilan" }, c.suite),
    h("div", { class: "tuiles" },
      tuile("Nouveaux épisodes", String(C.nouveau.length), Lg("dont " + enCoursParmi(C.nouveau) + " en cours", enCoursParmi(C.nouveau) + " of them ongoing")),
      tuile("En cours, aggravés ou prolongés", C.premier ? "–" : String(C.aggrave.length), C.premier ? sans : "plus de périodes, ou un |z| plus fort, qu'au relevé précédent"),
      tuile("Clos depuis le relevé", C.premier ? "–" : String(C.clos.length), C.premier ? sans : "ils étaient en cours au relevé précédent"),
      tuile("Surconsommations à traiter", tot.cout == null ? fmtEnergie(tot.wh, true) : fmtEuros(tot.cout, true), (tot.co2 == null ? "" : fmtCO2(tot.co2, true) + " · ") + Lg(veiNb(tot.n, "épisode", "") + ", au niveau Site, sans double compte", veiNb(tot.n, "", "episode") + ", at Site level, no double counting")),
      tuile("Si rien ne change, en 3 mois", tot.cout3 == null ? "–" : fmtEuros(tot.cout3, true), tot.enCours ? "projection simple des surconsommations en cours, pas une prévision" : "aucune surconsommation en cours à ce niveau")),
    h("p", { class: "vei-bilan" }, memoire),
    h("div", { class: "vei-pied" }, copier, h("button", { type: "button", class: "btn", onclick: () => print() }, "Imprimer le point de situation"),
      h("button", { type: "button", class: "btn", disabled: !!etat.figee || vide, title: etat.figee ? "Une copie figée ne garde aucune mémoire" : vide ? "La mémoire ne contient que le relevé de ce chargement" : null, onclick: veiOublier }, "Oublier la mémoire de la veille")),
    h("ul", { class: "vei-gardes" }, h("li", null, mode), h("li", null, VEI_T.lecture[0]), h("li", null, VEI_T.arret[0])),
    h("p", { class: "note" }, VEI_T.notePoint[0]), h("p", { class: "note" }, VEI_T.noteMemoire[0]));
}
function drvRepliEvaluation(ou) {
  const mien = ou === "evaluation";
  return repli("drv-eval", "Évaluer l'agent sur les plus gros épisodes",
    h("p", { class: "note", style: "margin-top:0" }, "L'agent instruit à la suite les plus gros épisodes, par écart cumulé ; la page mesure chaque fiche : format, nombres retrouvés dans les résultats d'outils, écart identique à celui du tableau de bord."),
    h("div", { class: "filtres" }, filtre("Épisodes évalués", segments([3, 5, 10].map(n => ({ v: n, t: String(n) })), agent.nEval, v => { if (!agent.enCours) { agent.nEval = v; drvPeindre(); } })),
      agent.enCours && mien ? h("button", { type: "button", class: "btn", onclick: () => { if (agent.arret) agent.arret.abort(); } }, "Arrêter")
        : h("button", { type: "button", class: "btn", disabled: agent.enCours, onclick: () => { drv.contexte = "evaluation"; drvAlias("agent"); lancerEvaluation(); } }, "Lancer l'évaluation")),
    drv.contexte === "evaluation" && agent.erreur ? h("div", { class: "erreur", style: "margin:0 0 10px" }, agent.erreur) : null,
    mien ? [zoneProgres, repli("drv-journal-eval", "Journal de l'évaluation", journal)] : null,
    zoneEval);
}

/* ---- La réponse : constat de la détection, sans filtre (mêmes calculs que pageDerives), et ce que la veille sait de neuf ---- */
function drvConstat(D) {
  const eps = D.episodes, avecSite = new Set(D.analyses.filter(A => A.serie.groupe === "site").map(A => A.serie.energie));
  const comptes = eps.filter(ep => ep.groupe === "site" || !avecSite.has(ep.energie)), ouverts = eps.filter(ep => ep.ouvert);
  const surEnCours = comptes.filter(ep => ep.ouvert && ep.ecart > 0), cout3 = surEnCours.map(ep => coutDe(ep.energie, projectionDe(ep).wh3mois)).filter(v => v != null);
  const nbSur = ouverts.filter(ep => ep.ecart > 0).length, candidats = surEnCours.length ? surEnCours : ouverts.filter(ep => ep.ecart > 0);
  const lourde = candidats.map(ep => ({ ep, p: projectionDe(ep) })).sort((x, y) => y.p.wh3mois - x.p.wh3mois)[0] || null;
  let phrase = !ouverts.length ? "Aucune dérive en cours."
    : nbSur === ouverts.length ? pluriel(nbSur, "surconsommation") + " en cours."
    : !nbSur ? pluriel(ouverts.length, "économie") + " en cours, aucune surconsommation."
    : pluriel(ouverts.length, "dérive") + " en cours, dont " + pluriel(nbSur, "surconsommation") + ".";
  if (lourde) { const c = coutDe(lourde.ep.energie, lourde.p.parPeriode);
    phrase += " La plus lourde, " + lourde.ep.serie + ", " + (c == null ? "dépasse sa référence de " + fmtEnergie(lourde.p.parPeriode) : "coûte " + fmtEuros(c)) + " par " + NOM_PAS[lourde.p.pas] + " depuis " + lourde.ep.libDebut + "."; }
  return { alerte: nbSur > 0, phrase, cout3: cout3.length ? somme(cout3) : null, plusieurs: surEnCours.length > 1, lourde: lourde ? lourde.ep : null, nbSur, nbOuverts: ouverts.length };
}
/* Les cartes d'origine de la détection (graphiques, tableaux, hypothèses), rendues par pageDerives sans filtre ni période.
   Tableaux et tuiles : toutes les séries. Graphiques : la série suivie, avec un second appel si ce n'est pas celle que pageDerives a choisie. */
function drvDetection(serie) {
  const m = etat.modele, garde = { derSerie: etat.derSerie, derSens: etat.derSens, derEtat: etat.derEtat, de: etat.de, a: etat.a }, carteOrigine = carte;
  const appel = s => {
    const cartes = {};
    Object.assign(etat, { derSerie: s, derSens: "*", derEtat: "*", de: m.debut, a: m.fin });
    carte = o => { const n = carteOrigine(o); cartes[o.id] = n; return n; };   // le temps de l'appel : on retrouve chaque carte par son identifiant
    try { const P = pageDerives(), connues = new Set(Object.values(cartes));
      return { cartes, tuiles: P[2], noteEcartees: P[3], noteFaibles: P[4], autres: [...P[5].childNodes].filter(n => !connues.has(n)) };   // « aucune donnée », « série non analysée »
    } finally { carte = carteOrigine; Object.assign(etat, garde); }
  };
  const G = appel("*"), D = derives(), A = D.episodes[0] ? D.episodes[0].analyse : D.analyses.find(x => x.ok);
  G.graphes = !A || A.serie.nom === serie ? G : appel(serie);               // sans série choisie, pageDerives dessine celle du plus gros épisode
  return G;
}
/* ---- Page ---- */
function drvZero(m) { Object.assign(drv, { modele: m, ouverte: null, serieVue: null, energie: "*", limite: DRV_LIMITE, contexte: null }); }
function drvPage() {
  const m = etat.modele, D = derives();
  if (agent.modele !== m) reinitialiserAgent(m);                          // comme les pages d'origine : l'état de l'agent suit le classeur chargé
  if (vei.modele !== m) veiAuChargement(m);
  if (drv.modele !== m) drvZero(m);
  veiSuivreLangue();
  if (etat.derEtat === "c") etat.derEtat = "*";                            // l'ancien filtre « Clos » n'existe plus sur cette page
  if (drv.energie !== "*" && !m.energies.includes(drv.energie)) drv.energie = "*";
  const lignes = drvLignes(), arrive = !DRV_PAGES.includes(drv.precedent);
  if (drv.ouverte && !lignes.some(l => l.cle === drv.ouverte) && !drv.choisi) drv.ouverte = null;
  if (arrive && !drv.choisi && etat.onglet === "agent") {                  // ancienne page Instruction : la dérive en cours d'instruction, ou la première de la liste, ou l'évaluation
    if (agent.evaluation) REPLIS_OUVERTS.add("drv-eval");
    else { const cle = drvCle(agent.episode), l = lignes.find(x => x.cle === cle) || drvFiltrer(lignes)[0] || lignes[0]; if (l) drvOuvrirLigne(l, lignes); }
  }
  if (etat.derSerie !== "*" && etat.derSerie !== drv.serieVue) {           // une série demandée ailleurs (Vue d'ensemble, visite, tableaux) : sa dérive la plus importante s'ouvre
    const l = lignes.find(x => x.ep.serie === etat.derSerie);
    if (l && !drv.choisi) drvOuvrirLigne(l, lignes);
    drv.serieVue = etat.derSerie;
  }
  drv.choisi = false;
  const focus = D.analyses.some(A => A.serie.nom === etat.derSerie) ? etat.derSerie : lignes.length ? lignes[0].ep.serie : "*";
  const P = drvDetection(focus), K = drvConstat(D), cartes = P.cartes;
  const constat = h("div", { class: "constat" + (K.alerte ? " alerte" : "") }, h("p", { class: "titre" }, K.phrase),
    K.cout3 != null ? h("p", { class: "suite" }, Lg("Si rien ne change, " + (K.plusieurs ? "les surconsommations en cours ajoutent " : "elle ajoute ") + fmtEuros(K.cout3) + " en 3 mois (projection simple, pas une prévision).",
      "If nothing changes, " + (K.plusieurs ? "the ongoing overconsumptions add " : "it adds ") + fmtEuros(K.cout3) + " over 3 months (simple projection, not a forecast).")) : null,
    h("p", { class: "suite drv-nouveau" }, Lg("Veille : ", "Watch: ") + veiConstat(vei.comparaison, D).titre));
  // graphiques de la série suivie : dessinés à la bonne largeur quand le repli s'ouvre
  drv.grapheLarge = REPLIS_OUVERTS.has("drv-graphiques");
  const options = [["site", "Site"], ["ues", "UES"]].map(([g, t]) => ({ groupe: t, options: D.analyses.filter(A => A.serie.groupe === g).map(A => ({ v: A.serie.nom, t: A.serie.nom + (A.ok ? "" : " (non analysée)") })) })).filter(g => g.options.length);
  const graphes = repli("drv-graphiques", Lg("Courbes de « " + focus + " » : écarts cumulés (CUSUM) et z", "Charts for “" + focus + "”: cumulative gaps (CUSUM) and z"),
    h("div", { class: "filtres" }, filtre("Série", liste(options, focus, v => { etat.derSerie = v; drv.serieVue = v; rendre(); }))),
    h("div", { class: "grille" }, P.graphes.cartes["der-cusum"], P.graphes.cartes["der-z"], P.graphes.autres), P.noteFaibles);
  graphes.setAttribute("data-drv", "graphiques");
  graphes.addEventListener("toggle", () => {
    if (!graphes.open || drv.grapheLarge) return;
    rendre();
    const d = app.querySelector('[data-drv="graphiques"]'), s = d && d.querySelector("summary");
    if (s && s.focus) s.focus();
  });
  const tableaux = repli("drv-tableaux", "Tableaux de la détection : épisodes, dérives en cours, part des UES",
    P.tuiles, h("div", { class: "grille" }, cartes["der-ouverts"], cartes["der-episodes"], cartes["der-ues"]));
  const valo = repli("drv-valo", "Coût et carbone : hypothèses", h("div", { class: "grille" }, cartes["der-valo"]));
  drvPeindre();
  return [constat, P.noteEcartees, drvNoeud, graphes, tableaux, valo, drvNoeudBas];
}
/* Partie qui bouge pendant le travail de l'agent : redessinée par peindreAgent et veiPeindre, sans refaire les graphiques. */
function drvPeindre() {
  if (!drvIci() || drv.modele !== etat.modele || vei.modele !== etat.modele) return;
  veiSuivreLangue();
  const D = derives(), m = etat.modele, toutes = drvLignes(), visibles = drvFiltrer(toutes), montrees = visibles.slice(0, drv.limite), reste = visibles.length - montrees.length, ou = drvJournalA();
  const filtres = h("div", { class: "filtres drv-filtres" },
    filtre("Dérives", segments([{ v: "o", t: "En cours" }, { v: "*", t: "Toutes" }], etat.derEtat, v => maj("derEtat", v))),
    filtre("Sens", segments([{ v: "*", t: "Les deux" }, { v: "+", t: "Surconsommations" }, { v: "-", t: "Économies" }], etat.derSens, v => maj("derSens", v))),
    m.energies.length > 1 ? filtre("Énergie", liste([{ v: "*", t: "Toutes" }].concat(m.energies.map(e => ({ v: e, t: e }))), drv.energie, v => { drv.energie = v; rendre(); })) : null);
  const entetes = h("div", { class: "drv-ligne drv-entetes", "aria-hidden": "true" }, h("span", null, "Dérive"), h("span", null, "Période"), h("span", null, "Écart"), h("span", null, "Coût estimé"), h("span", null, "Statut"), h("span", null, ""));
  drvNoeud.replaceChildren(...[
    typeof iaRappel === "function" ? iaRappel("margin:0 0 12px") : null,
    filtres, drvSerie(visibles, ou),
    visibles.length ? [entetes, h("ol", { class: "drv-liste" }, montrees.map(drvLigne))]
      : h("div", { class: "vide" }, toutes.length ? "Aucune dérive pour ces filtres." : "Aucun épisode de dérive détecté."),
    reste > 0 ? h("p", { class: "drv-plus" }, h("button", { type: "button", class: "btn", onclick: () => { drv.limite = Infinity; drvPeindre(); } }, Lg("Afficher les " + reste + " autres", "Show the " + reste + " others"))) : null,
    h("p", { class: "note drv-note" }, "Coûts estimés avec les hypothèses de prix plus bas ; « + 3 mois » prolonge l'écart moyen d'une dérive en cours : ce n'est pas une prévision.")].flat().filter(Boolean));
  drvNoeudBas.replaceChildren(drvRepliRegle(), drvRepliVeille(D), drvRepliEvaluation(ou));
}

AU_CHARGEMENT.push(m => drvZero(m));
APRES_RENDU.push(() => {
  drv.precedent = etat.modele ? etat.onglet : null;
  if (!drvIci()) return;
  const entrees = PAGES.flatMap(g => g.pages), k = entrees.findIndex(p => p[0] === "derives"), b = app.querySelectorAll(".menu .entree")[k];
  if (b && !b.getAttribute("aria-current")) b.setAttribute("aria-current", "page");   // anciennes adresses : l'entrée « Dérives » reste marquée
  if (drv.defiler) {                                                       // une dérive ouverte depuis une autre page : on la montre
    drv.defiler = false;
    if (typeof accVisite !== "undefined" && accVisite.ouverte) return;    // la visite guidée place elle-même l'écran
    setTimeout(() => { const li = app.querySelector(".drv-item.ouverte"); if (li && li.scrollIntoView) li.scrollIntoView({ block: "start" }); }, 0);
  }
});

ajouterTraductions([
  ["Dérives", "Drifts"], ["Aucune dérive en cours.", "No ongoing drift."], ["Refermer", "Close"], ["Voir la fiche", "See the note"], ["Instruire", "Investigate"],
  ["Voir sa prévision", "See its forecast"], ["La simuler", "Simulate it"], ["L'ajouter à la revue", "Add it to the review"], ["Voir ses graphiques", "See its charts"],
  ["Page Prévision, sur cette série, dérive en cours prolongée", "Forecast page, on this series, ongoing drift extended"], ["Page Prévision, sur cette série", "Forecast page, on this series"],
  ["Simulateur, sur cette série et la période de la dérive", "Simulator, on this series and the drift's period"], ["Page Revue, sur l'année qui couvre la dérive : ses faits y figurent", "Review page, on the year that covers the drift: its facts are included"],
  ["Écarts cumulés (CUSUM) et z de cette série, plus bas", "Cumulative gaps (CUSUM) and z of this series, further down"],
  ["Votre décision :", "Your decision:"], ["À traiter", "To handle"], ["Validée", "Validated"], ["Écartée", "Dismissed"],
  ["Une instruction est déjà en cours", "An investigation is already running"], ["Journal de l'agent", "Agent log"], ["Journal détaillé de la série", "Detailed log of the run"], ["Journal de l'évaluation", "Evaluation log"],
  ["Chaque ligne se déplie : elle montre l'appel exact et ce qui a été transmis au modèle.", "Each line expands: it shows the exact call and what was passed to the model."],
  ["Les dérives à traiter de la liste ont déjà leur fiche.", "The drifts to handle in the list already have their note."], ["Aucune dérive à traiter dans la liste.", "No drift to handle in the list."],
  ["Arrêter la série", "Stop the run"], ["Arrêt en cours…", "Stopping…"], ["Instruire en série", "Investigate in a row"],
  ["Règle de tri et règle de détection", "Ranking rule and detection rule"], ["Classer par", "Rank by"], ["Coût estimé", "Estimated cost"], ["Ampleur (|z| max)", "Magnitude (max |z|)"],
  ["Site et UES : une seule fois la même dérive", "Site and SEU: the same drift only once"], ["Nouveautés d'abord", "What is new first"], ["Dérives en cours d'abord", "Ongoing drifts first"],
  ["Surconsommations d'abord", "Overconsumption first"], ["Compter la projection à 3 mois", "Count the 3-month projection"],
  ["Veille : nouveautés, mémoire et point de situation", "Watch: what is new, memory and status report"],
  ["Nouveaux épisodes", "New episodes"], ["En cours, aggravés ou prolongés", "Ongoing, worse or longer"], ["Clos depuis le relevé", "Closed since last record"], ["Surconsommations à traiter", "Overconsumption to handle"], ["Si rien ne change, en 3 mois", "If nothing changes, over 3 months"],
  ["pas de relevé antérieur", "no earlier record"], ["plus de périodes, ou un |z| plus fort, qu'au relevé précédent", "more periods, or a higher |z|, than at the previous record"], ["ils étaient en cours au relevé précédent", "they were ongoing at the previous record"],
  ["projection simple des surconsommations en cours, pas une prévision", "simple projection of ongoing overconsumption, not a forecast"], ["aucune surconsommation en cours à ce niveau", "no ongoing overconsumption at this level"],
  ["Copier le point de situation", "Copy the status report"], ["Imprimer le point de situation", "Print the status report"], ["Oublier la mémoire de la veille", "Forget the watch memory"],
  ["Une copie figée ne garde aucune mémoire", "A frozen copy keeps no memory"], ["La mémoire ne contient que le relevé de ce chargement", "The memory holds only the record of this load"],
  ["Évaluer l'agent sur les plus gros épisodes", "Evaluate the agent on the largest episodes"], ["Épisodes évalués", "Episodes evaluated"], ["Lancer l'évaluation", "Run the evaluation"], ["Lancer l'instruction", "Run the investigation"], ["Arrêter", "Stop"],
  ["L'agent instruit à la suite les plus gros épisodes, par écart cumulé ; la page mesure chaque fiche : format, nombres retrouvés dans les résultats d'outils, écart identique à celui du tableau de bord.",
    "The agent investigates the largest episodes in a row, by cumulative gap; the page measures each note: format, numbers found in the tool results, gap identical to the dashboard's."],
  ["Tableaux de la détection : épisodes, dérives en cours, part des UES", "Detection tables: episodes, ongoing drifts, share of the SEUs"], ["Coût et carbone : hypothèses", "Cost and carbon: assumptions"],
  ["Sens", "Direction"], ["En cours", "Ongoing"], ["Toutes", "All"], ["Les deux", "Both"], ["Surconsommations", "Overconsumption"], ["Économies", "Savings"], ["Énergie", "Energy"], ["Série", "Series"],
  ["Dérive", "Drift"], ["Période", "Period"], ["Écart", "Gap"], ["Statut", "Status"],
  ["Aucune dérive pour ces filtres.", "No drift for these filters."], ["Aucun épisode de dérive détecté.", "No drift episode detected."],
  ["Coûts estimés avec les hypothèses de prix plus bas ; « + 3 mois » prolonge l'écart moyen d'une dérive en cours : ce n'est pas une prévision.",
    "Costs estimated with the price assumptions further down; “+ 3 months” extends the average gap of an ongoing drift: it is not a forecast."]
].filter(([fr]) => !EN.has(fr)));                                           // sans remplacer une traduction d'origine ou d'un autre module
