export default /*wgsl*/ `

struct Camera {
  viewProjectionMatrix : mat4x4f,
  invViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> camera : Camera;
@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;
@group(1) @binding(1) var<uniform> normalModelMatrix : mat4x4f;
@group(2) @binding(0) var albedoTexture: texture_2d<f32>;
@group(2) @binding(1) var albedoSampler: sampler;
@group(2) @binding(2) var metallicRoughnessTexture: texture_2d<f32>;
@group(2) @binding(3) var metallicRoughnessSampler: sampler;
@group(2) @binding(4) var normalTexture: texture_2d<f32>;
@group(2) @binding(5) var normalSampler: sampler;
@group(2) @binding(6) var occlusionTexture: texture_2d<f32>;
@group(2) @binding(7) var occlusionSampler: sampler;
@group(2) @binding(8) var emissiveTexture: texture_2d<f32>;
@group(2) @binding(9) var emissiveSampler: sampler;


struct GBufferOutput {
  @location(0) normal : vec4f,

  // Textures: diffuse color, specular color, smoothness, emissive etc. could go here
  @location(1) albedo : vec4f,
  @location(2) orm: vec4f,
}

@fragment
fn main(
  @location(0) fragNormal: vec3f,
  @location(1) fragTangent: vec3f,
  @location(2) fragUV : vec2f
) -> GBufferOutput {
  var output : GBufferOutput;

  let sampledNormal = textureSample(normalTexture, normalSampler, fragUV).rgb;
  let bitangent = normalize(cross(fragNormal, fragTangent));
  let TBN = mat3x3f(fragTangent, bitangent, fragNormal);
  output.normal = vec4((TBN * normalize(sampledNormal - 0.5)), 1.0);

  output.albedo = textureSample(albedoTexture, albedoSampler, fragUV);
  
  let metallicRoughness = textureSample(metallicRoughnessTexture, metallicRoughnessSampler, fragUV).yz;
  let occlusion = textureSample(occlusionTexture, occlusionSampler, fragUV).x;
  output.orm = vec4f(occlusion, metallicRoughness, 1.0);

  return output;
}

`
