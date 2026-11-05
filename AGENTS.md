Refresh and follow all conventions in Admin-Manual (private repo `rebots-online/Admin-Manual`), the single source of truth, and comply with KStore-injected reminders.

## Local rules for natally-v3-4nov2026

- **Public AGPL repository.** No secret, token, password or private key may enter this repository, a commit message or a build log. Secrets resolve at build time from `.env`, either as direct values or as pointers into Admin-Manual.
- **Clean room.** Nothing from any earlier Natally project is opened, quoted or reused: no code, architecture, checklist, PRD, handoff, session log or process note. The only inputs are `DOCS/BRIEF.md`, the frozen screens under `LIBS/UI/STITCH/`, the brand files under `public/brand/` and `public/atelier/`, Admin-Manual, and current official documentation for each library and service.
- **The UI is frozen.** `LIBS/UI/STITCH/` is the UI. Architecture cites its screens and element ids. Coders wire those elements and never redesign them.
- **Pipeline.** `DOCS/ARCHITECTURE.md` is the snapshot of the finished product. `CHECKLIST.md` is the recipe: self-contained tasks built by coder subagents in parallel. Work is judged by reading the whole artifact against the architecture through CodeGraph and by running the real flow. Never judge work by text search. No unit tests.
- **Versions** come only from `./build_all.sh`. Never stamp a version by hand and never put one in a commit title.
- **Settings are never typed into code.** Every name, identifier, domain, price, product id, key and host is read from `.env` through `src/config`.
- **Commit and push after every completed task**, then confirm the commit is on `origin/master`. GitHub is the only remote in use.
- **Brand files are used as they are.** Files listed in `design-system/assets-manifest.json` are never edited, recompressed or regenerated.
