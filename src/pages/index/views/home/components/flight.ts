import Gzip from "@/common/map/sdk/gzip";
import { StompClient } from "@/common/map/sdk/stomClient";
import { webSetting } from "@/settings";
import { message } from "ant-design-vue";
import axios from "axios";
import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Cartesian2,
    DistanceDisplayCondition,
    CallbackProperty,
    sampleTerrainMostDetailed,
    ModelAnimationLoop,
    Ellipsoid,
    Viewer,
    ScreenSpaceEventType,
    Entity,
    Cartesian3,
    HeadingPitchRoll,
    Model,
    defined,
    HeadingPitchRange,
    SampledPositionProperty,
    Matrix4,
    ScreenSpaceEventHandler,
    Transforms,
    JulianDate,
    PolylineGlowMaterialProperty,
    Color,
    Cartographic,
    Math as _Math,
    TimeIntervalCollection,
    ColorMaterialProperty,
    ConstantPositionProperty,
    TimeInterval,
    ConstantProperty
} from "cesium";
import PubSub from "pubsub-js";
import { setInterval } from "timers";
interface FlightInfo {
    id: string;
    name?: string;
    code?: string;
    country?: string;
    life?: number;
    team?: number;
    type?: number;
    fireRange?: string;
    detectionRange?: string;
    iconArmy?: string;
    icon3D?: string;
    beFound?: boolean; // 是否被探测到
    sourceTeam?: number;
    teamDetect?: number; // 探测到的阵营
    typeDetect?: number;
    iconArmyDetect?: string; 
    icon3DDetect?: string;
    lon?: number;
    lat?: number;
    alt?: number;
    heading?: number;
    roll?: number;
    pitch?: number;
    speed?: number;
    lonDetect?: number;
    latDetect?: number;
    altDetect?: number;
    headingDetect?: number;
    rollDetect?: number;
    pitchDetect?: number;
    speedDetect?: number;
}

interface DataLinkInfo {
    id: string;
    startId?: string;
    endId?: string;
    type?: number;
    styleCode?: string;
}

export default class Flight {
    public map: CMap;
    // public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket";
    public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket";
    public order: string = "";
    public page: string = "";

    public armyList: Array<FlightInfo> = []; // 兵力信息列表
    public coFlights: Map<string, Entity> = new Map<string, Entity>();    // 按id存储兵力实体
    public coFlightsPositinos: Map<string, SampledPositionProperty> = new Map<string, SampledPositionProperty>(); // 兵力位置信息
    public switchHeight: number = webSetting.switchHeight;
    public trackedFlight: string = "-1";
    public flightMove: Array<any> = [];
    public dataLinks: Array<DataLinkInfo> = [];

    public viewType: number = 2; // 2白方，0红方，1蓝方
    public sensorList: Array<any>= [];
    public isShowPos: boolean = true;
    public isShowPath: boolean = true;

    // 海图偏移
    public lonOffset: number = 0;
    public latOffset: number = 0;

    public constructor(map: CMap) {
        if (map && map instanceof CMap) {
            this.map = map;
        } else {
            throw new Error("传入的不是地图对象");
        }
    }

    public setOrder(order: string) {
        this.order = order;
        this.addFlight();
    }

