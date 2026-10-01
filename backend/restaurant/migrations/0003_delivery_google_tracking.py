from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("restaurant", "0002_order_checkout_and_seed")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="google_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_lat",
            field=models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_lng",
            field=models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True),
        ),
        migrations.CreateModel(
            name="DeliveryPartner",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(blank=True, max_length=15)),
                ("vehicle_type", models.CharField(default="Bike", max_length=50)),
                ("vehicle_number", models.CharField(blank=True, max_length=30)),
                ("is_available", models.BooleanField(default=True)),
                ("current_lat", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("current_lng", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("last_location_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="delivery_partner", to="auth.user")),
            ],
        ),
        migrations.CreateModel(
            name="DeliveryAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(default="assigned", max_length=30)),
                ("assigned_at", models.DateTimeField(auto_now_add=True)),
                ("picked_up_at", models.DateTimeField(blank=True, null=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("order", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="delivery_assignment", to="restaurant.order")),
                ("partner", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="assignments", to="restaurant.deliverypartner")),
            ],
        ),
    ]
