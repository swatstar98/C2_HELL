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
I18N.add('es', {
  'goal.evac': 'EVACUACIÓN {p}%', 'goal.strike': 'AERÓDROMOS {a}/{b}', 'goal.ace': 'DERRIBOS AÉREOS {a}/{b}', 'goal.keep': '{n} {h}% (mín. {m}%)',
  'goal.b.evac': 'Mantén «{a}» sano (por encima del 70 %) hasta completar la evacuación.', 'goal.b.strike': 'Destruye al menos {n} aeródromos hostiles con ataques aéreos.',
  'goal.b.ace': 'Derriba al menos {n} aeronaves con tus propios aviones (no cuentan las baterías).', 'goal.b.keep': '«{a}» no puede bajar del {m} % de integridad.',
  'goal.fail.evac': 'Evacuación incompleta: el objetivo no se mantuvo a salvo.', 'goal.fail.strike': 'No se destruyeron suficientes aeródromos.', 'goal.fail.ace': 'No se lograron los derribos aéreos requeridos.', 'goal.fail.keep': 'El objetivo protegido sufrió demasiado daño.'
});
I18N.add('en', {
  'goal.evac': 'EVACUATION {p}%', 'goal.strike': 'AIRFIELDS {a}/{b}', 'goal.ace': 'AIR KILLS {a}/{b}', 'goal.keep': '{n} {h}% (min {m}%)',
  'goal.b.evac': 'Keep "{a}" healthy (above 70%) until the evacuation completes.', 'goal.b.strike': 'Destroy at least {n} hostile airfields with air strikes.',
  'goal.b.ace': 'Shoot down at least {n} aircraft with your own aircraft (batteries do not count).', 'goal.b.keep': '"{a}" must not drop below {m}% integrity.',
  'goal.fail.evac': 'Evacuation incomplete: the objective was not kept safe.', 'goal.fail.strike': 'Not enough airfields were destroyed.', 'goal.fail.ace': 'The required air kills were not achieved.', 'goal.fail.keep': 'The protected objective took too much damage.'
});
I18N.add('fr', {
  'goal.evac': 'ÉVACUATION {p} %', 'goal.strike': 'AÉRODROMES {a}/{b}', 'goal.ace': 'VICTOIRES AÉRIENNES {a}/{b}', 'goal.keep': '{n} {h} % (min. {m} %)',
  'goal.b.evac': 'Gardez «{a}» en bon état (au-dessus de 70 %) jusqu\'à la fin de l\'évacuation.', 'goal.b.strike': 'Détruisez au moins {n} aérodromes hostiles par des frappes aériennes.',
  'goal.b.ace': 'Abattez au moins {n} appareils avec vos propres avions (les batteries ne comptent pas).', 'goal.b.keep': '«{a}» ne doit pas descendre sous {m} % d\'intégrité.',
  'goal.fail.evac': 'Évacuation incomplète : l\'objectif n\'a pas été protégé.', 'goal.fail.strike': 'Pas assez d\'aérodromes détruits.', 'goal.fail.ace': 'Les victoires aériennes requises n\'ont pas été atteintes.', 'goal.fail.keep': 'L\'objectif protégé a subi trop de dégâts.'
});
I18N.add('de', {
  'goal.evac': 'EVAKUIERUNG {p} %', 'goal.strike': 'FLUGPLÄTZE {a}/{b}', 'goal.ace': 'LUFTSIEGE {a}/{b}', 'goal.keep': '{n} {h} % (min. {m} %)',
  'goal.b.evac': 'Halte «{a}» intakt (über 70 %), bis die Evakuierung abgeschlossen ist.', 'goal.b.strike': 'Zerstöre mindestens {n} feindliche Flugplätze durch Luftangriffe.',
  'goal.b.ace': 'Schieße mindestens {n} Flugzeuge mit deinen eigenen Maschinen ab (Batterien zählen nicht).', 'goal.b.keep': '«{a}» darf nicht unter {m} % Integrität fallen.',
  'goal.fail.evac': 'Evakuierung unvollständig: Das Ziel wurde nicht sicher gehalten.', 'goal.fail.strike': 'Nicht genug Flugplätze zerstört.', 'goal.fail.ace': 'Die geforderten Luftsiege wurden nicht erreicht.', 'goal.fail.keep': 'Das geschützte Ziel nahm zu viel Schaden.'
});
I18N.add('pt', {
  'goal.evac': 'EVACUAÇÃO {p}%', 'goal.strike': 'AERÓDROMOS {a}/{b}', 'goal.ace': 'ABATES AÉREOS {a}/{b}', 'goal.keep': '{n} {h}% (mín. {m}%)',
  'goal.b.evac': 'Mantenha «{a}» em bom estado (acima de 70%) até concluir a evacuação.', 'goal.b.strike': 'Destrua pelo menos {n} aeródromos hostis com ataques aéreos.',
  'goal.b.ace': 'Abata pelo menos {n} aeronaves com seus próprios aviões (as baterias não contam).', 'goal.b.keep': '«{a}» não pode cair abaixo de {m}% de integridade.',
  'goal.fail.evac': 'Evacuação incompleta: o objetivo não foi mantido a salvo.', 'goal.fail.strike': 'Aeródromos insuficientes destruídos.', 'goal.fail.ace': 'Os abates aéreos exigidos não foram alcançados.', 'goal.fail.keep': 'O objetivo protegido sofreu dano demais.'
});
I18N.add('es', { 'h.top': 'MEJOR PILOTO', 'h.lost': 'Perdidos', 'h.aces': 'TUS ASES', 'h.ace': 'AS', 'h.ribbons': 'CONDECORACIONES', 'h.ribNew': 'NUEVA CONDECORACIÓN', 'h.share': 'COMPARTIR INFORME' });
I18N.add('en', { 'h.top': 'TOP PILOT', 'h.lost': 'Lost', 'h.aces': 'YOUR ACES', 'h.ace': 'ACE', 'h.ribbons': 'DECORATIONS', 'h.ribNew': 'NEW DECORATION', 'h.share': 'SHARE REPORT' });
I18N.add('fr', { 'h.top': 'MEILLEUR PILOTE', 'h.lost': 'Perdus', 'h.aces': 'VOS AS', 'h.ace': 'AS', 'h.ribbons': 'DÉCORATIONS', 'h.ribNew': 'NOUVELLE DÉCORATION', 'h.share': 'PARTAGER LE RAPPORT' });
I18N.add('de', { 'h.top': 'BESTER PILOT', 'h.lost': 'Verloren', 'h.aces': 'DEINE ASSE', 'h.ace': 'ASS', 'h.ribbons': 'AUSZEICHNUNGEN', 'h.ribNew': 'NEUE AUSZEICHNUNG', 'h.share': 'BERICHT TEILEN' });
I18N.add('pt', { 'h.top': 'MELHOR PILOTO', 'h.lost': 'Perdidos', 'h.aces': 'SEUS ASES', 'h.ace': 'ÁS', 'h.ribbons': 'CONDECORAÇÕES', 'h.ribNew': 'NOVA CONDECORAÇÃO', 'h.share': 'COMPARTILHAR RELATÓRIO' });
I18N.add('es', {"rep.title": "REPORTAR UN ERROR", "rep.help": "Cuéntanos qué ha pasado. Se abrirá tu app de correo con el informe listo para enviar a nuestro equipo.", "rep.ph": "¿Qué ocurrió? ¿Qué esperabas que pasara?", "rep.what": "Datos técnicos que se adjuntan", "rep.send": "✉ ENVIAR POR CORREO", "rep.copy": "COPIAR INFORME", "rep.copied": "Informe copiado", "rep.data": "Datos técnicos"});
I18N.add('en', {"rep.title": "REPORT A BUG", "rep.help": "Tell us what happened. Your mail app will open with the report ready to send to our team.", "rep.ph": "What happened? What did you expect?", "rep.what": "Technical data attached", "rep.send": "✉ SEND BY EMAIL", "rep.copy": "COPY REPORT", "rep.copied": "Report copied", "rep.data": "Technical data"});
I18N.add('fr', {"rep.title": "SIGNALER UN BUG", "rep.help": "Dites-nous ce qui s’est passé. Votre application de messagerie s’ouvrira avec le rapport prêt à envoyer à notre équipe.", "rep.ph": "Que s’est-il passé ? Qu’attendiez-vous ?", "rep.what": "Données techniques jointes", "rep.send": "✉ ENVOYER PAR E-MAIL", "rep.copy": "COPIER LE RAPPORT", "rep.copied": "Rapport copié", "rep.data": "Données techniques"});
I18N.add('de', {"rep.title": "FEHLER MELDEN", "rep.help": "Erzähl uns, was passiert ist. Deine Mail-App öffnet sich mit dem fertigen Bericht für unser Team.", "rep.ph": "Was ist passiert? Was hast du erwartet?", "rep.what": "Mitgesendete technische Daten", "rep.send": "✉ PER E-MAIL SENDEN", "rep.copy": "BERICHT KOPIEREN", "rep.copied": "Bericht kopiert", "rep.data": "Technische Daten"});
I18N.add('pt', {"rep.title": "REPORTAR UM ERRO", "rep.help": "Conte o que aconteceu. O seu app de e-mail abrirá com o relatório pronto para enviar à nossa equipe.", "rep.ph": "O que aconteceu? O que você esperava?", "rep.what": "Dados técnicos anexados", "rep.send": "✉ ENVIAR POR E-MAIL", "rep.copy": "COPIAR RELATÓRIO", "rep.copied": "Relatório copiado", "rep.data": "Dados técnicos"});
I18N.add('es', {"cr.title": "CRÉDITOS", "cr.dev": "DISEÑO Y DESARROLLO", "cr.devT": "Roberto", "cr.sym": "SIMBOLOGÍA TÁCTICA", "cr.data": "MAPAS", "cr.pd": "dominio público", "cr.dataT": "Geografía simplificada para el juego.", "cr.hist": "CAMPAÑAS HISTÓRICAS", "cr.histT": "Textos originales con fines divulgativos. Las misiones son representativas, no un parte de guerra.", "cr.tech": "TECNOLOGÍA", "cr.techT": "Sin motores ni frameworks: web pura empaquetada con Capacitor.", "cr.contact": "CONTACTO Y ERRORES", "cr.thanks": "Gracias por jugar. Si algo falla, usa «Reportar un error» en Ajustes."});
I18N.add('en', {"cr.title": "CREDITS", "cr.dev": "DESIGN & DEVELOPMENT", "cr.devT": "Roberto", "cr.sym": "TACTICAL SYMBOLOGY", "cr.data": "MAPS", "cr.pd": "public domain", "cr.dataT": "Geography simplified for gameplay.", "cr.hist": "HISTORICAL CAMPAIGNS", "cr.histT": "Original texts for educational purposes. Missions are representative, not an operational record.", "cr.tech": "TECHNOLOGY", "cr.techT": "No engines or frameworks: plain web packaged with Capacitor.", "cr.contact": "CONTACT & BUGS", "cr.thanks": "Thanks for playing. If something breaks, use “Report a bug” in Settings."});
I18N.add('fr', {"cr.title": "CRÉDITS", "cr.dev": "CONCEPTION ET DÉVELOPPEMENT", "cr.devT": "Roberto", "cr.sym": "SYMBOLOGIE TACTIQUE", "cr.data": "CARTES", "cr.pd": "domaine public", "cr.dataT": "Géographie simplifiée pour le jeu.", "cr.hist": "CAMPAGNES HISTORIQUES", "cr.histT": "Textes originaux à visée pédagogique. Les missions sont représentatives, pas un compte rendu militaire.", "cr.tech": "TECHNOLOGIE", "cr.techT": "Ni moteur ni framework : web pur empaqueté avec Capacitor.", "cr.contact": "CONTACT ET BUGS", "cr.thanks": "Merci d’avoir joué. En cas de problème, utilisez « Signaler un bug » dans les Réglages."});
I18N.add('de', {"cr.title": "CREDITS", "cr.dev": "DESIGN UND ENTWICKLUNG", "cr.devT": "Roberto", "cr.sym": "TAKTISCHE SYMBOLIK", "cr.data": "KARTEN", "cr.pd": "gemeinfrei", "cr.dataT": "Für das Spiel vereinfachte Geografie.", "cr.hist": "HISTORISCHE KAMPAGNEN", "cr.histT": "Eigene Texte zu Bildungszwecken. Die Missionen sind repräsentativ, kein Einsatzprotokoll.", "cr.tech": "TECHNIK", "cr.techT": "Keine Engine, kein Framework: reines Web, mit Capacitor verpackt.", "cr.contact": "KONTAKT UND FEHLER", "cr.thanks": "Danke fürs Spielen. Wenn etwas nicht klappt, nutze „Fehler melden“ in den Einstellungen."});
I18N.add('pt', {"cr.title": "CRÉDITOS", "cr.dev": "DESIGN E DESENVOLVIMENTO", "cr.devT": "Roberto", "cr.sym": "SIMBOLOGIA TÁTICA", "cr.data": "MAPAS", "cr.pd": "domínio público", "cr.dataT": "Geografia simplificada para o jogo.", "cr.hist": "CAMPANHAS HISTÓRICAS", "cr.histT": "Textos originais com fins educativos. As missões são representativas, não um registro operacional.", "cr.tech": "TECNOLOGIA", "cr.techT": "Sem engines nem frameworks: web pura empacotada com Capacitor.", "cr.contact": "CONTATO E ERROS", "cr.thanks": "Obrigado por jogar. Se algo falhar, use «Reportar um erro» em Definições."});
