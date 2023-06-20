import { merge } from "lodash";

import Cesium, {
    Entity,
    Cartesian3,
    Math as _Math,
    Color,
    ParticleSystem,
    Cartesian2,
    Transforms,
    TranslationRotationScale,
    Matrix4,
    defined,
    JulianDate,
    Matrix3,
    ParticleEmitter
} from "cesium";
import { CMap } from "./sdk/map";

interface IParticleOptions {
    image?: string;
    startColor?: Color;// The color of the particle at the beginning of its life.
    endColor?: Color;
    startScale?: number;// The initial scale to apply to the image of the particle at the beginning of its life.
    endScale?: number;
    minimumParticleLife?: number;// 设定粒子寿命可能持续时间的最小限值(以秒为单位)，在此限值之上将随机选择粒子的实际寿命。
    maximumParticleLife?: number;
    minimumSpeed?: number;// Sets the minimum bound in meters per second above which a particle's actual speed will be randomly chosen.
    maximumSpeed?: number;
    imageSize?: Cartesian2;
    emissionRate?: number;// Particles per second.
    lifetime?: number;// How long the particle system will emit particles, in seconds.
    emitter?: ParticleEmitter;// cesium内置的发射器
    [index: string]: any;// 其它参数见cesium文档
}
// 管理所有entity的粒子效果
export class ParticleManager {
    private isDestroyed: boolean = false;
    public id: string = `ParticleManager-${new Date().getTime().toString()}`; // 暴露出id供外面cmap删除用
    public map!: Cesium.Viewer;

    public data: Map<Entity, Particles> = new Map<Entity, Particles>();

    public isShow: boolean = true;

    public constructor(
        public cmap: CMap,
        entities: Array<Entity>
    ) {
        if (!cmap.viewer) {
            console.warn("粒子系统初始化失败");
            return;
        }
        this.map = this.cmap.viewer as Cesium.Viewer;
        
        this.addEntities(entities);
        
        cmap.addLayer(this);
    }

    public addToMap() {
        //
    }

    public addEntities(entities: Array<Entity>) {
        entities.forEach(entity => {
            this.setEntity(entity);
        });
    }

    public addParticleOnEntity(entity: Entity, id: string, translationRotationScale: TranslationRotationScale, options: IParticleOptions = {}) {
        if (!this.data.has(entity)) {
            this.setEntity(entity);
        }

        let p = this.data.get(entity);
        p?.add(id, translationRotationScale, options);
    }

    public addParticleOnAllEntity(id: string, translationRotationScale: TranslationRotationScale, options: IParticleOptions = {}) {
        this.data.forEach(p => {
            p?.add(id, translationRotationScale, options);
        });
    }

    public clear(entity?: Entity) {
        if (entity) {
            if(this.data.has(entity)) {
                this.data.get(entity)?.clear();
                this.data.delete(entity);
            }
        }
        else {
            this.data.forEach(p => p.clear());
            this.data.clear();
        }
    }

    public hide() {
        if (!this.isShow) return this;
        for(let p of this.data.values()) {
            p.hide();
        }
        this.isShow = false;
    }

    public show() {
        if (this.isShow) return this;
        for(let p of this.data.values()) {
            p.show();
        }
        this.isShow = true;
    }

    public destroy() {
        if (this.isDestroyed) return;
        this.clear();
        this.isDestroyed = true;
        // 这里如果加removeLayer的话会循环调用
        // this.cmap.removeLayer(this.id);
    }

    private setEntity(entity: Entity) {
        let p = new Particles(this.map, entity);
        this.data.set(entity, p);
    }

}

// 单个entity上的粒子系统
export class Particles {

    // private data: Array<Cesium.ParticleSystem> = [];
    private data: Map<string, Cesium.ParticleSystem> = new Map<string, Cesium.ParticleSystem>();

    public isShow: boolean = true;

    public constructor(
        public map: Cesium.Viewer,
        public entity: Entity,
        public options: IParticleOptions = {}
    ) {
        if (!map) {
            console.warn("粒子系统初始化失败");
            return;
        }
    }
    public add(id: string, translationRotationScale: TranslationRotationScale, options: IParticleOptions = {}) {
        if (!options || !this.map) return this;
        const _options: IParticleOptions = merge({}, this.options, options);
        if (!this.checkOptions(_options)) return;
        this.clear(id);
        const particle = new ParticleSystem({ ..._options,
                                              modelMatrix: this.computeModelMatrix(this.entity, this.map.clock.currentTime),
                                              emitterModelMatrix: this.computeEmitterModelMatrix(translationRotationScale)
                                            });
        this.map.scene.primitives.add(particle);
        this.data.set(id, particle);

        this.show();
        return this;
    }

    public clear(id?: string) {
        if (id) {
            if(this.data.has(id)) {
                this.map.scene.primitives.remove(this.data.get(id));
                this.data.delete(id);
            }
        }
        else {
            this.data.forEach(value => this.map.scene.primitives.remove(value));
            this.data.clear();
        }
    }

    public hide() {
        if (!this.isShow) return this;
        for(let value of this.data.values()) {
            value.show = false;
        }
        this.isShow = false;
    }

    public show() {
        if (this.isShow) return this;
        for(let value of this.data.values()) {
            value.show = true;
        }
        this.isShow = true;
    }

    public computeEmitterModelMatrix(trs: TranslationRotationScale) {
        return Matrix4.fromTranslationRotationScale(trs);
    }

    private computeModelMatrix(entity: Entity, time: JulianDate = JulianDate.now()) {
        let position = entity.position?.getValue(time);
        if (!defined(position)) {
            return undefined;
        }
        else {
            let orientation = entity.orientation?.getValue(time);
            if (!defined(orientation)) {
                let modelMatrix = Transforms.eastNorthUpToFixedFrame(<Cartesian3>position);
                return modelMatrix;
            } else {
                let modelMatrix = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, new Matrix3()), position, new Matrix4());
                return modelMatrix;
            }
        }
    }

    private checkOptions(options: IParticleOptions) {
        if (!options.image) {
            console.warn("图片错误", options);
            return false;
        }
        return true;
    }
}