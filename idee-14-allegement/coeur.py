# Correctifs du coeur portés par le module « Allègement » (préfixe alg) : pages Site, UES, Facteurs influents, Graphiques, Arborescence.
# Aucun calcul ne change. Chaque page passe ce qu'elle a déjà calculé à une fonction du module, qui pose la phrase de réponse en tête
# et range les réglages rares sous un repli. Les pages Détection, Instruction et Veille ne sont pas touchées.

def patch(js, remplacer):
    # 1. Site et UES : les réglages rares (comparaison, unité de l'écart, seuil) forment un second groupe de filtres...
    js = remplacer(js, '''    filtresCommuns(true),
    filtre("Comparer à"''', '''    filtresCommuns(true));
  const rares = h("div", { class: "filtres" },
    filtre("Comparer à"''')
    # ... et la page rend ses chiffres au module, qui écrit la réponse.
    js = remplacer(js, 'return [filtres, tuiles, h("div", { class: "grille" }, c1, c2)];',
                   'return algNiveau({ groupe, sr, filtres, rares, tuiles, c1, c2, versRef, ecart, pct, partiel, bande, hors, compares, seuil, enCours });')
    js = remplacer(js, 'if (!lib.length) return [filtres, tuiles, h("div", { class: "vide" }, "Aucune donnée sur la période choisie.")];\n  const serieCmp',
                   'if (!lib.length) return [filtres, rares, tuiles, h("div", { class: "vide" }, "Aucune donnée sur la période choisie.")];\n  const serieCmp')
    # 2. Facteurs influents : la corrélation mesurée, en une phrase.
    js = remplacer(js, '''  return [filtres, tuiles, h("div", { class: "grille" },
    carte({ id: "fact-conso"''', '''  return algFacteurs({ sr, fa, r, force, n: pts.length, filtres, tuiles, grille: h("div", { class: "grille" },
    carte({ id: "fact-conso"''')
    js = remplacer(js, '''lignes: pts.map(p => [p.lib, nf(p.x, 2), nf(p.y, 0)]) }) }))];''', '''lignes: pts.map(p => [p.lib, nf(p.x, 2), nf(p.y, 0)]) }) })) });''')
    # 3. Graphiques : le total du site par énergie et le premier usage, tels que les cartes les montrent.
    js = remplacer(js, 'return [filtres, h("div", { class: "grille" }, cartes)];',
                   'return algGraphiques({ filtres, cartes, parts: parEnergie(site), usages, totalUES });')
    # 4. Arborescence : la part suivie par les UES, énergie par énergie.
    js = remplacer(js, '''  const cartes = [];
  for (const e of m.energies) {
    const site = m.series.filter(x => x.energie === e && x.groupe === "site")''', '''  const cartes = [], algParts = [];
  for (const e of m.energies) {
    const site = m.series.filter(x => x.energie === e && x.groupe === "site")''')
    js = remplacer(js, '''    cartes.push(carte({ id: "arbo-" + e,''', '''    algParts.push({ e, tSite, tUES, aSite });
    cartes.push(carte({ id: "arbo-" + e,''')
    js = remplacer(js, 'return [filtres, h("div", { class: "tuiles" }, tuile("Consommation totale du site',
                   'return algArborescence(totalSite, algParts, [filtres, h("div", { class: "tuiles" }, tuile("Consommation totale du site')
    js = remplacer(js, '''fmtDate(etat.de) + " au " + fmtDate(etat.a), true)), h("div", { class: "grille" }, cartes)];''',
                   '''fmtDate(etat.de) + " au " + fmtDate(etat.a), true)), h("div", { class: "grille" }, cartes)]);''')
    # 5. Phrase de confidentialité (accueil et mode d'emploi, deux occurrences posées par l'assembleur) : depuis le panneau unique,
    #    l'accord se donne dans les réglages d'IA ; une fonction décochée garde son avis sur sa page. Traduction anglaise : idee-9-assemblage.
    avant = "Exceptions, uniquement après votre accord explicite, donné sur la page concernée, et vers l'API"
    assert js.count(avant) == 2, "phrase de confidentialité introuvable ou ambiguë"
    js = js.replace(avant, "Exceptions, uniquement après votre accord explicite, donné dans les réglages d'IA (un accord, fonction par fonction) ou sur la page concernée, et vers l'API")
    return js
