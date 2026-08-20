# RV Homepage — Agent + Logo Hotfix

Changes:
- Restored official project-wide `logo-rv-v32.svg` and `logo-rv-v32-inverse.svg` on homepage.
- Removed homepage-only compact logo usage.
- Improved responsive logo sizing for mobile.
- Removed `aria-expanded` from native search input.
- Replaced unnamed search-results `role=region` with a semantic results container plus dedicated `role=status` live announcement.
- Added meaningful labels to major homepage sections for a clearer accessibility/agent tree.
- No visual redesign and no changes to calculator logic.

After deploy: rerun PageSpeed Agentic Browsing. Expected target: accessibility tree pass.
