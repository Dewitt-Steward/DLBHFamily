(function () {

  let areaCodeCache = null;

  function loadAreaCodes() {
    if (areaCodeCache) return Promise.resolve(areaCodeCache);

    return fetch(
      "https://cdn.jsdelivr.net/gh/Dewitt-Steward/DLBHFamily@main/Membership%20Engagement%20Portal/Area%20Codes.json"
    )
      .then(r => r.json())
      .then(data => {
        areaCodeCache = data;
        return data;
      });
  }

  function getNextButton() {
    return document.querySelector(
      '#enrollment-form .form-step[data-step="3"] button[onclick="nextStep()"]'
    );
  }

  function getErrorElement() {
    return document.getElementById("phone-error-message");
  }

  function showError(message) {
    let el = getErrorElement();

    if (!el) {
      el = document.createElement("span");
      el.id = "phone-error-message";
      document.getElementById("phone_number").parentNode.appendChild(el);
    }

    el.textContent = message;
  }

  function clearError() {
    const el = getErrorElement();
    if (el) el.textContent = "";
  }

  function validatePhone(phone) {
    const nextBtn = getNextButton();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10) {
      clearError();
      if (nextBtn) nextBtn.disabled = false;
      return;
    }

    const areaCode = digits.substring(0, 3);

    loadAreaCodes().then(data => {
      const match = data.find(row => row.code === areaCode);

      if (!match) {
        showError("Invalid Phone Number. Please try again.");
        if (nextBtn) nextBtn.disabled = true;
      } else {
        clearError();
        if (nextBtn) nextBtn.disabled = false;
      }
    });
  }

  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "phone_number") {
      validatePhone(e.target.value);
    }
  });

})();
