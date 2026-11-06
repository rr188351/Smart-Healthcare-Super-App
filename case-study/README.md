# Smart Healthcare Super App — Portfolio Case Study

This folder contains an independent, static UX/UI portfolio website for the Smart Healthcare Super App.
It uses vanilla HTML, CSS, and JavaScript and does not depend on the React application at runtime.

## Contents

- `index.html` — semantic long-form case study
- `css/` — design tokens, responsive layout, and motion
- `js/` — navigation, gallery, lightbox, diagrams, and interaction demos
- `assets/screenshots/` — genuine 390 × 844 captures from the running React application

The planning source explicitly states that research, personas, pain points, competitor review, accessibility
audit, and usability testing are proposed activities. The website preserves that status and does not invent
participant counts, quotes, metrics, findings, or competitor claims.

## Local preview

From the repository root, use any static file server. For example:

```sh
python3 -m http.server 8080 --directory case-study
```

Then open `http://localhost:8080`.

Opening `case-study/index.html` directly also works in modern browsers, although a local server is recommended.

## GitHub Pages

The website uses relative paths and can be hosted from a repository subpath.

1. Keep `case-study/` in the repository.
2. In the repository settings, open **Pages**.
3. Choose a source appropriate for the repository:
   - deploy from a branch and publish a branch/folder that contains the static site, or
   - use a GitHub Actions workflow that copies `case-study/` to the Pages artifact.
4. Do not point Pages at the React app’s Vite output unless both sites are intentionally combined.

The repository name and final public URL are intentionally not assumed here.

## Asset notes

- App screenshots were captured from the local running React application at 390 × 844.
- The doctor portrait is the existing Unsplash selection by Usman Yousaf and was localized in the app for reliable rendering.
- Low-fidelity wireframes in the website are clearly labeled conceptual reconstructions because original wireframe exports were not present.

## Scope and limitations

- The mobile product is a design prototype.
- No real healthcare providers, pharmacy, lab, payment, health-record, video, Google OAuth, or emergency-response service is connected.
- The case-study interaction demos illustrate the implemented design language; they are not healthcare functionality.
