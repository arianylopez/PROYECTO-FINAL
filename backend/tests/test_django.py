import pytest
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core_admin.settings")
django.setup()

from modules.catalog.models import Movie, Screening, TicketType, Room, Seat, TicketOrder
from modules.catalog.admin import MovieAdmin, ScreeningAdmin

def test_movie_model_str():
    m = Movie(title="Test Movie")
    assert str(m) == "Test Movie"

def test_room_model_str():
    r = Room(name="Room A")
    assert str(r) == "Room A"

def test_seat_model_str():
    r = Room(name="Room A")
    s = Seat(room=r, row="A", col="1")
    assert "A" in str(s)

def test_ticket_type_str():
    t = TicketType(name="Adult")
    assert "Adult" in str(t)

def test_ticket_order_str():
    o = TicketOrder(id="test-id", status="pending")
    assert "test-id" in str(o)
