// Original 32px silhouettes with recognizable real-world construction.
export const legends = {
  "spiral-straw": [
    "A looping straw becomes a tide-twisting spear.",
    '<path d="M19 29V16H8V6h15v7H12V9h7" fill="none" stroke="#282044" stroke-width="5"/><path d="M19 29V16H8V6h15v7H12V9h7" fill="none" stroke="#25c6b2" stroke-width="3"/>',
  ],
  "thread-spool": [
    "Sunset thread winds around this pocket-sized legend.",
    '<path fill="#282044" d="M7 3h18v5h-3v17h3v5H7v-5h3V8H7z"/><path fill="#f5cc83" d="M8 4h16v3H8zm0 22h16v6H8z"/><path fill="#594793" d="M11 8h10v17H11z"/><path stroke="#f58a08" stroke-width="2" d="m11 10 10 3m-10 1 10 3m-10 1 10 3m-10 1 10 3"/>',
  ],
  "egg-carton": [
    "Six little chambers form a remarkable paper fortress.",
    '<path fill="#282044" d="M2 7h28v20H2z"/><path fill="#a9ddab" d="M3 8h26v8H3z"/><path fill="#fff8df" d="M4 18h24v7H4z"/><path fill="#b6a17c" d="M5 10h5v4H5zm8 0h5v4h-5zm8 0h5v4h-5zM5 20h5v4H5zm8 0h5v4h-5zm8 0h5v4h-5z"/>',
  ],
  "cardboard-cup-carrier": [
    "Four cup cradles form a champion’s cardboard shell.",
    '<path fill="#282044" d="M3 7h26v20H3z"/><path fill="#cf9e64" d="M4 8h24v18H4z"/><path fill="#fff8df" d="M6 10h7v6H6zm13 0h7v6h-7zM6 19h7v5H6zm13 0h7v5h-7z"/><path fill="#594793" d="M8 11h3v3H8zm13 0h3v3h-3zM8 20h3v3H8zm13 0h3v3h-3z"/>',
  ],
  "dispensing-pump-cap": [
    "A clean, detached pump cap makes springy crab boots. Its crooked spout is the signature.",
    '<path fill="#282044" d="M11 2h17v6H18v11h7v10H5V19h8V8h-2z"/><path fill="#f58a08" d="M12 3h15v3H16v15h8v7H6v-8h9V6h-3z"/><path fill="#fff8df" d="M8 22h14v2H8z"/>',
  ],
  "bubble-tea-cup": [
    "A wide straw and pearl-print cup make a playful crown.",
    '<path fill="#282044" d="M19 1h5v8h4v5h-2v8h-2v7H8v-7H6v-8H4V9h15z"/><path fill="#a9ddab" d="M20 2h3v8h-3z"/><path fill="#e3c6d8" d="M7 13h18v8h-3v6H10v-6H7z"/><path fill="#fff8df" d="M5 10h22v3H5z"/><path fill="#594793" d="M11 20h3v3h-3zm7-2h3v3h-3zm-3 6h3v2h-3z"/>',
  ],
  "biscuit-tin": [
    "An intact round biscuit tin with a flower-stamped lid: a keepsake among everyday discoveries.",
    '<path fill="#282044" d="M8 3h16v3h4v4h2v14h-4v4H6v-4H2V10h2V6h4z"/><path fill="#f5cc83" d="M9 5h14v3h4v15h-3v3H8v-3H4V11h2V8h3z"/><path fill="#594793" d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z"/><path fill="#fff8df" d="M13 13h6v6h-6z"/>',
  ],
  "rounded-pencil-tin": [
    "A rounded pencil case with a bright striped lid. A school-day companion joins the ShoreDex.",
    '<path fill="#282044" d="M4 9h24v3h3v12h-3v3H4v-3H1V12h3z"/><path fill="#25c6b2" d="M5 11h22v3h2v8h-2v3H5v-3H3v-8h2z"/><path fill="#fff8df" d="M7 13h18v2H7zm0 6h18v2H7z"/><path fill="#f58a08" d="M9 12h3v11H9zm10 0h3v11h-3z"/>',
  ],
};
export function legendaryArt(id) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">' +
    legends[id][1] +
    "</svg>"
  );
}
