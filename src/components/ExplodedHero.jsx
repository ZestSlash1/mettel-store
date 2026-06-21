import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Case material presets — swapped onto the shell material live, no rebuild.
const MATERIAL_PRESETS = {
  aramid: { metalness: 0.6, roughness: 0.34 },
  aluminium: { metalness: 0.92, roughness: 0.16 },
  leather: { metalness: 0.08, roughness: 0.62 },
  frosted: { metalness: 0.15, roughness: 0.55 },
  tpu: { metalness: 0.05, roughness: 0.78 },
}
// Camera-island lens count per device layout (procedural approximation, not a real mesh swap).
const LENS_COUNTS = { triple: 3, dual: 2, single: 1, square: 3 }
const BASE_ASPECT = 2.1 // matches the case geometry's own H/W ratio below

/**
 * The signature moment: a phone case built procedurally as layered components
 * that float apart (exploded technical view) and ASSEMBLE as the hero is
 * scrolled. Assembly progress is read every frame from `progressRef.current`
 * (0 = fully exploded, 1 = assembled), which the hero drives from a GSAP
 * ScrollTrigger — so this component knows nothing about scroll itself.
 *
 * This module is lazy-loaded (React.lazy) and only ever mounted on desktop with
 * motion enabled, so three.js stays out of the initial bundle and off the
 * critical path. A static SVG poster sits behind it until `onReady` fires.
 *
 * Performance guards: pixel ratio capped at 2, render loop paused via
 * IntersectionObserver when off-screen, everything disposed on unmount.
 */
