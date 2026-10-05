from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0012_reservationpayment_reservationcoupon"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationpayment",
            name="coupon_discount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
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
