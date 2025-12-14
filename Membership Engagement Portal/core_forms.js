(function () {
  const VERSION = "multistep-1.0.0";
  window.DLBH_CORE_FORMS_VERSION = VERSION;

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

    // Prevent Enter from submitting the form early
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    // Navigation
    form.addEventListener("click", (e) => {
      const next = e.target.closest(".dlbh-next");
      const prev = e.target.closest(".dlbh-prev");

      if (prev) {
        e.preventDefault();
        show(pos - 1);
        return;
      }

      if (next) {
        e.preventDefault();
        show(pos + 1);
      }
    });

    show(0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
