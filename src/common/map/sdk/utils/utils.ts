import Cesium, {
    Cartographic,
    EllipsoidGeodesic,
    Math as CMath,
    Cartesian3,
    Cartesian2,
    Viewer,
    SceneTransforms,
    Color,
    Entity
} from "cesium";

export class Utils {

    /**
     * 获取统一格式点位
     *
     * @static
     * @param {*} item
     * @returns {({ x: number; y: number; z?: number } | undefined)}
     * @memberof Utils
     */
    public static getFormatPoint(item: any): { x: number; y: number; z?: number } | undefined {
        if (!item) {
            console.warn("数据格式错误");
            return;
        }
        const z = item.z || item.height;
        const position = {
            "x": +(item.x || item.longitude),
            "y": +(item.y || item.latitude),
            ...typeof z === "number" ? { z } : {}
        };
        if (!position.x || !position.y) {
            console.error("坐标转换出错：", item);
            return;
        }
        // 这里添加坐标转换方法
        return position;
    }

    /**
     * 获取两点之间的距离
     *
     * @static
     * @param {Cesium.Cartesian3} point1
     * @param {Cesium.Cartesian3} point2
     * @returns {(number | undefined)}
     * @memberof Utils
     */
    public static getDistance(point1: Cesium.Cartesian3, point2: Cesium.Cartesian3): number | undefined {
        if (!point1 || !point2) return;
        return +Cartesian3.distance(point1, point2).toFixed(2);
    }

    /**
     * 获取面积
     *
     * @static
     * @param {Array<Cesium.Cartesian3>} points
     * @returns {(number | undefined)}
     * @memberof Utils
     */
    public static getArea(points: Array<Cesium.Cartesian3>): number | undefined {
        if (points?.length <= 2) return;
        let s = 0;
        for (let i = 0; i < points.length; i++) {
            let p1 = points[i];
            let p2 = i < points.length - 1 ? points[i + 1] : points[0];
            s += p1.x * p2.y - p2.x * p1.y;
        }
        return Math.abs(s / 2);
    }

    /**
     * 获取两点之间的平面距离
     *
     * @static
     * @param {Cesium.Cartesian3} point1
     * @param {Cesium.Cartesian3} point2
     * @returns {(number | undefined)}
     * @memberof Utils
     */
    public static getSurfaceDistance(point1: Cesium.Cartesian3, point2: Cesium.Cartesian3): number | undefined {
        if (!point1 || !point2) return;
        const cartographic1 = Utils.cartesian3ToCartographic(point1);
        const cartographic2 = Utils.cartesian3ToCartographic(point2);
        if (!cartographic1 || !cartographic2) return;

        const geodesic = new EllipsoidGeodesic();
        geodesic.setEndPoints(cartographic1, cartographic2);
        return +geodesic.surfaceDistance.toFixed(2);
    }

    /**
     * 经纬度->世界坐标(三维笛卡尔)
     *
     * @static
     * @param {{x: number; y: number; z?: number}} point
     * @returns {(Cartesian3 | undefined)}
     * @memberof Utils
     */
    public static degreeToCartesian3(point: { x: number; y: number; z?: number }): Cartesian3 | undefined {
        if (!point?.x || !point?.y) return;
        return Cartesian3.fromDegrees(point.x, point.y, point.z);
    }

    /**
     * 世界坐标->经纬度
     *
     * @static
     * @param {Cartesian3} point
     * @returns {({x: number; y: number; z?: number} | undefined)}
     * @memberof Utils
     */
    public static cartesian3ToDegree(point: Cartesian3): { x: number; y: number; z?: number } | undefined {
        if (!point) return;
        const cartographic = Utils.cartesian3ToCartographic(point);
        if (!cartographic) return;
        return Utils.cartographicToDegree(cartographic);
    }

    /**
     * 经纬度->地理坐标(弧度)
     *
     * @static
     * @param {{x: number; y: number; z?: number}} point
     * @returns {(Cartographic | undefined)}
     * @memberof Utils
     */
    public static degreeToCartographic(point: { x: number; y: number; z?: number }): Cartographic | undefined {
        const { x, y, z } = point;
        if (!x || !y) return;
        return Cartographic.fromDegrees(x, y, z);
    }

