/* Banc de test sans navigateur.
   Usage : node banc.js <script assemblé .js> <test.js> [classeur.xlsm]
   Charge le script du tableau de bord dans un faux DOM, lit le classeur, appelle charger(), puis exécute test.js
   DANS LA MÊME PORTÉE : le test voit etat, derives(), h(), vos fonctions de module, etc.
   Aides offertes au test : verifier(condition, message), texteDe(noeud), trouver(noeud, predicat), cliquer(noeud), fauxModele(fn).
   Le test peut être asynchrone : s'il définit `async function test()`, elle est attendue. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const [,, cheminScript, cheminTest, cheminClasseur = [path.join(__dirname, "..", "donnees", "SER PBI générique - valeurs figées.xlsm"), path.join(require("os").homedir(), "Desktop/PBI/SER PBI générique - valeurs figées.xlsm")].find(c => fs.existsSync(c))] = process.argv;

class Node {
  constructor(nom, type) {
    this.tagName = String(nom).toUpperCase(); this.nodeType = type || 1; this.children = []; this.attrs = {}; this.ecouteurs = {}; this.style = { setProperty() {}, removeProperty() {} };
    this.parentNode = null; this._texte = ""; this.hidden = false; this.value = ""; this.checked = false; this.disabled = false; this.open = false; this.files = [];
    this.scrollTop = 0; this.scrollLeft = 0; this.scrollHeight = 0; this.offsetLeft = 0; this.dataset = {};
    const classes = () => new Set(String(this.attrs.class || "").split(/\s+/).filter(Boolean)), poser = s => { this.attrs.class = [...s].join(" "); };
    this.classList = { add: (...c) => { const s = classes(); c.forEach(x => s.add(x)); poser(s); }, remove: (...c) => { const s = classes(); c.forEach(x => s.delete(x)); poser(s); },
      toggle: (c, f) => { const s = classes(); const on = f === undefined ? !s.has(c) : f; on ? s.add(c) : s.delete(c); poser(s); return on; }, contains: c => classes().has(c) };
  }
  get clientWidth() { return 900; } get offsetWidth() { return 900; } get scrollWidth() { return 900; } get clientHeight() { return 300; } get offsetHeight() { return 300; }
  get className() { return this.attrs.class || ""; } set className(v) { this.attrs.class = v; }
  get id() { return this.attrs.id || ""; } set id(v) { this.attrs.id = v; }
  get childNodes() { return this.children; } get firstChild() { return this.children[0] || null; } get lastChild() { return this.children[this.children.length - 1] || null; }
  get textContent() { return this.nodeType === 3 ? this._texte : this.children.length ? this.children.map(c => c.textContent).join("") : this._texte; }
  set textContent(v) { this.children = []; this._texte = String(v); }
  get innerText() { return this.textContent; } set innerText(v) { this.textContent = v; }
  get innerHTML() { return this.textContent; } set innerHTML(v) { this.textContent = String(v).replace(/<[^>]*>/g, ""); }
  get outerHTML() { return "<" + this.tagName.toLowerCase() + ">" + this.textContent + "</" + this.tagName.toLowerCase() + ">"; }
  _adopter(c) { if (!(c instanceof Node)) { const t = new Node("#text", 3); t._texte = String(c); c = t; } if (c.parentNode) c.remove(); c.parentNode = this; return c; }
  append(...c) { for (const x of c.flat()) if (x != null) this.children.push(this._adopter(x)); }
  appendChild(c) { this.append(c); return c; }
  prepend(...c) { this.children.unshift(...c.flat().filter(x => x != null).map(x => this._adopter(x))); }
  before(...c) { const p = this.parentNode; if (!p) return; const i = p.children.indexOf(this); p.children.splice(i, 0, ...c.flat().map(x => p._adopter(x))); }
  after(...c) { const p = this.parentNode; if (!p) return; const i = p.children.indexOf(this); p.children.splice(i + 1, 0, ...c.flat().map(x => p._adopter(x))); }
  insertBefore(c, ref) { c = this._adopter(c); const i = ref ? this.children.indexOf(ref) : -1; i < 0 ? this.children.push(c) : this.children.splice(i, 0, c); return c; }
  replaceChildren(...c) { this.children.forEach(x => { x.parentNode = null; }); this.children = []; this._texte = ""; this.append(...c); }
  replaceWith(...c) { const p = this.parentNode; if (!p) return; const i = p.children.indexOf(this); p.children.splice(i, 1, ...c.flat().map(x => p._adopter(x))); this.parentNode = null; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; } return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  contains(n) { for (let x = n; x; x = x.parentNode) if (x === this) return true; return false; }
  cloneNode() { const n = new Node(this.tagName, this.nodeType); n.attrs = { ...this.attrs }; n._texte = this._texte; return n; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "value") this.value = String(v); if (k === "hidden") this.hidden = true; if (k === "checked") this.checked = true; if (k === "disabled") this.disabled = true; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } hasAttribute(k) { return k in this.attrs; } removeAttribute(k) { delete this.attrs[k]; } toggleAttribute(k, f) { f === false ? delete this.attrs[k] : (this.attrs[k] = ""); }
  addEventListener(t, f) { (this.ecouteurs[t] = this.ecouteurs[t] || []).push(f); } removeEventListener(t, f) { this.ecouteurs[t] = (this.ecouteurs[t] || []).filter(x => x !== f); }
  dispatchEvent(e) { (this.ecouteurs[e.type] || []).forEach(f => f(e)); return true; }
  click() { this.dispatchEvent({ type: "click", target: this, currentTarget: this, preventDefault() {}, stopPropagation() {} }); }
  focus() {} blur() {} select() {} scrollIntoView() {} scrollTo() {} setPointerCapture() {} releasePointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: 900, bottom: 300, width: 900, height: 300, x: 0, y: 0 }; }
  getBBox() { return { x: 0, y: 0, width: 40, height: 12 }; } getComputedTextLength() { return this.textContent.length * 6; } getTotalLength() { return 100; }
  _tous(out = []) { for (const c of this.children) { if (c.nodeType === 1) { out.push(c); c._tous(out); } } return out; }
  _selon(sel) {                                    // sélecteurs simples : balise, .classe, #id, [attr], [attr="v"], et leurs combinaisons sans espace
    const r = /^([a-zA-Z0-9-]*)((?:[.#][\w-]+|\[[\w-]+(?:=["']?[^"'\]]*["']?)?\])*)$/.exec(sel.trim()); if (!r) return () => false;
    const tests = []; if (r[1]) tests.push(n => n.tagName === r[1].toUpperCase());
    for (const m of r[2].matchAll(/\.([\w-]+)|#([\w-]+)|\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]/g)) {
      if (m[1]) tests.push(n => n.classList.contains(m[1])); else if (m[2]) tests.push(n => n.attrs.id === m[2]);
      else tests.push(n => m[4] === undefined ? m[3] in n.attrs || (m[3] === "hidden" && n.hidden) : n.attrs[m[3]] === m[4]);
    }
    return n => tests.every(t => t(n));
  }
  querySelectorAll(sel) { const parties = sel.split(",").map(x => x.trim().split(/\s+/).pop()).map(x => this._selon(x)); return this._tous().filter(n => parties.some(t => t(n))); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  matches(sel) { return this._selon(sel)(this); }
  closest(sel) { for (let x = this; x; x = x.parentNode) if (x.nodeType === 1 && x.matches(sel)) return x; return null; }
}

/* Analyseur XML minimal, suffisant pour les feuilles d'un classeur Excel (remplace DOMParser, absent de Node). */
class NoeudXml {
  constructor(nom) { this.nodeName = nom; this.localName = nom.includes(":") ? nom.split(":").pop() : nom; this.attrs = {}; this.children = []; this.parentNode = null; this._t = ""; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  getAttributeNS(ns, k) { for (const a in this.attrs) if (a === k || a.endsWith(":" + k)) return this.attrs[a]; return null; }
  get textContent() { return this._parts.map(x => typeof x === "string" ? x : x.textContent).join(""); }
  getElementsByTagNameNS(ns, nom) { const out = []; (function voir(n) { for (const c of n.children) { if (nom === "*" || c.localName === nom) out.push(c); voir(c); } })(this); return out; }
  getElementsByTagName(nom) { return this.getElementsByTagNameNS("*", nom.includes(":") ? nom.split(":").pop() : nom); }
}
const entites = s => s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[e] || m);
class DOMParser {
  parseFromString(src) {
    const racine = new NoeudXml("#document"); racine._parts = [];
    let courant = racine, i = 0; const n = src.length;
    while (i < n) {
      const lt = src.indexOf("<", i);
      if (lt < 0) { courant._parts.push(entites(src.slice(i))); break; }
      if (lt > i) courant._parts.push(entites(src.slice(i, lt)));
      if (src.startsWith("<!--", lt)) { i = src.indexOf("-->", lt) + 3; continue; }
      if (src.startsWith("<![CDATA[", lt)) { const f = src.indexOf("]]>", lt); courant._parts.push(src.slice(lt + 9, f)); i = f + 3; continue; }
      if (src[lt + 1] === "?" || src[lt + 1] === "!") { i = src.indexOf(">", lt) + 1; continue; }
      const gt = src.indexOf(">", lt), corps = src.slice(lt + 1, gt);
      if (corps[0] === "/") { courant = courant.parentNode || racine; i = gt + 1; continue; }
      const auto = corps.endsWith("/"), r = /^([^\s/]+)/.exec(corps), e = new NoeudXml(r[1]); e._parts = [];
      for (const a of corps.slice(r[1].length).matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) e.attrs[a[1]] = entites(a[2] !== undefined ? a[2] : a[3]);
      e.parentNode = courant; courant.children.push(e); courant._parts.push(e);
      if (!auto) courant = e;
      i = gt + 1;
    }
    racine.documentElement = racine.children[0] || null;
    return racine;
  }
}
const corps = new Node("body"), racine = new Node("html"), tete = new Node("head");
racine.append(tete, corps);
const fixes = { app: new Node("div"), tip: new Node("div"), "donnees-figees": new Node("script"), "images-guide": new Node("script") };
for (const k in fixes) { fixes[k].attrs.id = k; corps.append(fixes[k]); }
fixes["images-guide"]._texte = "{}";
const document = { documentElement: racine, body: corps, head: tete, title: "", activeElement: null,
  createElement: n => new Node(n), createElementNS: (ns, n) => new Node(n), createTextNode: t => { const n = new Node("#text", 3); n._texte = String(t); return n; },
  createDocumentFragment: () => new Node("#fragment", 11),
  getElementById: id => fixes[id] || racine._tous().find(n => n.attrs.id === id) || null,
  querySelector: s => racine.querySelector(s), querySelectorAll: s => racine.querySelectorAll(s), addEventListener() {}, removeEventListener() {}, execCommand: () => true };
