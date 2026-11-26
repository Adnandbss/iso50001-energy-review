/* Tests du module « Évaluation » (préfixe evl). À lancer avec le banc :
     node outillage/banc.js idee-3-evaluation/essai.js idee-3-evaluation/test.js
   Le « second chemin » ci-dessous recalcule chaque réponse attendue à partir des tableaux bruts du modèle
   (dates, conso, ref, err, facteurs), sans seaux(), agreger(), analyserSerie(), derives() ni aucune fonction d'outil. */
verifier.bavard = false;
const M_ = etat.modele, JOUR_ = 864e5, jour = iso => Date.parse(iso + "T00:00:00Z");
const proche = (a, b, tol = 0.011) => typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tol;
const arr = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/* ---- second chemin ---- */
function semaineIso(t) {                                   // année ISO × 100 + numéro de semaine ISO (semaine du jeudi)
  const jeudi = t + (3 - (new Date(t).getUTCDay() + 6) % 7) * JOUR_, an = new Date(jeudi).getUTCFullYear();
  return an * 100 + Math.floor((jeudi - Date.UTC(an, 0, 1)) / (7 * JOUR_)) + 1;
}
function periodes(nom) {                                   // périodes d'une série à son propre pas : { debut, fin, reel, ref }
  const sr = M_.series.find(x => x.nom === nom), parCle = new Map();
  M_.dates.forEach((t, i) => {
    if (t < M_.debut || t > M_.fin) return;
    const d = new Date(t), cle = sr.pas === "month" ? d.getUTCFullYear() * 12 + d.getUTCMonth() : sr.pas === "week" ? semaineIso(t) : sr.pas === "year" ? d.getUTCFullYear() : t;
    if (!parCle.has(cle)) parCle.set(cle, { debut: t, fin: t, reel: null, ref: null });
    const p = parCle.get(cle);
    p.debut = Math.min(p.debut, t); p.fin = Math.max(p.fin, t);
    if (sr.conso[i] != null) p.reel = (p.reel || 0) + sr.conso[i];
    if (sr.ref[i] != null) p.ref = (p.ref || 0) + sr.ref[i];
  });
  return [...parCle.values()].sort((a, b) => a.debut - b.debut);
}
const comparee = p => p.reel != null && p.ref != null && p.ref > 0;
function totaux(nom, de, a) {                              // totaux des périodes comparées qui chevauchent [de, a], en Wh
  let reel = 0, ref = 0, n = 0;
  for (const p of periodes(nom)) if (comparee(p) && p.fin >= de && p.debut <= a) { reel += p.reel; ref += p.ref; n++; }
  return { reel, ref, n, ecart: reel - ref };
}
function episodesDirects(nom) {                            // règle de détection réécrite ici, à partir des périodes ci-dessus
  const sr = M_.series.find(x => x.nom === nom), err = sr.err[{ day: 0, week: 1, month: 2, year: 3 }[sr.pas]], P = periodes(nom);
  if (!(err > 0)) return [];
  const refs = P.filter(p => p.ref > 0 && p.reel != null).map(p => p.ref).sort((a, b) => a - b), plancher = refs.length ? 0.05 * refs[Math.floor(refs.length / 2)] : 0;
  const pts = P.map(p => {
    if (!comparee(p)) return { p, cote: 0 };
    const ecart = p.reel - p.ref;
    if (p.ref < plancher) return { p, cote: 0, faible: Math.sign(ecart), ecart };
    const z = ecart / p.ref / err;
    return { p, z, ecart, cote: Math.abs(z) >= 1 ? Math.sign(z) : 0 };
  });
  const out = [];
  let i = 0, libre = 0;
  while (i < pts.length) {
    const s = pts[i].cote;
    if (!s) { i++; continue; }
    let d = i, j = i;
    while (d - 1 >= libre && pts[d - 1].faible === s) d--;
    while (j + 1 < pts.length && (pts[j + 1].cote === s || pts[j + 1].faible === s)) j++;
    const bloc = pts.slice(d, j + 1), zmax = Math.max(0, ...bloc.filter(x => x.z != null).map(x => Math.abs(x.z)));
    if (bloc.length >= 3 || zmax >= 3) out.push({ debut: bloc[0].p.debut, fin: bloc[bloc.length - 1].p.fin, ecart: bloc.reduce((t, x) => t + x.ecart, 0) });
    i = j + 1; libre = i;
  }
  return out;
}
const plusGros = nom => episodesDirects(nom).slice().sort((x, y) => Math.abs(y.ecart) - Math.abs(x.ecart))[0];
function uesDirectes(energie, de, a) {                     // écarts du site et des UES d'une énergie, UES classées par écart absolu
  const de_ = sr => totaux(sr.nom, de, a), garde = g => M_.series.filter(sr => sr.energie === energie && sr.groupe === g && sr.err[{ day: 0, week: 1, month: 2, year: 3 }[sr.pas]] > 0);
  const site = garde("site").map(de_).reduce((t, x) => t + x.ecart, 0);
  const ues = M_.series.filter(sr => sr.energie === energie && sr.groupe === "ues").map(sr => ({ nom: sr.nom, t: de_(sr) })).filter(x => x.t.n > 0).sort((x, y) => Math.abs(y.t.ecart) - Math.abs(x.t.ecart));
  return { site, ues, nonExplique: site - ues.reduce((t, x) => t + x.t.ecart, 0) };
}
function facteurDirect(nom, de, a) {
  const f = M_.facteurs.find(x => x.nom === nom), dedans = [], memes = [], reste = [], mois = new Set();
  M_.dates.forEach(t => { if (t >= de && t <= a) mois.add(new Date(t).getUTCMonth()); });
  f.valeurs.forEach((v, i) => { const t = M_.dates[i]; if (v == null || t < M_.debut || t > M_.fin) return;  // lignes sans consommation : facteurs non mesurés (correctif du coeur)
    if (t >= de && t <= a) dedans.push(v); else { reste.push(v); if (mois.has(new Date(t).getUTCMonth())) memes.push(v); } });
  const q = (t, p) => { t = t.slice().sort((x, y) => x - y); const r = (t.length - 1) * p, b = Math.floor(r); return t[b] + (t[Math.min(b + 1, t.length - 1)] - t[b]) * (r - b); };
  const moyenne = dedans.reduce((x, y) => x + y, 0) / dedans.length, base = memes.length >= 5 ? memes : reste.length >= 5 ? reste : null;
  return { moyenne, position: !base ? null : arr(moyenne, 3) > arr(q(base, 0.9), 3) ? "dessus" : arr(moyenne, 3) < arr(q(base, 0.1), 3) ? "dessous" : "dans" };
}
/* Réponse attendue d'une question, par le second chemin. Rend { valeur } ou { nom } ou { position } ou { abstention: true }. */
function secondChemin(q) {
  const p = q.p, de = p.de && jour(p.de), a = p.a && jour(p.a);
  switch (q.famille + "." + q.cle) {
    case "lecture.ecart_kwh": return { valeur: totaux(p.nom, de, a).ecart / 1000 };
    case "lecture.ecart_pct": { const t = totaux(p.nom, de, a); return { valeur: 100 * t.ecart / t.ref }; }
    case "lecture.reel_kwh": return { valeur: totaux(p.nom, de, a).reel / 1000 };
    case "comparaison.premiere_ues": return { nom: uesDirectes(p.energie, de, a).ues[0].nom };
    case "comparaison.part_d_une_ues": { const c = uesDirectes(p.energie, de, a); return { valeur: 100 * c.ues.find(x => x.nom === p.ues).t.ecart / c.site }; }
    case "comparaison.non_explique": return { valeur: uesDirectes(p.energie, de, a).nonExplique / 1000 };
    case "episodes.nombre": return { valeur: episodesDirects(p.nom).length, tol: 0 };
    case "episodes.plus_gros": return { valeur: plusGros(p.nom).ecart / 1000 };
    case "episodes.plus_d_episodes": return { nom: M_.series.map(sr => ({ nom: sr.nom, n: episodesDirects(sr.nom).length })).sort((x, y) => y.n - x.n)[0].nom };
    case "facteurs.moyenne": return { valeur: facteurDirect(p.facteur, de, a).moyenne, tol: 0.0011 };
    case "facteurs.position": return { position: facteurDirect(p.facteur, de, a).position };
    case "etapes.ues_de_l_episode": { const ep = plusGros(p.nom), sr = M_.series.find(x => x.nom === p.nom); return { nom: uesDirectes(sr.energie, ep.debut, ep.fin).ues[0].nom }; }
    case "etapes.site_de_l_episode": { const ep = plusGros(p.nom), sr = M_.series.find(x => x.nom === p.nom), site = M_.series.filter(x => x.groupe === "site" && x.energie === sr.energie);
      return site.length === 1 ? { valeur: totaux(site[0].nom, ep.debut, ep.fin).ecart / 1000 } : null; }
    case "pieges.plage_sans_donnees": { const sr = M_.series.find(x => x.nom === p.nom); return M_.dates.some((t, i) => t >= de && t <= a && sr.conso[i] != null) ? null : { abstention: true }; }
    case "pieges.serie_inconnue": return M_.series.some(sr => sr.nom.toLowerCase() === p.nom.toLowerCase()) ? null : { abstention: true };
    case "pieges.cause_reelle": case "pieges.hors_classeur": {   // rien, dans ce que les outils renvoient, ne parle de cause, de panne ni de contrat
      const tout = JSON.stringify([outilListerSeries(), outilEpisodes({ nom: p.nom }), outilLireSerie({ nom: p.nom }).total, outilLireFacteurs({ de: isoJour(M_.debut), a: isoJour(M_.fin) })]).replace(/"remarque":"[^"]*"/g, "");
      return /panne|cause|souscrit|contrat|puissance|évén|even/i.test(tout) ? null : { abstention: true }; }
    case "raisonnement.deux_series_pct": { const pct = n => { const t = totaux(n, de, a); return Math.abs(t.ecart / t.ref); }; return { nom: pct(p.serieA) > pct(p.serieB) ? p.serieA : p.serieB }; }
    case "raisonnement.pire_periode": {   // z de chaque période recalculé ici ; le libellé est celui de la période de même date dans l'outil
      const sr = M_.series.find(x => x.nom === p.nom), err = sr.err[{ day: 0, week: 1, month: 2, year: 3 }[sr.pas]];
      const t = periodes(p.nom).filter(x => comparee(x) && x.fin >= de && x.debut <= a).map(x => ({ x, z: (x.reel - x.ref) / x.ref / err })).sort((u, v) => Math.abs(v.z) - Math.abs(u.z));
      const lib = outilLireSerie({ nom: p.nom, de: p.de, a: p.a }).periodes.find(y => y.debut === isoJour(t[0].x.debut)); return lib ? { nom: lib.periode } : null; }
    case "raisonnement.episode_recent": { const top = M_.series.map(sr => ({ nom: sr.nom, e: episodesDirects(sr.nom) })).sort((x, y) => y.e.length - x.e.length)[0]; const d = top.e.slice().sort((x, y) => y.debut - x.debut)[0]; return { valeur: d.ecart / 1000 }; }
    case "raisonnement.signe_oppose": { const c = uesDirectes(p.energie, de, a), t = c.ues.filter(u => u.t.ecart && Math.sign(u.t.ecart) === -Math.sign(c.site)); return t.length === 1 ? { nom: t[0].nom } : null; }
    case "raisonnement.cout_max": { const t = uesDirectes(p.energie, de, a).ues.filter(u => u.t.ecart > 0).sort((x, y) => y.t.ecart - x.t.ecart); return t[0] ? { nom: t[0].nom } : null; }   // même énergie, même prix : coût maximal = écart positif maximal
    case "subtils.en_cours_absent": { const sr = M_.series.find(x => x.nom === p.nom), der = Math.max(...M_.dates.filter((t, i) => sr.conso[i] != null)), e = episodesDirects(p.nom);
      return e.length && e[e.length - 1].fin < der ? { abstention: true } : null; }   // le dernier épisode se termine avant la dernière période relevée : rien n'est en cours
    case "subtils.nom_voisin": return M_.series.some(sr => sr.nom.toLowerCase() === p.nom.toLowerCase()) ? null : { abstention: true };
    case "subtils.z_non_calculable": { const sr = M_.series.find(x => x.nom === p.nom); return sr.err[{ day: 0, week: 1, month: 2, year: 3 }[sr.pas]] > 0 ? null : { abstention: true }; }
    case "subtils.plage_partielle": return { valeur: totaux(p.nom, de, a).ecart / 1000 };
  }
  return null;
}

