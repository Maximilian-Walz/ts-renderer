@group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(0) @binding(2) var gBufferORM: texture_2d<f32>;
@group(0) @binding(3) var gBufferEmission: texture_2d<f32>;
@group(0) @binding(4) var gBufferDepth: texture_depth_2d;


fn loadGBufferTexture(texture: texture_2d<f32>, coord: vec4f) -> vec4f {
  return textureLoad(texture, vec2i(floor(coord.xy)), 0);
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

  let albedo = loadGBufferTexture(gBufferAlbedo, coord).rgb;
  let emission = loadGBufferTexture(gBufferEmission, coord).rgb;
  
  let ambient = 0.2;
  let result = emission + ambient * albedo;
  return vec4(result, 1.0);
}