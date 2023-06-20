import { Style, Fill, Stroke, Circle as CircleStyle, Text, RegularShape } from "ol/style";

export default class MesureStyle {
    public static typeSelect = document.getElementById("type");
    public static showSegments = document.getElementById("segments");
    public static clearPrevious = document.getElementById("clear");

    public static style = new Style({
        fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.5)",
            lineDash: [10, 10],
            width: 2
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)"
            }),
            fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
            })
        })
    });

    public static labelStyle = new Style({
        text: new Text({
            font: "14px Calibri,sans-serif",
            fill: new Fill({
            color: "rgba(255, 255, 255, 1)"
            }),
            backgroundFill: new Fill({
            color: "rgba(0, 0, 0, 0.7)"
            }),
            padding: [3, 3, 3, 3],
            textBaseline: "bottom",
            offsetY: -15
        }),
        image: new RegularShape({
            radius: 8,
            points: 3,
            angle: Math.PI,
            displacement: [0, 10],
            fill: new Fill({
            color: "rgba(0, 0, 0, 0.7)"
            })
        })
    });

    public static tipStyle = new Style({
        text: new Text({
            font: "12px Calibri,sans-serif",
            fill: new Fill({
            color: "rgba(255, 255, 255, 1)"
            }),
            backgroundFill: new Fill({
            color: "rgba(0, 0, 0, 0.4)"
            }),
            padding: [2, 2, 2, 2],
            textAlign: "left",
            offsetX: 15
        })
    });

    public static modifyStyle = new Style({
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)"
            }),
            fill: new Fill({
            color: "rgba(0, 0, 0, 0.4)"
            })
        }),
        text: new Text({
            text: "拖动边缘修改图形",
            font: "12px Calibri,sans-serif",
            fill: new Fill({
            color: "rgba(255, 255, 255, 1)"
            }),
            backgroundFill: new Fill({
            color: "rgba(0, 0, 0, 0.7)"
            }),
            padding: [2, 2, 2, 2],
            textAlign: "left",
            offsetX: 15
        })
    });

    public static segmentStyle = new Style({
        text: new Text({
            font: "12px Calibri,sans-serif",
            fill: new Fill({
            color: "rgba(255, 255, 255, 1)"
            }),
            backgroundFill: new Fill({
            color: "rgba(0, 0, 0, 0.4)"
            }),
            padding: [2, 2, 2, 2],
            textBaseline: "bottom",
            offsetY: -12
        }),
        image: new RegularShape({
            radius: 6,
            points: 3,
            angle: Math.PI,
            displacement: [0, 8],
            fill: new Fill({
                color: "rgba(0, 0, 0, 0.4)"
            })
        })
    });
}