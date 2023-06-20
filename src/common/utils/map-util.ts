import { Feature, Map } from "ol";
import { LineString, Point } from "ol/geom";
import * as Geometry from 'ol-plot/src/Geometry'
import VectorSource from "ol/source/Vector";
import olStyleFactory from 'ol-plot/src/Utils/factory'
import { Fill, Stroke, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { getCenter } from "ol/extent";
import { fromLonLat, toLonLat } from "ol/proj";

export const getFeaturesByLayerName = (map: Map, layerName: string) => {
    let layer: any;
    let rFeatures = [];
    map.getLayers().getArray().forEach(item => {
        if(item.get("layerName") === layerName) {
            layer = item; 
        }
    })
    if (layer) {
        let source = layer.getSource();
        if (source && source instanceof VectorSource) {
          let features = source.getFeatures();
          if (features && features.length > 0) {
            features.forEach((feature, index) => {
              if (feature && feature.getGeometry) {
                let geom = feature.getGeometry();
                if (geom && geom.getCoordinates) {
                  let type = geom.getType();
                  let coordinates = geom.getCoordinates();
                  let points = feature.getGeometry().getPoints();
                
                  let heights = [];
                  if(!feature.get("heights")) {
                    points.forEach(item => {
                      heights.push(2000);
                    });
                  }
                  else heights = feature.get("heights");
                  let style: any = feature.getStyle();
                  if(Array.isArray(style)) style = style[1];

                  console.log(feature, "moveFeature")
                  rFeatures.push({
                    "id": feature.getId(),
                    "name": feature.get("name"),
                    "type": "Feature",
                    "heights": heights,
                    "team": feature.get("team"),
                    "bePolygon": feature.get("bePolygon"),
                    "geometry": {
                      "type": type,
                      "coordinates": coordinates
                    },
                    "properties": {
                      "type": feature.getGeometry().getPlotType(),
                      "points": feature.getGeometry().getPoints(),
                      "style": {
                        "fill": style.getFill().getColor(),
                        "stroke": style.getStroke().getColor(),
                        "line": feature.get("line"),
                        "width": style.getStroke().getWidth()
                      }
                    }
                  })
                }
              }
            })
          }
        }
      }
    return rFeatures;
}

/**
 * 恢复相关标绘
 * @param features
 */
export const addFeatures = (features: any, map: Map, layerName: string) => {
  if (features && Array.isArray(features) && features.length > 0) {
    let layer: any;
    map.getLayers().getArray().forEach(item => {
        if(item.get("layerName") === layerName) {
            layer = item;
        }
    })
    let shapeLayer: any;
    map.getLayers().getArray().forEach(item => {
      if(item.get("name") === "labelLayer") {
        shapeLayer = item;
      }
    })
    // console.log(layer);
    if (layer) {
      let source = layer.getSource();
      let labelSource = shapeLayer.getSource();
      if (source && source instanceof VectorSource) {
        const _extents = [];
        features.forEach(feature => {
          if (feature && feature['geometry'] && feature['geometry']['type'] !== 'PlotText') {
            if (feature['properties']['type'] && Geometry[feature['properties']['type']]) {
              let feat = new Feature({
                id: feature['id'],
                name: feature['name'],
                geometry: (new Geometry[feature['properties']['type']]([], feature['properties']['points'], feature['properties'])),
                heights: feature['heights']
              })
              feat.setId(feature['id']);
              feat.set('isPlot', true);
              feat.set('team', feature['team']);
              feat.set('bePolygon', feature['bePolygon']);
              
              _extents.push(feat.getGeometry().getExtent());
              if (!feature['properties']['style']) {
                /* eslint new-cap: 0 */
                let style_ = new Style({
                  image: new CircleStyle({
                    radius: 2,
                    fill: new Fill({
                      color: "rgba(67,110,238,1)"
                    })
                  }),
                  fill: new Fill({
                    color: "rgba(67,110,238,0.4)"
                  }),
                  stroke: new Stroke({
                    color: "rgba(67,110,238,1)",
                    width: 2
                  })
                })
                feat.setStyle(style_)
              }
              else {
                let line = feature['properties']['style']['line'];
                if(line) feat.set("line", line);
                let dash = [];
                if(line === "dash") dash = [10];
                else if(line === "dotted") dash = [1,5];
                else if(line === "dottedLine") dash = [10, 5, 1, 5];
                
                let style_ = new Style({
                  image: new CircleStyle({
                    radius: feature['properties']['style']['width'],
                    fill: new Fill({
                      color: feature['properties']['style']['stroke']
                    })
                  }),
                  fill: new Fill({
                    color: feature['properties']['style']['fill']
                  }),
                  stroke: new Stroke({
                    color: feature['properties']['style']['stroke'],
                    width: feature['properties']['style']['width'],
                    lineDash: dash
                  })
                })
                feat.setStyle(style_)
              }
              source.addFeature(feat);

              // 标签 
              let labelFeature = labelSource.getFeatureById("shape-" + feature['id']);
              let extent = feat.getGeometry().getExtent();
              let center = feature['properties']['points'][0];
              if(labelFeature) {
                console.log(labelFeature)
                labelFeature.setGeometry(new Point(center));
              }
              else {
                labelFeature = new Feature({
                  geometry: new Point(center)
                });
                labelFeature.setId("shape-" + feature['id']);
                let backgroundColor = "rgba(128,128,128,0.5)"; // 白方
                if (feature['team'] == 1) backgroundColor = "rgba(0, 23, 71, 0.5)"; // 蓝方
                else if (feature['team'] == 0) backgroundColor = "rgba(77, 0, 0, 0.5)"; // 红方
                labelFeature.setStyle(
                    new Style({
                        text: new Text({
                            textAlign: "center",
                            padding: [5, 5, 5, 5],
                            textBaseline: "bottom",
                            offsetY: -15,
                            font: "Lighter 12px 微软雅黑",
                            text: feature["name"],
                            fill: new Fill({ color: "#ffffff" }),
                            backgroundFill: new Fill({ color: backgroundColor })
                        })
                    })
                );
                labelSource.addFeature(labelFeature);
              }
              
            } else {
              console.warn('不存在的标绘类型！')
            }
          }
        })
      }
    }
  }
}

/**
 * 转换图形点坐标为经纬度坐标传给后端
 * @param item 点坐标为地图坐标的图形数据
 */
export const transformPositionToLonLat = (item: any) => {
  if(item.geometry.type === "Point") {
      item.geometry.coordinates = toLonLat(item.geometry.coordinates);
  }
  else if(item.geometry.type === "LineString") {
      item.geometry.coordinates.forEach((subItem, index) => {
          item.geometry.coordinates[index] = toLonLat(subItem);
      })
  }
  else {
      item.geometry.coordinates.forEach((subItem, i) => {
          subItem.forEach((subSubItem, j) => {
              item.geometry.coordinates[i][j] = toLonLat(subSubItem);
          })
      })
  }
  item.properties.points.forEach((subItem, index) => {
      item.properties.points[index] = toLonLat(subItem);
  });
  return item;
}

/**
 * 转换图形点坐标为地图坐标用于显示
 * @param item 点坐标为经纬度坐标的图形数据
 */
 export const transformPositionFromLonLat = (item: any) => {
  if(item.geometry.type === "Point") {
      item.geometry.coordinates = fromLonLat(item.geometry.coordinates);
  }
  else if(item.geometry.type === "LineString") {
      item.geometry.coordinates.forEach((subItem, index) => {
          item.geometry.coordinates[index] = fromLonLat(subItem);
      })
  }
  else {
      item.geometry.coordinates.forEach((subItem, i) => {
          subItem.forEach((subSubItem, j) => {
              item.geometry.coordinates[i][j] = fromLonLat(subSubItem);
          })
      })
  }
  item.properties.points.forEach((subItem, index) => {
      item.properties.points[index] = fromLonLat(subItem);
  });
  return item;
}