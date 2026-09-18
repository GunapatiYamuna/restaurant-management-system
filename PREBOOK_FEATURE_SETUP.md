# FoodieHub - Restaurant Menu + Table Pre-booking

This package is based on the final `foodiehub_connection` project and adds:

- Database-driven restaurant cards.
- Restaurant-specific details pages using `restaurant-details.html?id=<id>`.
- Restaurant-specific menus grouped by category.
- A dynamic `menu.html` showing menus for all restaurants.
- Quantity controls to pre-book food from a restaurant's details page.
- Selected food items are carried into the table reservation page.
- Django stores the selected food as `ReservationItem` records linked to the reservation.
- Reservation confirmation displays the pre-booked food and total.
- Existing cart/order/login/admin functionality is retained.

## Backend setup

From `backend`:

```bash
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py check
python manage.py runserver
```

The new migration is `restaurant/migrations/0003_reservationitem.py`.

## Restaurant/menu data

If the 20 Ongole restaurants have not yet been imported into MySQL, run:

```bash
mysql -u root -p foodiehub < database/ongole_restaurants_bulk.sql
```

Do not run the seed repeatedly if you have modified the same restaurant/menu records manually; the seed uses `NOT EXISTS` checks for restaurant/menu names.

## User flow

1. Open `restaurant.html`.
2. Select any restaurant.
3. Click **View Details**.
4. The page loads that restaurant's own menu from `/api/restaurants/<id>/`.
5. Select food quantities with `+` / `-`.
6. Click **Reserve a Table**.
7. The booking page shows the selected food.
8. Submit the reservation.
9. Django creates the reservation and its `ReservationItem` rows.
10. The confirmation page shows the reservation and pre-booked food.

## Important

The local images in the restaurant cards are project image assets used as visual fallbacks. They are not claimed to be photographs of each specific restaurant.
