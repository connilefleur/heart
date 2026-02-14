import './style.css'

const HEART_K = 18
const PHASE1_MS = 450
const PHASE2_MS = 900

const STRIP_WIDTH = 500
const GAP_LEFT_INIT = 220
const GAP_RIGHT_INIT = 280
const GAP_CLOSE_X = 250
const STRIP_HEIGHT = 600
const BASELINE_Y = 300
const HEART_AMPLITUDE = 70
const HEART_WIDTH = 88
const PTS_BASELINE = 25
const PTS_PER_HEART = 80
const NUM_HEARTS = 1
const PULSE_TO_HEART_MS = 700
const PULSE_TO_FLAT_MS = 350

const sqrt3 = Math.sqrt(3)
const Y_AT_EDGE = Math.pow(3, 1 / 3)
const Y_MID = Y_AT_EDGE / 2
const BLEND_PTS = 10

function heartY(xMath) {
  const x2 = xMath * xMath
  const radicand = 3 - x2
  if (radicand <= 0) return 0
  return Math.pow(x2, 1 / 3) + 0.9 * Math.sin(HEART_K * xMath) * Math.sqrt(radicand)
}

function buildStripLayout() {
  const gap = (STRIP_WIDTH - NUM_HEARTS * HEART_WIDTH) / (NUM_HEARTS + 1)
  const hearts = []
  for (let i = 0; i < NUM_HEARTS; i++) {
    const xStart = gap + i * (HEART_WIDTH + gap)
    hearts.push({ xStart, xEnd: xStart + HEART_WIDTH, centerX: xStart + HEART_WIDTH / 2 })
  }
  return { gap, hearts }
}

const { hearts } = buildStripLayout()

const TOTAL_PTS =
  PTS_BASELINE * 2 +
  NUM_HEARTS * PTS_PER_HEART +
  (NUM_HEARTS - 1) * PTS_BASELINE

const N_LEFT = Math.floor(TOTAL_PTS / 2)
const N_RIGHT = TOTAL_PTS - N_LEFT

function lineWithGapPathPoints(gapLeft, gapRight) {
  const pts = []
  for (let i = 0; i < N_LEFT; i++) {
    const t = i / (N_LEFT - 1 || 1)
    pts.push([t * gapLeft, BASELINE_Y])
  }
  for (let i = 0; i < N_RIGHT; i++) {
    const t = i / (N_RIGHT - 1 || 1)
    pts.push([gapRight + t * (STRIP_WIDTH - gapRight), BASELINE_Y])
  }
  return pts
}

function pointsToPathTwoSegments(ptsLeft, ptsRight) {
  if (ptsLeft.length === 0 && ptsRight.length === 0) return ''
  let d = ''
  if (ptsLeft.length > 0) {
    d = `M ${ptsLeft[0][0]} ${ptsLeft[0][1]}`
    for (let i = 1; i < ptsLeft.length; i++) {
      d += ` L ${ptsLeft[i][0]} ${ptsLeft[i][1]}`
    }
  }
  if (ptsRight.length > 0) {
    if (d) d += ' '
    d += `M ${ptsRight[0][0]} ${ptsRight[0][1]}`
    for (let i = 1; i < ptsRight.length; i++) {
      d += ` L ${ptsRight[i][0]} ${ptsRight[i][1]}`
    }
  }
  return d
}

function stripWithHeartsPathPoints() {
  const pts = []
  const halfW = HEART_WIDTH / 2
  const xScale = halfW / sqrt3

  let seg = 0
  let heartIndex = 0

  const addBaseline = (x0, x1, n) => {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1 || 1)
      pts.push([x0 + t * (x1 - x0), BASELINE_Y])
    }
  }

  const addHeart = (xStart, xEnd) => {
    const centerX = (xStart + xEnd) / 2
    const n = PTS_PER_HEART
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1 || 1)
      const xMath = -sqrt3 + t * (2 * sqrt3)
      const yMath = heartY(xMath)
      const yCentered = yMath - Y_MID
      const svgX = centerX + xMath * xScale
      let svgY = BASELINE_Y - yCentered * HEART_AMPLITUDE
      const blendIn = i < BLEND_PTS ? i / BLEND_PTS : 1
      const blendOut = i >= n - BLEND_PTS ? (n - 1 - i) / BLEND_PTS : 1
      let blend = Math.min(blendIn, blendOut)
      blend = blend * blend * (3 - 2 * blend)
      if (blend < 1) {
        svgY = BASELINE_Y + blend * (svgY - BASELINE_Y)
      }
      pts.push([svgX, svgY])
    }
  }

  addBaseline(0, hearts[0].xStart, PTS_BASELINE)
  for (let h = 0; h < NUM_HEARTS; h++) {
    addHeart(hearts[h].xStart, hearts[h].xEnd)
    if (h < NUM_HEARTS - 1) {
      addBaseline(hearts[h].xEnd, hearts[h + 1].xStart, PTS_BASELINE)
    }
  }
  addBaseline(hearts[NUM_HEARTS - 1].xEnd, STRIP_WIDTH, PTS_BASELINE)

  return pts
}

