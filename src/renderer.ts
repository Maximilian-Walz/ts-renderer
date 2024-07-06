import triangleShader from "./triangle"

export class Renderer {
  device!: GPUDevice
  context!: GPUCanvasContext
  pipeline!: GPURenderPipeline
  canvasToSizeMap = new WeakMap()

  async init(canvas: HTMLCanvasElement) {
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

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.canvasToSizeMap.set(entry.target, {
          width: entry.contentBoxSize[0].inlineSize,
          height: entry.contentBoxSize[0].blockSize,
        })
      }
      this.render()
    })
    observer.observe(canvas)

    const module = this.device.createShaderModule({
      label: "our hardcoded rgb triangle shaders",
      code: triangleShader,
    })

    this.pipeline = this.device.createRenderPipeline({
      label: "our hardcoded red triangle pipeline",
      layout: "auto",
      vertex: {
        module,
      },
      fragment: {
        module,
        targets: [{ format: canvasFormat }],
      },
    })
  }

  resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Get the canvas's current display size
    let { width, height } = this.canvasToSizeMap.get(canvas) || canvas

    // Make sure it's valid for WebGPU
    width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D))
    height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D))

    // Only if the size is different, set the canvas size
    const needResize = canvas.width !== width || canvas.height !== height
    if (needResize) {
      canvas.width = width
      canvas.height = height
    }
    return needResize
  }

  render() {
    const renderPassDescriptor: GPURenderPassDescriptor = {
      label: "our basic canvas renderPass",
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: [0.3, 0.3, 0.3, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    }

    // make a command encoder to start encoding commands
    const encoder = this.device.createCommandEncoder({ label: "our encoder" })

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(this.pipeline)
    pass.draw(3) // call our vertex shader 3 times
    pass.end()

    const commandBuffer = encoder.finish()
    this.device.queue.submit([commandBuffer])
  }
}
