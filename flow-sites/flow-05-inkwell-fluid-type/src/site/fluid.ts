// GPU stable-fluids solver on WebGL2 ping-pong render targets (velocity, pressure, dye),
// plus divergence and curl scratch targets. One fullscreen quad, one ortho camera, material
// swapped per pass. Nothing allocates per frame.

import {
  Camera,
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  type MagnificationTextureFilter,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  type Texture,
  Vector2,
  Vector3,
  Vector4,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import * as F from './shaders/fluid'

type RT = WebGLRenderTarget
class Double {
  read: RT
  write: RT
  constructor(make: () => RT) {
    this.read = make()
    this.write = make()
  }
  swap() {
    const t = this.read
    this.read = this.write
    this.write = t
  }
  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}

export interface Splat {
  x: number
  y: number
  dx: number
  dy: number
  /** ink (r) and vermilion (g) */
  ink: number
  ver: number
  radius: number
}

export interface StepParams {
  dt: number
  curl: number
  velocityDissipation: number
  dyeDissipation: number
  settle: number
  iterations: number
}

const MAX_SPLATS = 12

export class FluidSim {
  readonly simW: number
  readonly simH: number
  readonly dyeW: number
  readonly dyeH: number
  private velocity: Double
  private dye: Double
  private pressure: Double
  private divergence: RT
  private curl: RT
  private scene = new Scene()
  private camera = new Camera()
  private quad: Mesh
  private m: Record<string, ShaderMaterial>
  private simTexel: Vector2
  private dyeTexel: Vector2
  private splats: Splat[] = []

  constructor(simRes: number, dyeRes: number, aspect: number, mask: Texture) {
    this.simH = simRes
    this.simW = Math.round(simRes * aspect)
    this.dyeH = dyeRes
    this.dyeW = Math.round(dyeRes * aspect)
    const rt = (w: number, h: number, filter: MagnificationTextureFilter = LinearFilter) => () =>
      new WebGLRenderTarget(w, h, {
        type: HalfFloatType,
        format: RGBAFormat,
        minFilter: filter,
        magFilter: filter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      })
    this.velocity = new Double(rt(this.simW, this.simH))
    this.dye = new Double(rt(this.dyeW, this.dyeH))
    this.pressure = new Double(rt(this.simW, this.simH, NearestFilter))
    this.divergence = rt(this.simW, this.simH, NearestFilter)()
    this.curl = rt(this.simW, this.simH, NearestFilter)()
    this.simTexel = new Vector2(1 / this.simW, 1 / this.simH)
    this.dyeTexel = new Vector2(1 / this.dyeW, 1 / this.dyeH)
    const mk = (fragmentShader: string, uniforms: Record<string, { value: unknown }>) =>
      new ShaderMaterial({ vertexShader: F.passVertex, fragmentShader, uniforms, depthTest: false, depthWrite: false })
    const points = Array.from({ length: MAX_SPLATS }, () => new Vector4())
    const values = Array.from({ length: MAX_SPLATS }, () => new Vector3())
    this.m = {
      advect: mk(F.advectFragment, { uVelocity: { value: null }, uSource: { value: null }, uTexel: { value: this.simTexel }, uDt: { value: 0 }, uDissipation: { value: 0 } }),
      splat: mk(F.splatFragment, { uTarget: { value: null }, uAspect: { value: aspect }, uCount: { value: 0 }, uPoints: { value: points }, uValues: { value: values } }),
      curl: mk(F.curlFragment, { uVelocity: { value: null }, uTexel: { value: this.simTexel } }),
      force: mk(F.forceFragment, {
        uVelocity: { value: null },
        uCurl: { value: null },
        uMask: { value: mask },
        uTexel: { value: this.simTexel },
        uCurlStrength: { value: 0 },
        uDt: { value: 0 },
        uSettle: { value: 0 },
        uMaskTexel: { value: new Vector2(3 / 1024, 3 / 640) },
      }),
      divergence: mk(F.divergenceFragment, { uVelocity: { value: null }, uTexel: { value: this.simTexel } }),
      pressure: mk(F.pressureFragment, { uPressure: { value: null }, uDivergence: { value: null }, uTexel: { value: this.simTexel } }),
      gradient: mk(F.gradientFragment, { uPressure: { value: null }, uVelocity: { value: null }, uTexel: { value: this.simTexel } }),
      scale: mk(F.scaleFragment, { uSource: { value: null }, uScale: { value: 1 } }),
      settleDye: mk(F.settleDyeFragment, { uDye: { value: null }, uMask: { value: mask }, uSettle: { value: 0 }, uDt: { value: 0 } }),
    }
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.m.advect)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
  }

  get dyeTexture() {
    return this.dye.read.texture
  }
  get dyeTexelSize() {
    return this.dyeTexel
  }

  addSplat(s: Splat) {
    if (this.splats.length < MAX_SPLATS) this.splats.push(s)
  }

  private pass(gl: WebGLRenderer, mat: ShaderMaterial, target: RT) {
    this.quad.material = mat
    gl.setRenderTarget(target)
    gl.render(this.scene, this.camera)
  }

  private flushSplats(gl: WebGLRenderer) {
    const n = this.splats.length
    if (!n) return
    const u = this.m.splat.uniforms
    const pts = u.uPoints.value as Vector4[]
    const vals = u.uValues.value as Vector3[]
    u.uCount.value = n
    // velocity splats (in grid cells per second)
    for (let i = 0; i < n; i++) {
      const s = this.splats[i]
      pts[i].set(s.x, s.y, s.radius, 0)
      vals[i].set(s.dx, s.dy, 0)
    }
    u.uTarget.value = this.velocity.read.texture
    this.pass(gl, this.m.splat, this.velocity.write)
    this.velocity.swap()
    // dye splats
    for (let i = 0; i < n; i++) {
      const s = this.splats[i]
      vals[i].set(s.ink, s.ver, 0)
    }
    u.uTarget.value = this.dye.read.texture
    this.pass(gl, this.m.splat, this.dye.write)
    this.dye.swap()
    this.splats.length = 0
  }

  step(gl: WebGLRenderer, p: StepParams) {
    const prev = gl.getRenderTarget()
    const autoClear = gl.autoClear
    gl.autoClear = false
    const m = this.m
    this.flushSplats(gl)
    // curl + vorticity confinement + settle forces
    m.curl.uniforms.uVelocity.value = this.velocity.read.texture
    this.pass(gl, m.curl, this.curl)
    const f = m.force.uniforms
    f.uVelocity.value = this.velocity.read.texture
    f.uCurl.value = this.curl.texture
    f.uCurlStrength.value = p.curl
    f.uDt.value = p.dt
    f.uSettle.value = p.settle
    this.pass(gl, m.force, this.velocity.write)
    this.velocity.swap()
    // projection
    m.divergence.uniforms.uVelocity.value = this.velocity.read.texture
    this.pass(gl, m.divergence, this.divergence)
    m.scale.uniforms.uSource.value = this.pressure.read.texture
    m.scale.uniforms.uScale.value = 0.8
    this.pass(gl, m.scale, this.pressure.write)
    this.pressure.swap()
    const pu = m.pressure.uniforms
    pu.uDivergence.value = this.divergence.texture
    for (let i = 0; i < p.iterations; i++) {
      pu.uPressure.value = this.pressure.read.texture
      this.pass(gl, m.pressure, this.pressure.write)
      this.pressure.swap()
    }
    const g = m.gradient.uniforms
    g.uPressure.value = this.pressure.read.texture
    g.uVelocity.value = this.velocity.read.texture
    this.pass(gl, m.gradient, this.velocity.write)
    this.velocity.swap()
    // advect velocity
    const a = m.advect.uniforms
    a.uTexel.value = this.simTexel
    a.uVelocity.value = this.velocity.read.texture
    a.uSource.value = this.velocity.read.texture
    a.uDt.value = p.dt
    a.uDissipation.value = p.velocityDissipation
    this.pass(gl, m.advect, this.velocity.write)
    this.velocity.swap()
    // advect dye (velocity texel converts cells/s to uv/s, same domain)
    a.uVelocity.value = this.velocity.read.texture
    a.uSource.value = this.dye.read.texture
    a.uDissipation.value = p.dyeDissipation
    this.pass(gl, m.advect, this.dye.write)
    this.dye.swap()
    // settle the dye into the letters
    if (p.settle > 0.001) {
      const s = m.settleDye.uniforms
      s.uDye.value = this.dye.read.texture
      s.uSettle.value = p.settle
      s.uDt.value = p.dt
      this.pass(gl, m.settleDye, this.dye.write)
      this.dye.swap()
    }
    gl.setRenderTarget(prev)
    gl.autoClear = autoClear
  }

  dispose() {
    this.velocity.dispose()
    this.dye.dispose()
    this.pressure.dispose()
    this.divergence.dispose()
    this.curl.dispose()
    this.quad.geometry.dispose()
    Object.values(this.m).forEach((m) => m.dispose())
  }
}

