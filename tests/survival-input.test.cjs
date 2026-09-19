const { test } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

// Exercise the real component handlers against a controlled frame clock. No browser
// automation latency is allowed to move the cursor between pointer down and release.
test('pointer down captures Perfect; late release never adds a second action', () => {
  const originalLoad = Module._load
  const originals = Object.fromEntries(['window','document','Image','requestAnimationFrame','cancelAnimationFrame','performance'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]))
  let now=0, frame, nextTimer=0
  const effects=[], timers=new Map(), changes=[]
  const react={useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useRef:current=>({current}),useEffect:callback=>effects.push(callback)}
  Module._load=function(name,...args){
    if(name==='react')return react
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}
    return originalLoad.call(this,name,...args)
  }
  Object.assign(globalThis,{
    window:{setTimeout:callback=>{timers.set(++nextTimer,callback);return nextTimer},clearTimeout:id=>timers.delete(id)},
    document:{hidden:false,addEventListener(){},removeEventListener(){}},Image:class {},
    requestAnimationFrame:callback=>{frame=callback;return 1},cancelAnimationFrame(){}
  })
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}})
  try {
    const {survivalConfig}=require(process.env.SURVIVAL_TEST_BUILD+'/survivalConfig.js')
    const duration=survivalConfig.slider.singlePassMs
    const {SurvivalScreen}=require(process.env.SURVIVAL_TEST_BUILD+'/SurvivalScreen.js')
    const root=SurvivalScreen({progress:0,advance:p=>changes.push(p),renderFood:()=>null,playEffect(){},stopEffect(){},success(){},back(){}})
    effects.forEach(effect=>effect())
    const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child,predicate);if(found)return found}return null}
    const button=find(root,node=>node.props?.className==='primary-cta survival-tap')
    const pointer={button:0,isPrimary:true,target:{closest:()=>null}}
    now=duration*.5;frame(now) // Cursor at center of Perfect.
    button.props.onPointerDown(pointer)
    assert.deepEqual(changes,[3], 'must settle on down, before click/release')
    root.props.onPointerDown({...pointer,target:{closest:()=>({})}}) // Button bubble excluded.
    for(let i=0;i<8;i++)button.props.onPointerDown(pointer)
    assert.deepEqual(changes,[3], 'busy inputs must not settle again')
    now=duration*.9;frame(now) // Cursor has left Perfect while finger remains held.
    for(const callback of timers.values())callback()
    button.props.onClick({detail:1}) // Physical release after the input lock expires.
    root.props.onClick({detail:1,target:{closest:()=>null}})
    assert.deepEqual(changes,[3], 'release must not count, even after feedback unlocks')
    root.props.onPointerDown({...pointer,isPrimary:false})
    root.props.onPointerDown({...pointer,button:2})
    assert.deepEqual(changes,[3], 'secondary touch/right click must be ignored')
    now=duration*1.5;frame(now)
    root.props.onPointerDown(pointer) // Whole play area has identical timing.
    assert.deepEqual(changes,[3,6])
    for(const callback of timers.values())callback()
    now=duration*1.7;frame(now) // Safe boundary on the return pass.
    button.props.onClick({detail:0}) // Keyboard/accessibility activation still works.
    assert.deepEqual(changes,[3,6,7])
  } finally {
    Module._load=originalLoad
    for(const [key,descriptor] of Object.entries(originals)){
      if(descriptor)Object.defineProperty(globalThis,key,descriptor)
      else Reflect.deleteProperty(globalThis,key)
    }
  }
})
