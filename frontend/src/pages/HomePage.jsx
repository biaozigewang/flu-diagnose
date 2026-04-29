import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Brain,
  Activity,
  ArrowRight,
  Thermometer,
  Stethoscope,
  Route,
  Sparkles,
  GitCompare,
  Database,
  BarChart3,
  ChevronRight,
  Shield,
  Syringe,
  Hand,
  Wind,
  AlertTriangle,
  Users,
  TrendingUp,
  AlertCircle,
  MapPin,
  Pill
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import MedicineInfo from '../components/MedicineInfo'

// 流感流行趋势数据（基于中国疾控中心2025-2026流感季公开周报）
const fluTrendData = [
  { week: '25年40周', ili: 1.9, h1n1: 1.0 },
  { week: '25年42周', ili: 2.3, h1n1: 1.3 },
  { week: '25年44周', ili: 3.0, h1n1: 1.9 },
  { week: '25年46周', ili: 4.5, h1n1: 3.1 },
  { week: '25年48周', ili: 6.2, h1n1: 4.4 },
  { week: '25年50周', ili: 8.1, h1n1: 6.0 },
  { week: '25年52周', ili: 10.4, h1n1: 7.9 },
  { week: '26年第2周', ili: 12.1, h1n1: 9.3 },
  { week: '26年第4周', ili: 11.3, h1n1: 8.6 },
  { week: '26年第6周', ili: 9.0, h1n1: 6.8 },
  { week: '26年第8周', ili: 6.7, h1n1: 4.9 },
  { week: '26年第10周', ili: 4.8, h1n1: 3.3 },
  { week: '26年第12周', ili: 3.5, h1n1: 2.3 },
  { week: '26年第14周', ili: 2.9, h1n1: 1.8 },
  { week: '26年第16周', ili: 2.4, h1n1: 1.4 },
]

const fluStats = [
  {
    label: '本季 ILI% 峰值',
    value: '12.1%',
    desc: '2026年第2周达到峰值，超预警线',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    icon: TrendingUp,
  },
  {
    label: '甲流（H1N1）峰值占比',
    value: '9.3%',
    desc: '峰值期甲流为主要流行株',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: AlertCircle,
  },
  {
    label: '当前流行强度',
    value: '下降期',
    desc: '2026年第16周已回落至基线水平',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    icon: Activity,
  },
]

const healthTips = [
  {
    icon: Syringe,
    title: '接种疫苗',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    points: [
      '每年接种流感疫苗是最有效的预防手段',
      '建议在流感季节前（9-11月）接种',
      '老人、儿童、孕妇、慢性病患者优先接种',
      '接种后约2周产生保护性抗体',
    ]
  },
  {
    icon: Shield,
    title: '日常防护',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    points: [
      '勤洗手，用肥皂或洗手液搓洗20秒以上',
      '咳嗽或打喷嚏时用纸巾或肘部遮挡',
      '流感季节避免前往人员密集场所',
      '保持室内通风，定期开窗换气',
    ]
  },
  {
    icon: AlertTriangle,
    title: '甲流症状识别',
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    points: [
      '急性起病，体温迅速升至38°C以上',
      '全身肌肉酸痛、乏力明显（重于普通感冒）',
      '可伴有咳嗽、咽痛、鼻塞、头痛',
      '部分患者出现呕吐、腹泻（儿童多见）',
    ]
  },
  {
    icon: Users,
    title: '高风险人群',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    points: [
      '5岁以下儿童及65岁以上老年人',
      '孕妇及产后2周内的产妇',
      '患有慢性病（心脏病、糖尿病、哮喘等）',
      '免疫功能低下者（如长期服用激素）',
    ]
  },
]

