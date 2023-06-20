import { component, View } from "@egova/flagwind-web";
import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Viewer,
    Entity,
    Cartesian3,
    SceneMode,
    ArcGisMapServerImageryProvider,
    Cesium3DTileset,
    Cesium3DTileStyle,
    GeoJsonDataSource,
    ImageMaterialProperty,
    HeadingPitchRange,
    createWorldTerrain,
    Math as _Math,
    Ion,
    Material,
    CallbackProperty,
    Color
} from "cesium";
import PolylineTrailLinkMaterialProperty from "@/components/DynamicWire/PolylineTrailLinkMaterialProperty.js";
import { StompClient } from "@/common/map/sdk/stomClient";
import { webSetting } from "@/settings";
import Stomp, { Client, Subscription, Frame, Message } from "stompjs";
import JulianDate from "cesium/Source/Core/JulianDate";
import { Socket } from "dgram";
import SampledPositionProperty from "cesium/Source/DataSources/SampledPositionProperty";

interface ILineData {
    id: string;
    name: string;
    parentId: string;
    // pageCode: string;
    time: number;
    type: number;
    data: Array<Array<number>>;
    ext: Map<string, any>;
}

// tslint:disable-next-line:class-name
export default class dynamicWireBackend {

    private id: string = `DynamicWireBackEnd-${new Date().getTime().toString()}`; // layer id

    public socketId: string;
    public show: boolean = true;

    // --------------------- front back needed variables ------------------------------------
    // socket for subscribing situations of all filghts

    // the time at which get data from the backend
    public renderTime: JulianDate = JulianDate.now();
    // save all the dynamic wire data get from the backend, Array<line is: Array<points>>
    public linesData: Map<string, Array<Array<SampledPositionProperty>>> = new Map<string, Array<Array<SampledPositionProperty>>>();

    public lineWidth: number = 5;
    public color: Color = Color.BLUE;

    public constructor(
        public cmap: CMap,
        public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket",
        public socketDestination: string = "/topic/free/situation/line"
    )
    {
        this.socketId = this.socketPath + "-" + this.socketDestination;
    }

    public addWire() {
        let inited = false;
        let added = false;
        StompClient.subscribe(
            this.socketDestination,
            this.socketPath,
            (message: any) => {
                // format the data
                let msgFormatted = new Map<string, Array<ILineData>>();
                for(let tmpKey of Object.keys(message.result)) {
                    let lineArray = new Array<ILineData>();
                    lineArray = <Array<ILineData>>message.result[tmpKey];
                    // console.log("key -> ", tmpKey);
                    msgFormatted.set(tmpKey, lineArray);
                    // console.log("data -> ", msgFormatted.get(tmpKey));
                }

                // init data
                let curTime = JulianDate.now();
                if(!inited) {
                    this.updateDynamicWireData(curTime, msgFormatted, true);
                    inited = true;
                    return ;
                }

                // update data: todo: 2n
                this.updateDynamicWireData(curTime, msgFormatted, false);

                // add the dynamic wire
                if(!added) {
                    this.addToPosFrontBack();
                    added = true;
                }
            }
        );
    }

    /**
     * update data
     * @param time the time when we get the data from the backend
     * @param data the data
     * @param needInit if need init
     */
    public updateDynamicWireData(time: JulianDate, data: Map<string, Array<ILineData>>, needInit: boolean) {
        if(needInit) {
            // init the wire
            data.forEach((lines, key) => {
                // console.log("lines are ", lines);
                // for every lines,
                let curLines = new Array<Array<SampledPositionProperty>>();
                for (let lineIdx = 0; lineIdx < lines.length; ++lineIdx) {
                    let curLine = new Array<SampledPositionProperty>();
                    for (let pIdx = 0; pIdx < lines[lineIdx].data.length; ++pIdx) {
                        let curPoint = new SampledPositionProperty();
                        curPoint.addSample(time, Cartesian3.fromDegrees(
                            lines[lineIdx].data[pIdx][0],
                            lines[lineIdx].data[pIdx][1],
                            lines[lineIdx].data[pIdx][2]
                        ));
                        curLine.push(curPoint);
                    }
                    curLines.push(curLine);
                }
                this.linesData.set(key, curLines);
            });
        }
        else {
            // add the new coming's points
            data.forEach((lines, key) => {
                // for every lines,
                for (let lineIdx = 0; lineIdx < lines.length; ++lineIdx) {
                    for (let pIdx = 0; pIdx < lines[lineIdx].data.length; ++pIdx) {
                        // let curPoint = new SampledPositionProperty();
                        this.linesData.get(key)[lineIdx][pIdx].addSample(time, Cartesian3.fromDegrees(
                            lines[lineIdx].data[pIdx][0],
                            lines[lineIdx].data[pIdx][1],
                            lines[lineIdx].data[pIdx][2]
                        ));
                    }
                }
            });
        }
        this.renderTime = time;
    }

    /**
     * add the dynamic wire to the position
     */
    public addToPosFrontBack() {

        let _this = this;
        this.linesData.forEach((lines, key) => {
            // add the lines
            for (let lineIdx = 0; lineIdx < lines.length; ++lineIdx) {
                _this.cmap.viewer.entities.add({
                    id: key + "dynWire" + lineIdx.toString(),
                    polyline: {
                        positions: new CallbackProperty((time, result) => {
                            // return the render time's positons 
                            let positions = new Array<Cartesian3>();
                            for (let pIdx = 0; pIdx < lines[lineIdx].length; ++pIdx) {
                                positions.push(Cartesian3.clone(
                                    _this.linesData.get(key)[lineIdx][pIdx].getValue(_this.renderTime)
                                ));
                            }
                            return positions;
                        }, false),
                        // material: new PolylineTrailLinkMaterialProperty(Color.WHITE, 3000,1),
                        show: new CallbackProperty(function () { return _this.show; }, false)
                    }
                });
            }

        });
    }

}
