/*
 * @Description: 创建一段静态物体运动轨迹
 * @Autor: Xin Lai
 * @Date: 2021-08-10 11:14:48
 * @LastEditors: Xin Lai
 * @LastEditTime: 2021-08-18 16:21:25
 */
import { component, View, watch } from "@egova/flagwind-web";
import Cesium, {
    Viewer,
    Entity,
    Scene,
    Cartesian2,
    Cartesian3,
    TimeIntervalCollection,
    TimeInterval,
    VelocityOrientationProperty,
    DistanceDisplayCondition,
    PolylineGlowMaterialProperty,
    CallbackProperty,
    Math as _Math,
    SampledPositionProperty,
    Color,
    Cartographic,
    ClockRange,
    JulianDate,
    EventHelper,
    Clock
} from "cesium";
import { webSetting } from "@/settings";
import { first, map } from "lodash";
import PolylineTrailLinkMaterialProperty from "@/components/DynamicWire/PolylineTrailLinkMaterialProperty.js";
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

export class ComplicatedFlight {

    private isDestroyed: boolean = false;
    private preUpdate: any = undefined;
    public viewer!: Viewer;

    // 相关信息控制开关
    public _IsShowWall?: boolean;
    public _IsShowPos?: boolean;
    public _IsShowRadia?: boolean;
    public _IsShowDataLine?: boolean;
    public _IsShowFlightId?: boolean;

    // 飞行轨迹初始化信息
    public _stPos!: Cartesian3;
    public _endPos!: Cartesian3;
    public _stTime!: JulianDate;
    public _endTime!: JulianDate;
    public _modelPath!: string;
    public _position!: any;

    public vehicleEntity!: Entity | undefined;

    public isLoad: boolean = false;
    public wallpositions: any;
    public percent: number = 0;
    public lgt: number = 0;
    public lat: number = 0;
    public height: number = 0;
    public time: string = "";
    public firstview: number = 2;
    public wallEntities = new Map();
    public entities: Array<string> = [];
    public id: string = `ComplicatedFlight-${new Date().getTime().toString()}`;

    /**
     * adding a entity running or flying
     * [stPos            : Cartesian3 ] - start position
     * [endPos           : Cartesian3 ] - end position
     * [stTime           : JulianDate ] - start time
     * [endTime          : JulianDate ] - end time
     * [isShowWall       : boolean    ] - if show the moving trece wall
     * [isShowPos        : boolean    ] - if show the entity's position information
     * [modelPath        : string     ] - the entity model need to load
     */
    public constructor(
        public cmap: CMap,
        public stPos: Cartesian3,
        public endPos: Cartesian3,
        public stTime: JulianDate,
        public endTime: JulianDate,
        public isShowWall: boolean,
        public isShowPos: boolean,
        public modelPath: string
    ) {

        this._stPos = stPos;
        this._endPos = endPos;
        this._stTime = stTime;
        this._endTime = endTime;
        this._modelPath = modelPath;
        this._IsShowWall = isShowWall;
        this._IsShowPos = isShowPos;
        this._IsShowRadia = true;
        this._IsShowDataLine = true;
        this._IsShowFlightId = false;

        // 初始化地图设置
        // cmap.addLayer(this);
        this.viewer = cmap.viewer as Viewer;
        this.viewer.clock.startTime = stTime.clone();
        this.viewer.clock.stopTime = endTime.clone();
        this.viewer.clock.currentTime = stTime.clone();
        this.viewer.clock.clockRange = ClockRange.LOOP_STOP; // Loop at the end
        this.viewer.clock.multiplier = 1;
        // Set timeline to simulation bounds
        this.viewer.timeline.zoomTo(stTime, endTime);
        this._position = new SampledPositionProperty();
        this._position.addSample(this._stTime, this._stPos);
        this._position.addSample(this._endTime, this._endPos);

    }

    public addToMap() {
        //
    }

