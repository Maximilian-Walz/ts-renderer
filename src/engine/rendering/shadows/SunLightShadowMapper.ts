import { BufferDataComponentType, getBufferDataTypeByteCount, VertexAttributeType } from '../../assets/Mesh'
import { CameraComponent, LightComponent, TransformComponent } from '../../components'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { ShadowMapper } from './ShadowMapper'
import shadowMapperVert from './shadowMapper.vert.wgsl'

export class SunLightShadowMapper extends ShadowMapper {
  private shadowPipeline: GPURenderPipeline

  constructor(device: GPUDevice) {
    super(device)
    this.shadowPipeline = this.createPipeline()
  }

  private createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: 'Shadow mapping',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [LightComponent.shadowMappingBindGroupLayout, CameraComponent.bindGroupLayout, TransformComponent.bindGroupLayout],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: shadowMapperVert,
        }),
        buffers: [
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
        ],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  public renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], lightData: LightData, cameraData: CameraData) {
    if (lightData == undefined || !lightData.light.castsShadow) {
      return
    }

    const shadowPass = commandEncoder.beginRenderPass({
      label: 'Shadow mapping',
      colorAttachments: [],
      depthStencilAttachment: {
        view: lightData.light.shadowMap!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    })
    shadowPass.setPipeline(this.shadowPipeline)
    shadowPass.setBindGroup(0, lightData.light.shadowMappingBindGroup!)
    shadowPass.setBindGroup(1, cameraData.camera.bindGroup!)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (transform.matricesBuffer == undefined) {
        return
      }

      shadowPass.setBindGroup(2, transform.bindGroup!)
      meshRenderer.primitives.forEach(({ meshLoader }) => {
        const mesh = meshLoader.getAssetData()
        const type = mesh.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        const indexBuffer = mesh.indexBufferAccessor.buffer.getAssetData()
        shadowPass.setIndexBuffer(indexBuffer, type)

        const accessor = mesh.vertexAttributes.get(VertexAttributeType.POSITION)!
        const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
        const buffer = accessor.buffer.getAssetData()
        shadowPass.setVertexBuffer(0, buffer, accessor.offset, accessor.count * byteCount)

        shadowPass.drawIndexed(mesh.indexBufferAccessor.count)
      })
    })

    shadowPass.end()
  }
}
