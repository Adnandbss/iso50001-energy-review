/* Tests du module Continuité : travail gardé par classeur, fichier projet, lexique. Banc sans navigateur, classeur réel. */
const CLE_TEST = "SECRETDETEST-NE-DOIT-PAS-SORTIR";
const G0 = JSON.parse(JSON.stringify(grillesChargees)), nom0 = etat.fichier, d0 = d1904Charge;
const variante = k => { const g = JSON.parse(JSON.stringify(G0)); g.CONSO[2][2] += k; return g; };   // un autre classeur : une valeur change
const stockCnt = () => { const o = {}; for (const k of ["revue-energetique.cnt.index"].concat(cntIndex().map(x => cntCle(x.e)))) { const v = localStorage.getItem(k); if (v != null) o[k] = v; } return o; };
const texteStocke = () => JSON.stringify(stockCnt());
const photo = () => JSON.stringify({ f: cntFiltresAGarder(), s: simAGarder(), r: revAGarder(null), e: evlAGarder() });
const page = (o, l) => { if (l) { LANGUE = l; CACHE_TR.clear(); cacheDerives = null; } if (o) etat.onglet = o; rendre(); return texteDe(app); };
function rechargerPage(grilles, nom) {   // ce que fait un rechargement : plus de DOM, plus d'état en mémoire, puis le même classeur
  app.replaceChildren(); etat.modele = null; rev.relecteur = ""; rev.revue = null; sim.scenarios = []; evl.passes = []; Object.assign(cnt, { empreinte: null, retrouve: [] });
  charger(JSON.parse(JSON.stringify(grilles)), d0, nom || nom0, null);
}

