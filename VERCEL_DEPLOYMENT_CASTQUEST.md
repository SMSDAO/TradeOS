# Vercel Deployment Guide for CastQuest

This guide explains how to deploy the TradeOS webapp to Vercel under the CastQuest project.

## Prerequisites

- Vercel account with access to CastQuest project
- Node.js 24+ installed locally for testing

## Vercel Dashboard Configuration

### 1. Root Directory Setting
**CRITICAL**: Set the Root Directory in Vercel project settings to `webapp`

Navigate to: Project Settings → General → Root Directory
- Set to: `webapp`
- This ensures Vercel builds only the Next.js app, not the root backend code

### 2. Build & Development Settings
These are automatically configured via `vercel.json`:
- Build Command: `cd webapp && npm install && npm run build`
- Output Directory: `webapp/.next`
- Install Command: `cd webapp && npm install`

### 3. Environment Variables
Required variables for production:
```
NEXT_PUBLIC_RPC_URL=<your-premium-solana-rpc>
NODE_ENV=production
```

Optional but recommended:
```
NEXT_PUBLIC_HELIUS_RPC=<helius-endpoint>
NEXT_PUBLIC_QUICKNODE_RPC=<quicknode-endpoint>
NEXT_PUBLIC_BACKEND_URL=<backend-api-url>
NEXT_PUBLIC_WS_URL=<websocket-url>
```

### 4. Node.js Version
- Set to Node.js 24.x in Vercel dashboard if available
- Functions runtime uses nodejs22.x (configured in vercel.json)

## Build Configuration

The repository includes:
- `vercel.json` - Vercel-specific configuration
- `webapp/next.config.ts` - Next.js configuration
- `webapp/package.json` - Dependencies with Node >=24 engines requirement

## Local Testing

Before deploying, test the build locally:

```bash
cd webapp
npm install
npm run build
npm start
```

Visit http://localhost:3000 to verify the build.

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended)
1. Go to Cast Quest project in Vercel dashboard
2. Navigate to Settings → General
3. Ensure Root Directory is set to `webapp`
4. Go to Deployments
5. Click "Redeploy" on the latest deployment
6. Verify environment variables are set
7. Monitor build logs

### Option 2: Vercel CLI
```bash
# From repository root
vercel --prod

# The vercel.json configuration will handle the rest
```

### Option 3: Git Push (Auto-deploy)
```bash
git push origin main  # or your production branch
# Vercel will automatically detect and deploy
```

## Troubleshooting

### Build Error: "Module not found"
- Verify Root Directory is set to `webapp` in Vercel dashboard
- This prevents Next.js from incorrectly resolving to parent directory modules

### Build Error: "Cannot find bcrypt/jsonwebtoken"
- Ensure dependencies are installed: `bcrypt` and `jsonwebtoken` are in `webapp/package.json`
- Check that build command includes `npm install`

### 404 Errors / Routing Issues
- Verify `vercel.json` has correct output directory: `webapp/.next`
- Check that Next.js app routes are defined in `webapp/app/`
- Ensure no conflicting rewrites in Vercel configuration

### Environment Variable Issues
- Run validation: `bash scripts/validate-vercel-env.sh`
- Verify all required variables are set in Vercel dashboard
- Check that NEXT_PUBLIC_ prefixed variables are accessible client-side

## Production Checklist

- [ ] Root Directory set to `webapp` in Vercel dashboard
- [ ] All environment variables configured
- [ ] Premium RPC endpoints configured (not free tier)
- [ ] Node.js 24 selected (or 22 as fallback)
- [ ] Build succeeds locally with `cd webapp && npm run build`
- [ ] No TypeScript errors in webapp code
- [ ] Test deployment on Vercel preview first
- [ ] Monitor first production deployment logs
- [ ] Verify all routes load correctly (/, /swap, /admin, etc.)
- [ ] Check browser console for errors
- [ ] Verify API routes work correctly

## Security Notes

- Never commit `.env` files with real values
- Use Vercel's encrypted environment variables feature
- Premium RPC URLs should not be logged (see `scripts/validate-rpc-premium.sh`)
- Admin routes require proper authentication (see webapp/lib/auth.ts)

## Support

For deployment issues:
1. Check Vercel build logs
2. Review this guide's troubleshooting section
3. Verify local build works: `cd webapp && npm run build`
4. Check that Root Directory is set correctly in Vercel dashboard

## Architecture Notes

This monorepo contains:
- `/webapp` - Next.js frontend (deployed to Vercel)
- `/src` - Backend Node.js code (not deployed to Vercel)
- `/admin` - Electron desktop app (not deployed to Vercel)

Only the webapp directory is deployed to Vercel. The Root Directory setting ensures this isolation.
