varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp float resolution;
uniform highp vec4 outputFrame;

uniform mat3 cameraMatrix;
uniform float skyHeight;
uniform float waterDepth;
uniform float timeOfDay;

vec3 skyTopColor = vec3(0.0, 0.5, 1.0);
vec3 horizonColor = vec3(0.99, 0.99, 1.0);
vec3 waterTopColor = vec3(0.8, 0.9, 1.0);
vec3 waterMiddleColor = vec3(0.0, 0.5, 1.0);
vec3 waterBottomColor = vec3(0.0, 0.0, 0.01);

float invLerp(float from, float to, float value){
  return (value - from) / (to - from);
}

void main(void){
  gl_FragColor = texture2D(uSampler, vTextureCoord);

  vec2 screenPosition = vTextureCoord * inputSize.xy + outputFrame.xy;
  vec2 worldPosition = (cameraMatrix * vec3(screenPosition.xy, 1.0)).xy / resolution;

  float x = worldPosition.x; // meters
  float y = worldPosition.y; // meters
  
  float horizonPoint = 0.0;
  float topPoint = 3.0;
  float midPoint = 10.0;
  float bottomPoint = 40.0;

  if (y < horizonPoint) {
    float t = invLerp(-skyHeight, 0.0, y);
    gl_FragColor.xyz = mix(skyTopColor, horizonColor, t);
  } else if (y < topPoint) {
    float t = invLerp(0.0, topPoint, y);
    gl_FragColor.xyz = mix(horizonColor, waterTopColor, t);
  } else if (y < midPoint) {
    float t = invLerp(topPoint, midPoint, y);
    gl_FragColor.xyz = mix(waterTopColor, waterMiddleColor, t);
  } else if (y < bottomPoint) {
    float t = invLerp(midPoint, bottomPoint, y);
    gl_FragColor.xyz = mix(waterMiddleColor, waterBottomColor, t);
  } else {
    gl_FragColor.xyz = waterBottomColor;
  }

  gl_FragColor.a = 1.0;
}