const stock = {};
const localStorage = { getItem: k => k in stock ? stock[k] : null, setItem: (k, v) => { stock[k] = String(v); }, removeItem: k => { delete stock[k]; }, clear: () => { for (const k in stock) delete stock[k]; } };
const reseau = [];                                  // tout appel réseau du script est refusé et consigné ici
const fetchInterdit = async (url, o) => { reseau.push({ url: String(url), options: o }); throw new Error("Réseau coupé dans le banc de test : " + url); };
const ctx = { document, Node, localStorage, sessionStorage: localStorage, location: { hash: "", search: "", protocol: "file:", href: "file:///banc.html", origin: "null", pathname: "/banc.html" },
  history: { replaceState() {}, pushState() {} }, navigator: { clipboard: { writeText: async () => {} }, language: "fr-FR", userAgent: "banc" },
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener() {}, removeEventListener() {}, scrollTo() {}, alert: m => console.log("[alert]", m), confirm: () => true, prompt: () => null,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), getComputedStyle: () => ({ getPropertyValue: () => "" }),
  requestAnimationFrame: f => setTimeout(f, 0), cancelAnimationFrame: clearTimeout, print() {},
  console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, performance, structuredClone,
  URL, URLSearchParams, Blob, File: globalThis.File, FileReader: globalThis.FileReader, Response, Request, Headers, TextDecoder, TextEncoder, DecompressionStream, CompressionStream, ReadableStream,
  DOMParser, AbortController, AbortSignal, DOMException, crypto: globalThis.crypto, atob, btoa, Intl, fetch: fetchInterdit, __reseau: reseau };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(cheminScript, "utf8"), ctx, { filename: path.basename(cheminScript) });
