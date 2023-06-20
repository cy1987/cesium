/*
 * @Description: 一个综合雷达系统，能够自定义的创建各种类型的雷达，如锥形扫描雷达、相控阵雷达以及矩形雷达等
 * @Autor: Xin Lai
 * @Date: 2021-08-16 10:54:08
 * @LastEditors: Xin Lai
 * @LastEditTime: 2021-08-18 16:48:26
 */

import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Viewer,
    Entity,
    PolygonHierarchy,
    Cartesian3,
    ColorMaterialProperty,
    Ellipsoid,
    SampledPositionProperty,
    Scene,
    JulianDate,
    Math as _Math,
    Cartographic,
    HeadingPitchRoll,
    Color,
    Transforms,
    CallbackProperty,
    Matrix4
} from "cesium";
import ConstantProperty from "cesium/Source/DataSources/ConstantProperty";
import TimeInterval from "cesium/Source/Core/TimeInterval";

/**
 * @param show if show the radar
 * @param facecolor define the face color
 * @param scancolor define the scan color
 * @param slicecolor define the sliceline color
 * @param id the id of the entity which is radar bound to
 * @param detect if the radar has detected some targets
 * @param type the radar's type
 * @param size the radar's size
 * @param position the radar's position, this param has a lower priority than id param
 * @param slice The number of times to partition the radar into radial slices.
 * @param scanoptions the options about the scan item
 */
interface SensorOptions {
    radasid?: string;
    show?: boolean;
    facecolor?: string;
    scancolor?: string;
    slicecolor?: string;
    id?: string;
    detect?: boolean;
    type?: number;
    size?: number;
    position?: Cartesian3;
    slice?: number;
    scanoptions?: ScanOptions;
}

/**
 * @param initial_heading the scan's initial heading
 * @param scantype the type of the scan,0 - clockwise, 1 - anticlockwise 2 - reverse
 * @param scanrange the range of the radar scan,for example [60,240]
 * @param scanspeed the speed of the radar scan
 * Some special set: 1. [70,120,70,100]  the forward scanner
 * @param scanshow if the scanface show or not
 */
interface ScanOptions {
    initial_heading?: number;
    scantype?: number;
    scanrange?: any;
    scanspeed?: number;
    scanshow?: boolean;
}

/**
 * @abstract define the Headingpitchroll of the Radar
 * @param heading the heading of the radar's rotation
 * @param pitch the pitch of the radar's rotation
 * @param roll the roll of the radar's rotation
 */
interface HPR {
    heading?: number;
    pitch?: number;
    roll?: number;
}

export class Sensor {
    
    private _viewer!: Viewer;
    private preUpdate: any = undefined;
    private conePreUpdate: any = undefined;
    private positionArr: any;
    private minimumheight: any;
    private _radasid: string;
    private _show?: boolean = true;
    private _scanshow?: boolean = true;
    private _scancolor?: string = "rgba(255, 0, 0, 0.7)";
    private _facecolor?: string = "rgba(0, 0, 200, 0.2)";
    private _slicecolor?: string = "rgba(0,0,200,0.7)";
    private _id?: string;
    private _detect?: boolean;
    private _type?: number;
    private _scantype?: number = 0;
    private _scanrange?: Array<number> = [0, 360, 0, 90];
    private _position?: Cartesian3 = Cartesian3.fromDegrees(114, 30, 500);
    private _heading?: number = 0;
    private scanorder?: number = 1;
    private hpr?: HPR = { heading: 0, pitch: 0, roll: 0 };
    private _slice?: number = 16;
    private _speed: number = 100;
    private _size: number = 100;
    public sensorEntities: Map<string, Entity> = new Map<string, Entity>();
    public entity!: Cesium.Entity;
    public blueEllipse!: Cesium.Entity;
    public coneRadar!: Cesium.Entity;

    public id: string = `Sensor-${new Date().getTime().toString()}`; // layer id

