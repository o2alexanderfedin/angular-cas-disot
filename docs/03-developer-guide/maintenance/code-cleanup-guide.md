[← Back to Developer Guide](../README.md) | [Architecture](../architecture/) | [Testing](../testing/)

---

# Angular Code Cleanup Tools & Approaches - Comprehensive Guide

> **Document Version**: 1.0  
> **Last Updated**: January 2025  
> **Scope**: Angular TypeScript Applications  
> **Audience**: Developers, Tech Leads, Architects

## Executive Summary

This guide provides a comprehensive overview of tools and approaches for detecting and removing unused/dead code in Angular TypeScript projects. Code cleanup is essential for maintaining performance, reducing bundle sizes, and improving maintainability. This document covers automated tools, manual techniques, and best practices for systematic dead code elimination.

## 1. Primary Dead Code Detection Tools

### 1.1 Knip (Most Recommended)

**Overview**:
Knip is the most comprehensive tool for unused code detection in Angular applications. It identifies unused files, dependencies, and exports in JavaScript and TypeScript projects.

**Key Features**:
- Reports unused dependencies and devDependencies from package.json
- Detects files never imported by non-test code
- Identifies unused class members and enum members
- Angular-aware analysis with framework-specific rules
- Supports monorepos and complex project structures
- Configurable rules and ignore patterns

**Installation**:
```bash
npm install -g knip
# or
npm install --save-dev knip
```

**Usage**:
```bash
# Basic usage
knip

# With configuration file
knip --config knip.config.js

# Dry run (preview only)
knip --dry-run

# Include dependencies analysis
knip --dependencies
```

**Configuration Example**:
```javascript
// knip.config.js
module.exports = {
  entry: ['src/main.ts', 'src/polyfills.ts'],
  project: ['src/**/*.ts'],
  ignore: ['src/environments/**'],
  ignoreDependencies: ['@angular/cli']
};
```

**Results Example**:
- Detected 435 lines of unused code (1.61% of total LOC)
- Identified 16 unused files
- Found 8 unused dependencies

### 1.2 ts-prune

**Overview**:
A lightweight tool that finds unused exports in TypeScript projects. Works exceptionally well out of the box with minimal configuration.

**Key Features**:
- Simple, focused on unused exports
- Fast execution
- Clear, actionable output
- Works with any TypeScript project
- Minimal configuration required

**Installation**:
```bash
npm install -g ts-prune
# or
npx ts-prune
```

**Usage**:
```bash
# Basic usage
ts-prune

# With specific tsconfig
ts-prune --project ./tsconfig.json

# Exclude test files
ts-prune --ignore "*.spec.ts"
```

**Output Example**:
```
src/app/unused-service.ts:5 - bar (used in module but exported)
src/app/models/user.ts:12 - UserRole (unused export)
```

### 1.3 ngx-unused (Angular-Specific)

**Overview**:
Angular-specific tool that checks for unused components, services, and other Angular artifacts in HTML templates and module declarations.

**Key Features**:
- Checks usage in HTML templates
- Detects unused Angular components
- Identifies unused services and pipes
- Understands Angular module structure
- Template-aware analysis

**Installation**:
```bash
npm install -g ngx-unused
```

**Usage**:
```bash
# Basic usage
npx ngx-unused <source-root> -p <tsconfig-path>

# Example
npx ngx-unused src -p tsconfig.json

# With specific patterns
npx ngx-unused src -p tsconfig.json --exclude "*.spec.ts"
```

**Why Important**:
Generic TypeScript tools miss Angular-specific unused code. A component imported in `app.module.ts` but never used in templates appears "used" to standard tools.

### 1.4 ts-unused-exports

**Overview**:
Alternative to ts-prune for finding unused exports with different analysis algorithms.

**Installation**:
```bash
npm install -g ts-unused-exports
```

**Usage**:
```bash
ts-unused-exports tsconfig.json
```

## 2. TypeScript Compiler Configuration

### 2.1 Built-in TypeScript Options

**Configuration**:
Add these options to your `tsconfig.json` for compile-time unused code detection:

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exact": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Benefits**:
- Immediate feedback during development
- Catches unused variables and parameters
- Integrated with IDE error reporting
- No additional tools required

### 2.2 Angular CLI Integration

**AOT Compilation**:
```bash
# Shows unused code during compilation
ng serve --aot
ng build --prod

# More verbose output
ng build --prod --verbose
```

