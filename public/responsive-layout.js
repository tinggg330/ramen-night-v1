(function () {
  // Small, feature-tested fallbacks for APIs used by toppings and React 19.
  if (!Array.prototype.flatMap) Object.defineProperty(Array.prototype, 'flatMap', {configurable:true,writable:true,value:function(fn,scope){return this.reduce(function(out,item,index){return out.concat(fn.call(scope,item,index,this));}.bind(this),[]);}});
  if (!Promise.prototype.finally) Object.defineProperty(Promise.prototype,'finally',{configurable:true,writable:true,value:function(fn){return this.then(function(value){return Promise.resolve(typeof fn === 'function' ? fn() : fn).then(function(){return value;});},function(error){return Promise.resolve(typeof fn === 'function' ? fn() : fn).then(function(){throw error;});});}});
  if (!Promise.allSettled) Promise.allSettled=function(items){return Promise.all(Array.from(items).map(function(item){return Promise.resolve(item).then(function(value){return {status:'fulfilled',value:value};},function(reason){return {status:'rejected',reason:reason};});}));};
  var root = document.documentElement;
  var supports = function (p,v) { return !!(window.CSS && CSS.supports && CSS.supports(p,v)); };
  if (!supports('aspect-ratio','1 / 1')) root.classList.add('xhs-no-ratio');
  var containerUnits = supports('width','1cqw');
  if (!containerUnits) root.classList.add('xhs-no-container-units');
  var flex=document.createElement('div');
  flex.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';
  flex.appendChild(document.createElement('div')); flex.appendChild(document.createElement('div'));
  document.body.appendChild(flex);
  if (flex.scrollHeight !== 1) root.classList.add('xhs-no-flex-gap');
  document.body.removeChild(flex);
  var frame=0;
  function layout() {
    frame=0;
    var viewportHeight=window.visualViewport ? window.visualViewport.height : window.innerHeight;
    // Short landscape windows scroll the portrait composition instead of crushing controls.
    var appHeight=Math.max(window.innerWidth>viewportHeight ? 640 : 560,viewportHeight)+'px';
    if(root.style.getPropertyValue('--app-height')!==appHeight) root.style.setProperty('--app-height',appHeight);
    var shell=document.querySelector('.phone-shell');
    if (!shell) return;
    shell.classList.toggle('compact-layout',shell.clientHeight < 740);
    var shellRect=shell.getBoundingClientRect();
    var copy=shell.querySelector('.home-copy'), footer=shell.querySelector('.home-footer');
    if(copy && footer) {
      var copyBottom=copy.getBoundingClientRect().bottom-shellRect.top;
      var footerTop=footer.getBoundingClientRect().top-shellRect.top;
      // The open lid needs another 19% above the cup; measure real text, not a device name.
      var cupSize=Math.min(shell.clientWidth*.67,Math.max(90,(footerTop-copyBottom-30)/(1235/1274*1.19)));
      var cupHeight=cupSize*1235/1274;
      var cupTop=footerTop-16-cupHeight;
      shell.style.setProperty('--home-cup-size',cupSize+'px');
      shell.style.setProperty('--home-cup-height',cupHeight+'px');
      shell.style.setProperty('--home-food-top',cupTop+'px');
      var note=shell.querySelector('.home-note');
      if(note) shell.style.setProperty('--home-note-top',(footerTop-note.offsetHeight-24)+'px');
    }
    var panel=shell.querySelector('.action-screen:not(.finish-screen)');
    if(panel) {
      var panelRect=panel.getBoundingClientRect(), subcopy=panel.querySelector('.subcopy');
      var headingBottom=subcopy.getBoundingClientRect().bottom-panelRect.top;
      var bottomPadding=parseFloat(getComputedStyle(panel).paddingBottom)||24;
      // Reserve one shared heading envelope even when a particular step has shorter copy.
      var headerSpace=Math.max(headingBottom,shell.classList.contains('compact-layout') ? 105 : 120);
      var widthLimit=Math.min((panel.clientWidth-44)*.92,365);
      var size=Math.min(widthLimit,Math.max(100,(panel.clientHeight-headerSpace-bottomPadding-106-16)/1.26));
      var cupTop=headerSpace+size*.30+16;
      panel.style.setProperty('--game-cup-size',size+'px');
      panel.style.setProperty('--game-cup-height',(size*.96)+'px');
      panel.style.setProperty('--game-cup-top',cupTop+'px');
    }
    // This matches the original artwork cover geometry without container query units.
    if (!containerUnits) {
      shell.style.setProperty('--sleep-scene-width',Math.max(shell.clientWidth,shell.clientHeight*877/1792)+'px');
      shell.style.setProperty('--zzz-size',Math.max(24,Math.min(32,shell.clientWidth*.07))+'px');
    }
  }
  function schedule(){ if(!frame)frame=requestAnimationFrame(layout); }
  window.addEventListener('resize',schedule);
  if(window.visualViewport) window.visualViewport.addEventListener('resize',schedule);
  document.addEventListener('load',schedule,true);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  new MutationObserver(schedule).observe(document.getElementById('root'),{childList:true,subtree:true});
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['style']});
  schedule();
  // Pause every sound when the WebView is backgrounded, resume only the active ones.
  var active=[];
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ active=Array.prototype.filter.call(document.querySelectorAll('audio'),function(a){return !a.paused;}); active.forEach(function(a){a.pause();}); }
    else { active.forEach(function(a){if(document.contains(a)){var p=a.play();if(p&&p.catch)p.catch(function(){});}}); active=[]; }
  });
}());
