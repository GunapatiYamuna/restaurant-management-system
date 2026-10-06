# Railway Deployment Guide

FoodieHub is deployed as two Railway services from the same repository:
1. Web service — Django + Gunicorn.
2. Push worker service — long-running reservation Web Push checker.

The project intentionally keeps the existing demo/simulated payment flow. Do not add Razorpay credentials unless the real Razorpay integration is intentionally enabled.

## 1. Railway MySQL

Create a MySQL service in Railway.

Railway provides MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD and MYSQLDATABASE. The Django settings accept both Railway's names and the existing MYSQL_* names.

## 2. Web service

Connect the GitHub repository at the repository root. Do not set the root directory to /backend because the Django app serves the sibling /frontend directory.

Build command:
  cd backend && python manage.py collectstatic --noinput

Pre-deploy command:
  cd backend && python manage.py migrate --noinput

Start command:
  cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT

Healthcheck path:
  /api/health/

Set variables:
  DJANGO_SECRET_KEY=<strong random secret>
  DJANGO_DEBUG=False
  DJANGO_ALLOWED_HOSTS=<railway-host>,<custom-domain-if-used>
  DJANGO_CSRF_TRUSTED_ORIGINS=https://<railway-host>,https://<custom-domain-if-used>
  FRONTEND_BASE_URL=https://<railway-host>
  ALLOW_ADMIN_REGISTRATION=False
  RUN_PUSH_SCHEDULER_IN_WEB=False

Database variables can reference the Railway MySQL service:
  MYSQL_HOST=${{MySQL.MYSQLHOST}}
  MYSQL_PORT=${{MySQL.MYSQLPORT}}
  MYSQL_USER=${{MySQL.MYSQLUSER}}
  MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
  MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}

Google login:
  GOOGLE_CLIENT_ID=<web client id>

Email:
  EMAIL_HOST_USER=<gmail address>
  EMAIL_HOST_PASSWORD=<gmail app password>

Web Push:
  VAPID_PRIVATE_KEY_B64=<stable base64-encoded private PEM>
  VAPID_CLAIMS_EMAIL=mailto:<email>
  VAPID_PUBLIC_KEY=<public key derived from the same private key>

## 3. Generate stable Web Push keys once

On the local project:
  cd backend
  python manage.py generate_vapid_keys
  base64 -w0 vapid_private_key.pem

Copy that complete base64 value to Railway as VAPID_PRIVATE_KEY_B64. Keep the matching public key as VAPID_PUBLIC_KEY. Do not commit the private key.

## 4. Push worker service

Create a second Railway service using the same GitHub repository. Keep the repository root as /. Start command:
  cd backend && python push_worker.py

Use the same MySQL and Web Push variables as the web service.

The worker checks every 30 seconds and sends the reservation attendance Web Push reminder when a reservation enters the one-hour window.

Do not configure this service as a Railway Cron Job. Railway cron jobs are intended for short-lived tasks and have a minimum interval of five minutes; the FoodieHub worker is intentionally long-running and checks every 30 seconds.

## 5. Administrator

Before disabling public admin registration, create the first admin account from a one-time Railway shell:
  cd backend
  python manage.py createsuperuser

Then keep ALLOW_ADMIN_REGISTRATION=False.

## 6. Demo payments

FoodieHub currently uses its demo/simulated payment flow for the college project. The real Razorpay variables can remain empty.

## 7. Google OAuth

After Railway gives the app its HTTPS domain, add that exact origin to Google Cloud as an Authorized JavaScript origin.

Example:
  https://your-app.up.railway.app

## 8. Final checks

After deployment, /api/health/ should return {"success": true, "status": "ok"}.

Then test customer registration/login, admin login, restaurant partner login, delivery partner login, reservation creation, Web Push permission/subscription, Coming / Not Coming attendance response, reservation refund/coupon flow, demo order payment, delivery GPS tracking, Contact Us -> Admin Notifications, and Google Sign-In after updating the authorized origin.