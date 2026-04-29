"""
用户认证 API - 注册/登录
使用 PostgreSQL 存储用户数据，JWT 做 Token 认证
"""
import hashlib
import secrets
import psycopg2
from flask import Blueprint, request, jsonify
from datetime import timedelta
from database.connection import get_connection

bp = Blueprint('auth', __name__)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode()).hexdigest()


init_db()


@bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'success': False, 'error': '用户名和密码不能为空'}), 400
    if len(username) < 2 or len(username) > 20:
        return jsonify({'success': False, 'error': '用户名长度为 2-20 位'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'error': '密码长度不能少于 6 位'}), 400

    salt = secrets.token_hex(16)
    password_hash = hash_password(password, salt)

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, password_hash, salt) VALUES (%s, %s, %s)',
            (username, password_hash, salt)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except psycopg2.errors.UniqueViolation:
        return jsonify({'success': False, 'error': '用户名已存在'}), 400

    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=username, expires_delta=timedelta(days=7))
    return jsonify({'success': True, 'token': token, 'username': username})


@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'success': False, 'error': '请填写用户名和密码'}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({'success': False, 'error': '用户名或密码错误'}), 401

    if hash_password(password, user['salt']) != user['password_hash']:
        return jsonify({'success': False, 'error': '用户名或密码错误'}), 401

    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=username, expires_delta=timedelta(days=7))
    return jsonify({'success': True, 'token': token, 'username': username})
