from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("restaurant", "0004_alter_reservationitem_reservation")]
    operations = [migrations.AddField(
        model_name="restaurant", name="owner",
        field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="owned_restaurant", to="auth.user"),
    )]
