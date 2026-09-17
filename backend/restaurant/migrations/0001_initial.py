from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name="Restaurant", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("cuisine", models.CharField(max_length=100)),
            ("rating", models.DecimalField(decimal_places=1, default=0, max_digits=3)), ("reviews", models.PositiveIntegerField(default=0)),
            ("price", models.CharField(default="₹₹", max_length=10)), ("location", models.CharField(max_length=150)),
            ("description", models.TextField(blank=True)), ("image", models.URLField(blank=True)),
        ]),
        migrations.CreateModel(name="Profile", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("phone", models.CharField(blank=True, max_length=15)), ("city", models.CharField(blank=True, max_length=100)),
            ("address", models.TextField(blank=True)),
            ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name="MenuItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("category", models.CharField(blank=True, max_length=100)),
            ("description", models.TextField(blank=True)), ("price", models.DecimalField(decimal_places=2, max_digits=10)),
            ("image", models.CharField(blank=True, max_length=500)), ("available", models.BooleanField(default=True)),
            ("restaurant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="menu_items", to="restaurant.restaurant")),
        ]),
        migrations.CreateModel(name="Reservation", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("email", models.EmailField(max_length=254)), ("phone", models.CharField(max_length=15)),
            ("date", models.DateField()), ("time", models.TimeField()), ("guests", models.PositiveIntegerField(default=1)),
            ("message", models.TextField(blank=True)), ("status", models.CharField(default="pending", max_length=30)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("restaurant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reservations", to="restaurant.restaurant")),
            ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reservations", to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name="Order", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("email", models.EmailField(blank=True, max_length=254)), ("phone", models.CharField(blank=True, max_length=15)),
            ("address", models.TextField(blank=True)), ("total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
            ("status", models.CharField(default="placed", max_length=30)), ("created_at", models.DateTimeField(auto_now_add=True)),
            ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="orders", to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name="OrderItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("price", models.DecimalField(decimal_places=2, max_digits=10)), ("quantity", models.PositiveIntegerField(default=1)),
            ("menu_item", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="restaurant.menuitem")),
            ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="restaurant.order")),
        ]),
        migrations.CreateModel(name="InventoryItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=150)), ("quantity", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ("unit", models.CharField(default="units", max_length=30)), ("reorder_level", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("restaurant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="inventory", to="restaurant.restaurant")),
        ]),
    ]
