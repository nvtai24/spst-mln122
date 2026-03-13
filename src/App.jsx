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

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ── Helpers ────────────────────────────────────────────────
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
  const toastTimer = useRef(null)
  const eventCounter = useRef(1)

  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // ── Toast helper ──
  const showToast = useCallback((title, msg) => {
    setToast({ show: true, title, msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }, [])

  // ── Add event ──
  const addEvent = useCallback((msg, type = 'neutral') => {
    const n = eventCounter.current++
    const mm = String(Math.floor(n / 60)).padStart(2, '0')
    const ss = String(n % 60).padStart(2, '0')
    setEvents(prev => [{ id: n, msg, type, t: `${mm}:${ss}` }, ...prev].slice(0, 20))
  }, [])

  // ── Compute derived values ──
  const curves = calcCurves(sliders)
  const { D_INT, S_INT, D_SLOPE, S_SLOPE, Q: eqQ, P: eqP } = curves

  const CS = 0.5 * (D_INT - eqP) * eqQ
  const PS = 0.5 * (eqP - S_INT) * eqQ
  const DWL = intervention === 'ceiling' ? CS * 0.16
            : intervention === 'floor'   ? PS * 0.16
            : intervention === 'tax'     ? (CS + PS) * 0.12
            : 0
  const maxSurplus = Math.max(CS + PS, 1)
  const score = clamp(Math.round((CS + PS - DWL * 3) / maxSurplus * 100), 0, 100)
  const inflation = Math.round((eqP - 50) / 50 * 100)

  let marketStatus = 'Cân bằng ✓'
  let marketColor  = 'var(--green)'
  if (intervention === 'ceiling') { marketStatus = 'Thiếu hàng ⚠️'; marketColor = 'var(--red)' }
  else if (intervention === 'floor') { marketStatus = 'Dư thừa ⚠️'; marketColor = 'var(--orange)' }
  else if (intervention === 'tax')   { marketStatus = 'Có thuế 💰'; marketColor = 'var(--yellow)' }
  else if (intervention === 'subsidy') { marketStatus = 'Có trợ cấp 🎁'; marketColor = 'var(--accent)' }

  // ── Chart ──
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
        responsive: true,
        animation: { duration: 350 },
        plugins: {
          legend: { labels: { color: '#8888aa', font: { size: 11 }, boxWidth: 14 } },
          tooltip: {
            backgroundColor: '#1a1d27',
            borderColor: '#2a2d3e',
            borderWidth: 1,
            titleColor: '#e0e0f0',
            bodyColor: '#8888aa',
          }
        },
        scales: {
          x: { type: 'linear', min: 0, max: 120,
               title: { display: true, text: 'Lượng (Q)', color: '#8888aa', font: { size: 11 } },
               grid: { color: 'rgba(42,45,62,0.8)' },
               ticks: { color: '#8888aa', font: { size: 10 } } },
          y: { min: 0, max: 120,
               title: { display: true, text: 'Giá (P)', color: '#8888aa', font: { size: 11 } },
               grid: { color: 'rgba(42,45,62,0.8)' },
               ticks: { color: '#8888aa', font: { size: 10 } } },
        }
      }
    })
  }, [])

  // update chart data whenever state changes
  useEffect(() => {
    const c = chartInstance.current
    if (!c) return

    c.data.datasets[0].data = buildLine(D_INT, D_SLOPE, false)
    c.data.datasets[1].data = buildLine(S_INT, S_SLOPE, true)
    c.data.datasets[2].data = [{ x: eqQ, y: eqP }]

    if (intervention === 'ceiling') {
      const lv = +(eqP * 0.75).toFixed(1)
      c.data.datasets[3].data = [{ x: 0, y: lv }, { x: 120, y: lv }]
      c.data.datasets[3].label = `Trần giá = ${lv}`
      c.data.datasets[3].borderColor = '#ff4d6d'
    } else if (intervention === 'floor') {
      const lv = +(eqP * 1.25).toFixed(1)
      c.data.datasets[3].data = [{ x: 0, y: lv }, { x: 120, y: lv }]
      c.data.datasets[3].label = `Sàn giá = ${lv}`
      c.data.datasets[3].borderColor = '#00d4aa'
    } else {
      c.data.datasets[3].data = []
      c.data.datasets[3].label = ''
    }

    c.update()
  })

  // ── Slider change ──
  const handleSlider = (key, val) => setSliders(s => ({ ...s, [key]: +val }))

  // ── Intervention ──
  const applyIntervention = (type) => {
    setIntervention(type)
    const info = {
      ceiling: ['Trần giá áp dụng!',  'Giá khóa dưới P* → Thiếu hàng, chợ đen xuất hiện.', 'bad'],
      floor:   ['Sàn giá áp dụng!',   'Giá đẩy trên P* → Dư thừa hàng hóa.', 'bad'],
      tax:     ['Thuế áp dụng!',       'Cung dịch trái → Giá tăng, lượng giảm, DWL xuất hiện.', 'bad'],
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
    addEvent('💥 KHỦNG HOẢNG KINH TẾ! Cung-cầu sụp đổ, chi phí tăng vọt.', 'bad')
    showToast('💥 Khủng hoảng!', 'Cung & cầu đều sụt giảm. Thị trường bất ổn.')
  }

  const handleProductChange = (e) => {
    setProduct(e.target.value)
    addEvent(`Chuyển sang thị trường: ${PRODUCTS[e.target.value]}`, 'neutral')
  }

  // ── Score color ──
  const scoreColor = score > 70 ? 'var(--green)' : score > 40 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1>📈 Cung – Cầu Market Simulator</h1>
          <div className="subtitle">Kinh tế Chính trị Mác–Lênin · Mô phỏng thị trường thực tế</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn" style={{ width:'auto', margin:0, padding:'6px 14px' }} onClick={() => setShowGuide(true)}>
            ❓ Cách chơi
          </button>
          <span className="badge">DEMO v1.0</span>
        </div>
      </header>

      {/* Guide Modal */}
      {showGuide && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setShowGuide(false)}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:28, maxWidth:560, width:'100%', maxHeight:'85vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ color:'var(--accent)', fontSize:'1.1rem' }}>📖 Hướng dẫn chơi</h2>
              <button onClick={() => setShowGuide(false)}
                style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1.3rem', lineHeight:1 }}>✕</button>
            </div>

            {[
              {
                icon: '🎯', title: 'Mục tiêu',
                body: 'Điều tiết thị trường để đạt điểm phúc lợi xã hội cao nhất (tối đa 100). Thị trường cân bằng tự nhiên luôn cho điểm cao nhất — mọi can thiệp đều có đánh đổi!'
              },
              {
                icon: '🎚️', title: 'Điều chỉnh Cung – Cầu',
                body: 'Kéo các thanh trượt bên trái để thay đổi thị trường:\n• Cầu: Cầu cơ bản, Thu nhập, Sở thích → đường đỏ dịch chuyển\n• Cung: Cung cơ bản, Chi phí, Công nghệ → đường xanh dịch chuyển\nĐồ thị cập nhật ngay lập tức, quan sát điểm cân bằng (P*, Q*).'
              },
              {
                icon: '🏛️', title: 'Can thiệp Chính phủ',
                body: '• 🔴 Trần giá: Đặt giá tối đa → thiếu hàng, chợ đen\n• 🟢 Sàn giá: Đặt giá tối thiểu → dư thừa hàng hóa\n• 💰 Thuế: Đường cung dịch trái → giá tăng, deadweight loss\n• 🎁 Trợ cấp: Đường cung dịch phải → giá giảm, tốn ngân sách\nNhấn "Bỏ can thiệp" để quay về thị trường tự do.'
              },
              {
                icon: '🎲', title: 'Sự kiện ngẫu nhiên',
                body: '• "Kích hoạt sự kiện": Tạo cú sốc ngẫu nhiên (thiên tai, dịch bệnh, công nghệ mới...)\n• "Khủng hoảng kinh tế": Cú sốc mạnh làm cung-cầu sụp đổ cùng lúc\nThử phản ứng bằng cách điều chỉnh slider hoặc can thiệp!'
              },
              {
                icon: '📊', title: 'Đọc kết quả',
                body: '• Thặng dư tiêu dùng (CS): lợi ích người mua nhận được\n• Thặng dư sản xuất (PS): lợi nhuận người bán\n• Tổn thất phúc lợi (DWL): phần xã hội mất đi do can thiệp\n• Điểm = (CS + PS − DWL×3) / (CS + PS) × 100'
              },
              {
                icon: '💡', title: 'Mẹo',
                body: '• Thay đổi sản phẩm để xem bối cảnh khác nhau\n• Nhật ký sự kiện ghi lại toàn bộ lịch sử thị trường\n• Ghi chú lý thuyết góc phải giải thích từng tình huống\n• Nhấn ngoài popup để đóng'
              },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ marginBottom:18 }}>
                <div style={{ fontWeight:700, color:'var(--text)', marginBottom:6, fontSize:'0.9rem' }}>{icon} {title}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--muted)', lineHeight:1.7, whiteSpace:'pre-line' }}>{body}</div>
              </div>
            ))}

            <button className="btn success" style={{ marginTop:8 }} onClick={() => setShowGuide(false)}>
              ✅ Bắt đầu chơi!
            </button>
          </div>
        </div>
      )}

      <div className="layout">

        {/* ── LEFT: Controls ── */}
        <div>
          {/* Product picker */}
          <div className="card">
            <div className="card-title">🛒 Sản phẩm thị trường</div>
            <select className="product-select" value={product} onChange={handleProductChange}>
              {Object.entries(PRODUCTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Demand */}
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
                <input type="range" className="demand-slider"
                  min="10" max="100" value={sliders[key]}
                  onChange={e => handleSlider(key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Supply */}
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
                <input type="range" className="supply-slider"
                  min="10" max="100" value={sliders[key]}
                  onChange={e => handleSlider(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER: Chart ── */}
        <div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div className="card-title" style={{ margin:0 }}>
                📊 Đồ thị Cung – Cầu
                {intervention && <span className="int-badge">Can thiệp đang hoạt động</span>}
              </div>
              <div style={{ fontSize:'0.73rem', color:'var(--muted)' }}>
                {PRODUCTS[product]}
              </div>
            </div>
            <div className="chart-wrap">
              <canvas ref={chartRef} height={300} />
            </div>
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

          {/* Welfare */}
          <div className="card">
            <div className="card-title">⚖️ Phúc lợi xã hội (Surplus)</div>
            <div className="welfare-grid">
              {[
                { label:'Thặng dư tiêu dùng', val: CS.toFixed(0), pct: clamp(CS/maxSurplus*100, 0, 100), color:'var(--accent)' },
                { label:'Thặng dư sản xuất',  val: PS.toFixed(0), pct: clamp(PS/maxSurplus*100, 0, 100), color:'var(--orange)' },
                { label:'Tổn thất phúc lợi',  val: DWL.toFixed(0), pct: clamp(DWL/(maxSurplus*0.35)*100, 0, 100), color:'var(--red)' },
              ].map(({ label, val, pct, color }) => (
                <div key={label}>
                  <div className="welfare-label"><span>{label}</span><span>{val}</span></div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: pct + '%', background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event log */}
          <div className="card">
            <div className="card-title">📰 Nhật ký sự kiện</div>
            <div className="event-log">
              {events.map(ev => (
                <div key={ev.id} className={`event-item ${ev.type === 'bad' ? 'bad' : ev.type === 'good' ? 'good' : ''}`}>
                  <div className="event-time">{ev.t}</div>
                  {ev.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Stats + Controls ── */}
        <div>
          {/* Score */}
          <div className="card">
            <div className="score-box">
              <div className="score-num" style={{ color: scoreColor }}>{score}</div>
              <div className="score-lbl">Điểm phúc lợi xã hội</div>
            </div>
            <div className="stat-row">
              <span>Lạm phát</span>
              <span style={{ fontWeight:700, color: Math.abs(inflation) > 20 ? 'var(--red)' : 'var(--yellow)' }}>
                {inflation >= 0 ? '+' : ''}{inflation}%
              </span>
            </div>
            <div className="stat-row">
              <span>Thiếu hàng / Dư thừa</span>
              <span style={{ fontWeight:700, color: intervention === 'ceiling' ? 'var(--red)' : intervention === 'floor' ? 'var(--orange)' : 'var(--green)' }}>
                {intervention === 'ceiling' ? 'THIẾU HÀNG 🔴' : intervention === 'floor' ? 'DƯ THỪA 🟡' : 'Bình thường'}
              </span>
            </div>
            <div className="stat-row">
              <span>Chợ đen</span>
              <span style={{ fontWeight:700, color: intervention === 'ceiling' ? 'var(--red)' : 'var(--muted)' }}>
                {intervention === 'ceiling' ? 'Xuất hiện 🚨' : 'Không'}
              </span>
            </div>
          </div>

          {/* Government interventions */}
          <div className="card">
            <div className="card-title">🏛️ Can thiệp Chính phủ</div>
            {[
              { id: 'ceiling', icon: '🔴', label: 'Trần giá (Price Ceiling)', sub: 'Giới hạn giá tối đa' },
              { id: 'floor',   icon: '🟢', label: 'Sàn giá (Price Floor)',   sub: 'Giới hạn giá tối thiểu' },
              { id: 'tax',     icon: '💰', label: 'Đánh thuế',               sub: 'Tăng chi phí sản xuất' },
              { id: 'subsidy', icon: '🎁', label: 'Trợ cấp (Subsidy)',       sub: 'Giảm chi phí sản xuất', cls: 'success' },
            ].map(({ id, icon, label, sub, cls = '' }) => (
              <button key={id}
                className={`btn ${cls} ${intervention === id ? 'active' : ''}`}
                onClick={() => applyIntervention(id)}>
                {icon} {label}
                <span className="btn-sub">{sub}</span>
              </button>
            ))}
            <button className="btn danger" onClick={clearIntervention}>
              ✖️ Bỏ can thiệp
            </button>
          </div>

          {/* Random events */}
          <div className="card">
            <div className="card-title">🎲 Sự kiện ngẫu nhiên</div>
            <button className="btn" onClick={triggerRandom}>
              ⚡ Kích hoạt sự kiện
              <span className="btn-sub">Mô phỏng biến động thực tế</span>
            </button>
            <button className="btn danger" onClick={triggerCrisis}>
              💥 Khủng hoảng kinh tế
              <span className="btn-sub">Cú sốc toàn thị trường</span>
            </button>
          </div>

          {/* Theory note */}
          <div className="card">
            <div className="card-title">📚 Lý thuyết</div>
            <div
              className="theory-note"
              dangerouslySetInnerHTML={{ __html: THEORY_NOTES[intervention] ?? THEORY_NOTES.null }}
            />
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