    public constructor(
        public cmap: CMap,
        public options: SensorOptions = {}
    ) {
        this._viewer = cmap.viewer as Viewer;
        if (!this._viewer) {
            console.warn("雷达初始化失败");
            return;
        }
        if (options.radasid) this._radasid = options.radasid;
        if (options.show) this._show = options.show;
        if (options.scancolor) this._scancolor = options.scancolor;
        if (options.facecolor) this._facecolor = options.facecolor;
        if (options.slicecolor) this._slicecolor = options.slicecolor;
        if (options.detect) this._detect = options.detect;
        if (options.id) this._id = options.id;
        if (options.position) this._position = options.position;
        if (options.size && options.size > 0) this._size = options.size;
        if (options.slice > 0 && options.slice < 128) this._slice = options.slice;
        if (options.scanoptions.scanspeed) this._speed = options.scanoptions.scanspeed;
        if (options.scanoptions.initial_heading >= 0 && options.scanoptions.initial_heading <= 360) this._heading = options.scanoptions.initial_heading;
        if (options.scanoptions.scantype) this._scantype = options.scanoptions.scantype;
        if (options.scanoptions.scanrange) {
            for (let i = 0; i < options.scanoptions.scanrange.length; i++) {
                this._scanrange[i] = options.scanoptions.scanrange[i];
            }
        }
        if (options.scanoptions.scanshow !== undefined) this._scanshow = options.scanoptions.scanshow;
        if (options.type !== undefined) this._type = options.type;
        // cmap.addLayer(this);
        // this.initSensor();
    }

    public addToMap() {
        //
    }

    /**
     * @abstract 计算相控阵雷达扫描面各顶点的坐标
     * @param x1 中心点的经度
     * @param y1 中心点的纬度
     * @param height 中心点的高度
     * @param radius 雷达扫描的半径
     * @param heading 雷达扫描经过的角度
     * @returns 返回扫描线在圆周上的一系列坐标点
     * 首先根据heading、pitch、roll在雷达中心点上建立eastNorthUp坐标系
     * 依据heading计算出扫描线与圆周的交点，并依据该点与中心点计算出扫描线
     * 最后利用minimumCone和maximumCone参数对扫描线进行切割，得到最终的扫描线
     */
    public calcPoints(x1: number, y1: number, height: number, radius: number, heading: number) {

        let positionArr = [];
        this.minimumheight = [];
        positionArr.push(x1);
        positionArr.push(y1);
        positionArr.push(height);
        this.minimumheight.push(height);

        let hpr = HeadingPitchRoll.fromDegrees(this.hpr.heading, this.hpr.pitch, this.hpr.roll);
        let m = Transforms.headingPitchRollToFixedFrame(Cartesian3.fromDegrees(x1, y1, height), hpr, Ellipsoid.WGS84, Transforms.eastNorthUpToFixedFrame);

        for (let i = - 90; i <= 90.0; i++) {

            if (i < this._scanrange[2] - 90 || i > this._scanrange[3] - 90) continue;
            let rx = Math.cos(-i * Math.PI / 180.0) * radius * Math.cos(heading * Math.PI / 180.0);
            let ry = Math.cos(-i * Math.PI / 180.0) * radius * Math.sin(heading * Math.PI / 180.0);
            let rh = radius * Math.sin(-i * Math.PI / 180.0);

            // console.log(rx, ry);

            let translation = Cartesian3.fromElements(rx, ry, rh);

            let d = Matrix4.multiplyByPoint(m, translation, new Cartesian3());
            let c = Cartographic.fromCartesian(d);

            let _d = Matrix4.multiplyByPoint(m, translation, new Cartesian3());
            let _c = Cartographic.fromCartesian(_d);
            let lgt = _Math.toDegrees(c.longitude);
            let lat = _Math.toDegrees(c.latitude);
            // console.log(lgt + "  &  " + lat);

            positionArr.push(lgt);
            positionArr.push(lat);
            positionArr.push(c.height);
            this.minimumheight.push(_c.height);
        }
        return positionArr;
    }

