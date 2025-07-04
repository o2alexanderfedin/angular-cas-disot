# Testing Quick Reference

For comprehensive testing documentation, see [docs/testing/testing-guide.md](docs/testing/testing-guide.md)

## Quick Commands

```bash
# Run all tests once (CI mode)
npm test

# Run tests in watch mode (development)
ng test

# Run tests with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/cas.service.spec.ts'
```

## Test Organization

This project follows **Angular best practices** with co-located tests:

```
service.ts      → service.spec.ts      (same directory)
component.ts    → component.spec.ts    (same directory)
```

### Why Co-located Tests?

1. **Industry Standard** - Angular, React, Vue all recommend this
2. **Easy to Find** - Test is always next to source file
3. **Refactor Together** - Move/rename both files together
4. **Clear Ownership** - Obvious which test covers which code
5. **Simple Imports** - No complex relative paths

## Current Test Statistics

- **Total Tests**: 74
- **Service Tests**: 30
- **Component Tests**: 44
- **Test Files**: 9
- **All Passing**: ✅

## Test File Locations

```
src/app/
├── app.spec.ts
├── core/services/
│   ├── cas.service.spec.ts
│   ├── disot.service.spec.ts
│   ├── hash.service.spec.ts
│   └── signature.service.spec.ts
└── features/
    ├── content/
    │   ├── content-list/content-list.component.spec.ts
    │   └── content-upload/content-upload.component.spec.ts
    └── disot/
        ├── disot-entry/disot-entry.component.spec.ts
        └── signature-verification/signature-verification.component.spec.ts
```

This is the recommended structure by:
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Angular Style Guide](https://angular.io/guide/styleguide#style-04-06)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing Library Principles](https://testing-library.com/docs/)