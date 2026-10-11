/* Textos de interfaz de las campañas históricas (es/en; el resto de idiomas usa inglés). El contenido histórico de cada campaña vive en hist/. */
I18N.add('es', {
  'm.hist': 'CAMPAÑAS HISTÓRICAS', 'h.title': 'CAMPAÑAS HISTÓRICAS', 'h.sub': 'Cada campaña es independiente: su época, su ejército y su historia. 24 misiones de unos 5 minutos que enseñan lo que ocurrió de verdad.',
  'h.soon': 'Próximamente: más conflictos históricos.', 'h.done': '{a}/{b} misiones · {s}/{t} ★', 'h.missions': 'Misiones superadas', 'h.arch': 'ARCHIVO HISTÓRICO', 'h.locked': 'Completa la misión anterior',
  'h.mission': 'MISIÓN {n}', 'h.sit': 'SITUACIÓN', 'h.obj': 'TU MISIÓN', 'h.enemy': 'Fuerzas enemigas previstas', 'h.newunit': 'NUEVO EN TU ARSENAL', 'h.start': '▶ COMENZAR MISIÓN', 'h.back': '← CAMPAÑA',
  'h.disc': 'Reconstrucción jugable: la situación y los hechos son históricos; las oleadas son representativas y las posiciones, aproximadas.', 'h.real': 'LO QUE OCURRIÓ REALMENTE', 'h.fact': 'SABÍAS QUE',
  'h.card': 'FICHA DESBLOQUEADA', 'h.next': '▶ SIGUIENTE MISIÓN', 'h.epi': '▶ EPÍLOGO', 'h.epiT': 'EPÍLOGO', 'h.timeline': 'CRONOLOGÍA', 'h.cards': 'FICHAS', 'h.cardLocked': 'Ficha bloqueada', 'h.gloss': 'GLOSARIO', 'h.radio': 'RADIO'
});
I18N.add('en', {
  'm.hist': 'HISTORICAL CAMPAIGNS', 'h.title': 'HISTORICAL CAMPAIGNS', 'h.sub': 'Each campaign stands alone: its own era, army and story. 24 missions of about 5 minutes that teach what really happened.',
  'h.soon': 'Coming soon: more historical conflicts.', 'h.done': '{a}/{b} missions · {s}/{t} ★', 'h.missions': 'Missions completed', 'h.arch': 'HISTORICAL ARCHIVE', 'h.locked': 'Complete the previous mission',
  'h.mission': 'MISSION {n}', 'h.sit': 'SITUATION', 'h.obj': 'YOUR MISSION', 'h.enemy': 'Expected enemy forces', 'h.newunit': 'NEW IN YOUR ARSENAL', 'h.start': '▶ START MISSION', 'h.back': '← CAMPAIGN',
  'h.disc': 'Playable reconstruction: the situation and facts are historical; waves are representative and positions approximate.', 'h.real': 'WHAT REALLY HAPPENED', 'h.fact': 'DID YOU KNOW',
  'h.card': 'ARCHIVE CARD UNLOCKED', 'h.next': '▶ NEXT MISSION', 'h.epi': '▶ EPILOGUE', 'h.epiT': 'EPILOGUE', 'h.timeline': 'TIMELINE', 'h.cards': 'CARDS', 'h.cardLocked': 'Card locked', 'h.gloss': 'GLOSSARY', 'h.radio': 'RADIO'
});
I18N.add('es', {
  'h.cp': 'PUNTOS DE CAMPAÑA', 'h.cpu': 'pts', 'h.upg': 'MEJORAS DE CAMPAÑA', 'h.buy': 'COMPRAR CAMPAÑA · {p} (las {f} primeras misiones son gratis)',
  'st.camp.d': 'Campaña histórica de {n} misiones con archivo educativo y mejoras propias. Las {f} primeras misiones son gratis.',
  'st.full.d': 'Los 4 teatros extra (16 niveles), modo Sin fin, Reto diario y Misiones especiales. Las campañas históricas se compran aparte.'
});
I18N.add('en', {
  'h.cp': 'CAMPAIGN POINTS', 'h.cpu': 'pts', 'h.upg': 'CAMPAIGN UPGRADES', 'h.buy': 'BUY CAMPAIGN · {p} (first {f} missions are free)',
  'st.camp.d': 'Historical campaign of {n} missions with educational archive and its own upgrades. The first {f} missions are free.',
  'st.full.d': 'The 4 extra theaters (16 levels), Endless mode, Daily challenge and Special missions. Historical campaigns are sold separately.'
});
/* Traducciones del contenido histórico: C2_HTR(campaña, idioma, {'ruta|del|texto': 'traducción'}). Las rutas apuntan a los objetos {es,en} de window.C2_HIST[id]
 * (p. ej. 'missions|0|ctx', 'era|str|hint.sam'). Los archivos hist/<id>_<idioma>.js se cargan DESPUÉS de los datos de la campaña. */
