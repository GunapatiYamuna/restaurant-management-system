web: cd backend && python manage.py migrate --noinput --verbosity 1 && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
