# FoodieHub Delivery + Google Sign-In Setup

## Added
- Customer portal with order tracking.
- Delivery partner portal with availability, ready-order acceptance, status updates and browser GPS sharing.
- Admin Delivery Operations page for partner monitoring and manual assignment.
- Live customer tracking page with delivery-partner and drop-location markers.
- Checkout map selector for the exact delivery point.
- Restaurant Details now has **Order Now** and **Reserve a Table** actions.
- Google Sign-In on customer, admin and restaurant logins, plus the new delivery-partner login.

## Google Sign-In
Create a Google OAuth/Web client ID in Google Cloud and add the URL origin where FoodieHub is served under **Authorized JavaScript origins**. For local development, use the exact origin such as `http://localhost:8000` (or the origin you actually use).

Set in `backend/.env`:

    GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com

The backend verifies the Google ID token before creating/logging in the Django user. Google recommends verifying the token server-side and using the token `sub` claim as the stable Google identifier.

Role behavior:
- Customer Google sign-in can create a new customer account.
- Admin, restaurant and delivery Google sign-in require an existing account for that role; the Google identity is then linked to that account.

## Database
After updating the code:

    cd backend
    python manage.py migrate
    python manage.py check

Migration `0003_delivery_google_tracking` adds Google identity on Profile, delivery coordinates on Order, DeliveryPartner and DeliveryAssignment.

## Map
Checkout and tracking use Leaflet with OpenStreetMap tiles, so no Google Maps API key is required for the map itself.

The customer selects a point on checkout; the order stores `delivery_lat` and `delivery_lng`.

## Delivery flow
1. Customer places an order and selects the delivery point.
2. Restaurant moves the order through `placed → confirmed → preparing → ready`.
3. A delivery partner can accept a ready order, or an admin can assign one.
4. Delivery partner marks pickup / delivery status and shares browser GPS while the trip is active.
5. Customer opens **Track Delivery** and sees the order status plus the partner's latest location.

GPS requires browser location permission and works best over HTTPS in production (localhost is normally allowed for local development).

## Important production configuration
Set a real `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, database credentials, email settings, `FRONTEND_BASE_URL`, and `GOOGLE_CLIENT_ID` in the deployment environment. Do not commit secrets.