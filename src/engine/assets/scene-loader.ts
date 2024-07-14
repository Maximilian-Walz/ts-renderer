import { GlTf } from 'gltf-loader-ts/lib/gltf'
import { mat4, quat, vec3 } from 'wgpu-matrix'
import {
  AutoRotateComponent,
  BufferAccessor,
  BufferDataType,
  CameraComponent,
  MeshRendererComponent,
  PrimitiveRenderData,
  TransformComponent,
  VertexAttributeType,
} from '../components'
import { EntityComponentSystem, EntityId } from '../entity-component-system'

export class SceneLoader {
  static createEntitiesFromGltf(ecs: EntityComponentSystem, gltf: GlTf) {
    const sceneIndex = gltf.scene ?? 0
    if (gltf.scenes) {
      SceneLoader.loadScene(ecs, gltf, sceneIndex)
    }
  }

  private static loadScene(ecs: EntityComponentSystem, gltf: GlTf, sceneIndex: number) {
    const scene = gltf.scenes![sceneIndex]
    for (const nodeIndex of scene.nodes!) {
      SceneLoader.loadNode(ecs, gltf, nodeIndex)
    }
  }

  private static loadNode(ecs: EntityComponentSystem, gltf: GlTf, nodeIndex: number, parentTransform?: TransformComponent) {
    const node = gltf.nodes![nodeIndex]

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
    const entityId = ecs.createEntity(transformComponent)
    if (node.mesh != undefined) SceneLoader.loadMesh(ecs, gltf, entityId, node.mesh)
    if (node.camera != undefined) SceneLoader.loadCamera(ecs, gltf, entityId, node.camera)
    if (node.children != undefined) node.children.forEach((childIndex: number) => this.loadNode(ecs, gltf, childIndex, transformComponent))

    // Add auto rotator to mesh renderer components for debugging purposes
    if (node.mesh != undefined) {
      ecs.addComponentToEntity(entityId, new AutoRotateComponent(vec3.fromValues(0, 0, 1), 10))
    }
  }

  private static loadCamera(ecs: EntityComponentSystem, gltf: GlTf, entityId: EntityId, cameraIndex: number) {
    const camera = gltf.cameras![cameraIndex]

    if (camera.type == 'perspective') {
      const perspectiveData = camera.perspective!
      const cameraComponent = new CameraComponent(perspectiveData.yfov, perspectiveData.aspectRatio, perspectiveData.znear, perspectiveData.zfar)
      cameraComponent.name = camera.name
      ecs.addComponentToEntity(entityId, cameraComponent)
    } else {
      throw Error('Orthographic camera not implemented yet.')
    }
  }

  private static loadMesh(ecs: EntityComponentSystem, gltf: GlTf, entityId: EntityId, meshIndex: number) {
    const mesh = gltf.meshes![meshIndex]
    const meshRendererComponent = new MeshRendererComponent()
    meshRendererComponent.name = mesh.name
    mesh.primitives.forEach((primitive) => {
      const vertexAttributes = new Map<VertexAttributeType, BufferAccessor>()
      Object.entries(primitive.attributes).forEach(([key, accessorIndex]) => {
        vertexAttributes.set(VertexAttributeType[key as keyof typeof VertexAttributeType], SceneLoader.createAccessor(gltf, accessorIndex))
      })

      const primitiveRenderData: PrimitiveRenderData = {
        bindGroup: undefined,
        indexBufferAccessor: SceneLoader.createAccessor(gltf, primitive.indices!),
        vertexAttributes: vertexAttributes,
        mode: primitive.mode,
      }
      meshRendererComponent.primitives.push(primitiveRenderData)
    })
    ecs.addComponentToEntity(entityId, meshRendererComponent)
  }

  private static createAccessor(gltf: GlTf, accessorIndex: number): BufferAccessor {
    const accessor = gltf.accessors![accessorIndex]
    return {
      bufferIndex: accessor.bufferView!,
      componentType: accessor.componentType,
      offset: accessor.byteOffset ?? 0,
      count: accessor.count,
      type: BufferDataType[accessor.type as keyof typeof BufferDataType],
    }
  }
}
