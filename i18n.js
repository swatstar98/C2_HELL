/* C2 HELL — internacionalización mínima. Idiomas: es, en (añade más con I18N.add('xx', {...}) en lang/xx.js).
 * t(clave, {param}) → texto; si falta la clave en el idioma activo cae a en → es → clave (o el 3er argumento). */
'use strict';
(function () {
  const dict = {};
  const KEY = 'c2hell.lang';
  let lang = 'en';
  const listeners = [];
  const supported = () => Object.keys(dict);
  function detect() {
    let s = null;
    try { s = localStorage.getItem(KEY); } catch (e) { /* sin almacenamiento */ }
    if (s && dict[s]) return s;
    const q = /[?&]lang=(\w+)/.exec(location.search); if (q && dict[q[1]]) return q[1];
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const p of prefs) { const c = String(p).toLowerCase().split('-')[0]; if (dict[c]) return c; }
    return dict.en ? 'en' : supported()[0];
  }
  function t(key, p, def) {
    let s = dict[lang] && dict[lang][key];
    if (s === undefined) s = dict.en && dict.en[key];
    if (s === undefined) s = dict.es && dict.es[key];
    if (s === undefined) s = def !== undefined ? def : key;
    if (p) s = s.replace(/\{(\w+)\}/g, (m, k) => p[k] !== undefined ? p[k] : m);
    return s;
  }
  window.I18N = {
    t,
    add(code, o) { dict[code] = Object.assign(dict[code] || {}, o); },
    init() { lang = detect(); },
    setLang(code, quiet) {
      if (!dict[code]) return;
      lang = code;
      try { localStorage.setItem(KEY, code); } catch (e) { /* sin almacenamiento */ }
      if (!quiet) listeners.forEach(f => f(code));
    },
    onChange(f) { listeners.push(f); },
    get lang() { return lang; },
    get langs() { return supported().map(c => ({ code: c, name: dict[c]['lang.name'] || c })); }
  };
})();
