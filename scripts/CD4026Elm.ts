// SPDX-License-Identifier: GPL-3.0-or-later
// Powered behavioural model. Post index is the physical DIP pin number minus one.
import {ChipElm,Pin} from "./ChipElm";
import {CircuitElm} from "./CircuitElm";
import {CircuitXMLSerializer} from "./CircuitXMLSerializer";
import {CircuitXMLDeserializer} from "./CircuitXMLDeserializer";
import {Graphics} from "./Graphics";
import {Font} from "./Font";
import {CD4026State} from "./LabCD4026";

const OUTPUTS=[9,11,12,8,10,5,6,3,4,13]; // a,b,c,d,e,f,g,DEO,CO,Uc
export class CD4026Elm extends ChipElm {
    logic=new CD4026State();
    // Simplified push-pull stages. Not a transistor/thermal or drive-current model.
    static readonly R_ON=200;
    static readonly R_OFF=1e12;
    getChipName():string{return "CD4026B";}
    getDumpType():number{return 1556;}
    getXmlDumpType():string{return "CD4026";}
    getPostCount():number{return 16;}
    getVoltageSourceCount():number{return 0;}
    isDigitalChip():boolean{return false;}
    showPropertiesOnCreate():boolean{return false;}
    // Match the small-grid CD4026 used by the supplied practice fixture (f=1).
    // ChipElm otherwise inserts new chips at twice this scale.
    useSmallGrid():boolean{return true;}
    // Selection covers the entire package, including a zero-length insertion drag.
    getMouseDistance(gx:number,gy:number):number {
        const xs=this.rectPointsX,ys=this.rectPointsY;
        if(xs?.length && gx>=Math.min(...xs) && gx<=Math.max(...xs) && gy>=Math.min(...ys) && gy<=Math.max(...ys))return 0;
        const distance=super.getMouseDistance(gx,gy);
        return Number.isFinite(distance)?distance:(gx-this.x)**2+(gy-this.y)**2;
    }
    setPoints():void {
        const end=this.x2;
        if(this.isCreating()){this.setSize(1);this.x2=this.x+this.sizeX*16;}
        super.setPoints();this.x2=end;
    }
    setupPins():void {
        this.sizeX=5;this.sizeY=10;
        this.pins=new Array(16);
        const add=(i:number,pos:number,side:number,name:string)=>this.pins[i]=new Pin(this,pos,side,name);
        add(0,0,ChipElm.SIDE_W,"CK1");this.pins[0].clock=true;
        add(1,2,ChipElm.SIDE_W,"CK/EN");
        add(2,4,ChipElm.SIDE_W,"DE");
        add(14,6,ChipElm.SIDE_W,"R");
        add(15,2,ChipElm.SIDE_N,"+Vcc");
        add(7,2,ChipElm.SIDE_S,"Gnd");
        const names=["a","b","c","d","e","f","g","EO","Carry","2"];
        OUTPUTS.forEach((p,i)=>{add(p,i,ChipElm.SIDE_E,names[i]);this.pins[p].output=true;});
    }
    draw(g:Graphics):void {
        // ChipElm fits every label to the narrow power-pin spacing. Draw our
        // short labels at a fixed legible size, including after rotations.
        const names=this.pins.map(p=>p.text);
        this.pins.forEach(p=>p.text="");
        try {this.drawChip(g);} finally {this.pins.forEach((p,i)=>p.text=names[i]);}
        g.save();g.setFont(new Font("normal",0,10*this.csize));
        g.setColor(CircuitElm.whiteColor);
        for(const p of this.pins){
            const width=g.context.measureText(p.text).width;
            const tx=p.side===ChipElm.SIDE_W?p.textloc.x-(this.cspc-5):
                p.side===ChipElm.SIDE_E?p.textloc.x+(this.cspc-5)-width:p.textloc.x-width/2;
            g.drawString(p.text,tx,p.textloc.y+g.currentFontSize/3);
        }
        g.restore();
    }
    drawLabel(g:Graphics,x:number,y:number):void {
        g.setFont(new Font("normal",0,10*this.csize));
        g.drawString("4026",x-g.context.measureText("4026").width/2,y);
    }
    nonLinear():boolean{return true;}
    stamp():void {
        for(const p of [...OUTPUTS,7,15])CircuitElm.sim.stampNonLinear(this.nodes[p]);
        CircuitElm.sim.stampResistor(this.nodes[15],this.nodes[7],1e10);
    }
    startIteration():void {
        const low=this.nodes[7].v,supply=this.nodes[15].v-low;
        const high=(p:number)=>this.nodes[p].v-low>supply/2;
        this.logic.step(this.nodes[0].v-low,high(1),high(14),supply);
        const powered=supply>=3&&supply<=18;
        const values=powered?this.logic.outputs(high(2)):new Array(10).fill(false);
        OUTPUTS.forEach((p,i)=>this.pins[p].value=values[i]);
        for(const p of [0,1,2,14])this.pins[p].value=high(p);
    }
    doStep():void {
        const powered=this.nodes[15].v-this.nodes[7].v>=3&&this.nodes[15].v-this.nodes[7].v<=18;
        for(const p of OUTPUTS){
            const high=powered&&this.pins[p].value;
            CircuitElm.sim.stampResistor(this.nodes[p],this.nodes[15],high?CD4026Elm.R_ON:CD4026Elm.R_OFF);
            CircuitElm.sim.stampResistor(this.nodes[p],this.nodes[7],powered&&!high?CD4026Elm.R_ON:CD4026Elm.R_OFF);
        }
    }
    calculateCurrent():void {
        for(const pin of this.pins)pin.current=0;
        const powered=this.nodes[15].v-this.nodes[7].v>=3&&this.nodes[15].v-this.nodes[7].v<=18;
        for(const p of OUTPUTS){
            const high=powered&&this.pins[p].value;
            const ivdd=(this.nodes[15].v-this.nodes[p].v)/(high?CD4026Elm.R_ON:CD4026Elm.R_OFF);
            const ivss=(this.nodes[7].v-this.nodes[p].v)/(powered&&!high?CD4026Elm.R_ON:CD4026Elm.R_OFF);
            this.pins[p].current=ivdd+ivss;
            this.pins[15].current-=ivdd;this.pins[7].current-=ivss;
        }
        const leak=(this.nodes[15].v-this.nodes[7].v)/1e10;
        this.pins[15].current-=leak;this.pins[7].current+=leak;
    }
    getConnection(a:number,b:number):boolean {
        return a!==b&&[7,15,...OUTPUTS].includes(a)&&[7,15,...OUTPUTS].includes(b);
    }
    hasGroundConnection(_n:number):boolean{return false;}
    validate():boolean{return true;}
    reset():void {super.reset();this.logic?.reset();}
    dumpXml(doc:Document,elem:Element):void {
        super.dumpXml(doc,elem);
    }
    dumpXmlState(doc:Document,elem:Element):void {
        CircuitXMLSerializer.dumpAttr(elem,"count",this.logic.count);
        CircuitXMLSerializer.dumpAttr(elem,"clock",this.logic.clock);
        CircuitXMLSerializer.dumpAttr(elem,"gated",this.logic.gatedClock);
        CircuitXMLSerializer.dumpAttr(elem,"ready",this.logic.initialized);
    }
    undumpXml(xml:CircuitXMLDeserializer):void {
        super.undumpXml(xml);
        this.logic.count=Math.max(0,Math.min(9,xml.parseIntAttr("count",0)));
        this.logic.clock=xml.parseBooleanAttr("clock",false);
        this.logic.gatedClock=xml.parseBooleanAttr("gated",false);
        // Re-prime the clock after matrix reconstruction to avoid false edges.
        this.logic.initialized=false;
    }
    getInfo(arr:string[]):void {
        arr[0]="CD4026B";arr[1]="Count = "+this.logic.count;
        arr[2]="VDD − VSS = "+CircuitElm.getVoltageText(this.nodes[15].v-this.nodes[7].v);
        arr[3]="CLK 1 · INH 2 · DE 3 · R 15 · CO 5";
    }
}
