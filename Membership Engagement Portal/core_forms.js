(function () {
  const GEO_URL =
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json";

  // internal state
  let zipSetPromise = null;
  let step1ZipIsValid = false;

  function normalizeZip(input) {
    const s = String(input || "").trim();
    const m = s.match(/(\d{5})/);
    return m ? m[1] : "";
  }

  async function loadZipSet() {
    if (zipSetPromise) return zipSetPromise;

    zipSetPromise = (async () => {
      const res = await fetch(GEO_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Geography load failed: " + res.status);
      const rows = await res.json(); // expects array of objects

      const set = new Set();
      if (Array.isArray(rows)) {
        for (const r of rows) {
          const z = normalizeZip(r && (r["Zip Code"] ?? r.zip_code ?? r.zip));
          if (z) set.add(z);
        }
      }
      return set;
    })();

    return zipSetPromise;
  }

  function getStep1(form) {
    return (
      form.querySelector('.dlbh-step[data-step-index="1"]') ||
      form.querySelector(".dlbh-step")
    );
  }

  function getStep1ZipInput(form) {
    const step1 = getStep1(form);
    return step1 ? step1.querySelector("#zip_code") : null;
  }

  function getStep1NextBtn(form) {
    const step1 = getStep1(form);
    // Prefer the step’s own Next
    return step1 ? step1.querySelector(".dlbh-next") : null;
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

  function attachZipGate(form) {
    const zipInput = getStep1ZipInput(form);
    const nextBtn = getStep1NextBtn(form);

    if (!zipInput || !nextBtn) return;

    const errEl = ensureZipErrorEl(zipInput);

    // default: not valid until proven
    step1ZipIsValid = false;
    setBtnDisabled(nextBtn, true);
    errEl.textContent = "";

    async function validate() {
      const raw = String(zipInput.value || "").trim();

      // blank -> disabled, no error
      if (!raw) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      const z = normalizeZip(raw);

      // not 5 digits yet -> disabled, no error
      if (!z) {
        step1ZipIsValid = false;
        setBtnDisabled(nextBtn, true);
        errEl.textContent = "";
        return;
      }

      try {
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
        errEl.textContent = "Invalid Zip Code.";
      }
    }

    zipInput.addEventListener("input", validate);
    zipInput.addEventListener("blur", validate);

    // run once for autofill cases
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

    // IMPORTANT: gate the click itself on Step 1
    form.addEventListener("click", (e) => {
      const next = e.target.closest(".dlbh-next");
      const prev = e.target.closest(".dlbh-prev");

      if (next) {
        // If we're on step 1, block Next unless ZIP is valid
        const currentStep = steps[pos];
        const stepIndex = currentStep?.getAttribute("data-step-index");
        if (String(stepIndex) === "1" && !step1ZipIsValid) {
          e.preventDefault();
          // trigger validation message if user clicked Next prematurely
          const zipInput = getStep1ZipInput(form);
          if (zipInput) zipInput.dispatchEvent(new Event("blur", { bubbles: true }));
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
    attachZipGate(form);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
