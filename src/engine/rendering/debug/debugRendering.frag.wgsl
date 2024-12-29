struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(1) @binding(1) var<uniform> normalModelMatrix : mat4x4f;
@group(2) @binding(0) var billboardTexture: texture_2d<f32>;
@group(2) @binding(1) var billboardSampler: sampler;

@fragment
fn main(
  @builtin(position) coord: vec4f, @location(0) uv : vec2f
) -> @location(0) vec4f {
  let sampledBillboard = textureSample(billboardTexture, billboardSampler, -(uv + vec2f(0.5, 0.5)));

  return sampledBillboard;
}
