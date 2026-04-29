"""
数据库管理 - PostgreSQL
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from .models import DiagnosisRecord
from .connection import get_connection


class DatabaseManager:

    def __init__(self, db_path: str = None):
        self._init_database()

    def _init_database(self):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diagnosis_records (
                id SERIAL PRIMARY KEY,
                timestamp TEXT NOT NULL,
                symptoms TEXT NOT NULL,
                diagnosis TEXT,
                diagnosis_text TEXT,
                confidence FLOAT,
                risk_level TEXT,
                rules_triggered TEXT,
                bayesian_probability FLOAT,
                recommendations TEXT,
                user_input TEXT,
                session_id TEXT,
                feedback TEXT DEFAULT NULL
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()

    def save_diagnosis(self, record: DiagnosisRecord) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO diagnosis_records
            (timestamp, symptoms, diagnosis, diagnosis_text, confidence,
             risk_level, rules_triggered, bayesian_probability, recommendations,
             user_input, session_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            record.timestamp,
            json.dumps(record.symptoms, ensure_ascii=False),
            record.diagnosis,
            record.diagnosis_text,
            record.confidence,
            record.risk_level,
            json.dumps(record.rules_triggered, ensure_ascii=False),
            record.bayesian_probability,
            json.dumps(record.recommendations, ensure_ascii=False),
            record.user_input,
            record.session_id
        ))
        record_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()
        return record_id

    def get_diagnosis(self, record_id: int) -> Optional[DiagnosisRecord]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM diagnosis_records WHERE id = %s', (record_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row:
            return self._row_to_diagnosis_record(row)
        return None

    def delete_diagnosis(self, record_id: int) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM diagnosis_records WHERE id = %s', (record_id,))
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return affected > 0

    def get_diagnosis_history(self, limit: int = 10, offset: int = 0) -> List[DiagnosisRecord]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM diagnosis_records
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        ''', (limit, offset))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [self._row_to_diagnosis_record(row) for row in rows]

    def get_history_count(self) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM diagnosis_records')
        count = cursor.fetchone()['count']
        cursor.close()
        conn.close()
        return count

    def update_feedback(self, record_id: int, feedback: str) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE diagnosis_records SET feedback = %s WHERE id = %s',
            (feedback, record_id)
        )
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return affected > 0

    def _row_to_diagnosis_record(self, row) -> DiagnosisRecord:
        return DiagnosisRecord(
            id=row['id'],
            timestamp=row['timestamp'],
            symptoms=json.loads(row['symptoms']) if row['symptoms'] else {},
            diagnosis=row['diagnosis'],
            diagnosis_text=row['diagnosis_text'],
            confidence=row['confidence'],
            risk_level=row['risk_level'],
            rules_triggered=json.loads(row['rules_triggered']) if row['rules_triggered'] else [],
            bayesian_probability=row['bayesian_probability'],
            recommendations=json.loads(row['recommendations']) if row['recommendations'] else [],
            user_input=row['user_input'],
            session_id=row['session_id'],
            feedback=row['feedback']
        )

    def get_statistics(self) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM diagnosis_records')
        total_diagnoses = cursor.fetchone()['count']
        cursor.execute('''
            SELECT diagnosis, COUNT(*) as count
            FROM diagnosis_records
            GROUP BY diagnosis
        ''')
        diagnosis_distribution = {row['diagnosis']: row['count'] for row in cursor.fetchall()}
        cursor.close()
        conn.close()
        return {
            'total_diagnoses': total_diagnoses,
            'diagnosis_distribution': diagnosis_distribution
        }
