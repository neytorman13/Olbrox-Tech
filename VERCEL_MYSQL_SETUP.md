Vercel + MySQL setup

This project uses MySQL for production data and Vercel Blob for uploaded files.

1. Create a managed MySQL database
   Recommended: Railway MySQL.

2. Copy these values from your provider:
   - host
   - port
   - username
   - password
   - database

3. In Vercel Project Settings -> Environment Variables, paste:

```env
MYSQL_HOST=YOUR_MYSQL_HOST
MYSQL_PORT=3306
MYSQL_USER=YOUR_MYSQL_USER
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD
MYSQL_DATABASE=YOUR_MYSQL_DATABASE
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=false
NEXT_PUBLIC_SITE_URL=https://v0-olbrox-tech-admin.vercel.app
NODE_ENV=production
```

4. Apply the variables to:
   - Production
   - Preview

5. Redeploy the project.

Important:
Production now fails loudly if MySQL is misconfigured, instead of silently falling back to SQLite.
