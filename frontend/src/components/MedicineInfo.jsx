import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pill, Thermometer, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react'

const medicines = [
  {
    name: '奥司他韦（达菲）',
    type: 'antiviral',
    tag: '抗病毒特效药',
    tagColor: 'bg-red-100 text-red-700',
    icon: '💊',
    usage: [
      { label: '成人剂量', value: '75mg，每日2次，连服5天' },
      { label: '儿童剂量', value: '按体重计算，≥13kg：30mg；≥23kg：45mg；≥40kg：60mg；>40kg：75mg，每日2次' },
      { label: '最佳时机', value: '发病48小时内服用效果最佳，越早越好' },
      { label: '注意事项', value: '需凭处方购买，肾功能不全者需调整剂量，可能引起恶心（随餐服用可减轻）' },
    ],
    warning: '需医生处方，请勿自行购买给儿童服用，务必遵医嘱。',
  },
  {
    name: '对乙酰氨基酚（泰诺林）',
    type: 'antipyretic',
    tag: '退烧止痛',
    tagColor: 'bg-blue-100 text-blue-700',
    icon: '🌡️',
    usage: [
      { label: '成人剂量', value: '500mg-1000mg/次，每4-6小时一次，每日不超过4g' },
      { label: '儿童剂量', value: '10-15mg/kg/次，每4-6小时一次' },
      { label: '适用情况', value: '体温≥38.5°C 或伴有明显不适时使用' },
      { label: '注意事项', value: '肝功能不全者慎用，避免与含同成分复方药同服，禁止饮酒' },
    ],
    warning: '严格按剂量服用，过量可导致肝损伤。',
  },
  {
    name: '布洛芬（美林/芬必得）',
    type: 'antipyretic',
    tag: '退烧止痛消炎',
    tagColor: 'bg-orange-100 text-orange-700',
    icon: '💉',
    usage: [
      { label: '成人剂量', value: '400mg/次，每6-8小时一次，每日不超过1200mg' },
      { label: '儿童剂量', value: '5-10mg/kg/次，每6-8小时一次（6月龄以上）' },
      { label: '适用情况', value: '退热、缓解肌肉酸痛、头痛效果较好' },
      { label: '注意事项', value: '胃溃疡、肾功能不全者慎用，随餐服用，6月龄以下婴儿禁用' },
    ],
    warning: '不建议与对乙酰氨基酚同时服用，两者可交替使用。',
  },
  {
    name: '注意事项',
    type: 'tips',
    tag: '用药提醒',
    tagColor: 'bg-amber-100 text-amber-700',
    icon: '⚠️',
    usage: [
      { label: '退烧药选择', value: '成人两者均可；儿童优先布洛芬（≥6月龄）或对乙酰氨基酚（≥3月龄）' },
      { label: '交替使用', value: '高热不退时可每3-4小时交替使用两种退烧药，但需注意间隔' },
      { label: '禁用阿司匹林', value: '18岁以下儿童和青少年流感期间禁用阿司匹林（可能引起瑞氏综合征）' },
      { label: '就医指征', value: '体温>40°C、退烧药无效、出现呼吸困难、意识改变，立即就医' },
    ],
    warning: null,
  },
]

function MedicineCard({ med }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{med.icon}</span>
          <div>
            <p className="font-medium text-slate-800 text-sm">{med.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${med.tagColor}`}>{med.tag}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
              {med.usage.map(u => (
                <div key={u.label} className="flex gap-2 text-xs">
                  <span className="text-slate-500 w-20 flex-shrink-0">{u.label}</span>
                  <span className="text-slate-700">{u.value}</span>
                </div>
              ))}
              {med.warning && (
                <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {med.warning}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MedicineInfo({ onClose }) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">常用药物参考</h2>
                <p className="text-xs text-slate-400">甲流相关用药信息，仅供参考</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              以下信息仅供参考，具体用药请遵医嘱，处方药需凭处方购买。
            </div>
            {medicines.map(med => <MedicineCard key={med.name} med={med} />)}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
