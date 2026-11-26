async function test() {
  verifier(/Connexion à l'API Gemini impossible/.test(erreurReseauIA("Gemini", 2000)), "coupure immédiate : message réseau");
  verifier(/interrompue après 75 s/.test(erreurReseauIA("Gemini", 75000)), "coupure à 75 s : message de lenteur");
  LANGUE = "en"; verifier(/cut off after 75 s/.test(erreurReseauIA("Anthropic", 75000)), "message anglais"); LANGUE = "fr";
  // appel réel simulé : fetch qui échoue après 40 s de faux temps
  const vrai = Date.now; let decalage = 0; Date.now = () => vrai() + decalage;
  window.fetch = async () => { decalage = 40000; throw new TypeError("Load failed"); };
  agent.accord = "gemini"; champCleGemini.value = "cle-factice";
  try { await appelGemini({ system: "x", messages: [{ role: "user", content: "x" }], tools: [] }, new AbortController().signal); verifier(false, "aurait dû échouer"); }
  catch (e) { verifier(/interrompue après 40 s/.test(e.message), "appelGemini rend le message de lenteur : " + e.message.slice(0, 60)); }
  Date.now = vrai; agent.accord = false; champCleGemini.value = "";
}
