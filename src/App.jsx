import { useState, useEffect, useRef, useCallback } from 'react'
import { Chart, registerables } from 'chart.js'
import './App.css'

Chart.register(...registerables)

// ── Constants ──────────────────────────────────────────────
const PRODUCTS = {
  rice:  '🌾 Gạo',
  gas:   '⛽ Xăng dầu',
  land:  '🏠 Bất động sản',
  phone: '📱 Điện thoại',
  labor: '👷 Lao động',
}

const RANDOM_EVENTS = [
  { msg: '🌾 Mùa màng thất bát — Cung giảm mạnh!',        key: 'supplyBase', delta: -20, type: 'bad'  },
  { msg: '🦠 Dịch bệnh bùng phát — Cầu giảm đột biến!',   key: 'demandBase', delta: -15, type: 'bad'  },
  { msg: '🚢 Hàng nhập khẩu ồ ạt — Cung tăng vọt!',       key: 'supplyBase', delta: +20, type: 'good' },
  { msg: '📱 Xu hướng mạng xã hội — Cầu tăng đột ngột!',  key: 'preference', delta: +25, type: 'good' },
  { msg: '⛽ Giá dầu thế giới tăng — Chi phí tăng!',       key: 'cost',       delta: +20, type: 'bad'  },
  { msg: '🤖 Công nghệ mới — Năng suất tăng cao!',         key: 'tech',       delta: +20, type: 'good' },
  { msg: '💵 Tiền lương tăng — Thu nhập cải thiện!',       key: 'income',     delta: +15, type: 'good' },
  { msg: '🏭 Nhà máy đóng cửa — Cung giảm mạnh!',         key: 'supplyBase', delta: -15, type: 'bad'  },
]

const THEORY_NOTES = {
  null:    `Thị trường đang ở <strong style="color:#00d4aa">trạng thái cân bằng</strong>. Lượng cung = lượng cầu.<br><br><em>— Adam Smith: "Bàn tay vô hình dẫn dắt thị trường về điểm cân bằng."</em>`,
  ceiling: `<strong style="color:#ff4d6d">Trần giá</strong> đặt dưới P* → Nhà sản xuất cung ít hơn, người mua muốn nhiều hơn → <strong>thiếu hàng</strong>, xuất hiện chợ đen.<br><br><em>Ví dụ VN: giá xăng bao cấp thập niên 80.</em>`,
  floor:   `<strong style="color:#ff9f43">Sàn giá</strong> đặt trên P* → Nhà sản xuất muốn bán nhiều, người mua không mua → <strong>dư thừa hàng hóa</strong>.<br><br><em>Ví dụ: giá sàn lúa để bảo vệ nông dân.</em>`,
  tax:     `<strong style="color:#ffd32a">Thuế</strong> làm đường cung dịch trái → giá tăng, lượng giảm → xuất hiện <strong>tổn thất phúc lợi</strong> (deadweight loss).<br><br><em>Người mua + người bán cùng chịu thiệt.</em>`,
  subsidy: `<strong style="color:#6c63ff">Trợ cấp</strong> làm đường cung dịch phải → giá giảm, lượng tăng → phúc lợi tăng ngắn hạn nhưng tốn ngân sách nhà nước.<br><br><em>Ví dụ: trợ cấp điện, trợ giá nông nghiệp.</em>`,
}

// ── Mission definitions ────────────────────────────────────
const MISSIONS = [
  {
    id: 1,
    emoji: '🏭',
    title: 'Vòng 1 — Đổi Mới 1986',
    scenario: 'Việt Nam đang áp dụng cơ chế bao cấp: trần giá cứng nhắc khắp nơi, cung thiếu hụt trầm trọng. Người dân xếp hàng dài mua nhu yếu phẩm, chợ đen tràn lan. Điểm phúc lợi chỉ ~20.',
    goal: 'Đưa điểm phúc lợi ≥ 75 và DUY TRÌ liên tục 10 giây.',
    hint: '💡 Gỡ trần giá trước → thị trường tự điều tiết. Sau đó tăng Cung cơ bản + Công nghệ để bù thiếu hụt. Điểm phải >= 75 liên tục 10 giây mới thắng!',
    time: 100,
    type: 'hold',
    target: 75,
    holdSeconds: 10,
    forbidden: [],
    setup: {
      sliders: { demandBase: 72, income: 58, preference: 65, supplyBase: 20, cost: 88, tech: 15 },
      intervention: 'ceiling',
    },
  },
  {
    id: 2,
    emoji: '⛽',
    title: 'Vòng 2 — Cú sốc dầu mỏ 1973',
    scenario: 'OPEC cắt xuất khẩu dầu — giá dầu thế giới tăng 400% chỉ trong 6 tháng. Chi phí sản xuất tăng vọt, cung giảm mạnh, lạm phát leo thang. Trần giá và sàn giá đều BỊ CẤM (làm trầm trọng thêm).',
    goal: 'Ổn định điểm phúc lợi ≥ 65 và DUY TRÌ liên tục 12 giây.',
    hint: '💡 Trợ cấp làm đường cung dịch phải — bù đắp chi phí dầu cao. Đồng thời tăng mạnh Công nghệ để giảm phụ thuộc dầu mỏ. Cần kiên nhẫn duy trì điểm!',
    time: 110,
    type: 'hold',
    target: 65,
    holdSeconds: 12,
    forbidden: ['ceiling', 'floor'],
    setup: {
      sliders: { demandBase: 65, income: 60, preference: 55, supplyBase: 30, cost: 95, tech: 20 },
      intervention: null,
    },
  },
  {
    id: 3,
    emoji: '💸',
    title: 'Vòng 3 — Lạm phát phi mã',
    scenario: 'Cầu bùng nổ quá mức: thu nhập danh nghĩa tăng ảo, xu hướng tiêu dùng bùng nổ, nhưng cung không theo kịp. Lạm phát vượt 150%. Trợ cấp và sàn giá BỊ CẤM — chúng sẽ kích thích cầu thêm!',
    goal: 'Kiểm soát điểm phúc lợi ≥ 60 và DUY TRÌ liên tục 15 giây.',
    hint: '💡 Giảm Thu nhập kỳ vọng + Sở thích tiêu dùng → đường cầu dịch trái (hạ nhiệt). Đồng thời tăng Cung cơ bản để bắt kịp. Đây là bài toán cân bằng khó!',
    time: 120,
    type: 'hold',
    target: 60,
    holdSeconds: 15,
    forbidden: ['subsidy', 'floor'],
    setup: {
      sliders: { demandBase: 95, income: 90, preference: 88, supplyBase: 35, cost: 55, tech: 40 },
      intervention: null,
    },
  },
  {
    id: 4,
    emoji: '📉',
    title: 'Vòng 4 — Khủng hoảng tài chính 2008',
    scenario: 'Bong bóng tài chính vỡ! Cú sốc kinh tế xảy ra mỗi 8 giây — bất kỳ chỉ số nào cũng có thể sụp đổ. Không có công thức cố định, chỉ có phản xạ và hiểu biết.',
    goal: 'Sống sót! Giữ điểm phúc lợi ≥ 50 LIÊN TỤC trong suốt 90 giây. Nếu điểm xuống dưới 50 → thất bại ngay!',
    hint: '💡 Phản ứng ngay sau mỗi cú sốc: cung giảm → dùng Trợ cấp; chi phí tăng → kéo Công nghệ lên; cầu giảm → tăng Thu nhập. Theo dõi Nhật ký sự kiện!',
    time: 90,
    type: 'survive',
    target: 50,
    shockInterval: 8,
    forbidden: [],
    setup: {
      sliders: { demandBase: 62, income: 60, preference: 58, supplyBase: 62, cost: 42, tech: 62 },
      intervention: null,
    },
  },
  {
    id: 5,
    emoji: '🚀',
    title: 'Vòng 5 — Thoát bẫy thu nhập trung bình',
    scenario: 'Nền kinh tế đang giậm chân ở mức trung bình. Mọi chỉ số tầm thường, không có đột phá. Chỉ có tự do hóa thị trường toàn diện mới thoát được bẫy — Trần giá, Sàn giá và Thuế đều BỊ CẤM!',
    goal: 'Đưa điểm phúc lợi ≥ 88 và DUY TRÌ liên tục 20 giây. Đây là thử thách khó nhất!',
    hint: '💡 Tăng tối đa Công nghệ (90+) + Cung cơ bản (85+), giảm Chi phí về thấp. Cân bằng Cầu ở mức vừa phải. Trợ cấp được phép dùng nhưng tốn ngân sách (DWL).',
    time: 130,
    type: 'hold',
    target: 88,
    holdSeconds: 20,
    forbidden: ['ceiling', 'floor', 'tax'],
    setup: {
      sliders: { demandBase: 50, income: 50, preference: 50, supplyBase: 50, cost: 50, tech: 50 },
      intervention: null,
    },
  },
]

