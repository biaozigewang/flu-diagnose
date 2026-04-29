import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  History,
  Calendar,
  Activity,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  FileText,
  TrendingUp,
  GitCompare,
  X,
  CheckCircle2,
  Download,
  CheckCheck,
  XCircle
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { diagnosisService } from '../services/api'
import { HistorySkeleton } from '../components/Skeleton'

// CSV 导出工具
function exportToCSV(records) {
  const headers = ['ID', '时间', '诊断结果', '置信度', '风险等级', '贝叶斯概率', '用户反馈', '症状']
  const rows = records.map(r => [
    r.id,
    r.timestamp,
    r.diagnosis_text || r.diagnosis,
    (r.confidence * 100).toFixed(1) + '%',
    r.risk_level,
    r.bayesian_probability ? (r.bayesian_probability * 100).toFixed(1) + '%' : '',
    r.feedback === 'confirmed' ? '已确诊' : r.feedback === 'unconfirmed' ? '未确诊' : '未反馈',
    Object.entries(r.symptoms || {})
      .filter(([k, v]) => v && !k.startsWith('_'))
      .map(([k, v]) => `${SYMPTOM_LABELS[k] || k}:${typeof v === 'number' ? v : '有'}`)
      .join('|')
  ])
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `流感哨兵_自检记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const SYMPTOM_LABELS = {
  fever: '发热', cough: '咳嗽', muscle_pain: '肌肉酸痛',
  headache: '头痛', fatigue: '乏力', sore_throat: '喉咙痛',
  nasal_congestion: '鼻塞', diarrhea: '腹泻',
  breathing_difficulty: '呼吸困难', chills: '寒战',
  contact_history: '接触史', sudden_onset: '急性起病',
}

function ComparePanel({ records, onClose }) {
  const [a, b] = records
  const allKeys = Array.from(new Set([
    ...Object.keys(a.symptoms),
    ...Object.keys(b.symptoms)
  ])).filter(k => !k.startsWith('_') && SYMPTOM_LABELS[k])

  const radarData = allKeys.map(k => ({
    symptom: SYMPTOM_LABELS[k] || k,
    A: a.symptoms[k] ? (typeof a.symptoms[k] === 'number' ? Math.min(a.symptoms[k] / 42 * 100, 100) : 100) : 0,
    B: b.symptoms[k] ? (typeof b.symptoms[k] === 'number' ? Math.min(b.symptoms[k] / 42 * 100, 100) : 100) : 0,
  }))

  const riskColor = { high: 'text-red-600', moderate: 'text-amber-600', low: 'text-green-600', very_low: 'text-slate-500' }
  const riskLabel = { high: '高风险', moderate: '中风险', low: '低风险', very_low: '极低风险' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card border-2 border-primary-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary-500" />
          自检对比
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 两列对比 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[a, b].map((rec, i) => (
          <div key={rec.id} className={`p-3 rounded-xl border ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${i === 0 ? 'text-blue-600' : 'text-purple-600'}`}>
              {i === 0 ? '对比 A' : '对比 B'}
            </p>
            <p className="text-xs text-slate-500 mb-1">{rec.timestamp?.slice(0, 10)}</p>
            <p className="text-sm font-medium text-slate-800 mb-1">{rec.diagnosis}</p>
            <p className={`text-xs font-semibold ${riskColor[rec.risk_level]}`}>
              {riskLabel[rec.risk_level]} · {(rec.confidence * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>

      {/* 雷达图 */}
      {radarData.length >= 3 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">症状分布对比</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="symptom" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Radar name="A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="B" dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 症状逐项对比 */}
      <div className="space-y-1">
        <p className="text-xs text-slate-500 mb-2">症状逐项对比</p>
        {allKeys.map(k => {
          const va = a.symptoms[k], vb = b.symptoms[k]
          const label = SYMPTOM_LABELS[k] || k
          return (
            <div key={k} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
              <span className="text-slate-600 w-20 flex-shrink-0">{label}</span>
              <span className={`flex-1 text-center ${va ? 'text-blue-600 font-medium' : 'text-slate-300'}`}>
                {va ? (typeof va === 'number' ? `${va}°C` : '有') : '—'}
              </span>
              <span className={`flex-1 text-center ${vb ? 'text-purple-600 font-medium' : 'text-slate-300'}`}>
                {vb ? (typeof vb === 'number' ? `${vb}°C` : '有') : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function HistoryPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [compareIds, setCompareIds] = useState([])

  const handleFeedback = async (recordId, feedback) => {
    const res = await diagnosisService.updateFeedback(recordId, feedback)
    if (res.success) {
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, feedback } : r))
      if (selectedRecord?.id === recordId) setSelectedRecord(prev => ({ ...prev, feedback }))
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await diagnosisService.getHistory()
      if (response.success) {
        setRecords(response.history || [])
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
      setRecords([
        {
          id: 1,
          timestamp: '2024-12-28 10:30:00',
          symptoms: { fever: 38.5, cough: true, muscle_pain: true },
          diagnosis: '可能患有甲流',
          confidence: 0.85,
          risk_level: 'high'
        },
        {
          id: 2,
          timestamp: '2024-12-27 15:20:00',
          symptoms: { fever: 37.8, cough: true },
          diagnosis: '可能存在流感',
          confidence: 0.65,
          risk_level: 'moderate'
        },
        {
          id: 3,
          timestamp: '2024-12-26 09:15:00',
          symptoms: { headache: true, fatigue: true },
          diagnosis: '症状不典型',
          confidence: 0.35,
          risk_level: 'low'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, recordId) => {
    e.stopPropagation() // 阻止触发卡片点击
    if (!window.confirm('确定要删除这条记录吗？')) return
    
    try {
      const response = await diagnosisService.deleteHistory(recordId)
      if (response.success) {
        setRecords(prev => prev.filter(r => r.id !== recordId))
        if (selectedRecord?.id === recordId) {
          setSelectedRecord(null)
        }
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const getRiskBadge = (level) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      moderate: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-green-100 text-green-700 border-green-200',
      very_low: 'bg-slate-100 text-slate-600 border-slate-200'
    }
    const labels = {
      high: '高风险',
      moderate: '中风险',
      low: '低风险',
      very_low: '极低风险'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[level] || styles.low}`}>
        {labels[level] || level}
      </span>
    )
  }

  const formatSymptoms = (symptoms) => {
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
      chills: '寒战',
      '发热': '发热',
      '咳嗽': '咳嗽',
      '肌肉酸痛': '肌肉酸痛',
      '头痛': '头痛',
      '乏力': '乏力',
      '喉咙痛': '喉咙痛',
      '鼻塞': '鼻塞',
      '腹泻': '腹泻',
      '打喷嚏': '打喷嚏',
      '流鼻涕': '流鼻涕',
      '咽痛': '咽痛'
    }
    
    return Object.entries(symptoms)
      .filter(([_, value]) => value)
      .map(([key, value]) => {
        const name = symptomNames[key] || key
        if (typeof value === 'number') {
          return `${name} ${value}°C`
        }
        return name
      })
      .join('、')
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatSymptoms(record.symptoms).includes(searchTerm)
    
    const matchesFilter = filterRisk === 'all' || record.risk_level === filterRisk
    
    return matchesSearch && matchesFilter
  })

  if (loading) return <HistorySkeleton />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <History className="w-7 h-7 mr-3 text-primary-500" />
            诊断历史记录
          </h1>
          <p className="text-slate-600 mt-2">查看和管理您的历史诊断记录</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => exportToCSV(filteredRecords)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 CSV
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 记录列表 */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索诊断记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="input-field py-2"
                >
                  <option value="all">全部风险等级</option>
                  <option value="high">高风险</option>
                  <option value="moderate">中风险</option>
                  <option value="low">低风险</option>
                </select>
              </div>
            </div>

            {/* 记录列表 */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 mt-4">加载中...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无诊断记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedRecord?.id === record.id 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getRiskBadge(record.risk_level)}
                          <span className="text-sm text-slate-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {record.timestamp}
                          </span>
                        </div>
                        <h3 className="font-medium text-slate-800 mb-1">{record.diagnosis}</h3>
                        <p className="text-sm text-slate-500">
                          症状：{formatSymptoms(record.symptoms)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">置信度</p>
                          <p className="font-semibold text-primary-600">
                            {(record.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        {/* 对比勾选 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCompareIds(prev => {
                              if (prev.includes(record.id)) return prev.filter(id => id !== record.id)
                              if (prev.length >= 2) return [prev[1], record.id]
                              return [...prev, record.id]
                            })
                          }}
                          title="加入对比"
                          className={`p-1.5 rounded-lg transition-colors ${
                            compareIds.includes(record.id)
                              ? 'bg-primary-100 text-primary-600'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, record.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除记录"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 详情面板 */}
        <div className="space-y-6">
          {/* 对比面板 */}
          {compareIds.length === 2 ? (
            <ComparePanel
              records={records.filter(r => compareIds.includes(r.id))}
              onClose={() => setCompareIds([])}
            />
          ) : compareIds.length === 1 ? (
            <div className="card border border-dashed border-primary-300 bg-primary-50 text-center py-4">
              <GitCompare className="w-6 h-6 text-primary-400 mx-auto mb-1" />
              <p className="text-sm text-primary-600">再选一条记录进行对比</p>
              <button onClick={() => setCompareIds([])} className="text-xs text-slate-400 mt-1 hover:text-slate-600">取消</button>
            </div>
          ) : null}
          {selectedRecord ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <h3 className="font-semibold text-slate-800 mb-4">诊断详情</h3>

              {/* 确认反馈 */}
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2">事后确认（帮助提升系统准确性）</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback(selectedRecord.id, selectedRecord.feedback === 'confirmed' ? '' : 'confirmed')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-all ${
                      selectedRecord.feedback === 'confirmed'
                        ? 'bg-green-100 border-green-400 text-green-700 font-medium'
                        : 'border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    已确诊甲流
                  </button>
                  <button
                    onClick={() => handleFeedback(selectedRecord.id, selectedRecord.feedback === 'unconfirmed' ? '' : 'unconfirmed')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-all ${
                      selectedRecord.feedback === 'unconfirmed'
                        ? 'bg-red-100 border-red-400 text-red-700 font-medium'
                        : 'border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    未确诊
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">诊断时间</p>
                  <p className="text-slate-800">{selectedRecord.timestamp}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">诊断结论</p>
                  <p className="text-slate-800 font-medium">{selectedRecord.diagnosis}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">风险等级</p>
                  {getRiskBadge(selectedRecord.risk_level)}
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">置信度</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${selectedRecord.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-primary-600">
                      {(selectedRecord.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-2">症状列表</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedRecord.symptoms)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => (
                        <span 
                          key={key}
                          className="symptom-tag symptom-tag-active"
                        >
                          {key === 'fever' ? '发热' : 
                           key === 'cough' ? '咳嗽' :
                           key === 'muscle_pain' ? '肌肉酸痛' :
                           key === 'headache' ? '头痛' :
                           key === 'fatigue' ? '乏力' : key}
                          {typeof value === 'number' ? ` ${value}°C` : ''}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="card text-center py-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">选择一条记录查看详情</p>
            </div>
          )}

          {/* 统计概览 */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">统计概览</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{records.length}</p>
                <p className="text-xs text-slate-500">总自检次数</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {records.filter(r => r.risk_level === 'high').length}
                </p>
                <p className="text-xs text-slate-500">高风险次数</p>
              </div>
            </div>
          </div>

          {/* 置信度趋势图 */}
          {records.length >= 2 && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                置信度趋势
              </h3>
              <p className="text-xs text-slate-400 mb-4">近期自检风险变化</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={[...records].reverse().slice(-10).map((r, i) => ({
                    name: `第${i + 1}次`,
                    置信度: Math.round(r.confidence * 100),
                    risk: r.risk_level
                  }))}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, '置信度']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <ReferenceLine y={70} stroke="#f97316" strokeDasharray="4 4" label={{ value: '高风险线', fontSize: 9, fill: '#f97316' }} />
                  <Line
                    type="monotone"
                    dataKey="置信度"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage

