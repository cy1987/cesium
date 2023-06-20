import { Map } from "ol";
import { LineString, Point } from "ol/geom";
import { DragPan, Draw, Modify } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import { transform } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { getArea, getDistance, getLength } from "ol/sphere";
import MesureStyle from "./style/mesureStyle";

interface MesureOptions {
    type?: String;
    showSegments?: boolean;
    clearPrevious?: boolean;
}

export class Mesure{
    public map: Map;
    public type: String | undefined;
    public showSegments: boolean | undefined;
    public clearPrevious: boolean | undefined;

    public draw!: Draw;
    public segmentStyles = [MesureStyle.segmentStyle];
    public mesureSource = new VectorSource();
    public modify!: Modify;
    public tipPoint: any;
    public mesureVector: any;

    public constructor (map: Map, options: MesureOptions) {
        if (map && map instanceof Map) {
            this.map = map;
        } else {
          throw new Error("传入的不是地图对象");
        }

        /**
         * 测绘类型
         * @type {String}
         */
        this.type = options.type;

        /**
         * 是否显示每段长度
         * @type {boolean}
         */
        this.showSegments = options.showSegments;

        /**
         * 是否清除之前的测绘
         * @type {boolean}
         */
        this.clearPrevious = options.clearPrevious;
        this.mesure();
    }

    public mesure() {
        let that = this;
        this.modify = new Modify({source: this.mesureSource, style: MesureStyle.modifyStyle});
        this.modify.on("modifystart", function() {
            that.map.getInteractions().forEach(function(element,index,array) {
                if(element instanceof DragPan) {
                    element.setActive(false);
                }
            });
        });
        this.modify.on("modifyend", function() {
            that.map.getInteractions().forEach(function(element,index,array) {
                if(element instanceof DragPan) {
                    element.setActive(true);
                }
            });
        });
        this.mesureVector = new VectorLayer({
            source: this.mesureSource,
            style: function (feature) {
                return that.styleFunction(feature, that.showSegments, that.type);
            }
        });
        this.map.addLayer(this.mesureVector);
        this.map.addInteraction(this.modify);
    }
    
    public formatLength (line: any) {
        const length = getLength(line);
        let output;
        if (length > 100) {
            output = Math.round((length / 1000) * 100) / 100 + " km";
        } else {
            output = Math.round(length * 100) / 100 + " m";
        }
        return output;
    }

    public formatArea (polygon: any) {
        const area = getArea(polygon);
        let output;
        if (area > 10000) {
            output = Math.round((area / 1000000) * 100) / 100 + " km\xB2";
        } else {
            output = Math.round(area * 100) / 100 + " m\xB2";
        }
        return output;
    }

