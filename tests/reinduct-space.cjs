const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),engine=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(engine+`
const p1=makeNode('pick',0,0,{cycle:.1}),p2=makeNode('pick',0,0,{cycle:.1}),a=makeNode('accumulation',0,0,{length:15,zone:36,reinductSide:'right',reinductZone:3});const e1={id:'e1',from:p1.id,to:a.id,port:'A',toPort:'RE',weight:1,filter:'all',waitForSpace:true,emptyZones:2},e2={...e1,id:'e2',from:p2.id};const model={version:1,title:'Gap check',nodes:[p1,p2,a],edges:[e1,e2],simulation:{mode:'step',reference:a.id,seconds:1}};const sim=new FlowSim(validateModel(model));
function tote(id){return {id,kind:'tote',fill:50,len:24,width:16,p:0,history:[],contents:[],destination:''};}
const first=tote(1),second=tote(2),traffic=tote(3);sim.admit(p1,first);sim.admit(p2,second);first.converted=second.converted=true;first.service=second.service=.1;sim.admit(a,traffic);traffic.p=4.5;
assert(sim.available(a,first,'RE'),'Physical spacing should permit an insertion without the extra gap rule');const gate=sim.reinductWindow(e1,first);assert.equal(gate.first,2);assert.equal(gate.last,3);assert.equal(gate.empty,1);assert(!sim.edgeAvailable(e1,first));assert(!sim.depart(p1,first));assert.equal(first.waitingSpace.required,2);assert.equal(sim.get(a).items.length,1);assert.equal(sim.get(p1).items[0].id,1);
// Off preserves ordinary physical-spacing behavior.
e1.waitForSpace=false;assert(sim.edgeAvailable(e1,first));e1.waitForSpace=true;
// A footprint spanning a boundary still occupies the window even if its leading edge is elsewhere.
traffic.p=10;assert(!sim.reinductWindow(e1,first).clear);traffic.p=11;assert(sim.reinductWindow(e1,first).clear);
// Release happens atomically: the next return sees the inserted tote and must wait.
sim.tick(.05);assert.equal(sim.get(p1).items.length,0);assert.equal(sim.get(p2).items.length,1);assert.equal(sim.get(a).items.length,2);assert(!sim.reinductWindow(e2,second).clear);assert(!sim.edgeAvailable(e2,second));assert.equal(first.waitingSpace,undefined);
// Near the inlet the window extends downstream; oversized requests remain closed.
sim.nodeMap.get(a.id).reinductZone=1;assert.equal(sim.reinductWindow(e1,first).first,1);assert.equal(sim.reinductWindow(e1,first).last,2);e1.emptyZones=6;assert(!sim.reinductWindow(e1,first).clear);assert(sim.reinductWindow(e1,first).reason.includes('Not enough'));e1.emptyZones=2;
// Existing JSON files keep their original spacing rule when the new option is absent.
const old=exampleModel('workflow');old.edges.forEach(e=>{delete e.waitForSpace;delete e.emptyZones;});const legacy=validateModel(old);assert(legacy.edges.every(e=>e.waitForSpace===false&&e.emptyZones===2));const invalid=exampleModel('workflow');invalid.edges.find(e=>e.toPort==='RE').emptyZones=2.5;assert.throws(()=>validateModel(invalid));
console.log('Wait-for-space checks passed: picker hold, two adjacent empty zones, full footprints, toggle off, atomic competing returns, inlet/end handling, and JSON compatibility.');
`,{Math,Map,Set,assert,console});
