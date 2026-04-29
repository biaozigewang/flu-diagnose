"""
产生式规则 IF-THEN
"""
from typing import List, Dict, Any
import re


class Rule:
    
    def __init__(self, rule_id: str, conditions: List[str], conclusion: str,
                 confidence: float = 1.0, priority: int = 1, 
                 name: str = "", description: str = "", conclusion_text: str = ""):
        self.id = rule_id
        self.conditions = conditions
        self.conclusion = conclusion
        self.confidence = confidence
        self.priority = priority
        self.name = name
        self.description = description
        self.conclusion_text = conclusion_text
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Rule':
        return cls(
            rule_id=data.get('id', ''),
            conditions=data.get('conditions', []),
            conclusion=data.get('conclusion', ''),
            confidence=data.get('confidence', 1.0),
            priority=data.get('priority', 1),
            name=data.get('name', ''),
            description=data.get('description', ''),
            conclusion_text=data.get('conclusion_text', '')
        )
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'conditions': self.conditions,
            'conclusion': self.conclusion,
            'conclusion_text': self.conclusion_text,
            'confidence': self.confidence,
            'priority': self.priority,
            'description': self.description
        }
    
    def match(self, symptoms: Dict[str, Any]) -> bool:
        """检查症状是否匹配所有条件"""
        for condition in self.conditions:
            if not self._evaluate_condition(condition, symptoms):
                return False
        return True
    
    def _evaluate_condition(self, condition: str, symptoms: Dict[str, Any]) -> bool:
        """评估单个条件 (支持数值比较和布尔值)"""
        numeric_pattern = r'(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+\.?\d*)'
        match = re.match(numeric_pattern, condition)
        
        if match:
            symptom_name = match.group(1)
            operator = match.group(2)
            threshold = float(match.group(3))
            
            if symptom_name not in symptoms:
                return False
            
            value = symptoms[symptom_name]
            if not isinstance(value, (int, float)):
                if isinstance(value, dict):
                    if not value.get('present', False):
                        return False
                    value = value.get('value', 0)
                else:
                    return False
            
            return self._compare(value, operator, threshold)
        
        if condition in symptoms:
            value = symptoms[condition]
            if isinstance(value, bool):
                return value
            if isinstance(value, dict):
                return value.get('present', False)
            return bool(value)
        
        return False
    
    def _compare(self, value: float, operator: str, threshold: float) -> bool:
        if operator == '>=':
            return value >= threshold
        elif operator == '<=':
            return value <= threshold
        elif operator == '>':
            return value > threshold
        elif operator == '<':
            return value < threshold
        elif operator == '==':
            return value == threshold
        elif operator == '!=':
            return value != threshold
        return False
    
    def get_matched_conditions(self, symptoms: Dict[str, Any]) -> List[str]:
        matched = []
        for condition in self.conditions:
            if self._evaluate_condition(condition, symptoms):
                matched.append(condition)
        return matched
    
    def get_unmatched_conditions(self, symptoms: Dict[str, Any]) -> List[str]:
        unmatched = []
        for condition in self.conditions:
            if not self._evaluate_condition(condition, symptoms):
                unmatched.append(condition)
        return unmatched
    
    def __repr__(self):
        return f"Rule({self.id}: {self.conditions} -> {self.conclusion}, CF={self.confidence})"






