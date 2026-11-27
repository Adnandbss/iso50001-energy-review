/* ============================================================================
   Module « Veille » (préfixe vei) : à chaque chargement d'un classeur, compare les
   épisodes de derives() à ceux du chargement précédent, les classe par enjeu, instruit
   les N premiers à la suite (boucleAgent et jugerFiche d'origine) et garde les statuts que
   la personne pose. L'agent lit et rédige : il ne décide de rien. L'affichage est celui de
   la page Dérives (module idee-13-derives) : veiPeindre la redessine.
   ============================================================================ */
const VEI_CLE = "revue-energetique.vei.memoire", VEI_CLE_REGLAGES = "revue-energetique.vei.reglages";
const VEI_REGLE = { critere: "cout", projection: true, doublons: true, nouveautes: true, enCours: true, sur: true };
const VEI_BUDGETS = [1, 3, 5, 10], VEI_TOURS_JUGE = 3, VEI_ECHECS_DE_SUITE = 2, VEI_JEUX_MAX = 6;     // jugerFiche fait au plus 3 tours
const vei = { modele: null, jeu: null, memo: null, comparaison: null, regle: Object.assign({}, VEI_REGLE), n: 3, serie: null, resultats: new Map(),
  ouverte: null, motif: null, erreur: null, langue: null, retirees: 0, composition: false };
const veiNoeud = h("div", { class: "vei" });                             // gardé vide : le module IA retouche ce noeud après chaque veiPeindre
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
  const champ = app.querySelector(".vei-motif");
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
   Même discipline que lancerEvaluation : un seul verrou (agent.enCours), un seul arrêt (agent.arret), le journal et la progression de l'instruction.
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
    veiPeindre();
  }
}
/* La fiche complète est celle de l'instruction : montrerFiche la compose dans zoneFiche, d'où on la retire sans rien y laisser ni y perdre. */
function veiNoeudFiche(l) {
  const r = l.resultat, garde = [...zoneFiche.childNodes];
  vei.composition = true;                                                 // la page Dérives ne prend pas cette composition pour une nouvelle fiche
  try { montrerFiche(l.ep, r.res, r.redacteur, r.jugement); } finally { vei.composition = false; }
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
    Lg("Coûts et émissions : estimations, avec les hypothèses de prix de la page Dérives. Les causes sont des hypothèses, à confirmer sur site.", "Costs and emissions: estimates, with the price assumptions of the Drifts page. Causes are hypotheses, to be confirmed on site."));
  return out.map(t => LANGUE === "en" ? valeursEN(t) : t).join("\n");
}

/* ---- Affichage : la page Dérives (module idee-13-derives) montre la veille ; veiPeindre la redessine ---- */
function veiSaisieMotif() {
  const mo = vei.motif, valider = () => { if (veiFixerStatut(mo.cle, "ecarte", mo.texte)) { vei.motif = null; veiPeindre(); } };
  const ok = h("button", { class: "btn petit principal", disabled: !mo.texte.trim(), title: "Un motif est obligatoire pour écarter un épisode", onclick: valider }, "Écarter");
  return h("span", { class: "vei-saisie" }, h("input", { type: "text", class: "vei-motif", maxlength: "300", placeholder: "Motif (obligatoire)", "aria-label": "Motif de la mise à l'écart", value: mo.texte,
    oninput: e => { mo.texte = e.target.value; ok.disabled = !mo.texte.trim(); }, onkeydown: e => { if (e.key === "Enter") valider(); } }), ok,
    h("button", { class: "btn petit", onclick: () => { vei.motif = null; veiPeindre(); } }, "Annuler"));
}
const veiMarque = (texte, fort) => h("span", { class: "vei-marque" + (fort ? " fort" : "") }, texte);
/* Comme la page Instruction : une fiche rédigée dans l'autre langue ne se relit pas avec les règles de celle-ci. */
function veiSuivreLangue() {
  if (vei.langue === LANGUE) return;
  vei.retirees = [...vei.resultats.values()].filter(r => r.res).length; vei.resultats = new Map(); vei.serie = null; vei.langue = LANGUE;
}
function veiPeindre() { if (typeof drvPeindre === "function") drvPeindre(); }

