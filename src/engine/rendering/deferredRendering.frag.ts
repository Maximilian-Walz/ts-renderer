export default /*wgsl*/ `
struct Camera {
    viewProjectionMatrix : mat4x4f,
    invViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(0) @binding(2) var gBufferDepth: texture_depth_2d;

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

  let bufferSize = textureDimensions(gBufferDepth);
  let coordUV = coord.xy / vec2f(bufferSize);
  let position = world_from_screen_coord(coordUV, depth);

  let radius = 200.0;
  let lightPos = vec3(1.0, 10.0, 1.0);
  let lightCol = vec3(1.0, 1.0, 1.0);
  let L = lightPos - position;
  let distance = length(L);
  if (distance < radius) {
    let lambert = max(dot(normal, normalize(L)), 0.0);
    result += vec3f(
      lambert * pow(1.0 - distance / radius, 2.0) * lightCol * albedo
    );
  }

  return vec4(result, 1.0);
}
`
