import { ReactNode } from 'react'
import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function TimedFade({
  active,
  showMs = 1000,   // 화면에 유지되는 시간 (1.0초)
  fadeMs = 500,    // 사라질 때 페이드 시간
  children,
  depKey,          // 같은 조건에서 다시 보여주고 싶으면 키를 바꿔 트리거
}: {
  active: boolean
  showMs?: number
  fadeMs?: number
  children: ReactNode
  depKey?: string | number
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // active가 true가 되면 나타났다 1.0초 뒤 자동 페이드아웃
    if (active) {
      setVisible(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setVisible(false), showMs)
    } else {
      setVisible(false)
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [active, showMs, depKey])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ pointerEvents: 'none' }} // UI 클릭 방해 X
        >
          <div
            // exit 페이드 동안 부드럽게 사라지게
            style={{ transition: `opacity ${fadeMs}ms linear` }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
