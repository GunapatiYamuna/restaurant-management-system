from django.contrib import admin
from .models import Profile, Restaurant, MenuItem, Reservation, ReservationItem, Order, OrderItem, InventoryItem

admin.site.register([Profile, Restaurant, MenuItem, Reservation, ReservationItem, Order, OrderItem, InventoryItem])
