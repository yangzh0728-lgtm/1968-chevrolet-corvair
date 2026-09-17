# Legacy Garage 26 Website Implementation Plan

**Goal:** Build a responsive, animated editorial website and integrate the existing Corvair Anatomy viewer.
**Architecture:** Static HTML routes with shared CSS and JavaScript, native browser animations, and an on-demand iframe for the existing self-contained viewer. No backend is needed for this first content-led release.
**Tech stack:** HTML, CSS, ES modules, existing Three.js viewer; Python local preview.

- [x] Build the shared navigation, navy/white theme, homepage hero, and meaningful local preview.
- [x] Add Restoration, Explore, Journal, About, and Contact routes plus useful journal detail pages.
- [x] Add reveal animations, page transitions, pointer-responsive hero, interactive milestone tabs, journal filtering, mobile navigation, and reduced-motion controls.
- [x] Copy and integrate the existing viewer under /anatomy/ without altering its source project. Keep its assets unloaded until requested.
- [x] Check route links, script syntax, responsive layouts, keyboard interactions, filters, and viewer loading.
- [ ] Save verified source to GitHub and publish a private website preview through Sites.

Content must distinguish planned work from published restoration evidence. Reference photography must be credited and not described as the team's actual car. Existing Chinese viewer text is preserved and identified at the launch control; English translation is future work.
