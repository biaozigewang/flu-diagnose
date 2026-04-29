import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export default function DisclaimerModal({ onAccept }) {
  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        >
          {/* 头部 */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">使用须知与免责声明</h2>
                <p className="text-xs text-slate-400">请仔细阅读后继续使用</p>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-4 text-sm text-slate-600 max-h-72 overflow-y-auto">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
              ⚠️ 本系统仅供健康参考，<strong>不能替代专业医疗诊断</strong>。如有不适，请及时就医。
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-slate-700 mb-1">📋 关于本系统</p>
                <p className="text-xs leading-relaxed text-slate-500">
                  流感哨兵是基于人工智能的甲流自检辅助工具，通过症状分析提供参考性诊断建议，
                  采用模糊推理引擎和贝叶斯网络进行概率计算。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-1">⚕️ 医疗免责</p>
                <ul className="text-xs leading-relaxed text-slate-500 space-y-1">
                  <li>• 本系统输出结果<strong>不构成医疗诊断意见</strong></li>
                  <li>• 诊断结果仅供参考，确诊需依赖专业检测（抗原/核酸）</li>
                  <li>• 如出现高热、呼吸困难等严重症状，请立即就医</li>
                  <li>• 本系统不对因参考本结果产生的后果承担责任</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-1">🔒 隐私说明</p>
                <p className="text-xs leading-relaxed text-slate-500">
                  您的症状数据仅存储在本地数据库，不会上传至第三方服务器，
                  咽喉图像分析通过加密传输处理后不做留存。
                </p>
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="p-6 pt-4 border-t border-slate-100">
            <button
              onClick={onAccept}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              我已阅读并同意，继续使用
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              继续使用即表示您已知晓并接受以上条款
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
