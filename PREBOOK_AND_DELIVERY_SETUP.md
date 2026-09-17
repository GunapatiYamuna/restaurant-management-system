# FoodieHub final behavior

- `menu.html` is the delivery ordering page. Every menu item is loaded from MySQL and Add to Cart uses the normal delivery cart/checkout flow.
- `restaurant-details.html?id=<restaurant_id>` is the restaurant-specific dining page. It loads only that restaurant menu.
- Selecting food on restaurant details creates `foodiePrebook` and opens `booking.html`.
- `booking.html` displays the selected pre-booked food and submits it with the table reservation.
- Django saves pre-booked dishes in `restaurant_reservationitem`.
- `confirmation.html` displays the reservation and pre-booked food.

Run from backend:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py check
python manage.py runserver
```

Import the 20 Ongole restaurants/menu data separately if it is not already in MySQL.
