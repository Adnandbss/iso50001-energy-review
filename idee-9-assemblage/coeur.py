# Correctifs du coeur portés par le module d'assemblage (chargé en dernier).
# Détection, Instruction et Veille ne forment plus qu'une page, « Dérives » : un texte qui cite la page Veille devient faux.

def patch(js, remplacer):
    # Avis d'envoi de l'instruction (repris dans les réglages d'IA) et sa clé dans la table de traduction du coeur :
    # la série se lance désormais depuis la page Dérives. Traduction anglaise : module.js de ce dossier.
    avant = "Une évaluation, ou une série lancée depuis la page Veille, répète ces envois pour chaque épisode."
    assert js.count(avant) == 2, "phrase de l'avis d'envoi introuvable ou ambiguë"
    return js.replace(avant, "Une évaluation, ou une série lancée depuis la page Dérives, répète ces envois pour chaque épisode.")
