import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Loader2,
  User,
  Bot,
  AlertCircle,
  CheckCircle,
  ThermometerSun,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  Brain,
  Sparkles,
  Mic,
  MicOff,
  GitCompare,
  SlidersHorizontal,
  UserCheck,
  Heart,
  Maximize2,
  Minimize2
} from 'lucide-react'
import DiagnosisResult from '../features/diagnosis/DiagnosisResult'
import RuleVisualization from '../features/visualization/RuleVisualization'
import SmartQuestionnaire from '../features/diagnosis/SmartQuestionnaire'
import ThroatImageAnalysis from '../features/diagnosis/ThroatImageAnalysis'
import DifferentialDiagnosis from '../components/DifferentialDiagnosis'
import { diagnosisService } from '../services/api'

// 症状 + 结果 Tab 面板
function SymptomsResultPanel({ currentSymptoms, diagnosisResult, symptomNameMap }) {
  const [activeTab, setActiveTab] = useState('symptoms')

  // 有结果时自动切到结果 tab
  const prevResultRef = React.useRef(null)
  useEffect(() => {
    if (diagnosisResult && diagnosisResult !== prevResultRef.current) {
      setActiveTab('result')
      prevResultRef.current = diagnosisResult
    }
  }, [diagnosisResult])

  const tabs = [
    { id: 'symptoms', label: '已识别症状', icon: ThermometerSun },
    { id: 'result',   label: '自检结果',   icon: Activity, badge: !!diagnosisResult },
  ]

  return (
    <div className="card flex flex-col" style={{ height: 600, minHeight: 400 }}>
      {/* Tab 头 */}
      <div className="flex border-b border-slate-200 mb-3 flex-shrink-0">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors relative ${
              activeTab === id
                ? 'text-primary-600 border-b-2 border-primary-500 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge && activeTab !== id && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 absolute top-1.5 right-2" />
            )}
          </button>
        ))}
      </div>

      {/* 症状 Tab */}
      {activeTab === 'symptoms' && (
        Object.keys(currentSymptoms).length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-1">
            {Object.entries(currentSymptoms)
              .filter(([key]) => !key.startsWith('_') && !(key in { contact_history:1, no_vaccination:1, chronic_disease:1, age_elderly:1, age_child:1 }))
              .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600 text-sm">{symptomNameMap[key] || key}</span>
                <span className={`text-sm font-medium ${value ? 'text-red-500' : 'text-green-500'}`}>
                  {typeof value === 'number' ? `${value}°C` : value ? '有' : '无'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ThermometerSun className="w-10 h-10 text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm">暂无症状信息</p>
            <p className="text-slate-300 text-xs mt-1">在左侧描述症状后自动显示</p>
          </div>
        )
      )}

      {/* 结果 Tab */}
      {activeTab === 'result' && (
        diagnosisResult ? (
          <div className="flex-1 overflow-y-auto">
            <DiagnosisResult result={diagnosisResult} symptoms={currentSymptoms} compact />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Activity className="w-10 h-10 text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm">暂无诊断结果</p>
            <p className="text-slate-300 text-xs mt-1">描述症状后自动生成</p>
          </div>
        )
      )}
    </div>
  )
}

// 统一的症状中英文映射
const SYMPTOM_NAME_MAP = {
  fever: '发热',
  cough: '咳嗽',
  muscle_pain: '肌肉酸痛',
  headache: '头痛',
  fatigue: '乏力',
  sore_throat: '喉咙痛',
  nasal_congestion: '鼻塞',
  diarrhea: '腹泻',
  breathing_difficulty: '呼吸困难',
  chills: '寒战',
  // 中文键也映射到中文，避免已经是中文的症状显示问题
  '发热': '发热',
  '咳嗽': '咳嗽',
  '肌肉酸痛': '肌肉酸痛',
  '头痛': '头痛',
  '乏力': '乏力',
  '喉咙痛': '喉咙痛',
  '鼻塞': '鼻塞',
  '腹泻': '腹泻',
  '呼吸困难': '呼吸困难',
  '寒战': '寒战',
  '打喷嚏': '打喷嚏',
  '流鼻涕': '流鼻涕',
  '咽痛': '咽痛'
}

