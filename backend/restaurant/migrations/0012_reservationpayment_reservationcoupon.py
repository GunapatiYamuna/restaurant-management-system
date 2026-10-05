from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0011_merge_0009_merge_20261005_1806_0010_pushsubscription"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReservationPayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("food_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("upfront_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("remaining_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("payment_method", models.CharField(default="UPI", max_length=20)),
                ("upfront_status", models.CharField(default="paid", max_length=30)),
                ("upfront_transaction_id", models.CharField(blank=True, max_length=100)),
                ("remaining_status", models.CharField(default="pending", max_length=30)),
                ("remaining_transaction_id", models.CharField(blank=True, max_length=100)),
                ("refund_status", models.CharField(default="not_requested", max_length=30)),
                ("refund_type", models.CharField(blank=True, max_length=20)),
                ("refund_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("refund_reference", models.CharField(blank=True, max_length=100)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("remaining_paid_at", models.DateTimeField(blank=True, null=True)),
                ("refund_processed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("reservation", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="payment", to="restaurant.reservation")),
            ],
        ),
        migrations.CreateModel(
            name="ReservationCoupon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=40, unique=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("expires_at", models.DateTimeField()),
                ("used", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("reservation", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="refund_coupon", to="restaurant.reservation")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reservation_coupons", to="auth.user")),
            ],
        ),
    ]
