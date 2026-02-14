# GitHub Pages deployment

This repo has a **custom** workflow that builds the Vite app and deploys it. You do **not** use the Jekyll or Static HTML templates.

## What to do on GitHub

### 1. Set the Pages source to GitHub Actions

- In your repo go to **Settings → Pages**.
- Under **Build and deployment**, find **Source**.
- Choose **GitHub Actions** (not “Deploy from a branch”).

### 2. Ignore the two cards (Jekyll and Static HTML)

- You’ll see two options: **“GitHub Pages Jekyll”** and **“Static HTML”**.
- **Do not click “Configure” on either.**
- “Static HTML” is for sites with no build step; this project uses Vite and **needs** a build. Our workflow already does that.

### 3. Push the workflow and let it run

- The workflow file is in `.github/workflows/deploy.yml`. Push it to `master` if you haven’t already.
- Go to the **Actions** tab. You should see a run for “Deploy to GitHub Pages” (after a push to `master` or when you run it manually).
- The first time you use GitHub Actions for Pages, you may need to **approve** the deployment: open the run, then approve the **github-pages** environment if GitHub asks.

### 4. Open the site

- When the workflow finishes successfully, the site is at:
  **https://connilefleur.github.io/heart/**  
  (Use your GitHub username if it’s not `connilefleur`.)

---

**Summary:** Source = **GitHub Actions**, don’t configure Jekyll or Static HTML, push and use the existing “Deploy to GitHub Pages” workflow.
