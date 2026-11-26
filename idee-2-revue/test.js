/* Tests du module « Revue ». Lancer : node outillage/banc.js idee-2-revue/essai.js idee-2-revue/test.js */
verifier.bavard = false;
const boutons = t => trouver(app, n => n.tagName === "BUTTON" && n.textContent === t);
const repos = async () => { while (rev.enCours) await new Promise(ok => setTimeout(ok, 15)); };
const page = () => { etat.onglet = "revue"; rendre(); return texteDe(app); };
const faitDe = (D, type, sujet) => D.faits.find(f => f.type === type && (sujet == null || f.sujet === sujet));

/* ---- 1. Contrôle déterministe, sur un dossier écrit à la main : les réponses sont connues ---- */
function testControle() {
  LANGUE = "fr";
  const D = revIndexer([
    { id: "R1", type: "performance", sujet: "Ligne 3000", fait: "« Ligne 3000 » (UES, Gaz), 12 périodes comparables : réel 9,73 GWh, référence 9,38 GWh, écart +353,6 MWh (+3,8 %, surconsommation), soit +23,2 k€ et +76 tCO₂e (estimations)." },
    { id: "R2", type: "performance", sujet: "Four B", fait: "« Four B » (UES, Gaz), 12 périodes comparables : réel 1 204 MWh, référence 1 250 MWh, écart −46 MWh (−3,7 %, économie)." },
    { id: "M1", type: "modele", sujet: "Ligne 3000", fait: "« Ligne 3000 » : modèle simple, R² 0,87, erreur de ± 6,2 % au pas « semaine », 79 points." },
    { id: "M2", type: "modele", sujet: "Four B", fait: "« Four B » : modèle simple, R² 0,54, erreur de ± 13,9 % au pas « semaine », 70 points." },
    { id: "D1", type: "episode", sujet: "Ligne 3000", fait: "« Ligne 3000 » (UES, Gaz), S25 2024 → S36 2024 (12 semaines) : surconsommation de +302,6 MWh ; |z| maximal 5,3." }]);
  const etats = t => revControler(t, D).nombres.map(x => x.ecrit + ":" + x.etat).join(" ");
  verifier(etats("L'écart de « Ligne 3000 » est de 353,6 MWh, soit 3,8 % [R1].") === "353,6:ok 3,8:ok", "un texte juste passe : " + etats("L'écart de « Ligne 3000 » est de 353,6 MWh, soit 3,8 % [R1]."));
  verifier(etats("L'écart est de 354 MWh, pour 9,7 GWh consommés [R1].") === "354:ok 9,7:ok", "un arrondi plus court du fait passe");
  verifier(etats("L'écart est de 484,4 MWh [R1].") === "484,4:absent", "un chiffre altéré est attrapé");
  verifier(etats("L'écart est de 353,6 kWh [R1].") === "353,6:absent", "la bonne valeur avec la mauvaise unité est attrapée");
  verifier(etats("L'écart est de 353,7 MWh [R1].") === "353,7:absent", "un écart d'un dixième est attrapé");
  verifier(etats("L'écart est de 353,6 MWh [R2].") === "353,6:hors", "un nombre du dossier rattaché au mauvais fait est « hors »");
  verifier(etats("L'écart est de 353,6 MWh.") === "353,6:hors", "un nombre du dossier sans renvoi est « hors »");
  verifier(etats("Le site économise 23,2 k€ [R1].") === "23,2:ok" && etats("Le site économise 23,2 € [R1].") === "23,2:absent", "k€ et € ne se confondent pas");
  verifier(etats("« Four B » consomme 1 204 MWh [R2]. « Ligne 3000 » atteint 9,73 GWh [R1].") === "1 204:ok 9,73:ok", "deux phrases, chacune avec son renvoi ; séparateur de milliers lu");
  verifier(etats("« Four B » consomme 1 204 MWh [R2]. « Ligne 3000 » atteint 9,38 GWh.") === "1 204:ok 9,38:hors", "le renvoi d'une phrase ne couvre pas la suivante");
  verifier(etats("« Ligne 3000 » dérive pendant 12 semaines en 2024, de S25 2024 à S36 2024, selon l'ISO 50001, avec 3 causes possibles et un P90 élevé [D1].") === "", "nom de série, petits entiers, année, semaines, ISO 50001 et P90 ne sont pas des nombres à contrôler");
  verifier(etats("En 2019, la dérive était de 2 000 MWh [D1].") === "2019:absent 2 000:absent", "une année étrangère aux données et un nombre inventé sont attrapés");
  verifier(etats("Le R² vaut 0,87 [M1] et |z| atteint 5,3 [D1].") === "0,87:ok 5,3:ok", "nombres sans unité contrôlés quand ils ont des décimales");
  const c = revControler("Écart de 353,6 MWh [R1, Z9]. Rien d'autre [R7].", D);
  verifier(c.renvois.length === 2 && c.renvois[0].inconnus.join() === "Z9" && c.renvois[1].inconnus.join() === "R7" && c.nombres[0].etat === "ok", "renvois inconnus repérés, renvoi connu utilisé");
  verifier("Écart de 353,6 MWh [R1, Z9].".slice(c.nombres[0].i, c.nombres[0].i + 5) === "353,6" && c.renvois[0].i === 19, "positions exactes du nombre et du renvoi dans le texte");
  verifier(revNombres("€18.2k").length === 1, "lecture d'un texte sans espace");
  // vérificateur de démonstration : il ne lit que le dossier et le texte
  const verdict = t => revVerdictsDemo(D.faits, [{ id: "derives", texte: t }])[0];
  verifier(verdict("« Ligne 3000 » dérive de 302,6 MWh [D1].").verdict === "conforme", "vérificateur de démonstration : texte juste conforme");
  verifier(verdict("« Ligne 3000 » dérive de 999,9 MWh [D1].").verdict === "à corriger", "vérificateur de démonstration : nombre absent, à corriger");
  verifier(verdict("« Four B » dérive de 302,6 MWh [D1].").points.some(p => /Four B/.test(p.constat)), "vérificateur de démonstration : série nommée absente du fait cité");
  verifier(verdict("La dérive de 302,6 MWh est due à une panne de brûleur [D1].").verdict === "à corriger" && verdict("La dérive de 302,6 MWh pourrait venir d'un réglage, hypothèse à confirmer [D1].").verdict === "conforme", "vérificateur de démonstration : cause affirmée refusée, hypothèse acceptée");
  // format des réponses des agents
  verifier((() => { try { revValiderRevue({ sections: [{ id: "synthese", texte: "x" }] }); return false; } catch (e) { return /consommations/.test(e.message); } })(), "une revue incomplète est refusée, la section manquante est nommée");
  const vv = revValiderVerdicts({ sections: REV_IDS.map(id => ({ id, verdict: "conforme", resume: "ok", points: id === "derives" ? [{ gravite: "bloquant", constat: "chiffre mal attribué" }] : [] })) });
  verifier(vv.find(x => x.id === "derives").verdict === "à corriger" && vv.find(x => x.id === "synthese").verdict === "conforme", "un point bloquant impose « à corriger », quel que soit le mot du vérificateur");
  LANGUE = "en";
  const De = revIndexer([{ id: "R1", type: "performance", sujet: "Line A", fait: "“Line A” (SEU, Gas), 12 comparable periods: actual 9.73 GWh, baseline 9.38 GWh, gap +353.6 MWh (+3.8%, overconsumption), i.e. +€23.2k and +76 tCO₂e (estimates); total 1,204.5 kWh." }]);
  const en = t => revControler(t, De).nombres.map(x => x.ecrit + ":" + x.etat).join(" ");
  verifier(en("The gap is 353.6 MWh (3.8%), about €23.2k [R1].") === "353.6:ok 3.8:ok 23.2:ok", "anglais : point décimal, % collé, euros en préfixe : " + en("The gap is 353.6 MWh (3.8%), about €23.2k [R1]."));
  verifier(en("The total is 1,204.5 kWh, not €23.2M [R1].") === "1,204.5:ok 23.2:absent", "anglais : virgule des milliers lue, k€ et M€ distingués");
  LANGUE = "fr";
}

