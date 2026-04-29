"""
症状实体提取模块
"""
import json
import logging
import os
import re
from typing import Dict, List, Any, Optional
from .preprocessor import TextPreprocessor
from .negation_handler import NegationHandler

logger = logging.getLogger(__name__)


class SymptomExtractor:
    """症状提取器"""
    
    def __init__(self, dictionary_path: str = None):
        """初始化症状提取器，加载症状词典"""
        self.preprocessor = TextPreprocessor()
        self.negation_handler = NegationHandler()
        self.symptom_dict = {}

        if dictionary_path is None:
            dictionary_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'knowledge_base', 'symptom_dictionary.json'
            )
        
        self._load_dictionary(dictionary_path)
    
    def _load_dictionary(self, path: str):
        """加载症状词典"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                self.symptom_dict = json.load(f)
        except FileNotFoundError:
            logger.warning("症状词典未找到: %s", path)
            self.symptom_dict = {'symptoms': {}, 'risk_factors': {}}
    
    def extract(self, text: str) -> Dict[str, Any]:
        """从文本中提取症状实体和风险因素"""
        preprocessed = self.preprocessor.preprocess(text)
        symptoms = {}
        entities = []
        
        # 1. 提取体温
        temp_info = self._extract_temperature(text, preprocessed['numbers'])
        if temp_info:
            symptoms['fever'] = temp_info
            entities.append({
                'text': f"{temp_info['value']}度",
                'type': 'temperature',
                'normalized': 'fever',
                'value': temp_info['value']
            })
        
        # 2. 提取其他症状
        for symptom_key, symptom_info in self.symptom_dict.get('symptoms', {}).items():
            if symptom_key == 'fever':
                continue
            
            result = self._check_symptom(text, symptom_key, symptom_info)
            if result is not None:
                symptoms[symptom_key] = result
                entities.append({
                    'text': result.get('matched_text', symptom_info['name']),
                    'type': 'symptom',
                    'normalized': symptom_key,
                    'present': result['present'],
                    'negated': result.get('negated', False)
                })

        for factor_key, factor_info in self.symptom_dict.get('risk_factors', {}).items():
            result = self._check_risk_factor(text, factor_key, factor_info)
            if result is not None:
                symptoms[factor_key] = result
        
        return {
            'symptoms': symptoms,
            'entities': entities,
            'preprocessed': preprocessed
        }
    
    def _extract_temperature(self, text: str, numbers: List[dict]) -> Optional[Dict]:
        """提取体温信息"""
        temp_values = [n for n in numbers if n['type'] == 'temperature']
        
        if temp_values:
            value = temp_values[0]['value']
            
            # 检查是否被否定
            negation_words = self.symptom_dict.get('negation_words', [])
            fever_words = ['发烧', '发热', '体温']
            
            is_negated = False
            for neg_word in negation_words:
                for fever_word in fever_words:
                    if f"{neg_word}{fever_word}" in text or f"{neg_word} {fever_word}" in text:
                        is_negated = True
                        break
            
            if is_negated:
                return {'present': False, 'value': None}
            
            return {
                'present': True,
                'value': value,
                'severity': self._classify_fever(value)
            }
        
        # 检查是否提到发烧但没有数值
        fever_synonyms = self.symptom_dict.get('symptoms', {}).get('fever', {}).get('synonyms', [])
        for synonym in fever_synonyms:
            if synonym in text:
                # 检查是否被否定
                if self.negation_handler.is_negated(text, synonym):
                    return {'present': False, 'value': None, 'matched_text': synonym}
                return {'present': True, 'value': None, 'matched_text': synonym}
        
        return None
    
    def _classify_fever(self, temperature: float) -> str:
        """分类发热程度"""
        if temperature >= 39.0:
            return 'high'
        elif temperature >= 38.0:
            return 'moderate'
        elif temperature >= 37.3:
            return 'low'
        else:
            return 'none'
    
    def _check_symptom(self, text: str, symptom_key: str, symptom_info: dict) -> Optional[Dict]:
        """检查某个症状是否存在"""
        synonyms = symptom_info.get('synonyms', [])
        name = symptom_info.get('name', symptom_key)
        
        all_terms = [name] + synonyms
        
        for term in all_terms:
            if term in text:
                is_negated = self.negation_handler.is_negated(text, term)
                severity = self._check_severity(text, term)
                
                return {
                    'present': not is_negated,
                    'negated': is_negated,
                    'matched_text': term,
                    'severity': severity
                }
        
        return None
    
    def _check_severity(self, text: str, symptom_term: str) -> str:
        """检查症状严重程度"""
        degree_words = self.symptom_dict.get('degree_words', {})
        
        # 查找症状词附近的程度词
        for severity, words in degree_words.items():
            for word in words:
                pattern = f"{word}.*{symptom_term}|{symptom_term}.*{word}"
                if re.search(pattern, text):
                    return severity

        return 'moderate'
    
    def _check_risk_factor(self, text: str, factor_key: str, factor_info: dict) -> Optional[Dict]:
        """检查风险因素"""
        synonyms = factor_info.get('synonyms', [])
        name = factor_info.get('name', factor_key)
        
        all_terms = [name] + synonyms
        
        for term in all_terms:
            if term in text:
                is_negated = self.negation_handler.is_negated(text, term)
                return {
                    'present': not is_negated,
                    'matched_text': term
                }
        
        return None
    
    def get_symptom_question(self, symptom_key: str) -> str:
        """获取某症状对应的问题"""
        symptom_info = self.symptom_dict.get('symptoms', {}).get(symptom_key, {})
        return symptom_info.get('question', f'您是否有{symptom_key}的症状？')

