"""
否定词处理
"""
import re
from typing import List, Tuple


class NegationHandler:
    
    def __init__(self):
        self.negation_words = [
            '不', '没', '没有', '无', '否', '未', '别', '非',
            '不是', '不会', '不能', '不要', '没出现', '未出现',
            '不存在', '无法', '不太', '不怎么'
        ]
        self.negation_scope = 10
    
    def is_negated(self, text: str, target: str) -> bool:
        """检查目标词是否被否定"""
        if target not in text:
            return False
        
        target_pos = text.find(target)
        prefix = text[max(0, target_pos - self.negation_scope):target_pos]
        
        for neg_word in self.negation_words:
            if neg_word in prefix:
                between = prefix[prefix.find(neg_word) + len(neg_word):]
                if not self._has_transition(between):
                    return True
        
        return False
    
    def _has_transition(self, text: str) -> bool:
        transition_words = ['但', '但是', '不过', '然而', '却', '可是']
        for word in transition_words:
            if word in text:
                return True
        return False
    
    def extract_negated_symptoms(self, text: str, symptom_terms: List[str]) -> Tuple[List[str], List[str]]:
        """分离否定和非否定的症状"""
        present_symptoms = []
        negated_symptoms = []
        
        for symptom in symptom_terms:
            if symptom in text:
                if self.is_negated(text, symptom):
                    negated_symptoms.append(symptom)
                else:
                    present_symptoms.append(symptom)
        
        return present_symptoms, negated_symptoms
    
    def normalize_negation(self, text: str) -> str:
        """标准化否定表达"""
        replacements = [
            (r'没出现(\w+)', r'无\1'),
            (r'不存在(\w+)', r'无\1'),
            (r'没有(\w+)', r'无\1'),
        ]
        
        result = text
        for pattern, replacement in replacements:
            result = re.sub(pattern, replacement, result)
        
        return result






