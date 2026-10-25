# nerve-sonography.org

The project page for the research on AI-supported 3D reconstruction of peripheral nerves from ultrasound (Marc, Philip Broser, Kenan Bektaş, Simon Mayer): one page in English and German, with the 3D nerve model, a demo video, the method's flowcharts, the team and the publications. Marc's working rules and the shared infrastructure are in `~/.claude/CLAUDE.md`. The repo was `MarcGruener.github.io` until 2026-10-26 and keeps its history.

## How it is built

- There is no build. `site/` is served as it is: `index.html`, the icons and preview images, and `staticfiles/` with the images, the video (`demo.mp4`, 35 MB) and the model (`nerve_model.gltf`).
- **The page loads three libraries from CDNs:** Tailwind's Play CDN (`cdn.tailwindcss.com`, which builds the styles in the browser), model-viewer 4.0.0 (`ajax.googleapis.com`) and Mermaid 9.4.3 (`cdnjs.cloudflare.com`). Each visit sends the visitor's address to those hosts. Serving them from `site/` instead is still open.
- **The page has no `<!doctype html>`,** so browsers render it in quirks mode. Adding one may change the layout, so check every section when you do.
- `site/vendor/openpanel-sdk-1.3.1.js` is OpenPanel's SDK copied verbatim from npm (the same file as in moonlighting.dev), with its licence beside it. Update it by copying, never by editing.

## nginx

`nginx.conf` holds the site's whole serving policy:
- `www.nerve-sonography.org` answers 301 to `https://nerve-sonography.org`, keeping the path. Google listed the site under www while it was on Vercel, so the redirect stays until at least 2027-10 (I2 in moonlighting-infra).
- Only files answer: a folder's address and a missing page get `404.html` with status 404.
- The Content-Security-Policy allows the site's own origin, the three CDN hosts above and `plausible.moonlighting.dev` and `openpanel.moonlighting.dev`. Any new host needs a CSP change.
- **Inline scripts and event handlers are allowed by hash:** the Mermaid setup, `select_language` and its two buttons, and the video's `onloadstart`. Editing any of them changes its hash. `csp-check.mjs` runs in the image build and fails it, naming the hash to add to `script-src`.
- `.gltf` and `.webmanifest` get their types here, since nginx's type map lacks both.

## Commands

```sh
python3 -m http.server 8080 --directory site    # quick look, without nginx's headers
node csp-check.mjs                              # the CSP check alone
docker build -t nerve-sonography . && docker run --rm -p 8080:8080 nerve-sonography
```

- **There are no tests.** Check a change in the built image:
  - every file's status, and the redirect with `curl -H 'Host: www.nerve-sonography.org'`;
  - in a browser with the console open: no CSP errors, the model loads, the four flowcharts render, the video plays at 3×, and EN/DE switch.

## Analytics

Cookieless; nothing is stored on the visitor's device.

- **Plausible:** site `nerve-sonography.org`, using the classic script.
- **OpenPanel:** project `nerve-sonography`. `site/stats.js` sends one `screen_view`, with the client id written in it. OpenPanel accepts events only from the project's allowed domains, so local runs send nothing.
- **Not-found page:** `site/404.html` marks itself with `data-page="404"`, and `stats.js` then sends `404` to both.

## Deploy

- Coolify app in project `sites` on app1. It builds `main` with the Dockerfile and runs nginx on port 8080, with the image's own HEALTHCHECK.
- Domains: `https://nerve-sonography.org` and `https://www.nerve-sonography.org`. Coolify's redirect is disabled; nginx does it.
- Auto-deploy is off: merge to `main`, then deploy through Coolify once Marc has approved it.
