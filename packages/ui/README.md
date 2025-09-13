# @globapay/ui

Shared UI component library for the Globapay Platform, built with shadcn/ui components.

## Features

- React components with TypeScript
- Tailwind CSS for styling
- Radix UI primitives
- Class variance authority for variants
- ESLint and Prettier for code quality

## Components

- `Button` - Flexible button component with multiple variants
- `Card` - Card component with header, content, and footer sections
- `cn` - Utility function for conditional class names

## Getting Started

### Prerequisites

- React 18+
- Tailwind CSS

### Installation

This package is part of the Globapay Platform monorepo and is consumed by other packages in the workspace.

### Usage

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@globapay/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="primary">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Scripts

- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run tests once

## Styling

The package includes Tailwind CSS configuration and CSS custom properties for theming. Import the styles in your application:

```tsx
import '@globapay/ui/styles';
```