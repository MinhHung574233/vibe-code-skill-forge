# SkillForge

Personal growth and training hub – an offline-first PWA for one iPhone (Rubik, English, Java & Spring, developer tools, Caro, Chess, Go, with a shared XP / streak / goals engine). No backend, no accounts; all data stays on the device in IndexedDB.

Docs: [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Design system](docs/DESIGN_SYSTEM.md) · [iOS PWA constraints](docs/IOS_PWA.md) · [Technical decisions](docs/TECHNICAL_DECISIONS.md) · [Roadmap & status](docs/ROADMAP.md) · [Deployment](docs/DEPLOYMENT.md)

## Requirements
Node 22 (`>=22.12`).

## Commands
| Command | Purpose |
|---|---|
| `npm ci` | install exact locked dependencies |
| `npm run dev` | Vite dev server (service worker disabled in dev) |
| `npm run verify` | typecheck + ESLint + unit/integration tests (run after every change) |
| `npm run build` | typecheck + production build to `dist/` (static files, `sw.js`, manifest, icons, splash) |
| `npm run preview` | serve `dist/` at http://localhost:4173 |
| `npm run e2e` | Playwright smoke tests against the build (installed Edge; offline behaviour) |
| `npm run verify:full` | verify + build + e2e |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting, installing on iPhone, offline testing and backup/restore.
