/* ═══════════════════════════════════════════════════════════
   NEXORA — interakce (CZ)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Sticky header ── */
  const head = document.getElementById("siteHead");
  const onScroll = () => head.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Scroll reveal ── */
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
    el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
    io.observe(el);
  });

  /* ── Postupné rozsvěcování slov ── */
  document.querySelectorAll(".scrub-text").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  });
  const wordEls = Array.from(document.querySelectorAll(".scrub-text .w"));
  const litWords = () => {
    const vh = window.innerHeight;
    wordEls.forEach((w) => {
      const r = w.getBoundingClientRect();
      w.classList.toggle("lit", r.top < vh * 0.72);
    });
  };
  litWords();
  window.addEventListener("scroll", litWords, { passive: true });

  /* ── Showcase funkcí ── */
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

  /* ── Ceník: přepínač Ročně/Měsíčně na kartě ── */
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

  /* ── FAQ ── */
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

  /* ── Chat mockup taby (kosmetické) ── */
  document.querySelectorAll(".chat__tabs-row").forEach((tabs) => {
    tabs.querySelectorAll(".chat__tab").forEach((t) =>
      t.addEventListener("click", () => {
        tabs.querySelectorAll(".chat__tab").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
      })
    );
  });

  /* ── Reference (karusel) ── */
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
    qDots = document.getElementById("quoteDots");
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

  /* ── Hero parallax kopců ── */
  const far = document.querySelector(".hero__hills--far");
  const mid = document.querySelector(".hero__hills--mid");
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        if (far) far.style.transform = `translateX(-50%) translateY(${y * 0.06}px)`;
        if (mid) mid.style.transform = `translateX(-50%) translateY(${y * 0.12}px)`;
      }
    },
    { passive: true }
  );

  /* ── CTA formulář (demo) ── */
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