    public calcPAPoints(x1: number, y1: number, height: number, radius: number, heading: number) {

        let positionArr = [];
        this.minimumheight = [];
        positionArr.push(x1);
        positionArr.push(y1);
        positionArr.push(height);
        this.minimumheight.push(height);

        let hpr = HeadingPitchRoll.fromDegrees(this.hpr.heading, this.hpr.pitch + heading, this.hpr.roll);
        let m = Transforms.headingPitchRollToFixedFrame(Cartesian3.fromDegrees(x1, y1, height), hpr, Ellipsoid.WGS84, Transforms.eastNorthUpToFixedFrame);

        for (let i = 0; i <= 180.0; i++) {

            let rx = Math.cos(i * Math.PI / 180.0) * radius;
            let ry = Math.cos(i * Math.PI / 180.0) * radius;

            // console.log(rx, ry);

            let translation = Cartesian3.fromElements(rx, ry, 0);

            let d = Matrix4.multiplyByPoint(m, translation, new Cartesian3());
            let c = Cartographic.fromCartesian(d);

            let lgt = _Math.toDegrees(c.longitude);
            let lat = _Math.toDegrees(c.latitude);
            // console.log(lgt + "  &  " + lat);

            positionArr.push(lgt);
            positionArr.push(lat);
            positionArr.push(c.height);
            this.minimumheight.push(c.height);
        }
        return positionArr;
    }

    /**
     * 根据雷达类型，初始化对应的雷达
     */
    public initSensor(ext?) {
        // to do: 雷达类型
        // console.log(this._type);
        
        // console.log("radarrinfo", ext.radarParameter.split("_"));
        if(ext) this.check(ext.radarParameter.split("_"));
        // console.log("radarrinfoo", ext.radarParameter.split("_"), ext.radarType);
        switch (ext === undefined ? this._type : Number(ext.radarType)) {
            case 1: this.RoundRadas(ext === undefined ? undefined : ext.radarParameter.split("_")); break; // 末制导雷达
            case 2: this.ConeRadas(); break; // 红外干扰
            // case 3: // 无源
            default: this.RoundRadas(ext === undefined ? undefined : ext.radarParameter.split("_")); break; // 默认末制导
        }
    }

