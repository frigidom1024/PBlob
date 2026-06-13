<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId = 0
let shapes: Shape[] = []

interface Shape {
  type: 'rect' | 'line' | 'circle'
  x: number
  y: number
  w: number
  h: number
  rotation: number
  speed: number
  rotSpeed: number
  alpha: number
  color: 'primary' | 'deep' | 'hover'
  phase: number
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function parseOKLCH(color: string, alpha: number): string {
  // Extract lightness, chroma, hue from oklch() and append alpha
  const match = color.match(/oklch\(([^)]+)\)/)
  if (!match) return `rgba(0,0,0,${alpha})`
  const parts = match[1].trim().split(/\s+/)
  return `oklch(${parts[0]} ${parts[1]} ${parts[2]} / ${alpha})`
}

function getColor(name: 'primary' | 'deep' | 'hover', alpha: number): string {
  const varName = name === 'primary' ? '--color-primary'
    : name === 'deep' ? '--color-primary-deep'
    : '--color-primary-hover'
  const val = getCSSVar(varName)
  return parseOKLCH(val, alpha)
}

function initShapes(w: number, h: number) {
  const count = Math.min(12, Math.floor((w * h) / 30000))
  shapes = []

  for (let i = 0; i < count; i++) {
    const type = i % 3 === 0 ? 'line' : i % 3 === 1 ? 'circle' : 'rect'
    const isLarge = i < 3
    const size = isLarge
      ? { w: w * (0.06 + Math.random() * 0.08), h: type === 'line' ? 1 : h * (0.04 + Math.random() * 0.06) }
      : { w: 20 + Math.random() * 60, h: type === 'line' ? 1 : 20 + Math.random() * 60 }

    shapes.push({
      type,
      x: Math.random() * w,
      y: Math.random() * h,
      w: size.w,
      h: size.h,
      rotation: Math.random() * Math.PI,
      speed: 0.08 + Math.random() * 0.15,
      rotSpeed: (Math.random() - 0.5) * 0.004,
      alpha: isLarge ? 0.04 + Math.random() * 0.04 : 0.06 + Math.random() * 0.08,
      color: isLarge ? 'deep' : (i % 2 === 0 ? 'primary' : 'hover'),
      phase: Math.random() * Math.PI * 2,
    })
  }
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.clearRect(0, 0, w, h)

  for (const s of shapes) {
    const drift = Math.sin(time * 0.0003 + s.phase) * 30
    const x = s.x + drift
    const y = s.y + Math.cos(time * 0.0002 + s.phase) * 20
    const rot = s.rotation + time * s.rotSpeed

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)

    const alpha = s.alpha * (0.5 + 0.5 * Math.sin(time * 0.0005 + s.phase))
    ctx.fillStyle = getColor(s.color, alpha)
    ctx.strokeStyle = getColor(s.color, Math.min(alpha * 1.5, 0.3))

    if (s.type === 'rect') {
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h)
      ctx.lineWidth = 1
      ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h)
    } else if (s.type === 'line') {
      ctx.lineWidth = s.h
      ctx.beginPath()
      ctx.moveTo(-s.w / 2, 0)
      ctx.lineTo(s.w / 2, 0)
      ctx.stroke()
    } else if (s.type === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, s.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.restore()
  }
}

function startAnimation() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  function resize() {
    canvas!.width = window.innerWidth
    canvas!.height = window.innerHeight
    initShapes(canvas!.width, canvas!.height)
  }

  resize()
  window.addEventListener('resize', resize)

  function loop(time: number) {
    draw(ctx!, canvas!.width, canvas!.height, time)
    animationId = requestAnimationFrame(loop)
  }

  animationId = requestAnimationFrame(loop)

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', resize)
  })
}

onMounted(() => {
  startAnimation()
})
</script>

<template>
  <canvas ref="canvasRef" class="canvas-bg" />
</template>

<style scoped>
.canvas-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
