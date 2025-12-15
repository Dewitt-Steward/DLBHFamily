(function () {
  const VERSION = "multistep-1.0.1";
  window.DLBH_CORE_FORMS_VERSION = VERSION;

  function lockFormToTallestStep(form, steps) {
    let maxH = 0;

    steps.forEach((step) => {
      const wasHidden = step.hidden;

      // Temporarily unhide offscreen so we can measure without changing layout
      step.hidden = false;

      const prev = {
        position: step.style.position,
        left: step.style.left,
        top: step.style.top,
        width: step.style.width,
        visibility: step.style.visibility,
        pointerEvents: step.style.pointerEvents,
      };

      step.style.position = "absolute";
      step.style.left = "-9999px";
      step.style.top = "0";
      step.style.width = form.clientWidth ? form.clientWidth + "px" : "100%";
      step.style.visibility = "hidden";
      step.style.pointerEvents = "none";

      maxH = Math.max(maxH, step.scrollHeight);

      // Restore
      step.style.position = prev.position;
      step.style.left = prev.left;
      step.style.top = prev.top;
      step.style.width = prev.width;
      step.style.visibility = prev.visibility;
      step.style.pointerEvents = prev.pointerEvents;

      step.hidden = wasHidden;
    });

    // Lock the form so it doesn't resize between steps
    if (maxH > 0) form.style.minHeight = maxH + "px";
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

      if (indicator) {
        indicator.textContent = "Step " + (pos + 1) + " of " + steps.length;
      }

      // Keep if you like the auto-scroll; remove if it feels jumpy
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

    // Initial render
    show(0);

    // Lock height AFTER first paint so measurements are accurate
    requestAnimationFrame(() => lockFormToTallestStep(form, steps));

    // Re-lock on resize (mobile rotation / responsive changes)
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => lockFormToTallestStep(form, steps), 100);
    });

    // Optional: expose a hook if you add/remove fields dynamically (dependents, etc.)
    form.dlbhRelock = () => lockFormToTallestStep(form, steps);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[data-dlbh-multistep="1"]').forEach(initMultistep);
  });
})();
