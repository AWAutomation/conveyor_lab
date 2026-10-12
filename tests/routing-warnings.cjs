const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
vm.runInNewContext(html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1]+`
const source=makeNode('source',0,0,{material:'case'}),belt=makeNode('transport',0,0),pick=makeNode('pick',0,0),sink=makeNode('sink',0,0),unreachable=makeNode('pick',0,0);const m=validateModel({version:1,title:'Warning fixture',nodes:[source,belt,pick,sink,unreachable],edges:[{id:'a',from:source.id,to:belt.id,port:'A',weight:1},{id:'b',from:belt.id,to:pick.id,port:'A',weight:1}]});const warnings=routingWarnings(m);assert(warnings.some(w=>w.includes('creates CASES')));assert(warnings.some(w=>w.includes('no connected path to a discharge')));assert(warnings.some(w=>w.includes('1 workstation is unreachable')));const sim=new FlowSim(m);sim.advance(120);assert.equal(sim.get(pick).in,0);const trapped=sim.get(belt).items[0];assert(trapped.kind==='case');assert(!sim.available(pick,trapped));
// A case route filtered away from picking does not trigger the material warning.
m.edges[1].filter='empty';assert(!routingWarnings(m).some(w=>w.includes('creates CASES')));m.nodes[0].material='empty';m.edges.push({id:'c',from:pick.id,to:sink.id,port:'A',weight:1,filter:'all'});assert(!routingWarnings(m).some(w=>w.includes('no connected path to a discharge')));
// A valid empty-tote pick workflow has no material/reachability warnings.
assert.equal(routingWarnings(validateModel(exampleModel('workflow'))).length,0);
console.log('Routing warning checks passed: case/tote mismatch, disconnected discharge, unreachable workstation, material filters and valid tote workflow.');
`,{Math,Map,Set,assert,console});