    /**
     * 地理坐标->经纬度
     *
     * @static
     * @param {Cartographic} point
     * @returns {({x: number; y: number; z?: number} | undefined)}
     * @memberof Utils
     */
    public static cartographicToDegree(point: Cartographic): { x: number; y: number; z?: number } | undefined {
        if (!point) return;
        const { longitude, latitude, height } = point;
        if (!longitude || !latitude) return;
        return {
            "x": Utils.radianToDegree(longitude),
            "y": Utils.radianToDegree(latitude),
            "z": height
        };
    }

    /**
     * 经纬度->屏幕坐标(二维笛卡尔)
     *
     * @static
     * @param {{x: number; y: number; z?: number}} point
     * @param {Viewer} viewer
     * @returns {(Cartesian2 | undefined)}
     * @memberof Utils
     */
    public static degreeToCartesian2(point: { x: number; y: number; z?: number }, viewer: Viewer): Cartesian2 | undefined {
        if (!point?.x || !point?.y) return;
        const cartesian3 = Utils.degreeToCartesian3(point);
        if (!cartesian3) return;
        return Utils.cartesian3To2(cartesian3, viewer);
    }

    /**
     * 屏幕坐标->经纬度
     *
     * @static
     * @param {Cartesian2} point
     * @param {Viewer} viewer
     * @returns {({x: number; y: number; z?: number} | undefined)}
     * @memberof Utils
     */
    public static cartesian2ToDegree(point: Cartesian2, viewer: Viewer): { x: number; y: number; z?: number } | undefined {
        if (!point) return;
        const cartesian3 = Utils.cartesian2To3(point, viewer);
        if (!cartesian3) return;
        return Utils.cartesian3ToDegree(cartesian3);
    }

    /**
     * 世界坐标->地理坐标(弧度)
     *
     * @static
     * @param {Cartesian3} point
     * @returns {(Cartographic | undefined)}
     * @memberof Utils
     */
    public static cartesian3ToCartographic(point: Cartesian3): Cartographic | undefined {
        if (!point) return;
        return Cartographic.fromCartesian(point);
    }

    /**
     * 地理坐标->世界坐标
     *
     * @static
     * @param {Cartographic} point
     * @returns {(Cartesian3 | undefined)}
     * @memberof Utils
     */
    public static cartographicToCartesian3(point: Cartographic): Cartesian3 | undefined {
        if (!point?.longitude || !point?.latitude) return;
        return Cartesian3.fromRadians(point.longitude, point.latitude, point.height);
    }

    /**
     * 屏幕坐标->世界坐标
     *
     * @static
     * @param {Cartesian2} point
     * @param {Viewer} viewer
     * @returns {(Cartesian3 | undefined)}
     * @memberof Utils
     */
    public static cartesian2To3(point: Cartesian2, viewer: Viewer): Cartesian3 | undefined {
        if (!viewer || !point) return;
        return viewer.camera.pickEllipsoid(point, viewer.scene.globe.ellipsoid);
        // return viewer.scene.globe.pick(viewer.camera.getPickRay(point), viewer.scene);
    }

