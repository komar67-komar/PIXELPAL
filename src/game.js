import {PETS} from './data.js';

const clamp=n=>Math.max(0,Math.min(100,n));

export function advance(s,now=Date.now()){
  const last=Number.isFinite(s.lastTick)?s.lastTick:now;
  const elapsed=Math.max(0,Math.min(now-last,6*60*60*1000));
  if(elapsed){
    const start=now-elapsed,hours=elapsed/3600000;
    const sleepHours=s.sleepUntil>start?Math.max(0,Math.min(now,s.sleepUntil)-start)/3600000:0;
    const awakeHours=Math.max(0,hours-sleepHours);
    const weightedHours=awakeHours+sleepHours*.22;
    s.needs.hunger=clamp(s.needs.hunger-weightedHours*5.2);
    s.needs.happiness=clamp(s.needs.happiness-weightedHours*2.6);
    s.needs.cleanliness=clamp(s.needs.cleanliness-weightedHours*3.4);
    s.needs.energy=clamp(s.needs.energy-awakeHours*3.8+sleepHours*17);
    if(s.needs.hunger<12||s.needs.cleanliness<8)s.needs.health=clamp(s.needs.health-weightedHours*5);
    else if(s.needs.hunger>38&&s.needs.cleanliness>30)s.needs.health=clamp(s.needs.health+weightedHours*1.4);
  }
  const date=new Date(now),key=`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if(s.lastDayKey&&s.lastDayKey!==key)s.day++;
  s.lastDayKey=key;s.lastTick=now;
  return s;
}

export function perform(s,action,now=Date.now()){
  const n=s.needs,sleeping=now<s.sleepUntil;
  if(action==='wake'){
    if(!sleeping)return 'Питомец уже проснулся';
    s.sleepUntil=0;n.energy=clamp(n.energy+25);
  }else{
    if(sleeping)return 'Питомец спит. Сначала разбуди его';
    if(action==='feed'){
      if(s.coins<1)return 'Не хватает монет на вкусняшку';
      s.coins--;n.hunger=clamp(n.hunger+22);n.happiness=clamp(n.happiness+3);s.stats.fed++;
    }else if(action==='play'){
      if(n.energy<12)return 'Питомец слишком устал';
      n.happiness=clamp(n.happiness+19);n.energy=clamp(n.energy-9);s.stats.played++;
    }else if(action==='bath'){
      n.cleanliness=clamp(n.cleanliness+38);n.happiness=clamp(n.happiness-2);s.stats.washed++;
    }else if(action==='walk'){
      if(n.energy<18)return 'Сначала нужно отдохнуть';
      n.happiness=clamp(n.happiness+13);n.energy=clamp(n.energy-13);n.cleanliness=clamp(n.cleanliness-5);s.coins+=3;s.stats.walked++;
    }else if(action==='sleep'){
      s.sleepUntil=now+8*60*60*1000;
    }else return 'Неизвестное действие';
  }
  s.xp+=action==='walk'?8:5;
  while(s.xp>=s.level*100){s.xp-=s.level*100;s.level++;s.coins+=10;}
  return '';
}

export function choosePet(s,type,name){s.pet={type,name:String(name||'Пиксель').trim().slice(0,18)||'Пиксель'};return s}
export function getMood(s){if(s.needs.health<35)return 'Нужно лечение';if(s.needs.hunger<25)return 'Пора подкрепиться';if(s.needs.energy<20)return 'Очень хочется спать';if(s.needs.cleanliness<25)return 'Пора искупаться';if(s.needs.happiness<30)return 'Немного грустно';return 'Рад тебя видеть ♡'}
export function evolution(s){return s.level>=10?'Маленькая легенда':s.level>=5?'Подросший друг':s.level>=2?'Любознательный малыш':'Малыш'}
export function petStyle(type){return PETS[type]||PETS.kitten}

