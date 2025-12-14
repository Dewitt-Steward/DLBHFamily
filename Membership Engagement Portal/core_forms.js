(function () {
  const GEO_URL =
    "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Geography.json";

  const CORE_FORMS_VERSION = "zip-gate-1.0.0";
  // Uncomment for a quick sanity check in console:
  // console.log("DLBH core_forms loaded:", CORE_FORMS_VERSION);

  let zipSetPromise = null;

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
      const rows = await res.json(); // expected array

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

  function attachZipGate(form) {
    const step1 =
      form.querySelector('.dlbh-step[data-step-index="1"]') ||
      form.querySelector(".dlbh-step");

    if (!step1) return;

    // Step 1 zip input and Next button
    const zipInput = step1.querySelector("#zip_code");
    const nextBtn = step1.querySelector(".dlbh-next");

    if (!zipInput || !nextBtn) return;

    const errEl = ensureZipErrorEl(zipInput);

    function setNext(enabled) {
      nextBtn.disabled = !enabled;
      nextBtn.setAttribute("aria-disabled", String(!enabled));
    }
    function setError(msg) {
      errEl.textContent = msg || "";
    }

    // Default: disabled until valid
    setNext(false);
    setError("");

    async function validate() {
      const raw = String(zipInput.value || "").trim();

      // blank = disabled, no error
      if (!raw) {
        setNext(false);
        setError("");
        return;
      }

      const z = normalizeZip(raw);

      // still typing (not 5 digits yet) = disabled, no error
      if (!z) {
        setNext(false);
        setError("");
        return;
      }

      try {
        const set = await loadZipSet();
        if (set.has(z)) {
          setNext(true);
          setError("");
        } else {
          setNext(false);
          setError("Invalid Zip Code.");
        }
      } catch (e) {
        setNext(false);
        setError("Invalid Zip Code.");
      }
    }

    zipInput.addEventListener("input", validate);
    zipInput.addEventListener("blur", validate);

    // Prevent Enter from submitting and adding query params to the URL
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
        e.preventDefault();
      }
    });

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
    attachZipGate(form);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
