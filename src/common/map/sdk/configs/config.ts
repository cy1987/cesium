import { ISetting, IOptions } from "../interface";

export const setting: ISetting = {
    assetsUrl: "",
    center: { "x": 117.71907131328888, "y": 22.079864687459263, "height": 241992.0361992463, "range": 841809.66, "heading": 38.235591913575256, "pitch": -43.409413997653736, "roll": 0.014221676201164173 },
    viewMode: "3D",
    zooms: [1, 24],
    nearmidfar: {"nearHeight": 10000, "middleHeight": 30000, "farHeight": 50000},
    arcGisMapServerImagery: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
    // token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MTZkYTg2NS03ZTllLTRkYzItODU2MS0zY2NmYmVlYTMzNjgiLCJpZCI6MzkxMDAsImlhdCI6MTYwNzE2Mjc2NH0.n73x2VmM7G18YUagLBgMt9sh3iZLzJcMlihEBhTuhO4"
    // heights: [1, 1000000]
    // arcGisMapServerImagery: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
    // arcGisMapServerImagery: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer"

};

export const options: IOptions = {
    clear: true,
    onEvent: (evt: any, eventName?: string) => {
        // console.log(event, evt);
    }
};