// Puente monofásico de cuatro diodos y carga RC en el bus CC.
// Los perfiles LED/PSU representan entradas típicas sin corrección activa
// del factor de potencia. NO reproducen un equipo comercial específico.
import { CircuitElm } from "./CircuitElm";
import { CompositeElm } from "./CompositeElm";
import { DiodeElm } from "./DiodeElm";
import { CapacitorElm } from "./CapacitorElm";
import { ResistorElm } from "./ResistorElm";
import { EditInfo } from "./EditInfo";
import { Choice } from "./Choice";
import { Graphics } from "./Graphics";
import { Font } from "./Font";
import { Locale } from "./Locale";
import { StringTokenizer } from "./StringTokenizer";
import { CircuitXMLSerializer } from "./CircuitXMLSerializer";
import { CircuitXMLDeserializer } from "./CircuitXMLDeserializer";

export class FilteredBridgeElm extends CompositeElm {
    resistance:number=200;
    capacitance:number=0.002;
    seriesResistance:number=0;
    profile:number=0; // 0=manual; 1=LED sin PFC; 2=PSU sin PFC
    private pendingPresetSwitch:boolean=false;
    private static readonly presets=[
        {r:200,c:0.002,rs:0},
        {r:6800,c:0.000010,rs:10},
        {r:470,c:0.000470,rs:2.2}
    ];
    constructor(xx:number,yy:number);
    constructor(xa:number,ya:number,xb:number,yb:number,f:number,st:StringTokenizer);
    constructor(xa:number,ya:number,xb?:number,yb?:number,f?:number,st?:StringTokenizer){
        if(xb===undefined)super(xa,ya);
        else super(xa,ya,xb!,yb!,f!);
        this.noDiagonal=false;
        if(st){
            this.resistance=Number(st.nextToken());
            this.capacitance=Number(st.nextToken());
        }
        this.rebuild();
    }
    getDumpType():number{return 1554;}
    getXmlDumpType():string{return "FilteredBridge";}
    getElmType():string{return Locale.LS("Carga no lineal: puente con filtro C");}
    private static profileName(profile:number):string{
        return ["Puente rectificador configurable","Ejemplo LED sin PFC",
                "Ejemplo fuente de ordenador sin PFC"][profile]||
                "Puente rectificador configurable";
    }
    private rebuild():void{
        if(!Number.isFinite(this.resistance)||this.resistance<=0||
           !Number.isFinite(this.capacitance)||this.capacitance<=0||
           !Number.isFinite(this.seriesResistance)||this.seriesResistance<0)
            throw Error("R y C deben ser positivas y Rs no negativa");
        const withRs=this.seriesResistance>0;
        // Rs se incorpora a un conductor de CA antes de los diodos.
        // Rs=0 conserva exactamente el modelo legado de seis componentes.
        const model=withRs?[
            "ResistorElm 1 5",
            "DiodeElm 5 3","DiodeElm 2 3",
            "DiodeElm 4 5","DiodeElm 4 2",
            "CapacitorElm 3 4","ResistorElm 3 4"
        ]:[
            "DiodeElm 1 3","DiodeElm 2 3",
            "DiodeElm 4 1","DiodeElm 4 2",
            "CapacitorElm 3 4","ResistorElm 3 4"
        ];
        this.loadComposite(null,model.join("\r"),[1,2]);
        for(let k=0;k<this.compElmList.length;k++){
            const elm=this.compElmList[k];
            if(elm instanceof ResistorElm)
                elm.resistance=withRs&&k===0?this.seriesResistance:this.resistance;
            if(elm instanceof CapacitorElm){
                elm.capacitance=this.capacitance;
                elm.seriesResistance=0;
            }
        }
        this.setPoints();
    }
    setPoints():void{
        super.setPoints();
        this.calcLeads(40);
        if(this.posts?.length===2){
            this.setPost(0,this.point1);
            this.setPost(1,this.point2);
        }
    }
    draw(g:Graphics):void{
        this.setBbox(this.point1,this.point2,12);
        this.draw2Leads(g);
        this.setPowerColor(g,false);
        g.save();
        g.context.translate((this.point1.x+this.point2.x)/2,(this.point1.y+this.point2.y)/2);
        g.context.rotate(Math.atan2(this.dy,this.dx));
        g.context.lineWidth=2;
        g.context.strokeRect(-20,-11,40,22);
        g.setFont(new Font("SansSerif",0,11));
        g.context.textAlign="center";
        g.context.textBaseline="middle";
        g.drawString(this.profile===1?"LED":this.profile===2?"PSU":"D+C",0,0);
        g.restore();
        this.current=this.getCurrent();
        this.updateDotCount();
        this.drawDots(g,this.point1,this.point2,this.curcount);
        this.drawPosts(g);
    }
    getCurrent():number{
        if(this.seriesResistance>0)
            return this.compElmList[0]?.getCurrent()??0;
        // Corriente del borne 1: diodo 1->3 menos diodo 4->1.
        return (this.compElmList[0]?.getCurrent()??0)-
            (this.compElmList[2]?.getCurrent()??0);
    }
    updateDotCount():void{
        this.curcount=this.updateDotCountImpl(this.getCurrent(),this.curcount);
    }
    getConnection(a:number,b:number):boolean{return a!==b&&a<2&&b<2;}
    dumpXml(doc:Document,elem:Element):void{
        super.dumpXml(doc,elem);
        CircuitXMLSerializer.dumpAttr(elem,"r",this.resistance);
        CircuitXMLSerializer.dumpAttr(elem,"c",this.capacitance);
        if(this.seriesResistance>0)
            CircuitXMLSerializer.dumpAttr(elem,"rs",this.seriesResistance);
        if(this.profile>0)
            CircuitXMLSerializer.dumpAttr(elem,"profile",this.profile);
    }
    undumpXml(xml:CircuitXMLDeserializer):void{
        this.resistance=xml.parseDoubleAttr("r",this.resistance);
        this.capacitance=xml.parseDoubleAttr("c",this.capacitance);
        this.seriesResistance=xml.parseDoubleAttr("rs",0);
        const value=xml.parseIntAttr("profile",0);
        this.profile=value===1||value===2?value:0;
        this.rebuild();
        super.undumpXml(xml);
    }
    getInfo(arr:string[]):void{
        arr[0]=Locale.LS("Puente rectificador monofásico con filtro capacitivo");
        this.getBasicInfo(arr);
        arr[3]="R = "+CircuitElm.getUnitText(this.resistance,"Ω");
        arr[4]="C = "+CircuitElm.getUnitText(this.capacitance,"F");
        arr[5]="Rs = "+CircuitElm.getUnitText(this.seriesResistance,"Ω");
        arr[6]=Locale.LS("Perfil = ")+Locale.LS(FilteredBridgeElm.profileName(this.profile));
        arr[7]=Locale.LS("Modelo aproximado de puente con filtro C, no de un equipo comercial");
    }
    getEditInfo(n:number):EditInfo|null{
        if(n===0){
            // Reiniciar al reconstruir el diálogo, después del cambio de perfil.
            this.pendingPresetSwitch=false;
            const ei=new EditInfo(Locale.LS("Perfil de carga no lineal"),0,-1,-1);
            ei.choice=new Choice();
            for(let k=0;k<3;k++)
                ei.choice.add(Locale.LS(FilteredBridgeElm.profileName(k)));
            ei.choice.select(this.profile);
            return ei;
        }
        if(n===1)return new EditInfo(Locale.LS("Resistencia de carga R (Ω)"),this.resistance,0,0);
        if(n===2)return new EditInfo(Locale.LS("Condensador de filtrado C (F)"),this.capacitance,0,0);
        if(n===3)return new EditInfo(Locale.LS("Resistencia serie de entrada Rs (Ω)"),this.seriesResistance,0,0);
        return null;
    }
    setEditValue(n:number,ei:EditInfo):void{
        if(n===0){
            const profile=ei.choice!.getSelectedIndex();
            if(profile<0||profile>2)throw Error("Perfil de carga no lineal inválido");
            if(profile!==0){
                const values=FilteredBridgeElm.presets[profile];
                this.resistance=values.r;
                this.capacitance=values.c;
                this.seriesResistance=values.rs;
            }
            this.profile=profile;
            this.rebuild();
            // EditDialog aplica de nuevo los campos NUMÉRICOS antiguos justo
            // antes de recrearlos; no deben sobrescribir los valores del perfil.
            this.pendingPresetSwitch=true;
            ei.newDialog=true;
            return;
        }
        if(n>=1&&n<=3){
            if(this.pendingPresetSwitch)return;
            const v=ei.value;
            if(!Number.isFinite(v)||(n!==3&&v<=0)||(n===3&&v<0)){
                ei.setError(n===3?Locale.LS("must be >= 0"):Locale.LS("must be > 0"));
                return;
            }
            const previous=n===1?this.resistance:n===2?this.capacitance:this.seriesResistance;
            if(v===previous)return;
            if(n===1)this.resistance=v;
            if(n===2)this.capacitance=v;
            if(n===3)this.seriesResistance=v;
            this.profile=0;
            this.rebuild();
        }
    }
}
