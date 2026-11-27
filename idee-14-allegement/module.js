/* Module « Allègement » (préfixe alg) : la réponse en tête des pages du coeur Site, UES, Facteurs influents, Graphiques et Arborescence.
   Les pages appellent ces fonctions par les remplacements de coeur.py, avec ce qu'elles ont déjà calculé : aucun chiffre n'est recalculé ici,
   la phrase reprend les valeurs et les formats des tuiles et des cartes. Les réglages rares passent sous un repli. */
const algT = (fr, en) => { if (!EN.has(fr)) ajouterTraductions([[fr, en]]); return fr; };
const algPeriode = () => Lg("du " + fmtDate(etat.de) + " au " + fmtDate(etat.a), "from " + fmtDate(etat.de) + " to " + fmtDate(etat.a));
const algReponse = (titre, suite, alerte) => h("div", { class: "constat alg-reponse" + (alerte ? " alerte" : "") }, h("p", { class: "titre" }, titre), suite ? h("p", { class: "suite" }, suite) : null);
const algForce = (f, r) => (LANGUE === "en" ? { "liaison forte": "strong", "liaison modérée": "moderate", "liaison faible": "weak" }[f] + (r < 0 ? " negative" : " positive") + " relationship"
  : f + (r < 0 ? ", négative" : ", positive"));

/* Site et UES : l'écart à la référence (ou à l'année précédente) sur la période, les périodes hors du tunnel, la dérive en cours. */
function algNiveau(o) {
  const { groupe, sr, versRef, ecart, pct, partiel, bande, hors, compares, seuil, enCours } = o;
  const cmp = versRef ? Lg("sa référence", "its baseline") : Lg("l'année précédente", "the previous year"), nom = Lg("« " + sr.nom + " » : ", "“" + sr.nom + "”: ");
  const sens = ecart > 0 ? Lg(", surconsommation", ", overconsumption") : ecart < 0 ? Lg(", économie", ", saving") : "";
  const titre = nom + (pct == null ? Lg("pas de comparaison possible avec " + cmp + " sur la période choisie.", "no comparison possible with " + cmp + " over the chosen period.")
    : Lg(fmtPct(pct, true) + " par rapport à " + cmp + " (" + fmtEnergie(ecart, true) + sens + ")" + (partiel ? ", sur les périodes comparables." : "."),
      fmtPct(pct, true) + " against " + cmp + " (" + fmtEnergie(ecart, true) + sens + ")" + (partiel ? ", over comparable periods." : ".")));
  const suite = [Lg("Du " + fmtDate(etat.de) + " au " + fmtDate(etat.a) + ". ", "From " + fmtDate(etat.de) + " to " + fmtDate(etat.a) + ". "), bande && compares ? Lg(hors + " période(s) sur " + compares + " hors du tunnel à ± " + seuil + (seuil > 1 ? " écarts-types" : " écart-type") + " ; par hasard, on en attend environ 1 sur " + (seuil > 1 ? "20" : "3") + ". ",
      hors + " of " + compares + " period(s) outside the ± " + seuil + " standard deviation" + (seuil > 1 ? "s" : "") + " tunnel; by chance, about 1 in " + (seuil > 1 ? "20" : "3") + " is expected. ") : null,
    enCours ? Lg("Dérive en cours depuis " + enCours.libDebut + ".", "Ongoing drift since " + enCours.libDebut + ".") : null].filter(Boolean).join("");
  // quatre tuiles visibles (réel, comparaison, écart, écart relatif) ; la qualité du modèle et le compte hors tunnel, déjà dans la phrase, sous un repli
  const qualite = [...o.tuiles.children].slice(4);
  return [algReponse(titre, suite, !!enCours), o.tuiles, o.filtres,
    repli("alg-" + groupe + "-reglages", algT("Autres réglages : comparaison, unité de l'écart, seuil d'alerte", "Other settings: comparison, gap unit, alert threshold"), o.rares),
    h("div", { class: "grille" }, o.c1, o.c2),
    qualite.length ? repli("alg-" + groupe + "-qualite", algT("Qualité du modèle et périodes hors du tunnel", "Model quality and periods outside the tunnel"), h("div", { class: "tuiles" }, qualite)) : null];
}

