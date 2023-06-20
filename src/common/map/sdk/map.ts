import { ISetting, IOptions, ICameraInfo } from "./interface";
import { setting as _setting, options as _options } from "./configs/config";
import { Utils } from "./utils/utils";
import { Global } from "@/common/namespace/global";
import { merge } from "lodash";
import Cesium, {
    Viewer,
    Entity,
    Math as _Math,
    ScreenSpaceEventType,
    ProviderViewModel,
    SceneMode,
    ArcGisMapServerImageryProvider,
    EventHelper,
    ScreenSpaceEventHandler,
    PointGraphics,
    UrlTemplateImageryProvider,
    Color,
    JulianDate,
    HeadingPitchRange,
    Rectangle,
    Ion,
    createWorldTerrain,
    PrimitiveCollection,
    CesiumTerrainProvider,
    GeoJsonDataSource,
    TileMapServiceImageryProvider,
    buildModuleUrl
} from "cesium";
// import "cesium/Build/Cesium/Widgets/widgets.css";
import "cesium/Source/Widgets/widgets.css";
import { webSetting } from "@/settings";
import viewerCesiumNavigationMixin from "@/components/cesium-navigation-es6/viewerCesiumNavigationMixin.js";
import { Console } from "console";
// (<any>window).CESIUM_BASE_URL = "../node_modules/cesium/Build/Cesium/";
export class CMap {

    private _isCameraFrozen: boolean = false;

    private events: { mouse: any; camera: Array<string>; subscriptions: Map<Function | string, Cesium.ScreenSpaceEventHandler> } = {
        // private events: { mouse: any; camera: Array<string>; subscriptions: Map<string, Map<Function | string, (evt: any, event?: string) => any>> } = {
        mouse: {
            "click": ScreenSpaceEventType.LEFT_CLICK,
            "dblclick": ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
            "mousemove": ScreenSpaceEventType.MOUSE_MOVE,
            "mouseup": ScreenSpaceEventType.LEFT_UP,
            "mousedown": ScreenSpaceEventType.LEFT_DOWN,
            "mousewheel": ScreenSpaceEventType.WHEEL,
            "rightclick": ScreenSpaceEventType.RIGHT_CLICK,
            "middleclick": ScreenSpaceEventType.MIDDLE_CLICK
        },
        camera: ["moveStart", "moveEnd"],
        subscriptions: new Map()
    };
    // public eventHandler!: Cesium.ScreenSpaceEventHandler;
    private isLoad: boolean = false;
    private _load!: Function;
    public load = new Promise((resolve, reject) => {
        this._load = resolve;
    });

    public viewMode!: "2D" | "3D";

    public viewer: Cesium.Viewer | null = null;

    public layers: Map<string, any> = new Map();
    public czml: Map<string, any> = new Map();
    public widgets: Map<string, any> = new Map();

    public get freezeCamera(): boolean {
        return this._isCameraFrozen;
    }
    public set freezeCamera(freeze: boolean) {
        if (!this.viewer?.scene.screenSpaceCameraController) return;
        this.viewer.scene.screenSpaceCameraController.enableRotate = !freeze;
        this.viewer.scene.screenSpaceCameraController.enableZoom = !freeze;
        this._isCameraFrozen = freeze;
    }

    public constructor(
        public mapElement: HTMLElement | string,
        public setting: ISetting = {},
        public options: IOptions = {}
    ) {
        if (typeof mapElement === "string") {
            const ele = document.getElementById(mapElement);
            if (!ele) {
                console.error("检查地图id", mapElement);
                return;
            }
            this.mapElement = ele;
        }
        // console.log("setting: " + setting.center.x);
        this.options = merge({}, _options, options);
        this.setting = merge({}, _setting, setting);

        // console.log("this.setting: " + this.setting.center.x);

        const id = (<HTMLElement>this.mapElement).id;
        if (Global.cmap.has(id)) {// 复用地图实例
            const cmap: CMap = Global.cmap.get(id);
            cmap.options = this.options;
            this.options.clear && cmap.clear();
            cmap.load?.then(() => this.options.onMapLoad?.(cmap));
            return cmap;
        } else { // 创建新实例
            this.initialize();
            this.options.store && Global.cmap.set(id, this); // 保存新实例
        }
    }

