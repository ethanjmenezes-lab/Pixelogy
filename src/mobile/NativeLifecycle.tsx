import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { native } from "./platform";
import { listenRestoredCapture } from "./capture";
export function NativeLifecycle() {
  const navigate = useNavigate(),
    location = useLocation();
  const launchChecked = useRef(false);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let active = true;
    void Network.getStatus().then((s) => {
      if (active) setOnline(s.connected);
    });
    const network = Network.addListener("networkStatusChange", (s) =>
      setOnline(s.connected),
    );
    const restored = listenRestoredCapture();
    const onRestore = () => navigate("/scan");
    window.addEventListener("pixelogy-restored-capture", onRestore);
    if (native) {
      if (!launchChecked.current) {
        launchChecked.current = true;
        void App.getLaunchUrl()
          .then((result) => {
            if (
              result?.url === "pixelogy://scan" ||
              result?.url === "pixelogy://scan/"
            )
              navigate("/scan");
          })
          .catch(() => {});
      }
      void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      void SplashScreen.hide().catch(() => {});
    }
    return () => {
      active = false;
      void network.then((l) => l.remove());
      void restored.then((l) => l.remove());
      window.removeEventListener("pixelogy-restored-capture", onRestore);
    };
  }, [navigate]);
  useEffect(() => {
    if (!native) return;
    const listener = App.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) {
        dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
        dialog.close();
        return;
      }
      if (location.pathname !== "/") navigate("/");
      else void App.minimizeApp();
    });
    const links = App.addListener("appUrlOpen", ({ url }) => {
      const parsed = new URL(url);
      if (parsed.protocol === "pixelogy:" && parsed.hostname === "scan")
        navigate("/scan");
    });
    return () => {
      void listener.then((l) => l.remove());
      void links.then((l) => l.remove());
    };
  }, [navigate, location.pathname]);
  return online ? null : (
    <div className="offline-status" role="status">
      Offline · local gameplay available
    </div>
  );
}
