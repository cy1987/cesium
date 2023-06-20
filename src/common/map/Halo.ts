/*
 * @Author: Zhaojie Zeng
 * @Date: 2021-04-13 10:00:03
 * @LastEditors: Xin Lai
 * @LastEditTime: 2021-08-18 16:32:23
 * @Description: 该效果用来给实体展示一个光圈，具体效果可以见case下的Halo文件夹，由于光环在渲染时需要比较大的资源，所以在实际计算中就不对其进行实时调节的支持了
 */

import Cesium, {
    Viewer,
    Math as _Math,
    CallbackProperty,
    PositionProperty,
    ImageMaterialProperty,
    JulianDate,
    Math,
    Cartesian4,
    Cartesian2,
    Color
} from "cesium";
import VelocityOrientationProperty from "cesium/Source/DataSources/VelocityOrientationProperty";
import { List, merge } from "lodash";
import { CMap } from "./sdk/map";
import { webSetting } from "@/settings";
import Scene from "cesium/Source/Scene/Scene";
import Entity from "cesium/Source/DataSources/Entity";

interface IHaloOptions {
    id?: string;
    position?: PositionProperty;
    radius?: number;
    useDouble?: boolean;
}

export class Halo {
    private isDestroyed: boolean = false;
    private haloFirst!: Entity;
    private haloSecond!: Entity;
    private haloFirstId!: string;
    private haloSecondId!: string;
    public viewer!: Viewer;
    public id: string = `Halo-${new Date().getTime().toString()}`;

    public constructor(
        public cmap: CMap) {
        this.viewer = cmap.viewer as Viewer;
        if (!this.viewer) {
            console.warn("光环初始化失败");
            return;
        }
    }

    public add(options: IHaloOptions) {
        if (options.id !== undefined && options.radius !== undefined && options.position !== undefined && options.useDouble !== undefined) {
            let entity = this.addCircleRipple({
                id: options.id,
                position: options.position,
                maxR: options.radius,
                minR: 0,
                deviationR: 1,
                useDouble: options.useDouble, // 选择使用双光环
                eachInterval: 1000,
                imageUrl: `${webSetting.assetsUrl}/image/halo.png`
            });
            return entity;
        } else {
            console.warn("add halo failed");
        }
    }

    public show() {
        if (this.haloFirst !== undefined) {
            this.haloFirst.show = true;
        }
        if (this.haloSecond !== undefined) {
            this.haloSecond.show = true;
        }
    }

    public hide() {
        if (this.haloFirst !== undefined) {
            this.haloFirst.show = false;
        }
        if (this.haloSecond !== undefined) {
            this.haloSecond.show = false;
        }
    }

    public delete() {
        this.hide();
        if (this.viewer.entities.getById(this.haloFirstId) !== undefined) {
            this.viewer.entities.removeById(this.haloFirstId);
        }
        if (this.viewer.entities.getById(this.haloSecondId) !== undefined) {
            this.viewer.entities.removeById(this.haloSecondId);
        }
    }

    public destroy() {
        if (this.isDestroyed) return;
        this.delete();
        this.isDestroyed = true;
    }
    
    private addCircleRipple(data: {
        id: string;
        position: PositionProperty;
        maxR: number;
        minR: number;
        deviationR: number;
        useDouble: boolean;
        eachInterval: number;
        imageUrl: string;
    }) {
        let r1 = data.minR;
        let r2 = data.minR;

        let changeR1: (() => number) = () => {
            r1 = r1 + data.deviationR;
            if (r1 >= data.maxR) {
                r1 = data.minR;
            }
            return r1;
        };
        let changeR2: (() => number) = () => {
            r2 = r2 + data.deviationR;
            if (r2 >= data.maxR) {
                r2 = data.minR;
            }
            return r2;
        };
        let _this = this;
        this.haloFirstId = data.id + "-1";
        this.haloSecondId = data.id + "-2";
        this.haloFirst = this.viewer.entities.add({
            id: this.haloFirstId,
            name: "",
            position: data.position,
            ellipse: {
                semiMinorAxis: new CallbackProperty(changeR1, false),
                semiMajorAxis: new CallbackProperty(() => {
                    return _this.haloFirst.ellipse.semiMinorAxis.getValue(JulianDate.now()) + data.deviationR;
                }, false),
                material: new ImageMaterialProperty({
                    image: data.imageUrl,
                    repeat: new Cartesian2(1.0, 1.0),
                    transparent: true,
                    color: new CallbackProperty(() => {
                        let alp = 1 - r1 / data.maxR;
                        return Color.WHITE.withAlpha(alp);  // entity的颜色透明 并不影响材质，并且 entity也会透明哦
                    }, false)
                })
            }
        });
        if (data.useDouble) {
            setTimeout(function () {
                _this.haloSecond = _this.viewer.entities.add({
                    id: _this.haloSecondId,
                    name: "",
                    position: data.position,
                    ellipse: {
                        semiMinorAxis: new CallbackProperty(changeR2, false),
                        semiMajorAxis: new CallbackProperty(() => {
                            return _this.haloSecond.ellipse.semiMinorAxis.getValue(JulianDate.now()) + data.deviationR;
                        }, false),
                        material: new ImageMaterialProperty({
                            image: data.imageUrl,
                            repeat: new Cartesian2(1.0, 1.0),
                            transparent: true,
                            color: new CallbackProperty(() => {
                                let alp = 1;
                                alp = 1 - r2 / data.maxR;
                                return Color.WHITE.withAlpha(alp);
                            }, false)
                        })
                    }
                });
            }, data.eachInterval);
        }
        return this.haloFirst;
    }
}