"""
Flask 应用配置文件
"""
import os

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'flu-diagnosis-expert-system-secret-key'
    
    # 数据库配置
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'flu_diagnosis.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
    
    # 知识库路径
    KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, 'knowledge_base')
    RULES_FILE = os.path.join(KNOWLEDGE_BASE_PATH, 'rules.json')
    BAYESIAN_FILE = os.path.join(KNOWLEDGE_BASE_PATH, 'bayesian_network.json')
    SYMPTOM_DICT_FILE = os.path.join(KNOWLEDGE_BASE_PATH, 'symptom_dictionary.json')
    
    # 诊断阈值
    DIAGNOSIS_THRESHOLD = 0.85  # 置信度阈值
    HIGH_RISK_THRESHOLD = 0.7   # 高风险阈值
    
    # 调试模式
    DEBUG = True


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False


# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

