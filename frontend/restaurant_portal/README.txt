FoodieHub Restaurant Partner Portal - Premium UI

Entry:
  /restaurant_portal/login.html
  /restaurant_portal/register.html

Connected existing APIs:
  /api/restaurant/me/
  /api/restaurant/menu/
  /api/restaurant/orders/
  /api/restaurant/reservations/
  /api/restaurant/inventory/
  /api/restaurant-login/
  /api/restaurant-register/
  /api/logout/

Modules:
  Dashboard / Menu / Orders / Reservations / Inventory / Analytics

This package is a FRONTEND PORTAL upgrade. It intentionally keeps the existing API
contracts and restaurant/account data model unchanged. Analytics is calculated
from the existing order and reservation APIs; no new backend model is required.


Dashboard connection fix:
- Dashboard KPIs now load from /api/restaurant/dashboard/.
- /api/restaurant/me/ is used only for signed-in restaurant identity.
- Menu, orders, reservations and inventory continue using their live Django APIs.
