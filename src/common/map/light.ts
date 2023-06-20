import Cesium, {
    Viewer,
    Math as _Math,
    PostProcessStageLibrary,
    PostProcessStage,
    defined,
    JulianDate,
    ClockStep
} from "cesium";
import { CMap } from "./sdk/map";

export class Light {
    private brightnessStage!: PostProcessStage;
    private id: string = `LightEffect-${new Date().getTime().toString()}`;
    private isDestroyed: boolean = false;

    public brightness: number = 1;
    public map!: Cesium.Viewer;

    public constructor(public cmap: CMap) {
        if (!cmap.viewer) {
            console.warn("光照效果初始化失败");
            return;
        }
        this.map = this.cmap.viewer as Cesium.Viewer;
        cmap.addLayer(this);
    }

    public addToMap() {
        //
    }

    public setBrightness(brightness: number = 1) {
        if(defined(this.brightnessStage)) {
            this.map.postProcessStages.remove(this.brightnessStage);
        }

        this.brightnessStage = PostProcessStageLibrary.createBrightnessStage();
        this.brightness = brightness;
        this.brightnessStage.uniforms.brightness = brightness;
        this.map.postProcessStages.add(this.brightnessStage);
    }

    public destroy() {
        if (this.isDestroyed) return;

        this.map.clockViewModel.multiplier = 1.0;
        this.map.clock.shouldAnimate = false;
        this.map.postProcessStages.remove(this.brightnessStage);
        this.cmap.viewer.scene.globe.enableLighting = false;
        this.cmap.viewer.shadows = false;
        
        this.isDestroyed = true;
        this.cmap.removeLayer(this.id);
    }
}