/* ---- faux modèles ---- */
const signalLibre = () => new AbortController().signal;
const appel = (name, input, id) => ({ type: "tool_use", id: id || "t_" + name + "_" + Math.random().toString(36).slice(2, 8), name, input });
const bonne = q => q.attendu.abstention ? { type: "abstention", phrase: "Pas dans les données." } : q.attendu.nom != null ? { type: "nom", nom: q.attendu.nom, phrase: "Nom lu." } : { type: "nombre", valeur: q.attendu.valeur, unite: q.attendu.unite || "sans unité", phrase: "Valeur lue." };
/* Joue les appels du plan de la question au premier tour, puis rend la réponse donnée. */
const joue = (q, reponse) => fauxModele((req, tour) => tour === 1 ? q.calcul.map(c => appel(c[0], c[1])) : [appel("repondre", reponse)]);
const noteDe = async (q, reponse) => (await evlInterroger(q, joue(q, reponse), signalLibre()));
const attendreFin = async () => { while (evl.enCours) await new Promise(ok => setTimeout(ok, 5)); };
function textes(n, out = []) {                             // tous les textes et attributs traduisibles d'un sous-arbre
  if (!n) return out;
  if (n.nodeType === 3) out.push(n.textContent);
  else if (n.tagName !== "CODE") {                         // les appels d'outils (noms de champs) ne se traduisent pas
 for (const k of ["title", "aria-label", "placeholder"]) if (n.attrs && n.attrs[k]) out.push(n.attrs[k]); (n.children || []).forEach(c => textes(c, out)); }
  return out;
}
const feuille = () => document.getElementById("app").querySelector(".feuille");

