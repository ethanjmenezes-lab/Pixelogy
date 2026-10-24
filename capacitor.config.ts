import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.pixelogy.dev", // Development only; replace before store registration.
  appName: "Pixelogy",
  webDir: "dist",
  plugins: {
    SplashScreen: { launchAutoHide: true, backgroundColor: "#f4ecd8" },
    StatusBar: { style: "LIGHT", backgroundColor: "#173e43" },
  },
};
export default config;
