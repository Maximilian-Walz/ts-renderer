import { Mat4, mat4 } from "wgpu-matrix"
import simpleShader from "../../simple-shader"
import { AssetManager, BufferTarget } from "../assets/asset-manager"
import {
  BufferDataComponentType,
  CameraComponent,
  MeshRendererComponent,
  TransformComponent,
  VertexAttributeType,
} from "../components"

export class Renderer {
  private assetManager: AssetManager
  private canvas!: HTMLCanvasElement
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private pipeline!: GPURenderPipeline
  private renderPassDescriptor!: GPURenderPassDescriptor

  private gpuBuffers: GPUBuffer[] = []
  private viewProjectionMatrix: Mat4 = mat4.identity()

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }

  async init(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    // WebGPU device initialization
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.")
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.")
    }

    this.device = await adapter.requestDevice()
    this.device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`)
      if (info.reason !== "destroyed") {
        this.init(canvas)
      }
    })

    // Canvas configuration
    this.context = canvas.getContext("webgpu")!
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
    this.context!.configure({
      device: this.device,
      format: canvasFormat,
    })

    const meshBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          buffer: {
            type: "uniform",
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
                format: "float32x3",
              },
            ],
          },
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
        ],
      },
      fragment: {
        module,
        targets: [{ format: canvasFormat }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
    })

    const depthTexture = this.device.createTexture({
      size: [canvas.width, canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),

          clearValue: [0.5, 0.5, 0.5, 1.0],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      }, 
    }

    // TODO: Fix this. Somehow the depth buffer isn't resized. Do I have to explicitely recreate the pipeline or something?
    /*
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.devicePixelContentBoxSize?.[0].inlineSize ||
                      entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height = entry.devicePixelContentBoxSize?.[0].blockSize ||
                       entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const canvas = entry.target;
        //@ts-ignore
        canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
        //@ts-ignore
        canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
      }
    });
    try {
      observer.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      observer.observe(canvas, { box: 'content-box' });
    }
    */

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
  }

  private static calculateGlobalTransform(transform: TransformComponent): Mat4 {
    if (transform.parent != undefined) {
      return mat4.multiply(this.calculateGlobalTransform(transform.parent), transform.transformationMatrix)
    } else {
      return transform.transformationMatrix
    }
  }

  setActiveCamera([transform, camera]: [TransformComponent, CameraComponent]) {
    mat4.multiply(camera.projectionMatrix, Renderer.calculateGlobalTransform(transform), this.viewProjectionMatrix)
  }

  initMeshRenderers(components: [TransformComponent, MeshRendererComponent][]) {
    components.forEach(([transform, meshRenderer]) => {
      meshRenderer.modelMatrixBuffer = this.device.createBuffer({
        size: transform.transformationMatrix.byteLength,
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
  }

  render(models: [TransformComponent, MeshRendererComponent][]) {
    this.renderPassDescriptor.colorAttachments = [
      {
        view: this.context.getCurrentTexture().createView(),
        clearValue: [0.5, 0.5, 0.5, 1.0],
        loadOp: "clear",
        storeOp: "store",
      },
    ]

    const commandEncoder = this.device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor)
    passEncoder.setPipeline(this.pipeline)

    models.forEach(([transform, meshRenderer]) => {
      const mvpMatrix = mat4.multiply(this.viewProjectionMatrix, Renderer.calculateGlobalTransform(transform))
      this.device.queue.writeBuffer(
        meshRenderer.modelMatrixBuffer!,
        0,
        mvpMatrix.buffer,
        mvpMatrix.byteOffset,
        mvpMatrix.byteLength
      )
      passEncoder.setBindGroup(0, meshRenderer.bindGroup!)

      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type =
          primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT
            ? "uint16"
            : "uint32"
        passEncoder.setIndexBuffer(this.gpuBuffers[primitiveRenderData.indexBufferAccessor.bufferIndex], type)
        // TODO: don't hardcode the 12 here
        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager where which one is
        const positionAcessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.POSITION)!
        passEncoder.setVertexBuffer(
          0,
          this.gpuBuffers[positionAcessor.bufferIndex],
          positionAcessor.offset,
          positionAcessor.count * 12
        )
        const normalAccessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.NORMAL)!
        passEncoder.setVertexBuffer(
          1,
          this.gpuBuffers[normalAccessor.bufferIndex],
          normalAccessor.offset,
          normalAccessor.count * 12
        )
        passEncoder.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    passEncoder.end()
    this.device.queue.submit([commandEncoder.finish()])
  }
}
