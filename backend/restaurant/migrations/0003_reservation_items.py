from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("restaurant", "0002_order_checkout_and_seed")]
    operations = [
        migrations.CreateModel(
            name="ReservationItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("menu_item", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="restaurant.menuitem")),
                ("reservation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="restaurant.reservation")),
            ],
        ),
    ]
