# GitHub Pages Deployment 🚀

[⬅️ Deployment Options](./README.md) | [🏠 Documentation Home](../)

## Overview

This guide explains how to deploy the CAS/DISOT Angular application to GitHub Pages for free hosting.

## Live Demo

The application is available at: https://o2alexanderfedin.github.io/angular-cas-disot/

## Prerequisites

- Node.js installed
- Git configured
- GitHub repository with push access

## Quick Deploy

Deploy to GitHub Pages with a single command:

```bash
npm run deploy:ghpages
```

This command will:
1. Build the Angular app with the correct base href
2. Deploy the built files to the `gh-pages` branch
3. GitHub Pages will automatically serve the app

## Manual Setup

### 1. Install Dependencies

```bash
npm install --save-dev gh-pages
```

### 2. Add Deployment Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:ghpages": "ng build --base-href /angular-cas-disot/",
    "deploy:ghpages": "npm run build:ghpages && npx gh-pages -d dist/cas-app/browser"
  }
}
```

### 3. Configure Angular

The `--base-href` flag is crucial. Replace `/angular-cas-disot/` with your repository name:
- Format: `/your-repo-name/`
- Example: `/my-app/`

### 4. Deploy

```bash
npm run deploy:ghpages
```

### 5. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Choose `gh-pages` branch and `/ (root)` folder
5. Click Save

## Troubleshooting

### 404 Errors on Refresh

For Angular's routing to work on GitHub Pages, create a `404.html` that redirects to `index.html`:

```bash
cp dist/cas-app/index.html dist/cas-app/404.html
```

### Base Href Issues

Ensure the base href matches your repository name:
- Wrong: `--base-href /`
- Correct: `--base-href /angular-cas-disot/`

### Build Errors

If you see "Cannot read outputPath" errors:
- Use `gh-pages` directly instead of `angular-cli-ghpages`
- The newer Angular build system doesn't expose outputPath

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build:ghpages
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/cas-app
```

## Custom Domain

To use a custom domain:

1. Create a `CNAME` file in `src/` with your domain:
   ```
   example.com
   ```

2. Update `angular.json` to include it:
   ```json
   "assets": [
     "src/favicon.ico",
     "src/assets",
     "src/CNAME"
   ]
   ```

3. Configure DNS:
   - Add A records pointing to GitHub's IPs
   - Or add a CNAME record pointing to `username.github.io`

## Important Notes

- GitHub Pages is free for public repositories
- Private repositories require GitHub Pro
- The site may take a few minutes to appear after first deployment
- Updates typically deploy within 10 minutes
- The `gh-pages` branch is managed automatically

---

[⬅️ Deployment Options](./README.md) | [⬆️ Top](#github-pages-deployment) | [🏠 Documentation Home](../)