const canvas=document.querySelector('#field'),gl=canvas.getContext('webgl',{alpha:true,antialias:true});
const motion=document.querySelector('#motion'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let w=0,h=0,r=0,time=0,last=0,frame=0,paused=reduced.matches,gather=0,gatherVelocity=0,turn=0,turnTarget=0;
const pointer={x:-9999,y:-9999,active:false,down:false,previousX:0,keyboard:false};
let touchTimer;
const vertex=`
precision highp float;
attribute vec2 uv;
uniform float t,mixAmount,scale,turn,mode,reveal,pixelRatio;
uniform vec2 viewport;
varying float brightness,opacity;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float heightAt(vec2 p){
 vec2 drift=vec2(t*.09,-t*.055);
 float n=noise(p*2.1+drift)*.40+noise(p*4.3-drift*.6)*.19+noise(p*8.7+drift*.4)*.075+noise(p*17.3-drift*.3)*.025;
 return (n-.34)*1.6+.21*sin(p.x*3.6+p.y*1.9-t*.38)+.10*sin(p.y*4.7-p.x*1.8+t*.21);
}
void main(){
 float seed=hash(uv*217.+2.);
 float a=hash(uv*731.+19.)*6.2831853;
 float rad=sqrt(-2.*log(max(.003,hash(uv*513.+8.))))*.42;
 vec3 cloud=vec3(cos(a)*rad*viewport.x/scale*.42,sin(a)*rad*viewport.y/scale*.48,(seed-.5)*1.6);
 cloud.xy+=vec2(sin(t*.19+seed*18.),cos(t*.17+a))*.13;
 float q=t*.025;cloud.xz=mat2(cos(q),-sin(q),sin(q),cos(q))*cloud.xz;
 vec2 p=uv*vec2(1.22,.95);
 float ht=heightAt(p);
 vec3 normal=normalize(vec3(-(heightAt(p+vec2(.014,0))-ht)/.014,1.,-(heightAt(p+vec2(0,.014))-ht)/.014));
 float yaw=.18+turn+sin(t*.12)*.07;
 vec3 terrain=vec3(p.x,ht,p.y);
 terrain.xz=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*terrain.xz;
 float sy=-terrain.y*.86-terrain.z*.51;
 float sz=-terrain.y*.51+terrain.z*.86;
 vec3 shaped=vec3(terrain.x*.985-sy*.17,terrain.x*.17+sy*.985,sz);
 vec3 pos=mix(cloud,shaped,mixAmount);
 float camera=4.8-pos.z;
 gl_Position=vec4(pos.x*scale*9.6/viewport.x,-pos.y*scale*9.6/viewport.y,(.12-pos.z*.14-mode*.0003)*camera,camera);
 float edge=pow(max(0.,1.-pow(abs(uv.x),12.)),.35)*pow(max(0.,1.-pow(abs(uv.y),10.)),.4);
 float light=.24+.70*max(0.,dot(normal,normalize(vec3(-.4,1.,.6))));
 brightness=mix(.28+seed*.35,light,mixAmount);
 opacity=mix(1.,edge,mixAmount)*reveal;
 gl_PointSize=mix(1.2+seed*.7,1.25,mixAmount)*4.8/camera*pixelRatio;
}`;
const fragment=`precision highp float;uniform float mode,mixAmount;varying float brightness,opacity;void main(){float surface=smoothstep(.94,.9995,mixAmount);float a=opacity;if(mode<.5&&fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)>surface)discard;if(mode>1.5){float d=length(gl_PointCoord-.5);a*=1.-smoothstep(.22,.5,d);a*=mix(.72,.8,mixAmount);}else if(mode>.5){a*=.9*surface;}else{a*=.12*surface;}gl_FragColor=vec4(vec3(brightness),a);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const cols=150,rows=100,vertices=[],triangles=[],lines=[];
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){vertices.push(i/(cols-1)*2-1,j/(rows-1)*2-1);const k=j*cols+i;if(j<rows-1&&i<cols-1)triangles.push(k,k+cols,k+1,k+1,k+cols,k+cols+1);if(j<rows-1)lines.push(k,k+cols);if(i<cols-1&&j%4===0)lines.push(k,k+1);}
const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
function indexBuffer(values){const b=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(values),gl.STATIC_DRAW);return b;}
const triangleBuffer=indexBuffer(triangles),lineBuffer=indexBuffer(lines),uniforms={};for(const name of ['t','mixAmount','scale','turn','mode','reveal','viewport','pixelRatio'])uniforms[name]=gl.getUniformLocation(program,name);
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
function resize(){w=innerWidth;h=innerHeight;r=w<700?Math.min(w*.34,h*.23):Math.min(w*.145,h*.235);const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;gl.viewport(0,0,canvas.width,canvas.height);render(0);}
function render(dt){
 const distance=Math.hypot((pointer.x-w/2)/1.2,pointer.y-h/2);
 const near=pointer.active?1-Math.max(0,Math.min(1,(distance/r-.65)/1.15)):0;
 const target=time<3.2&&!reduced.matches?0:(pointer.down||pointer.keyboard?1:near);
 // Critically damped motion keeps velocity continuous when hover changes.
 const omega=target>gather?1.8:1.3,error=gather-target,c=gatherVelocity+omega*error,decay=Math.exp(-omega*dt);
 gather=target+(error+c*dt)*decay;gatherVelocity=(gatherVelocity-omega*c*dt)*decay;
 turn+=(turnTarget-turn)*(1-Math.exp(-dt*3));if(!pointer.down)turnTarget*=Math.exp(-dt*.5);
 const m=gather*gather*(3-2*gather);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.pixelRatio,Math.min(devicePixelRatio||1,2));gl.uniform1f(uniforms.t,time);gl.uniform1f(uniforms.mixAmount,m);gl.uniform1f(uniforms.scale,r);gl.uniform1f(uniforms.turn,turn);gl.uniform2f(uniforms.viewport,w,h);gl.uniform1f(uniforms.reveal,reduced.matches?1:Math.max(0,Math.min(1,(time-.65)/2)));
 gl.disable(gl.DEPTH_TEST);
 if(m>.94){
  // Real indexed terrain mesh writes depth, so near ridges occlude distant valleys.
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(false,false,false,false);gl.uniform1f(uniforms.mode,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer);gl.drawElements(gl.TRIANGLES,triangles.length,gl.UNSIGNED_SHORT,0);gl.colorMask(true,true,true,true);gl.depthMask(false);gl.drawElements(gl.TRIANGLES,triangles.length,gl.UNSIGNED_SHORT,0);
  gl.uniform1f(uniforms.mode,1);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lineBuffer);gl.drawElements(gl.LINES,lines.length,gl.UNSIGNED_SHORT,0);
 }
 gl.uniform1f(uniforms.mode,2);gl.drawArrays(gl.POINTS,0,vertices.length/2);gl.depthMask(true);
}
function tick(now){frame=0;if(paused||document.hidden)return;const dt=Math.min((now-last)/1000,.04);last=now;time+=dt;render(dt);frame=requestAnimationFrame(tick);}
function start(){if(!frame&&!paused&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
function release(){pointer.down=false;pointer.active=false;canvas.classList.remove('dragging');}
function ui(){motion.setAttribute('aria-label',paused?'Resume motion':'Pause motion');motion.setAttribute('aria-pressed',String(paused));motion.querySelector('path').setAttribute('d',paused?'M7 5l7 5-7 5Z':'M7 5v10M13 5v10');}
canvas.addEventListener('pointermove',e=>{if(paused)return;if(pointer.down)turnTarget=Math.max(-.65,Math.min(.65,turnTarget+(e.clientX-pointer.previousX)*.004));pointer.previousX=e.clientX;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;},{passive:true});
canvas.addEventListener('pointerdown',e=>{if(paused)return;clearTimeout(touchTimer);pointer.down=true;pointer.active=true;pointer.x=pointer.previousX=e.clientX;pointer.y=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');},{passive:true});
canvas.addEventListener('pointerup',e=>{pointer.down=false;canvas.classList.remove('dragging');if(e.pointerType==='touch')touchTimer=setTimeout(release,1800);});
canvas.addEventListener('pointercancel',release);canvas.addEventListener('pointerleave',()=>{if(!pointer.down)release();});window.addEventListener('blur',()=>{release();pointer.keyboard=false;});
canvas.addEventListener('focus',()=>{pointer.keyboard=canvas.matches(':focus-visible');});canvas.addEventListener('blur',()=>{pointer.keyboard=false;});
canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turnTarget=Math.max(-.65,Math.min(.65,turnTarget+(e.key==='ArrowLeft'?-.12:.12)));}});
motion.addEventListener('click',()=>{paused=!paused;release();cancelAnimationFrame(frame);frame=0;ui();start();});
reduced.addEventListener('change',()=>{paused=reduced.matches;release();cancelAnimationFrame(frame);frame=0;if(paused){gather=.7;render(0);}ui();start();});
document.addEventListener('visibilitychange',()=>{release();cancelAnimationFrame(frame);frame=0;start();});window.addEventListener('resize',resize,{passive:true});
if(reduced.matches)gather=.7;
resize();ui();document.fonts.ready.then(()=>{introLayout();document.body.classList.add('intro-ready');start();});

function introLayout(){
 if(reduced.matches)return;
 const left=document.querySelector('.title-left'),right=document.querySelector('.title-right');
 const ar=document.createRange(),br=document.createRange();ar.selectNodeContents(left);br.selectNodeContents(right);
 const a=ar.getBoundingClientRect(),b=br.getBoundingClientRect(),gap=parseFloat(getComputedStyle(left).fontSize)*.28;
 const begin=(innerWidth-a.width-b.width-gap)/2;
 for(const [el,rect,x] of [[left,a,begin],[right,b,begin+a.width+gap]]){el.style.setProperty('--intro-x',`${x-rect.left}px`);el.style.setProperty('--intro-y',`${innerHeight/2-rect.top-rect.height/2}px`);}
 document.body.classList.add('entering');setTimeout(()=>document.body.classList.remove('entering'),3500);
}
