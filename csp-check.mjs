// Fails the image build when a page in site/ carries an inline script or event
// handler whose hash the CSP in nginx.conf doesn't list, which the browser would
// refuse to run. The message names the hash to add; edit a script, and its hash changes.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const csp = readFileSync("nginx.conf", "utf8");
const missing = new Map();

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith(".html")) check(file);
  }
}

function require(file, code) {
  const hash = `'sha256-${createHash("sha256").update(code).digest("base64")}'`;
  if (!csp.includes(hash)) missing.set(hash, `${file}: ${code.trim().slice(0, 60)}`);
}

function check(file) {
  // Commented-out markup never runs.
  const html = readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /application\/json/.test(attrs) || !body.trim()) continue;
    require(file, body);
  }
  for (const [, code] of html.matchAll(/\son[a-z]+="([^"]*)"/g)) require(file, code);
}

walk("site");
for (const [hash, where] of missing) console.error(`not in the CSP: ${hash} (${where})`);
process.exit(missing.size ? 1 : 0);
