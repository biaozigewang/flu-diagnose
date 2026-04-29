import psycopg2
from psycopg2.extras import RealDictCursor

def get_connection():
    try:
        from api_config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSLMODE
    except ImportError:
        import os
        DB_HOST = os.environ['DB_HOST']
        DB_PORT = int(os.environ.get('DB_PORT', 25060))
        DB_NAME = os.environ.get('DB_NAME', 'defaultdb')
        DB_USER = os.environ.get('DB_USER', 'doadmin')
        DB_PASSWORD = os.environ['DB_PASSWORD']
        DB_SSLMODE = os.environ.get('DB_SSLMODE', 'require')

    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode=DB_SSLMODE,
        cursor_factory=RealDictCursor
    )
