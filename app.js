import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
const root=document.querySelector("#viewport"),scene=new THREE.Scene();scene.background=new THREE.Color("#0b1524");
const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(5,4,7);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));root.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,0);
scene.add(new THREE.HemisphereLight(0xcceeff,0x26334a,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,7,5);scene.add(light);
scene.add(new THREE.GridHelper(12,24,0x31506d,0x1c3048));
function resize(){const w=root.clientWidth,h=root.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}new ResizeObserver(resize).observe(root);resize();
let group=null,kind="object",name="Block3D_Model";
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1});
function box(g,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o)}
function build(){if(group)scene.remove(group);group=new THREE.Group();const c=mat(document.querySelector("#color").value),dark=mat("#172b42"),glow=mat("#b4eaff");
if(kind==="character"){box(group,0,1.6,0,.85,.85,.55,c);const head=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),glow);head.position.y=2.35;group.add(head);box(group,-.25,.65,0,.3,.9,.35,dark);box(group,.25,.65,0,.3,.9,.35,dark);box(group,-.58,1.1,0,.28,.8,.3,c);box(group,.58,1.1,0,.28,.8,.3,c)}
else if(kind==="vehicle"){box(group,0,.7,0,2.6,.55,1.2,c);box(group,0,1.15,0,1.35,.55,1,glow);for(const x of [-.85,.85])for(const z of [-.67,.67]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.18,20),dark);w.rotation.x=Math.PI/2;w.position.set(x,.35,z);group.add(w)}}
else if(kind==="building"){box(group,0,1,0,2.2,2,2,c);const roof=new THREE.Mesh(new THREE.ConeGeometry(1.6,.9,4),dark);roof.position.y=2.45;roof.rotation.y=Math.PI/4;group.add(roof);box(group,0,.45,1.02,.5,.9,.08,glow)}
else{box(group,0,.75,0,1.65,1.5,1.35,c);box(group,0,1.55,0,.9,.16,.8,glow)}
scene.add(group);const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());group.position.sub(center);const max=Math.max(size.x,size.y,size.z);camera.position.set(max*1.8,max*1.4,max*1.8);controls.target.set(0,0,0);controls.update();
document.querySelector("#status").style.display="none";document.querySelector("#obj").disabled=false;document.querySelector("#stl").disabled=false;
const labels={object:"3D-Objekt",character:"Blocky-Charakter",vehicle:"Fahrzeug",building:"Gebäude"};document.querySelector("#modelName").textContent=labels[kind];document.querySelector("#modelMeta").textContent=document.querySelector("#style").value+" · Demo-Geometrie";
name=(document.querySelector("#prompt").value.trim().split(/\s+/).slice(0,4).join("_").replace(/[^a-z0-9_-]/gi,"")||labels[kind].replace(/\s/g,"_"))}
document.querySelectorAll(".types button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".types button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");kind=b.dataset.type}));
document.querySelector("#prompt").addEventListener("input",e=>document.querySelector("#count").textContent=e.target.value.length+" / 400");
document.querySelector("#generate").addEventListener("click",()=>{document.querySelector("#status").style.display="block";document.querySelector("#status").textContent="Erstelle 3D-Vorschau …";setTimeout(build,250)});
document.querySelector("#color").addEventListener("change",()=>{if(group)build()});
document.querySelector("#reset").addEventListener("click",()=>{if(group){const b=new THREE.Box3().setFromObject(group),s=b.getSize(new THREE.Vector3()),m=Math.max(s.x,s.y,s.z);camera.position.set(m*1.8,m*1.4,m*1.8);controls.target.set(0,0,0);controls.update()}});
function triangles(mesh){const p=mesh.geometry.getAttribute("position"),idx=mesh.geometry.index,out=[];const v=i=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(idx){for(let i=0;i<idx.count;i+=3)out.push([v(idx.getX(i)),v(idx.getX(i+1)),v(idx.getX(i+2))])}else{for(let i=0;i<p.count;i+=3)out.push([v(i),v(i+1),v(i+2)])}return out}
function save(data,ext){const blob=new Blob([data],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name+"."+ext;a.click();URL.revokeObjectURL(url)}
function exportFile(ext){if(!group)return;group.updateMatrixWorld(true);let out="",n=1;group.traverse(o=>{if(!o.isMesh)return;for(const t of triangles(o)){if(ext==="obj"){for(const v of t)out+="v "+v.x+" "+v.y+" "+v.z+"\n";out+="f "+n+" "+(n+1)+" "+(n+2)+"\n";n+=3}else{const normal=new THREE.Vector3().subVectors(t[1],t[0]).cross(new THREE.Vector3().subVectors(t[2],t[0])).normalize();out+=" facet normal "+normal.x+" "+normal.y+" "+normal.z+"\n  outer loop\n";for(const v of t)out+="   vertex "+v.x+" "+v.y+" "+v.z+"\n";out+="  endloop\n endfacet\n"}}});if(ext==="stl")out="solid Block3D\n"+out+"endsolid Block3D";save(out,ext)}
document.querySelector("#obj").addEventListener("click",()=>exportFile("obj"));document.querySelector("#stl").addEventListener("click",()=>exportFile("stl"));
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();