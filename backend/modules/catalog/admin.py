from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.forms.models import model_to_dict
from django.utils.timezone import now
from django.core.exceptions import PermissionDenied 
import json
from django.core.serializers.json import DjangoJSONEncoder
from .models import Genre, Seat, Movie, Room, Screening, TicketOrder, AuditLog, Format, Language, TicketType

def create_audit_log(request, action, obj, snapshot_before=None):
    snapshot_after = model_to_dict(obj) if action != 'DELETE' else None
    
    if snapshot_after and 'genres' in snapshot_after:
        snapshot_after['genres'] = list(obj.genres.values_list('name', flat=True))
        
    if snapshot_before and 'genres' in snapshot_before:
        snapshot_before['genres'] = [str(g) for g in snapshot_before['genres']]
        
    if snapshot_after:
        snapshot_after = json.loads(json.dumps(snapshot_after, cls=DjangoJSONEncoder))
    if snapshot_before:
        snapshot_before = json.loads(json.dumps(snapshot_before, cls=DjangoJSONEncoder))
        
    AuditLog.objects.create(
        admin_user=request.user, 
        action=action, 
        table_name=obj._meta.model_name,
        record_id=str(obj.pk), 
        snapshot_before=snapshot_before, 
        snapshot_after=snapshot_after
    )

class MovieForm(forms.ModelForm):
    class Meta:
        model = Movie
        fields = '__all__'
    
    def clean_genres(self):
        genres = self.cleaned_data.get('genres')
        if not genres or genres.count() < 1:
            raise forms.ValidationError("Debes seleccionar al menos 1 género.")
        return genres

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    form = MovieForm
    list_display = ('poster_preview', 'title', 'release_date', 'rating_classification', 'is_active')
    list_filter = ('is_active', 'rating_classification', 'genres')
    search_fields = ('title', 'director')
    filter_horizontal = ('genres',)
    actions = ['soft_delete_movies']

    def poster_preview(self, obj):
        if obj.poster_url:
            return format_html('<img src="{}" style="width: 45px; height: 65px; object-fit: cover; border-radius: 6px;" onerror="this.style.display=\'none\'"/>', obj.poster_url)
        return "-"
    poster_preview.short_description = 'Afiche'

    def add_view(self, request, form_url='', extra_context=None):
        if request.user.groups.filter(name='Audit Admin').exists():
            raise PermissionDenied("No tenés permiso para realizar esta acción")
        return super().add_view(request, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        snapshot_before = model_to_dict(Movie.objects.get(pk=obj.pk)) if change else None
        super().save_model(request, obj, form, change)
        create_audit_log(request, 'UPDATE' if change else 'CREATE', obj, snapshot_before)

    def delete_model(self, request, obj):
        if obj.is_active:
            snapshot_before = model_to_dict(obj)
            obj.is_active = False
            obj.save()
            obj.screenings.filter(start_time__gte=now(), is_active=True).update(is_active=False)
            create_audit_log(request, 'DELETE', obj, snapshot_before)

    def delete_queryset(self, request, queryset):
        count = 0
        for obj in queryset:
            if obj.is_active:
                self.delete_model(request, obj)
                count += 1
        self.message_user(request, f'{count} películas dadas de baja correctamente.')

    @admin.action(description='Dar de baja películas seleccionadas')
    def soft_delete_movies(self, request, queryset):
        self.delete_queryset(request, queryset)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'grid_rows', 'grid_columns', 'cleaning_time_minutes', 'is_active')
    search_fields = ('name',)

@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    list_display = ('movie', 'room', 'start_time', 'end_time', 'price', 'is_active')
    list_filter = ('is_active', 'room', 'start_time')
    search_fields = ('movie__title',)

    def save_model(self, request, obj, form, change):
        snapshot_before = model_to_dict(Screening.objects.get(pk=obj.pk)) if change else None
        action = 'UPDATE' if change else 'CREATE'

        if change and not obj.is_active and snapshot_before.get('is_active') == True:
            action = 'CANCEL'
            obj.ticket_orders.filter(status='completed').update(status='pending_refund')
            if not obj.cancellation_reason:
                obj.cancellation_reason = "Cancelada por administrador"

        super().save_model(request, obj, form, change)
        create_audit_log(request, action, obj, snapshot_before)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'table_name', 'admin_user', 'timestamp')
    list_filter = ('action', 'table_name')
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

admin.site.register(Genre)
admin.site.register(TicketOrder) 

@admin.register(Format)
class FormatAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_modifier', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_price', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('room', 'row_label', 'column_number', 'seat_type')
    list_filter = ('room', 'seat_type')
    list_editable = ('seat_type',) 
    list_per_page = 200