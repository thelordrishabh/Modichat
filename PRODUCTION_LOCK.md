# Modichat Production Lock

This file records the current locked production deployment and the steps to restore it.

## Current locked production deployment

- Deployment ID: `dpl_4TcHiVtadUa6sudQ9gNpWGDoKQmA`
- Deployment URL: `https://modichat-5th9u500o-rishabhsinghrs2123003-9716s-projects.vercel.app`
- Production alias: `https://modichat.vercel.app`
- Restored snapshot created: Sat Jun 06 2026 12:43:04 GMT+0530

## What "locking deployment" means

This repository is currently pointing production to a specific Vercel snapshot instead of relying on the latest git push.

That means:

- `modichat.vercel.app` now serves a known-good version from the current repo and the latest feature commit.
- New deployments will not automatically overwrite this state until you decide to deploy again.
- If you ever need to revert to the previous May 26/27 snapshot, the rollback deployment is still available.

## How to restore the current production state again

```bash
vercel promote dpl_4TcHiVtadUa6sudQ9gNpWGDoKQmA --scope rishabhsinghrs2123003-9716s-projects --yes
```

## Rollback reference

If you want to restore the older May 26/27 production snapshot instead, use:

```bash
vercel promote dpl_B9m5iyVyeq695ncxSHWp44d72io6 --scope rishabhsinghrs2123003-9716s-projects --yes
```

## Recommendations for stability

1. Disable automatic production deployments in Vercel project settings if you want manual control.
2. Use branch protection on GitHub so only reviewed changes can merge to `main`.
3. Promote deployments manually after verification.

## Notes

This deployment is the current live baseline for `modichat.vercel.app` and includes the latest new feature commit.
