import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const GLB_PATH = '/glb/Nail.glb'

const SILVER = new THREE.MeshPhysicalMaterial({
  color: 0xc0c4c8,
  metalness: 1,
  roughness: 0.25,
  envMapIntensity: 1.2,
})

function applySilverMaterial(mesh) {
  if (mesh.isMesh) {
    mesh.material = SILVER.clone()
  }
  mesh.children.forEach(applySilverMaterial)
}

export function initNailViewer(container) {
  const width = container.clientWidth
  const height = container.clientHeight

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 100)
  camera.position.set(0.6, 0.5, 0.8)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  container.appendChild(renderer.domElement)

  // 3-point studio lighting
  const key = new THREE.DirectionalLight(0xffffff, 1.2)
  key.position.set(2, 3, 4)
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xe8ecf0, 0.5)
  fill.position.set(-2, 1, 2)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(0xffffff, 0.4)
  rim.position.set(0, 2, -3)
  scene.add(rim)

  const ambient = new THREE.AmbientLight(0x404060, 0.15)
  scene.add(ambient)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 0.3
  controls.maxDistance = 3

  const TILT_DEG = 10
  const horizontalWrapper = new THREE.Group()
  horizontalWrapper.rotation.x = -Math.PI / 2
  scene.add(horizontalWrapper)

  const pivot = new THREE.Group()
  pivot.name = 'nail-pivot'
  horizontalWrapper.add(pivot)

  const tiltGroup = new THREE.Group()
  tiltGroup.rotation.x = (TILT_DEG * Math.PI) / 180
  pivot.add(tiltGroup)

  const loader = new GLTFLoader()
  loader.load(
    GLB_PATH,
    (gltf) => {
      const root = gltf.scene
      root.traverse(applySilverMaterial)
      const box = new THREE.Box3().setFromObject(root)
      const center = box.getCenter(new THREE.Vector3())
      root.position.sub(center)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 0.58 / maxDim
      root.scale.setScalar(scale)
      root.rotation.y = Math.PI
      tiltGroup.add(root)
      rotationStartTime = performance.now()
    },
    undefined,
    (err) => console.error('GLB load error:', err)
  )

  const SPIN_SPEED = 0.35
  const START_ROTATION_Y = Math.PI
  let rotationStartTime = null

  function animate() {
    requestAnimationFrame(animate)
    const elapsed =
      rotationStartTime !== null ? (performance.now() - rotationStartTime) / 1000 : 0
    pivot.rotation.y = START_ROTATION_Y + elapsed * SPIN_SPEED
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  function onResize() {
    const w = container.clientWidth
    const h = container.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.remove()
  }
}
