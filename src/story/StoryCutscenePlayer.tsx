import { useEffect, useRef, useState } from "react";
import type { Profile } from "../world/profile";
import { ui, type StoryScene } from "./script";
import { ShotStage, implementedShots } from "./ShotStage";
import "./cinematic.css";

// The scene clock owns presentation only; it never advances battle or rewards.
export function StoryCutscenePlayer({
  scene,
  profile,
  gear,
  done,
}: {
  scene: StoryScene;
  profile: Profile;
  gear: string[];
  done: () => void;
}) {
  const [index, setIndex] = useState(0),
    [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0),
    [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true),
    [hidden, setHidden] = useState(document.hidden);
  const [reduce, setReduce] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const audio = useRef<AudioContext | null>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const shot = scene.shots[index],
    lines = shot.dialogue_exact ?? [];
  const reduced = reduce || profile.motion === "reduced";
  const supported = implementedShots.has(shot.id);
  const running = !paused && !hidden && supported;
  const captionReady = elapsed >= 900;
  const currentLine = captionReady ? lines[line] : undefined;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest(".feature-content")?.scrollTo(0, 0);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduce(media.matches);
    const visibility = () => setHidden(document.hidden);
    media.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
      void audio.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    let raf: number,
      last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(100, now - last);
      last = now;
      setElapsed((t) => t + delta);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, shot.id, shot.duration_seconds]);
  useEffect(() => {
    if (!running || lines.length || elapsed < shot.duration_seconds * 1000)
      return;
    if (index + 1 === scene.shots.length) done();
    else {
      setIndex(index + 1);
      setLine(0);
      setElapsed(0);
    }
  }, [
    elapsed,
    running,
    lines.length,
    index,
    scene.shots.length,
    shot.duration_seconds,
    done,
  ]);
  useEffect(() => {
    const ctx = audio.current;
    if (!ctx || muted || !running) {
      void ctx?.suspend();
      return;
    }
    void ctx.resume();
    // Original short, quiet square-wave motifs. Audio starts only after Unmute.
    const base = shot.id.startsWith("open.0") && index > 1 ? 110 : 262;
    const nodes: OscillatorNode[] = [];
    [0, 4, 7, 12].forEach((note, n) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = base * 2 ** (note / 12);
      gain.gain.setValueAtTime(0, ctx.currentTime + n * 0.16);
      gain.gain.linearRampToValueAtTime(
        0.018,
        ctx.currentTime + n * 0.16 + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + n * 0.16 + 0.15,
      );
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + n * 0.16);
      oscillator.stop(ctx.currentTime + n * 0.16 + 0.16);
      nodes.push(oscillator);
    });
    return () =>
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* ended */
        }
        n.disconnect();
      });
  }, [shot.id, muted, running, index]);
  function advance() {
    if (!captionReady && lines.length) {
      setElapsed((t) => Math.max(t, 900));
      return;
    }
    if (line + 1 < lines.length) setLine(line + 1);
    else if (index + 1 < scene.shots.length) {
      setIndex(index + 1);
      setLine(0);
      setElapsed(0);
    } else done();
  }
  return (
    <section
      className="story-cutscene"
      aria-label="Story cinematic"
      data-cinematic={scene.id}
      data-shot={shot.id}
      data-elapsed={Math.floor(elapsed)}
      data-paused={!running}
      data-reduced={reduced}
    >
      <h1 ref={heading} tabIndex={-1}>
        {scene.title}
      </h1>
      <div className="cutscene-view" key={shot.id}>
        <ShotStage
          shot={shot}
          seconds={reduced ? shot.duration_seconds : elapsed / 1000}
          reduced={reduced}
          profile={profile}
          gear={gear}
        />
        {shot.overlay_exact && (
          <div className="shot-overlay">{shot.overlay_exact}</div>
        )}
      </div>
      <div className="shot-caption" aria-live="polite" aria-atomic="true">
        {currentLine && (
          <>
            <b>{currentLine.speaker}</b>
            <p>{currentLine.text}</p>
          </>
        )}
        {!supported && <p>Animation not implemented for this scene.</p>}
      </div>
      <div className="cutscene-controls">
        <button className="button secondary" onClick={done}>
          {ui.skip}
        </button>
        <button className="button primary" onClick={advance}>
          {shot.id.startsWith("baby.") ? "Next" : ui.continue}
        </button>
        <button
          className="button text"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          className="button text"
          aria-pressed={!muted}
          onClick={() => {
            if (!audio.current) audio.current = new AudioContext();
            setMuted(!muted);
          }}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
      <small>
        {index + 1} / {scene.shots.length} · {shot.duration_seconds}s ·{" "}
        {lines.length
          ? shot.id.startsWith("baby.")
            ? "Tap Next"
            : "Tap Continue"
          : "Auto advance"}
      </small>
    </section>
  );
}
