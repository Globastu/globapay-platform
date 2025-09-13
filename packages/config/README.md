# @globapay/config

Shared configuration files for the Globapay Platform monorepo.

## Features

- ESLint configuration with TypeScript support
- Base TypeScript configuration
- Prettier integration
- Strict type checking rules

## Contents

### ESLint Preset (`eslint-preset.js`)

Base ESLint configuration with:
- TypeScript support
- Prettier integration
- Strict type checking rules
- Test file overrides

### TypeScript Config (`tsconfig.json`)

Base TypeScript configuration with:
- ES2022 target
- Strict mode enabled
- Path mapping support
- Next.js compatibility

## Usage

### ESLint

Extend the base configuration in your `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['@globapay/config/eslint-preset'],
  // Add package-specific overrides here
};
```

### TypeScript

Extend the base configuration in your `tsconfig.json`:

```json
{
  "extends": "@globapay/config/tsconfig.json",
  "compilerOptions": {
    // Add package-specific options here
  }
}
```

### Scripts

- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## Rules

The ESLint configuration enforces:
- No unused variables (with underscore prefix exception)
- Explicit function return types
- No explicit `any` types
- Prefer nullish coalescing and optional chaining
- Exhaustive switch statement checks