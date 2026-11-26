/* ============================================================================
   Module « Veille » (préfixe vei) : à chaque chargement d'un classeur, la page
   compare les épisodes de derives() à ceux du chargement précédent, les classe par enjeu,
   instruit les N premiers à la suite (boucleAgent et jugerFiche d'origine) et rend un point
   de situation que la personne annote. L'agent lit et rédige : il ne décide de rien.
   ============================================================================ */
const VEI_CLE = "revue-energetique.vei.memoire", VEI_CLE_REGLAGES = "revue-energetique.vei.reglages";
const VEI_REGLE = { critere: "cout", projection: true, doublons: true, nouveautes: true, enCours: true, sur: true };
const VEI_BUDGETS = [1, 3, 5, 10], VEI_TOURS_JUGE = 3, VEI_ECHECS_DE_SUITE = 2, VEI_JEUX_MAX = 6;     // jugerFiche fait au plus 3 tours
const vei = { modele: null, jeu: null, memo: null, comparaison: null, regle: Object.assign({}, VEI_REGLE), n: 3, serie: null, resultats: new Map(),
  ouverte: null, motif: null, erreur: null, guet: null, langue: null, retirees: 0, journalOuvert: false };
const veiNoeud = h("div", { class: "vei" });
const veiJour = () => { const d = new Date(); return isoJour(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };     // date du jour, à l'heure du poste

/* ---- Mémoire locale : sobre, sans nom de série ni valeur de consommation ----
   { jeux: { <empreinte du jeu de données>: { vu, avant, courant, statuts } } }
   avant, courant : relevés { sig, fin, le, eps: { <empreinte de l'épisode>: [périodes, |z| max, date de fin, en cours] } }
   statuts : { <empreinte de l'épisode>: { s: "valide" | "ecarte", motif, n: périodes au moment de la décision, le } } */
function veiLireStock(cle) { try { const v = JSON.parse(localStorage.getItem(cle) || "null"); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch (e) { return null; } }
function veiEcrireStock(cle, v) { if (etat.figee) return false; try { if (v == null) localStorage.removeItem(cle); else localStorage.setItem(cle, JSON.stringify(v)); return true; } catch (e) { return false; } }
function veiHash(t) {                                                    // empreinte courte et stable d'un texte (cyrb53)
  let a = 0xdeadbeef, b = 0x41c6ce57;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
}
/* Un épisode garde son identité tant que sa série, son sens et sa première période ne changent pas : sa fin peut reculer d'un chargement à l'autre. */
const veiCle = ep => veiHash(ep.serie + "|" + (ep.ecart > 0 ? "+" : "-") + "|" + isoJour(ep.debut));
const veiJeu = m => veiHash(m.series.map(sr => sr.groupe + "|" + sr.energie + "|" + sr.nom).sort().join("\n"));     // même jeu de données = mêmes séries
function veiReleve(episodes, finDonnees) {
  const eps = {};
  for (const ep of episodes) eps[veiCle(ep)] = [ep.n, Math.round(ep.zmax * 10) / 10, isoJour(ep.fin), ep.ouvert ? 1 : 0];
  const fin = isFinite(finDonnees) ? isoJour(finDonnees) : "";
  return { sig: veiHash(fin + "#" + Object.keys(eps).sort().map(k => k + ":" + eps[k].join(",")).join(";")), fin, le: veiJour(), eps };
}
const veiReleveValide = r => r && typeof r === "object" && typeof r.sig === "string" && r.eps && typeof r.eps === "object" ? r : null;
/* Compare les épisodes d'aujourd'hui au relevé précédent. Sans relevé : premier passage, tout est nouveau. */
function veiComparer(avant, episodes) {
  const etats = new Map(), listes = { nouveau: [], aggrave: [], encours: [], clos: [], connu: [] }, vus = avant ? avant.eps : {}, presents = new Set();
  for (const ep of episodes) {
    const cle = veiCle(ep), a = Array.isArray(vus[cle]) ? vus[cle] : null, plus = a ? ep.n - a[0] : 0;
    presents.add(cle);
    const e = !a ? "nouveau" : ep.ouvert ? (plus > 0 || ep.zmax > a[1] + 0.05 ? "aggrave" : "encours") : a[3] ? "clos" : "connu";
    etats.set(cle, { etat: e, plus: Math.max(0, plus) }); listes[e].push(ep);
  }
  return Object.assign({ premier: !avant, avant: avant ? { fin: avant.fin, le: avant.le } : null, etats, disparus: Object.keys(vus).filter(k => !presents.has(k)).length }, listes);
}
function veiEnregistrer() {
  if (etat.figee || !vei.memo) return;
  const stock = veiLireStock(VEI_CLE) || {}, jeux = stock.jeux && typeof stock.jeux === "object" ? stock.jeux : {};
  vei.memo.vu = veiJour(); jeux[vei.jeu] = vei.memo;
  const gardes = Object.keys(jeux).sort((x, y) => String(jeux[y].vu || "").localeCompare(String(jeux[x].vu || ""))).slice(0, VEI_JEUX_MAX);     // les jeux les plus récents seulement
  veiEcrireStock(VEI_CLE, { v: 1, jeux: Object.fromEntries(gardes.map(k => [k, jeux[k]])) });
}
function veiAuChargement(m) {
  if (vei.serie && vei.serie.active && agent.arret) agent.arret.abort();   // une série lancée sur l'ancien classeur s'arrête
  Object.assign(vei, { modele: m, jeu: veiJeu(m), serie: null, resultats: new Map(), ouverte: null, motif: null, erreur: null, langue: LANGUE, retirees: 0 });
  const D = derives(), releve = veiReleve(D.episodes, D.finDonnees), stock = etat.figee ? null : veiLireStock(VEI_CLE), lu = stock && stock.jeux && stock.jeux[vei.jeu];
  const J = { avant: veiReleveValide(lu && lu.avant), courant: veiReleveValide(lu && lu.courant), statuts: lu && lu.statuts && typeof lu.statuts === "object" ? lu.statuts : {} };
  // mêmes données qu'au dernier chargement : on garde le même point de comparaison ; données différentes : le dernier relevé devient le précédent
  if (!J.courant || J.courant.sig !== releve.sig) { if (J.courant) J.avant = J.courant; J.courant = releve; }
  vei.memo = J; vei.comparaison = veiComparer(J.avant, D.episodes);
  veiEnregistrer();
}
function veiOublier() {
  if (etat.figee || !confirm(tr(VEI_T.oubli[0]))) return;
  veiEcrireStock(VEI_CLE, null); veiEcrireStock(VEI_CLE_REGLAGES, null);
  const D = derives();
  vei.memo = { avant: null, courant: veiReleve(D.episodes, D.finDonnees), statuts: {} }; vei.comparaison = veiComparer(null, D.episodes); vei.motif = null;
  veiPeindre();
}
(function veiLireReglages() {
  const r = veiLireStock(VEI_CLE_REGLAGES);
  if (!r) return;
  if (VEI_BUDGETS.includes(r.n)) vei.n = r.n;
  for (const k in VEI_REGLE) if (r.regle && typeof r.regle[k] === typeof VEI_REGLE[k] && (k !== "critere" || ["cout", "co2", "z"].includes(r.regle[k]))) vei.regle[k] = r.regle[k];
})();
function veiRegler(cle, v) {
  if (cle === "n") vei.n = v; else vei.regle[cle] = v;
  veiEcrireStock(VEI_CLE_REGLAGES, { regle: vei.regle, n: vei.n });
  veiPeindre();
}

/* ---- Tri par enjeu ---- */
/* Une UES et le Site décrivent probablement la même dérive quand leurs épisodes ont la même énergie, le même sens et des dates qui se recoupent. */
function veiDoublons(episodes) {
  const sites = episodes.filter(e => e.groupe === "site"), out = new Map();
  for (const u of episodes) {
    if (u.groupe !== "ues") continue;
    let meilleur = null, commun = -1;
    for (const st of sites) {
      if (st.energie !== u.energie || (st.ecart > 0) !== (u.ecart > 0)) continue;
      const d = Math.min(st.fin, u.fin) - Math.max(st.debut, u.debut);
      if (d >= 0 && d > commun) { meilleur = st; commun = d; }
    }
    if (meilleur) out.set(u, meilleur);
  }
  return out;
}
/* Enjeu d'un épisode : coût et CO2e de l'écart constaté, et de la projection à 3 mois quand il est en cours. « valeur » sert au tri. */
function veiEnjeu(ep, regle) {
  const wh3 = ep.ouvert ? projectionDe(ep).wh3mois : null, cout = coutDe(ep.energie, ep.ecart), co2 = co2De(ep.energie, ep.ecart);
  const cout3 = wh3 == null ? null : coutDe(ep.energie, wh3), co23 = wh3 == null ? null : co2De(ep.energie, wh3);
  const total = (v, v3) => v == null ? null : Math.abs(v) + (regle.projection && v3 != null ? Math.abs(v3) : 0);
  return { cout, co2, wh3, cout3, co23, valeur: regle.critere === "z" ? ep.zmax : regle.critere === "co2" ? total(co2, co23) : total(cout, cout3) };
}
function veiTrier(lignes, regle) {
  const d = (x, y) => (x ? 0 : 1) - (y ? 0 : 1), num = v => v == null ? -1 : v;       // un épisode sans hypothèse de prix passe après les épisodes chiffrés
  return lignes.slice().sort((x, y) => (regle.doublons ? d(!x.doublon, !y.doublon) : 0) || (regle.nouveautes ? d(x.neuf, y.neuf) : 0) || (regle.enCours ? d(x.ep.ouvert, y.ep.ouvert) : 0)
    || (regle.sur ? d(x.ep.ecart > 0, y.ep.ecart > 0) : 0) || num(y.enjeu.valeur) - num(x.enjeu.valeur) || y.ep.zmax - x.ep.zmax || Math.abs(y.ep.ecart) - Math.abs(x.ep.ecart));
}
/* Enjeu total des surconsommations, sans double compte : même règle que la page Détection (une énergie qui a un compteur de niveau Site ne compte que ses épisodes de Site). */
function veiTotal(lignes, avecSite) {
  const sur = lignes.filter(l => l.ep.ecart > 0), comptes = sur.filter(l => l.ep.groupe === "site" || !avecSite.has(l.ep.energie));
  const s = f => { const v = comptes.map(f).filter(x => x != null); return v.length ? somme(v) : null; };
  return { n: comptes.length, exclus: sur.length - comptes.length, wh: somme(comptes.map(l => l.ep.ecart)), cout: s(l => l.enjeu.cout), co2: s(l => l.enjeu.co2), cout3: s(l => l.enjeu.cout3), co23: s(l => l.enjeu.co23),
    enCours: comptes.filter(l => l.ep.ouvert).length };
}
function veiStatut(cle, ep) {
  const st = vei.memo && vei.memo.statuts[cle];
  if (!st || (st.s !== "valide" && st.s !== "ecarte")) return { s: "atraiter", plus: 0 };
  return { s: st.s, motif: String(st.motif || ""), le: st.le, plus: Math.max(0, ep.n - (st.n || 0)) };     // plus > 0 : l'épisode s'est allongé depuis la décision, elle est à revoir
}
function veiLignes() {
  const D = derives(), dbl = veiDoublons(D.episodes), recoupes = new Map(), C = vei.comparaison;
  for (const st of dbl.values()) recoupes.set(st, (recoupes.get(st) || 0) + 1);
  return D.episodes.map(ep => {
    const cle = veiCle(ep), c = (C && C.etats.get(cle)) || { etat: "connu", plus: 0 }, statut = veiStatut(cle, ep);
    return { ep, cle, nouveaute: c.etat, plus: c.plus, statut, aTraiter: statut.s === "atraiter" || statut.plus > 0, neuf: c.etat === "nouveau" || c.etat === "aggrave" || statut.plus > 0,
      doublon: dbl.get(ep) || null, recoupe: recoupes.get(ep) || 0, enjeu: veiEnjeu(ep, vei.regle), resultat: vei.resultats.get(cle) || null };
  });
}
function veiFixerStatut(cle, s, motif) {
  const ep = derives().episodes.find(e => veiCle(e) === cle), J = vei.memo, texte = String(motif || "").trim().slice(0, 300);
  if (!ep || !J || !["atraiter", "valide", "ecarte"].includes(s) || (s === "ecarte" && !texte)) return false;     // écarter exige un motif
  if (s === "atraiter") delete J.statuts[cle]; else J.statuts[cle] = { s, motif: s === "ecarte" ? texte : "", n: ep.n, le: veiJour() };
  veiEnregistrer();
  return true;
}
function veiChoisirStatut(l, v, lieu) {
  if (v === "ecarte") vei.motif = { cle: l.cle, lieu, texte: l.statut.s === "ecarte" ? l.statut.motif : "" };
  else { vei.motif = null; veiFixerStatut(l.cle, v, ""); }
  veiPeindre();
  const champ = veiNoeud.querySelector(".vei-motif");
  if (champ) champ.focus();
}

/* ---- Relecture en mode démonstration : un script joue le juge, avec deux contrôles déterministes et la forme de réponse de l'API ---- */
async function veiJugeDemo(requete, signal) {
  await attendre(200, signal);
  const dossier = String(requete.messages[0].content), points = [];
  let resume;
  try {
    const f = JSON.parse(/\(JSON\) :\n(.*)\n/.exec(dossier)[1]), ep = JSON.parse(/Épisode \(JSON\) : (\{.*\})/.exec(dossier)[1]), recu = dossier.slice(dossier.indexOf("\n\n") + 2);
    const ctrl = controlerChiffres([f.ipe_ues, f.periode, String(Math.abs(f.ecart_kwh)), String(Math.abs(f.ecart_pct)), f.action_proposee, f.justification_confiance]
      .concat(f.causes_probables.flatMap(c => [c.cause, c.preuve_chiffree]), f.verifications_sur_site), [recu]);
    const identique = Math.abs(f.ecart_kwh - ep.ecart_kwh) <= Math.max(0.01, Math.abs(ep.ecart_kwh) * 0.001);
    if (ctrl.nbAbsents) points.push({ gravite: "bloquant", champ: Lg("chiffres", "figures"), constat: Lg("Nombres absents des résultats d'outils : ", "Numbers missing from the tool results: ") + ctrl.absents.join(" · ") + "." });
    if (!identique) points.push({ gravite: "bloquant", champ: "ecart_kwh", constat: Lg("L'écart de la fiche n'est pas celui de l'épisode à instruire.", "The gap in the note is not the gap of the episode to investigate.") });
    resume = Lg("Relecture jouée par un script, sans IA : " + (ctrl.total - ctrl.nbAbsents) + " nombre(s) sur " + ctrl.total + " retrouvé(s) dans les résultats d'outils, écart " + (identique ? "identique à" : "différent de")
      + " celui de l'épisode. Le raisonnement et les causes n'ont pas été relus.", "Review played by a script, no AI: " + (ctrl.total - ctrl.nbAbsents) + " of " + ctrl.total + " number(s) found in the tool results, gap "
      + (identique ? "identical to" : "different from") + " the episode's. The reasoning and the causes were not reviewed.");
  } catch (e) {
    resume = Lg("Relecture jouée par un script, sans IA : il n'a pas pu lire le dossier.", "Review played by a script, no AI: it could not read the file.");
    points.push({ gravite: "bloquant", champ: "format", constat: resume });
  }
  return { id: "msg_vei_juge", type: "message", role: "assistant", model: "script de démonstration", stop_reason: "tool_use", usage: { input_tokens: 0, output_tokens: 0 },
    content: [{ type: "tool_use", id: "toolu_vei_juge", name: OUTIL_VERDICT.name, input: { verdict: points.length ? "à corriger" : "conforme", resume, points } }] };
}

/* ---- Instruction en série ----
   Même discipline que lancerEvaluation : un seul verrou (agent.enCours), un seul arrêt (agent.arret), le journal et la progression de la page Instruction.
   cles : épisodes à reprendre (sinon les N premiers de la file sans fiche). redacteurEssai : rédacteur de remplacement, pour les tests. */
async function veiLancerSerie(cles, redacteurEssai) {
  const m = etat.modele;
  if (agent.enCours || !m) return;
  if (agent.modele !== m) reinitialiserAgent(m);
  const lignes = veiLignes(), aFiche = l => !!(l.resultat && l.resultat.etat === "fiche");
  const cibles = cles ? cles.map(c => lignes.find(l => l.cle === c)).filter(l => l && !aFiche(l)) : veiTrier(lignes.filter(l => l.aTraiter), vei.regle).filter(l => !aFiche(l)).slice(0, vei.n);
  vei.erreur = !cibles.length ? "Tous les épisodes à traiter ont déjà leur fiche." : !redacteurEssai && blocageEnvoi() ? VEI_T.pasPret[0] : null;
  if (vei.erreur) { veiPeindre(); return; }
  agent.enCours = true; agent.arret = new AbortController();
  const signal = agent.arret.signal, R = redacteurEssai ? redacteurEssai(signal) : redacteurCourant(signal), resultats = vei.resultats;
  const S = vei.serie = { active: true, cles: cibles.map(l => l.cle), demo: R.demo, juge: R.demo ? "script" : agent.juge ? "ia" : "non", arrete: false, interrompue: false, marque: null };
  const juger = R.juger || (R.demo ? requete => veiJugeDemo(requete, signal) : R.appeler);
  for (const l of cibles) resultats.set(l.cle, { cle: l.cle, etat: "attente" });
  vei.retirees = 0;
  journal.replaceChildren(); zoneFiche.replaceChildren(); zoneEval.replaceChildren(); agent.evaluation = null; agent.erreur = null;   // le journal change de sujet
  demarrerSuivi("evaluation", cibles.length);
  veiPeindre();
  const sansReperes = () => { for (const d of journal.querySelectorAll("details")) delete d.dataset.source; };     // journal de plusieurs épisodes : au survol d'une fiche, pas de renvoi vers la ligne d'un autre
  let suite = 0;
  try {
    for (const [k, l] of cibles.entries()) {
      if (signal.aborted) break;
      sansReperes();
      const ep = l.ep, t0 = performance.now(), r = { cle: l.cle, etat: "cours", res: null, jugement: null, mesures: null, erreur: null, tours: null, duree: null, demo: R.demo, redacteur: R.signature(null) };
      resultats.set(l.cle, r);
      noter("episode", "Épisode " + (k + 1) + " sur " + cibles.length + " : « " + ep.serie + " », " + ep.libDebut + " → " + ep.libFin);
      if (!S.marque) S.marque = journal.firstChild;
      veiPeindre();
      try {
        const res = await boucleAgent(ep, R.appeler, signal, R.nom);
        r.res = res; r.tours = res.tours; r.redacteur = R.signature(res);
        if (!res.fiche) r.etat = "hors-format";
        else {
          r.mesures = mesurerFiche(ep, res); r.etat = "fiche";
          if (S.juge === "non") r.jugement = { absent: "désactivée." };
          else {
            noter("tour", "Relecture par un second agent"); if (agent.progres) agent.progres.phase = "le second agent relit la fiche";
            try { r.jugement = { verdict: await jugerFiche(res, juger, signal) }; noter("dit", "Verdict : " + r.jugement.verdict.verdict + ". " + r.jugement.verdict.resume); }
            catch (e) { if (signal.aborted) { r.jugement = { absent: "arrêtée avant son verdict." }; throw e; } r.jugement = { erreur: e && e.message ? e.message : String(e) }; }
          }
        }
      } catch (e) {
        if (signal.aborted) break;                                       // l'état de l'épisode interrompu est fixé dans finally
        r.etat = "echec"; r.erreur = e && e.message ? e.message : String(e);
      }
      r.duree = (performance.now() - t0) / 1000;
      const ok = r.etat === "fiche";
      fermerEtape(ok ? "fait" : "echec"); if (agent.progres) agent.progres.etats.push(ok ? "fait" : "echec");
      suite = ok ? 0 : suite + 1;
      if (suite >= VEI_ECHECS_DE_SUITE && k < cibles.length - 1) { S.interrompue = true; break; }     // garde-fou : on ne répète pas une erreur sur toute la file
    }
  } finally {
    for (const c of S.cles) { const r = resultats.get(c); if (r.etat === "cours") r.etat = "arrete"; else if (r.etat === "attente") r.etat = "non-lance"; }
    S.active = false; S.arrete = signal.aborted; sansReperes();
    arreterSuivi(signal.aborted ? "arrêté" : S.cles.some(c => resultats.get(c).etat !== "fiche") ? "échec" : "terminé");
    agent.enCours = false; agent.arret = null;
    if (etat.onglet === "agent") peindreAgent(); else veiPeindre();
  }
}
/* La fiche complète est celle de la page Instruction : montrerFiche la compose dans zoneFiche, d'où on la retire sans rien y laisser ni y perdre. */
function veiNoeudFiche(l) {
  const r = l.resultat, garde = [...zoneFiche.childNodes];
  montrerFiche(l.ep, r.res, r.redacteur, r.jugement);
  const noeud = zoneFiche.firstChild;
  zoneFiche.replaceChildren(...garde);
  return noeud;
}

/* ---- Textes communs à l'écran et à l'export ---- */
const veiNb = (n, fr, en, frs, ens) => n + " " + (LANGUE === "en" ? (n === 1 ? en : ens || en + "s") : n > 1 ? frs || fr + "s" : fr);
const veiLib = ep => ep.libDebut + (ep.libFin === ep.libDebut ? "" : " → " + ep.libFin);
const veiSens = ep => Lg(ep.sens, M(ep.sens));
const veiNomStatut = st => st.s === "valide" ? Lg("validé", "validated") : st.s === "ecarte" ? Lg("écarté", "dismissed") : Lg("à traiter", "to handle");
function veiResume(l) {
  const ep = l.ep, e = l.enjeu, parts = [veiSens(ep) + Lg(" de ", " of ") + fmtEnergie(ep.ecart, true) + " (" + fmtPct(ep.pct, true) + ")"];
  if (e.cout != null) parts.push(Lg("coût estimé ", "estimated cost ") + fmtEuros(e.cout, true));
  if (e.co2 != null) parts.push(fmtCO2(e.co2, true));
  if (e.wh3 != null) parts.push(Lg("en 3 mois de plus si l'écart moyen se maintient : ", "over 3 more months if the average gap holds: ") + (e.cout3 == null ? fmtEnergie(e.wh3, true) : fmtEuros(e.cout3, true)));
  return parts.join(", ");
}
function veiNouveaute(l) {
  const plus = l.plus > 0 ? " (+" + veiNb(l.plus, "période", "period") + ")" : "", e = l.nouveaute;
  return e === "nouveau" ? Lg("nouveau", "new") : e === "aggrave" ? (l.ep.ecart > 0 ? Lg("s'aggrave", "worsening") : Lg("se prolonge", "continuing")) + plus
    : e === "encours" ? Lg("en cours, inchangé", "ongoing, unchanged") : e === "clos" ? Lg("clos depuis le relevé", "closed since last record") + plus : Lg("déjà vu", "seen before");
}
const veiRecoupe = l => l.doublon ? Lg("même dérive que le Site : « " + l.doublon.serie + " », " + veiLib(l.doublon), "same drift as the Site: “" + l.doublon.serie + "”, " + veiLib(l.doublon))
  : l.recoupe ? Lg("recoupe " + veiNb(l.recoupe, "épisode", "") + " d'UES", "overlaps " + veiNb(l.recoupe, "", "SEU episode")) : "";
function veiVerdict(r) {
  const j = r.jugement;
  if (!j) return Lg("pas de relecture", "no review");
  if (j.absent) return Lg("non faite : ", "not done: ") + tr(j.absent);
  if (j.erreur) return Lg("la relecture a échoué. ", "the review failed. ") + tr(j.erreur);
  const v = j.verdict;
  return Lg(v.verdict, M(v.verdict)) + (v.points.length ? " (" + veiNb(v.points.length, "point", "point") + ")" : "") + (r.demo ? "" : Lg(", par un second agent", ", by a second agent")) + ". " + v.resume;
}
function veiControles(r) {
  const c = r.mesures;
  return !c ? "" : Lg((c.ctrl.total - c.ctrl.nbAbsents) + " nombre(s) sur " + c.ctrl.total + " retrouvé(s) dans les résultats d'outils" + (c.ctrl.absents.length ? " (à vérifier : " + c.ctrl.absents.join(" · ") + ")" : "")
    + " ; écart " + (c.identique ? "identique à" : "différent de") + " celui du tableau de bord.", (c.ctrl.total - c.ctrl.nbAbsents) + " of " + c.ctrl.total + " number(s) found in the tool results"
    + (c.ctrl.absents.length ? " (to check: " + c.ctrl.absents.join(" · ") + ")" : "") + "; gap " + (c.identique ? "identical to" : "different from") + " the dashboard's.");
}
const veiEtatTexte = r => r.etat === "cours" ? Lg("instruction en cours…", "investigation running…") : r.etat === "attente" ? Lg("en attente", "waiting") : r.etat === "non-lance" ? Lg("non lancé : la série s'est arrêtée avant", "not started: the run stopped before it")
  : r.etat === "arrete" ? Lg("arrêté avant la fiche", "stopped before the note") : r.etat === "hors-format" ? Lg("réponse hors format, sans fiche", "off-format answer, no note") : r.etat === "echec" ? Lg("échec : ", "failed: ") + tr(r.erreur || "") : "";
function veiConstat(C, D) {
  const n = D.episodes.length, fin = isFinite(D.finDonnees) ? fmtDate(D.finDonnees) : "–";
  if (C.premier) return { alerte: n > 0, titre: !n ? Lg("Premier passage sur ce jeu de données : aucun épisode de dérive détecté.", "First pass on this dataset: no drift episode detected.")
      : Lg("Premier passage sur ce jeu de données : " + veiNb(n, "épisode", "") + " de dérive, " + (n > 1 ? "tous nouveaux" : "nouveau") + " pour la veille.", "First pass on this dataset: " + veiNb(n, "", "drift episode") + ", " + (n === 1 ? "new" : "all new") + " to the watch."),
    suite: Lg("Aucun relevé antérieur à comparer (données jusqu'au " + fin + "). Au prochain chargement de nouvelles données, la veille dira ce qui est apparu, ce qui s'est aggravé et ce qui s'est clos.",
      "No earlier record to compare with (data up to " + fin + "). The next time new data is loaded, the watch will say what appeared, what got worse and what closed.") };
  const p = [];
  if (C.nouveau.length) p.push(veiNb(C.nouveau.length, "nouvel épisode", "new episode", "nouveaux épisodes"));
  if (C.aggrave.length) p.push(Lg(veiNb(C.aggrave.length, "dérive", "") + " en cours qui " + (C.aggrave.length > 1 ? "s'aggravent ou se prolongent" : "s'aggrave ou se prolonge"), veiNb(C.aggrave.length, "", "ongoing drift") + " getting worse or longer"));
  if (C.clos.length) p.push(veiNb(C.clos.length, "épisode clos", "closed episode", "épisodes clos"));
  const le = dateFr(C.avant.le) || "–";
  return { alerte: C.nouveau.length + C.aggrave.length > 0, titre: p.length ? Lg("Depuis le relevé du " + le + " : " + p.join(", ") + ".", "Since the record of " + le + ": " + p.join(", ") + ".") : Lg("Rien de nouveau depuis le relevé du " + le + ".", "Nothing new since the record of " + le + "."),
    suite: Lg("Relevé précédent : données jusqu'au " + (dateFr(C.avant.fin) || "–") + ". Aujourd'hui : données jusqu'au " + fin + ".", "Previous record: data up to " + (dateFr(C.avant.fin) || "–") + ". Today: data up to " + fin + ".")
      + (C.disparus ? Lg(" " + veiNb(C.disparus, "épisode", "") + " du relevé précédent " + (C.disparus > 1 ? "ne sont plus détectés" : "n'est plus détecté") + " : les données ou le modèle ont changé.",
        " " + veiNb(C.disparus, "", "episode") + " from the previous record " + (C.disparus === 1 ? "is" : "are") + " no longer detected: the data or the model changed.") : "") };
}
function veiPhraseRegle(r) {
  const e = [];
  if (r.doublons) e.push(Lg("les épisodes d'UES qui recoupent un épisode du Site passent en dernier", "SEU episodes that overlap a Site episode go last"));
  if (r.nouveautes) e.push(Lg("les épisodes nouveaux ou aggravés depuis le relevé précédent d'abord", "episodes that are new or worse since the previous record first"));
  if (r.enCours) e.push(Lg("les dérives en cours avant les épisodes clos", "ongoing drifts before closed episodes"));
  if (r.sur) e.push(Lg("les surconsommations avant les économies", "overconsumption before savings"));
  e.push((r.critere === "z" ? Lg("le |z| maximal le plus fort", "the highest maximum |z|") : r.critere === "co2" ? Lg("les émissions estimées les plus fortes", "the highest estimated emissions") : Lg("le coût estimé le plus élevé", "the highest estimated cost"))
    + (r.critere !== "z" && r.projection ? Lg(", projection à 3 mois comprise pour une dérive en cours", ", including the 3-month projection for an ongoing drift") : ""));
  if (r.critere !== "z") e.push(Lg("à égalité, le |z| le plus fort", "on a tie, the highest |z|"));
  return Lg("Règle appliquée, dans l'ordre : ", "Rule applied, in order: ") + e.map((x, k) => (k + 1) + ". " + x).join(Lg(" ; ", "; ")) + ".";
}
/* Point de situation en texte brut, pour le presse-papiers. */
function veiTexte(lignes, file, C, D, tot) {
  const c = veiConstat(C, D), instruits = [...vei.resultats.keys()].map(k => lignes.find(l => l.cle === k)).filter(l => l && l.resultat.res);
  const out = [Lg("POINT DE SITUATION DE LA VEILLE DES DÉRIVES", "DRIFT WATCH STATUS REPORT"), Lg("Établi le " + dateFr(veiJour()) + ", données jusqu'au ", "Drawn up on " + dateFr(veiJour()) + ", data up to ") + (isFinite(D.finDonnees) ? fmtDate(D.finDonnees) : "–") + ".", "", c.titre, c.suite, ""];
  out.push(Lg("Surconsommations à traiter : ", "Overconsumption to handle: ") + (tot.cout == null ? fmtEnergie(tot.wh, true) : fmtEuros(tot.cout, true)) + (tot.co2 == null ? "" : ", " + fmtCO2(tot.co2, true))
    + Lg(" (" + veiNb(tot.n, "épisode", "") + ", au niveau Site, sans double compte).", " (" + veiNb(tot.n, "", "episode") + ", at Site level, no double counting)."));
  if (tot.cout3 != null) out.push(Lg("Si rien ne change : " + fmtEuros(tot.cout3, true) + " de plus en 3 mois pour les surconsommations en cours (projection simple, pas une prévision).",
    "If nothing changes: " + fmtEuros(tot.cout3, true) + " more over 3 months for ongoing overconsumption (simple projection, not a forecast)."));
  out.push("", Lg("ÉPISODES INSTRUITS : ", "EPISODES INVESTIGATED: ") + instruits.length);
  if (instruits.some(l => l.resultat.demo)) out.push(Lg(VEI_T.script[0], VEI_T.script[1]));
  instruits.forEach((l, k) => {
    const r = l.resultat, f = r.res.fiche, rec = veiRecoupe(l);
    out.push("", (k + 1) + ". " + l.ep.serie + ", " + veiLib(l.ep) + (l.ep.ouvert ? Lg(", en cours", ", ongoing") : "") + " : " + veiResume(l), "   " + Lg("Depuis le relevé : ", "Since last record: ") + veiNouveaute(l) + (rec ? " ; " + rec : ""));
    if (!f) out.push("   " + veiEtatTexte(r));
    else {
      out.push("   " + Lg("Cause la plus probable : ", "Most likely cause: ") + f.causes_probables[0].cause, "   " + Lg("Preuve chiffrée : ", "Evidence: ") + f.causes_probables[0].preuve_chiffree,
        "   " + Lg("Confiance : ", "Confidence: ") + Lg(f.niveau_confiance, M(f.niveau_confiance)) + ". " + f.justification_confiance, "   " + Lg("Relecture : ", "Review: ") + veiVerdict(r), "   " + Lg("Contrôles de la page : ", "Page checks: ") + veiControles(r),
        "   " + Lg("Action proposée : ", "Proposed action: ") + f.action_proposee, "   " + Lg("Vérifications sur site :", "On-site checks:"));
      for (const v of f.verifications_sur_site) out.push("     - " + v);
      out.push("   " + Lg("Brouillon rédigé par ", "Draft written by ") + Lg(r.redacteur, M(r.redacteur)) + ".");
    }
    out.push("   " + Lg("Statut : ", "Status: ") + veiNomStatut(l.statut) + (l.statut.s === "ecarte" ? Lg(" (motif : ", " (reason: ") + l.statut.motif + ")" : "") + (l.statut.plus ? Lg(", à revoir : l'épisode s'est allongé depuis", ", to review: the episode has grown since") : ""));
  });
  out.push("", Lg("FILE D'ATTENTE : " + veiNb(file.length, "épisode", "") + " à traiter. ", "QUEUE: " + veiNb(file.length, "", "episode") + " to handle. ") + veiPhraseRegle(vei.regle),
    Lg("Coûts et émissions : estimations, avec les hypothèses de la page Détection. Les causes sont des hypothèses, à confirmer sur site.", "Costs and emissions: estimates, with the assumptions of the Detection page. Causes are hypotheses, to be confirmed on site."));
  return out.map(t => LANGUE === "en" ? valeursEN(t) : t).join("\n");
}

/* ---- Page ---- */
function veiSaisieMotif() {
  const mo = vei.motif, valider = () => { if (veiFixerStatut(mo.cle, "ecarte", mo.texte)) { vei.motif = null; veiPeindre(); } };
  const ok = h("button", { class: "btn petit principal", disabled: !mo.texte.trim(), title: "Un motif est obligatoire pour écarter un épisode", onclick: valider }, "Écarter");
  return h("span", { class: "vei-saisie" }, h("input", { type: "text", class: "vei-motif", maxlength: "300", placeholder: "Motif (obligatoire)", "aria-label": "Motif de la mise à l'écart", value: mo.texte,
    oninput: e => { mo.texte = e.target.value; ok.disabled = !mo.texte.trim(); }, onkeydown: e => { if (e.key === "Enter") valider(); } }), ok,
    h("button", { class: "btn petit", onclick: () => { vei.motif = null; veiPeindre(); } }, "Annuler"));
}
const VEI_STATUTS = [{ v: "atraiter", t: "À traiter" }, { v: "valide", t: "Validé" }, { v: "ecarte", t: "Écarté" }];
function veiControleStatut(l, lieu) {
  if (vei.motif && vei.motif.cle === l.cle && vei.motif.lieu === lieu) return veiSaisieMotif();
  const courant = lieu === "file" && l.statut.plus ? "atraiter" : l.statut.s;      // dans la file, une décision à revoir se présente comme « à traiter »
  const c = (lieu === "file" ? liste : segments)(VEI_STATUTS, courant, v => veiChoisirStatut(l, v, lieu));
  c.setAttribute("aria-label", Lg("Statut : ", "Status: ") + l.ep.serie + ", " + l.ep.libDebut);
  return c;
}
const veiMarque = (texte, fort) => h("span", { class: "vei-marque" + (fort ? " fort" : "") }, texte);
function veiBlocEpisode(l, rang) {
  const ep = l.ep, r = l.resultat, f = r.res && r.res.fiche, ouverte = vei.ouverte === l.cle && !!r.res, rec = veiRecoupe(l);
  const basculer = () => { vei.ouverte = ouverte ? null : l.cle; veiPeindre(); };
  const tete = h("button", { type: "button", class: "vei-tete", "aria-expanded": String(ouverte), disabled: !r.res, title: r.res ? (ouverte ? "Refermer la fiche complète" : "Ouvrir la fiche complète") : "La fiche n'est pas encore rédigée", onclick: basculer },
    h("span", { class: "vei-titre" }, rang + ". " + ep.serie), h("span", { class: "vei-periode" }, veiLib(ep) + " ", ep.ouvert ? h("span", { class: "en-cours" }, "en cours") : null, " ", veiMarque(veiNouveaute(l), l.neuf)),
    h("span", { class: "vei-sous" }, veiResume(l) + (rec ? ". " + rec[0].toUpperCase() + rec.slice(1) + "." : ".")));
  const statut = h("div", { class: "vei-pied" }, h("span", { class: "vei-libelle" }, "Votre décision :"), veiControleStatut(l, "point"),
    h("span", { class: "vei-impr" }, veiNomStatut(l.statut)), l.statut.s === "ecarte" && !(vei.motif && vei.motif.cle === l.cle) ? h("span", { class: "note", style: "margin:0" }, Lg("Motif : ", "Reason: ") + l.statut.motif) : null,
    l.statut.plus ? veiMarque(Lg("à revoir : +" + veiNb(l.statut.plus, "période", "") + " depuis votre décision", "to review: +" + veiNb(l.statut.plus, "", "period") + " since your decision"), true) : null,
    r.res ? h("button", { class: "btn petit", onclick: basculer }, ouverte ? "Refermer la fiche complète" : "Ouvrir la fiche complète") : null,
    !f && ["echec", "arrete", "non-lance", "hors-format"].includes(r.etat) ? h("button", { class: "btn petit", disabled: agent.enCours, title: agent.enCours ? "Une instruction est déjà en cours" : null, onclick: () => veiLancerSerie([l.cle]) }, "Relancer cet épisode") : null);
  const corps = f ? h("dl", { class: "vei-dl" },
      h("dt", null, "Cause la plus probable"), h("dd", null, f.causes_probables[0].cause, h("span", { class: "vei-detail" }, Lg("Preuve chiffrée : ", "Evidence: ") + f.causes_probables[0].preuve_chiffree
        + (f.causes_probables.length > 1 ? Lg(". Autres hypothèses dans la fiche complète : ", ". Other hypotheses in the full note: ") + (f.causes_probables.length - 1) + "." : ""))),
      h("dt", null, "Confiance"), h("dd", null, Lg(f.niveau_confiance, M(f.niveau_confiance)) + ". " + f.justification_confiance),
      h("dt", null, "Relecture"), h("dd", null, veiVerdict(r), h("span", { class: "vei-detail" }, Lg("Contrôles de la page : ", "Page checks: ") + veiControles(r))),
      h("dt", null, "Action proposée"), h("dd", null, f.action_proposee),
      h("dt", null, "Vérifications sur site"), h("dd", null, h("ul", null, f.verifications_sur_site.map(v => h("li", null, v)))),
      h("dt", null, "Rédaction"), h("dd", null, Lg("Brouillon rédigé par " + r.redacteur + ", en " + veiNb(r.tours, "tour", "") + ". À relire et valider.", "Draft written by " + M(r.redacteur) + ", in " + veiNb(r.tours, "", "turn") + ". To be reviewed and validated.")))
    : h("p", { class: "vei-etat" + (r.etat === "echec" ? " erreur" : "") }, r.etat === "cours" ? h("span", { class: "voyant actif" }) : null, " " + veiEtatTexte(r));
  return h("div", { class: "vei-ep vei-" + r.etat }, tete, h("div", { class: "vei-corps" }, corps, statut, ouverte ? veiNoeudFiche(l) : null));
}
function veiCarteSerie(file, S, actif) {
  const aFiche = l => !!(l.resultat && l.resultat.etat === "fiche"), prochains = file.filter(l => !aFiche(l)).slice(0, vei.n), np = prochains.length;
  const manquants = S && !actif ? S.cles.filter(c => { const r = vei.resultats.get(c); return !r || r.etat !== "fiche"; }) : [], ailleurs = agent.enCours && !actif, pret = blocageEnvoi();
  const motif = ailleurs ? VEI_T.ailleurs[0] : pret ? VEI_T.pasPret[0]
    : !np ? (file.length ? "Tous les épisodes à traiter ont déjà leur fiche." : "Aucun épisode à traiter dans la file.") : null;
  if (ailleurs && !vei.guet) vei.guet = setInterval(() => { if (!agent.enCours) { clearInterval(vei.guet); vei.guet = null; veiPeindre(); } }, 500);     // le bouton se libère quand l'autre exécution finit
  const juge = agent.demo || agent.juge, appels = np * (IA.tours + (juge ? VEI_TOURS_JUGE : 0)), arretEnCours = actif && agent.arret && agent.arret.signal.aborted;
  const boutons = actif ? [h("button", { class: "btn", disabled: arretEnCours, onclick: () => { if (agent.arret) agent.arret.abort(); veiPeindre(); } }, arretEnCours ? "Arrêt en cours…" : "Arrêter la série")]
    : [manquants.length ? h("button", { class: "btn principal", disabled: ailleurs || !!pret, title: ailleurs || pret ? motif : null, onclick: () => veiLancerSerie(manquants) },
        Lg(manquants.length === 1 ? "Reprendre l'épisode sans fiche" : "Reprendre les " + manquants.length + " épisodes sans fiche", manquants.length === 1 ? "Resume the episode without a note" : "Resume the " + manquants.length + " episodes without a note")) : null,
      h("button", { class: "btn" + (manquants.length ? "" : " principal"), disabled: !!motif, title: motif, onclick: () => veiLancerSerie() },
        Lg(np <= 1 ? "Instruire le premier épisode de la file" : "Instruire les " + np + " premiers épisodes de la file", np <= 1 ? "Investigate the first episode in the queue" : "Investigate the first " + np + " episodes in the queue"))];
  const fiches = S ? S.cles.filter(c => (vei.resultats.get(c) || {}).etat === "fiche").length : 0;
  const bilan = !S || actif ? null : Lg((S.arrete ? "Série arrêtée" : S.interrompue ? "Série interrompue après " + VEI_ECHECS_DE_SUITE + " échecs de suite" : "Série terminée") + " : " + veiNb(fiches, "fiche", "") + " sur " + S.cles.length + "."
      + (manquants.length ? " Les fiches déjà rendues sont gardées ; vous pouvez reprendre les autres." : ""), (S.arrete ? "Run stopped" : S.interrompue ? "Run interrupted after " + VEI_ECHECS_DE_SUITE + " failures in a row" : "Run finished") + ": " + fiches + " of " + veiNb(S.cles.length, "", "note")
      + "." + (manquants.length ? " The notes already returned are kept; you can resume the others." : ""));
  const mode = agent.demo ? VEI_T.demo[0]
    : Lg("Rédacteur : " + F().nom + " (" + modeleIA() + "), par " + F().api + ". Relecture par un second agent : " + (agent.juge ? "oui" : "non") + ". Pour chaque épisode, la série envoie ce que liste l'avis de la page Instruction, rien de plus.",
      "Writer: " + F().nom + " (" + modeleIA() + "), through " + M(F().api) + ". Review by a second agent: " + (agent.juge ? "yes" : "no") + ". For each episode, the run sends what the notice on the Investigation page lists, nothing more.");
  const budget = Lg("Budget de la prochaine série : " + veiNb(np, "épisode", "") + ", " + IA.tours + " tours au plus par épisode" + (juge ? ", " + VEI_TOURS_JUGE + " pour la relecture" : "") + ", soit au plus " + appels + " appels "
    + (agent.demo ? "au script (aucun appel réseau)" : "au modèle, hors nouveaux essais quand le serveur est surchargé") + ". " + VEI_ECHECS_DE_SUITE + " échecs de suite arrêtent la série.",
    "Budget of the next run: " + veiNb(np, "", "episode") + ", at most " + IA.tours + " turns per episode" + (juge ? ", " + VEI_TOURS_JUGE + " for the review" : "") + ", i.e. at most " + appels + " calls "
    + (agent.demo ? "to the script (no network call)" : "to the model, not counting retries when the server is overloaded") + ". " + VEI_ECHECS_DE_SUITE + " failures in a row stop the run.");
  const suivi = S && (actif || (journal.firstChild && journal.firstChild === S.marque)) ? [zoneProgres, h("details", { class: "vei-journal", open: vei.journalOuvert, ontoggle: e => { vei.journalOuvert = !!e.target.open; } },
    h("summary", null, "Journal détaillé de la série"), journal, h("div", { class: "note", style: "margin-top:0" }, "Chaque ligne se déplie : elle montre l'appel exact et ce qui a été transmis au modèle."))] : null;
  const c = carte({ id: "vei-serie", titre: "Instruire en série",
    contenu: h("div", null,
      h("div", { class: "filtres" }, filtre("Épisodes par série (budget)", segments(VEI_BUDGETS.map(n => ({ v: n, t: String(n) })), vei.n, v => veiRegler("n", v))), boutons),
      !actif && motif ? h("div", { class: "note attention vei-motif-bloc" }, motif) : null, vei.erreur && vei.erreur !== motif ? h("div", { class: "erreur", style: "margin:0 0 10px" }, vei.erreur) : null,
      bilan ? h("p", { class: "vei-bilan" }, bilan) : null,
      vei.retirees ? h("div", { class: "note attention" }, VEI_T.retirees[0]) : null,
      suivi,
      h("ul", { class: "vei-gardes" },
        h("li", null, mode + " ", h("button", { class: "lien", onclick: () => aller("agent") }, "Changer de mode (page Instruction)")),
        np ? h("li", null, budget) : null,
        h("li", null, VEI_T.lecture[0]),
        h("li", null, VEI_T.arret[0]))) });
  c.classList.add("vei-ecran");
  return c;
}
function veiCartePoint(lignes, file, C, D, tot) {
  const parCle = new Map(lignes.map(l => [l.cle, l])), blocs = [...vei.resultats.keys()].map(c => parCle.get(c)).filter(Boolean), redigees = blocs.filter(l => l.resultat.res && l.resultat.res.fiche);
  const copier = h("button", { class: "btn", onclick: () => copierTexte(veiTexte(lignes, file, C, D, tot), copier).then(() => setTimeout(() => { copier.textContent = tr("Copier le point de situation"); }, 1650)) }, "Copier le point de situation");
  return carte({ id: "vei-point", titre: "Épisodes instruits", sous: VEI_T.sousPoint[0],
    contenu: h("div", null,
      redigees.some(l => l.resultat.demo) ? h("div", { class: "note attention", style: "margin:0 0 12px" }, VEI_T.script[0])
        : redigees.length ? h("div", { class: "note", style: "margin:0 0 12px" }, VEI_T.ia[0]) : null,
      blocs.length ? blocs.map((l, k) => veiBlocEpisode(l, k + 1)) : h("div", { class: "vide" }, VEI_T.aucun[0]),
      h("div", { class: "vei-pied vei-export" }, copier, h("button", { class: "btn", onclick: () => print() }, "Imprimer le point de situation"))),
    note: VEI_T.notePoint[0] });
}
function veiCarteFile(file, traites) {
  const R = vei.regle, coche = (cle, texte) => h("label", { class: "vei-coche" }, h("input", { type: "checkbox", checked: R[cle], onchange: e => veiRegler(cle, !!e.target.checked) }), h("span", null, texte));
  const prochains = new Set(file.filter(l => !(l.resultat && l.resultat.etat === "fiche")).slice(0, vei.n).map(l => l.cle));
  const nom = l => { const rec = veiRecoupe(l); return h("span", null, l.ep.serie, rec ? h("span", { class: "vei-detail" }, rec) : null); };
  const periode = l => h("span", null, veiLib(l.ep) + " ", l.ep.ouvert ? h("span", { class: "en-cours" }, "en cours") : null);
  const sens = l => h("span", null, h("span", { class: "fleche " + (l.ep.ecart > 0 ? "plus" : "moins") }, l.ep.ecart > 0 ? "▲" : "▼"), l.ep.sens);
  const lignes = file.map((l, k) => { const e = l.enjeu, r = l.resultat;
    return [h("span", { class: "vei-rang" + (prochains.has(l.cle) ? " prochain" : ""), title: prochains.has(l.cle) ? "Sera instruit par la prochaine série" : null }, String(k + 1)), nom(l), periode(l),
      [veiMarque(veiNouveaute(l), l.neuf), l.statut.plus ? veiMarque(Lg("décision à revoir", "decision to review"), true) : null], sens(l), fmtEuros(e.cout, true), fmtCO2(e.co2, true),
      e.wh3 == null ? "–" : e.cout3 == null ? fmtEnergie(e.wh3, true) : fmtEuros(e.cout3, true), nf(l.ep.zmax, 1),
      !r ? "–" : r.etat === "fiche" ? h("button", { class: "lien", onclick: () => { vei.ouverte = l.cle; veiPeindre(); } }, "fiche prête") : r.etat === "cours" ? Lg("en cours…", "running…") : r.etat === "attente" ? Lg("en attente", "waiting") : Lg("sans fiche", "no note"),
      veiControleStatut(l, "file")]; });
  const c = carte({ id: "vei-file", titre: "File d'attente", sous: Lg(veiNb(file.length, "épisode", "") + " à traiter, classés par enjeu", veiNb(file.length, "", "episode") + " to handle, ranked by stake"),
    contenu: h("div", null,
      h("div", { class: "filtres", style: "margin-bottom:10px" }, filtre("Classer par", segments([{ v: "cout", t: "Coût estimé" }, { v: "co2", t: "CO₂e" }, { v: "z", t: "Ampleur (|z| max)" }], R.critere, v => veiRegler("critere", v)))),
      h("div", { class: "vei-coches" }, coche("doublons", "Site et UES : une seule fois la même dérive"), coche("nouveautes", "Nouveautés d'abord"), coche("enCours", "Dérives en cours d'abord"), coche("sur", "Surconsommations d'abord"),
        R.critere === "z" ? null : coche("projection", "Compter la projection à 3 mois")),
      h("p", { class: "vei-regle" }, veiPhraseRegle(R)),
      file.length ? tableau(["Rang", "Série", "Épisode", "Depuis le relevé", "Sens", "Coût estimé", "CO₂e", "Coût sur 3 mois", "|z| max", "Fiche", "Statut"], lignes) : h("div", { class: "vide" }, VEI_T.fileVide[0]),
      traites.length ? h("details", { class: "vei-traites" }, h("summary", null, Lg("Épisodes déjà traités : " + traites.length, "Episodes already handled: " + traites.length)),
        tableau(["Série", "Épisode", "Statut", "Motif", "Décidé le", "Action"], traites.map(l => [nom(l), periode(l), veiNomStatut(l.statut), l.statut.motif || "–", dateFr(l.statut.le) || "–",
          h("button", { class: "btn petit", onclick: () => veiChoisirStatut(l, "atraiter", "file") }, "Remettre à traiter")]))) : null),
    note: VEI_T.noteFile[0] });
  c.classList.add("vei-ecran");
  return c;
}
function veiCarteMemoire(C) {
  const J = vei.memo, nbStatuts = Object.keys(J.statuts).length, vide = !C.avant && !nbStatuts;
  const etatMemoire = etat.figee ? VEI_T.figee[0]
    : Lg("Relevé précédent : " + (C.avant ? "le " + (dateFr(C.avant.le) || "–") + ", données jusqu'au " + (dateFr(C.avant.fin) || "–") : "aucun") + ". Relevé de ce chargement : " + veiNb(Object.keys(J.courant.eps).length, "épisode", "") + ". Statuts gardés : " + nbStatuts + ".",
      "Previous record: " + (C.avant ? (dateFr(C.avant.le) || "–") + ", data up to " + (dateFr(C.avant.fin) || "–") : "none") + ". Record of this load: " + veiNb(Object.keys(J.courant.eps).length, "", "episode") + ". Statuses kept: " + nbStatuts + ".");
  const c = carte({ id: "vei-memoire", titre: "Mémoire de la veille", sous: "ce que ce navigateur garde d'un chargement à l'autre, sur ce poste",
    contenu: h("div", null, h("p", { class: "vei-bilan" }, etatMemoire),
      h("div", { class: "vei-pied" }, h("button", { class: "btn", disabled: !!etat.figee || vide, title: etat.figee ? "Une copie figée ne garde aucune mémoire" : vide ? "La mémoire ne contient que le relevé de ce chargement" : null, onclick: veiOublier }, "Oublier la mémoire de la veille"))),
    note: VEI_T.noteMemoire[0] });
  c.classList.add("vei-ecran");
  return c;
}
function veiPeindre() {
  const m = etat.modele;
  if (etat.onglet !== "veille" || !m) return;
  if (vei.modele !== m) veiAuChargement(m);
  if (vei.langue !== LANGUE) {                                            // comme la page Instruction : une fiche rédigée dans l'autre langue ne se relit pas avec les règles de celle-ci
    vei.retirees = [...vei.resultats.values()].filter(r => r.res).length; vei.resultats = new Map(); vei.serie = null; vei.ouverte = null; vei.langue = LANGUE;
  }
  const D = derives(), C = vei.comparaison, S = vei.serie, actif = !!(S && S.active), lignes = veiLignes();
  const file = veiTrier(lignes.filter(l => l.aTraiter), vei.regle), traites = lignes.filter(l => !l.aTraiter);
  const tot = veiTotal(file, new Set(D.analyses.filter(A => A.serie.groupe === "site").map(A => A.serie.energie))), c = veiConstat(C, D);
  const enCoursParmi = eps => eps.filter(ep => ep.ouvert).length, sans = "pas de relevé antérieur";
  veiNoeud.replaceChildren(
    h("div", { class: "constat" + (c.alerte ? " alerte" : "") }, h("p", { class: "titre" }, c.titre), h("p", { class: "suite" }, c.suite)),
    h("div", { class: "tuiles" },
      tuile("Nouveaux épisodes", String(C.nouveau.length), Lg("dont " + enCoursParmi(C.nouveau) + " en cours", enCoursParmi(C.nouveau) + " of them ongoing")),
      tuile("En cours, aggravés ou prolongés", C.premier ? "–" : String(C.aggrave.length), C.premier ? sans : "plus de périodes, ou un |z| plus fort, qu'au relevé précédent"),
      tuile("Clos depuis le relevé", C.premier ? "–" : String(C.clos.length), C.premier ? sans : "ils étaient en cours au relevé précédent"),
      tuile("Surconsommations à traiter", tot.cout == null ? fmtEnergie(tot.wh, true) : fmtEuros(tot.cout, true), (tot.co2 == null ? "" : fmtCO2(tot.co2, true) + " · ") + Lg(veiNb(tot.n, "épisode", "") + ", au niveau Site, sans double compte", veiNb(tot.n, "", "episode") + ", at Site level, no double counting")),
      tuile("Si rien ne change, en 3 mois", tot.cout3 == null ? "–" : fmtEuros(tot.cout3, true), tot.enCours ? "projection simple des surconsommations en cours, pas une prévision" : "aucune surconsommation en cours à ce niveau")),
    h("div", { class: "grille" }, veiCarteSerie(file, S, actif), veiCartePoint(lignes, file, C, D, tot), veiCarteFile(file, traites), veiCarteMemoire(C)));
}
function veiPage() {
  const m = etat.modele;
  derives();
  if (agent.modele !== m) reinitialiserAgent(m);                         // comme la page Instruction : l'état de l'agent suit le classeur chargé
  veiPeindre();
  return [h("p", { class: "chapeau" }, VEI_T.chapeau[0]), veiNoeud];
}

AU_CHARGEMENT.push(veiAuChargement);
ICONES.veille = "M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8zM8 9.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z";
ajouterPage("Agents", "veille", "Veille", "Veille des dérives", ICONES.veille, veiPage);
/* Textes longs, écrits une seule fois : [français, anglais]. Le code les appelle par leur nom. */
const VEI_T = {
  chapeau: ["À chaque chargement, la veille compare les épisodes de dérive à ceux du chargement précédent, les classe par enjeu, instruit les premiers à la suite et rend un point de situation. Elle lit et rédige : aucune action n'est prise à votre place.",
    "Each time a workbook is loaded, the watch compares the drift episodes with those of the previous load, ranks them by stake, investigates the first ones in a row and returns a status report. It reads and writes: no action is taken on your behalf."],
  oubli: ["Oublier la mémoire de la veille ? Les relevés des chargements précédents, tous les statuts et vos réglages de tri seront effacés de ce navigateur.", "Forget the watch memory? The records of previous loads, all statuses and your ranking settings will be erased from this browser."],
  ailleurs: ["Une instruction ou une évaluation est déjà en cours : attendez sa fin, ou arrêtez-la sur la page Instruction.", "An investigation or an evaluation is already running: wait for it to finish, or stop it on the Investigation page."],
  pasPret: ["L'envoi à l'IA n'est pas prêt (accord ou clé manquants) : réglez-le sur la page Instruction, ou passez en mode démonstration.", "Sending to the AI is not ready (consent or key missing): set it up on the Investigation page, or switch to demo mode."],
  demo: ["Mode démonstration : un script joue le rôle du modèle, sans IA ni réseau. Les fiches et les relectures de cette page viennent de ce script.",
    "Demo mode: a script plays the model's part, with no AI and no network. The notes and reviews on this page come from that script."],
  lecture: ["L'agent lit le classeur avec cinq outils de lecture seule et rédige des brouillons. Il ne modifie aucune donnée, n'envoie aucun message et n'ouvre aucune action : vous fixez le statut de chaque épisode.",
    "The agent reads the workbook with five read-only tools and writes drafts. It changes no data, sends no message and opens no action: you set the status of each episode."],
  arret: ["Vous pouvez arrêter la série à tout moment. Une erreur sur un épisode n'efface pas les fiches des autres.", "You can stop the run at any time. An error on one episode does not erase the notes of the others."],
  retirees: ["Les fiches rédigées dans l'autre langue ont été retirées, comme sur la page Instruction : relancez la série.", "The notes written in the other language were removed, as on the Investigation page: start the run again."],
  sousPoint: ["l'essentiel de chaque fiche, à lire en une minute ; chaque ligne ouvre la fiche complète", "the essentials of each note, readable in a minute; each line opens the full note"],
  script: ["Fiches et relectures produites par un script de démonstration, sans IA : elles montrent la chaîne et le format, pas une analyse.", "Notes and reviews produced by a demo script, no AI: they show the pipeline and the format, not an analysis."],
  ia: ["Brouillons rédigés par une IA à partir des résultats d'outils. La page a calculé tous les chiffres ; les causes restent des hypothèses, à confirmer sur site.", "Drafts written by an AI from the tool results. The page computed every figure; the causes remain hypotheses, to be confirmed on site."],
  aucun: ["Aucun épisode instruit pour l'instant. Lancez la série ci-dessus : la synthèse de chaque fiche s'affichera ici.", "No episode investigated yet. Start the run above: the summary of each note will appear here."],
  notePoint: ["Les fiches ne sont pas conservées d'un chargement à l'autre : seuls vos statuts et vos motifs le sont. Le texte copié et l'impression reprennent le constat, l'enjeu, chaque épisode instruit et son statut.",
    "Notes are not kept from one load to the next: only your statuses and reasons are. The copied text and the printout carry the finding, the stake, each investigated episode and its status."],
  fileVide: ["Aucun épisode à traiter : tous ont un statut, ou aucune dérive n'est détectée.", "No episode to handle: all have a status, or no drift is detected."],
  noteFile: ["Le numéro sur fond sombre marque les épisodes que la prochaine série instruira. Un épisode validé ou écarté quitte la file ; il y revient, marqué « décision à revoir », s'il s'allonge après votre décision. "
    + "Coûts et émissions : estimations, avec les hypothèses de la page Détection. La projection à 3 mois suppose que l'écart moyen se maintient : ce n'est pas une prévision. "
    + "« Même dérive que le Site » : même énergie, même sens, dates qui se recoupent ; c'est un indice, pas une preuve. L'historique est court : un |z| élevé sur une seule période peut venir d'un relevé isolé.",
    "The number on a dark background marks the episodes the next run will investigate. A validated or dismissed episode leaves the queue; it comes back, marked “decision to review”, if it grows after your decision. "
    + "Costs and emissions: estimates, with the assumptions of the Detection page. The 3-month projection assumes the average gap holds: it is not a forecast. "
    + "“Same drift as the Site”: same energy, same direction, overlapping dates; it is a clue, not a proof. The history is short: a high |z| on a single period may come from one isolated reading."],
  figee: ["Copie figée : la veille ne lit et n'écrit aucune mémoire. Chaque ouverture est un premier passage et vos statuts ne durent que le temps de la session.", "Frozen copy: the watch reads and writes no memory. Each opening is a first pass and your statuses last only for the session."],
  noteMemoire: ["Sont gardés, pour chaque épisode : une empreinte (un code, sans le nom de la série), son nombre de périodes, son |z| maximal, sa date de fin et s'il était en cours ; vos statuts, vos motifs et vos réglages de tri. "
    + "Ne sont pas gardés : les consommations, les écarts, les coûts, les noms de séries, les fiches. Recharger le même classeur garde la même comparaison. "
    + "Un épisode est reconnu à sa série, son sens et sa première période ; si les données passées ou le modèle changent, il peut réapparaître comme nouveau.",
    "Kept, for each episode: a fingerprint (a code, without the series name), its number of periods, its maximum |z|, its end date and whether it was ongoing; your statuses, your reasons and your ranking settings. "
    + "Not kept: consumption, gaps, costs, series names, notes. Reloading the same workbook keeps the same comparison. "
    + "An episode is recognised by its series, its direction and its first period; if past data or the model change, it may come back as new."]
};
const VEI_TRADUCTIONS = Object.values(VEI_T).concat([
  ["Veille", "Watch"], ["Veille des dérives", "Drift watch"],
  ["Nouveaux épisodes", "New episodes"], ["En cours, aggravés ou prolongés", "Ongoing, worse or longer"], ["Clos depuis le relevé", "Closed since last record"], ["Surconsommations à traiter", "Overconsumption to handle"], ["Si rien ne change, en 3 mois", "If nothing changes, over 3 months"],
  ["pas de relevé antérieur", "no earlier record"], ["plus de périodes, ou un |z| plus fort, qu'au relevé précédent", "more periods, or a higher |z|, than at the previous record"], ["ils étaient en cours au relevé précédent", "they were ongoing at the previous record"],
  ["projection simple des surconsommations en cours, pas une prévision", "simple projection of ongoing overconsumption, not a forecast"], ["aucune surconsommation en cours à ce niveau", "no ongoing overconsumption at this level"],
  ["Instruire en série", "Investigate in a row"], ["Épisodes par série (budget)", "Episodes per run (budget)"], ["Arrêter la série", "Stop the run"], ["Arrêt en cours…", "Stopping…"],
  ["Tous les épisodes à traiter ont déjà leur fiche.", "Every episode to handle already has its note."], ["Aucun épisode à traiter dans la file.", "No episode to handle in the queue."],
  ["Changer de mode (page Instruction)", "Change mode (Investigation page)"], ["Journal détaillé de la série", "Detailed log of the run"], ["Épisodes instruits", "Episodes investigated"],
  ["Copier le point de situation", "Copy the status report"], ["Imprimer le point de situation", "Print the status report"],
  ["Cause la plus probable", "Most likely cause"], ["Confiance", "Confidence"], ["Relecture", "Review"], ["Vérifications sur site", "On-site checks"], ["Rédaction", "Drafting"], ["Votre décision :", "Your decision:"],
  ["Ouvrir la fiche complète", "Open the full note"], ["Refermer la fiche complète", "Close the full note"], ["La fiche n'est pas encore rédigée", "The note is not written yet"], ["Relancer cet épisode", "Retry this episode"], ["Une instruction est déjà en cours", "An investigation is already running"],
  ["À traiter", "To handle"], ["Validé", "Validated"], ["Écarté", "Dismissed"], ["Écarter", "Dismiss"], ["Annuler", "Cancel"], ["Motif (obligatoire)", "Reason (required)"], ["Motif de la mise à l'écart", "Reason for dismissing"],
  ["Un motif est obligatoire pour écarter un épisode", "A reason is required to dismiss an episode"],
  ["File d'attente", "Queue"], ["Classer par", "Rank by"], ["Ampleur (|z| max)", "Magnitude (max |z|)"], ["Site et UES : une seule fois la même dérive", "Site and SEU: the same drift only once"], ["Nouveautés d'abord", "What is new first"],
  ["Dérives en cours d'abord", "Ongoing drifts first"], ["Surconsommations d'abord", "Overconsumption first"], ["Compter la projection à 3 mois", "Count the 3-month projection"],
  ["Rang", "Rank"], ["Depuis le relevé", "Since last record"], ["Statut", "Status"], ["Motif", "Reason"], ["Décidé le", "Decided on"], ["fiche prête", "note ready"], ["Remettre à traiter", "Put back to handle"],
  ["Sera instruit par la prochaine série", "Will be investigated by the next run"],
  ["Mémoire de la veille", "Watch memory"], ["ce que ce navigateur garde d'un chargement à l'autre, sur ce poste", "what this browser keeps from one load to the next, on this computer"],
  ["Oublier la mémoire de la veille", "Forget the watch memory"], ["Une copie figée ne garde aucune mémoire", "A frozen copy keeps no memory"], ["La mémoire ne contient que le relevé de ce chargement", "The memory holds only the record of this load"]
]);
ajouterTraductions(VEI_TRADUCTIONS.filter(([fr]) => !EN.has(fr)));       // sans remplacer une traduction d'origine ou d'un autre module
