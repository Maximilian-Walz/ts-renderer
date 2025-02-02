import { Camera, GlTf, Mesh, Node, Scene } from 'gltf-loader-ts/lib/gltf'
import { mat4, quat, vec3 } from 'wgpu-matrix'
import { CameraComponent, CameraType, ComponentType, LightComponent, LightType, MeshRendererComponent, PrimitiveRenderData, TransformComponent } from '../components'
import { Scene as EngineScene, Entity } from '../scenes/Scene'
import { AssetManager } from './AssetManager'

type MeshIdCreator = (meshIndex: number, primitiveIndex: number) => string
type MaterialIdCreator = (index: number) => string

export class GltfEntityLoader {
  private assetManager: AssetManager
  private nodes: Node[]
  private meshes: Mesh[]
  private cameras: Camera[]
  private extensions: any

  private meshIdCreator: MeshIdCreator
  private materialIdCreator: MaterialIdCreator

  public constructor(assetManager: AssetManager, gltf: GlTf, meshIdCreator: MeshIdCreator, materialIdCreator: MaterialIdCreator) {
    this.assetManager = assetManager
    this.nodes = gltf.nodes ?? []
    this.meshes = gltf.meshes ?? []
    this.cameras = gltf.cameras ?? []
    this.extensions = gltf.extensions

    this.meshIdCreator = meshIdCreator
    this.materialIdCreator = materialIdCreator
  }

  public importScene(scene: Scene): EngineScene {
    const engineScene = new EngineScene(scene.name)
    scene.nodes?.forEach((nodeId) => {
      this.addEntitiesFromNodes(engineScene, nodeId)
    })
    return engineScene
  }

  private addEntitiesFromNodes(engineScene: EngineScene, nodeIndex: number, parentTransform?: TransformComponent) {
    const node = this.nodes[nodeIndex]

    const entity: Entity = new Map()
    let transformComponent: TransformComponent
    if (node.matrix) {
      transformComponent = TransformComponent.fromMatrix(mat4.create(...node.matrix), parentTransform)
    } else {
      const translation = node.translation ? vec3.fromValues(...node.translation) : undefined
      const rotation = node.rotation ? quat.fromValues(...node.rotation) : undefined
      const scale = node.scale ? vec3.fromValues(...node.scale) : undefined
      transformComponent = TransformComponent.fromValues(translation, rotation, scale, parentTransform)
    }
    transformComponent.name = node.name
    entity.set(ComponentType.TRANSFORM, transformComponent)

    if (node.mesh != undefined) entity.set(ComponentType.MESH_RENDERER, this.loadMeshRenderer(node.mesh))
    if (node.camera != undefined) entity.set(ComponentType.CAMERA, this.loadCamera(this.cameras[node.camera]))
    if (node.extensions != undefined) this.loadExtensions(entity, node.extensions)
    engineScene.entities.set(node.name, entity)

    if (node.children != undefined) node.children.forEach((childIndex: number) => this.addEntitiesFromNodes(engineScene, childIndex, transformComponent))
  }

  private loadMeshRenderer(meshIndex: number): MeshRendererComponent {
    const mesh = this.meshes[meshIndex]

    const primitives: PrimitiveRenderData[] = []
    mesh.primitives.forEach((primitive, primitiveIndex) => {
      if (primitive.indices != undefined) {
        let materialLoader
        if (primitive.material != undefined) {
          materialLoader = this.assetManager.getMaterialLoader(this.materialIdCreator(primitive.material))
        } else {
          materialLoader = this.assetManager.getMaterialLoader('default')
        }

        primitives.push({
          materialLoader: materialLoader,
          meshLoader: this.assetManager.getMeshLoader(this.meshIdCreator(meshIndex, primitiveIndex)),
        })
      }
    })

    const meshRenderer = new MeshRendererComponent()
    meshRenderer.name = mesh.name
    meshRenderer.primitives = primitives
    return meshRenderer
  }

  private loadCamera(camera: Camera): CameraComponent {
    let cameraComponent: CameraComponent
    if (camera.type == 'perspective') {
      const perspectiveData = camera.perspective!
      const cameraData = {
        fov: perspectiveData.yfov,
        aspect: (perspectiveData.aspectRatio ??= 1),
      }
      cameraComponent = new CameraComponent(CameraType.PERSPECTIVE, cameraData, perspectiveData.znear, perspectiveData.zfar)
      cameraComponent.useCanvasAspect = !perspectiveData.aspectRatio
    } else {
      const orthographicData = camera.orthographic!
      const cameraData = {
        xMag: orthographicData.xmag,
        yMag: orthographicData.ymag,
      }
      cameraComponent = new CameraComponent(CameraType.ORTHOGRAPHIC, cameraData, orthographicData.znear, orthographicData.zfar)
    }
    cameraComponent.name = camera.name
    return cameraComponent
  }

  private loadExtensions(entity: Entity, extensions: any) {
    if (extensions.KHR_lights_punctual != undefined) entity.set(ComponentType.LIGHT, this.loadLight(extensions.KHR_lights_punctual.light))
  }

  private loadLight(lightIndex: number): LightComponent {
    const light = this.extensions.KHR_lights_punctual.lights[lightIndex]

    let type: LightType
    switch (light.type) {
      case 'directional':
        type = LightType.SUN
        break
      case 'pont':
        type = LightType.POINT
      default:
        type = LightType.POINT
    }

    return new LightComponent(light.color, 2, type, type == LightType.SUN)
  }
}
