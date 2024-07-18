import { Mat4, mat4 } from 'wgpu-matrix'
import simpleShader from '../../simple-shader'
import { AssetManager, BufferTarget } from '../assets/asset-manager'
import { BufferDataComponentType, CameraComponent, MeshRendererComponent, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../components'
import { BasicMaterial, PbrMaterial } from '../material'

export type CameraData = {
  transform: TransformComponent
  camera: CameraComponent
}

type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private assetManager: AssetManager
  private device!: GPUDevice
  private canvas!: HTMLCanvasElement
  private canvasFormat!: GPUTextureFormat
  private context!: GPUCanvasContext
  private renderPassDescriptor!: GPURenderPassDescriptor

  private gpuBuffers: GPUBuffer[] = []
  private gpuTextures: GPUTextureData[] = []
  private defaultTexture!: GPUTextureData
  private whiteBitmap!: ImageBitmap

  private pipeline!: GPURenderPipeline

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

    this.whiteBitmap = await createImageBitmap(new ImageData(Uint8ClampedArray.from([255, 255, 255, 255]), 1, 1))
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

    const primitiveBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          texture: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    })

    const module = this.device.createShaderModule({
      code: simpleShader,
    })

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [meshBindGroupLayout, primitiveBindGroupLayout],
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
          {
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: 'float32x2',
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

  getActiveCamera() {
    return this.cameraData
  }

  prepareGpuBuffers() {
    this.assetManager.buffers.forEach((buffer, index) => {
      // TODO: Can I set less as default? Counter example: BoomBox
      let usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.VERTEX | GPUBufferUsage.INDEX
      if (buffer.target == BufferTarget.ARRAY_BUFFER) usage = GPUBufferUsage.VERTEX
      else if (buffer.target == BufferTarget.ELEMENT_ARRAY_BUFFER) usage = GPUBufferUsage.INDEX
      const bufferLength = buffer.data.length + (4 - (buffer.data.length % 4))
      this.gpuBuffers[index] = this.device.createBuffer({
        size: bufferLength,
        usage: usage,
        mappedAtCreation: true,
      })
      new Uint8Array(this.gpuBuffers[index].getMappedRange()).set(buffer.data)
      this.gpuBuffers[index].unmap()
    })
    console.log('Buffers loaded:', this.gpuBuffers.length)
  }

  prepareGpuTextures() {
    this.defaultTexture = {
      sampler: this.device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      }),
      texture: this.device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      }),
    }
    this.device.queue.copyExternalImageToTexture({ source: this.whiteBitmap }, { texture: this.defaultTexture.texture }, [this.whiteBitmap.width, this.whiteBitmap.height])

    this.assetManager.textures.forEach((texture, index) => {
      const gpuTexture = this.device.createTexture({
        size: [texture.image.width, texture.image.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })

      const gpuSampler = texture.sampler
        ? this.device.createSampler({
            addressModeU: texture.sampler.wrapS as GPUAddressMode,
            addressModeV: texture.sampler.wrapT as GPUAddressMode,
            magFilter: texture.sampler.magFilter as GPUFilterMode,
            minFilter: texture.sampler.minFilter as GPUFilterMode,
            mipmapFilter: texture.sampler.mipMapFilter as GPUFilterMode,
          })
        : this.defaultTexture.sampler

      this.device.queue.copyExternalImageToTexture({ source: texture.image }, { texture: gpuTexture }, [texture.image.width, texture.image.height])
      this.gpuTextures[index] = {
        texture: gpuTexture,
        sampler: gpuSampler,
      }
    })
    console.log('Textures loaded:', this.gpuTextures.length)
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

  preparePipelines() {}

  prepareMaterials() {
    this.assetManager.materials.forEach((material) => {
      material.pipeline = this.pipeline
      if (material instanceof PbrMaterial) {
        const albedoIndex = material.albedoTexture?.textureId
        const albedoData = albedoIndex != undefined ? this.gpuTextures[albedoIndex] : this.defaultTexture
        material.bindGroup = this.device.createBindGroup({
          layout: material.pipeline.getBindGroupLayout(1),
          entries: [
            {
              binding: 0,
              resource: albedoData.texture.createView(),
            },
            {
              binding: 1,
              resource: albedoData.sampler,
            },
          ],
        })
      } else if (material instanceof BasicMaterial) {
        throw Error('Basic material not implemented yet')
      }
    })
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

    const projectionMatrix = this.cameraData.camera.getProjection(currentWidth, currentHeight)
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, Renderer.calculateGlobalTransform(this.cameraData.transform))

    const commandEncoder = this.device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor)

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

        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager / pipeline / shader where it should be
        const vertexDataMapping = [VertexAttributeType.POSITION, VertexAttributeType.NORMAL, VertexAttributeType.TEXCOORD_0]
        vertexDataMapping.forEach((attributeType, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(attributeType)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          passEncoder.setVertexBuffer(index, this.gpuBuffers[accessor.bufferIndex], accessor.offset, accessor.count * byteCount)
        })

        const material = this.assetManager.materials[primitiveRenderData.materialIndex!]
        passEncoder.setPipeline(material.pipeline!)
        passEncoder.setBindGroup(1, material.bindGroup!)
        passEncoder.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    passEncoder.end()
    this.device.queue.submit([commandEncoder.finish()])
  }
}
