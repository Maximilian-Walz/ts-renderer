import { Mat4, mat4, vec3, Vec3, vec4 } from 'wgpu-matrix'
import { ComponentType } from '.'
import { Component } from './Component'

export enum LightType {
  SUN,
  POINT,
}

export class LightComponent extends Component {
  color: Vec3
  power: number
  castsShadow: Boolean
  buffer: GPUBuffer | undefined
  shadowMap: GPUTexture | undefined
  shadowMapView: GPUTextureView | undefined
  shadingBindGroup: GPUBindGroup | undefined
  shadowMappingBindGroup: GPUBindGroup | undefined
  static pointLightBindGroupLayout: GPUBindGroupLayout
  static sunLightBindGroupLayout: GPUBindGroupLayout
  static shadowMappingBindGroupLayout: GPUBindGroupLayout
  lightType: LightType

  constructor(color?: Vec3, power?: number, lightType?: LightType, castsShadow?: Boolean) {
    super(ComponentType.LIGHT)
    this.color = color ?? vec3.fromValues(1.0, 1.0, 1.0)
    this.power = power ?? 3
    this.lightType = lightType ?? LightType.POINT
    this.castsShadow = castsShadow ?? false
  }

  getProjection(invCameraViewProjection: Mat4, lightViewMatrix: Mat4): Mat4 {
    const frustumCorners = [
      vec4.fromValues(-1, -1, 0, 1),
      vec4.fromValues(-1, 1, 0, 1),
      vec4.fromValues(1, -1, 0, 1),
      vec4.fromValues(1, 1, 0, 1),
      vec4.fromValues(-1, -1, 1, 1),
      vec4.fromValues(-1, 1, 1, 1),
      vec4.fromValues(1, -1, 1, 1),
      vec4.fromValues(1, 1, 1, 1),
    ]

    let minX = Number.MAX_VALUE,
      maxX = -Number.MAX_VALUE,
      minY = Number.MAX_VALUE,
      maxY = -Number.MAX_VALUE
    const cornerProjection = mat4.mul(lightViewMatrix, invCameraViewProjection)
    frustumCorners.forEach((corner) => {
      vec4.transformMat4(corner, cornerProjection, corner)
      vec4.divScalar(corner, corner[3], corner)
      minX = Math.min(corner[0], minX)
      maxX = Math.max(corner[0], maxX)
      minY = Math.min(corner[1], minY)
      maxY = Math.max(corner[1], maxY)
    })
    // TODO: Implement Cascaded Shadow Maps (CSMs)?
    // TODO: Use scene AABB in combinatin with frustum to calculate tight near and far planes
    return mat4.ortho(minX, maxX, minY, maxY, 0.1, 100)
  }

  toJson(): Object {
    return {
      type: this.lightType,
      color: this.color,
      power: this.power,
      castsShadow: this.castsShadow,
    }
  }
}
