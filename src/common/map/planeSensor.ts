import Cesium, {
    Viewer,
    Math as _Math,
    Cartesian3,
    HeadingPitchRoll,
    Transforms,
    ConstantProperty,
    CallbackProperty,
    ImageMaterialProperty
} from "cesium";
import { List, merge } from "lodash";
import { CMap } from "./sdk/map";

const canvasNum = 20;

interface Degree {
    x: number;
    y: number;
    height: number;
}

interface IPlaneSensorOptions {
    id?: string;
    position?: Degree;
    maxRadius?: number;
    maxLength?: number;
    color?: string;
}

export class PlaneSensor {
    private allSensor: Map<string, Cesium.Entity> = new Map<string, Cesium.Entity>();
    private currentRadius: Map<string, number> = new Map<string, number>();
    private maxRadius: Map<string, number> = new Map<string, number>();
    private currentLength: Map<string, number> = new Map<string, number>();
    private maxLength: Map<string, number> = new Map<string, number>();
    private curCanvasNum: Map<string, number> = new Map<string, number>();
    private changeNum: Map<string, number> = new Map<string, number>();
    private sensorColor: string = "rgba(255, 0, 255, 0.8)";
    private canvasList: Array<HTMLCanvasElement> = [];
    private isDestroyed: boolean = false;
    private positions: Map<string, Degree> = new Map<string, Degree>();
    public isShow: boolean = false;
    public viewer!: Viewer;
    public id: string = `PlaneSensor-${new Date().getTime().toString()}`;

    public constructor(
        public cmap: CMap,
        public options: IPlaneSensorOptions = {}) {
            this.viewer = cmap.viewer as Viewer;
            if (!this.viewer) {
                console.warn("信号干扰初始化失败");
                return;
            }
            this.readyCanvases(canvasNum);
    }

    public add(options: IPlaneSensorOptions = {}) {
        let _options = merge({}, this.options, options);
        if (_options.id !== undefined && _options.maxRadius !== undefined && _options.maxLength !== undefined
            && _options.position !== undefined) {
            this.maxRadius.set(_options.id, _options.maxRadius);
            this.maxLength.set(_options.id, _options.maxLength);
            this.currentRadius.set(_options.id, 0);
            this.currentLength.set(_options.id, 0);
            this.changeNum.set(_options.id, 0);
            this.curCanvasNum.set(_options.id, 0);
            this.positions.set(_options.id, _options.position);
            if (_options.color !== undefined) this.sensorColor = _options.color;
            let cylinder = this.viewer.entities.add({
                id: _options.id,
                position: Cartesian3.fromDegrees(_options.position.x, _options.position.y,
                    (_options.position.height - this.maxLength.get(_options.id) / 2)),
                orientation: this.changeOrientation(Cartesian3.fromDegrees(
                    _options.position.x, _options.position.y, _options.position.height)),
                cylinder: {
                    length: this.maxLength.get(_options.id),
                    topRadius: 0,
                    bottomRadius: this.maxRadius.get(_options.id),
                    material: new ImageMaterialProperty({
                        image: new CallbackProperty(() => {
                            return this.drawCanvasImage(_options.id);
                        }, false),
                        transparent: true
                    })
                }
            });
            this.allSensor.set(_options.id, cylinder);
            this.isShow = true;
            return cylinder;
        } else {
            console.warn("add plane Sensor failed");
        }
    }

    public show(id: string) {
        let entity = this.allSensor.get(id);
        if(entity !== undefined) {
            this.viewer.entities.add(entity);
        }
        this.isShow = true;
    }

    public showAll() {
        for(let key of this.allSensor.keys()) {
            let entity = this.allSensor.get(key);
            if(entity !== undefined) {
                this.viewer.entities.add(entity);
            }
        }
        this.isShow = true;
    }

    public hide(id: string) {
        if (this.viewer.entities.getById(id) !== undefined) {
            this.viewer.entities.removeById(id);
        } else {
            console.warn("cannot find entity with id: " + id);
        }
        this.isShow = false;
    }

