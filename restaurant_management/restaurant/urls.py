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

    path(
    "api/register/",
    views.register_user,
    name="register_user"
),
    path(
    "api/login/",
    views.login_user,
    name="login_user"
),
    path("api/forgot-password/", views.forgot_password, name="forgot_password"),

    path("api/reset-password/", views.reset_password, name="reset_password"),
]