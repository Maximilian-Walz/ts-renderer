import { BufferDataComponentType, LightComponent, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { GPUDataInterface } from '../../GPUDataInterface'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { ShadowMapper } from './ShadowMapper'
import shadowMapperVert from './shadowMapper.vert.wgsl'

export class SunLightShadowMapper extends ShadowMapper {
  private shadowPipeline: GPURenderPipeline

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    super(device, gpuDataInterface)
    this.shadowPipeline = this.createPipeline()
  }

  private createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: 'Shadow mapping',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [LightComponent.shadowMappingBindGroupLayout, TransformComponent.bindGroupLayout],
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

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (transform.matricesBuffer == undefined) {
        return
      }
      shadowPass.setBindGroup(1, transform.bindGroup!)
      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        shadowPass.setIndexBuffer(this.gpuDataInterface.getBuffer(primitiveRenderData.indexBufferAccessor.bufferIndex), type)

        const accessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.POSITION)!
        const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
        shadowPass.setVertexBuffer(0, this.gpuDataInterface.getBuffer(accessor.bufferIndex), accessor.offset, accessor.count * byteCount)

        shadowPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    shadowPass.end()
  }
}
