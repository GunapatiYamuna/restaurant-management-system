from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0003_reservation_items"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservationitem",
            name="reservation",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="items",
                to="restaurant.reservation",
            ),
        ),
    ]
