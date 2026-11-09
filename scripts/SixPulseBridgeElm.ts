// Rectificador de seis pulsos: seis diodos, filtro C y resistencia de carga R.
// Tres bornes L1, L2, L3; sin neutro ni salida CC exterior. Modelo de la etapa
// de entrada de un variador, NO del motor ni de su etapa inversora PWM.
import {CircuitElm} from "./CircuitElm";
import {CompositeElm} from "./CompositeElm";
import {DiodeElm} from "./DiodeElm";
import {CapacitorElm} from "./CapacitorElm";
import {ResistorElm} from "./ResistorElm";
import {EditInfo} from "./EditInfo";
import {Graphics} from "./Graphics";
import {Font} from "./Font";
import {Locale} from "./Locale";
import {StringTokenizer} from "./StringTokenizer";
import {CircuitXMLSerializer} from "./CircuitXMLSerializer";
import {CircuitXMLDeserializer} from "./CircuitXMLDeserializer";

export class SixPulseBridgeElm extends CompositeElm {
    // Valores de UN equipo; units modela equipos idénticos en paralelo.
    resistance:number=470;
    capacitance:number=0.001;
    seriesResistance:number=1;
    units:number=1;
    private static readonly maxUnits=10000;

    constructor(xx:number,yy:number);
    constructor(xa:number,ya:number,xb:number,yb:number,f:number,st:StringTokenizer);
    constructor(xa:number,ya:number,xb?:number,yb?:number,f?:number,st?:StringTokenizer){
        if(xb===undefined)super(xa,ya);
        else super(xa,ya,xb!,yb!,f!);
        this.noDiagonal=false;
        if(st){
            this.resistance=Number(st.nextToken());
            this.capacitance=Number(st.nextToken());
            this.seriesResistance=Number(st.nextToken());
            this.units=Number(st.nextToken());
        }
        this.rebuild();
    }
    getDumpType():number{return 1555;}
    getXmlDumpType():string{return "SixPulseBridge";}
    getElmType():string{return Locale.LS("Carga no lineal: rectificador trifásico de 6 pulsos");}

