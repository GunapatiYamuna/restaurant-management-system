from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0008_alter_order_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservation",
            name="attendance_response",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("coming", "Coming"),
                    ("not_coming", "Not Coming"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="attendance_notified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="reservation",
            name="attendance_responded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
