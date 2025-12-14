(function () {
  // Geography source (raw + CDN fallback)
  const GEO_URLS = [
    "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json",
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json"
  ];

  let zipSetPromise = null;

  function normalizeZip(input) {
    const s = String(input || "").trim();
    if (!s) return "";
    // allow 12345 or 12345-6789 or 123456789; normalize to first 5
    const m = s.match(/(\d{5})/);
    return m ? m[1] : "";
  }

  function collectZips(value, set, depth = 0) {
    if (depth > 10) return;

    if (typeof value === "string" || typeof value === "number") {
      const z = normalizeZip(value);
      if (z) set.add(z);
      return;
    }

    if (Array.isArray(value)) {
      for (const v of value) collectZips(v, set, depth + 1);
      return;
    }

    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        // If key looks like zip, prefer extracting from it directly
        if (/zip|postal/i.test(k)) {
          const z = normalizeZip(v);
          if (z) set.add(z);
        }
        collectZips(v, set, depth + 1);
      }
    }
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  async function loadZipSet() {
    if (zipSetPromise) return zipSetPromise;

    zipSetPromise = (async () => {
      let lastErr = null;

      for (const url of GEO_URLS) {
        try {
          const data = await fetchJson(url);
          const set = new Set();
          collectZips(data, set);
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
    const fieldWrap = zipInput.closest(".dlbh-field") || zipInput.parentElement;
    let err = fieldWrap ? fieldWrap.querySelector(".dlbh-error[data-zip-error]") : null;

    if (!err) {
      err = document.createElement("div");
      err.className = "dlbh-error";
      err.setAttribute("data-zip-error", "1");
      err.setAttribute("role", "alert");
      err.textContent = "";
      if (fieldWrap) fieldWrap.appendChild(err);
    }

    return err;
  }

  function attachZipValidation(form) {
    // Step 1 is either explicitly marked or the first step section
    const step1 =
      form.querySelector('.dlbh-step[data-step-index="1"]') ||
      form.querySelector(".dlbh-step");

    if (!step1) return;

    const zipInput =
      step1.querySelector("#zip_code") || form.querySelector("#zip_code");
    const nextBtn = step1.querySelector(".dlbh-next");

    if (!zipInput || !nextBtn) return;

    const errEl = ensureZipErrorEl(zipInput);

    function setError(msg) {
      errEl.textContent = msg || "";
    }

    function setNextEnabled(enabled) {
      nextBtn.disabled = !enabled;
      nextBtn.setAttribute("aria-disabled", String(!enabled));
    }

    // Start disabled until we validate
    setNextEnabled(false);
    setError("");

    async function validateZip() {
      const raw = String(zipInput.value || "").trim();

      // blank zip = disabled, no error
      if (!raw) {
        setNextEnabled(false);
        setError("");
        return;
      }

      const z = normalizeZip(raw);

      // if user is still typing and we don't even have 5 digits yet: disabled, no error
      if (!z) {
        setNextEnabled(false);
        setError("");
        return;
      }

      // must exist in Geography.json
      try {
        const set = await loadZipSet();
        if (set.has(z)) {
          setNextEnabled(true);
          setError("");
        } else {
          setNextEnabled(false);
          setError("Invalid Zip Code.");
        }
      } catch (e) {
        // If geography fails to load, keep Next disabled (safer)
        setNextEnabled(false);
        setError("Invalid Zip Code.");
      }
    }

    // Validate as they type + on blur
    zipInput.addEventListener("input", validateZip);
    zipInput.addEventListener("blur", validateZip);

    // Run once on load (in case browser autofills)
    validateZip();
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

    form.addEventListener("click", (e) => {
      if (e.target.closest(".dlbh-next")) { e.preventDefault(); show(pos + 1); }
      if (e.target.closest(".dlbh-prev")) { e.preventDefault(); show(pos - 1); }
    });

    show(0);

    // Step 1 ZIP gate
    attachZipValidation(form);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll('form[data-dlbh-multistep="1"]')
      .forEach(initMultistep);
  });
})();