    public addFlight() {
        this.getInit(`${webSetting.backendUrl}` + "/unity/situation/army/map/" + this.order).then(result => {
            result = JSON.parse(result).result;
            let flightInfos = <Array<string>>(Object.values(result));
            flightInfos.forEach(item => {
                this.addFlightFeature(item);
            })
            this.sortArmyList();
            PubSub.publish("armyListChange");
            // this.showArmyFeature();
        }).then(() => {
            StompClient.subscribe(
                "/topic/free/situation/army/clean",
                this.socketPath,
                (message: any) => {
                    let data = message;
                    if(data === "数据清空") {
                        this.armyList = [];
                    }
                    PubSub.publish("armyListChange");
                }
            );
            StompClient.subscribe(
                "/topic/free/situation/" + this.order + "/move/map",
                this.socketPath,
                (message: any) => {
                    // let data = <Array<string>>(Object.values(message.result));
                    let data = <Array<string>>(Object.values(message));
                    // console.log(data, "move");
                    this.armyList.forEach(item => {
                        data.forEach(item2 => {
                            let result = item2.split("@");
                            let id = result[0];
                            if(id.indexOf("_") !== -1) id = id.split("_")[1];
                            if(item.id === id) {
                                let move = result[2].split("_");
                                item.lon = Number(move[0]);
                                item.lat = Number(move[1]);
                                item.alt = Number(move[2]);
                                item.heading = Number(move[3]);
                                item.roll = Number(move[4]);
                                item.pitch = Number(move[5]);
                                item.speed = Number(move[6]);
                                let moveDetect: any = result[3];
                                if(moveDetect !== "") {
                                    moveDetect = moveDetect.split("_");
                                    item.lonDetect = Number(moveDetect[0]);
                                    item.latDetect = Number(moveDetect[1]);
                                    item.altDetect = Number(moveDetect[2]);
                                    item.headingDetect = Number(moveDetect[3]);
                                    item.rollDetect = Number(moveDetect[4]);
                                    item.pitchDetect = Number(moveDetect[5]);
                                    item.speedDetect = Number(moveDetect[6]);
                                    item.beFound = true;
                                }
                                else item.beFound = false;
                                this.addCooperativeFlight(this.map.viewer, item, false);
                            }
                        });
                    });
                    PubSub.publish("armyListChange");
                }
            );
            StompClient.subscribe(
                "/topic/free/situation/" + this.order + "/army/change",
                this.socketPath,
                (message: any) => {
                    // let flightInfos = <Array<string>>(Object.values(message.result));
                    let flightInfos = <Array<string>>(Object.values(message));
                    flightInfos.forEach(item => {
                        let data = item.split("@");
                        let flight = this.armyList.find(subItem => data[0] === subItem.id);
                        flight.id = data[0];
                        flight.name = data[1];
                        flight.country = data[2];
                        flight.life = Number(data[3]);
                        flight.team = Number(data[4]);
                        flight.type = Number(data[5]);
                        flight.iconArmy = data[6];
                        flight.icon3D = data[7];
                        flight.beFound = data[8] === "1" ? true : false;
                        flight.sourceTeam = Number(data[9]);
                        flight.teamDetect = Number(data[10]);
                        flight.typeDetect = Number(data[11]);
                        flight.iconArmyDetect = data[12];
                        flight.icon3DDetect = data[13];
                        flight.code = data[14];
                        this.addCooperativeFlight(this.map.viewer, flight, false);
                    })
                    this.sortArmyList();
                    PubSub.publish("armyListChange");
                }
            );
            StompClient.subscribe(
                "/topic/free/situation/" + this.order + "/army/add",
                this.socketPath,
                (message: any) => {
                    // let flightInfos = <Array<string>>(Object.values(message.result));
                    let flightInfos = <Array<string>>(Object.values(message));
                    // console.log(flightInfos, "add");
                    flightInfos.forEach(item => {
                        this.addFlightFeature(item);
                    })
                    this.sortArmyList();
                    PubSub.publish("armyListChange");
                }
            );
            StompClient.subscribe(
                "/topic/free/situation/" + this.order + "/army/delete",
                this.socketPath,
                (message: any) => {
                    let data = message;
                    data.forEach((item: string) => {
                        //
                    });
                    PubSub.publish("armyListChange");
                }
            );
            StompClient.subscribe(
                "/topic/free/situation/" + this.order + "/army/offline",
                this.socketPath,
                (message: any) => {
                    let data = message;
                    data.forEach((item: string) => {
                        //
                    });
                    PubSub.publish("armyListChange");
                }
            );
        }).then(() => {
            this.computeBillboardHeading();
        })
    }

    public addFlightFeature(item: any) {
        let data = item.split("#")[0].split("@");
        let movedata = item.split("#")[1];
        let id = data[0];
        if(id.indexOf("_") !== -1) id = id.split("_")[1];
        
        let flight: FlightInfo = {
            id: id,
            name: data[1],
            country: data[2],
            life: Number(data[3]),
            team: Number(data[4]),
            type: data[5],
            iconArmy: data[6],
            icon3D: data[7],
            beFound: data[8] === "1" ? true : false,
            sourceTeam: Number(data[9]),
            teamDetect: Number(data[10]),
            typeDetect: Number(data[11]),
            iconArmyDetect: data[12],
            icon3DDetect: data[13],
            code: data[14]
        }
        flight.teamDetect = flight.team;
        flight.iconArmyDetect = flight.iconArmy;
        
        if(movedata) {
            let move = movedata.split("@")[2];
            let moveDetect = movedata.split("@")[3];
            if(move) {
                move = move.split("_");
                flight.lon = Number(move[0]);
                flight.lat = Number(move[1]);
                flight.alt = Number(move[2]);
                flight.heading = Number(move[3]);
                flight.roll = Number(move[4]);
                flight.pitch = Number(move[5]);
                flight.speed = Number(move[6]);
            }
            if(moveDetect) {
                moveDetect = moveDetect.split("_");
                flight.lonDetect = Number(moveDetect[0]);
                flight.latDetect = Number(moveDetect[1]);
                flight.altDetect = Number(moveDetect[2]);
                flight.headingDetect = Number(moveDetect[3]);
                flight.rollDetect = Number(moveDetect[4]);
                flight.pitchDetect = Number(moveDetect[5]);
                flight.speedDetect = Number(moveDetect[6]);
                flight.beFound = true;
            }
            else flight.beFound = false;
            this.addCooperativeFlight(this.map.viewer, flight, true);
        }
        this.armyList.push(flight);
    }

