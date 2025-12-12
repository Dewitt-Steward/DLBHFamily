console.log("MEP Engine loaded");

document.addEventListener("DOMContentLoaded", async function () {

    const container = document.getElementById("mep");
    if (!container) return;

    /* -------------------------------
       CONFIG + STYLES
    -------------------------------- */
    const CONFIG_URL =
        "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Configuration.json";

    const STYLES_URL =
        "https://raw.githubusercontent.com/Dewitt-Steward/DLBHFamily/refs/heads/main/Membership%20Engagement%20Portal/Styles.json";

    const [config, styles] = await Promise.all([
        fetch(CONFIG_URL).then(r => r.json()),
        fetch(STYLES_URL).then(r => r.json())
    ]);

    injectStyles(styles);

    let currentScreenIndex = 0;
    let formData = {};

    /* -------------------------------
       STYLE INJECTION
    -------------------------------- */
    function injectStyles(s) {

        const css = `
        .mep-card {
            background: ${s.container.background};
            max-width: ${s.container.max_width};
            padding: ${s.container.padding};
            margin: ${s.container.margin};
            border-radius: ${s.container.border_radius};
            box-shadow: ${s.container.shadow};
            border: 1px solid ${s.container.border_color};
        }

        .mep-title {
            font-size: ${s.title.font_size};
            font-weight: ${s.title.font_weight};
            color: ${s.title.color};
            margin-bottom: ${s.title.margin_bottom};
            text-align: center;
        }

        .mep-label {
            font-weight: ${s.label.font_weight};
            color: ${s.label.color};
            margin-bottom: ${s.label.margin_bottom};
            display: block;
        }

        .mep-input,
        .mep-select {
            width: ${s.input.width};
            padding: ${s.input.padding};
            font-size: ${s.input.font_size};
            margin-bottom: ${s.input.margin_bottom};
            background: ${s.input.background};
            border-radius: ${s.input.border_radius};
            border: 1px solid ${s.input.border_color};
        }

        .mep-input:focus,
        .mep-select:focus {
            outline: none;
            border-color: ${s.input.focus_border_color};
            box-shadow: ${s.input.focus_shadow};
        }

        .mep-button {
            background: ${s.button.background};
            color: ${s.button.color};
            border-radius: ${s.button.border_radius};
            padding: ${s.button.padding};
            font-size: ${s.button.font_size};
            font-weight: ${s.button.font_weight};
            border: none;
            cursor: pointer;
        }

        .mep-button:hover {
            background: ${s.button.hover_background};
        }

        .mep-button:disabled {
            background: ${s.button.disabled_background};
            cursor: not-allowed;
        }

        .mep-error {
            color: ${s.error.color};
            font-weight: ${s.error.font_weight};
        }
        `;

        const styleTag = document.createElement("style");
        styleTag.id = "mep-runtime-styles";
        styleTag.innerHTML = css;
        document.head.appendChild(styleTag);
    }

    /* -------------------------------
       FIELD RENDERING
    -------------------------------- */
    function renderField(field, prefix = "") {
        const id = prefix ? `${prefix}_${field.id}` : field.id;

        if (field.display_only) {
            return `
                <div class="u-mB4">
                    <span class="mep-label">${field.label}</span>
                    <div>${formData[field.id] || ""}</div>
                </div>
            `;
        }

        if (field.type === "select") {
            const options = (field.options || [])
                .map(o => `<option value="${o}">${o}</option>`)
                .join("");

            return `
                <div class="u-mB4">
                    <label class="mep-label">${field.label}</label>
                    <select id="${id}" class="mep-select">
                        <option value="">Select</option>
                        ${options}
                    </select>
                </div>
            `;
        }

        return `
            <div class="u-mB4">
                <label class="mep-label">${field.label}</label>
                <input type="${field.type}" id="${id}" class="mep-input">
            </div>
        `;
    }

    /* -------------------------------
       SCREEN RENDERING
    -------------------------------- */
    function renderScreen() {
        const screen = config.screens[currentScreenIndex];

        let html = `
            <div class="Container">
                <div class="mep-card">

                    <div class="mep-title">${screen.title}</div>
                    <p class="u-textCenter u-mB6">${screen.description || ""}</p>
        `;

        screen.sections.forEach(section => {

            if (section.visible_if) {
                const [k, v] = Object.entries(section.visible_if)[0];
                if (formData[k] !== v) return;
            }

            if (section.title) {
                html += `<h3 class="u-mB4">${section.title}</h3>`;
            }

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
        });

        html += `
            <div class="Grid Grid--alignCenter u-mT6">
                ${currentScreenIndex > 0
                    ? `<button id="mep-back" class="mep-button u-mR2">Back</button>`
                    : ""
                }
                ${currentScreenIndex < config.screens.length - 1
                    ? `<button id="mep-next" class="mep-button">Next</button>`
                    : ""
                }
            </div>

                </div>
            </div>
        `;

        container.innerHTML = html;
        bindEvents();
    }

    /* -------------------------------
       EVENTS
    -------------------------------- */
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
