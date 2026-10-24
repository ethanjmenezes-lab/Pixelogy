import catalogEntries from "./src/catalog/catalog.json" with { type: "json" };
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
export const publicShell = [
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  ...catalogEntries.map((entry) => entry.sprite.slice(1)),
];
export function shellVersion(entries: Array<[string, string | Uint8Array]>) {
  const hash = createHash("sha256");
  for (const [name, content] of [...entries].sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    hash.update(name).update("\0").update(content).update("\0");
  return hash.digest("hex").slice(0, 16);
}
export function offlineShell(): Plugin {
  let publicDir = "public";
  return {
    name: "pixelogy-offline-shell",
    apply: "build",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        if (!bundle["index.html"])
          throw new Error("PWA shell generation must run after HTML emission.");
        const entries: Array<[string, string | Uint8Array]> = Object.entries(
          bundle,
        )
          .filter(
            ([name]) => name === "index.html" || /\.(js|css|woff2)$/.test(name),
          )
          .map(([name, file]) => [
            name,
            file.type === "chunk"
              ? file.code
              : typeof file.source === "string"
                ? file.source
                : new Uint8Array(file.source),
          ]);
        entries.push(
          ...publicShell.map(
            (name) =>
              [name, readFileSync(resolve(publicDir, name))] as [
                string,
                Uint8Array,
              ],
          ),
        );
        const assets = entries.map(([name]) => "/" + name).sort();
        const version = shellVersion(entries);
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `
const CACHE='pixelogy-shell-${version}';
const ASSETS=${JSON.stringify(assets)};
const ROUTES=['/','/scan','/collection','/workshop','/battle/practice','/leaderboard','/profile','/auth/login','/auth/signup','/auth/reset','/auth/callback','/auth/update-password'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
const clientEntries=new Map();
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='STATIC_CLIENT_READY' && event.source?.id){
  clientEntries.set(event.source.id,event.data.entry);
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
   if(clients.length && clients.every(client=>ASSETS.includes(clientEntries.get(client.id)))){
    const names=await caches.keys();await Promise.all(names.slice(0,Math.max(0,names.indexOf(CACHE))).filter(name=>name.startsWith('pixelogy-shell-')).map(name=>caches.delete(name)));
   }
  }));
 }
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Old shell caches stay available while an older tab may still need a lazy chunk.
// Only static build assets are ever stored; no runtime response is added here.
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/api')return;
 if(request.mode==='navigate' && ROUTES.includes(url.pathname)){
  event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;
 }
 if(url.search)return;
 if(ASSETS.includes(url.pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(request)));return;
 }
 // An already open older app can still request its immutable bundled assets.
 if(url.pathname.startsWith('/assets/'))event.respondWith(caches.keys().then(async names=>{
  for(const name of names.filter(n=>n.startsWith('pixelogy-shell-'))){const hit=await (await caches.open(name)).match(request);if(hit)return hit;}
  return fetch(request);
 }));
});`,
        });
      },
    },
  };
}
