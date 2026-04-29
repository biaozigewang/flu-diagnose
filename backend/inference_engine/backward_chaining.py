"""
后向推理引擎 - 疾病 → 症状
"""
import re
from typing import Dict, List, Any
from .rule import Rule


class BackwardChainingEngine:
    
    def __init__(self):
        self.rules = []
    
    def set_rules(self, rules: List[Rule]):
        self.rules = rules
    
    def query_disease_info(self, disease: str) -> Dict[str, Any]:
        """查询疾病的典型症状"""
        disease_aliases = {
            '甲流': 'h1n1',
            '甲型流感': 'h1n1',
            'h1n1': 'h1n1',
            '流感': 'flu',
            '普通流感': 'flu',
            'flu': 'flu'
        }
        
        target = disease.lower()
        normalized_disease = disease_aliases.get(target, target)
        
        related_rules = []
        for rule in self.rules:
            conclusion_id = rule.conclusion.lower()
            conclusion_text = rule.conclusion_text.lower()
            
            if (normalized_disease in conclusion_id or 
                normalized_disease in conclusion_text or
                ('h1n1' in normalized_disease and '甲流' in conclusion_text) or
                ('flu' in normalized_disease and '流感' in conclusion_text)):
                related_rules.append(rule)
        
        total_found = len(related_rules)
        
        if not related_rules:
            return {
                'success': False,
                'disease': disease,
                'message': f'未找到与"{disease}"相关的诊断规则',
                'rule_count': 0
            }
        
        symptom_importance = {}
        for rule in related_rules:
            for condition in rule.conditions:
                match = re.match(r'([a-zA-Z_]+|[一-龥]+)', condition)
                if match:
                    symptom_key = match.group(1)
                    weight = rule.confidence * rule.priority
                    symptom_importance[symptom_key] = symptom_importance.get(symptom_key, 0) + weight

        
        sorted_symptoms = sorted(symptom_importance.items(), key=lambda x: x[1], reverse=True)
        
        symptom_names = {
            'fever': '发热', 'cough': '咳嗽', 'muscle_pain': '肌肉酸痛',
            'headache': '头痛', 'fatigue': '乏力', 'sore_throat': '喉咙痛',
            'nasal_congestion': '鼻塞', 'diarrhea': '腹泻',
            'breathing_difficulty': '呼吸困难', 'chills': '寒战',
            'sudden_onset': '急性起病', 'age_child': '儿童患者',
            'high_fever': '高热', 'no_vaccination': '未接种疫苗'
        }
        
        symptom_list = []
        for s_key, score in sorted_symptoms[:8]:
            name = symptom_names.get(s_key, s_key)
            if score >= 1.5: status = "典型症状"
            elif score >= 0.8: status = "常见症状"
            else: status = "可能症状"
            symptom_list.append(f"{name}（{status}）")
        
        return {
            'success': True,
            'disease': disease,
            'symptoms': symptom_list,
            'rule_count': total_found,
            'high_confidence_rules': len([r for r in related_rules if r.confidence >= 0.8]),
            'description': self._get_disease_description(normalized_disease)
        }
    
    def _get_disease_description(self, disease: str) -> str:
        descriptions = {
            'h1n1': '甲型H1N1流感是由甲型H1N1流感病毒引起的急性呼吸道传染病，具有传染性强、传播速度快的特点。',
            'flu': '季节性流感是由流感病毒引起的急性呼吸道感染，常见于冬春季节。',
        }
        return descriptions.get(disease, '未找到该疾病的详细描述。')
    
    def answer_symptom_query(self, query_text: str) -> Dict[str, Any]:
        """回答症状查询"""
        diseases_to_check = []
        if '甲流' in query_text or 'h1n1' in query_text.lower():
            diseases_to_check.append('甲流')
        if '流感' in query_text:
            diseases_to_check.append('流感')
        
        if not diseases_to_check:
            diseases_to_check.append('甲流')
        
        results = []
        for disease in diseases_to_check:
            info = self.query_disease_info(disease)
            if info['success']:
                results.append(info)
        
        return {
            'success': True,
            'query': query_text,
            'results': results
        }

