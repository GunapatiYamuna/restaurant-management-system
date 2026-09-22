from django.contrib import admin
from django.urls import include, path, re_path
from restaurant.views import frontend_page, asset_file

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("restaurant.urls")),
    re_path(r"^(?P<path>.*)$", frontend_page, name="frontend-page"),
]
