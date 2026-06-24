from django.core.management.base import BaseCommand
from modules.catalog.models import Movie
from elasticsearch import Elasticsearch
import os

class Command(BaseCommand):
    help = 'Sincroniza las películas de PostgreSQL a Elasticsearch'

    def handle(self, *args, **kwargs):
        es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://127.0.0.1:9200"))
        movies = Movie.objects.filter(is_active=True)
        count = 0
        
        for m in movies:
            doc = {
                "id": str(m.id),
                "title": m.title,
                "synopsis": m.synopsis,
                "director": m.director,
                "duration_minutes": m.duration_minutes,
                "rating_classification": m.rating_classification,
                "release_date": m.release_date.isoformat() if m.release_date else None,
                "poster_url": m.poster_url,
                "trailer_url": m.trailer_url,
                "genres": list(m.genres.values_list('name', flat=True))
            }
            es.index(index="movies", id=str(m.id), document=doc)
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Sincronizadas {count} películas a Elasticsearch.'))