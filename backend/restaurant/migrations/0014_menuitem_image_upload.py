from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0013_reservationcoupon_redemption"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="image_data",
            field=models.BinaryField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="menuitem",
            name="image_content_type",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
