import React, { useState, useEffect, useRef } from 'react'
import { diagnosisService } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Network, 
  Circle,
  ArrowRight,
  Info,
  Percent,
  Activity,
  Thermometer,
  AlertTriangle
} from 'lucide-react'

/**
 * 贝叶斯网络可视化组件
 * 展示疾病-症状的概率关系网络
 */
function BayesianNetworkViz({ onClose, symptoms = {} }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [posteriors, setPosteriors] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef(null)

  // 贝叶斯网络节点定义
  const nodes = {
    // 疾病节点（顶层）
    h1n1: { 
      id: 'h1n1', 
      label: '甲流(H1N1)', 
      type: 'disease',
      x: 300, y: 60,
      color: '#ef4444',
      prior: 0.05,
      description: '甲型流感病毒引起的急性呼吸道传染病'
    },
    flu: { 
      id: 'flu', 
      label: '普通流感', 
      type: 'disease',
      x: 500, y: 60,
      color: '#f97316',
      prior: 0.10,
      description: '季节性流感病毒引起的呼吸道感染'
    },
    // 症状节点（底层）
    fever: { 
      id: 'fever', 
      label: '发热', 
      type: 'symptom',
      x: 100, y: 220,
      color: '#ec4899',
      cpt: { h1n1: 0.95, flu: 0.85, none: 0.10 }
    },
    cough: { 
      id: 'cough', 
      label: '咳嗽', 
      type: 'symptom',
      x: 220, y: 220,
      color: '#8b5cf6',
      cpt: { h1n1: 0.80, flu: 0.75, none: 0.15 }
    },
    muscle_pain: { 
      id: 'muscle_pain', 
      label: '肌肉酸痛', 
      type: 'symptom',
      x: 340, y: 220,
      color: '#6366f1',
      cpt: { h1n1: 0.85, flu: 0.50, none: 0.05 }
    },
    headache: { 
      id: 'headache', 
      label: '头痛', 
      type: 'symptom',
      x: 460, y: 220,
      color: '#0ea5e9',
      cpt: { h1n1: 0.70, flu: 0.60, none: 0.10 }
    },
    fatigue: { 
      id: 'fatigue', 
      label: '乏力', 
      type: 'symptom',
      x: 580, y: 220,
      color: '#14b8a6',
      cpt: { h1n1: 0.80, flu: 0.70, none: 0.20 }
    },
    sore_throat: { 
      id: 'sore_throat', 
      label: '喉咙痛', 
      type: 'symptom',
      x: 700, y: 220,
      color: '#22c55e',
      cpt: { h1n1: 0.50, flu: 0.65, none: 0.15 }
    }
  }

  // 边定义（疾病 -> 症状）
  const edges = [
    { from: 'h1n1', to: 'fever' },
    { from: 'h1n1', to: 'cough' },
    { from: 'h1n1', to: 'muscle_pain' },
    { from: 'h1n1', to: 'headache' },
    { from: 'h1n1', to: 'fatigue' },
    { from: 'flu', to: 'fever' },
    { from: 'flu', to: 'cough' },
    { from: 'flu', to: 'muscle_pain' },
    { from: 'flu', to: 'headache' },
    { from: 'flu', to: 'fatigue' },
    { from: 'flu', to: 'sore_throat' }
  ]

  // 获取贝叶斯推理结果
  useEffect(() => {
    if (Object.keys(symptoms).length > 0) {
      fetchPosteriors()
    }
  }, [symptoms])

  const fetchPosteriors = async () => {
    setIsLoading(true)
    try {
      const data = await diagnosisService.diagnose(symptoms)
      if (data.success) {
        setPosteriors(data.result)
      }
    } catch (error) {
      console.error('获取贝叶斯推理结果失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 检查症状是否激活
  const isSymptomActive = (symptomId) => {
    return symptoms[symptomId] && symptoms[symptomId] !== false
  }

  // 获取节点显示的概率
  const getNodeProbability = (node) => {
    if (node.type === 'disease' && posteriors) {
      const bayesian = posteriors.bayesian_details || {}
      return bayesian[node.id]?.probability || node.prior
    }
    return node.prior
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 - 固定不滚动 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">贝叶斯网络可视化</h2>
                <p className="text-indigo-100 text-sm">P(疾病|症状) = P(症状|疾病) × P(疾病) / P(症状)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 网络图 - 可滚动区域 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative bg-slate-50 rounded-xl p-4" style={{ height: '320px' }}>
            {/* 绘制边 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge, i) => {
                const from = nodes[edge.from]
                const to = nodes[edge.to]
                const isActive = isSymptomActive(edge.to)
                return (
                  <line
                    key={i}
                    x1={from.x}
                    y1={from.y + 25}
                    x2={to.x}
                    y2={to.y - 25}
                    stroke={isActive ? from.color : '#cbd5e1'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? '' : '4'}
                    opacity={isActive ? 1 : 0.5}
                  />
                )
              })}
            </svg>

            {/* 绘制节点 */}
            {Object.values(nodes).map(node => {
              const isActive = node.type === 'symptom' ? isSymptomActive(node.id) : true
              const prob = getNodeProbability(node)
              
              return (
                <motion.div
                  key={node.id}
                  className={`absolute cursor-pointer transition-all ${
                    selectedNode?.id === node.id ? 'z-20' : 'z-10'
                  }`}
                  style={{ 
                    left: node.x - 45, 
                    top: node.y - 25,
                    opacity: isActive ? 1 : 0.5
                  }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div 
                    className={`px-3 py-2 rounded-xl text-white text-center shadow-lg ${
                      selectedNode?.id === node.id ? 'ring-4 ring-white' : ''
                    }`}
                    style={{ 
                      backgroundColor: node.color,
                      minWidth: '90px'
                    }}
                  >
                    <div className="text-xs font-medium">{node.label}</div>
                    {node.type === 'disease' && posteriors && (
                      <div className="text-lg font-bold">
                        {(prob * 100).toFixed(1)}%
                      </div>
                    )}
                    {node.type === 'symptom' && isActive && (
                      <div className="text-xs mt-0.5">✓ 存在</div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {/* 图例 */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-6 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>疾病节点</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-indigo-500" />
                <span>症状节点</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-0.5 bg-slate-400" style={{ borderStyle: 'dashed' }} />
                <span>条件依赖</span>
              </div>
            </div>
          </div>

          {/* 节点详情 */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-slate-100 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: selectedNode.color }}
                      />
                      {selectedNode.label}
                      <span className="ml-2 text-xs px-2 py-0.5 bg-slate-200 rounded">
                        {selectedNode.type === 'disease' ? '疾病' : '症状'}
                      </span>
                    </h4>
                    {selectedNode.description && (
                      <p className="text-sm text-slate-500 mt-1">{selectedNode.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 条件概率表 */}
                {selectedNode.cpt && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-slate-600 mb-2">
                      条件概率 P({selectedNode.label}|疾病)
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg text-center">
                        <div className="text-xs text-slate-400">P(症状|甲流)</div>
                        <div className="text-lg font-bold text-red-500">
                          {(selectedNode.cpt.h1n1 * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg text-center">
                        <div className="text-xs text-slate-400">P(症状|普通流感)</div>
                        <div className="text-lg font-bold text-orange-500">
                          {(selectedNode.cpt.flu * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg text-center">
                        <div className="text-xs text-slate-400">P(症状|无病)</div>
                        <div className="text-lg font-bold text-green-500">
                          {(selectedNode.cpt.none * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 先验概率 */}
                {selectedNode.type === 'disease' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg">
                      <div className="text-xs text-slate-400">先验概率 P(疾病)</div>
                      <div className="text-lg font-bold" style={{ color: selectedNode.color }}>
                        {(selectedNode.prior * 100).toFixed(1)}%
                      </div>
                    </div>
                    {posteriors && (
                      <div className="bg-white p-2 rounded-lg">
                        <div className="text-xs text-slate-400">后验概率 P(疾病|症状)</div>
                        <div className="text-lg font-bold" style={{ color: selectedNode.color }}>
                          {((posteriors.bayesian_details?.[selectedNode.id]?.probability || selectedNode.prior) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 贝叶斯公式说明 */}
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
            <h4 className="font-medium text-indigo-800 flex items-center mb-2">
              <Info className="w-4 h-4 mr-2" />
              贝叶斯定理
            </h4>
            <div className="text-center py-2">
              <span className="font-mono text-lg text-indigo-700">
                P(D|S) = P(S|D) × P(D) / P(S)
              </span>
            </div>
            <div className="text-sm text-indigo-600 space-y-1">
              <p>• <strong>P(D|S)</strong>：给定症状 S 时，患疾病 D 的后验概率</p>
              <p>• <strong>P(S|D)</strong>：患疾病 D 时，出现症状 S 的似然度</p>
              <p>• <strong>P(D)</strong>：疾病 D 的先验概率（人群患病率）</p>
              <p>• <strong>P(S)</strong>：症状 S 的边缘概率</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BayesianNetworkViz

