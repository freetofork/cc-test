"use client";

import { useEffect, useRef } from "react";

export default function HeroAnimation() {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!screenRef.current) return;
    const screen = screenRef.current!;

    let isRunning = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const jitter = (base: number) => base + (Math.random() * 40 - 20);

    function makeCursor() {
      const c = document.createElement("span");
      c.className = "cursor";
      c.textContent = "█";
      return c;
    }

    let cursor = makeCursor();
    screen.appendChild(cursor);

    function clearScreen() {
      screen.innerHTML = "";
      cursor = makeCursor();
      screen.appendChild(cursor);
    }

    function addNewline() {
      const br = document.createElement("br");
      screen.insertBefore(br, cursor);
    }

    async function typeChars(text: string, fontClass: string, baseSpeed: number) {
      if (!isRunning) return;
      const span = document.createElement("span");
      span.className = `seg seg-${fontClass}`;
      screen.insertBefore(span, cursor);
      for (const ch of text) {
        if (!isRunning) return;
        span.textContent += ch;
        await sleep(jitter(baseSpeed));
      }
    }

    const sequence = [
      // ===== BOOT SEQUENCE =====
      { wait: 900 },
      { type: "C:\\> ", font: "mono", speed: 55 },
      { wait: 350 },
      { type: "Context", font: "mono", speed: 95 },
      { type: "Craft", font: "caveat", speed: 130 },
      { type: ".exe", font: "mono", speed: 95 },
      { wait: 700 },
      { newline: true },
      { type: "> Loading workspace", font: "mono", speed: 38 },
      { type: "...", font: "mono", speed: 280 },
      { wait: 900 },
      { newline: true },
      { type: "> Welcome to ", font: "mono", speed: 50 },
      { type: "Context", font: "mono", speed: 75 },
      { type: "Craft", font: "caveat", speed: 110 },
      { type: ".", font: "mono", speed: 220 },
      { newline: true },

      // ===== STEP 1: ADD CONTEXT (load files) =====
      { type: "> ", font: "mono", speed: 60 },
      { wait: 900 },
      { type: "add ./src", font: "mono", speed: 80 },
      { wait: 400 },
      { newline: true },
      { type: "[+] 24 files · 8.4K tokens", font: "mono", speed: 28 },
      { wait: 800 },
      { newline: true },

      // ===== STEP 2: CRAFT PROMPT =====
      { type: "> ", font: "mono", speed: 60 },
      { wait: 500 },
      { type: 'craft "refactor auth"', font: "mono", speed: 72 },
      { wait: 500 },
      { newline: true },
      { type: "[", font: "mono", speed: 60 },
      { type: "████████████", font: "mono", speed: 55 },
      { type: "] Optimizing context", font: "mono", speed: 32 },
      { wait: 650 },
      { newline: true },
      { type: "[OK] ", font: "mono", speed: 30 },
      { type: "Crafted", font: "caveat", speed: 95 },
      { type: " ✓", font: "mono", speed: 110 },
      { wait: 1100 },
      { newline: true },

      // ===== STEP 3: EXIT =====
      { type: "> ", font: "mono", speed: 60 },
      { wait: 600 },
      { type: "exit", font: "mono", speed: 95 },
      { wait: 500 },
      { newline: true },
      { type: "Session ended. ", font: "mono", speed: 30 },
      { type: "Goodbye.", font: "caveat", speed: 95 },
      { wait: 2200 },
      { clear: true },
    ];

    async function loop() {
      while (isRunning) {
        for (const step of sequence) {
          if (!isRunning) break;
          if (step.wait) await sleep(step.wait);
          else if (step.clear) {
            clearScreen();
            await sleep(600);
          } else if (step.newline) addNewline();
          else if (step.type && step.font && step.speed) {
            await typeChars(step.type, step.font, step.speed);
          }
        }
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (isRunning) loop();
      });
    } else {
      setTimeout(() => {
        if (isRunning) loop();
      }, 300);
    }

    return () => {
      isRunning = false;
    };
  }, []);

  return (
    <div className="retro-pc-wrapper">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="retro-stage">
        <div className="pc">
          {/* ============== MONITOR ============== */}
          <div className="monitor">
            <div className="vents">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="bezel">
              <div className="screen">
                <div className="content" id="screen" ref={screenRef}></div>
                <div className="sync"></div>
                <div className="scanlines"></div>
                <div className="vignette"></div>
                <div className="glass"></div>
              </div>
            </div>
          </div>

          {/* short connecting neck */}
          <div className="neck"></div>

          {/* ============== DESKTOP CASE ============== */}
          <div className="case">
            <div className="drive-525">
              <div className="slot"></div>
              <div className="lever"></div>
            </div>

            <div className="drive-35">
              <div className="slot-35"></div>
              <div className="led-35"></div>
              <div className="eject"></div>
            </div>

            <div className="grille">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="power-section">
              <div className="led-cluster">
                <div className="led-mini-wrap">
                  <div className="led-mini led-power"></div>
                  <div className="led-tag">PWR</div>
                </div>
                <div className="led-mini-wrap">
                  <div className="led-mini led-hdd"></div>
                  <div className="led-tag">HDD</div>
                </div>
              </div>
              <div className="button-row">
                <div className="reset-btn" title="Reset"></div>
                <div className="power-btn" title="Power"></div>
              </div>
            </div>

            <div className="case-brand">ContextCraft 486DX</div>
            <div className="feet">
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  .retro-pc-wrapper {
    --pink-a: #FF758C;
    --pink-b: #FF7EB3;
    --cream-light: #ECE0BE;
    --cream-mid:   #DDCFA4;
    --cream-dark:  #BCAB7A;
    --bezel:       #B8A87B;
    --bezel-dark:  #948462;
    --label:       #5A4F32;
    --screen-bg:   #08070C;
    --slot-dark:   #1a1611;
    font-family: 'Space Mono', monospace;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .retro-stage {
    width: 100%;
    max-width: 680px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(8px, 2vw, 20px);
  }

  .retro-pc-wrapper .pc {
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Ground shadow */
  .retro-pc-wrapper .pc::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 6%;
    right: 6%;
    height: 14px;
    background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.2) 0%, transparent 70%);
    filter: blur(4px);
    z-index: 0;
  }

  /* ============================================================
     MONITOR — sits on top
     ============================================================ */
  .retro-pc-wrapper .monitor {
    width: 86%;
    aspect-ratio: 1.18 / 1;
    position: relative;
    z-index: 3;
    background:
      linear-gradient(180deg, var(--cream-light) 0%, var(--cream-mid) 60%, var(--cream-dark) 100%);
    border-radius: 18px 18px 16px 16px / 14px 14px 18px 18px;
    padding: clamp(12px, 2.4vw, 24px);
    box-shadow:
      0 14px 26px rgba(0,0,0,0.15),
      0 4px 10px rgba(0,0,0,0.1),
      inset 0 2px 1px rgba(255,255,255,0.55),
      inset 0 -3px 8px rgba(110,90,40,0.22),
      inset 4px 0 8px rgba(110,90,40,0.12),
      inset -4px 0 8px rgba(110,90,40,0.12);
    background-image:
      linear-gradient(180deg, var(--cream-light) 0%, var(--cream-mid) 60%, var(--cream-dark) 100%),
      repeating-linear-gradient(45deg,
        rgba(255,255,255,0.018) 0px,
        rgba(255,255,255,0.018) 1px,
        transparent 1px,
        transparent 3px);
    background-blend-mode: multiply;
  }

  .retro-pc-wrapper .vents {
    position: absolute;
    top: 7px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
    opacity: 0.42;
  }
  .retro-pc-wrapper .vents span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--bezel-dark);
    border-radius: 1px;
  }

  .retro-pc-wrapper .bezel {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, var(--bezel-dark) 0%, var(--bezel) 100%);
    border-radius: 14px 14px 12px 12px / 10px 10px 14px 14px;
    padding: clamp(10px, 1.8vw, 16px);
    position: relative;
    box-shadow:
      inset 0 6px 12px rgba(0,0,0,0.55),
      inset 0 -2px 4px rgba(255,255,255,0.15),
      0 1px 0 rgba(255,255,255,0.4);
  }

  .retro-pc-wrapper .screen {
    width: 100%;
    height: 100%;
    background:
      radial-gradient(ellipse at 50% 50%, #100a14 0%, var(--screen-bg) 60%, #03020A 100%);
    border-radius: 22px / 14px;
    position: relative;
    overflow: hidden;
    box-shadow:
      inset 0 0 80px rgba(0,0,0,0.85),
      inset 0 0 30px rgba(255,117,140,0.05),
      0 0 0 2px rgba(0,0,0,0.4);
  }

  .retro-pc-wrapper .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(0,0,0,0) 0px,
      rgba(0,0,0,0) 2px,
      rgba(0,0,0,0.35) 2px,
      rgba(0,0,0,0.35) 3px
    );
    pointer-events: none;
    z-index: 4;
    mix-blend-mode: multiply;
  }

  .retro-pc-wrapper .sync {
    position: absolute;
    left: 0; right: 0;
    height: 80px;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(255,255,255,0.025) 40%,
      rgba(255,255,255,0.04) 50%,
      rgba(255,255,255,0.025) 60%,
      transparent 100%);
    pointer-events: none;
    z-index: 5;
    animation: sync 9s linear infinite;
  }
  @keyframes sync {
    0%   { top: -100px; }
    100% { top: 110%; }
  }

  .retro-pc-wrapper .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%);
    pointer-events: none;
    z-index: 6;
  }

  .retro-pc-wrapper .glass {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 28%),
      linear-gradient(225deg, rgba(255,255,255,0.025) 0%, transparent 22%);
    pointer-events: none;
    z-index: 7;
    border-radius: inherit;
  }

  .retro-pc-wrapper .content {
    position: absolute;
    inset: 0;
    padding: clamp(12px, 2.2vw, 22px);
    z-index: 3;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: clamp(10px, 1.6vw, 15px);
    line-height: 1.55;
    letter-spacing: 0.02em;
    white-space: pre-wrap;
    overflow: hidden;
    color: #FF7EB3;
    background-image: linear-gradient(135deg, var(--pink-a) 0%, var(--pink-b) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter:
      drop-shadow(0 0 4px rgba(255, 126, 179, 0.55))
      drop-shadow(0 0 12px rgba(255, 117, 140, 0.35));
    animation: flicker 4.2s infinite, jitter 0.18s infinite;
    text-align: left;
  }

  .retro-pc-wrapper .seg-caveat {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 1.5em;
    line-height: 0.7;
    letter-spacing: 0;
    vertical-align: -0.05em;
    margin-left: 0.04em;
    margin-right: 0.04em;
  }

  .retro-pc-wrapper .cursor {
    display: inline-block;
    width: 0.55em;
    height: 0.95em;
    background: linear-gradient(135deg, var(--pink-a) 0%, var(--pink-b) 100%);
    -webkit-text-fill-color: initial;
    color: transparent;
    vertical-align: -0.12em;
    margin-left: 1px;
    animation: blink 1.05s steps(1) infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    47% { opacity: 1; }
    48% { opacity: 0.86; }
    49% { opacity: 1; }
    72% { opacity: 1; }
    73% { opacity: 0.92; }
    74% { opacity: 1; }
  }
  @keyframes jitter {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(0.4px); }
  }

  /* Connecting neck between monitor and case */
  .retro-pc-wrapper .neck {
    width: 24%;
    height: 8px;
    background: linear-gradient(180deg, var(--cream-dark) 0%, var(--bezel-dark) 100%);
    margin-top: -4px;
    border-radius: 0 0 4px 4px;
    z-index: 2;
    box-shadow: inset 0 -2px 3px rgba(0,0,0,0.3);
  }

  /* ============================================================
     DESKTOP CASE — horizontal box monitor sits on
     ============================================================ */
  .retro-pc-wrapper .case {
    width: 100%;
    aspect-ratio: 6.4 / 1;
    position: relative;
    z-index: 1;
    background:
      linear-gradient(180deg, var(--cream-light) 0%, var(--cream-mid) 50%, var(--cream-dark) 100%);
    border-radius: 8px 8px 12px 12px / 6px 6px 14px 14px;
    padding: clamp(8px, 1.5vw, 14px) clamp(14px, 2.4vw, 22px);
    padding-bottom: clamp(14px, 2.4vw, 20px);
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.8vw, 18px);
    box-shadow:
      0 18px 30px rgba(0,0,0,0.15),
      0 6px 14px rgba(0,0,0,0.1),
      inset 0 2px 1px rgba(255,255,255,0.6),
      inset 0 -3px 8px rgba(110,90,40,0.25),
      inset 4px 0 8px rgba(110,90,40,0.12),
      inset -4px 0 8px rgba(110,90,40,0.12);
    background-image:
      linear-gradient(180deg, var(--cream-light) 0%, var(--cream-mid) 50%, var(--cream-dark) 100%),
      repeating-linear-gradient(45deg,
        rgba(255,255,255,0.018) 0px,
        rgba(255,255,255,0.018) 1px,
        transparent 1px,
        transparent 3px);
    background-blend-mode: multiply;
  }

  .retro-pc-wrapper .case::before {
    content: '';
    position: absolute;
    top: 30%;
    left: 8px;
    right: 8px;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(110,90,40,0.22) 8%, rgba(110,90,40,0.22) 92%, transparent 100%);
    pointer-events: none;
  }

  /* 5.25" drive bay */
  .retro-pc-wrapper .drive-525 {
    flex: 0 0 28%;
    height: 38%;
    background: linear-gradient(180deg, #2a2419 0%, #1a1611 50%, #2a2419 100%);
    border-radius: 2px;
    position: relative;
    box-shadow:
      inset 0 1px 2px rgba(0,0,0,0.7),
      inset 0 -1px 1px rgba(255,255,255,0.08),
      0 1px 0 rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    padding: 0 6%;
    justify-content: space-between;
  }
  .retro-pc-wrapper .drive-525 .slot {
    flex: 1;
    height: 28%;
    background: var(--slot-dark);
    border-radius: 1px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.9);
    margin-right: 6px;
  }
  .retro-pc-wrapper .drive-525 .lever {
    width: 10px;
    height: 60%;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream-dark) 100%);
    border-radius: 1px;
    box-shadow: inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.4);
  }

  /* 3.5" floppy */
  .retro-pc-wrapper .drive-35 {
    flex: 0 0 17%;
    height: 28%;
    background: linear-gradient(180deg, #2a2419 0%, #1a1611 50%, #2a2419 100%);
    border-radius: 2px;
    position: relative;
    box-shadow:
      inset 0 1px 2px rgba(0,0,0,0.7),
      inset 0 -1px 1px rgba(255,255,255,0.08),
      0 1px 0 rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    padding: 0 6%;
  }
  .retro-pc-wrapper .drive-35 .slot-35 {
    flex: 1;
    height: 24%;
    background: var(--slot-dark);
    border-radius: 1px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.9);
  }
  .retro-pc-wrapper .drive-35 .led-35 {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #4a1a0a;
    margin-left: 5px;
    box-shadow: inset 0 0 1px rgba(0,0,0,0.6);
  }
  .retro-pc-wrapper .drive-35 .eject {
    width: 5px;
    height: 5px;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream-dark) 100%);
    border-radius: 1px;
    margin-left: 4px;
    box-shadow: 0 1px 1px rgba(0,0,0,0.4);
  }

  /* Vent grille */
  .retro-pc-wrapper .grille {
    flex: 1;
    height: 55%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 0 6px;
  }
  .retro-pc-wrapper .grille span {
    display: block;
    height: 1px;
    background: var(--bezel-dark);
    opacity: 0.4;
    border-radius: 0.5px;
  }

  /* Power section */
  .retro-pc-wrapper .power-section {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(4px, 0.8vw, 7px);
    height: 80%;
    justify-content: center;
  }

  .retro-pc-wrapper .led-cluster {
    display: flex;
    gap: clamp(5px, 1vw, 8px);
    align-items: center;
  }
  .retro-pc-wrapper .led-mini-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .retro-pc-wrapper .led-mini {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    box-shadow: inset 0 0 2px rgba(255,255,255,0.5);
  }
  .retro-pc-wrapper .led-power {
    background: radial-gradient(circle at 35% 30%, #b6ff8a 0%, #4ec23a 60%, #1d6e10 100%);
    box-shadow: 0 0 5px rgba(78, 194, 58, 0.7), inset 0 0 1px rgba(255,255,255,0.6);
    animation: led-pulse 3.4s ease-in-out infinite;
  }
  .retro-pc-wrapper .led-hdd {
    background: radial-gradient(circle at 35% 30%, #ffd0a0 0%, #d05010 60%, #501a04 100%);
    box-shadow: 0 0 4px rgba(208, 80, 16, 0.6), inset 0 0 1px rgba(255,255,255,0.5);
    animation: led-hdd 1.8s steps(2) infinite;
  }
  @keyframes led-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  @keyframes led-hdd {
    0%, 30%, 70%, 100% { opacity: 0.3; }
    35%, 65% { opacity: 1; }
  }
  .retro-pc-wrapper .led-tag {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 6px;
    letter-spacing: 0.08em;
    color: var(--label);
    text-transform: uppercase;
  }

  .retro-pc-wrapper .button-row {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .retro-pc-wrapper .power-btn {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(160deg, var(--cream-light) 0%, var(--cream-mid) 60%, var(--cream-dark) 100%);
    box-shadow:
      inset 0 1px 2px rgba(255,255,255,0.6),
      inset 0 -1px 2px rgba(110,90,40,0.4),
      0 1px 2px rgba(0,0,0,0.4);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .retro-pc-wrapper .power-btn::after {
    content: '';
    width: 7px;
    height: 7px;
    border: 1.2px solid var(--label);
    border-radius: 50%;
    border-top-color: transparent;
    box-sizing: border-box;
  }
  .retro-pc-wrapper .power-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -65%);
    width: 1.2px;
    height: 5px;
    background: var(--label);
    border-radius: 1px;
    z-index: 1;
  }

  .retro-pc-wrapper .reset-btn {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream-dark) 100%);
    box-shadow:
      inset 0 1px 1px rgba(255,255,255,0.6),
      0 1px 1px rgba(0,0,0,0.3);
  }

  .retro-pc-wrapper .case-brand {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 8px;
    letter-spacing: 0.18em;
    color: var(--label);
    opacity: 0.55;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* Small feet on bottom of case */
  .retro-pc-wrapper .feet {
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 5%;
    pointer-events: none;
  }
  .retro-pc-wrapper .feet span {
    width: 18px;
    height: 5px;
    background: linear-gradient(180deg, var(--bezel-dark) 0%, #5a4f32 100%);
    border-radius: 0 0 3px 3px;
    box-shadow: inset 0 -1px 2px rgba(0,0,0,0.4);
  }
`;
