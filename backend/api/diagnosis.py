"""
诊断相关 API 接口
"""
import logging
import base64
import requests as http_requests
from flask import Blueprint, request, jsonify
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

from api_config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, VISION_API_KEY, VISION_API_BASE, VISION_MODEL
from inference_engine.rule import Rule
from inference_engine.fuzzy_inference import FuzzyInferenceEngine
from inference_engine.bayesian_inference import BayesianInferenceEngine
from inference_engine.backward_chaining import BackwardChainingEngine
from knowledge_base.knowledge_manager import KnowledgeManager
from search.astar_diagnosis import AStarDiagnosis

bp = Blueprint('diagnosis', __name__)

knowledge_manager = KnowledgeManager()
fuzzy_engine = FuzzyInferenceEngine()
bayesian_engine = BayesianInferenceEngine()
backward_engine = BackwardChainingEngine()

rules = [Rule.from_dict(r) for r in knowledge_manager.get_rules()]
fuzzy_engine.set_rules(rules)
backward_engine.set_rules(rules)
bayesian_engine._load_config(knowledge_manager.get_bayesian_network())


@bp.route('/diagnose', methods=['POST'])
def diagnose():
    """执行诊断推理，综合模糊推理和贝叶斯推理给出诊断结果"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', {})
        
        if not symptoms:
            return jsonify({
                'success': False,
                'error': '请提供症状信息'
            }), 400
        
        processed_symptoms = preprocess_symptoms(symptoms)

        thinking_steps = []

        symptom_names = [k for k, v in processed_symptoms.items() if v]
        thinking_steps.append(f"📋 症状分析：检测到 {len(symptom_names)} 个有效症状")

        thinking_steps.append("🧠 模糊推理：使用产生式规则进行加权推理")
        fuzzy_result = fuzzy_engine.infer(processed_symptoms)
        triggered_count = len(fuzzy_result.get('triggered_rules', []))
        if triggered_count > 0:
            thinking_steps.append(f"🎯 规则匹配：触发 {triggered_count} 条诊断规则")

        thinking_steps.append("📊 贝叶斯推理：基于条件概率计算后验概率")
        bayesian_result = bayesian_engine.infer(processed_symptoms)

        confidence = fuzzy_result.get('confidence', 0)
        thinking_steps.append(f"📈 模糊推理置信度：{(confidence * 100):.1f}%")

        bayesian_prob = bayesian_result.get('probability', 0)
        thinking_steps.append(f"📉 贝叶斯后验概率：{(bayesian_prob * 100):.1f}%")

        risk_level = fuzzy_result.get('risk_level', 'unknown')
        risk_text = {'high': '高风险', 'medium': '中风险', 'moderate': '中风险', 'low': '低风险', 'very_low': '极低风险'}.get(risk_level, '未知')
        thinking_steps.append(f"✨ 综合判断：{risk_text}")
        result = {
            'diagnosis': fuzzy_result.get('diagnosis', 'unknown'),
            'diagnosis_text': fuzzy_result.get('diagnosis_text', '无法判断'),
            'confidence': confidence,
            'risk_level': risk_level,
            'triggered_rules': fuzzy_result.get('triggered_rules', []),
            'reasoning_process': fuzzy_result.get('reasoning_process', []),
            'bayesian_probability': bayesian_prob,
            'bayesian_details': bayesian_result.get('posteriors', {}),
            'recommendations': fuzzy_engine.get_recommendations(
                fuzzy_result.get('diagnosis', ''),
                confidence,
                processed_symptoms
            ),
            'thinking_steps': thinking_steps
        }
        
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


def preprocess_symptoms(symptoms):
    """预处理症状数据，统一格式"""
    processed = {}
    
    for key, value in symptoms.items():
        if isinstance(value, dict):
            if value.get('present'):
                if 'value' in value and value['value'] is not None:
                    processed[key] = value['value']
                else:
                    processed[key] = True
            else:
                processed[key] = False
        elif isinstance(value, bool):
            processed[key] = value
        elif isinstance(value, (int, float)):
            processed[key] = value
        else:
            processed[key] = bool(value)
    
    return processed


@bp.route('/diagnose/step', methods=['POST'])
def diagnose_step():
    """单步诊断，基于A*算法返回下一个最优问题"""
    try:
        data = request.get_json()
        current_symptoms = data.get('current_symptoms', {})

        astar = AStarDiagnosis(rules=rules, target_confidence=0.85)
        result = astar.get_next_question(current_symptoms)
        
        return jsonify({
            'success': True,
            **result
        })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/diagnose/astar', methods=['POST'])
def astar_search():
    """执行完整的A*搜索，返回搜索过程和最优诊断路径"""
    try:
        data = request.get_json() or {}
        initial_symptoms = data.get('initial_symptoms', {})

        astar = AStarDiagnosis(rules=rules, target_confidence=0.85)
        result = astar.search(initial_symptoms)

        logger.info("A*搜索完成: 路径长度=%d, 置信度=%.2f%%",
                    result.get('path_length', 0), result.get('final_confidence', 0) * 100)
        
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


@bp.route('/diagnose/astar/compare', methods=['POST'])
def astar_compare():
    """比较A*搜索与顺序搜索的效率差异"""
    try:
        data = request.get_json() or {}
        initial_symptoms = data.get('initial_symptoms', {})
        
        astar = AStarDiagnosis(rules=rules, target_confidence=0.85)
        astar_result = astar.search(initial_symptoms)
        
        naive_path = ['fever', 'cough', 'muscle_pain', 'headache', 'fatigue', 
                      'sore_throat', 'nasal_congestion', 'contact_history']
        naive_questions = 0
        naive_confidence = 0
        naive_symptoms = initial_symptoms.copy()
        
        for symptom in naive_path:
            if symptom not in naive_symptoms:
                naive_questions += 1
                naive_symptoms[symptom] = True if symptom != 'fever' else 39.0
                naive_confidence = astar._calculate_confidence(naive_symptoms)
                if naive_confidence >= 0.85:
                    break
        
        comparison = {
            'astar': {
                'path_length': astar_result.get('path_length', 0),
                'questions_asked': astar_result.get('questions_asked', []),
                'final_confidence': astar_result.get('final_confidence', 0),
                'iterations': astar_result.get('iterations', 0),
                'search_trace': astar_result.get('search_trace', [])[:10]
            },
            'naive': {
                'path_length': naive_questions,
                'questions_asked': [astar.symptom_questions.get(s, s) for s in naive_path[:naive_questions]],
                'final_confidence': naive_confidence
            },
            'improvement': {
                'questions_saved': naive_questions - astar_result.get('path_length', 0),
                'efficiency_gain': f"{((naive_questions - astar_result.get('path_length', 0)) / naive_questions * 100):.1f}%" if naive_questions > 0 else "0%"
            }
        }
        
        logger.info("A*搜索需要%d个问题, 顺序搜索需要%d个问题",
                    astar_result.get('path_length', 0), naive_questions)
        
        return jsonify({
            'success': True,
            'comparison': comparison
        })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/query', methods=['POST'])
def query_knowledge():
    """知识查询接口，使用后向推理回答疾病相关问题"""
    try:
        data = request.get_json()
        query_text = data.get('query', '')
        disease = data.get('disease', '')
        
        if not query_text:
            return jsonify({
                'success': False,
                'error': '请提供查询问题'
            }), 400
        
        if disease:
            result = backward_engine.query_disease_info(disease)
        else:
            result = backward_engine.answer_symptom_query(query_text)
        
        if result.get('success'):
            if 'results' in result:
                answer_parts = []
                total_rules = 0
                total_symptoms = 0
                
                for disease_info in result['results']:
                    answer_parts.append(f"\n**{disease_info['disease']}的典型症状包括：**\n")
                    answer_parts.append('\n'.join([f"• {s}" for s in disease_info['symptoms']]))
                    answer_parts.append(f"\n\n{disease_info['description']}")
                    answer_parts.append(f"\n\n（基于 {disease_info['high_confidence_rules']} 条高置信度诊断规则）")
                    
                    total_rules += disease_info.get('rule_count', 0)
                    total_symptoms += len(disease_info.get('symptoms', []))
                
                answer = '\n'.join(answer_parts)
                rule_count_for_thinking = total_rules
                symptom_count_for_thinking = total_symptoms
            else:
                answer = f"\n**{result['disease']}的典型症状包括：**\n\n"
                answer += '\n'.join([f"• {s}" for s in result['symptoms']])
                answer += f"\n\n{result['description']}"
                answer += f"\n\n（基于 {result['high_confidence_rules']} 条高置信度诊断规则）"
                
                rule_count_for_thinking = result.get('rule_count', 0)
                symptom_count_for_thinking = len(result.get('symptoms', []))
            
            return jsonify({
                'success': True,
                'answer': answer,
                'disease_info': result,
                'thinking_steps': [
                    '🔍 识别查询意图：知识查询',
                    f'🎯 提取目标疾病：{disease or "甲流"}',
                    '🔄 启动后向推理：从结论反推条件',
                    f'📚 遍历规则库：找到 {rule_count_for_thinking} 条相关规则',
                    f'✅ 提取典型症状：{symptom_count_for_thinking} 个症状',
                    '💡 构建知识答案：基于规则库生成回复'
                ]
            })
        else:
            return jsonify({
                'success': False,
                'answer': '抱歉，未找到相关疾病信息。',
                'error': result.get('message', '查询失败')
            })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/analyze_image', methods=['POST'])
def analyze_throat_image():
    """
    咽喉图片分析接口
    接收 base64 图片 → 调用 DeepSeek Vision → 返回结构化体征 + 对应症状特征
    """
    try:
        data = request.get_json()
        image_data = data.get('image')  # base64 字符串，含 data:image/...;base64, 前缀

        if not image_data:
            return jsonify({'success': False, 'error': '未提供图片'}), 400

        # 去掉 data URL 前缀，只保留 base64 内容
        if ',' in image_data:
            image_base64 = image_data.split(',', 1)[1]
            mime_type = image_data.split(';')[0].split(':')[1]
        else:
            image_base64 = image_data
            mime_type = 'image/jpeg'

        # 压缩图片：解码 → 缩放到最大 800px → 重新编码，避免大图超时
        try:
            import io, base64 as b64lib
            from PIL import Image as PILImage
            raw = b64lib.b64decode(image_base64)
            img = PILImage.open(io.BytesIO(raw)).convert('RGB')
            max_side = 800
            if max(img.size) > max_side:
                ratio = max_side / max(img.size)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, PILImage.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=85)
            image_base64 = b64lib.b64encode(buf.getvalue()).decode()
            mime_type = 'image/jpeg'
            logger.info('图片压缩完成，尺寸: %dx%d，base64长度: %d', img.width, img.height, len(image_base64))
        except Exception as compress_err:
            logger.warning('图片压缩失败，使用原始图片: %s', compress_err)

        prompt = """你是一名经验丰富的感染科医生，正在辅助诊断甲型流感（甲流）。
