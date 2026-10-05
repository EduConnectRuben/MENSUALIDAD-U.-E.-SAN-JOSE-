import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Si existe DATABASE_URL (Render), la usamos. Si no, usamos SQLite local para que funcione sin configurar Postgres localmente.
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = None

if DATABASE_URL:
    try:
        # Intentar conectar a Postgres
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
        print("Conectado a PostgreSQL exitosamente.")
    except Exception as e:
        print(f"Error conectando a Postgres (posiblemente la base de datos expiró): {e}")
        engine = None

# Si no hay URL o si la conexión a Postgres falló, usar SQLite
if not engine:
    print("Usando base de datos SQLite de respaldo...")
    DATABASE_URL = "sqlite:///./mensualidad_local.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
