// The site can live at a domain root (https://notonlybodegacats.com/) or inside a folder
// (https://USER.github.io/REPO/). Vite hands us that folder as BASE_URL, so every file address goes through here.
export const BASE = import.meta.env.BASE_URL; // always ends with "/"
export const url = (path) => BASE + String(path).replace(/^\//, '');
