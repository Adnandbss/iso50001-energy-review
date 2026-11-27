/* Tests du module « Veille ». Exécutés par outillage/banc.js dans la portée du script, après le chargement du classeur réel. */
verifier.bavard = false;                                                // seuls les échecs et les titres de section s'affichent
const app_ = document.getElementById("app");
const titre = t => console.log("— " + t);
const pause = ms => new Promise(ok => setTimeout(ok, ms));
async function attendreQue(cond, quoi, ms = 15000) { const t0 = Date.now(); while (!cond()) { if (Date.now() - t0 > ms) throw new Error("délai dépassé : " + quoi); await pause(15); } }
const boutons = texte => trouver(app_, n => n.tagName === "BUTTON" && n.textContent.includes(texte));
const voir = () => { etat.onglet = "veille"; rendre(); return texteDe(app_); };      // l'adresse « veille » mène à la page Dérives (module idee-13-derives)
const ouvrirDerive = cle => { drv.ouverte = cle; drv.limite = Infinity; return voir(); };       // ouvre le détail d'une dérive, sous sa ligne
const recharger = (grilles, figee) => charger(grilles || grillesChargees, d1904Charge, etat.fichier, figee || null);
const memoire = () => JSON.parse(localStorage.getItem(VEI_CLE) || "null");
const file_ = () => veiTrier(veiLignes().filter(l => l.aTraiter), vei.regle);
/* épisode construit, de la même forme que ceux de derives() */
function epis(serie, groupe, energie, debut, fin, n, mwh, zmax, ouvert) {
  return { analyse: { serie: { pas: "week", nom: serie, groupe, energie } }, serie, groupe, energie, debut: Date.parse(debut), fin: Date.parse(fin), libDebut: debut, libFin: fin, n,
    sens: mwh > 0 ? "surconsommation" : "économie", ecart: mwh * 1e6, ref: Math.abs(mwh) * 1e7, pct: mwh / (Math.abs(mwh) * 10), zmax, iFin: 0, ouvert: !!ouvert };
}
const ligne = (ep, plus) => Object.assign({ ep, cle: veiCle(ep), neuf: false, doublon: null, enjeu: veiEnjeu(ep, vei.regle) }, plus || {});