    /**
     * @abstract 创建球体雷达
     */
    public RoundRadas(radarInfo?) {
        // 根据是否传入绑定物体id进行不同的处理
        // 若输入了合理的物体，则优先将雷达绑定在该物体上
        // 否则将雷达生成在预设的位置
        let entity = this._viewer.entities.getById(this._id);
        
        if (entity !== undefined) {
            let position = entity?.position.getValue(this._viewer.clock.currentTime);
            if (position !== undefined) {
                let strCartographic2 = Cartographic.fromCartesian(position);
                let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                let height = strCartographic2.height;
                let size = radarInfo === undefined ? this._size : Number(radarInfo[4]);
                this.positionArr = this.calcPoints(strIng2, strLat2, height, size, this._heading);
            }
            else {
                // console.log("wrong!");
                return false;
            }
        }
        else {
            let strCartographic2 = Cartographic.fromCartesian(this._position);
            let strLat2 = _Math.toDegrees(strCartographic2.latitude);
            let strIng2 = _Math.toDegrees(strCartographic2.longitude);
            let height = strCartographic2.height;
            this.positionArr = this.calcPoints(strIng2, strLat2, height, this._size, this._heading);
        }

        let _this = this;
        // 生成雷达的扫描面，主要利用Cesium的polygon接口实现
        // 要求计算出扫描面顶部各坐标以及底部各坐标
        // 显示与否、材质颜色都由回调函数动态控制
        this.entity = new Entity({
            id: "round_scan" + this._radasid,
            polygon: {
                show: new CallbackProperty(function () { return _this._show && _this._scanshow; }, false),
                hierarchy: new CallbackProperty(() => {
                    let pos = Cartesian3.fromDegreesArrayHeights(_this.positionArr);
                    return new PolygonHierarchy(pos);
                }, false),
                perPositionHeight: true,
                material: new ColorMaterialProperty(new CallbackProperty(function () {
                    return Color.fromCssColorString(_this._scancolor);
                }, false)),
                outline: true,
                outlineColor: Color.BLACK
            }
        });
        // 向组件集合中添加扫描体
        this.sensorEntities.set("round_scan" + this._radasid, this.entity);

        // 生成雷达扫描体，主要利用Cesium的ellipsoid接口实现
        // 基本上所有属性的接口都暴露出来了，可以动态的调整
        // 雷达扫描体的形状主要由minimumClock、maximumClock、minimumCone、maximumCone四个属性控制
        let positions = entity?.position;
        this.blueEllipse = new Entity({
            id: "round_body" + this._radasid,
            position: positions !== undefined ? positions : this._position,
            orientation: new CallbackProperty(function (time) {
                let pos = positions !== undefined ? positions.getValue(time) : _this._position;
                return Transforms.headingPitchRollQuaternion(
                    pos,
                    new HeadingPitchRoll(_this.hpr.heading * _Math.PI / 180.0, _this.hpr.pitch * _Math.PI / 180.0, _this.hpr.roll * _Math.PI / 180.0)
                );
            }, false),
            ellipsoid: {
                show: new CallbackProperty(function () { return _this._show; }, false),
                radii: new CallbackProperty(function () { return new Cartesian3(_this._size, _this._size, _this._size); }, false),
                minimumClock: new CallbackProperty(function () {
                    if (!_this._scanrange[0]) _this._scanrange[0] = 0;
                    let minimumClock = radarInfo === undefined ? _this._scanrange[0] : Number(radarInfo[0]);
                    return _Math.toRadians(minimumClock);
                }, false),
                maximumClock: new CallbackProperty(function () {
                    if (!_this._scanrange[1]) _this._scanrange[1] = 0;
                    let maximumClock = radarInfo === undefined ? _this._scanrange[1] : Number(radarInfo[1]);
                    return _Math.toRadians(maximumClock);
                }, false),
                minimumCone: new CallbackProperty(function () {
                    if (!_this._scanrange[2]) _this._scanrange[2] = 0;
                    let minimumCone = radarInfo === undefined ? _this._scanrange[2] : Number(radarInfo[2]);
                    return _Math.toRadians(minimumCone);
                }, false),
                maximumCone: new CallbackProperty(function () {
                    if (!_this._scanrange[3]) _this._scanrange[3] = 0;
                    let maximumCone = radarInfo === undefined ? _this._scanrange[3] : Number(radarInfo[3]);
                    return _Math.toRadians(maximumCone);
                }, false),
                innerRadii: new Cartesian3(0.1, 0.1, 0.1),
                material: new ColorMaterialProperty(new CallbackProperty(function () {
                    return Color.fromCssColorString(_this._facecolor);
                }, false)),
                outline: true,
                outlineColor: new CallbackProperty(function () {
                    return Color.fromCssColorString(_this._slicecolor);
                }, false),
                outlineWidth: 1,
                slicePartitions: new CallbackProperty(function () { return _this._slice; }, false)
            }
        });
        // 向组件集合中添加雷达体
        this.sensorEntities.set("round_body" + this._radasid, this.blueEllipse);

        let clock = this._viewer.clock;

        // 设置回调函数，主要用于雷达扫描体扫描过程的控制
        this.preUpdate = (time: any) => {

            // 扫描模式控制代码
            // 0表示逆时针，1表示顺时针，2表示往复扫描
            // 同时扫描范围的控制也是在这一部分实现
            if (this._scantype === 0) {
                if (this._viewer.clock.shouldAnimate) this._heading = (this._heading + this._speed / 300) % 360;
                if (this._heading < this._scanrange[0]) this._heading = this._scanrange[0];
                else if (this._heading >= this._scanrange[1]) this._heading = this._scanrange[0];
            }
            else if (this._scantype === 1) {
                this._heading = (this._heading - this._speed / 300) % 360;
                if (this._heading > this._scanrange[1]) this._heading = this._scanrange[1];
                else if (this._heading <= this._scanrange[0]) this._heading = this._scanrange[1];
            } else {
                if (this._viewer.clock.shouldAnimate) {
                    this._heading = (this._heading + this.scanorder * this._speed / 300) % 360;
                }
                if (this._heading > this._scanrange[1]) {
                    this._heading = this._scanrange[1];
                    this.scanorder *= -1;
                }
                else if (this._heading <= this._scanrange[0]) {
                    this._heading = this._scanrange[0];
                    this.scanorder *= -1;
                }
            }

            // 重新计算扫描体边界各点坐标
            let position = this.blueEllipse?.position.getValue(clock.currentTime);
            if (position !== undefined) {
                let strCartographic2 = Cartographic.fromCartesian(position);
                let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                _this.positionArr = _this.calcPoints(strIng2, strLat2, strCartographic2.height, this._size, this._heading);
            }

            // if(entity !== undefined) {
            //     let ori = entity.orientation.getValue(time);
            //     // console.log("heading: " + ori.heading + " pitch: " + ori.pitch + " roll: " + ori.roll);
            //     // console.log("ori: " + ori);
            // }

        };

        this._viewer.scene.preUpdate.addEventListener(this.preUpdate, this);

        this._viewer?.entities.add(this.entity);
        this.cmap.viewer?.entities.add(this.blueEllipse);
        // this.cmap.viewer?.zoomTo(this.cmap.viewer?.entities);
    }

