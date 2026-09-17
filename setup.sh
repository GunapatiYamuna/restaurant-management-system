#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
cp -n backend/.env.example backend/.env || true
echo "Next: edit backend/.env, create the MySQL database, then run:"
echo "  mysql -u root -p < database/mysql_setup.sql"
echo "  cd backend && python manage.py migrate && python manage.py createsuperuser && python manage.py runserver"
