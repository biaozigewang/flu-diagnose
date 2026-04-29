import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, GitBranch, CheckCircle, ArrowRight,
  Activity, Brain, Zap, Network, Info
} from 'lucide-react'

// 症状中文名
const SYMPTOM_NAMES = {
  fever: '发热', cough: '咳嗽', muscle_pain: '肌肉酸痛',
  headache: '头痛', fatigue: '乏力', sore_throat: '喉咙痛',
  nasal_congestion: '鼻塞', diarrhea: '腹泻',
  breathing_difficulty: '呼吸困难', chills: '寒战',
  contact_history: '接触史', sudden_onset: '急性起病'
}

// ─── 交互式知识图谱 ────────────────────────────────────────────────
function KnowledgeGraph({ result, symptoms }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  const triggeredRuleIds = new Set((result.triggered_rules || []).map(r => r.id))
  const activeSymptoms = new Set(
    Object.entries(symptoms || {})
      .filter(([, v]) => v && v !== false)
      .map(([k]) => k)
  )

  // 图谱布局：症状节点 → 规则节点 → 结论节点
  const W = 760, H = 340
  const rules = result.triggered_rules || []

  // 症状节点（左列）
  const symptomKeys = [...activeSymptoms].slice(0, 8)
  const symptomNodes = symptomKeys.map((key, i) => ({
    id: `s_${key}`, label: SYMPTOM_NAMES[key] || key,
    x: 80, y: 40 + i * ((H - 60) / Math.max(symptomKeys.length - 1, 1)),
    type: 'symptom', color: '#6366f1'
  }))

  // 规则节点（中列）
  const ruleNodes = rules.slice(0, 6).map((rule, i) => ({
    id: `r_${rule.id}`, label: rule.name || rule.id,
    x: 340, y: 40 + i * ((H - 60) / Math.max(rules.length - 1, 1)),
    type: 'rule', color: '#f59e0b',
    confidence: rule.confidence, conditions: rule.conditions || []
  }))

  // 结论节点（右列）
  const conclusionColor = result.risk_level === 'high' ? '#ef4444'
    : result.risk_level === 'moderate' ? '#f97316' : '#22c55e'
  const conclusionNodes = [
    {
      id: 'c_main', label: result.diagnosis_text || result.diagnosis,
      x: 640, y: H / 2, type: 'conclusion', color: conclusionColor,
      confidence: result.confidence
    }
  ]

  // 边：症状 → 规则
  const edges = []
  ruleNodes.forEach(rn => {
    const rule = rules.find(r => `r_${r.id}` === rn.id)
    if (!rule) return
    rule.conditions?.forEach(cond => {
      const sKey = symptomKeys.find(k => cond.includes(k))
      if (sKey) {
        edges.push({ from: `s_${sKey}`, to: rn.id, active: true })
      }
    })
    // 若没匹配到条件，连接所有激活症状中的前几个
    if (!edges.find(e => e.to === rn.id)) {
      symptomNodes.slice(0, 2).forEach(sn => {
        edges.push({ from: sn.id, to: rn.id, active: true })
      })
    }
  })
  // 规则 → 结论
  ruleNodes.forEach(rn => {
    edges.push({ from: rn.id, to: 'c_main', active: true })
  })

  const allNodes = [...symptomNodes, ...ruleNodes, ...conclusionNodes]
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]))

  const getNodeRadius = (node) => {
    if (node.type === 'conclusion') return 38
    if (node.type === 'rule') return 30
    return 24
  }

  return (
    <div className="space-y-2">
      {/* SVG 图谱区域（不含任何绝对定位浮层） */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height={H + 20}
          viewBox={`0 0 ${W} ${H + 20}`}
          className="w-full"
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#475569" />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <rect width={W} height={H + 20} fill="url(#grid)" />

          {[
            { x: 80, label: '症状输入', color: '#818cf8' },
            { x: 340, label: '推理规则', color: '#fbbf24' },
            { x: 640, label: '诊断结论', color: conclusionColor }
          ].map(col => (
            <text key={col.x} x={col.x} y={16} textAnchor="middle"
              fill={col.color} fontSize="11" fontWeight="600" opacity="0.8">
              {col.label}
            </text>
          ))}

          {edges.map((edge, i) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) return null
            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to
            const dx = to.x - from.x
            const dy = to.y - from.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const r1 = getNodeRadius(from)
            const r2 = getNodeRadius(to)
            const x1 = from.x + dx / dist * r1
            const y1 = from.y + dy / dist * r1
            const x2 = to.x - dx / dist * (r2 + 8)
            const y2 = to.y - dy / dist * (r2 + 8)
            const cx = (x1 + x2) / 2
            const cy = (y1 + y2) / 2 - 20
            return (
              <path
                key={i}
                d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
                fill="none"
                stroke={isHovered ? '#38bdf8' : '#334155'}
                strokeWidth={isHovered ? 2 : 1}
                markerEnd={isHovered ? 'url(#arrow-active)' : 'url(#arrow)'}
                opacity={isHovered ? 1 : 0.6}
                style={{ transition: 'all 0.2s' }}
              />
            )
          })}

          {allNodes.map(node => {
            const r = getNodeRadius(node)
            const isHov = hoveredNode === node.id
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setTooltip(tooltip?.id === node.id ? null : node)}
              >
                {isHov && (
                  <circle r={r + 8} fill={node.color} opacity="0.15" filter="url(#glow)" />
                )}
                <circle r={r + 3} fill="none"
                  stroke={node.color} strokeWidth={isHov ? 2 : 1} opacity={isHov ? 0.8 : 0.3} />
                <circle r={r} fill={node.color} opacity={isHov ? 1 : 0.85} />
                {node.confidence && (
                  <circle r={r} fill="none" stroke="white" strokeWidth="2.5"
                    strokeDasharray={`${node.confidence * 2 * Math.PI * r} ${2 * Math.PI * r}`}
                    transform="rotate(-90)" opacity="0.5" />
                )}
                <text textAnchor="middle" fill="white" fontSize={node.type === 'conclusion' ? 10 : 9}
                  fontWeight="600" dy="1">
                  {node.label.length > 6 ? node.label.slice(0, 6) + '…' : node.label}
                </text>
                {node.confidence && (
                  <text textAnchor="middle" fill="white" fontSize="8" dy="12" opacity="0.9">
                    {(node.confidence * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* 图例 — 图谱下方独立一行 */}
      <div className="flex items-center gap-4 px-1 text-xs text-slate-500">
        {[
          { color: '#6366f1', label: '症状节点' },
          { color: '#f59e0b', label: '规则节点' },
          { color: conclusionColor, label: '结论节点' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        <span className="ml-auto text-slate-400">点击节点查看详情</span>
      </div>

      {/* Tooltip — 图谱下方展开，不遮挡任何内容 */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tooltip.color }} />
                  <span className="font-semibold text-white">{tooltip.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {tooltip.type === 'symptom' ? '症状' : tooltip.type === 'rule' ? '规则' : '结论'}
                  </span>
                </div>
                {tooltip.conditions?.length > 0 && (
                  <p className="text-slate-400 text-xs">条件：{tooltip.conditions.join(' ∧ ')}</p>
                )}
                {tooltip.confidence && (
                  <p className="text-slate-300 text-xs mt-0.5">置信度：{(tooltip.confidence * 100).toFixed(1)}%</p>
                )}
              </div>
              <button onClick={() => setTooltip(null)} className="text-slate-500 hover:text-white ml-2 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────
function RuleVisualization({ result, onClose }) {
  const [activeTab, setActiveTab] = useState('graph')
  const triggeredRules = result.triggered_rules || []
  const reasoningProcess = result.reasoning_process || []

  // 置信度变化数据：从规则列表推算
  const confSteps = (() => {
    if (triggeredRules.length === 0) {
      return [
        { label: '开始', v: 0 },
        { label: 'NLP解析', v: 0.2 },
        { label: '规则匹配', v: 0.5 },
        { label: '模糊推理', v: 0.7 },
        { label: '贝叶斯', v: result.bayesian_probability || result.confidence * 0.9 },
        { label: '综合', v: result.confidence }
      ]
    }
    const steps = [{ label: '开始', v: 0 }]
    triggeredRules.forEach((r, i) => {
      steps.push({ label: r.name || `规则${i + 1}`, v: Math.min(r.confidence * (i + 1) / triggeredRules.length, result.confidence) })
    })
    if (result.bayesian_probability) {
      steps.push({ label: '贝叶斯', v: result.bayesian_probability })
    }
    steps.push({ label: '综合', v: result.confidence })
    return steps
  })()

  const maxConf = Math.max(...confSteps.map(s => s.v), 0.01)

  const tabs = [
    { id: 'graph', label: '知识图谱', icon: Network },
    { id: 'rules', label: '触发规则', icon: Zap },
    { id: 'process', label: '推理链', icon: GitBranch },
    { id: 'confidence', label: '置信度', icon: Activity }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">推理过程可视化</h2>
              <p className="text-xs text-slate-400">点击节点查看详情</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Tab 导航 */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── 知识图谱 Tab ── */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>图谱展示症状→规则→结论的推理路径，悬停节点高亮关联边，点击查看详情</span>
              </div>
              <KnowledgeGraph result={result} symptoms={result.symptoms || {}} />
              {/* 结论摘要 */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-cyan-50 rounded-xl border border-primary-100">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">最终诊断结论</p>
                  <p className="font-semibold text-slate-800">{result.diagnosis_text || result.diagnosis}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">综合置信度</p>
                  <p className="text-2xl font-bold text-primary-600">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* ── 触发规则 Tab ── */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              {triggeredRules.length > 0 ? triggeredRules.map((rule, i) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                        {i + 1}
                      </div>
                      <span className="font-medium text-slate-800">{rule.name || rule.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-400 to-cyan-400 rounded-full"
                          style={{ width: `${rule.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-primary-600 w-10 text-right">
                        {(rule.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {rule.conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {rule.conditions.map((c, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-600">
                    <ArrowRight className="w-4 h-4 mr-1.5 text-slate-400" />
                    {rule.conclusion_text || rule.conclusion}
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>暂无规则数据</p>
                </div>
              )}
            </div>
          )}

          {/* ── 推理链 Tab ── */}
          {activeTab === 'process' && (
            <div className="relative">
              {/* 竖线 */}
              <div className="absolute left-[18px] top-9 bottom-9 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200" />
              <div className="space-y-5">
                {(reasoningProcess.length > 0 ? reasoningProcess : [
                  { step: 1, explanation: '用户输入症状，NLP 模块完成分词与语义解析', confidence: 1.0 },
                  { step: 2, explanation: '症状特征向量与知识库规则进行模式匹配', confidence: 0.95 },
                  { step: 3, explanation: '模糊推理引擎计算加权置信度 CF = Σ(CF_i×W_i)/Σ(W_i)', confidence: result.confidence },
                  { step: 4, explanation: '朴素贝叶斯网络计算后验概率 P(D|S)', confidence: result.bayesian_probability || result.confidence },
                  { step: 5, explanation: '综合置信度融合，生成最终诊断结论', confidence: result.confidence }
                ]).map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 z-10 shadow-md">
                      <span className="text-sm font-bold text-white">{step.step}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <p className="text-sm text-slate-700">{step.explanation}</p>
                      <div className="flex items-center mt-2 gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">
                          置信度 {(step.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${step.confidence * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── 置信度变化 Tab ── */}
          {activeTab === 'confidence' && (
            <div className="space-y-6">
              {/* 柱状图 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">推理各阶段置信度</h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
                    {confSteps.map((step, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(step.v * 100).toFixed(0)}%
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(step.v / maxConf) * 130}px` }}
                          transition={{ delay: i * 0.08, duration: 0.5 }}
                          className="w-full rounded-t-lg"
                          style={{
                            background: i === confSteps.length - 1
                              ? 'linear-gradient(to top, #0ea5e9, #06b6d4)'
                              : 'linear-gradient(to top, #6366f1, #818cf8)'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 gap-2">
                    {confSteps.map((step, i) => (
                      <div key={i} className="flex-1 text-center">
                        <span className="text-xs text-slate-500 break-all leading-tight">
                          {step.label.length > 4 ? step.label.slice(0, 4) : step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 双引擎对比 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">双引擎推理结果对比</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '模糊推理 (CF)', value: result.confidence, color: '#6366f1', desc: '基于规则加权融合' },
                    { label: '贝叶斯概率', value: result.bayesian_probability || result.confidence, color: '#0ea5e9', desc: 'P(甲流|症状)' }
                  ].map(engine => (
                    <div key={engine.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">{engine.label}</p>
                      <p className="text-2xl font-bold mb-1" style={{ color: engine.color }}>
                        {(engine.value * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">{engine.desc}</p>
                      <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${engine.value * 100}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: engine.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最终结论 */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-cyan-50 rounded-xl border border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">最终诊断结论</p>
                    <p className="font-semibold text-slate-800">{result.diagnosis_text || result.diagnosis}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">综合置信度</p>
                    <p className="text-2xl font-bold text-primary-600">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default RuleVisualization
