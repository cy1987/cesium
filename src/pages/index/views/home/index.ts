import { component, model, View as _View, watch, config } from "@egova/flagwind-web";
import { ISetting, IOptions, ICameraInfo, Farmidnear } from "@/common/map/sdk/interface";
import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Cartesian3,
    HeadingPitchRange,
    ScreenSpaceEventHandler,
    Math as _Math,
    Cartesian2,
    Color,
    ScreenSpaceEventType,
    IonResource,
    Matrix4,
    ImageMaterialProperty,
    Rectangle,
    DirectionalLight,
    HorizontalOrigin,
    VerticalOrigin,
    Primitive,
    GeometryInstance,
    EllipsoidSurfaceAppearance,
    Material,
    PolygonGeometry,
    PolygonHierarchy,
    BoxGeometry,
    PerInstanceColorAppearance,
    ColorGeometryInstanceAttribute,
    Transforms,
    Ellipsoid,
    Matrix3,
    Quaternion,
    HeadingPitchRoll,
    ConstantProperty,
    JulianDate,
    Cartographic,
    LabelStyle

} from "cesium";
import "./index.scss";



import { Weather as _Weather } from "@/common/map/weather";
import { PlaneEMI as _PlaneEMI } from "@/common/map/planeEMI";
import PubSub from "pubsub-js";
import axios from "axios";
import { webSetting } from "@/settings";
import { StompClient } from "@/common/map/sdk/stomClient";
import Flight from "./components/flight";

import Traffic from "./components/traffic";
import EnergyChartcold from "./components/energyChartcold";
import Energy from "./components/energy";
import EnergyChartwarm from "./components/energyChartwarm"
import EnergyChartzq from "./components/energyChartzq"
import EnergyChartgd from "./components/energyChartgd"
import EnergyInfoBox from "./components/EnergyInfoBox"
import EnergyInfoBox1 from "./components/EnergyInfoBox1"
import Geometry from "./components/geometry"
import Info from "./components/info"

import Card from "antd/es/card/Card";

import Cesium3DTileset from "cesium/Source/Scene/Cesium3DTileset";
import h337 from "./heatmap.js"
import BillboardCollection from "cesium/Source/Scene/BillboardCollection";
import { Pointer } from "ol/interaction";
import CallbackProperty from "cesium/Source/DataSources/CallbackProperty";
import Entity from "cesium/Source/DataSources/Entity";
import ConstantPositionProperty from "cesium/Source/DataSources/ConstantPositionProperty";
import LinearSpline from "cesium/Source/Core/LinearSpline";

@component({
    template: require("./index.html"),
    components: {

        "u-traffic": Traffic, /* 注册组件 */
        "u-energycold": EnergyChartcold, /* 注册组件 */
        "u-energy": Energy,
        "u-energywarm": EnergyChartwarm,
        "u-energyzq": EnergyChartzq,
        "u-energygd": EnergyChartgd,
        "u-energyInBox": EnergyInfoBox,
        "u-energyInBox1": EnergyInfoBox1,
        "u-geometry" : Geometry,
        "u-info" : Info

    }
})
// tslint:disable-next-line:class-name
export default class Cofly extends _View {
    @config()
    public data: string;

    public cmap!: CMap;
    public mapcenter = { x: 120.771441, y: 30.756433 };
    public order: string = "";
    public heartInterval: any;
    public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket";
    public flight: Flight;
    public armyList = [];

    public keyBoardListener!: any;
    public cameraKeyBoardListener!: any;
    public controlListener!: any;
    public handler = new ScreenSpaceEventHandler();
    public preUpateSpeedViewFunc!: any;
    public preUpateHPRFunc!: any;

    public center!: Cartesian3;
    public hpRange: HeadingPitchRange = new HeadingPitchRange(_Math.toRadians(90), _Math.toRadians(0), 200);

    public switchHeight: number;
    public farmidnear: Farmidnear = {};


    public tileset1: Cesium3DTileset;
    public tileset2: Cesium3DTileset;
    public tileset3: Cesium3DTileset;
    public tileset4: Cesium3DTileset;
    public tileset5: Cesium3DTileset;
    public tileset6: Cesium3DTileset;
    public tileset7: Cesium3DTileset;
    public tileset8: Cesium3DTileset;
    public tileset9: Cesium3DTileset;
    public tileset10: Cesium3DTileset;
    public tileset_url = null;
    public tilesnum = 1;
    public loadnum = 0;
    
    public move = false;

    //机械臂技术路线尝试
    public Box: Entity;
    public rx = 0;
    public tx = 114.24189;
    public ty = 30.506844;
    public tz = 100;
    public axis =  Cartesian3.fromDegrees(114.24189, 30.506844, 250) ;      //起始位置
    public i = 0; //旋转角
    public endpos = Cartesian3.fromDegrees(114.25,30.506844,250);          //结束位置
    public points = [114.24189, 114.25];
    public lats = [36.24908,	36.24908,	36.24908,	36.24908,	36.24908,	36.24908,	36.24908,	36.24908,	36.248952,	36.248944,	36.248932,	36.248927,	36.248916,	36.248902,	36.248897,	36.248884,	36.248879,	36.248866,	36.248859,	36.248851,	36.24884,	36.248833,	36.248821,	36.248815,	36.248803,	36.248796,	36.248785,	36.248778,	36.248767,	36.24876,	36.248748,	36.248735,	36.248729,	36.248716,	36.248703,	36.2487,	36.248701,	36.248701,	36.248707,	36.248713,	36.248725,	36.24873,	36.248741,	36.248747,	36.248758,	36.248766,	36.248779,	36.248791,	36.248797,	36.248803,	36.248816,	36.248828,	36.248834,	36.248847,	36.248853,	36.248865,	36.248873,	36.248883,	36.248892,	36.248905,	36.248911,	36.248924,	36.24893,	36.248941,	36.248947,	36.248962,	36.248967,	36.248979,	36.248986,	36.248998,	36.249003,	36.249017,	36.249017,	36.249017,	36.249017,	36.249017,	36.24906,	36.249072,	36.249085,	36.249091,	36.249104,	36.249111,	36.249121,	36.249126,	36.249127,	36.249126,	36.249126,	36.249121,	36.24911,	36.249098,	36.24909,	36.249079,	36.249071,	36.249065,	36.249052,	36.249052,	36.249052,	36.249052,	36.249052,	36.249052];
    public lons = [117.610119,	117.610119,	117.610119,	117.610119,	117.610119,	117.610119,	117.610119,	117.610119,	117.610129,	117.610129,	117.610133,	117.610132,	117.61013,	117.610133,	117.610133,	117.610136,	117.610137,	117.610139,	117.610138,	117.610139,	117.610142,	117.610143,	117.610146,	117.610147,	117.610147,	117.610147,	117.610148,	117.610147,	117.610149,	117.61015,	117.610151,	117.610152,	117.610154,	117.610156,	117.610159,	117.610157,	117.610157,	117.610157,	117.610158,	117.610158,	117.610156,	117.610153,	117.610142,	117.610141,	117.610137,	117.610138,	117.610136,	117.610134,	117.610135,	117.610132,	117.610133,	117.61013,	117.610128,	117.61013,	117.610124,	117.610128,	117.610127,	117.610122,	117.610124,	117.610118,	117.61012,	117.610124,	117.610115,	117.610119,	117.610116,	117.610114,	117.610115,	117.610112,	117.610113,	117.610111,	117.610112,	117.610109,	117.610109,	117.610109,	117.610109,	117.610109,	117.610107,	117.610107,	117.610105,	117.610104,	117.610106,	117.610103,	117.610101,	117.610099,	117.610099,	117.610099,	117.610099,	117.610101,	117.610102,	117.610107,	117.610105,	117.610105,	117.610107,	117.610107,	117.610106,	117.610106,	117.610106,	117.610106,	117.610106,	117.610106];
    public spline;//插值对象
    public pointlats = [117.610119];   //插值点
    public pointlons = [36.24908]
    public index = 0;
    public readymove = false;
    public timeflag = 0;