    /**
     * @abstract 创建棱锥雷达
     */
    public ConeRadas() {
        let entity = this._viewer.entities.getById(this._id);
        let positions = entity?.position;
        let halfpositions = undefined;
        if (positions !== undefined) {
            halfpositions = this.getHalfHeight();
        }
        let _this = this;
        let height = 0;
        let scanHeight = 0;
        let sensorPosition = new SampledPositionProperty();
        let startTime = JulianDate.now();
        let stopTime: JulianDate;
        let scale = 0;
        let isScan = true;
        let showFlag = 0;

        // test
        let lng = _Math.toDegrees(Cartographic.fromCartesian(this._position).longitude);
        let lat = _Math.toDegrees(Cartographic.fromCartesian(this._position).latitude);
        let alt = Cartographic.fromCartesian(this._position).height * 2;
        let ori = new ConstantProperty(
            Transforms.headingPitchRollQuaternion(
                Cartesian3.fromDegrees(
                    lng,
                    lat,
                    alt
                ),
                new HeadingPitchRoll(_this.hpr.heading * _Math.PI / 180.0, _this.hpr.pitch * _Math.PI / 180.0, _this.hpr.roll * _Math.PI / 180.0)
            )
        );
        
        // 初始化锥形扫描雷达的起始位置
        // 这里是用固定点来初始，当雷达绑定物体时的初始化逻辑需要另当考虑
        sensorPosition.addSample(
            JulianDate.now(),
            Cartesian3.fromDegrees(
                lng,
                lat,
                alt
            )
        );

        this.coneRadar = this._viewer?.entities.add({
            id: "Cone_body" + this._radasid,
            position: sensorPosition,
            orientation: ori,
            // position: halfpositions !== undefined ? halfpositions : this._position,
            
            cylinder: {
                length: new CallbackProperty(function (time) {

                    // 此处功能逻辑分为两部分
                    // 第一是计算出扫描雷达的最高点height，也即雷达的最大长度
                    let pos: any;
                    let strCartographic3: any;
                    if (positions !== undefined) {
                        pos = positions.getValue(time);
                        if (pos !== undefined) {
                            strCartographic3 = Cartographic.fromCartesian(pos);
                            height = strCartographic3.height;
                        }
                    }
                    else height = Cartographic.fromCartesian(_this._position).height * 2;
                    
                    // 这一部分即动态返回锥形扫描雷达的长度，以实现扫描体自上而下拓展扫描的效果
                    // 这里根据雷达中心的实际位置来计算出雷达的长度
                    // 这样能够保证雷达长度与雷达位置的对应，同时还更新了雷达的scale，来保证尺寸也是一致的
                    let tempos = sensorPosition.getValue(time);
                    if(tempos && _this._scanshow)
                    {
                        let tempHeight = Cartographic.fromCartesian(tempos).height;
                        scale = (height - tempHeight) * 2 / height;
                        return (height - tempHeight) * 2;
                    }
                    return height;
                }, false),

                topRadius: 0.0,
                bottomRadius: new CallbackProperty(function (time: any) {
                    // 底部圆的半径由参数scale控制，从而保证雷达中心、雷达尺寸、雷达高度都是对应的
                    let tempos = sensorPosition.getValue(time);
                    if(tempos && _this._scanshow)
                    {
                        return  _this._size * scale;
                    }
                    return _this._scanshow === true ? _this._size * scanHeight / height :  _this._size;
                }, false),
                material: new ColorMaterialProperty(new CallbackProperty(function () {
                    return Color.fromCssColorString(_this._facecolor);
                }, false)),
                show: new CallbackProperty(function () {
                    return _this._show ? showFlag === 0 ? true : false : false;
                }, false)
            }
        });

        // 这一部分是动态雷达的控制逻辑
        // 不断更新雷达的中心位置、雷达的扫描高度（即length）以及雷达的偏转角
        this.conePreUpdate = (scene: Scene, time: JulianDate) => {

            scanHeight += _this._speed / 10;
            if(scanHeight > height)
            {
                scanHeight = 0;
            }

            let position = halfpositions !== undefined ? halfpositions : _this._position;
            let lng = _Math.toDegrees(Cartographic.fromCartesian(position).longitude);
            let lat = _Math.toDegrees(Cartographic.fromCartesian(position).latitude);
            
            let currentPosition = Cartesian3.fromDegrees(
                lng,
                lat,
                height - scanHeight / 2
            );
            if(_this._scanshow) {
                sensorPosition.addSample(
                    JulianDate.now(),
                    currentPosition
                );
                isScan = true;
            }
            else {
                if(isScan) {
                    stopTime = JulianDate.addSeconds(JulianDate.now(), 2, new JulianDate());
                
                    let timeInterval = new TimeInterval({
                        start: startTime,
                        stop: stopTime,
                        isStartIncluded: true,
                        isStopIncluded: true
                    });

                    sensorPosition.removeSamples(timeInterval);
                    startTime = JulianDate.now();
                    isScan = false;
                    showFlag++;
                    sensorPosition.addSample(
                        time,
                        this._position
                    );

                }
                
                sensorPosition.addSample(
                    JulianDate.now(),
                    this._position
                );
                if(!showFlag || showFlag >= 50) showFlag = 0;
                else showFlag++;
            }
            
            let newOri = new ConstantProperty(
                Transforms.headingPitchRollQuaternion(
                    currentPosition,
                    new HeadingPitchRoll(_this.hpr.heading * _Math.PI / 180.0, _this.hpr.pitch * _Math.PI / 180.0, _this.hpr.roll * _Math.PI / 180.0)
                )
            );
            _this.coneRadar.orientation = newOri;
        };
        this._viewer.scene.preUpdate.addEventListener(this.conePreUpdate, this);

        this.sensorEntities.set("Cone_body" + this._radasid, this.coneRadar);

    }