    public addLayer(layer: any): this {
        if (!layer) return this;

        layer.addToMap?.();
        this.layers.set(layer.id, layer);
        return this;
    }

    public removeLayer(id?: string): this {
        if (id) {
            const layer = this.layers.get(id);
            layer?.destroy?.();
            this.layers.delete(id);
        } else {
            this.layers.forEach(layer => layer?.destroy?.());
            this.layers.clear();
        }
        return this;
    }

    public addCzml(czml: any): this {
        if (!czml) return this;

        czml.addToMap?.();
        this.czml.set(czml.id, czml);
        return this;
    }

    public removeCzml(id?: string): this {
        if (id) {
            const czml = this.czml.get(id);
            czml?.destroy?.();
            this.czml.delete(id);
        } else {
            this.czml.forEach(czml => czml?.destroy?.());
            this.czml.clear();
        }
        return this;
    }

    public addWidget(widget: any): this {
        if (!widget) return this;

        widget.addToMap?.();
        this.widgets.set(widget.id, widget);
        return this;
    }

    public removeWidget(id?: string): this {
        if (id) {
            const widget = this.widgets.get(id);
            widget?.destroy?.();
            this.widgets.delete(id);
        } else {
            this.widgets.forEach(widget => widget?.destroy?.());
            this.widgets.clear();
        }
        return this;
    }

    public moveToEntity(id: string, heading: number, pitch: number, range: number) {
        let entity = this.viewer.entities.getById(id);
        let hpr = new HeadingPitchRange(_Math.toRadians(heading), _Math.toRadians(pitch), range);
        if (!entity) {
            console.error("error! Can't find the entity!");
            return;
        }
        else this.viewer.zoomTo(entity, hpr);
    }

    /**
     * 显示地图
     */
    public show(viewMode?: this["viewMode"]): this {
        (<HTMLElement>this.mapElement).style.visibility = "visible";

        if (!this.viewer || !viewMode) return this;

        this.viewMode = viewMode;
        switch (viewMode) {
            case "2D": {
                this.setting.center = this.getCameraInfo();
                this.viewer.scene.morphTo2D(0);
                let { x, y, height, range, heading, pitch, roll } = { ...this.setting.center };
                this.flyTo({ x: x, y: y, height: height * 5, duration: 2000, ...this.setting });
                break;
            }
            case "3D": {
                this.viewer.scene.morphTo3D(0);
                let { x, y, height, range, heading, pitch, roll } = { ...this.setting.center };
                this.flyTo({ x: x, y: y, height: height, range: range, heading: heading, pitch: pitch, roll: roll, duration: 2000, ...this.setting });
                break;
            }
        }
        return this;
    }

    /**
     * 隐藏地图
     */
    public hide(): this {
        (<HTMLElement>this.mapElement).style.visibility = "hidden";
        return this;
    }

    public clear(): this {
        if (!this.viewer) return this;
        this.hideClock();
        if (this.viewer.trackedEntity) this.viewer.trackedEntity = undefined;
        this.removeLayer();
        this.removeWidget();
        this.viewer.entities.removeAll();
        this.viewer.dataSources.removeAll(true);
        // this.viewer.scene.primitives.destroyPrimitives = false;
        for (let i = 0; i < this.viewer.scene.primitives.length; i++) {
            const item = this.viewer.scene.primitives.get(i);
            if (item instanceof PrimitiveCollection) continue;
            this.viewer.scene.primitives.remove(item);
            // if (!ele.destroyPrimitives) this.viewer.scene.primitives.remove(ele);
        }
        // this.viewer.scene.primitives.removeAll();
        this.viewer.postProcessStages.removeAll();
        return this;
    }

