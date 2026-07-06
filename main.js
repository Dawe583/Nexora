/* ═══════════════════════════════════════════════════════════
   NEXORA — interakce + živé animace (CZ)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* Efekty běží na VŠECH zařízeních bez výjimky (dotyk, myš, i reduced-motion). */
  const reduce = false;
  const fine = true;
  const raf = (fn) => requestAnimationFrame(fn);

  /* ─────────────────────────────────────────────
     LENIS SMOOTH SCROLL (fallback = native scroll)
  ───────────────────────────────────────────── */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    const loop = (time) => {
      lenis.raf(time);
      raf(loop);
    };
    raf(loop);
    // plynulé kotvy
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (t) {
          e.preventDefault();
          lenis.scrollTo(t, { offset: -70, duration: 1.3 });
        }
      });
    });
  }
  const scrollY = () => window.scrollY || document.documentElement.scrollTop || 0;

  /* ─────────────────────────────────────────────
     STICKY HEADER + SCROLL PROGRESS
  ───────────────────────────────────────────── */
  const head = document.getElementById("siteHead");
  const prog = document.getElementById("scrollProg");
  function onScroll() {
    const y = scrollY();
    head.classList.toggle("scrolled", y > 20);
    if (prog) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
  }
  onScroll();
  const bindScroll = (fn) => (lenis ? lenis.on("scroll", fn) : window.addEventListener("scroll", fn, { passive: true }));
  bindScroll(onScroll);

  /* ─────────────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────────────── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms";
    io.observe(el);
  });

  /* ─────────────────────────────────────────────
     HERO TITLE — postupné vyjíždění slov
  ───────────────────────────────────────────── */
  const heroTitle = document.querySelector(".hero__title");
  if (heroTitle && !reduce) {
    const words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.innerHTML = words
      .map((w, i) => `<span class="hw"><span style="transition-delay:${120 + i * 55}ms">${w}</span></span>`)
      .join(" ");
    heroTitle.classList.add("split");
  }

  /* ─────────────────────────────────────────────
     POSTUPNÉ ROZSVĚCOVÁNÍ SLOV (intro)
  ───────────────────────────────────────────── */
  document.querySelectorAll(".scrub-text").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  });
  const wordEls = Array.from(document.querySelectorAll(".scrub-text .w"));
  const litWords = () => {
    const vh = window.innerHeight;
    for (const w of wordEls) {
      const r = w.getBoundingClientRect();
      if (r.top < vh * 0.72) w.classList.add("lit");
    }
  };
  litWords();
  bindScroll(litWords);

  /* ─────────────────────────────────────────────
     PARALLAX (média + kopce + orby)
  ───────────────────────────────────────────── */
  const far = document.querySelector(".hero__hills--far");
  const mid = document.querySelector(".hero__hills--mid");
  const front = document.querySelector(".hero__hills--front");
  const pImgs = Array.from(document.querySelectorAll("[data-parallax]"));
  document
    .querySelectorAll(".post__img img, .stack-card__media img, .quote__avatar img, .log__media img")
    .forEach((im) => {
      im.setAttribute("data-parallax", "0.06");
      im.classList.add("parallax-img");
      pImgs.push(im);
    });

  let ticking = false;
  function parallax() {
    ticking = false;
    const y = scrollY();
    const vh = window.innerHeight;
    if (y < vh * 1.3) {
      if (far) far.style.transform = `translateX(-50%) translateY(${y * 0.05}px)`;
      if (mid) mid.style.transform = `translateX(-50%) translateY(${y * 0.11}px)`;
      if (front) front.style.transform = `translateX(-50%) translateY(${y * -0.03}px)`;
    }
    for (const im of pImgs) {
      const r = im.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const off = r.top + r.height / 2 - vh / 2;
      const f = parseFloat(im.dataset.parallax) || 0.06;
      im.style.transform = `translateY(${(off * -f).toFixed(1)}px) scale(1.14)`;
    }
  }
  const onParallax = () => {
    if (!ticking) {
      ticking = true;
      raf(parallax);
    }
  };
  if (!reduce) {
    parallax();
    bindScroll(onParallax);
    window.addEventListener("resize", onParallax);
  }

  /* ─────────────────────────────────────────────
     CURSOR GLOW na kartách
  ───────────────────────────────────────────── */
  const GLOW = ".why-card,.plan,.post,.faq-item,.stack-card,.quote,.showcase,.log__media,.int-row,.faq__card,.chat";
  document.addEventListener(
    "pointermove",
    (e) => {
      const card = e.target.closest(GLOW);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
      if (e.pointerType !== "mouse") card.classList.add("lit-card");
    },
    { passive: true }
  );
  const clearLit = () => document.querySelectorAll(".lit-card").forEach((c) => c.classList.remove("lit-card"));
  document.addEventListener("pointerup", clearLit, { passive: true });
  document.addEventListener("pointercancel", clearLit, { passive: true });

  /* ─────────────────────────────────────────────
     MAGNETICKÁ TLAČÍTKA
  ───────────────────────────────────────────── */
  document.querySelectorAll(".btn--primary,.btn--play,.icon-btn,.ticker-chip__arrow,.sug-arrow").forEach((el) => {
    let rq = null;
    el.style.transition = "transform .25s var(--ease)";
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      if (rq) cancelAnimationFrame(rq);
      rq = raf(() => (el.style.transform = `translate(${x * 0.32}px, ${y * 0.42}px)`));
    });
    const reset = () => {
      if (rq) cancelAnimationFrame(rq);
      el.style.transform = "";
    };
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);
    el.addEventListener("pointerup", reset);
  });

  /* ─────────────────────────────────────────────
     TILT chat panelu v hero
  ───────────────────────────────────────────── */
  const heroChat = document.querySelector(".hero .chat");
  const hero = document.querySelector(".hero");
  if (heroChat && hero) {
    let done = false;
    setTimeout(() => (done = true), 1400);
    let rq = null;
    hero.addEventListener("pointermove", (e) => {
      if (!done) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rx = ((e.clientY - cy) / cy) * -3;
      const ry = ((e.clientX - cx) / cx) * 3;
      if (rq) cancelAnimationFrame(rq);
      rq = raf(() => (heroChat.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`));
    });
    const level = () => (heroChat.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)");
    hero.addEventListener("pointerleave", level);
    hero.addEventListener("pointercancel", level);
  }

  /* ─────────────────────────────────────────────
     COUNT-UP cen ($15 / $38)
  ───────────────────────────────────────────── */
  const amounts = document.querySelectorAll(".plan__amount[data-year]");
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        countIO.unobserve(el);
        const target = parseInt(el.dataset.year, 10);
        if (isNaN(target) || reduce) return;
        let v = 0;
        const step = Math.max(1, Math.round(target / 26));
        const tick = () => {
          v = Math.min(target, v + step);
          el.textContent = "$" + v;
          if (v < target) raf(tick);
        };
        tick();
      });
    },
    { threshold: 0.6 }
  );
  amounts.forEach((a) => countIO.observe(a));

  /* ─────────────────────────────────────────────
     Showcase funkcí
  ───────────────────────────────────────────── */
  const scTabs = document.querySelectorAll(".showcase__tab");
  const scImgs = document.querySelectorAll(".showcase__img");
  const scCap = document.querySelector(".showcase__cap");
  const caps = [
    "Začněte otázkou a postupujte rychleji už od prvního promptu.",
    "Ověřte každou odpověď díky odkazům na zdroje a plnému kontextu.",
    "Proveďte další krok — tickety, odpovědi a návrhy v jednom toku.",
    "Měřte, co funguje — trendy, mezery a jasné signály.",
  ];
  let scI = 0,
    scTimer;
  function setShow(i) {
    scI = (i + scImgs.length) % scImgs.length;
    scTabs.forEach((t, k) => t.classList.toggle("is-active", k === scI));
    scImgs.forEach((im, k) => im.classList.toggle("is-active", k === scI));
    if (scCap) scCap.textContent = caps[scI];
  }
  function autoShow() {
    clearInterval(scTimer);
    scTimer = setInterval(() => setShow(scI + 1), 4200);
  }
  scTabs.forEach((t, k) =>
    t.addEventListener("click", () => {
      setShow(k);
      autoShow();
    })
  );
  document.querySelectorAll(".showcase__nav .icon-btn").forEach((b) =>
    b.addEventListener("click", () => {
      setShow(scI + Number(b.dataset.dir));
      autoShow();
    })
  );
  if (scImgs.length) autoShow();

  /* ─────────────────────────────────────────────
     Ceník — přepínač Ročně / Měsíčně
  ───────────────────────────────────────────── */
  document.querySelectorAll(".cycle__switch").forEach((sw) => {
    const card = sw.closest(".plan");
    const amount = card.querySelector(".plan__amount[data-month]");
    const label = sw.parentElement.querySelector(".cycle__label");
    const toggle = () => {
      const yearly = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(yearly));
      if (label) label.textContent = yearly ? "Ročně" : "Měsíčně";
      if (amount) amount.textContent = "$" + amount.dataset[yearly ? "year" : "month"];
    };
    sw.addEventListener("click", toggle);
    sw.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* ─────────────────────────────────────────────
     FAQ
  ───────────────────────────────────────────── */
  const faqData = {
    general: [
      ["Co je Nexora a jak funguje?", "Nexora je AI agent, který se připojí k vašim stávajícím dokumentům a nástrojům a dodává ověřené odpovědi, návrhy reakcí a spouští akce přímo z chatovacího rozhraní. Položíte otázku, dostanete odpověď se zdrojem a provedete další kroky bez přepínání záložek."],
      ["Jak dlouho trvá nastavení?", "Většina týmů je připravena za méně než pět minut. Připojíte zdroje dat, pozvete tým a Nexora začne okamžitě indexovat. Bez nutnosti vývojářů."],
      ["Potřebuji technické znalosti?", "Ne. Nexora je navržená pro operations, vedoucí podpory i obchodní týmy. Rozhraní je konverzační a připojení integrací zabere pár kliknutí."],
      ["Existuje bezplatný plán?", "Ano — bezplatná úroveň s omezeným počtem integrací a zpráv, abyste si produkt vyzkoušeli bez závazků. Platební karta není potřeba."],
    ],
    ai: [
      ["Jaké modely Nexora používá?", "Nexora směruje každý požadavek na nejvhodnější dostupný model a drží kontext napříč vlákny, takže odpovědi zůstávají konzistentní a opřené o vaše vlastní zdroje."],
      ["Jak se Nexora vyhýbá halucinacím?", "Každá odpověď odkazuje na přesný zdroj, ze kterého vychází. Když si zdroje odporují, Nexora to označí místo hádání — rozhodnutí zůstává na vašem týmu."],
      ["Umí i konat, nejen odpovídat?", "Ano. Nexora mění prompty v tickety, odpovědi, návrhy a další kroky a umí je provést v propojených nástrojích — se schvalovací bránou tam, kde je to potřeba."],
    ],
    sec: [
      ["S jakými nástroji se Nexora integruje?", "Nexora se napojí na dokumenty, CRM, help centrum i support stack. Připojení zdrojů, spouštění akcí, schvalovací brána a audit jsou součástí platformy."],
      ["Jak jsou chráněna moje data?", "Nexora je připravená na GDPR a v souladu se SOC 2. Granulární role řídí, kdo může připojovat zdroje, spouštět akce a spravovat fakturaci."],
      ["Mohu určit, které akce vyžadují schválení?", "Ano. Schvalovací brány vynutí potvrzení u citlivých akcí a každá změna se loguje s kompletní auditní stopou."],
    ],
  };
  const faqList = document.getElementById("faqList");
  function renderFaq(set) {
    faqList.innerHTML = "";
    faqData[set].forEach(([q, a], i) => {
      const item = document.createElement("div");
      item.className = "faq-item" + (i === 0 ? " open" : "");
      item.innerHTML =
        `<button class="faq-item__q">${q}<span aria-hidden="true">⌃</span></button>` +
        `<div class="faq-item__a"><p>${a}</p></div>`;
      const ans = item.querySelector(".faq-item__a");
      item.querySelector(".faq-item__q").addEventListener("click", () => {
        const open = item.classList.toggle("open");
        ans.style.maxHeight = open ? ans.scrollHeight + "px" : 0;
      });
      faqList.appendChild(item);
      if (i === 0) ans.style.maxHeight = ans.scrollHeight + "px";
    });
  }
  document.querySelectorAll(".faq__tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".faq__tabs button").forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
      renderFaq(b.dataset.set);
    })
  );
  renderFaq("general");

  /* ─────────────────────────────────────────────
     Chat mockup taby (kosmetické)
  ───────────────────────────────────────────── */
  document.querySelectorAll(".chat__tabs-row").forEach((tabs) => {
    tabs.querySelectorAll(".chat__tab").forEach((t) =>
      t.addEventListener("click", () => {
        tabs.querySelectorAll(".chat__tab").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
      })
    );
  });

  /* ─────────────────────────────────────────────
     Reference (karusel)
  ───────────────────────────────────────────── */
  const quotes = [
    ["Průměrnou dobu vyřešení ticketu jsme zkrátili z 12 minut pod 3. Nexora najde správnou odpověď v naší dokumentaci dřív, než agent dočte ticket.", "Sarah Chen", "Vedoucí podpory, Layerform", "https://framerusercontent.com/images/2uayq1aC9XZcwLgTTRK6M2ok8KE.jpg?width=1450&height=1925"],
    ["Nexora se stala naším jediným zdrojem pravdy. Nováčci se zapracují za dny, ne týdny, protože každá odpověď má u sebe zdroj.", "Marcus Reid", "Ředitel provozu, Northwind", "https://framerusercontent.com/images/8PPauCURBfmckfonpgSJY9NbDQ.jpg?width=1450&height=1925"],
    ["Rozdíl dělá spouštění akcí. Tým se dostane od otázky k založenému ticketu v jednom toku — bez přepínání záložek a kopírování.", "Priya Sharma", "VP Success, Cobalt", "https://framerusercontent.com/images/6qMq4KZghjDbviFxb8hhxGW0fT0.jpg?width=1450&height=1925"],
    ["Odkazy na zdroje změnily, jak lidé AI důvěřují. Nikdo už neřeší, odkud odpověď je — jednoduše na ni klikne a vidí ji v kontextu.", "Tomáš Krejčí", "Ředitel produktu, Meridian", "https://framerusercontent.com/images/PahuPLrBYO2JdmGOgzCORNG7Q.jpg?width=1450&height=1925"],
    ["Schvalovací brány nám daly odvahu pustit AI k reálným akcím. Citlivé kroky projdou kontrolou a všechno zůstává v auditní stopě.", "Aiko Tanaka", "Vedoucí provozu, Aperture", "https://framerusercontent.com/images/pepH1APN2yML7ExisXYWgAZwSH0.jpg?width=1450&height=1925"],
  ];
  const qText = document.getElementById("quoteText"),
    qName = document.getElementById("quoteName"),
    qRole = document.getElementById("quoteRole"),
    qImg = document.getElementById("quoteImg"),
    qDots = document.getElementById("quoteDots"),
    qCard = document.querySelector(".quote__body");
  let qI = 0,
    qTimer;
  quotes.forEach((_, i) => {
    const d = document.createElement("button");
    if (i === 0) d.className = "is-active";
    d.setAttribute("aria-label", "Reference " + (i + 1));
    d.addEventListener("click", () => setQuote(i, true));
    qDots.appendChild(d);
  });
  const qDotEls = qDots.querySelectorAll("button");
  function setQuote(i, manual) {
    qI = (i + quotes.length) % quotes.length;
    const [t, n, r, im] = quotes[qI];
    if (qCard) {
      qCard.classList.add("swap");
      setTimeout(() => qCard.classList.remove("swap"), 260);
    }
    qText.textContent = t;
    qName.textContent = n;
    qRole.textContent = r;
    qImg.src = im;
    qDotEls.forEach((d, k) => d.classList.toggle("is-active", k === qI));
    if (manual) resetQTimer();
  }
  function resetQTimer() {
    clearInterval(qTimer);
    qTimer = setInterval(() => setQuote(qI + 1), 6000);
  }
  document.querySelectorAll(".quote__nav .icon-btn").forEach((b) =>
    b.addEventListener("click", () => setQuote(qI + Number(b.dataset.q), true))
  );
  resetQTimer();

  /* ─────────────────────────────────────────────
     CTA formulář (demo)
  ───────────────────────────────────────────── */
  const form = document.querySelector(".cta__form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.textContent = "Odesláno ✓";
      form.reset();
      setTimeout(() => (btn.textContent = "Odeslat"), 3000);
    });
  }
})();
