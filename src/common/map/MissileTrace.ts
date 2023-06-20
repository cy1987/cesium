import { component, View, watch } from "@egova/flagwind-web";
import Cesium, {
  Viewer,
  Entity,
  TranslationRotationScale,
  PrimitiveCollection,
  CircleEmitter,
  Cartesian3,
  HeadingPitchRange,
  HeadingPitchRoll,
  Ellipsoid,
  ParticleSystem,
  Transforms,
  Cartesian2,
  Quaternion,
  Matrix4,
  TimeIntervalCollection,
  TimeInterval,
  VelocityOrientationProperty,
  PolylineGlowMaterialProperty,
  CallbackProperty,
  ArcGisMapServerImageryProvider,
  createWorldTerrain,
  Math as _Math,
  SampledPositionProperty,
  Color,
  Cartographic,
  ClockRange,
  JulianDate,
  Ion,
  SampledProperty,
  Property,
  Clock,
  Scene,
  Cartesian4
} from "cesium";
import { webSetting } from "@/settings";
import { first, map } from "lodash";
import { CMap } from "./sdk/map";

interface IComplicatedFlightOptions {
  stPos?: Cartesian3;
  endPos?: Cartesian3;
  stTime?: JulianDate;
  endTime?: JulianDate;
  timeOfResolution?: number;
  modelPath?: string;
  IsShowWall?: boolean;
  IsShowPos?: boolean;
}

export class MissileTrace {

  private isDestroyed: boolean = false;
  private preUpdate!: any;