/* ---- 2. Dossier de faits : mêmes totaux que les fonctions d'origine ---- */
function testDossier(libelle) {
  const m = etat.modele, D = revDossier(), dansPeriode = t => t >= etat.de && t <= etat.a, de = isoJour(etat.de), a = isoJour(etat.a);
  verifier(D.faits.length > 20 && new Set(D.faits.map(f => f.id)).size === D.faits.length && D.faits.every(f => /^[A-Z]\d+$/.test(f.id) && f.fait), libelle + " : chaque fait a un identifiant unique et un texte (" + D.faits.length + " faits)");
  for (const e of m.energies) {
    const sites = m.series.filter(x => x.energie === e && x.groupe === "site"), ues = m.series.filter(x => x.energie === e && x.groupe === "ues");
    let direct = 0; for (const x of sites) x.conso.forEach((v, i) => { if (v != null && dansPeriode(m.dates[i])) direct += v; });
    const origine = somme(sites.map(x => totalPeriode(x.conso) || 0)), f = faitDe(D, "consommation", e);
    verifier(Math.abs(direct - origine) < 1e-6 && f && f.fait.includes(fmtEnergie(origine)), libelle + " : consommation du site en « " + e + " » = totalPeriode = somme directe (" + fmtEnergie(origine) + ")");
    const tU = somme(ues.map(x => totalPeriode(x.conso) || 0));
    verifier(!tU || f.fait.includes(fmtEnergie(tU)) && f.fait.includes(fmtPct(tU / origine)), libelle + " : total et part des UES en « " + e + " », comme la page Arborescence");
    const c = outilComparerUes({ energie: e, de, a }), x = faitDe(D, "explication", e);
    verifier(!c.site || x.fait.includes(fmtEnergie(c.site.ecart_kwh * 1000, true)) && x.fait.includes(fmtEnergie(c.ecart_site_non_explique_par_les_ues_kwh * 1000, true)), libelle + " : écart du site et part non expliquée en « " + e + " » = outil comparer_ues");
  }
  for (const A of derives().analyses) {
    let reel = 0, ref = 0, n = 0;
    for (let i = 0; i < A.S.n; i++) if (A.ecart[i] != null && A.fins[i] >= etat.de && A.S.debuts[i] <= etat.a) { reel += A.reel[i]; ref += A.ref[i]; n++; }
    const f = faitDe(D, "performance", A.serie.nom), r = outilLireSerie({ nom: A.serie.nom, de, a }).total;
    if (!n) { verifier(!f, libelle + " : pas de fait de performance sans période comparable"); continue; }
    verifier(r.nb_periodes === n && Math.abs(r.ecart_kwh * 1000 - (reel - ref)) < 10 && f.fait.includes(fmtEnergie(r.ecart_kwh * 1000, true)) && f.fait.includes(fmtEnergie(r.reel_kwh * 1000)) && f.fait.includes(fmtPct(r.ecart_pct / 100, true)),
      libelle + " : performance de « " + A.serie.nom + " » = outil lire_serie = somme directe");
    const mo = faitDe(D, "modele", A.serie.nom);
    verifier(mo && (A.serie.r2 == null || mo.fait.includes(nf(A.serie.r2, 3))) && (mo.marque === "non_analysee") === !A.ok && (mo.marque === "r2_faible") === (A.ok && A.serie.r2 != null && A.serie.r2 < 0.75), libelle + " : qualité du modèle de « " + A.serie.nom + " »");
  }
  // dérives : mêmes épisodes et mêmes cumuls sans double compte que la page Détection
  const eps = derives().episodes.filter(ep => ep.fin >= etat.de && ep.debut <= etat.a), avecSite = new Set(m.series.filter(x => x.groupe === "site").map(x => x.energie));
  const comptes = eps.filter(ep => ep.groupe === "site" || !avecSite.has(ep.energie)), plus = comptes.filter(ep => ep.ecart > 0), cumuls = D.faits.filter(f => f.type === "cumul");
  verifier(D.nbEpisodes === eps.length && faitDe(D, "bilan").fait.startsWith(eps.length + " "), libelle + " : " + eps.length + " épisodes, comme la page Détection");
  verifier(!plus.length || cumuls[0].fait.includes(fmtEnergie(somme(plus.map(ep => ep.ecart)), true)) && cumuls[0].fait.includes(fmtEuros(somme(plus.map(ep => coutDe(ep.energie, ep.ecart))), true)), libelle + " : cumul des surconsommations et coût, sans double compte");
  const gros = eps[0], fe = D.faits.find(f => f.type === "episode");
  verifier(!gros || fe.sujet === gros.serie && fe.fait.includes(gros.libDebut) && fe.fait.includes(fmtEnergie(gros.ecart, true)) && fe.fait.includes(fmtCO2(co2De(gros.energie, gros.ecart), true)), libelle + " : le premier épisode du dossier est le plus gros, avec son écart et son CO2e");
  const ouverts = eps.filter(ep => ep.ouvert), fo = D.faits.filter(f => f.marque === "en_cours");
  verifier(fo.length === ouverts.length && ouverts.every(ep => fo.some(f => f.sujet === ep.serie && f.fait.includes(fmtEnergie(projectionDe(ep).wh3mois, true)))), libelle + " : chaque dérive en cours porte sa projection à 3 mois");
  verifier(m.energies.every(e => { const v = valoDe(e), f = faitDe(D, "valorisation", e); return f && (v.prix == null || f.fait.includes(nf(v.prix, 2))) && (v.fe == null || f.fait.includes(nf(v.fe, 4))); }), libelle + " : hypothèses de valorisation");
  verifier(etat.modele === m && JSON.stringify(D.faits).indexOf(etat.fichier) < 0, libelle + " : le modèle est remis en place, et le nom du fichier n'est pas dans le dossier");
  return D;
}

