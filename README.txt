FOODIEHUB AUTHENTICATION FIX

Replace these files in your existing project:

backend/restaurant/views.py
frontend/login/js/auth.js
frontend/ad_login/js/auth.js
frontend/ad_login/pages/js/admin.js
frontend/index.html

Main fixes:
- Every login starts with a fresh Django session.
- User login and admin login switch accounts correctly.
- Django logout clears the actual server session.
- Orders require an authenticated user.
- Reservations require an authenticated user.
- Public index.html no longer loads the admin authentication script globally.

After replacing files:
1. Stop Django with Ctrl+C.
2. Start it again:
   cd ~/restaurant-management-system/backend
   source venv/bin/activate
   python manage.py runserver
3. Login with account A and check /api/me/.
4. Logout and check /api/me/ again.
5. Login with account B and check /api/me/.
