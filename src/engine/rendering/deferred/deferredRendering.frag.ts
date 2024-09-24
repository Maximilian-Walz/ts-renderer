export default /*wgsl*/ `

const PI = 3.14159265;

struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(0) @binding(2) var gBufferORM: texture_2d<f32>;
@group(0) @binding(3) var gBufferEmission: texture_2d<f32>;
@group(0) @binding(4) var gBufferDepth: texture_depth_2d;

@group(1) @binding(0) var<uniform> camera : Camera;

fn loadGBufferTexture(texture: texture_2d<f32>, coord: vec4f) -> vec4f {
  return textureLoad(texture, vec2i(floor(coord.xy)), 0);
}

fn screenToWorld(coord : vec2f, depth_sample: f32) -> vec3f {
  // reconstruct world-space position from the screen coordinate.
  let posClip = vec4(coord.x * 2.0 - 1.0, (1.0 - coord.y) * 2.0 - 1.0, depth_sample, 1.0);
  let posWorldW = camera.invViewProjectionMatrix * posClip;
  let posWorld = posWorldW.xyz / posWorldW.www;
  return posWorld;
}

fn ggxDistribution(nDotH: f32, roughness: f32) -> f32 {
  let alpha2 = roughness * roughness * roughness * roughness;
  let d = nDotH * nDotH * (alpha2 - 1.0) + 1.0; 
  return alpha2 / (PI * d * d + 0.000001);
}

fn geomSmith(dp: f32, roughness: f32) -> f32 {
  let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  return dp / (dp * (1.0 - k) + k);
}

fn schlickFresnel(vDotH: f32, color: vec3f, metallic: f32) -> vec3f {
  let F0 = mix(vec3f(0.04), color, metallic);
  return F0 + (1.0 - F0) * pow(1.0 - vDotH, 5);
}

@fragment
fn main(
  @builtin(position) coord : vec4f
) -> @location(0) vec4f {
  let depth = textureLoad(gBufferDepth, vec2i(floor(coord.xy)), 0);

  // Background
  if (depth >= 1.0) {
    return vec4(0.2);
  }
  
  let bufferSize = textureDimensions(gBufferDepth);
  let uv = coord.xy / vec2f(bufferSize);
  let position = screenToWorld(uv, depth);

  let normal = loadGBufferTexture(gBufferNormal, coord).xyz;
  let albedo = loadGBufferTexture(gBufferAlbedo, coord).rgb;
  let orm = loadGBufferTexture(gBufferORM, coord).rgb;
  let emission = loadGBufferTexture(gBufferEmission, coord).rgb;

  let occlusion = orm.x;
  let roughness = orm.y;
  let metallic = orm.z;

  let lightPos = vec3(20.0, 2.0, 20.0);
  let lightCol = vec3(1.0, 1.0, 1.0);
  let lightPow = 4.0;
  let cameraPos = (camera.invViewProjectionMatrix * vec4f(0.0, 0.0, 0.0, 1.0)).xyz;

  let N = normalize(normal);
  let L = normalize(lightPos);
  let V = normalize(cameraPos - position);
  let H = normalize(V + L);
  
  let nDotL = max(dot(N, L), 0);
  let nDotH = max(dot(N, H), 0);
  let nDotV = max(dot(N, V), 0);
  let vDotH = max(dot(V, H), 0);

  let lambert = albedo / PI;
  let fresnel = schlickFresnel(vDotH, albedo, metallic);
  let kD = (1.0 - fresnel) * (1.0 - metallic);
  
  let normalDistribution = ggxDistribution(nDotH, roughness);
  let geometryTerm = geomSmith(nDotL, roughness) * geomSmith(nDotV, roughness);

  let diffuse = kD * lambert;
  let specular = normalDistribution * geometryTerm * fresnel / (4.0 * nDotV * nDotL + 0.000001);
  let result = emission + (diffuse + specular) * lightCol * lightPow * nDotL;

  return vec4(result, 1.0);
}
`
