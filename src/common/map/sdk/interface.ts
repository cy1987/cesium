import { CMap } from "./map";
import Cesium from "cesium";

export interface ISetting {
    token?: string;
    assetsUrl?: string;
    center?: ICameraInfo;
    viewMode?: "3D" | "2D"; // 地图模式
    zooms?: Array<number>;   // 缩放层级范围
    heights?: Array<number>; // 相机高度范围
    arcGisMapServerImagery?: string;
    _setting?: Cesium.Viewer.ConstructorOptions;
    nearmidfar?: Farmidnear;
}
export interface IOptions {
    [index: string]: any;
    onEvent?: (evt: any, eventName?: string) => any;
    onMapLoad?: (map: CMap) => any;
    clear?: boolean; // 是否清除数据
    store?: boolean; // 是否保存实例
}

/**
 * 相机信息
 *
 * @export
 * @interface ICameraInfo
 */
export interface ICameraInfo {
    x?: number;
    y?: number;
    height?: number;            // 高度
    range?: number;             // 到目标距离
    heading?: number;           // z轴
    pitch?: number;             // x轴
    roll?: number;              // y轴
    duration?: number;          // 持续时间
    wait?: number;              // 停留时间
}

/**
 *  近远景信息
 *  @export
 *  @interface Farmidnear
 */
export interface Farmidnear {
    nearHeight?: number;
    middleHeight?: number;
    farHeight?: number;
}

/**
 * 实体Symbol
 *
 * @export
 * @interface IEntitySymbol
 */
export interface IEntitySymbol {
    [index: string]: any;
    billboard?: Cesium.BillboardGraphics.ConstructorOptions;
    box?: Cesium.BoxGraphics.ConstructorOptions;
    ellipse?: Cesium.EllipseGraphics.ConstructorOptions;
    label?: Cesium.LabelGraphics.ConstructorOptions;
    model?: Cesium.ModelGraphics.ConstructorOptions;
    path?: Cesium.PathGraphics.ConstructorOptions;
    plane?: Cesium.PlaneGraphics.ConstructorOptions;
    point?: Cesium.PointGraphics.ConstructorOptions;
    polygon?: Cesium.PolygonGraphics.ConstructorOptions;
    polyline?: Cesium.PolylineGraphics.ConstructorOptions;
    rectangle?: Cesium.RectangleGraphics.ConstructorOptions;
    wall?: Cesium.WallGraphics.ConstructorOptions;
}

/**
 * 图标点 数据
 *
 * @export
 * @interface IMarkerData
 */
export interface IMarkerData {
    [index: string]: any;
    id: string;
    x?: number;
    y?: number;
    z?: number;
    symbol?: IMarkerSymbol;
}

export interface IMarkerOptions {
    symbol?: IMarkerSymbol;
    locate?: boolean;
    clear?: boolean;
    // zooms?: Array<number>;
    onEvent?: (eventName: string, data: any) => any;
}

export interface IMarkerSymbol {
    image: string;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
    scaleByDistance?: Array<number>; // near, nearValue, far, farValue
}

export interface IPolylineSymbol {
    color?: any;
    width?: number;
}

export interface IPolylineData {
    [index: string]: any;
    id: string;
    coordinates: Array<Array<number>>;
    symbol?: IPolylineSymbol;
}

export interface IPolylineOptions {
    symbol?: IPolylineSymbol;
    locate?: boolean;
    clear?: boolean;
    onEvent?: (eventName: string, data: any) => any;
}

export interface IPolygonSymbol {
    color?: any;
    outlineColor?: any;
    outlineWidth?: number;
}

export interface IPolygonData {
    [index: string]: any;
    id: string;
    coordinates: Array<Array<Array<number>>>;
    symbol?: IPolygonSymbol;
}

export interface IPolygonOptions {
    symbol?: IPolygonSymbol;
    locate?: boolean;
    clear?: boolean;
    onEvent?: (eventName: string, data: any) => any;
}

export interface IRectangleSymbol {
    color?: any;
    outlineColor?: any;
    outlineWidth?: number;
}

export interface IRectangleData {
    [index: string]: any;
    id: string;
    coordinates: Array<Array<Array<number>>>;
    symbol?: IRectangleSymbol;
}

export interface IPopupData {
    [index: string]: any;
    point: { x: number; y: number; z?: number };
    content: Element | string;
}

export interface IPopupOptions {
    [index: string]: any;
    offsetX?: number;
    offsetY?: number;
    closeWhenClickMap?: boolean;
}

export interface IDrawOptions {
    [index: string]: any;
    symbols?: {
        marker?: IMarkerSymbol;
        polyline?: IPolylineSymbol;
        polygon?: IPolygonSymbol;
        rectangle?: IRectangleSymbol;
    };
}

export interface IMeasureOptions {
    [index: string]: any;
    symbols?: {
        polyline?: IPolylineSymbol;
        polygon?: IPolygonSymbol;
    };
}

export interface IEditOptions {
    [index: string]: any;
}

export interface ICzmlModelData {
    [index: string]: any;
    id: string;
    position: Array<{
        x: number;
        y: number;
        z?: number;
        time: string;
    }>;
    availability?: string;
    symbol?: IModelSymbol;
}

export interface ICzmlModelOptions {
    symbol?: IModelSymbol;
    clock?: {
        startTime: string;
        stopTime: string;
        currentTime?: string;
        multiplier?: Number;
        clockRange?: Number;
        canAnimate?: boolean;
        shouldAnimate?: boolean;
    };
    locate?: boolean;
    clear?: boolean;
    onEvent?: (eventName: string, data: any) => any;
}

export interface IModelSymbol extends IEntitySymbol {
    [index: string]: any;
    model: Cesium.ModelGraphics.ConstructorOptions | Object;
    path?: Cesium.PathGraphics.ConstructorOptions | Object;
}

export interface IShaderData {
    [index: string]: any;
    id: string;
    fragmentShader: string;
}

export interface IShaderOptions {
    [index: string]: any;
    uniforms?: any;
    textureScale?: number;
    forcePowerOfTwo?: boolean;
    sampleMode?: Cesium.PostProcessStageSampleMode;
    pixelFormat?: Cesium.PixelFormat;
    pixelDatatype?: Cesium.PixelDatatype;
    clearColor?: Cesium.Color;
}

// export interface IHeatOptions {
//     clear?: boolean; // 清空
//     // locate?: boolean; // 定位
//     radius?: number; // 热力作用半径像素
//     zooms?: Array<number>;
//     opacity?: Array<number>; // 最小和最大透明度 默认[0, 1]
//     gradient?: { [index: string]: string }; // 色带
// }

// export interface IHeatData {
//     value: number;
//     x: number;
//     y: number;
// }