**Bundle Analysis**:
```bash
# Analyze bundle size and unused code
ng build --prod --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

## 3. IDE and Editor Solutions

### 3.1 Visual Studio Code

**Extensions**:
- **TypeScript Hero**: Organizes imports and removes unused ones
- **Auto Import - ES6, TS, JSX, TSX**: Manages imports automatically
- **Find unused exports**: Highlights unused exports in project
- **TypeScript Unused**: Shows unused code inline

**ESLint Integration**:
```json
// .eslintrc.json
{
  "extends": ["@angular-eslint/recommended"],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

**Settings**:
```json
// settings.json
{
  "typescript.preferences.organizeImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

### 3.2 WebStorm/IntelliJ

**Built-in Features**:
- **Analyze > Inspect Code**: Comprehensive code analysis
- **Code > Optimize Imports**: Remove unused imports
- **Find Usages**: Track code usage across project
- **Safe Delete**: Checks dependencies before deletion

**Configuration**:
```typescript
// Enable inspection profiles
// File > Settings > Editor > Inspections
// - TypeScript > Unused symbol
// - TypeScript > Unused import
```

## 4. Tool Comparison Matrix

| Tool | Type | Angular Support | Dependencies | Templates | Performance | Ease of Use |
|------|------|-----------------|--------------|-----------|-------------|-------------|
| **Knip** | Comprehensive | ✅ Excellent | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **ts-prune** | Exports Only | ✅ Good | ❌ No | ❌ No | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ngx-unused** | Angular-Specific | ✅ Excellent | ❌ No | ✅ Yes | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **ts-unused-exports** | Exports Only | ✅ Good | ❌ No | ❌ No | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **TypeScript Compiler** | Built-in | ✅ Good | ❌ No | ❌ No | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **IDE Solutions** | Integrated | ✅ Good | ❌ Limited | ❌ Limited | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 5. Implementation Strategies

### 5.1 Automated Workflow

**CI/CD Integration**:
```yaml
# .github/workflows/code-cleanup.yml
name: Code Cleanup Check
on: [push, pull_request]
jobs:
  unused-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Check for unused code
        run: |
          npx knip --reporter json > unused-code.json
          npx ts-prune > unused-exports.txt
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: unused-code-report
          path: |
            unused-code.json
            unused-exports.txt
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "cleanup:check": "knip && ts-prune",
    "cleanup:deps": "knip --dependencies",
    "cleanup:exports": "ts-prune",
    "cleanup:angular": "ngx-unused src -p tsconfig.json",
    "cleanup:all": "npm run cleanup:check && npm run cleanup:angular"
  }
}
```

### 5.2 Manual Cleanup Process

**Step-by-Step Approach**:

1. **Initial Assessment**:
   ```bash
   # Get overview of unused code
   npx knip --dry-run
   npx ts-prune | head -20
   ```

2. **Safe Deletion Order**:
   - Remove unused imports first
   - Delete unused utility functions
   - Remove unused components (check templates)
   - Clean up unused services
   - Remove unused dependencies

3. **Verification**:
   ```bash
   # After each cleanup round
   npm run test
   npm run build
   npm run lint
   ```

### 5.3 Gradual Cleanup Strategy

**Phase 1: Low-Risk Items**
- Unused imports
- Unused utility functions
- Unused constants and enums

**Phase 2: Medium-Risk Items**
- Unused services (check dependency injection)
- Unused components (verify template usage)
- Unused pipes and directives

**Phase 3: High-Risk Items**
- Unused modules
- Unused dependencies
- Large refactoring opportunities

## 6. Best Practices and Guidelines

### 6.1 Pre-Cleanup Preparation

**Backup Strategy**:
```bash
# Create backup branch
git checkout -b feature/code-cleanup
git commit -m "Backup before cleanup"

# Or use stash
git stash push -m "Before cleanup"
```

**Testing Requirements**:
- Ensure all tests pass
- Run end-to-end tests
- Check build in production mode
- Verify no runtime errors

### 6.2 Cleanup Execution

**Iterative Process**:
1. Run analysis tools
2. Remove safest items first
3. Test after each batch
4. Commit frequently with descriptive messages
5. Re-run analysis to find newly unused code

**Safety Checks**:
- Check for dynamic imports
- Verify Angular lazy-loaded modules
- Look for reflection-based usage
- Consider public API exports

### 6.3 Exceptions and Special Cases

**Keep These "Unused" Items**:
- Public API exports (libraries)
- Component prop types (consumed by templates)
- Dependency injection tokens
- Angular lifecycle hooks (even if empty)
- Environment-specific code

**Angular-Specific Considerations**:
- Check `@Component` selector usage in templates
- Verify `@Injectable` services in providers arrays
- Look for `@Pipe` usage in templates
- Check route component usage in routing modules

## 7. Advanced Techniques

### 7.1 Custom Analysis Scripts

**Find Unused Angular Components**:
```typescript
// scripts/find-unused-components.ts
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function findUnusedComponents(srcDir: string): string[] {
  const components = findAllComponents(srcDir);
  const templates = findAllTemplates(srcDir);
  const modules = findAllModules(srcDir);
  
  return components.filter(component => {
    const selector = getComponentSelector(component);
    return !isUsedInTemplates(selector, templates) && 
           !isUsedInModules(component, modules);
  });
}
```

**Dependency Graph Analysis**:
```bash
# Generate dependency graph
npx madge --image deps.png src/

