(function () {
  // ZIP source (CDN first, raw fallback)
  const GEO_URLS = [
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json",
    "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json"
  ];

  let zipSetPromise = null;
  let step1ZipIsValid = false;

  function normalizeZip(input) {
    const s = String(input || "").trim();
    const m = s.match(/(\d{5})/);
    return m ? m[1] : "";
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function loadZipSet() {
    if (zipSetPromise) return zipSetPromise;

    zipSetPromise = (async () => {
      let lastErr = null;

      for (const url of GEO_URLS) {
        try {
          const rows = await fetchJson(url); // expected array of objects
          const set = new Set();

          if (Array.isArray(rows)) {
            for (const r of rows) {
              const z = normalizeZip(r && (r["Zip Code"] ?? r.zip_code ?? r.zip));
              if (z) set.add(z);
            }
          }

          if (set.size === 0) throw new Error("No ZIPs found in Geography data");
          return set;
        } catch (e) {
          lastErr = e;
        }
      }

      throw lastErr || new Error("Unable to load ZIP data");
    })();

    return zipSetPromise;
  }

  function getStep1(form) {
    return (
      form.querySelector('.dlbh-step[data-step-index="1"]') ||
      form.querySelector(".dlbh-step")
    );
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

  function attachZipGate(form, steps, getPos) {
    const step1 = getStep1(form);
    if (!step1) return;

    const zipInput = step1.querySelector("#zip_code");
    const nextBtn  = step1.querySelector(".dlbh-next"); // Step 1 button
    if (!zipInput || !nextBtn) return;

    const errEl = ensureZipErrorEl(zipInput);

    step1ZipIsValid = false;
    setBtnDisabled(nextBtn, true);
    errEl.textContent = "";

    async function validate() {
      const raw = String(zipInput.value || "").trim();

      // blank ZIP -> disable, no error
      if (!raw) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      const z = normalizeZip(raw);

      // not 5 digits yet -> disable, no error
      if (!z) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      // check dataset
      try {
        // optional status while loading
        errEl.textContent = "Checking Zip Code...";

        const set = await loadZipSet();
        if (set.has(z)) {
          step1ZipIsValid = true;
          setBtnDisabled(nextBtn, false);
          errEl.textContent = "";
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

    zipInput.addEventListener("input", validate);
    zipInput.addEventListener("blur", validate);

    // hard gate: block Next click on Step 1 unless valid
    form.addEventListener("click", (e) => {
      const next = e.target.closest(".dlbh-next");
      if (!next) return;

      const currentStep = steps[getPos()];
      const stepIndex = currentStep?.getAttribute("data-step-index");

      if (String(stepIndex) === "1" && !step1ZipIsValid) {
        e.preventDefault();
        validate(); // force message
      }
    }, true);

    // run once (autofill)
    validate();
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
    attachZipGate(form, steps, () => pos);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
