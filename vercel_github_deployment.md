# Deployment Guide: Version Control with GitHub & Hosting Frontend on Vercel

This guide outlines how to push your SeVee Designs repository to **GitHub** and host the React storefront client on **Vercel** while keeping it connected to your backend API.

---

## Part 1: Pushing the Codebase to GitHub

Vercel and Render deploy automatically when you push updates to GitHub. Follow these steps to push your local folder to GitHub:

### 1. Create a `.gitignore`
Make sure you do not commit dependency folders, local file uploads, or database secrets. A `.gitignore` has already been set up in your folder, but ensure it contains:
```text
node_modules/
.env
server/uploads/
server/dist/
dist/
.DS_Store
```

### 2. Initialize Git and Push to GitHub
1. Open your terminal at the root directory (`SeVee_Design`).
2. Run these commands:
   ```bash
   # Initialize git repository
   git init

   # Stage all files
   git add .

   # Commit changes
   git commit -m "Initial commit: SeVee Designs e-commerce & portals"

   # Rename branch to main
   git branch -M main
   ```
3. Go to [GitHub](https://github.com/), log in, and click **New Repository**.
4. Name your repository (e.g. `sevee-designs`) and leave it **Private** (recommended since it contains database configurations). Do NOT check "Initialize with a README, .gitignore, or license".
5. Copy the remote URL provided by GitHub (e.g., `https://github.com/YOUR_USERNAME/sevee-designs.git`).
6. Run these final commands in your local terminal to link and push your code:
   ```bash
   # Link local repo to GitHub
   git remote add origin https://github.com/YOUR_USERNAME/sevee-designs.git

   # Push to GitHub
   git push -u origin main
   ```

---

## Part 2: Hosting the React Frontend on Vercel

Vercel is the premier platform for static frontend builds like React + Vite.

### 1. Create `vercel.json` config for Client Routing
Because React uses client-side routing (React Router), refreshing the page on sub-routes like `/shop` or `/dashboard` will return a `404 Not Found` on Vercel by default.
To prevent this, we configure Vercel to route all traffic to `index.html`. 

We have created a `vercel.json` file in your root folder with the following content:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/|uploads/).*)",
      "destination": "/index.html"
    }
  ]
}
```
*(Commit and push this file to GitHub after creating it).*

### 2. Deploy on Vercel
1. Log in to [Vercel](https://vercel.com/).
2. On your dashboard, click **Add New...** and select **Project**.
3. Import your GitHub repository (`sevee-designs`).
4. Configure the Project Settings:
   * **Project Name**: `sevee-designs-front`
   * **Framework Preset**: `Vite` (Vercel automatically detects this and configures the Build and Output settings).
   * **Root Directory**: Leave blank (representing the root `/` folder).
5. Click **Environment Variables** and add your backend API connector:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://your-backend-render-url.onrender.com/api` *(Paste your live Render backend URL from Phase 2)*
6. Click **Deploy**. Vercel will clone, compile, and publish your site.
7. Once completed, Vercel will provide your live URL (e.g. `https://sevee-designs.vercel.app`).

### 3. Update CORS on Backend (Render)
Go back to your **Render.com** backend Web Service dashboard, and update the `CLIENT_URL` environment variable value to match your new Vercel domain URL (e.g. `https://sevee-designs.vercel.app`). This allows your Vercel frontend to safely fetch data from your Render backend database.
