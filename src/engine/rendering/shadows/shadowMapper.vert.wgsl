struct Light {
  positionOrDirection: vec4f,
  viewProjectionMatrix: mat4x4f,
  color: vec3f,
  power: f32
}

struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> light : Light;
@group(1) @binding(0) var<uniform> camera: Camera;
@group(2) @binding(0) var<uniform> modelMatrix : mat4x4f;

@vertex
fn main(
  @location(0) position: vec4f
) -> @builtin(position) vec4f {
   return light.viewProjectionMatrix * modelMatrix * position;
}