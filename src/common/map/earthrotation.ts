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
    Color,
    Math as _Math,
    Ion
} from "cesium";
import { merge } from "lodash";

interface IEarthrotationOptions {
    lon?: number;  // 经度
    lat?: number;  // 纬度
}

export class Earthrotation {

    public constructor(
        public map: Cesium.Viewer,
        public options: IEarthrotationOptions = {lon: 0, lat: 0}
    ) {
        if (!map) {
            console.warn("定位初始化效果失败！");
            return;
        }
    }

    public setdot(options: IEarthrotationOptions = {lon: 0, lat: 0}) {
        merge(this.options, options);
        this.setRotate({lon: 110.0, lat: 35.8}, () => {this.map.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(this.options.lon,this.options.lat,100000)});});
        let entity = new Entity({
            position : Cartesian3.fromDegrees(this.options.lon!, this.options.lat!),
            point : {
                pixelSize : 10,
                color : Color.WHITE.withAlpha(0.9),
                outlineColor : Color.WHITE.withAlpha(0.9),
                outlineWidth : 1
            }
        });
        this.map.entities.add(entity);
        this.map.flyTo(entity, {
            offset : {
                heading : _Math.toRadians(0.0),
                pitch : _Math.toRadians(-25),
                range : 25
            }
        });
    }

    public setRotate(obj: any, callback)
    {
        if (!obj.lon || !obj.lat) {
            // console.log("设定地球旋转时，并未传入经纬度！");
            return;
        }
        let v = 10;
        let i = 0;
        let q = 2;
        let x = obj.lon;
        let y = obj.lat;
        let z = obj.z;
        let interVal = window.setInterval(() => {
            x = x + v;
            if (x >= 179) {
                x = -180;
                i++;
            }
            // this.cmap.viewer.scene.camera.rotate(Cartesian3.UNIT_Z, 0.02);
            this.map.scene.camera.setView({
                destination: Cartesian3.fromDegrees(x, y, z || 20000000)
            });
            if (i === q) {
                clearInterval(interVal);
                callback();
            }
        }, 20);
    }
}
