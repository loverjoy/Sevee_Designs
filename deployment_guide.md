# Deployment Guide: Hosting SeVee Designs on Render.com

This guide provides step-by-step instructions on deploying the PostgreSQL database, the Node.js/Express backend server, and the Vite/React frontend to [Render.com](https://render.com).

---

## Prerequisites
1. A **Render.com** account.
2. A **GitHub** or **GitLab** account with your SeVee Designs repository uploaded.
3. PostgreSQL installed locally to run `psql` shell commands.

---

## Phase 1: Deploying the PostgreSQL Database

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **PostgreSQL**.
3. Fill out the configuration:
   * **Name**: `sevee-database`
   * **Database**: `sevee_designs`
   * **User**: `postgres`
   * **Region**: Choose a region closest to your audience (e.g. Oregon, Frankfurt).
   * **Instance Type**: Select the **Free** tier (or paid if moving to production).
4. Click **Create Database**.
5. Once active, copy the **External Connection String** (format: `postgresql://postgres:password@host/sevee_designs`) from the database page.
6. Open your local terminal, navigate to your root project folder, and run these commands to push your schema and seed data onto the live Render database:
   ```bash
   # Push database schema tables
   psql "YOUR_EXTERNAL_CONNECTION_STRING" -f server/schema.sql

   # Push mock categories and initial products
   psql "YOUR_EXTERNAL_CONNECTION_STRING" -f server/seed.sql
   ```

---

## Phase 2: Deploying the Backend Web Service

1. On the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub/GitLab repository.
3. Configure the Web Service settings:
   * **Name**: `sevee-backend`
   * **Region**: Select the **same region** as your database (for faster database query speeds).
   * **Branch**: `main` (or your primary development branch)
   * **Root Directory**: `server` *(CRITICAL: This tells Render that your backend code is in the server subfolder)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node dist/index.js`
   * **Instance Type**: Select **Free** (or your preferred paid tier).
4. Click the **Advanced** button to add the following **Environment Variables**:
   * `DATABASE_URL`: Paste the **Internal Connection String** of your Render database (begins with `postgres://...` or `postgresql://...`).
   * `JWT_SECRET`: Enter a secure random string (e.g. `9823hjas87123gasd8123hasd123`).
   * `PAYSTACK_SECRET_KEY`: `sk_test_xxxxxx` (Your Paystack test/live secret key).
   * `RESEND_API_KEY`: `re_xxxxxx` (Your Resend transactional email API key).
   * `CLIENT_URL`: `https://your-frontend-site.onrender.com` *(This will be the URL of your frontend static site once deployed in Phase 3. You can update this value later)*
   * `ADMIN_EMAIL`: `admin@seveedesigns.com` (Email recipient for weekly Cron reports).
5. Click **Create Web Service**. Render will install dependencies, compile the TypeScript backend, and deploy it.
6. Once deployed, note down the provided Web Service URL (e.g., `https://sevee-backend.onrender.com`).

---

## Phase 3: Deploying the Frontend Static Site

1. On the Render Dashboard, click **New +** and select **Static Site**.
2. Connect your GitHub/GitLab repository.
3. Configure the Static Site settings:
   * **Name**: `sevee-designs`
   * **Branch**: `main`
   * **Root Directory**: *(Leave completely blank, since package.json is in the root directory)*
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Add the following Environment Variable so the React client knows where to send API requests:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://your-backend-service-url.onrender.com/api` *(Paste your Web Service URL from Phase 2, ending in `/api`)*
5. Click **Create Static Site**.

### Crucial Step: Configuring Single Page Application (SPA) Routing on Render
Since React Router is client-side, trying to reload pages directly (e.g., `https://domain.com/shop`) will return a 404 error on hosting providers. To fix this:
1. Go to your frontend Static Site dashboard on Render.
2. Select **Redirects/Rewrites** from the sidebar.
3. Click **Add Rule** and input:
   * **Source**: `/*`
   * **Destination**: `/index.html`
   * **Action**: `Rewrite`
4. Click **Save**.

Your application is now fully deployed and connected in the cloud!
