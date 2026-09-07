# Portfolio Evidence Upgrade Design

## Goal

Turn the portfolio from a visually memorable gallery into a clear professional presentation that identifies Constantine immediately, proves project decisions through short case studies, offers verified paths to working software, demonstrates applied AI work, and provides a downloadable CV.

## Constraints

- Keep the existing static HTML, CSS, and JavaScript architecture.
- Preserve the desktop 3D intro, the mobile lite path, the 3D project deck, both languages, both themes, reduced motion, and no-JavaScript fallback.
- Do not invent project metrics, deployments, profile URLs, client claims, or testimonials.
- Do not add a production framework or runtime dependency.
- Do not commit, push, or deploy automatically.

## Home identity

The work canvas gains a fixed identity block that becomes visible when the work stage appears. It contains the full name, the role line "Web Developer, UI/UX Designer and Aspiring AI Engineer", a short value statement, and links to Works, Contact, and the CV. The block uses the existing type, colour tokens, and transition language. It remains compact enough to leave the draggable project plane visible and becomes a bottom-aligned card on narrow screens.

## Project case studies

Each WORKS entry gains structured fields for challenge, contribution, approach, outcome, and stack. The project dialog renders these as labelled sections. Claims remain qualitative where no measured result exists. The existing overview, year, role, screenshot, and feature list remain useful and are reorganised around the new structure.

The dialog exposes separate actions for a verified live demo and source repository. A missing action is omitted. The school platform uses its verified production URL. AI Ninja uses a first-party demo included in this repository. Other projects retain their repository action until a real deployment exists.

## Applied AI project

AI Ninja Challenge becomes the sixth project. It is an existing user-authored browser game that loads a Teachable Machine pose classifier, performs camera inference locally, recognises Attack, Deffend, and Dodge poses, and connects confidence-gated predictions to score, combo, HP, character abilities, and match history. Its model files and application are copied under `demos/ai-ninja/`, while a 16:9 screenshot is stored with the other work tiles. The portfolio case study explicitly describes model architecture and browser inference without claiming measured accuracy that has not been recorded.

## CV and professional profiles

A one-page English CV is generated as `output/pdf/constantine-rainer-simanjuntak-cv.pdf`. It includes verified contact details, profile, education, selected projects, AI activity, skills, and achievements. The home and Contact sections link to it. GitHub and Behance are included as professional profiles. LinkedIn and Dribbble are omitted until exact public URLs are available.

## Technical improvements

- Add `Person`, `WebSite`, and selected project data through JSON-LD.
- Add security headers through Vercel configuration, keeping the CDN scripts required by the AI Ninja demo available.
- Add a minimal package manifest and GitHub Actions workflow for static, unit, and browser regression checks.
- Remember intro completion in session storage so a reload in the same tab opens the work stage directly. A direct section link continues to bypass the intro.
- Expand the static checker and browser suite for the new content, links, data shape, CV, structured data, and remembered intro.

## Error and fallback behaviour

If the AI demo cannot obtain camera permission, it displays its existing readable error state. If WebGL fails, the existing HTML project grid remains available. If JavaScript fails, the fallback project list contains AI Ninja and direct links. Missing optional demo or repository URLs never render dead controls.

## Validation

- Static source and asset validation.
- Unit tests for checker failures and new content requirements.
- Browser tests at desktop and mobile widths for the home identity, case study structure, AI demo link, CV link, and remembered intro.
- Visual review of the home stage, project dialog, AI Ninja tile, AI demo, and rendered CV.
- Full existing browser regression suite.

