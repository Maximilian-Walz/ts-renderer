import { Mat4, mat4, quat, vec3 } from 'wgpu-matrix'
import simpleShader from '../../simple-shader'
import { AssetManager, BufferTarget } from '../assets/asset-manager'
import { BufferDataComponentType, CameraComponent, MeshRendererComponent, TransformComponent, VertexAttributeType } from '../components'

export type CameraData = {
  transform: TransformComponent
  camera: CameraComponent
}

export class Renderer {
  private assetManager: AssetManager
  private device!: GPUDevice
  private canvas!: HTMLCanvasElement
  private canvasFormat!: GPUTextureFormat
  private context!: GPUCanvasContext
  private pipeline!: GPURenderPipeline
  private renderPassDescriptor!: GPURenderPassDescriptor

  private gpuBuffers: GPUBuffer[] = []

  private cameraData: CameraData | undefined

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported on this browser.')
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No appropriate GPUAdapter found.')
    }

    this.device = await adapter.requestDevice()
    this.device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`)
      if (info.reason !== 'destroyed') {
        this.init()
      }
    })
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
    })
    this.createPipeline()
    this.createRenderPassDescriptor()
  }

  createPipeline() {
    const meshBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX,
        },
      ],
    })

    const module = this.device.createShaderModule({
      code: simpleShader,
    })

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [meshBindGroupLayout],
      }),
      vertex: {
        module,
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
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
        ],
      },
      fragment: {
        module,
        targets: [{ format: this.canvasFormat }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: {
        // TODO: don't hardcode!
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  createRenderPassDescriptor() {
    const depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),

          clearValue: [0.5, 0.5, 0.5, 1.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    }
  }

  private static calculateGlobalTransform(transform: TransformComponent): Mat4 {
    if (transform.parent != undefined) {
      return mat4.multiply(this.calculateGlobalTransform(transform.parent), transform.toMatrix())
    } else {
      return transform.toMatrix()
    }
  }

  setActiveCameraComponent([transform, camera]: [TransformComponent, CameraComponent]) {
    this.cameraData = {
      transform: transform,
      camera: camera,
    }
  }

  setActiveCamera(cameraData: CameraData) {
    this.cameraData = cameraData
  }

  prepareGpuBuffers() {
    this.assetManager.buffers.forEach((buffer, index) => {
      let usage = GPUBufferUsage.UNIFORM
      if (buffer.target == BufferTarget.ARRAY_BUFFER) usage = GPUBufferUsage.VERTEX
      else if (buffer.target == BufferTarget.ELEMENT_ARRAY_BUFFER) usage = GPUBufferUsage.INDEX
      this.gpuBuffers[index] = this.device.createBuffer({
        size: buffer.data.length,
        usage: usage,
        mappedAtCreation: true,
      })
      new Uint8Array(this.gpuBuffers[index].getMappedRange()).set(buffer.data)
      this.gpuBuffers[index].unmap()
    })
    console.log('Buffers loaded:', this.gpuBuffers.length)
  }

  prepareMeshRenderers(components: [TransformComponent, MeshRendererComponent][]) {
    components.forEach(([transform, meshRenderer]) => {
      meshRenderer.modelMatrixBuffer = this.device.createBuffer({
        size: transform.toMatrix().byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      meshRenderer.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: meshRenderer.modelMatrixBuffer },
          },
        ],
      })
    })
    console.log('Models prepared for rendering:', components.length)
  }

  render(models: [TransformComponent, MeshRendererComponent][]) {
    if (!this.cameraData) {
      return
    }

    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
      this.createRenderPassDescriptor()
    }

    const renderTexture = (this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0]
    renderTexture.view = this.context.getCurrentTexture().createView()

    const aspect = this.cameraData.camera.aspect ? this.cameraData.camera.aspect : currentWidth / currentHeight
    const projectionMatrix = this.cameraData.camera.getPerspective(aspect)
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, Renderer.calculateGlobalTransform(this.cameraData.transform))
    //const viewProjectionMatrix = mat4.perspective(1, 1, 1, 100)
    //mat4.multiply(viewProjectionMatrix, mat4.transform, viewProjectionMatrix)

    const commandEncoder = this.device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor)
    passEncoder.setPipeline(this.pipeline)

    models.forEach(([transform, meshRenderer]) => {
      if (meshRenderer.modelMatrixBuffer == undefined) {
        return
      }
      const mvpMatrix = mat4.multiply(viewProjectionMatrix, Renderer.calculateGlobalTransform(transform))
      this.device.queue.writeBuffer(meshRenderer.modelMatrixBuffer!, 0, mvpMatrix.buffer, mvpMatrix.byteOffset, mvpMatrix.byteLength)
      passEncoder.setBindGroup(0, meshRenderer.bindGroup!)

      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        passEncoder.setIndexBuffer(this.gpuBuffers[primitiveRenderData.indexBufferAccessor.bufferIndex], type)
        // TODO: don't hardcode the 12 here
        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager where which one is
        const positionAcessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.POSITION)!
        passEncoder.setVertexBuffer(0, this.gpuBuffers[positionAcessor.bufferIndex], positionAcessor.offset, positionAcessor.count * 12)
        const normalAccessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.NORMAL)!
        passEncoder.setVertexBuffer(1, this.gpuBuffers[normalAccessor.bufferIndex], normalAccessor.offset, normalAccessor.count * 12)
        passEncoder.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    passEncoder.end()
    this.device.queue.submit([commandEncoder.finish()])
  }
}
