import React from 'react'

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
}

export function HistorySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-9 w-24" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="card">
            <SkeletonBlock className="h-10 w-full mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <SkeletonBlock className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
                <SkeletonBlock className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card space-y-3">
            <SkeletonBlock className="h-5 w-24 mb-2" />
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="card space-y-3">
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DiagnosisSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 space-y-2">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-80" />
      </div>
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="card space-y-3">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="h-32 w-full rounded-xl" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
        <div className="lg:col-span-2 card h-[600px] flex flex-col gap-3">
          <SkeletonBlock className="h-12 w-full" />
          <div className="flex-1 space-y-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <SkeletonBlock className="w-8 h-8 rounded-full flex-shrink-0" />
                <SkeletonBlock className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-10 w-full" />
        </div>
        <div className="card space-y-3">
          <SkeletonBlock className="h-8 w-full" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-slate-100">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
