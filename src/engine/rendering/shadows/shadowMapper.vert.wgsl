@group(0) @binding(0) var<uniform> lightViewProjectionMatrix : mat4x4f;
@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;

@vertex
fn main(
  @location(0) position: vec4f
) -> @builtin(position) vec4f {
   return lightViewProjectionMatrix * modelMatrix * position;
}