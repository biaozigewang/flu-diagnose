import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Activity,
  TrendingUp,
  Network,
  Download,
  Loader2,
  Share2,
  Copy,
  Check,
  Phone
} from 'lucide-react'
import BayesianNetworkViz from '../visualization/BayesianNetworkViz'
import NearbyHospitals from '../../components/NearbyHospitals'

const SYMPTOM_NAMES = {
  fever: '发热', cough: '咳嗽', muscle_pain: '肌肉酸痛',
  headache: '头痛', fatigue: '乏力', sore_throat: '喉咙痛',
  nasal_congestion: '鼻塞', diarrhea: '腹泻',
  breathing_difficulty: '呼吸困难', chills: '寒战',
  contact_history: '接触史', sudden_onset: '急性起病'
}

// 症状恶化警告信号
const WARNING_SIGNALS = [
  { icon: '🌡️', text: '体温持续高于 39.5°C 且退烧药无效' },
  { icon: '😮‍💨', text: '出现呼吸困难、气短、胸痛' },
  { icon: '🫀', text: '心跳异常加速或心悸' },
  { icon: '🧠', text: '意识模糊、嗜睡、难以唤醒' },
  { icon: '💧', text: '严重脱水：无尿、极度口渴、皮肤干燥' },
  { icon: '🩸', text: '咳血或痰中带血' },
  { icon: '👶', text: '儿童出现高热惊厥、呼吸急促' },
]