async function test() {
  console.log("— 1. Empreinte du jeu de données");
  const e0 = cnt.empreinte;
  verifier(/^[0-9a-f]{16}$/.test(e0) && e0 === cntEmpreinte(JSON.parse(JSON.stringify(G0)), d0), "empreinte : 16 caractères, la même après un passage par JSON (copie figée, projet)");
  verifier(cntEmpreinte(variante(1), d0) !== e0 && cntEmpreinte(G0, !d0) !== e0, "une seule valeur changée, ou l'autre calendrier Excel, donne une autre empreinte");
  verifier(cntFiltresAGarder() === null && simAGarder() === null && revAGarder(null) === null && evlAGarder() === null, "au chargement, rien à garder : rien n'est écrit");
  cntEnregistrer();
  verifier(localStorage.getItem(cntCle(e0)) === null, "état par défaut : aucune entrée dans le stockage");

  console.log("— 2. Du travail sur chaque page");
  agent.demo = true; champCle.value = "sk-ant-api03-" + CLE_TEST; champCleGemini.value = "AIza" + CLE_TEST;
  etat.gran = "month"; etat.comparer = "an1"; etat.derSens = "+"; etat.tables.add("courbe-site"); prevEtat.horizon = 6;
  const f0 = etat.modele.facteurs[0].nom;
  sim.scenarios[0].reglages[f0] = { type: "pct", v: 10, saison: "hiver" }; sim.scenarios.push(simNouveau()); sim.courant = 1; sim.sens = "unite"; sim.phrase = "Et si la production baissait ?";
  etat.onglet = "revue"; rendre();
  await revLancer();
  verifier(!!rev.revue && rev.revue.sections.length === 7, "revue : brouillon rédigé par le script de démonstration");
  const v = rev.revue; v.sections[0].texte = v.sections[0].texte + " Phrase ajoutée par le relecteur."; v.leves.add("v|synthese|0"); rev.relecteur = "Relecteur de test";
  rev.edition = { id: "actions", texte: "correction en cours" };
  evl.plafond = 6; evl.pauseDemo = 0; evl.tarifIn = 3;
  await evlLancer();
  verifier(evl.passes.length === 1 && evl.passes[0].lignes.filter(l => l && l.note).length === 6, "banc : une passe de 6 questions notée");
  const avant = photo();
  verifier(cntEnregistrer() && localStorage.getItem(cntCle(e0)) !== null, "le travail est écrit pour ce classeur");
  const E = JSON.parse(localStorage.getItem(cntCle(e0)));
  verifier(E.format === CNT.format && E.empreinte === e0 && ["filtres", "sim", "rev", "evl"].every(k => E.parties[k] && typeof E.parties[k].quand === "number"), "entrée versionnée, rattachée à l'empreinte, une date par partie");
  verifier(cntIndex()[0].e === e0, "l'index des classeurs place celui-ci en tête");

  console.log("— 3. Ce qui ne doit jamais être gardé");
  const brut = texteStocke();
  verifier(!brut.includes(CLE_TEST) && !/sk-ant|AIza/.test(brut), "aucune clé d'API dans le stockage");
  verifier(!/"dossier"|"faits"/.test(JSON.stringify(E.parties.rev.d)) && !E.parties.rev.d.hasOwnProperty("dossier"), "revue : le dossier de faits (valeurs du classeur) n'est pas gardé, seulement sa signature");
  verifier(E.parties.evl.d.passes[0].lignes.every(l => !l || (!("sources" in l) && !("q" in l))) && !/tool_result/.test(brut), "banc : ni résultats d'outils bruts ni questions recopiées");
  verifier(!/"accord"|"prop"/.test(JSON.stringify(E.parties.sim.d)), "simulateur : ni accord d'envoi ni proposition d'IA en attente");
  verifier(brut.length < CNT.max + 2000, "taille sous la borne (" + brut.length + " caractères)");

  console.log("— 4. Rechargement de la page, même classeur");
  rechargerPage(G0);
  verifier(photo() === avant, "après un rechargement simulé, le même classeur retrouve le même travail (filtres, scénarios, brouillon, passe)");
  verifier(rev.revue && rev.revue.sections[0].texte.endsWith("Phrase ajoutée par le relecteur.") && rev.revue.leves.has("v|synthese|0") && rev.relecteur === "Relecteur de test" && rev.edition.texte === "correction en cours", "brouillon : texte corrigé, signalement levé, relecteur, correction en cours");
  verifier(rev.revue.dossier.faits.length > 10 && !rev.revue.dossierChange, "brouillon : dossier de faits recalculé, identique à celui de la rédaction");
  verifier(evl.passes[0].questions.length === 6 && evl.passes[0].lignes.every(l => l.q && l.note) && evl.passes[0].date instanceof Date, "banc : passe reconstruite, questions retrouvées par la graine");
  verifier(sim.scenarios.length === 2 && sim.scenarios[0].reglages[f0].v === 10 && sim.courant === 1 && etat.gran === "month" && etat.tables.has("courbe-site") && prevEtat.horizon === 6, "scénarios, filtres et réglages de la prévision repris");
  let t = page("revue");
  verifier(/Travail retrouvé pour ce classeur/.test(t) && /Brouillon de revue du \d\d\/\d\d à \d\d:\d\d retrouvé/.test(t) && /Scénarios du simulateur du/.test(t), "le bandeau le dit (« Brouillon de revue du jj/mm retrouvé · Effacer »)");
  verifier(/Phrase ajoutée par le relecteur/.test(t), "la page Revue affiche le brouillon retrouvé");
  const evlAvant = evlAGarder(); etat.onglet = "evaluation"; rendre();
  verifier(JSON.stringify(evlAGarder()) === JSON.stringify(evlAvant) && /Passe 1|Run 1|Réussite/.test(texteDe(app)), "la page Évaluation se rend avec la passe retrouvée");
  await evlLancer(evl.passes[0]);
  verifier(evl.passes.length === 1 && evl.passes[0].fini, "une passe retrouvée se laisse reprendre sans erreur");

  console.log("— 5. Un autre classeur : rien n'est restauré");
  cntEnregistrer();
  charger(variante(1), d0, nom0, null);   // même nom de fichier, contenu différent
  verifier(cnt.empreinte !== e0 && !cnt.retrouve.length && !rev.revue && evl.passes.length === 0 && sim.scenarios.length === 1 && etat.gran === "week", "autre contenu, même nom : aucun travail repris");
  verifier(!/Travail retrouvé/.test(page("site")), "pas de bandeau sur l'autre classeur");
  verifier(cntEntree(e0) !== null, "le travail du premier classeur reste gardé");
  sim.scenarios[0].reglages[f0] = { type: "abs", v: 2, saison: "tout" };
  charger(JSON.parse(JSON.stringify(G0)), d0, "renomme.xlsm", null);
  verifier(rev.revue && evl.passes.length === 1 && sim.scenarios[0].reglages[f0].v === 10, "retour au premier classeur, même sous un autre nom : son travail revient");
  charger(variante(1), d0, nom0, null);
  verifier(sim.scenarios[0].reglages[f0] && sim.scenarios[0].reglages[f0].type === "abs", "le travail fait sur l'autre classeur avant de le quitter a été écrit et revient");
  charger(JSON.parse(JSON.stringify(G0)), d0, nom0, null);

  const valo0 = JSON.stringify(valoSaisie), en0 = etat.modele.energies[0];
  cntEnregistrer(); valoSaisie[en0] = Object.assign({}, valoSaisie[en0], { prix: 999 }); cacheDerives = null;
  rechargerPage(G0);
  verifier(rev.revue && rev.revue.dossierChange && /le dossier de faits a changé depuis/.test(page("site")), "prix modifié depuis la rédaction : le brouillon revient, et le bandeau dit que le dossier a changé");
  valoSaisie = JSON.parse(valo0); cacheDerives = null; rechargerPage(G0);
  verifier(rev.revue && !rev.revue.dossierChange, "prix rétabli : dossier identique");

  console.log("— 6. Effacer");
  const avantEff = photo();
  cntEffacer("evl");
  verifier(evl.passes.length === 0 && !cntEntree(e0).parties.evl && cntEntree(e0).parties.rev && rev.revue, "« Effacer » sur une ligne n'efface que cette partie");
  verifier(!/Passes du banc d'évaluation du/.test(page("site")) && /Brouillon de revue du/.test(texteDe(app)), "le bandeau retire la ligne effacée");
  cnt.bandeauFerme = true;
  verifier(!/Travail retrouvé/.test(page("site")), "« Fermer » masque le bandeau");

  console.log("— 7. Fichier projet : export puis import");
  const P = cntProjet(), texte = JSON.stringify(P), etatProjet = photo();
  verifier(P.format === "revue-energetique.projet" && P.version === 1 && P.empreinte === e0 && P.grilles.CONSO.length === G0.CONSO.length && P.travail.rev && P.travail.sim, "le projet contient les grilles, l'empreinte, la version et le travail");
  verifier(!texte.includes(CLE_TEST) && !/sk-ant|AIza/.test(texte) && !/"dossier"|tool_result/.test(texte), "aucune clé, aucun dossier ni résultat d'outil dans le projet");
  for (const k of Object.keys(stockCnt())) localStorage.removeItem(k);
  charger(variante(2), d0, "autre.xlsm", null);
  verifier(!rev.revue, "état de départ : un autre classeur, stockage vidé");
  await ouvrir({ name: "projet.json", size: texte.length, text: async () => texte });
  verifier(cnt.empreinte === e0 && etat.fichier === nom0 && photo() === etatProjet, "ouvrir le projet redonne exactement le même état");
  verifier(cnt.retrouve.length && cnt.retrouve.every(r => r.projet) && /repris du projet/.test(page("site")), "le bandeau dit que le travail vient du projet");
  verifier(cntEntree(e0) && cntEntree(e0).parties.rev, "le travail importé est aussitôt gardé dans le navigateur");
  rechargerPage(G0);
  verifier(photo() === etatProjet, "après import puis rechargement, le travail est toujours là");

  console.log("— 8. Projets abîmés ou étrangers");
  const essais = [
    ["{\"format\":\"revue-energetique.projet\",\"vers", /JSON est abîmé/, "JSON coupé"],
    ["[1,2,3]", /n'est pas un projet de revue/, "tableau JSON"],
    [JSON.stringify(Object.assign({}, P, { format: "autre" })), /n'est pas un projet de revue/, "autre format"],
    [JSON.stringify(Object.assign({}, P, { version: 2 })), /version plus récente.*format 2.*format 1/, "version plus récente"],
    [JSON.stringify(Object.assign({}, P, { version: "1" })), /abîmé/, "version illisible"],
    [JSON.stringify(Object.assign({}, P, { grilles: variante(5) })), /empreinte/, "grilles modifiées à la main"],
    [JSON.stringify(Object.assign({}, P, { grilles: { CONSO: "x", WIKI: [] } })), /abîmé/, "grilles illisibles"],
    [JSON.stringify(Object.assign({}, P, { travail: { inconnu: { quand: 1, d: {} } } })), /abîmé/, "partie de travail inconnue"],
    [JSON.stringify(Object.assign({}, P, { valo: { Gaz: { prix: "cher" } } })), /abîmé/, "prix illisible"]];
  for (const [x, re, nom] of essais) { const r = cntLireProjet(x); verifier(r.erreur && re.test(r.erreur) && !r.projet, "refusé avec un message clair : " + nom); }
  const etatAvant = photo();
  await ouvrir({ name: "abime.json", size: 20, text: async () => "{pas du json" });
  verifier(photo() === etatAvant && cnt.empreinte === e0 && /JSON est abîmé/.test(cnt.message) && cnt.menuOuvert && /JSON est abîmé/.test(page("site")), "un import raté ne touche à rien et s'explique dans le menu du pied");
  const pieges = JSON.parse(texte); pieges.travail.sim.d.scenarios[0].reglages["facteur inexistant"] = { type: "pct", v: 1, saison: "tout" };
  cntAppliquerProjet(cntLireProjet(JSON.stringify(pieges)));
  verifier(etat.modele && /illisibles et ont été ignorés : scénarios du simulateur/.test(cnt.message) && rev.revue && sim.scenarios.length === 1, "une partie invalide est ignorée et nommée, le reste est repris");
  cntAppliquerProjet(cntLireProjet(texte));
  cnt.message = null;

  console.log("— 9. Copie figée : rien n'est lu ni écrit");
  const ecritures = [], poser0 = localStorage.setItem, oter0 = localStorage.removeItem;
  localStorage.setItem = (k, x) => { ecritures.push(k); poser0(k, x); }; localStorage.removeItem = k => { ecritures.push(k); oter0(k); };
  charger(JSON.parse(JSON.stringify(G0)), d0, nom0, "26/11/2026");
  sim.phrase = "modifiée dans la copie"; cntEnregistrer(); cntPlusTard(); page("simulateur");
  await new Promise(r => setTimeout(r, CNT.delai + 50));
  verifier(!cnt.retrouve.length && !rev.revue && ecritures.filter(k => k.startsWith(CNT.prefixe)).length === 0, "copie figée : rien de restauré, aucune écriture");
  verifier(/Copie figée : rien n'est gardé/.test(texteDe(app)), "le menu du pied le dit");
  const Pf = cntProjet();
  verifier(Pf.travail.sim && Pf.travail.sim.d.phrase === "modifiée dans la copie", "une copie figée peut quand même exporter un projet");
  localStorage.setItem = poser0; localStorage.removeItem = oter0;
  charger(JSON.parse(JSON.stringify(G0)), d0, nom0, null);

  console.log("— 10. Bornes : taille et nombre de classeurs");
  while (evl.passes.length < 3) await evlLancer();
  verifier(evl.passes.length === 3, "trois passes en mémoire");
  cntEnregistrer();
  const max0 = CNT.max; CNT.max = localStorage.getItem(cntCle(e0)).length - 100; etat.gran = etat.gran === "month" ? "week" : "month";
  cntEnregistrer();
  const borne = localStorage.getItem(cntCle(e0)).length;
  verifier(borne <= CNT.max && cnt.trop && cntEntree(e0).parties.evl.d.passes.length < 3, "au-delà de la borne, les plus anciennes passes ne sont pas gardées (" + borne + " ≤ " + CNT.max + ")");
  verifier(/les plus anciennes passes ne sont pas gardées/.test(page("site")), "le menu le dit");
  CNT.max = max0; cntEnregistrer();
  for (let k = 1; k <= CNT.jeux + 1; k++) { charger(variante(10 + k), d0, "v" + k + ".xlsm", null); etat.gran = "month"; cntEnregistrer(); }
  const idx = cntIndex();
  verifier(idx.length === CNT.jeux, "l'index ne garde que " + CNT.jeux + " classeurs");
  verifier(!cntEntree(e0) && idx.every(x => cntEntree(x.e)), "le plus ancien est effacé, les autres restent lisibles");
  verifier(cntEntree(idx[0].e) && cntEntree(idx[0].e).format === 1, "format versionné");
  charger(variante(3), d0, "v3.xlsm", null);   // on quitte ce classeur, puis on abîme son entrée
  localStorage.setItem(cntCle(idx[0].e), JSON.stringify(Object.assign(cntEntree(idx[0].e), { format: 99 })));
  charger(variante(10 + CNT.jeux + 1), d0, "v.xlsm", null);
  verifier(!cnt.retrouve.length && etat.gran === "week", "une entrée d'un autre format est ignorée");
  charger(variante(3), d0, "v3.xlsm", null);
  localStorage.setItem(cntCle(idx[0].e), "{abîmé");
  charger(variante(10 + CNT.jeux + 1), d0, "v.xlsm", null);
  verifier(!cnt.retrouve.length && etat.modele, "une entrée abîmée est ignorée sans erreur");
  const lire0 = localStorage.getItem; localStorage.getItem = () => { throw new Error("stockage bloqué"); };
  let ok = true; try { charger(JSON.parse(JSON.stringify(G0)), d0, nom0, null); etat.gran = "year"; cntEnregistrer(); page("site"); } catch (e) { ok = false; }
  localStorage.getItem = lire0;
  verifier(ok && etat.modele, "stockage bloqué : la page marche sans lui");

  console.log("— 11. Brouillon et langue");
  charger(JSON.parse(JSON.stringify(G0)), d0, nom0, null);
  LANGUE = "fr"; CACHE_TR.clear(); page("revue"); await revLancer(); const texteFr = rev.revue.sections[0].texte;
  changerLangue("en"); page("revue");
  verifier(!rev.revue && cntEntree(cnt.empreinte).parties.rev.d.langue === "fr", "en anglais, le brouillon français est écarté de l'écran mais reste gardé");
  verifier(/Review draft from .* kept: written in French/.test(texteDe(app)) || !cnt.bandeauFerme, "le bandeau explique qu'il reviendra avec sa langue (si le bandeau est ouvert)");
  changerLangue("fr"); page("revue");
  verifier(rev.revue && rev.revue.sections[0].texte === texteFr, "retour au français : le brouillon revient");

  console.log("— 12. Lexique : une liste, deux langues");
  verifier(CNT_LEXIQUE.length >= 15 && CNT_LEXIQUE.every(x => x.length === 7 && x.slice(1, 5).every(s => typeof s === "string" && s.trim())), "chaque terme a son nom et sa définition en français et en anglais");
  const sigles = /\b(UES|SEU|IPE|EnPI|CUSUM|DJU|HDD)\b|R²/;
  verifier(CNT_LEXIQUE.every(x => !sigles.test(x[3]) && !sigles.test(x[4])), "aucun sigle dans les définitions elles-mêmes");
  for (const l of ["fr", "en"]) { const k = l === "en" ? 1 : 0, g = page("guide", l);
    verifier(CNT_LEXIQUE.every(x => g.includes(x[1 + k]) && g.includes(x[3 + k])), "le mode d'emploi reprend le lexique entier (" + l + ")"); }
  for (const [o, attendus] of [["site", ["ref", "tunnel", "r2"]], ["derives", ["cusum", "z", "episode"]], ["prevision", ["atterrissage", "retro"]], ["ues", ["ues"]]]) for (const l of ["fr", "en"]) {
    page(o, l);
    const marques = trouver(app, n => n.classList.contains("cnt-terme")), cles = marques.map(n => n.getAttribute("data-terme"));
    verifier(attendus.every(c => cles.includes(c)) && new Set(cles).size === cles.length, "page " + o + " (" + l + ") : termes soulignés, une seule fois chacun : " + cles.join(" "));
    verifier(marques.every(n => n.getAttribute("tabindex") === "0" && n.getAttribute("aria-describedby") === "tip"), "page " + o + " (" + l + ") : chaque terme se rejoint au clavier et décrit son infobulle");
  }
  page("site", "en");
  const ref = trouver(app, n => n.classList.contains("cnt-terme") && n.getAttribute("data-terme") === "ref")[0];
  verifier(ref && /^Baseline/.test(ref.textContent), "en anglais, le terme souligné est le terme anglais (" + (ref && ref.textContent) + ")");
  ref.dispatchEvent({ type: "focus" });
  verifier(!tip.hidden && /Baseline/.test(texteDe(tip)) && /expected consumption/i.test(texteDe(tip)), "au focus clavier, l'infobulle montre la définition anglaise");
  ref.dispatchEvent({ type: "blur" });
  verifier(tip.hidden, "elle se cache en quittant le terme");
  page("site", "fr");
  const ref2 = trouver(app, n => n.classList.contains("cnt-terme") && n.getAttribute("data-terme") === "ref")[0];
  ref2.click();
  verifier(!tip.hidden && /consommation attendue/i.test(texteDe(tip)), "au toucher (appui), la définition française s'affiche");
  ref2.click();
  verifier(tip.hidden, "un second appui la cache");
  const parties = trouver(app, n => ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "SVG", "PATH"].includes(n.tagName) || n.classList.contains("val") || n.classList.contains("zone"));
  verifier(parties.every(p => !trouver(p, n => n.classList.contains("cnt-terme")).length), "rien de souligné dans les champs, boutons, nombres et graphiques");
  for (const o of ["site", "derives", "revue", "simulateur", "prevision", "veille", "evaluation", "agent", "guide"]) for (const l of ["fr", "en"]) {
    cnt.lexique = false; const sans = page(o, l); cnt.lexique = true; const avec = page(o, l);
    verifier(sans === avec, "page " + o + " (" + l + ") : le texte affiché est identique avec ou sans lexique");
  }
  page("revue", "fr");
  verifier(trouver(app, n => n.classList.contains("rev-document")).every(d => !trouver(d, n => n.classList.contains("cnt-terme")).length), "rien de souligné dans le texte rédigé par l'agent");

  console.log("— 13. Temps ajouté à rendre()");
  for (const o of ["derives", "prevision"]) {
    etat.onglet = o; const mesure = () => { const t0 = performance.now(); for (let k = 0; k < 8; k++) rendre(); return (performance.now() - t0) / 8; };
    // meilleure de cinq mesures alternées : une seule mesure dépendait de la charge de la machine et échouait parfois
    let sans = Infinity, avec = Infinity;
    for (let n = 0; n < 5; n++) { cnt.lexique = false; mesure(); sans = Math.min(sans, mesure()); cnt.lexique = true; mesure(); avec = Math.min(avec, mesure()); }
    const t0 = performance.now(); for (let k = 0; k < 8; k++) { cnt.lexique = true; cntMarquer(app); } const seul = (performance.now() - t0) / 8;
    console.log("  page " + o + " : rendre() " + sans.toFixed(1) + " ms sans lexique, " + avec.toFixed(1) + " ms avec ; marquage seul sur page déjà marquée " + seul.toFixed(2) + " ms");
    verifier(avec - sans < 5, "page " + o + " : le lexique ajoute moins de 5 ms à rendre() (" + (avec - sans).toFixed(1) + " ms)");
  }

  console.log("— 14. Menu du pied, deux langues ; réseau");
  page("site", "fr");
  verifier(/Projet et travail gardé/.test(texteDe(app)) && /Exporter le projet/.test(texteDe(app)) && /Ouvrir un projet/.test(texteDe(app)) && /la copie figée est une page à transmettre/.test(texteDe(app)), "menu du pied en français, avec la différence entre projet et copie figée");
  const en = page("site", "en");
  verifier(/Project and kept work/.test(en) && /Export the project/.test(en) && /Open a project/.test(en) && /frozen copy is a page to pass on/.test(en), "menu du pied en anglais");
  verifier(!/Projet et travail|Exporter le projet|Travail retrouvé|Gardé dans ce navigateur/.test(en), "aucun texte français du module en anglais");
  LANGUE = "fr"; CACHE_TR.clear(); rendre();
  champCle.value = ""; champCleGemini.value = "";
  verifier(!texteStocke().includes(CLE_TEST), "bilan : aucune clé dans le stockage");
  verifier(__reseau.length === 0, "aucun appel réseau pendant tout le test");
}
