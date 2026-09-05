# Portfolio audit fixes implementation plan

**Goal:** Resolve the nine reproduced bugs and three maintenance improvements from the user's approved audit.

**Architecture:** Keep the static site and its existing modules. Cancel obsolete navigation and intro continuations, preserve native HTML navigation, and test observable behavior in a real browser. Retain the user's existing main.js and scene.js edits.

**Tech stack:** HTML, CSS, JavaScript modules, Node.js; Playwright is used only by the optional browser checks.

**Spec:** The twelve findings in this task's preceding audit, approved for implementation by the user.

## Constraints

- Work in the current checkout so the existing local visual changes remain included.
- No production dependencies, framework migration, deployment, or commits are needed.
- Keep both legacy hash routes and ordinary section anchors working.
- Browser tests must run with existing Playwright through PLAYWRIGHT_MODULE or an ordinary local installation.

## Execution checklist

- [x] Add tools/browser-check.mjs covering fast navigation, focus, volume keys, certificates, reduced motion, no-JS layouts, early skip, missing WebGL and cancellation during loading. Run against the unchanged application and record failing behavior.
- [x] Correct ../redirect-portofolio-camera/vercel.json; parse both configurations with Node JSON.parse.
- [x] Fix main.js route transitions and focus. Use a navigation generation counter and check it after every transition await. Verify the route tests.
- [x] Fix main.js intro startup and scene.js warm-up lifetime. Check cancellation after the dynamic import, dispose late models, skip work after GL disposal, and fall back on errors. Verify blocked and delayed resource tests plus the full intro.
- [x] Scope keyboard shortcuts to the focused canvas; implement reduced-motion behavior and allow native certificate file links. Verify browser controls.
- [x] Supply ordinary section anchors and a generated no-JS project list in index.html, with usable no-JS styles. Verify desktop and mobile scrolling and links.
- [x] Keep project/card slots with js/data.js; extend tools/check.mjs to validate slots, routes, fallback content, syntax and deployment JSON. Prove invalid fixtures are rejected with tools/check.test.mjs.
- [x] Replace the long README with current setup, maintenance and checks; retain historical notes in docs/history.md and shorten stale comments in touched modules.
- [x] Run all static, fixture and browser checks; review the complete diff and confirm the user's prior local changes remain present.

## Verification commands

```sh
node tools/check.mjs
node --test tools/check.test.mjs
node tools/browser-check.mjs
git diff --check
```

The browser script starts and closes a loopback-only static server. It uses BROWSER_CHANNEL when provided (msedge on this Windows workspace). External links are not visited except the local certificate popup under test.

## Verification results

- Browser baseline: 12 failures out of 13 scenarios before fixes.
- Final browser suite: 16/16 passed in installed Microsoft Edge, including the full desktop intro and a mobile viewport.
- Checker fixtures: 9/9 passed; eight invalid cases were first observed passing incorrectly before the checker was extended.
- Static check: 72 translation keys and 23 assets matched; module syntax, both deployment JSON files, slots, routes and fallback HTML passed.
- Diff whitespace check passed. Existing user changes to iPod materials and camera lighting/compilation remain present.
- Independent reviewer could not run because of its usage limit. Final diff was reviewed locally instead.
- No commit, push or deployment was performed. The sibling redirect folder is outside this Git repository.
