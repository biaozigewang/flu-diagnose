"""
LLM 语义增强模块 - DeepSeek API
"""
import logging
import os
import sys
import json
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from api_config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, DEEPSEEK_MODEL
except ImportError:
    DEEPSEEK_API_KEY = None
    DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL = "deepseek-chat"


class LLMEnhancer:
    """DeepSeek LLM 增强器"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or DEEPSEEK_API_KEY or os.environ.get('DEEPSEEK_API_KEY')
        self.api_base = DEEPSEEK_API_BASE
        self.model = DEEPSEEK_MODEL
        
        if not self.api_key or self.api_key == "your_api_key_here":
            logger.warning("DeepSeek API Key 未配置，LLM 增强功能将不可用")
            logger.warning("请在 backend/api_config.py 中配置你的 API Key")
    
    def extract_symptoms_with_llm(self, text: str) -> Dict[str, Any]:
        """使用 LLM 提取症状信息"""
        if not self.api_key:
            return {"success": False, "error": "API Key 未配置"}
        
        prompt = self._build_extraction_prompt(text)
        
        try:
            response = self._call_api(prompt)
            result = self._parse_llm_response(response)
            return {
                "success": True,
                "symptoms": result.get("symptoms", {}),
                "intent": result.get("intent", "unknown"),
                "severity": result.get("severity", "unknown"),
                "additional_info": result.get("additional_info", ""),
                "raw_response": response
            }
        except Exception as e:
            logger.error("LLM 调用失败: %s", e)
            return {"success": False, "error": str(e)}
    
    def enhance_intent_recognition(self, text: str, basic_result: Dict) -> Dict[str, Any]:
        """增强意图识别"""
        if not self.api_key:
            return basic_result
        
        prompt = f"""你是一个医疗诊断助手。请分析以下用户输入的意图。

用户输入: "{text}"

基础识别结果: {json.dumps(basic_result, ensure_ascii=False)}

请判断用户的真实意图，并给出更准确的分析。
返回JSON格式:
{{
    "intent": "diagnose/query",
    "confidence": 0.0-1.0,
    "intent_description": "意图描述",
    "suggested_response": "建议的回复方式"
}}

只返回JSON，不要其他内容。"""

        try:
            response = self._call_api(prompt)
            enhanced = json.loads(response)

            return {
                **basic_result,
                "llm_enhanced": True,
                "llm_intent": enhanced.get("intent"),
                "llm_confidence": enhanced.get("confidence"),
                "intent_description": enhanced.get("intent_description"),
                "suggested_response": enhanced.get("suggested_response")
            }
        except Exception as e:
            logger.error("意图增强失败: %s", e)
            return {**basic_result, "llm_enhanced": False}
    
    def _build_extraction_prompt(self, text: str) -> str:
        """构建症状提取的提示词"""
        return f"""你是一个专业的医疗症状提取助手。请从用户描述中提取甲流相关的症状信息。

用户描述: "{text}"

请提取以下信息并以JSON格式返回:

1. symptoms (症状字典):
   - fever: {{"present": true/false, "value": 体温数值或null, "severity": "mild/moderate/severe/none"}}
   - cough: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - muscle_pain: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - headache: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - fatigue: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - sore_throat: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - nasal_congestion: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - diarrhea: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - breathing_difficulty: {{"present": true/false, "severity": "mild/moderate/severe/none"}}
   - chills: {{"present": true/false, "severity": "mild/moderate/severe/none"}}

2. intent: 用户意图 (diagnose/query)

3. severity: 整体症状严重程度 (mild/moderate/severe)

4. additional_info: 其他重要信息（如接触史、用药情况等）

注意:
- 识别否定表达，如"不发烧"、"没有咳嗽"应标记为 present: false
- 识别程度词，如"轻微"、"严重"、"有点"等
- 提取具体数值，如体温"38.5度"

只返回JSON格式，不要其他解释文字。

示例输出:
{{
    "symptoms": {{
        "fever": {{"present": true, "value": 38.5, "severity": "moderate"}},
        "cough": {{"present": true, "severity": "mild"}},
        "muscle_pain": {{"present": false, "severity": "none"}},
        "headache": {{"present": true, "severity": "moderate"}},
        "fatigue": {{"present": true, "severity": "moderate"}},
        "sore_throat": {{"present": false, "severity": "none"}},
        "nasal_congestion": {{"present": false, "severity": "none"}},
        "diarrhea": {{"present": false, "severity": "none"}},
        "breathing_difficulty": {{"present": false, "severity": "none"}},
        "chills": {{"present": false, "severity": "none"}}
    }},
    "intent": "diagnose",
    "severity": "moderate",
    "additional_info": "症状持续2天"
}}"""

    def _call_api(self, prompt: str, max_tokens: int = 1000) -> str:
        logger.debug("调用 DeepSeek LLM API")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的医疗诊断助手，擅长从自然语言中提取症状信息。请始终返回有效的JSON格式。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.1
        }
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        if response.status_code != 200:
            logger.error("LLM API 请求失败: HTTP %d", response.status_code)
            raise Exception(f"API 调用失败: {response.status_code} - {response.text}")

        result = response.json()
        logger.debug("LLM API 调用成功")
        return result["choices"][0]["message"]["content"]
    
    def _parse_llm_response(self, response: str) -> Dict:
        """解析 LLM JSON 响应，清理可能的 markdown 包裹"""
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            logger.warning("LLM 响应 JSON 解析失败: %s", response[:100])
            return {}
    
    def analyze_conversation_context(self, messages: list) -> Dict[str, Any]:
        """分析对话上下文，总结用户的整体症状情况"""
        if not self.api_key or not messages:
            return {}
        
        conversation = "\n".join([
            f"{'用户' if m.get('role') == 'user' else '助手'}: {m.get('content', '')}"
            for m in messages[-10:]  # 只取最近10条
        ])
        
        prompt = f"""请分析以下医疗咨询对话，总结用户的症状情况。

对话内容:
{conversation}

请返回JSON格式的症状总结:
{{
    "all_symptoms": {{"symptom_name": {{"present": bool, "value": any, "severity": str}}}},
    "symptom_timeline": "症状发展时间线描述",
    "risk_factors": ["风险因素列表"],
    "missing_info": ["还需要了解的信息"],
    "preliminary_assessment": "初步评估"
}}

只返回JSON。"""

        try:
            response = self._call_api(prompt)
            return self._parse_llm_response(response)
        except Exception as e:
            logger.error("对话分析失败: %s", e)
            return {}


_llm_enhancer = None

def get_llm_enhancer(api_key: str = None) -> LLMEnhancer:
    """获取 LLM 增强器单例"""
    global _llm_enhancer
    if _llm_enhancer is None or api_key:
        _llm_enhancer = LLMEnhancer(api_key)
    return _llm_enhancer

