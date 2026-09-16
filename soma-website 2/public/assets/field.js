const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d'),motion=document.querySelector('#motion'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let w=0,h=0,r=0,time=0,last=0,frame=0,paused=reduced.matches,rotation=0,spin=0,disturbance=0;
let entranceStart=Infinity;
const pointer={x:-9999,y:-9999,active:false,down:false,previousX:0};
const particles=Array.from({length:7800},(_,i)=>{const y=1-2*(i+.5)/7800,a=i*2.399963229728653+Math.sin(i*43.7)*.013,s=Math.sqrt(1-y*y);return{x:Math.cos(a)*s,y,z:Math.sin(a)*s,seed:(Math.sin(i*127.1)*43758.5453)%1,offset:0,velocity:0};});
function resize(){w=innerWidth;h=innerHeight;r=.72*(w<700?Math.min(w*.32,h*.23):Math.min(w*.175,h*.31));const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);render(0);}
function render(dt){
 ctx.clearRect(0,0,w,h);
 const cx=w/2,cy=h/2,near=pointer.active?Math.max(0,1-Math.hypot(pointer.x-cx,pointer.y-cy)/(r*1.55)):0;
 disturbance+=((pointer.down?1:near*.8)-disturbance)*(1-Math.exp(-dt*3));
 spin*=Math.exp(-dt*3);rotation+=dt*(.09+spin);const ca=Math.cos(rotation),sa=Math.sin(rotation);
 const progress=reduced.matches?1:Math.max(0,Math.min(1,((performance.now()-entranceStart)/1000-1.15)/2.1));
 const reveal=progress*progress*(3-2*progress);
 const projected=[];
 for(const p of particles){
 // Distort in object space, then rotate and project the deformed surface.
 const ox=p.x,oy=p.y,oz=p.z;
 const baseX=ox*ca+oz*sa,baseZ=oz*ca-ox*sa;
 const bx=cx+baseX*r,by=cy+oy*r;
 const distance=Math.hypot(bx-pointer.x,by-pointer.y);
 const local=pointer.active?Math.exp(-distance*distance/(r*r*.28))*Math.max(0,baseZ):0;
 const wave=Math.sin(ox*8+oy*6+time*1.3)*Math.cos(oz*7-oy*4-time*.7);
 const idleWave=.012*Math.sin(ox*4+oy*3+time*.45)*Math.cos(oz*4-oy*2-time*.3);
 const target=idleWave+disturbance*(wave*.225+Math.sin(oy*12+oz*8+time)*.0525)+local*.18;
 p.velocity+=((target-p.offset)*24-p.velocity*6)*dt;p.offset+=p.velocity*dt;
 const shell=1+p.offset+p.seed*.012;
 const shear=disturbance*.1125;
 const sx=ox*shell+shear*Math.sin(oy*7+oz*5+time*.8);
 const sy=oy*shell+shear*Math.sin(oz*8+ox*4-time*.65);
 const sz=oz*shell+shear*Math.cos(ox*7-oy*5+time*.7);
 const rx=sx*ca+sz*sa,rz=sz*ca-sx*sa;
 const tilt=.15,yy=sy*Math.cos(tilt)-rz*Math.sin(tilt),zz=sy*Math.sin(tilt)+rz*Math.cos(tilt);
 const perspective=4.8/(4.8-zz);
 const edge=Math.pow(1-Math.min(1,Math.abs(baseZ)),3),poles=Math.pow(Math.abs(oy),5);
 const front=Math.max(0,zz),back=zz<0?.28:1;
 const surfaceLight=.28+.35*Math.max(0,-oy*.55+front*.8);
 const idle=.065+edge*.48+poles*.72;
 const active=surfaceLight+edge*.22+Math.abs(p.offset)*1.1;
 const alpha=Math.min(.94,(idle*(1-disturbance)+active*disturbance)*back);
 projected.push({x:cx+rx*r*perspective*(.82+.18*reveal),y:cy+yy*r*perspective*(.82+.18*reveal),z:zz,alpha:alpha*reveal,size:(.65+(p.seed+1)*.3)*perspective*(.8+front*.3)*(w<700?.85:1)});
 }
 projected.sort((a,b)=>a.z-b.z);
 for(const p of projected){ctx.fillStyle=`rgba(255,255,255,${p.alpha})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}

}
function tick(now){frame=0;if(paused||document.hidden)return;const dt=Math.min((now-last)/1000,.032);last=now;time+=dt;render(dt);frame=requestAnimationFrame(tick);}
function start(){if(!frame&&!paused&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
function release(){pointer.down=false;pointer.active=false;canvas.classList.remove('dragging');}
function ui(){motion.setAttribute('aria-label',paused?'Resume motion':'Pause motion');motion.setAttribute('aria-pressed',String(paused));motion.querySelector('path').setAttribute('d',paused?'M7 5l7 5-7 5Z':'M7 5v10M13 5v10');}
canvas.addEventListener('pointermove',e=>{if(pointer.down){spin=Math.max(-2,Math.min(2,(e.clientX-pointer.previousX)*.12));rotation+=(e.clientX-pointer.previousX)*.003;}pointer.previousX=e.clientX;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;},{passive:true});
canvas.addEventListener('pointerdown',e=>{if(paused)return;pointer.down=true;pointer.active=true;pointer.x=pointer.previousX=e.clientX;pointer.y=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');},{passive:true});
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{if(!pointer.down)release();});window.addEventListener('blur',release);
motion.addEventListener('click',()=>{paused=!paused;release();cancelAnimationFrame(frame);frame=0;ui();start();});reduced.addEventListener('change',()=>{paused=reduced.matches;release();cancelAnimationFrame(frame);frame=0;ui();start();});document.addEventListener('visibilitychange',()=>{release();cancelAnimationFrame(frame);frame=0;start();});window.addEventListener('resize',resize,{passive:true});resize();ui();
document.fonts.ready.then(()=>{entranceStart=performance.now();introLayout();document.body.classList.add('intro-ready');start();});

function introLayout(){
 const left=document.querySelector('.title-left'),right=document.querySelector('.title-right');
 if(reduced.matches)return;
 const a=left.getBoundingClientRect(),b=right.getBoundingClientRect();
 const ar=document.createRange(),br=document.createRange();ar.selectNodeContents(left);br.selectNodeContents(right);
 const aw=ar.getBoundingClientRect().width,bw=br.getBoundingClientRect().width,gap=parseFloat(getComputedStyle(left).fontSize)*.28;
 const begin=(innerWidth-aw-bw-gap)/2;
 left.style.setProperty('--intro-x',`${begin-ar.getBoundingClientRect().left}px`);
 right.style.setProperty('--intro-x',`${begin+aw+gap-br.getBoundingClientRect().left}px`);
 left.style.setProperty('--intro-y',`${innerHeight/2-ar.getBoundingClientRect().top-ar.getBoundingClientRect().height/2}px`);
 right.style.setProperty('--intro-y',`${innerHeight/2-br.getBoundingClientRect().top-br.getBoundingClientRect().height/2}px`);
 document.body.classList.add('entering');
 setTimeout(()=>document.body.classList.remove('entering'),3500);
}
