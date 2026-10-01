# FoodieHub Restaurant Partner Portal

This addition keeps the existing customer and admin systems and adds a separate restaurant-partner role using the same Django + MySQL backend.

## What was added
- Restaurant partner registration linked to an existing restaurant record.
- Restaurant partner login with a real Django session.
- Restaurant dashboard.
- Restaurant-specific menu management: add, edit price, availability, delete.
- Restaurant-specific delivery order list and status updates.
- Restaurant-specific table reservations and status updates, including pre-booked food.
- Restaurant-specific inventory management.
- Restaurant account is restricted to its linked restaurant.
- Customer/admin logout now calls the Django logout endpoint before redirecting.
- `/api/me/` is the authentication source of truth for the main navbar and admin pages.
- Guest order and table-reservation APIs reject unauthenticated requests.

## First run after replacing the project
From the project root:

```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py check
python manage.py runserver
```

If your virtual environment is not `backend/venv`, activate the environment where Django is installed.

## Restaurant portal
Open:
- `http://127.0.0.1:8000/restaurant_portal/login.html`
- `http://127.0.0.1:8000/restaurant_portal/register.html`

Registration asks you to select one existing restaurant. A restaurant can have one partner account. The partner can only access that restaurant's menu, orders, reservations and inventory.

## Security/session note
The portal uses Django authentication and does not use localStorage as the authority for access control. The browser may still keep a local FoodieHub session display value, but protected pages and APIs verify the Django session.

## Existing database
Migration `0005_restaurant_owner` only adds a nullable owner relationship to `Restaurant`; it does not delete or replace existing restaurants/menu items/orders/reservations.