    public sortArmyList() {
        this.armyList.sort((a, b) => {
            return a.name >= b.name ? 1 : -1;
        })
    }

    public addCooperativeFlight(viewer: Viewer, coFlightInfo: FlightInfo, initFlag: boolean) {
        let modelPath = `${webSetting.baseModelHost}` + "/3d/054a.gltf";
        let scale = 1;
        // let billboardimgage = `${webSetting.baseModelHost}` + "/map/icon/red/16.svg";
        let billboardimgage = `${webSetting.baseModelHost}/${coFlightInfo.team === 0 ? "red" : "blue"}/` + coFlightInfo.iconArmy;
        let showState = true;
        if (coFlightInfo.icon3D === null || coFlightInfo.icon3D === "" || coFlightInfo.icon3D === "null") {
            // console.log();
            // showState = false;
        }
        else {
            // scale = Number(coFlightInfo.ext.scaleRatio);
            billboardimgage = `${webSetting.baseModelHost}/${coFlightInfo.team === 0 ? "red" : "blue"}/` + coFlightInfo.iconArmy;
            modelPath = `${webSetting.baseModelHost}` + coFlightInfo.icon3D;
            // modelPath = `${webSetting.baseModelHost}` + "/map/model/3d/wrj/wrj.glb";
        }

        let fixedFrameTransform = Transforms.localFrameToFixedFrameGenerator(
            "north",
            "west"
        );
        let position = Cartesian3.fromDegrees(
            coFlightInfo.lon,
            coFlightInfo.lat,
            coFlightInfo.alt
        );

        let hpRoll = new HeadingPitchRoll();
        hpRoll.heading = _Math.toRadians(coFlightInfo.heading);
        hpRoll.pitch = _Math.toRadians(coFlightInfo.pitch);
        hpRoll.roll = _Math.toRadians(coFlightInfo.roll);

        let ori = new ConstantProperty(
            Transforms.headingPitchRollQuaternion(
                position,
                hpRoll,
                Ellipsoid.WGS84,
                fixedFrameTransform
            )
        );
        if (initFlag) {

            this.coFlightsPositinos.set(coFlightInfo.id, new SampledPositionProperty());
            this.addPosition(coFlightInfo, ori);

            let _this = this;

            let coFlight = viewer.entities.add({
                id: coFlightInfo.id,
                name: coFlightInfo.name,
                position: this.coFlightsPositinos.get(coFlightInfo.id),
                model: {
                    uri: modelPath,
                    maximumScale: 8,
                    minimumPixelSize: 16,
                    // scale: scale,
                    scale: 1,
                    distanceDisplayCondition: new DistanceDisplayCondition(
                        0.0,
                        this.switchHeight
                    )
                },
                orientation: ori,
                show: showState,
                path: {
                    resolution: 1,
                    material: new PolylineGlowMaterialProperty({
                        glowPower: 0.1,
                        color: Color.ORANGE
                    }),
                    width: 1,
                    leadTime: 0,
                    trailTime: 10, // the path's length to show 
                    show: new CallbackProperty(function () { return _this.isShowPath; }, false)
                },
                label: {
                    // This callback updates the length to print each frame.
                    text: new CallbackProperty(function (time) {
                        let flight = viewer.entities.getById(coFlightInfo.id);
                        time = <JulianDate>time;
                        let cartesian3 = flight?.position!.getValue(time);
                        // // console.log("cartest", flight);
                        if (!cartesian3) return;
                        let cartographic = Cartographic.fromCartesian(cartesian3);
                        let lat = _Math.toDegrees(cartographic.latitude);
                        let ing = _Math.toDegrees(cartographic.longitude);
                        let height = cartographic.height;
                        let startposition = cartesian3;

                        // let pos = coFlightInfo.name  + "\n" + Number(ing.toFixed(4)) + "-" + Number(lat.toFixed(4)) + "-" + Number(height.toFixed(2)) + "-" + Number(_this.coFlightsSpeed[coFlightInfo.id] !== undefined ? _this.coFlightsSpeed[coFlightInfo.id].toFixed(2) : 0);
                        let pos = coFlightInfo.name;
                        return pos;
                    }, false),
                    font: "Lighter 12pt PingFangSC-Lighter",
                    pixelOffset: new Cartesian2(0.0, -40),
                    showBackground: true,
                    backgroundColor: new CallbackProperty(function () {
                        if (coFlightInfo.team === 1) return new Color(0, 0.09, 0.28, 0.5); // 蓝方
                        else if (coFlightInfo.team === 0) return new Color(0.3, 0, 0, 0.5); // 红方
                        else return new Color(0.5, 0.5, 0.5, 0.5); // 其他
                    }, false),
                    fillColor: Color.WHITE,
                    eyeOffset: new Cartesian3(0, 0, -10),
                    show: new CallbackProperty(function () { return _this.isShowPos; }, false)
                },
                billboard: {
                    image: billboardimgage,
                    scale: 0.5,
                    distanceDisplayCondition: new DistanceDisplayCondition(
                        this.switchHeight
                    )
                }
            });
            this.coFlights.set(coFlightInfo.id, coFlight);
        } else {
            
            if(coFlightInfo.id === "200") {
                console.log(new Date(), coFlightInfo, ori)
                console.log(viewer.entities.getById("200"))
            }
            this.addPosition(coFlightInfo, ori);
        }
    }

