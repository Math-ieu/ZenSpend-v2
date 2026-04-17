from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zenspendbackend', '0002_alter_user_notification_preferences_bankconnection_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='user_segment',
            field=models.CharField(
                choices=[
                    ('couples', 'Couples'),
                    ('young_professionals', 'Young Professionals'),
                    ('families', 'Families'),
                ],
                default='young_professionals',
                max_length=32,
            ),
        ),
    ]