vm.runInContext(`
function verifier(cond, message) { if (!cond) { console.log("ÉCHEC :", message); verifier.echecs++; } else { verifier.reussis++; if (verifier.bavard) console.log("ok :", message); } }
verifier.echecs = 0; verifier.reussis = 0; verifier.bavard = true;
const texteDe = n => Array.isArray(n) ? n.filter(Boolean).map(texteDe).join("\\n") : n ? n.textContent : "";
function trouver(n, predicat) { const tous = []; (function voir(x) { if (!x) return; if (Array.isArray(x)) return x.forEach(voir); if (x.nodeType === 1 && predicat(x)) tous.push(x); (x.children || []).forEach(voir); })(n); return tous; }
const cliquer = n => n.click();
/* fauxModele(fn) : fabrique un « appelerModele » de remplacement. fn(requete, tour) rend le tableau content de la réponse (blocs text / tool_use). */
function fauxModele(fn) { let tour = 0; return async requete => { tour++; const content = await fn(requete, tour); return { id: "msg_test_" + tour, type: "message", role: "assistant", model: "faux modèle de test", content, stop_reason: content.some(b => b.type === "tool_use") ? "tool_use" : "end_turn", usage: { input_tokens: 0, output_tokens: 0 } }; }; }
`, ctx);
(async () => {
  const buf = fs.readFileSync(cheminClasseur);
  ctx.__buf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); ctx.__nom = path.basename(cheminClasseur);
  await vm.runInContext(`(async () => { const { grilles, d1904 } = await lireClasseur(__buf); charger(grilles, d1904, __nom, null); })()`, ctx);
  if (cheminTest) {
    vm.runInContext(fs.readFileSync(cheminTest, "utf8"), ctx, { filename: path.basename(cheminTest) });
    await vm.runInContext(`typeof test === "function" ? test() : null`, ctx);
  }
  const { echecs, reussis } = vm.runInContext("verifier", ctx);
  console.log("\n" + reussis + " vérification(s) réussie(s), " + echecs + " échec(s) ; appels réseau tentés : " + reseau.length);
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error("ERREUR DU BANC :", e); process.exit(2); });
