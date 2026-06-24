from fastapi import APIRouter, Query, HTTPException, Depends
from elasticsearch import Elasticsearch
import redis
import json
import os
import uuid
from typing import Optional, List
from sqlalchemy import text
from sqlalchemy.orm import Session
from core.database import get_business_db
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/catalog", tags=["Public Catalog"])

ES_HOST = os.getenv("ELASTICSEARCH_URL", "http://127.0.0.1:9200")
es = Elasticsearch(ES_HOST)

# FIX: Por defecto apunta a 127.0.0.1 para que la caché sí funcione
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

class LockSeatsRequest(BaseModel):
    seat_ids: List[str]
    user_id: str

class PurchaseRequest(BaseModel):
    seat_ids: List[str]
    seat_labels: List[str]
    payment_method: str
    user_id: str
    invoice_total: float

class MovieResponse(BaseModel):
    id: str
    title: str
    director: str
    duration_minutes: int
    rating_classification: str
    release_date: str
    poster_url: str
    genres: List[str]
    synopsis: str = ""
    trailer_url: str = ""

class CatalogResponse(BaseModel):
    items: List[MovieResponse]
    total: int
    page: int
    size: int
    pages: int

class GenreResponse(BaseModel):
    genres: List[str]

class ScreeningResponse(BaseModel):
    id: str
    start_time: str
    room: str
    format: str
    language: str

class MovieDetailResponse(MovieResponse):
    screenings: List[ScreeningResponse]

class TicketTypeResponse(BaseModel):
    id: str
    name: str
    price: float

class MovieScreeningsResponse(BaseModel):
    movie: dict
    screenings: List[ScreeningResponse]
    ticket_types: List[TicketTypeResponse]

class SeatResponse(BaseModel):
    id: str
    row: str
    col: int
    type: str
    status: str

class ScreeningSeatsResponse(BaseModel):
    movie: dict
    screening: dict
    ticket_types: List[TicketTypeResponse]
    seats: List[SeatResponse]
    active_lock_ttl: Optional[int]

class OrderTicket(BaseModel):
    seat_id: str
    qr_code: str

class PurchaseResponse(BaseModel):
    order_id: str
    status: str
    method: str
    tickets: List[OrderTicket]

class OrderHistoryItem(BaseModel):
    id: str
    user_id: str
    movie_title: str
    poster_url: str
    room_name: str
    start_time: str
    seat_labels: List[str]
    total_price: float
    status: str
    created_at: str
    tickets: List[OrderTicket]

class OrderHistoryResponse(BaseModel):
    orders: List[OrderHistoryItem]