    //基本体绘制
    public drawFrom : Cartesian3 = Cartesian3.fromDegrees(114.183443,30.546144,500);
    public drawTo : Cartesian3 = Cartesian3.fromDegrees(114.183443,30.546144,500);
    public rec;
    public rec1;
    public readyDraw = false;
    public finishedDraw = false;
    public recposition : Cartesian3[] =[this.drawFrom,this.drawTo] ;
    public alt = 100;
    public lon = 0;
    public lat = 0;
    public dlon = 0;//增量
    public dlat = 0;
    public len = 40;
    public wid = 30;
    public hei = 50;
    public scale = new Cartesian3(30,40,50);
    public cylinder: Entity;
    public controlinggeometry = "box";
    
    
    


    //叠加热力图
    public max_car = 3133
    //设置热力图矩形最小和最大纬度
    public latMin = 30.5060572
    public latMax = 30.5126791
    //设置热力图矩形最小和最大经度
    public lonMin = 114.232548
    public lonMax = 114.2410227
    public car_num = 2700
    public values = []
    public position = [{ y: 30.508615, x: 114.233714 },//{y:30.508315,x:114.233914},
    { y: 30.507905, x: 114.234136 },//{y:30.507678,x:114.234493},
    { y: 30.507378, x: 114.234893 },
    { y: 30.507045, x: 114.235824 }]
    public heatMapIns
    public timer  //定时器名称
    public CAR_timedata

    public mounted() {
        this.init();
        this.cmap.addLayer(this);
        //this.cmap.showClock();


        //车流量数据
        this.CAR_timedata = JSON.parse(localStorage.getItem('CAR_timedata'))
        if (this.CAR_timedata == null) {
            this.CAR_timedata = [
                {
                    "date": "2023-03-24",
                    "time": "15:00:00",
                    "value": 281
                },
                {
                    "date": "2023-03-28",
                    "time": "9:00:00",
                    "value": 2502
                },
                {
                    "date": "2023-03-28",
                    "time": "10:00:00",
                    "value": 2500
                },
                {
                    "date": "2023-03-28",
                    "time": "11:00:00",
                    "value": 2494
                },
                {
                    "date": "2023-03-28",
                    "time": "14:00:00",
                    "value": 2392
                },
                {
                    "date": "2023-03-28",
                    "time": "15:00:00",
                    "value": 2360
                },
                {
                    "date": "2023-03-28",
                    "time": "16:00:00",
                    "value": 2154
                },
                {
                    "date": "2023-03-28",
                    "time": "17:00:00",
                    "value": 1694
                },
                {
                    "date": "2023-03-29",
                    "time": "9:00:00",
                    "value": 2406
                },
                {
                    "date": "2023-03-29",
                    "time": "10:00:00",
                    "value": 2418
                },
                {
                    "date": "2023-03-29",
                    "time": "11:00:00",
                    "value": 2478
                },
                {
                    "date": "2023-03-29",
                    "time": "18:00:00",
                    "value": 259
                },
                {
                    "date": "2023-03-29",
                    "time": "19:00:00",
                    "value": 234
                },
                {
                    "date": "2023-03-29",
                    "time": "20:00:00",
                    "value": 202
                },
                {
                    "date": "2023-03-29",
                    "time": "21:00:00",
                    "value": 181
                },
                {
                    "date": "2023-03-29",
                    "time": "22:00:00",
                    "value": 180
                },
                {
                    "date": "2023-03-30",
                    "time": "09:00:00",
                    "value": 2204
                },
                {
                    "date": "2023-03-30",
                    "time": "10:00:00",
                    "value": 2209
                },
                {
                    "date": "2023-03-30",
                    "time": "11:00:00",
                    "value": 2495
                },
                {
                    "date": "2023-03-30",
                    "time": "15:00:00",
                    "value": 802
                },
                {
                    "date": "2023-03-30",
                    "time": "16:00:00",
                    "value": 531
                }
            ]
        }
        this.setTime()
        //------停车场------//
        PubSub.subscribe("heatmap", (msg: any, data: any) => { /* 订阅弹窗事件 */


            let values = []
            let arr = this.CAR_timedata.filter((i) => {
                console.log(i.date + i.time)
                return (i.date == data.date) && (data.time.substring(0, 2) == i.time.substring(0, 2));
            });
            //&&(i.time.substring(0,1)==this.time.substring(0,1))
            // console.log(arr+"arr")
            if (arr.length == 0) {
                this.myadd(values, 0)
            } else {
                this.myadd(values, arr[0].value)
            }

            // console.log(data)
            this.mysetdata(values);
            let heatcanvas = document.getElementsByClassName('heatmap-canvas')
            let h = heatcanvas[0] as HTMLCanvasElement
            // console.log(heatcanvas)
            console.log(data.date + data.time + '111')
            console.log(arr.length)
           
            //基本体绘制
           // this.cmap.viewer.entities.removeAll();
            // this.cmap.viewer.entities.add({

            //     name: 'heatmap',
            //     // 设置矩形
            //     rectangle: {
            //         // 指定矩形区域
            //         coordinates: Rectangle.fromDegrees(this.lonMin, this.latMin, this.lonMax, this.latMax),
            //         // 设置矩形图片为据透明度的热力图
            //         material: new ImageMaterialProperty({
            //             image: h,
            //             transparent: true,
            //         })
            //     }
            // })
            // this.cmap.viewer.zoomTo(this.cmap.viewer.entities)


            
        });
        //------停车场------//

        //订阅能源组件
        PubSub.subscribe("energyshow", (msg: any, data: any) => {
            if (data === "") {

                var center = Cartesian3.fromDegrees(140, 39, 30);
                var heading = (0.0) * Math.PI / 180;

                var pitch = (-60.0) * Math.PI / 180;
                var range = 200.0;
                var i = 0;
                this.cmap.viewer.scene.globe.show = false
                this.cmap.viewer.camera.lookAt(center, new HeadingPitchRange(heading, pitch, range));


            }
        })
        //订阅交通组件
        PubSub.subscribe("traffic", (msg: any, data: any) => {
            if (data === "") {
                this.cmap.viewer.zoomTo(this.tileset8);
                this.cmap.viewer.scene.globe.show = true;

                //隐藏energy标签
                PubSub.publish("energyChartCold", "2")
                PubSub.publish("energyChartWarm", "2")
                PubSub.publish("energyChartZq", "2")
                PubSub.publish("energyChartGd", "2")
                PubSub.publish("energyBox1", "2")
                PubSub.publish("energyBox2", "2")

            }
        })

        //订阅几何体组件
        PubSub.subscribe("updateGeometry",(msg: any, data: any) => {
            switch(data.type){
                case 1:
                        this.alt = 100 +  data.data;
                        break;
                case 2:
                        this.dlat = this.lat + data.data;
                        
                        break;   
                case 3:
                        this.dlon = this.lon + data.data;
                        break;
                case 4:
                        this.scale = data.data;
                
            }
 
                // switch(data.type){
                //     case 1:  this.alt = data.data;
                // }
                // console.log(this.data);
        } )
        
        PubSub.subscribe("view", (msg: any, data: any) => { /* 订阅弹窗事件 */
            if(data==1){
                this.setview()
            }else{
                this.backview()
            }
        });



    }

