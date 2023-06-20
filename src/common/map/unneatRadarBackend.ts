import { component, View, watch } from "@egova/flagwind-web";
import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Math as _Math,
    JulianDate,
    Color
} from "cesium";
import { UnneatRadar as _UnneatRadar } from "@/common/map/unneatRadar";
import { StompClient } from "@/common/map/sdk/stomClient";
import { floor } from "lodash";
import { webSetting } from "@/settings";
import Stomp, { Client, Subscription, Frame, Message } from "stompjs";
import Gzip from "@/common/map/sdk/gzip";

interface IRadarData {
    id: string;
    parentId: string;
    // pageCode: string;
    time: number;
    data: Array<Array<Array<number>>>;
    ext: Map<string, any>;
}

// tslint:disable-next-line:class-name
export default class UnneatRadar {
    private id: string = `UnneatRadar-${new Date().getTime().toString()}`; // layer id

    public drawer: boolean = true;
    
    public uR!: _UnneatRadar;
    public uRs: Map<Number,_UnneatRadar> = new Map<Number,_UnneatRadar>();
    public urAdds: Map<Number,boolean> = new Map<Number,boolean>();
    public radarList: Map<number,boolean> = new Map<number,boolean>();

    public constructor(
        public cmap: CMap,
        public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket"
    )
    {

    }

    public addRadar() {
        let sampleNum = 30;  // every one sec we take a sample to simulate the unneat radar
        let stTime = JulianDate.now();
        let edTime = JulianDate.addSeconds(stTime, sampleNum - 5, new JulianDate());
        let oneLevelPointNum = 9;

        let lineColor = new Color(1, 1, 0, 0.6);

        let levelNum = 0;
        oneLevelPointNum = 0;

        StompClient.subscribe(
            "/topic/free/situation/radar",
            this.socketPath,
            (message: any) => {
                // format the data
                let msgFormatted = new Map<number, IRadarData>();
                let updateFlag = new Map<number, boolean>();
                // console.log("radarresult", message);
                for(let tmpKey of Object.keys(message.result)) {
                    let result = message.result[tmpKey];
                    if(result.indexOf("dW5jaGFuZ2Vk") === -1) {
                        result = JSON.parse(Gzip.unzip(result));
                        // console.log("key -> ", tmpKey, message.result[tmpKey]);
                        // console.log("data -> ", result);
                        msgFormatted.set(parseInt(tmpKey), <IRadarData>(result));
                        updateFlag.set(parseInt(tmpKey), true);
                    }
                    this.radarList.set(parseInt(tmpKey), true);
                }

                for(let key of this.radarList.keys()) {
                    if(!msgFormatted.has(key)) {
                        let uR = this.uRs.get(key);
                        this.radarList.delete(key);
                        uR.destroy();
                    }
                }
              
                for(let tarKey of msgFormatted.keys()) {
                    // console.log("data -> ", updateFlag.get(tarKey));
                    if(!updateFlag.get(tarKey)) continue;
                    let uR = this.uRs.get(tarKey);
                    let radarData0 = msgFormatted.get(tarKey);
                    let radarPoints = radarData0.data;
                    // console.log("data -> ", msgFormatted.keys().next().value, msgFormatted.values());
                    let curTime = JulianDate.now();
                    // console.log("newest time: ", curTime)
                    levelNum = radarData0.data.length;
                    
                    oneLevelPointNum = radarData0.data[1].length;
                    // console.log("levelnum", levelNum, oneLevelPointNum);

                    // init the radar
                    if (uR === undefined) {

                        let options = {
                            id: tarKey + "unneatRadar",
                            stTime: stTime,
                            edTime: edTime,
                            levelHeights: undefined,
                            levelRadius: undefined,
                            sampleNum: 30,
                            oneLevelPointNum: undefined,
                            centerPoint: undefined,
                            lineWidth: 0.5,
                            lineColor: lineColor,
                            scanLineWidth: 0.5,
                            scanLineColor: Color.RED.withAlpha(0.8)
                        };
                        uR = new _UnneatRadar(this.cmap, options);
                        uR.updateRadarData(radarPoints, curTime, true);
                        this.uRs.set(tarKey,uR);
                        return ;
                    }
                    
                    uR.updateRadarData(radarPoints, curTime, false);

                    if (uR !== undefined && this.urAdds.get(tarKey) === undefined) {
                        uR.addToPosFrontBack(); // this will use uR::realTimeRadarPoints
                        this.cmap.addLayer(this.uR);
                        this.urAdds.set(tarKey,true);
                    }

                }
                              
            }
        );
    }

    public beforeDestroy() {
        // auto call destroy when the removelayer is called
        this.cmap.removeLayer(this.uR.id);
        // console.log("un subscribe the websocket of the radar");
        StompClient.unsubscribe(this.socketPath + "-" + "/topic/free/situation/radar");
    }

    public destroyAll() {
        for(let key of this.radarList.keys()) {
            let uR = this.uRs.get(key);
            this.radarList.delete(key);
            uR.destroy();
        }
        StompClient.unsubscribe(this.socketPath + "-" + "/topic/free/situation/radar");
    }

    public showChange(show: boolean)
    {
        for(let key of this.uRs.keys())
        {
            this.uRs.get(key).show = show;
        }
    }

}