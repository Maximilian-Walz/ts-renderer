import { Component, ComponentType } from "./entity-component-system";
import { mat4, Mat4, Vec3 } from "wgpu-matrix";

export class TransformComponent extends Component {
    transformationMatrix: Mat4 = mat4.identity()

    constructor() { super(ComponentType.TRANSFORM) }
}

export class MeshComponent extends Component {
    indexBufferOffset: number = 0
    vertexBufferOffset: number = 0
    path: string

    constructor(path: string) { 
        super(ComponentType.MESH) 
        this.path = path
    }
}

export class MeshRendererComponent extends Component {
    bindGroup: GPUBindGroup | undefined
    modelMatrixBuffer: GPUBuffer | undefined

    constructor() { 
        super(ComponentType.MESH_RENDERER) 
    }
}

export class CameraComponent extends Component {
    viewMatrix: Mat4
    projectionMatrix: Mat4

    constructor(viewMatrix: Mat4, projectionMatrix: Mat4) { 
        super(ComponentType.CAMERA) 
        this.viewMatrix = viewMatrix
        this.projectionMatrix = projectionMatrix
    }
}

export class AutoRotateComponent extends Component {
    axis: Vec3
    speed: number

    constructor(axis : Vec3, speed: number) {
        super(ComponentType.AUTO_ROTATE)
        this.axis = axis
        this.speed = speed
    }
}