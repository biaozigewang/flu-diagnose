import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'

const hospitals = [
  {
    name: '武汉大学中南医院',
    type: '三甲综合医院',
    address: '武汉市武昌区东湖路169号',
    phone: '027-67812911',
    hours: '发热门诊：24小时',
    distance: '约3.5km',
    tag: '发热门诊',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    name: '武汉市第八医院',
    type: '二甲综合医院',
    address: '武汉市武昌区紫阳路1号',
    phone: '027-88018888',
    hours: '发热门诊：全天',
    distance: '约4.2km',
    tag: '发热门诊',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    name: '华中农业大学校医院',
    type: '校级医疗机构',
    address: '武汉市洪山区狮子山街1号（校内）',
    phone: '027-87282120',
    hours: '门诊：周一至周五 8:00-17:00',
    distance: '校内',
    tag: '校医院',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: '武汉市第三医院光谷院区',
    type: '三甲综合医院',
    address: '武汉市洪山区关山大道216号',
    phone: '027-87990110',
    hours: '发热门诊：24小时',
    distance: '约5.8km',
    tag: '发热门诊',
    tagColor: 'bg-red-100 text-red-700',
  },
]

export default function NearbyHospitals() {
  const [locating, setLocating] = useState(false)

  const handleLocate = () => {
    setLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const url = `https://uri.amap.com/search?keyword=发热门诊&center=${longitude},${latitude}&radius=5000`
          window.open(url, '_blank')
          setLocating(false)
        },
        () => {
          window.open('https://www.amap.com/search?query=发热门诊&city=武汉', '_blank')
          setLocating(false)
        }
      )
    } else {
      window.open('https://www.amap.com/search?query=发热门诊&city=武汉', '_blank')
      setLocating(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
          <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
          就近发热门诊
        </h3>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-200 text-primary-600 text-xs hover:bg-primary-100 transition-colors flex-shrink-0"
        >
          <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
          {locating ? '定位中...' : '查找附近'}
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-3">华中农业大学周边医院（示例数据）</p>

      <div className="space-y-2">
        {hospitals.map((h, i) => (
          <motion.div
            key={h.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-2.5 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/20 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <p className="text-xs font-semibold text-slate-800">{h.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${h.tagColor}`}>{h.tag}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1 leading-relaxed">{h.address}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{h.hours}</span>
                  </span>
                  <span className="text-xs text-primary-500 font-medium">{h.distance}</span>
                </div>
              </div>
              <a
                href={`tel:${h.phone}`}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs hover:bg-green-100 transition-colors"
                title={`拨打 ${h.phone}`}
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">{h.phone}</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
