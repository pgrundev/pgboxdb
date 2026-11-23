# pgboxdb.com `/install` and `/llms.txt` endpoints

The Cloudflare Worker `pgboxdb-install` (this directory) owns two routes on
`pgboxdb.com`:

* `/install` serves the reviewed [`dist/install.sh`](../install.sh) from the
  pinned release tag `INSTALL_REF`, so `curl -fsSL https://pgboxdb.com/install | sh`
  installs that release.
* `/llms.txt` serves [`llms.txt`](llms.txt), the agent-facing summary of the
  product. Update it with every release (a test checks it names the npm
  package version) and redeploy.

Both routes are more specific than whatever serves the rest of `pgboxdb.com`,
so they win over it. The rest of the site is not in this repository.

| Version | Deployed (UTC) | Change |
|---|---|---|
| `9d1e7dd0-88a9-413d-9260-f45f270b8c39` | 2026-11-23 18:43 | `/install`, `INSTALL_REF` v0.2.0 |

## Hosting before this Worker (historical)
- `pgboxdb.com` resolves through **Cloudflare** (`server: cloudflare`, `cf-ray`, `cf-cache-status`).
- The root serves a **parked/placeholder page** (an `<x-dc>` document + `support.js`), not a managed site. There is **no** `/install` route.
- The serving configuration lives in the **Cloudflare account**, not in this repository.

## What this directory provides
A Cloudflare **Worker** (`install-worker.js` + `wrangler.toml`) that owns only the
`pgboxdb.com/install` route and returns `dist/install.sh` from a **pinned ref**
(`INSTALL_REF`). The ref is **required** and must be a release tag or commit sha —
there is no fallback to a mutable branch. The Worker returns `500` if `INSTALL_REF`
is missing/invalid and `502` if the upstream script can't be fetched (never a
misleading empty `200`). Behavior is covered by `install-worker.test.js`
(`node --test dist/pgboxdb.com/install-worker.test.js`, run in CI).

## Before deploying — verify the account controls the pgboxdb.com zone
```sh
cd dist/pgboxdb.com
npx wrangler whoami                     # confirm the intended Cloudflare account
npx wrangler zone list | grep -w pgboxdb.com  # the account must list the pgboxdb.com zone
```
`wrangler deploy` will refuse the `pgboxdb.com/install` route if the account does not
own the zone — so a successful deploy is itself proof of control.

## Deploy (maintainer, after approval — needs Cloudflare access)
```sh
cd dist/pgboxdb.com
node --test install-worker.test.js
npx wrangler deploy --var INSTALL_REF:v0.2.0   # pin to the released tag (a PGBoxDB release, >= v0.2.0)
curl -fsSL https://pgboxdb.com/install | head             # verify it serves the script
curl -fsSL https://pgboxdb.com/llms.txt | head
```
This owns only `/install` and `/llms.txt`; it does **not** change DNS or other pgboxdb.com content.

## Prerequisites before the public `curl | sh` works
1. Publish the GitHub release (tag `v0.2.0`, the first PGBoxDB release) with the platform tarballs + `.sha256` (via `.github/workflows/release.yml`, draft → manual publish).
2. Deploy this Worker with `INSTALL_REF=v0.2.0`. Never an earlier tag: their `install.sh` installs the product from before the rename.
3. `dist/install.sh` then resolves the release artifacts (its discovery reads the releases list, which includes prereleases).
