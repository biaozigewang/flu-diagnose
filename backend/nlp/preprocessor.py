"""
文本预处理 - jieba 分词
"""
import re
import jieba
from typing import List


class TextPreprocessor:
    
    def __init__(self):
        medical_words = [
            '发热', '发烧', '高烧', '低烧', '咳嗽', '干咳',
            '肌肉酸痛', '头痛', '头疼', '乏力', '疲劳',
            '喉咙痛', '嗓子疼', '鼻塞', '流鼻涕', '腹泻',
            '呼吸困难', '气短', '胸闷', '寒战', '打喷嚏',
            '食欲不振', '甲流', '流感', '流行性感冒'
        ]
        for word in medical_words:
            jieba.add_word(word)
    
    def preprocess(self, text: str) -> dict:
        cleaned = self._clean_text(text)
        tokens = self._tokenize(cleaned)
        numbers = self._extract_numbers(text)
        
        return {
            'original': text,
            'cleaned': cleaned,
            'tokens': tokens,
            'numbers': numbers
        }
    
    def _clean_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[，。！？；：]', ' ', text)
        text = re.sub(r'[,\.!?;:]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _tokenize(self, text: str) -> List[str]:
        tokens = jieba.lcut(text)
        tokens = [t for t in tokens if t.strip() and (len(t) > 1 or t in '热痛咳')]
        return tokens
    
    def _extract_numbers(self, text: str) -> List[dict]:
        numbers = []
        temp_patterns = [
            r'(\d+\.?\d*)\s*[度°℃]',
            r'(\d+)度(\d)',  # 38度5 格式
            r'体温\s*[:：]?\s*(\d+\.?\d*)'
        ]
        
        for pattern in temp_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    if len(match) == 2 and match[1]:
                        value = float(f"{match[0]}.{match[1]}")
                    else:
                        value = float(match[0])
                else:
                    value = float(match)
                
                if 35.0 <= value <= 42.0:
                    numbers.append({
                        'type': 'temperature',
                        'value': value,
                        'unit': '°C'
                    })
        
        return numbers