const GRADES = [
  { min: 5, grade: 'S', label: 'Huyền thoại!',   color: '#ffd32a', msg: 'Hoàn hảo tuyệt đối — 5/5 vòng! Bạn xứng đáng làm Bộ trưởng Kinh tế.' },
  { min: 4, grade: 'A', label: 'Xuất sắc!',       color: '#00d4aa', msg: 'Nắm vững lý thuyết kinh tế. Một bước nữa là huyền thoại!' },
  { min: 3, grade: 'B', label: 'Giỏi!',           color: '#6c63ff', msg: 'Hiểu cơ bản và vận dụng tốt. Luyện thêm phản xạ thị trường.' },
  { min: 2, grade: 'C', label: 'Khá!',            color: '#ff9f43', msg: 'Đã hiểu một số khái niệm. Cần học thêm về can thiệp chính sách.' },
  { min: 1, grade: 'D', label: 'Cần cố gắng!',   color: '#ff4d6d', msg: 'Thị trường khắc nghiệt hơn bạn nghĩ. Đọc lý thuyết rồi thử lại!' },
  { min: 0, grade: 'F', label: 'Chưa đạt!',       color: '#8888aa', msg: 'Đừng nản! Xem hướng dẫn cách chơi rồi thử lại từ đầu.' },
]

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function calcCurves(s) {
  const D_INT = 20 + (s.demandBase / 100) * 60 + (s.income / 100) * 20 + (s.preference / 100) * 15
  const S_INT = 5 + (100 - s.supplyBase) / 100 * 40 + (s.cost - 50) * 0.4 - (s.tech - 50) * 0.3
  const D_SLOPE = 0.9
  const S_SLOPE = 0.7
  const Q = (D_INT - S_INT) / (D_SLOPE + S_SLOPE)
  const P = D_INT - D_SLOPE * Q
  return { D_INT, S_INT, D_SLOPE, S_SLOPE, Q: clamp(Q, 5, 115), P: clamp(P, 5, 115) }
}

function buildLine(intercept, slope, isSupply) {
  const pts = []
  for (let q = 0; q <= 120; q += 4) {
    const p = isSupply ? intercept + slope * q : intercept - slope * q
    if (p >= 0 && p <= 130) pts.push({ x: q, y: +p.toFixed(2) })
  }
  return pts
}

