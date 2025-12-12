<script>
(function () {

  let geographyCache = null;
  let resolvedGeography = null;

  function loadGeography() {
    if (geographyCache) return Promise.resolve(geographyCache);

    return fetch(
      "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json"
    )
      .then(res => res.json())
      .then(data => {
        geographyCache = data;
        return data;
      });
  }

  function resolveZip(zip) {
    if (!zip) return;

    loadGeography().then(data => {
      resolvedGeography = data.find(
        item => item["Zip Code"] === zip
      ) || null;
    });
  }

  function applyToContactInfo() {
    if (!resolvedGeography) return;

    setValue("zip_code", resolvedGeography["Zip Code"]);
    setValue("city", resolvedGeography["City"]);
    setValue("county", resolvedGeography["County"]);
    setValue("county_fips_code", resolvedGeography["County FIPS"]);
    setValue("state", resolvedGeography["State"]);
    setValue("state_fips_code", resolvedGeography["State FIPS"]);
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) {
      el.value = value;
    }
  }

  const originalNextStep = window.nextStep;

  window.nextStep = function () {
    const zipInput = document.getElementById("zip_code");

    if (zipInput && !resolvedGeography) {
      resolveZip(zipInput.value.trim());
    }

    originalNextStep();

    const steps = document.querySelectorAll("#enrollment-form .form-step");
    const visibleStep = Array.from(steps).find(
      s => s.style.display === "block"
    );

    if (visibleStep && visibleStep.dataset.step === "3") {
      applyToContactInfo();
    }
  };

})();
</script>