    public hideAll() {
        for(let key of this.allSensor.keys()) {
            this.viewer.entities.removeById(key);
        }
        this.isShow = false;
    }

    public delete(id: string) {
        if (this.viewer.entities.getById(id) !== undefined) {
            this.viewer.entities.removeById(id);
            this.allSensor.delete(id);
            this.maxRadius.delete(id);
            this.currentRadius.delete(id);
            this.maxLength.delete(id);
            this.currentLength.delete(id);
            this.curCanvasNum.delete(id);
            this.changeNum.delete(id);
            this.positions.delete(id);
        } else {
            console.warn("cannot find entity with id: " + id);
            return;
        }
    }

    public deleteAll() {
        for(let key of this.allSensor.keys()) {
            this.viewer.entities.removeById(key);
        }
        this.allSensor.clear();
        this.maxRadius.clear();
        this.currentRadius.clear();
        this.maxLength.clear();
        this.currentLength.clear();
        this.curCanvasNum.clear();
        this.changeNum.clear();
        this.positions.clear();
        this.isShow = false;
    }

    public changeSize(id: string, maxRadius: number | undefined, maxLength: number | undefined) {
        if (maxRadius !== undefined) this.maxRadius.set(id, maxRadius);
        if (maxLength !== undefined) this.maxLength.set(id, maxLength);
        let sensor = this.allSensor.get(id);
        let position: Degree;
        if(sensor !== undefined) {
            position = this.positions.get(id);
            this.delete(id);
        }
        this.add({id: id, maxLength: maxLength, maxRadius: maxRadius, position: position});
    }

    public destroy() {
        if (!this.isDestroyed) return;
        this.deleteAll();
        this.isDestroyed = true;
    }

    private createCanvas(canvasNum: number) {
        for (let i = 0; i < canvasNum; i++) {
            let canvas = document.createElement("canvas");
            canvas.width = 1600;
            canvas.height = 1600;
            this.canvasList.push(canvas);
        }
    }

    private readyCanvas(canvasid: number, radius: number) {
        let canvas = this.canvasList[canvasid];
        let cwidth = 1600;
        let cheight = 1600;
        let ctx = canvas.getContext("2d");
        if (ctx != null) {
            ctx.clearRect(0, 0, cwidth, cheight);
            ctx.fillStyle = "rgba(255, 255, 255, 0)";
            ctx.fillRect(0, 0, cwidth, cheight);
            while (radius <= 800) {
                ctx.lineWidth = 15;
                ctx.beginPath();
                ctx.strokeStyle = this.sensorColor;
                let circle = {
                    x: 800,
                    y: 800,
                    r: radius
                };
                ctx.arc(circle.x, circle.y, circle.r, 0, _Math.PI * 3, false);
                ctx.stroke();
                radius += 40;
            }
        }
    }

    private readyCanvases(canvasNum: number) {
        this.createCanvas(canvasNum);
        for (let i = 0; i < canvasNum; i++) {
            this.readyCanvas(i, 2 + 2 * i);
        }
    }

    private drawCanvasImage(id: string | undefined) {
        if (id === undefined) return;
        let curCanvasNum = this.curCanvasNum.get(id);
        let changeNum = this.changeNum.get(id);
        if (curCanvasNum !== undefined && changeNum !== undefined) {
            changeNum++;
            this.changeNum.set(id, changeNum);
        }
        else {
            return;
        }
        let canvas = this.canvasList[curCanvasNum];
        if (changeNum >= 4) {
            changeNum = 0;
            this.changeNum.set(id, changeNum);
            curCanvasNum++;
            if (curCanvasNum === canvasNum) {
                curCanvasNum = 0;
            }
            this.curCanvasNum.set(id, curCanvasNum);
        }
        return canvas;
    }
    
    private changeOrientation(position: Cartesian3) {
        let hpr = new HeadingPitchRoll(0.0, 0.0, 0.0);
        let orientation = Transforms.headingPitchRollQuaternion(position, hpr);
        return new ConstantProperty(orientation);
    }

}