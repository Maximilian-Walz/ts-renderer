import { ShadingType } from '../../../assets/materials/Material'
import { UnlitMaterial } from '../../../assets/materials/unlit/UnlitMaterial'
import { BufferDataComponentType, getBufferDataTypeByteCount } from '../../../assets/Mesh'
import { CameraComponent, ComponentType } from '../../../components'
import { ModelData } from '../../../systems/RendererSystem'
import { Renderer, RenderingData } from '../Renderer'

export default class UnlitRenderer extends Renderer {
  public render(commandEncoder: GPUCommandEncoder, renderingData: RenderingData): RenderingData {
    const { target, depth, scene, cameraId } = renderingData

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: target,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: depth && {
        view: depth,
        depthLoadOp: 'clear',
        depthClearValue: 1.0,
        depthStoreOp: 'discard',
      },
    })

    const camera = scene.getEntity(cameraId).getComponent(CameraComponent)
    renderPass.setBindGroup(0, camera.getOrCreateBindGroupData(this.device).bindGroup)

    const modelsData = scene.getComponents([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as ModelData[]
    modelsData.forEach(({ transform, meshRenderer }) => {
      renderPass.setBindGroup(1, transform.getOrCreateBindGroupData(this.device).bindGroup)
      meshRenderer.primitives.forEach((primitive) => {
        const material = primitive.materialLoader.getAssetData() as UnlitMaterial
        if (material.type != ShadingType.UNLIT) {
          return
        }
        renderPass.setPipeline(material.getPipeline())

        renderPass.setPipeline(material.getPipeline())
        renderPass.setBindGroup(2, material.getBindGroup())

        const mesh = primitive.meshLoader.getAssetData()
        const type = mesh.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'

        const indexBuffer = mesh.indexBufferAccessor.buffer.getAssetData()
        renderPass.setIndexBuffer(indexBuffer, type)
        material.getVertexDataMapping().forEach(({ type }, index) => {
          const accessor = mesh.vertexAttributes.get(type)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          const buffer = accessor.buffer.getAssetData()
          renderPass.setVertexBuffer(index, buffer, accessor.offset, accessor.count * byteCount)
        })

        renderPass.drawIndexed(mesh.indexBufferAccessor.count)
      })
    })

    renderPass.end()

    return renderingData
  }
}