AU_CHARGEMENT.push(veiAuChargement);
/* Textes longs, écrits une seule fois : [français, anglais]. Le code les appelle par leur nom. */
const VEI_T = {
  oubli: ["Oublier la mémoire de la veille ? Les relevés des chargements précédents, tous les statuts et vos réglages de tri seront effacés de ce navigateur.", "Forget the watch memory? The records of previous loads, all statuses and your ranking settings will be erased from this browser."],
  ailleurs: ["Une instruction ou une évaluation est déjà en cours : attendez sa fin, ou arrêtez-la.", "An investigation or an evaluation is already running: wait for it to finish, or stop it."],
  pasPret: ["L'envoi à l'IA n'est pas prêt (accord ou clé manquants) : réglez-le dans les réglages d'IA (bouton « IA », en bas du menu), ou passez en mode démonstration.", "Sending to the AI is not ready (consent or key missing): set it up in the AI settings (“AI” button, at the bottom of the menu), or switch to demo mode."],
  demo: ["Mode démonstration : un script joue le rôle du modèle, sans IA ni réseau. Les fiches et les relectures de cette page viennent de ce script.",
    "Demo mode: a script plays the model's part, with no AI and no network. The notes and reviews on this page come from that script."],
  lecture: ["L'agent lit le classeur avec cinq outils de lecture seule et rédige des brouillons. Il ne modifie aucune donnée, n'envoie aucun message et n'ouvre aucune action : vous fixez le statut de chaque dérive.",
    "The agent reads the workbook with five read-only tools and writes drafts. It changes no data, sends no message and opens no action: you set the status of each drift."],
  arret: ["Vous pouvez arrêter la série à tout moment. Une erreur sur une dérive n'efface pas les fiches des autres ; deux échecs de suite arrêtent la série.", "You can stop the run at any time. An error on one drift does not erase the notes of the others; two failures in a row stop the run."],
  retirees: ["Les fiches rédigées dans l'autre langue ont été retirées : relancez l'instruction.", "The notes written in the other language were removed: run the investigation again."],
  script: ["Fiches et relectures produites par un script de démonstration, sans IA : elles montrent la chaîne et le format, pas une analyse.", "Notes and reviews produced by a demo script, no AI: they show the pipeline and the format, not an analysis."],
  ia: ["Brouillons rédigés par une IA à partir des résultats d'outils. La page a calculé tous les chiffres ; les causes restent des hypothèses, à confirmer sur site.", "Drafts written by an AI from the tool results. The page computed every figure; the causes remain hypotheses, to be confirmed on site."],
  notePoint: ["Les fiches ne sont pas conservées d'un chargement à l'autre : seuls vos statuts et vos motifs le sont. Le texte copié et l'impression reprennent le constat, l'enjeu, chaque dérive instruite et son statut.",
    "Notes are not kept from one load to the next: only your statuses and reasons are. The copied text and the printout carry the finding, the stake, each investigated drift and its status."],
  noteFile: ["Une dérive validée ou écartée passe en fin de liste ; elle revient parmi les dérives à traiter, marquée « à revoir », si elle s'allonge après votre décision. "
    + "Coûts et émissions : estimations, avec les hypothèses de prix de cette page. La projection à 3 mois suppose que l'écart moyen se maintient : ce n'est pas une prévision. "
    + "« Même dérive que le Site » : même énergie, même sens, dates qui se recoupent ; c'est un indice, pas une preuve. L'historique est court : un |z| élevé sur une seule période peut venir d'un relevé isolé.",
    "A validated or dismissed drift moves to the end of the list; it comes back among the drifts to handle, marked “to review”, if it grows after your decision. "
    + "Costs and emissions: estimates, with the price assumptions of this page. The 3-month projection assumes the average gap holds: it is not a forecast. "
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
  ["Tous les épisodes à traiter ont déjà leur fiche.", "Every episode to handle already has its note."],
  ["Écarter", "Dismiss"], ["Annuler", "Cancel"], ["Motif (obligatoire)", "Reason (required)"], ["Motif de la mise à l'écart", "Reason for dismissing"],
  ["Un motif est obligatoire pour écarter un épisode", "A reason is required to dismiss an episode"]
]);
ajouterTraductions(VEI_TRADUCTIONS.filter(([fr]) => !EN.has(fr)));       // sans remplacer une traduction d'origine ou d'un autre module