@router.get("/movies", response_model=CatalogResponse)
def get_public_movies(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    q: Optional[str] = Query(None, description="Término de búsqueda para título"),
    genre: Optional[str] = Query(None, description="Filtro exacto por nombre de género"),
    db: Session = Depends(get_business_db)
):
    cache_key = f"public_movies_p{page}_s{size}_q{q}_g{genre}"

    # 1. Intentar Redis
    try:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        print(f"Redis Cache Miss/Error: {e}")

    # 2. Resiliencia: Buscar directo en PostgreSQL (Bypass de Elasticsearch)
    try:
        offset = (page - 1) * size
        where_clauses = ["is_active = true"]
        params = {}

        if q and len(q.strip()) >= 2:
            where_clauses.append("(title ILIKE :q OR director ILIKE :q)")
            params["q"] = f"%{q.strip()}%"

        if genre:
            where_clauses.append("""
                id IN (
                    SELECT movie_id FROM catalog_movie_genres mg 
                    JOIN catalog_genre g ON mg.genre_id = g.id 
                    WHERE g.name = :genre
                )
            """)
            params["genre"] = genre

        where_sql = " AND ".join(where_clauses)
        count_query = text(f"SELECT COUNT(*) FROM catalog_movie WHERE {where_sql}")
        total = db.execute(count_query, params).scalar()

        data_query = text(f"""
            SELECT CAST(id AS VARCHAR), title, director, duration_minutes, 
                   rating_classification, CAST(release_date AS VARCHAR), poster_url, synopsis, trailer_url
            FROM catalog_movie
            WHERE {where_sql}
            ORDER BY release_date DESC
            LIMIT :limit OFFSET :offset
        """)
        
        params["limit"] = size
        params["offset"] = offset
        movies_rows = db.execute(data_query, params).fetchall()

        movies = []
        for r in movies_rows:
            movie_id = r[0]
            genres_q = text("""
                SELECT g.name FROM catalog_genre g 
                JOIN catalog_movie_genres mg ON g.id = mg.genre_id 
                WHERE mg.movie_id = :mid
            """)
            g_rows = db.execute(genres_q, {"mid": movie_id}).fetchall()
            genres = [gr[0] for gr in g_rows]

            movies.append({
                "id": r[0],
                "title": r[1],
                "director": r[2],
                "duration_minutes": r[3],
                "rating_classification": r[4],
                "release_date": r[5] if r[5] else "",
                "poster_url": r[6] if r[6] else "",
                "synopsis": r[7] if r[7] else "",
                "trailer_url": r[8] if r[8] else "",
                "genres": genres
            })

        result = {
            "items": movies,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }

        if not q and not genre:
            try:
                redis_client.setex(cache_key, 300, json.dumps(result))
            except Exception:
                pass

        return result

    except Exception as e:
        print(f"PostgreSQL Fallback Error: {e}")
        raise HTTPException(status_code=500, detail="Error interno al buscar en la cartelera")

@router.get("/genres", response_model=GenreResponse)
def get_public_genres(db: Session = Depends(get_business_db)):
    try:
        query = text("SELECT name FROM catalog_genre ORDER BY name ASC")
        result = db.execute(query).fetchall()
        genres = [row[0] for row in result]
        if not genres:
            return {"genres": []}
        return {"genres": genres}
    except Exception as e:
        print(f"Error al obtener géneros: {e}")
        return {"genres": []}

