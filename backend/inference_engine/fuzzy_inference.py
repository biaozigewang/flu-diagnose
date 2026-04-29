"""
模糊推理引擎 - 基于置信度的加权推理
"""
from typing import List, Dict, Any, Tuple
from .rule import Rule


class FuzzyInferenceEngine:
    """模糊推理引擎 - 基于加权平均的置信度融合"""
    
    def __init__(self, rules: List[Rule] = None):
        self.rules = rules or []
    
    def set_rules(self, rules: List[Rule]):
        self.rules = rules
    
    def add_rule(self, rule: Rule):
        self.rules.append(rule)
    
    def infer(self, symptoms: Dict[str, Any]) -> Dict[str, Any]:
        """执行模糊推理，公式: CF = Σ(CF_i × W_i) / Σ(W_i)"""
        triggered_rules = self._get_triggered_rules(symptoms)
        
        if not triggered_rules:
            return {
                'diagnosis': 'unknown',
                'diagnosis_text': '无法判断，建议就医检查',
                'confidence': 0.0,
                'risk_level': 'unknown',
                'triggered_rules': [],
                'reasoning_process': []
            }
        
        conclusions = self._calculate_conclusions(triggered_rules)
        best_conclusion = max(conclusions.items(), key=lambda x: x[1]['confidence'])
        risk_level = self._determine_risk_level(best_conclusion[1]['confidence'])
        
        return {
            'diagnosis': best_conclusion[0],
            'diagnosis_text': best_conclusion[1]['conclusion_text'],
            'confidence': round(best_conclusion[1]['confidence'], 4),
            'risk_level': risk_level,
            'triggered_rules': [rule.to_dict() for rule in triggered_rules],
            'all_conclusions': conclusions,
            'reasoning_process': self._generate_reasoning_process(triggered_rules, symptoms)
        }
    
    def _get_triggered_rules(self, symptoms: Dict[str, Any]) -> List[Rule]:
        triggered = [rule for rule in self.rules if rule.match(symptoms)]
        triggered.sort(key=lambda r: r.priority, reverse=True)
        return triggered
    
    def _calculate_conclusions(self, triggered_rules: List[Rule]) -> Dict[str, Dict]:
        conclusions = {}
        
        for rule in triggered_rules:
            conclusion = rule.conclusion
            if conclusion not in conclusions:
                conclusions[conclusion] = {
                    'confidence': 0.0,
                    'total_weight': 0.0,
                    'weighted_sum': 0.0,
                    'conclusion_text': rule.conclusion_text,
                    'supporting_rules': []
                }

            weight = rule.priority
            conclusions[conclusion]['weighted_sum'] += rule.confidence * weight
            conclusions[conclusion]['total_weight'] += weight
            conclusions[conclusion]['supporting_rules'].append(rule.id)
        
        for conclusion in conclusions:
            if conclusions[conclusion]['total_weight'] > 0:
                conclusions[conclusion]['confidence'] = (
                    conclusions[conclusion]['weighted_sum'] / 
                    conclusions[conclusion]['total_weight']
                )
        
        return conclusions
    
    def _determine_risk_level(self, confidence: float) -> str:
        if confidence >= 0.85:
            return 'high'
        elif confidence >= 0.6:
            return 'moderate'
        elif confidence >= 0.3:
            return 'low'
        else:
            return 'very_low'
    
    def _generate_reasoning_process(self, triggered_rules: List[Rule], 
                                     symptoms: Dict[str, Any]) -> List[Dict]:
        process = []
        
        for i, rule in enumerate(triggered_rules, 1):
            step = {
                'step': i,
                'rule_id': rule.id,
                'rule_name': rule.name,
                'matched_conditions': rule.get_matched_conditions(symptoms),
                'conclusion': rule.conclusion_text,
                'confidence': rule.confidence,
                'explanation': f"规则 {rule.id} ({rule.name}) 被触发: "
                              f"满足条件 {rule.conditions}，"
                              f"得出结论「{rule.conclusion_text}」，"
                              f"置信度 {rule.confidence}"
            }
            process.append(step)
        
        return process
    
    def get_recommendations(self, diagnosis: str, confidence: float, symptoms: Dict[str, Any] = None) -> List[str]:
        symptoms = symptoms or {}
        fever = symptoms.get('fever', 0)
        has_breathing = symptoms.get('breathing_difficulty', False)
        has_contact = symptoms.get('contact_history', False)

        if confidence >= 0.85:
            recs = [
                "⚠️ 高度疑似甲流，建议48小时内前往医院发热门诊就诊",
                "就诊时请告知医生接触史，配合甲流抗原或核酸检测",
                "确诊后可在医生指导下服用奥司他韦（达菲），发病48小时内服用效果最佳",
                "居家期间请佩戴口罩，与家人保持距离，避免传染",
                "多饮温水，保证充足休息，避免剧烈运动",
            ]
            if isinstance(fever, (int, float)) and fever >= 39:
                recs.append("体温≥39°C，可服用对乙酰氨基酚或布洛芬退热，注意用药间隔")
            if has_breathing:
                recs.append("🚨 出现呼吸困难，请立即前往急诊，勿延误")
            if has_contact:
                recs.append("有明确接触史，感染风险更高，建议优先就医排查")
        elif confidence >= 0.6:
            recs = [
                "症状符合流感特征，建议尽快就医进行流感检测",
                "就医前居家休息，减少外出，避免前往人员密集场所",
                "多饮温水，保证充足睡眠，清淡饮食",
                "可适当服用退烧药（对乙酰氨基酚）缓解发热和疼痛",
                "若48小时内症状明显加重，请立即就医",
            ]
            if has_contact:
                recs.append("有接触史，建议主动告知医生，配合检测")
        elif confidence >= 0.3:
            recs = [
                "目前症状不典型，暂不能排除流感，建议持续观察",
                "注意休息，保持室内通风，勤洗手",
                "若出现高热（≥38.5°C）、肌肉酸痛加重，请及时就医",
                "保持良好个人卫生，流感季节尽量避免人群聚集",
            ]
        else:
            recs = [
                "当前症状与甲流相关性较低，注意休息即可",
                "保持良好作息和饮食，增强免疫力",
                "如症状持续超过3天或出现新症状，建议就医排查",
            ]

        return recs

