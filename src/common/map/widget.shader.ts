import Cesium, { PostProcessStage } from "cesium";
import { isArray, merge } from "lodash";

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

const _options: IShaderOptions = {};

export class Shader {

    private isDestroyed: boolean = false;
    public isShow: boolean = true;

    public data: Array<Cesium.PostProcessStage> = [];

    public constructor(
        public map: Cesium.Viewer,
        public id: string,
        public options: IShaderOptions = {}
    ) {
        if (!map) return;
        if (!id) {
            console.error("请设置Shader控件id");
            return;
        }

        this.options = merge(_options, options);
    }

    public addToMap() {
        //
    }

    public add(data: IShaderData | Array<IShaderData>, options: IShaderOptions = {}): this {
        if (!data || !this.map) return this;

        const _options: IShaderOptions = merge({}, this.options, options);
        
        const _data: any = isArray(data) ? data : [data];
        for (let i = 0; i < _data.length; i++) {
            const item = _data[i];
            if (!Shader.checkData(item)) continue;
            this.clear(item.id);
            const stage = new PostProcessStage({ ..._options, name: item.id, ...item });
            this.isShow && this.map.scene.postProcessStages.add(stage);
            this.data.push(stage);
        }

        return this;
    }

    public clear(id?: string): this {
        if (id) {
            const index = this.data.findIndex(g => g.name === id);
            if (~index) {
                this.map?.scene.postProcessStages.remove(this.data.splice(index, 1)[0]);
            }
        } else {
            for (let i = 0; i < this.data.length; i++) {
                this.map?.scene.postProcessStages.remove(this.data[i]);
            }
            this.data = [];
        }
        return this;
    }

    public show(): this {
        if (this.isShow) return this;
        for (let i = 0; i < this.data.length; i++) {
            const item = this.data[i];
            const stage = new PostProcessStage({
                name: item.name,
                fragmentShader: item.fragmentShader,
                uniforms: item.uniforms,
                textureScale: item.textureScale,
                forcePowerOfTwo: Boolean(item.forcePowerOfTwo),
                sampleMode: item.sampleMode,
                pixelFormat: item.pixelFormat,
                pixelDatatype: item.pixelDatatype,
                clearColor: item.clearColor,
                scissorRectangle: item.scissorRectangle
            });
            this.map?.scene.postProcessStages.add(stage);
            this.data[i] = stage;
        }
        this.isShow = true;
        return this;
    }

    public hide(): this {
        if (!this.isShow) return this;
        for (let i = 0; i < this.data.length; i++) {
            this.map?.scene.postProcessStages.remove(this.data[i]);
        }
        this.isShow = false;
        return this;
    }

    public destroy() {
        if (this.isDestroyed) return;
        this.clear();
        this.isDestroyed = true;
    }

    private static checkData(data: IShaderData): boolean {
        if (!data) {
            console.warn("Shader 数据为空");
            return false;
        }
        if (!data.id) {
            console.warn("Shader id错误", data);
            return false;
        }
        if (!data.fragmentShader) {
            console.warn("Shader fragmentShader 错误", data);
            return false;
        }

        return true;
    }

}