window.C2_HTR = function (id, lang, map) {
  const K = (window.C2_HIST || {})[id]; if (!K) return;
  for (const path in map) {
    let o = K; const ps = path.split('|');
    for (const p of ps) { o = o && o[p]; }
    if (o && typeof o === 'object') o[lang] = map[path]; else if (window.console) console.warn('C2_HTR: ruta inexistente', id, lang, path);
  }
};
I18N.add('fr', {
  'm.hist': 'CAMPAGNES HISTORIQUES', 'h.title': 'CAMPAGNES HISTORIQUES', 'h.sub': 'Chaque campagne est indépendante : son époque, son armée et son histoire. 24 missions d\'environ 5 minutes qui montrent ce qui s\'est vraiment passé.',
  'h.soon': 'Bientôt : d\'autres conflits historiques.', 'h.done': '{a}/{b} missions · {s}/{t} ★', 'h.missions': 'Missions réussies', 'h.arch': 'ARCHIVES HISTORIQUES', 'h.locked': 'Terminez la mission précédente',
  'h.mission': 'MISSION {n}', 'h.sit': 'SITUATION', 'h.obj': 'VOTRE MISSION', 'h.enemy': 'Forces ennemies prévues', 'h.newunit': 'NOUVEAU DANS VOTRE ARSENAL', 'h.start': '▶ COMMENCER LA MISSION', 'h.back': '← CAMPAGNE',
  'h.disc': 'Reconstitution jouable : la situation et les faits sont historiques ; les vagues sont représentatives et les positions approximatives.', 'h.real': 'CE QUI S\'EST VRAIMENT PASSÉ', 'h.fact': 'LE SAVIEZ-VOUS',
  'h.card': 'FICHE DÉBLOQUÉE', 'h.next': '▶ MISSION SUIVANTE', 'h.epi': '▶ ÉPILOGUE', 'h.epiT': 'ÉPILOGUE', 'h.timeline': 'CHRONOLOGIE', 'h.cards': 'FICHES', 'h.cardLocked': 'Fiche verrouillée', 'h.gloss': 'GLOSSAIRE', 'h.radio': 'RADIO',
  'h.cp': 'POINTS DE CAMPAGNE', 'h.upg': 'AMÉLIORATIONS DE CAMPAGNE', 'h.buy': 'ACHETER LA CAMPAGNE · {p} (les {f} premières missions sont gratuites)',
  'st.camp.d': 'Campagne historique de {n} missions avec archives éducatives et ses propres améliorations. Les {f} premières missions sont gratuites.',
  'st.full.d': 'Les 4 théâtres supplémentaires (16 niveaux), le mode Sans fin, le Défi quotidien et les Missions spéciales. Les campagnes historiques se vendent séparément.'
});
I18N.add('de', {
  'm.hist': 'HISTORISCHE KAMPAGNEN', 'h.title': 'HISTORISCHE KAMPAGNEN', 'h.sub': 'Jede Kampagne ist eigenständig: ihre Epoche, ihre Armee, ihre Geschichte. 24 Missionen von etwa 5 Minuten, die zeigen, was wirklich geschah.',
  'h.soon': 'Demnächst: weitere historische Konflikte.', 'h.done': '{a}/{b} Missionen · {s}/{t} ★', 'h.missions': 'Abgeschlossene Missionen', 'h.arch': 'HISTORISCHES ARCHIV', 'h.locked': 'Schließe die vorherige Mission ab',
  'h.mission': 'MISSION {n}', 'h.sit': 'LAGE', 'h.obj': 'DEINE MISSION', 'h.enemy': 'Erwartete feindliche Kräfte', 'h.newunit': 'NEU IN DEINEM ARSENAL', 'h.start': '▶ MISSION STARTEN', 'h.back': '← KAMPAGNE',
  'h.disc': 'Spielbare Rekonstruktion: Lage und Fakten sind historisch; die Wellen sind repräsentativ und die Positionen ungefähr.', 'h.real': 'WAS WIRKLICH GESCHAH', 'h.fact': 'WUSSTEST DU',
  'h.card': 'KARTE FREIGESCHALTET', 'h.next': '▶ NÄCHSTE MISSION', 'h.epi': '▶ EPILOG', 'h.epiT': 'EPILOG', 'h.timeline': 'ZEITLEISTE', 'h.cards': 'KARTEN', 'h.cardLocked': 'Karte gesperrt', 'h.gloss': 'GLOSSAR', 'h.radio': 'FUNK',
  'h.cp': 'KAMPAGNENPUNKTE', 'h.upg': 'KAMPAGNEN-UPGRADES', 'h.buy': 'KAMPAGNE KAUFEN · {p} (die ersten {f} Missionen sind kostenlos)',
  'st.camp.d': 'Historische Kampagne mit {n} Missionen, lehrreichem Archiv und eigenen Upgrades. Die ersten {f} Missionen sind kostenlos.',
  'st.full.d': 'Die 4 zusätzlichen Schauplätze (16 Levels), Endlosmodus, Tägliche Herausforderung und Sondermissionen. Historische Kampagnen werden separat verkauft.'
});
I18N.add('pt', {
  'm.hist': 'CAMPANHAS HISTÓRICAS', 'h.title': 'CAMPANHAS HISTÓRICAS', 'h.sub': 'Cada campanha é independente: sua época, seu exército e sua história. 24 missões de cerca de 5 minutos que mostram o que realmente aconteceu.',
  'h.soon': 'Em breve: mais conflitos históricos.', 'h.done': '{a}/{b} missões · {s}/{t} ★', 'h.missions': 'Missões concluídas', 'h.arch': 'ARQUIVO HISTÓRICO', 'h.locked': 'Conclua a missão anterior',
  'h.mission': 'MISSÃO {n}', 'h.sit': 'SITUAÇÃO', 'h.obj': 'SUA MISSÃO', 'h.enemy': 'Forças inimigas previstas', 'h.newunit': 'NOVO NO SEU ARSENAL', 'h.start': '▶ INICIAR MISSÃO', 'h.back': '← CAMPANHA',
  'h.disc': 'Reconstrução jogável: a situação e os fatos são históricos; as ondas são representativas e as posições, aproximadas.', 'h.real': 'O QUE REALMENTE ACONTECEU', 'h.fact': 'VOCÊ SABIA',
  'h.card': 'FICHA DESBLOQUEADA', 'h.next': '▶ PRÓXIMA MISSÃO', 'h.epi': '▶ EPÍLOGO', 'h.epiT': 'EPÍLOGO', 'h.timeline': 'CRONOLOGIA', 'h.cards': 'FICHAS', 'h.cardLocked': 'Ficha bloqueada', 'h.gloss': 'GLOSSÁRIO', 'h.radio': 'RÁDIO',
  'h.cp': 'PONTOS DE CAMPANHA', 'h.upg': 'MELHORIAS DA CAMPANHA', 'h.buy': 'COMPRAR CAMPANHA · {p} (as {f} primeiras missões são grátis)',
  'st.camp.d': 'Campanha histórica de {n} missões com arquivo educativo e melhorias próprias. As {f} primeiras missões são grátis.',
  'st.full.d': 'Os 4 teatros extras (16 níveis), modo Sem fim, Desafio diário e Missões especiais. As campanhas históricas são vendidas separadamente.'
});