/** Headline mask: R = crisp letters (slightly blurred), G = wide blur used as an attractor field. */
export function makeHeadlineCanvas(text: string, font: string, w = 1024, h = 640) {
  const crisp = document.createElement('canvas')
  crisp.width = w
  crisp.height = h
  const c = crisp.getContext('2d')!
  c.fillStyle = '#000'
  c.fillRect(0, 0, w, h)
  let size = h * 0.36
  c.font = `${size}px ${font}`
  // headline sits right of centre so the text panel (left on desktop) does not cover it
  const max = w * 0.6
  const width = c.measureText(text).width
  if (width > max) size *= max / width
  const draw = (ctx: CanvasRenderingContext2D, blur: number) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.font = `${size}px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none'
    ctx.fillStyle = '#fff'
    ctx.fillText(text, w * 0.62, h / 2 + size * 0.04)
    ctx.filter = 'none'
  }
  draw(c, 1.5)
  const soft = document.createElement('canvas')
  soft.width = w
  soft.height = h
  const sc = soft.getContext('2d')!
  draw(sc, 22)
  // pack: R = crisp, G = soft (canvas texture is RGBA8)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const oc = out.getContext('2d')!
  const a = c.getImageData(0, 0, w, h)
  const b = sc.getImageData(0, 0, w, h)
  for (let i = 0; i < a.data.length; i += 4) {
    a.data[i + 1] = b.data[i]
    a.data[i + 2] = 0
    a.data[i + 3] = 255
  }
  oc.putImageData(a, 0, 0)
  return out
}
