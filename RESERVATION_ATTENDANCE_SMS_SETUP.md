# Reservation attendance SMS setup

FoodieHub asks customers whether they are actually coming to a reserved table one hour before the reservation.

## Flow

1. A logged-in customer creates a table reservation.
2. One hour before the reservation, Django sends an SMS to the mobile number stored in the customer's FoodieHub profile.
3. The SMS contains two links:
   - Coming -> reservation becomes Confirmed
   - Not coming -> reservation becomes Cancelled
4. Customer reservation history and the restaurant partner reservation page show the updated status.

## SMS provider

The project uses Twilio's SMS REST API. Add these values to backend/.env:

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
PUBLIC_BASE_URL=https://your-public-foodiehub-domain.example

For an Indian 10-digit profile number, the application automatically sends it to Twilio as +91XXXXXXXXXX.

PUBLIC_BASE_URL must be a URL that the customer's phone can reach. Do not use http://127.0.0.1:8000 for real SMS links.

## Run the reminder job

The reminder logic is implemented as a Django management command:

python manage.py send_reservation_attendance_reminders

Run it every minute with the server scheduler (cron, Windows Task Scheduler, Supervisor, a container scheduler, or your hosting provider's scheduled jobs).

Example cron entry:

* * * * * cd /path/to/restaurant-management-system/backend && /path/to/venv/bin/python manage.py send_reservation_attendance_reminders >> /var/log/foodiehub-reservation-sms.log 2>&1

Running every minute is intentional: the command skips reservations outside the one-hour-to-reservation window and never sends the same reminder twice because attendance_notified_at is recorded after a successful SMS.

## Database

Run:

python manage.py migrate

This applies migration 0009_reservation_attendance.py.
