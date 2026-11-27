/* Tests du module « Dérives » (idee-13-derives). Exécutés par outillage/banc.js dans la portée du script, après le chargement du classeur réel. */
verifier.bavard = false;
const app_ = document.getElementById("app");
const titre = t => console.log("— " + t);
const pause = ms => new Promise(ok => setTimeout(ok, ms));
async function attendreQue(cond, quoi, ms = 20000) { const t0 = Date.now(); while (!cond()) { if (Date.now() - t0 > ms) throw new Error("délai dépassé : " + quoi); await pause(15); } }
const boutons = (racine, texte) => trouver(racine || app_, n => n.tagName === "BUTTON" && (texte instanceof RegExp ? texte.test(n.textContent) : n.textContent === texte));
const page = id => { etat.onglet = id; rendre(); return texteDe(app_); };
const ligneDe = cle => app_.querySelector('[data-cle="' + cle + '"]');
const recharger = (grilles, figee) => charger(grilles || grillesChargees, d1904Charge, etat.fichier, figee || null);

async function test() {
  const m0 = etat.modele, g0 = grillesChargees;
  titre("1. Une seule entrée de menu, trois adresses");
  const entrees = PAGES.flatMap(g => g.pages.map(p => p[0]));
  verifier(entrees.filter(id => DRV_PAGES.includes(id)).join() === "derives" && PAGES.find(g => g.groupe === "Suivi").pages.some(p => p[0] === "derives"), "le menu n'a plus qu'une entrée « Dérives », dans le groupe Suivi");
  verifier(!PAGES.some(g => g.groupe === "Dérives") && DRV_PAGES.every(id => ONGLETS.some(o => o[0] === id && o[2] === "Dérives") && PAGES_MODULES[id] === drvPage), "les adresses derives, agent et veille restent connues et mènent à la même page");
  for (const id of DRV_PAGES) {
    page("site"); aller(id);
    const t = texteDe(app_), h1 = app_.querySelector(".entete h1"), actif = app_.querySelector('.menu .entree[aria-current="page"]');
    verifier(etat.onglet === id && h1 && h1.textContent === "Dérives" && t.includes("en cours") && actif && actif.textContent.includes("Dérives"), "aller(« " + id + " ») : page Dérives, entrée du menu marquée");
  }
  accPremier = true; location.hash = "#onglet=veille"; recharger();
  verifier(etat.onglet === "veille" && texteDe(app_).includes("Instruire en série"), "adresse #onglet=veille au premier chargement : la page Dérives");
  accPremier = true; location.hash = "#onglet=agent"; recharger();
  verifier(etat.onglet === "agent" && boutons(null, "Lancer l'instruction").length === 1 && drv.ouverte, "adresse #onglet=agent : la page Dérives, une dérive ouverte prête à instruire");
  location.hash = "";

  titre("2. La réponse en tête : constat de la détection, nouveautés de la veille");
  const D = derives(), K = drvConstat(D);
  Object.assign(etat, { derSerie: "*", derSens: "*", derEtat: "*", de: etat.modele.debut, a: etat.modele.fin });
  const det = pageDerives(), constatDet = texteDe(det[1]);
  verifier(constatDet.startsWith(K.phrase), "même phrase que le constat de la page Détection, sans filtre : « " + K.phrase.slice(0, 60) + "… »");
  verifier(K.cout3 != null && constatDet.includes(fmtEuros(K.cout3)), "même coût sur 3 mois que la Détection (" + fmtEuros(K.cout3) + ")");
  let t = page("derives");
  const tete = app_.querySelector(".constat");
  verifier(tete && texteDe(tete).includes(K.phrase) && texteDe(tete).includes(fmtEuros(K.cout3)) && texteDe(tete).includes("Veille : " + veiConstat(vei.comparaison, D).titre), "la page commence par ce constat, puis la ligne de la veille");

  titre("3. Une seule liste : mêmes épisodes, mêmes enjeux, ordre de la veille");
  const L = drvLignes(), cles = D.episodes.map(veiCle);
  verifier(L.length === D.episodes.length && cles.every(c => L.some(l => l.cle === c)), "la liste contient exactement les " + D.episodes.length + " épisodes de derives()");
  verifier(L.every(l => JSON.stringify(l.enjeu) === JSON.stringify(veiEnjeu(l.ep, vei.regle))), "chaque enjeu est celui de la veille (veiEnjeu)");
  const attendu = veiTrier(veiLignes().filter(l => l.aTraiter), vei.regle).concat(veiTrier(veiLignes().filter(l => !l.aTraiter), vei.regle)).map(l => l.cle);
  verifier(JSON.stringify(L.map(l => l.cle)) === JSON.stringify(attendu), "ordre : la file de la veille, puis les dérives traitées");
  Object.assign(etat, { derEtat: "*", derSens: "*" }); drv.energie = "*"; drv.ouverte = null; drv.limite = DRV_LIMITE; t = page("derives");
  let items = trouver(app_, n => n.classList.contains("drv-item"));
  verifier(items.length === Math.min(DRV_LIMITE, L.length) && boutons(null, "Afficher les " + (L.length - DRV_LIMITE) + " autres").length === 1, "premier affichage : " + DRV_LIMITE + " lignes et un bouton pour les autres");
  verifier(L.slice(0, DRV_LIMITE).every((l, k) => { const x = texteDe(items[k]); return x.includes(l.ep.serie) && x.includes(fmtEnergie(l.ep.ecart, true)) && (l.enjeu.cout == null || x.includes(fmtEuros(l.enjeu.cout, true))) && x.includes(veiLib(l.ep)); }),
    "chaque ligne : série, période, écart en énergie et en euros");
  cliquer(boutons(null, "Afficher les " + (L.length - DRV_LIMITE) + " autres")[0]);
  verifier(trouver(app_, n => n.classList.contains("drv-item")).length === L.length, "« Afficher les autres » montre toute la liste");
  // filtres
  cliquer(boutons(app_.querySelector(".drv-filtres"), "En cours")[0]);
  items = trouver(app_, n => n.classList.contains("drv-item"));
  verifier(etat.derEtat === "o" && items.length === D.episodes.filter(e => e.ouvert).length, "filtre « En cours » : les " + items.length + " dérives en cours");
  cliquer(boutons(app_.querySelector(".drv-filtres"), "Toutes")[0]); cliquer(boutons(app_.querySelector(".drv-filtres"), "Économies")[0]);
  verifier(trouver(app_, n => n.classList.contains("drv-item")).length === D.episodes.filter(e => e.ecart < 0).length, "filtre « Économies »");
  cliquer(boutons(app_.querySelector(".drv-filtres"), "Les deux")[0]);
  const sel = trouver(app_.querySelector(".drv-filtres"), n => n.tagName === "SELECT")[0], en0 = etat.modele.energies[0];
  sel.value = en0; sel.dispatchEvent({ type: "change", target: sel });
  verifier(trouver(app_, n => n.classList.contains("drv-item")).length === D.episodes.filter(e => e.energie === en0).length, "filtre par énergie (" + en0 + ")");
  sel.value = "*"; trouver(app_.querySelector(".drv-filtres"), n => n.tagName === "SELECT")[0].dispatchEvent({ type: "change", target: { value: "*" } });
  verifier(drv.energie === "*", "retour à toutes les énergies");

  titre("4. Graphiques, tableaux et hypothèses de la détection, sous des replis");
  t = page("derives");
  for (const x of ["cumul des écarts (CUSUM)", "z-score par", "Dérives en cours : l'enjeu si rien ne change", "Épisodes de dérive", "Coût et carbone : hypothèses", "Règle de détection : z =", "Dérives du site : ce que les UES expliquent", "Séries analysées"])
    verifier(t.includes(x), "accessible sur la page : « " + x + " »");
  const replis = trouver(app_, n => n.tagName === "DETAILS" && n.classList.contains("repli"));
  verifier(replis.length >= 6 && replis.every(d => !d.hasAttribute("open")), "six replis, fermés au premier affichage");
  verifier(trouver(app_, n => n.tagName === "INPUT" && n.attrs.type === "number").length === 2 * etat.modele.energies.length, "les hypothèses de prix et d'émissions restent modifiables");

  titre("5. Instruire : la fiche s'ouvre sur place, en démonstration");
  verifier(agent.demo === true, "mode démonstration par défaut");
  const l1 = drvLignes()[0];
  t = page("derives");
  cliquer(boutons(ligneDe(l1.cle), "Instruire")[0]);
  verifier(DRV_PAGES.includes(etat.onglet) && agent.enCours && drv.ouverte === l1.cle && ligneDe(l1.cle).contains(zoneFiche), "« Instruire » : l'instruction part, sans changer de page, et la zone de fiche est sous la ligne");
  verifier(texteDe(ligneDe(l1.cle)).includes("Instruction en cours…") && boutons(ligneDe(l1.cle), "Arrêter").length === 1, "pendant l'instruction : statut et bouton « Arrêter » sur la ligne");
  await attendreQue(() => !agent.enCours, "fin de l'instruction");
  let li = ligneDe(l1.cle);
  verifier(li && trouver(li, n => n.classList.contains("fiche")).length === 1 && li.querySelector("dl") && texteDe(li).includes("Fiche de dérive : brouillon à valider"), "la fiche s'affiche sous sa ligne");
  verifier(texteDe(li).includes("Instruite") && vei.resultats.get(l1.cle) && vei.resultats.get(l1.cle).etat === "fiche", "la dérive est « Instruite » et sa fiche gardée avec celles de la veille");
  verifier(trouver(li, n => n.tagName === "DETAILS" && texteDe(n).startsWith("Journal de l'agent")).length === 1 && li.contains(journal), "le journal de l'agent est dans un repli, sous la fiche");
  const l2 = drvLignes().find(l => l.cle !== l1.cle && !drvFiche(l));
  cliquer(boutons(ligneDe(l2.cle), "Instruire")[0]); await attendreQue(() => !agent.enCours, "seconde instruction");
  verifier(drv.ouverte === l2.cle && !ligneDe(l1.cle).querySelector(".drv-detail") && texteDe(ligneDe(l1.cle)).includes("Instruite"), "une seconde instruction : la première dérive reste « Instruite », son détail est refermé");
  cliquer(boutons(ligneDe(l1.cle), "Voir la fiche")[0]);
  li = ligneDe(l1.cle);
  verifier(drv.ouverte === l1.cle && li.querySelector(".fiche dl") && !li.contains(zoneFiche), "« Voir la fiche » rouvre la fiche gardée, sans la refaire");
  cliquer(boutons(li, "Refermer")[0]);
  verifier(drv.ouverte === null && !app_.querySelector(".drv-detail"), "« Refermer » referme le détail");
  verifier(__reseau.length === 0, "aucun appel réseau");

  titre("6. Instruire en série, et s'arrêter");
  t = page("derives");
  const prochaines = drvFiltrer(drvLignes()).filter(l => l.aTraiter && !drvFiche(l)).slice(0, vei.n).map(l => l.cle);
  cliquer(boutons(null, "Instruire les " + vei.n + " premières")[0]);
  verifier(vei.serie && vei.serie.active && JSON.stringify(vei.serie.cles) === JSON.stringify(prochaines) && etat.onglet === "veille", "« Instruire les " + vei.n + " premières » lance la série sur les premières dérives à traiter de la liste");
  verifier(boutons(null, "Arrêter la série").length === 1 && texteDe(app_).includes("Journal détaillé de la série"), "pendant la série : « Arrêter la série » et le journal dans un repli");
  await attendreQue(() => (vei.resultats.get(prochaines[0]) || {}).etat === "fiche", "première fiche de la série");
  cliquer(boutons(null, "Arrêter la série")[0]);
  await attendreQue(() => !agent.enCours, "arrêt de la série");
  t = texteDe(app_);
  verifier(vei.serie.arrete && t.includes("Série arrêtée : 1 fiche sur " + prochaines.length + ".") && boutons(null, /^Reprendre les \d+ dérives sans fiche$/).length === 1, "la série s'arrête, le bilan le dit et propose de reprendre");
  verifier(texteDe(ligneDe(prochaines[0])).includes("Instruite"), "la dérive instruite par la série est marquée « Instruite »");
  cliquer(boutons(null, /^Reprendre les \d+ dérives sans fiche$/)[0]);
  await attendreQue(() => !agent.enCours, "reprise");
  verifier(prochaines.every(c => (vei.resultats.get(c) || {}).etat === "fiche"), "la reprise termine la série");
  verifier(__reseau.length === 0, "aucun appel réseau pendant la série");

  titre("7. Statuts gardés : à traiter, instruite, validée, écartée");
  drv.ouverte = l2.cle; drv.limite = Infinity; page("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "Validée")[0]);
  verifier(veiStatut(l2.cle, l2.ep).s === "valide" && texteDe(ligneDe(l2.cle)).includes("Validée"), "« Validée » dans le détail : statut posé et affiché");
  const l3 = drvLignes().find(l => l.aTraiter);
  drv.ouverte = l3.cle; page("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "Écartée")[0]);
  const champ = app_.querySelector(".vei-motif");
  verifier(champ && boutons(app_.querySelector(".drv-detail"), "Écarter")[0].disabled, "« Écartée » demande un motif");
  champ.value = "Essai de mise en service"; champ.dispatchEvent({ type: "input", target: champ }); cliquer(boutons(app_.querySelector(".drv-detail"), "Écarter")[0]);
  verifier(veiStatut(l3.cle, l3.ep).s === "ecarte" && texteDe(ligneDe(l3.cle)).includes("Écartée"), "dérive écartée avec son motif");
  recharger(); drv.limite = Infinity; page("derives");
  verifier(texteDe(ligneDe(l2.cle)).includes("Validée") && texteDe(ligneDe(l3.cle)).includes("Écartée") && drvLignes().slice(-2).map(l => l.cle).sort().join() === [l2.cle, l3.cle].sort().join(), "après un nouveau chargement, les statuts sont retrouvés et ces dérives passent en fin de liste");
  veiFixerStatut(l2.cle, "atraiter"); veiFixerStatut(l3.cle, "atraiter");

  titre("8. Les boutons « Instruire » d'ailleurs");
  page("ensemble");
  const top = app_.querySelector(".acc-top"), bAcc = top && boutons(top, /^(Instruire|Voir la fiche)$/)[0];
  verifier(!!bAcc, "la Vue d'ensemble propose ses dérives");
  cliquer(bAcc);
  const epAcc = agent.episode;
  verifier(etat.onglet === "agent" && epAcc && drv.ouverte === veiCle(epAcc) && ligneDe(drv.ouverte) && ligneDe(drv.ouverte).querySelector(".drv-detail"), "Vue d'ensemble → la dérive s'ouvre, détail visible, dans la page Dérives");
  await attendreQue(() => !agent.enCours, "instruction depuis la Vue d'ensemble");
  verifier(ligneDe(drv.ouverte).querySelector(".fiche dl"), "sa fiche arrive sous sa ligne");
  page("derives"); REPLIS_OUVERTS.add("drv-tableaux"); rendre();
  const bTab = boutons(trouver(app_, n => n.tagName === "DETAILS" && texteDe(n).startsWith("Tableaux de la détection"))[0], "Instruire")[0];
  cliquer(bTab); REPLIS_OUVERTS.delete("drv-tableaux");
  verifier(agent.enCours && drv.ouverte === veiCle(agent.episode), "« Instruire » des tableaux d'origine (choisirEpisode) : la dérive s'ouvre et s'instruit");
  await attendreQue(() => !agent.enCours, "instruction depuis les tableaux");
  // une série demandée ailleurs (« Voir la décomposition » de la Vue d'ensemble)
  const site = drvLignes().find(l => l.ep.groupe === "site" && decomposerSite(l.ep).lignes.length);
  page("site"); Object.assign(etat, { derSerie: site.ep.serie, derSens: "*", derEtat: "*" }); aller("derives");
  verifier(drv.ouverte === drvLignes().find(l => l.ep.serie === site.ep.serie).cle && texteDe(app_.querySelector(".drv-detail")).includes("Écart non expliqué par les UES suivies"), "série demandée ailleurs : sa dérive s'ouvre, avec la part non expliquée par les UES");
  // essai sans clic : #onglet=derives&demo=auto
  demoAutoFaite = false; location.hash = "#onglet=derives&demo=auto"; page("derives"); await pause(5);
  verifier(agent.enCours && drv.ouverte === veiCle(agent.episode), "#onglet=derives&demo=auto lance l'instruction de démonstration, sur place");
  await attendreQue(() => !agent.enCours, "démonstration automatique"); location.hash = "";

  titre("9. Relier les pages depuis une dérive");
  const ouv = drvLignes().find(l => l.ep.ouvert), close = drvLignes().find(l => !l.ep.ouvert && l.ep.groupe === "ues") || drvLignes().find(l => !l.ep.ouvert);
  drv.ouverte = ouv.cle; page("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "Voir sa prévision")[0]);
  verifier(etat.onglet === "prevision" && prevEtat.serie === ouv.ep.serie && prevEtat.derive === true && texteDe(app_).includes(ouv.ep.serie), "« Voir sa prévision » : Prévision réglée sur la série, dérive en cours prolongée");
  drv.ouverte = close.cle; aller("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "Voir sa prévision")[0]);
  verifier(etat.onglet === "prevision" && prevEtat.serie === close.ep.serie && prevEtat.derive === false, "dérive close : Prévision sur la série, sans prolonger");
  drv.ouverte = close.cle; aller("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "La simuler")[0]);
  const m = etat.modele;
  verifier(etat.onglet === "simulateur" && sim.serie === close.ep.serie && etat.de === Math.max(m.debut, close.ep.debut) && etat.a === Math.min(m.fin, close.ep.fin), "« La simuler » : Simulateur sur la série et la période de la dérive");
  const simSel = trouver(app_, n => n.tagName === "SELECT" && trouver(n, o => o.tagName === "OPTION" && o.attrs.selected !== undefined && o.textContent === close.ep.serie).length)[0];
  verifier(!!simSel, "le Simulateur affiche bien cette série");
  drv.ouverte = close.cle; aller("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "L'ajouter à la revue")[0]);
  const an = x => new Date(x).getUTCFullYear();
  verifier(etat.onglet === "revue" && etat.de <= close.ep.debut + 7 * 864e5 && etat.a >= close.ep.fin && an(etat.de) === an(close.ep.debut) && an(etat.a) === an(close.ep.fin), "« L'ajouter à la revue » : Revue sur l'année civile qui couvre la dérive");
  Object.assign(etat, { de: m.debut, a: m.fin });
  drv.ouverte = close.cle; aller("derives");
  cliquer(boutons(app_.querySelector(".drv-detail"), "Voir ses graphiques")[0]);
  const rg = app_.querySelector('[data-drv="graphiques"]');
  verifier(REPLIS_OUVERTS.has("drv-graphiques") && rg && rg.hasAttribute("open") && texteDe(rg).includes(close.ep.serie + " : cumul des écarts (CUSUM)"), "« Voir ses graphiques » ouvre les courbes de la série");
  REPLIS_OUVERTS.delete("drv-graphiques");

  titre("10. Évaluation d'origine, dans un repli en bas de page");
  drv.ouverte = null; page("derives"); agent.nEval = 3;
  const rEval = trouver(app_, n => n.tagName === "DETAILS" && texteDe(n).startsWith("Évaluer l'agent sur les plus gros épisodes"))[0];
  verifier(rEval && boutons(rEval, "Lancer l'évaluation").length === 1, "le repli « Évaluer l'agent » porte le lancement");
  cliquer(boutons(rEval, "Lancer l'évaluation")[0]);
  verifier(agent.enCours && agent.evaluation && etat.onglet === "agent", "l'évaluation part (lancerEvaluation d'origine)");
  await attendreQue(() => !agent.enCours, "fin de l'évaluation");
  verifier(texteDe(zoneEval).includes("Évaluation de l'agent") && trouver(app_, n => n.tagName === "DETAILS" && texteDe(n).startsWith("Évaluer l'agent"))[0].contains(zoneEval) && agent.evaluation.lignes.length === 3, "son résultat s'affiche dans le repli (3 épisodes)");

  titre("11. Mode IA non prêt : rien ne part, la page le dit");
  agent.demo = false; page("derives");
  const l4 = drvLignes().find(l => !drvFiche(l) && l.aTraiter);
  cliquer(boutons(ligneDe(l4.cle), "Instruire")[0]); await pause(5);
  verifier(!agent.enCours && agent.erreur && texteDe(ligneDe(l4.cle)).includes(agent.erreur) && __reseau.length === 0, "« Instruire » sans clé ni accord : message dans le détail, aucun envoi");
  verifier(boutons(null, /^Instruire les \d+ premières$/)[0].disabled && texteDe(app_).includes("L'envoi à l'IA n'est pas prêt"), "la série est bloquée, avec le motif");
  agent.demo = true; agent.erreur = null;

  titre("12. Français et anglais");
  LANGUE = "en"; CACHE_TR.clear(); cacheDerives = null; drv.ouverte = null; drv.limite = DRV_LIMITE; t = page("derives");
  for (const x of ["Drifts", "Investigate in a row", "Rule applied", "Watch: what is new, memory and status report", "Evaluate the agent on the largest episodes", "Charts for", "Detection tables"])
    verifier(t.includes(x), "anglais : « " + x + " »");
  const lx = drvLignes()[0]; drv.ouverte = lx.cle; page("derives");
  const texteHorsDonnees = n => { let s = n.nodeType === 3 ? n.textContent : n.classList.contains("journal") || n.classList.contains("fiche") ? "" : n.children.length ? n.children.map(texteHorsDonnees).join("\n") : n.textContent; return s; };
  let brut = texteHorsDonnees(app_.querySelector(".feuille"));
  for (const n of m.series.map(s => s.nom).concat(m.energies, m.facteurs.map(f => f.nom)).sort((x, y) => y.length - x.length)) brut = brut.split(n).join("§");
  const restes = brut.match(/[^.;:\n]*(?:[éèêàùçôîû«»]| les | des | une | est | pas | sur la | de la )[^.;:\n]*/g) || [];
  verifier(restes.length === 0, "anglais : aucun texte français restant" + (restes.length ? " — " + restes.slice(0, 6).map(x => x.trim().slice(0, 80)).join(" | ") : ""));
  verifier(vei.resultats.size === 0 && t.includes("The notes written in the other language were removed"), "les fiches rédigées en français sont retirées, et la page le dit");
  LANGUE = "fr"; CACHE_TR.clear(); cacheDerives = null; page("derives");
  const NOS = ["Dérives", "Refermer", "Voir la fiche", "Voir sa prévision", "La simuler", "L'ajouter à la revue", "Voir ses graphiques", "Votre décision :", "Validée", "Écartée", "Journal de l'agent", "Règle de tri et règle de détection", "Veille : nouveautés, mémoire et point de situation", "Les deux", "Toutes"];
  verifier(NOS.every(x => EN.has(x)), "les textes fixes du module ont leur traduction");

  titre("13. Site fictif");
  accCharger(); drv.limite = Infinity; t = page("derives");
  const Df = derives(), air = Df.episodes.find(e => e.ouvert && e.groupe === "ues" && e.ecart > 0);
  verifier(etat.modele !== m0 && drvLignes().length === Df.episodes.length && t.includes("Données fictives"), "site fictif : toutes ses dérives, avec le bandeau « Données fictives »");
  verifier(air && texteDe(ligneDe(veiCle(air))).includes("même dérive que le Site"), "la dérive d'UES déjà comptée dans le compteur général est signalée (" + (air && air.serie) + ")");
  for (const id of ONGLETS.map(o => o[0])) { let ok = true; try { etat.onglet = id; rendre(); } catch (e) { ok = false; console.log(e); } verifier(ok && texteDe(app_).length > 200, "site fictif : la page « " + id + " » se rend"); }
  recharger(g0);

  titre("14. Réseau");
  verifier(__reseau.length === 0, "aucun appel réseau dans tout le test");
}
