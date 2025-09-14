# Vercel Environment Variables Setup

To fix the server-side runtime error, the following environment variables need to be set in the Vercel dashboard:

## Required Environment Variables

### 1. Mock Mode (for demo)
```
NEXT_PUBLIC_MOCK=1
```

### 2. NextAuth Configuration
```
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here-use-a-long-random-string
NEXTAUTH_URL=https://your-vercel-deployment-url.vercel.app
```

### 3. API Configuration (leave empty for mock mode)
```
NEXT_PUBLIC_API_BASE_URL=
```

## How to set these in Vercel:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add each variable above:
   - **NEXT_PUBLIC_MOCK**: Set to `1`
   - **NEXTAUTH_SECRET**: Generate a secure random string (32+ characters)
   - **NEXTAUTH_URL**: Set to your Vercel deployment URL (e.g., `https://globapay-platform-xxx.vercel.app`)
   - **NEXT_PUBLIC_API_BASE_URL**: Leave empty (blank value)

## Generate NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use any secure random string generator.

## Notes

- With `NEXT_PUBLIC_MOCK=1`, the app runs in demo mode with mock data
- No real API backend is required when in mock mode
- The `NEXTAUTH_URL` should match your actual Vercel deployment URL
- After setting environment variables, redeploy the application