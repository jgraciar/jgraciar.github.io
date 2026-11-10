// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {drawMenuGroupKeys,drawMenuGroupTranslations} from './DrawMenuGroups.ts';
const dir=process.argv[2],here=dirname(fileURLToPath(import.meta.url));
if(!dir)throw Error('Usage: patch-draw-menu-groups.mjs <ts directory>');
for(const [code,labels]of Object.entries(drawMenuGroupTranslations))if(labels.length!==drawMenuGroupKeys.length||labels.some(s=>!s.trim()))throw Error('Incomplete Draw groups: '+code);
const groups={
 passMenu:{
  resistive:['PotElm','LDRElm','ThermistorNTCElm','MemristorElm','ImpedanceElm'],
  reactive:['CapacitorElm','PolarCapacitorElm','InductorElm','CrystalElm','GyratorElm'],
  switch:['SwitchElm','PushSwitchElm','Switch2Elm','DPDTSwitchElm','MBBSwitchElm','CrossSwitchElm','SparkGapElm','FuseElm'],
  magnetic:['TransformerElm','TappedTransformerElm','CustomTransformerElm','TransLineElm'],
  relay:['RelayElm','RelayCoilElm','RelayContactElm'],
  load:['FilteredBridgeElm','SixPulseBridgeElm']
 },
 inputMenu:{
  dc:['DCVoltageElm','BatteryElm','RailElm','VarRailElm','CurrentElm'],
  ac:['ACVoltageElm','ACRailElm','PVInverterElm'],
  signal:['SquareRailElm','ClockElm','SweepElm','AMElm','FMElm','NoiseElm'],
  data:['AudioInputElm','DataInputElm','ExtVoltageElm'],
  reference:['GroundElm','AntennaElm']
 },
 outputMenu:{
  measure:['ProbeElm','OhmMeterElm','AmmeterElm','WattmeterTrueElm','WattmeterElm','TestPointElm'],
  display:['OutputElm','LEDElm','LampElm','DecimalDisplayElm','InstructionDisplayElm','LEDArrayElm'],
  record:['DataRecorderElm','AudioOutputElm','StopTriggerElm'],
  motor:['DCMotorElm','ThreePhaseMotorElm'],
  annotation:['TextElm','BoxElm','LineElm','LabeledNodeElm']
 },
 activeMenu:{
  diode:['DiodeElm','ZenerElm','VaractorElm','TunnelDiodeElm'],
  bipolar:['NTransistorElm','PTransistorElm','NDarlingtonElm','PDarlingtonElm'],
  fet:['NMosfetElm','PMosfetElm','NJfetElm','PJfetElm'],
  thyristor:['SCRElm','DiacElm','TriacElm','TriodeElm','UnijunctionElm']
 },
 activeBlocMenu:{
  amplifier:['OpAmpElm','OpAmpSwapElm','OpAmpRealElm','ComparatorElm','OTAElm','NortonAmpElm','CC2Elm','CC2NegElm'],
  analog:['AnalogSwitchElm','AnalogSwitch2Elm','AnalogMuxElm','OptocouplerElm'],
  buffer:['TriStateElm','SchmittElm','InvertingSchmittElm','DelayBufferElm'],
  controlled:['ControlledVoltageElm','ControlledCurrentElm','VCVSElm','VCCSElm','CCVSElm','CCCSElm'],
  regulation:['TimeDelayRelayElm','SubcircuitElm:~LM317-v2','SubcircuitElm:~TL431','MotorProtectionSwitchElm'],
  instance:['SubcircuitElm']
 },
 gateMenu:{io:['LogicInputElm','LogicOutputElm','BusLogicInputElm'],logic:['InverterElm','NandGateElm','NorGateElm','AndGateElm','OrGateElm','XorGateElm','XnorGateElm']},
 achipMenu:{timing:['TimerElm','PhaseCompElm','VCOElm','MonostableElm'],converter:['DACElm','ADCElm']}
};
const file=join(dir,'Menus.ts');let source=readFileSync(file,'utf8');
const inventory=s=>[...s.matchAll(/^\s*"[^"]+",\s*"([^"\n]+Elm(?::[^"\n]+)?)",.*$/gm)].map(m=>m[1]).sort();
const before=inventory(source);
for(const [menu,categories]of Object.entries(groups)){
 const re=new RegExp('        this\\.makeClassCheckItems\\('+menu+', \\[([\\s\\S]*?)        \\]\\);');
 const match=source.match(re);if(!match)throw Error('Missing Draw menu '+menu);
 const entries=[...match[1].matchAll(/^\s*"[^"]+",\s*"([^"\n]+)",.*$/gm)].map(m=>({command:m[1],line:m[0]}));
 const planned=Object.values(categories).flat();
 if(entries.length!==planned.length||new Set(planned).size!==planned.length||entries.some(e=>!planned.includes(e.command)))throw Error('Unclassified or repeated command in '+menu+': '+entries.map(e=>e.command).filter(p=>!planned.includes(p)));
 let result='';for(const [key,commands]of Object.entries(categories)){
  const name=menu+'_'+key;
  result+=`        const ${name} = new Menu(this.app);\n        ${name}.ul.dataset.drawGroup = '${key}';\n        this.makeClassCheckItems(${name}, [\n`;
  result+=commands.map(cmd=>entries.find(e=>e.command===cmd).line.trimStart()).map(line=>'            '+line).join('\n');
  result+=`\n        ]);\n        ${menu}.addSubmenu(drawMenuGroupLabel('${key}', Locale.activeLanguage), ${name});\n`;
 }
 source=source.replace(re,result.trimEnd());
}
if(JSON.stringify(before)!==JSON.stringify(inventory(source)))throw Error('Draw command inventory changed');
source="import {drawMenuGroupLabel} from './DrawMenuGroups';\n"+source;
copyFileSync(join(here,'DrawMenuGroups.ts'),join(dir,'DrawMenuGroups.ts'));
writeFileSync(file,source);
console.log('OK: 30 translated submenus in seven Draw categories; all commands and shortcuts preserved');
