/* Campaña histórica: GUERRA DE COREA (1950-1953). Parte 1: orden de batalla de época, textos de interfaz y capítulos.
 * Reconstrucción jugable: la situación es real, las oleadas son representativas (no un parte de guerra). Posiciones aproximadas. */
(function () {
  const T = (es, en) => ({ es, en });
  const H = window.C2_HIST = window.C2_HIST || {};
  const K = H.korea = { id: 'korea', years: '1950–1953', map: 'korea', missions: [], units: {}, gloss: [] };
  K.free = 4;   // las 4 primeras misiones (capítulo I) son gratis; el resto requiere la compra de la campaña
  // Mejoras propias de la campaña (puntos de campaña ganados con estrellas). id = clave del motor.
  K.upg = [
    { id: 'budget', cost: 20, max: 4, name: T('Puente aéreo logístico', 'Logistic airlift'), desc: T('+10 % de créditos iniciales por rango. Los C-54 y C-119 mantienen el flujo de material.', '+10% starting credits per rank. C-54s and C-119s keep supplies flowing.') },
    { id: 'pk', cost: 30, max: 4, name: T('Espoleta de proximidad VT', 'VT proximity fuze'), desc: T('+5 % de Pk en baterías y aviones por rango. La espoleta VT multiplicó la eficacia antiaérea.', '+5% Pk for batteries and aircraft per rank. The VT fuze multiplied AA effectiveness.') },
    { id: 'reload', cost: 25, max: 4, name: T('Instrucción de dotaciones', 'Gun-crew training'), desc: T('−6 % de recarga por rango. Dotaciones más curtidas disparan más rápido.', '−6% reload time per rank. Seasoned crews fire faster.') },
    { id: 'radar', cost: 25, max: 4, name: T('Radares de alerta temprana', 'Early-warning radars'), desc: T('+8 % de alcance de detección por rango (radares AN/CPS y de control de tiro).', '+8% detection range per rank (AN/CPS and fire-control radars).') },
    { id: 'fleet', cost: 40, max: 3, name: T('Escuadrón de refuerzo', 'Reinforcement squadron'), desc: T('+1 caza inicial por rango, enviado desde Japón o EE. UU.', '+1 starting fighter per rank, sent from Japan or the U.S.') },
    { id: 'armor', cost: 35, max: 4, name: T('Reparación rápida de pistas', 'Rapid runway repair'), desc: T('−7 % de daño por impacto por rango. Los ingenieros tapan los cráteres en horas.', '−7% impact damage per rank. Engineers fill craters within hours.') }
  ];
  K.name = T('Guerra de Corea', 'Korean War');
  K.sub = T('Mando de defensa aérea de la ONU · 24 misiones', 'UN air-defense command · 24 missions');
  K.intro = T('Corea, 1950. Eres el controlador de defensa aérea del Mando de la ONU. En tres años pasarás de un cielo dominado por aviones de hélice a la primera guerra de reactores. Cada misión dura unos 5 minutos y recrea una situación real; al terminar aprenderás qué ocurrió de verdad. Las oleadas son representativas, no un parte de guerra.',
    'Korea, 1950. You are the air-defense controller of the UN Command. In three years the sky goes from propeller aircraft to the first jet war. Each mission lasts about 5 minutes and recreates a real situation; afterwards you learn what actually happened. Waves are representative, not a war log.');
  K.epi = T('27 de julio de 1953: el armisticio de Panmunjom detiene los combates a las 22:00. No hubo tratado de paz: la península sigue dividida por una zona desmilitarizada de unos 4 km. Murieron entre uno y dos millones de militares y varios millones de civiles (las estimaciones varían mucho). En el aire nació la guerra de reactores: del Yak-9 y el F-51 al MiG-15 y el F-86 en solo tres años. El «diez a uno» que proclamó la USAF hoy se discute: los análisis posteriores lo sitúan mucho más bajo.',
    'On 27 July 1953 the Panmunjom armistice stopped the fighting at 22:00. There was no peace treaty: the peninsula is still split by a demilitarized zone about 4 km wide. Between one and two million soldiers and several million civilians died (estimates vary widely). The air war saw the birth of jet combat: from the Yak-9 and F-51 to the MiG-15 and F-86 in just three years. The USAF "ten to one" claim is disputed today: later analyses put it much lower.');
  K.chapters = [
    { n: T('I · Invasión y Perímetro de Pusan', 'I · Invasion and the Pusan Perimeter'), d: T('jun – sep 1950', 'Jun – Sep 1950'), t: T('Corea del Norte cruza el paralelo 38 con un ejército mucho mejor equipado, blindados T-34 y una fuerza aérea de Yak-9 e Il-10. La ONU gana el aire en semanas, pero en tierra solo conserva una bolsa en el sureste.', 'North Korea crosses the 38th parallel with tanks and a small air force of Yak-9s and Il-10s. The UN wins the air in weeks, but on the ground holds only a pocket in the southeast.') },
    { n: T('II · Incheon y el avance al norte', 'II · Inchon and the push north'), d: T('sep – nov 1950', 'Sep – Nov 1950'), t: T('El desembarco de Incheon rompe el frente. Las tropas de la ONU cruzan el paralelo 38 y llegan casi al río Yalu, la frontera con China.', 'The Inchon landing breaks the front. UN troops cross the 38th parallel and reach almost to the Yalu River, the border with China.') },
    { n: T('III · China interviene', 'III · China intervenes'), d: T('nov 1950 – dic 1950', 'Nov – Dec 1950'), t: T('Cientos de miles de «voluntarios» chinos atacan. Con ellos aparece el MiG-15, y la ONU responde con el F-86 Sabre. Empieza la guerra de reactores.', 'Hundreds of thousands of Chinese "volunteers" attack. With them comes the MiG-15, and the UN answers with the F-86 Sabre. The jet war begins.') },
    { n: T('IV · Guerra de movimiento', 'IV · War of movement'), d: T('ene – abr 1951', 'Jan – Apr 1951'), t: T('Seúl cambia de manos otra vez. Los bombarderos B-29 sufren a los MiG y el frente se estabiliza cerca del paralelo 38.', 'Seoul changes hands again. B-29 bombers suffer at the hands of MiGs and the front stabilizes near the 38th parallel.') },
    { n: T('V · El Callejón de los MiG', 'V · MiG Alley'), d: T('may 1951 – jun 1952', 'May 1951 – Jun 1952'), t: T('El noroeste de Corea del Norte se convierte en el primer campo de batalla de reactores contra reactores. Pilotos soviéticos vuelan en secreto con marcas chinas.', 'Northwest North Korea becomes the first jet-versus-jet battlefield. Soviet pilots fly in secret with Chinese markings.') },
    { n: T('VI · Estancamiento y armisticio', 'VI · Stalemate and armistice'), d: T('ago 1952 – jul 1953', 'Aug 1952 – Jul 1953'), t: T('Mientras las negociaciones se alargan, la guerra aérea se intensifica y los biplanos nocturnos acosan las bases de la ONU. El 27 de julio de 1953 se firma el armisticio.', 'While talks drag on, the air war intensifies and night biplanes harass UN bases. The armistice is signed on 27 July 1953.') }
  ];
  /* orden de batalla de época (valores previos a la escala del mundo; unlock = misión a partir de la cual está disponible) */
  K.era = {
    sam: {
      gun: { short: 'AAA', cost: 40, range: 90, reload: .45, ammo: 100, mspeed: 650, mcost: 1, sensor: 65, restock: 18, unlock: 1, pk: { drone: .30, cruise: .14, ballistic: .03, arm: 0 } },
      shorad: { short: 'AA-40', cost: 100, range: 150, reload: 1.6, ammo: 16, mspeed: 340, mcost: 10, sensor: 100, restock: 50, unlock: 3, pk: { drone: .60, cruise: .50, ballistic: .10, arm: 0 } },
      mrad: { short: 'AA-90', cost: 220, range: 250, reload: 3, ammo: 10, mspeed: 420, mcost: 35, sensor: 150, restock: 110, unlock: 6, pk: { drone: .55, cruise: .72, ballistic: .22, arm: 0 } },
      bmd: { unlock: 99 }, laser: { unlock: 99 },
      ship: { short: 'DD', cost: 300, range: 300, reload: 2, ammo: 14, mspeed: 400, mcost: 25, radar: 220, restock: 90, unlock: 5, pk: { drone: .55, cruise: .60, ballistic: .15, arm: 0 } },
      radar: { cost: 70, radar: 260, unlock: 1 }
    },
    air: {
      f16: { short: 'F-80C', name: 'F-80C Shooting Star', cost: 120, speed: 190, fuel: 80, ammo: 6, reload: 1.2, mspeed: 480, mcost: 20, engage: 140, radar: 110, strike: .38, orbit: 34, turn: 14, unlock: 1, pk: { drone: .62, cruise: .50, ballistic: .12, arm: 0 } },
      f15e: { short: 'F-86A', name: 'F-86A Sabre', cost: 220, speed: 220, fuel: 110, ammo: 8, reload: 1.2, mspeed: 520, mcost: 25, engage: 150, radar: 130, strike: .5, orbit: 36, turn: 16, unlock: 12, pk: { drone: .80, cruise: .70, ballistic: .50, arm: 0 } },
      ah64: { short: 'F-51D', name: 'F-51D Mustang', cost: 90, speed: 120, fuel: 100, ammo: 8, reload: .6, mspeed: 420, mcost: 6, engage: 100, radar: 90, strike: .5, orbit: 26, turn: 12, unlock: 1, pk: { drone: .80, cruise: .45, ballistic: 0, arm: 0 } },
      e2: { short: 'AD-4W', name: 'AD-4W Skyraider AEW', cost: 150, speed: 100, fuel: 200, radar: 320, unlock: 8 },
      mq9: { short: 'T-6', name: 'T-6 Mosquito (FAC)', cost: 45, speed: 70, fuel: 150, radar: 140, strike: .12, unlock: 2 },
      tanker: { unlock: 99 }
    },
    thr: {
      drone: { spd: 46, dmg: 8, val: 20, bounty: 5, tag: 'ATK' },
      decoy: { spd: 28, dmg: 2, val: 5, bounty: 2, tag: 'NGT' },
      cruise: { spd: 62, dmg: 16, val: 90, bounty: 14, tag: 'BMB' },
      ballistic: { spd: 140, dmg: 14, val: 220, bounty: 22, tag: 'MIG' }
    },
    /* textos de interfaz que sustituyen a los de la campaña moderna mientras dura una misión histórica */
    str: {
      'hud.level': T('MISIÓN', 'MISSION'),
      'log.level': T('MISIÓN {n} — {name} · {th}', 'MISSION {n} — {name} · {th}'),
      'sam.gun.name': T('AAA 12,7 mm (M16 cuádruple)', 'AAA .50 cal (M16 quad)'), 'sam.gun.desc': T('Barato y de corto alcance. Mucha munición: bueno contra cazas de hélice.', 'Cheap and short-ranged. Lots of ammo: good against propeller fighters.'),
      'sam.shorad.name': T('Cañón AA 40 mm (Bofors/M19)', 'AA gun 40 mm (Bofors/M19)'), 'sam.shorad.desc': T('Equilibrado: buen Pk contra aviones de ataque y bombarderos.', 'Balanced: good Pk against attackers and bombers.'),
      'sam.mrad.name': T('Batería AA 90 mm con radar', 'AA battery 90 mm with radar'), 'sam.mrad.desc': T('Gran cobertura y el mejor contra bombarderos; poco útil contra reactores rápidos.', 'Wide coverage and the best against bombers; weak against fast jets.'),
      'sam.ship.name': T('Destructor de escolta (5"/38)', 'Escort destroyer (5"/38)'), 'sam.ship.desc': T('Radar y cañones de doble propósito sobre el mar. Se despliega cerca de un puerto.', 'Radar and dual-purpose guns at sea. Deploys near a friendly port.'),
      'sam.radar.name': T('Radar de alerta temprana', 'Early-warning radar'), 'sam.radar.desc': T('Tipo SCR-270 / AN/CPS-5. Amplía la detección para que tus baterías usen todo su alcance.', 'SCR-270 / AN/CPS-5 type. Extends detection so your guns use their full range.'),
      'air.f16.role': T('Caza a reacción', 'Jet fighter'), 'air.f16.mission': T('CAP / intercepción / ataque ligero', 'CAP / intercept / light strike'),
      'air.f15e.role': T('Caza de ala en flecha', 'Swept-wing fighter'), 'air.f15e.mission': T('Único que iguala al MiG-15', 'The only match for the MiG-15'),
      'air.ah64.role': T('Caza de hélice', 'Propeller fighter'), 'air.ah64.mission': T('Caza-bombardero: bueno contra aviones de hélice', 'Fighter-bomber: strong against propeller aircraft'),
      'air.e2.role': T('Alerta temprana embarcada', 'Carrier early warning'), 'air.e2.mission': T('Radar APS-20 en estación', 'APS-20 radar on station'),
      'air.mq9.role': T('Observador avanzado', 'Forward air controller'), 'air.mq9.mission': T('Vigilancia visual / marcado de blancos', 'Visual watch / target marking'),
      'thr.drone': T('Aviación de ataque (Yak-9/Il-10)', 'Attack aircraft (Yak-9/Il-10)'), 'thr.decoy': T('Intruso nocturno (Po-2/Yak-18)', 'Night intruder (Po-2/Yak-18)'),
      'thr.cruise': T('Bombarderos (Tu-2)', 'Bombers (Tu-2)'), 'thr.ballistic': T('Caza MiG-15', 'MiG-15 fighters'), 'thr.arm': T('Ataque a radares', 'Radar attack'),
      'thr.drone.d': T('Lentos pero numerosos; se cuelan si no hay cobertura.', 'Slow but numerous; they slip through without cover.'),
      'thr.decoy.d': T('Biplanos lentos que casi no hacen daño pero te hacen gastar munición: «Charlie».', 'Slow biplanes that barely damage but drain your ammo: "Charlie".'),
      'thr.cruise.d': T('Bombarderos bimotores: caen bien ante AA de 40 y 90 mm.', 'Twin-engine bombers: vulnerable to 40 and 90 mm guns.'),
      'thr.ballistic.d': T('Muy rápido: la AAA apenas lo toca; necesita cazas F-86.', 'Very fast: AAA barely touches it; needs F-86 fighters.'),
      'kind.drone': T('ATK', 'ATK'), 'kind.cruise': T('BMB', 'BMB'), 'kind.ballistic': T('MIG', 'MIG'), 'kind.arm': T('RAD', 'RAD'), 'kind.decoy': T('NGT', 'NGT'),
      'sum.drone': T('{n} aviones de ataque', '{n} attack aircraft'), 'sum.cruise': T('{n} bombarderos', '{n} bombers'), 'sum.ballistic': T('{n} MiG-15', '{n} MiG-15s'), 'sum.arm': T('{n} ataques a radar', '{n} radar attacks'),
      'site.name': T('AERÓDROMO-{n}', 'AIRFIELD-{n}'), 'p.siteSub': T('Aeródromo hostil · AAA {aa}%', 'Hostile airfield · AAA {aa}%'),
      'p.siteprep': T('Los ataques se ordenan durante la operación. Destruir un aeródromo cancela sus salidas.', 'Strikes are ordered during the operation. Destroying an airfield cancels its sorties.'),
      'br.sites': T('Aeródromos hostiles', 'Hostile airfields'),
      'hint.sam': T('<b>{name}</b> — {desc}<br><span style="color:{col}">Pk por disparo: ataque {u}% · {kc} {c}% · {kb} {b}%. {place}{rush}</span>', '<b>{name}</b> — {desc}<br><span style="color:{col}">Pk per shot: attack {u}% · {kc} {c}% · {kb} {b}%. {place}{rush}</span>'),
      'hint.air2': T(' Toca un <b>contacto</b> para interceptarlo (Pk {u}% ataque · {c}% {kc}).', ' Tap a <b>contact</b> to intercept it (Pk {u}% attack · {c}% {kc}).'),
      'hint.air3': T(' Toca un <b>aeródromo hostil</b> para atacarlo ({p}% éxito).', ' Tap a <b>hostile airfield</b> to strike it ({p}% success).'),
      'log.wave': T('OLEADA {i}/{m} — {n} aviones', 'WAVE {i}/{m} — {n} aircraft'), 'log.waveSupp': T('Oleada {i} suprimida: sin aeródromos operativos', 'Wave {i} suppressed: no operational airfields'),
      'log.balLaunch': T('MiG-15 detectados desde {s}', 'MiG-15s detected from {s}'), 'surprise.name': T('Salida no detectada', 'Undetected sortie'),
      'banner.surprise': T('INTRUSIÓN<small>Aviones a baja cota sobre {n}</small>', 'INTRUSION<small>Low-level aircraft toward {n}</small>'), 'log.surprise': T('Intrusión sobre {n}', 'Intrusion on {n}'),
      'banner.jam': T('INTERFERENCIAS<small>{n}: ecos falsos; apágalo 2 s para resintonizar</small>', 'RADAR CLUTTER<small>{n}: false echoes; switch off for 2 s to retune</small>'), 'log.jam': T('{n} sufre interferencias (alcance −65 %)', '{n} suffers clutter (range −65%)'),
      'vo.wave': T('Oleada {i}: {n} aviones hostiles', 'Wave {i}: {n} hostile aircraft'), 'vo.bal': T('Alerta: reactores MiG', 'Warning: MiG jets'), 'vo.surprise': T('Intrusión a baja cota', 'Low-level intrusion'), 'vo.site': T('Aeródromo enemigo destruido', 'Enemy airfield destroyed'),
      'hist.front': T('FRENTE (aprox.)', 'FRONT (approx.)'), 'th.korea.name': T('COREA', 'KOREA'),
      'hist.sanct': T('⛔ SANTUARIO: territorio chino/soviético. Las órdenes de Washington prohíben atacarlo, aunque de allí despeguen los MiG.', '⛔ SANCTUARY: Chinese/Soviet territory. Washington\'s orders forbid attacking it even though the MiGs take off from there.'),
      'tip.strike': T('Destruir aeródromos con F-80/F-51 cancela oleadas enteras.', 'Destroying airfields with F-80/F-51 cancels whole waves.')
    }
  };
})();