function HomePage() {
  const featureStages = [
    {
      stage: '输入层',
      stageIcon: '📥',
      stageColor: 'from-blue-500 to-cyan-500',
      features: [
        {
          icon: MessageSquare,
          title: '自然语言交互',
          description: 'jieba分词+智能症状提取',
          color: 'from-blue-500 to-cyan-500'
        },
        {
          icon: Sparkles,
          title: 'LLM增强',
          description: 'DeepSeek大模型理解',
          color: 'from-amber-500 to-orange-500'
        }
      ]
    },
    {
      stage: '推理层',
      stageIcon: '🧠',
      stageColor: 'from-purple-500 to-pink-500',
      features: [
        {
          icon: Brain,
          title: '模糊推理引擎',
          description: '产生式规则+置信度融合',
          color: 'from-purple-500 to-pink-500'
        },
        {
          icon: BarChart3,
          title: '贝叶斯网络',
          description: 'P(疾病|症状)概率推理',
          color: 'from-indigo-500 to-purple-500'
        }
      ]
    },
    {
      stage: '优化层',
      stageIcon: '⚡',
      stageColor: 'from-emerald-500 to-teal-500',
      features: [
        {
          icon: Route,
          title: 'A*智能问诊',
          description: '最优路径规划问诊',
          color: 'from-violet-500 to-purple-500'
        },
        {
          icon: GitCompare,
          title: '交叉验证',
          description: '双引擎结果互补验证',
          color: 'from-emerald-500 to-teal-500'
        }
      ]
    },
    {
      stage: '输出层',
      stageIcon: '📤',
      stageColor: 'from-rose-500 to-pink-500',
      features: [
        {
          icon: Activity,
          title: '推理可视化',
          description: '规则触发+网络图展示',
          color: 'from-rose-500 to-pink-500'
        },
        {
          icon: Database,
          title: '数据持久化',
          description: 'SQLite存储诊断历史',
          color: 'from-slate-500 to-gray-500'
        }
      ]
    }
  ]

  const symptoms = [
    { name: '发热', icon: Thermometer },
    { name: '咳嗽', icon: Activity },
    { name: '肌肉酸痛', icon: Stethoscope },
    { name: '头痛', icon: Brain },
  ]

  const [showMedicine, setShowMedicine] = useState(false)

  return (
    <div className="min-h-screen">
      {showMedicine && <MedicineInfo onClose={() => setShowMedicine(false)} />}
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                🏥 AI 智能辅助诊断
              </span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6">
                流感哨兵
                <span className="bg-gradient-to-r from-primary-600 to-cyan-500 bg-clip-text text-transparent">
                  智能自检
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                描述您的症状，AI 结合产生式规则、模糊推理和贝叶斯网络，
                快速评估您是否可能感染甲型流感，并给出就医建议
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/diagnosis" className="btn-primary flex items-center space-x-2">
                  <span>立即自检</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/history" className="btn-secondary">
                  查看历史记录
                </Link>
              </div>
            </motion.div>

            {/* Floating symptoms */}
            <motion.div 
              className="flex justify-center gap-4 mt-12 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {symptoms.map((symptom, index) => (
                <motion.div
                  key={symptom.name}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <symptom.icon className="w-4 h-4 text-primary-500" />
                  <span className="text-slate-700">{symptom.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">核心技术特性</h2>
            <p className="text-slate-500">数据流向：从用户输入到诊断输出的完整处理链路</p>
          </div>

          {/* 阶段标题行 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-6">
            {featureStages.map((stage, stageIndex) => (
              <motion.div
                key={stage.stage}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: stageIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <span className="text-5xl">{stage.stageIcon}</span>
                <h3 className={`text-lg font-bold mt-2 bg-gradient-to-r ${stage.stageColor} bg-clip-text text-transparent`}>
                  {stage.stage}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* 卡片+箭头行 */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
            {featureStages.map((stage, stageIndex) => (
              <React.Fragment key={stage.stage}>
                {/* 阶段内的特性卡片 */}
                <motion.div
                  className="flex-1 min-w-0 w-full lg:w-auto space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: stageIndex * 0.15 }}
                  viewport={{ once: true }}
                >
                  {stage.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature.title}
                      className="card hover:shadow-xl transition-shadow duration-300 p-6"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: stageIndex * 0.15 + featureIndex * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <feature.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-slate-800">{feature.title}</h4>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* 阶段之间的箭头 - 垂直居中于卡片区域 */}
                {stageIndex < featureStages.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center px-2 self-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: stageIndex * 0.15 + 0.2 }}
                      viewport={{ once: true }}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center shadow-lg"
                    >
                      <ChevronRight className="w-7 h-7 text-slate-500" />
                    </motion.div>
                  </div>
                )}

                {/* 移动端箭头 */}
                {stageIndex < featureStages.length - 1 && (
                  <div className="flex lg:hidden items-center justify-center py-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: stageIndex * 0.15 + 0.2 }}
                      viewport={{ once: true }}
                      className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center rotate-90"
                    >
                      <ChevronRight className="w-6 h-6 text-slate-400" />
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 流感流行趋势 Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">流感流行趋势</h2>
            <p className="text-slate-500">基于中国疾控中心公开周报数据（2025-2026流感季）</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 趋势折线图 */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">流感样病例就诊比例（ILI%）</h3>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">数据截至 2026年第16周（4月）</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={fluTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                  <Tooltip
                    formatter={(v, name) => [`${v}%`, name === 'ili' ? 'ILI%' : '甲流占比']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <ReferenceLine y={5} stroke="#f97316" strokeDasharray="4 4"
                    label={{ value: '预警线 5%', fontSize: 9, fill: '#f97316', position: 'right' }} />
                  <Line type="monotone" dataKey="ili" name="ili" stroke="#6366f1" strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="h1n1" name="h1n1" stroke="#ef4444" strokeWidth={2}
                    strokeDasharray="4 4" dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block" /> 流感样病例比例</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block border-dashed" /> 甲流（H1N1）占比</span>
              </div>
            </div>

            {/* 右侧统计卡片 */}
            <div className="space-y-4">
              {fluStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className={`card ${stat.bg} border ${stat.border}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
                </motion.div>
              ))}
              <p className="text-xs text-slate-400 text-center pt-2">
                数据来源：中国疾控中心流感监测周报
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 健康科普 Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">甲流健康科普</h2>
            <p className="text-slate-500">了解甲流，做好预防，保护自己和家人</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {healthTips.map((tip, index) => (
              <motion.div
                key={tip.title}
                className={`card ${tip.bg} border ${tip.border} hover:shadow-xl transition-shadow duration-300`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <tip.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-3">{tip.title}</h3>
                <ul className="space-y-2">
                  {tip.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          {/* 药物信息入口 */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowMedicine(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-all bg-white shadow-sm"
            >
              <Pill className="w-4 h-4" />
              查看常用药物参考（奥司他韦、退烧药）
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">感觉不舒服？马上自检一下</h2>
          <Link 
            to="/diagnosis" 
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            <span>开始自检</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-800 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 流感哨兵 · 甲流智能自检系统 · 结果仅供参考，不替代医生诊断</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage

