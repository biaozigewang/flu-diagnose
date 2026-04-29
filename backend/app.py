"""
甲流专家诊断系统 - Flask 主入口
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
import os

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'flu-sentinel-secret-2026')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # 由 create_access_token 的 expires_delta 控制

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    from api import diagnosis, nlp, history, auth
    app.register_blueprint(diagnosis.bp, url_prefix='/api')
    app.register_blueprint(nlp.bp, url_prefix='/api')
    app.register_blueprint(history.bp, url_prefix='/api')
    app.register_blueprint(auth.bp, url_prefix='/api')

    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'ok', 'message': '流感哨兵运行正常'})

    @app.route('/')
    def index():
        return jsonify({'name': '流感哨兵', 'version': '2.0.0'})

    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', port=5000, debug=True)


