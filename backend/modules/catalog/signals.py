from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Movie
from elasticsearch import Elasticsearch
import os

ES_HOST = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
es_client = Elasticsearch(ES_HOST)

@receiver(post_save, sender=Movie)
def sync_movie_to_es(sender, instance, **kwargs):
    index_name = "movies"
    
    if instance.is_active:
        genres_list = list(instance.genres.values_list('name', flat=True)) if instance.pk else []
        
        doc = {
            "id": str(instance.id),
            "title": instance.title,
            "synopsis": instance.synopsis,
            "director": instance.director,
            "duration_minutes": instance.duration_minutes,
            "rating_classification": instance.rating_classification,
            "release_date": instance.release_date.isoformat() if instance.release_date else None,
            "poster_url": instance.poster_url,
            "trailer_url": instance.trailer_url,
            "genres": genres_list
        }
        es_client.index(index=index_name, id=str(instance.id), document=doc)
    else:
        try:
            es_client.delete(index=index_name, id=str(instance.id))
        except Exception:
            pass

@receiver(post_delete, sender=Movie)
def delete_movie_from_es(sender, instance, **kwargs):
    try:
        es_client.delete(index="movies", id=str(instance.id))
    except Exception:
        pass