async function test() {
  evl.pauseDemo = 0;
  const pairesT = [], evlT0 = evlT;
  evlT = (fr, en) => { pairesT.push([fr, en]); return evlT0(fr, en); };      // relevé des textes fixes du module, pour vérifier leurs traductions

  /* 1. Jeu de questions */
  const Q = evlJeu(), empreinte = () => JSON.stringify(evlJeu().map(q => [q.id, q.famille, q.cle, q.fr, q.en, q.attendu, q.calcul]));
  console.log("jeu : " + Q.length + " questions ; " + evlFAMILLES.map(f => f[1] + "=" + Q.filter(q => q.famille === f[0]).length).join(" "));
  verifier(Q.length >= 12, "le jeu compte au moins 12 questions (" + Q.length + ")");
  verifier(evlFAMILLES.every(f => Q.some(q => q.famille === f[0])), "toutes les familles sont représentées");
  verifier(new Set(Q.map(q => q.id)).size === Q.length, "les identifiants des questions sont uniques");
  const pieges = Q.filter(q => q.piege);
  verifier(pieges.length >= 3 && ["plage_sans_donnees", "serie_inconnue", "cause_reelle"].every(c => pieges.some(q => q.cle === c)), "les trois pièges demandés existent (plage sans données, série inconnue, réponse absente)");
  verifier(pieges.every(q => q.attendu.abstention && evlPIEGES.includes(q.famille)) && Q.filter(q => !q.piege).every(q => !q.attendu.abstention), "seuls les pièges attendent une abstention");
  verifier(Q.every(q => q.fr && q.en && q.fr !== q.en && q.calcul.length >= 1 && typeof q.champ === "string"), "chaque question a un texte français, un texte anglais et montre son calcul");
  verifier(Q.filter(q => q.famille === "etapes").every(q => q.calcul.length >= 3), "les questions à plusieurs étapes demandent au moins trois appels d'outils");
  const noms = M_.series.map(sr => sr.nom).concat(M_.facteurs.map(f => f.nom));
  verifier(!noms.some(n => n.length > 3 && pairesT.concat(evlFAMILLES.map(f => [f[2], f[3]])).some(p => p[0].includes(n))), "aucun nom de série ou de facteur dans les textes fixes");

  /* 2. Reproductibilité */
  const e1 = empreinte();
  evl.jeu = null; verifier(empreinte() === e1, "même graine : même jeu, question pour question");
  evl.graine = 7; const e7 = empreinte(); verifier(e7 !== e1, "autre graine : autre jeu");
  evl.jeu = null; verifier(empreinte() === e7, "la graine 7 redonne le même jeu");
  for (const g of [2, 3, 11, 2024]) { evl.graine = g; const n = evlJeu().length; verifier(n >= 12 && evlJeu().filter(q => q.piege).length >= 3, "graine " + g + " : jeu complet (" + n + " questions)"); }

  /* 3. Second chemin : chaque réponse attendue est recalculée sans les outils, pour plusieurs graines */
  let recalculees = 0;
  for (const g of [1, 2, 3, 7, 11, 2024]) {
    evl.graine = g;
    for (const q of evlJeu()) {
      const s = secondChemin(q), a = q.attendu, ou = "graine " + g + ", " + q.id + " (" + q.cle + ")";
      if (!s) { verifier(false, ou + " : pas de second chemin"); continue; }
      recalculees++;
      if (a.abstention) verifier(s.abstention === true, ou + " : abstention confirmée par le second chemin");
      else if (a.position) verifier(s.position === a.position, ou + " : position « " + a.position + " » retrouvée (" + s.position + ")");
      else if (a.nom != null) verifier(s.nom === a.nom, ou + " : nom « " + a.nom + " » retrouvé (« " + s.nom + " »)");
      else verifier(proche(s.valeur, a.valeur, s.tol == null ? 0.011 : s.tol + 1e-9), ou + " : valeur " + a.valeur + " retrouvée (" + s.valeur + ")");
    }
  }
  console.log("second chemin : " + recalculees + " réponses attendues recalculées sur 6 graines");
  evl.graine = 1;
  verifier(empreinte() === e1, "retour à la graine 1 : jeu d'origine");
  // la question plafonnée garde toutes les familles
  evl.plafond = 6; verifier(evlSelection().length === 6 && new Set(evlSelection().map(q => q.famille)).size === 6, "plafond de 6 questions : une par famille");
  evl.plafond = 12; verifier(evlSelection().length === 12, "plafond de 12 questions");
  evl.plafond = 0; verifier(evlSelection().length === Q.length, "sans plafond : tout le jeu");

  /* 4. Notation : cas dont la réponse est connue */
  const N = (attendu, r, sources) => evlNoter({ attendu }, r, sources || []);
  verifier(N({ valeur: 1000, unite: "kWh" }, { valeur: 1004, unite: "kWh" }).note === "juste", "tolérance : +0,4 % est juste");
  verifier(N({ valeur: 1000, unite: "kWh" }, { valeur: 1006, unite: "kWh" }).note === "faux", "tolérance : +0,6 % est faux");
  verifier(N({ valeur: 1000, unite: "kWh" }, { valeur: -1000, unite: "kWh" }).detail === "le signe est inversé", "un signe inversé est faux, et dit pourquoi");
  verifier(N({ valeur: 1000, unite: "kWh" }, { valeur: 1000, unite: "%" }).detail === "l'unité n'est pas celle de la question", "une mauvaise unité est fausse");
  verifier(N({ valeur: 0.5, unite: "%" }, { valeur: 0.509, unite: "%" }).note === "juste" && N({ valeur: 0.5, unite: "%" }, { valeur: 0.52, unite: "%" }).note === "faux", "petites valeurs : marge de 0,01");
  verifier(N({ valeur: 8, unite: "", exact: true }, { valeur: 8, unite: "sans unité" }).note === "juste" && N({ valeur: 8, unite: "", exact: true }, { valeur: 9, unite: "sans unité" }).note === "faux", "un comptage doit être exact");
  verifier(N({ nom: "École Nord" }, { nom: "  ecole  NORD " }).note === "juste" && N({ nom: "EC Principale" }, { nom: "Chaufferie EC Principale Process" }).note === "faux", "nom : casse et accents ignorés, mais pas de nom approchant");
  verifier(N({ nom: "au-dessus de la plage habituelle", position: "dessus" }, { nom: "Au-dessus" }).note === "juste" && N({ nom: "au-dessus de la plage habituelle", position: "dessus" }, { nom: "en dessous de la plage habituelle" }).note === "faux", "position : reconnue d'après le mot clé");
  verifier(N({ abstention: true }, { abstention: true }).note === "abst_ok" && N({ abstention: true }, { valeur: 0, unite: "kWh" }).note === "invention" && N({ abstention: true }, { nom: "x" }).note === "invention", "piège : abstention justifiée, sinon invention");
  verifier(N({ valeur: 3, unite: "kWh" }, { abstention: true }).note === "abst_tort" && N({ valeur: 3, unite: "kWh" }, null).note === "sans", "abstention à tort, et sans réponse");
  verifier(N({ valeur: 12.34, unite: "kWh" }, { valeur: 99.5, unite: "kWh" }, ['{"a":99.5}']).recopie === true && N({ valeur: 12.34, unite: "kWh" }, { valeur: 99.5, unite: "kWh" }, ['{"a":99.56}']).recopie === false, "« recopié d'un outil » : présence de la valeur dans les résultats");
  for (const [e, motif] of [[{ type: "nombre", valeur: 1, unite: "kWh" }, "phrase"], [{ type: "nombre", valeur: "1", unite: "kWh", phrase: "x" }, "valeur"], [{ type: "nombre", valeur: 1, unite: "MWh", phrase: "x" }, "unite"], [{ type: "nom", phrase: "x" }, "nom"], [{ type: "autre", phrase: "x" }, "type"], [null, "phrase"]]) {
    let refus = ""; try { evlValider(e); } catch (x) { refus = x.message; }
    verifier(refus.includes(motif), "réponse mal formée refusée (" + motif + ")");
  }

  /* 5. Agent questions-réponses avec un faux modèle : juste, fausse, abstention justifiée, invention… */
  const qL = Q.find(q => q.cle === "ecart_kwh" && q.famille === "lecture"), qP = Q.find(q => q.cle === "plage_sans_donnees"), qN = Q.find(q => q.cle === "premiere_ues"), qS = Q.find(q => q.cle === "serie_inconnue"), qM = Q.find(q => q.cle === "site_de_l_episode");
  let l = await noteDe(qL, bonne(qL));
  verifier(l.note === "juste" && l.recopie === true && l.tours === 2 && l.appels.length === 1 && l.appels[0].outil === "lire_serie", "réponse juste : notée juste, 2 tours, 1 appel d'outil, valeur recopiée");
  l = await noteDe(qL, { type: "nombre", valeur: Math.round(qL.attendu.valeur), unite: "kWh", phrase: "Arrondi." });
  verifier(l.note === (Math.abs(Math.round(qL.attendu.valeur) - qL.attendu.valeur) <= Math.max(0.01, 0.005 * Math.abs(qL.attendu.valeur)) ? "juste" : "faux"), "réponse arrondie à l'unité : notée selon la tolérance");
  l = await noteDe(qL, { type: "nombre", valeur: arr(qL.attendu.valeur * 1.1 + 0.137, 3), unite: "kWh", phrase: "Calcul maison." });
  verifier(l.note === "faux" && l.recopie === false && l.detail === "la valeur ne figure dans aucun résultat d'outil", "réponse fausse : notée fausse, valeur absente des résultats d'outils");
  l = await noteDe(qL, { type: "abstention", phrase: "Je ne sais pas." });
  verifier(l.note === "abst_tort", "abstention alors que la réponse existe : abstention à tort");
  l = await noteDe(qP, bonne(qP));
  verifier(l.note === "abst_ok", "piège, plage sans données : abstention justifiée");
  l = await noteDe(qP, { type: "nombre", valeur: 0, unite: "kWh", phrase: "L'écart est nul." });
  verifier(l.note === "invention" && l.recopie === true, "piège, plage sans données : répondre 0 kWh est une invention (bien que 0 figure dans le résultat d'outil)");
  l = await noteDe(qS, { type: "nombre", valeur: 1234.5, unite: "kWh", phrase: "Série approchante." });
  verifier(l.note === "invention" && l.appels[0].erreur && /Série inconnue/.test(l.appels[0].erreur), "piège, série inconnue : l'outil renvoie une erreur, une valeur rendue est une invention");
  l = await noteDe(qN, { type: "nom", nom: qN.attendu.nom.toUpperCase(), phrase: "Nom lu." });
  verifier(l.note === "juste", "question à nom : juste, à la casse près");
  l = await noteDe(qN, { type: "nom", nom: outilComparerUes(qN.p).ues[1].nom, phrase: "Autre UES." });
  verifier(l.note === "faux" && l.detail === "ce n'est pas le nom attendu", "question à nom : une autre UES est fausse");
  l = await noteDe(qM, bonne(qM));
  verifier(l.note === "juste" && l.appels.length === 3, "question à plusieurs étapes : juste, trois appels d'outils");

  // la requête : outils de lecture + repondre, pas rediger_fiche ; la question seule ; la réponse attendue n'y est pas
  let vue = null;
  l = await evlInterroger(qL, fauxModele((req, tour) => { if (tour === 1) vue = JSON.parse(JSON.stringify(req)); return tour === 1 ? [appel("lire_serie", qL.p)] : [appel("repondre", bonne(qL))]; }), signalLibre());
  verifier(vue.tools.map(t => t.name).join() === "lister_series,lire_serie,lire_facteurs,comparer_ues,episodes,repondre", "outils transmis : les cinq outils de lecture et repondre, sans rediger_fiche");
  verifier(vue.messages.length === 1 && vue.messages[0].content === qL.fr && /abstention/.test(vue.system), "premier message : la question seule ; la consigne parle d'abstention");
  verifier(!JSON.stringify(vue).includes(String(qL.attendu.valeur)) && !/attendu/.test(JSON.stringify(vue)), "la réponse attendue n'est pas envoyée au modèle");
  // jetons : champ usage de chaque réponse
  const base = joue(qL, bonne(qL));
  l = await evlInterroger(qL, async req => { const r = await base(req); r.usage = { input_tokens: 1000, output_tokens: 200 }; return r; }, signalLibre());
  verifier(l.jIn === 2000 && l.jOut === 400 && l.duree >= 0, "jetons d'entrée et de sortie additionnés sur les tours");
  // réponse mal formée, outil inconnu, repondre appelé avec un autre outil : l'agent est corrigé puis noté
  l = await evlInterroger(qL, fauxModele((req, tour) => tour === 1 ? [appel("outil_fantome", {}), appel("lire_serie", qL.p)] : tour === 2 ? [appel("repondre", { type: "nombre", valeur: qL.attendu.valeur })]
    : tour === 3 ? [appel("lire_serie", qL.p), appel("repondre", bonne(qL))] : [appel("repondre", bonne(qL))]), signalLibre());
  verifier(l.note === "juste" && l.tours === 4 && l.appels.filter(a => a.erreur).length === 1, "réponse mal formée puis repondre non seul : refusés, la réponse est acceptée au tour suivant");
  // pas de réponse structurée
  l = await evlInterroger(qL, fauxModele(() => [{ type: "text", text: "L'écart est de 12 kWh." }]), signalLibre());
  verifier(l.note === "sans" && l.tours === 2 && l.reponse === null && /12 kWh/.test(l.texte), "texte libre sans appel à repondre : une relance, puis « sans réponse »");
  let dernier = null;
  l = await evlInterroger(qL, fauxModele((req, tour) => { dernier = req.messages[req.messages.length - 1]; return [appel("lister_series", {})]; }), signalLibre());
  verifier(l.note === "sans" && l.tours === evl.tours && l.appels.length === evl.tours && JSON.stringify(dernier).includes("Dernier tour"), "l'agent qui tourne en rond s'arrête au plafond de tours, après un rappel au dernier tour");
  l = await evlInterroger(qL, async () => ({ content: [], stop_reason: "refusal", usage: {} }), signalLibre());
  verifier(l.note === "sans" && l.detail === "le modèle a décliné la question", "refus du modèle : sans réponse, avec le motif");
  // arrêt
  const ctrl = new AbortController(); let leve = null;
  try { await evlInterroger(qL, async req => { ctrl.abort(); return (await base(req)); }, ctrl.signal); } catch (e) { leve = e; }
  verifier(leve && leve.name === "AbortError", "arrêt pendant un appel : la question est abandonnée");

  /* 6. Mode démonstration de bout en bout */
  agent.demo = true; etat.onglet = "evaluation"; rendre();
  let t = texteDe(feuille());
  verifier(/Mode démonstration : aucun appel réseau, aucune IA/.test(t) && /elles ne disent rien d'une IA/.test(t), "avant toute passe : la page dit que l'agent est un script");
  verifier(/Jeu de questions/.test(t) && t.includes(qL.fr) && /erreur voulue/.test(t), "le jeu de questions est visible avant toute passe, avec les erreurs voulues du script");
  const lancer = trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Lancer une passe/.test(n.textContent))[0];
  verifier(lancer && !lancer.disabled, "bouton « Lancer une passe » actif en mode démonstration");
  cliquer(lancer);
  verifier(evl.enCours && agent.enCours && trouver(evlNoeud, n => n.tagName === "BUTTON" && n.textContent === "Arrêter").length === 1, "pendant la passe : bouton Arrêter, et l'agent de la page Instruction est occupé");
  await attendreFin();
  const P1 = evl.passes[0], B1 = evlBilan(P1), fautes = Q.filter(q => q.faute);
  console.log("passe démo : " + Q.map((q, k) => q.id + "=" + P1.lignes[k].note).join(" "));
  verifier(evl.passes.length === 1 && P1.demo && P1.fini && !P1.arrete && P1.lignes.filter(x => x && x.note).length === Q.length, "passe de démonstration complète : " + Q.length + " questions notées");
  verifier(!agent.enCours && !evl.enCours, "fin de passe : l'agent est libéré");
  verifier(fautes.length === 3, "le script a trois erreurs voulues");
  verifier(Q.every((q, k) => q.faute || P1.lignes[k].note === (q.piege ? "abst_ok" : "juste")), "hors erreurs voulues, le script répond juste ou s'abstient à raison");
  const noteDemo = cle => P1.lignes[Q.findIndex(q => q.cle === cle)].note;
  verifier(noteDemo("ecart_pct") === "faux" && noteDemo("nombre") === "abst_tort" && noteDemo("plage_sans_donnees") === "invention", "les trois erreurs voulues donnent : faux, abstention à tort, invention");
  verifier(B1.n === Q.length && B1.reussies === Q.length - 3 && B1.inventions === 1 && B1.pieges === pieges.length && B1.tort === 1 && B1.cout === null && B1.jIn === 0, "bilan de la passe : réussite, invention, abstention à tort ; pas de jeton ni de coût pour un script");
  verifier(B1.familles.reduce((s, f) => s + f.n, 0) === Q.length && B1.familles.find(f => f.nom === "Pièges").reussies === pieges.filter(q => q.famille === "pieges").length - 1, "bilan par famille cohérent");
  t = texteDe(feuille());
  verifier(/Notes d'un script de démonstration/.test(t) && /Réussite/.test(t) && /Taux d'invention/.test(t) && /Échecs : 3/.test(t) && /Réussite par famille/.test(t), "tableau de bord : relevé, familles, échecs, avec la mention « script »");
  verifier(/un script ne consomme aucun jeton/.test(t) && /Outils appelés/.test(t) && /Lit « /.test(t) && /Erreur voulue du script : il rend le total de 0 kWh/.test(t), "échecs : réponse attendue, réponse donnée, outils appelés, erreur voulue annoncée");
  verifier(fmtPct((Q.length - 3) / Q.length) && t.includes(fmtPct((Q.length - 3) / Q.length)), "le taux de réussite affiché est celui du bilan (" + fmtPct((Q.length - 3) / Q.length) + ")");
  verifier(__reseau.length === 0, "aucun appel réseau en mode démonstration");

  // arrêt à tout moment, puis reprise des questions sans note
  evl.pauseDemo = 15;
  const enVol = evlLancer();
  await new Promise(ok => setTimeout(ok, 120));
  evl.arret.abort(); await enVol;
  const P2 = evl.passes[1], faites = P2.lignes.filter(x => x && x.note).length;
  verifier(P2.arrete === "demande" && P2.fini && faites < Q.length, "arrêt en cours de passe : " + faites + " question(s) notée(s) sur " + Q.length + ", passe marquée arrêtée");
  verifier(/arrêtée à votre demande/.test(texteDe(evlNoeud)) && trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Relancer les/.test(n.textContent)).length === 1, "après l'arrêt : bouton de reprise");
  evl.pauseDemo = 0;
  cliquer(trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Relancer les/.test(n.textContent))[0]); await attendreFin();
  verifier(evl.passes.length === 2 && !P2.arrete && P2.lignes.filter(x => x && x.note).length === Q.length && evlBilan(P2).reussies === B1.reussies, "reprise : seules les questions sans note sont rejouées, même bilan que la première passe");
  // plafond
  evl.plafond = 6; await evlLancer();
  verifier(evl.passes[2].questions.length === 6 && evlBilan(evl.passes[2]).n === 6, "passe plafonnée à 6 questions");
  evl.plafond = 0;
  verifier(__reseau.length === 0, "toujours aucun appel réseau après trois passes de démonstration");

  /* 7. Mode IA simulé : accord propre au banc, erreurs d'API, reprise, jetons et coût (redacteurCourant remplacé par un faux, aucun réseau) */
  agent.demo = false; agent.fournisseur = "gemini"; agent.accord = false; evl.accord = false; evlPeindre();
  let nbAppels = 0, panne = true;
  const vraiRedacteur = redacteurCourant;
  redacteurCourant = signal => ({ demo: false, nom: "faux", signature: () => "faux", appeler: async req => {
    nbAppels++;
    if (panne) throw new Error("Limite de débit atteinte : réessayez dans un instant. (HTTP 429)");
    const q = evlJeu().find(x => evlDemande(x) === req.messages[0].content), tour = req.messages.filter(x => x.role === "assistant").length + 1;
    return { type: "message", role: "assistant", model: "modele-de-test", content: tour === 1 ? q.calcul.map(c => appel(c[0], c[1])) : [appel("repondre", bonne(q))], stop_reason: "tool_use", usage: { input_tokens: 1000, output_tokens: 200 } };
  } });
  verifier(/Réglez d'abord l'envoi sur la page Instruction/.test(texteDe(evlNoeud)) && trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Lancer une passe/.test(n.textContent))[0].disabled, "mode IA sans réglage : bouton désactivé, avec le message");
  await evlLancer();
  verifier(nbAppels === 0 && evl.passes.length === 3, "sans réglage sur la page Instruction : rien n'est appelé");
  agent.accord = "gemini"; champCleGemini.value = "cle-factice-du-banc"; evlPeindre();
  t = texteDe(evlNoeud);
  verifier(/ce que ce banc fait quitter ce poste/.test(t) && /le texte d'une question du banc/.test(t) && /Ne sont pas envoyés : les réponses attendues/.test(t) && /Autorisez d'abord l'envoi des questions/.test(t), "accord de la page Instruction seul : l'avis propre au banc s'affiche, le lancement reste bloqué");
  await evlLancer();
  verifier(nbAppels === 0 && evl.passes.length === 3, "sans l'accord propre au banc : rien n'est appelé");
  cliquer(trouver(evlNoeud, n => n.tagName === "BUTTON" && /^J'autorise l'envoi des questions/.test(n.textContent))[0]);
  verifier(evl.accord === "gemini" && !trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Lancer une passe/.test(n.textContent))[0].disabled, "accord donné par clic : le lancement devient possible");
  verifier(/la page n'en connaît aucun/.test(texteDe(evlNoeud)) && trouver(evlNoeud, n => n.tagName === "INPUT").slice(1).every(n => n.value === "" && n.attrs.placeholder === "à saisir"), "aucun tarif en dur : les deux champs sont vides, à saisir");
  await evlLancer();
  const P4 = evl.passes[3];
  verifier(nbAppels === 2 && P4.arrete === "erreurs" && P4.lignes.filter(x => x && x.erreur).length === 2 && evlBilan(P4).n === 0, "deux erreurs d'API de suite : la passe s'arrête, rien n'est noté");
  verifier(/arrêtée après 2 erreurs d'API de suite/.test(texteDe(evlNoeud)) && /Erreur d'API/.test(texteDe(evlNoeud)), "les erreurs d'API sont affichées, pas notées");
  panne = false;
  cliquer(trouver(evlNoeud, n => n.tagName === "BUTTON" && /^Relancer les/.test(n.textContent))[0]); await attendreFin();
  const B4 = evlBilan(P4);
  verifier(!P4.arrete && B4.n === Q.length && B4.reussies === Q.length && B4.inventions === 0 && B4.erreurs === 0, "reprise après erreurs : toutes les questions notées, 100 % avec un faux modèle parfait");
  verifier(P4.agent === "Gemini (modele-de-test)" && B4.jIn === 2000 && B4.jOut === 400 && B4.tours === 2, "jetons par question : 2 tours × (1 000 entrée, 200 sortie)");
  verifier(B4.cout === null && /saisissez les deux tarifs/.test(texteDe(evlNoeud)), "sans tarif : pas de coût");
  const champs = trouver(evlNoeud, n => n.tagName === "INPUT");
  champs[1].value = "2"; champs[1].dispatchEvent({ type: "change", target: champs[1] });
  const champs2 = trouver(evlNoeud, n => n.tagName === "INPUT");
  champs2[2].value = "10"; champs2[2].dispatchEvent({ type: "change", target: champs2[2] });
  verifier(proche(evlBilan(P4).cout, (2000 * 2 + 400 * 10) / 1e6, 1e-12) && texteDe(evlNoeud).includes(nf(0.008, 4) + " $"), "tarifs saisis après coup (2 et 10 par million) : coût estimé de 0,008 par question");
  evl.vue = evl.passes[0]; evlPeindre();
  const champs3 = trouver(evlNoeud, n => n.tagName === "INPUT");
  champs3[1].value = "5"; champs3[1].dispatchEvent({ type: "change", target: champs3[1] });
  verifier(evl.tarifIn === 5 && evl.passes[0].tarifIn == null && P4.tarifIn === 2, "un tarif saisi pendant qu'une passe d'un autre agent est affichée ne touche aucune passe faite");
  evl.vue = P4; evlPeindre();
  t = texteDe(evlNoeud);
  verifier(/Comparaison des passes/.test(t) && /Question par question/.test(t) && /Passe affichée/.test(t) && /Gemini \(modele-de-test\)/.test(t) && /script de démonstration \(sans IA\)/.test(t), "plusieurs passes : comparaison côte à côte, script et modèle");
  verifier(__reseau.length === 0, "aucun appel réseau pendant les passes simulées");

  /* 8. Export */
  const tsv = evlExport(false).split("\n"), total = evl.passes.reduce((s, P) => s + P.questions.length, 0);
  verifier(tsv.length === 1 + total && tsv.every(x => x.split("\t").length === 14), "export tabulé : une ligne par question et par passe, 14 colonnes");
  const J = JSON.parse(evlExport(true));
  verifier(J.passes.length === evl.passes.length && J.passes[3].bilan.reussies === Q.length && J.passes[3].bilan.jIn === 2000 && J.passes[3].questions[0].note === "juste" && J.passes[3].questions[0].q === undefined && J.passes[0].script_sans_ia === true && J.passes[3].tarif_par_million_de_jetons.entree === 2, "export JSON : passes, bilans, tarifs, mention du script");
  verifier(J.passes[0].questions.length === Q.length && J.passes[0].questions[0].appels[0].outil === "lire_serie" && J.passes[0].questions[0].attendu.valeur === Q[0].attendu.valeur && !/cle-factice/.test(evlExport(true)), "export JSON : questions, outils appelés ; la clé n'y figure pas");
  const copier = trouver(evlNoeud, n => n.tagName === "BUTTON" && n.textContent === "Copier");
  verifier(copier.length === 2, "deux boutons de copie (texte tabulé, JSON)");
  // retrait d'une passe
  cliquer(trouver(evlNoeud, n => n.tagName === "BUTTON" && n.textContent === "Retirer cette passe")[0]);
  verifier(evl.passes.length === 3 && !evl.passes.includes(P4), "retrait de la passe affichée");

  /* 9. Rendu en anglais, après une passe de démonstration faite en anglais */
  redacteurCourant = vraiRedacteur; agent.demo = true; agent.accord = false; champCleGemini.value = ""; evl.accord = false;
  evl.passes = []; evl.jeuOuvert = true;
  LANGUE = "en"; CACHE_TR.clear(); etat.onglet = "evaluation"; rendre();
  await evlLancer(); rendre();
  const anglais = textes(feuille()).concat(textes(document.getElementById("app").querySelector(".entete")));
  const donnees = noms.concat(M_.energies, [etat.fichier, "au-dessus de la plage habituelle", "en dessous de la plage habituelle", "dans la plage habituelle", "sans unité"]).sort((a, b) => b.length - a.length);
  const restes = anglais.map(x => donnees.reduce((s, d) => s.split(d).join(""), x)).filter(x => /(^|[^A-Za-zÀ-ÿ])(le|la|les|des|une|est|sur|par|avec|pour|pas|aux|du|au|et|ou|à|qui|que|dans|ne)([^A-Za-zÀ-ÿ]|$)/i.test(x) || /[éèêàùçô]/.test(x));
  verifier(restes.length === 0, "page en anglais : aucun texte resté en français" + (restes.length ? " → " + restes.slice(0, 8).map(x => JSON.stringify(x.slice(0, 90))).join(" | ") : ""));
  t = anglais.join("\n");
  verifier(/Agent evaluation bench/.test(t) && /Success/.test(t) && /Fabrication rate/.test(t) && /deliberate error/.test(t) && /demo script \(no AI\)/.test(t) && /Failures: 3/.test(t) && /Reads “/.test(t), "page en anglais : titres, relevé, échecs et outils traduits");
  verifier(t.includes(qL.en) && !t.includes(qL.fr), "page en anglais : les questions sont posées en anglais");
  const conflits = pairesT.filter(p => EN.get(p[0]) !== p[1]);
  verifier(conflits.length === 0, "chaque texte fixe du module a bien sa traduction dans la table" + (conflits.length ? " → " + conflits.map(p => p[0]).join(" | ") : ""));
  console.log("textes fixes du module : " + new Set(pairesT.map(p => p[0])).size);
  LANGUE = "fr"; CACHE_TR.clear(); rendre();
  verifier(/Banc d'évaluation de l'agent/.test(texteDe(document.getElementById("app"))) && /Réussite/.test(texteDe(feuille())), "retour au français");

  /* 10. Les autres pages se rendent toujours ; un nouveau classeur remet le banc à zéro et redonne le même jeu */
  for (const o of ONGLETS) { etat.onglet = o[0]; rendre(); verifier(texteDe(document.getElementById("app")).length > 200, "la page « " + o[0] + " » se rend"); }
  verifier(PAGES.some(g => g.groupe === "Agents" && g.pages.some(p => p[0] === "evaluation")) && typeof ICONES.evaluation === "string", "page inscrite dans le groupe « Agents », avec son icône");
  charger(grillesChargees, d1904Charge, etat.fichier, null);
  verifier(evl.passes.length === 0 && evl.accord === false && evl.modele === etat.modele, "nouveau classeur : passes et accord remis à zéro");
  verifier(JSON.stringify(evlJeu().map(q => [q.id, q.fr, q.attendu])) === JSON.stringify(JSON.parse(e1).map(x => [x[0], x[3], x[5]])), "même classeur rechargé, même graine : même jeu");
  evlT = evlT0;
  verifier(__reseau.length === 0, "aucun appel réseau pendant tout le test");
}
