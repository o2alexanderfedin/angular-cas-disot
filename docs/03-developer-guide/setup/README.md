# Development Setup 🛠️

[⬅️ Developer Guide](../) | [🏠 Documentation Home](../../)

This section contains guides for setting up your development environment for the CAS/DISOT Angular application.

## Prerequisites

- **Node.js**: v20.x or v22.x (LTS versions recommended)
- **npm**: v10.x or higher
- **Git**: Latest version
- **IDE**: VS Code recommended (with Angular Language Service extension)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/o2alexanderfedin/angular-cas-disot.git
   cd angular-cas-disot/cas-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`

4. **Run tests**
   ```bash
   npm test
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 4200 |
| `npm test` | Run unit tests in headless Chrome |
| `npm test:coverage` | Run tests with code coverage report |
| `npm run build` | Build for production |
| `npm run build:staging` | Build for staging environment |
| `npm run build:production` | Build for production environment |
| `npm run preview:staging` | Preview staging build locally (port 4201) |
| `npm run preview:production` | Preview production build locally (port 4202) |

## TypeScript Configuration

The project uses strict TypeScript settings for better code quality:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

These settings help catch:
- Unused variables and parameters
- Missing return statements
- Fall-through switch cases
- Type safety issues

## Environment URLs

- **Local Development**: http://localhost:4200/
- **Staging**: https://o2alexanderfedin.github.io/angular-cas-disot/staging/
- **Production**: https://o2alexanderfedin.github.io/angular-cas-disot/

## Code Coverage

Current coverage targets:
- Statements: 73.81%
- Functions: 83.13%
- Branches: 53.1%
- Lines: 75.5%

Coverage reports are available at `/coverage/` in deployed environments.

## IDE Setup

### VS Code Extensions

Recommended extensions for development:
- Angular Language Service
- ESLint
- Prettier
- GitLens
- Angular Snippets

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Troubleshooting

### Node Version Issues
If you encounter warnings with Node v23.x, use Node v20.x or v22.x (LTS versions).

### Port Already in Use
If port 4200 is busy:
```bash
ng serve --port 4201
```

### Clean Install
If you encounter dependency issues:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- [Architecture Overview](../architecture/)
- [Testing Guide](../testing/)
- [Contributing Guidelines](../contributing.md)

---

[⬅️ Developer Guide](../) | [⬆️ Top](#development-setup-) | [🏠 Documentation Home](../../)