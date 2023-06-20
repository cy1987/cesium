import { Shader } from "./widget.shader";
import { merge } from "lodash";
import Cesium, {
    Math as _Math,
    Cartesian4
} from "cesium";
import { CMap } from "./sdk/map";

export class Weather {

    private data: Array<any> = [];
    private id: string = `LightEffect-${new Date().getTime().toString()}`;
    private isDestroyed: boolean = false;

    public snow!: Snow;
    public rain!: Rain;
    public fog!: Fog;
    public map!: Cesium.Viewer;

    public constructor(public cmap: CMap) {
        if (!cmap.viewer) {
            console.warn("天气初始化失败");
            return;
        }
        this.map = this.cmap.viewer as Cesium.Viewer;
        cmap.addLayer(this);

        this.data.push(this.snow = new Snow(this.map));
        this.data.push(this.rain = new Rain(this.map));
        this.data.push(this.fog = new Fog(this.map));
    }
    
    public addToMap() {
        //
    }

    public show(weather?: "snow" | "rain" | "fog", options?: ISnowOptions | IRainOptions | IFogOptions) {
        if (weather) {
            (<any>this)[weather]?.show?.(options);
        } else {
            this.data.forEach(g => g.show?.(options));
        }
    }
    public hide(weather?: "snow" | "rain" | "fog") {
        if (weather) {
            (<any>this)[weather]?.hide?.();
        } else {
            this.data.forEach(g => g.hide?.());
        }
    }
    public destroy(weather?: "snow" | "rain" | "fog") {
        if (weather) {
            (<any>this)[weather]?.destroy?.();
        } else {
            if (this.isDestroyed) return;
            this.data.forEach(g => g.destroy?.());
            this.isDestroyed = true;
            this.cmap.removeLayer(this.id);
        }
    }
    
}

interface IWeather {
    isShow: boolean;
    options: any;
    show: Function;
    hide: Function;
    destroy: Function;
}

interface ISnowOptions {
    speedMultiplier?: number; // 速度，越小越慢
    scaleMultiplier?: number; // 放大缩小
    brightness?: number; // 亮度
}

class Snow implements IWeather {

    private shader: Shader | null = null;
    public isShow: boolean = false;

    public constructor(
        public map: Cesium.Viewer,
        public options: ISnowOptions = {}
    ) {
        if (!map) return;
        this.shader = new Shader(map, `Snow-${new Date().getTime()}`);
    }
    public show(options: ISnowOptions = {}) {
        merge(this.options, options);
        this.shader?.add({
            id: "czm_snow",
            fragmentShader: FragmentShaders.snow,
            uniforms: {
                snowByDistance: new Cartesian4(100.0, 1.0, 15000, 0.0),// 100米内不透明，15000米外透明
                speedMultiplier: () => this.options.speedMultiplier,
                scaleMultiplier: () => this.options.scaleMultiplier,
                brightness: () => this.options.brightness
            }
        });
        this.isShow = true;
    }
    public hide() {
        this.shader?.clear("czm_snow");
        this.isShow = false;
    }
    public destroy() {
        if (!this.shader) return;
        this.shader.destroy();
        this.shader = null;
    }
}

interface IRainOptions {
    rainSpeed?: number; // 雨的速度
    rainColorDepth?: number; // 深浅
    brightness?: number; // 亮度
}

class Rain implements IWeather {

    private shader: Shader | null = null;
    public isShow: boolean = false;

    public constructor(
        public map: Cesium.Viewer,
        public options: IRainOptions = {}
    ) {
        if (!map) return;
        this.shader = new Shader(map, `Rain-${new Date().getTime()}`);
    }
    public show(options: IRainOptions = {}) {
        merge(this.options, options);
        this.shader?.add({
            id: "czm_rain",
            fragmentShader: FragmentShaders.rain,
            uniforms: {
                rainByDistance: new Cartesian4(100.0, 1.0, 15000, 0.0),// 100米内不透明，15000米外透明
                rainSpeed: () => this.options.rainSpeed,
                rainColorDepth: () => this.options.rainColorDepth,
                brightness: () => this.options.brightness
            }
        });
        this.isShow = true;
    }
    public hide() {
        this.shader?.clear("czm_rain");
        this.isShow = false;
    }
    public destroy() {
        if (!this.shader) return;
        this.shader.destroy();
        this.shader = null;
    }
}