function WarningSignals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-red-300 bg-red-50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-red-700 text-sm">就医警示</p>
        </div>
        <a
          href="tel:120"
          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex-shrink-0"
        >
          <Phone className="w-3.5 h-3.5" />
          拨打 120
        </a>
      </div>
      <ul className="space-y-1.5">
        {WARNING_SIGNALS.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-red-700">
            <span className="flex-shrink-0">{w.icon}</span>
            <span>{w.text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function DiagnosisResult({ result, symptoms = {}, compact = false }) {
  const [showBayesian, setShowBayesian] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const reportRef = useRef(null)
  if (!result) return null

  const shareAsImage = async () => {
    setSharing(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `流感哨兵自检报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (e) {
      console.error('图片导出失败', e)
    }
    setSharing(false)
  }

  const copyText = () => {
    const riskLabel = { high: '高风险', moderate: '中等风险', low: '低风险', very_low: '极低风险' }
    const text = [
      `【流感哨兵自检报告】${new Date().toLocaleString('zh-CN')}`,
      `诊断结果：${result.diagnosis_text || result.diagnosis}`,
      `置信度：${(result.confidence * 100).toFixed(1)}%`,
      `风险等级：${riskLabel[result.risk_level] || result.risk_level}`,
      result.recommendations?.length ? `\n健康建议：\n${result.recommendations.map(r => `• ${r}`).join('\n')}` : '',
      '\n本结果由AI推理生成，仅供参考，不替代医生诊断。',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - 20
      const imgH = (canvas.height * imgW) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgW, Math.min(imgH, pageH - 20))
      pdf.save(`流感哨兵自检报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`)
    } catch (e) {
      console.error('PDF导出失败', e)
      alert('PDF导出失败，请确认已安装 jspdf 和 html2canvas')
    }
    setExporting(false)
  }

  const getRiskConfig = (level) => {
    const configs = {
      high: {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        barColor: 'from-red-500 to-orange-500',
        label: '高风险'
      },
      moderate: {
        icon: AlertCircle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        barColor: 'from-amber-500 to-yellow-500',
        label: '中等风险'
      },
      low: {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        barColor: 'from-green-500 to-emerald-500',
        label: '低风险'
      },
      very_low: {
        icon: CheckCircle,
        color: 'text-slate-500',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        barColor: 'from-slate-400 to-slate-500',
        label: '极低风险'
      }
    }
    return configs[level] || configs.low
  }

  const config = getRiskConfig(result.risk_level)
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? '' : `card ${config.bgColor} border ${config.borderColor}`}`}
    >
      {/* 可导出区域 */}
      <div ref={reportRef}>
        {/* 顶部标题行 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">自检结果</h3>
              <span className={`text-sm ${config.color} font-medium`}>{config.label}</span>
            </div>
          </div>
          {!compact && <p className="text-xs text-slate-400">{new Date().toLocaleString('zh-CN')}</p>}
        </div>

        {compact ? (
          /* compact 模式：单列竖排 */
          <div className="space-y-3">
            <p className="text-base font-medium text-slate-800">
              {result.diagnosis_text || result.diagnosis}
            </p>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">置信度</span>
                <span className="font-semibold text-slate-800">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="confidence-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`confidence-bar-fill bg-gradient-to-r ${config.barColor}`}
                />
              </div>
            </div>

            {result.triggered_rules && (
              <div className="flex items-center justify-between py-1.5 border-t border-slate-200/50">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />触发规则数
                </span>
                <span className="font-medium text-slate-800">{result.triggered_rules.length} 条</span>
              </div>
            )}

            {result.bayesian_probability && (
              <div className="flex items-center justify-between py-1.5 border-t border-slate-200/50">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />贝叶斯概率
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{(result.bayesian_probability * 100).toFixed(1)}%</span>
                  <button
                    onClick={() => setShowBayesian(true)}
                    className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors flex items-center gap-1"
                  >
                    <Network className="w-3 h-3" />网络图
                  </button>
                </div>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="pt-2 border-t border-slate-200/50">
                <h4 className="text-sm font-medium text-slate-700 mb-1.5">健康建议</h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">•</span><span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 高/中风险时显示警告信号和医院推荐 */}
            {(result.risk_level === 'high' || result.risk_level === 'moderate') && (
              <>
                <WarningSignals />
                <NearbyHospitals />
              </>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />生成中...</> : <><Download className="w-3.5 h-3.5" />导出 PDF</>}
              </button>
              <button
                onClick={shareAsImage}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                {sharing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />生成中...</> : <><Share2 className="w-3.5 h-3.5" />保存图片</>}
              </button>
              <button
                onClick={copyText}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                title="复制文字报告"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : (
          /* 普通模式：横向两列 */
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-lg font-medium text-slate-800">
                  {result.diagnosis_text || result.diagnosis}
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">置信度</span>
                    <span className="font-semibold text-slate-800">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`confidence-bar-fill bg-gradient-to-r ${config.barColor}`}
                    />
                  </div>
                </div>
                {result.triggered_rules && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-200/50">
                    <span className="text-sm text-slate-600 flex items-center"><Activity className="w-4 h-4 mr-1" />触发规则数</span>
                    <span className="font-medium text-slate-800">{result.triggered_rules.length} 条</span>
                  </div>
                )}
                {result.bayesian_probability && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-200/50">
                    <span className="text-sm text-slate-600 flex items-center"><TrendingUp className="w-4 h-4 mr-1" />贝叶斯概率</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-800">{(result.bayesian_probability * 100).toFixed(1)}%</span>
                      <button onClick={() => setShowBayesian(true)} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors flex items-center">
                        <Network className="w-3 h-3 mr-1" />网络图
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                {result.recommendations && result.recommendations.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">健康建议</h4>
                    <ul className="space-y-1.5">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-0.5 flex-shrink-0">•</span><span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-3 mt-3 border-t border-slate-200/50">
              本结果由 AI 推理生成，仅供参考，不替代医生诊断。如有不适请及时就医。
            </p>
          </>
        )}
      </div>

      {/* 导出按钮（非 compact 模式才显示） */}
      {!compact && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Download className="w-4 h-4" />导出 PDF</>}
          </button>
          <button
            onClick={shareAsImage}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            {sharing ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Share2 className="w-4 h-4" />保存图片</>}
          </button>
          <button
            onClick={copyText}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            title="复制文字报告"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showBayesian && (
          <BayesianNetworkViz
            onClose={() => setShowBayesian(false)}
            symptoms={symptoms}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default DiagnosisResult

