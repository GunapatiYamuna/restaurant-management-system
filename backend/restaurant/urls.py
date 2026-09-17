from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_user),
    path("login/", views.login_user),
    path("admin-register/", views.admin_register),
    path("admin-login/", views.admin_login),
    path("logout/", views.logout_user),
    path("me/", views.current_user),
    path("forgot-password/", views.forgot_password),
    path("reset-password/", views.reset_password),
    path("restaurants/", views.restaurants),
    path("menu-items/", views.menu_items),
    path("restaurants/<int:restaurant_id>/", views.restaurant_detail),
    path("reservations/", views.create_reservation),
    path("orders/", views.create_order),
    path("orders/history/", views.order_history),
]
