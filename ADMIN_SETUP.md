# Admin Registration Setup

## Overview

A secret registration page allows trusted staff to create admin or superadmin accounts. The page is hidden from the public and requires a setup token to access.

---

## How It Works

1. A secret URL with a token is shared with trusted staff
2. The staff member visits the URL and fills in the registration form
3. They choose their role (Admin or Super Admin)
4. On success, they are logged in and redirected to the admin dashboard

---

## Secret Registration URL

```
https://seveedesigns.com/admin-setup?key=8e68fe91b34d280d409f71b9a27977c2c5b7d2c4ef219d35f8dd2ba4a5d16553
```

> Share this link only with trusted staff. Anyone with this link can register as admin or superadmin.

---

## Environment Variable (Render)

The `ADMIN_SETUP_TOKEN` must be set on Render for the backend to accept registrations.

1. Go to **https://dashboard.render.com** → `sevee-api`
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable**
4. Set:
   - **Key:** `ADMIN_SETUP_TOKEN`
   - **Value:** `8e68fe91b34d280d409f71b9a27977c2c5b7d2c4ef219d35f8dd2ba4a5d16553`
5. Save — Render will auto-redeploy

---

## Files Changed

| File | Description |
|------|-------------|
| `server/src/routes/auth.ts` | New `POST /api/auth/register-admin` endpoint |
| `server/.env` | Added `ADMIN_SETUP_TOKEN` |
| `src/pages/AdminSetupPage.tsx` | New admin registration page |
| `src/App.tsx` | Added `/admin-setup` route |

---

## API Endpoint

### `POST /api/auth/register-admin`

**Request body:**

```json
{
  "email": "admin@seveedesigns.com",
  "username": "admin",
  "full_name": "Kofi Mensah",
  "phone": "+233244123456",
  "password": "securepassword",
  "role": "admin",
  "setup_token": "8e68fe91b34d280d409f71b9a27977c2c5b7d2c4ef219d35f8dd2ba4a5d16553"
}
```

**Allowed roles:** `admin` or `superadmin`

**Success response (201):**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "email": "admin@seveedesigns.com",
    "username": "admin",
    "role": "admin"
  }
}
```

**Error responses:**

| Status | Error |
|--------|-------|
| 403 | Invalid setup token |
| 409 | Username or email already registered |
| 400 | Missing required fields or invalid role |

---

## Security Notes

- The setup token is a 64-character hex string generated with `crypto.randomBytes(32)`
- The registration page is not linked anywhere in the public UI
- Only people with the token can access the page
- To revoke access, change the `ADMIN_SETUP_TOKEN` on Render and in `.env`