    private rebuild():void{
        if(!Number.isFinite(this.resistance)||this.resistance<=0||
           !Number.isFinite(this.capacitance)||this.capacitance<=0||
           !Number.isFinite(this.seriesResistance)||this.seriesResistance<0||
           !Number.isInteger(this.units)||this.units<1||this.units>SixPulseBridgeElm.maxUnits)
            throw Error("Parámetros no válidos del rectificador trifásico");
        const r=this.resistance/this.units;
        const c=this.capacitance*this.units;
        const rs=this.seriesResistance/this.units;
        if(!(Number.isFinite(r)&&r>0&&Number.isFinite(c)&&c>0&&
             Number.isFinite(rs)&&rs>=0))
            throw Error("Parámetros equivalentes fuera de rango");

        // Nodos 1/2/3: entradas L1/L2/L3; 4: DC+; 5: DC-.
        // Diodos superiores fase->DC+; inferiores DC-->fase.
        // Rs en cada fase, nunca una resistencia común en el bus CC.
        const withRs=this.seriesResistance>0;
        const phases=withRs?[6,7,8]:[1,2,3];
        const entries:string[]=[];
        if(withRs)
            for(let k=0;k<3;k++)entries.push("ResistorElm "+(k+1)+" "+phases[k]);
        for(const phase of phases)entries.push("DiodeElm "+phase+" 4");
        for(const phase of phases)entries.push("DiodeElm 5 "+phase);
        entries.push("CapacitorElm 4 5","ResistorElm 4 5");
        this.loadComposite(null,entries.join("\r"),[1,2,3]);
        for(let k=0;k<this.compElmList.length;k++){
            const elm=this.compElmList[k];
            if(elm instanceof ResistorElm)
                elm.resistance=withRs&&k<3?rs:r;
            if(elm instanceof CapacitorElm){
                elm.capacitance=c;
                elm.seriesResistance=0;
            }
        }
        this.setPoints();
    }
    setPoints():void{
        super.setPoints();
        // Desplazamiento perpendicular en píxeles; sirve para orientar el
        // componente horizontal o verticalmente y mantener bornes separados.
        for(let phase=0;phase<3;phase++)
            this.setPost(phase,
                this.interpPoint(this.point1,this.point2,0,(phase-1)*32));
    }
    draw(g:Graphics):void{
        this.setBbox(this.point1,this.point2,56);
        this.setPowerColor(g,false);
        const center=this.interpPoint(this.point1,this.point2,0.5);
        for(let phase=0;phase<3;phase++){
            const terminal=this.getPost(phase);
            const end=this.interpPoint(this.point1,this.point2,0.3,(phase-1)*32);
            CircuitElm.drawThickLine(g,terminal,end);
        }
        g.save();
        g.context.translate(center.x,center.y);
        g.context.rotate(Math.atan2(this.dy,this.dx));
        g.context.lineWidth=2;
        g.context.strokeRect(-27,-51,54,102);
        g.setFont(new Font("SansSerif",0,11));
        g.context.textAlign="center";
        g.context.textBaseline="middle";
        g.drawString("6P",0,-13);
        g.drawString("3~",0,8);
        g.drawString("C",0,29);
        g.restore();
        this.drawPosts(g);
    }
    private phaseCurrent(phase:number):number{
        if(phase<0||phase>2)return 0;
        if(this.seriesResistance>0)
            return this.compElmList[phase]?.getCurrent()??0;
        // I = corriente hacia el bus positivo menos la que retorna del bus negativo.
        return (this.compElmList[phase]?.getCurrent()??0)-
               (this.compElmList[phase+3]?.getCurrent()??0);
    }
    getCurrent():number{return this.phaseCurrent(0);}
    // Métodos de medición de la API pública, sin exponer la estructura interna
    // del composite. Permiten inspeccionar por separado las tres fases.
    addJSMethods():void{
        super.addJSMethods();
        if(this._jsProxy){
            this._jsProxy["getPhaseCurrents"]=()=>[
                this.phaseCurrent(0),this.phaseCurrent(1),this.phaseCurrent(2)];
            this._jsProxy["getDcVoltage"]=()=>{
                const cap=this.compElmList.find(el=>el instanceof CapacitorElm);
                return cap?.getVoltageDiff()??0;
            };
        }
    }
    getConnection(a:number,b:number):boolean{return a!==b&&a>=0&&a<3&&b>=0&&b<3;}
    dumpXml(doc:Document,elem:Element):void{
        super.dumpXml(doc,elem);
        CircuitXMLSerializer.dumpAttr(elem,"r",this.resistance);
        CircuitXMLSerializer.dumpAttr(elem,"c",this.capacitance);
        CircuitXMLSerializer.dumpAttr(elem,"rs",this.seriesResistance);
        if(this.units!==1)
            CircuitXMLSerializer.dumpAttr(elem,"units",this.units);
    }
    undumpXml(xml:CircuitXMLDeserializer):void{
        this.resistance=xml.parseDoubleAttr("r",this.resistance);
        this.capacitance=xml.parseDoubleAttr("c",this.capacitance);
        this.seriesResistance=xml.parseDoubleAttr("rs",this.seriesResistance);
        this.units=xml.parseIntAttr("units",1);
        this.rebuild();
        super.undumpXml(xml);
    }
    getInfo(arr:string[]):void{
        arr[0]=Locale.LS("Rectificador trifásico de seis pulsos con filtro C");
        arr[1]="IL1 = "+CircuitElm.getCurrentText(this.phaseCurrent(0));
        arr[2]="IL2 = "+CircuitElm.getCurrentText(this.phaseCurrent(1));
        arr[3]="IL3 = "+CircuitElm.getCurrentText(this.phaseCurrent(2));
        const cap=this.compElmList.find(el=>el instanceof CapacitorElm);
        arr[4]="Udc = "+CircuitElm.getVoltageText(cap?.getVoltageDiff()??0);
        arr[5]="R = "+CircuitElm.getUnitText(this.resistance,"Ω");
        arr[6]="C = "+CircuitElm.getUnitText(this.capacitance,"F");
        arr[7]="Rs = "+CircuitElm.getUnitText(this.seriesResistance,"Ω");
        arr[8]=Locale.LS("Unidades = ")+this.units;
        arr[9]=Locale.LS("R, C y Rs son valores por unidad");
        arr[10]=Locale.LS("Modelo de entrada: no incluye inversor ni motor");
    }
    getEditInfo(n:number):EditInfo|null{
        if(n===0)return new EditInfo(Locale.LS("Resistencia de carga R (Ω)"),this.resistance,0,0);
        if(n===1)return new EditInfo(Locale.LS("Condensador de filtrado C (F)"),this.capacitance,0,0);
        if(n===2)return new EditInfo(Locale.LS("Resistencia serie de entrada Rs (Ω)"),this.seriesResistance,0,0);
        if(n===3)return new EditInfo(Locale.LS("Número de unidades (en paralelo)"),
            this.units,1,SixPulseBridgeElm.maxUnits).setInteger().setPositive().disallowSliders();
        return null;
    }
    setEditValue(n:number,ei:EditInfo):void{
        if(n<0||n>3)return;
        const value=ei.value;
        if(n===3){
            if(!Number.isInteger(value)||value<1||value>SixPulseBridgeElm.maxUnits){
                ei.setError(Locale.LS("Número de unidades: entero entre 1 y 10000"));return;
            }
            if(value===this.units)return;
            this.units=value;
        }else{
            if(!Number.isFinite(value)||value<0||(n!==2&&value===0)){
                ei.setError(Locale.LS(n===2?"must be >= 0":"must be > 0"));return;
            }
            const old=[this.resistance,this.capacitance,this.seriesResistance][n];
            if(value===old)return;
            if(n===0)this.resistance=value;
            if(n===1)this.capacitance=value;
            if(n===2)this.seriesResistance=value;
        }
        this.rebuild();
    }
}
