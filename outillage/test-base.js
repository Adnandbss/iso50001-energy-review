const m = etat.modele;
verifier(!!m, "un modèle est chargé");
console.log("clés du modèle :", Object.keys(m).join(", "));
console.log("période :", isoJour(m.debut), "→", isoJour(m.fin), "| pasFin :", m.pasFin, "| énergies :", m.energies.length, "| séries :", m.series.length, "| facteurs :", m.facteurs.length, "| alertes :", m.alertes.length);
const sr = m.series[0];
console.log("clés d'une série :", Object.keys(sr).join(", "));
console.log("exemple de série :", JSON.stringify(sr, (k, v) => Array.isArray(v) && v.length > 6 ? "[" + v.length + " valeurs : " + v.slice(0, 3).map(x => typeof x === "number" ? Math.round(x * 100) / 100 : x).join(", ") + "…]" : v).slice(0, 1500));
console.log("dates :", m.dates.length, "| facteurs :", m.facteurs.length, "| valeurs par facteur :", m.facteurs[0].valeurs.length);
console.log("pas des séries :", [...new Set(m.series.map(x => x.groupe + "/" + x.pas + "/" + x.type + "/" + x.nbPoints))].join(" ; "));
const d = derives();
console.log("clés de derives() :", Object.keys(d).join(", "), "| épisodes :", d.episodes.length);
console.log("clés d'un épisode :", Object.keys(d.episodes[0] || {}).join(", "));
console.log("clés d'une analyse :", Object.keys((d.episodes[0] || {}).analyse || {}).join(", "));
for (const o of ONGLETS) { etat.onglet = o[0]; rendre(); verifier(texteDe(document.getElementById("app")).length > 200, "la page « " + o[0] + " » se rend"); }
