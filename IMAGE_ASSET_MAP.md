# FoodieHub Image Asset Map

This final project uses **local, deployment-safe SVG image assets**. No restaurant/menu page depends on an external image host.

## Folders
- `frontend/images/restaurants/` — one image per restaurant
- `frontend/images/menu/` — one image per restaurant + menu item
- `frontend/images/categories/` — category tiles
- `frontend/images/site/` — hero/about/booking artwork

## Database mapping
Run `database/image_mapping_update.sql` once after the database is seeded. It maps every restaurant and every seeded menu item to its local `/images/...` path.

The Restaurant image field is now a `CharField`, because these are local paths rather than remote URLs. Migration: `0004_local_image_paths`.

## Counts
- Restaurants: 21
- Menu items: 128
- Restaurant assets: 21
- Menu assets: 128

The assets are intentionally generic FoodieHub illustrations rather than claiming that a generic stock photo is an official photograph of a named restaurant.

## Deployment checklist
1. Keep the new `frontend/images/` folders when deploying.
2. Run Django migration: `python manage.py migrate`.
3. If the database already contains the seeded restaurants/menu, run `database/image_mapping_update.sql` once.
4. Restart Django and verify `/images/restaurants/spice-symphony.svg` and `/images/menu/spice-symphony--cheese-pizza.svg` load.
