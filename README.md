# 🕹️ WebNES: Retro Emulator

> *"Bringing you back to your old memories of Retro-Games."*

**WebNES** is a high-performance, browser-based NES emulator designed to bridge the gap between retro nostalgia and modern web standards. Built with a "Zero-Trace" local architecture, it provides a seamless, legally compliant, and private way to experience 8-bit classics across desktop and mobile devices.

WebNES Preview
<img width="927" height="533" alt="image" src="https://github.com/user-attachments/assets/37ae62e0-4908-4e58-bddb-f0241f9270ae" />

---

## 🚀 The Product Vision
In a market saturated with cluttered, legally-grey ROM sites, WebNES was built from a Product Management perspective to solve three specific user friction points:

1. **The "Cold Start" Problem:** Most web emulators land users on a blank screen, causing immediate churn. WebNES solves this by featuring a curated library of open-source Homebrew titles for instant, one-click play.
2. **Legal & IP Risk Mitigation:** To protect both the user and the platform, WebNES uses a **BYOR (Bring Your Own ROM)** model. Game files are processed entirely locally within the browser's memory and are never uploaded to a server, ensuring zero legal liability and total privacy.
3. **Ergonomic Accessibility:** Recognizing that modern gamers play across multiple devices, WebNES supports the native **HTML5 Gamepad API** for physical controllers, alongside a custom **Mobile-First Virtual Pad** featuring an innovative "Lefty/Righty" layout toggle for ergonomic inclusivity.

---

## ✨ Key Features

* **📺 CRT Aesthetic:** A custom CSS-driven scanline overlay and pixel-perfect aspect ratio scaling to mimic original hardware on modern monitors.
* **💾 State Management:** Save and load game states as local `.json` files. Never lose your progress, completely independent of cloud storage.
* **🔊 High-Fidelity Audio:** Integrated Web Audio API with gain-node volume control for crisp, synthesized 8-bit sound generation.
* **📱 Mobile Optimized:** Fully responsive UI with a dedicated touch-control matrix that prevents multi-touch zooming and supports dominant-hand swapping.
* **🔎 Discovery Engine:** An integrated search utility to help users legally source their favorite `.nes` files from the web.

---

## 🛠️ Tech Stack

* **Core Engine:** [JSNES](https://github.com/bfirsh/jsnes) (JavaScript NES Emulator)
* **Frontend:** HTML5 Canvas, CSS3 (Flexbox/Grid), Vanilla JavaScript
* **Web APIs:** Web Audio API, Gamepad API, Fullscreen API, FileReader API
* **Deployment:** GitHub Pages (Zero-cost, static client-side hosting)
*  **Tooling:** Prompt-engineered via GitHub Copilot / Gemini for accelerated execution.

---

## 📖 How to Play

**Play it live here:** `[Insert your GitHub Pages link here, e.g., https://yourusername.github.io/webnes-emulator/]`

1. **Instant Play:** Click any "Arcade Classic" in the sidebar to boot an open-source game immediately.
2. **Bring Your Own ROM:** Click "Upload .NES File" to load your own legally sourced game.
3. **Hardware Controllers:** Plug in any USB or Bluetooth gamepad (Xbox, PlayStation, etc.) and press any button to pair automatically.

### Default Keyboard Controls (Player 1)
| Action | Key |
| :--- | :--- |
| **D-Pad (Move)** | Arrow Keys |
| **A Button (Jump)** | `X` |
| **B Button (Action)**| `Z` |
| **Start** | `Enter` |
| **Select** | `Right Shift` |

*(Player 2 controls are mapped to WASD, C, V, 1, and 2).*

---

## 🛡️ Legal & Privacy Notice
WebNES is a privacy-first utility project. 
* **No Data Collection:** Your ROMs stay on your machine. We do not track, upload, or store what you play.
* **IP Compliance:** This repository contains no copyrighted ROMs. All featured titles are open-source Homebrew games utilized to demonstrate engine capability.

---

## 👨‍💻 Built By

**Srijen Gupta** *Product-Minded Engineer focused on building fast, user-centric utility tools.*