/* Facteurs influents : la liaison mesurée entre le facteur et la consommation choisis. */
function algFacteurs(o) {
  const { sr, fa, r, force, n } = o, paire = Lg("« " + fa.nom + " » et « " + sr.nom + " »", "“" + fa.nom + "” and “" + sr.nom + "”");
  const reponse = r == null ? algReponse(paire + Lg(" : pas assez de points pour mesurer une liaison sur la période choisie (" + n + ").", ": not enough points to measure a relationship over the chosen period (" + n + ")."))
    : algReponse(paire + Lg(" : " + algForce(force, r) + " (r = " + nf(r, 3) + ", sur " + n + " dates).", ": " + algForce(force, r) + " (r = " + nf(r, 3) + ", over " + n + " dates)."),
      Lg("À lui seul, ce facteur explique " + nf(r * r, 3) + " de la variation (R²)" + (sr.r2 == null ? "" : " ; le modèle complet, tous facteurs, atteint " + nf(sr.r2, 3)) + ". Une corrélation n'est pas une cause.",
        "On its own, this variable explains " + nf(r * r, 3) + " of the variation (R²)" + (sr.r2 == null ? "" : "; the full model, all variables, reaches " + nf(sr.r2, 3)) + ". A correlation is not a cause."));
  return [reponse, o.tuiles, o.filtres, o.grille];
}

/* Graphiques : la consommation du site par énergie et l'usage qui pèse le plus, sur la période. */
function algGraphiques(o) {
  const { parts, usages, totalUES } = o, total = somme(parts.map(p => p.valeur));
  const titre = parts.length ? Lg("Le site a consommé " + fmtEnergie(total) + " " + algPeriode(), "The site used " + fmtEnergie(total) + " " + algPeriode())
      + (parts.length > 1 ? " (" + parts.map(p => p.nom + " " + fmtEnergie(p.valeur)).join(", ") + ")." : ".")
    : Lg("Aucun compteur de niveau Site sur la période choisie.", "No site-level meter over the chosen period.");
  const suite = usages.length ? Lg("Premier usage suivi : « " + usages[0].nom + " », " + fmtPct(usages[0].valeur / totalUES) + " du total des UES (" + usages.length + " usage(s)).",
    "Largest tracked use: “" + usages[0].nom + "”, " + fmtPct(usages[0].valeur / totalUES) + " of the SEU total (" + usages.length + " use(s)).") : null;
  return [algReponse(titre, suite), o.filtres, h("div", { class: "grille" }, o.cartes)];
}

/* Arborescence : le total du site et la part suivie par les UES, énergie par énergie. */
function algArborescence(totalSite, parts, page) {
  const suivis = parts.filter(p => p.aSite), titre = Lg("Le site a consommé " + fmtEnergie(totalSite) + " " + algPeriode(), "The site used " + fmtEnergie(totalSite) + " " + algPeriode())
    + (suivis.length ? Lg(" ; les UES en suivent ", "; the SEUs track ") + suivis.map(p => fmtPct(p.tUES / p.tSite) + (parts.length > 1 ? " (" + p.e + ")" : "")).join(", ") + "." : ".");
  const ecarts = suivis.filter(p => p.tSite - p.tUES < 0);
  const suite = ecarts.length ? Lg("Les UES dépassent le compteur site pour : " + ecarts.map(p => p.e).join(", ") + " (détail dans la carte).", "The SEUs exceed the site meter for: " + ecarts.map(p => p.e).join(", ") + " (details in the card).")
    : suivis.length ? algT("Le reste n'est suivi par aucune UES : un usage oublié peut s'y cacher.", "The rest is tracked by no SEU: a forgotten use may hide there.") : null;
  return [algReponse(titre, suite, ecarts.length > 0)].concat(page);
}
