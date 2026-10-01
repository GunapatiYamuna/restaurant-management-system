from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("restaurant", "0005_restaurant_owner") ]

    operations = [
        migrations.AddField(model_name="order", name="payment_status", field=models.CharField(default="cod_pending", max_length=30)),
        migrations.AddField(model_name="order", name="razorpay_order_id", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="order", name="razorpay_payment_id", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="order", name="razorpay_signature", field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name="order", name="paid_at", field=models.DateTimeField(blank=True, null=True)),
    ]
