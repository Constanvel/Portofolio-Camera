# Portfolio Evidence Upgrade Implementation Plan

> For agentic workers: implement each task sequentially with test-first changes and verify the complete flow after every task.

## Goal

Add an immediate professional identity, structured project case studies, verified demos, an applied AI project, a downloadable CV, professional profile links, and the highest-value technical improvements.

## Architecture

The static site keeps WORKS as the single source for the canvas, deck, grid, fallback, and case-study dialog. New semantic HTML is rendered by the existing orchestration module. The AI demo is an isolated static sub-application, and the CV is a generated static PDF.

## Tech Stack

HTML, CSS, JavaScript modules, Three.js, Node.js checks, Playwright, ReportLab, Vercel static hosting, GitHub Actions.

## Spec

`docs/superpowers/specs/2026-09-06-portfolio-evidence-upgrade-design.md`

## Global Constraints

- Preserve the current intro, routing, localisation, themes, responsive behaviour, accessibility fallbacks, and WebGL cleanup.
- Use only facts and URLs verified from the workspace or public project metadata.
- Keep production dependency-free.
- Do not commit, push, or deploy; provide manual commands when complete.

---

### Task 1: Regression requirements

Files:
- Modify: `tools/check.test.mjs`
- Modify: `tools/browser-check.mjs`

Steps:
- Add source-level assertions for the home identity, case-study fields, AI Ninja project, CV path, Behance link, JSON-LD, package scripts, workflow, and security headers.
- Add browser scenarios that expose the home stage, inspect the case-study dialog, verify demo and repository actions, and reload after intro completion.
- Run the targeted tests and record failures caused by missing production implementation.

### Task 2: Identity and case-study interface

Files:
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/data.js`
- Modify: `js/main.js`
- Modify: `js/i18n.js`
- Modify: `tools/fallback.mjs`

Steps:
- Add the semantic home identity block and its three actions.
- Add challenge, contribution, approach, outcome, and stack fields to every project in both languages.
- Replace the single project link with independent demo and repository actions.
- Render labelled case-study sections with safe omission of missing optional values.
- Regenerate the no-JavaScript works fallback.
- Run the targeted browser and static tests until they pass.

### Task 3: AI Ninja project and direct demo

Files:
- Create: `demos/ai-ninja/index.html`
- Create: `demos/ai-ninja/style.css`
- Create: `demos/ai-ninja/script.js`
- Create: `demos/ai-ninja/model/model.json`
- Create: `demos/ai-ninja/model/metadata.json`
- Create: `demos/ai-ninja/model/weights.bin`
- Create: `assets/tiles/ai-ninja.webp`
- Modify: `js/data.js`

Steps:
- Copy the existing user-authored AI Ninja application and trained model.
- Add the project entry with a local demo link, case-study fields, model settings, and honest qualitative outcome.
- Add an unused canvas slot for the sixth project without overlapping existing cards.
- Capture and optimise a 16:9 project screenshot.
- Run the model-label and scoring tests from the source project, then run portfolio data and browser checks.

### Task 4: CV and professional contact paths

Files:
- Create: `tools/generate-cv.py`
- Create: `output/pdf/constantine-rainer-simanjuntak-cv.pdf`
- Modify: `index.html`
- Modify: `js/i18n.js`

Steps:
- Generate a one-page CV with verified profile, education, project, AI activity, skills, achievements, GitHub, Behance, email, and location data.
- Render the PDF to PNG, inspect alignment and text clipping, and extract text to verify content.
- Link the CV from the home identity and Contact section.
- Add the verified Behance profile to Contact.
- Run source and browser checks for both links.

### Task 5: Search, security, repeat visits, and CI

Files:
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `vercel.json`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.github/workflows/verify.yml`
- Modify: `README.md`

Steps:
- Add JSON-LD for the person, site, and selected projects.
- Add security and permissions headers compatible with the portfolio and AI camera demo.
- Persist successful intro completion in session storage and bypass it on same-tab reload.
- Define reproducible static, unit, and Playwright commands.
- Run dependency installation only for the development lockfile.
- Run the complete test suite.

### Task 6: Final visual and repository verification

Files:
- Modify only files required by defects found during verification.

Steps:
- Capture desktop and phone views of home, Works, a case study, and AI Ninja.
- Inspect the generated CV page render.
- Run syntax checks, static checks, unit tests, all browser tests, and `git diff --check`.
- Confirm the Git diff contains no temporary screenshots, local Vercel state, environment files, or `.claude/` content.
- Prepare manual PowerShell templates for Git add, commit, push, and Vercel production deployment.