function DiagnosisPage() {
  const location = useLocation()
  const [mode, setMode] = useState('chat')

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('diagnosis_messages')
      return saved ? JSON.parse(saved) : [{
        role: 'assistant',
        content: '您好！请描述您的症状，例如："我发烧38.5度，浑身酸痛，咳嗽"。系统将帮您评估是否可能感染甲流，并给出就医建议。'
      }]
    } catch { return [{ role: 'assistant', content: '您好！请描述您的症状，例如："我发烧38.5度，浑身酸痛，咳嗽"。系统将帮您评估是否可能感染甲流，并给出就医建议。' }] }
  })

  const [input, setInput] = useState(() => location.state?.initialInput || '')
  const [isLoading, setIsLoading] = useState(false)

  const [diagnosisResult, setDiagnosisResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem('diagnosis_result')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const [showVisualization, setShowVisualization] = useState(false)

  const [currentSymptoms, setCurrentSymptoms] = useState(() => {
    try {
      const saved = sessionStorage.getItem('diagnosis_symptoms')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const [thinkingStep, setThinkingStep] = useState('')

  // 首页带 autoSubmit 跳转时自动触发发送
  useEffect(() => {
    if (location.state?.autoSubmit && location.state?.initialInput) {
      const timer = setTimeout(() => {
        handleSubmit({ preventDefault: () => {} })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 同步到 sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('diagnosis_messages', JSON.stringify(messages)) } catch {}
  }, [messages])

  useEffect(() => {
    try { sessionStorage.setItem('diagnosis_symptoms', JSON.stringify(currentSymptoms)) } catch {}
  }, [currentSymptoms])

  useEffect(() => {
    try {
      if (diagnosisResult) sessionStorage.setItem('diagnosis_result', JSON.stringify(diagnosisResult))
      else sessionStorage.removeItem('diagnosis_result')
    } catch {}
  }, [diagnosisResult])
  
  const [isListening, setIsListening] = useState(false)
  const [speechSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const [isChatFullscreen, setIsChatFullscreen] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsChatFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 新增：严重程度、风险因素、鉴别诊断弹窗
  const [severity, setSeverity] = useState(1) // 0=轻 1=中 2=重
  const [riskFactors, setRiskFactors] = useState({
    contact_history: false,
    no_vaccination: false,
    chronic_disease: false,
    age_elderly: false,
    age_child: false,
  })
  const [showRiskPanel, setShowRiskPanel] = useState(false)
  const [showDifferential, setShowDifferential] = useState(false)

  // 自动补全
  const [suggestions, setSuggestions] = useState([])
  const SYMPTOM_SUGGESTIONS = [
    '发烧38度', '发烧39度', '发烧40度', '高烧', '低烧',
    '咳嗽', '干咳', '咳嗽有痰', '剧烈咳嗽',
    '肌肉酸痛', '浑身酸痛', '关节疼痛',
    '头痛', '头疼', '头晕',
    '乏力', '全身无力', '疲惫',
    '喉咙痛', '嗓子疼', '咽喉肿痛',
    '鼻塞', '流鼻涕', '打喷嚏',
    '腹泻', '拉肚子', '恶心呕吐',
    '寒战', '畏寒', '发冷',
    '呼吸困难', '胸闷', '气短',
    '食欲不振', '没有食欲',
  ]

  // 快速症状模板
  const SYMPTOM_TEMPLATES = [
    { label: '典型甲流', text: '发烧39度，浑身肌肉酸痛，乏力，头痛' },
    { label: '轻症感冒', text: '低烧，流鼻涕，轻微咳嗽，嗓子有点疼' },
    { label: '高热重症', text: '发烧40度，剧烈头痛，全身酸痛，呼吸有点困难' },
    { label: '消化型', text: '发烧38度，腹泻，恶心，乏力' },
  ]
  const recognitionRef = useRef(null)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const prevMessageCountRef = useRef(0)

  const scrollToBottom = () => {
    // 使用容器的 scrollTop 而不是 scrollIntoView，避免整个页面滚动
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  // 只在新消息添加时滚动，展开/折叠思考过程不滚动
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom()
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // 语音识别
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev ? `${prev}，${transcript}` : transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // 直接用已有症状触发诊断（图像分析后调用）
  const runDiagnosisWithSymptoms = async (symptomsToUse) => {
    if (isLoading) return
    setIsLoading(true)
    const thinkingSteps = ['📷 咽喉图像体征已合并', '🧠 模糊推理 + 贝叶斯网络计算中...']
    setThinkingStep('🧠 综合图像体征进行诊断...')
    try {
      await new Promise(r => setTimeout(r, 300))
      const diagnoseResponse = await diagnosisService.diagnose(symptomsToUse)
      if (diagnoseResponse.success) {
        setDiagnosisResult(diagnoseResponse.result)
        if (diagnoseResponse.result.thinking_steps) {
          thinkingSteps.push(...diagnoseResponse.result.thinking_steps)
        }
        const resultMessage = generateResultMessage(diagnoseResponse.result)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: resultMessage,
          type: 'result',
          result: diagnoseResponse.result,
          thinking: thinkingSteps,
          expanded: false
        }])
        try {
          await diagnosisService.saveHistory({
            symptoms: symptomsToUse,
            diagnosis: diagnoseResponse.result.diagnosis_text || diagnoseResponse.result.diagnosis,
            confidence: diagnoseResponse.result.confidence,
            risk_level: diagnoseResponse.result.risk_level,
            triggered_rules: diagnoseResponse.result.triggered_rules,
            bayesian_probability: diagnoseResponse.result.bayesian_probability,
            original_text: '咽喉图像辅助诊断'
          })
        } catch {}
      }
    } catch (err) {
      console.error('图像诊断出错:', err)
    } finally {
      setIsLoading(false)
      setThinkingStep('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    
    const thinkingSteps = []

    try {
      setThinkingStep('🔍 正在分析症状...')
      thinkingSteps.push('🔍 自然语言处理：使用 jieba 分词提取关键词')
      await new Promise(r => setTimeout(r, 200))
      setThinkingStep('🧠 语义理解中...')
      thinkingSteps.push('🤖 LLM增强：语义理解完成')

      const analyzeResponse = await diagnosisService.analyzeText(userMessage)

      if (analyzeResponse.success) {
        const { symptoms, intent } = analyzeResponse.result
        if (analyzeResponse.result.llm_enhanced) {
          thinkingSteps.push('✨ 成功解析复杂语义')
        }
        const intentMap = {
          diagnose: '症状诊断',
          query: '健康咨询'
        }
        const intentText = intentMap[intent] || intent || '症状描述'
        thinkingSteps.push(`📋 意图识别：${intentText}`)
        if (intent === 'query') {
          setThinkingStep('🔄 使用后向推理查询知识库...')
          await new Promise(r => setTimeout(r, 300))
          
          const queryResponse = await diagnosisService.queryKnowledge(userMessage)
          
          if (queryResponse.success) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: queryResponse.answer,
              type: 'query',
              thinking: queryResponse.thinking_steps ? [...thinkingSteps, ...queryResponse.thinking_steps] : thinkingSteps,
              expanded: false
            }])
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '抱歉，未找到相关信息。您可以尝试询问"甲流有什么症状"或"流感如何预防"。',
              type: 'error'
            }])
          }
          
          setIsLoading(false)
          setThinkingStep('')
          return
        }
        const newSymptoms = { ...currentSymptoms }
        const extractedSymptomNames = []
        Object.entries(symptoms).forEach(([key, value]) => {
          if (value.present !== undefined) {
            newSymptoms[key] = value.present ? (value.value || true) : false
            if (value.present) {
              extractedSymptomNames.push(SYMPTOM_NAME_MAP[key] || key)
            }
          }
        })

        // 合并风险因素
        const severityMap = { 0: 'mild', 1: 'moderate', 2: 'severe' }
        newSymptoms._severity = severityMap[severity]
        Object.entries(riskFactors).forEach(([key, val]) => {
          if (val) newSymptoms[key] = true
        })

        setCurrentSymptoms(newSymptoms)
        if (extractedSymptomNames.length > 0) {
          thinkingSteps.push(`✅ 提取到症状：${extractedSymptomNames.join('、')}`)
        }

        const symptomFeedback = generateSymptomFeedback(symptoms)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: symptomFeedback,
          type: 'analysis'
        }])

        setThinkingStep('🧠 模糊推理 + 贝叶斯网络计算中...')
        await new Promise(r => setTimeout(r, 300))
        
        const diagnoseResponse = await diagnosisService.diagnose(newSymptoms)
        
        if (diagnoseResponse.success) {
          setDiagnosisResult(diagnoseResponse.result)
          if (diagnoseResponse.result.thinking_steps) {
            thinkingSteps.push(...diagnoseResponse.result.thinking_steps)
          } else {
            // 降级：如果后端未返回，使用前端生成
            const triggeredRules = diagnoseResponse.result.triggered_rules || []
            if (triggeredRules.length > 0) {
              thinkingSteps.push(`🎯 触发规则：${triggeredRules.length} 条规则匹配`)
            }
            thinkingSteps.push(`📈 置信度计算：${(diagnoseResponse.result.confidence * 100).toFixed(1)}%`)
            thinkingSteps.push(`📉 贝叶斯概率：${(diagnoseResponse.result.bayesian_probability * 100).toFixed(1)}%`)
            thinkingSteps.push(`✨ 综合判断：${diagnoseResponse.result.risk_level === 'high' ? '高风险' : diagnoseResponse.result.risk_level === 'medium' ? '中风险' : '低风险'}`)
          }
          const resultMessage = generateResultMessage(diagnoseResponse.result)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: resultMessage,
            type: 'result',
            result: diagnoseResponse.result,
            thinking: thinkingSteps,
            expanded: false
          }])
          try {
            await diagnosisService.saveHistory({
              symptoms: newSymptoms,
              diagnosis: diagnoseResponse.result.diagnosis_text || diagnoseResponse.result.diagnosis,
              confidence: diagnoseResponse.result.confidence,
              risk_level: diagnoseResponse.result.risk_level,
              triggered_rules: diagnoseResponse.result.triggered_rules,
              bayesian_probability: diagnoseResponse.result.bayesian_probability,
              original_text: userMessage
            })
          } catch (saveError) {
            console.error('保存历史记录失败:', saveError)
          }
        }
      }
    } catch (error) {
      console.error('诊断出错:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，系统处理时出现了问题。请稍后重试。',
        type: 'error'
      }])
    } finally {
      setIsLoading(false)
      setThinkingStep('')
    }
  }
  const toggleThinking = (index) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, expanded: !msg.expanded } : msg
    ))
  }

  const generateSymptomFeedback = (symptoms) => {
    const parts = ['我已识别到以下信息：\n']
    
    Object.entries(symptoms).forEach(([key, value]) => {
      const name = SYMPTOM_NAME_MAP[key] || key
      
      if (value.present === false || value.negated) {
        parts.push(`• ${name}：无`)
      } else if (value.present) {
        if (value.value) {
          parts.push(`• ${name}：${value.value}°C`)
        } else {
          parts.push(`• ${name}：有${value.severity === 'mild' ? '（轻微）' : value.severity === 'severe' ? '（严重）' : ''}`)
        }
      }
    })
    
    return parts.join('\n')
  }

  const generateResultMessage = (result) => {
    const riskEmoji = {
      high: '🔴',
      moderate: '🟡',
      low: '🟢',
      very_low: '⚪'
    }
    
    return `根据您提供的症状，初步分析结果如下：\n\n` +
           `${riskEmoji[result.risk_level] || '🔵'} **${result.diagnosis_text || result.diagnosis}**\n` +
           `置信度：${(result.confidence * 100).toFixed(1)}%\n\n` +
           `点击下方"查看详细分析"了解推理过程。`
  }

  const handleReset = () => {
    const initial = [{ role: 'assistant', content: '您好！请描述您的症状，例如："我发烧38.5度，浑身酸痛，咳嗽"。系统将帮您评估是否可能感染甲流，并给出就医建议。' }]
    setMessages(initial)
    setCurrentSymptoms({})
    setDiagnosisResult(null)
    setShowVisualization(false)
    sessionStorage.removeItem('diagnosis_messages')
    sessionStorage.removeItem('diagnosis_symptoms')
    sessionStorage.removeItem('diagnosis_result')
  }

  const quickSymptoms = [
    '发烧38.5度',
    '急性起病',
    '咳嗽',
    '肌肉酸痛',
    '头痛',
    '乏力',
    '喉咙痛',
    '有接触史'
  ]

  // 智能问诊完成回调
  const handleSmartComplete = (data) => {
    setCurrentSymptoms(data.symptoms)
    setDiagnosisResult(data.result)
    // 切换回对话模式显示结果
    setMessages([
      { role: 'assistant', content: '您好，医生！请输入患者的症状信息。' },
      {
        role: 'assistant',
        content: `✅ 智能问诊完成！\n\n通过 A* 算法，仅用 ${data.questionHistory?.length || 0} 个问题完成了对患者的诊断评估。\n\n${generateResultMessage(data.result)}`,
        type: 'result',
        result: data.result
      }
    ])
    setMode('chat')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 模式切换 */}
      <div className="mb-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-1.5 shadow-lg inline-flex">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'chat' 
                ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>症状录入</span>
          </button>
          <button
            onClick={() => setMode('smart')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'smart' 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span>A* 智能问诊</span>
          </button>
        </div>
      </div>

      {/* 智能问诊模式 */}
      {mode === 'smart' ? (
        <div className="max-w-2xl mx-auto">
          <SmartQuestionnaire 
            onComplete={handleSmartComplete}
            onCancel={() => setMode('chat')}
          />
        </div>
      ) : (
      <div className="space-y-6">
        {/* 上方三列：咽喉图像 + 聊天区 + 已识别症状 */}
        <div className="grid lg:grid-cols-4 gap-6 items-start">
          {/* 咽喉图像分析 - 占 1/4 */}
          <div className="lg:col-span-1 flex flex-col gap-4" style={{ height: 600 }}>
            <ThroatImageAnalysis
              onSymptomsExtracted={(imageSymptoms, summary) => {
                const merged = { ...currentSymptoms, ...imageSymptoms }
                setCurrentSymptoms(merged)
                const severityText = { normal: '正常', mild: '轻度异常', moderate: '中度异常', severe: '重度异常' }[summary?.severity] || ''
                const congestionLabels = ['正常', '轻度充血', '中度充血', '重度充血']
                const vr = summary?.vision_result || {}
                const details = [
                  `咽部充血：${congestionLabels[vr.pharyngeal_congestion ?? 0]}`,
                  `扁桃体：${vr.tonsil_swelling >= 2 ? '肿大' : vr.tonsil_swelling === 1 ? '轻度肿大' : '正常'}`,
                  vr.purulent_discharge ? '脓性分泌物：存在' : null,
                  vr.mucosal_edema ? '黏膜水肿：存在' : null,
                ].filter(Boolean).join('　|　')
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `📷 **咽喉图像分析完成**（${severityText}）\n\n${details}\n\n> ${summary?.findings || ''}\n\n流感相关度 **${((summary?.flu_relevance || 0) * 100).toFixed(0)}%**，已将体征合并至症状，正在自动诊断...`,
                  type: 'analysis'
                }])
                runDiagnosisWithSymptoms(merged)
              }}
            />
            {/* 感冒 vs 甲流 内联对比卡片 */}
            <div className="card flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 flex-shrink-0">
                <GitCompare className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-slate-700">感冒 vs 甲流</span>
              </div>
              <div className="flex-1 overflow-y-auto mt-3">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="text-left py-1.5 pr-2 text-slate-400 font-medium w-1/3">特征</th>
                      <th className="py-1.5 px-1 text-center">
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">甲流</span>
                      </th>
                      <th className="py-1.5 pl-1 text-center">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold">感冒</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: '起病', flu: '急，数小时', cold: '缓，1-2天' },
                      { feature: '发热', flu: '高热38-40°C', cold: '低热或无' },
                      { feature: '发热持续', flu: '3-5天', cold: '1-2天' },
                      { feature: '全身症状', flu: '严重', cold: '轻微' },
                      { feature: '头痛', flu: '明显', cold: '轻微或无' },
                      { feature: '肌肉酸痛', flu: '明显', cold: '轻微或无' },
                      { feature: '乏力', flu: '严重，2-3周', cold: '轻微' },
                      { feature: '鼻塞流涕', flu: '轻微', cold: '明显' },
                      { feature: '咳嗽', flu: '干咳较重', cold: '轻微' },
                      { feature: '打喷嚏', flu: '少见', cold: '常见' },
                      { feature: '并发症', flu: '高风险', cold: '低' },
                      { feature: '传染性', flu: '强', cold: '中等' },
                      { feature: '病程', flu: '7-10天', cold: '5-7天' },
                      { feature: '特效药', flu: '奥司他韦', cold: '无' },
                    ].map((row, i) => (
                      <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                        <td className="py-1.5 pr-2 text-slate-500 font-medium">{row.feature}</td>
                        <td className="py-1.5 px-1 text-center text-red-600">{row.flu}</td>
                        <td className="py-1.5 pl-1 text-center text-blue-600">{row.cold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 聊天区域 - 占 2/4 */}
          <div
            className={isChatFullscreen ? 'fixed inset-0 z-50 p-4' : 'lg:col-span-2'}
            onClick={isChatFullscreen ? () => setIsChatFullscreen(false) : undefined}
          >
            {/* 全屏背景遮罩 */}
            <AnimatePresence>
              {isChatFullscreen && (
                <motion.div
                  className="fixed inset-0 -z-[1] bg-black/30 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </AnimatePresence>
            <motion.div
              key={String(isChatFullscreen)}
              className={`card flex flex-col ${isChatFullscreen ? 'h-full' : ''}`}
              style={isChatFullscreen ? {} : { height: 600 }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* 聊天头部 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">流感哨兵</h2>
                  <p className="text-xs text-slate-400">甲流智能自检助手</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1 text-sm text-slate-500 hover:text-primary-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重新开始</span>
                </button>
                <button
                  onClick={() => setIsChatFullscreen(v => !v)}
                  title={isChatFullscreen ? '退出全屏' : '全屏展开'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  {isChatFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 消息列表 */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`message-bubble ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                        {/* 思考过程（可折叠）- 仅诊断结果消息 */}
                        {message.thinking && message.thinking.length > 0 && (
                          <div className="mb-3">
                            <button
                              onClick={() => toggleThinking(index)}
                              className={`flex items-center gap-2 text-sm transition-colors ${
                                message.role === 'user' ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-primary-600'
                              }`}
                            >
                              {message.expanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span>💭 已思考 ({message.thinking.length} 步)</span>
                            </button>
                            {message.expanded && (
                              <div className={`mt-2 pl-4 border-l-2 text-sm space-y-1 ${
                                message.role === 'user' ? 'border-white/30 text-white/90' : 'border-primary-200 text-slate-600'
                              }`}>
                                {message.thinking.map((step, i) => (
                                  <p key={i} className="leading-relaxed">{step}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`prose prose-sm max-w-none ${
                          message.role === 'user'
                            ? 'prose-invert text-white'
                            : 'text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900'
                        }`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {message.type === 'result' && message.result && (
                          <button
                            onClick={() => setShowVisualization(true)}
                            className="mt-3 flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                          >
                            <Activity className="w-4 h-4" />
                            <span>查看详细分析</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 text-slate-500"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="message-bubble message-assistant">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      <span className="text-slate-600">{thinkingStep || '正在分析...'}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 严重程度 + 风险因素 同一行 */}
            <div className="py-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 flex-shrink-0">症状程度</span>
                <div className="flex gap-1">
                  {['轻', '中', '重'].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setSeverity(i)}
                      className={`px-2.5 py-0.5 text-xs rounded-lg border transition-all ${
                        severity === i
                          ? i === 0 ? 'bg-green-100 border-green-400 text-green-700 font-medium'
                          : i === 1 ? 'bg-amber-100 border-amber-400 text-amber-700 font-medium'
                          : 'bg-red-100 border-red-400 text-red-700 font-medium'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="w-px h-3.5 bg-slate-200 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => setShowRiskPanel(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    Object.values(riskFactors).some(Boolean)
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  风险因素
                  {Object.values(riskFactors).filter(Boolean).length > 0 && (
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {Object.values(riskFactors).filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              {/* 风险因素展开面板 */}
              {showRiskPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-50 rounded-xl p-3 border border-purple-100"
                >
                  <p className="text-xs text-purple-600 font-medium mb-2">勾选适用的风险因素（影响诊断权重）</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'contact_history', label: '近期接触流感患者' },
                      { key: 'no_vaccination', label: '未接种流感疫苗' },
                      { key: 'chronic_disease', label: '患有慢性基础病' },
                      { key: 'age_elderly', label: '65岁以上老年人' },
                      { key: 'age_child', label: '5岁以下儿童' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={riskFactors[key]}
                          onChange={e => setRiskFactors(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="w-3.5 h-3.5 accent-purple-500"
                        />
                        <span className="text-xs text-slate-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* 输入区域 */}
            <form onSubmit={handleSubmit} className="py-3 border-t border-slate-200">
              <div className="relative flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      const val = e.target.value.trim()
                      if (val.length >= 1) {
                        const lastWord = val.split(/[，,、\s]/).pop()
                        setSuggestions(
                          lastWord
                            ? SYMPTOM_SUGGESTIONS.filter(s => s.includes(lastWord) && s !== lastWord).slice(0, 5)
                            : []
                        )
                      } else {
                        setSuggestions([])
                      }
                    }}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    placeholder="描述您的症状，如：发烧38.5度，浑身酸痛..."
                    className="input-field w-full"
                    disabled={isLoading}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={() => {
                            const parts = input.split(/([，,、\s]+)/)
                            parts[parts.length - 1] = s
                            setInput(parts.join(''))
                            setSuggestions([])
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    title={isListening ? '停止录音' : '语音输入'}
                    className={`px-4 rounded-xl border transition-all ${
                      isListening
                        ? 'bg-red-500 border-red-500 text-white animate-pulse'
                        : 'border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-500'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="btn-primary px-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                  正在录音，请说出您的症状...
                </p>
              )}
            </form>

            {/* 快速模板 + 快速添加症状 各占一行 */}
            <div className="py-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 flex-shrink-0">模板：</span>
                {SYMPTOM_TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => setInput(t.text)}
                    className="px-2 py-0.5 text-xs rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 flex-shrink-0">症状：</span>
                {quickSymptoms.map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => setInput(prev => prev ? `${prev}，${symptom}` : symptom)}
                    className="symptom-tag symptom-tag-inactive"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
            </motion.div>
          </div>

          {/* 已识别症状 + 自检结果 Tab 面板 - 占 1/4 */}
          <div className="lg:col-span-1">
            <SymptomsResultPanel
              currentSymptoms={currentSymptoms}
              diagnosisResult={diagnosisResult}
              symptomNameMap={SYMPTOM_NAME_MAP}
            />
          </div>
        </div>
      </div>
      )}

      {/* 鉴别诊断弹窗 */}
      {showDifferential && (
        <DifferentialDiagnosis onClose={() => setShowDifferential(false)} />
      )}

      {/* 可视化弹窗 */}
      <AnimatePresence>
        {showVisualization && diagnosisResult && (
          <RuleVisualization 
            result={diagnosisResult} 
            onClose={() => setShowVisualization(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default DiagnosisPage