  public viewer!: Viewer;
  public matrix4Scratch = new Matrix4();
  public scratchAngleForOffset = 0.0;
  public scratchOffset = new Cartesian3();
  public imageSize = new Cartesian2(20.0, 20.0);
  public scratchCartesian3 = new Cartesian3();
  public scratchCartographic = new Cartographic();
  public particleCanvas: any;
  public particlesModelMatrix: any;
  public translationOfPlane: any;
  public translationOffset: any;
  public rocketSystems: Array<any> = [];
  // public cometSystems: Array<any> = [];
  public firstview: number = 0;
  public id: string = `MissileTrace-${new Date().getTime().toString()}`;

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
    this.rocketSystems = [];
    // this.cometSystems = [];
  }

  // public addToMap() {
  //   //
  // }

  public CreateMissle() {
    // 获取最开始的位置
    let startPos = this._positionSample.getValue(this._stTime);

    let particlesOffset = new Cartesian3(
      -20.950115473940969,
      85.852766731753945,
      -75.235411095432937
    );
    // 这个地方
    let _this = this;
    let flight = this.viewer.entities.add({
      id: "missile",
      model: {
        uri: _this._modelPath,
        scale: 3.5
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
        // show: new CallbackProperty(function () { return false; }, false)
      }
    });

    // creating particles model matrix
    this.translationOffset = Matrix4.fromTranslation(
      particlesOffset,
      new Matrix4()
    );
    this.translationOfPlane = Matrix4.fromTranslation(
      startPos,
      new Matrix4()
    );

    this.particlesModelMatrix = Matrix4.multiplyTransformation(
      this.translationOfPlane,
      this.translationOffset,
      new Matrix4()
    );

    // creating the particle systems
    let rocketOptions = {
      numberOfSystems: 50.0,
      iterationOffset: 0.1,
      cartographicStep: 0.000001,
      baseRadius: 0.0005,

      colorOptions: [
        {
          minimumRed: 1.0,
          green: 0.5,
          minimumBlue: 0.05,
          alpha: 1.0
        },
        {
          red: 0.9,
          minimumGreen: 0.6,
          minimumBlue: 0.01,
          alpha: 1.0
        },
        {
          red: 0.8,
          green: 0.05,
          minimumBlue: 0.09,
          alpha: 1.0
        },
        {
          minimumRed: 1,
          minimumGreen: 0.05,
          blue: 0.09,
          alpha: 1.0
        }
      ]
    };

    // let cometOptions = {
    //   numberOfSystems: 100.0,
    //   iterationOffset: 0.003,
    //   cartographicStep: 0.0000001,
    //   baseRadius: 0.0005,

    //   colorOptions: [
    //     {
    //       red: 0.6,
    //       green: 0.6,
    //       blue: 0.6,
    //       alpha: 1.0
    //     },
    //     {
    //       red: 0.6,
    //       green: 0.6,
    //       blue: 0.9,
    //       alpha: 0.9
    //     },
    //     {
    //       red: 0.5,
    //       green: 0.5,
    //       blue: 0.7,
    //       alpha: 0.5
    //     }
    //   ]
    // };

    // let rocketSystems: Array<never> = [];
    // let cometSystems: Array<never> = [];
    this.createParticleSystems(rocketOptions, this.rocketSystems);
    // this.createParticleSystems(cometOptions, this.cometSystems);

    // toolbar elements
    // function showAll(systemsArray: any, show: boolean) {
    //   let length = systemsArray.length;
    //   for (let i = 0; i < length; ++i) {
    //     systemsArray[i].show = show;
    //   }
    // }

    // this.showPartical(true);
    // showAll(this.rocketSystems, true);
    // showAll(this.cometSystems, false);
    // this.resetCamera(cameraLocation);

    let positions = this.viewer.entities.getById("missile")?.position;

    // let translationOffset = this.translationOffset;
    // let _this = this;

    this.preUpdate = (scene: Scene, time: any) => {
      let POS = positions?.getValue(time);
      let ORI = this.viewer.entities.getById("missile")?.orientation?.getValue(time);
      if (POS !== undefined && ORI !== undefined) {
        let particlesModelMatrix = this.viewer.entities.getById("missile")?.computeModelMatrix(time, new Matrix4());

        function ChangePos(systemsArray: any, particlesModelMatrix: Matrix4) {
          let length = systemsArray.length;
          for (let i = 0; i < length; ++i) {
            systemsArray[i].modelMatrix = particlesModelMatrix;
          }
        }
        if (particlesModelMatrix) {
          ChangePos(this.rocketSystems, particlesModelMatrix);
          // ChangePos(this.cometSystems, particlesModelMatrix);
        }
        let cameraLocation = Cartesian3.add(
          POS,
          particlesOffset,
          new Cartesian3()
        );

        if (this.firstview === 1 && this.viewer) {
          let cartesian3 = this.viewer.entities.getById("missile")?.position!.getValue(this.viewer.clock.currentTime);
          let offsetMatrix4 = this.computeEmitterModelMatrix(-100, 0, 0);
          let des = new Matrix4();
          Matrix4.multiplyTransformation(offsetMatrix4, particlesModelMatrix, des);

          if (cartesian3 !== undefined) {
            let heading = _Math.toRadians(0.0);
            let pitch = _Math.toRadians(0.0);
            let range = -150.0;
            let hpr = new HeadingPitchRange(heading, pitch, range);
            // this.viewer?.camera.setView({ destination: des, orientation: ORI });
            this.viewer?.camera.lookAtTransform(des, hpr);
          }
        }
      }

      if (this._avaCollection.contains(time)) {
        this.showPartical(true);
      } else {
        this.showPartical(false);
      }

    };
    this.viewer.scene.preUpdate.addEventListener(this.preUpdate, this);
  }

  // 控制是否展示粒子
  public showPartical(show: boolean) {
    for (let i = 0; i < this.rocketSystems.length; ++i) {
      this.rocketSystems[i].show = show;
    }
  }
  // 设置镜头
  public resetCamera(cameraLocation: Cartesian3) {
    this.viewer.camera.lookAt(
      cameraLocation,
      new Cartesian3(-1800, -1200, 200)
    );
  }

  // 切换视角
  public changeViewType(view: String) {
    let missile = this.viewer.entities.getById("missile");
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
    // this.viewer.clock.shouldAnimate = false;
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
    this.showPartical(false);
    this.isDestroyed = true;
    this.delete();
    // this.cometSystems = [];
  }

  // 删除所有实体和粒子特效
  public delete() {
    for (let i = 0; i < this.viewer.scene.primitives.length; i++) {
      const item = this.viewer.scene.primitives.get(i);
      if (item instanceof PrimitiveCollection) continue;
      this.viewer.scene.primitives.remove(item);
      // if (!ele.destroyPrimitives) this.viewer.scene.primitives.remove(ele);
    }
    // this.viewer.entities.removeAll();
    // 删除尾迹的火箭对象
    this.viewer.entities.removeById("missile");
    this.showPartical(false);
    this.rocketSystems = [];
  }

  // 计算一个相关矩阵
  private computeEmitterModelMatrix(heading: any, pitch: any, roll: any) {
    let emitterModelMatrix = new Matrix4();
    let translation = new Cartesian3();
    let rotation = new Quaternion();
    let trs = new TranslationRotationScale();
    let hpr = new HeadingPitchRoll();
    HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, hpr);
    trs.translation = Cartesian3.fromElements(heading, pitch, roll, translation);
    trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, rotation);
    return Matrix4.fromTranslationRotationScale(trs, emitterModelMatrix);
  }
  
  // 创建一个粒子系统
  private createParticleSystems(options: any, systemsArray: any) {
    let forceFunction = (options: any, iteration: any) => {
      let scratchCartesian3 = this.scratchCartesian3;
      let scratchCartographic = this.scratchCartographic;
      return function (particle: any, dt: any) {
        dt = _Math.clamp(dt, 0.0, 0.05);
  
        scratchCartesian3 = Cartesian3.normalize(
          particle.position,
          new Cartesian3()
        );
  
        scratchCartesian3 = Cartesian3.multiplyByScalar(
          scratchCartesian3,
          -40.0 * dt,
          scratchCartesian3
        );
  
        scratchCartesian3 = Cartesian3.add(
          particle.position,
          scratchCartesian3,
          scratchCartesian3
        );
  
        scratchCartographic = Cartographic.fromCartesian(
          scratchCartesian3,
          Ellipsoid.WGS84,
          scratchCartographic
        );
  
        let angle =
          (_Math.PI * 2.0 * iteration) / options.numberOfSystems;
        iteration += options.iterationOffset;
        scratchCartographic.longitude +=
          Math.cos(angle) * options.cartographicStep * 30.0 * dt;
        scratchCartographic.latitude +=
          Math.sin(angle) * options.cartographicStep * 30.0 * dt;
  
        particle.position = Cartographic.toCartesian(
          scratchCartographic
        );
      };
    };

    let getImage = () => {
      if (!this.particleCanvas) {
        this.particleCanvas = document.createElement("canvas");
        this.particleCanvas.width = 20;
        this.particleCanvas.height = 20;
        let context2D = this.particleCanvas.getContext("2d");
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, _Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = "rgb(255, 255, 255)";
        context2D.fill();
      }
      return this.particleCanvas;
    };

    let length = options.numberOfSystems;
    for (let i = 0; i < length; ++i) {
      this.scratchAngleForOffset =
        (Math.PI * 2.0 * i) / options.numberOfSystems;
      this.scratchOffset.x +=
        options.baseRadius * Math.cos(this.scratchAngleForOffset);
      this.scratchOffset.y +=
        options.baseRadius * Math.sin(this.scratchAngleForOffset);

      let emitterModelMatrix = Matrix4.fromTranslation(
        this.scratchOffset,
        this.matrix4Scratch
      );
      let color = Color.fromRandom(
        options.colorOptions[i % options.colorOptions.length]
      );
      let force = forceFunction(options, i);

      let item = this.viewer.scene.primitives.add(
        new ParticleSystem({
          image: getImage(),
          startColor: color,
          endColor: color.withAlpha(0.1),
          particleLife: 1.5,
          speed: 3.0,
          startScale: 1.0,
          endScale: 0.4,
          imageSize: this.imageSize,
          emissionRate: 30.0,
          emitter: new CircleEmitter(0.1),
          lifetime: 0.1,
          // updateCallback: force,
          modelMatrix: this.particlesModelMatrix,
          emitterModelMatrix: this.computeEmitterModelMatrix(-120, 0, 0)
        })
      );
      systemsArray.push(item);
    }
  }
}