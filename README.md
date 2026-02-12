# Suggest Me a Password

**Minimal, privacy-first password generator Chrome extension.**

Passwords are generated locally and never transmitted.

## Features

- 🔐 **Cryptographically secure** — uses `crypto.getRandomValues()`
- 🧠 **Memorable mode** — human-readable passwords (word-based)
- 🎯 **Auto-detect** — finds password fields automatically via `MutationObserver`
- 🎨 **Non-intrusive UI** — small icon inside password fields, popup on click
- 🛡️ **Shadow DOM isolation** — extension UI can't be affected by page CSS
- ⚡ **React/Vue compatible** — uses native input setter for framework compatibility
- 📋 **Copy & Auto-fill** — one-click copy or fill into password field
- ⚙️ **Customizable** — length, character sets, mode preferences saved locally
- 🚫 **Zero network calls** — no background script, no analytics, no tracking
- 🔓 **Minimal permissions** — only `activeTab` + `storage`

## Install (Development)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder

## Privacy

- Passwords are generated **100% locally** in the browser
- **No data** is ever sent to any server
- **No background scripts** — zero persistent processes
- **No keystroke logging** — never reads password field values
- Open source for full transparency

## Tech Stack

- Vanilla JavaScript (no frameworks, no build step)
- Manifest V3
- `crypto.getRandomValues()` for secure randomness
- `MutationObserver` for dynamic field detection
- Shadow DOM for UI isolation

## License

MIT
