/* Original paper toy, copyright ypaaaaaaaaaaaaa. MIT. No dependencies. */
(() => {
'use strict';
const canvas=document.getElementById('ticket'), ctx=canvas.getContext('2d');
const W=480,H=800,CUT=624, columns=8;
const front=document.createElement('canvas'),back=document.createElement('canvas');
front.width=back.width=W; front.height=back.height=H;
let width=390,height=844,scale=1,angle=-.12,spin=0,targetSpin=0,bend=0,velocity=0,pull=0,torn=false,tearTime=0,drag=null,ready=false,audio;
const status=document.getElementById('status');
function label(g,s,x,y,size=16,color='#20363b',weight='normal'){g.fillStyle=color;g.font=`${weight} ${size}px Arial`;g.fillText(s,x,y);}
function texture(surface,reverse){
 const g=surface.getContext('2d');g.fillStyle='#f1e9d3';g.fillRect(0,0,W,H);
 // Deterministic fibers, drawn from arithmetic rather than an imported texture.
 for(let i=0;i<2800;i++){const x=(i*139.79)%W,y=(i*71.37)%H;g.fillStyle=i%2?'#7c80600b':'#ffffff25';g.fillRect(x,y,1,2);}
 g.strokeStyle='#20363b';g.lineWidth=2;g.strokeRect(20,20,W-40,CUT-40);
 label(g,'✦  LUNAR EXPRESS',42,62,21,undefined,'bold');label(g,'INTERPLANETARY RAIL SERVICE',42,85,10);
 g.fillStyle='#20363b';g.fillRect(42,107,396,2);
 if(!reverse){
 label(g,'EARTH',40,174,62,undefined,'bold');label(g,'TO THE',44,208,14);label(g,'MOON',40,274,76,undefined,'bold');
 label(g,'ONE WAY / ENDLESS POSSIBILITY',44,302,12);
 // A foil planet with individually colored concentric grooves.
 const grad=g.createLinearGradient(98,332,355,480);['#5f8175','#e7dda2','#8eb4cf','#d9a0b7','#f6dc96','#8aaba7'].forEach((c,i)=>grad.addColorStop(i/5,c));
 g.fillStyle=grad;g.beginPath();g.arc(240,418,98,0,Math.PI*2);g.fill();
 g.save();g.beginPath();g.arc(240,418,96,0,Math.PI*2);g.clip();
 for(let r=5;r<220;r+=7){g.strokeStyle=r%3?'#fff6d456':'#254c4f55';g.beginPath();g.ellipse(200,398,r,r*.8,-.5,0,7);g.stroke();}g.restore();
 g.strokeStyle='#20363b';g.lineWidth=2;g.beginPath();g.ellipse(240,418,151,36,-.35,0,7);g.stroke();
 label(g,'DEPARTURE',42,552,11);label(g,'PLATFORM',224,552,11);label(g,'SEAT',362,552,11);
 label(g,'00:01 AM',42,581,23,undefined,'bold');label(g,'09',224,581,23,undefined,'bold');label(g,'A01',362,581,23,undefined,'bold');
 }else{
 label(g,'THE NIGHT',42,181,48,undefined,'bold');label(g,'IS YOURS.',42,237,48,undefined,'bold');
 for(let i=0;i<56;i++){let x=50+(i*73)%380,y=280+(i*97)%210;g.beginPath();g.arc(x,y,i%4===0?3:1,0,7);g.fill();}
 g.strokeStyle='#6f8984';g.beginPath();g.moveTo(76,443);g.bezierCurveTo(360,460,90,280,389,310);g.stroke();
 label(g,'KEEP A PIECE OF THE JOURNEY.',42,543,17,undefined,'bold');label(g,'No return required. Wonder included.',42,579,15);
 }
 g.fillStyle='#f27157';g.fillRect(0,CUT,W,H-CUT);g.fillStyle='#20363b';
 label(g,'PULL TO TEAR  ↓',38,664,18,undefined,'bold');label(g,'LX — 0001',315,663,15);
 for(let i=0,x=40;i<110;i++){const bw=1+(i*7%4);g.fillRect(x,687,bw,54);x+=bw+1;if(x>440)break;}
 label(g,'PASSENGER COPY',40,768,12);label(g,'EARTH → MOON',310,768,12);
 g.setLineDash([5,7]);g.strokeStyle='#20363b';g.lineWidth=2;g.beginPath();g.moveTo(0,CUT);g.lineTo(W,CUT);g.stroke();g.setLineDash([]);
 // Ticket notches are transparent, including the perforation endpoints.
 g.globalCompositeOperation='destination-out';for(const x of [0,W]){g.beginPath();g.arc(x,CUT,14,0,7);g.fill();}g.globalCompositeOperation='source-over';
}
texture(front,false);texture(back,true);
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width/650,height/1100);}
addEventListener('resize',resize);resize();
function point(x,y,t,stub=false){
 const nx=(x-W/2),ny=y-H/2;
 let z=Math.sin(y/H*Math.PI)*bend*(.4+x/W)+Math.sin(y/H*5+t*.001)*5;
 let xx=nx*Math.cos(spin)+z*Math.sin(spin),zz=-nx*Math.sin(spin)+z*Math.cos(spin);
 let yy=ny + Math.sin(x/W*Math.PI)*bend*.13;
 if(stub){yy+=pull;xx+=torn?Math.sin(tearTime*.002)*20:pull*.12;zz+=pull*.3;}
 const perspective=1800/(1800+Math.abs(zz));
 const ca=Math.cos(angle),sa=Math.sin(angle);
 return {x:width/2+(xx*ca-yy*sa)*scale*perspective,y:height/2+(xx*sa+yy*ca)*scale*perspective};
}
function triangle(image,a,b,c,sa,sb,sc){
 const det=sa.x*(sb.y-sc.y)+sb.x*(sc.y-sa.y)+sc.x*(sa.y-sb.y);if(!det)return;
 const aa=(a.x*(sb.y-sc.y)+b.x*(sc.y-sa.y)+c.x*(sa.y-sb.y))/det;
 const bb=(a.y*(sb.y-sc.y)+b.y*(sc.y-sa.y)+c.y*(sa.y-sb.y))/det;
 const cc=(a.x*(sc.x-sb.x)+b.x*(sa.x-sc.x)+c.x*(sb.x-sa.x))/det;
 const dd=(a.y*(sc.x-sb.x)+b.y*(sa.x-sc.x)+c.y*(sb.x-sa.x))/det;
 const center={x:(a.x+b.x+c.x)/3,y:(a.y+b.y+c.y)/3};
 const expanded=[a,b,c].map(p=>{const dx=p.x-center.x,dy=p.y-center.y,len=Math.hypot(dx,dy)||1;return {x:p.x+dx/len*.75,y:p.y+dy/len*.75};});
 ctx.save();ctx.beginPath();ctx.moveTo(expanded[0].x,expanded[0].y);ctx.lineTo(expanded[1].x,expanded[1].y);ctx.lineTo(expanded[2].x,expanded[2].y);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,a.x-aa*sa.x-cc*sa.y,a.y-bb*sa.x-dd*sa.y);ctx.drawImage(image,0,0);ctx.restore();
}
function paper(t,start,end,stub){
 const image=Math.cos(spin)>=0?front:back;
 const n=Math.ceil((end-start)/40);
 for(let j=0;j<n;j++)for(let i=0;i<columns;i++){
 let x=i*W/columns,x2=(i+1)*W/columns,y=start+(end-start)*j/n,y2=start+(end-start)*(j+1)/n;
 const s=[{x,y},{x:x2,y},{x:x2,y:y2},{x,y:y2}],p=s.map(v=>point(v.x,v.y,t,stub));
 const uv=Math.cos(spin)>=0?s:s.map(v=>({x:W-v.x,y:v.y}));
 triangle(image,p[0],p[1],p[2],uv[0],uv[1],uv[2]);triangle(image,p[0],p[2],p[3],uv[0],uv[2],uv[3]);
 }
 // Subtle moving foil light follows the paper deformation.
 if(!stub&&Math.cos(spin)>.3){const p=point(240,418,t);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.scale(Math.cos(spin),1);const r=98*scale;const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#a7ffef00');g.addColorStop(.5+Math.sin(t*.0007+bend*.008)*.25,'#fff4cb66');g.addColorStop(1,'#fca2ff00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.restore();}
 if(torn){ctx.strokeStyle='#f5e9cf';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=80;i++){const p=point(i*6,stub?CUT+((i%2)*3):CUT-((i%2)*3),t,stub);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();}
}
let last=0;
function frame(t){const dt=Math.min((t-last)||16,32)/16.67;last=t;
 if(!drag){velocity+=(-bend*.07-velocity*.17)*dt;bend+=velocity*dt;}
 spin+=(targetSpin-spin)*.14*dt;
 if(torn){tearTime+=dt*16.67;pull+=(95-pull)*.08*dt;}else if(!drag)pull*=Math.pow(.8,dt);
 const bg=ctx.createRadialGradient(width*.5,height*.44,20,width*.5,height*.5,height*.7);bg.addColorStop(0,'#29464a');bg.addColorStop(1,'#0a171f');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#b4d8c00b';ctx.lineWidth=1;
 for(let i=-5;i<6;i++){ctx.beginPath();ctx.ellipse(width/2,height/2,Math.abs(i)*51+90,(Math.abs(i)*51+90)*1.6,-.2,0,7);ctx.stroke();}
 // Soft contact shadow is inexpensive and remains behind the paper.
 ctx.save();ctx.translate(width/2+12,height/2+28);ctx.rotate(angle);ctx.scale(1,1.5);const sh=ctx.createRadialGradient(0,0,20,0,0,220*scale);sh.addColorStop(0,'#00000077');sh.addColorStop(1,'#00000000');ctx.fillStyle=sh;ctx.fillRect(-250*scale,-250*scale,500*scale,500*scale);ctx.restore();
 paper(t,0,CUT,false);paper(t,CUT,H,true);
 if(!ready&&window.__gbSandbox){window.__gbSandbox.ready();ready=true;}
 requestAnimationFrame(frame);
}
function sound(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const n=Math.floor(audio.sampleRate*.3),buf=audio.createBuffer(1,n,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5)*(.35+.65*Math.abs(Math.sin(i*.003)));const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='highpass';filter.frequency.value=900;gain.gain.value=.25;src.buffer=buf;src.connect(filter).connect(gain).connect(audio.destination);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};}catch(_){} }
function tear(){if(torn)return;torn=true;tearTime=0;velocity=-12;sound();status.textContent='Stub detached. Your journey is yours to keep.';document.getElementById('tear').disabled=true;}
function flip(){targetSpin+=Math.PI;status.textContent='Ticket flipped.';}
function reset(){torn=false;pull=0;tearTime=0;bend=0;velocity=0;targetSpin=0;spin=0;status.textContent='Fresh ticket. Ready for departure.';document.getElementById('tear').disabled=false;}
canvas.addEventListener('pointerdown',e=>{if(drag)return;const p=point(240,CUT,performance.now());drag={id:e.pointerId,x:e.clientX,y:e.clientY,stub:e.clientY>p.y,dist:0};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.dist=Math.hypot(dx,dy);bend=Math.max(-110,Math.min(110,dx/scale*.7));if(drag.stub&&!torn){pull=Math.max(0,Math.min(85,dy/scale));if(pull>65)tear();}});
function release(e){if(!drag||e.pointerId!==drag.id)return;if(e.type==='pointerup'&&drag.dist<7)flip();drag=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
const panel=document.getElementById('panel'),toggle=document.getElementById('tools');toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
for(const el of [panel,toggle])for(const name of ['pointerdown','pointermove','pointerup','touchstart'])el.addEventListener(name,e=>e.stopPropagation());
document.getElementById('tear').onclick=tear;document.getElementById('flip').onclick=flip;document.getElementById('reset').onclick=reset;
requestAnimationFrame(frame);
})();
