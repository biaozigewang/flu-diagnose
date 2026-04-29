"""
数据库模型定义
"""
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, field, asdict
import json


@dataclass
class DiagnosisRecord:
    """诊断记录模型"""
    id: Optional[int] = None
    timestamp: str = field(default_factory=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    symptoms: Dict[str, Any] = field(default_factory=dict)
    diagnosis: str = ''
    diagnosis_text: str = ''
    confidence: float = 0.0
    risk_level: str = ''
    rules_triggered: list = field(default_factory=list)
    bayesian_probability: float = 0.0
    recommendations: list = field(default_factory=list)
    user_input: str = ''
    session_id: str = ''
    feedback: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """转换为字典"""
        return asdict(self)
    
    def to_json(self) -> str:
        """转换为 JSON 字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'DiagnosisRecord':
        """从字典创建"""
        return cls(**data)

