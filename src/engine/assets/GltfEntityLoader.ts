import { Camera, GlTf, Mesh, Node, Scene } from 'gltf-loader-ts/lib/gltf'
import { mat3, mat4, quat, vec3 } from 'wgpu-matrix'
import {
  CameraComponent,
  CameraProps,
  CameraType,
  ComponentType,
  LightComponent,
  LightProps,
  LightType,
  MeshRendererComponent,
  MeshRendererProps,
  PrimitiveRenderData,
  TransformComponent,
  TransformProps,
} from '../components'
import { Entity } from '../scenes/Entity'
import { Scene as EngineScene, SceneId } from '../scenes/Scene'
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

  public importScene(sceneId: SceneId, scene: Scene): EngineScene {
    const engineScene = new EngineScene(sceneId, scene.name)
    scene.nodes?.forEach((nodeId) => {
      this.addEntitiesFromNodes(engineScene, nodeId)
    })
    return engineScene
  }

  private addEntitiesFromNodes(engineScene: EngineScene, nodeIndex: number, parentEntity?: Entity) {
    const node = this.nodes[nodeIndex]

    let position, scale, rotation
    if (node.matrix) {
      const matrix = mat4.create(...node.matrix)
      position = vec3.getTranslation(matrix)
      scale = vec3.getScaling(matrix)
      rotation = quat.fromMat(mat3.fromMat4(matrix))
    } else {
      position = node.translation ? vec3.fromValues(...node.translation) : undefined
      rotation = node.rotation ? quat.fromValues(...node.rotation) : undefined
      scale = node.scale ? vec3.fromValues(...node.scale) : undefined
    }

    let transformProps: TransformProps = {
      name: node.name,
      position: position,
      rotation: rotation,
      scale: scale,
      parentTransform: parentEntity?.getComponent(ComponentType.TRANSFORM) as TransformComponent,
    }

    const entity = engineScene.createEntity(node.name, transformProps)
    if (node.mesh != undefined) entity.addComponent(MeshRendererComponent, this.loadMeshRenderer(node.mesh))
    if (node.camera != undefined) entity.addComponent(CameraComponent, this.loadCamera(this.cameras[node.camera]))
    if (node.extensions != undefined) this.loadExtensions(entity, node.extensions)
    if (node.children != undefined) node.children.forEach((childIndex: number) => this.addEntitiesFromNodes(engineScene, childIndex, entity))
  }

  private loadMeshRenderer(meshIndex: number): MeshRendererProps {
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

    return {
      name: mesh.name,
      primitives: primitives,
    }
  }

  private loadCamera(camera: Camera): CameraProps {
    if (camera.type == 'perspective') {
      const perspectiveData = camera.perspective!
      return {
        name: camera.name,
        cameraType: CameraType.PERSPECTIVE,
        projectionData: {
          fov: perspectiveData.yfov,
          aspect: (perspectiveData.aspectRatio ??= 1),
        },
        zNear: perspectiveData.znear,
        zFar: perspectiveData.zfar,
        useCanvasAspect: !perspectiveData.aspectRatio,
      }
    } else {
      const orthographicData = camera.orthographic!
      return {
        name: camera.name,
        cameraType: CameraType.ORTHOGRAPHIC,
        projectionData: {
          xMag: orthographicData.xmag,
          yMag: orthographicData.ymag,
        },
        zNear: orthographicData.znear,
        zFar: orthographicData.zfar,
      }
    }
  }

  private loadExtensions(entity: Entity, extensions: any) {
    if (extensions.KHR_lights_punctual != undefined) entity.addComponent(LightComponent, this.loadLight(extensions.KHR_lights_punctual.light))
  }

  private loadLight(lightIndex: number): LightProps {
    const light = this.extensions.KHR_lights_punctual.lights[lightIndex]

    let type: LightType
    switch (light.type) {
      case 'directional':
        type = LightType.SUN
        break
      case 'point':
        type = LightType.POINT
      default:
        type = LightType.POINT
    }

    return {
      color: light.color,
      power: 2,
      lightType: type,
      castsShadow: type == LightType.SUN,
    }
  }
}
