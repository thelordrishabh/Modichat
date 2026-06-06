# Modichat Production Lock

This file records the current locked production deployment and the steps to restore it.

## Current locked production deployment

- Deployment ID: `dpl_B9m5iyVyeq695ncxSHWp44d72io6`
- Deployment URL: `https://modichat-5y4da5u7l-rishabhsinghrs2123003-9716s-projects.vercel.app`
- Production alias: `https://modichat.vercel.app`
- Restored snapshot created: Tue May 26 2026 22:45:30 GMT+0530

## What "locking deployment" means

This repository is currently pointing production to a specific Vercel snapshot instead of relying on the latest git push.

That means:

- `modichat.vercel.app` now serves a known-good version from May 26/27.
- New deployments will not automatically overwrite this state until you decide to deploy again.
- If you need to restore this exact version later, use the deployment ID and the Vercel promote command.

## How to restore this exact production state again

```bash
vercel promote dpl_B9m5iyVyeq695ncxSHWp44d72io6 --scope rishabhsinghrs2123003-9716s-projects --yes
```

If you want to keep production safe, consider these practices:

1. Disable automatic production deployments in Vercel project settings.
2. Use branch protection on GitHub so only reviewed changes can merge.
3. Only promote preview/stable deployments manually after verification.

## Notes

This project already has a stable production snapshot in Vercel. The repo itself currently does not contain the missing May 27 commit history, so this snapshot is the safest known production state.