async function test() {
  const ecritures = [], poserOrigine = localStorage.setItem;
  localStorage.setItem = (k, v) => { ecritures.push(k); poserOrigine(k, v); };
  const complet = grillesChargees, nomsSeries = etat.modele.series.map(sr => sr.nom), nbEp = derives().episodes.length;

  titre("1. Premier passage (chargement fait par le banc)");
  verifier(ONGLETS.some(o => o[0] === "veille") && PAGES_MODULES.veille === drvPage && !PAGES.some(g => g.pages.some(p => p[0] === "veille")), "l'adresse « veille » mène à la page Dérives, qui remplace la page Veille dans le menu");
  verifier(vei.comparaison && vei.comparaison.premier === true, "premier passage reconnu");
  verifier(vei.comparaison.nouveau.length === nbEp && nbEp > 0, "au premier passage, tous les épisodes sont nouveaux (" + nbEp + ")");
  const brut = localStorage.getItem(VEI_CLE) || "";
  verifier(brut.length > 0, "le relevé du premier passage est écrit en mémoire locale");
  verifier(nomsSeries.every(n => !brut.includes(n)) && etat.modele.energies.every(e => !brut.includes(e)), "la mémoire ne contient ni nom de série ni nom d'énergie");
  const J0 = memoire().jeux[vei.jeu];
  verifier(J0 && J0.avant === null && Object.keys(J0.courant.eps).length === nbEp, "la mémoire garde un relevé par épisode, sans relevé précédent");
  verifier(Object.values(J0.courant.eps).every(v => Array.isArray(v) && v.length === 4 && Number.isInteger(v[0]) && v[1] < 1000 && /^\d{4}-\d{2}-\d{2}$/.test(v[2]) && (v[3] === 0 || v[3] === 1)),
    "chaque relevé d'épisode = [périodes, |z| max, date de fin, en cours] : aucune valeur de consommation");
  verifier(new Set(derives().episodes.map(veiCle)).size === nbEp, "les empreintes des épisodes sont toutes distinctes");
  recharger();
  verifier(vei.comparaison.premier === true && vei.comparaison.nouveau.length === nbEp, "recharger le même classeur garde la même comparaison (toujours un premier passage)");

  titre("2. Comparaison entre deux chargements, cas construit");
  const A1 = epis("Four", "ues", "Gaz", "2024-06-03", "2024-06-17", 3, 30, 2.5, true), B1 = epis("Froid", "ues", "Électricité", "2024-06-10", "2024-06-17", 2, 12, 3.4, true);
  const C1 = epis("Four", "ues", "Gaz", "2024-01-08", "2024-01-22", 3, -9, 2.1, false), D1 = epis("Air", "ues", "Électricité", "2024-03-04", "2024-03-04", 1, 5, 3.2, false);
  const A2 = epis("Four", "ues", "Gaz", "2024-06-03", "2024-07-01", 5, 55, 2.5, true), B2 = epis("Froid", "ues", "Électricité", "2024-06-10", "2024-06-24", 3, 15, 3.4, false);
  const E2 = epis("Air", "ues", "Électricité", "2024-06-24", "2024-07-01", 2, 8, 3.1, true), F2 = epis("Froid", "ues", "Électricité", "2024-06-10", "2024-06-24", 3, -15, 3.4, false);
  const p1 = veiComparer(null, [A1, B1, C1, D1]);
  verifier(p1.premier && p1.nouveau.length === 4 && !p1.aggrave.length && !p1.clos.length && p1.disparus === 0, "premier passage : 4 nouveaux, rien d'autre");
  const r1 = veiReleve([A1, B1, C1, D1], Date.parse("2024-06-17")), p2 = veiComparer(r1, [A2, B2, C1, E2]);
  verifier(!p2.premier && p2.nouveau.length === 1 && p2.nouveau[0] === E2, "second passage : l'épisode en plus est le seul nouveau");
  verifier(p2.aggrave.length === 1 && p2.aggrave[0] === A2 && p2.etats.get(veiCle(A2)).plus === 2, "l'épisode toujours en cours, plus long de 2 périodes, est « aggravé »");
  verifier(p2.clos.length === 1 && p2.clos[0] === B2, "l'épisode qui était en cours et ne l'est plus est « clos depuis »");
  verifier(p2.connu.length === 1 && p2.connu[0] === C1 && p2.disparus === 1, "un épisode clos déjà vu est « connu » ; un épisode qui n'existe plus est compté comme disparu");
  verifier(veiCle(F2) !== veiCle(B2), "même série et même début mais sens opposé : ce n'est pas le même épisode");
  verifier(veiComparer(r1, [A1, B1, C1, D1]).encours.length === 2, "sans changement, les épisodes en cours sont « inchangés », pas « aggravés »");
  verifier(veiComparer(r1, [epis("Four", "ues", "Gaz", "2024-06-03", "2024-06-17", 3, 30, 3.9, true)]).aggrave.length === 1, "même durée mais |z| plus fort : « aggravé »");
  verifier(veiReleve([A1, B1], 0).sig !== veiReleve([A2, B1], 0).sig && veiReleve([A1, B1], 0).sig === veiReleve([B1, A1], 0).sig, "la signature d'un relevé change avec les épisodes, pas avec leur ordre");
  verifier(!JSON.stringify(r1).includes("Four") && !/30000000|55000000/.test(JSON.stringify(r1)), "un relevé ne contient ni nom de série ni écart");

  titre("3. Comparaison entre trois chargements réels (classeur tronqué, puis complet)");
  const dates = etat.modele.dates, croissant = dates.every((t, i) => !i || t >= dates[i - 1]);
  verifier(croissant, "les dates du classeur sont croissantes (hypothèse de la troncature)");
  const tronquer = jusque => Object.assign({}, complet, { CONSO: complet.CONSO.slice(0, 2 + dates.filter(t => t <= Date.parse(jusque)).length) });
  const photo = () => new Map(derives().episodes.map(ep => [veiCle(ep), { n: ep.n, ouvert: ep.ouvert, z: ep.zmax }]));
  localStorage.removeItem(VEI_CLE);
  recharger(tronquer("2024-08-18"));
  const ph1 = photo();
  verifier(etat.modele.fin <= Date.parse("2024-08-18") && vei.comparaison.premier && vei.comparaison.nouveau.length === ph1.size, "chargement 1 (données jusqu'à mi-août) : premier passage, tout est nouveau");
  recharger(tronquer("2024-09-22"));
  const ph2 = photo(), C2 = vei.comparaison, attendu = (avant, apres) => { let nv = 0, ag = 0, cl = 0, di = 0;
    for (const [k, e] of apres) { const a = avant.get(k); if (!a) nv++; else if (e.ouvert && (e.n > a.n || Math.round(e.z * 10) / 10 > Math.round(a.z * 10) / 10 + 0.05)) ag++; else if (!e.ouvert && a.ouvert) cl++; }
    for (const k of avant.keys()) if (!apres.has(k)) di++;
    return { nv, ag, cl, di }; };
  const a2 = attendu(ph1, ph2);
  verifier(!C2.premier && C2.avant && C2.avant.fin <= "2024-08-18", "chargement 2 : comparé au relevé du chargement 1");
  verifier(C2.nouveau.length === a2.nv && C2.aggrave.length === a2.ag && C2.clos.length === a2.cl && C2.disparus === a2.di, "chargement 2 : nouveaux, aggravés, clos et disparus conformes au calcul indépendant (" + JSON.stringify(a2) + ")");
  verifier(a2.nv >= 1 && a2.cl >= 1, "chargement 2 : au moins un épisode nouveau et un épisode clos depuis");
  recharger(complet);
  const ph3 = photo(), C3 = vei.comparaison, a3 = attendu(ph2, ph3);
  verifier(C3.nouveau.length === a3.nv && C3.aggrave.length === a3.ag && C3.clos.length === a3.cl && C3.disparus === a3.di, "chargement 3 : conforme au calcul indépendant (" + JSON.stringify(a3) + ")");
  verifier(a3.ag >= 1 && C3.aggrave.every(ep => ep.ouvert), "chargement 3 : au moins une dérive en cours aggravée");
  const txt3 = voir();
  verifier(txt3.includes("Depuis le relevé du ") && !txt3.includes("Premier passage"), "le constat annonce ce qui a changé depuis le relevé précédent");
  recharger(complet);
  verifier(vei.comparaison.nouveau.length === a3.nv && vei.comparaison.aggrave.length === a3.ag, "recharger le même classeur ne fait pas disparaître les nouveautés");
  const f3 = file_(), nbNeufs = f3.filter(l => l.neuf && !l.doublon).length;
  verifier(nbNeufs >= 1 && f3.slice(0, nbNeufs).every(l => l.neuf && !l.doublon) && f3.filter(l => l.neuf).length === a3.nv + a3.ag, "avec la règle par défaut, les nouveautés (hors doublons Site / UES) sont en tête de file");
  const nd = f3.filter(l => !l.doublon).length;
  verifier(f3.slice(0, nd).every(l => !l.doublon) && f3.slice(nd).every(l => l.doublon) && nd < f3.length, "les épisodes d'UES qui recoupent un épisode du Site sont en fin de file");
  localStorage.removeItem(VEI_CLE); recharger(complet);
  verifier(vei.comparaison.premier, "mémoire effacée : retour au premier passage");

  titre("4. Tri sur un cas construit");
  const regle0 = Object.assign({}, vei.regle);
  Object.assign(vei.regle, VEI_REGLE);
  const e1 = epis("Atelier", "ues", "Électricité", "2024-01-01", "2024-02-05", 6, 100, 3.0, false), e2 = epis("Général", "site", "Électricité", "2024-06-03", "2024-06-10", 2, 10, 4.0, true);
  const e3 = epis("Général gaz", "site", "Gaz", "2024-03-04", "2024-04-01", 5, -500, 2.2, false), e4 = epis("Froid", "ues", "Électricité", "2024-06-10", "2024-06-10", 1, 8, 9.0, true);
  const e5 = epis("Réseau", "ues", "Vapeur", "2024-02-05", "2024-02-19", 3, 1000, 5.0, false);
  const dbl = veiDoublons([e1, e2, e3, e4, e5]);
  verifier(dbl.size === 1 && dbl.get(e4) === e2, "doublon : l'UES qui recoupe l'épisode du Site (même énergie, même sens) est signalée, et elle seule");
  verifier(veiDoublons([e2, epis("Froid", "ues", "Électricité", "2024-06-10", "2024-06-10", 1, -8, 9, true), epis("Chaud", "ues", "Gaz", "2024-06-10", "2024-06-10", 1, 8, 9, true), epis("Froid", "ues", "Électricité", "2024-06-17", "2024-06-24", 2, 8, 9, true)]).size === 0,
    "pas de doublon si le sens, l'énergie ou les dates diffèrent");
  const j1 = veiEnjeu(e1, vei.regle), j2 = veiEnjeu(e2, vei.regle), j5 = veiEnjeu(e5, vei.regle);
  verifier(Math.abs(j1.cout - 100 * valoDe("Électricité").prix) < 1e-6 && j1.wh3 === null && Math.abs(j1.valeur - j1.cout) < 1e-6, "enjeu d'un épisode clos : coût de l'écart, sans projection");
  verifier(Math.abs(j2.wh3 - 5e6 * 13) < 1 && Math.abs(j2.valeur - (10 + 65) * valoDe("Électricité").prix) < 1e-6, "enjeu d'un épisode en cours : coût constaté + projection à 3 mois (13 semaines au rythme moyen)");
  verifier(j5.cout === null && j5.valeur === null, "énergie sans hypothèse de prix : enjeu non chiffré");
  const L = () => [e1, e2, e3, e4, e5].map(ep => ligne(ep, { doublon: dbl.get(ep) || null })), ordre = (r, lignes) => veiTrier(lignes || L(), r).map(l => l.ep);
  const memes = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  verifier(memes(ordre(VEI_REGLE), [e2, e1, e5, e3, e4]), "règle par défaut : en cours, puis surconsommations par coût (non chiffré après), puis économies, doublon en dernier");
  const plat = { critere: "cout", projection: false, doublons: false, nouveautes: false, enCours: false, sur: false };
  vei.regle.projection = false;
  verifier(memes(ordre(plat), [e3, e1, e2, e4, e5]), "sans priorité : coût absolu décroissant, non chiffré en dernier");
  vei.regle.projection = true;
  verifier(memes(ordre(Object.assign({}, plat, { projection: true })).slice(0, 4), [e3, e4, e1, e2]) && Math.abs(veiEnjeu(e4, vei.regle).valeur - (8 + 8 * 13) * valoDe("Électricité").prix) < 1e-6,
    "avec la projection à 3 mois, un épisode en cours d'une seule période (8 MWh par semaine) passe devant un épisode clos de 100 MWh");
  vei.regle.critere = "z";
  verifier(memes(ordre(Object.assign({}, plat, { critere: "z" })), [e4, e5, e2, e1, e3]), "critère « ampleur » : |z| max décroissant");
  vei.regle.critere = "co2";
  verifier(ordre(Object.assign({}, plat, { critere: "co2" }))[0] === e3 && Math.abs(veiEnjeu(e3, vei.regle).co2 + 500e3 * valoDe("Gaz").fe) < 1e-6, "critère « CO₂e » : émissions = écart × facteur d'émission");
  vei.regle.critere = "cout";
  const avecNeuf = L(); avecNeuf.find(l => l.ep === e3).neuf = true;
  verifier(ordre(VEI_REGLE, avecNeuf)[0] === e3, "une nouveauté passe avant le reste, même s'il s'agit d'une économie close");
  verifier(/1\. .*Site.*2\. .*3\. .*4\. .*5\. /.test(veiPhraseRegle(VEI_REGLE)) && veiPhraseRegle(plat).startsWith("Règle appliquée") && !/Site/.test(veiPhraseRegle(plat)), "la règle affichée suit les réglages");

  titre("5. Enjeu total sans double compte");
  const e6 = epis("Chaufferie", "ues", "Gaz", "2024-05-06", "2024-05-13", 2, 10, 3, false);
  const tot = veiTotal([e1, e2, e3, e4, e6].map(ep => ligne(ep)), new Set(["Électricité"]));
  verifier(tot.n === 2 && tot.exclus === 2 && Math.abs(tot.wh - 20e6) < 1, "cas construit : le Site compte seul pour son énergie (10 MWh), l'UES sans compteur de Site compte (10 MWh) : 20 MWh, pas 128");
  verifier(Math.abs(tot.cout - (10 * valoDe("Électricité").prix + 10 * valoDe("Gaz").prix)) < 1e-6 && Math.abs(tot.cout3 - 65 * valoDe("Électricité").prix) < 1e-6, "cas construit : coût total et projection à 3 mois sans double compte");
  const D = derives(), avecSite = new Set(D.analyses.filter(A => A.serie.groupe === "site").map(A => A.serie.energie));
  const reel = veiTotal(veiLignes(), avecSite), attenduWh = somme(D.episodes.filter(ep => ep.ecart > 0 && (ep.groupe === "site" || !avecSite.has(ep.energie))).map(ep => ep.ecart));
  verifier(Math.abs(reel.wh - attenduWh) < 1 && reel.exclus > 0 && reel.wh < somme(D.episodes.filter(ep => ep.ecart > 0).map(ep => ep.ecart)), "classeur réel : total = épisodes de niveau Site, inférieur à la somme de tous les épisodes (" + reel.exclus + " exclus)");
  verifier(veiLignes().some(l => l.doublon) && veiLignes().filter(l => l.doublon).every(l => l.ep.groupe === "ues" && l.doublon.groupe === "site" && l.doublon.energie === l.ep.energie), "classeur réel : des épisodes d'UES sont signalés comme recoupant un épisode du Site");
  etat.onglet = "derives"; rendre();
  const tuileDetection = trouver(app_, n => n.classList.contains("tuile") && n.textContent.includes("Surconsommations"))[0];
  verifier(tuileDetection && tuileDetection.textContent.includes(fmtEnergie(reel.wh, true)), "le total de la veille est celui de la page Détection (" + fmtEnergie(reel.wh, true) + ")");
  let page = voir();
  verifier(page.includes(fmtEuros(reel.cout, true)) && page.includes("sans double compte"), "la page affiche l'enjeu total sans double compte");
  Object.assign(vei.regle, regle0);

  titre("6. Série d'instructions en démonstration");
  verifier(agent.demo === true, "le mode par défaut est la démonstration");
  veiRegler("n", 3);
  const cibles = file_().slice(0, 3).map(l => l.cle), marqueur = h("div", null, "marqueur de la page Instruction");
  let pr = veiLancerSerie();
  verifier(agent.enCours === true && vei.serie.active, "la série prend le verrou de l'agent (agent.enCours)");
  const arret0 = agent.arret;
  await veiLancerSerie(); await lancerEvaluation(); await lancerInstruction();
  verifier(agent.arret === arret0 && agent.evaluation === null && vei.serie.cles.length === 3, "pendant la série, ni une seconde série, ni une évaluation, ni une instruction ne démarrent");
  verifier(boutons("Arrêter la série").length === 1 && !boutons("Instruire les").length, "pendant la série, le bouton devient « Arrêter la série »");
  aller("agent"); verifier(texteDe(app_).includes("Épisode 1 sur 3"), "la page Instruction montre le journal de la série en cours"); aller("veille");
  await pr;
  verifier(agent.enCours === false && agent.arret === null && !vei.serie.active, "à la fin, le verrou est rendu");
  const res3 = cibles.map(c => vei.resultats.get(c));
  verifier(res3.every(r => r && r.etat === "fiche" && r.res.fiche && r.demo), "3 épisodes instruits, 3 fiches, dans l'ordre de la file");
  verifier(res3.every(r => r.jugement && r.jugement.verdict && r.jugement.verdict.verdict === "conforme" && /script, sans IA/.test(r.jugement.verdict.resume)), "chaque fiche est relue par jugerFiche, le juge étant joué par un script qui le dit");
  verifier(res3.every(r => r.mesures.identique && r.mesures.ctrl.nbAbsents === 0 && r.tours === 4), "contrôles de la page : nombres retrouvés, écart identique, 4 tours");
  verifier(__reseau.length === 0, "aucun appel réseau pendant la série en démonstration");
  page = voir();
  verifier(page.includes("Série terminée : 3 fiches sur 3.") && cibles.every(c => texteDe(app_.querySelector('[data-cle="' + c + '"]')).includes("Instruite")), "bilan de la série, et les 3 dérives marquées « Instruite » dans la liste");
  zoneFiche.replaceChildren(marqueur);
  const voirFiche = trouver(app_, n => n.tagName === "BUTTON" && n.textContent === "Voir la fiche");
  verifier(voirFiche.length === 3, "un bouton « Voir la fiche » par dérive instruite");
  cliquer(voirFiche[0]);
  page = texteDe(app_);
  verifier(trouver(app_, n => n.classList.contains("fiche")).length === 1 && page.includes("Fiche de dérive : brouillon à valider") && page.includes("script de démonstration (sans IA)"), "la fiche complète (celle de montrerFiche) s'ouvre sous sa ligne et dit qu'elle vient d'un script");
  verifier(res3.some(r => page.includes(r.res.fiche.causes_probables[0].cause) && page.includes(r.res.fiche.action_proposee)), "causes et action proposée de la fiche sont affichées");
  verifier(zoneFiche.childNodes.length === 1 && zoneFiche.firstChild === marqueur, "ouvrir une fiche de la série ne touche pas à la zone de fiche de l'instruction");
  cliquer(trouver(app_, n => n.tagName === "BUTTON" && n.textContent === "Refermer")[0]);
  verifier(trouver(app_, n => n.classList.contains("fiche")).length === 0, "« Refermer » referme la fiche");
  zoneFiche.replaceChildren();
  etat.onglet = "agent"; rendre();
  verifier(texteDe(app_).includes("Épisode 3 sur 3") && agent.progres && agent.progres.fin === "terminé", "après la série, la page Instruction reste cohérente (journal de la série, progression terminée)");
  const copie = veiTexte(veiLignes(), file_(), vei.comparaison, derives(), veiTotal(file_(), avecSite));
  verifier(copie.startsWith("POINT DE SITUATION") && copie.includes("ÉPISODES INSTRUITS : 3") && copie.includes("Cause la plus probable : ") && copie.includes("Statut : à traiter") && copie.includes("sans double compte"), "export en texte : constat, enjeu, épisodes instruits, statuts");
  voir(); cliquer(boutons("Imprimer le point de situation")[0]); cliquer(boutons("Copier le point de situation")[0]); await pause(5);
  verifier(true, "impression et copie se lancent sans erreur");
  // le juge joué par le script n'est pas un tampon : une fiche faussée est renvoyée « à corriger »
  const sig = new AbortController().signal, bonne = res3[0].res, fausse = f => Object.assign({}, bonne, { fiche: Object.assign({}, bonne.fiche, f) });
  const v1 = await jugerFiche(fausse({ action_proposee: "Réduire de 123 456,78 kWh la consommation." }), q => veiJugeDemo(q, sig), sig);
  verifier(v1.verdict === "à corriger" && v1.points.length === 1 && v1.points[0].gravite === "bloquant" && v1.points[0].constat.includes("123 456,78"), "relecture par script : un nombre absent des résultats d'outils est un point bloquant");
  const v2 = await jugerFiche(fausse({ ecart_kwh: bonne.fiche.ecart_kwh * 2 }), q => veiJugeDemo(q, sig), sig);
  verifier(v2.verdict === "à corriger" && v2.points.some(pt => pt.champ === "ecart_kwh"), "relecture par script : un écart différent de celui de l'épisode est un point bloquant");
  const rj = await veiJugeDemo({ messages: [{ role: "user", content: "dossier illisible" }] }, sig);
  verifier(rj.type === "message" && rj.role === "assistant" && rj.stop_reason === "tool_use" && rj.content[0].type === "tool_use" && rj.content[0].name === "rendre_verdict" && rj.content[0].input.verdict === "à corriger", "le script de relecture répond dans la forme de l'API, même sur un dossier illisible");
  // verrou dans l'autre sens : une instruction lancée sur la page Instruction bloque la série
  agent.episode = derives().episodes[0];
  const pi = lancerInstruction();
  verifier(agent.enCours, "une instruction de la page Instruction est en cours");
  const serieAvant = vei.serie; await veiLancerSerie();
  verifier(vei.serie === serieAvant && vei.resultats.size === 3, "pendant une instruction lancée ailleurs, la série ne démarre pas");
  page = voir();
  const bBloque = boutons("Instruire le")[0];
  verifier(bBloque && bBloque.disabled && page.includes("Une instruction ou une évaluation est déjà en cours"), "le bouton de la série est désactivé, avec le motif");
  await pi;
  verifier(!boutons("Instruire le")[0].disabled && !texteDe(app_).includes("Une instruction ou une évaluation est déjà en cours"), "dès que l'instruction finit, la page se remet à jour et le bouton se libère");
  const avantSerie = vei.resultats.size;
  verifier(avantSerie === 3 + (cibles.includes(veiCle(derives().episodes[0])) ? 0 : 1), "la fiche de l'instruction est gardée avec celles de la série");
  veiRegler("n", 1); await veiLancerSerie();
  verifier(vei.resultats.size === avantSerie + 1 && [...vei.resultats.values()].every(r => r.etat === "fiche") && vei.resultats.get(cibles[0]) === res3[0], "une nouvelle série continue la file sans refaire les fiches déjà rendues");

  titre("7. Arrêt en cours de route, puis reprise");
  recharger(); veiRegler("n", 3); voir();
  verifier(vei.resultats.size === 0 && vei.serie === null, "un nouveau chargement remet la série à zéro");
  const c7 = file_().slice(0, 3).map(l => l.cle);
  pr = veiLancerSerie();
  await attendreQue(() => (vei.resultats.get(c7[0]) || {}).etat === "fiche" && (vei.resultats.get(c7[1]) || {}).etat === "cours", "épisode 1 fini, épisode 2 en cours");
  await pause(400);
  cliquer(boutons("Arrêter la série")[0]);
  await pr;
  const fiche1 = vei.resultats.get(c7[0]);
  verifier(c7.map(c => vei.resultats.get(c).etat).join(",") === "fiche,arrete,non-lance", "arrêt pendant l'épisode 2 : la fiche 1 est gardée, l'épisode 2 est arrêté, le 3 n'est pas lancé");
  verifier(vei.serie.arrete && !agent.enCours && agent.progres.fin === "arrêté", "la série est marquée arrêtée et le verrou est rendu");
  page = voir();
  verifier(page.includes("Série arrêtée : 1 fiche sur 3.") && boutons("Reprendre les 2 dérives sans fiche").length === 1, "le bilan le dit et propose de reprendre les 2 épisodes sans fiche");
  cliquer(boutons("Reprendre les 2 dérives sans fiche")[0]);
  await attendreQue(() => !agent.enCours, "fin de la reprise");
  verifier(c7.every(c => vei.resultats.get(c).etat === "fiche") && vei.resultats.get(c7[0]) === fiche1 && vei.serie.cles.length === 2, "reprise : les 2 épisodes manquants sont instruits, la fiche 1 n'est pas refaite");
  verifier([...vei.resultats.keys()].join() === c7.join(), "l'ordre des épisodes du point de situation est conservé");

  titre("8. Erreur sur un épisode (fauxModele), puis reprise");
  recharger(); voir();
  const c8 = file_().slice(0, 3), demande2 = messageInitial(c8[1].ep);
  let panne = true, appelsFaux = 0;
  const redacteurFaux = toujours => signal => ({ demo: true, nom: "faux modèle", signature: () => "le script de démonstration (sans IA)",
    appeler: fauxModele(async requete => { appelsFaux++; if (toujours || (panne && requete.messages[0].content === demande2)) throw new Error("Panne simulée du modèle"); return (await modeleDemo(requete, signal)).content; }) });
  await veiLancerSerie(null, redacteurFaux(false));
  verifier(c8.map(l => vei.resultats.get(l.cle).etat).join(",") === "fiche,echec,fiche", "une erreur sur l'épisode 2 n'empêche ni la fiche 1 ni la fiche 3");
  verifier(vei.resultats.get(c8[1].cle).erreur === "Panne simulée du modèle" && !vei.serie.interrompue && agent.progres.fin === "échec", "l'erreur est gardée avec son message");
  page = ouvrirDerive(c8[1].cle);
  verifier(page.includes("échec : Panne simulée du modèle") && page.includes("Série terminée : 2 fiches sur 3.") && boutons("Reprendre la dérive sans fiche").length === 1 && boutons("Lancer l'instruction").length === 1, "la page montre l'échec dans le détail de la dérive et propose la reprise");
  verifier(texteDe(app_.querySelector('[data-cle="' + c8[1].cle + '"]')).includes("À traiter · sans fiche"), "dans la liste, la dérive en échec reste à traiter, sans fiche");
  drv.ouverte = null;
  const g1 = vei.resultats.get(c8[0].cle), g3 = vei.resultats.get(c8[2].cle);
  panne = false;
  await veiLancerSerie([c8[1].cle], redacteurFaux(false));
  verifier(c8.every(l => vei.resultats.get(l.cle).etat === "fiche") && vei.resultats.get(c8[0].cle) === g1 && vei.resultats.get(c8[2].cle) === g3, "reprise après l'erreur : la fiche manquante est rédigée, les deux autres ne sont pas perdues");
  recharger(); voir(); appelsFaux = 0;
  await veiLancerSerie(null, redacteurFaux(true));
  const c8b = vei.serie.cles.map(c => vei.resultats.get(c).etat);
  verifier(c8b.join(",") === "echec,echec,non-lance" && vei.serie.interrompue && appelsFaux === 2, "garde-fou : deux échecs de suite interrompent la série (2 appels, pas 3)");
  verifier(voir().includes("Série interrompue après 2 échecs de suite"), "la page explique l'interruption");

  titre("9. Changement de classeur pendant une série, et mode IA non autorisé");
  recharger(); voir(); veiRegler("n", 3);
  pr = veiLancerSerie();
  await pause(500);
  recharger();
  verifier(vei.serie === null && vei.resultats.size === 0, "un nouveau classeur remet la veille à zéro, même pendant une série");
  await pr;
  verifier(!agent.enCours && vei.resultats.size === 0 && vei.serie === null, "la série lancée sur l'ancien classeur s'arrête sans rien écrire dans le nouvel état");
  agent.demo = false; voir();
  const bIA = boutons("Instruire les")[0];
  verifier(bIA && bIA.disabled && texteDe(app_).includes("L'envoi à l'IA n'est pas prêt"), "mode IA sans accord ni clé : bouton désactivé, avec le motif");
  await veiLancerSerie();
  verifier(!agent.enCours && vei.resultats.size === 0 && __reseau.length === 0 && vei.erreur, "mode IA sans accord : rien n'est lancé, rien n'est envoyé");
  agent.demo = true; vei.erreur = null;

  titre("10. Statuts : à traiter, validé, écarté avec motif, conservés");
  voir();
  const f10 = file_(), la = f10[0], lb = f10[1], lc = f10[2], taille = f10.length;
  verifier(veiFixerStatut(la.cle, "ecarte", "  ") === false && veiStatut(la.cle, la.ep).s === "atraiter", "écarter sans motif est refusé");
  verifier(veiFixerStatut(la.cle, "inconnu", "x") === false && veiFixerStatut("pas-une-cle", "valide", "") === false, "statut ou épisode inconnu : refusé");
  // parcours à l'écran : ouvrir la dérive, choisir « Écartée », saisir le motif, confirmer
  ouvrirDerive(la.cle);
  cliquer(trouver(app_.querySelector(".drv-detail"), n => n.tagName === "BUTTON" && n.textContent === "Écartée")[0]);
  const champ = trouver(app_, n => n.classList.contains("vei-motif"))[0], okb = boutons("Écarter")[0];
  verifier(champ && okb && okb.disabled, "choisir « Écarté » ouvre la saisie du motif, bouton désactivé tant qu'il est vide");
  cliquer(okb);
  verifier(veiStatut(la.cle, la.ep).s === "atraiter", "confirmer sans motif ne change rien");
  champ.value = "Arrêt technique planifié"; champ.dispatchEvent({ type: "input", target: champ });
  verifier(!okb.disabled, "le motif saisi active le bouton");
  cliquer(okb);
  verifier(veiStatut(la.cle, la.ep).s === "ecarte" && veiStatut(la.cle, la.ep).motif === "Arrêt technique planifié", "l'épisode est écarté avec son motif");
  verifier(veiFixerStatut(lb.cle, "valide", "") === true, "valider un épisode");
  verifier(file_().length === taille - 2 && !file_().some(l => l.cle === la.cle || l.cle === lb.cle), "les épisodes validés ou écartés quittent la file");
  page = ouvrirDerive(la.cle);
  const fin2 = drvLignes().slice(-2).map(l => l.cle);
  verifier(fin2.includes(la.cle) && fin2.includes(lb.cle) && page.includes("Arrêt technique planifié") && texteDe(app_.querySelector('[data-cle="' + lb.cle + '"]')).includes("Validée")
    && texteDe(app_.querySelector('[data-cle="' + la.cle + '"]')).includes("Écartée"), "elles passent en fin de liste, avec leur statut et le motif");
  const st = memoire().jeux[vei.jeu].statuts;
  verifier(st[la.cle].s === "ecarte" && st[la.cle].motif === "Arrêt technique planifié" && st[lb.cle].s === "valide" && Object.keys(st).length === 2, "les statuts sont écrits en mémoire locale");
  recharger(); voir();
  verifier(veiStatut(la.cle, la.ep).s === "ecarte" && veiStatut(la.cle, la.ep).motif === "Arrêt technique planifié" && veiStatut(lb.cle, lb.ep).s === "valide" && file_().length === taille - 2, "après un nouveau chargement, statuts et motif sont retrouvés");
  vei.memo.statuts[lb.cle].n = lb.ep.n - 2;
  const lb2 = veiLignes().find(l => l.cle === lb.cle);
  verifier(lb2.aTraiter && lb2.statut.plus === 2 && lb2.neuf && texteDe((voir(), app_.querySelector('[data-cle="' + lb.cle + '"]'))).includes("Validée · à revoir"), "un épisode validé qui s'allonge ensuite revient dans la file, marqué « à revoir »");
  ouvrirDerive(la.cle); cliquer(trouver(app_.querySelector(".drv-detail"), n => n.tagName === "BUTTON" && n.textContent === "À traiter")[0]); drv.ouverte = null;
  verifier(veiStatut(la.cle, la.ep).s === "atraiter" && !(la.cle in memoire().jeux[vei.jeu].statuts), "« Remettre à traiter » efface le statut");
  // copie figée : rien n'est lu ni écrit
  const avantFigee = localStorage.getItem(VEI_CLE), nbEcritures = ecritures.length;
  recharger(null, "25/11/2026"); voir();
  verifier(vei.comparaison.premier && veiStatut(lb.cle, lb.ep).s === "atraiter", "copie figée : la mémoire n'est pas lue (premier passage, aucun statut)");
  verifier(veiFixerStatut(lc.cle, "valide", "") && veiStatut(lc.cle, lc.ep).s === "valide", "copie figée : le statut vaut pour la session");
  veiRegler("critere", "z"); veiRegler("critere", "cout");
  verifier(localStorage.getItem(VEI_CLE) === avantFigee && ecritures.length === nbEcritures, "copie figée : aucune écriture en mémoire locale");
  verifier(texteDe(app_).includes("Copie figée : la veille ne lit et n'écrit aucune mémoire") && boutons("Oublier la mémoire de la veille")[0].disabled, "copie figée : la page le dit et le bouton d'oubli est désactivé");
  recharger(); voir();
  verifier(veiStatut(lb.cle, lb.ep).s === "valide", "retour au classeur : les statuts gardés sont toujours là");
  cliquer(boutons("Oublier la mémoire de la veille")[0]);
  verifier(localStorage.getItem(VEI_CLE) === null && localStorage.getItem(VEI_CLE_REGLAGES) === null && veiStatut(lb.cle, lb.ep).s === "atraiter" && vei.comparaison.premier, "« Oublier » efface la mémoire et les statuts");
  verifier(ecritures.filter(k => k.includes(".vei.") || !k.startsWith("revue-energetique.")).every(k => k === VEI_CLE || k === VEI_CLE_REGLAGES) && ecritures.includes(VEI_CLE_REGLAGES), "toutes les clés écrites par le module portent son préfixe");
  recharger();

  titre("11. Rendu en français et en anglais");
  page = voir();
  for (const t of ["Dérives", "Premier passage sur ce jeu de données", "Instruire en série", "Instruire les 3 premières", "Veille : nouveautés, mémoire et point de situation", "Règle appliquée, dans l'ordre", "Mode démonstration"])
    verifier(page.includes(t), "français : « " + t + " »");
  verifier(boutons("Instruire les 3 premières")[0].getAttribute("title") === "Au plus 8 tours par dérive, 3 pour la relecture, soit au plus 33 appels au script (aucun appel réseau).", "le budget de la série est dit sur son bouton");
  drv.limite = Infinity; voir();
  verifier(trouver(app_, n => n.classList.contains("drv-item")).length === veiLignes().length, "la liste montre toutes les dérives");
  const cases = trouver(app_, n => n.tagName === "INPUT" && n.attrs.type === "checkbox");
  verifier(cases.length === 5, "cinq réglages à cocher");
  const premierAvant = file_()[0].cle; cases[2].checked = false; cases[2].dispatchEvent({ type: "change", target: cases[2] });
  verifier(vei.regle.enCours === false && JSON.parse(localStorage.getItem(VEI_CLE_REGLAGES)).regle.enCours === false && !voir().includes("les dérives en cours avant"), "décocher un réglage change la règle affichée et se retient");
  veiRegler("enCours", true);
  verifier(file_()[0].cle === premierAvant, "recocher rétablit l'ordre");
  LANGUE = "en"; CACHE_TR.clear(); rendre();
  veiRegler("n", 1);
  const s1 = veiLancerSerie(); voir(); await s1;
  drv.ouverte = null; voir();
  cliquer(trouver(app_.querySelector('[data-cle="' + vei.serie.cles[0] + '"]'), n => n.tagName === "BUTTON" && n.textContent === "See the note")[0]);
  let en = texteDe(app_);
  for (const t of ["Drifts", "First pass on this dataset", "Investigate in a row", "Watch: what is new, memory and status report", "Rule applied, in order", "Demo mode", "Drift note: draft to validate", "On-site checks", "Investigated", "Run finished: 1 of 1 note."])
    verifier(en.includes(t), "anglais : « " + t + " »");
  // aucun texte français ne doit rester : on retire d'abord les données du classeur (noms de séries, d'énergies, de facteurs)
  const texteHorsJournal = n => n.nodeType === 3 ? n.textContent : n.classList.contains("journal") ? "" : n.children.length ? n.children.map(texteHorsJournal).join("\n") : n.textContent;   // le journal (page d'origine) montre des résultats d'outils bruts
  let sansDonnees = texteHorsJournal(trouver(app_, n => n.classList.contains("feuille"))[0]);
  for (const n of nomsSeries.concat(etat.modele.energies, etat.modele.facteurs.map(f => f.nom)).sort((x, y) => y.length - x.length)) sansDonnees = sansDonnees.split(n).join("§");
  const restes = sansDonnees.match(/[^.;:]*(?:[éèêàùçôîû«»]| les | des | une | est | pas | sur la | de la )[^.;:]*/g) || [];
  verifier(restes.length === 0, "anglais : aucun texte français restant" + (restes.length ? " — " + restes.slice(0, 5).map(x => x.trim().slice(0, 90)).join(" | ") : ""));
  const copieEN = veiTexte(veiLignes(), file_(), vei.comparaison, derives(), veiTotal(file_(), avecSite));
  verifier(copieEN.startsWith("DRIFT WATCH STATUS REPORT") && copieEN.includes("Most likely cause: ") && copieEN.includes("Status: to handle") && !/[éèàù]/.test(copieEN.split("\n").filter(l => !nomsSeries.some(n => l.includes(n))).join("\n")), "export en texte en anglais");
  LANGUE = "fr"; CACHE_TR.clear(); rendre();
  verifier(vei.resultats.size === 0 && texteDe(app_).includes("Les fiches rédigées dans l'autre langue ont été retirées"), "au changement de langue, les fiches de l'autre langue sont retirées, et la page le dit");
  for (const [fr] of VEI_TRADUCTIONS) verifier(EN.has(fr), "traduction enregistrée : " + fr.slice(0, 40));
  verifier(new Set(VEI_TRADUCTIONS.map(p => p[0])).size === VEI_TRADUCTIONS.length, "pas de doublon dans la table de traductions du module");
  for (const o of ONGLETS) { etat.onglet = o[0]; rendre(); verifier(texteDe(app_).length > 200, "la page « " + o[0] + " » se rend toujours"); }

  titre("12. Réseau");
  verifier(__reseau.length === 0, "aucun appel réseau pendant tous les tests (mode démonstration)");
  veiRegler("n", 3);
  localStorage.setItem = poserOrigine;
}
