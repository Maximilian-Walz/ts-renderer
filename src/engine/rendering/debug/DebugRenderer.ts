import { CameraComponent, LightType, TransformComponent } from '../../components/components'
import { GPUDataInterface } from '../../GPUDataInterface'
import { CameraData, LightData } from '../../systems/Renderer'
import debugOverlayFrag from './debugRendering.frag.wgsl'
import debugOverlayVert from './debugRendering.vert.wgsl'

export class DebugRenderer {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface
  private context: GPUCanvasContext

  private quadBuffer: GPUBuffer
  private pipeline: GPURenderPipeline
  private billboardBindGroups: Map<string, GPUBindGroup>

  constructor(device: GPUDevice, context: GPUCanvasContext, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.context = context
    this.gpuDataInterface = gpuDataInterface

    this.quadBuffer = this.createQuadBuffer()
    const billboardBindGroupLayout = this.createBillboardBindGroupLayout()
    this.pipeline = this.createPipeline([CameraComponent.bindGroupLayout, TransformComponent.bindGroupLayout, billboardBindGroupLayout])

    const billboardTextureIdentifiers = ['lightbulb', 'sun']
    this.billboardBindGroups = new Map()
    billboardTextureIdentifiers.forEach((textureIdentifier) =>
      this.billboardBindGroups.set(textureIdentifier, this.createBillboardBindGroup(billboardBindGroupLayout, textureIdentifier))
    )
  }

  private createQuadBuffer() {
    const quadBuffer = this.device.createBuffer({
      label: 'Quad vertices',
      usage: GPUBufferUsage.VERTEX,
      size: Float32Array.BYTES_PER_ELEMENT * 3 * 4,
      mappedAtCreation: true,
    })
    const quadData = new Float32Array(quadBuffer.getMappedRange())
    quadData.set([0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0])
    quadBuffer.unmap()
    return quadBuffer
  }

  private createBillboardBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      label: 'Billboard data',
      entries: [
        {
          binding: 0,
          texture: {
            sampleType: 'float',
          },
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    })
  }

  private createPipeline(bindGroupLayouts: GPUBindGroupLayout[]): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: 'Debug overlay',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: debugOverlayVert,
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
      fragment: {
        module: this.device.createShaderModule({
          code: debugOverlayFrag,
        }),
        targets: [
          {
            format: this.context.getCurrentTexture().format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: {
        topology: 'triangle-strip',
        cullMode: 'none',
      },
    })
  }

  private createBillboardBindGroup(billboardBindGroupLayout: GPUBindGroupLayout, textureIndentifier: string): GPUBindGroup {
    let textureData = this.gpuDataInterface.getStaticTextureData(textureIndentifier)
    return this.device.createBindGroup({
      layout: billboardBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: textureData.texture.createView(),
        },
        {
          binding: 1,
          resource: textureData.sampler,
        },
      ],
    })
  }

  public renderDebugOverlay(commandEncoder: GPUCommandEncoder, depthTexture: GPUTextureView, lightsData: LightData[], camerasData: CameraData[], activeCamera: CameraData) {
    if (lightsData == undefined || lightsData.length <= 0) {
      return
    }
    const debugPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture,
        depthLoadOp: 'load',
        depthStoreOp: 'discard',
      },
    })

    debugPass.setPipeline(this.pipeline)
    debugPass.setBindGroup(0, activeCamera.camera.bindGroup!)
    lightsData.forEach((lightData) => {
      const textureIdentifier = (() => {
        switch (lightData.light.lightType) {
          case LightType.SUN:
            return 'sun'
          case LightType.POINT:
            return 'lightbulb'
          default:
            return 'lightbulb'
        }
      })()

      debugPass.setBindGroup(2, this.billboardBindGroups.get(textureIdentifier)!)
      debugPass.setBindGroup(1, lightData.transform.bindGroup!)
      debugPass.setVertexBuffer(0, this.quadBuffer)
      debugPass.draw(4)
    })
    debugPass.end()
  }
}
