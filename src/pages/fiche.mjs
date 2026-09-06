// How big a one-pager under /media/ is, in kilobytes, read off the file itself
// at build time.
//
// It lives here rather than on the training page because two pages print it now
// — the training page's course columns and the kata page's own closing block —
// and those two may not import each other: `training.mjs` already imports
// `kata.mjs` for the link down, so the reverse import would close a cycle.
//
// Read rather than written down: these are 400 KB documents on a link that says
// only "Download de fiche", which on a phone connection is worth knowing before
// the tap, and a number typed into a string file goes stale the first time a
// fiche is replaced.
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MEDIA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/media');

export const ficheKilobytes = (file) => Math.round(statSync(path.join(MEDIA_DIR, file)).size / 1024);
