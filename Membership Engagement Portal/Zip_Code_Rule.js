(function () {

  let geographyData = null;

  function loadGeography() {
    if (geographyData) return Promise.resolve(geographyData);

    return fetch("https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Geography.json")
      .then(res => res.json())
      .then(data => {
        geographyData = data;
        return data;
      });
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function applyZip(zip) {
    loadGeography().then(data => {
      const record = data.find(item => item.Zip === zip);
      if (!record) return;

      setValue("zip_code", record.Zip);
      setValue("city", record.City);
      setValue("county", record.County);
      setValue("county_fips_code", record.CountyFIPS);
      setValue("state", record.State);
      setValue("state_fips_code", record.StateFIPS);
    });
  }

  window.attachZipAutofill = function () {
    const zipInput = document.getElementById("zip_code");
    if (!zipInput) return;

    zipInput.addEventListener("blur", function () {
      const zip = zipInput.value.trim();
      if (zip) applyZip(zip);
    });
  };

})();
