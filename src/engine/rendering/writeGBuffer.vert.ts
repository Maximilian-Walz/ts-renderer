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
  @location(0) fragNormal: vec3f,    // normal in world space
  @location(1) fragUV: vec2f,
}

@vertex
fn main(
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) uv : vec2f
) -> VertexOutput {
  var output : VertexOutput;
  let worldPosition = (modelMatrix * position);
  output.Position = worldPosition;
  output.fragNormal = normalize((normalModelMatrix * vec4(normal, 1.0)).xyz); // TODO: Should use normalModelMatrix here!
  output.fragUV = uv;
  return output;
}
`