    //设置时间
    setTime() {
        //每隔30分钟运行一次保存方法
        this.timer = setInterval(() => {
            this.saveList();
        }, 10000)
    }
    saveList() {
        this.postCommand("/api/get_park_space_info/", {
            "park_id": "10001"
        })
            .then((res) => {
                if (res.response_code == 0) {
                    var value = res.area_info[0].occupied_parking_space
                    let year = new Date().getFullYear();
                    //月份是从0月开始获取的，所以要+1;
                    let month = new Date().getMonth() + 1;
                    //日
                    let day = new Date().getDate();
                    //时
                    let hour = new Date().getHours();
                    var date, time
                    time = hour + ":00:00"
                    if (month < 10) {
                        date = year + "-0" + month + "-" + day
                    } else {
                        date = year + "-" + month + "-" + day
                    }
                    let arr = this.CAR_timedata.filter((i) => {
                        return (i.date == date) && (time.substring(0, 2) == i.time.substring(0, 2));
                    });
                    if (hour < 10) {
                        time = "0" + hour + ":00:00"
                    } else {
                        time = hour + ":00:00"
                    }
                    if (arr.length == 0) {
                        this.CAR_timedata.push({ date: date, time: time, value: value })
                    }
                    localStorage.setItem("CAR_timedata", JSON.stringify(this.CAR_timedata))
                    console.log(date + ' ' + time + " 存储车辆数：" + value)
                    // fs.writeFileSync('./carnum.txt', JSON.stringify(this.CAR_timedata));
                }

            })


        //控制长方体旋转
        // //console.log(this.move);
        //  if(this.move){
     

        //  //this.rx++;
        //  }
    }
    
    public zoomIn() {
        let range = this.cmap.getCameraInfo().range;
        range = range !== undefined ? range : 10000;
        this.cmap.viewer.trackedEntity === undefined ? this.cmap.zoomIn(range / 15.0) : this.cmap.zoomIn(100);
    }

    public zoomOut() {
        let range = this.cmap.getCameraInfo().range;
        range = range !== undefined ? range : 10000;
        this.cmap.viewer.trackedEntity === undefined ? this.cmap.zoomOut(range / 15.0) : this.cmap.zoomOut(100);
    }

