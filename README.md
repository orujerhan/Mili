# Mili 🌸

A tiny, free and open-source desktop companion for Windows. Mili floats at the top of your
screen as a light glass capsule — a little dynamic island for your desktop: a live clock, Spotify
now-playing with synced lyrics, a pomodoro timer, daily tasks, a scratchpad, wellness reminders
and a mascot that reacts to what you are doing.

No accounts. No paid APIs. No telemetry. MIT licensed.

> Built by **Erhan Oruj** as a free project for everyone.

---

## Download

Grab the latest build from **[Releases](https://github.com/orujerhan/Mili/releases/latest)** —
no Node.js, no build tools, just download and run:

| File | What it is |
| --- | --- |
| `Mili-Setup-<version>.exe` | Installer: per-user install, desktop + start-menu shortcuts, no admin rights needed |
| `Mili-<version>-portable.exe` | Portable single file: run it straight from the download, nothing is installed |

Windows 10 or 11, x64. The binaries are not code-signed, so SmartScreen may show
“Windows protected your PC” — choose **More info → Run anyway**.

---

## Features

**Visual**
- Light, flat **dynamic island**: a floating white capsule with a soft drop shadow, frameless,
  transparent and without any window border around it.
- Floats at the top-center of the screen instead of docking to the taskbar.
- Behaves like a real dynamic island: it rests as a slim pill (clock + mascot) and expands into
  the full panel on hover or click, collapsing again when the pointer leaves, on the chevron or
  with `Esc`.
- Duolingo-flavoured UI: chunky rounded cards, 2px borders, pressable buttons with a soft bottom
  edge, and bold uppercase labels.
- One accent colour of your choice — six presets plus a colour picker in settings, applied
  instantly through CSS variables.
- Toggleable **Always on top** pin, minimize-to-tray, `Alt + M` to summon or hide.
- Animated **Mili** mascot with reactive moods:
  - `vibing` — bounces with floating music notes while Spotify plays.
  - `focused` — calm breathing glow during a pomodoro work session.
  - `sleepy` — drifting `Zzz` late at night or after being idle.
  - `happy` — confetti when a task or a pomodoro cycle completes.

**First-run welcome** — Mili introduces herself once, asks for your name, accent colour, pomodoro
lengths and water goal, then greets you by name ever after.

**Clock & greeting** — live clock with a 12h/24h toggle, full date, weekday and a time-of-day greeting.

**Spotify now playing + synced lyrics**
- Reads the current track from the **Windows media session** (GSMTC) — no Spotify Developer app,
  no API key, no OAuth.
- Shows artwork, title, artist, album, progress and play/pause/next/previous controls. The album
  cover also replaces the mascot in the collapsed pill while music plays.
- Fetches synced **LRC lyrics from [LRCLIB](https://lrclib.net)** (free and keyless) and highlights
  the active line in time with playback.

**Pomodoro** — configurable focus / short break / long break (default 25/5/15), long break every
Nth session, today's session counter, ambient tick + completion chime (synthesized, no audio
files) and Windows toast notifications.

**Wellness** — stretch reminders (default every 50 min), the 20-20-20 eye-care rule, and a daily
water tracker with a quick `+1` cup button, goal and counter that resets each day.

**Tasks** — quick add with Enter, priority tags (low / normal / high), checkboxes, progress bar,
clear-completed and local persistence.

**Scratchpad** — auto-saving note tab (markdown friendly), with word and character counts.

**System** — subtle CPU / RAM pills in the footer, sampled from `node:os` (no native modules).

**Self-updates** — an installed build asks GitHub for the next version on its own, downloads the
installer in the background and installs it on the next restart. **Settings → Updates** shows the
state and can start a check by hand; there is nothing to re-download by hand. A portable copy
cannot replace itself, so it says so and links to the release page instead.

**Theming** — the white surface stays, but active tabs, toggles and highlights follow a single
`settings.accent` hex colour (editable in **Settings → Appearance**).

---

## Requirements

- Windows 10 or 11
- Node.js 20+ (only for development)
- For media detection: any app that exposes a Windows media session (Spotify, the Spotify
  desktop app, or a browser playing music)

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts Vite (renderer) and Electron with hot reload.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run the app in development with HMR |
| `npm run typecheck` | TypeScript check for main, preload and renderer |
| `npm run build` | Build the production bundles into `out/` |
| `npm run dist` | Type check, build and package the Windows installer into `dist/` |
| `npm run assets` | Regenerate mascot sprites plus the app, tray and installer icons |

### Packaging

```bash
npm run dist
# → dist/Mili-Setup-1.1.6.exe
# → dist/Mili-1.1.6-portable.exe
# → dist/latest.yml, dist/Mili-Setup-1.1.6.exe.blockmap (read by electron-updater)
```

The installer is a standalone NSIS `.exe` (per-user install, optional custom directory,
desktop and start-menu shortcuts). No admin rights are required. The portable target is a single
self-contained `.exe` for people who do not want to install anything.

---

## Releases

`.github/workflows/build.yml` builds and packages Mili on `windows-latest` and attaches the
installer to a GitHub Release whenever a version tag is pushed:

```bash
git tag v1.1.6
git push origin v1.1.6
```

Alongside the two `.exe` files each release carries `latest.yml` and the installer's
`.exe.blockmap`. Those two are what **electron-updater** inside an installed copy reads to learn a
new version exists and to download only the changed bytes — keep them attached to the release, or
installed copies stop updating.

The workflow also runs on manual dispatch (installer uploaded as a build artifact only).
Link the download page straight at:

```
https://github.com/orujerhan/Mili/releases/latest/download/Mili-Setup-1.1.6.exe
```

Keep `version` in `package.json` in sync with the tag.

---

## Customising the mascot

The mascot slot is fully data-driven — drop transparent PNGs into `assets/`:

| File | When it is shown |
| --- | --- |
| `assets/mili_mascot.png` | default / idle |
| `assets/mili_vibing.png` | music is playing |
| `assets/mili_focused.png` | pomodoro work session running |
| `assets/mili_sleepy.png` | late night or idle |
| `assets/mili_happy.png` | task or pomodoro completed |

Any missing file falls back to `mili_mascot.png`, and if that is missing too the app renders a
built-in SVG bunny. The files are picked up automatically at build time — just replace them and
restart the dev server.

The shipped sprites were sliced from a 4×4 sticker sheet with:

```bash
npm run assets   # slices assets/mili_sheet.webp and regenerates the icons
```

`scripts/make-assets.mjs` flood-fills the white sheet background (preserving interior whites),
trims and resizes each pose to 512×512.

### Icons

Every icon surface — window, taskbar, tray, notifications and the installed `.exe` — is built
from the same bunny illustration in `assets/mili_icon_source.webp`:

```bash
node scripts/make-icon.mjs   # writes assets/icon.png, assets/tray.png, build/icon.ico
```

The icon also appears as the brand mark in the widget header. Replace the source image and rerun
the script to use your own artwork (`npm run assets` regenerates sprites and icons together).

---

## How it works

```
src/
├─ main/                  Electron main process
│  ├─ index.ts            window, tray, global shortcut, IPC, notifications
│  ├─ media.ts            supervises the PowerShell media bridge + artwork caching
│  ├─ artwork.ts          cover-art fallback via Deezer / iTunes
│  ├─ ps/mediaScript.ts   embedded WinRT/GSMTC script (poll + transport controls)
│  ├─ lyrics.ts           LRCLIB client (/api/get with /api/search fallback)
│  ├─ stats.ts            CPU / RAM sampler
│  └─ store.ts            debounced JSON persistence in userData
├─ preload/index.ts       contextBridge API (window.mili)
├─ renderer/              React + Tailwind UI
└─ shared/                types, defaults and the LRC parser
```

**Cover art.** Windows hands the artwork over as a WinRT stream, which the media bridge saves next
to the settings file; when the platform refuses to expose it (some Windows/PowerShell combinations
throw on the projected stream), the main process falls back to a keyless catalogue lookup
(Deezer, then iTunes) so the island still shows the album cover.

**Spotify without an API key.** A single long-lived Windows PowerShell process awaits the WinRT
`GlobalSystemMediaTransportControlsSessionManager`, picks the Spotify session when present and
prints one JSON snapshot per poll (~1.2 s). Transport commands are separate one-shot invocations.
Artwork is written once per track change and passed to the renderer as a data URL, so no local
file URL ever reaches the sandboxed renderer. The renderer interpolates the playback position
between polls so the progress bar and lyric highlight stay smooth.

**Lyrics.** The main process queries LRCLIB with track name, artist, album and duration, falling
back to a fuzzy search; results are parsed by a small LRC parser and cached per track.

**Persistence.** Settings, tasks, note, water count and pomodoro stats live in a single JSON file
(`%APPDATA%/Mili/mili-data.json`) written atomically with a 400 ms debounce.

### Privacy

Mili reaches the network only for the track you are playing: `https://lrclib.net` for lyrics and,
when Windows does not expose the album thumbnail, `https://api.deezer.com` / `https://itunes.apple.com`
to resolve the cover image. No account, no analytics, no telemetry; media state, settings and tasks
stay on your machine.

---

## Keyboard & tray

- `Alt + M` — show / hide Mili (global, works from any app)
- `Esc` — close the settings panel
- Tray icon — click to toggle, right-click for *Always on top*, *Launch at startup*, *Check for updates*
  (with the running version shown underneath) and *Quit*

Closing the window hides it to the tray; use **Quit Mili** from the tray menu to exit.

**Launch at startup** is applied through `app.setLoginItemSettings` and only takes effect in a
packaged build (Windows needs a real executable path). In development the toggle is remembered
but not registered.

---

## Troubleshooting

**Nothing shows up in “Now playing”.** Windows only exposes media sessions for apps that are
actually playing. Make sure the Spotify desktop app is running and a track is playing. Some
store-packaged apps take a moment to publish their session. Check the app's log for
`[mili]` warnings; a broken PowerShell/WinRT bridge is also reported inline in the player card.

**`Alt + M` does nothing.** Another app grabbed the shortcut (some IDEs and screenshot tools do).
Restart Mili or use the tray icon.

**Notifications do not appear in dev.** Windows toast notifications need a registered AppUserModelID;
they are reliable in the installed build.

---

## License

[MIT](LICENSE) © 2026 Erhan Oruj

Mascot artwork and the app are free to use, modify and share.

### Third-party notices

- **Lyrics** are streamed at runtime from [LRCLIB](https://lrclib.net); no lyric text is bundled
  with Mili. Lyrics themselves belong to their respective rights holders.
- **Album artwork** comes from the Windows media session. When Windows withholds it, Mili looks
  the cover up through the public [Deezer](https://www.deezer.com) and
  [iTunes](https://www.apple.com/itunes) catalogues and only displays it for the track you are
  playing. Artwork belongs to its respective rights holders.
- **Spotify** is a trademark of Spotify AB. Mili is an independent project and is not affiliated
  with, endorsed by or sponsored by Spotify, Deezer or Apple.
- Mili ships no advertising, no analytics and no user accounts.
