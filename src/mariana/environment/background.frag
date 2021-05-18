varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp float resolution;
uniform highp vec4 outputFrame;

uniform mat3 cameraMatrix;
uniform float midDepth;
uniform float darkDepth;
uniform float hour;

uniform float sunriseStart;
uniform float sunriseEnd;
uniform float sunsetStart;
uniform float sunsetEnd;

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

float invLerp(float from, float to, float value){
  return (value - from) / (to - from);
}

vec3 waterTopColorDay = vec3(0.8, 0.9, 1.0);
vec3 waterMidColorDay = vec3(0.0, 0.3, 0.7);
vec3 waterDarkColorDay = vec3(0.0, 0.0, 0.01);
vec3 nightColor = vec3(0.0, 0.0, 0.01);

float horizonDepth = 0.0;

float getDayPercent(float hour) {
  if (hour < sunriseStart) {
    return 0.0;
  } else if (hour < sunriseEnd) {
    return invLerp(sunriseStart, sunriseEnd, hour);
  } else if (hour < sunsetStart) {
    return 1.0;
  } else if (hour < sunsetEnd) {
    return invLerp(sunsetEnd, sunsetStart, hour);
  } else {
    return 0.0;
  }
}

void main(void){
  vec2 screenPosition = vTextureCoord * inputSize.xy + outputFrame.xy;
  vec2 pos = (cameraMatrix * vec3(screenPosition.xy, 1.0)).xy / resolution;

  float x = pos.x; // meters
  float y = pos.y; // meters

  float nightPercent = mix(0.7, 0.0, getDayPercent(hour));

  vec3 waterTopColor = mix(waterTopColorDay, nightColor, nightPercent);
  vec3 waterMidColor = mix(waterMidColorDay, nightColor, nightPercent);
  vec3 waterDarkColor = mix(waterDarkColorDay, nightColor, nightPercent);

  float surfaceY = getSurfaceY(x);

  if (y < surfaceY) {
    // clear above water
    gl_FragColor.rgba = vec4(0.0);
  } else {
    gl_FragColor.a = 1.0;
    if (y < midDepth) {
      float t = invLerp(horizonDepth, midDepth, y);
      gl_FragColor.rgb = mix(waterTopColor, waterMidColor, t);
    } else if (y < darkDepth) {
      float t = invLerp(midDepth, darkDepth, y);
      gl_FragColor.rgb = mix(waterMidColor, waterDarkColor, t);
    } else {
      gl_FragColor.rgb = waterDarkColor;
    }
  }

}