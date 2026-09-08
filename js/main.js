/* =========================================================
   DUSK N DUNES — main.js
   Header behaviour, mobile nav, scroll reveal, gallery,
   lightbox, back-to-top, placeholder image fallback.
   ========================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupHeaderScroll();
    setupMobileNav();
    setupImageFallback();
    setupScrollReveal();
    setupBackToTop();
    setupGalleryFilter();
    setupLightbox();
    setupYear();
  }

  /* ---------- Sticky header shadow on scroll ---------- */
  function setupHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var toggle = function () {
      if (window.scrollY > 40) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ---------- Mobile hamburger menu ---------- */
  function setupMobileNav() {
    var btn = document.querySelector(".hamburger");
    var nav = document.querySelector(".mobile-nav");
    if (!btn || !nav) return;

    function close() {
      btn.classList.remove("is-open");
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    function open() {
      btn.classList.add("is-open");
      nav.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    btn.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) close();
      else open();
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- Placeholder image fallback ----------
     If a photograph has not been supplied yet, the <img>
     will 404. We catch that and reveal a soft, labelled
     placeholder instead of a broken image icon. */
  function setupImageFallback() {
    document.querySelectorAll(".ph-img img").forEach(function (img) {
      img.addEventListener(
        "error",
        function () {
          var wrap = img.closest(".ph-img");
          if (wrap) wrap.classList.add("ph-fallback");
        },
        { once: true }
      );
      if (img.complete && img.naturalWidth === 0) {
        var wrap = img.closest(".ph-img");
        if (wrap) wrap.classList.add("ph-fallback");
      }
    });
  }

  /* ---------- Scroll reveal (single, restrained) ---------- */
  function setupScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ---------- Back to top ---------- */
  function setupBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    window.addEventListener(
      "scroll",
      function () {
        if (window.scrollY > 600) btn.classList.add("show");
        else btn.classList.remove("show");
      },
      { passive: true }
    );
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Gallery category filter ---------- */
  function setupGalleryFilter() {
    var filterBar = document.querySelector(".gallery-filters");
    var grid = document.querySelector(".gallery-grid");
    if (!filterBar || !grid) return;
    var items = grid.querySelectorAll(".gallery-item");

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      filterBar
        .querySelectorAll("button")
        .forEach(function (b) {
          b.classList.remove("active");
        });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-filter");
      items.forEach(function (item) {
        var show = cat === "all" || item.getAttribute("data-category") === cat;
        item.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- Lightbox ---------- */
  function setupLightbox() {
    var grid = document.querySelector(".gallery-grid");
    var lightbox = document.querySelector(".lightbox");
    if (!grid || !lightbox) return;

    var lbImg = lightbox.querySelector("img");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");
    var visibleItems = [];
    var currentIndex = 0;

    function collectVisible() {
      visibleItems = Array.prototype.filter.call(
        grid.querySelectorAll(".gallery-item"),
        function (item) {
          return item.style.display !== "none";
        }
      );
    }

    function show(index) {
      collectVisible();
      if (!visibleItems.length) return;
      currentIndex = (index + visibleItems.length) % visibleItems.length;
      var img = visibleItems[currentIndex].querySelector("img");
      lbImg.src = img.getAttribute("src");
      lbImg.alt = img.getAttribute("alt") || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    grid.addEventListener("click", function (e) {
      var item = e.target.closest(".gallery-item");
      if (!item) return;
      collectVisible();
      var index = visibleItems.indexOf(item);
      show(index === -1 ? 0 : index);
    });

    closeBtn && closeBtn.addEventListener("click", close);
    nextBtn && nextBtn.addEventListener("click", function () {
      show(currentIndex + 1);
    });
    prevBtn && prevBtn.addEventListener("click", function () {
      show(currentIndex - 1);
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(currentIndex + 1);
      if (e.key === "ArrowLeft") show(currentIndex - 1);
    });
  }

  /* ---------- Footer year ---------- */
  function setupYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
