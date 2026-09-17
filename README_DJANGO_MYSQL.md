# FoodieHub — Django + MySQL

## Project structure
- `frontend/` — the existing FoodieHub frontend. Existing filenames and folders are retained.
- `backend/` — Django project, authentication, models, API, admin, and migrations.
- `database/` — MySQL database creation script.

## Database
Create the database with:
```bash
mysql -u root -p < database/mysql_setup.sql
```
Then copy `backend/.env.example` to `backend/.env` and set your MySQL credentials.

## Run
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
Open `http://127.0.0.1:8000/`.

The frontend and backend are served from the same Django server. Do not use VS Code Live Server for the integrated version.