    /**
     * 世界坐标->屏幕坐标(二维笛卡尔)
     *
     * @static
     * @param {Cartesian3} point
     * @param {Viewer} viewer
     * @returns {(Cartesian2 | undefined)}
     * @memberof Utils
     */
    public static cartesian3To2(point: Cartesian3, viewer: Viewer): Cartesian2 | undefined {
        if (!viewer || !(point)) return;
        return SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, point);
    }

    /**
     * 弧度->度数
     *
     * @static
     * @param {number} radian
     * @returns {number}
     * @memberof Utils
     */
    public static radianToDegree(radian: number): number {
        return CMath.toDegrees(radian);
    }

    /**
     * 度数->弧度
     *
     * @static
     * @param {number} degree
     * @returns {number}
     * @memberof Utils
     */
    public static degreeToRadian(degree: number): number {
        return CMath.toRadians(degree);
    }

    /**
     * 获取颜色
     *
     * @static
     * @param {*} color
     * @returns {(Color | undefined)}
     * @memberof Utils
     */
    public static getColor(color: any): Color | undefined {
        if (!color) {
            return;
        } else if (color instanceof Color) {
            return color;
        } else if (typeof color === "string") {
            return Color.fromCssColorString(color);
        } else if (typeof color === "number") {
            return Color.fromRgba(color);
        } else if (Array.isArray(color)) {
            return Color.fromBytes(...color);
        }
    }

    /**
     * 获取实体类型
     *
     * @static
     * @param {Entity} entity
     * @returns {(string | undefined)}
     * @memberof Utils
     */
    public static getEntityType(entity: Entity): string | undefined {
        if (!entity) return;
        const { point, billboard, label, polygon, polyline, rectangle, model } = entity;
        let type = entity.name;
        if (type && (<any>entity)[type]) return type;

        const types: any = { point, billboard, label, polygon, polyline, rectangle, model };
        return Object.keys(types).find((type: any) => types[type]);
    }

    /**
     * 获取几何图形中心点
     *
     * @param {Array<any>} coordinates n维数组 n>2 [[lon, lat]]
     * @returns {({ x: number; y: number } | undefined)}
     */
    // public static getGeometryCenter(coordinates: Array<any>): { x: number; y: number } | undefined {
    //     const _coordinates: Array<Array<number>> = coordinates.flat(Infinity).reduce((pre, cur, curIndex, arr) => {
    //         if (Array.isArray(cur)) {
    //             !(curIndex % 2) && pre.push([cur, arr[curIndex + 1]]);
    //         } else if (cur.longitude && cur.latitude) {
    //             pre.push([cur.longitude, cur.latitude]);
    //         }
    //         return pre;
    //     }, []);

    //     const length = _coordinates && _coordinates.length;
    //     if (!length) return;
    //     let X = 0, Y = 0, Z = 0;
    //     for (let i = 0; i < length; i++) {
    //         const g = _coordinates[i];
    //         if (!g.length) continue;
    //         let lat, lon, x, y, z;
    //         lat = g[1] * Math.PI / 180;
    //         lon = g[0] * Math.PI / 180;
    //         x = Math.cos(lat) * Math.cos(lon);
    //         y = Math.cos(lat) * Math.sin(lon);
    //         z = Math.sin(lat);
    //         X += x;
    //         Y += y;
    //         Z += z;
    //     }
    //     X = X / length;
    //     Y = Y / length;
    //     Z = Z / length;

    //     return {
    //         x: Math.atan2(Y, X) * 180 / Math.PI,
    //         y: Math.atan2(Z, Math.sqrt(X * X + Y * Y)) * 180 / Math.PI
    //     };
    // }

    /**
     * 转换缩放与距离
     * @description zoom/height -> height/zoom
     * @private
     * @param {{ height?: number; zoom?: number }} arg
     * @returns {(number | undefined)}
     */
    public static getZoomOrHeight(height?: number | null, zoom?: number | null, heightRange?: Array<number>, zoomRange?: Array<number>): number | undefined {
        if ((!height && !zoom) || (height && zoom) || !heightRange || !zoomRange) return;

        const [minHeight, maxHeight, minZoom, maxZoom] = [...heightRange, ...zoomRange];
        if (height) {
            if (height <= minHeight) {
                return maxZoom;
            } else if (height >= maxHeight) {
                return minZoom;
            } else {
                return Math.round(maxZoom * (maxHeight - height) / (maxHeight - minHeight)) || 1;
            }
        } else if (zoom) {
            if (zoom <= minZoom) {
                return maxHeight;
            } else if (zoom >= maxZoom) {
                return minHeight;
            } else {
                return Math.round(maxHeight * (maxZoom - zoom) / (maxZoom - minZoom)) || 1;
            }
        }
    }

}