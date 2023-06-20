import Cesium, {
    CallbackProperty,
    Cartesian3,
    Color,
    Math as _Math,
    PositionProperty,
    Viewer
} from "cesium";
import { merge } from "lodash";
import { CMap } from "./sdk/map";

interface IPlaneEMIOptions {
    id?: string;
    position?: PositionProperty;
    maxRadius?: number;
    color?: Color;
}

export class PlaneEMI {
    private allDisturb: Map<string, Cesium.Entity> = new Map<string, Cesium.Entity>();
    private currentRadius: Map<string, number> = new Map<string, number>();
    private maxRadius: Map<string, number> = new Map<string, number>();
    private isDestroyed: boolean = false;
    public isShow: boolean = false;
    public viewer!: Viewer;
    public id: string = `PlaneEMI-${new Date().getTime().toString()}`;

    public constructor(
        public cmap: CMap,
        public options: IPlaneEMIOptions = {}) {
            this.viewer = cmap.viewer as Viewer;
            if (!this.viewer) {
                console.warn("信号干扰初始化失败");
                return;
            }
    }

    public add(options: IPlaneEMIOptions = {}) {
        let _options = merge({}, this.options, options);
        if (_options.id !== undefined && _options.maxRadius !== undefined) {
            this.maxRadius.set(_options.id, _options.maxRadius);
            this.currentRadius.set(_options.id, 0);
            let entity = this.viewer.entities.add({
                id: _options.id,
                position: _options.position,
                ellipsoid: {
                    radii: new CallbackProperty(() => {
                        return this.changeRadius(_options.id);
                    }, false),
                    material: _options.color
                }
            });
            this.allDisturb.set(_options.id, entity);
            this.isShow = true;
            return entity;
        } else {
            console.warn("add plane EMI failed");
        }
    }

    public show(id: string) {
        let entity = this.allDisturb.get(id);
        if(entity !== undefined) {
            this.viewer.entities.add(entity);
        }
        this.isShow = true;
    }

    public showAll() {
        for(let key of this.allDisturb.keys()) {
            let entity = this.allDisturb.get(key);
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
        for(let key of this.allDisturb.keys()) {
            this.viewer.entities.removeById(key);
        }
        this.isShow = false;
    }

    public delete(id: string) {
        if (this.viewer.entities.getById(id) !== undefined) {
            this.viewer.entities.removeById(id);
            this.allDisturb.delete(id);
            this.currentRadius.delete(id);
            this.maxRadius.delete(id);
        } else {
            console.warn("cannot find entity with id: " + id);
            return;
        }
    }

    public deleteAll() {
        for(let key of this.allDisturb.keys()) {
            this.viewer.entities.removeById(key);
        }
        this.allDisturb.clear();
        this.currentRadius.clear();
        this.maxRadius.clear();
        this.isShow = false;
    }

    public changeMaxScale(id: string, maxScale: number) {
        if(this.allDisturb.get(id) !== undefined) {
            this.maxRadius.set(id, maxScale);
        }
        else {
            this.maxRadius.set(id, maxScale);
            this.show(id);
        }
    }

    public destroy() {
        if (!this.isDestroyed) return;
        this.deleteAll();
        this.isDestroyed = true;
    }

    private changeRadius(id: string | undefined) {
        if(id === undefined) {
            return;
        }
        let cR = this.currentRadius.get(id);
        let mR = this.maxRadius.get(id);
        if (mR !== undefined && cR !== undefined) {
            cR = cR + mR / 500;
            this.currentRadius.set(id, cR);
            if (cR > mR) {
                cR = 0;
                this.currentRadius.set(id, 0);
            }
            return new Cartesian3(cR, cR, cR);
        }
    }
}