    /**
     * 清除系统中所有的物体，若包含回调函数则删除
     */
    public onClear() {
        
        this.blueEllipse = undefined;
        this.coneRadar = undefined;
        for (let tmpID of this.sensorEntities.keys()) {
            this._viewer?.entities.removeById(tmpID);
        }
        this.sensorEntities.clear();
        if (this.preUpdate) {
            this._viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
        }
        if (this.conePreUpdate) {
            this._viewer.scene.preUpdate.removeEventListener(this.conePreUpdate, this);
        }

    }

    public destroy() {
        // auto call destroy when the removelayer is called
        this.onClear();
    }

    public delete() {
        // auto call destroy when the removelayer is called
        this.onClear();
    }
    /**
     * @abstract 得到雷达绑定的物体一半高度的运动轨迹，主要用于圆锥型雷达的定位
     */
    public getHalfHeight() {
        // 搜索雷达绑定的物体，得到它的位置信息以及运动起止时间
        let entity = this._viewer.entities.getById(this._id);
        let positions = entity?.position;
        let halfPositions = new SampledPositionProperty();
        let start = entity?.availability?.start;
        let end = entity?.availability?.stop;
        if (start !== undefined && end !== undefined) {
            // 根据起止时间以及运动位置，选择100个点进行插值重新计算出圆锥雷达的位置
            let timeOffset = JulianDate.secondsDifference(
                end,
                start
            );
            let step = timeOffset / 100.0;
            for (let i = 0; i <= timeOffset; i += step) {
                let radians = _Math.toRadians(i);
                let time = JulianDate.addSeconds(
                    start,
                    i,
                    new JulianDate()
                );
                let pos: any;
                if (positions !== undefined) {
                    pos = positions.getValue(time);
                }
                let strCartographic2 = Cartographic.fromCartesian(pos);
                let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                let strheight2 = strCartographic2.height / 2;
                pos = Cartesian3.fromDegrees(strIng2, strLat2, strheight2);
                halfPositions.addSample(time, pos);
            }
            return halfPositions;
        }
        return undefined;
    }

    public changeSensor() {
        this.onClear();
        this.initSensor();
    }

