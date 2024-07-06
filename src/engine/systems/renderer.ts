import { mat4 } from "wgpu-matrix";
import simpleShader from "../../simple-shader";
import { CameraComponent, MeshRendererComponent, TransformComponent } from "../components";


const cubeVertexSize = 4 * 10; // Byte size of one cube vertex.
const cubePositionOffset = 0;
const cubeColorOffset = 4 * 4; // Byte offset of cube vertex color attribute.
const cubeUVOffset = 4 * 8;
const cubeVertexCount = 36;

const cubeVertexArray = new Float32Array([
  // float4 position, float4 color, float2 uv,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,
  1, -1, -1, 1,  1, 0, 0, 1,  0, 0,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,

  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  1, -1, 1, 1,   1, 0, 1, 1,  1, 1,
  1, -1, -1, 1,  1, 0, 0, 1,  1, 0,
  1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  1, -1, -1, 1,  1, 0, 0, 1,  1, 0,

  -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
  1, 1, 1, 1,    1, 1, 1, 1,  1, 1,
  1, 1, -1, 1,   1, 1, 0, 1,  1, 0,
  -1, 1, -1, 1,  0, 1, 0, 1,  0, 0,
  -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
  1, 1, -1, 1,   1, 1, 0, 1,  1, 0,

  -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
  -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
  -1, -1, -1, 1, 0, 0, 0, 1,  0, 0,
  -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,

  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 0,
  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,

  1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
  1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
  1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
]);

export class Renderer {
  canvas!: HTMLCanvasElement
  device!: GPUDevice
  context!: GPUCanvasContext
  pipeline!: GPURenderPipeline

  renderPassDescriptor!: GPURenderPassDescriptor
  verticesBuffer!: GPUBuffer

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

    const module = this.device.createShaderModule({
      label: "Simple Shader",
      code: simpleShader,
    })

    this.pipeline = this.device.createRenderPipeline({
      label: "Simple Pipeline",
      layout: "auto",
      vertex: {
        module,
        buffers: [
          {
            arrayStride: cubeVertexSize,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: cubePositionOffset,
                format: 'float32x4',
              },
              {
                // uv
                shaderLocation: 1,
                offset: cubeUVOffset,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module,
        targets: [{ format: canvasFormat }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    })

    const depthTexture = this.device.createTexture({
      size: [canvas.width, canvas.height],
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

    this.verticesBuffer = this.device.createBuffer({
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.verticesBuffer.getMappedRange()).set(cubeVertexArray);
    this.verticesBuffer.unmap();
  }

  initMeshRenderers(components : [TransformComponent, MeshRendererComponent][]) {
    components.forEach(([transform, meshRenderer]) => {
      meshRenderer.modelMatrixBuffer = this.device.createBuffer({
        size: transform.transformationMatrix.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })

      meshRenderer.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: { buffer: meshRenderer.modelMatrixBuffer }
        }]
      })
    })
  }


  render(camera: CameraComponent, models: [TransformComponent, MeshRendererComponent][]) {
    this.renderPassDescriptor.colorAttachments = [
      {
        view: this.context.getCurrentTexture().createView(),
        clearValue: [0.5, 0.5, 0.5, 1.0],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ]
    
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setVertexBuffer(0, this.verticesBuffer);
  
    const viewProjectionMatrix = mat4.multiply(camera.projectionMatrix, camera.viewMatrix)
    
    models.forEach(([transform, meshRenderer]) => {
      const modelViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, transform.transformationMatrix)
      this.device.queue.writeBuffer(
        meshRenderer.modelMatrixBuffer!, 
        0,
        modelViewProjectionMatrix.buffer,
        modelViewProjectionMatrix.byteOffset, 
        modelViewProjectionMatrix.byteLength
      )
      passEncoder.setBindGroup(0, meshRenderer.bindGroup!);
      passEncoder.draw(cubeVertexCount); 
    })
    
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
