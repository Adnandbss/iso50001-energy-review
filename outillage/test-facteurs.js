const m = etat.modele, finIdx = m.dates.findIndex(t => t > m.fin);
console.log("dates après la fin des données :", finIdx < 0 ? 0 : m.dates.length - finIdx, "sur", m.dates.length);
for (const f of m.facteurs) { const apres = f.valeurs.slice(finIdx), avant = f.valeurs.slice(0, finIdx).filter(v => v != null);
  console.log("facteur :", apres.length, "valeurs après la fin, dont", apres.filter(v => v === 0).length, "à 0 et", apres.filter(v => v == null).length, "vides ; avant la fin : min", Math.min(...avant).toFixed(2), "zéros", avant.filter(v => v === 0).length); }
const r = outilLireFacteurs({ de: isoJour(m.debut), a: isoJour(m.fin) });
console.log(JSON.stringify(r).slice(0, 700));