@router.get("/movies/{movie_id}", response_model=MovieDetailResponse)
def get_movie_detail(movie_id: str, db: Session = Depends(get_business_db)):
    try:
        movie_query = text("""
            SELECT CAST(id AS VARCHAR), title, synopsis, duration_minutes, rating_classification, director,
                   CAST(release_date AS VARCHAR), poster_url, trailer_url
            FROM catalog_movie
            WHERE id = :id AND is_active = true
        """)
        movie_row = db.execute(movie_query, {"id": movie_id}).fetchone()

        if not movie_row:
            raise HTTPException(status_code=404, detail="Película no encontrada o inactiva")

        movie = {
            "id": movie_row[0], "title": movie_row[1], "synopsis": movie_row[2],
            "duration_minutes": movie_row[3],
            "rating_classification": movie_row[4],
            "director": movie_row[5], "release_date": movie_row[6],
            "poster_url": movie_row[7], "trailer_url": movie_row[8],
            "genres": [],
            "screenings": []
        }

        try:
            genres_query = text("""
                SELECT g.name
                FROM catalog_genre g
                JOIN catalog_movie_genres mg ON g.id = mg.genre_id
                WHERE mg.movie_id = :id
            """)
            genres_result = db.execute(genres_query, {"id": movie_id}).fetchall()
            movie["genres"] = [row[0] for row in genres_result]
        except Exception:
            pass

        now_utc = datetime.now(timezone.utc)
        try:
            screenings_query = text("""
                SELECT CAST(s.id AS VARCHAR), s.start_time, r.name, f.name, l.name
                FROM catalog_screening s
                JOIN catalog_room r ON s.room_id = r.id
                JOIN catalog_format f ON s.format_id = f.id
                JOIN catalog_language l ON s.language_id = l.id
                WHERE s.movie_id = :id
                  AND s.start_time > :now
                  AND s.is_active = true
                ORDER BY s.start_time ASC
            """)
            screenings_result = db.execute(screenings_query, {"id": movie_id, "now": now_utc}).fetchall()

            for s in screenings_result:
                movie["screenings"].append({
                    "id": s[0],
                    "start_time": s[1].isoformat() if hasattr(s[1], 'isoformat') else str(s[1]),
                    "room": s[2],
                    "format": s[3],
                    "language": s[4]
                })
        except Exception as se:
            print(f"[Warning] Error cargando funciones: {se}")

        return movie

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Error en /movies/{movie_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al cargar la película")

@router.get("/movies/{movie_id}/screenings", response_model=MovieScreeningsResponse)
def get_movie_screenings(movie_id: str, db: Session = Depends(get_business_db)):
    try:
        movie_query = text("""
            SELECT title, duration_minutes, rating_classification, poster_url
            FROM catalog_movie
            WHERE id = :id AND is_active = true
        """)
        movie_row = db.execute(movie_query, {"id": movie_id}).fetchone()

        if not movie_row:
            raise HTTPException(status_code=404, detail="Película no encontrada")

        now_utc = datetime.now(timezone.utc)
        screenings_query = text("""
            SELECT CAST(s.id AS VARCHAR), s.start_time, r.name as room_name, f.name as format_name, l.name as language_name
            FROM catalog_screening s
            JOIN catalog_room r ON s.room_id = r.id
            JOIN catalog_format f ON s.format_id = f.id
            JOIN catalog_language l ON s.language_id = l.id
            WHERE s.movie_id = :id
              AND s.start_time > :now
              AND s.is_active = true
            ORDER BY s.start_time ASC
        """)

        screenings_result = db.execute(screenings_query, {"id": movie_id, "now": now_utc}).fetchall()

        screenings = []
        for s in screenings_result:
            screenings.append({
                "id": s[0],
                "start_time": s[1].isoformat() if hasattr(s[1], 'isoformat') else str(s[1]),
                "room": s[2],
                "format": s[3],
                "language": s[4]
            })

        ticket_types = []
        try:
            tt_query = text("""
                SELECT CAST(id AS VARCHAR), name, base_price
                FROM catalog_tickettype
                WHERE is_active = true
                ORDER BY base_price DESC
            """)
            tt_result = db.execute(tt_query).fetchall()
            for t in tt_result:
                ticket_types.append({
                    "id": t[0],
                    "name": t[1],
                    "price": float(t[2])
                })
        except Exception as e:
            print(f"[Warning] Error cargando TicketTypes desde DB: {e}")
            db.rollback()
            try:
                tt_query_fallback = text("SELECT CAST(id AS VARCHAR), name, base_price FROM catalog_tickettype ORDER BY base_price DESC")
                tt_result_fb = db.execute(tt_query_fallback).fetchall()
                for t in tt_result_fb:
                    ticket_types.append({"id": t[0], "name": t[1], "price": float(t[2])})
            except Exception as e2:
                print(f"[CRITICAL] Error final en TicketTypes: {e2}")

        return {
            "movie": {
                "id": movie_id,
                "title": movie_row[0],
                "duration_minutes": movie_row[1],
                "rating_classification": movie_row[2],
                "poster_url": movie_row[3]
            },
            "screenings": screenings,
            "ticket_types": ticket_types
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Error en /movies/{movie_id}/screenings: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al cargar los horarios")

@router.get("/screenings/{screening_id}/seats", response_model=ScreeningSeatsResponse)
def get_screening_seats(screening_id: str, user_id: Optional[str] = Query(None), db: Session = Depends(get_business_db)):
    try:
        scr_query = text("""
            SELECT s.room_id, s.start_time, m.id as movie_id, m.title, m.poster_url, m.duration_minutes, m.rating_classification, r.name as room_name
            FROM catalog_screening s
            JOIN catalog_movie m ON s.movie_id = m.id
            JOIN catalog_room r ON s.room_id = r.id
            WHERE s.id = :id AND s.is_active = true
        """)
        scr = db.execute(scr_query, {"id": screening_id}).fetchone()

        if not scr:
            raise HTTPException(404, "Función no encontrada.")

        if scr[1] < datetime.now(timezone.utc):
            raise HTTPException(422, "No se pueden seleccionar butacas para una función pasada.")

        seats_query = text("""
            SELECT CAST(id AS VARCHAR), row_label, column_number, seat_type
            FROM catalog_seat
            WHERE room_id = :rid
            ORDER BY row_label, column_number
        """)
        seats = db.execute(seats_query, {"rid": scr[0]}).fetchall()

        locked_keys = redis_client.keys(f"lock:{screening_id}:*")

        locked_seat_ids = []
        my_locked_seat_ids = []
        active_ttl = 0

        for key in locked_keys:
            sid = key.split(":")[-1]
            lock_owner = redis_client.get(key)

            if user_id and lock_owner == user_id:
                my_locked_seat_ids.append(sid)
                ttl = redis_client.ttl(key)
                if ttl > active_ttl:
                    active_ttl = ttl
            else:
                locked_seat_ids.append(sid)

        sold_query = text("""
            SELECT CAST(seat_id AS VARCHAR)
            FROM catalog_ticket t
            JOIN catalog_ticketorder o ON t.order_id = o.id
            WHERE o.screening_id = :scr AND o.status = 'completed'
        """)
        sold_records = db.execute(sold_query, {"scr": screening_id}).fetchall()
        db_sold_ids = [row[0] for row in sold_records]

        result_seats = []
        for s in seats:
            sid = s[0]
            if sid in db_sold_ids:
                status = "sold"
            elif sid in my_locked_seat_ids:
                status = "locked_by_me"
            elif sid in locked_seat_ids:
                status = "locked"
            else:
                status = "available"

            result_seats.append({
                "id": sid, "row": s[1], "col": s[2], "type": s[3], "status": status
            })

        ticket_types = []
        tt_query = text("SELECT CAST(id AS VARCHAR), name, base_price FROM catalog_tickettype WHERE is_active = true")
        for t in db.execute(tt_query).fetchall():
            ticket_types.append({"id": t[0], "name": t[1], "price": float(t[2])})

        return {
            "movie": {
                "id": scr[2], "title": scr[3], "poster_url": scr[4],
                "duration_minutes": scr[5], "rating_classification": scr[6]
            },
            "screening": {
                "id": screening_id, "start_time": scr[1].isoformat(), "room_name": scr[7]
            },
            "ticket_types": ticket_types,
            "seats": result_seats,
            "active_lock_ttl": active_ttl if active_ttl > 0 else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Error] Seats: {e}")
        raise HTTPException(500, "Error interno al cargar la sala.")

@router.post("/screenings/{screening_id}/lock-seats")
def lock_seats(screening_id: str, req: LockSeatsRequest, db: Session = Depends(get_business_db)):
    if len(req.seat_ids) > 8:
        raise HTTPException(400, "Máximo 8 entradas por compra.")

    locked_acquired = []

    for sid in req.seat_ids:
        key = f"lock:{screening_id}:{sid}"
        acquired = redis_client.set(key, req.user_id, nx=True, ex=600)

        if acquired:
            locked_acquired.append(key)
        else:
            for lk in locked_acquired:
                redis_client.delete(lk)
            raise HTTPException(409, "Una o más butacas acaban de ser reservadas por otro usuario.")

    return {"message": "Butacas bloqueadas con éxito.", "expires_in_seconds": 600}

@router.delete("/screenings/{screening_id}/lock-seats")
def unlock_seats(screening_id: str, user_id: str = Query(...)):
    locked_keys = redis_client.keys(f"lock:{screening_id}:*")
    freed_count = 0

    for key in locked_keys:
        if redis_client.get(key) == user_id:
            redis_client.delete(key)
            freed_count += 1

    return {"message": f"{freed_count} butacas liberadas."}

@router.post("/screenings/{screening_id}/purchase", response_model=PurchaseResponse)
def process_purchase(screening_id: str, req: PurchaseRequest, db: Session = Depends(get_business_db)):
    for sid in req.seat_ids:
        check_query = text("""
            SELECT t.id
            FROM catalog_ticket t
            JOIN catalog_ticketorder o ON t.order_id = o.id
            WHERE o.screening_id = :scr AND t.seat_id = :sid AND o.status = 'completed'
        """)
        is_sold = db.execute(check_query, {"scr": screening_id, "sid": sid}).fetchone()
        if is_sold:
            raise HTTPException(409, f"Lo sentimos, uno de los asientos seleccionados ya fue comprado.")

    order_number = f"ORD-{datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"

    try:
        insert_order = text("""
            INSERT INTO catalog_ticketorder (id, screening_id, user_id, total_price, status, created_at)
            VALUES (:id, :scr, :uid, :total, 'completed', :now)
        """)
        db.execute(insert_order, {
            "id": order_number, "scr": screening_id, "uid": req.user_id,
            "total": req.invoice_total, "now": datetime.now(timezone.utc)
        })

        tickets_info = []
        for sid in req.seat_ids:
            ticket_id = str(uuid.uuid4())
            qr = f"QR-{order_number}-{sid}"
            insert_ticket = text("""
                INSERT INTO catalog_ticket (id, order_id, seat_id, qr_code)
                VALUES (:tid, :oid, :sid, :qr)
            """)
            db.execute(insert_ticket, {"tid": ticket_id, "oid": order_number, "sid": sid, "qr": qr})
            tickets_info.append({"seat_id": sid, "qr_code": qr})

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"[DB ERROR] Fallo al crear orden: {e}")
        raise HTTPException(500, "Error crítico al procesar y guardar la compra.")

    try:
        for sid in req.seat_ids:
            redis_client.delete(f"lock:{screening_id}:{sid}")

        scr_query = text("""
            SELECT m.title, m.poster_url, r.name, s.start_time
            FROM catalog_screening s
            JOIN catalog_movie m ON s.movie_id = m.id
            JOIN catalog_room r ON s.room_id = r.id
            WHERE s.id = :id
        """)
        scr = db.execute(scr_query, {"id": screening_id}).fetchone()

        order_data = {
            "id": order_number,
            "user_id": req.user_id,
            "movie_title": scr[0] if scr else "Película",
            "poster_url": scr[1] if scr else "",
            "room_name": scr[2] if scr else "Sala",
            "start_time": scr[3].isoformat() if scr else datetime.now().isoformat(),
            "seat_labels": req.seat_labels,
            "total_price": req.invoice_total,
            "status": "Completada",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "tickets": tickets_info
        }

        redis_client.set(f"order:{order_number}", json.dumps(order_data))
        redis_client.sadd(f"user_orders:{req.user_id}", order_number)

    except Exception as re:
        print(f"[REDIS WARNING] Orden en BD pero falló caché historial: {re}")

    return {
        "order_id": order_number,
        "status": "completed",
        "method": req.payment_method,
        "tickets": tickets_info
    }

@router.get("/me/orders", response_model=OrderHistoryResponse)
def get_my_orders(user_id: str = Query(...)):
    order_ids = redis_client.smembers(f"user_orders:{user_id}")
    orders = []
    for oid in order_ids:
        odata = redis_client.get(f"order:{oid}")
        if odata:
            orders.append(json.loads(odata))

    orders.sort(key=lambda x: x["created_at"], reverse=True)
    return {"orders": orders}

@router.get("/me/orders/{order_id}", response_model=OrderHistoryItem)
def get_order_detail(order_id: str, user_id: str = Query(...)):
    odata = redis_client.get(f"order:{order_id}")
    if not odata:
        raise HTTPException(404, "Orden no encontrada")

    order = json.loads(odata)
    if order["user_id"] != user_id:
        raise HTTPException(403, "Forbidden: La orden no te pertenece")

    return order
