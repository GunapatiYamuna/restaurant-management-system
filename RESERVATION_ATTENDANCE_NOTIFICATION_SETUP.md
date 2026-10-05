# Free Browser Push Reservation Notifications

FoodieHub now uses **Web Push Notifications** instead of SMS.

This allows the customer to receive a reservation reminder as a normal browser/device notification even when the FoodieHub tab is closed, as long as the customer previously allowed notifications and the browser/device supports Web Push. Persistent notifications are provided by a service worker, and supported browsers can show action buttons such as Coming and Not Coming.

## 1. Install dependencies

From the `backend` directory:

    pip install -r requirements.txt

The project includes `pywebpush`.

## 2. Generate VAPID keys

From the `backend` directory:

    python manage.py generate_vapid_keys

The command creates local VAPID key files and prints the public key.

Add the printed values to `backend/.env`:

    VAPID_PUBLIC_KEY=PASTE_THE_PRINTED_PUBLIC_KEY_HERE
    VAPID_CLAIMS_EMAIL=mailto:your-email@example.com

The private key stays in `backend/vapid_private_key.pem` and is ignored by Git. Never commit or share the private key.

## 3. Run migrations

    python manage.py migrate

This creates the PushSubscription table.

## 4. Customer setup

The customer must do this once:

1. Log in to FoodieHub.
2. Open **My Reservations**.
3. Allow browser notifications when the browser asks.
4. The browser registers the FoodieHub service worker and saves the push subscription.

After this one-time setup, the customer does not need to keep FoodieHub open.

## 5. Send reminders automatically

The Django command sends reminders for reservations entering the one-hour window:

    python manage.py send_reservation_push_reminders

For the real system, run this command every minute using your server scheduler/cron. The repository includes `backend/run_push_reminders.sh` so cron can use the project's virtual environment without hard-coded user paths.

From the repository's `backend` directory, make the script executable:

    chmod +x run_push_reminders.sh

Find the absolute repository path:

    pwd

Then open your user's crontab:

    crontab -e

Add this line, replacing `/absolute/path/to/restaurant-management-system` with the path printed by `pwd`:

    * * * * * /absolute/path/to/restaurant-management-system/backend/run_push_reminders.sh >> /absolute/path/to/restaurant-management-system/backend/reservation_push.log 2>&1

Check the installed job:

    crontab -l

The cron job runs every minute. The command itself only sends reservations that are within the configured one-hour reminder window and still have a pending attendance response, so it does not repeatedly send the same reminder.

For a quick manual test, run:

    ./run_push_reminders.sh

## 6. Notification behavior

The customer receives a FoodieHub reservation reminder with the reservation time and two actions:

- **Coming** → reservation becomes Confirmed.
- **Not Coming** → reservation becomes Cancelled.

The buttons open signed Django attendance response URLs, so the customer can respond directly from the notification.

## Important limitation

Web Push is free, but it is not the same as SMS. The customer must first grant browser notification permission and register the device/browser once. Push delivery is handled by the browser's push infrastructure; your project does not pay Twilio or another SMS provider.

Production deployment should use **HTTPS**. Local development can use localhost, but a real customer device needs a publicly reachable HTTPS website for normal Web Push operation.
