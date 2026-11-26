/* Test du module Simulateur. Lancé par outillage/banc.js après le chargement du classeur réel.
   Deux jeux de données : le classeur réel (preuve du rejeu, linéarité, parcours complets) et un petit classeur
   synthétique dont les réponses sont calculées à la main (noms inventés pour le test). */
async function test() {
  const m0 = etat.modele, G0 = grillesChargees, d0 = d1904Charge, nom0 = etat.fichier, app = document.getElementById("app");
  const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  const page = () => { etat.onglet = "simulateur"; rendre(); return texteDe(app); };
  const sc = () => sim.scenarios[sim.courant];
  const boutons = t => trouver(app, n => n.tagName === "BUTTON" && n.textContent === t);
  const vider = () => Object.assign(sc(), { reglages: {}, prix: {}, fe: {} });
  const attendreFin = async () => { for (let i = 0; i < 100 && sim.enCours; i++) await new Promise(r => setTimeout(r, 20)); };

  /* ---- 1. Preuve : les équations relues redonnent « ref » sur tout l'historique (classeur réel) ---- */
  verifier(sim.modele === m0 && sim.eq.series.length === m0.series.length, "le simulateur est initialisé au chargement du classeur (AU_CHARGEMENT)");
  let pire = 0;
  for (const e of sim.eq.series) pire = Math.max(pire, e.ecartMax);
  verifier(sim.eq.series.every(e => e.ok), "toutes les séries du classeur réel se laissent rejouer");
  verifier(pire <= SIM.tol, "rejeu = ref à la tolérance annoncée (" + SIM.tol + " en relatif) ; écart relatif maximal mesuré : " + pire);
  verifier(sim.eq.series.some(e => e.saisonnier && e.q.includes(1) && e.q.includes(0)), "au moins un modèle saisonnier est rejoué avec ses deux équations (EQUATION et EQUATION 2)");
  etat.de = m0.debut; etat.a = m0.fin;
  const nul = simCalculer(sc());
  verifier(nul.lignes.length === m0.series.length, "scénario nul : une ligne par série");
  verifier(nul.lignes.every(l => l.ecart === 0 && l.sr.ref.every((v, j) => v == null ? l.simu[j] == null : l.simu[j] != null && proche(v, l.simu[j]))), "scénario nul = ref, date par date, pour chaque série");
  verifier(nul.lignes.every(l => proche(l.ref, somme(l.sr.ref))), "scénario nul : le total de référence est celui du modèle de données");
  verifier(nul.extrap.length === 0 && nul.euros === 0 && nul.co2 === 0, "scénario nul : aucun écart en euros ni en CO2e, aucune extrapolation");
  sc().reglages[m0.facteurs[0].nom] = { type: "pct", v: 0, saison: "tout" };
  verifier(simCalculer(sc()).lignes.every(l => l.ecart === 0), "un réglage à 0 % ne change rien");
  vider();

  /* ---- 2. Linéarité, décomposition par facteur (classeur réel) ---- */
  for (const type of ["pct", "abs"]) for (const f of m0.facteurs) {
    sc().reglages = { [f.nom]: { type, v: 7, saison: "tout" } };
    const a = simCalculer(sc());
    sc().reglages = { [f.nom]: { type, v: 14, saison: "tout" } };
    const b = simCalculer(sc());
    verifier(a.lignes.every((l, i) => Math.abs(b.lignes[i].ecart - 2 * l.ecart) <= 1e-9 * Math.abs(l.ref)), "linéarité (" + type + ") : deux fois la variation = deux fois l'effet, facteur n° " + (m0.facteurs.indexOf(f) + 1));
    verifier(a.lignes.every(l => Math.abs(somme(l.parFacteur) - l.ecart) <= 1e-9 * Math.abs(l.ref)), "la somme des parts par facteur redonne l'écart (" + type + ", facteur n° " + (m0.facteurs.indexOf(f) + 1) + ")");
    verifier(a.lignes.some(l => l.ecart !== 0), "le réglage a un effet sur au moins une série (" + type + ", facteur n° " + (m0.facteurs.indexOf(f) + 1) + ")");
  }
  sc().reglages = Object.fromEntries(m0.facteurs.map(f => [f.nom, { type: "haut", v: 0, saison: "tout" }]));
  const haut = simCalculer(sc());
  verifier(haut.extrap.length === 0, "le niveau haut habituel (P90 des mêmes mois) reste dans la plage observée : pas d'avertissement");
  sc().reglages = Object.fromEntries(m0.facteurs.map(f => [f.nom, { type: "pct", v: 50, saison: "tout" }]));
  const fort = simCalculer(sc());
  verifier(fort.extrap.length > 0 && fort.extrap.every(x => x.haut > 0 && x.max > x.obsMax), "+50 % partout : extrapolation signalée au-dessus du maximum observé");
  verifier(/Extrapolation/.test(page()) && /À lire avant de conclure/.test(texteDe(app)), "l'avertissement d'extrapolation est affiché sur la page");
  vider();

  /* ---- 3. Cas connus : classeur synthétique, réponses calculées à la main ---- */
  const grille = lignes => { const g = []; lignes.forEach((l, i) => { g[i + 1] = [null].concat(l); }); return g; };
  const jours = Array.from({ length: 12 }, (x, i) => "2024-" + String(i + 1).padStart(2, "0") + "-01");
  const f1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120], f2 = [300, 250, 200, 100, 50, 0, 0, 0, 40, 120, 220, 310];
  const noms = ["Compteur général", "Atelier", "Four"];
  const synth = {
    "CONSO": grille([["Date"].concat(noms)].concat(jours.map((d, i) => [d, 5000 + i, i === 2 ? 0 : 900 + i, 2000 + i]))),          // « Atelier » sans donnée en mars
    "FACTEURS INF": grille([["Date", "Tonnage [t]", "DJU chauffage"]].concat(jours.map((d, i) => [d, f1[i], f2[i]]))),
    "EQUATION": grille([["Facteurs"].concat(noms), ["Base", 100, 10, 50], ["Tonnage [t]", 2, 1, 0], ["DJU chauffage", 3, 0, 4]]),
    "EQUATION 2": grille([["Facteurs"].concat(noms), ["Base", null, null, 20], ["Tonnage [t]", null, null, 0.5], ["DJU chauffage"]]),
    "WIKI": grille([["NAME"].concat(noms), ["Energy type", "Gaz", "Gaz", "Gaz"], ["Level", "Site", "UES", "UES"], ["Asset", 1, 1, 1], ["Weekly target"], ["Err day"], ["Err week"], ["Err month", 0.05, 0.05, 0.05], ["Err year"],
      ["Type de modele", "Simple", "Simple", "saisonnier"], ["Été", null, null, "2024-05-01"], ["Hiver", null, null, "2024-08-31"], ["Été 2"], ["Hiver 2"], ["R²", 0.9, 0.5, 0.8]])
  };
  charger(synth, false, "synthetique.xlsx", null);
  const m = etat.modele, kWh = (l, c) => l[c] / 1000;
  verifier(sim.modele === m && sim.scenarios.length === 1 && !Object.keys(sc().reglages).length, "changer de classeur remet le simulateur à zéro");
  verifier(sim.eq.series.every(e => e.ok && e.ecartMax === 0), "synthétique : rejeu = ref pour les trois séries");
  let r = simCalculer(sc());
  verifier(proche(kWh(r.lignes[0], "ref"), 7530), "synthétique : référence du site = 1 200 + 2 × 780 + 3 × 1 590 = 7 530 kWh");
  verifier(r.lignes[1].n === 11 && r.lignes[1].simu[2] === null, "synthétique : la date sans consommation n'a ni référence ni simulation");
  verifier(sim.eq.series[2].q.join("") === "000011110000", "synthétique : la saison d'été du modèle saisonnier couvre mai à août");
  sc().reglages = { "Tonnage [t]": { type: "pct", v: 10, saison: "tout" } };
  r = simCalculer(sc());
  verifier(proche(kWh(r.lignes[0], "ecart"), 156) && proche(kWh(r.lignes[1], "ecart"), 75) && proche(kWh(r.lignes[2], "ecart"), 13), "tonnage +10 % : +156 kWh (site), +75 kWh (atelier, mars exclu), +13 kWh (four, équation d'été seulement)");
  verifier(proche(r.lignes[0].euros, 0.156 * 65.7) && proche(r.lignes[0].co2, 156 * 0.215), "valorisation de l'écart aux valeurs de valoDe : 10,25 € et 33,54 kgCO2e");
  verifier(r.extrap.length === 1 && r.extrap[0].haut === 2 && r.extrap[0].n === 12 && proche(r.extrap[0].max, 132), "tonnage +10 % : 2 périodes sur 12 dépassent le maximum observé (121 et 132 pour 120)");
  verifier(/Modèle fragile/.test(page()) && /Atelier \(0,5\)/.test(texteDe(app)), "R² faible : la série touchée dont le R² vaut 0,5 est signalée");
  sc().reglages["Tonnage [t]"].v = 20;
  r = simCalculer(sc());
  verifier(proche(kWh(r.lignes[0], "ecart"), 312) && proche(kWh(r.lignes[1], "ecart"), 150) && proche(kWh(r.lignes[2], "ecart"), 26), "tonnage +20 % : exactement le double (312, 150 et 26 kWh)");
  sc().reglages = { "DJU chauffage": { type: "abs", v: 50, saison: "hiver" } };
  r = simCalculer(sc());
  verifier(proche(kWh(r.lignes[0], "ecart"), 900) && r.lignes[1].ecart === 0 && proche(kWh(r.lignes[2], "ecart"), 1200), "DJU +50 en hiver (6 mois) : +900 kWh (site), 0 (atelier), +1 200 kWh (four)");
  verifier(r.extrap.length === 1 && r.extrap[0].haut === 2 && r.extrap[0].bas === 0 && r.extrap[0].n === 6 && r.extrap[0].max === 360 && r.extrap[0].obsMax === 310, "DJU +50 en hiver : 2 périodes sur 6 au-dessus du maximum observé (350 et 360 pour 310)");
  verifier(r.energies[0].nonAdditif && proche(r.energies[0].ecart, 900000) && proche(r.energies[0].ecartUES, 1200000), "Site (+900) et somme des UES (+1 200) ne s'additionnent pas : signalé");
  verifier(/ne s'additionnent pas/.test(page()) && /Non réparti/.test(texteDe(app)), "la non-additivité Site / UES est dite à l'écran");
  sc().reglages = { "DJU chauffage": { type: "abs", v: -100, saison: "ete" } };
  r = simCalculer(sc());
  verifier(r.extrap[0].bas === 5 && r.extrap[0].haut === 0 && r.extrap[0].n === 6, "DJU −100 en été : 5 périodes sur 6 sous le minimum observé");
  verifier(proche(kWh(r.lignes[0], "ecart"), -1800) && r.lignes[0].neg === 3 && r.lignes[1].neg === 0 && r.lignes[2].neg === 1, "DJU −100 en été : −1 800 kWh sur le site ; consommation simulée négative sur 3 périodes (site) et 1 (four), comptées");
  sc().reglages = { "DJU chauffage": { type: "abs", v: -400, saison: "tout" } };
  verifier(simCalculer(sc()).lignes[0].neg > 0 && /Consommation simulée négative/.test(page()), "une consommation simulée négative est signalée");
  sc().reglages = { "DJU chauffage": { type: "haut", v: 0, saison: "hiver" } };
  const X2 = simFacteurs(sc());
  verifier(proche(X2[1][0], 302) && X2[1][5] === 0 && X2[0] === sim.eq.X[0], "niveau haut habituel en janvier = P90 des 9 valeurs des mois voisins = 302 ; l'été et les autres facteurs ne bougent pas");
  verifier(simDansSaison(Date.UTC(2024, 0, 15), "hiver") && !simDansSaison(Date.UTC(2024, 6, 15), "hiver") && simDansSaison(Date.UTC(2024, 6, 15), "ete") && simDansSaison(Date.UTC(2024, 6, 15), "tout"), "saisons : janvier en hiver, juillet en été");
  vider();
  sc().prix = { Gaz: 100 };
  r = simCalculer(sc());
  verifier(r.lignes[0].ecart === 0 && proche(r.lignes[0].euros, 7.53 * (100 - 65.7)), "prix seul modifié : pas d'écart d'énergie, coût = référence × (100 − 65,7) €/MWh");
  sc().reglages = { "Tonnage [t]": { type: "pct", v: 10, saison: "tout" } };
  r = simCalculer(sc());
  verifier(proche(r.lignes[0].euros, 7.686 * 100 - 7.53 * 65.7), "prix et volume modifiés : coût simulé au prix du scénario moins coût de référence au prix de référence (273,88 €)");
  sc().fe = { Gaz: 0.3 };
  verifier(proche(simCalculer(sc()).lignes[0].co2, 7686 * 0.3 - 7530 * 0.215), "facteur d'émission du scénario appliqué à la simulation");
  vider();
  const sens = simSensibilite(sim.eq.series[0]), sensFour = simSensibilite(sim.eq.series[2]);
  verifier(proche(sens[0].pct, 15600) && proche(sens[0].unite, 2000) && proche(sens[1].pct, 47700) && proche(sens[1].unite, 3000), "sensibilité du site : +1 % de tonnage = 15,6 kWh, +1 t par période = 2 kWh ; +1 % de DJU = 47,7 kWh, +1 DJU = 3 kWh");
  verifier(proche(sensFour[0].unite, 0.5 * 4 / 12 * 1000) && proche(sensFour[0].pct, 0.5 * 260 * 10), "sensibilité d'un modèle saisonnier : moyenne des deux équations sur la période");

  // série qui ne se laisse pas rejouer : retirée et dite, pas de chiffre faux
  m.series[1].ref[0] += 5;
  simInitialiser(m);
  verifier(!sim.eq.series[1].ok && sim.eq.series[0].ok, "une référence qui ne correspond pas aux équations rend la série non rejouable");
  let texte = page();
  verifier(/Retirée\(s\) du simulateur/.test(texte) && simCalculer(sc()).lignes.length === 2, "la série non rejouable est retirée du simulateur et l'écran le dit");
  m.series[1].ref[0] -= 5;
  simInitialiser(m);

  // phrases → réglages par le script de démonstration (noms inventés)
  const N = ["Tonnage produit [t]", "DJU chaud base 18 (Chauffage)", "DJU froid base 18 (Climatisation)", "Taux d'occupation [%]"];
  const ana = p => simAnalyser(p, N), un = (o, nom, type, valeur, saison) => o.facteurs.length === 1 && o.facteurs[0].facteur === nom && o.facteurs[0].type === type && o.facteurs[0].valeur === valeur && o.facteurs[0].saison === saison;
  let o = ana("Et si la production montait de 10 % et que l'hiver était froid ?");
  verifier(o.facteurs.length === 2 && o.facteurs[0].facteur === N[0] && o.facteurs[0].type === "pourcentage" && o.facteurs[0].valeur === 10 && o.facteurs[0].saison === "toute_la_periode"
    && o.facteurs[1].facteur === N[1] && o.facteurs[1].type === "niveau_haut" && o.facteurs[1].saison === "hiver" && !o.non_compris.length, "script : « production +10 % et hiver froid » → pourcentage sur la production, niveau haut du chauffage en hiver");
  verifier(un(ana("si les DJU froid augmentent de 20 %"), N[2], "pourcentage", 20, "toute_la_periode"), "script : un nom de facteur cité mot pour mot l'emporte sur le vocabulaire (DJU froid = climatisation)");
  verifier(un(ana("Et si l'occupation baissait de 15 % en été ?"), N[3], "pourcentage", -15, "ete"), "script : baisse en pourcentage, en été");
  verifier(un(ana("et si l'hiver était doux"), N[1], "niveau_bas", 0, "hiver"), "script : hiver doux → niveau bas du chauffage en hiver");
  verifier(un(ana("une canicule cet été"), N[2], "niveau_haut", 0, "ete"), "script : canicule → niveau haut de la climatisation en été");
  verifier(un(ana("tonnage +3,5 %"), N[0], "pourcentage", 3.5, "toute_la_periode") && un(ana("le tonnage augmente de 40 tonnes"), N[0], "valeur", 40, "toute_la_periode"), "script : décimale à virgule, et variation en valeur");
  verifier(un(ana("What if production dropped by 8% and nothing else?"), N[0], "pourcentage", -8, "toute_la_periode") && un(ana("a mild winter"), N[1], "niveau_bas", 0, "hiver"), "script : phrases en anglais");
  o = ana("Et si le taux d'humidité montait de 10 % ?");
  verifier(!o.facteurs.length && !o.prix.length && o.non_compris.length === 1 && /humidité/.test(o.non_compris[0]), "script : un facteur inexistant n'est pas deviné, le passage va dans « non compris »");
  o = ana("si le prix du gaz augmente de 20 %");
  verifier(o.prix.length === 1 && o.prix[0].grandeur === "prix" && o.prix[0].type === "pourcentage" && o.prix[0].valeur === 20, "script : variation de prix en pourcentage");

  // parcours en démonstration sur le classeur synthétique : phrase → proposition → confirmation → calcul
  agent.demo = true;
  sim.phrase = "Et si le tonnage baissait de 5 %, que l'hiver était froid et que le prix du gaz augmentait de 20 % ?";
  await simLancer();
  verifier(!sim.erreur && sim.prop && sim.prop.reglages["Tonnage [t]"].v === -5 && sim.prop.reglages["DJU chauffage"].type === "haut" && sim.prop.reglages["DJU chauffage"].saison === "hiver" && proche(sim.prop.prix.Gaz, 65.7 * 1.2) && !sim.prop.refus.length,
    "démonstration : la phrase donne trois réglages, le prix est calculé par la page (65,7 × 1,2)");
  verifier(!Object.keys(sc().reglages).length, "rien n'est appliqué avant la confirmation");
  texte = page();
  verifier(/par le script de démonstration \(mots-clés, sans IA\)/.test(texte) && /Mode démonstration : aucune IA/.test(texte), "l'écran dit que la traduction vient d'un script, pas d'une IA");
  cliquer(trouver(app, n => n.tagName === "BUTTON" && /^Appliquer à/.test(n.textContent))[0]);
  verifier(sc().reglages["Tonnage [t]"].v === -5 && proche(sc().prix.Gaz, 78.84) && sim.prop === null, "après confirmation, les réglages sont dans le scénario");
  verifier(proche(kWh(simCalculer(sc()).lignes[1], "ecart"), -37.5), "et la page calcule : atelier −37,5 kWh pour −5 % de tonnage");
  sim.phrase = "Et si le taux d'humidité montait de 10 % ?";
  await simLancer();
  texte = page();
  verifier(sim.prop && !sim.prop.lignes.length && /Aucun réglage reconnu/.test(texte) && /Non compris : « [^»]*humidité/.test(texte), "démonstration : facteur inexistant → aucun réglage, et le passage non compris est affiché");
  verifier(trouver(app, n => n.tagName === "BUTTON" && /^Appliquer à/.test(n.textContent))[0].disabled, "le bouton « Appliquer » est désactivé quand rien n'est reconnu");
  sim.phrase = "";
  await simLancer();
  verifier(sim.erreur === "Écrivez d'abord une phrase.", "phrase vide : message, pas de traduction");
  verifier(__reseau.length === 0, "aucun appel réseau en mode démonstration");

  // avec un faux modèle : ce qu'il reçoit, ce que la page garde de sa réponse
  let recu = null;
  let p = await simProposer("Tonnage en hausse l'été, humidité en hausse, gaz à 90 euros", fauxModele(requete => { recu = requete; return [{ type: "text", text: "Voici." }, { type: "tool_use", id: "t1", name: "sim_regler_scenario", input: {
    facteurs: [{ facteur: "Tonnage [t]", type: "pourcentage", valeur: 12.5, saison: "ete" }, { facteur: "Taux d'humidité", type: "pourcentage", valeur: 10, saison: "toute_la_periode" }, { facteur: "DJU chauffage", type: "pourcentage", valeur: -150, saison: "hiver" }],
    prix: [{ energie: "gaz naturel", grandeur: "prix", type: "valeur_fixe", valeur: 90 }, { energie: "fioul", grandeur: "prix", type: "valeur_fixe", valeur: 80 }], non_compris: ["et qu'il pleuve"] } }]; }));
  verifier(Object.keys(p.reglages).length === 1 && p.reglages["Tonnage [t]"].type === "pct" && p.reglages["Tonnage [t]"].v === 12.5 && p.reglages["Tonnage [t]"].saison === "ete", "faux modèle : le réglage valide est gardé");
  verifier(p.prix.Gaz === 90 && Object.keys(p.prix).length === 1, "faux modèle : « gaz naturel » est rapproché de l'énergie du classeur, « fioul » ne l'est pas");
  verifier(p.refus.length === 4 && p.refus.some(t => /Facteur inconnu[^«]*« Taux d'humidité »/.test(t)) && p.refus.some(t => /Réglage illisible/.test(t)) && p.refus.some(t => /fioul/.test(t)) && p.refus.some(t => /et qu'il pleuve/.test(t)),
    "faux modèle : facteur inexistant, pourcentage impossible, énergie inconnue et passage non compris sont laissés de côté et dits");
  const envoi = JSON.stringify(recu), liste = JSON.parse(/Facteurs influents \(JSON\) : (\[.*\])$/.exec(recu.messages[0].content)[1]);
  verifier(recu.messages.length === 1 && recu.messages[0].content.startsWith("Phrase : Tonnage en hausse l'été, humidité en hausse, gaz à 90 euros\n\n") && recu.tools.length === 1 && recu.tools[0].name === "sim_regler_scenario" && recu.tools[0].strict === true, "le modèle reçoit la phrase et un seul outil, strict");
  verifier(liste.length === 2 && liste.every(x => Object.keys(x).join() === "nom,min,max") && liste[0].min === 10 && liste[0].max === 120 && liste[1].max === 310, "avec les noms des facteurs et leur plage observée, rien d'autre");
  verifier(noms.every(n => !envoi.includes(n)) && !envoi.includes("synthetique") && !envoi.includes("65.7"), "ni nom de série, ni nom de fichier, ni prix dans la requête");
  let tours = 0;
  const muet = await simProposer("phrase", fauxModele(() => { tours++; return [{ type: "text", text: "Je ne sais pas." }]; })).then(() => null, e => e.message);
  verifier(tours === 2 && muet === "Le modèle n'a pas rendu de réglages exploitables.", "un modèle qui n'appelle pas l'outil est relancé une fois, puis l'échec est dit");
  p = await simProposer("phrase", fauxModele(() => [{ type: "tool_use", id: "t2", name: "sim_regler_scenario", input: { facteurs: "n'importe quoi", prix: null } }]));
  verifier(!p.lignes.length && !p.refus.length, "une réponse mal formée ne casse rien et ne règle rien");

  // mode IA : rien ne part sans l'accord propre au simulateur ; puis ce qui part réellement par le chemin existant (réseau simulé)
  agent.demo = false; agent.fournisseur = "anthropic"; agent.accord = false; champCle.value = "";
  sim.phrase = "Et si le tonnage montait de 10 % ?";
  texte = page();
  verifier(/Traduction par l'IA impossible pour l'instant/.test(texte) && boutons("Traduire en réglages")[0].disabled, "mode IA sans réglage de l'envoi : bouton désactivé et message");
  agent.accord = "anthropic"; champCle.value = "cle-de-test";
  texte = page();
  verifier(/Avant le premier envoi : ce qui quittera ce poste/.test(texte) && /la phrase que vous avez écrite, telle quelle/.test(texte) && /les noms des 2 facteurs influents/.test(texte) && /Ne sont pas envoyés/.test(texte), "l'avis d'envoi du simulateur liste ce qui part et ce qui ne part pas");
  verifier(boutons("Traduire en réglages")[0].disabled, "l'accord donné sur la page Instruction ne suffit pas : bouton désactivé tant que l'avis du simulateur n'est pas accepté");
  await simLancer();
  verifier(/Autorisez d'abord l'envoi de la phrase/.test(sim.erreur) && __reseau.length === 0, "sans accord sur l'avis du simulateur, rien n'est envoyé");
  cliquer(trouver(app, n => n.tagName === "BUTTON" && /^J'autorise cet envoi/.test(n.textContent)).pop());
  verifier(sim.accord === "anthropic" && !boutons("Traduire en réglages")[0].disabled, "l'accord se donne par un clic sur l'avis du simulateur");
  const vraiFetch = globalThis.fetch;
  let corps = null;
  globalThis.fetch = async (url, options) => { corps = { url: String(url), json: JSON.parse(options.body) };
    return { ok: true, status: 200, json: async () => ({ id: "msg_x", type: "message", role: "assistant", model: "modele-simule", stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu_x", name: "sim_regler_scenario", input: { facteurs: [{ facteur: "Tonnage [t]", type: "pourcentage", valeur: 10, saison: "toute_la_periode" }], prix: [], non_compris: [] } }] }) }; };
  cliquer(boutons("Traduire en réglages")[0]);
  verifier(sim.enCours && boutons("Arrêter").length === 1, "pendant l'appel : état « en cours » et bouton « Arrêter »");
  await attendreFin();
  globalThis.fetch = vraiFetch;
  verifier(!sim.erreur && sim.prop && sim.prop.reglages["Tonnage [t]"].v === 10 && /modele-simule/.test(sim.prop.source), "mode IA (réseau simulé) : la proposition vient du modèle et porte sa signature");
  verifier(corps && corps.url === IA.url && corps.json.messages.length === 1 && corps.json.messages[0].content === simMessage("Et si le tonnage montait de 10 % ?") && noms.every(n => !JSON.stringify(corps.json).includes(n)), "ce qui quitte le poste par le chemin existant : la phrase, les facteurs et leurs plages, aucun nom de série");
  verifier(/Réglages compris par Claude/.test(texteDe(app)), "la proposition affichée nomme le modèle");
  const lent = new Promise(() => {});
  globalThis.fetch = (url, options) => new Promise((ok, ko) => options.signal.addEventListener("abort", () => ko(new DOMException("arrêt", "AbortError"))));
  const enVol = simLancer();
  await new Promise(x => setTimeout(x, 10));
  cliquer(boutons("Arrêter")[0]);
  await enVol;
  globalThis.fetch = vraiFetch;
  verifier(sim.erreur === "Traduction arrêtée." && !sim.enCours && sim.prop === null, "une traduction en cours s'arrête");
  // même parcours par l'adaptateur Gemini existant (réseau simulé) : l'outil du module passe la conversion de schéma
  agent.fournisseur = "gemini"; agent.accord = "gemini"; champCleGemini.value = "cle-de-test";
  await simLancer();
  verifier(/Autorisez d'abord l'envoi de la phrase/.test(sim.erreur), "l'accord du simulateur vaut pour un fournisseur : changer de fournisseur le redemande");
  sim.accord = "gemini"; corps = null;
  globalThis.fetch = async (url, options) => { corps = { url: String(url), json: JSON.parse(options.body) };
    return { ok: true, status: 200, json: async () => ({ modelVersion: "gemini-simule", candidates: [{ finishReason: "STOP", content: { parts: [{ functionCall: { name: "sim_regler_scenario", args: { facteurs: [{ facteur: "DJU chauffage", type: "niveau_bas", valeur: 0, saison: "hiver" }], prix: [], non_compris: [] } } }] } }] }) }; };
  await simLancer();
  globalThis.fetch = vraiFetch;
  verifier(!sim.erreur && sim.prop && sim.prop.reglages["DJU chauffage"].type === "bas" && /gemini-simule/.test(sim.prop.source), "adaptateur Gemini (réseau simulé) : la proposition est lue");
  verifier(corps && !JSON.stringify(corps.json).includes("additionalProperties") && corps.json.tools[0].functionDeclarations[0].name === "sim_regler_scenario" && corps.json.contents.length === 1 && corps.json.contents[0].parts[0].text === simMessage("Et si le tonnage montait de 10 % ?") && noms.every(n => !JSON.stringify(corps.json).includes(n)),
    "adaptateur Gemini : schéma de l'outil converti, et le même contenu quitte le poste");
  agent.demo = true; agent.fournisseur = "gemini"; agent.accord = false; champCle.value = ""; champCleGemini.value = ""; sim.accord = false; sim.erreur = null; sim.phrase = ""; sim.prop = null;

  /* ---- 4. Retour au classeur réel : parcours à l'écran, scénarios, langues ---- */
  charger(G0, d0, nom0, null);
  const mr = etat.modele;
  verifier(sim.modele === mr && sim.scenarios.length === 1 && sim.eq.series.every(e => e.ok), "retour au classeur réel : simulateur réinitialisé");
  texte = page();
  verifier(/pas une prévision/.test(texte) && /Aucun réglage : la simulation est égale à la référence/.test(texte), "page vide : dit que c'est une simulation, pas une prévision, et qu'aucun réglage n'est posé");
  verifier(mr.series.every(s => texte.includes(s.nom)) && mr.facteurs.every(f => texte.includes(f.nom)), "toutes les séries et tous les facteurs sont à l'écran");
  // réglages d'un clic et champs
  cliquer(boutons("+10 %")[0]);
  verifier(sc().reglages[mr.facteurs[0].nom].type === "pct" && sc().reglages[mr.facteurs[0].nom].v === 10, "un clic sur « +10 % » règle le premier facteur");
  cliquer(boutons("Niveau haut habituel")[1]);
  verifier(sc().reglages[mr.facteurs[1].nom].type === "haut", "un clic sur « Niveau haut habituel » règle le deuxième facteur");
  const saisons = trouver(app, n => n.tagName === "SELECT" && n.children.some(c => c.attrs.value === "hiver"));
  saisons[1].dispatchEvent({ type: "change", target: { value: "hiver" } });
  verifier(sc().reglages[mr.facteurs[1].nom].saison === "hiver" && sc().reglages[mr.facteurs[1].nom].type === "haut", "la saison se choisit sans perdre le réglage");
  const variation = trouver(app, n => n.tagName === "INPUT" && n.attrs.type === "number" && /^Variation de /.test(n.attrs["aria-label"] || ""));
  variation[2].dispatchEvent({ type: "change", target: { value: "-25" } });
  verifier(sc().reglages[mr.facteurs[2].nom].v === -25 && sc().reglages[mr.facteurs[2].nom].type === "pct", "une variation saisie au clavier est prise en pourcentage par défaut");
  const prix = trouver(app, n => n.tagName === "INPUT" && /^(Prix de l'énergie|Energy price) /.test(n.attrs["aria-label"] || ""));
  prix[0].dispatchEvent({ type: "change", target: { value: "200" } });
  verifier(sc().prix[mr.energies[0]] === 200, "le prix d'une énergie se règle dans le scénario");
  const avant = JSON.stringify(valoDe(mr.energies[0]));
  texte = page();
  verifier(JSON.stringify(valoDe(mr.energies[0])) === avant, "le prix du scénario ne modifie pas les hypothèses communes (valoDe)");
  verifier(/Prix, /.test(texte) && /200 €\/MWh/.test(texte), "le prix du scénario apparaît dans la comparaison");
  cliquer(boutons("Effacer")[0]);
  verifier(!sc().reglages[mr.facteurs[0].nom], "« Effacer » retire le réglage d'un facteur");

  // jusqu'à trois scénarios, tableau copiable
  cliquer(boutons("Dupliquer")[0]);
  verifier(sim.scenarios.length === 2 && sim.courant === 1 && sim.scenarios[1].reglages !== sim.scenarios[0].reglages && JSON.stringify(sim.scenarios[1].reglages) === JSON.stringify(sim.scenarios[0].reglages), "« Dupliquer » crée une copie indépendante");
  cliquer(boutons("Nouveau scénario")[0]);
  verifier(sim.scenarios.length === 3 && !Object.keys(sc().reglages).length && new Set(sim.scenarios.map(x => x.nom)).size === 3, "trois scénarios, trois noms différents");
  verifier(boutons("Nouveau scénario")[0].disabled && boutons("Dupliquer")[0].disabled && /Trois scénarios au plus/.test(texteDe(app)), "pas de quatrième scénario : boutons désactivés et message");
  const nomChamp = trouver(app, n => n.tagName === "INPUT" && n.attrs["aria-label"] === "Nom du scénario")[0];
  nomChamp.dispatchEvent({ type: "change", target: { value: "Hiver rude" } });
  verifier(sc().nom === "Hiver rude" && /Hiver rude/.test(texteDe(app)), "un scénario se renomme");
  let copie = null;
  navigator.clipboard.writeText = async t => { copie = t; };
  cliquer(boutons("Copier")[0]);
  await new Promise(x => setTimeout(x, 5));
  const lignesCopie = (copie || "").split("\n").map(l => l.split("\t"));
  verifier(lignesCopie.length >= 5 && lignesCopie.every(l => l.length === 4) && lignesCopie[0][3] === "Hiver rude" && lignesCopie[0][0] === "Indicateur", "le tableau de comparaison se copie : une colonne par scénario, séparées par des tabulations");
  verifier(lignesCopie.some(l => /Coût/.test(l[0]) && /€/.test(l[1])) && lignesCopie.some(l => /Émissions/.test(l[0]) && /CO₂e/.test(l[1])), "la copie contient le coût et les émissions de chaque scénario");
  cliquer(boutons("Supprimer")[0]);
  verifier(sim.scenarios.length === 2 && !sim.scenarios.some(x => x.nom === "Hiver rude"), "« Supprimer » retire le scénario affiché");

  // parcours complet à l'écran en démonstration, sur le classeur réel
  sim.courant = 0; vider();
  const prod = mr.facteurs.filter(f => /^prod/.test(simNorme(f.nom))), chauffe = mr.facteurs.filter(f => /chauff/.test(simNorme(f.nom)));
  page();
  const champ = trouver(app, n => n.tagName === "INPUT" && n.attrs["aria-label"] === "Scénario en une phrase")[0];
  champ.value = "Et si la production montait de 10 % et que l'hiver était froid ?";
  champ.dispatchEvent({ type: "input", target: champ });
  verifier(!boutons("Traduire en réglages")[0].disabled, "le bouton de traduction s'active quand une phrase est écrite");
  cliquer(boutons("Traduire en réglages")[0]);
  await attendreFin();
  verifier(!sim.erreur && sim.prop && Object.keys(sim.prop.reglages).length === prod.length + chauffe.length && prod.every(f => sim.prop.reglages[f.nom].type === "pct" && sim.prop.reglages[f.nom].v === 10) && chauffe.every(f => sim.prop.reglages[f.nom].type === "haut" && sim.prop.reglages[f.nom].saison === "hiver"),
    "classeur réel, démonstration : la phrase d'exemple règle " + prod.length + " facteur(s) de production à +10 % et " + chauffe.length + " facteur(s) de chauffage au niveau haut en hiver");
  cliquer(trouver(app, n => n.tagName === "BUTTON" && /^Appliquer à/.test(n.textContent))[0]);
  const fin = simCalculer(sc());
  verifier(prod.length + chauffe.length === 0 || fin.lignes.some(l => l.ecart > 0), "le scénario appliqué augmente la consommation simulée d'au moins une série");
  verifier(__reseau.length === 0, "toujours aucun appel réseau en mode démonstration");

  // rendu : tableaux, sensibilité à l'unité, pas mensuel, anglais, copie figée
  for (const id of ["sim-courbe", "sim-ues", "sim-facteurs"]) etat.tables.add(id);
  sim.sens = "unite"; etat.gran = "month";
  texte = page();
  verifier(/Voir le graphique/.test(texte) && /Somme des UES/.test(texte), "les cartes se rendent aussi en tableau");
  etat.tables.clear(); sim.sens = "pct"; etat.gran = "week";
  const fr = page();
  LANGUE = "en"; CACHE_TR.clear();
  const en = page();
  verifier(/What-if simulator/.test(en) && /not a forecast/.test(en) && /Scenario settings/.test(en) && /Simulated gap by SEU/.test(en) && /Sensitivity: what each variable weighs/.test(en) && /Read before concluding/.test(en) && /Method\. The page reads/.test(en), "la page se rend en anglais");
  const resteFr = ["Réglages", "Écart simulé", "Référence", "facteur", "période", "scénario "].filter(t => en.includes(t));
  verifier(!resteFr.length, "pas de texte fixe français resté dans la page anglaise" + (resteFr.length ? " : " + resteFr.join(", ") : ""));
  agent.demo = false; agent.fournisseur = "gemini";
  const enIA = page();
  verifier(/Before the first send/.test(enIA) && /the sentence you wrote, as is/.test(enIA) && /Not sent: consumption/.test(enIA) && /AI translation is not possible yet/.test(enIA), "l'avis d'envoi et le blocage se rendent en anglais");
  agent.demo = true;
  LANGUE = "fr"; CACHE_TR.clear();
  verifier(page() === fr, "retour au français : même page qu'avant");
  charger(JSON.parse(JSON.stringify(G0)), d0, nom0, "01/01/2026");                    // copie figée : les grilles reviennent d'un JSON
  verifier(etat.figee && sim.eq.series.length === mr.series.length && sim.eq.series.every(e => e.ok && e.ecartMax <= SIM.tol), "copie figée : les équations relues dans les grilles enregistrées redonnent encore « ref »");
  verifier(page().length > 2000, "la page se rend dans une copie figée (le module n'écrit rien dans le stockage du navigateur)");
  charger(G0, d0, nom0, null);
  for (const o2 of ONGLETS) { etat.onglet = o2[0]; rendre(); verifier(texteDe(app).length > 200, "la page « " + o2[0] + " » se rend toujours"); }
  verifier(__reseau.length === 0, "bilan : aucun appel réseau pendant tout le test");
}
