from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("restaurant", "0004_alter_reservationitem_reservation")]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # Create the nullable storage column separately. TiDB's
                # MySQL-compatible DDL cannot reliably add this OneToOne
                # field and its index/constraint in Django's combined ALTER.
                migrations.RunSQL(
                    sql=[
                        "ALTER TABLE restaurant_restaurant ADD COLUMN owner_id BIGINT NULL",
                        "CREATE UNIQUE INDEX restaurant_restaurant_owner_id_uniq ON restaurant_restaurant (owner_id)",
                    ],
                    reverse_sql=[
                        "DROP INDEX restaurant_restaurant_owner_id_uniq ON restaurant_restaurant",
                        "ALTER TABLE restaurant_restaurant DROP COLUMN owner_id",
                    ],
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
