# Vercel Deployment Guide for CastQuest

This guide explains how to deploy the TradeOS webapp to Vercel under the CastQuest project.

## Critical Configuration Fix

**IMPORTANT**: This monorepo has both backend code in `/src` and `/lib`, and a Next.js webapp in `/webapp`. To prevent build failures where Next.js resolves to parent directory modules, you MUST configure Vercel correctly.

### Solution: Set Root Directory to `webapp`

There are TWO vercel.json files in this repository:
1. `/vercel.json` - For deploying from repository root (includes `cd webapp` commands)
2. `/webapp/vercel.json` - For deploying when Root Directory is set to `webapp` (recommended)

**Recommended Approach**: Set Root Directory to `webapp` in Vercel Dashboard and use `/webapp/vercel.json`

Navigate to: Project Settings → General → Root Directory
- Set to: `webapp`
- This ensures Vercel builds only the Next.js app from the webapp directory
- Prevents module resolution conflicts with `/lib/auth.ts` requiring bcrypt

## Prerequisites

- Vercel account with access to CastQuest project
- Node.js 24+ installed locally for testing

## Vercel Dashboard Configuration

### 1. Root Directory Setting
**CRITICAL**: Set the Root Directory in Vercel project settings to `webapp`

Navigate to: Project Settings → General → Root Directory
- Set to: `webapp`
- This ensures Vercel builds only the Next.js app, not the root backend code
- **This fixes the "Cannot resolve 'bcrypt'" build error**

### 2. Build & Development Settings
When Root Directory is set to `webapp`, settings from `/webapp/vercel.json` are used:
- Build Command: `npm install && npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

If deploying from root (not recommended), settings from `/vercel.json` are used:
- Build Command: `cd webapp && npm install && npm run build`
- Output Directory: `webapp/.next`

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
- `vercel.json` - Root-level Vercel configuration (for root deployment)
- `webapp/vercel.json` - Webapp-specific configuration (for `webapp` Root Directory)
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
1. Go to CastQuest project in Vercel dashboard
2. Navigate to Settings → General
3. **Set Root Directory to `webapp`** (critical step)
4. Go to Deployments
5. Click "Redeploy" on the latest deployment
6. Verify environment variables are set
7. Monitor build logs

### Option 2: Vercel CLI
```bash
# From repository root - requires Root Directory set to webapp in dashboard
vercel --prod

# OR deploy from webapp directory directly
cd webapp
vercel --prod
```

### Option 3: Git Push (Auto-deploy)
```bash
git push origin main  # or your production branch
# Vercel will automatically detect and deploy
# MUST have Root Directory set to webapp in dashboard
```

## Troubleshooting

### Build Error: "Module not found: Can't resolve 'bcrypt'"
**Cause**: Vercel is building from root directory, causing Next.js to resolve imports to `/lib/auth.ts` (which requires bcrypt) instead of `/webapp/lib/auth.ts`

**Solution**:
1. Go to Vercel Dashboard → Project Settings → General
2. Set Root Directory to `webapp`
3. Redeploy

**Alternative**: If you can't set Root Directory, the deploy-preview.yml GitHub Action builds correctly by setting `working-directory: ./webapp`

### Build Error: "Multiple lockfiles detected"
**Cause**: Both root and webapp have package-lock.json files

**Solution**: This is expected for a monorepo. The warning can be safely ignored. The `/webapp/vercel.json` configuration handles this correctly.

### 404 Errors / Routing Issues
- Verify Root Directory is set to `webapp` in Vercel dashboard
- Check that vercel.json output directory matches Root Directory setting
- Ensure Next.js app routes are defined in `webapp/app/`

### Environment Variable Issues
- Run validation: `bash scripts/validate-vercel-env.sh`
- Verify all required variables are set in Vercel dashboard
- Check that NEXT_PUBLIC_ prefixed variables are accessible client-side

### GitHub Actions Deploy Preview Failure
**Issue**: Deploy preview workflow fails with bcrypt error

**Cause**: vercel-action may not respect working-directory properly

**Solution**: The workflow now builds in `/webapp` directory first (lines 71-77 in deploy-preview.yml), then deploys with `working-directory: ./webapp`

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
4. **Verify Root Directory is set to `webapp` in Vercel dashboard**

## Architecture Notes

This monorepo contains:
- `/webapp` - Next.js frontend (deployed to Vercel)
- `/src` - Backend Node.js code (not deployed to Vercel)
- `/lib` - Shared backend utilities including auth with bcrypt (not deployed to Vercel)
- `/admin` - Electron desktop app (not deployed to Vercel)

Only the webapp directory is deployed to Vercel. The Root Directory setting ensures this isolation and prevents module resolution conflicts.
