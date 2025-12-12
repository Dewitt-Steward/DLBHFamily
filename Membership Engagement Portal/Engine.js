document.addEventListener("DOMContentLoaded", async function () {

    const CONFIG_URL =
        "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Configuration.json";

    const container = document.getElementById("mep");
    if (!container) return;

    const config = await fetch(CONFIG_URL).then(r => r.json());

    let currentScreenIndex = 0;
    let formData = {};

    function renderField(field, prefix = "") {
        const id = prefix ? `${prefix}_${field.id}` : field.id;

        if (field.display_only) {
            return `<div><strong>${field.label}:</strong> ${formData[field.id] || ""}</div>`;
        }

        if (field.type === "select") {
            const options = (field.options || [])
                .map(o => `<option value="${o}">${o}</option>`)
                .join("");
            return `
                <label>${field.label}</label>
                <select id="${id}">
                    <option value="">Select</option>
                    ${options}
                </select>
            `;
        }

        return `
            <label>${field.label}</label>
            <input type="${field.type}" id="${id}">
        `;
    }

    function renderScreen() {
        const screen = config.screens[currentScreenIndex];

        let html = `<h2>${screen.title}</h2><p>${screen.description || ""}</p>`;

        screen.sections.forEach(section => {

            if (section.visible_if) {
                const [k, v] = Object.entries(section.visible_if)[0];
                if (formData[k] !== v) return;
            }

            html += `<div><h3>${section.title || ""}</h3>`;

            if (section.repeat_for) {
                const count = parseInt(formData[section.repeat_for] || 0);
                for (let i = 0; i < count; i++) {
                    section.fields.forEach(f => {
                        html += renderField(f, `${section.repeat_for}${i}`);
                    });
                }
            } else {
                section.fields.forEach(f => {
                    html += renderField(f);
                });
            }

            html += `</div>`;
        });

        html += `
            <div>
                ${currentScreenIndex > 0 ? `<button id="mep-back">Back</button>` : ""}
                ${currentScreenIndex < config.screens.length - 1 ? `<button id="mep-next">Next</button>` : ""}
            </div>
        `;

        container.innerHTML = html;
        bindEvents();
    }

    function bindEvents() {
        container.querySelectorAll("input, select").forEach(el => {
            el.addEventListener("change", () => {
                formData[el.id] = el.value;
            });
        });

        const back = document.getElementById("mep-back");
        if (back) back.onclick = () => {
            currentScreenIndex--;
            renderScreen();
        };

        const next = document.getElementById("mep-next");
        if (next) next.onclick = () => {
            currentScreenIndex++;
            renderScreen();
        };
    }

    renderScreen();

});
