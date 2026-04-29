"""
知识库管理器 - 负责加载和管理规则、贝叶斯网络、症状词典
"""
import json
import logging
import os
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class KnowledgeManager:
    """知识库管理器"""
    
    def __init__(self, base_path: str = None):
        """初始化知识库，加载规则、贝叶斯网络和症状词典"""
        if base_path is None:
            base_path = os.path.dirname(os.path.abspath(__file__))
        
        self.base_path = base_path
        self.rules = []
        self.bayesian_network = {}
        self.symptom_dictionary = {}

        self._load_rules()
        self._load_bayesian_network()
        self._load_symptom_dictionary()
    
    def _load_rules(self):
        """加载产生式规则"""
        rules_file = os.path.join(self.base_path, 'rules.json')
        try:
            with open(rules_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.rules = data.get('rules', [])
            logger.info("已加载 %d 条诊断规则", len(self.rules))
        except FileNotFoundError:
            logger.warning("规则文件不存在: %s", rules_file)
            self.rules = []
        except json.JSONDecodeError as e:
            logger.error("规则文件解析错误: %s", e)
            self.rules = []
    
    def _load_bayesian_network(self):
        """加载贝叶斯网络结构"""
        bn_file = os.path.join(self.base_path, 'bayesian_network.json')
        try:
            with open(bn_file, 'r', encoding='utf-8') as f:
                self.bayesian_network = json.load(f)
            logger.info("已加载贝叶斯网络结构")
        except FileNotFoundError:
            logger.warning("贝叶斯网络文件不存在: %s", bn_file)
            self.bayesian_network = {}
        except json.JSONDecodeError as e:
            logger.error("贝叶斯网络文件解析错误: %s", e)
            self.bayesian_network = {}
    
    def _load_symptom_dictionary(self):
        """加载症状词典"""
        dict_file = os.path.join(self.base_path, 'symptom_dictionary.json')
        try:
            with open(dict_file, 'r', encoding='utf-8') as f:
                self.symptom_dictionary = json.load(f)
            logger.info("已加载症状词典")
        except FileNotFoundError:
            logger.warning("症状词典文件不存在: %s", dict_file)
            self.symptom_dictionary = {}
        except json.JSONDecodeError as e:
            logger.error("症状词典文件解析错误: %s", e)
            self.symptom_dictionary = {}
    
    def get_rules(self) -> List[Dict]:
        """获取所有规则"""
        return self.rules
    
    def get_rules_by_symptom(self, symptom: str) -> List[Dict]:
        """根据症状获取相关规则"""
        related_rules = []
        for rule in self.rules:
            conditions = rule.get('conditions', [])
            if any(symptom in cond for cond in conditions):
                related_rules.append(rule)
        return related_rules
    
    def get_rules_by_conclusion(self, conclusion: str) -> List[Dict]:
        """根据结论获取相关规则"""
        return [
            rule for rule in self.rules 
            if rule.get('conclusion') == conclusion
        ]
    
    def get_bayesian_network(self) -> Dict:
        """获取贝叶斯网络结构"""
        return self.bayesian_network
    
    def get_symptom_synonyms(self, symptom: str) -> List[str]:
        """获取症状的同义词"""
        symptoms = self.symptom_dictionary.get('symptoms', {})
        for key, value in symptoms.items():
            if key == symptom or symptom in value.get('synonyms', []):
                return [key] + value.get('synonyms', [])
        return [symptom]
    
    def normalize_symptom(self, symptom_text: str) -> Optional[str]:
        """将症状文本标准化为系统内部使用的症状名"""
        symptoms = self.symptom_dictionary.get('symptoms', {})
        for key, value in symptoms.items():
            if symptom_text == key or symptom_text in value.get('synonyms', []):
                return key
        return None
    
    def get_all_symptoms(self) -> List[str]:
        """获取所有支持的症状列表"""
        return list(self.symptom_dictionary.get('symptoms', {}).keys())
    
    def add_rule(self, rule: Dict) -> bool:
        """添加新规则"""
        if 'id' not in rule or 'conditions' not in rule or 'conclusion' not in rule:
            return False
        self.rules.append(rule)
        return True
    
    def save_rules(self):
        """保存规则到文件"""
        rules_file = os.path.join(self.base_path, 'rules.json')
        with open(rules_file, 'w', encoding='utf-8') as f:
            json.dump({'rules': self.rules}, f, ensure_ascii=False, indent=2)





