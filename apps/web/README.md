# @globapay/web

Next.js 14 web application for the Globapay Platform dashboard.

## Features

- Next.js 14 with App Router
- TypeScript with strict configuration
- Tailwind CSS for styling
- Vitest for testing
- ESLint and Prettier for code quality

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run tests once

## Environment Variables

Create a `.env.local` file in the app root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Docker

Build and run with Docker:

```bash
docker build -t globapay-web .
docker run -p 3000:3000 globapay-web
```