# norns macOS Port Research

## Current State of norns on macOS

People have gotten parts working, but nobody has a complete turnkey solution.

### What works today

- **crone** (audio backend) compiles on macOS natively as a JACK client. There's an [official readme](https://github.com/monome/norns/blob/main/crone/readme-macos.md) for this. Needs JACK 2.0, Boost, liblo, and libsndfile built from source (Homebrew's version has linking issues with ogg/vorbis/FLAC).

- **Engine development** is possible today on macOS without matron using a [symlink-based workflow](https://gist.github.com/mimetaur/18346a71f1444ec8bea98a0c3c6fa365) that loads SuperCollider engines directly via symlinks into `~/Library/Application Support/SuperCollider/Extensions/`.

### What doesn't work yet

- **matron** (Lua host / the main application) depends on Linux-only libraries: `libudev`, `libevdev`, `libgpiod` for device detection and hardware input. The screen writes directly to a Linux framebuffer. The [norns-dev](https://github.com/winder/norns-dev) project identified that matron needs "a conditional flag to open an X11 surface instead of directly accessing the framebuffer."

- **Docker approach** ([norns-desktop](https://github.com/schollz/norns-desktop)) runs the real norns stack in a Linux container with screen served to a browser. Works on Linux amd64 only. macOS Docker can't do USB passthrough or low-latency audio.

## Existing Community Projects

| Project | Approach | Status |
|---------|----------|--------|
| [schollz/norns-desktop](https://github.com/schollz/norns-desktop) | Full norns stack in Docker, screen via HTTP, audio via Icecast | Linux amd64 only |
| [winder/norns-dev](https://github.com/winder/norns-dev) | Docker dev images (jackd + crone + matron + maiden) | WIP, macOS unsupported |
| [ldsrkn/Norns-Emulator](https://github.com/ldsrkn/Norns-Emulator) | Single HTML file, drag-and-drop Lua for visual preview | Screen preview only, no Lua execution |
| [midouest/norns-screen](https://github.com/midouest/norns-screen) | JS/C++ clone of screen.c using Cairo | Prototype, macOS only, screen module only |
| [schollz/norns.online](https://github.com/schollz/norns.online) | Streams real norns screen/audio to browser | Requires real norns hardware |
| [samaaron/supersonic](https://github.com/samaaron/supersonic) | scsynth compiled to WebAssembly AudioWorklet | Alpha, scsynth only (no sclang) |

## Three Realistic Paths

### 1. Compile matron for macOS with a platform abstraction layer (recommended)

The actual work is replacing ~4 things in matron's C code:

| Component | Linux | macOS replacement |
|-----------|-------|-------------------|
| Screen (framebuffer) | `/dev/fb0` via Cairo | SDL2 or Cocoa window with Cairo |
| Input (keys/encoders) | `libevdev` | SDL2 keyboard events or stdin |
| Device hotplug | `libudev` | Stub it out (or IOKit) |
| GPIO | `libgpiod` | Stub (no physical GPIO) |

The rest of matron (Lua 5.3 host, `weaver.c` with ~150 `_norns.*` bindings, nanomsg REPL, OSC) is portable C. Cairo compiles fine on macOS via Homebrew. Audio via crone/SuperCollider already works on macOS.

**Estimated effort**: 2-4 weeks of focused C work to get scripts running with screen + input.

**Why not Swift?** matron is a C project. Rewriting in Swift means reimplementing `weaver.c`'s ~150 C-to-Lua bindings from scratch. Just swap the hardware backends instead.

### 2. Web-based simulator (Lua only, no audio)

Good for script UI development without needing audio:

- [Fengari](https://github.com/fengari-lua/fengari) (Lua 5.3 in JS) or Lua compiled to WebAssembly for the runtime
- HTML Canvas for 128x64 screen
- Keyboard for keys/encoders

Reimplement `screen.*`, `params.*`, and `clock.*` Lua APIs in JavaScript, stub everything else. Useful for layout/interaction design but no audio.

**Estimated effort**: 4-8 weeks for a usable simulator.

### 3. Full browser emulator with audio (hardest)

[SuperSonic](https://github.com/samaaron/supersonic) compiled scsynth to WebAssembly — a breakthrough but still alpha. The blocker: norns engines are **sclang** programs (SuperCollider language), and SuperSonic only ports **scsynth** (the synthesis server). You'd need pre-compiled SynthDefs, meaning no dynamic engine loading.

softcut (C++14 with Boost) would need an Emscripten/Wasm port or a Web Audio API reimplementation.

**Estimated effort**: 4-8+ months.

## norns Architecture Reference

```
 [User Lua Script]
       |
       v
 [Lua Core Libraries]  (screen.lua, softcut.lua, clock.lua, paramset.lua, etc.)
       |                 located at: lua/core/ and lua/lib/
       v
 [weaver.c]            (C-to-Lua bridge: registers C functions on `_norns` table)
       |
       v
 [matron]              (C program: Lua 5.3 host, screen, input, device detection, MIDI)
       |                 Dependencies: libudev, libevdev, libgpiod, liblo, cairo,
       |                 cairo-ft, lua5.3, nanomsg, avahi, sndfile, jack
       |
       |--- Screen: Cairo rendering to 128x64 4-bit grayscale
       |--- Keys: 3 hardware keys -> _norns.key(n, z)
       |--- Encoders: 3 rotary encoders -> _norns.enc(n, delta)
       |--- Devices: grid, arc, MIDI, HID via libmonome/libevdev/libudev
       |
       v  (OSC messages)
 [crone]               (SuperCollider audio backend)
       |                 Manages: mixing, tape recording, engine loading
       v
 [softcut]             (C/C++ library, linked into crone)
                        6 voices, 2 buffers (~5 min each)

 [maiden]              (Go web server: browser-based IDE)
```

## Key Source Files for Path 1

- `matron/src/hardware/screen.c` — framebuffer rendering, needs SDL/Cocoa backend
- `matron/src/hardware/input.c` — libevdev input, needs SDL/keyboard backend
- `matron/src/device/device_list.c` — libudev hotplug, needs stubs
- `matron/src/weaver.c` — C-to-Lua bindings (portable, no changes needed)
- `crone/readme-macos.md` — existing macOS build instructions for audio

## Sources

- [norns main repo](https://github.com/monome/norns)
- [crone macOS build guide](https://github.com/monome/norns/blob/main/crone/readme-macos.md)
- [norns-dev Docker images](https://github.com/winder/norns-dev)
- [norns-desktop](https://github.com/schollz/norns-desktop)
- [Engine dev on macOS guide](https://gist.github.com/mimetaur/18346a71f1444ec8bea98a0c3c6fa365)
- [norns screen.c source](https://github.com/monome/norns/blob/main/matron/src/hardware/screen.c)
- [norns extending docs](https://monome.org/docs/norns/extending/)
- [norns compiling docs](https://monome.org/docs/norns/compiling/)
- [Lines thread: norns on macOS](https://llllllll.co/t/norns-running-on-a-macos/30832)
- [Lines thread: norns for laptops](https://llllllll.co/t/norns-for-laptops/13571)
- [awesome-monome-norns](https://github.com/p3r7/awesome-monome-norns)
- [Fengari (Lua 5.3 in JS)](https://github.com/fengari-lua/fengari)
- [SuperSonic (scsynth Wasm)](https://github.com/samaaron/supersonic)
- [softcut-lib](https://github.com/monome/softcut-lib)
