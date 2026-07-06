/* ═══════════════════════════════════════════════════════════
   NEXORA — interakce + živé animace (CZ)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* Efekty se přizpůsobí zařízení: na dotykových displejích scrolluje nativní
     prohlížeč (žádné hijackování prstu), jen na myši běží smooth scroll a
     kurzorové efekty. Ctíme také prefers-reduced-motion. */
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  const reduce = mq("(prefers-reduced-motion:reduce)");
  const coarse = mq("(pointer:coarse)") || mq("(hover:none)");
  const fine = !coarse && !mq("(pointer:none)");
  const raf = (fn) => requestAnimationFrame(fn);

  /* ─────────────────────────────────────────────
     LENIS SMOOTH SCROLL — jen na myši, nikdy na dotyku
     (na mobilu = nativní scroll, aby nebyl přehnaně agresivní)
  ───────────────────────────────────────────── */
  let lenis = null;
  if (window.Lenis && !reduce && !coarse) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1,
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
     NADPISY — postupné vyjíždění slov (hero + sekce)
  ───────────────────────────────────────────── */
  function splitTitle(el) {
    let wi = 0;
    const wrapWord = (word) => {
      const outer = document.createElement("span");
      outer.className = "hw";
      const inner = document.createElement("span");
      inner.style.transitionDelay = 90 + wi * 48 + "ms";
      inner.textContent = word;
      outer.appendChild(inner);
      wi++;
      return outer;
    };
    const processInto = (source, target) => {
      Array.from(source.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) target.appendChild(document.createTextNode(" "));
            else target.appendChild(wrapWord(part));
          });
        } else if (node.nodeType === 1) {
          const clone = node.cloneNode(false);
          processInto(node, clone);
          target.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    processInto(el, frag);
    el.textContent = "";
    el.appendChild(frag);
    el.classList.add("split");
  }
  document.querySelectorAll(".hero__title, .section-title").forEach(splitTitle);

  /* ─────────────────────────────────────────────
     POSTUPNÉ ROZSVĚCOVÁNÍ SLOV (intro)
  ───────────────────────────────────────────── */
  document.querySelectorAll(".scrub-text").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  });
  let wordEls = Array.from(document.querySelectorAll(".scrub-text .w"));
  const litWords = () => {
    if (!wordEls.length) return;
    const vh = window.innerHeight;
    /* fáze čtení (rekty), pak fáze zápisu (třídy) — bez layout thrashingu */
    const toLight = [];
    for (const w of wordEls) {
      if (w.getBoundingClientRect().top < vh * 0.72) toLight.push(w);
    }
    for (const w of toLight) w.classList.add("lit");
    if (toLight.length) wordEls = wordEls.filter((w) => !toLight.includes(w));
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

  /* changelog — stack scroll reveal (rekty čteme najednou, zápisy až poté) */
  const logItems = Array.from(document.querySelectorAll("#logStack .log__item")).map((el) => ({
    el,
    veil: el.querySelector(".log__veil"),
    lastT: "",
    lastO: "",
  }));
  function stackFx(vh) {
    if (!logItems.length) return;
    const tops = logItems.map((it) => it.el.getBoundingClientRect().top);
    for (let i = 0; i < logItems.length; i++) {
      const it = logItems[i];
      let t = "", o = "0";
      if (i + 1 < logItems.length) {
        const start = 88 + i * 16;
        let p = (vh - tops[i + 1]) / (vh - start);
        p = Math.max(0, Math.min(1, p));
        t = `scale(${(1 - p * 0.06).toFixed(4)}) translateY(${(-p * 12).toFixed(1)}px)`;
        o = (p * 0.5).toFixed(3);
      }
      if (t !== it.lastT) {
        it.lastT = t;
        it.el.style.transform = t;
      }
      if (it.veil && o !== it.lastO) {
        it.lastO = o;
        it.veil.style.opacity = o;
      }
    }
  }

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
    /* nejdřív všechna čtení rektů, pak všechny zápisy transformů */
    const writes = [];
    if (!coarse) for (const im of pImgs) {
      const r = im.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const off = r.top + r.height / 2 - vh / 2;
      const f = parseFloat(im.dataset.parallax) || 0.06;
      writes.push([im, `translateY(${(off * -f).toFixed(1)}px) scale(1.14)`]);
    }
    for (const [im, t] of writes) {
      if (im.__pfx !== t) {
        im.__pfx = t;
        im.style.transform = t;
      }
    }
    stackFx(vh);
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
  if (fine) {
    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        const card = e.target.closest(GLOW);
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      },
      { passive: true }
    );
  }

  /* ─────────────────────────────────────────────
     MAGNETICKÁ TLAČÍTKA
  ───────────────────────────────────────────── */
  if (fine && !reduce) document.querySelectorAll(".btn--primary,.btn--play,.icon-btn,.ticker-chip__arrow,.sug-arrow").forEach((el) => {
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
  if (heroChat && hero && fine && !reduce) {
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
  if (faqList) {
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
  }

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
  if (qDots && qText) {
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
  /* karusel se točí jen když je vidět */
  const quoteSection = qCard ? qCard.closest("section") : null;
  if (quoteSection) {
    const qIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          clearInterval(qTimer);
          if (en.isIntersecting) resetQTimer();
        });
      },
      { threshold: 0.1 }
    );
    qIO.observe(quoteSection);
  }
  }

  /* ─────────────────────────────────────────────
     CTA formulář (demo)
  ───────────────────────────────────────────── */
  const form = document.querySelector(".cta__form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.textContent = "Odesláno ✓";
      btn.classList.add("sent");
      form.reset();
      setTimeout(() => {
        btn.textContent = "Odeslat";
        btn.classList.remove("sent");
      }, 3000);
    });
  }

  /* ─────────────────────────────────────────────
     HERO — hvězdné nebe (generované vrstvy)
  ───────────────────────────────────────────── */
  (function stars() {
    const layers = document.querySelectorAll(".hero__stars i");
    if (!layers.length) return;
    const counts = [42, 30, 22];
    layers.forEach((el, li) => {
      const parts = [];
      for (let i = 0; i < counts[li]; i++) {
        const x = (Math.random() * 100).toFixed(2);
        const y = (Math.random() * 62).toFixed(2);
        const a = (0.35 + Math.random() * 0.65).toFixed(2);
        parts.push(`${x}vw ${y}vh 0 rgba(255,250,244,${a})`);
      }
      el.style.boxShadow = parts.join(",");
    });
  })();

  /* ─────────────────────────────────────────────
     BLOG — 3D tilt karet
  ───────────────────────────────────────────── */
  if (fine && !reduce) document.querySelectorAll(".post").forEach((card) => {
    let rq = null;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      if (rq) cancelAnimationFrame(rq);
      rq = raf(() => (card.style.transform = `perspective(900px) translateY(-4px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`));
    });
    const flat = () => {
      if (rq) cancelAnimationFrame(rq);
      card.style.transform = "";
    };
    card.addEventListener("pointerleave", flat);
    card.addEventListener("pointercancel", flat);
  });

  /* ─────────────────────────────────────────────
     VELOCITY SKEW — jemné zkosení podle rychlosti scrollu
  ───────────────────────────────────────────── */
  (function vskew() {
    if (reduce || coarse) return;
    const target = document.querySelector("main");
    if (!target) return;
    let prev = scrollY();
    let cur = 0;
    let last = "";
    let running = false;
    function loop() {
      const y = scrollY();
      const v = y - prev;
      prev = y;
      const goal = Math.max(-1.1, Math.min(1.1, v * 0.028));
      cur += (goal - cur) * 0.1;
      if (Math.abs(cur) < 0.002) cur = 0;
      const val = cur === 0 ? "0deg" : cur.toFixed(3) + "deg";
      if (val !== last) {
        last = val;
        target.style.setProperty("--vskew", val);
      }
      /* v klidu smyčku uspi — žádné zbytečné rAF ticky */
      if (cur === 0 && v === 0) {
        running = false;
        return;
      }
      raf(loop);
    }
    const wake = () => {
      if (!running) {
        running = true;
        raf(loop);
      }
    };
    wake();
    bindScroll(wake);
  })();

  /* ─────────────────────────────────────────────
     CHAT — živá konverzace (typewriter + bubliny)
  ───────────────────────────────────────────── */
  const CONVOS = [
    {
      tab: 0,
      q: "Shrň zpětnou vazbu zákazníků za Q2",
      a: "Hotovo — 3 hlavní témata: onboarding (42 %), ceny (27 %) a integrace (18 %).",
      src: "Zdroj: CRM · 128 záznamů",
      sugg: [
        "Shrň náš produkt jednoduše pro nové uživatele",
        "Porovnej zpětnou vazbu za Q1 a Q2",
        "Najdi nejčastější požadavky na funkce",
        "Připrav podklady pro poradu produktu",
      ],
    },
    {
      tab: 1,
      q: "Jak resetuju heslo klientovi?",
      a: "Návod má 4 kroky — poslal jsem ti je do vlákna i s odkazem na dokumentaci.",
      src: "Zdroj: Help centrum",
      sugg: [
        "Napiš přátelskou odpověď podpory podle naší dokumentace",
        "Najdi řešení chyby přihlášení v Safari",
        "Shrň dnešní eskalace a jejich stav",
        "Připrav odpověď na dotaz k fakturaci",
      ],
    },
    {
      tab: 2,
      q: "Napiš follow-up po dnešním demu",
      a: "Návrh e-mailu je připravený — shrnutí dema, 3 přínosy a termín další schůzky.",
      src: "Koncept uložen",
      sugg: [
        "Napiš stručný follow-up e-mail po obchodním hovoru",
        "Vytvoř oznámení o nové funkci pro zákazníky",
        "Přepiš tenhle odstavec srozumitelněji",
        "Navrhni předmět e-mailu s vyšším otevřením",
      ],
    },
    {
      tab: 3,
      q: "Založ ticket na chybu přihlášení",
      a: "Ticket NEX-142 založen a přiřazen týmu Auth. Priorita: vysoká.",
      src: "Akce provedena ✓",
      sugg: [
        "Vytáhni úkoly a odpovědné osoby z poznámky ze schůzky",
        "Aktualizuj stav obchodu v CRM",
        "Naplánuj schůzku s týmem podpory",
        "Pošli týdenní report do Slacku",
      ],
    },
  ];

  function chatEngine(root) {
    const convo = root.querySelector(".chat__convo");
    const ph = root.querySelector(".ph-text");
    const tabs = Array.from(root.querySelectorAll(".chat__tab"));
    const sugList = root.querySelector(".chat__suggestions");
    if (!convo || !ph) return;
    const defaultPh = ph.textContent;
    let idx = 0;
    let runId = 0;
    let timer = null;

    const wait = (ms) =>
      new Promise((res) => {
        timer = setTimeout(res, ms);
      });
    const bubble = (kind) => {
      const b = document.createElement("div");
      b.className = "bubble bubble--" + kind;
      return b;
    };
    const show = (el) => raf(() => raf(() => el.classList.add("show")));

    async function typeInto(el, text, speed, run) {
      for (let i = 1; i <= text.length; i++) {
        if (run !== runId) return false;
        el.textContent = text.slice(0, i);
        await wait(speed);
      }
      return run === runId;
    }

    function swapSuggestions(items) {
      if (!sugList) return;
      const lis = Array.from(sugList.children);
      lis.forEach((li, i) => setTimeout(() => li.classList.add("out"), i * 50));
      setTimeout(() => {
        sugList.innerHTML = "";
        items.forEach((t, i) => {
          const li = document.createElement("li");
          if (i > 1) li.className = "hide-sm";
          li.classList.add("out");
          li.innerHTML = `${t} <span class="sug-arrow" aria-hidden="true">↗</span>`;
          sugList.appendChild(li);
          setTimeout(() => li.classList.remove("out"), 60 + i * 70);
        });
      }, 320);
    }

    function resetView() {
      clearTimeout(timer);
      root.classList.remove("typing", "sent");
      convo.classList.remove("bye");
      convo.innerHTML = "";
      ph.textContent = defaultPh;
    }

    async function cycle(run) {
      while (run === runId) {
        const c = CONVOS[idx % CONVOS.length];
        if (tabs.length) tabs.forEach((t, k) => t.classList.toggle("is-active", k === c.tab % tabs.length));
        swapSuggestions(c.sugg);
        await wait(700);
        if (run !== runId) return;

        root.classList.add("typing");
        if (!(await typeInto(ph, c.q, 26, run))) return;
        root.classList.remove("typing");
        root.classList.add("sent");
        await wait(280);
        if (run !== runId) return;
        root.classList.remove("sent");
        ph.textContent = defaultPh;

        const ub = bubble("user");
        ub.textContent = c.q;
        convo.appendChild(ub);
        show(ub);
        await wait(450);
        if (run !== runId) return;

        const tb = bubble("typing");
        tb.innerHTML = "<i></i><i></i><i></i>";
        convo.appendChild(tb);
        show(tb);
        await wait(1000);
        if (run !== runId) return;
        tb.remove();

        const ab = bubble("ai");
        const span = document.createElement("span");
        ab.appendChild(span);
        convo.appendChild(ab);
        show(ab);
        if (!(await typeInto(span, c.a, 14, run))) return;

        const chip = document.createElement("span");
        chip.className = "src-chip";
        chip.textContent = c.src;
        ab.appendChild(chip);
        show(chip);
        await wait(2700);
        if (run !== runId) return;

        convo.classList.add("bye");
        await wait(500);
        if (run !== runId) return;
        convo.innerHTML = "";
        convo.classList.remove("bye");
        idx++;
      }
    }

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            runId++;
            resetView();
            cycle(runId);
          } else {
            runId++;
            resetView();
          }
        });
      },
      { threshold: 0.3 }
    );
    cio.observe(root);
  }
  document.querySelectorAll(".chat").forEach(chatEngine);

  /* ─────────────────────────────────────────────
     PRELOADER
  ───────────────────────────────────────────── */
  const pre = document.getElementById("preloader");
  if (pre) {
    const fill = document.getElementById("preFill");
    const pct = document.getElementById("prePct");
    const t0 = performance.now();
    const DUR = 1100;
    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / DUR);
      const v = Math.round(easeOut(p) * 100);
      if (fill) fill.style.width = v + "%";
      if (pct) pct.textContent = v + " %";
      if (p < 1) {
        raf(step);
      } else {
        pre.classList.add("done");
        document.body.classList.remove("pre");
        setTimeout(() => pre.remove(), 900);
      }
    };
    raf(step);
  } else {
    document.body.classList.remove("pre");
  }

  /* ─────────────────────────────────────────────
     SVĚTELNÝ KURZOR
  ───────────────────────────────────────────── */
  const cGlow = document.querySelector(".cursor-glow");
  const cDot = document.querySelector(".cursor-dot");
  if (cGlow && cDot && fine && !reduce) {
    let tx = -300, ty = -300, gx = -300, gy = -300, dx = -300, dy = -300, cursorRaf = null;
    const follow = () => {
      gx += (tx - gx) * 0.09;
      gy += (ty - gy) * 0.09;
      dx += (tx - dx) * 0.42;
      dy += (ty - dy) * 0.42;
      cGlow.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px) translate(-50%,-50%)`;
      cDot.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) translate(-50%,-50%)`;
      if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.2) cursorRaf = raf(follow);
      else cursorRaf = null;
    };
    document.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!document.body.classList.contains("cursor-on")) {
        gx = dx = tx;
        gy = dy = ty;
        document.body.classList.add("cursor-on");
      }
      const hot = e.target.closest && e.target.closest("a,button,.faq-item__q,.chat__tab,input");
      document.body.classList.toggle("cursor-hot", !!hot);
      if (!cursorRaf) cursorRaf = raf(follow);
    });
    document.addEventListener("pointerleave", () => document.body.classList.remove("cursor-on"));
  }

  /* ─────────────────────────────────────────────
     ZVUKOVÝ DESIGN (výchozí: vypnuto)
  ───────────────────────────────────────────── */
  const soundBtn = document.getElementById("soundBtn");
  if (soundBtn) {
    let actx = null;
    let soundOn = false;
    const ctx = () => {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      return actx;
    };
    const blip = (freq, dur, gainV, type) => {
      if (!soundOn) return;
      try {
        const ac = ctx();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(freq, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.6), ac.currentTime + dur);
        g.gain.setValueAtTime(gainV, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        o.connect(g).connect(ac.destination);
        o.start();
        o.stop(ac.currentTime + dur + 0.02);
      } catch (_) {}
    };
    const tick = () => blip(1250, 0.07, 0.028, "sine");
    const whoosh = () => {
      blip(320, 0.32, 0.05, "sine");
      setTimeout(() => blip(660, 0.22, 0.035, "sine"), 70);
    };
    soundBtn.addEventListener("click", () => {
      soundOn = !soundOn;
      soundBtn.setAttribute("aria-pressed", String(soundOn));
      if (soundOn) {
        ctx();
        whoosh();
      }
    });
    let lastTick = 0;
    document.addEventListener("pointerover", (e) => {
      if (!soundOn || !e.target.closest) return;
      if (!e.target.closest("a,button,.chat__tab,.faq-item__q")) return;
      const now = performance.now();
      if (now - lastTick < 90) return;
      lastTick = now;
      tick();
    });
    document.addEventListener("submit", () => whoosh(), true);
  }

  /* ─────────────────────────────────────────────
     COUNT-UP statistik ([data-count])
  ───────────────────────────────────────────── */
  const statEls = document.querySelectorAll("[data-count]");
  if (statEls.length) {
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          statIO.unobserve(el);
          const target = parseFloat(el.dataset.count);
          const dec = parseInt(el.dataset.dec || "0", 10);
          const suffix = el.dataset.suffix || "";
          if (isNaN(target)) return;
          const t0 = performance.now();
          const DUR = 1400;
          const step = (now) => {
            const p = Math.min(1, (now - t0) / DUR);
            const v = target * (1 - Math.pow(1 - p, 3));
            el.textContent = v.toFixed(dec).replace(".", ",") + suffix;
            if (p < 1) raf(step);
          };
          raf(step);
        });
      },
      { threshold: 0.5 }
    );
    statEls.forEach((el) => statIO.observe(el));
  }

  /* ─────────────────────────────────────────────
     VÝKON — CSS animace běží jen ve viewportu
  ───────────────────────────────────────────── */
  const pauseIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => en.target.classList.toggle("fx-pause", !en.isIntersecting));
    },
    { rootMargin: "160px 0px" }
  );
  document.querySelectorAll(".hero, .section, .site-foot").forEach((s) => pauseIO.observe(s));

  /* showcase — auto-rotace tabů jen když je sekce vidět */
  const showcaseEl = document.querySelector(".showcase");
  if (showcaseEl && scImgs.length) {
    const showIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          clearInterval(scTimer);
          if (en.isIntersecting) autoShow();
        });
      },
      { threshold: 0.15 }
    );
    showIO.observe(showcaseEl);
  }

  /* ─────────────────────────────────────────────
     BLOG: filtry kategorií + vyhledávání
  ───────────────────────────────────────────── */
  const catBtns = document.querySelectorAll(".blog-cats button");
  const blogSearch = document.getElementById("blogSearch");
  if (catBtns.length || blogSearch) {
    const posts = document.querySelectorAll(".post[data-cat]");
    let activeCat = "all";
    const applyFilter = () => {
      const q = (blogSearch ? blogSearch.value : "").trim().toLowerCase();
      posts.forEach((p) => {
        const catOk = activeCat === "all" || p.dataset.cat === activeCat;
        const textOk = !q || p.textContent.toLowerCase().includes(q);
        p.classList.toggle("hidden", !(catOk && textOk));
      });
    };
    catBtns.forEach((b) =>
      b.addEventListener("click", () => {
        catBtns.forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        activeCat = b.dataset.cat || "all";
        applyFilter();
      })
    );
    if (blogSearch) blogSearch.addEventListener("input", applyFilter);
  }
})();
