struct Camera {
  viewProjectionMatrix : mat4x4f,
  invViewProjectionMatrix : mat4x4f,
}

struct Transform {
  modelMatrix: mat4x4f,
  invModelMatrix: mat4x4f,
  normalModelMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> camera : Camera;
@group(1) @binding(0) var<uniform> transform : Transform;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fragNormal: vec3f,
  @location(1) fragTangent: vec3f,
}

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) tangent: vec4f,
) -> VertexOutput {
  var output : VertexOutput;
  let positionScreenSpace = camera.viewProjectionMatrix * transform.modelMatrix * position;
  var normalWorldSpace = transform.normalModelMatrix * vec4f(normal, 0.0);
  var tangentWorldSpace = transform.normalModelMatrix * tangent;

  output.Position = positionScreenSpace;
  output.fragNormal = normalWorldSpace.xyz;
  output.fragTangent = tangentWorldSpace.xyz;
  return output;
}