interface IFogOptions {
    density?: number;// 雾浓度
}

class Fog implements IWeather {
    private shader: Shader | null = null;
    public isShow: boolean = false;

    public constructor(
        public map: Cesium.Viewer,
        public options: IFogOptions = {}
    ) {
        if (!map) return;
        this.shader = new Shader(map, `Fog-${new Date().getTime()}`);
        this.map.scene.fog.density = 0;
        this.map.scene.fog.minimumBrightness = 0;
    }

    public show(options: IFogOptions = {}) {
        merge(this.options, options);
        this.shader?.add({
            id: "czm_fog",
            fragmentShader: FragmentShaders.fog,
            uniforms: {
                fogcolor: new Cartesian4(0.8,0.8,0.8,0.5),
                fogByDistance: new Cartesian4(10000.0, 1.0, 80000, 0.0),// 10000米内不透明，80000米外透明
                density: () => this.options.density
            }
        });
        this.isShow = true;
    }
    public hide() {
        this.shader?.clear("czm_fog");
        this.isShow = false;
    }
    public destroy() {
        if (!this.shader) return;
        this.shader.destroy();
        this.shader = null;
    }

}

export namespace FragmentShaders {
    export const snow: string = `
        //计算每个渲染顶点和视点（相机）的距离
        float getDistance(sampler2D depthTexture, vec2 texCoords)
        {
            float depth = czm_unpackDepth(texture2D(depthTexture, texCoords));
            if (depth == 0.0) {
                return czm_infinity;
            }
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            return -eyeCoordinate.z / eyeCoordinate.w;
        }
        //计算雾化距离（当它远离眼睛位置时，系数变小）
        float interpolateByDistance(vec4 nearFarScalar, float distance)
        {
            float startDistance = nearFarScalar.x;//雾化的起点距离
            float startValue = nearFarScalar.y;
            float endDistance = nearFarScalar.z;
            float endValue = nearFarScalar.w;
            float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
            return mix(startValue,endValue,t );
        }
        vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
        {
            return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
        }
    
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        uniform vec4 snowByDistance;
        uniform float scaleMultiplier;
        uniform float speedMultiplier;
        uniform float brightness;
        varying vec2 v_textureCoordinates;
    
        float snow(vec2 uv,float scale)
        {
            scale*=scaleMultiplier;
            float time = czm_frameNumber / 60.0;
            time*=speedMultiplier;
            float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
            uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
            uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
            p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
            k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
            return k*w;
        }
    
        void main(void){
            vec2 resolution = czm_viewport.zw;
            vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
            vec3 snowColor=vec3(0);
            float c = 0.0;
            c+=snow(uv,30.)*.0;
            c+=snow(uv,20.)*.0;
            c+=snow(uv,15.)*.0;
            c+=snow(uv,10.);
            c+=snow(uv,8.);
            c+=snow(uv,6.);
            c+=snow(uv,5.);
            snowColor=(vec3(c));
            
            vec4 s=(vec4(snowColor,1));
            float distance = getDistance(depthTexture, v_textureCoordinates);
            vec4 sceneColor = texture2D(colorTexture, v_textureCoordinates);
            float blendAmount = interpolateByDistance(snowByDistance, distance);
            vec4 finalColor = vec4(s.rgb * blendAmount, s.a);
            gl_FragColor = mix(sceneColor, finalColor, brightness);
            
            //gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(snowColor,1), 0.5);
    
        }
    `;

