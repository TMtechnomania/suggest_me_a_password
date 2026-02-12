/**
 * popup.js
 * Logic for the extension popup UI.
 * Uses generator.js functions (loaded via <script> in popup.html).
 * No network calls. All local.
 */

(function () {
	"use strict";

	// State
	let currentPassword = "";
	let prefs = {
		length: 16,
		uppercase: true,
		lowercase: true,
		digits: true,
		symbols: true,
		mode: "standard",
	};

	// DOM refs
	const passwordText = document.getElementById("passwordText");
	const strengthFill = document.getElementById("strengthFill");
	const strengthLabel = document.getElementById("strengthLabel");
	const btnCopy = document.getElementById("btnCopy");
	const btnRefresh = document.getElementById("btnRefresh");
	const modeStandard = document.getElementById("modeStandard");
	const modeMemorable = document.getElementById("modeMemorable");
	const sliderLength = document.getElementById("sliderLength");
	const sliderLengthVal = document.getElementById("sliderLengthVal");
	const toggleUpper = document.getElementById("toggleUpper");
	const toggleLower = document.getElementById("toggleLower");
	const toggleDigits = document.getElementById("toggleDigits");
	const toggleSymbols = document.getElementById("toggleSymbols");
	const optionsSection = document.getElementById("optionsSection");

	// Load saved preferences
	chrome.storage.local.get("passwordPrefs", (result) => {
		if (result.passwordPrefs) {
			prefs = { ...prefs, ...result.passwordPrefs };
		}
		applyPrefsToUI();
		refresh();
	});

	function savePrefs() {
		chrome.storage.local.set({ passwordPrefs: prefs });
	}

	function applyPrefsToUI() {
		sliderLength.value = prefs.length;
		sliderLengthVal.value = prefs.length;
		toggleUpper.checked = prefs.uppercase;
		toggleLower.checked = prefs.lowercase;
		toggleDigits.checked = prefs.digits;
		toggleSymbols.checked = prefs.symbols;

		if (prefs.mode === "memorable") {
			modeMemorable.classList.add("active");
			modeStandard.classList.remove("active");
			optionsSection.style.display = "none";
		} else {
			modeStandard.classList.add("active");
			modeMemorable.classList.remove("active");
			optionsSection.style.display = "";
		}
	}

	function refresh() {
		if (prefs.mode === "memorable") {
			currentPassword = generateMemorablePassword();
		} else {
			currentPassword = generateStandardPassword({
				length: prefs.length,
				uppercase: prefs.uppercase,
				lowercase: prefs.lowercase,
				digits: prefs.digits,
				symbols: prefs.symbols,
			});
		}
		passwordText.textContent = currentPassword;

		const strength = calculateStrength(currentPassword);
		strengthFill.style.width = ((strength.score + 1) / 5) * 100 + "%";
		strengthFill.style.background = strength.color;
		strengthLabel.textContent = strength.label;
		strengthLabel.style.color = strength.color;
	}

	// Events
	modeStandard.addEventListener("click", () => {
		prefs.mode = "standard";
		applyPrefsToUI();
		refresh();
		savePrefs();
	});

	modeMemorable.addEventListener("click", () => {
		prefs.mode = "memorable";
		applyPrefsToUI();
		refresh();
		savePrefs();
	});

	sliderLength.addEventListener("input", () => {
		prefs.length = parseInt(sliderLength.value);
		sliderLengthVal.value = prefs.length;
		refresh();
		savePrefs();
	});

	sliderLengthVal.addEventListener("change", () => {
		let val = parseInt(sliderLengthVal.value);
		if (isNaN(val)) val = 16;
		val = Math.max(8, Math.min(32, val));
		prefs.length = val;
		sliderLength.value = val;
		sliderLengthVal.value = val;
		refresh();
		savePrefs();
	});

	toggleUpper.addEventListener("change", () => {
		prefs.uppercase = toggleUpper.checked;
		refresh();
		savePrefs();
	});
	toggleLower.addEventListener("change", () => {
		prefs.lowercase = toggleLower.checked;
		refresh();
		savePrefs();
	});
	toggleDigits.addEventListener("change", () => {
		prefs.digits = toggleDigits.checked;
		refresh();
		savePrefs();
	});
	toggleSymbols.addEventListener("change", () => {
		prefs.symbols = toggleSymbols.checked;
		refresh();
		savePrefs();
	});

	btnCopy.addEventListener("click", () => {
		navigator.clipboard.writeText(currentPassword).then(() => {
			const originalHTML = btnCopy.innerHTML;
			btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg> Copied!`;
			setTimeout(() => {
				btnCopy.innerHTML = originalHTML;
			}, 1500);
		});
	});

	btnRefresh.addEventListener("click", () => {
		const icon = btnRefresh.querySelector("svg");
		if (icon) {
			icon.style.transform = "rotate(360deg)";
			icon.style.transition = "transform 0.3s";
			setTimeout(() => {
				icon.style.transform = "";
				icon.style.transition = "";
			}, 350);
		}
		refresh();
	});
})();
