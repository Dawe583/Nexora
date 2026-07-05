/* ═══════════════════════════════════════════════════════════
   NEXORA — interactions
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

  /* ── Word-by-word scrub text ── */
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

  /* ── Features showcase ── */
  const scTabs = document.querySelectorAll(".showcase__tab");
  const scImgs = document.querySelectorAll(".showcase__img");
  const scCap = document.querySelector(".showcase__cap");
  const caps = [
    "Start with a question and move faster from the first prompt.",
    "Verify every answer with linked sources and full context.",
    "Execute the next step — tickets, replies, and drafts in one flow.",
    "Measure what's working with trends, gaps, and clear signals.",
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

  /* ── Pricing toggle ── */
  const priceBtns = document.querySelectorAll(".price-toggle button");
  const amounts = document.querySelectorAll(".plan__amount[data-month]");
  priceBtns.forEach((b) =>
    b.addEventListener("click", () => {
      priceBtns.forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
      const cyc = b.dataset.cycle;
      amounts.forEach((a) => {
        a.textContent = "$" + a.dataset[cyc];
      });
    })
  );

  /* ── FAQ ── */
  const faqData = {
    general: [
      ["What is Nexora and how does it work?", "Nexora is an AI agent that connects to your existing docs and tools to deliver verified answers, draft responses, and trigger actions directly from a chat interface. Ask a question, get a sourced answer, and execute next steps without switching tabs."],
      ["How long does it take to set up?", "Most teams are up and running in under five minutes. Connect your data sources, invite your team, and Nexora starts indexing immediately. No engineering resources required."],
      ["Do I need technical knowledge to use Nexora?", "No. Nexora is designed for operators, support leads, and sales teams. The interface is conversational, and connecting integrations takes a few clicks."],
      ["Is there a free plan available?", "Nexora offers a free tier with limited integrations and message volume so you can evaluate the product before committing. No credit card required."],
    ],
    ai: [
      ["Which models does Nexora use?", "Nexora routes each request to the best available model for the task and keeps context across threads, so answers stay consistent and grounded in your own sources."],
      ["How does Nexora avoid hallucinations?", "Every response links to the exact source it pulled from. When sources conflict, Nexora flags it instead of guessing — so your team can make the call."],
      ["Can it take actions, not just answer?", "Yes. Nexora turns prompts into tickets, replies, drafts, and next steps, and can execute them inside your connected tools with approval gates where needed."],
    ],
    sec: [
      ["What tools does Nexora integrate with?", "Nexora plugs into your docs, CRM, help center, and support stack. Source connect, action runner, approval gate, and audit are all built in."],
      ["How is my data protected?", "Nexora is GDPR-ready and SOC 2 aligned. Granular role-based access controls who can connect sources, trigger actions, and manage billing."],
      ["Can I control which actions require approval?", "Yes. Approval gates let you require sign-off for sensitive actions, and every change is logged with a full audit trail."],
    ],
  };
  const faqList = document.getElementById("faqList");
  function renderFaq(set) {
    faqList.innerHTML = "";
    faqData[set].forEach(([q, a], i) => {
      const item = document.createElement("div");
      item.className = "faq-item" + (i === 0 ? " open" : "");
      item.innerHTML =
        `<button class="faq-item__q">${q}<span aria-hidden="true">⌄</span></button>` +
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

  /* ── Chat mockup tabs (cosmetic) ── */
  document.querySelectorAll(".chat__tabs").forEach((tabs) => {
    tabs.querySelectorAll(".chat__tab").forEach((t) =>
      t.addEventListener("click", () => {
        tabs.querySelectorAll(".chat__tab").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
      })
    );
  });

  /* ── Testimonials carousel ── */
  const quotes = [
    ["We cut our average ticket resolution time from 12 minutes to under 3. Nexora pulls the right answer from our docs before our agents even finish reading the ticket.", "Sarah Chen", "Head of Support, Layerform", "https://framerusercontent.com/images/2uayq1aC9XZcwLgTTRK6M2ok8KE.jpg?width=1450&height=1925"],
    ["Nexora became our single source of truth. New hires ramp in days, not weeks, because every answer comes with the source attached.", "Marcus Reid", "Director of Ops, Northwind", "https://framerusercontent.com/images/8PPauCURBfmckfonpgSJY9NbDQ.jpg?width=1450&height=1925"],
    ["The action runner is the difference. Our team goes from question to a filed ticket in one flow — no tab switching, no copy-paste.", "Priya Sharma", "VP Success, Cobalt", "https://framerusercontent.com/images/6qMq4KZghjDbviFxb8hhxGW0fT0.jpg?width=1450&height=1925"],
  ];
  const qText = document.getElementById("quoteText"),
    qName = document.getElementById("quoteName"),
    qRole = document.getElementById("quoteRole"),
    qImg = document.getElementById("quoteImg"),
    qDots = document.getElementById("quoteDots");
  let qI = 0;
  quotes.forEach((_, i) => {
    const d = document.createElement("button");
    d.className = "q-dot" + (i === 0 ? " is-active" : "");
    d.setAttribute("aria-label", "Testimonial " + (i + 1));
    d.addEventListener("click", () => setQuote(i, true));
    qDots.appendChild(d);
  });
  const qDotEls = qDots.querySelectorAll("button");
  let qTimer;
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
  qDotEls.forEach((d) => d.classList.add("is-active") && 0);
  qDots.querySelectorAll(".q-dot").forEach((d) => (d.className = "is-active"));
  // normalize dot styling to match CSS (.quote__dots button)
  qDots.querySelectorAll("button").forEach((d, i) => (d.className = i === 0 ? "is-active" : ""));
  resetQTimer();

  /* ── Hero parallax on hills ── */
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
})();
