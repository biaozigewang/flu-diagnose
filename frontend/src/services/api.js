import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// 图片分析用单独实例，超时更长
const apiVision = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' }
})
apiVision.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)
apiVision.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 请求拦截器：自动带上 Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：401 自动跳转登录
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    console.error('[API Error]', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      return response
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '登录失败' }
    }
  },
  register: async (username, password) => {
    try {
      const response = await api.post('/auth/register', { username, password })
      return response
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '注册失败' }
    }
  }
}

export const diagnosisService = {
  analyzeText: async (text, useLLM = true) => {
    try {
      const response = await api.post('/analyze', { text, use_llm: useLLM })
      return response
    } catch (error) {
      console.warn('API 未连接，使用模拟数据')
      return mockAnalyzeText(text)
    }
  },

  diagnose: async (symptoms) => {
    try {
      const response = await api.post('/diagnose', { symptoms })
      return response
    } catch (error) {
      console.warn('API 未连接，使用模拟数据')
      return mockDiagnose(symptoms)
    }
  },

  diagnoseStep: async (currentSymptoms, step) => {
    try {
      const response = await api.post('/diagnose/step', { 
        current_symptoms: currentSymptoms, 
        step 
      })
      return response
    } catch (error) {
      console.warn('API 未连接')
      return { success: false, error: '服务未连接' }
    }
  },

  getVisualization: async (symptoms) => {
    try {
      const response = await api.post('/diagnose/visualize', { symptoms })
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  getHistory: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get('/history', { params: { limit, offset } })
      return response
    } catch (error) {
      return { success: false, history: [], error: '服务未连接' }
    }
  },

  saveHistory: async (record) => {
    try {
      const response = await api.post('/history', record)
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  deleteHistory: async (recordId) => {
    try {
      const response = await api.delete(`/history/${recordId}`)
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  updateFeedback: async (recordId, feedback) => {
    try {
      const response = await api.patch(`/history/${recordId}/feedback`, { feedback })
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  astarSearch: async (initialSymptoms = {}) => {
    try {
      const response = await api.post('/diagnose/astar', { initial_symptoms: initialSymptoms })
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  astarCompare: async (initialSymptoms = {}) => {
    try {
      const response = await api.post('/diagnose/astar/compare', { initial_symptoms: initialSymptoms })
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  queryKnowledge: async (query, disease = '') => {
    try {
      const response = await api.post('/query', { query, disease })
      return response
    } catch (error) {
      return { success: false, error: '服务未连接' }
    }
  },

  analyzeImage: async (imageBase64) => {
    try {
      const response = await apiVision.post('/analyze_image', { image: imageBase64 })
      return response
    } catch (error) {
      return { success: false, error: '图片分析失败' }
    }
  }
}

// 模拟数据（后端未连接时使用）

function mockAnalyzeText(text) {
  const symptoms = {}
  const entities = []
  
  const tempMatch = text.match(/(\d+\.?\d*)\s*[度°℃]/)
  if (tempMatch) {
    const temp = parseFloat(tempMatch[1])
    symptoms.fever = { present: true, value: temp }
    entities.push({ text: tempMatch[0], type: 'temperature', value: temp })
  } else if (text.includes('发烧') || text.includes('发热')) {
    // 检查是否被否定
    if (text.includes('不发烧') || text.includes('没发烧') || text.includes('不发热')) {
      symptoms.fever = { present: false }
    } else {
      symptoms.fever = { present: true }
    }
  }
  
  const symptomKeywords = {
    '咳嗽': 'cough',
    '肌肉酸痛': 'muscle_pain',
    '浑身酸痛': 'muscle_pain',
    '头痛': 'headache',
    '头疼': 'headache',
    '乏力': 'fatigue',
    '没力气': 'fatigue',
    '喉咙痛': 'sore_throat',
    '嗓子疼': 'sore_throat',
    '鼻塞': 'nasal_congestion',
    '流鼻涕': 'nasal_congestion',
    '腹泻': 'diarrhea',
    '拉肚子': 'diarrhea'
  }
  
  const negationWords = ['不', '没', '没有', '无']
  
  Object.entries(symptomKeywords).forEach(([keyword, key]) => {
    if (text.includes(keyword)) {
      let negated = false
      for (const neg of negationWords) {
        const idx = text.indexOf(keyword)
        const prefix = text.substring(Math.max(0, idx - 5), idx)
        if (prefix.includes(neg)) {
          negated = true
          break
        }
      }
      
      let severity = 'moderate'
      if (text.includes('轻微') || text.includes('有点')) {
        severity = 'mild'
      } else if (text.includes('严重') || text.includes('剧烈')) {
        severity = 'severe'
      }
      
      symptoms[key] = { present: !negated, negated, severity }
      entities.push({ 
        text: keyword, 
        type: negated ? 'negated_symptom' : 'symptom',
        normalized: key 
      })
    }
  })
  
  return {
    success: true,
    result: {
      intent: 'diagnose',
      symptoms,
      entities,
      original_text: text
    }
  }
}

function mockDiagnose(symptoms) {
  let confidence = 0
  const triggeredRules = []
  
  if (symptoms.fever) {
    const feverValue = typeof symptoms.fever === 'object' 
      ? symptoms.fever.value || (symptoms.fever.present ? 38 : 0)
      : symptoms.fever
    
    if (feverValue >= 39) {
      confidence += 0.3
      triggeredRules.push({
        id: 'R3',
        name: '高热规则',
        conditions: ['fever >= 39'],
        conclusion: 'h1n1_possible',
        conclusion_text: '可能患有甲流',
        confidence: 0.95
      })
    } else if (feverValue >= 38) {
      confidence += 0.2
      triggeredRules.push({
        id: 'R1',
        name: '发热基础规则',
        conditions: ['fever >= 38'],
        conclusion: 'flu_possible',
        conclusion_text: '可能存在流感',
        confidence: 0.8
      })
    }
  }
  
  if (symptoms.cough?.present || symptoms.cough === true) {
    confidence += 0.15
    triggeredRules.push({
      id: 'R2',
      name: '咳嗽规则',
      conditions: ['cough'],
      conclusion: 'flu_possible',
      conclusion_text: '可能存在流感',
      confidence: 0.85
    })
  }
  
  if (symptoms.muscle_pain?.present || symptoms.muscle_pain === true) {
    confidence += 0.2
    triggeredRules.push({
      id: 'R4',
      name: '肌肉疼痛规则',
      conditions: ['muscle_pain'],
      conclusion: 'h1n1_possible',
      conclusion_text: '可能患有甲流',
      confidence: 0.9
    })
  }
  
  if (symptoms.headache?.present || symptoms.headache === true) {
    confidence += 0.1
  }
  
  if (symptoms.fatigue?.present || symptoms.fatigue === true) {
    confidence += 0.15
  }
  
  confidence = Math.min(confidence, 0.98)
  
  let diagnosis, diagnosisText, riskLevel
  
  if (confidence >= 0.7) {
    diagnosis = 'h1n1_possible'
    diagnosisText = '可能患有甲流'
    riskLevel = 'high'
  } else if (confidence >= 0.5) {
    diagnosis = 'flu_possible'
    diagnosisText = '可能存在流感'
    riskLevel = 'moderate'
  } else if (confidence >= 0.3) {
    diagnosis = 'flu_risk'
    diagnosisText = '存在流感风险'
    riskLevel = 'low'
  } else {
    diagnosis = 'unknown'
    diagnosisText = '症状不典型，建议观察'
    riskLevel = 'very_low'
  }
  
  return {
    success: true,
    result: {
      diagnosis,
      diagnosis_text: diagnosisText,
      confidence,
      risk_level: riskLevel,
      triggered_rules: triggeredRules,
      bayesian_probability: confidence * 0.95,
      recommendations: getRecommendations(riskLevel),
      reasoning_process: triggeredRules.map((rule, index) => ({
        step: index + 1,
        rule_id: rule.id,
        rule_name: rule.name,
        matched_conditions: rule.conditions,
        conclusion: rule.conclusion_text,
        confidence: rule.confidence,
        explanation: `规则 ${rule.id} (${rule.name}) 被触发：满足条件 ${rule.conditions.join(' ∧ ')}，得出结论「${rule.conclusion_text}」，置信度 ${rule.confidence}`
      }))
    }
  }
}

function getRecommendations(riskLevel) {
  if (riskLevel === 'high') {
    return [
      '建议立即前往医院进行甲流核酸检测',
      '在确诊前请居家隔离，避免与他人密切接触',
      '注意休息，多饮温水',
      '密切监测体温变化',
      '如出现呼吸困难等严重症状，请立即就医'
    ]
  } else if (riskLevel === 'moderate') {
    return [
      '建议就医进行流感检测',
      '注意休息和补充水分',
      '可适当服用退烧药物',
      '避免前往人员密集场所'
    ]
  } else {
    return [
      '症状较轻，建议继续观察',
      '保持良好的个人卫生习惯',
      '如症状持续或加重，请及时就医'
    ]
  }
}

export default api

