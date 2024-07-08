import { GlTf } from "gltf-loader-ts/lib/gltf"
import { Mat4, mat4, vec3 } from "wgpu-matrix"
import {
  AutoRotateComponent,
  BufferAccessor,
  BufferDataType,
  CameraComponent,
  MeshRendererComponent,
  PrimitiveRenderData,
  TransformComponent,
  VertexAttributeType,
} from "../components"
import { EntityComponentSystem, EntityId } from "../entity-component-system"

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

  private static loadNode(
    ecs: EntityComponentSystem,
    gltf: GlTf,
    nodeIndex: number,
    parentTransform?: TransformComponent
  ) {
    const node = gltf.nodes![nodeIndex]
    // TODO: Handle transforms that don't come as a matrix
    const tranformationMatrix = mat4.create(...node.matrix??mat4.identity())
    const transform = new TransformComponent(tranformationMatrix, parentTransform)
    const entityId = ecs.createEntity(transform)

    if (node.mesh != undefined) SceneLoader.loadMesh(ecs, gltf, entityId, node.mesh)
    if (node.camera != undefined) SceneLoader.loadCamera(ecs, gltf, entityId, node.camera)
    if (node.children != undefined)
      node.children.forEach((childIndex: number) => this.loadNode(ecs, gltf, childIndex, transform))

    // Add auto rotator to root component for debugging purposes
    if (parentTransform == undefined) {
      ecs.addComponentToEntity(entityId, new AutoRotateComponent(vec3.fromValues(0, 1, 0), 10))
    }
  }

  private static loadCamera(ecs: EntityComponentSystem, gltf: GlTf, entityId: EntityId, cameraIndex: number) {
    const camera = gltf.cameras![cameraIndex]

    let projectionMatrix: Mat4
    if (camera.type == "perspective") {
      const perspectiveData = camera.perspective!
      projectionMatrix = mat4.perspective(
        perspectiveData.yfov,
        perspectiveData.aspectRatio!,
        perspectiveData.zfar!,
        perspectiveData.zfar!
      )
    } else {
      const orthographicData = camera.orthographic!
      projectionMatrix = mat4.ortho(
        orthographicData.xmag / 2,
        orthographicData.xmag / 2,
        orthographicData.ymag / 2,
        orthographicData.ymag / 2,
        orthographicData.znear,
        orthographicData.zfar
      )
    }

    ecs.addComponentToEntity(entityId, new CameraComponent(projectionMatrix))
  }

  private static loadMesh(ecs: EntityComponentSystem, gltf: GlTf, entityId: EntityId, meshIndex: number) {
    const mesh = gltf.meshes![meshIndex]
    const meshRendererComponent = new MeshRendererComponent()
    mesh.primitives.forEach((primitive) => {
      const vertexAttributes = new Map<VertexAttributeType, BufferAccessor>()
      Object.entries(primitive.attributes).forEach(([key, accessorIndex]) => {
        vertexAttributes.set(
          VertexAttributeType[key as keyof typeof VertexAttributeType],
          SceneLoader.createAccessor(gltf, accessorIndex)
        )
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
