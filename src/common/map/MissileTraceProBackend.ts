/*
 * @Author: Zhaojie Zeng
 * @Date: 2021-04-12 09:23:56
 * @LastEditors: Xin Lai
 * @LastEditTime: 2021-08-18 16:36:03
 * @Description: 一个类似于烟雾的粒子系统 参考: https://sandcastle.cesium.com/index.html?src=Particle%20System.html
 * 其中有很多部分可以进行参数化设计 使用 "!!!<可参数化>"进行了标注
 */
import { component, View, watch } from "@egova/flagwind-web";
import Cesium, {
    Viewer,
    Entity,
    TranslationRotationScale,
    CircleEmitter,
    Cartesian3,
    HeadingPitchRoll,
    ParticleSystem,
    Cartesian2,
    Quaternion,
    Matrix4,
    Math as _Math,
    Color,
    JulianDate,
    Particle
} from "cesium";
import { webSetting } from "@/settings";
import { CMap } from "./sdk/map";
import Scene from "cesium/Source/Scene/Scene";

export class MissileTraceProBackend {

    private isDestroyed: boolean = false;
    private preUpdate!: any;

    private entityIds: Array<string> = ["missileEntityId"]; // 保存用到的实体id
    // 粒子矩阵计算
    private gravityScratch = new Cartesian3();
    private emitterModelMatrix = new Matrix4();
    private translation = new Cartesian3();
    private rotation = new Quaternion();
    private hpr = new HeadingPitchRoll();
    private trs = new TranslationRotationScale();

    public particle: any = undefined;
    public viewer!: Viewer;

    // public cometSystems: Array<any> = [];
    public firstview: number = 0;
    public id: string = `MissileTracePro-${new Date().getTime().toString()}`;

    // Iview相关变量
    public _IsShowPos?: boolean;

    public constructor(
        public cmap: CMap,
        public isShowPos: boolean,
        public emissionRate: number = 75,
        public gravity: number = 0.0,
        public minimumParticleLife: number = 1.2,
        public maximumParticleLife: number = 15.,
        public minimumSpeed: number = 0.5,
        public maximumSpeed: number = 2,
        public startScale: number = 0.2,
        public endScale: number = 0.5,
        public particleSize: number = 25.0
    ) {

        this._IsShowPos = isShowPos;
        this.viewer = cmap.viewer as Viewer;
    }

    public CreateMissle(missile: Entity) {
        // 初始化导弹模型
        let _this = this;
        this.entityIds = ["missileEntityId"];
        // 初始化尾焰
        this.particle = this.viewer.scene.primitives.add(new ParticleSystem({
            image: `${webSetting.assetsUrl}/image/smoke.png`,
            startColor: Color.WHITE.withAlpha(0.9),
            endColor: Color.WHITE.withAlpha(0.0),

            startScale: _this.startScale,
            endScale: _this.endScale,

            minimumParticleLife: _this.minimumParticleLife,
            maximumParticleLife: _this.maximumParticleLife,

            minimumSpeed: _this.minimumSpeed,
            maximumSpeed: _this.maximumSpeed,

            imageSize: new Cartesian2(
                _this.particleSize,
                _this.particleSize
            ),

            emissionRate: _this.emissionRate,

            lifetime: 8.0,

            emitter: new CircleEmitter(2.0),

            emitterModelMatrix: _this.computeEmitterModelMatrix(),

            updateCallback: (particle: Particle, dt: number) => {
                let position = particle.position;

                Cartesian3.normalize(position, _this.gravityScratch);
                Cartesian3.multiplyByScalar(
                    _this.gravityScratch,
                    _this.gravity * dt,
                    _this.gravityScratch
                );

                particle.velocity = Cartesian3.add(
                    particle.velocity,
                    _this.gravityScratch,
                    particle.velocity
                );
            }
        }));
        this.preUpdate = (scene: Scene, time: JulianDate) => {
            let mM = missile.computeModelMatrix(time, new Matrix4());
            if(mM === undefined) return;
            _this.particle.modelMatrix = mM;
            _this.particle.emitterModelMatrix = _this.computeEmitterModelMatrix();
            _this.particle.show = true;
            _this.particle.startScale = Math.max(0.4 - this.viewer.camera.position.z / 6000,0.1);
            _this.particle.endScale = Math.max(0.6 - this.viewer.camera.position.z / 6000,0.25);
            // 控制粒子的显示
            // if (_this._avaCollection.contains(time)) {
            //     _this.particle.show = true;
            // } else {
            //     _this.particle.show = true;
            // }
        };
        this.viewer.scene.preUpdate.addEventListener(this.preUpdate, this);
        this.isDestroyed = false;
    }

    public destroy() {
        if (this.isDestroyed) return;
        if(this.preUpdate) this.viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
        this.isDestroyed = true;
        this.delete();
        this.particle = undefined;
    }

    // 删除所有实体和粒子特效
    public delete() {
        if (this.particle !== undefined && !this.particle.isDestroyed()) {
            this.viewer.scene.primitives.remove(this.particle);
            // this.particle.destroy();
        }
        // 删除尾迹的火箭对象
        this.viewer.entities.removeById(this.entityIds[0]);
    }

    // 计算一个相关矩阵
    private computeEmitterModelMatrix() {
        this.hpr = HeadingPitchRoll.fromDegrees(0.0, 90.0, 0.0, this.hpr);
        this.trs.translation = Cartesian3.fromElements(
            -5.0, // 这里需要根据模型来确定偏移量!!!<可参数化>
            0.0,
            0.0,
            this.translation
        );
        this.trs.rotation = Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

        return Matrix4.fromTranslationRotationScale(
            this.trs,
            this.emitterModelMatrix
        );
    }
    // 
}