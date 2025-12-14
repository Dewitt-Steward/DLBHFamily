(function () {
  // Geography source: CDN first, raw fallback
  const GEO_URLS = [
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json",
    "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json"
  ];

  const VERSION = "zipgate-1.0.1";
  window.DLBH_CORE_FORMS_VERSION = VERSION;

  let zipSetPromise = null;

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

  // Robust: find ZIPs anywhere in the JSON by scanning values for 5 digits
  function collectZipsDeep(value, set, depth = 0) {
    if (depth > 20 || value == null) return;

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
    // prevent double-init
    if (form.dataset.dlbhInit === "1") return;
    form.dataset.dlbhInit = "1";

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

    // Stop Enter from submitting the form (prevents ?zip_code=... refresh behavior)
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    // Step 1 pieces
    const step1 = form.querySelector('.dlbh-step[data-step-index="1"]') || steps[0];
    const zipInput = step1 ? step1.querySelector("#zip_code") : null;
    const step1NextBtn = step1 ? step1.querySelector(".dlbh-next") : null;
    const errEl = zipInput ? ensureZipErrorEl(zipInput) : null;

    async function validateZip() {
      if (!zipInput || !errEl || !step1NextBtn) return false;

      const raw = String(zipInput.value || "").trim();

      // blank -> disabled, no error
      if (!raw) {
        setBtnDisabled(step1NextBtn, true);
        errEl.textContent = "";
        return false;
      }

      const z = normalizeZip(raw);

      // not 5 digits yet -> disabled, no error
      if (!z) {
        setBtnDisabled(step1NextBtn, true);
        errEl.textContent = "";
        return false;
      }

      // load + validate
      try {
        errEl.textContent = "Checking Zip Code...";
        setBtnDisabled(step1NextBtn, true);

        const set = await loadZipSet();
        if (set.has(z)) {
          errEl.textContent = "";
          setBtnDisabled(step1NextBtn, false);

          // optional: copy into Step 2 if you added primary_zip_code
          const step2Zip = form.querySelector("#primary_zip_code");
          if (step2Zip && !step2Zip.value) step2Zip.value = z;

          return true;
        } else {
          errEl.textContent = "Invalid Zip Code.";
          setBtnDisabled(step1NextBtn, true);
          return false;
        }
      } catch (e) {
        errEl.textContent = "Zip lookup unavailable. Please refresh and try again.";
        setBtnDisabled(step1NextBtn, true);
        return false;
      }
    }

    // Start: disable Next on Step 1 until valid
    if (step1NextBtn) setBtnDisabled(step1NextBtn, true);
    if (zipInput) {
      zipInput.addEventListener("input", () => validateZip());
      zipInput.addEventListener("blur", () => validateZip());
      validateZip();
    }

    // ONE click handler controls navigation (this is the key fix)
    form.addEventListener("click", async (e) => {
      const next = e.target.closest(".dlbh-next");
      const prev = e.target.closest(".dlbh-prev");

      if (prev) {
        e.preventDefault();
        show(pos - 1);
        return;
      }

      if (next) {
        e.preventDefault();

        const currentStep = steps[pos];
        const stepIndex = String(currentStep?.getAttribute("data-step-index") || "");

        // Gate Step 1
        if (stepIndex === "1") {
          const ok = await validateZip();
          if (!ok) return; // stay on step 1
        }

        show(pos + 1);
      }
    });

    show(0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
