/**
 * content.js
 * Content script for Suggest Me a Password.
 * Detects password fields, injects a suggestion icon, and shows the password popup.
 *
 * Privacy: No data leaves the page. No network calls. No keystroke logging.
 */

(function () {
	"use strict";

	// Avoid double-injection
	if (window.__suggestMeAPasswordInjected) return;
	window.__suggestMeAPasswordInjected = true;

	const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="14" height="9" rx="2"/><path d="M6 8V5a4 4 0 0 1 8 0v3"/><circle cx="10" cy="13" r="1.5"/><path d="M10 14.5V16"/></svg>`;

	const REFRESH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8a6 6 0 0 1 10.3-4.2"/><path d="M14 2v4h-4"/><path d="M14 8a6 6 0 0 1-10.3 4.2"/><path d="M2 14v-4h4"/></svg>`;

	const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11"/></svg>`;

	const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>`;

	const FILL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13l3-1 8-8-2-2-8 8z"/><path d="M10 4l2 2"/></svg>`;

	// State
	const processedFields = new WeakSet();
	let activePopup = null;
	let activeField = null;

	// --- Load user preferences from chrome.storage ---
	let userPrefs = {
		length: 16,
		uppercase: true,
		lowercase: true,
		digits: true,
		symbols: true,
		mode: "standard", // 'standard' or 'memorable'
	};

	if (
		typeof chrome !== "undefined" &&
		chrome.storage &&
		chrome.storage.local
	) {
		chrome.storage.local.get("passwordPrefs", (result) => {
			if (result.passwordPrefs) {
				userPrefs = { ...userPrefs, ...result.passwordPrefs };
			}
		});
	}

	function savePrefs() {
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.set({ passwordPrefs: userPrefs });
		}
	}

	// --- Password generation (inline, mirrors generator.js for content script isolation) ---
	const WORDLIST = [
		"apple",
		"arrow",
		"beach",
		"blade",
		"blaze",
		"bloom",
		"board",
		"brave",
		"brick",
		"bridge",
		"brush",
		"cabin",
		"candy",
		"cargo",
		"cedar",
		"chain",
		"charm",
		"chase",
		"chess",
		"chill",
		"cliff",
		"climb",
		"cloud",
		"cobra",
		"comet",
		"coral",
		"crane",
		"crisp",
		"crown",
		"crush",
		"curve",
		"dance",
		"delta",
		"drift",
		"eagle",
		"ember",
		"fable",
		"feast",
		"flame",
		"flash",
		"fleet",
		"flint",
		"flora",
		"forge",
		"frost",
		"glade",
		"gleam",
		"globe",
		"grain",
		"grape",
		"grove",
		"guard",
		"haven",
		"heart",
		"honey",
		"hound",
		"ivory",
		"jewel",
		"joint",
		"joker",
		"juice",
		"karma",
		"kite",
		"knack",
		"lance",
		"latch",
		"lemon",
		"light",
		"lunar",
		"magic",
		"mango",
		"maple",
		"marsh",
		"medal",
		"melon",
		"merge",
		"metal",
		"mirth",
		"mocha",
		"mount",
		"noble",
		"ocean",
		"olive",
		"orbit",
		"otter",
		"oxide",
		"panel",
		"pearl",
		"peach",
		"pilot",
		"pixel",
		"plank",
		"plaza",
		"plume",
		"polar",
		"prism",
		"pulse",
		"quake",
		"quest",
		"radar",
		"raven",
		"ridge",
		"river",
		"robin",
		"royal",
		"rumba",
		"sable",
		"scale",
		"scout",
		"shade",
		"shark",
		"shell",
		"shine",
		"sigma",
		"slate",
		"slide",
		"slope",
		"solar",
		"spark",
		"spice",
		"spike",
		"spine",
		"spoke",
		"spray",
		"stain",
		"stamp",
		"steel",
		"sting",
		"stone",
		"storm",
		"sugar",
		"surge",
		"swamp",
		"swift",
		"sword",
		"table",
		"thorn",
		"tiger",
		"toast",
		"topic",
		"tower",
		"trace",
		"trail",
		"train",
		"trout",
		"tulip",
		"ultra",
		"unity",
		"valve",
		"vault",
		"vigor",
		"viper",
		"vivid",
		"wagon",
		"waltz",
		"whale",
		"wheat",
		"willow",
		"witch",
		"xenon",
		"yacht",
		"yield",
		"zebra",
		"bliss",
		"brine",
		"dingo",
		"elbow",
		"fjord",
		"glyph",
		"haste",
		"index",
		"kayak",
		"lyric",
		"mural",
		"nexus",
		"onset",
		"plaid",
		"quirk",
		"resin",
		"swirl",
		"tempo",
		"umbra",
		"vodka",
		"whisk",
		"yeast",
		"zonal",
		"agile",
		"basil",
		"cider",
		"dwarf",
		"epoch",
		"flair",
		"ghost",
		"helix",
		"ionic",
		"jazzy",
	];

	const CHARSETS = {
		uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		lowercase: "abcdefghijklmnopqrstuvwxyz",
		digits: "0123456789",
		symbols: "!@#$%^&*_+-=?",
	};

	function secureRandomInt(max) {
		const arr = new Uint32Array(1);
		crypto.getRandomValues(arr);
		return arr[0] % max;
	}

	function generateStandard() {
		const { length, uppercase, lowercase, digits, symbols } = userPrefs;
		let charset = "";
		const required = [];

		if (uppercase) {
			charset += CHARSETS.uppercase;
			required.push(
				CHARSETS.uppercase[secureRandomInt(CHARSETS.uppercase.length)],
			);
		}
		if (lowercase) {
			charset += CHARSETS.lowercase;
			required.push(
				CHARSETS.lowercase[secureRandomInt(CHARSETS.lowercase.length)],
			);
		}
		if (digits) {
			charset += CHARSETS.digits;
			required.push(
				CHARSETS.digits[secureRandomInt(CHARSETS.digits.length)],
			);
		}
		if (symbols) {
			charset += CHARSETS.symbols;
			required.push(
				CHARSETS.symbols[secureRandomInt(CHARSETS.symbols.length)],
			);
		}

		if (!charset) charset = CHARSETS.lowercase + CHARSETS.digits;

		const remaining = Math.max(0, length - required.length);
		const chars = [...required];
		for (let i = 0; i < remaining; i++)
			chars.push(charset[secureRandomInt(charset.length)]);

		for (let i = chars.length - 1; i > 0; i--) {
			const j = secureRandomInt(i + 1);
			[chars[i], chars[j]] = [chars[j], chars[i]];
		}
		return chars.join("");
	}

	function generateMemorable() {
		const words = [];
		const used = new Set();
		for (let i = 0; i < 4; i++) {
			let idx;
			do {
				idx = secureRandomInt(WORDLIST.length);
			} while (used.has(idx));
			used.add(idx);
			let w = WORDLIST[idx];
			words.push(w.charAt(0).toUpperCase() + w.slice(1));
		}
		return words.join("-") + "-" + secureRandomInt(100);
	}

	function generatePassword() {
		return userPrefs.mode === "memorable" ?
				generateMemorable()
			:	generateStandard();
	}

	function calcStrength(pw) {
		let s = 0;
		if (pw.length >= 8) s++;
		if (pw.length >= 12) s++;
		if (pw.length >= 16) s++;
		if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
		if (/\d/.test(pw)) s++;
		if (/[^A-Za-z0-9]/.test(pw)) s++;
		s = Math.min(4, Math.floor((s * 4) / 6));
		const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
		const colors = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];
		return { score: s, label: labels[s], color: colors[s] };
	}

	// --- Shadow DOM based popup ---
	function createPopup(anchorField) {
		closePopup();
		activeField = anchorField;

		const host = document.createElement("div");
		host.className = "smap-popup-host";
		const shadow = host.attachShadow({ mode: "closed" });

		// Styles injected inside shadow DOM (isolated from page CSS)
		const style = document.createElement("style");
		style.textContent = `
      :host {
        all: initial;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        position: absolute;
        z-index: 2147483647;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .smap-popup {
        width: 340px;
        background: #131920;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        padding: 16px;
        color: #e0e0e0;
        animation: smap-fadeIn 0.2s ease-out;
      }

      @keyframes smap-fadeIn {
        from { opacity: 0; transform: translateY(-6px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .smap-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .smap-header-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex-shrink: 0;
      }
      .smap-title {
        font-size: 13px;
        font-weight: 600;
        color: #7ab8ff;
        letter-spacing: 0.3px;
      }
      .smap-close {
        margin-left: auto;
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 6px;
        transition: background 0.15s, color 0.15s;
      }
      .smap-close:hover {
        background: rgba(255,255,255,0.08);
        color: #fff;
      }

      .smap-mode-toggle {
        display: flex;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 3px;
        margin-bottom: 12px;
        gap: 2px;
      }
      .smap-mode-btn {
        flex: 1;
        padding: 6px 0;
        border: none;
        background: transparent;
        color: #999;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        font-family: inherit;
      }
      .smap-mode-btn.active {
        background: #0072ff;
        color: #fff;
        box-shadow: 0 2px 8px rgba(0,114,255,0.3);
      }
      .smap-mode-btn:hover:not(.active) {
        color: #ccc;
        background: rgba(255,255,255,0.05);
      }

      .smap-password-box {
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
        position: relative;
      }
      .smap-password {
        font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
        font-size: 14px;
        color: #f0f0f0;
        word-break: break-all;
        line-height: 1.5;
        user-select: all;
        letter-spacing: 0.5px;
      }

      .smap-strength {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .smap-strength-bar {
        flex: 1;
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 2px;
        overflow: hidden;
      }
      .smap-strength-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.3s ease, background 0.3s ease;
      }
      .smap-strength-label {
        font-size: 11px;
        font-weight: 500;
        min-width: 65px;
        text-align: right;
      }

      .smap-actions {
        display: flex;
        gap: 6px;
      }
      .smap-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 9px 10px;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .smap-btn svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .smap-btn-fill {
        background: linear-gradient(135deg, #0072ff, #005ed4);
        color: white;
        box-shadow: 0 2px 10px rgba(0,114,255,0.25);
      }
      .smap-btn-fill:hover {
        background: linear-gradient(135deg, #2e8aff, #0072ff);
        box-shadow: 0 4px 15px rgba(0,114,255,0.35);
        transform: translateY(-1px);
      }
      .smap-btn-ghost {
        background: rgba(255,255,255,0.06);
        color: #ccc;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .smap-btn-ghost:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
        transform: translateY(-1px);
      }

      .smap-options {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .smap-option-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 0;
      }
      .smap-option-label {
        font-size: 11.5px;
        color: #aaa;
      }
      .smap-slider-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .smap-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 130px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255,255,255,0.1);
        outline: none;
      }
      .smap-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #0072ff;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(0,114,255,0.4);
      }
      .smap-slider-value {
        font-size: 12px;
        font-weight: 600;
        color: #7ab8ff;
        min-width: 22px;
        text-align: center;
      }

      .smap-toggle {
        position: relative;
        width: 32px;
        height: 18px;
        cursor: pointer;
      }
      .smap-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .smap-toggle-slider {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255,255,255,0.12);
        border-radius: 9px;
        transition: background 0.2s;
      }
      .smap-toggle-slider::before {
        content: '';
        position: absolute;
        height: 14px;
        width: 14px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
      }
      .smap-toggle input:checked + .smap-toggle-slider {
        background: #0072ff;
      }
      .smap-toggle input:checked + .smap-toggle-slider::before {
        transform: translateX(14px);
      }

      .smap-footer {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.04);
        text-align: center;
      }
      .smap-footer-text {
        font-size: 10px;
        color: #555;
        font-style: italic;
      }
    `;
		shadow.appendChild(style);

		// Container
		const popup = document.createElement("div");
		popup.className = "smap-popup";

		// Header
		const header = document.createElement("div");
		header.className = "smap-header";
		const headerIcon = document.createElement("img");
		headerIcon.className = "smap-header-icon";
		headerIcon.src = chrome.runtime.getURL("icons/icon48.png");
		headerIcon.alt = "";
		header.appendChild(headerIcon);
		const titleSpan = document.createElement("span");
		titleSpan.className = "smap-title";
		titleSpan.textContent = "Suggest Me a Password";
		header.appendChild(titleSpan);
		const closeBtn = document.createElement("button");
		closeBtn.className = "smap-close";
		closeBtn.textContent = "×";
		closeBtn.addEventListener("click", closePopup);
		header.appendChild(closeBtn);
		popup.appendChild(header);

		// Mode toggle
		const modeToggle = document.createElement("div");
		modeToggle.className = "smap-mode-toggle";

		const standardBtn = document.createElement("button");
		standardBtn.className = `smap-mode-btn ${userPrefs.mode === "standard" ? "active" : ""}`;
		standardBtn.textContent = "🔐 Secure";

		const memorableBtn = document.createElement("button");
		memorableBtn.className = `smap-mode-btn ${userPrefs.mode === "memorable" ? "active" : ""}`;
		memorableBtn.textContent = "🧠 Memorable";

		modeToggle.appendChild(standardBtn);
		modeToggle.appendChild(memorableBtn);
		popup.appendChild(modeToggle);

		// Password display
		const passwordBox = document.createElement("div");
		passwordBox.className = "smap-password-box";
		const passwordText = document.createElement("div");
		passwordText.className = "smap-password";
		passwordBox.appendChild(passwordText);
		popup.appendChild(passwordBox);

		// Strength bar
		const strengthRow = document.createElement("div");
		strengthRow.className = "smap-strength";
		const strengthBar = document.createElement("div");
		strengthBar.className = "smap-strength-bar";
		const strengthFill = document.createElement("div");
		strengthFill.className = "smap-strength-fill";
		strengthBar.appendChild(strengthFill);
		strengthRow.appendChild(strengthBar);
		const strengthLabel = document.createElement("span");
		strengthLabel.className = "smap-strength-label";
		strengthRow.appendChild(strengthLabel);
		popup.appendChild(strengthRow);

		// Action buttons
		const actions = document.createElement("div");
		actions.className = "smap-actions";

		const fillBtn = document.createElement("button");
		fillBtn.className = "smap-btn smap-btn-fill";
		fillBtn.innerHTML = `${FILL_SVG} Use This`;

		const copyBtn = document.createElement("button");
		copyBtn.className = "smap-btn smap-btn-ghost";
		copyBtn.innerHTML = `${COPY_SVG} Copy`;

		const refreshBtn = document.createElement("button");
		refreshBtn.className = "smap-btn smap-btn-ghost";
		refreshBtn.innerHTML = `${REFRESH_SVG}`;
		refreshBtn.title = "Generate new";

		actions.appendChild(fillBtn);
		actions.appendChild(copyBtn);
		actions.appendChild(refreshBtn);
		popup.appendChild(actions);

		// Options section (only for standard mode)
		const optionsDiv = document.createElement("div");
		optionsDiv.className = "smap-options";

		function buildOptions() {
			optionsDiv.innerHTML = "";
			if (userPrefs.mode !== "standard") {
				optionsDiv.style.display = "none";
				return;
			}
			optionsDiv.style.display = "";

			// Length slider
			const lengthRow = document.createElement("div");
			lengthRow.className = "smap-option-row";
			const lengthLabel = document.createElement("span");
			lengthLabel.className = "smap-option-label";
			lengthLabel.textContent = "Length";
			const sliderRow = document.createElement("div");
			sliderRow.className = "smap-slider-row";
			const slider = document.createElement("input");
			slider.type = "range";
			slider.className = "smap-slider";
			slider.min = "8";
			slider.max = "32";
			slider.value = String(userPrefs.length);
			const sliderVal = document.createElement("span");
			sliderVal.className = "smap-slider-value";
			sliderVal.textContent = String(userPrefs.length);
			slider.addEventListener("input", () => {
				userPrefs.length = parseInt(slider.value);
				sliderVal.textContent = slider.value;
				refreshPassword();
				savePrefs();
			});
			sliderRow.appendChild(slider);
			sliderRow.appendChild(sliderVal);
			lengthRow.appendChild(lengthLabel);
			lengthRow.appendChild(sliderRow);
			optionsDiv.appendChild(lengthRow);

			// Toggles
			const toggles = [
				{ key: "uppercase", label: "A-Z" },
				{ key: "lowercase", label: "a-z" },
				{ key: "digits", label: "0-9" },
				{ key: "symbols", label: "!@#$" },
			];

			toggles.forEach((t) => {
				const row = document.createElement("div");
				row.className = "smap-option-row";
				const lbl = document.createElement("span");
				lbl.className = "smap-option-label";
				lbl.textContent = t.label;
				const toggle = document.createElement("label");
				toggle.className = "smap-toggle";
				const input = document.createElement("input");
				input.type = "checkbox";
				input.checked = userPrefs[t.key];
				const sldr = document.createElement("span");
				sldr.className = "smap-toggle-slider";
				input.addEventListener("change", () => {
					userPrefs[t.key] = input.checked;
					refreshPassword();
					savePrefs();
				});
				toggle.appendChild(input);
				toggle.appendChild(sldr);
				row.appendChild(lbl);
				row.appendChild(toggle);
				optionsDiv.appendChild(row);
			});
		}

		buildOptions();
		popup.appendChild(optionsDiv);

		// Footer
		const footer = document.createElement("div");
		footer.className = "smap-footer";
		const footerText = document.createElement("span");
		footerText.className = "smap-footer-text";
		footerText.textContent = "🔒 Generated locally. Never transmitted.";
		footer.appendChild(footerText);
		popup.appendChild(footer);

		shadow.appendChild(popup);

		// --- Behavior ---
		let currentPassword = "";

		function refreshPassword() {
			currentPassword = generatePassword();
			passwordText.textContent = currentPassword;
			const strength = calcStrength(currentPassword);
			strengthFill.style.width = ((strength.score + 1) / 5) * 100 + "%";
			strengthFill.style.background = strength.color;
			strengthLabel.textContent = strength.label;
			strengthLabel.style.color = strength.color;
		}

		standardBtn.addEventListener("click", () => {
			userPrefs.mode = "standard";
			standardBtn.classList.add("active");
			memorableBtn.classList.remove("active");
			buildOptions();
			refreshPassword();
			savePrefs();
		});

		memorableBtn.addEventListener("click", () => {
			userPrefs.mode = "memorable";
			memorableBtn.classList.add("active");
			standardBtn.classList.remove("active");
			buildOptions();
			refreshPassword();
			savePrefs();
		});

		fillBtn.addEventListener("click", () => {
			if (activeField) {
				// Set value via native input setter for React/Vue compatibility
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
					window.HTMLInputElement.prototype,
					"value",
				).set;
				nativeInputValueSetter.call(activeField, currentPassword);
				activeField.dispatchEvent(
					new Event("input", { bubbles: true }),
				);
				activeField.dispatchEvent(
					new Event("change", { bubbles: true }),
				);

				// Also try to fill any confirm password field
				const form = activeField.closest("form");
				if (form) {
					const allPwFields = form.querySelectorAll(
						'input[type="password"]',
					);
					allPwFields.forEach((field) => {
						if (field !== activeField) {
							nativeInputValueSetter.call(field, currentPassword);
							field.dispatchEvent(
								new Event("input", { bubbles: true }),
							);
							field.dispatchEvent(
								new Event("change", { bubbles: true }),
							);
						}
					});
				}
			}
			closePopup();
		});

		copyBtn.addEventListener("click", () => {
			navigator.clipboard.writeText(currentPassword).then(() => {
				copyBtn.innerHTML = `${CHECK_SVG} Copied!`;
				setTimeout(() => {
					copyBtn.innerHTML = `${COPY_SVG} Copy`;
				}, 1500);
			});
		});

		refreshBtn.addEventListener("click", () => {
			const icon = refreshBtn.querySelector("svg");
			if (icon) {
				icon.style.transform = "rotate(360deg)";
				icon.style.transition = "transform 0.3s";
				setTimeout(() => {
					icon.style.transform = "";
					icon.style.transition = "";
				}, 350);
			}
			refreshPassword();
		});

		// Generate initial password
		refreshPassword();

		// Position the popup
		document.body.appendChild(host);
		positionPopup(host, anchorField);
		activePopup = host;

		// Close on outside click
		setTimeout(() => {
			document.addEventListener("click", onOutsideClick, true);
			document.addEventListener("keydown", onEscapeKey, true);
		}, 50);
	}

	function positionPopup(host, anchor) {
		const rect = anchor.getBoundingClientRect();
		const scrollX = window.scrollX || window.pageXOffset;
		const scrollY = window.scrollY || window.pageYOffset;

		host.style.position = "absolute";

		let top = rect.bottom + scrollY + 6;
		let left = rect.left + scrollX;

		// Ensure it doesn't overflow right
		const popupWidth = 340;
		if (left + popupWidth > window.innerWidth + scrollX) {
			left = window.innerWidth + scrollX - popupWidth - 10;
		}

		// If it overflows bottom, show above
		const estimatedHeight = 400;
		if (top + estimatedHeight > window.innerHeight + scrollY) {
			top = rect.top + scrollY - estimatedHeight - 6;
		}

		host.style.top = Math.max(0, top) + "px";
		host.style.left = Math.max(0, left) + "px";
	}

	function closePopup() {
		if (activePopup) {
			activePopup.remove();
			activePopup = null;
			activeField = null;
			document.removeEventListener("click", onOutsideClick, true);
			document.removeEventListener("keydown", onEscapeKey, true);
		}
	}

	function onOutsideClick(e) {
		if (
			activePopup &&
			!activePopup.contains(e.target) &&
			!e.target.classList.contains("smap-trigger-icon")
		) {
			closePopup();
		}
	}

	function onEscapeKey(e) {
		if (e.key === "Escape") closePopup();
	}

	// --- Inject icon into password field ---
	function injectIcon(field) {
		if (processedFields.has(field)) return;
		processedFields.add(field);

		// Skip hidden/tiny fields
		const rect = field.getBoundingClientRect();
		if (rect.width < 50 || rect.height < 15) return;

		// Make wrapper if field is not positioned
		let wrapper = field.parentElement;
		const parentPos = window.getComputedStyle(wrapper).position;
		if (parentPos === "static") {
			wrapper.style.position = "relative";
		}

		const icon = document.createElement("div");
		icon.className = "smap-trigger-icon";
		const iconImg = document.createElement("img");
		iconImg.src = chrome.runtime.getURL("icons/icon16.png");
		iconImg.alt = "Suggest password";
		icon.appendChild(iconImg);
		icon.title = "Suggest a password";

		icon.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			createPopup(field);
		});

		// Position icon inside the field (right side, offset to avoid show/hide toggle)
		const fieldStyles = window.getComputedStyle(field);
		const fieldRect = field.getBoundingClientRect();
		const wrapperRect = wrapper.getBoundingClientRect();

		icon.style.position = "absolute";
		icon.style.top =
			fieldRect.top - wrapperRect.top + fieldRect.height / 2 - 11 + "px";
		icon.style.left = fieldRect.right - wrapperRect.left - 56 + "px";
		icon.style.zIndex = "2147483646";

		wrapper.appendChild(icon);

		// Add padding-right to field so text doesn't overlap icon
		const existingPR = parseInt(fieldStyles.paddingRight) || 0;
		field.style.paddingRight = Math.max(existingPR, 36) + "px";
	}

	// --- Detect password fields (including dynamically added) ---
	function scanForPasswordFields(root = document) {
		const fields = root.querySelectorAll('input[type="password"]');
		fields.forEach(injectIcon);

		// Also scan shadow DOMs
		root.querySelectorAll("*").forEach((el) => {
			if (el.shadowRoot) {
				scanForPasswordFields(el.shadowRoot);
			}
		});
	}

	// MutationObserver for dynamic content
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (
							node.matches &&
							node.matches('input[type="password"]')
						) {
							injectIcon(node);
						}
						if (node.querySelectorAll) {
							scanForPasswordFields(node);
						}
					}
				});
			}
			// Also watch for type attribute changes
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "type"
			) {
				const target = mutation.target;
				if (target.type === "password" && target.tagName === "INPUT") {
					injectIcon(target);
				}
			}
		}
	});

	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["type"],
	});

	// Initial scan
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () =>
			scanForPasswordFields(),
		);
	} else {
		scanForPasswordFields();
	}
})();
