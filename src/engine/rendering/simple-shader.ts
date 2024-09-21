export default /*wgsl*/ `
struct Uniforms {
  modelViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> viewMatrix: mat4x4f;
@group(1) @binding(0) var<uniform> uniforms : Uniforms;
@group(2) @binding(0) var myTexture: texture_2d<f32>;
@group(2) @binding(1) var mySampler: sampler;

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
  output.fragPosition = position;
  output.fragNormal = 0.5 * (normal + vec3(1, 1, 1));
  output.fragTexcoord0 = texcoord0; 
  return output;
}

const lightPos = vec3(0.1, 0.1, 0.1);
const lightPower = 1.0;
const lightColor = vec3f(1.0, 1.0, 1.0);
const specColor = vec3f(1.0, 1.0, 0.0);
const shininess = 16.0;

@fragment
fn fs(
  @location(0) fragPosition: vec4f,
  @location(1) fragNormal: vec3f,
  @location(2) fragTexcoord0: vec2f
) -> @location(0) vec4f {  
  var fragPos = viewMatrix * fragPosition;
  var normal = normalize(fragNormal);

  var diffuseColor = textureSample(myTexture, mySampler,fragTexcoord0).xyz;
  var lightDir = normalize(lightPos - fragPos.xyz);
  var distance = length(lightDir);
  distance = distance * distance;
  lightDir = normalize(lightDir);
  
  var lambertian = max(dot(lightDir, normal), 0.0);
  var specular = 0.0;

  if (lambertian > 0.0) {
    var viewDir = normalize(-fragPos).xyz;
    var halfDir = normalize(lightDir + viewDir);
    var specAngle = max(dot(halfDir, normal), 0.0);
    specular = pow(specAngle, shininess);
  }

  var colorLinear = diffuseColor * lambertian * lightColor * lightPower / distance + specColor * specular * lightColor * lightPower / distance;
  return vec4(colorLinear.xyz, 1.0);
}
`
