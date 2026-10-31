from django.db import migrations, models
import django.db.models.deletion


def _existing_columns(schema_editor, model):
    with schema_editor.connection.cursor() as cursor:
        return {
            item.name
            for item in schema_editor.connection.introspection.get_table_description(
                cursor, model._meta.db_table
            )
        }


def add_coupon_discount_if_missing(apps, schema_editor):
    Payment = apps.get_model("restaurant", "ReservationPayment")
    existing = _existing_columns(schema_editor, Payment)
    field = models.DecimalField(decimal_places=2, default=0, max_digits=12)
    field.set_attributes_from_name("coupon_discount")
    if field.column not in existing:
        schema_editor.add_field(Payment, field)


def add_missing_reservation_coupon_fields(apps, schema_editor):
    Coupon = apps.get_model("restaurant", "ReservationCoupon")
    Order = apps.get_model("restaurant", "Order")
    existing = _existing_columns(schema_editor, Coupon)

    fields = [
        models.DateTimeField(blank=True, null=True),
        models.ForeignKey(
            Order,
            blank=True,
            null=True,
            on_delete=django.db.models.deletion.SET_NULL,
            related_name="redeemed_coupons",
        ),
        models.ForeignKey(
            Order,
            blank=True,
            null=True,
            on_delete=django.db.models.deletion.SET_NULL,
            related_name="reserved_coupons",
        ),
    ]
    for name, field in zip(("redeemed_at", "redeemed_order", "reserved_order"), fields):
        field.set_attributes_from_name(name)
        if field.column not in existing:
            schema_editor.add_field(Coupon, field)
            existing.add(field.column)


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0012_reservationpayment_reservationcoupon"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_coupon_discount_if_missing, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="reservationpayment",
                    name="coupon_discount",
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_missing_reservation_coupon_fields, migrations.RunPython.noop),
            ],
            state_operations=[
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
            ],
        ),
    ]
