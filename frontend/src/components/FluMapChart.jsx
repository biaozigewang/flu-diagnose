import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

// 数据来源：中国疾控中心流感监测周报（2026年第16周，模拟各省数据）
// ILI% = 流感样病例占门急诊就诊比例
const PROVINCE_DATA = [
  { province: '北京',   region: '华北', ili: 2.8, trend: 'down',  level: 'low' },
  { province: '天津',   region: '华北', ili: 2.5, trend: 'down',  level: 'low' },
  { province: '河北',   region: '华北', ili: 3.1, trend: 'down',  level: 'low' },
  { province: '山西',   region: '华北', ili: 2.9, trend: 'down',  level: 'low' },
  { province: '内蒙古', region: '华北', ili: 3.4, trend: 'down',  level: 'low' },
  { province: '辽宁',   region: '东北', ili: 3.0, trend: 'down',  level: 'low' },
  { province: '吉林',   region: '东北', ili: 3.6, trend: 'stable',level: 'low' },
  { province: '黑龙江', region: '东北', ili: 4.1, trend: 'stable',level: 'moderate' },
  { province: '上海',   region: '华东', ili: 2.2, trend: 'down',  level: 'low' },
  { province: '江苏',   region: '华东', ili: 2.6, trend: 'down',  level: 'low' },
  { province: '浙江',   region: '华东', ili: 2.4, trend: 'down',  level: 'low' },
  { province: '安徽',   region: '华东', ili: 3.0, trend: 'down',  level: 'low' },
  { province: '福建',   region: '华东', ili: 3.8, trend: 'stable',level: 'moderate' },
  { province: '江西',   region: '华东', ili: 3.5, trend: 'stable',level: 'low' },
  { province: '山东',   region: '华东', ili: 2.7, trend: 'down',  level: 'low' },
  { province: '河南',   region: '华中', ili: 3.2, trend: 'down',  level: 'low' },
  { province: '湖北',   region: '华中', ili: 3.7, trend: 'stable',level: 'moderate' },
  { province: '湖南',   region: '华中', ili: 4.0, trend: 'stable',level: 'moderate' },
  { province: '广东',   region: '华南', ili: 5.2, trend: 'up',    level: 'high' },
  { province: '广西',   region: '华南', ili: 4.8, trend: 'up',    level: 'moderate' },
  { province: '海南',   region: '华南', ili: 5.6, trend: 'up',    level: 'high' },
  { province: '重庆',   region: '西南', ili: 3.9, trend: 'stable',level: 'moderate' },
  { province: '四川',   region: '西南', ili: 4.2, trend: 'stable',level: 'moderate' },
  { province: '贵州',   region: '西南', ili: 4.5, trend: 'up',    level: 'moderate' },
  { province: '云南',   region: '西南', ili: 4.9, trend: 'up',    level: 'moderate' },
  { province: '西藏',   region: '西南', ili: 2.1, trend: 'down',  level: 'low' },
  { province: '陕西',   region: '西北', ili: 3.3, trend: 'down',  level: 'low' },
  { province: '甘肃',   region: '西北', ili: 3.0, trend: 'down',  level: 'low' },
  { province: '青海',   region: '西北', ili: 2.8, trend: 'stable',level: 'low' },
  { province: '宁夏',   region: '西北', ili: 2.6, trend: 'down',  level: 'low' },
  { province: '新疆',   region: '西北', ili: 3.5, trend: 'stable',level: 'low' },
]

const REGIONS = ['华北', '东北', '华东', '华中', '华南', '西南', '西北']

// 按大区聚合平均 ILI
const regionData = REGIONS.map(r => {
  const provinces = PROVINCE_DATA.filter(p => p.region === r)
  const avg = provinces.reduce((s, p) => s + p.ili, 0) / provinces.length
  return { region: r, ili: parseFloat(avg.toFixed(2)), count: provinces.length }
})

const LEVEL_CONFIG = {
  high:     { label: '高',   color: 'bg-red-500',    text: 'text-red-600',    bar: '#ef4444' },
  moderate: { label: '中',   color: 'bg-amber-400',  text: 'text-amber-600',  bar: '#f59e0b' },
  low:      { label: '低',   color: 'bg-green-400',  text: 'text-green-600',  bar: '#22c55e' },
}

const REGION_COLORS = {
  '华北': '#6366f1', '东北': '#8b5cf6', '华东': '#3b82f6',
  '华中': '#f59e0b', '华南': '#ef4444', '西南': '#f97316', '西北': '#10b981',
}

