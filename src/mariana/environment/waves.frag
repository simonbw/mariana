varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp float resolution;
uniform highp vec4 outputFrame;

uniform mat3 cameraMatrix;
uniform vec3 waterColor;

float PI2 = 2.0 * 3.1415926538;

// wave stuff
uniform highp float t;
uniform highp float a;
uniform highp float T;
uniform highp float lambda;
// wave2 stuff
uniform highp float t2;
uniform highp float a2;
uniform highp float T2;
uniform highp float lambda2;

/** Returns the height of the surface at x */
float getSurfaceY(float x) {
  float wave1 = a * sin(PI2 * (x / lambda - t / T));
  float wave2 = a2 * sin(PI2 * (x / lambda2 - t2 / T2));
  return wave1 + wave2;
}

void main(void){
  gl_FragColor = texture2D(uSampler, vTextureCoord);

  vec2 screenPosition = vTextureCoord * inputSize.xy + outputFrame.xy;
  vec2 worldPosition = (cameraMatrix * vec3(screenPosition.xy, 1.0)).xy / resolution;

  float x = worldPosition.x; // meters
  float y = worldPosition.y; // meters

  float height = getSurfaceY(x);

  if (y < height) {
    // Transparent above the surface
    gl_FragColor = vec4(0.0);
  } else if (y < height + 0.05) {
    // surface foam
    gl_FragColor = vec4(1, 1, 1, 1) * 0.7;
  } else {
    gl_FragColor = vec4(waterColor, 1.0) * 0.3;
  }
}