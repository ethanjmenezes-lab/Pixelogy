import { Link } from "react-router-dom";
import { Trophy, ArrowUpRight } from "lucide-react";
export function Leaderboard() {
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">A LITTLE FRIENDLY MOTIVATION</span>
        <h1>Weekly Cleanup Champions.</h1>
        <p>A shared shore. A little collective care.</p>
      </div>
      <section className="empty-state panel">
        <Trophy size={56} strokeWidth={1} />
        <span className="pill">ONLINE FEATURE · NOT CONNECTED</span>
        <h2>The shore is quiet for now.</h2>
        <p>
          Live rankings are not connected in this release.
          <br />
          Your discoveries, local cleanup XP and CPU practice are ready to
          enjoy.
        </p>
        <p className="field-help">
          Future rankings will count opted-in, self-reported cleanups—not scans
          or battle wins.
          <br />
          Weeks begin Monday at midnight in America/Chicago.
        </p>
        <Link className="button primary" to="/scan">
          Make a discovery <ArrowUpRight size={17} />
        </Link>
      </section>
    </>
  );
}
