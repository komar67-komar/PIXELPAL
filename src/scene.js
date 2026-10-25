import {petStyle} from './game.js';

const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};

export function createScene(canvas,getState,onTap){
  const ctx=canvas.getContext('2d');
  let tick=0,petX=.5,direction=1,frame=0,action=null,destroyed=false,actionResolve=null;
  const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Every interaction uses the same 10-second timeline for a consistent pace.
  const durations={feed:10000,play:10000,bath:10000,walk:10000,sleep:10000,wake:10000,tap:10000};

  function rect(color,x,y,w,h){if(w<=0||h<=0)return;ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
  function heart(x,y,c='#ef91ac',z=1){rect(c,x,y+z,z*2,z);rect(c,x+z*3,y+z,z*2,z);rect(c,x-z,y+z*2,z*7,z);rect(c,x,y+z*3,z*5,z);rect(c,x+z,y+z*4,z*3,z);rect(c,x+z*2,y+z*5,z,z)}
  function sparkle(x,y,c='#fff0a3',z=2){rect(c,x-z,y,z*3,z);rect(c,x,y-z,z,z*3)}
  function room(s,w,h,night){
    const sky=s.room==='night'?'#394365':s.room==='garden'?'#a8d9c1':night?'#596486':'#b9deee';
    const wall=s.room==='garden'?'#9bceb2':night?'#727b9e':'#f3d4bd';
    const floor=s.room==='garden'?'#91b886':night?'#866c83':'#d9a47d';
    rect(sky,0,0,w,h);rect(wall,0,h*.55,w,h*.27);rect(floor,0,h*.82,w,h*.18);
    for(let i=0;i<w;i+=18)rect('rgba(90,50,48,.1)',i,h*.81,1,h*.19);
    rect('#695779',w*.09,h*.14,w*.25,h*.34);rect(night?'#6677a7':'#8dd1ea',w*.105,h*.16,w*.22,h*.30);
    if(night){rect('#fff0a4',w*.19,h*.23,3,3);sparkle(w*.28,h*.31,'#e4e9ff',1)}else{rect('#f9e7aa',w*.265,h*.2,5,5);rect('#fff',w*.145,h*.21,3,2)}
    rect('#f4cfaa',w*.205,h*.16,3,h*.3);rect('#f4cfaa',w*.105,h*.29,w*.22,3);
    rect('#9e644f',w*.66,h*.31,w*.2,5);rect('#b87b59',w*.68,h*.29,w*.03,h*.02);rect('#d8a56f',w*.74,h*.25,w*.05,h*.06);
    rect('#80aa71',w*.87,h*.51,9,h*.29);rect('#b87360',w*.845,h*.70,w*.07,h*.12);rect('#75a77b',w*.88,h*.55,18,5);rect('#75a77b',w*.85,h*.59,16,4);
  }
  function bed(w,h){rect('#a66c67',w*.08,h*.71,w*.24,h*.08);rect('#e9b0b1',w*.09,h*.65,w*.23,h*.09);rect('#fff0d0',w*.12,h*.66,w*.07,h*.055);rect('#84515c',w*.08,h*.77,w*.025,h*.08);rect('#84515c',w*.29,h*.77,w*.025,h*.08)}
  function bowl(w,h,food=0){rect('#70aaa8',w*.68,h*.78,w*.13,h*.035);rect('#8ac7bd',w*.70,h*.76,w*.09,h*.025);rect('#d98969',w*.69,h*.79,w*.11,3);for(let i=0;i<food;i++)rect(i%2?'#e9bd69':'#e5a660',w*(.715+i*.022),h*.74-(i%2)*3,5,4)}
  function outside(w,h,now){
    rect('#8fd1e7',0,0,w,h);rect('#c9e8eb',0,h*.60,w,h*.13);rect('#9bcf8c',0,h*.70,w,h*.30);
    rect('#7dbb7c',0,h*.78,w,h*.22);
    const drift=(now*.014)% (w+80);
    for(let i=0;i<3;i++){const cx=(i*w*.45-drift+w+100)%(w+100)-40,cy=h*(.17+(i%2)*.13);rect('#f5fff0',cx,cy,31,7);rect('#f5fff0',cx+7,cy-5,22,7);rect('#f5fff0',cx+22,cy+5,19,5)}
    const grassDrift=(now*.045)%26;for(let i=-1;i<w/26+2;i++){const gx=i*26-grassDrift;rect('#6aa66c',gx,h*.77,3,5);rect('#6aa66c',gx+8,h*.73,2,8)}
    rect('#edda9c',w*.82,h*.56,w*.08,h*.18);rect('#e7d18d',w*.84,h*.52,w*.04,h*.04);
  }
  function drawPet(x,footY,scale,style,{bob=0,tilt=0,step=0,face=1,sleeping=false,blink=false,stretch=0,clean=false}={}){
    ctx.save();ctx.translate(x,footY);ctx.scale(scale*(face<0?-1:1),scale);
    rect('rgba(40,42,60,.18)',-21,8,44,7);
    if(sleeping){
      const breath=Math.round(Math.sin(tick*.08)*1.5);
      rect(style.color,-25,-22-breath,39,16);rect(style.color,8,-28-breath,21,19);rect(style.color,23,-38-breath,8,14);rect(style.color,8,-39-breath,8,13);
      rect(style.accent,18,-20,5,2);rect('#de8390',13,-13,4,2);rect(style.color,-20,-8,10,5);rect(style.color,-3,-8,10,5);
      rect('#e9b0b1',-28,-24,45,8);rect('#f4c3c2',-26,-26,40,3);
      if(clean)sparkle(16,-44,'#fff2a6',1);
      ctx.restore();return;
    }
    const bodyBob=bob+stretch;
    rect(style.color,-19,-29-bodyBob,38,31);rect(style.color,-15,-43-bodyBob,30,22);
    if(style===petStyle('rabbit')){rect(style.color,-13,-62-bodyBob,7,22);rect(style.color,5,-63-bodyBob,7,23)}
    else{rect(style.color,-17,-53-bodyBob,11,15);rect(style.color,6,-53-bodyBob,11,15);rect(style.accent,-14,-50-bodyBob,5,7);rect(style.accent,9,-50-bodyBob,5,7)}
    const headY=-40-bodyBob;
    ctx.save();ctx.translate(0,headY);ctx.rotate(tilt);rect(style.color,-15,-3,30,20);rect(style.accent,-10,4,6,4);rect(style.accent,5,4,6,4);
    if(blink){rect('#473e54',-9,6,4,2);rect('#473e54',6,6,4,2)}else{rect('#473e54',-8,5,2,3);rect('#473e54',7,5,2,3)}
    rect('#de8390',-1,12,4,3);ctx.restore();
    if(style===petStyle('fox'))rect(style.accent,-12,-52-bodyBob,24,8);
    if(style===petStyle('fantasy')){rect('#fff3a4',-2,-63-bodyBob,4,4);sparkle(-22,-34,'#fff3a4',1);sparkle(22,-45,'#fff3a4',1)}
    const paw=Math.round(Math.sin(step)*4);rect(style.color,-13+paw,-3,8,7);rect(style.color,7-paw,-3,8,7);rect('#ca7867',-27,-22-bodyBob,10,7);
    if(clean){rect('#fff4c5',-4,-59,8,3);sparkle(18,-52,'#fff3a4',1)}
    ctx.restore();
  }
  function drawTub(w,h,progress){
    rect('#76bdb9',w*.34,h*.70,w*.33,h*.13);rect('#559c9d',w*.34,h*.70,w*.33,5);rect('#9bded4',w*.36,h*.72,w*.29,h*.085);
    for(let i=0;i<5;i++){const bx=w*(.39+i*.05),by=h*(.72+Math.sin(tick*.12+i)*.008);rect('#eafff7',bx,by,8,4);if(i<3&&progress>.25)sparkle(bx+4,by-5,'#fff',1)}
  }
  function drawAnimation(s,w,h,now,baseNight){
    const a=action,style=petStyle(s.pet?.type||'kitten'),scale=Math.min(w/500,h/300),time=now-(a?.started||now),p=a?clamp(time/a.duration):0;
    const sleeping=Date.now()<s.sleepUntil;
    let x=.5,y=.75,bob=0,tilt=0,step=tick*5,face=direction,sleepPose=sleeping,blink=false,stretch=0,food=0;
    if(!a&&!sleeping){petX=.5+Math.sin(tick*.35)*.035;x=petX;bob=Math.abs(Math.sin(tick*2))*1.5;step=tick*3;face=Math.cos(tick*.35)<0?-1:1}
    if(sleeping){x=.21;sleepPose=true;bob=Math.sin(tick*.08)*.6}
    if(a?.name==='feed'){x=.50+.16*ease(p/.34);face=1;const chew=p>.25&&p<.82;tilt=chew?Math.sin(p*40)*.10:0;food=Math.max(0,3-Math.floor(clamp((p-.25)/.60)*3));bob=chew?Math.abs(Math.sin(p*32))*1.4:0}
    if(a?.name==='play'){const chase=.16*Math.sin(p*Math.PI*5);x=.5+chase;if(p>.78)x=.5+chase*(1-ease((p-.78)/.22));face=Math.cos(p*Math.PI*5)>=0?1:-1;bob=Math.abs(Math.sin(p*Math.PI*10))*6;step=p*55}
    if(a?.name==='bath'){x=.50;bob=Math.sin(p*20)*1.2;tilt=Math.sin(p*13)*.045;}
    if(a?.name==='sleep'){x=.5-.29*ease(p/.62);sleepPose=p>.68;bob=sleepPose?Math.sin(tick*.08)*.6:0;}
    if(a?.name==='wake'){x=.21+.29*ease(p/.75);sleepPose=p<.35;stretch=p>.35&&p<.73?Math.sin((p-.35)/.38*Math.PI)*5:0;bob=stretch;blink=p<.5;}
    if(a?.name==='tap'){bob=Math.sin(p*Math.PI)*4;}
    if(a?.name==='walk'){
      if(p>.18&&p<.81){outside(w,h,now);const q=(p-.18)/.63;x=.16+.68*q;face=1;bob=Math.abs(Math.sin(p*45))*3;step=p*70;drawPet(x*w,h*.76,scale,style,{bob,step,face,clean:false});if(Math.floor(now/120)%5===0)sparkle(x*w-20,h*.72,'#fff5b0',1);return}
      const q=p<.18?ease(p/.18):ease((p-.81)/.19);x=p<.18?.5+.48*q:.05+.45*q;face=1;bob=Math.abs(Math.sin(p*45))*3;step=p*70;
    }
    const night=baseNight;
    room(s,w,h,night);bed(w,h);bowl(w,h,a?.name==='feed'?food:0);
    if(a?.name==='play'){
      let ballX=.5+.20*Math.sin(p*Math.PI*5+Math.PI),ballY=.77-Math.abs(Math.sin(p*Math.PI*10))*.11;
      if(p>.78){const e=ease((p-.78)/.22);ballX=ballX*(1-e)+.57*e;ballY=ballY*(1-e)+.77*e}
      rect('#e88872',ballX*w-7,ballY*h-7,14,14);rect('#fff0cf',ballX*w-2,ballY*h-7,4,14);rect('#fff0cf',ballX*w-7,ballY*h-2,14,4);
      if(p>.08&&p<.9){sparkle(ballX*w,ballY*h-13,'#fff2a3',2)}
    }
    if(a?.name==='bath')drawTub(w,h,p);
    if(a?.name==='bath'&&p>.08){
      for(let i=0;i<7;i++){const phase=(p*1.5+i*.16)%1, bx=w*(.42+(i%4)*.045)+Math.sin(tick*.1+i)*3, by=h*(.66-phase*.42);const size=2+(i%3);rect(i%2?'#fff9e9':'#d9fff9',bx,by,size*2,size*2);rect('#fff',bx+1,by+1,2,2)}
      for(let i=0;i<5;i++){const q=(p*2+i*.21)%1,dx=w*(.39+(i%4)*.055)+Math.sin(tick+i)*6,dy=h*(.67-q*.18);rect('#a9edf0',dx,dy,3,6);rect('#f4ffff',dx,dy,2,2)}
    }
    if(a?.name==='sleep'||a?.name==='wake'){const fade=a.name==='sleep'?p:1-p;rect(`rgba(31,38,69,${Math.max(0,fade*.32)})`,0,0,w,h)}
    else if(sleeping)rect('rgba(31,38,69,.32)',0,0,w,h);
    drawPet(x*w,y*h,scale,style,{bob,tilt,step,face,sleeping:sleepPose,blink,stretch,clean:a?.name==='bath'&&p>.88});
    if(a?.name==='feed'&&p>.52&&p<.96){const q=1-(p-.52)/.44;ctx.fillStyle='#fff8de';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('+сытость',x*w,(y-.20-q*.035)*h);heart(x*w+27,(y-.22-q*.04)*h,'#ed91a8',2)}
    if((a?.name==='play'||a?.name==='walk')&&p>.76){const q=clamp((p-.76)/.24);heart(x*w-12,(y-.24-q*.06)*h,'#ef91ac',2);heart(x*w+17,(y-.2-q*.08)*h,'#ef91ac',2)}
    if(a?.name==='bath'&&p>.78)sparkle(x*w+22,(y-.22)*h,'#fff1ad',2);
    if((sleeping||a?.name==='sleep'&&p>.65)&&p<.99){const lift=(tick*2)%25;ctx.fillStyle='#f6efff';ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillText('Z',x*w+32,(y-.22)*h-lift);ctx.font='900 9px system-ui';ctx.fillText('z',x*w+41,(y-.27)*h-lift-3)}
    if(s.furniture?.includes('bed'))rect('#a5d5e5',w*.38,h*.8,w*.13,4);
    if(night&&!sleeping&&!a)rect('rgba(42,48,78,.08)',0,0,w,h);
  }
  function finishAction(){if(!action)return;action=null;const resolve=actionResolve;actionResolve=null;resolve?.();}
  function render(now=performance.now()){
    if(destroyed)return;
    if(document.hidden){frame=0;return}
    const s=getState(),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(w<1||h<1){frame=requestAnimationFrame(render);return}
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;tick+=.035;
    const hr=new Date().getHours(),night=s.room==='night'||hr>=20||hr<6;
    drawAnimation(s,w,h,now,night);
    if(action&&now-action.started>=action.duration)finishAction();
    frame=requestAnimationFrame(render);
  }
  function onPointerDown(event){if(action||Date.now()<getState().sleepUntil)return;onTap?.(event)}
  canvas.addEventListener('pointerdown',onPointerDown);
  frame=requestAnimationFrame(render);
  return{
    play(name){if(action||destroyed)return Promise.resolve(false);const duration=durations[name];if(!duration)return Promise.resolve(false);action={name,started:performance.now(),duration};return new Promise(resolve=>{actionResolve=resolve})},
    isBusy(){return Boolean(action)},
    finishAction,
    destroy(){if(destroyed)return;destroyed=true;if(frame)cancelAnimationFrame(frame);finishAction();canvas.removeEventListener('pointerdown',onPointerDown)},
    resume(){if(!destroyed&&!frame)frame=requestAnimationFrame(render)}
  };
}

