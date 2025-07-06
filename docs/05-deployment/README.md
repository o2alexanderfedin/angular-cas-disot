# Deployment Guide 🚀

[⬅️ Documentation Home](../)

## Overview

This guide covers everything you need to deploy the CAS/DISOT application to production.

### Deployment Options

- [Build Process](./build-process.md) - Building for production
- [Configuration](./configuration.md) - Environment configuration
- [Hosting Options](./hosting/) - Where to deploy
- [Monitoring](./monitoring.md) - Production monitoring

### Quick Start

```bash
# Build for production
npm run build:production

# Build for staging
npm run build:staging

# Preview builds locally
npm run preview:production  # Port 4202
npm run preview:staging     # Port 4201

# Output is in dist/cas-app/browser/
# Ready for static hosting!
```

### Hosting Providers

#### Static Hosting (Recommended)
- GitHub Pages (free)
- Netlify (free tier)
- Vercel (free tier)
- AWS S3 + CloudFront
- Azure Static Web Apps

#### Container Hosting
- Docker deployment
- Kubernetes
- Cloud Run

### Deployment Environments

#### Production
- URL: https://o2alexanderfedin.github.io/angular-cas-disot/
- Base href: `/angular-cas-disot/`
- Branch: `master` or version tags
- Deployment: Automatic via GitHub Actions

#### Staging
- URL: https://o2alexanderfedin.github.io/angular-cas-disot/staging/
- Base href: `/angular-cas-disot/staging/`
- Branch: `master`
- Deployment: Automatic after production succeeds

### CI/CD Pipeline

The project uses GitHub Actions for automated deployment:
1. Tests run on all pushes and PRs
2. Production deploys on `master` push or version tags
3. Staging deploys after production succeeds (avoids conflicts)
4. Coverage reports included in deployments

### Production Checklist

- [ ] Environment variables configured
- [ ] Production build created
- [ ] Security headers set
- [ ] HTTPS enabled (automatic on GitHub Pages)
- [ ] Error tracking configured
- [ ] Analytics setup (optional)
- [ ] Code coverage meets targets
- [ ] TypeScript strict mode passing

---

[⬅️ Documentation Home](../) | [⬆️ Top](#deployment-guide)