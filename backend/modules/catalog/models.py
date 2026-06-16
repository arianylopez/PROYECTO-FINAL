from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User as DjangoUser
from datetime import timedelta
import uuid
import string

class Genre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, verbose_name="Nombre")
    def __str__(self): return self.name
    class Meta: verbose_name = "Género"; verbose_name_plural = "Géneros"

class Movie(models.Model):
    RATING_CHOICES = [('ATP', 'ATP'), ('+13', '+13'), ('+16', '+16'), ('+18', '+18')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Título")
    synopsis = models.TextField(verbose_name="Sinopsis")
    genres = models.ManyToManyField(Genre, verbose_name="Géneros")
    director = models.CharField(max_length=100, verbose_name="Director")
    duration_minutes = models.PositiveIntegerField(verbose_name="Duración (min)")
    rating_classification = models.CharField(max_length=10, choices=RATING_CHOICES, verbose_name="Clasificación")
    release_date = models.DateField(verbose_name="Fecha de Estreno")
    poster_url = models.URLField(verbose_name="URL del Afiche")
    trailer_url = models.URLField(verbose_name="URL del Trailer")
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    def __str__(self): return self.title
    class Meta: verbose_name = "Película"; verbose_name_plural = "Películas"

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name="Nombre de la Sala")
    capacity = models.PositiveIntegerField(verbose_name="Capacidad Total", editable=False)
    rows = models.PositiveIntegerField(verbose_name="Cantidad de Filas")
    columns = models.PositiveIntegerField(verbose_name="Butacas por Fila")

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        self.capacity = self.rows * self.columns
        super().save(*args, **kwargs)
        
        if is_new:
            letters = string.ascii_uppercase
            seats_to_create = []
            for r in range(self.rows):
                row_label = letters[r % 26]
                for c in range(1, self.columns + 1):
                    seats_to_create.append(Seat(room=self, row=row_label, number=c))
            Seat.objects.bulk_create(seats_to_create)

    def __str__(self): return f"{self.name} ({self.capacity} asient.)"
    class Meta: verbose_name = "Sala"; verbose_name_plural = "Salas"

class Seat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='seats')
    row = models.CharField(max_length=2)
    number = models.PositiveIntegerField()

    def __str__(self): return f"{self.row}{self.number}"
    class Meta: unique_together = ('room', 'row', 'number')

class Screening(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='screenings', verbose_name="Película")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, verbose_name="Sala")
    start_time = models.DateTimeField(verbose_name="Inicio")
    end_time = models.DateTimeField(verbose_name="Fin (Calculado)", editable=False, null=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Precio")
    is_active = models.BooleanField(default=True, verbose_name="Activa")
    cancellation_reason = models.CharField(max_length=255, blank=True, null=True, verbose_name="Motivo de Cancelación")

    def clean(self):
        if self.start_time and getattr(self, 'movie', None):
            self.end_time = self.start_time + timedelta(minutes=self.movie.duration_minutes + 30)
            overlaps = Screening.objects.filter(
                room=self.room,
                is_active=True,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exclude(pk=self.pk)
            if overlaps.exists():
                raise ValidationError("La sala ya tiene una función programada en ese horario.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self): return f"{self.movie.title} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"
    class Meta: verbose_name = "Función"; verbose_name_plural = "Funciones"

class TicketOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    STATUS_CHOICES = [('completed', 'Completada'), ('pending_refund', 'Reembolso Pendiente'), ('refunded', 'Reembolsada')]
    screening = models.ForeignKey(Screening, on_delete=models.CASCADE, related_name='ticket_orders')
    user_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    created_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    ACTION_CHOICES = [('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Soft Delete'), ('CANCEL', 'Canceled')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(DjangoUser, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    table_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    snapshot_before = models.JSONField(null=True, blank=True)
    snapshot_after = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)