varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform highp float resolution;
uniform highp vec4 outputFrame;

uniform mat3 cameraMatrix;
uniform float hour;

uniform float sunriseStart;
uniform float sunriseMid;
uniform float sunriseEnd;
uniform float sunsetStart;
uniform float sunsetMid;
uniform float sunsetEnd;

float PI2 = 2.0 * 3.1415926538;

float invLerp(float from, float to, float value) {
  return clamp((value - from) / (to - from), 0.0, 1.0);
}

// mid day
vec3 topColorDay = vec3(0.5, 0.7, 1.0);
vec3 bottomColorDay = vec3(1.0, 1.0, 1.0);

// sunset
vec3 topColorSunset = vec3(0.3, 0.2, 0.5);
vec3 bottomColorSunset = vec3(1.0, 0.7, 0.5);

// night
vec3 topColorNight = vec3(0.0, 0.0, 0.05);
vec3 bottomColorNight = vec3(0.02, 0.05, 0.22);

// sunrise
vec3 topColorSunrise = vec3(0.5, 0.3, 0.9);
vec3 bottomColorSunrise = vec3(1.0, 0.7, 0.5);


vec3 getTopColor(float hour) {
  if (hour < sunriseStart) {
    return topColorNight;
  } else if (hour < sunriseMid) {
    float t = invLerp(sunriseStart, sunriseMid, hour);
    return mix(topColorNight, topColorSunrise, t);
  } else if (hour < sunriseEnd) {
    float t = invLerp(sunriseMid, sunriseEnd, hour);
    return mix(topColorSunrise, topColorDay, t);
  } else if (hour < sunsetStart) {
    return topColorDay;
  } else if (hour < sunsetMid) {
    float t = invLerp(sunsetStart, sunsetMid, hour);
    return mix(topColorDay, topColorSunset, t);
  } else if (hour < sunsetEnd) {
    float t = invLerp(sunsetMid, sunsetEnd, hour);
    return mix(topColorSunset, topColorNight, t);
  } else {
    return topColorNight;
  }
}

vec3 getBottomColor(float hour) {
  if (hour < sunriseStart) {
    return bottomColorNight;
  } else if (hour < sunriseMid) {
    float t = invLerp(sunriseStart, sunriseMid, hour);
    return mix(bottomColorNight, bottomColorSunrise, t);
  } else if (hour < sunriseEnd) {
    float t = invLerp(sunriseMid, sunriseEnd, hour);
    return mix(bottomColorSunrise, bottomColorDay, t);
  } else if (hour < sunsetStart) {
    return bottomColorDay;
  } else if (hour < sunsetMid) {
    float t = invLerp(sunsetStart, sunsetMid, hour);
    return mix(bottomColorDay, bottomColorSunset, t);
  } else if (hour < sunsetEnd) {
    float t = invLerp(sunsetMid, sunsetEnd, hour);
    return mix(bottomColorSunset, bottomColorNight, t);
  } else {
    return bottomColorNight;
  }
}

void main(void){
  vec2 screenPosition = vTextureCoord * inputSize.xy + outputFrame.xy;
  vec2 pos = (cameraMatrix * vec3(screenPosition.xy, 1.0)).xy / resolution;

  float horizonY = 0.0;
  float skyTopY = -20.0;

  vec3 topColor = getTopColor(hour);
  vec3 bottomColor = getBottomColor(hour);

  float t = invLerp(horizonY, skyTopY, pos.y);
  gl_FragColor.rgb = mix(bottomColor, topColor, t);
  gl_FragColor.a = 1.0;

  float t2 = radians(270.0) - (PI2 * hour) / 24.0;
  vec2 sunPos = vec2(20.0 * cos(t2), -12.0 * sin(t2)); 
  vec2 sunOffset = sunPos - pos;

  float r = 1.2;
  float glowPercent = (invLerp(sunriseMid, sunriseStart - 1.0, hour) + invLerp(sunsetStart, sunsetEnd, hour));
  float m = 0.8 + 4.0 * smoothstep(0.0, 1.0, glowPercent);

  vec3 sunColor = mix(vec3(1.0, 1.0, 0.8), vec3(1.0, 0.8, 0.6), glowPercent);
  
  float d = smoothstep(r, r + m, length(sunOffset));
  
  gl_FragColor.rgb = mix(sunColor, gl_FragColor.rgb,  d);
}