export default function ExplodedHero({
  progressRef,
  cursorRef,
  onReady,
  onError,
  className = '',
  colorHex = '#dedede',
  accentHex = '#ff6b00',
  material = 'aramid',
  cameraLayout = 'triple',
  aspect = BASE_ASPECT,
}) {
  const mountRef = useRef(null)
  // Mutable handles the live-update effect below reaches into without tearing
  // down and recreating the WebGL context on every colorway/device switch.
  const liveRef = useRef({})

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      onError?.()
      return
    }

    let disposed = false
    let raf = null

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const canvas = renderer.domElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    mount.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 9)

    // Soft studio lighting + a procedural environment for believable metal.
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    const keyBase = { x: 5, y: 7 }
    key.position.set(keyBase.x, keyBase.y, 8)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffd9b3, 1.1)
    rim.position.set(-6, -3, 2)
    scene.add(rim)
    const flame = new THREE.PointLight(0xff6b00, 7, 24, 2)
    flame.position.set(-2.5, -3, 4)
    scene.add(flame)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    // ---- materials ---- (initialised from props; live-updated below without rebuild)
    const shellPreset = MATERIAL_PRESETS[material] || MATERIAL_PRESETS.aramid
    const matShell = new THREE.MeshStandardMaterial({ color: colorHex, metalness: shellPreset.metalness, roughness: shellPreset.roughness })
    const matFrame = new THREE.MeshStandardMaterial({ color: 0xb9b9b9, metalness: 0.9, roughness: 0.22 })
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.7, roughness: 0.4 })
    const matLens = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.08 })
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x12161a, metalness: 0.5, roughness: 0.18 })
    const matAccent = new THREE.MeshStandardMaterial({ color: accentHex, metalness: 0.3, roughness: 0.4, emissive: accentHex, emissiveIntensity: 0.25 })
    const materials = [matShell, matFrame, matDark, matLens, matGlass, matAccent]

    const W = 2.0, H = 4.2, D = 0.18, R = 0.34
    const group = new THREE.Group()
    scene.add(group)

    const parts = []
    const geometries = []
    /** Add an object with an assembled position and an exploded offset from it. */
    function addPart(obj, [ax, ay, az], [ex, ey, ez], rot) {
      obj.userData.assembled = new THREE.Vector3(ax, ay, az)
      obj.userData.exploded = new THREE.Vector3(ax + ex, ay + ey, az + ez)
      if (rot) obj.rotation.set(rot[0], rot[1], rot[2])
      obj.position.copy(obj.userData.exploded)
      group.add(obj)
      parts.push(obj)
      return obj
    }
    function box(w, h, d, r, seg = 5) {
      const g = new RoundedBoxGeometry(w, h, d, seg, r)
      geometries.push(g)
      return g
    }

    // device screen plate (deepest layer)
    addPart(new THREE.Mesh(box(W * 0.94, H * 0.96, 0.06, 0.26), matGlass), [0, 0, -0.14], [-0.35, -0.25, -1.7])
    // metal bumper frame — slightly larger, sits just behind the shell so its edge reads as a rail
    addPart(new THREE.Mesh(box(W + 0.12, H + 0.12, D + 0.04, R + 0.05), matFrame), [0, 0, -0.04], [0.25, 0.35, -1.05])
    // main case shell
    addPart(new THREE.Mesh(box(W, H, D, R), matShell), [0, 0, 0], [0, -0.1, -0.5])
    // camera plateau
    addPart(new THREE.Mesh(box(1.06, 1.06, 0.12, 0.22), matDark), [-0.4, 1.25, 0.12], [0.15, 0.55, 0.85])

    // three camera lenses (each a small housing + glass group)
    const lensSpots = [
      [-0.64, 1.5],
      [-0.16, 1.5],
      [-0.4, 1.04],
    ]
    const lensObjs = []
    lensSpots.forEach(([lx, ly], i) => {
      const lens = new THREE.Group()
      const hg = new THREE.CylinderGeometry(0.2, 0.22, 0.14, 28)
      const gg = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 28)
      geometries.push(hg, gg)
      const housing = new THREE.Mesh(hg, matDark)
      const glass = new THREE.Mesh(gg, matLens)
      housing.rotation.x = Math.PI / 2
      glass.rotation.x = Math.PI / 2
      glass.position.z = 0.06
      lens.add(housing, glass)
      addPart(lens, [lx, ly, 0.2], [0.15 + i * 0.1, 0.35 + i * 0.12, 0.95 + i * 0.18])
      lensObjs.push(lens)
    })
    const lensCount = LENS_COUNTS[cameraLayout] ?? 3
    lensObjs.forEach((obj, i) => { obj.visible = i < lensCount })

    // MagSafe ring
    {
      const tg = new THREE.TorusGeometry(0.55, 0.055, 14, 48)
      geometries.push(tg)
      addPart(new THREE.Mesh(tg, matFrame), [0, -0.2, 0.05], [0, -0.35, 0.7])
    }

    // side buttons / mute switch
    addPart(new THREE.Mesh(box(0.07, 0.5, 0.12, 0.03, 3), matFrame), [W / 2 + 0.02, 0.55, 0], [0.85, 0.2, 0.2])
    addPart(new THREE.Mesh(box(0.07, 0.28, 0.12, 0.03, 3), matFrame), [W / 2 + 0.02, -0.1, 0], [0.95, -0.1, 0.25])
    addPart(new THREE.Mesh(box(0.07, 0.26, 0.12, 0.03, 3), matFrame), [-W / 2 - 0.02, 0.95, 0], [-0.9, 0.25, 0.2])
    // flame accent index tab
    addPart(new THREE.Mesh(box(0.52, 0.1, 0.1, 0.04, 3), matAccent), [0, -1.82, 0.06], [0, -0.6, 0.75])

    group.scale.y = (aspect || BASE_ASPECT) / BASE_ASPECT

    liveRef.current = { matShell, matAccent, group, lensObjs }

    const smooth = (t) => t * t * (3 - 2 * t)
    function applyProgress(t) {
      const te = smooth(t)
      for (const p of parts) p.position.lerpVectors(p.userData.exploded, p.userData.assembled, te)
      group.rotation.y = THREE.MathUtils.lerp(0.6, -0.12, te)
      group.rotation.x = THREE.MathUtils.lerp(0.34, 0.05, te)
    }

    function resize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    const clock = new THREE.Clock()
    function frame() {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      const t = THREE.MathUtils.clamp(progressRef?.current ?? 0, 0, 1)
      applyProgress(t)
      const time = clock.getElapsedTime()
      group.position.y = Math.sin(time * 0.8) * 0.05 // gentle idle bob
      group.rotation.z = Math.sin(time * 0.45) * 0.012

      // Cursor-reactive key light — desktop-only, capability-gated by the
      // caller (Hero.jsx only ever populates cursorRef there). Damped so it
      // glides rather than jitters; harmless no-op when cursorRef is unset.
      if (cursorRef?.current) {
        const { x: cx, y: cy } = cursorRef.current
        key.position.x = THREE.MathUtils.lerp(key.position.x, keyBase.x + cx * 2.2, 0.06)
        key.position.y = THREE.MathUtils.lerp(key.position.y, keyBase.y - cy * 1.6, 0.06)
      }

      renderer.render(scene, camera)
    }

    // First paint, then hand control to the hero (fade the canvas in).
    resize()
    applyProgress(progressRef?.current ?? 0)
    renderer.render(scene, camera)
    onReady?.()

    // Only burn frames while the hero is on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!raf && !disposed) frame()
        } else if (raf) {
          cancelAnimationFrame(raf)
          raf = null
        }
      },
      { threshold: 0 },
    )
    io.observe(mount)

    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    return () => {
      disposed = true
      liveRef.current = {}
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      if (scene.environment) scene.environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live colorway/material/device updates — mutate the existing scene instead
  // of tearing down the WebGL context on every switch.
  useEffect(() => {
    const live = liveRef.current
    if (!live.matShell) return
    live.matShell.color.set(colorHex)
    live.matAccent.color.set(accentHex)
    live.matAccent.emissive.set(accentHex)
    const preset = MATERIAL_PRESETS[material] || MATERIAL_PRESETS.aramid
    live.matShell.metalness = preset.metalness
    live.matShell.roughness = preset.roughness
    const lensCount = LENS_COUNTS[cameraLayout] ?? 3
    live.lensObjs.forEach((obj, i) => { obj.visible = i < lensCount })
    live.group.scale.y = (aspect || BASE_ASPECT) / BASE_ASPECT
  }, [colorHex, accentHex, material, cameraLayout, aspect])

  return <div ref={mountRef} className={className} aria-hidden="true" />
}
