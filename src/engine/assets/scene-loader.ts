import { GltfAsset } from 'gltf-loader-ts'
import { GlTf } from 'gltf-loader-ts/lib/gltf'
import { mat4, quat, vec3 } from 'wgpu-matrix'
import {
  BufferAccessor,
  BufferDataType,
  CameraComponent,
  CameraType,
  MeshRendererComponent,
  PrimitiveRenderData,
  TransformComponent,
  VertexAttributeType,
} from '../components/components'
import { EntityComponentSystem, EntityId } from '../entity-component-system'

export class SceneLoader {
  private ecs: EntityComponentSystem
  private gltf: GlTf

  public constructor(ecs: EntityComponentSystem, asset: GltfAsset) {
    this.ecs = ecs
    this.gltf = asset.gltf
  }

  public createEntities() {
    const sceneIndex = this.gltf.scene ?? 0
    if (this.gltf.scenes) {
      this.loadScene(sceneIndex)
    }
  }

  private loadScene(sceneIndex: number) {
    const scene = this.gltf.scenes![sceneIndex]
    for (const nodeIndex of scene.nodes!) {
      this.loadNode(nodeIndex)
    }
  }

  private loadNode(nodeIndex: number, parentTransform?: TransformComponent) {
    const node = this.gltf.nodes![nodeIndex]

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
    const entityId = this.ecs.createEntity(transformComponent)
    if (node.mesh != undefined) this.loadMesh(entityId, node.mesh)
    if (node.camera != undefined) this.loadCamera(entityId, node.camera)
    if (node.children != undefined) node.children.forEach((childIndex: number) => this.loadNode(childIndex, transformComponent))

    // Add auto rotator to mesh renderer components for debugging purposes
    if (node.mesh != undefined) {
      //ecs.addComponentToEntity(entityId, new AutoRotateComponent(vec3.fromValues(0, 1, 0), 10))
    }
  }

  private loadCamera(entityId: EntityId, cameraIndex: number) {
    const camera = this.gltf.cameras![cameraIndex]

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
    this.ecs.addComponentToEntity(entityId, cameraComponent)
  }

  private loadMesh(entityId: EntityId, meshIndex: number) {
    const mesh = this.gltf.meshes![meshIndex]
    const meshRendererComponent = new MeshRendererComponent()
    meshRendererComponent.name = mesh.name
    mesh.primitives.forEach((primitive) => {
      const vertexAttributes = new Map<VertexAttributeType, BufferAccessor>()

      const loadAttributeIfPresent = (attributeType: VertexAttributeType): Boolean => {
        const attributeIndex = primitive.attributes[attributeType]
        if (attributeIndex != undefined) {
          vertexAttributes.set(attributeType, this.createAccessor(attributeIndex))
          return true
        }
        return false
      }

      const requiredAttributesLoaded = loadAttributeIfPresent(VertexAttributeType.POSITION) && loadAttributeIfPresent(VertexAttributeType.NORMAL)
      if (!requiredAttributesLoaded) {
        console.error(`Could not load primitive of mesh ${mesh.name}`)
        return
      }

      if (!loadAttributeIfPresent(VertexAttributeType.TEXCOORD_0)) {
        console.warn(`No texcoords found for primitive of mesh ${mesh.name}`)
      }

      if (!loadAttributeIfPresent(VertexAttributeType.TANGENT)) {
        console.warn(`No tangents found. Calculating tangents not implemented yet. Skipping primitive of mesh ${mesh.name}.`)
        return
      }

      const primitiveRenderData: PrimitiveRenderData = {
        indexBufferAccessor: this.createAccessor(primitive.indices!),
        vertexAttributes: vertexAttributes,
        materialIndex: primitive.material,
        mode: primitive.mode,
      }
      meshRendererComponent.primitives.push(primitiveRenderData)
    })
    this.ecs.addComponentToEntity(entityId, meshRendererComponent)
  }

  private createAccessor(accessorIndex: number): BufferAccessor {
    const accessor = this.gltf.accessors![accessorIndex]
    return {
      bufferIndex: accessor.bufferView!,
      componentType: accessor.componentType,
      offset: accessor.byteOffset ?? 0,
      count: accessor.count,
      type: BufferDataType[accessor.type as keyof typeof BufferDataType],
    }
  }
}