    /**
     * @description: 根据起止时间以及飞行轨迹，创建对应的飞行模型
     * @param {JulianDate} start 运动的起始时间
     * @param {JulianDate} stop 运动的终止时间
     * @param {SampledPositionProperty} position 运动轨迹点集合
     * @param {string} flightid 飞行实体的ID
     * @return {*}
     * @author: Xin Lai
     */
    public CreateFlight(start: JulianDate, stop: JulianDate, position: SampledPositionProperty, flightid: string) {
        if (start === undefined || stop === undefined || position === undefined || flightid === undefined) return;
        let startposition = position.getValue(start);
        let startposition2 = position.getValue(JulianDate.addSeconds(
            start,
            45,
            new JulianDate()
        ));
        // 获得运动初始位置的经纬高
        let strCartographic = Cartographic.fromCartesian(startposition);
        let strLat = _Math.toDegrees(strCartographic.latitude);
        let strIng = _Math.toDegrees(strCartographic.longitude);
        let strheight = strCartographic.height;
        let _this = this;

        // 创建运动实体
        this.entities.push(flightid);
        let entity = this.viewer.entities.add({
            id: flightid,
            // Set the entity availability to the same interval as the simulation time.
            availability: new TimeIntervalCollection([
                new TimeInterval({
                    start: start,
                    stop: stop
                })
            ]),
            position: position,
            orientation: new VelocityOrientationProperty(position),
            model: {
                uri: "http://47.97.116.47:8005/3d/075.gltf",
                // minimumPixelSize: 128,
                scale: 2,
                distanceDisplayCondition: new DistanceDisplayCondition(
                    0.0,
                    8.0e3
                  )
            },
            billboard: {
                image:  `${webSetting.assetsUrl}/image/flight.gif`,
                distanceDisplayCondition: new DistanceDisplayCondition(
                  8.0e3
                )
            },
            label: {
                // This callback updates the length to print each frame.
                text: new CallbackProperty(function (time) {
                    let flight = _this.viewer.entities.getById(flightid);
                    time = <JulianDate>time;
                    let cartesian3 = flight?.position!.getValue(time);
                    if (!cartesian3) return;
                    let cartographic = Cartographic.fromCartesian(cartesian3);
                    let lat = _Math.toDegrees(cartographic.latitude);
                    let ing = _Math.toDegrees(cartographic.longitude);
                    let height = cartographic.height;
                    startposition = cartesian3;

                    let pos = "经度：" + Number(ing.toFixed(2)) + " 纬度：" + Number(lat.toFixed(2)) + " 高度：" + Number(height.toFixed(2));
                    return pos;
                }, false),
                font: "bold 10pt Segoe UI Semibold",
                pixelOffset: new Cartesian2(0.0, -40),
                fillColor: Color.fromRgba(0xFFFF00FF),
                show: new CallbackProperty(function () { return _this._IsShowPos; }, false)
            },
            path: {
                resolution: 1,
                material: new PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Color.YELLOW
                }),
                width: 10,
                leadTime: 0,
                trailTime: 900,
                show: new CallbackProperty(function () { return _this._IsShowWall; }, false)
            }

        });

        // 添加飞机名称的label，用于控制与开关
        this.entities.push(flightid + "-name");
        this.viewer.entities.add({
            id: flightid + "-name",
            position: position,
            label: {
                // This callback updates the length to print each frame.
                text: flightid,
                font: "bold 12pt Segoe UI Semibold",
                pixelOffset: new Cartesian2(0.0, -20),
                fillColor: Color.fromRgba(0xFFFFFFFF),
                show: new CallbackProperty(function () { return _this._IsShowFlightId; }, false)
            }
        });

        this.wallEntities.set(flightid, [strIng, strLat, strheight]);
        let THIS = this;

        // 添加飞机轨迹的帷幕
        // if (!this._IsShowWall) return;
        this.entities.push(flightid + "-wall");
        this.viewer?.entities.add(
            {
                id: flightid + "-wall",
                wall: {
                    positions: new CallbackProperty(function (time, result) {
                        time = <JulianDate>time;
                        let timeOffset = JulianDate.secondsDifference(
                            time,
                            start
                        );

                        startposition2 = position.getValue(JulianDate.addSeconds(
                            start,
                            timeOffset,
                            new JulianDate()
                        ));
                        let wallpositions = THIS.wallEntities.get(flightid);

                        if (!startposition2) return Cartesian3.fromDegreesArrayHeights(wallpositions);

                        let strCartographic2 = Cartographic.fromCartesian(startposition2);
                        let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                        let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                        let strheight2 = strCartographic2.height;
                        wallpositions.push(strIng2, strLat2, strheight2);
                        // 当实体运动结束，重置清空飞机的帷幕
                        if (timeOffset >= JulianDate.secondsDifference(stop, start) - 1) {
                            THIS.wallEntities.set(flightid, [strIng, strLat, strheight]);
                        }

                        return Cartesian3.fromDegreesArrayHeights(
                            wallpositions
                        );
                    }, false),
                    material: Color.RED.withAlpha(0.5),
                    show: new CallbackProperty(function () { return _this._IsShowWall; }, false)
                }
            }
        );
        // console.log(entity);
        this.vehicleEntity = entity;
        this.viewer.zoomTo(this.viewer.entities);

        return entity;
    }

    // 计算以lon,lat为圆心，半径为radius的轨迹position
    // 其中起始时间为start，持续时间360s
    public computeCirclularFlight(lon: number, lat: number, radius: number, start: JulianDate) {

        let property = new SampledPositionProperty();

        for (let i = 360; i >= 180; i -= 30) {
            let radians = _Math.toRadians(i);
            let time = JulianDate.addSeconds(
                start,
                360 - i,
                new JulianDate()
            );
            let position = Cartesian3.fromDegrees(
                lon + 1.5 * radius * Math.cos(radians) + 1.5 * radius,
                lat + radius * Math.sin(radians),
                _Math.nextRandomNumber() * 500 + 2000
            );
            property.addSample(time, position);
        }

        // 圆形轨迹生成部分
        for (let i = 0; i <= 360; i += 30) {
            let radians = _Math.toRadians(i);
            let time = JulianDate.addSeconds(
                start,
                i + 180,
                new JulianDate()
            );
            let position = Cartesian3.fromDegrees(
                lon + 1.5 * radius * Math.cos(radians) - 1.5 * radius,
                lat + radius * Math.sin(radians),
                _Math.nextRandomNumber() * 500 + 2000
            );

            property.addSample(time, position);
        }

        for (let i = 180; i >= 0; i -= 30) {
            let radians = _Math.toRadians(i);
            let time = JulianDate.addSeconds(
                start,
                720 - i,
                new JulianDate()
            );

            let position = Cartesian3.fromDegrees(
                lon + 1.5 * radius * Math.cos(radians) + 1.5 * radius,
                lat + radius * Math.sin(radians),
                _Math.nextRandomNumber() * 500 + 2000
            );
            property.addSample(time, position);
        }
        return property;
    }

    // 显示复杂飞行的相关信息
    public FlightInfo(entity: Entity) {

        let progress = 0;
        let start = entity.availability?.start;
        let startposition: any;
        let startposition2: any;
        if (start !== undefined) {
            startposition = entity.position?.getValue(start);
            startposition2 = entity.position?.getValue(JulianDate.addSeconds(
                start,
                45,
                new JulianDate()
            ));
        }
        if (!startposition) return;
        const event = new EventHelper();
        if (this.viewer) {
            event.add(this.viewer.scene.globe.tileLoadProgressEvent, (e: any) => {
                if (this.isLoad) return;
                if (e === 0) {

                    if (this.viewer) {
                        // this.viewer.trackedEntity = this.vehicleEntity;
                        setTimeout(() => {
                            this.viewer?.camera.zoomOut(10000);
                        }, 2000);
                        let clock = this.viewer.clock;
                        this.preUpdate = (scene: Scene, time: any) => {
                            let timeOffset = JulianDate.secondsDifference(
                                clock.currentTime,
                                clock.startTime
                            );

                            if (this.vehicleEntity && progress < 1) {

                                startposition2 = startposition;
                                let cartesian3 = this.vehicleEntity.position!.getValue(clock.currentTime);
                                if (!cartesian3) return;
                                let cartographic = Cartographic.fromCartesian(cartesian3);
                                let lat = _Math.toDegrees(cartographic.latitude);
                                let ing = _Math.toDegrees(cartographic.longitude);
                                let height = cartographic.height;
                                startposition = cartesian3;

                                this.lgt = Number(ing.toFixed(4));
                                this.lat = Number(lat.toFixed(4));
                                this.height = Number(height.toFixed(4));

                                let moments = Number(timeOffset.toFixed(0)) / 60;
                                let seconds = Number(timeOffset.toFixed(0)) % 60;
                                if (moments <= 0) this.time = "已漫游时间:" + parseInt(String(seconds)) + "秒";
                                else {
                                    this.time = "已漫游时间:" + parseInt(String(moments)) + " 分" + "   " + parseInt(String(seconds)) + " 秒";
                                }
                                this.percent = Number((Number(progress.toFixed(2)) * 100).toFixed(2));
                                progress = timeOffset / 360;

                                if (this.firstview === 1 && this.viewer) {
                                    // console.log("change view");
                                    let cartesian3 = this.vehicleEntity.position!.getValue(this.viewer.clock.currentTime);
                                    this.viewer?.camera.lookAt(cartesian3, new Cartesian3(5, -50, 20));
                                }

                            }
                        };

                        this.viewer.scene.preUpdate.addEventListener(this.preUpdate, this);
                    }
                    this.isLoad = true;
                }
            });
        }

    }

    // 添加飞机雷达扫描特效
    public CreateRadias(entity: Entity, color: Color) {
        // 根据运动实体entity的运动轨迹来构造对应雷达的运动轨迹
        let position3 = new SampledPositionProperty();
        let start = entity.availability?.start;
        if (start !== undefined) {
            let position = entity?.position;
            for (let i = 0; i <= 360; i += 30) {
                let time = JulianDate.addSeconds(
                    start,
                    i,
                    new JulianDate()
                );
                let pos: any;
                if (position !== undefined) {
                    pos = position.getValue(time);
                }
                let strCartographic2 = Cartographic.fromCartesian(pos);
                let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                let strheight2 = strCartographic2.height / 2;
                pos = Cartesian3.fromDegrees(strIng2, strLat2, strheight2);

                position3.addSample(time, pos);
            }

            let _this = this;
            // 保存扫描雷达的id
            let tempId = entity.id + "-scan";
            this.entities.push(tempId);
            this.viewer?.entities.add({
                id: tempId,
                position: position3,
                cylinder: {
                    length: new CallbackProperty(function (time, result) {
                        time = <JulianDate>time;
                        let pos: any;
                        let strCartographic3: any;
                        if (position !== undefined) {
                            pos = position.getValue(time);
                        }
                        if (pos !== undefined) {
                            strCartographic3 = Cartographic.fromCartesian(pos);
                            return strCartographic3.height;
                        }
                    }, false),
                    topRadius: 0.0,
                    bottomRadius: 500.0,
                    material: color,
                    show: new CallbackProperty(function () { return _this._IsShowRadia; }, false)
                }
            });
        }

    }

    // 创建两个飞机之间的数据链
    public CreateDataline(entity1: Entity, entity2: Entity) {
        let start = entity1.availability?.start;
        let stop = entity1.availability?.stop;
        let position = entity1.position;
        let position2 = entity2.position;
        let _this = this;
        // 保存entity的id方便后面的删除
        let tempId = entity1.id + "-connect-" + entity2.id;
        this.entities.push(tempId);
        this.viewer?.entities.add({
            id: tempId,
            availability: new TimeIntervalCollection([
                new TimeInterval({
                    start: start,
                    stop: stop
                })
            ]),
            polyline: {
                positions: new CallbackProperty(function (time, result) {

                    time = <JulianDate>time;
                    if (start !== undefined && position !== undefined && position2 !== undefined) {
                        let timeOffset = JulianDate.secondsDifference(
                            time,
                            start
                        );
                        let startposition = position.getValue(JulianDate.addSeconds(
                            start,
                            timeOffset,
                            new JulianDate()
                        ));
                        let startposition2 = position2.getValue(JulianDate.addSeconds(
                            start,
                            timeOffset,
                            new JulianDate()
                        ));

                        if (startposition !== undefined) {
                            let strCartographic = Cartographic.fromCartesian(startposition);
                            let strLat = _Math.toDegrees(strCartographic.latitude);
                            let strIng = _Math.toDegrees(strCartographic.longitude);
                            let strheight = strCartographic.height;

                            let strCartographic2 = Cartographic.fromCartesian(startposition2);
                            let strLat2 = _Math.toDegrees(strCartographic2.latitude);
                            let strIng2 = _Math.toDegrees(strCartographic2.longitude);
                            let strheight2 = strCartographic2.height;

                            return Cartesian3.fromDegreesArrayHeights(
                                [strIng2, strLat2, strheight2, strIng, strLat, strheight]
                            );
                        }
                    }
                }, false),
                width: 3,
                // material: new PolylineTrailLinkMaterialProperty(Color.RED, 6000, 1),
                show: new CallbackProperty(function () { return _this._IsShowDataLine; }, false)
            }
        });
    }

    public destroy() {
        // console.log("destroy");
        if (this.isDestroyed) return;
        // this.viewer.clock.shouldAnimate = false;
        if (this.preUpdate) {
            this.viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
        }
        this.delete();
        this.isDestroyed = true;
        // this.cmap.removeLayer(this.id);
    }

    // 删除所有实体和粒子特效
    public delete() {
        if (this.preUpdate) {
            this.viewer.scene.preUpdate.removeEventListener(this.preUpdate, this);
        }
        // this.viewer.entities.removeAll();
        // 这里将所有的与飞机相关的实体删除掉
        for (let i = 0; i < this.entities.length; ++i) {
            // console.log("destroy: " + this.entities[i]);
            if (this.viewer.entities.getById(this.entities[i]) !== undefined) {
                this.viewer.entities.removeById(this.entities[i]);
            }
        }
    }

    // 控制漫游轨迹及帷幕的显示
    public showWall(isshow: boolean) {
        this._IsShowWall = isshow;
    }

    // 切换飞行视角（多目标飞行不可用）
    public changeViewType(view: String) {
        let flight = this.viewer.entities.getById("Flight");
        if (!flight) return;
        switch (view) {
            case "first": {
                this.firstview = 1;
                this.viewer.trackedEntity = undefined;
                break;
            }
            case "third": {
                this.viewer.trackedEntity = flight;
                this.firstview = 0;
                break;
            }
        }
    }

}