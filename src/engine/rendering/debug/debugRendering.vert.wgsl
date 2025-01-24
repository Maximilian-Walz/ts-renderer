struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}

struct Transform {
  modelMatrix: mat4x4f,
  invModelMatrix: mat4x4f,
  normalModelMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> trasform: Transform;

struct Output {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,
}

@vertex
fn main(@location(0) position : vec4f) -> Output {
    let size = 4.0;

    var output : Output;
    let viewPos = camera.viewMatrix * trasform.modelMatrix * vec4f(0, 0, 0, 1);
    let dist = -viewPos.z * size / 100;
    output.position = camera.projectionMatrix * (viewPos + vec4f(position.xy * dist, 0, 0));

    output.uv = position.xy;
    return output;
}