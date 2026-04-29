"""
用户认证 API - 注册/登录
使用 SQLite 存储用户数据，JWT 做 Token 认证
"""
import os
import sqlite3
import hashlib
import secrets
from flask import Blueprint, request, jsonify
from datetime import timedelta

bp = Blueprint('auth', __name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'users.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode()).hexdigest()


# 初始化数据库
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
        conn = get_db()
        conn.execute(
            'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
            (username, password_hash, salt)
        )
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': '用户名已存在'}), 400

    from flask_jwt_extended import create_access_token
    token = create_access_token(
        identity=username,
        expires_delta=timedelta(days=7)
    )
    return jsonify({'success': True, 'token': token, 'username': username})


@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'success': False, 'error': '请填写用户名和密码'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'error': '用户名或密码错误'}), 401

    expected = hash_password(password, user['salt'])
    if expected != user['password_hash']:
        return jsonify({'success': False, 'error': '用户名或密码错误'}), 401

    from flask_jwt_extended import create_access_token
    token = create_access_token(
        identity=username,
        expires_delta=timedelta(days=7)
    )
    return jsonify({'success': True, 'token': token, 'username': username})
