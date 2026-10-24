import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ScanLine,
  Shell,
  Swords,
  Sprout,
  ArrowRight,
} from "lucide-react";
import { BeachArt, Crab } from "../components/Crab";
import { useGame } from "../components/GameContext";
import { equippedBlueprints } from "../lib/storage";
export function Home() {
  const { items, claims, loadout } = useGame();
  return (
    <>
      <div className="page-eyebrow">
        <span>
          <i className="status-dot" /> YOUR NEXT ADVENTURE IS SHORE-SIDE
        </span>
        <span className="desktop-only">COLLECT A LITTLE. CARE A LOT.</span>
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="pill">A WORLD OF LITTLE DISCOVERIES</span>
          <h1>
            Clean up.
            <br />
            Gear up.
            <br />
            <em>Crab on.</em>
          </h1>
          <p>
            A bottle cap today. A mighty little crab tomorrow.
            <br className="desktop-only" /> Turn safe shore finds into pixel
            treasures.
          </p>
          <Link className="button primary" to="/scan">
            <ScanLine size={18} /> Scan your first find{" "}
            <ArrowUpRight size={18} />
          </Link>
          <span className="hero-footnote">
            A little curiosity goes a long way.
          </span>
        </div>
        <div className="hero-scene">
          <BeachArt />
          <div className="scene-tag">YOUR SHORE. YOUR STORY.</div>
          <div className="hero-crab">
            <Crab gear={equippedBlueprints(loadout, items)} />
          </div>
          <span className="crab-caption">
            <span className="status-dot" /> READY FOR AN ADVENTURE
          </span>
          <span className="scene-coordinate">PIXEL BEACH · 01</span>
        </div>
      </section>
      <section className="stats-strip" aria-label="Your progress">
        <div>
          <Shell />
          <span>
            <b>{items.length.toString().padStart(2, "0")}</b> ShoreDex
            discoveries
          </span>
        </div>
        <div>
          <Sprout />
          <span>
            <b>{claims.length.toString().padStart(2, "0")}</b> Self-reported
            cleanups
          </span>
        </div>
        <div>
          <span className="xp-icon">✦</span>
          <span>
            <b>{claims.reduce((sum, c) => sum + c.xpAwarded, 0)}</b> Cleanup XP
          </span>
        </div>
        <Link to="/leaderboard">
          Weekly champions <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="next-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SMALL FINDS. BIG POSSIBILITIES.</span>
            <h2>Make the shore your playground.</h2>
          </div>
          <span className="muted desktop-only">
            Every discovery starts something.
          </span>
        </div>
        <div className="adventure-grid">
          <Link className="adventure-card mint" to="/collection">
            <div className="tile-top">
              <span>01 / DISCOVER</span>
              <ArrowUpRight />
            </div>
            <div className="tile-art card-stack">
              <span>✦</span>
              <span>◇</span>
              <span>✧</span>
            </div>
            <h3>A pocket full of treasures.</h3>
            <p>
              Your real-world finds, reimagined in pixels.
              <br />
              Meet your growing ShoreDex.
            </p>
            <span className="text-link">
              Explore ShoreDex <ArrowRight size={16} />
            </span>
          </Link>
          <Link className="adventure-card sand" to="/workshop">
            <div className="tile-top">
              <span>02 / GEAR UP</span>
              <ArrowUpRight />
            </div>
            <div className="tile-art mini-crab">
              <Crab gear={["bag_helm", "can_shield"]} />
            </div>
            <h3>A crab with character.</h3>
            <p>
              A bag becomes a helmet. A cap becomes boots.
              <br />
              Make a little champion of your own.
            </p>
            <span className="text-link">
              Visit the workshop <ArrowRight size={16} />
            </span>
          </Link>
          <Link className="adventure-card coral" to="/battle/practice">
            <div className="tile-top">
              <span>03 / BATTLE</span>
              <ArrowUpRight />
            </div>
            <div className="tile-art crossed">
              <Swords size={82} strokeWidth={1.4} />
              <span>✦</span>
            </div>
            <h3>Small claws. Big energy.</h3>
            <p>
              Put your gear to the test in a turn-based
              <br />
              practice match against the CPU.
            </p>
            <span className="text-link">
              Enter practice <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>
      <div className="care-note">
        <Sprout size={23} />
        <p>
          <strong>Good adventures leave a lighter footprint.</strong> Collect
          only safe discoveries. Cleanup XP comes from your optional disposal
          self-report.
        </p>
        <Link to="/scan">
          Explore safely <ArrowUpRight size={16} />
        </Link>
      </div>
    </>
  );
}
