import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Thermometer,
  Target,
  Zap,
  ArrowRight,
  RotateCcw,
  Activity
} from 'lucide-react'

function SmartQuestionnaire({ onComplete, onCancel }) {
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answers, setAnswers] = useState({})
  const [confidence, setConfidence] = useState(0)
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [questionHistory, setQuestionHistory] = useState([])
  const [temperatureInput, setTemperatureInput] = useState('')

  // 启动智能问诊
  useEffect(() => {
    fetchNextQuestion({})
  }, [])

  // 获取下一个问题（基于 A* 算法）
  const fetchNextQuestion = async (currentSymptoms) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/diagnose/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_symptoms: currentSymptoms })
      })
      const data = await response.json()
      
      if (data.success) {
        if (data.complete) {
          // 诊断完成
          setIsComplete(true)
          setConfidence(data.confidence || data.current_confidence)
          // 执行完整诊断
          executeDiagnosis(currentSymptoms)
        } else {
          setCurrentQuestion({
            symptom: data.next_symptom,
            question: data.question,
            expectedGain: data.expected_gain,
            probability: data.probability,  // 条件概率
            reason: data.reason,  // 选择原因
            alternatives: data.alternatives
          })
          setConfidence(data.current_confidence || 0)
        }
      }
    } catch (error) {
      console.error('获取问题失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 执行最终诊断
  const executeDiagnosis = async (symptoms) => {
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms })
      })
      const data = await response.json()
      
      if (data.success && onComplete) {
        onComplete({
          symptoms,
          result: data.result,
          questionHistory
        })
      }
    } catch (error) {
      console.error('诊断失败:', error)
    }
  }

  // 处理用户回答
  const handleAnswer = async (answer) => {
    const symptom = currentQuestion.symptom
    let value = answer
    
    // 如果是体温问题，使用输入的数值
    if (symptom === 'fever' && answer === true) {
      value = parseFloat(temperatureInput) || 38.5
    }
    
    // 记录回答
    const newAnswers = { ...answers, [symptom]: value }
    setAnswers(newAnswers)
    
    // 记录问题历史
    setQuestionHistory(prev => [...prev, {
      step: step + 1,
      symptom,
      question: currentQuestion.question,
      answer: value,
      confidence
    }])
    
    setStep(s => s + 1)
    setTemperatureInput('')
    
    // 获取下一个问题
    await fetchNextQuestion(newAnswers)
  }

  // 重新开始
  const handleReset = () => {
    setAnswers({})
    setConfidence(0)
    setStep(0)
    setIsComplete(false)
    setQuestionHistory([])
    setCurrentQuestion(null)
    fetchNextQuestion({})
  }

  // 症状名称映射
  const symptomNames = {
    fever: '发热',
    cough: '咳嗽',
    muscle_pain: '肌肉酸痛',
    headache: '头痛',
    fatigue: '乏力',
    sore_throat: '喉咙痛',
    nasal_congestion: '鼻塞',
    diarrhea: '腹泻',
    breathing_difficulty: '呼吸困难',
    contact_history: '接触史',
    sudden_onset: '急性起病',
    chills: '寒战',
    no_vaccination: '未接种疫苗'
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">A* 智能问诊</h2>
              <p className="text-violet-100 text-sm">系统自动选择最有价值的问题</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            返回症状录入
          </button>
        </div>

        {/* 进度条 */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>诊断置信度</span>
            <span className="font-bold">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${confidence * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1 text-violet-200">
            <span>0%</span>
            <span className="flex items-center">
              <Target className="w-3 h-3 mr-1" />
              目标: 85%
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">A* 算法正在计算最优问题...</p>
          </div>
        ) : isComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">问诊完成！</h3>
            <p className="text-slate-500 mb-4">
              仅用 <span className="font-bold text-violet-600">{step}</span> 个问题完成症状评估
            </p>
            <p className="text-sm text-slate-400">正在生成自检报告...</p>
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* 当前问题 */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-violet-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>A* 算法选择的第 {step + 1} 个问题</span>
                </div>
                {currentQuestion.expectedGain > 0 && (
                  <span className="bg-violet-100 px-2 py-0.5 rounded text-xs">
                    信息增益: {(currentQuestion.expectedGain * 100).toFixed(1)}%
                  </span>
                )}
                {currentQuestion.probability && (
                  <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-xs">
                    预测概率: {(currentQuestion.probability * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {currentQuestion.question}
              </h3>
              
              <p className="text-slate-500 text-sm">
                当前询问: <span className="font-medium text-violet-600">{symptomNames[currentQuestion.symptom] || currentQuestion.symptom}</span>
              </p>
              
              {/* 动态选择原因 */}
              {currentQuestion.reason && (
                <div className="mt-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100">
                  <p className="text-sm text-violet-700">
                    <span className="font-medium">🤖 选择原因：</span>
                    {currentQuestion.reason}
                  </p>
                </div>
              )}
            </div>

            {/* 回答区域 */}
            {currentQuestion.symptom === 'fever' ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="35"
                      max="42"
                      placeholder="输入体温（如 38.5）"
                      value={temperatureInput}
                      onChange={e => setTemperatureInput(e.target.value)}
                      className="w-full pl-10 pr-12 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">°C</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAnswer(true)}
                    disabled={!temperatureInput || parseFloat(temperatureInput) < 35}
                    className="py-4 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>确认体温</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium border-2 border-emerald-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>没有发烧</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(true)}
                  className="py-6 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-200 flex flex-col items-center justify-center space-y-2"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span className="text-lg">是</span>
                  <span className="text-xs text-red-100">有此症状</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(false)}
                  className="py-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium border-2 border-emerald-100 transition-all flex flex-col items-center justify-center space-y-2"
                >
                  <XCircle className="w-8 h-8" />
                  <span className="text-lg">否</span>
                  <span className="text-xs text-emerald-600">没有此症状</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* 已回答的问题历史 */}
        {questionHistory.length > 0 && !isComplete && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              已采集症状 ({questionHistory.length} 项)
            </h4>
            <div className="space-y-2">
              {questionHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm"
                >
                  <span className="text-slate-600">
                    {symptomNames[item.symptom] || item.symptom}
                  </span>
                  <span className={`font-medium ${
                    item.answer ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {typeof item.answer === 'number' ? `${item.answer}°C` : (item.answer ? '是' : '否')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 重新开始按钮 */}
        {step > 0 && !isComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center space-x-1 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新开始</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SmartQuestionnaire

