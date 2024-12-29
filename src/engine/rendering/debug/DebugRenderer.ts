import { StaticAssetManager } from '../../assets/StaticAssetsManager'
import { CameraData, LightData } from '../../systems/Renderer'
import debugOverlayFrag from './debugRendering.frag.wgsl'
import debugOverlayVert from './debugRendering.vert.wgsl'

export class DebugRenderer {
  private device: GPUDevice
  private context: GPUCanvasContext
  private staticAssetManager: StaticAssetManager

  private quadBuffer!: GPUBuffer
  private pipeline!: GPURenderPipeline
  private billboardBindGroup!: GPUBindGroup

  constructor(device: GPUDevice, context: GPUCanvasContext, staticAssetManager: StaticAssetManager) {
    this.device = device
    this.context = context
    this.staticAssetManager = staticAssetManager
    this.createQuadBuffer()
    this.createPipeline()
    this.createBillboardBindGroup()
  }

  private createQuadBuffer() {
    this.quadBuffer = this.device.createBuffer({
      label: 'Quad vertices',
      usage: GPUBufferUsage.VERTEX,
      size: Float32Array.BYTES_PER_ELEMENT * 3 * 4,
      mappedAtCreation: true,
    })
    const quadData = new Float32Array(this.quadBuffer.getMappedRange())
    quadData.set([0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0])
    this.quadBuffer.unmap()
  }

  private createPipeline() {
    const cameraBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Camera data',
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
      ],
    })

    const sceneBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Debug scene data',
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
      ],
    })

    const billboardBindGroupLayout = this.device.createBindGroupLayout({
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

    this.pipeline = this.device.createRenderPipeline({
      label: 'Debug overlay',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [cameraBindGroupLayout, sceneBindGroupLayout, billboardBindGroupLayout],
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

  public createBillboardBindGroup() {
    const billboardTexture = this.staticAssetManager.getTextureData('lightbulb').texture.createView()
    const billboardSampler = this.staticAssetManager.getTextureData('lightbulb').sampler
    this.billboardBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(2),
      entries: [
        {
          binding: 0,
          resource: billboardTexture,
        },
        {
          binding: 1,
          resource: billboardSampler,
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
    debugPass.setBindGroup(2, this.billboardBindGroup)
    lightsData.forEach((lightData) => {
      debugPass.setBindGroup(1, lightData.transform.bindGroup!)
      debugPass.setVertexBuffer(0, this.quadBuffer)
      debugPass.draw(4)
    })
    debugPass.end()
  }
}
