uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
uniform vec3 uLight;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 v_worldPosition;

float PI=3.141592653589793238;

float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d){
    // light to ray origin
    vec3 q = cameraPos - lightPos;

    // coefficients
    float b = dot(dir,q);
    float c = dot(q,q);

    // evaluate integral
    float t = c - b*b;
    float s = 1.0 / sqrt(max(0.001, t));
    float l = s * (atan( (d + b) *s) - atan(b*s));

    return pow(max(0.0, l / 15.), 0.4);
}


void main(){

    float dash = sin(vUv.x * 50. + time/10.);
    if(dash<0.3) discard;

    vec3 cameraToWorld = v_worldPosition - cameraPosition;
    vec3 cameraToWorldDir = normalize(cameraToWorld);
    float cameraToWorldDistance = length(cameraToWorld);
    
    vec3 lightToWorld = normalize(uLight - v_worldPosition);
    float diffusion = max(0.,dot(vNormal,lightToWorld));
    float dist = length(uLight - vPosition);

    float scatter = getScatter(cameraPosition, cameraToWorldDir, uLight, cameraToWorldDistance);

    float final = diffusion; 
    gl_FragColor=vec4(1. - dist,0.,0.,1.);
    gl_FragColor=vec4(diffusion,0.,0.,1.);
    gl_FragColor=vec4(scatter,0.,0.,1.);
    // gl_FragColor=vec4(final,0.,0.,1.);
}