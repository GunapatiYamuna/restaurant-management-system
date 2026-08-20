from django.urls import path
from . import views


urlpatterns = [
    path(
        "",
        views.restaurant_list,
        name="restaurant_list"
    ),

    path(
        "restaurant/<int:restaurant_id>/",
        views.restaurant_details,
        name="restaurant_details"
    ),

    path(
        "restaurant/<int:restaurant_id>/reservation/",
        views.reservation,
        name="reservation"
    ),
]