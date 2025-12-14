(function () {
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
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll('form[data-dlbh-multistep="1"]')
      .forEach(initMultistep);
  });
})();
