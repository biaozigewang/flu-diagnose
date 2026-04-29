"""
A* 启发式搜索 - 诊断路径优化
"""
import heapq
from typing import Dict, List, Any, Set, Tuple, Optional
from dataclasses import dataclass, field


@dataclass(order=True)
class DiagnosisState:
    """诊断状态节点"""
    f_score: float  # f(n) = g(n) + h(n)
    state_id: int = field(compare=False)
    known_symptoms: Dict[str, Any] = field(compare=False)
    path: List[str] = field(compare=False)  # 已询问的问题序列
    g_score: float = field(compare=False)   # 实际代价
    confidence: float = field(compare=False)  # 当前置信度


class AStarDiagnosis:
    """A* 诊断路径搜索 - 用最少问题达到诊断阈值"""
    
    def __init__(self, rules: List = None, target_confidence: float = 0.85):
        self.rules = rules or []
        self.target_confidence = target_confidence
        self.state_counter = 0
        
        self.base_weights = {
            'fever': 0.30, 'muscle_pain': 0.20, 'cough': 0.15,
            'fatigue': 0.15, 'headache': 0.10, 'sore_throat': 0.08,
            'nasal_congestion': 0.05, 'diarrhea': 0.05,
            'contact_history': 0.20, 'sudden_onset': 0.15,
            'chills': 0.12, 'breathing_difficulty': 0.10, 'no_vaccination': 0.08
        }
        
        # 条件概率表 P(症状B|症状A)
        self.conditional_probs = {
            'fever': {
                'muscle_pain': 0.85,      # 发热+肌肉痛 在甲流中高度相关
                'headache': 0.80,
                'fatigue': 0.90,
                'chills': 0.75,
                'cough': 0.70,
                'sore_throat': 0.50,
                'sudden_onset': 0.85
            },
            # 如果有肌肉酸痛
            'muscle_pain': {
                'fever': 0.90,
                'fatigue': 0.85,
                'headache': 0.70,
                'chills': 0.65
            },
            # 如果有接触史
            'contact_history': {
                'fever': 0.75,
                'cough': 0.70,
                'muscle_pain': 0.65
            },
            # 如果急性起病
            'sudden_onset': {
                'fever': 0.85,
                'muscle_pain': 0.80,
                'fatigue': 0.75
            },
            # 没有发热时
            'no_fever': {
                'muscle_pain': 0.30,  # 没发热时，肌肉痛概率降低
                'headache': 0.40,
                'sore_throat': 0.70,  # 但喉咙痛可能更常见（普通感冒）
                'nasal_congestion': 0.80  # 鼻塞更常见
            }
        }
        
        # 症状对应的问题
        self.symptom_questions = {
            'fever': '您的体温是多少度？',
            'cough': '您是否有咳嗽症状？',
            'muscle_pain': '您是否有肌肉酸痛的感觉？',
            'headache': '您是否有头痛？',
            'fatigue': '您是否感到乏力或疲劳？',
            'sore_throat': '您是否有喉咙痛？',
            'nasal_congestion': '您是否有鼻塞或流鼻涕？',
            'diarrhea': '您是否有腹泻？',
            'breathing_difficulty': '您是否有呼吸困难或气短？',
            'contact_history': '您近期是否接触过流感患者？',
            'no_vaccination': '您今年是否接种了流感疫苗？',
            'sudden_onset': '您的症状是否突然出现的？',
            'chills': '您是否感到发冷或寒战？'
        }
        
        self.symptom_names = {
            'fever': '发热',
            'cough': '咳嗽',
            'muscle_pain': '肌肉酸痛',
            'headache': '头痛',
            'fatigue': '乏力',
            'sore_throat': '喉咙痛',
            'nasal_congestion': '鼻塞',
            'diarrhea': '腹泻',
            'breathing_difficulty': '呼吸困难',
            'contact_history': '接触史',
            'no_vaccination': '未接种疫苗',
            'sudden_onset': '急性起病',
            'chills': '寒战'
        }
    
    def search(self, initial_symptoms: Dict[str, Any] = None) -> Dict[str, Any]:
        """执行 A* 搜索，找到最优诊断路径"""
        if initial_symptoms is None:
            initial_symptoms = {}
        
        self.state_counter = 0
        open_set = []
        closed_set = set()

        initial_confidence = self._calculate_confidence(initial_symptoms)
        initial_h = self._heuristic(initial_symptoms, initial_confidence)
        initial_state = DiagnosisState(
            f_score=initial_h,
            state_id=self._get_state_id(),
            known_symptoms=initial_symptoms.copy(),
            path=[],
            g_score=0,
            confidence=initial_confidence
        )
        
        heapq.heappush(open_set, initial_state)

        search_trace = []
        iterations = 0
        max_iterations = 100

        while open_set and iterations < max_iterations:
            iterations += 1

            current = heapq.heappop(open_set)

            search_trace.append({
                'iteration': iterations,
                'symptoms': current.known_symptoms.copy(),
                'confidence': current.confidence,
                'f_score': current.f_score,
                'path_length': len(current.path)
            })
            
            # 检查是否达到目标
            if current.confidence >= self.target_confidence:
                return self._build_result(current, search_trace, 'success')
            
            # 生成状态标识（用于去重）
            state_key = self._state_to_key(current.known_symptoms)
            if state_key in closed_set:
                continue
            closed_set.add(state_key)
            
            # 扩展子节点（询问新症状）
            for symptom in self._get_unasked_symptoms(current.known_symptoms):
                # 模拟询问该症状（假设回答为"是"）
                for answer in [True, False]:
                    new_symptoms = current.known_symptoms.copy()
                    new_symptoms[symptom] = answer
                    
                    # 如果是体温，设置合理值
                    if symptom == 'fever' and answer:
                        new_symptoms[symptom] = 39.0  # 假设高热
                    
                    new_confidence = self._calculate_confidence(new_symptoms)
                    new_g = current.g_score + 1
                    new_h = self._heuristic(new_symptoms, new_confidence)
                    new_f = new_g + new_h
                    
                    new_state = DiagnosisState(
                        f_score=new_f,
                        state_id=self._get_state_id(),
                        known_symptoms=new_symptoms,
                        path=current.path + [symptom],
                        g_score=new_g,
                        confidence=new_confidence
                    )
                    
                    heapq.heappush(open_set, new_state)

        if open_set:
            best_state = min(open_set, key=lambda s: -s.confidence)
            return self._build_result(best_state, search_trace, 'partial')
        
        return {
            'success': False,
            'message': '无法完成诊断',
            'search_trace': search_trace
        }
    
    def get_next_question(self, known_symptoms: Dict[str, Any]) -> Dict[str, Any]:
        """
        获取下一个应该询问的问题（基于信息增益）
        """
        current_confidence = self._calculate_confidence(known_symptoms)
        
        if current_confidence >= self.target_confidence:
            return {
                'complete': True,
                'confidence': current_confidence,
                'message': '已收集足够信息进行诊断'
            }
        
        unasked = self._get_unasked_symptoms(known_symptoms)
        
        if not unasked:
            return {
                'complete': True,
                'confidence': current_confidence,
                'message': '已询问所有相关症状'
            }
        
        symptom_scores = []
        for symptom in unasked:
            score = self._calculate_information_gain(known_symptoms, symptom)
            cond_prob = self._get_conditional_probability(symptom, known_symptoms)
            symptom_scores.append({
                'symptom': symptom,
                'name': self.symptom_names.get(symptom, symptom),
                'score': score,
                'probability': cond_prob,
                'question': self.symptom_questions.get(symptom, '')
            })
        
        symptom_scores.sort(key=lambda x: x['score'], reverse=True)
        best = symptom_scores[0]
        reason = self._generate_selection_reason(best, known_symptoms)
        
        return {
            'complete': False,
            'next_symptom': best['symptom'],
            'question': best['question'],
            'current_confidence': current_confidence,
            'expected_gain': best['score'],
            'probability': best['probability'],
            'reason': reason,
            'alternatives': symptom_scores[1:4]
        }
    
    def _generate_selection_reason(self, best: Dict, known_symptoms: Dict[str, Any]) -> str:
        symptom = best['symptom']
        prob = best['probability']
        reasons = []
        
        for known_symptom, value in known_symptoms.items():
            if value and known_symptom in self.conditional_probs:
                if symptom in self.conditional_probs[known_symptom]:
                    known_name = self.symptom_names.get(known_symptom, known_symptom)
                    symptom_name = self.symptom_names.get(symptom, symptom)
                    cond_prob = self.conditional_probs[known_symptom][symptom]
                    if cond_prob > 0.7:
                        reasons.append(f"您有{known_name}，{symptom_name}的可能性高达 {cond_prob*100:.0f}%")
        
        if not reasons:
            if prob > 0.7:
                reasons.append(f"该症状在甲流患者中很常见（{prob*100:.0f}%）")
            elif prob < 0.3:
                reasons.append(f"该症状可帮助排除甲流诊断")
            else:
                reasons.append(f"该问题能最大化诊断信息增益")
        
        return reasons[0] if reasons else "基于当前症状组合，此问题最有诊断价值"
    
    def _get_state_id(self) -> int:
        self.state_counter += 1
        return self.state_counter
    
    def _state_to_key(self, symptoms: Dict[str, Any]) -> str:
        items = sorted(symptoms.items())
        return str(items)
    
    def _get_unasked_symptoms(self, known_symptoms: Dict[str, Any]) -> List[str]:
        """获取未询问的症状列表"""
        all_symptoms = set(self.symptom_questions.keys())
        asked = set(known_symptoms.keys())
        unasked = list(all_symptoms - asked)
        
        scored = [(s, self._get_dynamic_priority(s, known_symptoms)) for s in unasked]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [s for s, _ in scored]
    
    def _get_dynamic_priority(self, symptom: str, known_symptoms: Dict[str, Any]) -> float:
        """
        根据已知症状动态计算症状的优先级
        
        这是 A* 算法的核心：根据当前状态动态调整启发值
        """
        base_weight = self.base_weights.get(symptom, 0.05)
        
        # 根据已知症状调整优先级
        priority_modifier = 1.0
        
        # 检查已知症状对当前症状的影响
        for known_symptom, value in known_symptoms.items():
            if value and known_symptom in self.conditional_probs:
                # 如果该已知症状存在，查看它对目标症状的条件概率
                cond_prob = self.conditional_probs[known_symptom].get(symptom)
                if cond_prob:
                    # 高条件概率 = 更值得询问
                    priority_modifier *= (1 + cond_prob)
            elif not value and known_symptom == 'fever':
                # 特殊处理：没有发热时，调整其他症状的优先级
                if 'no_fever' in self.conditional_probs:
                    cond_prob = self.conditional_probs['no_fever'].get(symptom)
                    if cond_prob:
                        # 没发热时，某些症状变得更重要（如鼻塞 - 可能是普通感冒）
                        priority_modifier *= (1 + cond_prob * 0.5)
        
        return base_weight * priority_modifier
    
    def _calculate_confidence(self, symptoms: Dict[str, Any]) -> float:
        """计算当前症状组合的甲流置信度"""
        if not symptoms:
            return 0.0

        confidence = 0.0
        positive_count = 0

        if 'fever' in symptoms:
            fever = symptoms['fever']
            if isinstance(fever, (int, float)) and fever >= 39:
                confidence += 0.30
                positive_count += 1
            elif isinstance(fever, (int, float)) and fever >= 38:
                confidence += 0.20
                positive_count += 1
            elif fever is True:
                confidence += 0.15
                positive_count += 1

        for symptom, weight in self.base_weights.items():
            if symptom == 'fever':
                continue
            if symptoms.get(symptom):
                confidence += weight
                positive_count += 1

        if positive_count >= 3:
            has_fever = symptoms.get('fever') and (
                symptoms['fever'] is True or
                (isinstance(symptoms['fever'], (int, float)) and symptoms['fever'] >= 38)
            )
            has_muscle_pain = symptoms.get('muscle_pain')
            has_sudden_onset = symptoms.get('sudden_onset')
            has_contact = symptoms.get('contact_history')

            # 甲流典型三联征：高热 + 肌肉痛 + 急性起病
            if has_fever and has_muscle_pain and has_sudden_onset:
                confidence += 0.15

            # 有接触史 + 发热
            if has_fever and has_contact:
                confidence += 0.10
        
        return min(confidence, 1.0)
    
    def _heuristic(self, symptoms: Dict[str, Any], current_confidence: float) -> float:
        """启发函数 h(n)，估计从当前状态到目标置信度的最少代价"""
        if current_confidence >= self.target_confidence:
            return 0

        confidence_gap = self.target_confidence - current_confidence

        positive_symptoms = sum(1 for v in symptoms.values() if v)
        if positive_symptoms > 0:
            # 边际效益递减
            avg_gain = max(0.10, 0.20 - positive_symptoms * 0.02)
        else:
            avg_gain = 0.20
        
        return confidence_gap / avg_gain
    
    def _get_conditional_probability(self, symptom: str, known_symptoms: Dict[str, Any]) -> float:
        """计算 P(symptom=True | known_symptoms)"""
        base_probs = {
            'fever': 0.90,
            'muscle_pain': 0.70,
            'cough': 0.80,
            'fatigue': 0.75,
            'headache': 0.60,
            'sore_throat': 0.50,
            'nasal_congestion': 0.40,
            'diarrhea': 0.15,
            'contact_history': 0.50,
            'sudden_onset': 0.85,
            'chills': 0.60,
            'breathing_difficulty': 0.20,
            'no_vaccination': 0.60
        }
        
        prob = base_probs.get(symptom, 0.5)

        for known_symptom, value in known_symptoms.items():
            if known_symptom in self.conditional_probs:
                cond_prob = self.conditional_probs[known_symptom].get(symptom)
                if cond_prob:
                    if value:
                        prob = (prob + cond_prob) / 2
                    else:
                        prob = prob * (1 - cond_prob * 0.3)
        
        return max(0.1, min(0.9, prob))
    
    def _calculate_information_gain(self, known_symptoms: Dict[str, Any], 
                                     new_symptom: str) -> float:
        """
        计算询问某症状的信息增益（基于条件概率）
        
        信息增益 = H(当前) - H(询问后)
        使用条件概率而非固定 50/50
        """
        current_conf = self._calculate_confidence(known_symptoms)
        
        # 获取该症状为阳性的条件概率
        p_yes = self._get_conditional_probability(new_symptom, known_symptoms)
        p_no = 1 - p_yes
        
        # 模拟回答"是"
        symptoms_yes = known_symptoms.copy()
        symptoms_yes[new_symptom] = True if new_symptom != 'fever' else 39.0
        conf_yes = self._calculate_confidence(symptoms_yes)
        
        # 模拟回答"否"
        symptoms_no = known_symptoms.copy()
        symptoms_no[new_symptom] = False
        conf_no = self._calculate_confidence(symptoms_no)
        
        # 期望信息增益 = P(是) * |置信度变化(是)| + P(否) * |置信度变化(否)|
        expected_gain = p_yes * abs(conf_yes - current_conf) + p_no * abs(conf_no - current_conf)
        
        # 加上不确定性奖励：p 接近 0.5 时不确定性最高，询问更有价值
        uncertainty_bonus = 4 * p_yes * p_no * 0.1  # 最大值在 p=0.5 时为 0.1
        
        return expected_gain + uncertainty_bonus
    
    def _build_result(self, state: DiagnosisState, trace: List[Dict], 
                      status: str) -> Dict[str, Any]:
        """构建搜索结果"""
        return {
            'success': status == 'success',
            'status': status,
            'final_confidence': state.confidence,
            'path': state.path,
            'path_length': len(state.path),
            'questions_asked': [
                self.symptom_questions.get(s, s) for s in state.path
            ],
            'final_symptoms': state.known_symptoms,
            'search_trace': trace,
            'iterations': len(trace)
        }