    // public centerAt(args: ICameraInfo = {}): this {
    //     if (!this.viewer || !args.x || !args.y) return this;

    //     let { x, y, range, heading, pitch } = { ...this.getCameraInfo(), ...args };

    //     this.viewer.camera.lookAt(Cartesian3.fromDegrees(<number>x, <number>y), new HeadingPitchRange(CMath.toRadians(<number>heading), CMath.toRadians(<number>pitch), range));
    //     this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);

    //     return this;
    // }

    public centerAt(args: ICameraInfo = {}): Promise<this> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.viewer || !args.x || !args.y) return resolve(this);

                let { x, y, range, heading, pitch, duration = 2000, wait = 0 } = { ...this.getCameraInfo(), ...args };

                const entity = new Entity({
                    position: Utils.degreeToCartesian3({ x: <number>x, y: <number>y }),
                    point: new PointGraphics({
                        color: new Color(1, 1, 1, 0),
                        outlineColor: new Color(1, 1, 1, 0)
                    })
                });
                this.viewer.entities.add(entity);
                setTimeout(() => {
                    this.viewer?.flyTo(entity, {
                        duration: duration / 1000,
                        offset: new HeadingPitchRange(Utils.degreeToRadian(<number>heading), Utils.degreeToRadian(<number>pitch), range)
                    }).then(() => (<Cesium.Viewer>this.viewer).entities.remove(entity));
                }, 0);
                setTimeout(() => resolve(this), duration + wait);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 相机飞行
     *
     * @param {ICameraInfo} [args={}]
     * @returns {Promise<this>}
     * @memberof CMap
     */
    public flyTo(args: ICameraInfo = {}): Promise<this> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.viewer || !args.x || !args.y) return resolve(this);
                let { x, y, height, heading, pitch, roll, duration = 2000, wait = 0 } = { ...this.getCameraInfo(), ...args };
                const cartesian3 = Utils.degreeToCartesian3({ x: <number>x, y: <number>y, z: height });
                if (!cartesian3) return resolve(this);
                this.viewer.camera.flyTo({
                    destination: cartesian3,
                    orientation: {
                        heading: Utils.degreeToRadian(<number>heading),
                        pitch: Utils.degreeToRadian(<number>pitch),
                        roll: Utils.degreeToRadian(<number>roll)
                    },
                    duration: duration / 1000
                });
                setTimeout(() => resolve(this), duration + wait);
            } catch (error) {
                reject(error);
            }
        });
    }

    public getCenter(): { x: number; y: number } | undefined {
        const rectangle = this.viewer?.camera.computeViewRectangle();
        if (!rectangle) return;
        return Utils.cartographicToDegree(Rectangle.center(rectangle));
    }

    public getCameraInfo(): ICameraInfo | undefined {
        if (!this.viewer) return;
        const point = Utils.cartesian3ToDegree(this.viewer.camera.position);
        if (!point) return;
        const cartesian3 = Utils.degreeToCartesian3(this.getCenter() as any);
        return {
            "x": point.x,
            "y": point.y,
            "height": point.z,
            "range": cartesian3 && Utils.getDistance(this.viewer.camera.position, cartesian3),
            "heading": Utils.radianToDegree(this.viewer.camera.heading),
            "pitch": Utils.radianToDegree(this.viewer.camera.pitch),
            "roll": Utils.radianToDegree(this.viewer.camera.roll)
        };
    }

    public zoomIn(height: number = (this.getCameraInfo()?.range || 0) / 4): this {
        this.viewer?.camera.zoomIn(height);
        return this;
    }

    public zoomOut(height: number = (this.getCameraInfo()?.range || 0) * 1.25): this {
        this.viewer?.camera.zoomOut(height);
        return this;
    }

    public getZoom(): number | undefined {
        const { height } = this.getCameraInfo() || {};
        return Utils.getZoomOrHeight(height, null, this.setting.heights, this.setting.zooms);
    }

    public setZoom(zoom: number): this {
        if (!this.viewer || !zoom) return this;

        this.flyTo({ ...this.getCameraInfo(), height: Utils.getZoomOrHeight(null, zoom, this.setting.heights, this.setting.zooms) });
        return this;

        // const curZoom = this.getZoom() as number;
        // let amount = this.convertZoom(null, Math.abs(zoom - curZoom));
        // const { range, height } = this.getCameraInfo() || {};
        // if (!amount || !range || !height) return this;

        // amount *= range / height;
        // zoom > curZoom ? this.viewer.camera.zoomIn(amount) : this.viewer.camera.zoomOut(amount);
        // return this;
    }

    public rebackCenter(center?: ICameraInfo): Promise<this> {
        return this.flyTo({ ...center, ...this.setting.center, duration: 2000 });
    }

    public Viewchenge(type: number) {
        // console.log(this.getCameraInfo());
        let camera = this.getCameraInfo();
        let desheight: any;
        switch (type) {
            case 0: desheight = this.setting.nearmidfar.nearHeight; break;
            case 1: desheight = this.setting.nearmidfar.middleHeight; break;
            case 2: desheight = this.setting.nearmidfar.farHeight; break;
        }
        if (desheight < camera.height) {
            this.zoomIn(camera.height - desheight);
        }
        else {
            this.zoomOut(desheight - camera.height);
        }
    }

    public showClock() {
        if (!this.viewer) return;
        this.viewer.clock.canAnimate = true;
        const clock = (<HTMLElement>this.mapElement).querySelector(".cesium-viewer-animationContainer") as HTMLElement;
        const timeline = (<HTMLElement>this.mapElement).querySelector(".cesium-viewer-timelineContainer") as HTMLElement;
        if (clock) clock.style.visibility = "visible";
        if (timeline) timeline.style.visibility = "visible";
    }

    public hideClock() {
        if (!this.viewer) return;
        this.viewer.clock.canAnimate = false;
        const clock = (<HTMLElement>this.mapElement).querySelector(".cesium-viewer-animationContainer") as HTMLElement;
        const timeline = (<HTMLElement>this.mapElement).querySelector(".cesium-viewer-timelineContainer") as HTMLElement;
        if (clock) clock.style.visibility = "hidden";
        if (timeline) timeline.style.visibility = "hidden";
    }

    /**
     * 设置相机高度 
     *
     * @param {number} [minHeight] 单位米
     * @param {number} [maxHeight] 单位米
     * @returns {this}
     * @memberof CMap
     */
    public limitCameraHeight(minHeight?: number, maxHeight?: number): this {
        if (!this.viewer) return this;
        minHeight && (this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = minHeight);
        maxHeight && (this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = maxHeight);
        return this;
    }

    // public broadcast(event: string, evt: any) {
    //     for (const cb of this.events.subscriptions.get(event)?.values() || []) {
    //         cb(evt, event);
    //     }
    //     // [...this.events.subscriptions.get(event)?.values() || []].forEach(g => g(evt, event));
    // }

    // public subscribe(events: Array<string> = Object.keys(this.events.mouse), callback: (evt: any, event?: string) => any) {
    //     if (!(callback instanceof Function)) {
    //         console.warn("订阅失败", callback);
    //         return;
    //     }
    //     events.forEach(event => this.events.subscriptions.get(event)?.set(callback, callback));
    // }

    // public unSubscribe(events: Array<string> = Object.keys(this.events.mouse), callback: (evt: any, event?: string) => any) {
    //     if (!(callback instanceof Function)) {
    //         console.warn("取消订阅失败", callback);
    //         return;
    //     }
    //     events.forEach(event => this.events.subscriptions.get(event)?.delete(callback));
    // }

    public subscribe(callback: (evt: any, eventName?: string) => any, eventNames: Array<string> = Object.keys(this.events.mouse)) {
        if (!(callback instanceof Function) || !this.viewer) {
            console.warn("订阅失败", callback);
            return;
        }

        let eventHandler = this.events.subscriptions.get(callback);
        if (!eventHandler) {
            eventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
            this.events.subscriptions.set(callback, eventHandler);
        }

        eventNames.forEach(eventName => {
            (<Cesium.ScreenSpaceEventHandler>eventHandler).setInputAction((evt: any) => {
                if (eventName === "dblclick" && (<Viewer>this.viewer).trackedEntity) (<Viewer>this.viewer).trackedEntity = undefined;
                callback(evt, eventName);
            }, this.events.mouse[eventName]);
        });
    }

    public unSubscribe(callback: (evt: any, event?: string) => any, eventNames?: Array<string>) {
        if (!(callback instanceof Function)) {
            console.warn("取消订阅失败", callback);
            return;
        }
        const eventHandler = this.events.subscriptions.get(callback);
        if (!eventHandler) return;

        if (eventNames?.length) {
            eventNames.forEach(eventName => eventHandler.removeInputAction(this.events.mouse[eventName]));
        } else {
            eventHandler.destroy();
            this.events.subscriptions.delete(callback);
        }
    }

    public destroy() {
        if (!this.viewer) return;
        this.unRegisterEvent();
        this.clear();
        this.viewer.destroy();
        this.viewer = null;
        this.isLoad = false;
    }

    private initialize() {
        if (this.viewer) return;

        // 解析配置选项
        const { viewMode = "3D", assetsUrl, arcGisMapServerImagery, token, _setting } = this.setting;
        this.viewMode = viewMode as any;

        // tslint:disable-next-line:variable-name
        let img_normal = new ProviderViewModel({
            name: "影像底图",
            tooltip: "影像底图",
            iconUrl: `${webSetting.assetsUrl}/image/worldimagery.png`,
            creationFunction: function () {
                let esri = new UrlTemplateImageryProvider({
                    url: `${webSetting.baseMapHost}` + "/map/image/tiles/{z}/{x}/{reverseY}.jpg"
                });
                return esri;
            }
        });

        // tslint:disable-next-line:variable-name
        let img_road = new ProviderViewModel({
            name: "街道底图",
            tooltip: "街道底图",
            iconUrl: `${webSetting.assetsUrl}/image/streetmap.png`,
            creationFunction: function () {
                let esri = new UrlTemplateImageryProvider({
                    url: `${webSetting.baseMapHost}` + "/map/road/tiles/{z}/{x}/{reverseY}.jpg"
                });
                return esri;
            }
        });

        // tslint:disable-next-line:variable-name
        let img_sea = new ProviderViewModel({
            name: "海洋底图",
            tooltip: "海洋底图",
            iconUrl: `${webSetting.assetsUrl}/image/seamap.png`,
            creationFunction: function () {
                let esri = new UrlTemplateImageryProvider({
                    url: `${webSetting.baseMapHost}` + "/map/sea/tiles/{z}/{x}/{reverseY}.jpg"
                });
                return esri;
            }
        });

        if (assetsUrl) (<any>window).CESIUM_BASE_URL = assetsUrl;
        if (token) Ion.defaultAccessToken = token;
        // case
        if (window.location.href.indexOf("case") !== -1) {
            this.viewer = new Viewer(this.mapElement, {
                sceneMode: <any>SceneMode["SCENE" + this.viewMode as any],
                animation: true,
                shouldAnimate: true,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                imageryProviderViewModels: [img_normal, img_road],
                selectedImageryProviderViewModel: img_normal,
                terrainProviderViewModels: [],
                infoBox: true,
                timeline: true,
                sceneModePicker: false,
                selectionIndicator: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                creditContainer: document.createElement("div"),
                orderIndependentTranslucency: false,
                contextOptions: {
                    webgl: {
                        alpha: true
                    }
                },
                // imageryProvider: new TileMapServiceImageryProvider({
                //     url: buildModuleUrl("Assets/Textures/SkyBox")
                // })
                // ...arcGisMapServerImagery ? { imageryProvider: new ArcGisMapServerImageryProvider({ url: arcGisMapServerImagery }) } : {},
                // terrainProvider: createWorldTerrain({
                //    requestWaterMask: true,
                //    requestVertexNormals: true
                // }),

                // imageryProvider: new ArcGisMapServerImageryProvider({ url: arcGisMapServerImagery }),
                // ...(`${webSetting.useLocalMap}` !== "yes") ? {
                ...(`${webSetting.baseMapHost}`) ? {
                    imageryProvider: new UrlTemplateImageryProvider({
                        url: `${webSetting.baseMapHost}` + "/map/tiles/{z}/{x}/{reverseY}.jpg",
                        maximumLevel: 16,
                        minimumLevel: 1
                    }),
                    terrainProvider: new CesiumTerrainProvider({
                        url: `${webSetting.baseMapHost}` + "/map/terrain",
                        requestWaterMask: true,
                        requestVertexNormals: true
                    })
                } : {
                    ...arcGisMapServerImagery ? { imageryProvider: new ArcGisMapServerImageryProvider({ url: arcGisMapServerImagery }) } : {},
                    terrainProvider: createWorldTerrain({
                        requestWaterMask: true,
                        requestVertexNormals: true
                    })
                },
                // imageryProvider: new ArcGisMapServerImageryProvider({ url: arcGisMapServerImagery }),
                // terrainProvider: createWorldTerrain({
                //    requestWaterMask: true,
                //    requestVertexNormals: true
                // }),
                imageryProvider: new UrlTemplateImageryProvider({
                    url: `${webSetting.baseMapHost}` + "/map/image/tiles/{z}/{x}/{reverseY}.jpg",
                    maximumLevel: 19,
                    minimumLevel: 1
                }),
                terrainProvider: new CesiumTerrainProvider({
                    url: `${webSetting.baseMapHost}` + "/map/terrain",
                    requestWaterMask: true,
                    requestVertexNormals: true
                }),
                ..._setting
            });
        }
        // coFly
        else {
            this.viewer = new Viewer(this.mapElement, {
                sceneMode: <any>SceneMode["SCENE" + this.viewMode as any],
                animation: true,
                shouldAnimate: true,
                baseLayerPicker: true,
                geocoder: false,
                homeButton: true,
                imageryProviderViewModels: [img_normal, img_road, img_sea],
                selectedImageryProviderViewModel: img_normal,
                terrainProviderViewModels: [],
                infoBox: false,
                timeline: true,
                sceneModePicker: true,
                selectionIndicator: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                creditContainer: document.createElement("div"),
                orderIndependentTranslucency: false,
                contextOptions: {
                    webgl: {
                        alpha: true
                    }
                },
                ...(`${webSetting.innerWeb}`) ? {
                    ...(webSetting.innerWeb && `${webSetting.baseMapHost}`) ? {
                        imageryProvider: new UrlTemplateImageryProvider({
                            url: `${webSetting.baseMapHost}` + "/map/image/tiles/{z}/{x}/{reverseY}.jpg",
                            maximumLevel: 19,
                            minimumLevel: 1
                        }),
                        terrainProvider: new CesiumTerrainProvider({
                            url: `${webSetting.baseMapHost}` + "/map/terrain",
                            requestWaterMask: true,
                            requestVertexNormals: true
                        })
                    } : {
                        ...arcGisMapServerImagery ? { imageryProvider: new ArcGisMapServerImageryProvider({ url: arcGisMapServerImagery }) } : {},
                        terrainProvider: createWorldTerrain({
                            requestWaterMask: true,
                            requestVertexNormals: true
                        })
                    }
                } : {
                    terrainProvider: new CesiumTerrainProvider({
                        url: `${webSetting.baseMapHost}` + "/map/terrain",
                        requestWaterMask: true,
                        requestVertexNormals: true
                    })
                },
                ..._setting
            });
        }

        this.hideClock();
        // this.viewer.imageryLayers.addImageryProvider(
        //     new UrlTemplateImageryProvider({
        //         url: `${webSetting.baseMapHost}` + "/map/road_tiles/tiles/{z}/{x}/{reverseY}.jpg",
        //         maximumLevel: 16,
        //         minimumLevel: 1
        //     })
        //     ,1);

        // this.viewer.scene.globe.enableLighting = true; // 光线
        // this.viewer._cesiumWidget._creditContainer.style.display = "none"; // 取消版权信息

        this.limitCameraHeight(...this.setting.heights || []);

        // 注册load事件
        const event = new EventHelper();
        event.add(this.viewer.scene.globe.tileLoadProgressEvent, (e: any) => {
            e === 0 && !this.isLoad && this.onMapLoad();
        });
    }

    private onMapLoad() {
        if (this.isLoad) return;
        // console.log("onMapLoad");
        // this.viewer.scene.globe.enableLighting = true;

        // 定位到设置点位
        this.flyTo({ ...this.setting.center, duration: 0 });
        // 注册事件
        this.registerEvent();
        // 触发外部load事件
        this.options.onMapLoad?.(this);
        this.isLoad = true;
        this._load?.(this);
        // ==========================
        // 行政边界显示
        // this.viewer.dataSources.add(GeoJsonDataSource.load(`${webSetting.baseMapHost}/map/china.json`, {
        //     stroke: Color.RED,
        //     fill: new Color(0, 0, 0, 0),
        //     strokeWidth: 3
        // }));
        // ==========================
        // 加载罗盘
        let options = {
            enableCompass: true,
            enableZoomControls: false,
            enableDistanceLegend: true,
            enableCompassOuterRing: true
        };
        // this.viewer.extend(viewerCesiumNavigationMixin, options);
        // ===========================
    }

    private registerEvent() {
        if (!this.viewer || !this.options.onEvent) return;
        // 注册相机事件
        this.events.camera.forEach(eventName => {
            (<any>this.viewer?.camera)[eventName].addEventListener((evt: any) => {
                this.options.onEvent?.(evt, eventName);
            });
        });
        // 注册鼠标事件
        this.subscribe(this.options.onEvent);
        // this.eventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // Object.keys(this.events.mouse).forEach(event => {
        //     this.eventHandler.setInputAction((evt: any) => {
        //         if (event === "dblclick" && (<Viewer>this.viewer).trackedEntity) (<Viewer>this.viewer).trackedEntity = undefined;
        //         this.options.onEvent?.(event, evt);
        //         this.broadcast(event, evt);
        //     }, this.events.mouse[event]);

        //     this.events.subscriptions.set(event, new Map());
        // });
    }

    private unRegisterEvent() {
        if (!this.options.onEvent) return;
        this.unSubscribe(this.options.onEvent);
        // if (!this.eventHandler) return;
        // Object.keys(this.events.mouse).forEach(event => this.eventHandler.removeInputAction(this.events.mouse[event]));
        // this.eventHandler.destroy();
        // this.events.subscriptions.clear();
    }

    // private convertZoom(height?: number | null, zoom?: number | null): number | undefined {
    //     if ((!height && !zoom) || (height && zoom)) return;

    //     const [minHeight, maxHeight, minZoom, maxZoom] = [...this.setting.height as Array<number>, ...this.setting.zooms as Array<number>];
    //     if (height) {
    //         if (height <= minHeight) {
    //             return maxZoom;
    //         } else if (height >= maxHeight) {
    //             return minZoom;
    //         } else {
    //             return Math.round(maxZoom * (height - minHeight) / (maxHeight - minHeight)) || 1;
    //         }
    //     } else if (zoom) {
    //         return Math.round(maxHeight * zoom / (maxZoom - minZoom + 1));
    //     }
    // }

}