    public formatAngle (line: any) {
        let coordinates = line.getCoordinates();
        let angle: any;
        let sourceProj = this.map.getView().getProjection();
        for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
          let c1 = transform(coordinates[i], sourceProj, "EPSG:4326");
          let c2 = transform(coordinates[i + 1], sourceProj, "EPSG:4326");
          let c3;
          if(i >= 1) {
            c3 = transform(coordinates[i - 1], sourceProj, "EPSG:4326");
            let disa = getDistance(c3, c1);
            let disb = getDistance(c1, c2);
            let disc = getDistance(c2, c3);
            // 由于绘制结束的时候双击会导致c1=c2，从而disb=0，而分母不能为零，导致angle=NAN值，所以需要取双击的前一次值。
            // 当有三个以上的点的时候，形成了角度，需要对角度进行测量输出。
            if(disb === 0 && i >= 2) {
              c1 = transform(coordinates[i - 1], sourceProj, "EPSG:4326");
              c2 = transform(coordinates[i], sourceProj, "EPSG:4326");
              c3 = transform(coordinates[i - 2], sourceProj, "EPSG:4326");
              disa = getDistance(c3, c1);
              disb = getDistance(c1, c2);
              disc = getDistance(c2, c3);
            }
            let cos = (disa * disa + disb * disb - disc * disc) / (2 * disa * disb);  // 利用余弦定理公式计算cos值
            angle = Math.acos(cos) * 180 / Math.PI;  // 求反余弦值，得到弧度制，并将弧度值转角度值
            angle = angle.toFixed(2) + "度";  // 对计算完成的角度，保留两位小数
            // 由于绘制结束的时候双击会导致c1=c2，从而disb=0，而分母不能为零，导致angle=NAN值，所以需要取双击的前一次值。
            // 当只有两个点的时候，只是一条线，并不形成角度，需要提示继续绘制。
            if(disb === 0 && i < 2) {
              angle = "请继续绘制形成角度";
            }
          }
          // 当只是绘制一个点的时候，提示继续绘制。
          else {
            angle = "请继续绘制形成角度";
          }
        }
        let output;
        output = angle;
        return output;// 返回
    }

    public styleFunction(feature: any, segments?: any, drawType?: any, tip?: any) {
        let that = this;
        let styles = [MesureStyle.style];
        let geometry = feature.getGeometry();
        let type = geometry.getType();
        let isAngle = false;
        let point, label, line;
        if(drawType === "Angle") {
            drawType = "LineString";
            isAngle = true;
        }
        if (!drawType || drawType === type) {
            if (type === "Polygon") {
                point = geometry.getInteriorPoint();
                label = this.formatArea(geometry);
                line = new LineString(geometry.getCoordinates()[0]);
            }
            else if (type === "LineString" && !isAngle) {
                point = new Point(geometry.getLastCoordinate());
                label = this.formatLength(geometry);
                line = geometry;
            }
            else if (type === "LineString" && isAngle) {
                let points = geometry.getCoordinates();
                point = new Point(points[points.length - 2]);
                label = this.formatAngle(geometry);
                line = geometry;
                if(points.length === 4) this.draw.finishDrawing();
            }
        }

        if (segments && line && !isAngle) {
            let count = 0;
            line.forEachSegment(function (a: any, b: any) {
                const segment = new LineString([a, b]);
                const label = that.formatLength(segment);
                if (that.segmentStyles.length - 1 < count) {
                    that.segmentStyles.push(MesureStyle.segmentStyle.clone());
                }
                const segmentPoint = new Point(segment.getCoordinateAt(0.5));
                that.segmentStyles[count].setGeometry(segmentPoint);
                that.segmentStyles[count].getText().setText(label);
                styles.push(that.segmentStyles[count]);
                count++;
            });
        }
        if (label) {
            MesureStyle.labelStyle.setGeometry(point);
            MesureStyle.labelStyle.getText().setText(label);
            styles.push(MesureStyle.labelStyle);
        }
        if (
            tip &&
            type === "Point" &&
            !this.modify.getOverlay().getSource().getFeatures().length
        ) {
            this.tipPoint = geometry;
            MesureStyle.tipStyle.getText().setText(tip);
            styles.push(MesureStyle.tipStyle);
        }
        return styles;
    }

    public addInteraction() {
        // const drawType = this.typeSelect.value;
        let that = this;
        const drawType = this.type === "Polygon" ? "Polygon" : "LineString";
        const activeTip =
            "点击继续绘制 " +
            (drawType === "Polygon" ? "区域" : "线");
        const idleTip = "点击开始绘制";
        let tip = idleTip;
        this.draw = new Draw({
            source: this.mesureSource,
            type: drawType,
            style: function (feature) {
                return that.styleFunction(feature, that.showSegments, that.type, tip);
            }
        });
        this.draw.on("drawstart", function () {
            if (that.clearPrevious) {
                that.mesureSource.clear();
            }
            that.modify.setActive(false);
            tip = activeTip;
        });
        this.draw.on("drawend", function () {
            MesureStyle.modifyStyle.setGeometry(that.tipPoint);
            if(that.type !== "Angle") that.modify.setActive(true);
            that.map.once("pointermove", function () {
                MesureStyle.modifyStyle.setGeometry("");
            });
            tip = idleTip;
        });
        this.modify.setActive(true);
        this.map.addInteraction(this.draw);
    }

    public mesureTypeChange() {
        this.map.removeInteraction(this.draw);
        this.mesureSource.clear();
        this.addInteraction();
    }

    public showSegmentsChange() {
        this.mesureVector.changed();
        this.draw.getOverlay().changed();
    }
    
    public active() {
        this.addInteraction();
    }

    public disActive() {
        this.map.removeInteraction(this.draw);
    }

    public clear() {
        this.mesureSource.clear();
    }
}