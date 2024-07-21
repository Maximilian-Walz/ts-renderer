export default /*wgsl*/ `
struct Uniforms {
  modelViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(1) @binding(0) var myTexture: texture_2d<f32>;
@group(1) @binding(1) var mySampler: sampler;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fragPosition: vec4f,
  @location(1) fragNormal: vec3f,
  @location(2) fragTexcoord0: vec2f
}

@vertex
fn vs(
  @builtin(vertex_index) v_index: u32,
  @location(0) position : vec4f,
  @location(1) normal: vec3f,
  @location(2) texcoord0: vec2f
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragPosition = 0.5 * (position + vec4(1, 1, 1, 1));
  output.fragNormal = 0.5 * (normal + vec3(1, 1, 1));
  output.fragTexcoord0 = texcoord0; 
  return output;
}

@fragment
fn fs(
  @location(0) fragPosition: vec4f,
  @location(1) fragNormal: vec3f,
  @location(2) fragTexcoord0: vec2f
) -> @location(0) vec4f {

  var lightDir = normalize(vec3f(0.7, 1, 0));
  var nDotL = dot(normalize(fragNormal), lightDir);
  return textureSample(myTexture, mySampler,fragTexcoord0) * nDotL;
}
`
