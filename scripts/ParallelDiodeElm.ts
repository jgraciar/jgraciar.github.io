// Diodo interno de los puentes agrupados: I_N(v) = N * I_1(v).
// No modifica el catálogo compartido ni hereda el último diodo del editor.
import {DiodeElm} from "./DiodeElm";
import {DiodeModel} from "./DiodeModel";

export class ParallelDiodeElm extends DiodeElm {
    units:number=1;

    setup():void {
        this.modelName="default";
        super.setup();
        const model=new DiodeModel(this.model);
        model.saturationCurrent*=this.units??1;
        this.diode.setup(model);
    }

    setUnits(units:number):void {
        if(!Number.isInteger(units)||units<1||units>10000)
            throw Error("Número de unidades fuera de rango");
        this.units=units;
        this.setup();
    }
}
