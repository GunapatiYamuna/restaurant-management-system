from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("restaurant", "0004_alter_reservationitem_reservation")]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # TiDB does not support adding a new column and its UNIQUE
                # constraint in the same ALTER TABLE operation. Add the
                # nullable column first, then create the unique index.
                migrations.AddField(
                    model_name="restaurant",
                    name="owner",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="owned_restaurant",
                        to="auth.user",
                    ),
                ),
                migrations.RunSQL(
                    sql="CREATE UNIQUE INDEX restaurant_restaurant_owner_id_uniq ON restaurant_restaurant (owner_id)",
                    reverse_sql="DROP INDEX restaurant_restaurant_owner_id_uniq ON restaurant_restaurant",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="restaurant",
                    name="owner",
                    field=models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="owned_restaurant",
                        to="auth.user",
                    ),
                ),
            ],
        ),
    ]
