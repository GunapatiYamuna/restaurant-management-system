from django.db import migrations, models
import django.db.models.deletion


def add_coupon_discount_if_missing(apps, schema_editor):
    Payment = apps.get_model("restaurant", "ReservationPayment")
    table = Payment._meta.db_table
    column = "coupon_discount"
    with schema_editor.connection.cursor() as cursor:
        existing = {
            item.name
            for item in schema_editor.connection.introspection.get_table_description(cursor, table)
        }
    if column not in existing:
        field = Payment._meta.get_field(column)
        schema_editor.add_field(Payment, field)


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0012_reservationpayment_reservationcoupon"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_coupon_discount_if_missing,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="reservationpayment",
                    name="coupon_discount",
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
            ],
        ),
        migrations.AddField(
            model_name="reservationcoupon",
            name="redeemed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="reservationcoupon",
            name="redeemed_order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="redeemed_coupons",
                to="restaurant.order",
            ),
        ),
        migrations.AddField(
            model_name="reservationcoupon",
            name="reserved_order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reserved_coupons",
                to="restaurant.order",
            ),
        ),
    ]
