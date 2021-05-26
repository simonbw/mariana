varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp vec4 outputFrame;

uniform float healthPercent;
uniform float airPercent;

void main(void){

  vec3 grayMagic = vec3(0.2126, 0.7152, 0.0722);

  vec4 originalColor = texture2D(uSampler, vTextureCoord);
  vec3 color = originalColor.rgb;

  float luminence = dot(originalColor.rgb, grayMagic);
  vec3 faded = vec3(luminence, luminence, luminence) * 0.85;

  float desaturateAmount = 1.0 - healthPercent;
  vec2 uv = vTextureCoord.xy * inputSize.xy / outputFrame.zw;
  // desaturateAmount *= distance(uv, vec2(0.5, 0.5)) * 2.0 + 1.0;
  desaturateAmount = clamp(desaturateAmount, 0.0, 1.0);

  float t = (1.0 - airPercent);
  float d = distance(uv, vec2(0.5, 0.5));
  float vignetteAmount = clamp((t - 0.5) * 2.0, 0.0, 1.0) + d * t;
  vignetteAmount = clamp(vignetteAmount, 0.0, 1.0);

  // desaturate
  color = mix(color, faded, desaturateAmount);
  
  // darken
  color = mix(color, vec3(0), vignetteAmount);

  float grayPoint = 0.2;
  // Apply contrast
  color = ((color.rgb - grayPoint) * (1.0 + desaturateAmount * 0.50)) + grayPoint;

  gl_FragColor.rgb = color;
  gl_FragColor.a = originalColor.a;
}