    /**
     * @abstract 修改雷达扫描面的扫描速度
     * @param speed 扫描速度
     */
    public changeSpeed(speed: number) {
        this._speed = speed;
    }

    /**
     * @abstract 修改雷达的大小
     * @param size 雷达半径
     */
    public changeSize(size: number) {
        if (size > 0) {
            this._size = size;
        }

    }

    /**
     * @abstract 修改雷达类型
     * @param type：0-扫描雷达，1-锥型雷达
     */
    public changeRadarType(type: number) {
        this._type = type;
        this.destroy();
        this.initSensor();
    }

    /**
     * @abstract 修改雷达扫描模式
     * @param type：0-顺时针扫描，1-逆时针扫描，2-往返扫描
     */
    public changeScanType(type: number) {
        this._scantype = type;
    }

    /**
     * @abstract 调整雷达体的朝向
     * @param hpr-heading、pitch、roll
     */
    public changeHeadingpitchroll(hpr: HPR) {
        this.hpr = hpr;
    }

    /**
     * @abstract 调整雷达扫描的范围
     * @param range[0]-minimumClock
     * @param range[1]-maximumClock
     * @param range[2]-minimumCone
     * @param range[3]-maximumCone
     * restrict:minimumClock < maximumClock && minimumCone < maximumCone
     */
    public changeScanrange(range: any) {
        // when minimumcone == maximumcone == 180 , it will turn to error!
        if (range[0] >= range[1] || range[2] >= range[3]) {
            console.warn("雷达扫描范围不符合要求");
            return;
        }
        this._scanrange = range;
    }

    /**
     * @abstract 控制雷达的显示
     * @param scanshow 扫描面的显示
     * @param isShow 整体雷达的显示
     */
    public show(isShow: boolean, scanshow: boolean) {
        this._show = isShow;
        this._scanshow = scanshow;
    }

    /**
     * @abstract 控制雷达区域的划分
     * @param slice 雷达切片数
     */
    public changeslice(slice: number) {
        if (slice >= 8) {
            this._slice = slice;
        }
        else {
            console.warn("雷达切片数至少为8");
            return;
        }
    }

    /**
     * @abstract 控制雷达区域的划分
     * @param slice 雷达切片数
     */
    public changecolor(bodycolor: any, scancolor: any, slicecolor: any) {
        if (Color.fromCssColorString(bodycolor)) this._facecolor = bodycolor;
        if (Color.fromCssColorString(scancolor)) this._scancolor = scancolor;
        if (Color.fromCssColorString(slicecolor)) this._slicecolor = slicecolor;
    }

    /**
     * 检查提供的雷达参数是否合理
     */
    public check(radarInfo?) {

        let minimumClock = radarInfo === undefined ? this._scanrange[0] : Number(radarInfo[0]);
        let maximumClock = radarInfo === undefined ? this._scanrange[1] : Number(radarInfo[1]);
        let minimumCone = radarInfo === undefined ? this._scanrange[2] : Number(radarInfo[2]);
        let maximumCone = radarInfo === undefined ? this._scanrange[3] : Number(radarInfo[3]);

        if (Color.fromCssColorString(this._facecolor) === undefined) {
            console.error("输入的雷达体颜色不规范!");
            return;
        }
        if (Color.fromCssColorString(this._scancolor) === undefined) {
            console.error("输入的扫描体颜色不规范!");
            return;
        }
        if (Color.fromCssColorString(this._slicecolor) === undefined) {
            console.error("输入的划分线颜色不规范!");
            return;
        }
        if (minimumClock >= maximumClock || minimumCone >= maximumCone) {
            console.error("scanrange[0] 必须小于 scanrange[1]；scanrange[2] 必须小于 scanrange[3]!");
            return;
        }
        if (minimumClock < -180 || maximumClock > 180 || minimumCone < 0 || maximumCone > 180) {
            console.error("0 <= scanrange[0] <= scanrange[1] <=360 && 0 <= scanrange[2] <= scanrange[3] <=180");
            return;
        }
        if (this._scantype !== 0 && this._scantype !== 1 && this._scantype !== 2) {
            console.error("不存在的扫描模式，0-逆时针 1-顺时针 2-往复扫描");
            return;
        }
        if (!this._position) {
            console.error("错误的位置信息，请输入标准Cartesian3坐标");
            return;
        }
    }

}