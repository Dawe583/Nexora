/* ============================================================
   NEXORA TECHNOLOGIES — scroll-driven 3D experience (v2)
   three.js terén + sky dome (hvězdy, aurora) + UnrealBloom
   GSAP ScrollTrigger + Lenis + syntetizované WebAudio ambientní audio
   ============================================================ */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------
     SMOOTH SCROLL (Lenis)
  ------------------------------------------------------------ */
  const lenis = new Lenis({
    duration: 1.35,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  lenis.stop();
  document.body.classList.add("is-locked");

  /* ------------------------------------------------------------
     WEBGL WORLD
  ------------------------------------------------------------ */
  const canvas = document.getElementById("scene");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x020409, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    62, window.innerWidth / window.innerHeight, 0.1, 700
  );
  camera.position.set(0, 5.2, 0);
  camera.lookAt(0, 2.2, -40);

  /* --- barevný scénář kapitol:
     hero -> 01 manifest -> 02 výhoda -> 03 platformy -> 04 čísla -> 05 tým -> footer --- */
  const CHAPTERS = [
    { // hero: mlžný modrý soumrak
      deep: 0x03060d, mid: 0x0c1930, ridge: 0x2c4f6e, horizon: 0x57627a,
      skyTop: 0x5a6478, skyMid: 0x2b3448, skyBot: 0x05070d,
      fog: 0.052, camY: 4.2, amp: 1.9, beacon: 1.1, aurora: 0.28, hue: 0.1,
    },
    { // 01 manifest: pročištění, chladnější
      deep: 0x030910, mid: 0x0a1c2e, ridge: 0x2b566e, horizon: 0x43506a,
      skyTop: 0x4a586e, skyMid: 0x1e2a3c, skyBot: 0x04060b,
      fog: 0.044, camY: 3.8, amp: 1.35, beacon: 1.3, aurora: 0.4, hue: 0.05,
    },
    { // 02 výhoda: tyrkysová energie
      deep: 0x02090d, mid: 0x0a2430, ridge: 0x2e6d78, horizon: 0x3a5a64,
      skyTop: 0x3b5560, skyMid: 0x16303a, skyBot: 0x030709,
      fog: 0.05, camY: 2.7, amp: 1.85, beacon: 2.0, aurora: 0.85, hue: 0.0,
    },
    { // 03 platformy: hluboký teal, nízký let
      deep: 0x01070a, mid: 0x082630, ridge: 0x2f7a7f, horizon: 0x2f545e,
      skyTop: 0x33505c, skyMid: 0x123039, skyBot: 0x020608,
      fog: 0.058, camY: 2.2, amp: 2.1, beacon: 2.6, aurora: 1.0, hue: 0.15,
    },
    { // 04 čísla: indigová výška
      deep: 0x030510, mid: 0x101a33, ridge: 0x3d5e8a, horizon: 0x3d4b66,
      skyTop: 0x3d4a6b, skyMid: 0x1b2440, skyBot: 0x030510,
      fog: 0.05, camY: 4.8, amp: 1.2, beacon: 1.2, aurora: 0.55, hue: 0.6,
    },
    { // 05 tým: fialový soumrak
      deep: 0x060510, mid: 0x151228, ridge: 0x4a3f6e, horizon: 0x4c4767,
      skyTop: 0x514c6b, skyMid: 0x241f3c, skyBot: 0x050409,
      fog: 0.046, camY: 3.4, amp: 1.5, beacon: 1.6, aurora: 0.65, hue: 0.85,
    },
    { // footer: klid, téměř čerň
      deep: 0x020409, mid: 0x070d18, ridge: 0x1b2c40, horizon: 0x262e3f,
      skyTop: 0x2c3344, skyMid: 0x131722, skyBot: 0x020307,
      fog: 0.072, camY: 6.6, amp: 0.9, beacon: 0.5, aurora: 0.12, hue: 0.5,
    },
  ];

  const C0 = CHAPTERS[0];

  /* ============ SKY DOME: gradient + hvězdy + aurora ============ */
  const skyUniforms = {
    uTime: { value: 0 },
    uTop: { value: new THREE.Color(C0.skyTop) },
    uMidS: { value: new THREE.Color(C0.skyMid) },
    uBot: { value: new THREE.Color(C0.skyBot) },
    uAurora: { value: C0.aurora },
    uHue: { value: C0.hue },
  };

  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 mv = viewMatrix * vec4(position + cameraPosition, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec3 uTop;
      uniform vec3 uMidS;
      uniform vec3 uBot;
      uniform float uAurora;
      uniform float uHue;
      varying vec3 vDir;

      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      }

      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;

        /* vertikální gradient */
        vec3 col = mix(uBot, uMidS, smoothstep(-0.15, 0.1, h));
        col = mix(col, uTop, smoothstep(0.1, 0.72, h));

        /* hvězdy — 3D buňkový hash, bez švů */
        vec3 sp = dir * 110.0;
        vec3 ip = floor(sp);
        vec3 fp = fract(sp);
        float rnd = hash3(ip);
        float star = smoothstep(0.982, 1.0, rnd);
        float d = length(fp - 0.5);
        star *= pow(max(0.0, 1.0 - d * 2.0), 3.0);
        float tw = 0.6 + 0.4 * sin(uTime * 2.2 + rnd * 93.0);
        star *= tw * smoothstep(0.03, 0.28, h);
        col += vec3(0.85, 0.92, 1.0) * star * 2.4;

        /* aurora — dva zvlněné pásy nad horizontem */
        float ax = dir.x * 2.6;
        float y1 = (h - 0.16) * 5.0;
        float w1 = sin(ax * 1.4 + uTime * 0.06 + sin(ax * 3.3 + uTime * 0.11) * 0.7);
        float band1 = exp(-pow((y1 - 0.9 - w1 * 0.45) * 1.35, 2.0));
        float w2 = sin(ax * 2.2 - uTime * 0.045 + 1.7);
        float band2 = 0.6 * exp(-pow((y1 - 1.8 - w2 * 0.55) * 1.6, 2.0));

        vec3 auroraA = vec3(0.10, 0.75, 0.66);   /* teal */
        vec3 auroraB = vec3(0.45, 0.28, 0.85);   /* violet */
        vec3 aCol = mix(auroraA, auroraB, uHue);
        float aMask = smoothstep(0.04, 0.3, h);
        col += aCol * (band1 + band2) * uAurora * aMask * 0.5;

        /* měkká měsíční záře vpředu nahoře */
        float moon = pow(max(0.0, dot(dir, normalize(vec3(-0.25, 0.55, -0.79)))), 18.0);
        col += vec3(0.5, 0.6, 0.72) * moon * 0.22;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(480, 48, 32), skyMat);
  skyDome.frustumCulled = false;
  scene.add(skyDome);

  /* ============ TERÉN ============ */
  const uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uAmp: { value: C0.amp },
    uFog: { value: C0.fog },
    uDeep: { value: new THREE.Color(C0.deep) },
    uMid: { value: new THREE.Color(C0.mid) },
    uRidge: { value: new THREE.Color(C0.ridge) },
    uHorizon: { value: new THREE.Color(C0.horizon) },
    uBeaconPos: { value: new THREE.Vector3(2.5, 0, -34) },
    uBeaconIntensity: { value: C0.beacon },
    uCamPos: { value: camera.position },
  };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uTravel;
    uniform float uAmp;

    varying vec3 vWorld;
    varying float vHeight;

    vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
             + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                              dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        v += a * snoise(p);
        p = rot * p * 2.05;
        a *= 0.5;
      }
      return v;
    }

    float surface(vec2 xz) {
      vec2 p = xz * 0.05;
      p.y -= uTravel * 0.05;
      float h = fbm(p);
      h += 0.18 * snoise(xz * 0.32 + vec2(0.0, uTime * 0.1));
      return h;
    }

    void main() {
      vec3 pos = position;
      float h = surface(pos.xz) * uAmp;
      pos.y += h;
      vHeight = h;
      vec4 world = modelMatrix * vec4(pos, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;

    uniform vec3 uDeep;
    uniform vec3 uMid;
    uniform vec3 uRidge;
    uniform vec3 uHorizon;
    uniform float uFog;
    uniform vec3 uBeaconPos;
    uniform float uBeaconIntensity;
    uniform vec3 uCamPos;
    uniform float uTime;

    varying vec3 vWorld;
    varying float vHeight;

    void main() {
      vec3 nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
      if (nrm.y < 0.0) nrm = -nrm;

      float dist = length(vWorld - uCamPos);

      /* jen nejbližší fragmenty tlumíme, ať terén u kamery nefacetí */
      float nearSoft = smoothstep(2.0, 9.0, dist);

      float hMix = smoothstep(-1.6, 1.9, vHeight);
      vec3 col = mix(uDeep, uMid, hMix);

      vec3 lightDir = normalize(vec3(-0.25, 0.8, -0.55));
      float diff = clamp(dot(nrm, lightDir), 0.0, 1.0);
      col *= 0.85 + 0.3 * diff;
      col = mix(col, uRidge, pow(diff, 2.0) * smoothstep(0.0, 1.3, vHeight) * nearSoft);

      float spark = pow(diff, 14.0) * smoothstep(0.6, 1.7, vHeight) * nearSoft;
      col += vec3(0.55, 0.75, 0.85) * spark * 0.5;

      float bd = length(vWorld.xz - uBeaconPos.xz);
      float glow = exp(-bd * bd * 0.02) * uBeaconIntensity;
      float pulse = 0.75 + 0.25 * sin(uTime * 1.7);
      col += vec3(0.32, 0.78, 0.85) * glow * pulse * 0.5;

      float fogF = 1.0 - exp(-pow(dist * uFog * 0.72, 1.25));
      fogF = clamp(fogF, 0.0, 1.0);
      col = mix(col, uHorizon, fogF);

      /* daleký okraj se rozpustí do nebe */
      float edgeFade = smoothstep(300.0, 170.0, dist);
      col = mix(uHorizon, col, edgeFade);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const geo = new THREE.PlaneGeometry(420, 320, 320, 240);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    extensions: { derivatives: true },
  });
  const ocean = new THREE.Mesh(geo, mat);
  ocean.position.z = -110;
  scene.add(ocean);

  /* ============ ČÁSTICE ============ */
  const P_COUNT = 260;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(P_COUNT * 3);
  for (let i = 0; i < P_COUNT; i++) {
    pPos[i * 3 + 0] = (Math.random() - 0.5) * 120;
    pPos[i * 3 + 1] = Math.random() * 26;
    pPos[i * 3 + 2] = -Math.random() * 160;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x9fc4d4,
    size: 0.22,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ============ TEXTURY ZE 2D CANVASU ============ */
  function makeGlowTexture(inner, outer) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  /* beacon — osamělé zářící světlo */
  const beacon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("rgba(190,240,250,1)", "rgba(0,0,0,0)"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  beacon.scale.set(2.4, 2.4, 1);
  beacon.position.set(2.5, 2.4, -34);
  scene.add(beacon);

  /* vrstvy driftující mlhy */
  const mistTex = makeGlowTexture("rgba(170,195,215,0.16)", "rgba(0,0,0,0)");
  const mists = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: mistTex,
        transparent: true,
        opacity: 0.05 + Math.random() * 0.07,
        depthWrite: false,
      })
    );
    const s = 28 + Math.random() * 46;
    m.scale.set(s, s * 0.42, 1);
    m.position.set(
      (Math.random() - 0.5) * 130,
      1.2 + Math.random() * 4.5,
      -22 - Math.random() * 110
    );
    m.userData.speed = 0.12 + Math.random() * 0.25;
    scene.add(m);
    mists.push(m);
  }

  /* ============ POSTPROCESSING: UnrealBloom ============ */
  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85,   // strength
    0.7,    // radius
    0.52    // threshold
  );
  composer.addPass(bloomPass);

  /* ------------------------------------------------------------
     STAV SVĚTA ŘÍZENÝ SCROLLEM
  ------------------------------------------------------------ */
  const state = { progress: 0, eased: 0, mouseX: 0, mouseY: 0 };

  const tmpA = new THREE.Color();
  const tmpB = new THREE.Color();

  function lerp(a, b, t) { return a + (b - a) * t; }

  function blendColor(target, hexA, hexB, t) {
    tmpA.setHex(hexA);
    tmpB.setHex(hexB);
    target.copy(tmpA).lerp(tmpB, t);
  }

  function applyChapterBlend(p) {
    const seg = Math.min(CHAPTERS.length - 2, Math.floor(p * (CHAPTERS.length - 1)));
    const local = p * (CHAPTERS.length - 1) - seg;
    const t = local * local * (3 - 2 * local);
    const A = CHAPTERS[seg];
    const B = CHAPTERS[seg + 1];

    blendColor(uniforms.uDeep.value, A.deep, B.deep, t);
    blendColor(uniforms.uMid.value, A.mid, B.mid, t);
    blendColor(uniforms.uRidge.value, A.ridge, B.ridge, t);
    blendColor(uniforms.uHorizon.value, A.horizon, B.horizon, t);
    blendColor(skyUniforms.uTop.value, A.skyTop, B.skyTop, t);
    blendColor(skyUniforms.uMidS.value, A.skyMid, B.skyMid, t);
    blendColor(skyUniforms.uBot.value, A.skyBot, B.skyBot, t);

    uniforms.uFog.value = lerp(A.fog, B.fog, t);
    uniforms.uAmp.value = lerp(A.amp, B.amp, t);
    uniforms.uBeaconIntensity.value = lerp(A.beacon, B.beacon, t);
    skyUniforms.uAurora.value = lerp(A.aurora, B.aurora, t);
    skyUniforms.uHue.value = lerp(A.hue, B.hue, t);

    camera.position.y = lerp(A.camY, B.camY, t) + state.mouseY * 0.5;
  }

  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => { state.progress = self.progress; },
  });

  window.addEventListener("pointermove", (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * -2;
  });

  /* ------------------------------------------------------------
     RENDER SMYČKA
  ------------------------------------------------------------ */
  const clock = new THREE.Clock();

  function tick() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    skyUniforms.uTime.value = t;

    state.eased += (state.progress - state.eased) * 0.06;
    applyChapterBlend(state.eased);

    uniforms.uTravel.value = t * 1.1 + state.eased * 150;

    camera.position.x = Math.sin(t * 0.11) * 0.7 + state.mouseX * 0.9;
    camera.lookAt(state.mouseX * 3.2, 2.0 + state.mouseY * 1.4, -46);

    const bx = 2.5 + Math.sin(t * 0.16) * 4.5;
    const bz = -34 + Math.cos(t * 0.11) * 6;
    const by = 2.3 + Math.sin(t * 0.5) * 0.35;
    beacon.position.set(bx, by, bz);
    uniforms.uBeaconPos.value.set(bx, 0, bz);
    const s = 2.0 + Math.sin(t * 1.7) * 0.35 + uniforms.uBeaconIntensity.value * 0.6;
    beacon.scale.set(s, s, 1);

    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < P_COUNT; i++) {
      arr[i * 3 + 1] += 0.008;
      if (arr[i * 3 + 1] > 27) arr[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    for (const m of mists) {
      m.position.x += m.userData.speed * 0.02;
      if (m.position.x > 80) m.position.x = -80;
    }

    composer.render();
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ------------------------------------------------------------
     AUDIO — syntetizovaný ambientní dron (bez externích assetů)
  ------------------------------------------------------------ */
  const audio = { ctx: null, master: null, on: false };

  function initAudio() {
    if (audio.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    [54, 54.6, 108.4].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.16;
      osc.connect(g).connect(master);
      osc.start();
    });

    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const ng = ctx.createGain();
    ng.gain.value = 0.14;
    noise.connect(filter).connect(ng).connect(master);
    noise.start();

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    audio.ctx = ctx;
    audio.master = master;
  }

  const soundToggle = document.getElementById("soundToggle");
  const soundState = document.getElementById("soundState");

  function setAudio(on) {
    audio.on = on;
    soundToggle.classList.toggle("is-on", on);
    soundToggle.setAttribute("aria-pressed", String(on));
    soundState.textContent = on ? "ZAP" : "VYP";
    if (on) {
      initAudio();
      if (!audio.ctx) return;
      audio.ctx.resume();
      audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.master.gain.linearRampToValueAtTime(0.5, audio.ctx.currentTime + 2.5);
    } else if (audio.ctx) {
      audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.master.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.8);
    }
  }

  soundToggle.addEventListener("click", () => setAudio(!audio.on));

  /* ------------------------------------------------------------
     PRELOADER -> VSTUP
  ------------------------------------------------------------ */
  const preloader = document.getElementById("preloader");
  const loadPct = document.getElementById("loadPct");
  const loadBar = document.getElementById("loadBar");
  const loadingBlock = document.getElementById("loadingBlock");
  const enterBlock = document.getElementById("enterBlock");

  const loadTl = gsap.timeline();
  loadTl.to(loadBar, {
    scaleX: 1,
    duration: 2.1,
    ease: "power2.inOut",
    onUpdate() {
      loadPct.textContent = Math.round(this.progress() * 100);
    },
  });
  loadTl.to(loadingBlock, { opacity: 0, duration: 0.4, ease: "power1.out" });
  loadTl.set(loadingBlock, { visibility: "hidden" });
  loadTl.set(enterBlock, { visibility: "visible" });
  loadTl.to(enterBlock, { opacity: 1, duration: 0.6, ease: "power1.out" });

  function enter(withAudio) {
    if (withAudio) setAudio(true);

    const tl = gsap.timeline();
    tl.to(preloader, {
      clipPath: "inset(0 0 100% 0)",
      duration: 1.1,
      ease: "power3.inOut",
    });
    tl.set(preloader, { display: "none" });
    tl.add(() => {
      document.body.classList.add("is-entered");
      document.body.classList.remove("is-locked");
      lenis.start();
      ScrollTrigger.refresh();
    }, "-=0.9");
    tl.to("#siteHead", { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.5");
    tl.to("#hero .line__inner", {
      y: 0,
      duration: 1.3,
      stagger: 0.12,
      ease: "power4.out",
    }, "-=0.7");
    tl.to("#scrollCue", { opacity: 1, duration: 0.9, ease: "power1.out" }, "-=0.5");
  }

  document.getElementById("enterAudio").addEventListener("click", () => enter(true));
  document.getElementById("enterQuiet").addEventListener("click", () => enter(false));
  gsap.set(preloader, { clipPath: "inset(0 0 0% 0)" });

  /* ------------------------------------------------------------
     SCROLL ANIMACE
  ------------------------------------------------------------ */

  gsap.to(".hero__title", {
    yPercent: -60,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom 40%",
      scrub: true,
    },
  });
  gsap.to("#scrollCue", {
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "18% top",
      scrub: true,
    },
  });

  document.querySelectorAll(".panel--chapter, .panel--footer").forEach((panel) => {
    const lines = panel.querySelectorAll(".chapter__title .line__inner, .footer__title .line__inner");
    if (lines.length) {
      gsap.to(lines, {
        y: 0,
        duration: 1.25,
        stagger: 0.11,
        ease: "power4.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 62%",
          toggleActions: "play none none reverse",
        },
      });
    }

    const num = panel.querySelector(".chapter__num");
    if (num) {
      gsap.to(num, {
        opacity: 1,
        duration: 1,
        ease: "power1.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 55%",
          toggleActions: "play none none reverse",
        },
      });
    }

    const more = panel.querySelector(".chapter__more");
    if (more) {
      gsap.to(more, {
        opacity: 1,
        duration: 1,
        ease: "power1.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 30%",
          toggleActions: "play none none reverse",
        },
      });
    }
  });

  /* odstavce: slova se rozsvěcují podle scrollu */
  document.querySelectorAll(".scrub-text").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.to(p.querySelectorAll(".w"), {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: p,
        start: "top 78%",
        end: "top 30%",
        scrub: true,
      },
    });
  });

  /* řádky platforem */
  const platRows = gsap.utils.toArray(".plat-row");
  if (platRows.length) {
    gsap.to(platRows, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".plat-list",
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /* statistiky: countery */
  const stats = gsap.utils.toArray(".stat");
  if (stats.length) {
    gsap.to(stats, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".stats-grid",
        start: "top 72%",
        toggleActions: "play none none reverse",
      },
    });

    document.querySelectorAll(".stat__num").forEach((el) => {
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const counter = { v: 0 };
      gsap.to(counter, {
        v: target,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          el.textContent = counter.v
            .toFixed(decimals)
            .replace(".", ",");
        },
      });
    });
  }

  /* tlačítka "číst dál" scrollují na další kapitolu */
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.next);
      if (target) lenis.scrollTo(target, { offset: 0, duration: 1.8 });
    });
  });
  document.getElementById("scrollCue").addEventListener("click", () => {
    lenis.scrollTo("#manifest", { duration: 1.8 });
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.6 });
      }
    });
  });

  /* ------------------------------------------------------------
     TÝMOVÝ CAROUSEL
  ------------------------------------------------------------ */
  const members = gsap.utils.toArray(".team-member");
  let current = 0;
  let animating = false;

  function showMember(next, dir) {
    if (animating || next === current) return;
    animating = true;
    const out = members[current];
    const inn = members[next];

    const tl = gsap.timeline({
      onComplete: () => {
        out.classList.remove("is-active");
        animating = false;
      },
    });

    tl.to(out.children, {
      yPercent: -30 * dir,
      opacity: 0,
      duration: 0.45,
      stagger: 0.05,
      ease: "power2.in",
    });
    tl.add(() => {
      inn.classList.add("is-active");
      gsap.set(inn.children, { yPercent: 34 * dir, opacity: 0 });
      gsap.set(out.children, { clearProps: "all" });
    });
    tl.to(inn.children, {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.06,
      ease: "power3.out",
    });

    current = next;
  }

  document.getElementById("teamNext").addEventListener("click", () => {
    showMember((current + 1) % members.length, 1);
  });
  document.getElementById("teamPrev").addEventListener("click", () => {
    showMember((current - 1 + members.length) % members.length, -1);
  });

})();
