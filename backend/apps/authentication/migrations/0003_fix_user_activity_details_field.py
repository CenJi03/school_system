from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_add_login_tracking_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useractivity',
            name='details',
            field=models.TextField(blank=True),
        ),
    ]