// ── Main Component ─────────────────────────────────────────
export default function App() {
  const [product, setProduct] = useState('rice')
  const [sliders, setSliders] = useState({
    demandBase: 50, income: 50, preference: 50,
    supplyBase: 50, cost: 50, tech: 50,
  })
  const [intervention, setIntervention] = useState(null)
  const [events, setEvents] = useState([
    { id: 0, msg: 'Thị trường khởi động. Cung và cầu đang cân bằng.', type: 'good', t: '00:00' }
  ])
  const [toast, setToast] = useState({ show: false, title: '', msg: '' })
  const [showGuide, setShowGuide] = useState(false)
  const [guideStep, setGuideStep] = useState(0)

  // ── Mission state ──
  // phase: 'idle' | 'briefing' | 'playing' | 'passed' | 'failed' | 'finished'
  const [mission, setMission] = useState({
    phase: 'idle',
    idx: 0,
    timeLeft: 0,
    holdCount: 0,  // consecutive seconds above target (for 'hold' type)
    results: [],   // array of { passed: bool, score: number }
  })

  const toastTimer  = useRef(null)
  const eventCounter = useRef(1)
  const timerRef    = useRef(null)
  const shockRef    = useRef(null)
  const chartRef    = useRef(null)
  const chartInstance = useRef(null)
  const scoreRef    = useRef(0)

  // ── Toast ──
  const showToast = useCallback((title, msg) => {
    setToast({ show: true, title, msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }, [])

  // ── Event log ──
  const addEvent = useCallback((msg, type = 'neutral') => {
    const n = eventCounter.current++
    const mm = String(Math.floor(n / 60)).padStart(2, '0')
    const ss = String(n % 60).padStart(2, '0')
    setEvents(prev => [{ id: n, msg, type, t: `${mm}:${ss}` }, ...prev].slice(0, 20))
  }, [])

  // ── Derived market values ──
  const curves = calcCurves(sliders)
  const { D_INT, S_INT, D_SLOPE, S_SLOPE, Q: eqQ, P: eqP } = curves
  const CS  = 0.5 * (D_INT - eqP) * eqQ
  const PS  = 0.5 * (eqP - S_INT) * eqQ
  const DWL = intervention === 'ceiling' ? CS * 0.16
            : intervention === 'floor'   ? PS * 0.16
            : intervention === 'tax'     ? (CS + PS) * 0.12 : 0
  const maxSurplus = Math.max(CS + PS, 1)
  const score = clamp(Math.round((CS + PS - DWL * 3) / maxSurplus * 100), 0, 100)
  scoreRef.current = score
  const inflation = Math.round((eqP - 50) / 50 * 100)

  let marketStatus = 'Cân bằng ✓'; let marketColor = 'var(--green)'
  if (intervention === 'ceiling') { marketStatus = 'Thiếu hàng ⚠️'; marketColor = 'var(--red)' }
  else if (intervention === 'floor')   { marketStatus = 'Dư thừa ⚠️';   marketColor = 'var(--orange)' }
  else if (intervention === 'tax')     { marketStatus = 'Có thuế 💰';    marketColor = 'var(--yellow)' }
  else if (intervention === 'subsidy') { marketStatus = 'Có trợ cấp 🎁'; marketColor = 'var(--accent)' }

  // ── Chart init ──
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: { datasets: [
        { label: 'Đường Cầu (D)', data: [], borderColor: '#ff4d6d', borderWidth: 2.5, pointRadius: 0, tension: 0.1, fill: false },
        { label: 'Đường Cung (S)', data: [], borderColor: '#00d4aa', borderWidth: 2.5, pointRadius: 0, tension: 0.1, fill: false },
        { label: 'Điểm cân bằng', data: [], borderColor: '#ffd32a', backgroundColor: '#ffd32a', pointRadius: 8, showLine: false },
        { label: '', data: [], borderColor: '#ff9f43', borderWidth: 2, borderDash: [8, 4], pointRadius: 0, fill: false },
      ]},
      options: {
        responsive: true, animation: { duration: 300 },
        plugins: {
          legend: { labels: { color: '#8888aa', font: { size: 11 }, boxWidth: 14 } },
          tooltip: { backgroundColor: '#1a1d27', borderColor: '#2a2d3e', borderWidth: 1, titleColor: '#e0e0f0', bodyColor: '#8888aa' }
        },
        scales: {
          x: { type: 'linear', min: 0, max: 120,
               title: { display: true, text: 'Lượng (Q)', color: '#8888aa', font: { size: 11 } },
               grid: { color: 'rgba(42,45,62,0.8)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
          y: { min: 0, max: 120,
               title: { display: true, text: 'Giá (P)', color: '#8888aa', font: { size: 11 } },
               grid: { color: 'rgba(42,45,62,0.8)' }, ticks: { color: '#8888aa', font: { size: 10 } } },
        }
      }
    })
  }, [])

  // ── Chart update ──
  useEffect(() => {
    const c = chartInstance.current
    if (!c) return
    c.data.datasets[0].data = buildLine(D_INT, D_SLOPE, false)
    c.data.datasets[1].data = buildLine(S_INT, S_SLOPE, true)
    c.data.datasets[2].data = [{ x: eqQ, y: eqP }]
    if (intervention === 'ceiling') {
      const lv = +(eqP * 0.75).toFixed(1)
      c.data.datasets[3].data = [{ x: 0, y: lv }, { x: 120, y: lv }]
      c.data.datasets[3].label = `Trần giá = ${lv}`; c.data.datasets[3].borderColor = '#ff4d6d'
    } else if (intervention === 'floor') {
      const lv = +(eqP * 1.25).toFixed(1)
      c.data.datasets[3].data = [{ x: 0, y: lv }, { x: 120, y: lv }]
      c.data.datasets[3].label = `Sàn giá = ${lv}`; c.data.datasets[3].borderColor = '#00d4aa'
    } else {
      c.data.datasets[3].data = []; c.data.datasets[3].label = ''
    }
    c.update()
  })

  // ── Mission: timer countdown ──
  useEffect(() => {
    if (mission.phase !== 'playing') return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setMission(m => {
        if (m.phase !== 'playing') { clearInterval(timerRef.current); return m }
        const def = MISSIONS[m.idx]
        const next = m.timeLeft - 1

        // 'hold' type: track consecutive seconds above target
        if (def.type === 'hold') {
          const newHold = scoreRef.current >= def.target ? m.holdCount + 1 : 0
          if (newHold >= def.holdSeconds) {
            clearInterval(timerRef.current)
            clearInterval(shockRef.current)
            return { ...m, phase: 'passed', timeLeft: next, holdCount: newHold }
          }
          if (next <= 0) {
            clearInterval(timerRef.current)
            return { ...m, phase: 'failed', timeLeft: 0, holdCount: newHold }
          }
          return { ...m, timeLeft: next, holdCount: newHold }
        }

        if (next <= 0) {
          clearInterval(timerRef.current)
          clearInterval(shockRef.current)
          // survive type: if timer runs out and still playing → passed
          if (def.type === 'survive') {
            return { ...m, phase: 'passed', timeLeft: 0 }
          }
          // reach type: timer ran out without reaching target → failed
          return { ...m, phase: 'failed', timeLeft: 0 }
        }
        return { ...m, timeLeft: next }
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [mission.phase, mission.idx])

  // ── Mission: check win/fail condition every render ──
  useEffect(() => {
    if (mission.phase !== 'playing') return
    const def = MISSIONS[mission.idx]
    if (def.type === 'reach' && score >= def.target) {
      clearInterval(timerRef.current)
      clearInterval(shockRef.current)
      setMission(m => ({ ...m, phase: 'passed' }))
    }
    if (def.type === 'survive' && score < def.target) {
      clearInterval(timerRef.current)
      clearInterval(shockRef.current)
      setMission(m => ({ ...m, phase: 'failed' }))
    }
  })

  // ── Mission: shock interval for vòng 3 ──
  const startShocks = useCallback((interval) => {
    clearInterval(shockRef.current)
    shockRef.current = setInterval(() => {
      const ev = RANDOM_EVENTS.filter(e => e.type === 'bad')[Math.floor(Math.random() * 5)]
      setSliders(s => ({ ...s, [ev.key]: clamp(s[ev.key] + ev.delta, 10, 100) }))
      addEvent('⚡ Cú sốc: ' + ev.msg, 'bad')
    }, interval * 1000)
  }, [addEvent])

  // ── Start mission ──
  const startMission = useCallback((idx) => {
    const def = MISSIONS[idx]
    setSliders(def.setup.sliders)
    setIntervention(def.setup.intervention)
    setMission(m => ({ phase: 'playing', idx, timeLeft: def.time, holdCount: 0, results: m.results }))
    addEvent(`🎯 Bắt đầu: ${def.title}`, 'good')
    if (def.type === 'survive') startShocks(def.shockInterval)
  }, [addEvent, startShocks])

  // ── After pass/fail: record result then go next or finish ──
  const handleMissionResult = useCallback((passed) => {
    setMission(m => {
      const newResults = [...m.results, { passed, score }]
      const nextIdx = m.idx + 1
      if (nextIdx >= MISSIONS.length) {
        return { ...m, phase: 'finished', results: newResults }
      }
      return { ...m, phase: passed ? 'passed' : 'failed', results: newResults }
    })
  }, [score])

  // sync results when phase transitions to passed/failed
  useEffect(() => {
    if (mission.phase === 'passed' || mission.phase === 'failed') {
      handleMissionResult(mission.phase === 'passed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.phase])

  const proceedToNext = () => {
    setMission(m => {
      const nextIdx = m.idx + 1
      return { ...m, phase: 'briefing', idx: nextIdx }
    })
  }

  const exitMission = () => {
    clearInterval(timerRef.current)
    clearInterval(shockRef.current)
    setMission({ phase: 'idle', idx: 0, timeLeft: 0, holdCount: 0, results: [] })
    setSliders({ demandBase: 50, income: 50, preference: 50, supplyBase: 50, cost: 50, tech: 50 })
    setIntervention(null)
  }

  // ── Slider ──
  const handleSlider = (key, val) => setSliders(s => ({ ...s, [key]: +val }))

  // ── Intervention ──
  const applyIntervention = (type) => {
    setIntervention(type)
    const info = {
      ceiling: ['Trần giá áp dụng!',  'Giá khóa dưới P* → Thiếu hàng, chợ đen xuất hiện.', 'bad'],
      floor:   ['Sàn giá áp dụng!',   'Giá đẩy trên P* → Dư thừa hàng hóa.', 'bad'],
      tax:     ['Thuế áp dụng!',       'Cung dịch trái → Giá tăng, lượng giảm.', 'bad'],
      subsidy: ['Trợ cấp áp dụng!',   'Cung dịch phải → Giá giảm, lượng tăng.', 'good'],
    }
    const [title, msg, evType] = info[type]
    showToast(title, msg)
    addEvent(`🏛️ Chính phủ: ${title} ${msg}`, evType)
  }
  const clearIntervention = () => {
    setIntervention(null)
    showToast('Can thiệp gỡ bỏ', 'Thị trường tự do hoạt động.')
    addEvent('✖️ Gỡ bỏ can thiệp — thị trường tự điều tiết.', 'good')
  }

  // ── Random event ──
  const triggerRandom = () => {
    const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
    setSliders(s => ({ ...s, [ev.key]: clamp(s[ev.key] + ev.delta, 10, 100) }))
    addEvent('⚡ Sự kiện: ' + ev.msg, ev.type)
    showToast('Sự kiện ngẫu nhiên!', ev.msg)
  }
  const triggerCrisis = () => {
    setSliders(s => ({
      ...s,
      demandBase: clamp(s.demandBase - 25, 10, 100),
      supplyBase: clamp(s.supplyBase - 20, 10, 100),
      cost: clamp(s.cost + 30, 10, 100),
    }))
    addEvent('💥 KHỦNG HOẢNG KINH TẾ! Cung-cầu sụp đổ.', 'bad')
    showToast('💥 Khủng hoảng!', 'Cung & cầu đều sụt giảm.')
  }
  const handleProductChange = (e) => {
    setProduct(e.target.value)
    addEvent(`Chuyển sang thị trường: ${PRODUCTS[e.target.value]}`, 'neutral')
  }

  // ── Helpers ──
  const scoreColor = score > 70 ? 'var(--green)' : score > 40 ? 'var(--yellow)' : 'var(--red)'
  const timerColor = mission.timeLeft > 15 ? 'var(--green)' : mission.timeLeft > 7 ? 'var(--yellow)' : 'var(--red)'
  const currentDef = MISSIONS[mission.idx] || MISSIONS[0]
  const passCount  = mission.results.filter(r => r.passed).length
  const finalGrade = GRADES.find(g => passCount >= g.min) || GRADES[GRADES.length - 1]

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div>
          <h1>📈 Cung – Cầu Market Simulator</h1>
          <div className="subtitle">Kinh tế Chính trị Mác–Lênin · Mô phỏng thị trường thực tế</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {mission.phase === 'idle' && (
            <button className="btn" style={{ width:'auto', margin:0, padding:'6px 16px', borderColor:'var(--yellow)', color:'var(--yellow)' }}
              onClick={() => setMission(m => ({ ...m, phase: 'briefing', idx: 0 }))}>
              🎯 Chế độ Nhiệm vụ
            </button>
          )}
          {mission.phase !== 'idle' && (
            <button className="btn danger" style={{ width:'auto', margin:0, padding:'6px 14px' }} onClick={exitMission}>
              ✕ Thoát nhiệm vụ
            </button>
          )}
          <button className="btn" style={{ width:'auto', margin:0, padding:'6px 14px' }} onClick={() => { setGuideStep(0); setShowGuide(true) }}>
            ❓ Cách chơi
          </button>
          <span className="badge">DEMO v1.0</span>
        </div>
      </header>

      {/* ── Mission Banner (playing) ── */}
      {mission.phase === 'playing' && (
        <div style={{ background: 'linear-gradient(90deg,#1a1d27,#252840)', borderBottom:'1px solid var(--border)', padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:2 }}>
              Nhiệm vụ {currentDef.id}/{MISSIONS.length} — {currentDef.title}
            </div>
            <div style={{ fontSize:'0.8rem', color:'var(--text)' }}>
              🎯 {currentDef.goal}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexShrink:0 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)' }}>ĐIỂM HIỆN TẠI</div>
              <div style={{ fontSize:'1.4rem', fontWeight:700, color: scoreColor }}>{score}</div>
            </div>
            {currentDef.type === 'hold' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', color:'var(--muted)', marginBottom:4 }}>
                  DUY TRÌ {mission.holdCount}/{currentDef.holdSeconds}s
                </div>
                <div style={{ width:90, height:7, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min((mission.holdCount/currentDef.holdSeconds)*100,100)}%`, height:'100%', background: score >= currentDef.target ? 'var(--green)' : 'var(--red)', borderRadius:4, transition:'width 0.8s ease' }} />
                </div>
              </div>
            )}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)' }}>
                {currentDef.type === 'reach' ? `MỤC TIÊU ≥ ${currentDef.target}` : `DUY TRÌ ≥ ${currentDef.target}`}
              </div>
              <div style={{ fontSize:'1.4rem', fontWeight:700, color: timerColor }}>⏱ {mission.timeLeft}s</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Briefing Modal ── */}
      {mission.phase === 'briefing' && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'3rem', marginBottom:8 }}>{currentDef.emoji}</div>
              <h2 style={{ color:'var(--accent)', fontSize:'1.2rem', marginBottom:6 }}>{currentDef.title}</h2>
              <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>Vòng {currentDef.id} / {MISSIONS.length}</div>
            </div>
            <div style={infoBox('#6c63ff')}>
              <strong>Tình huống:</strong><br />{currentDef.scenario}
            </div>
            <div style={infoBox('#ffd32a')}>
              <strong>Mục tiêu:</strong><br />{currentDef.goal}
            </div>
            {currentDef.forbidden && currentDef.forbidden.length > 0 && (
              <div style={infoBox('#ff4d6d')}>
                <strong>🚫 Bị cấm sử dụng:</strong>{' '}
                {currentDef.forbidden.map(f => ({ ceiling:'Trần giá', floor:'Sàn giá', tax:'Thuế', subsidy:'Trợ cấp' }[f])).join(', ')}
                <br /><span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>Các chính sách này sẽ bị vô hiệu hoá trong vòng này.</span>
              </div>
            )}
            <div style={infoBox('#00d4aa')}>
              {currentDef.hint}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn danger" style={{ flex:1 }} onClick={exitMission}>← Hủy</button>
              <button className="btn success" style={{ flex:2 }} onClick={() => startMission(mission.idx)}>
                ▶ Bắt đầu ({currentDef.time}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Passed Modal ── */}
      {mission.phase === 'passed' && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'3.5rem' }}>🎉</div>
              <h2 style={{ color:'var(--green)', fontSize:'1.3rem', marginTop:8 }}>Hoàn thành!</h2>
              <div style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:4 }}>{currentDef.title}</div>
            </div>
            <div style={infoBox('#00d4aa')}>
              {currentDef.type === 'hold'
                ? <>Duy trì điểm <strong style={{ color:'var(--green)' }}>{score}</strong> liên tục <strong style={{ color:'var(--green)' }}>{currentDef.holdSeconds}s</strong> — hoàn thành xuất sắc!</>
                : <>Điểm phúc lợi đạt <strong style={{ color:'var(--green)' }}>{score}</strong> — vượt mục tiêu {currentDef.target}!</>
              }
            </div>
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:8 }}>Tiến độ:</div>
              <div style={{ display:'flex', gap:6 }}>
                {MISSIONS.map((_, i) => (
                  <div key={i} style={{ flex:1, height:6, borderRadius:4,
                    background: i < mission.idx ? 'var(--green)' : i === mission.idx ? 'var(--green)' : 'var(--border)' }} />
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn danger" style={{ flex:1 }} onClick={exitMission}>Thoát</button>
              {mission.idx + 1 < MISSIONS.length
                ? <button className="btn success" style={{ flex:2 }} onClick={proceedToNext}>Vòng tiếp → </button>
                : <button className="btn success" style={{ flex:2 }} onClick={() => setMission(m => ({ ...m, phase: 'finished' }))}>Xem kết quả 🏆</button>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Failed Modal ── */}
      {mission.phase === 'failed' && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'3.5rem' }}>💔</div>
              <h2 style={{ color:'var(--red)', fontSize:'1.3rem', marginTop:8 }}>Thất bại!</h2>
              <div style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:4 }}>{currentDef.title}</div>
            </div>
            <div style={infoBox('#ff4d6d')}>
              {currentDef.type === 'survive'
                ? `Điểm phúc lợi rơi xuống ${score} — dưới ngưỡng ${currentDef.target}!`
                : currentDef.type === 'hold'
                ? `Hết giờ! Duy trì được ${mission.holdCount}/${currentDef.holdSeconds}s — chưa đủ. Cần điểm ≥ ${currentDef.target} liên tục.`
                : `Hết giờ! Điểm đạt được: ${score} / Mục tiêu: ${currentDef.target}`
              }
            </div>
            <div style={infoBox('#ff9f43')}>{currentDef.hint}</div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn danger" style={{ flex:1 }} onClick={exitMission}>Thoát</button>
              <button className="btn" style={{ flex:1 }} onClick={() => startMission(mission.idx)}>🔄 Thử lại</button>
              {mission.idx + 1 < MISSIONS.length &&
                <button className="btn success" style={{ flex:1 }} onClick={proceedToNext}>Bỏ qua →</button>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Finished / Result Screen ── */}
      {mission.phase === 'finished' && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 500 }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:'3.5rem' }}>🏆</div>
              <h2 style={{ color:'var(--yellow)', fontSize:'1.3rem', marginTop:8 }}>Kết quả cuối cùng</h2>
            </div>
            {/* Grade */}
            <div style={{ textAlign:'center', marginBottom:20, padding:'16px', background:'#12141e', borderRadius:10, border:`1px solid ${finalGrade.color}` }}>
              <div style={{ fontSize:'3.5rem', fontWeight:900, color: finalGrade.color }}>{finalGrade.grade}</div>
              <div style={{ fontSize:'1rem', fontWeight:700, color: finalGrade.color, marginTop:4 }}>{finalGrade.label}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:6 }}>{finalGrade.msg}</div>
            </div>
            {/* Per-mission results */}
            <div style={{ marginBottom:16 }}>
              {MISSIONS.map((def, i) => {
                const res = mission.results[i]
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, marginBottom:6, background:'#12141e', border:`1px solid ${res?.passed ? 'var(--green)' : res ? 'var(--red)' : 'var(--border)'}` }}>
                    <div>
                      <span style={{ marginRight:8 }}>{def.emoji}</span>
                      <span style={{ fontSize:'0.82rem' }}>{def.title}</span>
                    </div>
                    <span style={{ fontWeight:700, color: res?.passed ? 'var(--green)' : res ? 'var(--red)' : 'var(--muted)' }}>
                      {res?.passed ? '✓ Đạt' : res ? '✗ Trượt' : '— Bỏ qua'}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn" style={{ flex:1 }} onClick={exitMission}>Về trang chính</button>
              <button className="btn success" style={{ flex:1 }} onClick={() => { exitMission(); setTimeout(() => setMission(m => ({ ...m, phase: 'briefing', idx: 0 })), 50) }}>
                🔄 Chơi lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guide Modal (step-by-step) ── */}
      {showGuide && <GuideModal onClose={() => { setShowGuide(false); setGuideStep(0) }} step={guideStep} setStep={setGuideStep} />}

      {/* ── Main Layout ── */}
      <div className="layout">

        {/* LEFT */}
        <div>
          <div className="card">
            <div className="card-title">🛒 Sản phẩm thị trường</div>
            <select className="product-select" value={product} onChange={handleProductChange}>
              {Object.entries(PRODUCTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="card">
            <div className="card-title">📉 Điều chỉnh Cầu</div>
            {[
              { key: 'demandBase', label: 'Cầu cơ bản (D₀)' },
              { key: 'income',     label: 'Thu nhập người dân' },
              { key: 'preference', label: 'Sở thích / Xu hướng' },
            ].map(({ key, label }) => (
              <div className="control-group" key={key}>
                <div className="control-label">
                  <span>{label}</span>
                  <span className="control-val demand">{sliders[key]}</span>
                </div>
                <input type="range" className="demand-slider" min="10" max="100" value={sliders[key]}
                  onChange={e => handleSlider(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">📈 Điều chỉnh Cung</div>
            {[
              { key: 'supplyBase', label: 'Cung cơ bản (S₀)' },
              { key: 'cost',       label: 'Chi phí sản xuất' },
              { key: 'tech',       label: 'Công nghệ / Năng suất' },
            ].map(({ key, label }) => (
              <div className="control-group" key={key}>
                <div className="control-label">
                  <span>{label}</span>
                  <span className="control-val supply">{sliders[key]}</span>
                </div>
                <input type="range" className="supply-slider" min="10" max="100" value={sliders[key]}
                  onChange={e => handleSlider(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div className="card-title" style={{ margin:0 }}>
                📊 Đồ thị Cung – Cầu
                {intervention && <span className="int-badge">Can thiệp đang hoạt động</span>}
              </div>
              <div style={{ fontSize:'0.73rem', color:'var(--muted)' }}>{PRODUCTS[product]}</div>
            </div>
            <div className="chart-wrap"><canvas ref={chartRef} height={300} /></div>
            <div className="eq-grid">
              <div className="eq-box">
                <div className="eq-label">Giá cân bằng (P*)</div>
                <div className="eq-value" style={{ color:'var(--yellow)' }}>{eqP.toFixed(1)}</div>
              </div>
              <div className="eq-box">
                <div className="eq-label">Lượng cân bằng (Q*)</div>
                <div className="eq-value" style={{ color:'var(--accent)' }}>{eqQ.toFixed(1)}</div>
              </div>
              <div className="eq-box">
                <div className="eq-label">Trạng thái</div>
                <div className="eq-value" style={{ color: marketColor, fontSize:'0.85rem' }}>{marketStatus}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">⚖️ Phúc lợi xã hội (Surplus)</div>
            <div className="welfare-grid">
              {[
                { label:'Thặng dư tiêu dùng', val: CS.toFixed(0), pct: clamp(CS/maxSurplus*100,0,100), color:'var(--accent)' },
                { label:'Thặng dư sản xuất',  val: PS.toFixed(0), pct: clamp(PS/maxSurplus*100,0,100), color:'var(--orange)' },
                { label:'Tổn thất phúc lợi',  val: DWL.toFixed(0), pct: clamp(DWL/(maxSurplus*0.35)*100,0,100), color:'var(--red)' },
              ].map(({ label, val, pct, color }) => (
                <div key={label}>
                  <div className="welfare-label"><span>{label}</span><span>{val}</span></div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: pct+'%', background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">📰 Nhật ký sự kiện</div>
            <div className="event-log">
              {events.map(ev => (
                <div key={ev.id} className={`event-item ${ev.type === 'bad' ? 'bad' : ev.type === 'good' ? 'good' : ''}`}>
                  <div className="event-time">{ev.t}</div>{ev.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="card">
            <div className="score-box">
              <div className="score-num" style={{ color: scoreColor }}>{score}</div>
              <div className="score-lbl">Điểm phúc lợi xã hội</div>
            </div>
            <div className="stat-row">
              <span>Lạm phát</span>
              <span style={{ fontWeight:700, color: Math.abs(inflation)>20 ? 'var(--red)' : 'var(--yellow)' }}>
                {inflation >= 0 ? '+' : ''}{inflation}%
              </span>
            </div>
            <div className="stat-row">
              <span>Thiếu hàng / Dư thừa</span>
              <span style={{ fontWeight:700, color: intervention==='ceiling' ? 'var(--red)' : intervention==='floor' ? 'var(--orange)' : 'var(--green)' }}>
                {intervention==='ceiling' ? 'THIẾU HÀNG 🔴' : intervention==='floor' ? 'DƯ THỪA 🟡' : 'Bình thường'}
              </span>
            </div>
            <div className="stat-row">
              <span>Chợ đen</span>
              <span style={{ fontWeight:700, color: intervention==='ceiling' ? 'var(--red)' : 'var(--muted)' }}>
                {intervention==='ceiling' ? 'Xuất hiện 🚨' : 'Không'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🏛️ Can thiệp Chính phủ</div>
            {[
              { id:'ceiling', icon:'🔴', label:'Trần giá (Price Ceiling)', sub:'Giới hạn giá tối đa' },
              { id:'floor',   icon:'🟢', label:'Sàn giá (Price Floor)',    sub:'Giới hạn giá tối thiểu' },
              { id:'tax',     icon:'💰', label:'Đánh thuế',                sub:'Tăng chi phí sản xuất' },
              { id:'subsidy', icon:'🎁', label:'Trợ cấp (Subsidy)',        sub:'Giảm chi phí sản xuất', cls:'success' },
            ].map(({ id, icon, label, sub, cls='' }) => {
              const isForbidden = mission.phase === 'playing' && (currentDef.forbidden || []).includes(id)
              return (
                <button key={id} disabled={isForbidden}
                  className={`btn ${cls} ${intervention===id ? 'active' : ''}`}
                  style={isForbidden ? { opacity:0.35, cursor:'not-allowed', borderColor:'var(--red)' } : {}}
                  onClick={() => !isForbidden && applyIntervention(id)}>
                  {isForbidden ? '🚫' : icon} {label}
                  <span className="btn-sub">{isForbidden ? 'BỊ CẤM trong vòng này' : sub}</span>
                </button>
              )
            })}
            <button className="btn danger" onClick={clearIntervention}>✖️ Bỏ can thiệp</button>
          </div>

          {mission.phase === 'idle' && (
            <div className="card">
              <div className="card-title">🎲 Sự kiện ngẫu nhiên</div>
              <button className="btn" onClick={triggerRandom}>
                ⚡ Kích hoạt sự kiện<span className="btn-sub">Mô phỏng biến động thực tế</span>
              </button>
              <button className="btn danger" onClick={triggerCrisis}>
                💥 Khủng hoảng kinh tế<span className="btn-sub">Cú sốc toàn thị trường</span>
              </button>
            </div>
          )}

          <div className="card">
            <div className="card-title">📚 Lý thuyết</div>
            <div className="theory-note"
              dangerouslySetInnerHTML={{ __html: THEORY_NOTES[intervention] ?? THEORY_NOTES.null }} />
          </div>
        </div>

      </div>

      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''}`}>
        <div className="toast-title">{toast.title}</div>
        <div>{toast.msg}</div>
      </div>
    </div>
  )
}

// ── Guide Modal Component ──────────────────────────────────
// mini style helpers — must be declared BEFORE GUIDE_STEPS
const gp = { fontSize:'0.83rem', color:'var(--muted)', lineHeight:1.7, marginBottom:10 }
const gHighlight = (c) => ({ background:`${c}11`, border:`1px solid ${c}33`, borderRadius:8, padding:'10px 12px', fontSize:'0.8rem', color:'var(--text)', lineHeight:1.65 })
const gGrid = { display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }
const gChip = { fontSize:'0.72rem', padding:'3px 10px', borderRadius:20, background:'#252840', border:'1px solid var(--border)', color:'var(--muted)' }

const GUIDE_STEPS = [
  {
    title: 'Chào mừng!',
    emoji: '👋',
    color: '#6c63ff',
    content: (
      <div>
        <p style={gp}>Bạn đang chơi <strong style={{ color:'#6c63ff' }}>Cung – Cầu Market Simulator</strong> — trò chơi mô phỏng thị trường thực tế dựa trên lý thuyết Kinh tế Chính trị.</p>
        <div style={gHighlight('#6c63ff')}>
          <strong>🎯 Mục tiêu đơn giản:</strong><br />
          Điều chỉnh thị trường sao cho <strong>điểm phúc lợi xã hội</strong> càng cao càng tốt (tối đa 100 điểm).
        </div>
        <p style={gp}>Hướng dẫn này gồm <strong>7 bước</strong> — đọc hết khoảng 2 phút, sau đó bạn sẽ chơi được ngay!</p>
        <div style={gGrid}>
          {['📊 Đọc đồ thị','🎚️ Dùng slider','🏛️ Can thiệp','⚖️ Tính điểm','🎲 Sự kiện','🎯 Nhiệm vụ','🏆 Xếp hạng'].map((s,i) => (
            <div key={i} style={gChip}>{s}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Đồ thị Cung – Cầu là gì?',
    emoji: '📊',
    color: '#ff4d6d',
    content: (
      <div>
        <p style={gp}>Đồ thị ở giữa màn hình là trái tim của game. Nó gồm <strong>2 đường</strong>:</p>
        <div style={gHighlight('#ff4d6d')}>
          <strong style={{ color:'#ff4d6d' }}>📉 Đường Cầu (D) — màu đỏ</strong><br />
          Dốc xuống từ trái sang phải.<br />
          Ý nghĩa: Giá càng <strong>cao</strong> → người mua muốn mua <strong>ít hơn</strong>.
        </div>
        <div style={{ ...gHighlight('#00d4aa'), marginTop:10 }}>
          <strong style={{ color:'#00d4aa' }}>📈 Đường Cung (S) — màu xanh</strong><br />
          Dốc lên từ trái sang phải.<br />
          Ý nghĩa: Giá càng <strong>cao</strong> → nhà sản xuất muốn bán <strong>nhiều hơn</strong>.
        </div>
        <div style={{ ...gHighlight('#ffd32a'), marginTop:10 }}>
          <strong style={{ color:'#ffd32a' }}>⭐ Điểm vàng = Điểm cân bằng</strong><br />
          Nơi 2 đường giao nhau → giá P* và lượng Q* mà thị trường tự chọn.<br />
          <em>Đây là trạng thái lý tưởng nhất!</em>
        </div>
      </div>
    ),
  },
  {
    title: 'Cách dùng thanh trượt (Slider)',
    emoji: '🎚️',
    color: '#00d4aa',
    content: (
      <div>
        <p style={gp}>Bảng bên <strong>trái</strong> có 6 thanh trượt — kéo để thay đổi thị trường, đồ thị cập nhật ngay lập tức.</p>
        <div style={gHighlight('#ff4d6d')}>
          <strong style={{ color:'#ff4d6d' }}>📉 Nhóm CẦU (đường đỏ dịch chuyển)</strong><br />
          • <strong>Cầu cơ bản:</strong> Nhu cầu chung của xã hội. Tăng → đường D dịch phải<br />
          • <strong>Thu nhập người dân:</strong> Dân giàu hơn → mua nhiều hơn → D dịch phải<br />
          • <strong>Sở thích / Xu hướng:</strong> Hàng hot, viral → D dịch phải
        </div>
        <div style={{ ...gHighlight('#00d4aa'), marginTop:10 }}>
          <strong style={{ color:'#00d4aa' }}>📈 Nhóm CUNG (đường xanh dịch chuyển)</strong><br />
          • <strong>Cung cơ bản:</strong> Năng lực sản xuất. Tăng → S dịch phải (giá giảm)<br />
          • <strong>Chi phí sản xuất:</strong> Tăng → S dịch <em>trái</em> → giá tăng ⚠️<br />
          • <strong>Công nghệ / Năng suất:</strong> Tiến bộ → S dịch phải (giá giảm) ✅
        </div>
        <div style={{ ...gHighlight('#6c63ff'), marginTop:10 }}>
          💡 <strong>Thử ngay:</strong> Kéo "Cung cơ bản" lên 80 → xem đường xanh dịch phải, điểm vàng rơi xuống (giá giảm, lượng tăng).
        </div>
      </div>
    ),
  },
  {
    title: 'Can thiệp Chính phủ',
    emoji: '🏛️',
    color: '#ff9f43',
    content: (
      <div>
        <p style={gp}>Bảng bên <strong>phải</strong> có 4 công cụ can thiệp. Mỗi công cụ tạo ra hậu quả khác nhau:</p>
        {[
          { icon:'🔴', name:'Trần giá (Price Ceiling)', desc:'Nhà nước quy định giá tối đa. Nhà sản xuất sản xuất ít hơn, người mua muốn nhiều hơn → thiếu hàng, chợ đen xuất hiện.', ex:'Ví dụ VN: Giá xăng bao cấp thập niên 80.', color:'#ff4d6d' },
          { icon:'🟢', name:'Sàn giá (Price Floor)', desc:'Nhà nước quy định giá tối thiểu. Nhà sản xuất muốn bán nhiều, người mua không mua hết → dư thừa hàng hóa.', ex:'Ví dụ: Giá sàn thu mua lúa để bảo vệ nông dân.', color:'#00d4aa' },
          { icon:'💰', name:'Đánh thuế', desc:'Tăng chi phí sản xuất → đường S dịch trái → giá tăng, lượng giảm → xuất hiện "tổn thất phúc lợi".', ex:'Người mua trả nhiều hơn, người bán nhận ít hơn.', color:'#ffd32a' },
          { icon:'🎁', name:'Trợ cấp (Subsidy)', desc:'Nhà nước bù chi phí cho nhà sản xuất → đường S dịch phải → giá giảm, lượng tăng. Ngắn hạn tốt nhưng tốn ngân sách.', ex:'Ví dụ: Trợ giá điện, trợ cấp nông nghiệp.', color:'#6c63ff' },
        ].map(({ icon, name, desc, ex, color }) => (
          <div key={name} style={{ ...gHighlight(color), marginBottom:8 }}>
            <strong style={{ color }}>{icon} {name}</strong><br />
            {desc}<br /><em style={{ fontSize:'0.75rem', opacity:0.8 }}>{ex}</em>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Điểm phúc lợi & Surplus',
    emoji: '⚖️',
    color: '#ffd32a',
    content: (
      <div>
        <p style={gp}>Số điểm lớn ở góc phải trên (<strong style={{ color:'#ffd32a' }}>0–100</strong>) cho biết thị trường đang hoạt động tốt đến đâu.</p>
        <div style={gHighlight('#6c63ff')}>
          <strong style={{ color:'#6c63ff' }}>🔵 CS — Thặng dư tiêu dùng</strong><br />
          Số tiền người mua <em>tiết kiệm được</em> so với mức họ sẵn sàng trả.<br />
          CS cao = người dân được lợi nhiều.
        </div>
        <div style={{ ...gHighlight('#ff9f43'), marginTop:8 }}>
          <strong style={{ color:'#ff9f43' }}>🟠 PS — Thặng dư sản xuất</strong><br />
          Lợi nhuận nhà sản xuất kiếm được trên chi phí.<br />
          PS cao = doanh nghiệp phát triển tốt.
        </div>
        <div style={{ ...gHighlight('#ff4d6d'), marginTop:8 }}>
          <strong style={{ color:'#ff4d6d' }}>🔴 DWL — Tổn thất phúc lợi (Deadweight Loss)</strong><br />
          Phần giá trị xã hội bị <em>mất đi vĩnh viễn</em> do can thiệp sai.<br />
          DWL = 0 là lý tưởng nhất!
        </div>
        <div style={{ ...gHighlight('#ffd32a'), marginTop:8 }}>
          <strong>Công thức tính điểm:</strong><br />
          <code style={{ color:'#ffd32a' }}>Điểm = (CS + PS − DWL×3) ÷ (CS+PS) × 100</code><br />
          → Can thiệp sai bị phạt nặng gấp 3 lần!
        </div>
      </div>
    ),
  },
  {
    title: 'Sự kiện ngẫu nhiên',
    emoji: '🎲',
    color: '#ff4d6d',
    content: (
      <div>
        <p style={gp}>Thị trường thực tế không bao giờ yên tĩnh — luôn có cú sốc bất ngờ. Bảng <strong>Sự kiện ngẫu nhiên</strong> mô phỏng điều đó.</p>
        <div style={gHighlight('#ff9f43')}>
          <strong>⚡ Kích hoạt sự kiện</strong><br />
          Chọn ngẫu nhiên 1 trong 8 sự kiện thực tế:<br />
          <div style={{ marginTop:6, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', fontSize:'0.78rem' }}>
            {['🌾 Mùa màng thất bát','🦠 Dịch bệnh bùng phát','🚢 Hàng nhập khẩu ồ ạt','📱 Xu hướng mạng xã hội','⛽ Giá dầu thế giới tăng','🤖 Công nghệ mới ra đời','💵 Tiền lương tăng','🏭 Nhà máy đóng cửa'].map(e => <span key={e}>• {e}</span>)}
          </div>
        </div>
        <div style={{ ...gHighlight('#ff4d6d'), marginTop:10 }}>
          <strong>💥 Khủng hoảng kinh tế</strong><br />
          Cú sốc lớn: Cầu giảm −25, Cung giảm −20, Chi phí tăng +30 cùng lúc.<br />
          Thị trường rơi vào hỗn loạn — hãy tìm cách ổn định lại!
        </div>
        <div style={{ ...gHighlight('#00d4aa'), marginTop:10 }}>
          💡 <strong>Sau mỗi sự kiện:</strong> Quan sát đồ thị thay đổi như thế nào rồi dùng slider hoặc can thiệp để phản ứng. Đây là cách học lý thuyết hiệu quả nhất!
        </div>
      </div>
    ),
  },
  {
    title: 'Chế độ Nhiệm vụ',
    emoji: '🎯',
    color: '#6c63ff',
    content: (
      <div>
        <p style={gp}>Nhấn <strong style={{ color:'#ffd32a' }}>🎯 Chế độ Nhiệm vụ</strong> trên header để bắt đầu chơi có thắng/thua thực sự.</p>
        {[
          { num:'1', emoji:'📐', title:'Ổn định thị trường', time:'50 giây', type:'REACH', desc:'Thị trường đang rối loạn (điểm ~30). Điều chỉnh slider để đưa điểm ≥ 80.', tip:'Tăng Cung cơ bản + Công nghệ, giảm Chi phí.', color:'#00d4aa' },
          { num:'2', emoji:'🏛️', title:'Gỡ bỏ can thiệp sai lầm', time:'45 giây', type:'REACH', desc:'Chính phủ đang áp TRẦN GIÁ → thiếu hàng. Đưa điểm ≥ 70.', tip:'Bỏ trần giá → chọn Trợ cấp để giữ giá thấp mà không gây thiếu hàng.', color:'#ff9f43' },
          { num:'3', emoji:'🌪️', title:'Chống khủng hoảng', time:'60 giây', type:'SURVIVE', desc:'Cú sốc xấu xảy ra mỗi 10 giây. Giữ điểm ≥ 55 LIÊN TỤC đến hết giờ.', tip:'Phản ứng nhanh! Trợ cấp khi cung giảm, tăng công nghệ để bù chi phí.', color:'#ff4d6d' },
        ].map(({ num, emoji, title, time, type, desc, tip, color }) => (
          <div key={num} style={{ ...gHighlight(color), marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <strong style={{ color }}>Vòng {num} {emoji} {title}</strong>
              <span style={{ fontSize:'0.68rem', background:color+'22', color, padding:'2px 8px', borderRadius:10 }}>{type} · {time}</span>
            </div>
            <div style={{ marginTop:5, fontSize:'0.79rem' }}>{desc}</div>
            <div style={{ marginTop:4, fontSize:'0.76rem', opacity:0.75 }}>💡 {tip}</div>
          </div>
        ))}
        <div style={gHighlight('#ffd32a')}>
          <strong>🏆 Xếp hạng cuối:</strong> Đạt 3 vòng → <strong style={{ color:'#ffd32a' }}>S</strong> · 2 vòng → <strong style={{ color:'#00d4aa' }}>A</strong> · 1 vòng → <strong style={{ color:'#6c63ff' }}>B</strong> · 0 vòng → <strong style={{ color:'#ff9f43' }}>C</strong>
        </div>
      </div>
    ),
  },
]

function GuideModal({ onClose, step, setStep }) {
  const s = GUIDE_STEPS[step]
  const isLast = step === GUIDE_STEPS.length - 1
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth:580 }} onClick={e => e.stopPropagation()}>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:5, marginBottom:18 }}>
          {GUIDE_STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ flex:1, height:4, borderRadius:4, cursor:'pointer', transition:'background 0.3s',
              background: i < step ? '#00d4aa' : i === step ? s.color : 'var(--border)' }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:'2rem', lineHeight:1 }}>{s.emoji}</div>
            <div>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)', marginBottom:2 }}>BƯỚC {step + 1} / {GUIDE_STEPS.length}</div>
              <h2 style={{ color: s.color, fontSize:'1.05rem', margin:0 }}>{s.title}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1.2rem', lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ maxHeight:'52vh', overflowY:'auto', paddingRight:4 }}>
          {s.content}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', gap:10, marginTop:18, alignItems:'center' }}>
          <button className="btn" style={{ flex:1, textAlign:'center' }}
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            {step === 0 ? '✕ Đóng' : '← Trước'}
          </button>
          <span style={{ fontSize:'0.72rem', color:'var(--muted)', flexShrink:0 }}>
            {step + 1} / {GUIDE_STEPS.length}
          </span>
          {isLast
            ? <button className="btn success" style={{ flex:2, textAlign:'center' }} onClick={onClose}>✅ Bắt đầu chơi!</button>
            : <button className="btn" style={{ flex:2, textAlign:'center', borderColor: s.color, color: s.color }} onClick={() => setStep(step + 1)}>Tiếp theo →</button>
          }
        </div>
      </div>
    </div>
  )
}

// ── Shared modal styles ──
const modalOverlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
  zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16
}
const modalBox = {
  background:'var(--card)', border:'1px solid var(--border)',
  borderRadius:14, padding:28, maxWidth:480, width:'100%',
  maxHeight:'90vh', overflowY:'auto'
}
const infoBox = (color) => ({
  background: `${color}11`, border: `1px solid ${color}44`,
  borderRadius:8, padding:'10px 12px', fontSize:'0.8rem',
  color:'var(--text)', lineHeight:1.65, marginBottom:10
})
