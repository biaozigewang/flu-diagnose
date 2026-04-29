"""
贝叶斯网络推理引擎
"""
from typing import Dict, Any, List
import json
import os


class BayesianInferenceEngine:
    """贝叶斯推理引擎 - P(D|S) = P(S|D) * P(D) / P(S)"""
    
    def __init__(self, network_config: Dict = None):
        self.network = network_config or {}
        self.prior_probabilities = {}
        self.cpt = {}
        if network_config:
            self._load_config(network_config)
    
    def _load_config(self, config: Dict):
        self.network = config.get('network', {})
        self.prior_probabilities = config.get('prior_probabilities', {})
        self.cpt = config.get('conditional_probability_tables', {})
    
    def load_from_file(self, filepath: str):
        with open(filepath, 'r', encoding='utf-8') as f:
            self._load_config(json.load(f))
    
    def infer(self, symptoms: Dict[str, Any]) -> Dict[str, Any]:
        """计算各疾病的后验概率"""
        results = {}
        
        p_h1n1 = self._calculate_posterior('h1n1', symptoms)
        results['h1n1'] = {
            'name': '甲型流感(H1N1)',
            'probability': round(p_h1n1, 4),
            'prior': self.prior_probabilities.get('h1n1', {}).get('yes', 0.05)
        }
        
        p_flu = self._calculate_posterior('flu', symptoms)
        results['flu'] = {
            'name': '普通流感',
            'probability': round(p_flu, 4),
            'prior': self.prior_probabilities.get('flu', {}).get('yes', 0.1)
        }
        
        most_likely = max(results.items(), key=lambda x: x[1]['probability'])
        
        return {
            'posteriors': results,
            'most_likely_disease': most_likely[0],
            'most_likely_name': most_likely[1]['name'],
            'probability': most_likely[1]['probability'],
            'evidence': self._format_evidence(symptoms)
        }
    
    def _calculate_posterior(self, disease: str, symptoms: Dict[str, Any]) -> float:
        """朴素贝叶斯: P(D|S1,S2,...) ∝ P(D) * ∏P(Si|D)"""
        prior = self.prior_probabilities.get(disease, {}).get('yes', 0.05)
        prior_no = self.prior_probabilities.get(disease, {}).get('no', 0.95)
        
        likelihood_yes = self._calculate_likelihood(disease, symptoms, True)
        likelihood_no = self._calculate_likelihood(disease, symptoms, False)
        
        numerator = prior * likelihood_yes
        denominator = prior * likelihood_yes + prior_no * likelihood_no
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator
    
    def _calculate_likelihood(self, disease: str, symptoms: Dict[str, Any],
                             has_disease: bool) -> float:
        likelihood = 1.0
        disease_state = 'yes' if has_disease else 'no'

        # fever 需要将温度值转换为离散等级
        if 'fever' in symptoms:
            fever_value = symptoms['fever']
            if isinstance(fever_value, dict):
                fever_value = fever_value.get('value', 0)
            state = self._fever_to_state(fever_value)
            cpt_key = f'fever_given_{disease}'
            if cpt_key in self.cpt:
                prob = self.cpt[cpt_key].get(f'{disease}_{disease_state}', {}).get(state, 0.5)
                likelihood *= prob

        for symptom in ['cough', 'muscle_pain', 'headache', 'fatigue']:
            if symptom not in symptoms:
                continue
            value = symptoms[symptom]
            if isinstance(value, dict):
                value = value.get('present', False)
            state = 'yes' if value else 'no'
            cpt_key = f'{symptom}_given_{disease}'
            if cpt_key in self.cpt:
                prob = self.cpt[cpt_key].get(f'{disease}_{disease_state}', {}).get(state, 0.5)
                likelihood *= prob

        return likelihood
    
    def _fever_to_state(self, temperature: float) -> str:
        if temperature >= 39.0:
            return 'high'
        elif temperature >= 38.0:
            return 'moderate'
        elif temperature >= 37.3:
            return 'low'
        else:
            return 'none'
    
    def _format_evidence(self, symptoms: Dict[str, Any]) -> List[Dict]:
        evidence = []
        for symptom, value in symptoms.items():
            if isinstance(value, dict):
                evidence.append({
                    'symptom': symptom,
                    'present': value.get('present', False),
                    'value': value.get('value')
                })
            else:
                evidence.append({
                    'symptom': symptom,
                    'present': bool(value),
                    'value': value if isinstance(value, (int, float)) else None
                })
        return evidence
    
    def get_network_structure(self) -> Dict:
        return {
            'nodes': self.network.get('nodes', []),
            'edges': self.network.get('edges', [])
        }





