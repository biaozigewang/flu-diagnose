import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Loader2, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import { diagnosisService } from '../../services/api'

// 充血程度标签
const CONGESTION_LABELS = ['正常', '轻度充血', '中度充血', '重度充血']
const SEVERITY_MAP = {
  normal:   { label: '正常',   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  mild:     { label: '轻度异常', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  moderate: { label: '中度异常', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  severe:   { label: '重度异常', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' }
}

function ThroatImageAnalysis({ onSymptomsExtracted }) {
  const [image, setImage] = useState(null)       // base64
  const [preview, setPreview] = useState(null)   // 预览 URL
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB')
      return
    }

    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setImage(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) return
    setIsAnalyzing(true)
    setError(null)

    const res = await diagnosisService.analyzeImage(image)

    if (res.success) {
      setResult(res)
      // 回调：把提取到的症状传给父组件
      if (res.image_symptoms && Object.keys(res.image_symptoms).length > 0) {
        onSymptomsExtracted?.(res.image_symptoms, res.summary)
      }
    } else {
      setError(res.error || '分析失败，请重试')
    }
    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const severity = result?.summary?.severity
  const severityInfo = SEVERITY_MAP[severity] || SEVERITY_MAP.normal
  const vision = result?.vision_result

  return (
    <div className="card space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">咽喉图像辅助分析</h3>
          <p className="text-xs text-slate-400">上传咽喉照片，AI 自动分析体征</p>
        </div>
      </div>

      {/* 上传区 */}
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500">点击上传咽喉照片</p>
          <p className="text-xs text-slate-400 mt-1">支持 JPG / PNG，拍摄时保持光线充足</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="咽喉照片"
            className="w-full rounded-xl object-cover max-h-48"
          />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 分析按钮 */}
      {preview && !result && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 分析中...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              开始分析
            </>
          )}
        </button>
      )}

      {/* 分析结果 */}
      <AnimatePresence>
        {result && vision && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* 总体评估 */}
            <div className={`rounded-xl p-3 border ${severityInfo.bg} ${severityInfo.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${severityInfo.color}`}>
                  {severityInfo.label}
                </span>
                <span className="text-xs text-slate-500">
                  流感相关度 {((result.summary.flu_relevance || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-600">{result.summary.findings}</p>
            </div>

            {/* 体征指标 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: '咽部充血',
                  value: CONGESTION_LABELS[vision.pharyngeal_congestion ?? 0],
                  warn: (vision.pharyngeal_congestion ?? 0) >= 2
                },
                {
                  label: '扁桃体',
                  value: vision.tonsil_swelling >= 2 ? '肿大' : vision.tonsil_swelling === 1 ? '轻度肿大' : '正常',
                  warn: vision.tonsil_swelling >= 2
                },
                {
                  label: '脓性分泌物',
                  value: vision.purulent_discharge ? '存在' : '无',
                  warn: vision.purulent_discharge
                },
                {
                  label: '黏膜水肿',
                  value: vision.mucosal_edema ? '存在' : '无',
                  warn: vision.mucosal_edema
                }
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`text-xs font-medium ${item.warn ? 'text-orange-600' : 'text-slate-700'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 已提取症状 */}
            {Object.keys(result.image_symptoms || {}).length > 0 && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-green-700">已自动提取到症状特征</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {Object.keys(result.image_symptoms).map(k => ({
                      sore_throat: '喉咙痛'
                    }[k] || k)).join('、')}
                    ，已合并至诊断
                  </p>
                </div>
              </div>
            )}

            {/* 重新分析 */}
            <button
              onClick={handleReset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              重新上传
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 使用提示 */}
      {!preview && (
        <div className="text-xs text-slate-400 space-y-1">
          <p>• 张嘴对准摄像头，手电筒补光后拍摄</p>
          <p>• 尽量对焦清晰，完整呈现咽喉部位</p>
          <p>• 分析结果仅供参考，不替代医生诊断</p>
        </div>
      )}
    </div>
  )
}

export default ThroatImageAnalysis
