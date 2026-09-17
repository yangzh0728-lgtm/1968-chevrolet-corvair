# Legacy Garage 26

A youth-led 1968 Chevrolet Corvair restoration website with an integrated interactive model.

## Run locally

```sh
python3 scripts/build-pages.py
python3 -m http.server 4186 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4186/.

## Structure

- `site/shell.html` — shared header, navigation, metadata, and footer.
- `site/pages/` and `site/pages.json` — page content and route metadata.
- `dist/styles.css` — responsive theme and motion system.
- `dist/app.js` — navigation, motion preferences, roadmap tabs, journal filters, and email links.
- `dist/explorer.js` — lazy model loading, assembly navigation, full screen, and cleanup.
- `dist/anatomy/` — integrated copy of the existing Corvair Anatomy viewer, its local Three.js dependency, and model assets.
- `docs/website-project-brief.md` — original brief and explorer requirements.

HTML is generated with Python's standard library. Authored CSS, JavaScript, and assets live directly in `dist/` and are tracked. There is no dependency installation or application server requirement. Re-run `build-pages.py` after editing the templates.

## Verify

```sh
python3 scripts/verify-site.py
```

The verifier checks routes, internal asset links, anchors, duplicate IDs, JavaScript syntax, and the model files against their manifest. Browser verification covers mobile navigation, journal filtering/search, roadmap tabs, model assembly links, explosion controls, full screen, and unloading.

## Content and media

The journal contains initial project notes and an explorer guide. Restoration stages are explicitly planned milestones, not completed work. Team profiles, actual workshop photos, and restoration reports still need to be supplied by the team. Contact actions open email drafts; there is no backend form or mailing-list service.

The reference Corvair photograph is credited on `/credits/` and in `docs/image-credits.md`; it is not presented as the team's car. The original model's Chinese interface and explanations are retained, with English assembly launch controls on the host page. The model loads on demand (approximately 88 MB).

Motion includes headline entrances, photo reveals, scroll reveals, pointer response, a typographic ticker, animated state changes, hover feedback, and native cross-page view transitions where supported. Visitors can pause ambient site motion, and operating-system reduced-motion preferences are respected. Explicit user-controlled 3D manipulation remains available.

The original standalone Corvair Anatomy folder remains unchanged. The integrated copy adds a same-origin messaging bridge for assembly selection and a return link to the main site.