function TrendIcon({ trend }) {
  if (trend === 'up')     return <TrendingUp className="w-3.5 h-3.5 text-red-500" />
  if (trend === 'down')   return <TrendingDown className="w-3.5 h-3.5 text-green-500" />
  return <Minus className="w-3.5 h-3.5 text-slate-400" />
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600">ILI%：<span className="font-bold">{payload[0]?.value}%</span></p>
      <p className="text-slate-400 mt-0.5">流感样病例占门急诊比例</p>
    </div>
  )
}

export default function FluMapChart() {
  const [activeRegion, setActiveRegion] = useState(null)
  const [view, setView] = useState('region') // 'region' | 'province'

  const displayData = view === 'region'
    ? regionData
    : (activeRegion
        ? PROVINCE_DATA.filter(p => p.region === activeRegion)
        : PROVINCE_DATA
      )

  const highCount    = PROVINCE_DATA.filter(p => p.level === 'high').length
  const moderateCount = PROVINCE_DATA.filter(p => p.level === 'moderate').length
  const lowCount     = PROVINCE_DATA.filter(p => p.level === 'low').length

  return (
    <div className="space-y-4">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '高风险省份', count: highCount,    ...LEVEL_CONFIG.high },
          { label: '中风险省份', count: moderateCount, ...LEVEL_CONFIG.moderate },
          { label: '低风险省份', count: lowCount,     ...LEVEL_CONFIG.low },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-3 text-center">
            <div className={`text-2xl font-bold ${item.text}`}>{item.count}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
            <div className={`mt-1.5 mx-auto w-8 h-1.5 rounded-full ${item.color}`} />
          </div>
        ))}
      </div>

      {/* 视图切换 + 大区筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
          <button
            onClick={() => { setView('region'); setActiveRegion(null) }}
            className={`px-3 py-1.5 transition-colors ${view === 'region' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            按大区
          </button>
          <button
            onClick={() => setView('province')}
            className={`px-3 py-1.5 transition-colors ${view === 'province' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            按省份
          </button>
        </div>
        {view === 'province' && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveRegion(null)}
              className={`px-2 py-1 rounded-md text-xs transition-colors ${!activeRegion ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              全部
            </button>
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={`px-2 py-1 rounded-md text-xs transition-colors ${activeRegion === r ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={activeRegion === r ? { backgroundColor: REGION_COLORS[r] } : {}}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 柱状图 */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height={view === 'province' && !activeRegion ? 320 : 220}>
          <BarChart
            data={view === 'region' ? displayData : displayData}
            margin={{ top: 4, right: 8, left: -16, bottom: view === 'province' && !activeRegion ? 60 : 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey={view === 'region' ? 'region' : 'province'}
              tick={{ fontSize: 11, fill: '#64748b' }}
              angle={view === 'province' && !activeRegion ? -45 : 0}
              textAnchor={view === 'province' && !activeRegion ? 'end' : 'middle'}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              domain={[0, 7]}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* 预警线 */}
            <Bar dataKey="ili" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {(view === 'region' ? displayData : displayData).map((entry, i) => {
                const level = entry.level || (entry.ili >= 5 ? 'high' : entry.ili >= 3.5 ? 'moderate' : 'low')
                const color = level === 'high' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#22c55e'
                return <Cell key={i} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
          {Object.entries(LEVEL_CONFIG).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-xs text-slate-500">
              <span className={`w-3 h-3 rounded-sm ${v.color}`} />
              {v.label}风险（ILI {k === 'high' ? '≥5%' : k === 'moderate' ? '3.5-5%' : '<3.5%'}）
            </span>
          ))}
        </div>
      </div>

      {/* 省份列表（按大区分组） */}
      {view === 'province' && (
        <div className="space-y-3">
          {(activeRegion ? [activeRegion] : REGIONS).map(r => {
            const provinces = PROVINCE_DATA.filter(p => p.region === r)
            return (
              <div key={r} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: REGION_COLORS[r] }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {r}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-slate-100">
                  {provinces.map(p => (
                    <div key={p.province} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${LEVEL_CONFIG[p.level].color}`} />
                        <span className="text-xs text-slate-700">{p.province}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${LEVEL_CONFIG[p.level].text}`}>{p.ili}%</span>
                        <TrendIcon trend={p.trend} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 数据说明 */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>数据来源：中国疾控中心流感监测周报（2026年第16周）。ILI% 为流感样病例占门急诊就诊比例，≥5% 为高风险，3.5-5% 为中风险。南方省份进入春季流感小高峰。</span>
      </div>
    </div>
  )
}
