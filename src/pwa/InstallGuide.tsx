import { useEffect, useState } from "react";
export function InstallGuide() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(
      matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
  }, []);
  return (
    <section className="panel install-guide" aria-labelledby="install-title">
      <span className="eyebrow">PIXELOGY, IN YOUR POCKET</span>
      <h2 id="install-title">Install Pixelogy</h2>
      {standalone ? (
        <p>You’re using Pixelogy as a standalone web app.</p>
      ) : (
        <p>
          Add Pixelogy to your Home Screen for an app-like experience. No App
          Store download is needed.
        </p>
      )}
      <h3>On iPhone</h3>
      <p>
        Open this website in <strong>Safari</strong>. Installation is manual on
        iPhone.
      </p>
      <ol>
        <li>
          Tap <strong>Share</strong> (the square with an upward arrow). It may
          be inside Safari’s page menu.
        </li>
        <li>
          Select <strong>Add to Home Screen</strong>. Scroll down if needed.
        </li>
        <li>
          Turn on <strong>Open as Web App</strong>, if shown.
        </li>
        <li>
          Tap <strong>Add</strong>, then launch Pixelogy from its new icon.
        </li>
      </ol>
      <p>
        On older iOS versions the toggle may not appear; the installed app opens
        in standalone mode automatically.
      </p>
      <a
        href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios"
        target="_blank"
        rel="noreferrer"
      >
        Apple’s iPhone installation guide ↗
      </a>
      <h3>On Android or desktop</h3>
      <p>
        Use your browser’s <strong>Install app</strong> or{" "}
        <strong>Add to Home screen</strong> option when available.
      </p>
      <h3>What works offline?</h3>
      <p>
        After the app finishes its first online load, your local ShoreDex,
        equipment and CPU battles work offline. New discoveries require online
        AI identification. Gemini and new map tiles need an internet connection.
      </p>
      <p>
        Allow camera access when you scan. If access is blocked, enable it in
        your browser or device settings and retry. Legacy saves stay on this
        device. Signed-in account saves use Supabase when configured; cached
        account inventory can be viewed offline, but account changes need
        connectivity and offline account practice earns no XP. Clearing site
        data removes local saves and cached snapshots.
      </p>
    </section>
  );
}