# Find circular dependencies
npx madge --circular src/

# Find unused files
npx madge --orphans src/
```

### 7.2 Bundle Analysis Integration

**Webpack Bundle Analyzer**:
```bash
# Generate stats file
ng build --prod --stats-json

# Analyze bundle
npx webpack-bundle-analyzer dist/stats.json

# Find unused assets
npx unused-webpack-plugin
```

**Source Map Explorer**:
```bash
npm install -g source-map-explorer
ng build --prod --source-map
source-map-explorer dist/main.*.js
```

## 8. Monitoring and Maintenance

### 8.1 Continuous Monitoring

**Pre-commit Hooks**:
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "npx ts-prune --error-on-unused"
    ]
  }
}
```

**Regular Cleanup Schedule**:
- Weekly: Run ts-prune for new unused exports
- Monthly: Full knip analysis
- Quarterly: Comprehensive cleanup with ngx-unused

### 8.2 Team Guidelines

**Code Review Checklist**:
- [ ] No unused imports added
- [ ] New components used in templates
- [ ] New services properly injected
- [ ] Exports have clear purpose
- [ ] Dependencies are necessary

**Documentation**:
- Maintain list of intentionally unused exports
- Document public API boundaries
- Keep cleanup tool configurations in version control

## 9. Troubleshooting Common Issues

### 9.1 False Positives

**Angular Lifecycle Hooks**:
```typescript
// May appear unused but are called by Angular
export class MyComponent implements OnInit, OnDestroy {
  ngOnInit() {} // Appears unused but required
  ngOnDestroy() {} // Appears unused but required
}
```

**Dynamic Imports**:
```typescript
// May not be detected by static analysis
const module = await import(`./modules/${moduleName}`);
```

**Template Usage**:
```html
<!-- Component methods used in templates -->
<button (click)="handleClick()">Click</button>
```

### 9.2 Tool-Specific Issues

**Knip Configuration**:
```javascript
// knip.config.js - handle false positives
module.exports = {
  ignore: [
    'src/app/shared/utils/dynamic-loader.ts', // Dynamic imports
    'src/app/models/api-types.ts' // External API types
  ],
  ignoreDependencies: [
    '@angular/cli', // Development tool
    'zone.js' // Required by Angular
  ]
};
```

**ts-prune Limitations**:
- Doesn't understand Angular templates
- May miss dynamic usage
- Requires manual verification

## 10. Conclusion and Recommendations

### 10.1 Recommended Toolchain

**Primary Tools**:
1. **Knip** - Comprehensive analysis and dependency cleanup
2. **ngx-unused** - Angular-specific template checking
3. **TypeScript Compiler** - Built-in unused variable detection

**Secondary Tools**:
- **ts-prune** - Quick export verification
- **ESLint** - Ongoing code quality
- **Bundle Analyzer** - Performance impact assessment

### 10.2 Success Metrics

**Code Quality Improvements**:
- Reduced bundle size (10-30% typical)
- Faster build times
- Improved code maintainability
- Better developer experience

**Process Improvements**:
- Automated cleanup detection
- Consistent code reviews
- Reduced technical debt
- Better dependency management

### 10.3 Final Recommendations

1. **Start Small**: Begin with ts-prune for quick wins
2. **Automate**: Integrate tools into CI/CD pipeline
3. **Be Patient**: Cleanup is iterative and requires testing
4. **Document**: Keep track of intentional exceptions
5. **Monitor**: Regular analysis prevents accumulation

The combination of automated tools and manual review provides the most effective approach to maintaining clean, efficient Angular codebases. Regular cleanup reduces technical debt and improves application performance while maintaining code quality standards.

---

## Related Documentation

- [Testing Strategy](../testing/testing-strategy.md) - Learn about testing approaches and coverage
- [Project Structure](../implementation/project-structure.md) - Understand the Angular project organization
- [Architecture Overview](../architecture/system-design.md) - See how components fit together
- [Contributing Guide](../contributing.md) - Guidelines for contributing to the project
- [Build Process](../../05-deployment/build-process.md) - Understanding the build pipeline

## Quick Links

- [Knip Documentation](https://github.com/webpro/knip)
- [ts-prune Documentation](https://github.com/nadeesha/ts-prune)
- [ngx-unused Documentation](https://github.com/ymhuang0808/ngx-unused)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)

---

[← Back to Developer Guide](../README.md) | [Top of Page](#angular-code-cleanup-tools--approaches---comprehensive-guide) | [Next: Testing →](../testing/)

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create comprehensive code cleanup report structure", "status": "completed", "priority": "high"}, {"id": "2", "content": "Document all dead code detection tools with detailed analysis", "status": "in_progress", "priority": "high"}, {"id": "3", "content": "Add implementation guides and best practices for each tool", "status": "pending", "priority": "medium"}, {"id": "4", "content": "Include workflow recommendations and tool comparison matrix", "status": "pending", "priority": "medium"}]