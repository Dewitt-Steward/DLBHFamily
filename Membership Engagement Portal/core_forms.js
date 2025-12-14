(function () {
  // Always fetch Geography from CDN first (most reliable in browsers)
  const GEO_URLS = [
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json",
    "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json"
  ];

  const VERSION = "zipgate-1.0.0";
  window.DLBH_CORE_FORMS_VERSION = VERSION;

  let zipSetPromise = null;
  let step1ZipIsValid = false;

  function normalizeZip(input) {
    const s = String(input ?? "").trim();
    const m = s.match(/(\d{5})/);
    return m ? m[1] : "";
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  // Extract ZIPs from ANY JSON shape by scanning recursively for 5-digit patterns
  function collectZipsDeep(value, set, depth = 0) {
    if (depth > 20) return;

    if (value == null) return;

    if (typeof value === "string" || typeof value === "number") {
      const z = normalizeZip(value);
      if (z) set.add(z);
      return;
    }

    if (Array.isArray(value)) {
      for (const v of value) collectZipsDeep(v, set, depth + 1);
      return;
    }

    if (typeof value === "object") {
      for (const v of Object.values(value)) collectZipsDeep(v, set, depth + 1);
    }
  }

  async function loadZipSet() {
    if (zipSetPromise) return zipSetPromise;

    zipSetPromise = (async () => {
      let lastErr = null;

      for (const url of GEO_URLS) {
        try {
          const data = await fetchJson(url);
          const set = new Set();
          collectZipsDeep(data, set);

          if (set.size === 0) throw new Error("No ZIPs detected in Geography.json");
          return set;
        } catch (e) {
          lastErr = e;
        }
      }

      throw lastErr || new Error("Unable to load Geography.json");
    })();

    return zipSetPromise;
  }

  function ensureZipErrorEl(zipInput) {
    const wrap = zipInput.closest(".dlbh-field") || zipInput.parentElement;
    let err = wrap ? wrap.querySelector('.dlbh-error[data-zip-error="1"]') : null;

    if (!err) {
      err = document.createElement("div");
      err.className = "dlbh-error";
      err.setAttribute("data-zip-error", "1");
      err.setAttribute("role", "alert");
      err.textContent = "";
      if (wrap) wrap.appendChild(err);
    }
    return err;
  }

  function setBtnDisabled(btn, disabled) {
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.setAttribute("aria-disabled", String(!!disabled));
  }

  function initMultistep(form) {
    const steps = Array.from(form.querySelectorAll(".dlbh-step"));
    if (!steps.length) return;

    const indicator = form.querySelector(".dlbh-step-indicator");
    let pos = 0;

    function show(n) {
      pos = Math.max(0, Math.min(n, steps.length - 1));
      steps.forEach((s, i) => (s.hidden = i !== pos));
      if (indicator) indicator.textContent = "Step " + (pos + 1) + " of " + steps.length;
      steps[pos].scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Stop Enter from submitting the form and adding ?zip_code=... to the URL
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    const step1 = form.querySelector('.dlbh-step[data-step-index="1"]') || steps[0];
    const zipInput = step1 ? step1.querySelector("#zip_code") : null;
    const nextBtn = step1 ? step1.querySelector(".dlbh-next") : null;

    const errEl = zipInput ? ensureZipErrorEl(zipInput) : null;

    // Default: Next disabled until valid
    if (nextBtn) setBtnDisabled(nextBtn, true);

    async function validateZip() {
      if (!zipInput || !nextBtn || !errEl) return;

      const raw = String(zipInput.value || "").trim();

      if (!raw) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      const z = normalizeZip(raw);

      // still typing (not 5 digits yet)
      if (!z) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      try {
        errEl.textContent = "Checking Zip Code...";
        const set = await loadZipSet();

        if (set.has(z)) {
          step1ZipIsValid = true;
          setBtnDisabled(nextBtn, false);
          errEl.textContent = "";

          // OPTIONAL: copy ZIP into Step 2 if you created primary_zip_code
          const step2Zip = form.querySelector("#primary_zip_code");
          if (step2Zip && !step2Zip.value) step2Zip.value = z;

        } else {
          step1ZipIsValid = false;
          setBtnDisabled(nextBtn, true);
          errEl.textContent = "Invalid Zip Code.";
        }
      } catch (e) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "Zip lookup unavailable. Please refresh and try again.";
      }
    }

    if (zipInput) {
      zipInput.addEventListener("input", validateZip);
      zipInput.addEventListener("blur", validateZip);
      validateZip();
    }

    // Gate Next click on Step 1 no matter what
    form.addEventListener("click", (e) => {
      const next = e.target.closest(".dlbh-next");
      const prev = e.target.closest(".dlbh-prev");

      if (next) {
        const currentStep = steps[pos];
        const stepIndex = currentStep?.getAttribute("data-step-index");

        if (String(stepIndex) === "1" && !step1ZipIsValid) {
          e.preventDefault();
          validateZip(); // forces message
          return;
        }

        e.preventDefault();
        show(pos + 1);
      }

      if (prev) {
        e.preventDefault();
        show(pos - 1);
      }
    });

    show(0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
