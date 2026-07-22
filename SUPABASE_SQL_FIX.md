# Fix Default Login Passwords in Supabase

The bcrypt hash in the seed data was incorrect. Follow these steps to fix it.

## Step 1: Go to Supabase Dashboard

Open your browser and go to **https://supabase.com/dashboard**

## Step 2: Log in

Sign in with your Supabase account credentials.

## Step 3: Select your project

From the dashboard, click on your **SeVee Designs** project.

## Step 4: Open SQL Editor

In the left sidebar, click **SQL Editor** (it has a `>_` icon).

## Step 5: Create a new query

Click the **+ New query** button at the top.

## Step 6: Paste and run the SQL

Paste this into the editor:

```sql
UPDATE public.profiles
SET password_hash = '$2a$10$UWPbcDcJZWljBR4wILBxKuidLoKFT0XHnmh8E6JmKaoC2Gjs/1AYK'
WHERE email IN (
  'superadmin@seveedesigns.com',
  'admin@seveedesigns.com',
  'salesperson@seveedesigns.com',
  'customer@seveedesigns.com'
);
```

Then click **Run** (or press `Ctrl+Enter`).

## Step 7: Verify it worked

You should see a message like `UPDATE 4` (meaning 4 rows were updated).

To double-check, run:

```sql
SELECT email, username, role FROM public.profiles;
```

## Step 8: Test login

Go back to your app and try logging in with:

| Role       | Email                         | Password     |
|------------|-------------------------------|--------------|
| Super Admin| superadmin@seveedesigns.com   | password123  |
| Admin      | admin@seveedesigns.com        | password123  |
| Salesperson| salesperson@seveedesigns.com  | password123  |
| Customer   | customer@seveedesigns.com     | password123  |