    public init() {
        let _this = this;

        //经纬度读取

        

        this.cmap = new CMap("map", {
            center: this.mapcenter,
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MTZkYTg2NS03ZTllLTRkYzItODU2MS0zY2NmYmVlYTMzNjgiLCJpZCI6MzkxMDAsImlhdCI6MTYwNzE2Mjc2NH0.n73x2VmM7G18YUagLBgMt9sh3iZLzJcMlihEBhTuhO4"
        }, {
            store: true
        });

       
        




        this.cmap.load?.then(() => {
            //let cartesian = Cartesian3.fromDegrees(122, 32, 2000)


            //绘制基本体
            //研究点击获取位置
             let handler = new ScreenSpaceEventHandler(this.cmap.viewer.scene.canvas);
             handler.setInputAction(function (movement){
                let cartesian = _this.cmap.viewer.camera.pickEllipsoid(movement.endPosition,_this.cmap.viewer.scene.globe.ellipsoid);
                let cartographic = Cartographic.fromCartesian(cartesian);
                let lng = _Math.toDegrees(cartographic.longitude); // 经度
                let lat = _Math.toDegrees(cartographic.latitude); // 纬度
                let alt = cartographic.height; // 高度
                let coordinate = {
                    longitude: Number(lng.toFixed(6)),
                    latitude: Number(lat.toFixed(6)),
                    altitude: Number(alt.toFixed(2))
                };

                

                if(!_this.readyDraw){
                    _this.recposition[0] = Cartesian3.fromDegrees(lng,lat,100);
                    //记录经纬度
                    _this.lon = lng;
                    _this.lat = lat;
                    _this.dlon = lng;
                    _this.dlat = lat;
                }
                

                // //判断是否点击，点击一次确定绘制起始点
                // if(!_this.readyDraw){
                //     _this.recposition[0] = Cartesian3.fromDegrees(lng,lat,500);
                //     _this.recposition[1] = _this.recposition[0];
                    
                // }else if(!_this.finishedDraw){
                //     //console.log(_this.recposition[0]);
                //     _this.recposition[1] = Cartesian3.fromDegrees(lng,lat,500);
                //     _this.finishedDraw = false;
                   
                //     //console.log(_this.recposition[1]);
                // }

                //console.log(coordinate);
               
             
                // _this.rec1 = _this.cmap.viewer.entities.add({
                //     name: 'rectangle',
                //     rectangle:{
                        
                //         coordinates:
                //         //  new CallbackProperty(function(){
                //         //     console.log(_this.recposition);
                //         //     return Rectangle.fromCartesianArray(_this.recposition);
                //         // },false),
                //         Rectangle.fromCartesianArray(
                //         [
                //              Cartesian3.fromDegrees(114.183443,30.546144,500),
                //              Cartesian3.fromDegrees(114.183443,31.546144,500),

                //         ]
                //         ),
                //         material : Color.RED.withAlpha(0.5),
                //         height : 500
                //     },
                    
                // });
               // console.log(_this.rec1);
              }, ScreenSpaceEventType.MOUSE_MOVE);

              handler.setInputAction(function (click){
                   
                    // //基本体绘制判断
                    // if(_this.readyDraw){
                    //     _this.finishedDraw = true;
                    //     _this.readyDraw = false;
                    // }else{
                    //      _this.readyDraw = true;
                    //      _this.finishedDraw = false;
                    
                    // }

                    //高亮控制
                    // 处理鼠标按下事件，获取鼠标当前位置
                   let feature = _this.cmap.viewer.scene.pick(click.position);
                   console.log(feature)
                   if(feature!=null){
                        var id=feature._batchId

                        var data=feature._content._batchTable._properties.name[id]
                        PubSub.publish("info", data)
                        //console.dir(feature);
                        if(feature.color.toRgba() == new Color(1.0,1.0,1.0,1.0).toRgba()){
                                feature.color = new Color(Math.random(),Math.random(),Math.random(),1.0)
                        }else{
                                feature.color = new Color(1.0,1.0,1.0,1.0)
                        }
                        //this._content.batchTable.getProperty(this._batchId, name)
                   }
                   

                   

                   //基本体绘制
                    _this.readyDraw = true;
                    _this.Box = _this.cmap.viewer.entities.add({
                    name: "立方体",
                    position: _this.recposition[0],
                    box: {
                        dimensions: new CallbackProperty(function (time) {
                            //_this.len++;
                            //_this.wid++;
                            //_this.hei++;
                          
                                return _this.scale;
                             
                            
                        }
                        ,false),
                        //new Cartesian3(40.0, 30.0, 50.0),
                        material: Color.RED.withAlpha(0.5),
                        
                    }
                });
                _this.controlinggeometry = "box";

                   

                    // _this.Box = _this.cmap.viewer.entities.add({
                    //     name: "立方体",
                    //     position:  Cartesian3.fromDegrees(114.442500,30.653333,500),
                    //     box: {
                    //         dimensions: new Cartesian3(400.0, 300.0, 50.0),
                    //         material: Color.RED.withAlpha(0.5),
                            
                    //     }

                    // });


                    PubSub.publish("geometry", "") ;
                  

                    

                   console.log(_this.readyDraw);

                    //机械臂
                  
                if(!_this.readymove){


                    // for(var i = 0;i < 30;i++){
                    //     //console.log(_this.pointpositions[i]);
                    //     _this.cmap.viewer.entities.add({
                    //         position : Cartesian3.fromDegrees( _this.lons[i],_this.lats[i],100),
                    //         point: {
                    //             color: Color.RED,
                    //             pixelSize: 6
                    //         }
                    //     })
                    // }
                    
                        _this.pointlats = [];
                        _this.pointlons = [];
                        var time = [0];
                        for(var i = 1;i <99;i++){
                            time.push(i / 99);
                        };
                        time.push(1);
                       
                        //纬度
                        _this.spline = new LinearSpline({
                            times : time,
                            points: _this.lats,
                        });

                        for(var i = 0; i <= 1000;i++){
                            //插值点
                            _this.pointlats.push(_this.spline.evaluate(i / 1000));
                           
                        }
                        //经度
                        _this.spline = new LinearSpline({
                            times : time,
                            points: _this.lons,
                        });

                        for(var i = 0; i <= 1000;i++){
                            //插值点
                            _this.pointlons.push(_this.spline.evaluate(i / 1000));
                           
                        }
                        //console.log(_this.pointlats);
                        //console.log(_this.pointlons);
                        for(var i = 0;i <= 1000;i++){
                            //console.log(_this.pointpositions[i]);
                            _this.cmap.viewer.entities.add({
                                position : Cartesian3.fromDegrees( _this.pointlons[i],_this.pointlats[i], 100),
                                point: {
                                    color: Color.YELLOW,
                                    pixelSize: 1
                                }
                            })
                        }
                    _this.readymove = true;
                }
                        


              },ScreenSpaceEventType.LEFT_CLICK);

              //右键绘制圆柱体
              handler.setInputAction(function(click){
                 _this.readyDraw = true;
                 _this.cylinder = _this.cmap.viewer.entities.add({
                    name: "圆柱体",
                    position: _this.recposition[0],
                    cylinder:{
                        topRadius: new CallbackProperty(function (time) {
                            
                            return _this.scale.x;
                        }
                        ,false),
                        bottomRadius: new CallbackProperty(function (time) {
                            
                            return _this.scale.x;
                        }
                        ,false),
                        length:  new CallbackProperty(function (time) {
                          
                            return _this.scale.z;
                        }
                        ,false),
                        material: Color.YELLOW.withAlpha(0.5),
                    }
                });
                _this.controlinggeometry = "cylinder";
                PubSub.publish("geometry", "") ;

              },ScreenSpaceEventType.RIGHT_CLICK);

              handler.setInputAction(function(click){
                _this.readyDraw = false;
                //绘制Box
                if(_this.controlinggeometry == "box"){
                    _this.cmap.viewer.entities.add({
                name: "立方体",
                position: _this.Box.position,
                box: {
                    dimensions: new Cartesian3(_this.scale.x,_this.scale.y, _this.scale.z),
                    
                    //new Cartesian3(40.0, 30.0, 50.0),
                    material: Color.RED.withAlpha(0.5),
                    }
                    
                });
                _this.cmap.viewer.entities.remove(_this.Box);
                _this.scale = new Cartesian3(30,40,50);
                }else{
                  _this.cmap.viewer.entities.add({
                        name: "圆柱体",
                        position: _this.cylinder.position,
                        cylinder:{
                            topRadius: _this.scale.x,
                            bottomRadius: _this.scale.x,
                            length:  _this.scale.z,
                            material: Color.YELLOW.withAlpha(0.5),
                        }
                    });
                    _this.cmap.viewer.entities.remove(_this.cylinder);
                    _this.scale = new Cartesian3(30,40,50);
                }
                

              },ScreenSpaceEventType.MIDDLE_CLICK);


              
            // this.cmap.viewer.screenSpaceEventHandler.setInputAction(function (click) {
            //     // 处理鼠标按下事件，获取鼠标当前位置
            //     //let feature = _this.cmap.viewer.scene.pick(click.position);
                
            //     //显示该位置
            //     //console.log(feature);
            //     //feature.color = Color.BLUE;


            //     //console.log(_this.cmap.viewer.scene.pickPositionSupported);

            //     //转换经纬度
            //     //只能获取模型的经纬度。无法获取空白经纬度
            //     if(!_this.readyDraw){
            //     //let cartesian = _this.cmap.viewer.scene.pickPosition(click.position);
            //     let cartesian = _this.cmap.viewer.camera.pickEllipsoid(click.endPosition,_this.cmap.viewer.scene.globe.ellipsoid);

            //     console.log(cartesian);
            //     // let ray = _this.cmap.viewer.camera.getPickRay(click.position);
            //     // let cartesian = _this.cmap.viewer.scene.globe.pick(ray, _this.cmap.viewer.scene);
            //     let cartographic = Cartographic.fromCartesian(cartesian);
            //     let lng = _Math.toDegrees(cartographic.longitude); // 经度
            //     let lat = _Math.toDegrees(cartographic.latitude); // 纬度
            //     let alt = cartographic.height; // 高度
            //     let coordinate = {
            //         longitude: Number(lng.toFixed(6)),
            //         latitude: Number(lat.toFixed(6)),
            //         altitude: Number(alt.toFixed(2))
            //     };
                
            //     console.log(coordinate);
            //     _this.drawFrom = new Cartesian3(lng,lat,alt);
            //     //console.log(_this.drawFrom);
            //     _this.readyDraw = !_this.readyDraw;
            //     }else{

            //     let cartesian = _this.cmap.viewer.scene.pickPosition(click.position);
            //     // let ray = _this.cmap.viewer.camera.getPickRay(click.position);
            //     // let cartesian = _this.cmap.viewer.scene.globe.pick(ray, _this.cmap.viewer.scene);
            //     let cartographic = Cartographic.fromCartesian(cartesian);
            //     let lng = _Math.toDegrees(cartographic.longitude); // 经度
            //     let lat = _Math.toDegrees(cartographic.latitude); // 纬度
            //     let alt = cartographic.height; // 高度
            //     let coordinate = {
            //         longitude: Number(lng.toFixed(6)),
            //         latitude: Number(lat.toFixed(6)),
            //         altitude: Number(alt.toFixed(2))
            //     };
                
            //     _this.drawTo = new Cartesian3(lng,lat,alt);
            //     _this.readyDraw = !_this.readyDraw;
            //     //console.log(_this.drawTo);
            //     //console.log("2");

            //     _this.rec1 = _this.cmap.viewer.entities.add({
            //         name: 'rectangle',
            //         rectangle:{
                        
            //             coordinates: Rectangle.fromCartesianArray([
            //                 // Cartesian3.fromDegrees(_this.drawFrom.x,_this.drawFrom.y),
            //                 // Cartesian3.fromDegrees(_this.drawTo.x,_this.drawTo.y)
            //                 Cartesian3.fromDegrees(_this.drawTo.x, _this.drawTo.y,500),
            //                 // Cartesian3.fromDegrees(114.183443,30.546144,500),
            //                 // Cartesian3.fromDegrees(114.2471,30.528733,500),
            //                 Cartesian3.fromDegrees(_this.drawFrom.x, _this.drawFrom.y,500),
            //             ]),
            //             material : Color.RED.withAlpha(0.5),
            //             height : _this.drawTo.z
            //         },
                    
            //     });

            //     //console.log(_this.rec1);


            //     }
                
  
            //     //console.log(cartesian);

            //     // //点击搜索按钮,订阅能源组件
            //     // if (feature && feature.id) {



            //     //     if (feature.id === 'DQSB') {

            //     //         PubSub.publish("energy", "")
            //     //     }
            //     // }

            //     // 选中某模型

            // }, ScreenSpaceEventType.LEFT_CLICK);



            //鼠标事件要注意与cesium鼠标移动的事件冲突，准备绘制时需要关掉鼠标对视角移动的作用
            //鼠标按下
            this.cmap.viewer.screenSpaceEventHandler.setInputAction(function (down) {
                // 处理鼠标按下事件，获取鼠标当前位置
                let feature = _this.cmap.viewer.scene.pick(down.position);

                //绘制基本体
                //_this.drawFrom = down.position;
                //需要将屏幕位置转成经纬度信息



                //显示该位置

                //机械臂
                //console.log(down.position);
                //_this.readyDraw = true;
               
               // if (_this.rx > 360) _this.rx = 0;
                // if(_this.readyDraw){
                
                // }

                //     Cartesian3.add(_this.axis,Cartesian3.UNIT_X,_this.axis);
                //     console.log(_this.axis);
                // //点击搜索按钮,订阅能源组件
                // if(feature &&  feature.id){



                // }

                // 选中某模型

            }, ScreenSpaceEventType.LEFT_DOWN);


            //鼠标移动
            this.cmap.viewer.screenSpaceEventHandler.setInputAction(function (move) {

                //判断鼠标是否按下
                // if (_this.readyDraw) {
                //     _this.move = true;

                //     //获取鼠标位置的值并赋值
                //     //console.log(move.endPosition)
                // }







            }, ScreenSpaceEventType.MOUSE_MOVE);


            //鼠标松开
            this.cmap.viewer.screenSpaceEventHandler.setInputAction(function (up) {

                //绘制基本体
                // _this.drawTo = up.position;
                // console.log(_this.drawFrom);
                // console.log(_this.drawTo);
               

                // 处理鼠标按下事件，获取鼠标当前位置
                let feature = _this.cmap.viewer.scene.pick(up.position);
                //console.log(up.position);
               // _this.readyDraw = false;
                //显示该位置
                // console.log(feature);



                // //点击搜索按钮,订阅能源组件
                // if(feature &&  feature.id){



                // }

                // 选中某模型

            }, ScreenSpaceEventType.LEFT_UP);

               
                //绘制基本体
                //绘制矩形
             
                 
                // _this.rec1 = _this.cmap.viewer.entities.add({
                //     name: 'rectangle',
                //     rectangle:{
                        
                //         coordinates: new CallbackProperty(function(){
                            
                //             return Rectangle.fromCartesianArray(
                                
                //                 _this.recposition
                //                 );
                //         },false),
                //         // Rectangle.fromCartesianArray([
                //         //     // Cartesian3.fromDegrees(_this.drawFrom.x,_this.drawFrom.y),
                //         //     // Cartesian3.fromDegrees(_this.drawTo.x,_this.drawTo.y)
                //         //     Cartesian3.fromDegrees(_this.drawTo.x, _this.drawTo.y,500),
                //         //     // Cartesian3.fromDegrees(114.183443,30.546144,500),
                //         //     // Cartesian3.fromDegrees(114.2471,30.528733,500),
                //         //     Cartesian3.fromDegrees(_this.drawFrom.x, _this.drawFrom.y,500),
                //         // ]),
                //         material : Color.RED.withAlpha(0.5),
                //         height : 100
                //     },
                    
                // });
                
                

     
                



            //加载模型
            this.tileset8 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/国博/tileset.json",
                modelMatrix: Matrix4.fromArray([0.8130672159603891, -0.3625481313622443, 0.4555003345511025, 0, 0.3341696995344874, 0.9313263716024125, 0.14478191002647867, 0, -0.4767098847763202, 0.03449698542814306, 0.8783835402333751, 0, -11912.143811094109, -1643.6542054228485, 728.5330550889485, 1]),
            })
            this.tileset8.readyPromise.then(() => this.loadnum++);

            this.cmap.viewer.scene.light = new DirectionalLight({
                direction: this.cmap.viewer.scene.camera.directionWC,
            });
            this.cmap.viewer.scene.primitives.add(this.tileset8);

            this.tileset1 = new Cesium3DTileset({

                url: "static/Data/国博手工模型/A02-D01/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9943463190977329, -0.04788309288770773, 0.09477661690679112, 0, 0.0605044933611221, 0.9889789790543058, -0.13512877292352476, 0, -0.08726169824099964, 0.14009920914912688, 0.9862847497634166, 0, -1228.1979414750822, 1253.7556103570387, 3688.0366241643205, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset1);
            this.tileset2 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/B01-09/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9973119957889952, -0.028827193815086583, 0.0673630162041311, 0, 0.038623449761228223, 0.9880852544494698, -0.1489824119420417, 0, -0.06226565814245036, 0.1511837386635016, 0.9865426827967525, 0, -543.7095301258378, 1558.062955944799, 3695.263225235045, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset2);
            this.tileset3 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/C01/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9968258016973394, -0.0324843251721918, 0.07268486560876039, 0, 0.04287849202708696, 0.988301847090795, -0.146358785040072, 0, -0.06708022057163504, 0.1490108306635129, 0.9865576599231443, 0, -674.4703276003711, 1498.2566085373983, 3693.5512684406713, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset3);
            this.tileset4 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/C02/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9968299904031528, -0.0324523309509791, 0.07264169910388615, 0, 0.042841730732380984, 0.9883003392555266, -0.14637973061618215, 0, -0.0670414524059966, 0.14902780157829604, 0.9865577317197585, 0, -673.9110600091517, 1498.0505363149568, 3694.241075741127, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset4);
            this.tileset5 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/C03/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9968330051957174, -0.03242742838599638, 0.07261144290500379, 0, 0.04281338994337913, 0.9882996486150541, -0.14639268488868068, 0, -0.0670147252029854, 0.14903780203569683, 0.9865580368991665, 0, -673.8426624634303, 1498.5964506594464, 3693.366836269386, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset5);
            this.tileset6 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/C04/tileset.json",
                modelMatrix: Matrix4.fromArray([0.996835735324406, -0.03240503272474854, 0.07258395576406323, 0, 0.042788597285154356, 0.9882973885940521, -0.1464151892412301, 0, -0.06698994493668758, 0.14905765848249547, 0.9865567199736134, 0, -673.7318385541439, 1499.1039385795593, 3692.992844709195, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset6);
            this.tileset7 = new Cesium3DTileset({
                url: "static/Data/国博手工模型/C05/tileset.json",
                modelMatrix: Matrix4.fromArray([0.9968379899780274, -0.032383875012774704, 0.07256243088349573, 0, 0.042765054378546635, 0.9882969718863379, -0.14642488000437304, 0, -0.066971425702048, 0.14906501936890532, 0.9865568651324579, 0, -673.7148051266558, 1499.5546148493886, 3692.2708963127807, 1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset7);


            this.tileset8 = new Cesium3DTileset({
                url: "static/Data/ckymx/tileset.json",
                modelMatrix: Matrix4.fromArray([0.996840677370346,-0.0321564225750601,0.07262663717261911,0,0.04254486601031346,0.9883158481402294,-0.1463616025159027,0,-0.06707159097556559,0.1489890895402503,0.9865615302057817,0,-673.5540350186639,1496.1953485012054,3696.3969446895644,1]),
            })
            this.cmap.viewer.scene.primitives.add(this.tileset8);

            //经纬度驱动
            this.tileset10 = new Cesium3DTileset({
                url: "static/Data/简化模型/tileset.json",
                modelMatrix: Matrix4.fromArray([0.8099086858882808,0.3884819751532511,-0.4394652153512801,0,0.3651826866022766,0.25234678831047624,0.8960818622399025,0,0.45900928741002833,-0.8862295715052713,0.06251096432564301,0,-4092242.7814715533,7909784.155955432,-1394168.5117163695,1]),
            }) 
            this.cmap.viewer.scene.primitives.add(this.tileset10);
            //加载水面
            this.cmap.viewer.scene.primitives.add(
                new Primitive({
                    geometryInstances: new GeometryInstance({
                        // geometry: new RectangleGeometry({
                        //     rectangle:Rectangle.fromDegrees(
                        //         114.217, 30.46,
                        //         114.23, 30.48
                        //     ),
                        //     vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                        // }),
                        geometry: new PolygonGeometry({
                            polygonHierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArrayHeights(
                                [
                                    114.231822, 30.493323, 0,
                                    114.249780, 30.514683, 0,
                                    114.258353, 30.522732, 0,
                                    114.269315, 30.537965, 0,
                                    114.284291, 30.529202, 0,//
                                    114.274239, 30.513776, 0,
                                    114.265076, 30.504717, 0,
                                    114.254442, 30.493707, 0,
                                    114.247364, 30.483133, 0

                                ]
                            )),
                            vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                        })
                    }),
                    appearance: new EllipsoidSurfaceAppearance({
                        // aboveGround: true,
                        material: new Material({
                            fabric: {
                                type: "Water",
                                uniforms: {
                                    blendColor: Color.fromCssColorString('#696969'),
                                    // 51,77,153,1
                                    baseWaterColor: new Color(0.0, 0.0, 0.0, 0.4),
                                    normalMap: 'static/Data/waterNormals.jpg',
                                    frequency: 5000.0,
                                    animationSpeed: 0.01,
                                    amplitude: 2,
                                    specularIntensity: 4
                                }
                            }
                        })
                    }),
                })
            );






            //设置渲染效果
            var stages = this.cmap.viewer.scene.postProcessStages;
            stages.fxaa.enabled = true
            //this.cmap.viewer.scene.brightness = this.cmap.viewer.scene.brightness || stages.add(Cesium.PostProcessStageLibrary.createBrightnessStage());
            //this.cmap.viewer.scene.brightness.enabled = true;
            //this.cmap.viewer.scene.brightness.uniforms.brightness = Number(1.2);
            this.cmap.viewer.shadows = true
            this.cmap.viewer.scene.postProcessStages.fxaa.enabled = true
            var ambient = this.cmap.viewer.scene.postProcessStages.ambientOcclusion;
            ambient.enabled = true;
            ambient.uniforms.ambientOcclusionOnly = false
            ambient.uniforms.intensiity = 3
            ambient.uniforms.bias = 0.1
            ambient.uniforms.lengthCap = 0.03
            ambient.uniforms.stepSize = 1
            ambient.uniforms.blurStepSize = 0.86
            //this.cmap.viewer._cesiumWidget._creditContainer.style.display = "none";
            this.cmap.viewer.scene.debugShowFramesPerSecond = true;






                
            this.cmap.viewer.zoomTo(this.tileset8);
            //------停车场------//
            var value, values = []
            this.heatMapIns = h337.create({
                radius: 90,
                container: document.querySelector('#heatMap'),
                gradient: {
                    //渐变颜色
                    0: "rgba(255,255,255,1)", //value为0的颜色
                    0.3: "#82ff6d", //0.3value为0.5的颜色
                    0.8: "#f3ff6d", //0.5value为1的颜色
                    1: "#ff6d6d", //1value为2的颜色
                },
                maxOpacity: 1,
                minOpacity: 0,
                blur: 0.75,
            })
            this.mypostCommand("/api/get_park_space_info/", {
                "park_id": "10001"
            })
                .then((res) => {
                    if (res.response_code == 0) {
                        value = res.area_info[0].occupied_parking_space
                        this.myadd(values, value)
                        this.car_num = res.area_info[0].total_parking_space

                        // console.log(data)
                        this.mysetdata(values);
                        let heatcanvas = document.getElementsByClassName('heatmap-canvas')
                        let h = heatcanvas[0] as HTMLCanvasElement
                        // console.log(heatcanvas)
                        //基本体绘制
                        //this.cmap.viewer.entities.removeAll();
                        // this.cmap.viewer.entities.add({
                        //     // id:'heatmap',
                        //     name: 'heatmap',
                        //     // 设置矩形
                        //     rectangle: {
                        //         // 指定矩形区域
                        //         coordinates: Rectangle.fromDegrees(this.lonMin, this.latMin, this.lonMax, this.latMax),
                        //         // 设置矩形图片为据透明度的热力图
                        //         material: new ImageMaterialProperty({
                        //             image: h,
                        //             transparent: true,
                        //         })
                        //     }
                        // })
                        // this.cmap.viewer.zoomTo(this.cmap.viewer.entities)
                    }
                })
            // this.mypostCommand("/api/get_car_park_info_time/", {
            //     "start_time": "2023-03-23 14:00",
            //     "end_time": "2023-03-23 15:00"
            //   })
            // .then((res)=>{
            //     if(res.response_code==0){
            //         value=res.car_park_info.length
            //         this.myadd(values,value)
            //         // this.car_num=res.area_info[0].total_parking_space
            //         PubSub.publish("heatmap", values)
            //     }
            //     console.log("car_num="+value)
            //     console.log("car_nums="+values)
            // })

            //经纬度
           // this.cmap.viewer.zoomTo(this.tileset10);

            //------停车场------//

            //能源站模型建立
            this.tileset9 = new Cesium3DTileset({
                url: "static/Data/能源站/tileset.json",
                modelMatrix: Matrix4.fromArray([-0.03860352137840181, -0.979255841058372, 0.19891647968493725, 0, 0.046327041638888955, 0.1970969094280422, 0.9792888304820514, 0, -0.9981801307129774, 0.04701920934016973, 0.03775739136711381, 0, -27211.218099907972, 1149.5314208408818, -26047.324914237484, 1]),
            })
            this.tileset8.readyPromise.then(() => this.cmap.viewer.scene.primitives.add(this.tileset9));



            //添加图标
            var billboard = this.cmap.viewer.scene.primitives.add(new BillboardCollection());
  
            billboard.add({
                //电器设备
                id: "DQSB",
                position: Cartesian3.fromDegrees(139.999729, 39.000013, 40),
                image: require('@/assets/images/login/search.png'),
                show: true, // default
                eyeOffset: new Cartesian3(0.0, 0.0, 0.0), // default
                horizontalOrigin: HorizontalOrigin.CENTER, // default
                verticalOrigin: VerticalOrigin.BOTTOM, // default: CENTER
                scale: 2.0, // default: 1.0
                // color: Cesium.Color.LIME, // default: WHITE
                rotation: 0.0, // default: 0.0
                alignedAxis: Cartesian3.ZERO, // default
                width: 25, // default: undefined
                height: 25, // default: undefined
                pixelOffset: new Cartesian2(0, -72),

            })






        });


            

       



    }





    //------停车场------//
    public myadd(values: any, value: any) {
        values.push(value)
        values.push(value)
        values.push(value)
        values.push(value)
    }
    public async mypostCommand(
        postUrl: string,
        data: Object
    ) {
        let initData: any;
        await axios.post(postUrl, data).
            then(response => {
                initData = response.data;
                // console.log(initData+"initData")
            }).
            catch(error => {
                // console.error("get All situation FAILED! using Url: ", initUrl, "err Code:", error);
            });
        return initData;
    }
    //设置热力图数据
    //value表示各个停车场中车辆数目，为整型数组
    public mysetdata(values: number[]) {
        var points = []
        //手动选择各停车场区域经纬度，目前只有一个point，根据停车场数目增加，value表示车辆数目
        this.position.forEach((item, index) => {
            var point = {
                x: Math.floor((item.x - this.lonMin) / (this.lonMax - this.lonMin) * 500),
                y: Math.floor((this.latMax - item.y) / (this.latMax - this.latMin) * 500),
                value: Math.floor(values[index])
            };
            points.push(point);
        });
        let heatdata = {
            min: 0,
            max: this.max_car,
            data: points
        }
        this.heatMapIns.setData(heatdata)
    }
    public flyto(point: number[], type: string, id?: string) {
        let flight = this.armyList.find(item => item.id === id);
        this.cmap.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(Number(flight.lon), Number(flight.lat), 1000),
            orientation: {
                heading: 0,
                pitch: _Math.toRadians(-90),
                roll: 0
            },
            duration: 0
        });
    }

    public setview(){
        var pitch = this.cmap.viewer.camera.pitch;
        //获取当前视角的heading
        var heading = this.cmap.viewer.camera.heading;
        //获取当前视角的postion（位置）
        var position = this.cmap.viewer.camera.position;


        console.log("获取当前视角x,y,z",position.x,position.y,position.z,"pitch",pitch,"heading",heading);

        var ObjectJson={
            "x":position.x,
            "y":position.y,
            "z":position.z,
            "pitch":pitch,
            "heading":heading
        }
        console.log("ObjectJson",ObjectJson);
        if(!window.localStorage){
            window.alert("该浏览器不支持LocalStorage")
        }else{
            var storage = window.localStorage;
            storage.setItem("positionJson",JSON.stringify(ObjectJson));
            console.log("storage.positionJson",storage.positionJson);
        }

    }
    public backview(){
        var storage = window.localStorage;

        var dataJson = storage.getItem("positionJson")
        var Json=JSON.parse(dataJson);
        console.log("Json",Json)
        var center = Cartesian3.fromDegrees(116.3934380, 39.9033418, 50);
        center.x=Json.x
        center.y=Json.y
        center.z=Json.z
        this.cmap.viewer.camera.flyTo({ //定位到范围中心点
            destination: center,
            orientation: {
                heading:Json.heading,
                pitch:Json.pitch,
                // heading: testHeading,//左右方向
                // pitch: testPitch, //上下方向
                roll: 0.0
            },
        })

    }
    // public showLabel() {
    //     // 创建标签信息提示框
    //     this.label = this.cmap.viewer.entities.add({
    //       label: {
    //         text: "entity.label",
    //         font: '14pt monospace',
    //         style: LabelStyle.FILL_AND_OUTLINE,
    //         outlineWidth: 2,
    //         verticalOrigin: VerticalOrigin.BOTTOM,
    //         pixelOffset: new Cartesian2(0, -10),
    //       },
    //     })
    //   }
    // public hideLabel() {
    // // 移除标签信息提示框
    //     this.cmap.viewer.entities.remove(this.label);
    //     this.label = null;
    // }

    public changeBox() {
        // const m = this.Box.modelMatrix;
        //         const m1 = Matrix3.fromRotationX(_Math.toRadians(60) );
        //         Matrix4.multiplyByMatrix3(m,m1,m);
        //         this.Box.modelMatrix = m;
        //        // this.cmap.viewer.scene.requestRender();

        //          console.log(this.Box.modelMatrix);
    }

    
    public start() {
        
        





    }

    public stop() {


    }

    public end() {

    }

    public accelerate() {

    }

    public slow() {

    }

    public destroy() {

    }

    public async getHeartbeat(
        getUrl: string,
    ) {
        let initData: any;
        await axios.get(getUrl).then(response => {
            initData = response.data;
        }).
            catch(error => {
                // console.error("get All situation FAILED! using Url: ", initUrl, "err Code:", error);
            });
        return initData;
    }

    public async postCommand(
        postUrl: string,
        data: Object
    ) {
        let initData: any;
        await axios.post(postUrl, data).
            then(response => {
                initData = response.data;
            }).
            catch(error => {
                // console.error("get All situation FAILED! using Url: ", initUrl, "err Code:", error);
            });
        return initData;
    }

    @watch("data")
    public commandChange() {

    }


    //机械臂（尝试直接修改旋转矩阵）
    @watch("tz")
    public changeHeight() {
      //this.tzshow = this.tz.toFixed(1);
      //this.updatePosition("111");
      //机械臂
      let position = Cartesian3.fromDegrees(this.tx,this.ty,this.tz);
      this.Box.position = new ConstantPositionProperty(position);
    }

    @watch("tx")
    public changeLongtitude() {
      //this.tzshow = this.tz.toFixed(1);
      //this.updatePosition("111");
      //机械臂
      let position = Cartesian3.fromDegrees(this.tx,this.ty,this.tz);
      this.Box.position = new ConstantPositionProperty(position);
    }
  
    @watch("ty")
    public changeLantitude() {
      //this.tzshow = this.tz.toFixed(1);
      //this.updatePosition("111");
      //机械臂
      let position = Cartesian3.fromDegrees(this.tx,this.ty,this.tz);
      this.Box.position = new ConstantPositionProperty(position);
    }

    @watch("alt")
    @watch("dlon")
    @watch("dlat")
    public updateBox(){
        
      if(this.readyDraw){
        console.log(this.alt);
        let position = Cartesian3.fromDegrees(this.dlon,this.dlat,this.alt);
        if(this.controlinggeometry == "box"){
            this.Box.position = new ConstantPositionProperty(position);
        }else{
            this.cylinder.position = new ConstantPositionProperty(position);
        }
        
        
      }
      
      
    }

  

}