export default /*wgsl*/ `
struct Camera {
  viewProjectionMatrix : mat4x4f,
  invViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> camera : Camera;
@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(1) @binding(1) var<uniform> normalModelMatrix : mat4x4f;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fragNormal: vec3f,
  @location(1) fragTangent: vec3f,
  @location(2) fragUV: vec2f,
}

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) tangent: vec3f,
  @location(3) uv : vec2f
) -> VertexOutput {
  var output : VertexOutput;
  let worldPosition = (camera.viewProjectionMatrix * modelMatrix * position);
  output.Position = worldPosition;
  output.fragNormal = normalize(normalModelMatrix * vec4f(normal, 1.0)).xyz;
  output.fragTangent = normalize(normalModelMatrix * vec4f(tangent, 1.0)).xyz;
  output.fragUV = uv;
  return output;
}
`
