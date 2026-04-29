"""
数据库管理 - SQLite
"""
import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from .models import DiagnosisRecord


class DatabaseManager:
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.path.join(
                os.path.dirname(__file__),
                'flu_diagnosis.db'
            )
        
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diagnosis_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                symptoms TEXT NOT NULL,
                diagnosis TEXT,
                diagnosis_text TEXT,
                confidence REAL,
                risk_level TEXT,
                rules_triggered TEXT,
                bayesian_probability REAL,
                recommendations TEXT,
                user_input TEXT,
                session_id TEXT,
                feedback TEXT DEFAULT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def save_diagnosis(self, record: DiagnosisRecord) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO diagnosis_records 
            (timestamp, symptoms, diagnosis, diagnosis_text, confidence, 
             risk_level, rules_triggered, bayesian_probability, recommendations,
             user_input, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return record_id
    
    def get_diagnosis(self, record_id: int) -> Optional[DiagnosisRecord]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM diagnosis_records WHERE id = ?', (record_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_diagnosis_record(row)
        return None
    
    def delete_diagnosis(self, record_id: int) -> bool:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM diagnosis_records WHERE id = ?', (record_id,))
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def get_diagnosis_history(self, limit: int = 10, offset: int = 0) -> List[DiagnosisRecord]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM diagnosis_records 
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_diagnosis_record(row) for row in rows]
    
    def get_history_count(self) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM diagnosis_records')
        count = cursor.fetchone()[0]
        conn.close()
        
        return count
    
    def update_feedback(self, record_id: int, feedback: str) -> bool:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # 兼容旧数据库：若列不存在则先添加
        try:
            cursor.execute('ALTER TABLE diagnosis_records ADD COLUMN feedback TEXT DEFAULT NULL')
            conn.commit()
        except Exception:
            pass
        cursor.execute('UPDATE diagnosis_records SET feedback = ? WHERE id = ?', (feedback, record_id))
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        return affected > 0

    def _row_to_diagnosis_record(self, row) -> DiagnosisRecord:
        return DiagnosisRecord(
            id=row[0],
            timestamp=row[1],
            symptoms=json.loads(row[2]) if row[2] else {},
            diagnosis=row[3],
            diagnosis_text=row[4],
            confidence=row[5],
            risk_level=row[6],
            rules_triggered=json.loads(row[7]) if row[7] else [],
            bayesian_probability=row[8],
            recommendations=json.loads(row[9]) if row[9] else [],
            user_input=row[10],
            session_id=row[11],
            feedback=row[12] if len(row) > 12 else None
        )
    
    def get_statistics(self) -> Dict[str, Any]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM diagnosis_records')
        total_diagnoses = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT diagnosis, COUNT(*) as count 
            FROM diagnosis_records 
            GROUP BY diagnosis
        ''')
        diagnosis_distribution = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            'total_diagnoses': total_diagnoses,
            'diagnosis_distribution': diagnosis_distribution
        }





