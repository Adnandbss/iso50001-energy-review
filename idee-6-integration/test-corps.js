/* Essais du module Intégration. Le banc a déjà chargé le classeur de référence : on garde ses grilles pour comparer le format, puis on suit le parcours du module
   sur les fichiers d'essai (en chaînes à la fin de ce fichier, fabriqués par generer.js à partir de modèles connus). */
async function test() {
  verifier.bavard = false;
  const REF = grillesChargees, serieRef = etat.modele.series.length;
  const utf8 = s => new TextEncoder().encode(s).buffer, latin1 = s => Uint8Array.from(s, c => c.charCodeAt(0)).buffer, base64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;
  const fichier = (name, buf) => ({ name, arrayBuffer: async () => buf });
  const jour = t => t == null ? null : new Date(t).toISOString().slice(0, 10), proche = (a, b, tol) => Math.abs(a - b) <= tol;
  const bouton = (racine, debut) => trouver(racine, n => n.tagName === "BUTTON" && n.textContent.startsWith(debut))[0];
  const codes = l => l.map(a => a[0]).join(",");
  const E = ITG_ESSAIS, V = ITG_VERITE;

  /* ---- 1. Lecture ---- */
  let d = itgDecoder(latin1(E.large));
  verifier(d.codage === "Windows-1252" && d.texte.includes("Élec général"), "un fichier Windows-1252 est décodé avec ses accents");
  verifier(itgDecoder(utf8(E.mois)).codage === "UTF-8" && itgDecoder(utf8("﻿a;b")).texte === "a;b", "UTF-8 reconnu, marque d'ordre des octets retirée");
  const csvLarge = itgLireCsv(E.large), csvLong = itgLireCsv(E.long), csvMois = itgLireCsv(E.mois);
  verifier(csvLarge.sep === ";" && csvLong.sep === "," && csvMois.sep === "\t", "séparateurs détectés : point-virgule, virgule, tabulation");
  verifier(csvLong.lignes.some(l => l[1] === "Air comprime, compresseurs") && csvLong.lignes.every(l => l.length === 5), "un champ entre guillemets qui contient le séparateur reste une seule cellule");
  verifier(JSON.stringify(itgLireCsv('a,b\n"x ""y""\nz",2\n').lignes) === '[["a","b"],["x \\"y\\"\\nz","2"]]', "guillemets doublés et retour à la ligne dans un champ");
  // dates
  const D = [["03/04/2023", "2023-04-03"], ["3.4.23", "2023-04-03"], ["2024-02-29", "2024-02-29"], ["2023-02-30", null], ["31/04/2024", null], ["2024-03-10 14:30", "2024-03-10"], ["janv. 2024", "2024-01-01"], ["Février 2023", "2023-02-01"],
    ["1er mars 2024", "2024-03-01"], ["15 août 2023", "2023-08-15"], ["déc-23", "2023-12-01"], ["Jul 2024", "2024-07-01"], ["2024 juin", "2024-06-01"], ["12/2023", "2023-12-01"], ["2024-05", "2024-05-01"], ["Total", null], ["12,5", null], ["Total 2023", null]];
  for (const [txt, attendu] of D) verifier(jour(itgDate(txt)) === attendu, "date « " + txt + " » lue " + attendu + " (obtenu " + jour(itgDate(txt)) + ")");
  verifier(itgDate("2024-03-10 14:30") === Date.UTC(2024, 2, 10, 14, 30), "heure lue");
  let dd = itgEnDates(["01/02/2024", "15/02/2024", "n.d.", "29/02/2024"]);
  verifier(dd.type === "date" && jour(dd.valeurs[1]) === "2024-02-15" && dd.valeurs[2] === null, "colonne de dates reconnue, une valeur manquante tolérée");
  verifier(itgEnDates(["12,5", "13,1", "ok"]).type === undefined && itgEnDates(["", "-"]).type === "vide", "une colonne de nombres n'est pas une colonne de dates ; colonne vide reconnue");
  // nombres
  const Nb = [["1 234,56", ",", 1234.56], ["1.234,56", ",", 1234.56], ["1,234.56", ".", 1234.56], ["-12,5", ",", -12.5], ["−3", ",", -3], ["1e3", ".", 1000], ["12 kWh", ",", null], ["1 234", ",", 1234]];
  for (const [txt, dec, attendu] of Nb) verifier(itgNombre(txt, dec) === attendu, "nombre « " + txt + " » lu " + attendu);
  verifier(itgManque("n.d.") && itgManque("-") && itgManque("") && itgManque("N/A") && !itgManque("0") && !itgManque(0), "valeurs manquantes reconnues, zéro gardé");
  let vo = itgVotes(["12,5", "1 234,5", "0,125"]); verifier(vo.v === 3 && vo.p === 0, "votes : virgule décimale");
  vo = itgVotes(["1,234", "12,345"]); verifier(vo.v === 0 && vo.p === 0 && vo.amb === 2, "« 1,234 » est indécidable seul");
  vo = itgVotes(["1,234,567", "12.5"]); verifier(vo.p === 2, "virgule répétée = milliers, donc point décimal");
  const I = [["Élec général (kWh)", "Élec général", "kWh"], ["Gaz PCE [MWh]", "Gaz PCE", "MWh"], ["Atelier presses kWh", "Atelier presses", "kWh"], ["CPT_GAZ_MWh", "CPT GAZ", "MWh"], ["DJU (Chauffage)", "DJU (Chauffage)", null], ["Prod [t/S]", "Prod", "t/S"], ["Temp. ext. (°C)", "Temp. ext.", "°C"]];
  for (const [txt, nom, unite] of I) { const r = itgIntitule(txt); verifier(r.nom === nom && r.unite === unite, "intitulé « " + txt + " » -> « " + nom + " », unité " + unite + " (obtenu « " + r.nom + " », " + r.unite + ")"); }
  verifier(itgUniteEnergie("MWh PCS") === "MWh" && itgUniteEnergie("kwh/sem") === "kWh" && itgUniteEnergie("Wh") === "Wh" && itgUniteEnergie("kW") === null && itgUniteEnergie("m3") === null, "unités d'énergie reconnues, puissance et volume écartés");
  // Excel quelconque
  const feuilles = await itgLireExcel(base64(E.classeur64));
  verifier(feuilles.length === 2 && feuilles[1].nom === "Relevés" && feuilles[1].lignes.length === 61, "classeur d'essai : deux feuilles lues, 61 lignes de relevés");
  verifier(feuilles[1].lignes[1][0] === "2024-01-01" && feuilles[1].lignes[2][0] === "2024-01-08" && typeof feuilles[1].lignes[1][1] === "number", "cellule au format de date -> AAAA-MM-JJ ; format personnalisé « kWh » -> nombre");
  const reel = await itgLireExcel(__buf);
  verifier(["CONSO", "FACTEURS INF", "EQUATION", "WIKI"].every(n => reel.some(f => f.nom.trim().toUpperCase() === n)), "classeur de référence : toutes ses feuilles sont lues par la lecture générique (" + reel.length + " feuilles)");

  /* ---- 2. Profil ---- */
  const TL = itgAnalyser(csvLarge.lignes, ";");
  verifier(!TL.bloquants.length && TL.dates.length === 102 && TL.pas === "week" && TL.iDate === 0 && !TL.long, "large : 102 semaines, pas hebdomadaire, tableau large (" + TL.dates.length + ", " + TL.pas + ")");
  verifier(jour(TL.dates[0]) === "2023-01-02" && jour(TL.dates[101]) === "2024-12-23", "large : dates JJ/MM/AAAA lues du 02/01/2023 au 23/12/2024");
  const av = Object.fromEntries(TL.avert);
  verifier(av.parasites === 3 && av.sansdate === 1 && av.doublons === 1 && av.trous === 2 && !("court" in av), "large : 3 lignes parasites, 1 ligne sans date (total), 1 doublon, 2 semaines absentes (" + JSON.stringify(TL.avert) + ")");
  const col = (T, debut) => T.colonnes.find(c => c.intitule.startsWith(debut));
  verifier(TL.colonnes.map(c => c.type).join(",") === "date,nombre,nombre,nombre,nombre,nombre,nombre,nombre,nombre,texte,texte", "large : types devinés (" + TL.colonnes.map(c => c.type).join(",") + ")");
  verifier(col(TL, "Élec").unite === "kWh" && col(TL, "Gaz").unite === "MWh" && col(TL, "Atelier").unite === "kWh" && col(TL, "Production").unite === "t" && col(TL, "DJU").unite === null, "large : unités lues dans les intitulés");
  const e0 = +E.large.split("\r\n")[4].split(";")[1].replace(/\s/g, "").replace(",", ".");
  verifier(col(TL, "Élec").valeurs[0] === e0 && e0 > 40000, "large : « 78 123,4 » lu comme un nombre à virgule décimale et espace des milliers (" + e0 + ")");
  verifier(col(TL, "Gaz").decAmbigue && col(TL, "Gaz").stats.max < 200 && col(TL, "Gaz").stats.min > 1, "large : colonne à trois décimales indécidable seule, tranchée par la convention du fichier (MWh entre 1 et 200) et signalée");
  verifier(col(TL, "Élec").stats.aberrants === 1 && col(TL, "Gaz").valeurs.filter(v => v == null).length === 2 && proche(col(TL, "Gaz").manquants, 2 / 102, 1e-9), "large : 1 valeur aberrante, 2 manquants (« » et « - »)");
  verifier(col(TL, "Atelier").valeurs[20] === 27500.5, "large : date en double, la dernière valeur renseignée est gardée");
  verifier(col(TL, "Froid").valeurs.filter(v => v == null).length === 1 && col(TL, "Froid").type === "nombre", "large : « n.d. » compté comme manquant");

  const TG = itgAnalyser(csvLong.lignes, ",");
  verifier(!TG.bloquants.length && TG.long === true && TG.dates.length === 140 && TG.pas === "day" && TG.colonnes.length === 6, "long : tableau long reconnu, 5 points de mesure remis en colonnes sur 140 jours");
  const ag = Object.fromEntries(TG.avert);
  verifier(ag.long === 5 && ag.doublons === 1 && ag.court >= 4, "long : 1 relevé en double, historique court signalé (" + JSON.stringify(TG.avert) + ")");
  verifier(col(TG, "Chaudiere").unite === "kWh" && col(TG, "Chaudiere").indice === "Gaz" && col(TG, "Chaudiere").valeurs.filter(v => v == null).length === 2 && col(TG, "Temperature").unite === "°C", "long : unité et énergie reprises des colonnes voisines, 2 relevés absents");
  const TM = itgAnalyser(csvMois.lignes, "\t");
  verifier(!TM.bloquants.length && TM.dates.length === 36 && TM.pas === "month" && jour(TM.dates[0]) === "2022-01-01" && jour(TM.dates[35]) === "2024-12-01", "mensuel : 36 mois en lettres lus, pas mensuel");
  verifier(col(TM, "Electricite").unite === "MWh" && col(TM, "Electricite").nom === "Electricite" && col(TM, "DJU").unite === null, "mensuel : unités lues dans les intitulés");
  // cas inutilisables : message clair, pas d'exception
  const TI = itgAnalyser(itgLireCsv(E.inutilisable).lignes, ";");
  verifier(codes(TI.bloquants) === "date" && /Aucune colonne de dates/.test(itgMessage(TI.bloquants[0])), "inutilisable : fichier sans date refusé avec un message clair");
  verifier(codes(itgAnalyser(itgLireCsv("Bonjour,\nvoici le compte rendu de la réunion.\nCordialement\n").lignes, ",").bloquants) === "entete", "inutilisable : un texte sans tableau est refusé (pas d'en-tête)");
  verifier(codes(itgAnalyser(itgLireCsv("date;kWh\n01/01/2024;10\n02/01/2024;12\n03/01/2024;11\n").lignes, ";").bloquants) === "lignes", "inutilisable : trois dates, c'est trop peu");
  verifier(codes(itgAnalyser(itgLireCsv("date;note\n" + Array.from({ length: 12 }, (x, i) => "2024-01-" + String(i + 1).padStart(2, "0") + ";ras" + i).join("\n")).lignes, ";").bloquants) === "nombres", "inutilisable : des dates mais aucun nombre");
  verifier(codes(itgAnalyser([], ";").bloquants) === "entete", "inutilisable : fichier vide");
  // relevés au quart d'heure
  const h = (() => { let a = 7; return () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; }; })();
  const quart = ["horodatage;Compteur (kWh);Temp (°C)"];
  for (let i = 0; i < 12 * 96; i++) { const t = Date.UTC(2024, 4, 1) + i * 900000, jr = Math.floor(i / 96); if (jr === 5 && i % 96 >= 40) continue; quart.push(new Date(t).toISOString().slice(0, 16).replace("T", " ") + ";" + (10 + jr + h()).toFixed(2) + ";" + (15 + jr).toFixed(1)); }
  const TQ = itgAnalyser(itgLireCsv(quart.join("\n")).lignes, ";");
  verifier(codes(TQ.bloquants) === "infra" && TQ.bloquants[0][1] === 15 && /toutes les 15 minutes/.test(itgMessage(TQ.bloquants[0])), "relevés au quart d'heure : pas de 15 minutes reconnu, fichier refusé avec la marche à suivre");

  /* ---- 3. Correspondance par les règles (mode démonstration) ---- */
  etat.modele = null; rendre();                                           // écran d'accueil, avant tout chargement
  let app = document.getElementById("app");
  verifier(texteDe(app).includes("Intégrez un fichier brut") && !!bouton(app, "Choisir un fichier de données"), "l'écran d'accueil propose le parcours d'intégration");
  await itgRecevoir(fichier("essai-large-sale.csv", latin1(E.large)));
  verifier(itg.fichier && itg.fichier.sep === ";" && itg.fichier.codage === "Windows-1252" && itg.table.dates.length === 102, "parcours : fichier large reçu, lu et profilé");
  const role = debut => itg.corr.find(x => itg.table.colonnes[x.index].intitule.startsWith(debut));
  verifier(itg.corr.map(x => x.role).join(",") === "date,consommation,consommation,consommation,consommation,facteur,facteur,facteur,ignorer,ignorer,ignorer", "règles, large : rôles proposés (" + itg.corr.map(x => x.role).join(",") + ")");
  verifier(role("Élec").energie === "Électricité" && role("Élec").niveau === "Site" && role("Élec").unite === "kWh" && role("Gaz").energie === "Gaz" && role("Gaz").unite === "MWh" && role("Gaz").niveau === "Site", "règles, large : énergie, unité et niveau des compteurs généraux");
  verifier(role("Atelier").energie === ITG.aPreciser && role("Atelier").niveau === "UES" && role("Index").raison === "index" && role("Code").raison === "texte" && role("Humidité").role === "facteur", "règles, large : énergie inconnue laissée à préciser, index de compteur écarté");
  verifier(itg.moteur === null && !itg.refus && __reseau.length === 0, "la première proposition vient du script de démonstration, sans réseau");
  app = document.getElementById("app");
  let txt = texteDe(app);
  verifier(txt.includes("1. Fichier lu") && txt.includes("2. Qualité des données") && txt.includes("3. Rôle de chaque colonne") && txt.includes("Mode démonstration") && txt.includes("règles du module (sans IA)") && txt.includes("2 période(s) absente(s)"), "accueil : étapes 1 à 3 affichées, mode démonstration annoncé");
  verifier(!txt.includes("4. Modèles de référence"), "les modèles ne sont pas calculés avant la validation de la correspondance");

  /* ---- 3 bis. Correspondance par un modèle : faux modèles, dont des propositions absurdes ---- */
  const avant = JSON.stringify(itg.corr);
  let demande = null;
  const sage = fauxModele(q => { demande = q; return [{ type: "text", text: "Voici ma proposition." }, { type: "tool_use", id: "t1", name: "proposer_correspondance", input: { colonnes: [
    { index: 0, role: "date", raison: "dates" }, { index: 1, role: "consommation", nom: "Électricité, compteur général", energie: "Électricité", unite: "kWh", niveau: "Site", raison: "compteur général en kWh" },
    { index: 2, role: "consommation", nom: "Gaz, point de livraison", energie: "Gaz", unite: "MWh", niveau: "Site", raison: "PCE en MWh" }, { index: 3, role: "consommation", nom: "Atelier presses", energie: "Électricité", unite: "kWh", niveau: "UES", raison: "sous-compteur" },
    { index: 4, role: "consommation", nom: "Froid process", energie: "Électricité", unite: "kWh", niveau: "UES", raison: "groupes froids" }, { index: 5, role: "facteur", nom: "Production", raison: "tonnage" }, { index: 6, role: "facteur", nom: "DJU chauffage", raison: "rigueur climatique" },
    { index: 7, role: "ignorer", raison: "sans lien avec le procédé" }, { index: 8, role: "ignorer", raison: "index cumulé" }, { index: 9, role: "ignorer", raison: "constante" }, { index: 10, role: "ignorer", raison: "commentaire" }] } }]; });
  let v = await itgDemander(sage, "faux modèle");
  verifier(!v.refus && !v.sig.length && itg.moteur === "faux modèle" && role("Atelier").energie === "Électricité" && role("Atelier").origine === "ia" && role("Humidité").role === "ignorer" && role("Élec").nom === "Électricité, compteur général", "IA (faux modèle) : une proposition sensée est acceptée telle quelle");
  const envoi = JSON.stringify(demande), charge = JSON.parse(demande.messages[0].content.replace(/^[^{]*/, ""));
  verifier(demande.tools.length === 1 && demande.tools[0].name === "proposer_correspondance" && demande.tools[0].input_schema.properties.colonnes.items.properties.role.enum.join() === "date,consommation,facteur,ignorer", "IA : la demande porte un seul outil structuré");
  verifier(charge.colonnes.length === 11 && charge.colonnes.every(c => c.exemples.length === 5) && charge.lignes === 102 && charge.colonnes[1].intitule === "Élec général (kWh)", "IA : la demande contient les intitulés, 5 valeurs d'exemple par colonne et les statistiques");
  const ligne60 = E.large.split("\r\n")[60].split(";");
  verifier(!envoi.includes("essai-large-sale") && !envoi.includes(ligne60[0].split("/").reverse().join("-")) && !envoi.includes(String(col(itg.table, "Élec").valeurs[55])), "IA : ni le nom du fichier ni les lignes au-delà des 5 premières ne sont dans la demande");
  const sain = JSON.stringify(itg.corr);
  v = await itgDemander(fauxModele(() => [{ type: "text", text: "La colonne 1 est la consommation." }]), "faux modèle");
  verifier(v.refus === "outil" && JSON.stringify(itg.corr) === sain && itg.refus === "outil", "IA absurde : une réponse sans outil est refusée, la proposition précédente est gardée");
  v = await itgDemander(fauxModele(() => [{ type: "tool_use", id: "t2", name: "proposer_correspondance", input: { colonnes: itg.table.colonnes.map((c, i) => ({ index: i, role: "ignorer", raison: "rien d'utile" })) } }]), "faux modèle");
  verifier(v.refus === "aucune" && JSON.stringify(itg.corr) === sain, "IA absurde : une proposition sans aucune consommation est refusée");
  v = await itgDemander(fauxModele(() => [{ type: "tool_use", id: "t3", name: "proposer_correspondance", input: { colonnes: "toutes" } }]), "faux modèle");
  verifier(v.refus === "outil", "IA absurde : une entrée d'outil mal formée est refusée");
  v = await itgDemander(fauxModele(() => [{ type: "tool_use", id: "t4", name: "proposer_correspondance", input: { colonnes: [
    { index: 0, role: "consommation", energie: "Électricité", unite: "kWh", niveau: "Site", raison: "la date est une consommation" }, { index: 10, role: "facteur", raison: "le commentaire explique tout" }, { index: 9, role: "date", raison: "code = date" },
    { index: 99, role: "facteur", raison: "colonne inventée" }, { index: 5, role: "magie", raison: "?" }, { index: 2, role: "consommation", energie: "Gaz", unite: "kWh", niveau: "Site", raison: "gaz en kWh" },
    { index: 6, role: "consommation", energie: "", unite: "litres", niveau: "Usine", raison: "DJU en litres" }, { index: 1, role: "consommation", nom: "X".repeat(200), energie: "Électricité", unite: "kWh", niveau: "Site", raison: "ok" }, { index: 1, role: "ignorer", raison: "doublon" }] } }]), "faux modèle");
  verifier(!v.refus && ["fauxdate", "pasnombre", "inconnue", "oubli", "unitediff", "unite"].every(c => codes(v.sig).split(",").includes(c)) && v.sig.length === 12, "IA absurde : chaque incohérence est signalée (" + [...new Set(v.sig.map(a => a[0]))].join(", ") + ")");
  verifier(role("Semaine").role === "date" && role("Commentaire").role === "ignorer" && role("Code").role === "ignorer" && role("Gaz").unite === "MWh" && role("Production").origine === "regles" && role("Élec").nom.length === 60, "IA absurde : la date reste la date, un texte n'est ni consommation ni facteur, l'unité de l'intitulé l'emporte, les règles complètent");
  verifier(role("DJU").role === "consommation" && role("DJU").unite === "kWh" && role("DJU").niveau === "UES" && role("DJU").energie === ITG.aPreciser, "IA absurde : ce que le profil ne peut pas contredire est gardé, signalé, et laissé à la personne (DJU pris pour une consommation)");
  itgPeindre(); txt = texteDe(itgNoeud);
  verifier(txt.includes("Contrôle de la proposition par la page") && txt.includes("la colonne de dates est celle que la page a reconnue") && txt.includes("contraire à l'intitulé du fichier") && txt.includes("Proposition de : faux modèle"), "IA absurde : les signalements sont affichés, avec l'origine de la proposition");
  // garde-fous d'envoi : sans accord donné sur l'avis du module, rien ne part, même avec l'accord de la page Instruction
  const vraiGemini = appelGemini; let appels = 0, recu = null;
  appelGemini = async q => { appels++; recu = q; return (await sage(q)); };
  agent.demo = false; agent.fournisseur = "gemini"; agent.accord = false; champCleGemini.value = "";
  itgPeindre(); txt = texteDe(itgNoeud);
  verifier(txt.includes("Mode IA : Gemini") && txt.includes("Envoi impossible") && !bouton(itgNoeud, "Demander une proposition"), "mode IA sans autorisation ni clé : envoi annoncé impossible, pas de bouton");
  await itgProposer(); verifier(appels === 0, "mode IA sans autorisation : aucun appel");
  agent.accord = "gemini"; champCleGemini.value = "cle-de-test";
  itgPeindre(); txt = texteDe(itgNoeud);
  verifier(txt.includes("Avant l'envoi : ce qui quittera ce poste") && txt.includes("les intitulés des 11 colonnes") && txt.includes("Voir tout ce qui sera envoyé") && !bouton(itgNoeud, "Demander une proposition"), "mode IA : l'avis d'envoi du module s'affiche, l'accord de la page Instruction ne suffit pas");
  const pre = trouver(itgNoeud, n => n.tagName === "PRE")[0];
  await itgProposer(); verifier(appels === 0, "mode IA sans accord sur l'avis du module : aucun appel");
  cliquer(bouton(itgNoeud, "J'autorise cet envoi"));
  verifier(itg.accord === "gemini" && !!bouton(itgNoeud, "Demander une proposition à Gemini"), "accord donné sur l'avis : le bouton de demande apparaît");
  await itgProposer();
  verifier(appels === 1 && pre && pre.textContent === JSON.stringify(recu, null, 1), "après accord : un seul appel, et le texte envoyé est exactement celui que l'avis montrait");
  verifier(/^Gemini \(/.test(itg.moteur) && role("Atelier").origine === "ia" && !itg.enCours, "après accord : proposition de l'IA retenue et signée (" + itg.moteur + ")");
  appelGemini = async () => { throw new Error("Quota ou limite de débit Gemini atteint."); };
  await itgProposer(); verifier(/Quota/.test(itg.erreur) && role("Atelier").origine === "ia" && texteDe(itgNoeud).includes("Quota"), "échec de l'IA : message affiché, proposition précédente gardée");
  // une demande longue se voit et s'arrête
  appelGemini = (q, signal) => new Promise((ok, ko) => signal.addEventListener("abort", () => ko(new DOMException("arrêt", "AbortError")), { once: true }));
  const attente = itgProposer();
  verifier(itg.enCours && texteDe(itgNoeud).includes("Demande en cours") && !!bouton(itgNoeud, "Arrêter") && bouton(itgNoeud, "Calculer les modèles").disabled, "demande en cours : affichée, avec un bouton d'arrêt ; le calcul des modèles attend");
  cliquer(bouton(itgNoeud, "Arrêter")); await attente;
  verifier(!itg.enCours && /Demande arrêtée/.test(itg.erreur) && role("Atelier").origine === "ia", "arrêt : la demande s'interrompt, la proposition précédente est gardée");
  appelGemini = vraiGemini; agent.demo = true; agent.accord = false; champCleGemini.value = ""; itg.erreur = null;
  verifier(__reseau.length === 0, "aucun appel réseau pendant ces essais");

  /* ---- 4. Modèles : calculs sur des cas dont la réponse est connue ---- */
  let f = itgMco([1, 3, 2, 5, 4], [[1, 2, 3, 4, 5]]);
  verifier(proche(f.b[0], 0.8, 1e-12) && proche(f.c, 0.6, 1e-12) && proche(f.r2, 0.64, 1e-12) && f.n === 5 && f.p === 2, "moindres carrés : pente 0,8, constante 0,6, R² 0,64 sur un cas calculé à la main");
  const x1 = Array.from({ length: 30 }, (x, i) => 10 + 7 * Math.sin(i)), x2 = Array.from({ length: 30 }, (x, i) => (i * 37) % 11), y0 = x1.map((a, i) => 3 + 2 * a - 0.5 * x2[i]);
  f = itgMco(y0, [x1, x2]);
  verifier(proche(f.c, 3, 1e-9) && proche(f.b[0], 2, 1e-9) && proche(f.b[1], -0.5, 1e-9) && proche(f.r2, 1, 1e-12), "moindres carrés : coefficients exacts sur des données sans bruit");
  verifier(itgMco(y0, [x1, x1.map(a => 2 * a + 1)]) === null, "moindres carrés : facteurs colinéaires refusés");
  const yb = y0.map((a, i) => a + Math.sin(i * 1.7)); f = itgMco(yb, [x1, x2]);
  let press = 0, sct = 0; const my = somme(yb) / 30;
  for (let i = 0; i < 30; i++) { const sans = a => a.filter((x, j) => j !== i), g = itgMco(sans(yb), [sans(x1), sans(x2)]); press += (yb[i] - g.c - g.b[0] * x1[i] - g.b[1] * x2[i]) ** 2; sct += (yb[i] - my) ** 2; }
  verifier(proche(f.q2, 1 - press / sct, 1e-9) && f.q2 < f.r2 && f.r2a < f.r2, "R² validé : identique au recalage point par point (un point retiré à la fois)");
  // la personne corrige la proposition des règles, puis valide
  await itgChoisirFeuille(0);
  verifier(itg.moteur === null && role("Atelier").origine === "regles", "nouvelle analyse : retour à la proposition des règles");
  const ligneDe = debut => trouver(itgNoeud, n => n.tagName === "TR" && n.textContent.startsWith(debut)).pop(), change = (n, valeur) => { n.value = valeur; n.dispatchEvent({ type: "change", target: n }); };
  for (const nom of ["Atelier presses kWh", "Froid process (kWh)"]) change(trouver(ligneDe(nom), n => n.tagName === "INPUT" && n.attrs["aria-label"] === "Énergie")[0], "Électricité");
  verifier(role("Atelier").energie === "Électricité" && role("Atelier").origine === "personne" && role("Froid").energie === "Électricité", "la personne corrige l'énergie de deux colonnes dans le tableau");
  cliquer(bouton(itgNoeud, "Calculer les modèles de référence"));
  verifier(itg.modeles && itg.modeles.length === 4 && texteDe(itgNoeud).includes("4. Modèles de référence"), "étape 4 : quatre modèles calculés et affichés");
  const retrouve = (modeles, verite, etiquette) => {
    for (const nom in verite) {
      const m = modeles.find(x => x.nom === nom), vr = verite[nom], attendus = Object.keys(vr).filter(k => k !== "c" && k !== "bruit");
      verifier(!!m && m.coefs.map(c => c.nom).sort().join("|") === attendus.sort().join("|"), etiquette + " « " + nom + " » : facteurs retenus = facteurs du modèle vrai (" + (m ? m.coefs.map(c => c.nom).join(", ") : "absent") + ")");
      if (!m) continue;
      for (const c of m.coefs) { const et = Math.abs(c.b / c.t); verifier(Math.abs(c.b - vr[c.nom]) <= 3 * et && Math.abs(c.b - vr[c.nom]) <= 0.2 * Math.abs(vr[c.nom]), etiquette + " « " + nom + " » : coefficient de « " + c.nom + " » " + c.b.toFixed(2) + " pour " + vr[c.nom] + " (± " + et.toFixed(2) + ")"); }
      verifier(Math.abs(m.c - vr.c) <= 0.25 * Math.abs(vr.c), etiquette + " « " + nom + " » : constante " + m.c.toFixed(0) + " pour " + vr.c);
      verifier(m.r2 > 0.5 && m.r2 < 0.9995 && m.q2 <= m.r2 && m.r2 - m.q2 < 0.1 && m.err[m.pas] > 0 && m.err[m.pas] < 0.25, etiquette + " « " + nom + " » : R² " + m.r2.toFixed(3) + ", R² validé " + m.q2.toFixed(3) + ", erreur type " + (m.err[m.pas] * 100).toFixed(1) + " %");
    }
  };
  retrouve(itg.modeles, V.large, "large");
  const mE = itg.modeles[0];
  verifier(mE.aberrants === 1 && mE.n === 100 && mE.pas === 1 && mE.ecartes.some(c => c.nom === "Humidité" && c.motif === "gain"), "large : la valeur aberrante est hors calage (100 points sur 102, un DJU manquant), « Humidité » est écartée");
  verifier(proche(mE.err[1], V.large["Élec général"].bruit / 77000, 0.012) && mE.err[2] < mE.err[1] && mE.err[3] < mE.err[2] && mE.err[0] === null, "large : erreur type hebdomadaire proche du bruit injecté, plus faible au mois et à l'année");
  // garde-fou contre le surajustement : peu de points
  const petit = (n, k) => { const J = { dates: Array.from({ length: n }, (x, i) => Date.UTC(2024, i, 1)), facteurs: Array.from({ length: k }, (x, j) => ({ nom: "f" + j, v: Array.from({ length: n }, (y, i) => Math.sin(i * (j + 1.3)) + j) })) };
    const y = J.dates.map((t, i) => 100 + 20 * J.facteurs[0].v[i] + 3 * Math.cos(i * 2.1)); return itgModele({ nom: "s", y }, J); };
  let mp = petit(12, 4); verifier(mp.coefs.length === 1 && mp.coefs[0].nom === "f0" && mp.ecartes.some(c => c.motif === "max"), "garde-fou : 12 points, un seul facteur admis, le bon");
  mp = petit(6, 2); verifier(mp.coefs.length === 0 && mp.r2 === 0 && mp.ecartes.every(c => c.motif === "peu") && proche(mp.c, somme(Array.from({ length: 6 }, (x, i) => 100 + 20 * Math.sin(i * 1.3) + 3 * Math.cos(i * 2.1))) / 6, 1e-9), "garde-fou : 6 points, aucun facteur, la référence est la moyenne");

  /* ---- 5. Grilles et chargement ---- */
  const rapport = {}, G = itgGrilles(itg.jeu, itg.modeles, rapport);
  verifier(Object.keys(REF).every(k => Array.isArray(G[k])) && G.CONSO[0] === null && G.CONSO[1][0] === null, "grilles : les mêmes feuilles que le classeur de référence, indices à partir de 1");
  verifier([["CONSO", 1], ["FACTEURS INF", 1], ["EQUATION", 1], ["EQUATION", 2], ["EQUATION 2", 1]].every(([k, l]) => G[k][l][1] === REF[k][l][1]) && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15].every(l => G.WIKI[l][1] === REF.WIKI[l][1]) && G.WIKI.length === 16, "grilles : mêmes libellés de première colonne que le classeur de référence (CONSO, FACTEURS INF, EQUATION, lignes lues du WIKI), 15 lignes dans le WIKI");
  verifier(typeof G.CONSO[2][1] === "number" && G.CONSO[2][1] === 44928 && typeof REF.CONSO[2][1] === "number" && G["FACTEURS INF"][2][1] === 44928 && G.CONSO.length === 104, "grilles : dates en numéros de série Excel comme dans la référence (02/01/2023 = 44928), même ligne dans CONSO et FACTEURS INF");
  verifier(G.CONSO[2][2] === e0 && proche(G.CONSO[2][3], col(itg.table, "Gaz").valeurs[0] * 1000, 1e-6) && G.WIKI[2][3] === "Gaz" && G.WIKI[3][2] === "Site" && G.WIKI[10][2] === "Simple", "grilles : consommations en kWh (MWh convertis), énergie, niveau et type dans le WIKI");
  verifier(G.EQUATION[3][1] === G["FACTEURS INF"][1][2] && G.EQUATION[2][2] === mE.c && G.EQUATION[3][2] === mE.coefs.find(c => c.nom === "Production").b && G.EQUATION[5][2] === null && G.WIKI[15][2] === mE.r2 && G.WIKI[7][2] === mE.err[1], "grilles : constante, coefficients, R² et erreurs aux positions lues par calculer()");
  const trou = itg.jeu.facteurs[1].v.indexOf(null);
  verifier(rapport.interp === 1 && trou === 68 && proche(G["FACTEURS INF"][trou + 2][3], (itg.jeu.facteurs[1].v[trou - 1] + itg.jeu.facteurs[1].v[trou + 1]) / 2, 1e-9), "grilles : le DJU manquant d'un facteur retenu est interpolé (et compté), la valeur d'origine reste absente du calage");
  cliquer(bouton(itgNoeud, "Charger le tableau de bord"));
  let m = etat.modele;
  verifier(!!m && etat.fichier === "essai-large-sale.csv" && m.series.length === 4 && m.facteurs.length === 3 && m.dates.length === 102 && m.pasFin === "week" && m.energies.join() === "Électricité,Gaz", "charger() réussit sur les grilles du module : 4 séries, 3 facteurs, 102 dates, 2 énergies");
  verifier(m.alertes.length === 1 && /intégrées par la page/.test(m.alertes[0]), "calculer() ne relève aucune incohérence dans les grilles ; seule l'alerte de provenance du module est affichée (" + m.alertes.length + ")");
  const sE = m.series[0], fP = m.facteurs.find(x => x.nom === "Production"), fD = m.facteurs.find(x => x.nom === "DJU chauffage");
  verifier(sE.conso[0] === e0 * 1000 && sE.groupe === "site" && sE.pas === "week" && sE.r2 === mE.r2 && sE.err[1] === mE.err[1] && sE.nbPoints === 102, "modèle chargé : consommation en Wh, niveau, pas, R² et erreur repris");
  verifier(proche(sE.ref[3], 1000 * (mE.c + mE.coefs.find(c => c.nom === "Production").b * fP.valeurs[3] + mE.coefs.find(c => c.nom === "DJU chauffage").b * fD.valeurs[3]), 1e-6), "modèle chargé : la référence du tableau de bord est bien constante + coefficients × facteurs");
  const eps = derives().episodes;
  verifier(eps.some(e => e.serie === sE.nom && e.sens === "surconsommation" && jour(e.debut) === "2023-10-09" && e.zmax > 10), "la valeur aberrante injectée (facteur dix, semaine du 09/10/2023) ressort comme une dérive du tableau de bord");
  const pages = lang => { for (const o of ONGLETS) { etat.onglet = o[0]; let err = null; try { rendre(); } catch (e) { err = e; } verifier(!err && texteDe(document.getElementById("app")).length > 300, "données intégrées (" + lang + ") : la page « " + o[0] + " » se rend" + (err ? " : " + err.message : "")); } };
  pages("fr");
  etat.onglet = "itg"; rendre(); txt = texteDe(document.getElementById("app"));
  verifier(txt.includes("Données intégrées par la page") && txt.includes("essai-large-sale.csv") && txt.includes("règles du module (sans IA), corrigée par une personne") && txt.includes("Limites :") && txt.includes("interpolée(s)") && txt.includes("Remplacer les données du tableau de bord"), "page Intégration : compte rendu, méthode, limites, et parcours gardé pour rejouer une étape");
  LANGUE = "en"; CACHE_TR.clear(); pages("en");
  etat.onglet = "itg"; rendre(); txt = texteDe(document.getElementById("app"));
  verifier(txt.includes("Data integrated by the page") && txt.includes("Baseline models") && txt.includes("Role of each column") && txt.includes("Limits:") && txt.includes("module rules (no AI), corrected by a person") && txt.includes("Demo mode") && !/Rôle de chaque|Modèles de référence|Qualité des données|Fichier lu/.test(txt), "page Intégration en anglais : textes traduits");
  etat.onglet = "site"; rendre(); verifier(texteDe(document.getElementById("app")).includes("Data integrated by the page from a raw file"), "l'alerte de provenance est traduite");
  LANGUE = "fr"; CACHE_TR.clear();

  /* ---- Copie figée : mêmes grilles après un passage par JSON, compte rendu retrouvé, rien d'écrit dans le navigateur ---- */
  const copie = JSON.parse(JSON.stringify({ fichier: etat.fichier, d1904: d1904Charge, grilles: grillesChargees }).replace(/</g, "\\u003c"));
  const m2 = calculer(copie.grilles, copie.d1904), memes = k => JSON.stringify(m2.series.map(x => x[k])) === JSON.stringify(m.series.map(x => x[k]));
  verifier(JSON.stringify(m2.dates) === JSON.stringify(m.dates) && ["nom", "energie", "niveau", "conso", "ref", "an1", "err", "r2", "pas"].every(memes) && JSON.stringify(m2.facteurs) === JSON.stringify(m.facteurs), "copie figée : les grilles du module donnent le même modèle après sérialisation JSON");
  charger(copie.grilles, copie.d1904, copie.fichier, "25/11/2026");
  etat.onglet = "itg"; rendre(); txt = texteDe(document.getElementById("app"));
  verifier(etat.figee === "25/11/2026" && itg.rapport && itg.rapport.fichier === "essai-large-sale.csv" && itg.fichier === null && txt.includes("Données intégrées par la page") && txt.includes("Retenus :"), "copie figée : la page Intégration retrouve son compte rendu dans les grilles, le parcours est remis à zéro");
  verifier(["revue-energetique.itg", "itg"].every(p => localStorage.getItem(p) === null), "le module n'écrit rien dans le stockage du navigateur");

  /* ---- Les autres fichiers, de bout en bout par l'interface ---- */
  const parcours = async (nom, buf) => { etat.modele = null; rendre(); await itgRecevoir(fichier(nom, buf)); if (itg.table && !itg.table.bloquants.length && itg.corr.some(x => x.role === "consommation")) { cliquer(bouton(itgNoeud, "Calculer les modèles de référence")); const ms = itg.modeles; cliquer(bouton(itgNoeud, "Charger le tableau de bord")); return ms; } return null; };
  let ms = await parcours("essai-long.csv", utf8(E.long)); m = etat.modele;
  verifier(!!ms && !!m && m.series.length === 3 && m.facteurs.length === 2 && m.pasFin === "day" && m.series.map(x => x.groupe).join() === "site,site,ues" && m.energies.join() === "Électricité,Gaz" && m.alertes.length === 1, "long : chargé par les seules règles (3 séries journalières, 2 facteurs, niveaux et énergies reconnus)");
  if (ms) { retrouve(ms, V.long, "long"); verifier(ms[1].coefs[0].b < 0 && ms[1].n === 138, "long : coefficient négatif de la température retrouvé pour le chauffage, 138 points (2 relevés absents)"); }
  pages("fr, long");
  ms = await parcours("essai-mensuel.tsv", utf8(E.mois)); m = etat.modele;
  verifier(!!ms && !!m && m.series.length === 2 && m.pasFin === "month" && m.series[0].pas === "month" && m.dates.length === 36 && proche(m.series[0].conso[0], col(itg.table, "Electricite").valeurs[0] * 1e6, 1e-3), "mensuel : chargé, pas mensuel, MWh convertis en Wh");
  if (ms) { retrouve(ms, V.mois, "mensuel"); verifier(ms[0].err[2] > 0 && ms[0].err[1] === null && ms[0].ecartes[0].motif === "redondant", "mensuel : erreur donnée au mois, pas à la semaine ; un facteur qui double l'autre (corrélation > 0,9) est écarté"); }
  pages("fr, mensuel");
  ms = await parcours("essai-classeur.xlsx", base64(E.classeur64)); m = etat.modele;
  verifier(!!ms && itg.fichier.feuilles.length === 2 && itg.feuille === 1 && !!m && m.series.length === 2 && m.facteurs.length === 2 && m.dates.length === 60, "classeur quelconque : refusé par le chemin d'origine, repris par le parcours ; la feuille de relevés est choisie seule");
  if (ms) verifier(ms[0].coefs.length === 1 && proche(ms[0].coefs[0].b, 80, 8) && ms[1].coefs.length === 1 && proche(ms[1].coefs[0].b, 700, 40), "classeur quelconque : coefficients retrouvés (80 kWh par tonne, 700 kWh par DJU)");
  pages("fr, classeur");
  // relevés au quart d'heure : refusés à l'écran, avec la marche à suivre
  ms = await parcours("quart-heure.csv", utf8(quart.join("\n")));
  verifier(ms === null && etat.modele === null && texteDe(itgNoeud).includes("Fournissez un total par jour") && !texteDe(itgNoeud).includes("3. Rôle"), "quart d'heure : refus affiché, le parcours s'arrête à l'étape 2");
  // le classeur de référence, pris comme un fichier quelconque : une de ses feuilles suffit
  etat.modele = null; await itgOuvrir("classeur-renomme.xlsx", __buf);
  verifier(itg.fichier.feuilles.length >= 4 && itg.table && !itg.table.bloquants.length && itg.corr.length > 2, "classeur de référence lu comme un fichier quelconque : une feuille est proposée et profilée (« " + itg.fichier.feuilles[itg.feuille].nom + " », " + itg.table.dates.length + " dates, " + itg.table.colonnes.length + " colonnes)");
  const iConso = itg.fichier.feuilles.findIndex(x => x.nom.trim().toUpperCase() === "CONSO");
  await itgChoisirFeuille(iConso);
  verifier(itg.table.dates.length === 104 && itg.table.pas === "week" && itg.table.colonnes.length === serieRef + 1 && jour(itg.table.dates[0]) === "2023-04-03", "feuille CONSO du classeur de référence : 104 semaines à partir du 03/04/2023, " + serieRef + " colonnes de nombres");
  for (const x of itg.corr) if (x.role !== "date") Object.assign(x, { role: "consommation", unite: "kWh", energie: "Électricité", niveau: x.index === 1 ? "Site" : "UES" });
  itgCalculer(); itgCharger(); m = etat.modele;
  verifier(!!m && m.series.length === serieRef && m.facteurs.length === 0 && m.series.every(x => x.r2 === 0), "sans aucun facteur : chargement possible, chaque référence est une moyenne (R² 0)");
  pages("fr, sans facteur");
  // cas inutilisables par l'interface (les erreurs attendues ne sont pas recopiées dans la sortie du banc)
  const journalErreurs = console.error; console.error = () => {};
  etat.modele = null; rendre();
  await itgRecevoir(fichier("essai-inutilisable.csv", utf8(E.inutilisable)));
  txt = texteDe(document.getElementById("app"));
  verifier(etat.modele === null && txt.includes("Ce fichier ne peut pas être intégré tel quel") && txt.includes("Aucune colonne de dates reconnue") && !txt.includes("3. Rôle") && !bouton(itgNoeud, "Calculer"), "inutilisable : message clair à l'écran, le parcours s'arrête à l'étape 2");
  await itgRecevoir(fichier("photo.png", Uint8Array.from([0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 13, 0, 0, 1, 0]).buffer));
  txt = texteDe(document.getElementById("app"));
  verifier(itg.fichier === null && txt.includes("Fichier illisible"), "inutilisable : un fichier binaire est refusé avec un message clair");
  await itgRecevoir(fichier("ancien.xlsx", utf8("pas une archive")));
  verifier(itg.fichier === null && /n'est pas un classeur Excel/.test(itg.erreur), "inutilisable : un faux .xlsx donne le message d'origine du lecteur");
  LANGUE = "en"; CACHE_TR.clear(); await itgRecevoir(fichier("essai-inutilisable.csv", utf8(E.inutilisable)));
  txt = texteDe(document.getElementById("app"));
  verifier(txt.includes("This file cannot be integrated as it is") && txt.includes("No date column recognised") && txt.includes("Integrate a raw file"), "inutilisable : message clair en anglais aussi");
  LANGUE = "fr"; CACHE_TR.clear(); console.error = journalErreurs;
  // le classeur attendu, passé par l'entrée du module, suit le chemin d'origine
  await itgRecevoir(fichier("SER.xlsm", __buf)); m = etat.modele;
  verifier(!!m && m.series.length === serieRef && itg.rapport === null && itg.fichier === null && JSON.stringify(Object.keys(grillesChargees)) === JSON.stringify(Object.keys(REF)), "le classeur attendu, reçu par le module, est chargé par le chemin d'origine ; le parcours est remis à zéro");
  etat.onglet = "itg"; rendre(); verifier(texteDe(document.getElementById("app")).includes("Intégrer un autre fichier") && !texteDe(document.getElementById("app")).includes("Données intégrées par la page"), "page Intégration sur le classeur d'origine : pas de compte rendu, parcours proposé");
  verifier(__reseau.length === 0, "aucun appel réseau sur tout le parcours en mode démonstration");
}
