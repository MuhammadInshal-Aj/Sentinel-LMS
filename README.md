# Sentinel LMS

![Sentinel LMS](assets/sentinel-mark.svg)

Sentinel LMS is a security-focused learning management system for teaching information security through structured courses, progress tracking, and interactive simulations. It combines a cyber-inspired interface with a practical learning workflow: create an account, enroll in a track, complete lessons, earn tokens, and monitor progress from a personal dashboard.

> **Project status:** Active development. The current repository includes the landing, authentication, dashboard, course catalog, and Information Security course experience.

## Contents

- [Highlights](#highlights)
- [Pages and UI/UX](#pages-and-uiux)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Cloning into your own organization](#cloning-into-your-own-organization)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Security notes](#security-notes)
- [Roadmap](#roadmap)
- [License](#license)

## Highlights

- Dark, high-contrast cyber-security visual language with cyan accents.
- Responsive shared layout, navigation, typography, icons, cards, progress widgets, and toast notifications.
- Supabase-backed registration and login flows.
- Authenticated dashboard with progress circles, course status, token balance, and learning streak UI.
- Course catalog grouped by foundation, intermediate, and advanced levels.
- Information Security track with modules, lessons, simulations, checkpoints, enrollment, unlocking, and progress interactions.
- Express API with Supabase authentication and track, module, lesson, enrollment, and progress endpoints.
- Curriculum content stored as structured JSON and Markdown so it can grow independently from the UI.

## Pages and UI/UX

| Page | File | Experience |
| --- | --- | --- |
| Public landing page | [`frontend/landing.html`](frontend/landing.html) | Product introduction, course highlights, mission/about content, contact area, and calls to action. |
| Login | [`frontend/login.html`](frontend/login.html) | Focused “System Access” form with cyber background, validation feedback, loading state, and secure redirect into the dashboard. |
| Registration | [`frontend/register.html`](frontend/register.html) | Guided “New Enlistment” form for name, email, and password creation. |
| Learner dashboard and courses | [`frontend/index.html`](frontend/index.html) | Authenticated sidebar experience with progress rings, streak widget, token balance, course cards, and “My Courses” views. |
| Information Security course | [`frontend/infoSec.html`](frontend/infoSec.html) | Course header, outcomes, curriculum modules, lesson rows, simulations, checkpoints, enrollment state, and module unlocking. |

The UI uses shared styles in [`frontend/Styles/`](frontend/Styles/) and shared browser modules for API calls, authentication, navigation, and notifications. The visual system uses Space Grotesk and JetBrains Mono, Lucide icons, glass-like dark surfaces, subtle borders, hover elevation, progress indicators, and keyboard/focus states.

## Technology

- **Frontend:** HTML5, CSS3, and browser JavaScript
- **Backend:** Node.js, Express 5, CORS, dotenv, and bcrypt
- **Data and authentication:** Supabase
- **Curriculum:** JSON track definitions and Markdown lesson/simulation content
- **External UI resources:** Google Fonts and Lucide Icons

## Project structure

```text
.
├── assets/                 # Branding assets
├── backend/
│   ├── src/app.js          # Express routes and Supabase integration
│   ├── src/server.js       # HTTP server entry point
│   └── package.json        # Backend dependencies
├── config/                 # Configuration documentation/placeholders
├── content/                # Content documentation/placeholders
├── curriculum/
│   ├── tracks/             # Track, module, lesson, and simulation metadata
│   └── contents/           # Markdown learning content
├── docs/                   # Documentation index
├── frontend/
│   ├── *.html              # User-facing pages
│   ├── *.js                # Frontend modules
│   └── Styles/             # Shared CSS
├── labs/                   # Lab documentation/placeholders
├── scripts/                # Script documentation/placeholders
├── tests/                  # Test documentation/placeholders
├── tools/                  # Tooling documentation/placeholders
├── LICENSE
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18 or newer and npm
- A Supabase project
- A local static-file server for the frontend

### 1. Clone the repository

```bash
git clone https://github.com/MuhammadInshal-Aj/Sentinel-LMS.git
cd Sentinel-LMS
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure Supabase

Create `backend/.env` and add the credentials for your Supabase project:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

Do not commit `.env` or any secret key. The repository ignores environment files by default.

### 4. Start the API

From `backend/`, run:

```bash
node src/server.js
```

The API is available at `http://localhost:3000`. The root endpoint can be used as a health check.

### 5. Serve the frontend

Open a second terminal at the repository root and serve the `frontend` directory with any static server. For example, if `serve` is available:

```bash
npx serve frontend
```

Open the URL printed by the static server, then register or log in. The local frontend configuration points API requests at `http://localhost:3000`.

## Cloning into your own organization

You can copy Sentinel LMS into an organization you administer without paying a license fee.

1. Sign in to GitHub and open the [Sentinel-LMS repository](https://github.com/MuhammadInshal-Aj/Sentinel-LMS).
2. Select **Fork**, choose your organization, and confirm the fork. This preserves the upstream relationship for future updates.
3. If your organization needs an independent repository, create a new repository under the organization and copy the project files, or mirror the fork into it.
4. Clone the organization repository locally:

   ```bash
   git clone https://github.com/YOUR-ORGANIZATION/Sentinel-LMS.git
   cd Sentinel-LMS
   ```

5. Create a Supabase project for the organization and configure its database tables, authentication, and curriculum data.
6. Create `backend/.env` with that project's URL and anonymous key, then run `npm install` inside `backend/`.
7. Start the backend with `node src/server.js` and serve `frontend/` from a local or hosted static server.
8. Update [`frontend/config.js`](frontend/config.js) with the organization's production API URL before deployment.
9. Review branding, curriculum, security rules, and deployment settings, then push organization-specific changes to your repository.
10. Keep the [`LICENSE`](LICENSE) file and copyright notice with redistributed copies, as required by the MIT license.

## Configuration

Frontend runtime settings and feature flags are centralized in [`frontend/config.js`](frontend/config.js). The backend reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `PORT` from `backend/.env`.

Before production deployment:

- Replace the placeholder production API URL in `frontend/config.js`.
- Configure Supabase Row Level Security and database policies for your own project.
- Restrict CORS to trusted frontend origins instead of allowing every origin.
- Serve the frontend and API over HTTPS.
- Use a production secret-management solution rather than committing environment files.

## API overview

The Express service currently exposes:

- `GET /` - backend health check
- `POST /api/register` - create a user account
- `POST /api/login` - authenticate a user
- `GET /api/tracks` - list published tracks
- Authenticated track, module, enrollment, lesson, and progress routes in [`backend/src/app.js`](backend/src/app.js)

## Security notes

Sentinel LMS is an educational project and should be reviewed before production use. Never publish Supabase service-role keys, passwords, tokens, or private environment files. Validate authorization and database policies in the Supabase project, not only in the browser.

## Roadmap

- Persist all lesson and simulation progress through the backend.
- Add more modules and courses beyond the current Information Security track.
- Implement quizzes, exams, certificates, leaderboards, and richer simulations.
- Add automated tests and production deployment documentation.
- Improve mobile layouts and add lesson content views.

## License

Sentinel LMS is copyright © 2026 Muhammad Inshal and is released under the [MIT License](LICENSE). The license allows anyone to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software free of charge, subject to the license conditions.

Third-party dependencies and external assets remain subject to their own licenses and terms.
