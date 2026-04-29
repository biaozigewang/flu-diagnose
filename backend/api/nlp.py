"""
自然语言处理 API 接口
"""
import logging
from flask import Blueprint, request, jsonify
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp.symptom_extractor import SymptomExtractor
from nlp.intent_recognizer import IntentRecognizer
from nlp.llm_enhancer import LLMEnhancer, get_llm_enhancer

logger = logging.getLogger(__name__)
bp = Blueprint('nlp', __name__)

symptom_extractor = SymptomExtractor()
intent_recognizer = IntentRecognizer()


@bp.route('/analyze', methods=['POST'])
def analyze_text():
    """分析用户输入的自然语言，提取症状和意图"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        use_llm = data.get('use_llm', False)
        
        if not text:
            return jsonify({
                'success': False,
                'error': '请提供要分析的文本'
            }), 400
        
        # 基础NLP分析
        extraction_result = symptom_extractor.extract(text)
        intent_result = intent_recognizer.recognize(text)
        
        result = {
            'intent': intent_result.get('intent', 'unknown'),
            'intent_confidence': intent_result.get('confidence', 0),
            'symptoms': extraction_result.get('symptoms', {}),
            'entities': extraction_result.get('entities', []),
            'original_text': text,
            'llm_enhanced': False
        }
        
        if use_llm:
            try:
                llm = get_llm_enhancer()
                llm_result = llm.extract_symptoms_with_llm(text)

                if llm_result.get('success'):
                    result['symptoms'] = llm_result.get('symptoms', result['symptoms'])
                    result['intent'] = llm_result.get('intent', result['intent'])
                    result['severity'] = llm_result.get('severity', 'unknown')
                    result['additional_info'] = llm_result.get('additional_info', '')
                    result['llm_enhanced'] = True
                    result['llm_raw'] = llm_result.get('raw_response', '')
            except Exception as llm_error:
                logger.warning("LLM增强失败: %s", llm_error)
                result['llm_error'] = str(llm_error)
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/parse/symptoms', methods=['POST'])
def parse_symptoms():
    """解析症状描述，返回结构化症状数据"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        symptoms = symptom_extractor.extract(text).get('symptoms', {})
        
        return jsonify({
            'success': True,
            'symptoms': symptoms
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

