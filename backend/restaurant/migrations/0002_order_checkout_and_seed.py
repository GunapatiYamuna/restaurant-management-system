from django.db import migrations, models
from decimal import Decimal


def seed_foodiehub(apps, schema_editor):
    Restaurant = apps.get_model("restaurant", "Restaurant")
    MenuItem = apps.get_model("restaurant", "MenuItem")
    InventoryItem = apps.get_model("restaurant", "InventoryItem")
    restaurant, _ = Restaurant.objects.get_or_create(
        name="Spice Symphony",
        defaults={
            "cuisine": "Indian",
            "rating": Decimal("4.5"),
            "reviews": 120,
            "price": "₹₹",
            "location": "Hyderabad",
            "description": "A demo restaurant for the FoodieHub application.",
            "image": "",
        },
    )
    menu = [
        ("Cheese Pizza", "Pizza", Decimal("299.00")),
        ("Veg Pizza", "Pizza", Decimal("249.00")),
        ("Chicken Burger", "Burgers", Decimal("199.00")),
        ("Veg Burger", "Burgers", Decimal("159.00")),
        ("Chicken Biryani", "Biryani", Decimal("249.00")),
        ("Veg Biryani", "Biryani", Decimal("179.00")),
        ("Idly", "South Indian", Decimal("80.00")),
        ("Paneer Butter Masala", "North Indian", Decimal("220.00")),
        ("Chicken Noodles", "Chinese", Decimal("199.00")),
        ("Fresh Juice", "Beverages", Decimal("99.00")),
        ("Chocolate Milkshake", "Beverages", Decimal("129.00")),
        ("Ice Cream", "Desserts", Decimal("99.00")),
    ]
    for name, category, price in menu:
        MenuItem.objects.get_or_create(
            restaurant=restaurant, name=name,
            defaults={"category": category, "price": price, "available": True},
        )
    InventoryItem.objects.get_or_create(
        restaurant=restaurant, name="Demo Inventory Item",
        defaults={"quantity": Decimal("100"), "unit": "units", "reorder_level": Decimal("10")},
    )


class Migration(migrations.Migration):
    dependencies = [("restaurant", "0001_initial")]
    operations = [
        migrations.AddField(model_name="order", name="payment_method", field=models.CharField(default="Cash on Delivery", max_length=50)),
        migrations.AddField(model_name="order", name="city", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="order", name="pincode", field=models.CharField(blank=True, max_length=10)),
        migrations.RunPython(seed_foodiehub, migrations.RunPython.noop),
    ]
