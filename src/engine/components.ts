import { Component, ComponentType, EntityId } from "./entity-component-system";
import { mat4, Mat4, Vec3 } from "wgpu-matrix";

export class TransformComponent extends Component {
    transformationMatrix: Mat4 = mat4.identity()
    parent?: TransformComponent

    constructor() { super(ComponentType.TRANSFORM) }
}

export enum VertexAttributeType {
    POSITION="POSITION",
    NORMAL="NORMAL",
    TANGENT="TANGEN",
    TEXCOORD_0="TEXCOORD_0"
}

export enum BufferDataComponentType {
    SIGNED_BYTE=5120,
    UNSIGNED_BYTE=5121,
    SIGNED_SHORT=5122,
    UNSIGNED_SHORT=5123,
    UNSIGNED_INT=5125,
    FLOAT=5126,
}

export enum BufferDataType {
    SCALAR="SCALAR",
    VEC2="VEC2",
    VEC3="VEC3",
    VEC4="VEC4",
    MAT2="MAT2",
    MAT3="MAT3",
    MAT4="MAT4",
}

export type BufferAccessor = {
    bufferIndex: number
    offset: number
    componentType: BufferDataComponentType
    type: BufferDataType
    count: number
}

export type PrimitiveRenderData = {
    bindGroup: GPUBindGroup | undefined
    indexBufferAccessor: BufferAccessor
    vertexAttributes: Map<VertexAttributeType, BufferAccessor>
    mode: number | undefined
}

export class MeshRendererComponent extends Component {
    bindGroup: GPUBindGroup | undefined
    modelMatrixBuffer: GPUBuffer | undefined
    primitives: PrimitiveRenderData[] = []

    constructor() { 
        super(ComponentType.MESH_RENDERER) 
    }
}

export class CameraComponent extends Component {
    projectionMatrix: Mat4

    constructor(projectionMatrix: Mat4) { 
        super(ComponentType.CAMERA) 
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