async function test() {
  const m = etat.modele, reseau0 = __reseau.length;
  agent.demo = true;
  testControle();
  const D = testDossier("toutes les données");
  verifier(faitDe(D, "donnees").marque === "historique_court" && /18 mois/.test(faitDe(D, "donnees").fait), "l'historique court (18 mois) est dit dans le dossier");
  verifier(D.faits.filter(f => f.type === "facteur").length === 1 && !D.faits.some(f => f.type === "facteur" && f.marque), "période = toutes les données : pas de plage habituelle inventée pour les facteurs");
  // lignes du classeur après la fin des données : facteurs à 0, qui ne doivent pas servir de plage habituelle
  const futur = m.dates.filter(t => t > m.fin).length, fe = D.faits.filter(f => f.type === "facteur_episode" && f.marque);
  verifier(!futur || fe.every(f => !/ de 0 à 0 /.test(f.fait)), futur + " lignes sans consommation après la fin des données : exclues des plages habituelles");
  const [de0, a0] = [etat.de, etat.a];
  etat.de = Date.UTC(2024, 0, 1);
  const D24 = testDossier("année 2024");
  verifier(D24.faits.filter(f => f.type === "facteur").length === m.facteurs.length, "sur 2024, chaque facteur est comparé à sa plage habituelle");
  await revLancer();
  const e24 = revEtat(rev.revue);
  verifier(e24.total > 60 && e24.ok === e24.total && e24.conformes === 7 && /01\/01\/2024/.test(rev.revue.sections[0].texte), "chaîne de démonstration sur 2024 : " + e24.total + " nombres, tous retrouvés, sept verdicts conformes");
  [etat.de, etat.a] = [de0, a0]; rev.revue = null; rev.journal = [];

  /* ---- 3. Chaîne complète en mode démonstration ---- */
  let t = page();
  verifier(/1\. Dossier de faits/.test(t) && /4\. Validation et export/.test(t) && /script de démonstration/.test(t), "la page se rend avant toute rédaction");
  verifier(boutons("Imprimer ou enregistrer en PDF").length === 0 && /Rien à relire/.test(t), "pas d'export proposé sans brouillon");
  cliquer(boutons("Rédiger la revue")[0]);
  verifier(rev.enCours && boutons("Arrêter").length === 1, "la rédaction se voit et peut s'arrêter");
  await repos();
  const v = rev.revue;
  let E = revEtat(v);
  verifier(v && v.sections.length === 7 && v.sections.every(s => s.texte.length > 40), "démonstration : sept sections rédigées" + (rev.erreur ? " (" + rev.erreur + ")" : ""));
  verifier(E.total > 60 && E.ok === E.total && !E.absents && !E.hors, "démonstration : " + E.total + " nombres contrôlés, tous retrouvés dans un fait cité par leur phrase (hors : " + E.hors + ", absents : " + E.absents + ")");
  verifier(v.verif.sections.length === 7 && E.conformes === 7 && !E.sig.length, "démonstration : sept verdicts conformes, aucun signalement");
  verifier(v.sections.every(s => /\[[A-Z]\d+\]/.test(s.texte)) && E.controles.every(c => c.renvois.every(r => !r.inconnus.length)), "chaque section cite des faits, tous connus");
  verifier(/hypothèse/.test(v.sections[0].texte) && /hypothèses/.test(v.sections[6].texte), "les causes sont présentées comme des hypothèses");
  verifier(rev.journal.length === 3 && rev.journal.every(e => e.etat === "fait") && rev.journal[0].detail.includes(JSON.stringify(v.dossier.faits)), "journal : trois étapes faites, message exact consultable");
  t = page();
  verifier(REV_SECTIONS.every((s, k) => t.includes((k + 1) + ". " + s[1])) && /Brouillon non validé/.test(t) && /le script de démonstration \(sans IA\)/.test(t), "la page montre les sections, le brouillon et son rédacteur");
  const doc = () => revEnTexte(revDocument(v, revEtat(v)));
  verifier(/Rédaction : par le script de démonstration/.test(doc()) && /Contrôle des nombres : \d+ nombres contrôlés/.test(doc()) && /Vérification par un second agent : par le script/.test(doc()) && /Données : Classeur/.test(doc()) && /30\/09\/2024/.test(doc()) && /148,8 €\/MWh/.test(doc()) && /Annexe/.test(doc()),
    "le document exporté dit qui a rédigé, le résultat des contrôles, la date des données et les hypothèses de valorisation");
  // validation humaine
  verifier(boutons("Valider la revue")[0].disabled && /Saisissez d'abord le nom du relecteur/.test(t), "validation impossible sans nom de relecteur, et la raison est dite");
  const champ = trouver(app, n => n.tagName === "INPUT" && n.attrs.type === "text")[0];
  champ.value = "A. Relecteur"; champ.dispatchEvent({ type: "input", target: champ });
  verifier(rev.relecteur === "A. Relecteur" && !boutons("Valider la revue")[0].disabled, "validation possible dès que le nom est saisi");
  cliquer(boutons("Valider la revue")[0]);
  verifier(v.valide && /Statut : validée par A\. Relecteur/.test(doc()) && !/Brouillon non validé/.test(doc()), "la validation s'inscrit dans le document");
  let imprime = 0; window.print = () => { imprime++; };
  cliquer(boutons("Imprimer ou enregistrer en PDF")[0]);
  verifier(imprime === 1, "le bouton d'impression appelle window.print()");
  let copie = ""; navigator.clipboard.writeText = async x => { copie = x; };
  cliquer(boutons("Copier")[0]); await new Promise(ok => setTimeout(ok, 5));
  verifier(copie === doc().trim() && /^Revue énergétique \(ISO 50001\) du 03\/04\/2023 au 30\/09\/2024\n/.test(copie) && copie.includes("\n1. Synthèse\n") && /\nR1 : « /.test(copie.split("Annexe")[1]), "« Copier » place le document en texte brut dans le presse-papiers, annexe des faits cités comprise");
  // erreur introduite : les deux contrôles l'attrapent
  cliquer(boutons("Introduire une erreur")[0]); await repos();
  E = revEtat(v);
  const sp = v.sections.find(s => s.id === v.piege.id), marque = trouver(app, n => n.tagName === "SPAN" && n.classList.contains("absent"));
  verifier(v.piege && v.piege.id === "performance" && sp.texte.includes(v.piege.apres) && !v.dossier.faits.some(f => f.fait.includes(v.piege.apres)), "une erreur est introduite dans « performance » : « " + (v.piege || {}).avant + " » devient « " + (v.piege || {}).apres + " »");
  verifier(E.absents === 1 && E.ok === E.total - 1, "contrôle de la page : exactement un nombre introuvable");
  verifier(marque.length === 1 && marque[0].textContent === v.piege.apres && sp.texte.indexOf(v.piege.apres) === E.controles[2].nombres.find(x => x.etat === "absent").i, "le nombre altéré est signalé dans le texte, à l'endroit exact");
  verifier(v.verif.sections[2].verdict === "à corriger" && E.conformes === 6, "second contrôle : le vérificateur rend « à corriger » pour cette section seulement");
  verifier(E.ouverts.length === 2 && !v.valide && boutons("Valider la revue")[0].disabled, "deux signalements ouverts (page et vérificateur) : la validation tombe et se bloque");
  verifier(/2 signalement\(s\) ouvert\(s\)/.test(doc()) && doc().includes(v.piege.apres) && /Signalements : 2 ouvert/.test(doc()), "tant que des signalements restent ouverts, l'export le mentionne");
  verifier(trouver(revDocument(v, E), n => n.tagName === "MARK" && n.textContent === v.piege.apres).length === 1, "le nombre en cause est marqué dans le document");
  // la personne lève les signalements, puis corrige
  for (const b of boutons("Lever")) cliquer(boutons("Lever")[0]);
  E = revEtat(v);
  verifier(!E.ouverts.length && E.sig.length === 2 && /2 levé\(s\) par le relecteur/.test(doc()) && !/ce document n'est pas prêt/.test(doc()), "signalements levés à la main : plus de blocage, mais le document le compte");
  cliquer(boutons("Rouvrir")[0]);
  verifier(revEtat(v).ouverts.length === 1, "un signalement levé peut être rouvert");
  cliquer(boutons("Retirer l'erreur introduite")[0]); await repos();
  E = revEtat(v);
  verifier(!v.piege && !E.absents && E.conformes === 7 && !E.ouverts.length && sp.texte === sp.origine, "erreur retirée : le texte d'origine revient, les deux contrôles repassent");
  // correction à la main
  cliquer(trouver(app, n => n.tagName === "BUTTON" && n.textContent === "Corriger le texte")[3]);
  const zone = trouver(app, n => n.tagName === "TEXTAREA")[0];
  verifier(zone && zone.value === v.sections[3].texte, "la section s'ouvre en correction avec son texte");
  zone.value = v.sections[3].texte + "\nLa surconsommation totale atteint 7 777 MWh [D1]."; zone.dispatchEvent({ type: "input", target: zone });
  cliquer(boutons("Enregistrer la correction")[0]);
  E = revEtat(v);
  verifier(E.absents === 1 && E.ouverts.length === 1 && /7 777 MWh/.test(E.ouverts[0].texte) && v.verif.sections[3].perime && /corrigée à la main/.test(texteDe(app)) && /texte modifié depuis la vérification/.test(texteDe(app)), "une correction humaine est recontrôlée par la page ; le verdict du second agent est marqué périmé");
  verifier(/1 section\(s\) corrigée\(s\) à la main/.test(doc()), "le document dit qu'une section a été corrigée à la main");
  cliquer(boutons("Relancer la vérification")[0]); await repos();
  verifier(v.verif.sections[3].verdict === "à corriger" && !v.verif.sections[3].perime, "la vérification relancée voit la correction fautive");
  verifier(__reseau.length === reseau0, "aucun appel réseau en mode démonstration");

  /* ---- 4. Un rédacteur (faux modèle) qui invente un chiffre et une cause ---- */
  const demandes = [];
  const faux = fauxModele((requete, tour) => {
    demandes.push(requete);
    const faits = JSON.parse(/^Dossier de faits[^\n]*\(JSON\) : (.*)$/m.exec(requete.messages[0].content)[1]);
    if (requete.tools[0].name === "rendre_revue") {
      const sections = Object.entries(revTexteDemo(faits)).map(([id, texte]) => ({ id, texte: id === "derives" ? texte + "\nLe site a aussi économisé 999,9 MWh grâce au remplacement de la chaudière [D2]." : texte }));
      if (tour === 1) return [{ type: "text", text: "RAISONNEMENT DU RÉDACTEUR" }, { type: "tool_use", id: "a1", name: "rendre_revue", input: { sections: sections.slice(0, 6) } }];     // d'abord une revue incomplète
      return [{ type: "tool_use", id: "a2", name: "rendre_revue", input: { sections } }];
    }
    return [{ type: "tool_use", id: "b1", name: "rendre_verdicts", input: { sections: REV_IDS.map(id => ({ id, verdict: "conforme", resume: id === "derives" ? "Un fait est inventé." : "Rien à signaler.",
      points: id === "derives" ? [{ gravite: "bloquant", constat: "Le remplacement d'une chaudière n'est dans aucun fait." }, { gravite: "mineur", constat: "Phrase longue." }] : [] })) } }];
  });
  await revLancer({ demo: false, appeler: faux, signature: () => "faux modèle" });
  const w = rev.revue;
  E = revEtat(w);
  verifier(!rev.erreur && w && w.redacteur === "faux modèle" && demandes.length === 3, "faux modèle : une revue incomplète est redemandée, puis acceptée (3 appels)" + (rev.erreur ? " : " + rev.erreur : ""));
  verifier(demandes[1].messages.length >= 3 && demandes[1].messages[2].content[0].is_error && /actions/.test(demandes[1].messages[2].content[0].content), "le défaut de format est renvoyé au modèle, la section manquante nommée");
  verifier(E.absents === 1 && E.sig.some(x => x.cle === "n|derives|999,9MWh") && E.controles[3].nombres.filter(x => x.etat === "absent")[0].ecrit === "999,9", "le chiffre inventé est attrapé par le contrôle de la page");
  page();
  const inv = trouver(app, n => n.tagName === "SPAN" && n.classList.contains("absent"));
  verifier(inv.length === 1 && inv[0].textContent === "999,9" && inv[0].parentNode.textContent.includes("grâce au remplacement"), "il est signalé dans le texte, à l'endroit exact");
  verifier(w.verif.sections[3].verdict === "à corriger" && E.sig.some(x => /chaudière/.test(x.texte)) && !E.sig.some(x => /Phrase longue/.test(x.texte)) && E.ouverts.length === 2, "le verdict du vérificateur devient un signalement ; un point mineur n'en est pas un");
  verifier(/Rédaction : par faux modèle/.test(revEnTexte(revDocument(w, E))) && /2 signalement\(s\) ouvert\(s\)/.test(revEnTexte(revDocument(w, E))), "le document nomme le modèle rédacteur et mentionne les signalements");
  const rq = demandes[0], vq = demandes[2];
  verifier(typeof rq.system === "string" && /recopié d'un fait/.test(rq.system) && rq.tools.length === 1 && rq.model === IA.modele && rq.messages[0].content.includes(JSON.stringify(w.dossier.faits)), "le rédacteur reçoit la consigne, un seul outil et le dossier de faits");
  verifier(!JSON.stringify(rq).includes(etat.fichier) && !JSON.stringify(vq).includes(etat.fichier), "le nom du fichier n'est envoyé ni au rédacteur ni au vérificateur");
  verifier(vq.messages[0].role === "user" && vq.messages.length === 2 && !JSON.stringify(vq).includes("RAISONNEMENT") && vq.messages[0].content.includes("999,9 MWh") && vq.tools[0].name === "rendre_verdicts" && /n'as pas vu son raisonnement/.test(vq.system), "le vérificateur travaille dans une conversation séparée : le texte et le dossier, pas le raisonnement du rédacteur");
  // un modèle qui ne rend jamais le bon format : la chaîne s'arrête proprement
  await revLancer({ demo: false, appeler: fauxModele(() => [{ type: "text", text: "Voici la revue." }]), signature: () => "faux modèle" });
  verifier(/format demandé/.test(rev.erreur || "") && !rev.revue && !rev.enCours && rev.journal.some(e => e.etat === "echec"), "sans réponse au bon format, pas de brouillon et une erreur claire");
  // arrêt en cours de route
  const lance = revLancer(); rev.arret.abort(); await lance;
  verifier(/Arrêté/.test(rev.erreur || "") && !rev.revue && !rev.enCours, "l'arrêt interrompt la rédaction");

  /* ---- 5. Ce qui quitte le poste : rien sans les deux accords ---- */
  agent.demo = false; agent.accord = false; t = page();
  verifier(boutons("Rédiger la revue")[0].disabled && /Réglez d'abord le fournisseur/.test(t) && /Avant le premier envoi : ce que la revue fait quitter ce poste/.test(t) && /le dossier de faits de l'étape 1/.test(t), "hors démonstration : l'avis propre au module s'affiche, et le lancement est bloqué");
  await revLancer();
  verifier(/Réglez d'abord/.test(rev.erreur || "") && __reseau.length === reseau0, "sans accord de la page Instruction ni clé : rien ne part");
  agent.accord = agent.fournisseur; champDe().value = "cle-de-test";
  await revLancer();
  verifier(/Autorisez d'abord l'envoi du dossier/.test(rev.erreur || "") && __reseau.length === reseau0, "l'accord de la page Instruction ne suffit pas : rien ne part sans l'accord propre à la revue");
  page(); cliquer(trouver(app, n => n.tagName === "BUTTON" && /^J'autorise l'envoi du dossier de faits/.test(n.textContent))[0]);
  verifier(rev.accord === agent.fournisseur && !revBlocage(), "l'accord se donne par un clic sur l'avis");
  const envois = [], vraiAppel = appelGemini, vraiAppelA = appelAnthropic;
  appelGemini = appelAnthropic = requete => { envois.push(requete); return revModeleDemo(requete, rev.arret.signal); };          // la fonction d'envoi réelle est remplacée : aucun envoi n'est tenté
  await revLancer();
  appelGemini = vraiAppel; appelAnthropic = vraiAppelA;
  verifier(envois.length === 2 && envois[0].messages[0].content.includes("Dossier de faits de la revue") && !JSON.stringify(envois).includes(etat.fichier) && !JSON.stringify(envois).includes("cle-de-test") && rev.revue && !rev.revue.demo,
    "avec les deux accords, la fonction d'envoi d'origine est appelée deux fois (rédaction, vérification), avec le dossier, sans le nom du fichier ni la clé");
  verifier(/Rédaction : par Gemini/.test(revEnTexte(revDocument(rev.revue, revEtat(rev.revue)))) && page() && boutons("Introduire une erreur").length === 0, "hors démonstration : le document nomme le modèle, et le bouton d'erreur volontaire n'est pas proposé");
  champDe().value = ""; agent.accord = false; rev.accord = false; agent.demo = true; rev.erreur = null;

  /* ---- 6. Anglais ---- */
  LANGUE = "en"; CACHE_TR.clear(); cacheDerives = null;
  t = page();
  verifier(/1\. Fact file/.test(t) && /Write the review/.test(t) && /4\. Validation and export/.test(t), "la page se rend en anglais");
  await revLancer();
  const u = rev.revue;
  E = revEtat(u);
  verifier(u && E.total > 60 && E.ok === E.total && E.conformes === 7, "chaîne de démonstration en anglais : " + E.total + " nombres, tous retrouvés (absents : " + E.absents + ", hors : " + E.hors + "), sept verdicts conformes");
  verifier(/€\d/.test(u.sections[2].texte) && /\d%/.test(u.sections[2].texte) && /W\d\d 2024/.test(u.sections[3].texte) && !/\d,\d [GMk]Wh/.test(u.sections[2].texte), "les faits anglais portent les nombres, les euros et les semaines à l'anglaise");
  await revPieger();
  verifier(revEtat(u).absents === 1 && u.verif.sections.some(x => x.verdict === "à corriger"), "erreur introduite en anglais : attrapée par les deux contrôles");
  let brut = page() + revEnTexte(revDocument(u, revEtat(u)));
  for (const n of trouver(app, x => x.tagName === "PRE")) brut = brut.split(n.textContent).join("");       // le message exact transmis garde sa consigne en français, comme les agents d'origine
  for (const n of u.dossier.noms.concat(etat.fichier)) brut = brut.split(n).join("");
  const restes = [...new Set(brut.match(/[A-Za-zÀ-ÿ']*[àâçéèêëîïôùûüœ«»][A-Za-zÀ-ÿ']*/g) || [])];
  verifier(restes.length === 0, "aucun texte français ne reste sur la page ni dans le document en anglais" + (restes.length ? " : " + restes.slice(0, 12).join(", ") : ""));
  verifier(/Written: by the demo script \(no AI\)/.test(brut) && /open flag\(s\)/.test(brut), "document anglais : rédacteur et signalements");
  LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null;
  t = page();
  verifier(!rev.revue && /Rédiger la revue/.test(t), "retour au français : le brouillon rédigé en anglais est retiré");

  /* ---- 7. Les autres pages, un nouveau classeur, le réseau ---- */
  for (const o of ONGLETS) { etat.onglet = o[0]; rendre(); verifier(texteDe(app).length > 200, "la page « " + o[0] + " » se rend toujours"); }
  verifier(PAGES.some(g => g.groupe === "Agents" && g.pages.some(p => p[0] === "revue")) && ICONES.revue, "la page est rangée dans le groupe « Agents », avec son icône");
  await revLancer(); verifier(!!rev.revue, "brouillon en place avant rechargement");
  charger(grillesChargees, d1904Charge, etat.fichier, null);
  verifier(!rev.revue && !rev.journal.length && rev.accord === false, "un nouveau classeur remet le module à zéro");
  verifier(__reseau.length === 0, "aucun appel réseau pendant tout le test");
}
