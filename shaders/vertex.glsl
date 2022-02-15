uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 v_worldPosition;
uniform vec2 pixels;
float PI=3.141592653589793238;
void main(){
    vUv=uv;
    vPosition = position;
    vNormal = normal;
    v_worldPosition = (modelMatrix * vec4(position,1.0)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}