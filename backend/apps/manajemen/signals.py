from django.core.management import call_command
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group


@receiver(post_migrate)
def auto_seed_after_migrate(sender, **kwargs):
    """Run auto_seed after migrations if database looks empty.
    Safe to run multiple times (idempotent).
    """
    try:
        call_command('auto_seed')
    except Exception:
        pass


@receiver(post_save, sender=Group)
def auto_create_group_profile(sender, instance, created, **kwargs):
    """Auto-create GroupProfile when a new Group is created."""
    if created:
        from apps.manajemen.models import GroupProfile
        GroupProfile.objects.get_or_create(
            group=instance,
            defaults={'redirect_url': '/admin/dashboard'}
        )
