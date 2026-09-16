from django.apps import AppConfig


class ApiSimpegConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.api_simpeg'
    label = 'api_simpeg'
    verbose_name = 'API SIMPEG'

    def ready(self):
        from . import signals  # noqa: F401
