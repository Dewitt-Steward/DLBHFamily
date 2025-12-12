console.log("MEP Engine loaded");

document.addEventListener("DOMContentLoaded", async function () {

    const container = document.getElementById("mep");
    if (!container) return;

    const CONFIG_URL =
        "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Configuration.json";

    const config = await fetch(CONFIG_URL).then(r => r.json());

    let currentScreenIndex = 0;
    let formData = {};

    function renderField(field, prefix = "") {
        const id = prefix ? `${prefix}_${field.id}` : field.id;

        if (field.display_only) {
            return `
                <div class="u-mB2">
                    <strong>${field.label}:</strong>
                    <span>${formData[field.id] || ""}</span>
                </div>
            `;
        }

        if (field.type === "select") {
            const options = (field.options || [])
                .map(o => `<option value="${o}">${o}</option>`)
                .join("");

            return `
                <div class="u-mB4">
                    <label class="u-textLeft">${field.label}</label>
                    <select id="${id}" class="u-pA2 radius-small">
                        <option value="">Select</option>
                        ${options}
                    </select>
                </div>
            `;
        }

        return `
            <div class="u-mB4">
                <label class="u-textLeft">${field.label}</label>
                <input type="${field.type}" id="${id}" class="u-pA2 radius-small">
            </div>
        `;
    }

    function renderScreen() {
        const screen = config.screens[currentScreenIndex];

        let html = `
            <div class="Container u-pA4">

                <h2 class="u-textCenter u-mB2">${screen.title}</h2>
                <p class="u-textCenter u-mB6">${screen.description || ""}</p>
        `;

        screen.sections.forEach(section => {

            if (section.visible_if) {
                const [k, v] = Object.entries(section.visible_if)[0];
                if (formData[k] !== v) return;
            }

            html += `
                <div class="Grid u-mB6">
                    <div class="Grid-cell--center">
                        ${section.title ? `<h3 class="u-mB4">${section.title}</h3>` : ""}
            `;

            if (section.repeat_for) {
                const count = parseInt(formData[section.repeat_for] || 0);

                for (let i = 0; i < count; i++) {
                    html += `<div class="u-mB6">`;
                    section.fields.forEach(f => {
                        html += renderField(f, `${section.repeat_for}${i}`);
                    });
                    html += `</div>`;
                }

            } else {
                section.fields.forEach(f => {
                    html += renderField(f);
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `
            <div class="Grid Grid--alignCenter u-mT6">
                ${currentScreenIndex > 0
                    ? `<button id="mep-back" class="u-pA2 radius-small u-mR2">Back</button>`
                    : ""
                }
                ${currentScreenIndex < config.screens.length - 1
                    ? `<button id="mep-next" class="u-pA2 radius-small">Next</button>`
                    : ""
                }
            </div>

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
