import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'

import vertex1 from './shadersTubes/vertex.glsl'
import fragment1 from './shadersTubes/fragment.glsl'
import SimplexNoise from 'simplex-noise/dist/cjs/simplex-noise';

const simplex = new SimplexNoise(Math.random);

function computeCurl(x, y, z){
  var eps = 0.0001;

  var curl = new THREE.Vector3();

  //Find rate of change in YZ plane
  var n1 = simplex.noise2D(x, y + eps, z); 
  var n2 = simplex.noise2D(x, y - eps, z); 
  //Average to find approximate derivative
  var a = (n1 - n2)/(2 * eps);
  var n1 = simplex.noise2D(x, y, z + eps); 
  var n2 = simplex.noise2D(x, y, z - eps); 
  //Average to find approximate derivative
  var b = (n1 - n2)/(2 * eps);
  curl.x = a - b;

  //Find rate of change in XZ plane
  n1 = simplex.noise2D(x, y, z + eps); 
  n2 = simplex.noise2D(x, y, z - eps); 
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise2D(x + eps, y, z); 
  n2 = simplex.noise2D(x - eps, y, z); 
  b = (n1 - n2)/(2 * eps);
  curl.y = a - b;

  //Find rate of change in XY plane
  n1 = simplex.noise2D(x + eps, y, z); 
  n2 = simplex.noise2D(x - eps, y, z); 
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise2D(x, y + eps, z); 
  n2 = simplex.noise2D(x, y - eps, z); 
  b = (n1 - n2)/(2 * eps);
  curl.z = a - b;

  return curl;
}


export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.eMouse = new THREE.Vector2(0,0)
    this.temp = new THREE.Vector2(0,0)
    this.elasticMouse = new THREE.Vector2(0,0)
    this.elasticMouseVel = new THREE.Vector2(0,0)
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1); 
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = false;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 1.2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;
    
    this.addObjects();
    this.raycast();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  raycast(){
    this.raycastPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10,10),
      // new THREE.MeshBasicMaterial({color:0xcb0d02})
      this.material
    )

    this.light = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.02,20,20),
      new THREE.MeshBasicMaterial({color:0xa8e6cf})
    )
      
    this.scene1.add(this.raycastPlane)
    this.scene.add(this.light)

    this.container.addEventListener('mousemove', (event) => {
      this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
      this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
      this.raycaster.setFromCamera(this.mouse,this.camera)

      this.eMouse.x = event.clientX
      this.eMouse.y = event.clientY

      const intersects = this.raycaster.intersectObjects([this.raycastPlane])
      if(intersects.length > 0){
        let p = intersects[0].point
        this.eMouse.x = p.x
        this.eMouse.y = p.y
      }
    })
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }
  
  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uLight:{value: new THREE.Vector3(0,0,0)},
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.materialTubes = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uLight:{value: new THREE.Vector3(0,0,0)},
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      vertexShader: vertex1,
      fragmentShader: fragment1
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    for (let i = 0; i < 300; i++) {
      let path = new THREE.CatmullRomCurve3(this.getCurve(new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )))
      let geometry = new THREE.TubeBufferGeometry(path,600,0.005,8,false)

      let curve = new THREE.Mesh(geometry, this.materialTubes);
      this.scene.add(curve);
    }

   
  }

  getCurve(start){
    let scale = 1
    let points = []
    points.push(start)
    let currentPoint = start.clone()

    for(let i = 0; i < 600; i++){
      let v = computeCurl(currentPoint.x/scale,currentPoint.y/scale,currentPoint.z/scale)
      currentPoint.addScaledVector(v,0.001)

      points.push(currentPoint.clone())
    }
    return points
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    // document.querySelector('.cursor').style.transform = `translate(
    //   ${this.elasticMouse.x}px,
    //   ${this.elasticMouse.y}px
    // )`

    this.temp.copy(this.eMouse).sub(this.elasticMouse).multiplyScalar(.15)
    this.elasticMouseVel.add(this.temp)
    this.elasticMouseVel.multiplyScalar(.8)
    this.elasticMouse.add(this.elasticMouseVel)
    this.light.position.x = this.elasticMouse.x
    this.light.position.y = this.elasticMouse.y

    this.material.uniforms.uLight.value = this.light.position
    this.materialTubes.uniforms.uLight.value = this.light.position
    
    this.material.uniforms.time.value = this.time;
    this.materialTubes.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));

    this.renderer.clear();
    this.renderer.render(this.scene1 , this.camera);
    this.renderer.clearDepth();

    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});

