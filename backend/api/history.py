"""
历史记录 API 接口
"""
import logging
from flask import Blueprint, request, jsonify
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from database.models import DiagnosisRecord

logger = logging.getLogger(__name__)
bp = Blueprint('history', __name__)
db = DatabaseManager()


@bp.route('/history', methods=['GET'])
def get_history():
    """获取诊断历史记录，支持分页"""
    try:
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        records = db.get_diagnosis_history(limit, offset)
        total = db.get_history_count()
        history_list = [record.to_dict() for record in records]
        
        return jsonify({
            'success': True,
            'history': history_list,
            'total': total
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history', methods=['POST'])
def save_history():
    """
    保存诊断记录到数据库
    """
    try:
        data = request.get_json()
        record = DiagnosisRecord(
            symptoms=data.get('symptoms', {}),
            diagnosis=data.get('diagnosis', ''),
            diagnosis_text=data.get('diagnosis', ''),
            confidence=data.get('confidence', 0),
            risk_level=data.get('risk_level', 'unknown'),
            rules_triggered=data.get('triggered_rules', []),
            bayesian_probability=data.get('bayesian_probability', 0),
            recommendations=data.get('recommendations', []),
            user_input=data.get('original_text', ''),
            session_id=data.get('session_id', '')
        )
        
        record_id = db.save_diagnosis(record)
        record.id = record_id
        logger.info("已保存诊断记录 #%d: %s", record_id, record.diagnosis)
        
        return jsonify({
            'success': True,
            'record': record.to_dict()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/<int:record_id>', methods=['GET'])
def get_history_detail(record_id):
    """
    获取单条诊断记录详情
    """
    try:
        record = db.get_diagnosis(record_id)
        
        if record:
            return jsonify({
                'success': True,
                'record': record.to_dict()
            })
        
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/<int:record_id>/feedback', methods=['PATCH'])
def update_feedback(record_id):
    """更新诊断结果用户反馈（confirmed/unconfirmed）"""
    try:
        data = request.get_json()
        feedback = data.get('feedback', '')
        if feedback not in ('confirmed', 'unconfirmed', ''):
            return jsonify({'success': False, 'error': '无效的反馈值'}), 400
        success = db.update_feedback(record_id, feedback)
        if success:
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': '记录不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/history/<int:record_id>', methods=['DELETE'])
def delete_history(record_id):
    """
    删除单条诊断记录
    """
    try:
        success = db.delete_diagnosis(record_id)
        
        if success:
            logger.info("已删除诊断记录 #%d", record_id)
            return jsonify({
                'success': True,
                'message': f'已删除记录 #{record_id}'
            })
        
        return jsonify({
            'success': False,
            'error': '记录不存在'
        }), 404
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/statistics', methods=['GET'])
def get_statistics():
    """
    获取统计信息
    """
    try:
        stats = db.get_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