    public computeBillboardHeading() {
        this.map.viewer.scene.preUpdate.addEventListener(() => {
            for(let fId of this.coFlights.keys()) {
                
                if (this.coFlights.get(fId)) {
                    let cameraHeading = this.map.getCameraInfo().heading;
                    let flightInfo = this.armyList.find(item => item.id === fId);
                    if(flightInfo) this.coFlights.get(fId).billboard.rotation = new ConstantProperty(_Math.toRadians(360 - flightInfo.heading + cameraHeading));
                }
            }
        });
    }

    // 更新物体的位置
    public addPosition(coFlightInfo: FlightInfo, ori: ConstantProperty) {
        if (coFlightInfo.alt > 0) {
            this.coFlightsPositinos.get(coFlightInfo.id).addSample(
                JulianDate.addSeconds(JulianDate.now(),1,new JulianDate()),
                Cartesian3.fromDegrees(
                    coFlightInfo.lon,
                    coFlightInfo.lat,
                    coFlightInfo.alt
                )
            );
            if (this.coFlights.get(coFlightInfo.id) !== undefined) this.coFlights.get(coFlightInfo.id).orientation = ori;
        }
        else {
            /*
                当物体的高度为0时，作贴地处理
            */

            let positions = Array<Cartesian3>();
            positions.push(Cartesian3.fromDegrees(coFlightInfo.lon, coFlightInfo.lat));

            // using sampled property to get sampled data
            let oriSamples = new SampledPositionProperty();
            oriSamples.addSample(JulianDate.now(), positions[0]);
            oriSamples.addSample(JulianDate.now(), positions[0]);

            let sampledPositions = Array<Cartographic>();
            let sampledTimes = Array<JulianDate>();
            for (let i = 0; i < 2; i++) {
                let tmpPos = oriSamples.getValue(JulianDate.now());
                if (!tmpPos) continue;
                sampledPositions.push(Cartographic.fromCartesian(tmpPos));
                sampledTimes.push(JulianDate.addSeconds(JulianDate.now(),1,new JulianDate()));
            }

            sampleTerrainMostDetailed(
                this.map.viewer!.terrainProvider,
                sampledPositions
            ).then(updatedPositions => {

                // add positions which are clamped to ground to the carPositionProperty
                for (let i = 0; i < updatedPositions.length; i++) {
                    this.coFlightsPositinos.get(coFlightInfo.id).addSample(
                        sampledTimes[i],
                        Cartesian3.fromDegrees(// this way of changing pos is not right, all should be under WGS84
                            coFlightInfo.lon,
                            coFlightInfo.lat,
                            sampledPositions[i].height)
                    );
                    // console.log(sampledTimes[i], " ------->>> ", sampledPositions[i]);
                }
            });
            if (this.coFlights.get(coFlightInfo.id) !== undefined) this.coFlights.get(coFlightInfo.id).orientation = ori;
        }
    }

    // public showArmyFeature() {
    //     // this.radarSource.clear();
    //     if(this.page === "control") {
    //         this.armyList.forEach(item => this.updateArmy(item));
    //     }
    // }

    public changeViewType() {
        
    }

    public async getInit(initUrl: string) {
        let initData = "";
        await axios.get(initUrl).
            then(response => {
                initData = JSON.stringify(response.data);
            }).
            catch(error => {
                // console.error("get All situation FAILED! using Url: ", initUrl, "err Code:", error);
            });
        return initData;
    }
    
}
