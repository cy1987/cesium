/*
 * @Author: Zhaojie Zeng
 * @Date: 2021-04-12 09:23:56
 * @LastEditors: Xin Lai
 * @LastEditTime: 2021-08-18 16:34:45
 * @Description: 一个类似于烟雾的粒子系统 参考: https://sandcastle.cesium.com/index.html?src=Particle%20System.html
 * 其中有很多部分可以进行参数化设计 使用 "!!!<可参数化>"进行了标注
 */
import { component, View, watch } from "@egova/flagwind-web";
import Cesium, {
    Viewer,
    TranslationRotationScale,
    CircleEmitter,
    Cartesian3,
    HeadingPitchRoll,
    ParticleSystem,
    Cartesian2,
    Quaternion,
    Matrix4,
    TimeIntervalCollection,
    TimeInterval,
    VelocityOrientationProperty,
    CallbackProperty,
    Math as _Math,
    SampledPositionProperty,
    Color,
    Cartographic,
    ClockRange,
    JulianDate,
    Particle
} from "cesium";
import { webSetting } from "@/settings";
import { CMap } from "./sdk/map";
import Scene from "cesium/Source/Scene/Scene";

export class MissileTracePro {

    private isDestroyed: boolean = false;
    private preUpdate!: any;

    private particle: any = undefined;
    private entityIds: Array<string> = ["missileEntityId"]; // 保存用到的实体id
    // 粒子矩阵计算
    private gravityScratch = new Cartesian3();
    private emitterModelMatrix = new Matrix4();
    private translation = new Cartesian3();
    private rotation = new Quaternion();
    private hpr = new HeadingPitchRoll();
    private trs = new TranslationRotationScale();

    // 粒子相关参数!!!<可参数化>
    private emissionRate: number = 50;
    private gravity: number = 0.0;
    private minimumParticleLife: number = 1.2;
    private maximumParticleLife: number = 20.0;
    private minimumSpeed: number = 1.0;
    private maximumSpeed: number = 4.0;
    private startScale: number = 0.8;
    private endScale: number = 1.0;
    private particleSize: number = 25.0;

    public viewer!: Viewer;

    // public cometSystems: Array<any> = [];
    public firstview: number = 0;
    public id: string = `MissileTracePro-${new Date().getTime().toString()}`;

    // Iview相关变量
    public _positionSample!: SampledPositionProperty;// 用来保存路径转折点
    public _stTime!: JulianDate;
    public _endTime!: JulianDate;
    public _modelPath!: string;
    public _position!: any;
    public _IsShowPos?: boolean;
    public _avaCollection?: TimeIntervalCollection; // 用来保存可见的时间段

    public constructor(
        public cmap: CMap,
        public positionSample: SampledPositionProperty,
        public stTime: JulianDate,
        public endTime: JulianDate,
        public isShowPos: boolean,
        public modelPath: string,
        public avaCollection: TimeIntervalCollection = null
    ) {

        // console.log(this.id);
        // cmap.addLayer(this);
        this._positionSample = positionSample;
        this._stTime = stTime;
        this._endTime = endTime;
        this._modelPath = modelPath;
        this._IsShowPos = isShowPos;
        if (avaCollection === null) {
            let intervals: Array<TimeInterval> = [
                new TimeInterval({
                    start: stTime.clone(),
                    stop: endTime.clone()
                })
            ];
            this._avaCollection = new TimeIntervalCollection(intervals);
        } else {
            this._avaCollection = avaCollection;
        }
        this.viewer = cmap.viewer as Viewer;
        this.viewer.clock.startTime = stTime.clone();
        this.viewer.clock.stopTime = endTime.clone();
        this.viewer.clock.currentTime = stTime.clone();
        this.viewer.clock.clockRange = ClockRange.LOOP_STOP; // Loop at the end
        this.viewer.clock.multiplier = 3;
        // this.cometSystems = [];
    }

    public CreateMissle() {
        // 初始化导弹模型
        let _this = this;
        let flight = this.viewer.entities.add({
            id: _this.entityIds[0], // id: "missileEntityId"
            model: {
                uri: _this._modelPath,
                scale: 14
            },
            availability: this._avaCollection,
            position: this._positionSample,
            orientation: new VelocityOrientationProperty(this._positionSample),
            label: {
                // This callback updates the length to print each frame.
                text: new CallbackProperty(function (time) {
                    // flight = this.viewer.entities.getById("missile");
                    time = <JulianDate>time;
                    let cartesian3 = flight?.position!.getValue(time);
                    if (!cartesian3) return;
                    let cartographic = Cartographic.fromCartesian(cartesian3);
                    let lat = _Math.toDegrees(cartographic.latitude);
                    let ing = _Math.toDegrees(cartographic.longitude);
                    let height = cartographic.height;
                    let pos = "经度：" + Number(ing.toFixed(2)) + " 纬度：" + Number(lat.toFixed(2)) + " 高度：" + Number(height.toFixed(2));
                    return pos;
                }, false),
                font: "bold 10pt Segoe UI Semibold",
                pixelOffset: new Cartesian2(0.0, -40),
                fillColor: Color.fromRgba(0xFFFF00FF),
                show: new CallbackProperty(function () { return _this._IsShowPos; }, false)
            }
        });
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

            lifetime: 16.0,

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
            _this.particle.modelMatrix = flight.computeModelMatrix(time, new Matrix4());
            _this.particle.emitterModelMatrix = _this.computeEmitterModelMatrix();
            // 控制粒子的显示
            if (_this._avaCollection.contains(time)) {
                _this.particle.show = true;
            } else {
                _this.particle.show = false;
            }
        };
        this.viewer.scene.preUpdate.addEventListener(this.preUpdate, this);
    }

    // 切换视角
    public changeViewType(view: String) {
        let missile = this.viewer.entities.getById(this.entityIds[0]);
        if (!missile) return;
        switch (view) {
            case "first": {
                this.firstview = 1;
                this.viewer.trackedEntity = undefined;
                break;
            }
            case "third": {
                this.viewer.trackedEntity = missile;
                this.firstview = 0;
                break;
            }
        }
    }

    public destroy() {
        if (this.isDestroyed) return;
        this.viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
        this.isDestroyed = true;
        this.delete();
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
        this.hpr = HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
        this.trs.translation = Cartesian3.fromElements(
            -30.0, // 这里需要根据模型来确定偏移量!!!<可参数化>
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