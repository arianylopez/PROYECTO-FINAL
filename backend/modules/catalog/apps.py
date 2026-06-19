from django.apps import AppConfig

class CatalogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'modules.catalog'
    verbose_name = '1. Gestión de Cine'
    
    def ready(self):
        import modules.catalog.signals