请仔细观察这张咽喉照片，从以下维度进行专业评估：

1. 咽部充血程度：0=正常，1=轻度充血，2=中度充血，3=重度充血
2. 扁桃体肿大：0=无，1=轻度，2=中度，3=重度
3. 脓性分泌物：是否存在白色或黄色脓性渗出物
4. 咽后壁滤泡：是否有明显滤泡增生
5. 黏膜水肿：是否有明显黏膜水肿

请严格按照以下JSON格式返回，不要输出其他任何文字：
{
  "pharyngeal_congestion": 0-3的整数,
  "tonsil_swelling": 0-3的整数,
  "purulent_discharge": true或false,
  "follicular_hyperplasia": true或false,
  "mucosal_edema": true或false,
  "overall_severity": "normal"或"mild"或"moderate"或"severe",
  "findings": "简短的专业描述（50字以内）",
  "flu_relevance": 0.0到1.0的小数（与流感相关程度）
}"""

        headers = {
            'Authorization': f'Bearer {VISION_API_KEY}',
            'Content-Type': 'application/json'
        }

        payload = {
            'model': VISION_MODEL,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': f'data:{mime_type};base64,{image_base64}'
                            }
                        },
                        {
                            'type': 'text',
                            'text': prompt
                        }
                    ]
                }
            ],
            'max_tokens': 500,
            'temperature': 0.1
        }

        response = http_requests.post(
            f'{VISION_API_BASE}/chat/completions',
            headers=headers,
            json=payload,
            timeout=120
        )

        if response.status_code != 200:
            logger.error('Vision API 错误: %d %s', response.status_code, response.text)
            return jsonify({'success': False, 'error': f'视觉模型调用失败: {response.status_code}'}), 500

        content = response.json()['choices'][0]['message']['content']

        # 解析 JSON
        import json, re
        cleaned = content.strip()
        if cleaned.startswith('```'):
            cleaned = re.sub(r'^```[a-z]*\n?', '', cleaned)
            cleaned = re.sub(r'\n?```$', '', cleaned)
        vision_result = json.loads(cleaned.strip())

        # 将视觉体征转化为推理引擎可用的症状特征
        image_symptoms = {}

        congestion = vision_result.get('pharyngeal_congestion', 0)
        if congestion >= 2:
            image_symptoms['sore_throat'] = True
        elif congestion == 1:
            image_symptoms['sore_throat'] = {'present': True, 'severity': 'mild'}

        if vision_result.get('tonsil_swelling', 0) >= 2:
            image_symptoms['sore_throat'] = True

        if vision_result.get('mucosal_edema'):
            image_symptoms['sore_throat'] = True

        severity = vision_result.get('overall_severity', 'normal')
        flu_relevance = vision_result.get('flu_relevance', 0.0)

        return jsonify({
            'success': True,
            'vision_result': vision_result,
            'image_symptoms': image_symptoms,
            'summary': {
                'severity': severity,
                'flu_relevance': flu_relevance,
                'findings': vision_result.get('findings', ''),
                'congestion_level': congestion,
                'has_purulent': vision_result.get('purulent_discharge', False)
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/diagnose/visualize', methods=['POST'])
def get_inference_visualization():
    """
    获取推理过程可视化数据
    """
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', {})
        
        visualization = {
            'rules_graph': {
                'nodes': [
                    {'id': 'fever', 'label': '发热', 'type': 'symptom'},
                    {'id': 'cough', 'label': '咳嗽', 'type': 'symptom'},
                    {'id': 'R1', 'label': '规则R1', 'type': 'rule'},
                    {'id': 'flu', 'label': '流感', 'type': 'conclusion'}
                ],
                'edges': [
                    {'from': 'fever', 'to': 'R1'},
                    {'from': 'cough', 'to': 'R1'},
                    {'from': 'R1', 'to': 'flu'}
                ]
            },
            'confidence_history': [
                {'step': 1, 'confidence': 0.3},
                {'step': 2, 'confidence': 0.55},
                {'step': 3, 'confidence': 0.85}
            ]
        }
        
        return jsonify({
            'success': True,
            'visualization': visualization
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