const heartPoints = stripWithHeartsPathPoints()

const HEART_SEG_START = PTS_BASELINE
const HEART_SEG_END = PTS_BASELINE + PTS_PER_HEART
const heartSegmentX = heartPoints.slice(HEART_SEG_START, HEART_SEG_END).map(p => p[0])
const heartSegmentYOffset = heartPoints.slice(HEART_SEG_START, HEART_SEG_END).map(p => p[1] - BASELINE_Y)

function pathPointsWithAmplitude(amp) {
  const pts = []
  for (let i = 0; i < HEART_SEG_START; i++) {
    pts.push([heartPoints[i][0], heartPoints[i][1]])
  }
  for (let i = 0; i < heartSegmentX.length; i++) {
    pts.push([heartSegmentX[i], BASELINE_Y + amp * heartSegmentYOffset[i]])
  }
  for (let i = HEART_SEG_END; i < heartPoints.length; i++) {
    pts.push([heartPoints[i][0], heartPoints[i][1]])
  }
  return pts
}

function pointsToPath(pts) {
  if (pts.length === 0) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0]} ${pts[i][1]}`
  }
  return d
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const pathEl = document.getElementById('morph-path')
const btn = document.getElementById('click-me')
const stage = document.querySelector('.stage')

let showingHearts = false

function pathWithGap(gapLeft, gapRight) {
  const pts = lineWithGapPathPoints(gapLeft, gapRight)
  const leftPts = pts.slice(0, N_LEFT)
  const rightPts = pts.slice(N_LEFT)
  return pointsToPathTwoSegments(leftPts, rightPts)
}

pathEl.setAttribute('d', pathWithGap(GAP_LEFT_INIT, GAP_RIGHT_INIT))

btn.addEventListener('click', () => {
  if (showingHearts) return
  showingHearts = true
  btn.classList.add('hidden')
  stage.classList.add('heart-visible')

  const start = performance.now()
  let phase = 1
  let pulsePhaseStart = 0
  let pulseToHeart = false

  function tick(now) {
    const elapsed = now - start

    if (phase === 1) {
      const t = Math.min(elapsed / PHASE1_MS, 1)
      const eased = easeInOutCubic(t)
      const gapLeft = GAP_LEFT_INIT + eased * (GAP_CLOSE_X - GAP_LEFT_INIT)
      const gapRight = GAP_RIGHT_INIT - eased * (GAP_RIGHT_INIT - GAP_CLOSE_X)
      pathEl.setAttribute('d', pathWithGap(gapLeft, gapRight))
      if (t >= 1) {
        phase = 2
        pathEl.setAttribute('d', pointsToPath(pathPointsWithAmplitude(0)))
      }
      requestAnimationFrame(tick)
      return
    }

    if (phase === 2) {
      const phase2Start = PHASE1_MS
      const phase2Elapsed = elapsed - phase2Start
      const t = Math.min(phase2Elapsed / PHASE2_MS, 1)
      const eased = easeInOutCubic(t)
      pathEl.setAttribute('d', pointsToPath(pathPointsWithAmplitude(eased)))
      if (t >= 1) {
        phase = 3
        pulsePhaseStart = now
        pulseToHeart = false
      }
      requestAnimationFrame(tick)
      return
    }

    const pulseElapsed = now - pulsePhaseStart
    const duration = pulseToHeart ? PULSE_TO_HEART_MS : PULSE_TO_FLAT_MS
    const t = Math.min(pulseElapsed / duration, 1)
    const eased = easeInOutCubic(t)
    const amp = pulseToHeart ? eased : 1 - eased
    pathEl.setAttribute('d', pointsToPath(pathPointsWithAmplitude(amp)))
    if (t >= 1) {
      pulseToHeart = !pulseToHeart
      pulsePhaseStart = now
    }
    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
})
