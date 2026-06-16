from django.db import models
from django.contrib.auth.models import User as DjangoUser 
import uuid

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Nombre")

    class Meta:
        db_table = 'catalog_genres'
        verbose_name = "Género"
        verbose_name_plural = "Géneros"

    def __str__(self):
        return self.name

class Movie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, verbose_name="Título")
    synopsis = models.TextField(verbose_name="Sinopsis")
    director = models.CharField(max_length=150, verbose_name="Director")
    duration_min = models.IntegerField(verbose_name="Duración (min)")
    rating_classification = models.CharField(max_length=10, choices=[
        ('ATP', 'Apta para Todo Público'),
        ('+13', 'Mayores de 13'),
        ('+16', 'Mayores de 16'),
        ('+18', 'Mayores de 18')
    ], verbose_name="Clasificación")
    release_date = models.DateField(verbose_name="Fecha de Estreno")
    poster_url = models.URLField(max_length=500, blank=True, verbose_name="URL del Póster")
    trailer_url = models.URLField(max_length=500, blank=True, verbose_name="URL del Tráiler")
    is_active = models.BooleanField(default=True, verbose_name="Activa en Cartelera")
    
    # Relación M2M con Géneros
    genres = models.ManyToManyField(Genre, db_table='catalog_movie_genres', verbose_name="Géneros")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_movies'
        verbose_name = "Película"
        verbose_name_plural = "Películas"

    def __str__(self):
        return self.title

class Room(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nombre de la Sala")
    capacity = models.IntegerField(verbose_name="Capacidad")
    layout_json = models.JSONField(verbose_name="Distribución de Butacas (JSON)")

    class Meta:
        db_table = 'catalog_rooms'
        verbose_name = "Sala"
        verbose_name_plural = "Salas"

    def __str__(self):
        return self.name

class Screening(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='screenings', verbose_name="Película")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='screenings', verbose_name="Sala")
    start_time = models.DateTimeField(verbose_name="Horario de Inicio")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio")
    is_active = models.BooleanField(default=True, verbose_name="Función Activa")

    class Meta:
        db_table = 'catalog_screenings'
        verbose_name = "Función"
        verbose_name_plural = "Funciones"

    def __str__(self):
        return f"{self.movie.title} - {self.room.name} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"
    
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Soft Delete'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(DjangoUser, on_delete=models.SET_NULL, null=True, verbose_name="Administrador")
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name="Acción")
    table_name = models.CharField(max_length=50, verbose_name="Tabla Afectada")
    record_id = models.CharField(max_length=50, verbose_name="ID del Registro")
    snapshot_before = models.JSONField(null=True, blank=True, verbose_name="Snapshot Antes")
    snapshot_after = models.JSONField(null=True, blank=True, verbose_name="Snapshot Después")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y Hora")

    class Meta:
        db_table = 'audit_logs'
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.table_name} by {self.admin_user} at {self.timestamp}"