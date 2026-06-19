from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone
from datetime import timedelta
import uuid
import string

class Genre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, verbose_name="Nombre")
    def __str__(self): return self.name
    class Meta: 
        verbose_name = "Género"; 
        verbose_name_plural = "Géneros"

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
    class Meta:
        verbose_name = "Película"
        verbose_name_plural = "Películas"
        ordering = ['-release_date']

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name="Nombre de la Sala")
    grid_rows = models.PositiveIntegerField(verbose_name="Filas (Cuadrícula)", help_text="Ej. 10")
    grid_columns = models.PositiveIntegerField(verbose_name="Columnas (Cuadrícula)", help_text="Ej. 15")
    cleaning_time_minutes = models.PositiveIntegerField(default=20, verbose_name="Tiempo de Limpieza (Min)", help_text="Tiempo requerido antes de la siguiente función.")
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        if is_new:
            alphabet = string.ascii_uppercase
            seats_to_create = []
            for r in range(self.grid_rows):
                row_label = alphabet[r % 26] * (r // 26 + 1)
                for c in range(self.grid_columns):
                    seats_to_create.append(Seat(
                        room=self,
                        row_label=row_label,
                        column_number=c + 1,
                        seat_type='normal'
                    ))
            Seat.objects.bulk_create(seats_to_create)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Sala"
        verbose_name_plural = "Salas"

class Seat(models.Model):
    SEAT_TYPES = [
        ('normal', 'Normal'),
        ('vip', 'VIP / Preferencial'),
        ('wheelchair', 'Silla de Ruedas'),
        ('corridor', 'Pasillo (Vacío)'), 
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='seats', verbose_name="Sala")
    row_label = models.CharField(max_length=5, verbose_name="Fila")
    column_number = models.PositiveIntegerField(verbose_name="Número")
    seat_type = models.CharField(max_length=20, choices=SEAT_TYPES, default='normal', verbose_name="Tipo de Butaca")

    def __str__(self):
        return f"{self.row_label}{self.column_number} - {self.room.name}"

    class Meta:
        verbose_name = "Butaca"
        verbose_name_plural = "Butacas"
        ordering = ['room', 'row_label', 'column_number']

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
        if not self.start_time or not getattr(self, 'movie', None) or not getattr(self, 'room', None):
            return

        if (self._state.adding or self.__original_start_time != self.start_time):
            if self.start_time <= timezone.now():
                raise ValidationError({'start_time': "La fecha y hora de la función debe ser futura."})

        if not self.movie.is_active:
            raise ValidationError({'movie': "No se puede programar una función para una película inactiva."})

        self.end_time = self.start_time + timedelta(minutes=self.movie.duration_minutes + 30)
        
        overlaps = Screening.objects.filter(
            room=self.room,
            is_active=True,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)
        
        if overlaps.exists():
            raise ValidationError("La sala ya tiene una función programada en ese horario.")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_start_time = self.start_time

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self): 
        start_formatted = getattr(self, 'start_time', None)
        if start_formatted:
            return f"{self.movie.title} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"
        return f"{self.movie.title} - (Sin fecha)"
        
    class Meta: 
        verbose_name = "Función"
        verbose_name_plural = "Funciones"

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

    class Meta: 
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"

class Format(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, verbose_name="Formato (Ej. 2D, 3D, IMAX)")
    price_modifier = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00, 
        verbose_name="Recargo por formato (Bs.)",
        help_text="Monto extra que se suma al precio base del ticket."
    )
    is_active = models.BooleanField(default=True, verbose_name="Activo")

    def __str__(self):
        return f"{self.name} (+Bs. {self.price_modifier})" if self.price_modifier > 0 else self.name

    class Meta:
        verbose_name = "Formato de Proyección"
        verbose_name_plural = "Formatos de Proyección"


class Language(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, verbose_name="Idioma / Versión")
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Versión de Idioma"
        verbose_name_plural = "Versiones de Idioma"


class TicketType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, verbose_name="Tipo de Entrada")
    base_price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Precio Base (Bs.)")
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    def __str__(self):
        return f"{self.name} (Bs. {self.base_price})"

    class Meta:
        verbose_name = "Tipo de Ticket"
        verbose_name_plural = "Tipos de Ticket"