export default /*wgsl*/ `
struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(0) @binding(2) var gBufferORM: texture_2d<f32>;
@group(0) @binding(3) var gBufferDepth: texture_depth_2d;

@group(1) @binding(0) var<uniform> camera : Camera;

fn world_from_screen_coord(coord : vec2f, depth_sample: f32) -> vec3f {
  // reconstruct world-space position from the screen coordinate.
  let posClip = vec4(coord.x * 2.0 - 1.0, (1.0 - coord.y) * 2.0 - 1.0, depth_sample, 1.0);
  let posWorldW = camera.invViewProjectionMatrix * posClip;
  let posWorld = posWorldW.xyz / posWorldW.www;
  return posWorld;
}

@fragment
fn main(
  @builtin(position) coord : vec4f
) -> @location(0) vec4f {
  var result : vec3f;

  let depth = textureLoad(
    gBufferDepth,
    vec2i(floor(coord.xy)),
    0
  );

  // Don't light the sky.
  if (depth >= 1.0) {
    discard;
  }

  let normal = textureLoad(
    gBufferNormal,
    vec2i(floor(coord.xy)),
    0
  ).xyz;

  let albedo = textureLoad(
    gBufferAlbedo,
    vec2i(floor(coord.xy)),
    0
  ).rgb;

  let orm = textureLoad(
    gBufferORM,
    vec2i(floor(coord.xy)),
    0
  ).rgb;

  let occlusion = orm.x;
  let roughness = orm.y;
  let metallic = orm.z;

  let bufferSize = textureDimensions(gBufferDepth);
  let coordUV = coord.xy / vec2f(bufferSize);
  let position = world_from_screen_coord(coordUV, depth);

  let lightPos = vec3(1.0, 2.0, 1.0);
  let lightCol = vec3(1.0, 1.0, 1.0);
  let lightPow = 15.0;

  var L = lightPos - position;
  var distance = length(L);
  L = normalize(L);
  distance = distance * distance;

  let NdotL = dot(normal, L);
  let diffuse = roughness * albedo * lightCol * lightPow / distance;
  
  let cameraPos = (camera.viewProjectionMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  let V = cameraPos - position;
  let H = normalize(L + V);

  let NdotH = dot(normal, H);
  let specularIntensity = pow(saturate(NdotH), 4.0);

  let specular = specularIntensity * lightCol * lightPow / distance;

  return vec4(diffuse + specular, 1.0);
}
`