    export const rain: string = `
        //计算每个渲染顶点和视点（相机）的距离
        float getDistance(sampler2D depthTexture, vec2 texCoords)
        {
            float depth = czm_unpackDepth(texture2D(depthTexture, texCoords));
            if (depth == 0.0) {
                return czm_infinity;
            }
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            return -eyeCoordinate.z / eyeCoordinate.w;
        }
        //计算雾化距离（当它远离眼睛位置时，系数变小）
        float interpolateByDistance(vec4 nearFarScalar, float distance)
        {
            float startDistance = nearFarScalar.x;//雾化的起点距离
            float startValue = nearFarScalar.y;
            float endDistance = nearFarScalar.z;
            float endValue = nearFarScalar.w;
            float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
            return mix(startValue,endValue,t );
        }
        
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;
        uniform vec4 rainByDistance;
        uniform float rainSpeed;
        uniform float rainColorDepth;
        uniform float brightness;
        varying vec2 v_textureCoordinates;
        
        float hash(float x){
            return fract(sin(x*133.3)*13.13);
        }
        
        void main(void){
        
            float time = czm_frameNumber / 60.0;
            vec2 resolution = czm_viewport.zw;
        
            vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
            vec3 c=vec3(.6,.7,.8);
        
            float a=-.4;
            float si=sin(a),co=cos(a);
            uv*=mat2(co,-si,si,co);
            uv*=length(uv+vec2(0,4.9))*.3+1.;
        
            float v=1.-sin(hash(floor(uv.x*100.))*2.);
            float b=clamp(abs(sin(rainSpeed*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*rainColorDepth;
            c*=v*b;
        
            vec4 r=vec4(c,1);
            float distance = getDistance(depthTexture, v_textureCoordinates);
            vec4 sceneColor = texture2D(colorTexture, v_textureCoordinates);
            float blendAmount = interpolateByDistance(rainByDistance, distance);
            vec4 finalColor = vec4(r.rgb * blendAmount, r.a);
            gl_FragColor = mix(sceneColor, finalColor, brightness);
            //gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5);
        }
    `;
    export const fog: string = `
            //计算每个渲染顶点和视点（相机）的距离
            float getDistance(sampler2D depthTexture, vec2 texCoords)
            {
                float depth = czm_unpackDepth(texture2D(depthTexture, texCoords));
                if (depth == 0.0) {
                    return czm_infinity;
                }
                vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
                return -eyeCoordinate.z / eyeCoordinate.w;
            }
            //计算雾化距离（当它远离眼睛位置时，系数变小）
            float interpolateByDistance(vec4 nearFarScalar, float distance)
            {
                float startDistance = nearFarScalar.x;//雾化的起点距离
                float startValue = nearFarScalar.y;
                float endDistance = nearFarScalar.z;
                float endValue = nearFarScalar.w;
                float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
                return mix(startValue,endValue,t );
            }
            vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
            {
                return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
            }
            uniform sampler2D colorTexture;
            uniform sampler2D depthTexture;
            uniform vec4 fogcolor;
            uniform vec4 fogByDistance;
            uniform float density;
            varying vec2 v_textureCoordinates;
            void main(void)
            {
                vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);
                // vec4 fogcolor=vec4(0.8,0.8,0.8,0.5);

                // float depth = czm_readDepth(depthTexture, v_textureCoordinates);
                vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);
                float f=(depthcolor.r-0.22)/0.2;
                f = f*density;
                if(f<0.0) f=0.0;
                else if(f>1.0) f=1.0;

                float distance = getDistance(depthTexture, v_textureCoordinates);
                float blendAmount = interpolateByDistance(fogByDistance, distance);
                // vec4 finalColor = vec4(fogcolor.rgb, fogcolor.a * blendAmount);
                f = f*blendAmount;
                gl_FragColor = mix(origcolor, fogcolor, f);

                // gl_FragColor = mix(origcolor,fogcolor,f);
            }`;
}