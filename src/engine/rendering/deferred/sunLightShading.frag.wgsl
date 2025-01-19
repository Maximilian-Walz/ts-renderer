const PI = 3.14159265;
const PCF_SIZE = 3;
const PCF_OFFSET = 0.0002;

struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
}

struct Light {
  direction: vec4f,
  viewProjectionMatrix: mat4x4f,
  color: vec3f,
  power: f32
}

@group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(0) @binding(2) var gBufferORM: texture_2d<f32>;
@group(0) @binding(3) var gBufferEmission: texture_2d<f32>;
@group(0) @binding(4) var gBufferDepth: texture_depth_2d;

@group(1) @binding(0) var<uniform> camera : Camera;

@group(2) @binding(0) var<uniform> light: Light;
@group(2) @binding(1) var shadowMapTexture: texture_depth_2d;
@group(2) @binding(2) var shadowMapSampler: sampler_comparison;


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
  let bufferSize = textureDimensions(gBufferDepth);
  let uv = coord.xy / vec2f(bufferSize);
  let position = screenToWorld(uv, depth);
  
  let positionLightSpaceW = light.viewProjectionMatrix * vec4f(position, 1.0);  
  var positionLightSpace = positionLightSpaceW.xyz;
  positionLightSpace = vec3f(positionLightSpace.xy * vec2(0.5, -0.5) + vec2(0.5), positionLightSpace.z);

  var shadowMapValue = 0.0;
  for (var y = -PCF_SIZE; y <= PCF_SIZE; y++) {
    for (var x = -PCF_SIZE; x <= PCF_SIZE; x++) {
      let offset = vec2f(vec2(x, y)) * PCF_OFFSET;
      shadowMapValue += textureSampleCompare(shadowMapTexture, shadowMapSampler,positionLightSpace.xy + offset, positionLightSpace.z - 0.007);
    }
  }
  shadowMapValue /= (1 + PCF_SIZE + PCF_SIZE) * (1 + PCF_SIZE + PCF_SIZE);

  // Background
  if (depth >= 1.0) {
    discard;
  }

  if (shadowMapValue == 0) {
    discard;
  }

  let normal = loadGBufferTexture(gBufferNormal, coord).xyz;
  let albedo = loadGBufferTexture(gBufferAlbedo, coord).rgb;
  let orm = loadGBufferTexture(gBufferORM, coord).rgb;

  let occlusion = orm.x;
  let roughness = orm.y;
  let metallic = orm.z;

  let cameraPos = (camera.invViewProjectionMatrix * vec4f(0.0, 0.0, 0.0, 1.0)).xyz;

  let N = normalize(normal);
  let V = normalize(cameraPos - position);
  let nDotV = max(dot(N, V), 0);
  
  let lambert = albedo / PI;
  
  // Sun light or Point light
  var L = normalize(light.direction.xyz);
  let H = normalize(V + L);
  let nDotL = max(dot(N, L), 0);
  let nDotH = max(dot(N, H), 0);
  let vDotH = max(dot(V, H), 0);
  
  let fresnel = schlickFresnel(vDotH, albedo, metallic);
  let kD = (1.0 - fresnel) * (1.0 - metallic);
  
  let normalDistribution = ggxDistribution(nDotH, roughness);
  let geometryTerm = geomSmith(nDotL, roughness) * geomSmith(nDotV, roughness);
  
  let diffuse = kD * lambert;
  let specular = normalDistribution * geometryTerm * fresnel / (4.0 * nDotV * nDotL + 0.000001);
  let result = (diffuse + specular) * light.color * light.power * nDotL;


  return vec4(shadowMapValue * result, 1.0);
}