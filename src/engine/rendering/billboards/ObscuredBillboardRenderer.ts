import { BillboardComponent, CameraComponent, TransformComponent } from '../../components'
import { BillboardsData, CameraData } from '../../systems/Renderer'
import debugOverlayFrag from './obscuredBillboardRendering.frag.wgsl'
import debugOverlayVert from './obscuredBillboardRendering.vert.wgsl'

export class ObscuredBillboardRenderer {
  private device: GPUDevice
  private context: GPUCanvasContext

  private quadBuffer: GPUBuffer
  private pipeline: GPURenderPipeline

  constructor(device: GPUDevice, context: GPUCanvasContext) {
    this.device = device
    this.context = context

    this.quadBuffer = this.createQuadBuffer()
    this.pipeline = this.createPipeline([CameraComponent.bindGroupLayout, TransformComponent.bindGroupLayout, BillboardComponent.bindGroupLayout])
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

  public render(commandEncoder: GPUCommandEncoder, depthTexture: GPUTextureView, billboardsData: BillboardsData[], activeCamera: CameraData, targetView: GPUTextureView) {
    const billboardPass = commandEncoder.beginRenderPass({
      label: 'Debug overlays',
      colorAttachments: [
        {
          view: targetView,
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

    billboardPass.setPipeline(this.pipeline)
    billboardPass.setBindGroup(0, activeCamera.camera.bindGroup!)
    billboardPass.setVertexBuffer(0, this.quadBuffer)
    billboardsData.forEach(({ transform, billboard }) => {
      billboardPass.setBindGroup(1, transform.bindGroup!)
      billboardPass.setBindGroup(2, billboard.bindGroup!)
      billboardPass.draw(4)
    })
    billboardPass.end()
  }
}
