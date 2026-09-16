# SOMA website

Ready to upload to GitHub and import into Vercel. This is a static HTML, CSS, and JavaScript website with bundled fonts and logo. No npm dependencies, build step, database, or environment variables are required.

## Deploy

1. Unzip the delivery and open the `soma-website` folder.
2. Create a GitHub repository. Choose **Add file → Upload files**, then upload the contents of this folder. The repository root must contain `vercel.json`, `README.md`, and the `public` folder. Upload the extracted files, not the ZIP itself.
3. In Vercel, choose **Add New → Project** and import that GitHub repository.
4. Keep **Root Directory** at the repository root (`./`). The included `vercel.json` selects **Other**, skips installation and building, and serves `public` automatically.
5. Click **Deploy**.

If uploading the whole `soma-website` folder inside another repository, select that folder as Vercel's Root Directory instead.

## Files

```text
vercel.json
README.md
.gitignore
public/
  index.html
  assets/
    style.css
    field.js
    soma-logo.png
    Spartan-400.ttf
    Spartan-600.ttf
```

Only `public` is served to visitors. Edit those files and commit to GitHub to trigger subsequent Vercel deployments.

## Local preview

From this folder, run:

```sh
python3 -m http.server 8000 --directory public
```

Open http://localhost:8000. Use an HTTP server because the animation uses a JavaScript module.

## Existing interactions and assets

The opening title animation and particle sphere are preserved. Move the pointer over the sphere or drag to rotate; use the bottom-right button to pause or resume. Reduced-motion preferences are respected, and the title adapts for mobile screens.

The supplied fonts and logo are retained. This package does not grant additional rights to those assets.

Vercel documentation: https://vercel.com/docs/builds/configure-a-build
