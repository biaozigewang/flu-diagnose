import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'

const rows = [
  { feature: '起病方式',    flu: '急性，数小时内',     cold: '缓慢，1-2天' },
  { feature: '发热程度',    flu: '高热 38-40°C',       cold: '低热或不发热' },
  { feature: '发热持续',    flu: '3-5天',              cold: '1-2天' },
  { feature: '全身症状',    flu: '严重（肌肉酸痛、乏力）', cold: '轻微' },
  { feature: '头痛',        flu: '明显',               cold: '轻微或无' },
  { feature: '肌肉酸痛',    flu: '明显，常见',         cold: '轻微或无' },
  { feature: '乏力',        flu: '严重，可持续2-3周',  cold: '轻微' },
  { feature: '鼻塞/流涕',   flu: '轻微',               cold: '明显，常见' },
  { feature: '咽痛',        flu: '可有',               cold: '常见' },
  { feature: '咳嗽',        flu: '干咳，可较重',       cold: '轻微' },
  { feature: '打喷嚏',      flu: '少见',               cold: '常见' },
  { feature: '并发症风险',  flu: '高（肺炎、心肌炎）', cold: '低' },
  { feature: '传染性',      flu: '强',                 cold: '中等' },
  { feature: '病程',        flu: '7-10天',             cold: '5-7天' },
  { feature: '特效药',      flu: '奥司他韦（达菲）',   cold: '无特效药' },
]

export default function DifferentialDiagnosis({ onClose }) {
  return (
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">鉴别诊断</h2>
              <p className="text-sm text-slate-500 mt-0.5">甲流 vs 普通感冒 症状对比</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 提示 */}
          <div className="mx-6 mt-4 flex-shrink-0 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>以下对比仅供参考，确诊需结合抗原/核酸检测，请及时就医。</span>
          </div>

          {/* 表格 */}
          <div className="flex-1 overflow-y-auto p-6">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium w-1/4">症状/特征</th>
                  <th className="py-2 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full font-semibold">甲流</span>
                  </th>
                  <th className="py-2 pl-4 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full font-semibold">普通感冒</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                    <td className="py-2.5 pr-4 text-slate-600 font-medium">{row.feature}</td>
                    <td className="py-2.5 px-4 text-center text-red-700">{row.flu}</td>
                    <td className="py-2.5 pl-4 text-center text-blue-700">{row.cold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
