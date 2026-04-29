"""
意图识别
"""
import re
from typing import Dict, List, Tuple
from .preprocessor import TextPreprocessor


class IntentRecognizer:
    
    INTENT_DIAGNOSE = 'diagnose'
    INTENT_QUERY = 'query'
    INTENT_GREETING = 'greeting'
    INTENT_GOODBYE = 'goodbye'
    INTENT_CONFIRM = 'confirm'
    INTENT_DENY = 'deny'
    INTENT_UNKNOWN = 'unknown'
    
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.intent_keywords = {
            self.INTENT_DIAGNOSE: [
                '诊断', '检查', '判断', '是不是', '得了', '患了',
                '发烧', '咳嗽', '头痛', '症状', '不舒服', '难受',
                '甲流', '流感', '感冒', '生病'
            ],
            self.INTENT_QUERY: [
                '什么是', '怎么', '如何', '为什么', '请问', '想知道',
                '介绍', '说说', '告诉我', '解释'
            ],
            self.INTENT_GREETING: [
                '你好', '您好', '嗨', 'hi', 'hello', '早上好', '下午好', '晚上好'
            ],
            self.INTENT_GOODBYE: [
                '再见', '拜拜', 'bye', '谢谢', '感谢', '结束'
            ],
            self.INTENT_CONFIRM: [
                '是的', '对', '没错', '确实', '有', '嗯', '是', '好的', '对的', '正确'
            ],
            self.INTENT_DENY: [
                '不是', '不对', '没有', '否', '不', '错了', '不正确'
            ]
        }
        
        self.intent_patterns = {
            self.INTENT_DIAGNOSE: [
                r'我.*?(发烧|咳嗽|头痛|不舒服|难受)',
                r'.*?(甲流|流感|感冒).*?吗',
                r'帮.*?诊断',
                r'.*?什么病'
            ],
            self.INTENT_QUERY: [
                r'(什么是|怎么|如何|为什么).*?',
                r'.*?是什么.*?',
                r'请问.*?'
            ]
        }
    
    def recognize(self, text: str) -> Dict:
        """识别用户意图"""
        preprocessed = self.preprocessor.preprocess(text)
        tokens = preprocessed['tokens']
        cleaned_text = preprocessed['cleaned']
        
        scores = {}
        for intent, keywords in self.intent_keywords.items():
            score = self._calculate_keyword_score(cleaned_text, tokens, keywords)
            scores[intent] = score
        
        for intent, patterns in self.intent_patterns.items():
            pattern_score = self._calculate_pattern_score(cleaned_text, patterns)
            scores[intent] = max(scores.get(intent, 0), pattern_score)
        
        if not scores or max(scores.values()) == 0:
            best_intent = self.INTENT_UNKNOWN
            confidence = 0.0
        else:
            best_intent = max(scores.items(), key=lambda x: x[1])[0]
            confidence = min(scores[best_intent], 1.0)
        
        if self._contains_symptoms(text) and best_intent == self.INTENT_UNKNOWN:
            best_intent = self.INTENT_DIAGNOSE
            confidence = 0.7
        
        return {
            'intent': best_intent,
            'confidence': round(confidence, 2),
            'all_scores': {k: round(v, 2) for k, v in scores.items()},
            'is_diagnosis_related': best_intent == self.INTENT_DIAGNOSE
        }
    
    def _calculate_keyword_score(self, text: str, tokens: List[str], 
                                  keywords: List[str]) -> float:
        score = 0.0
        for keyword in keywords:
            if keyword in text or keyword in tokens:
                score += 0.3
        return min(score, 1.0)
    
    def _calculate_pattern_score(self, text: str, patterns: List[str]) -> float:
        for pattern in patterns:
            if re.search(pattern, text):
                return 0.8
        return 0.0
    
    def _contains_symptoms(self, text: str) -> bool:
        symptom_words = [
            '发烧', '发热', '咳嗽', '头痛', '头疼', '乏力', '疲劳',
            '肌肉痛', '酸痛', '喉咙痛', '嗓子疼', '鼻塞', '流鼻涕',
            '腹泻', '拉肚子', '呼吸困难', '胸闷', '发冷', '寒战'
        ]
        
        for word in symptom_words:
            if word in text:
                return True
        return False
    
    def get_response_template(self, intent: str) -> str:
        templates = {
            self.INTENT_DIAGNOSE: "好的，我来帮您分析症状。{analysis}",
            self.INTENT_QUERY: "让我为您解答：{answer}",
            self.INTENT_GREETING: "您好！我是甲流诊断助手，请描述您的症状，我将帮您进行初步分析。",
            self.INTENT_GOODBYE: "再见！祝您身体健康。如有需要，随时回来咨询。",
            self.INTENT_CONFIRM: "好的，已记录。",
            self.INTENT_DENY: "明白，已更新信息。",
            self.INTENT_UNKNOWN: "抱歉，我不太理解您的意思。您可以描述您的症状，如发烧、咳嗽等。"
        }
        return templates.get(intent, templates[self.INTENT_UNKNOWN])






