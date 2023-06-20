import { component, View, config, watch } from "@egova/flagwind-web";
import PubSub from "pubsub-js";
import "./index.scss";
import axios from "axios";
import { Method } from "axios";
// import { read, utils } from ''
//import  {export_json_to_excel} from './Excel'
import CAR_timedata from '../../index'
import Cartesian3 from "cesium/Source/Core/Cartesian3";


@component({
    template: require("./index.html")
})



export default class ConfirmBox extends View {
   
    public show: boolean = false;
    public alt: number = 0;
    public lat: number = 0;
    public lon: number = 0;
    public len: number = 30;
    public wid: number = 40;
    public hei: number = 50;

@watch("alt")
public changealtitude(){
    //console.log(this.alt);
    this.updateData(1);
}

@watch("lat")
public changeLantitude(){
    this.updateData(2);
}

@watch("lon")
public changeLontitude(){
    this.updateData(3);
}

@watch("len")
@watch("wid")
@watch("hei")
public changeLength(){
    this.updateData(4);
}
    
    public mounted() {
        
        
        PubSub.subscribe("geometry", (msg, data) => { /* 订阅弹窗事件 */
            if (data === "close") {
                this.close(); /* 关闭弹窗 */
            } else if (data === "") {
              
                this.show = true; /* 显示 */
            } else if (data === "1") {
                this.close();
            }
        });
    }
    
   

    public destroyed() { //关闭组件时取消订阅事件
        PubSub.unsubscribe("traffic");
    }

    public close() {
        this.show = false;
    }
   
    public updateData( type ){
        switch(type){
            case 1:
                //PubSub.subscribe("updateGeometry",{type: 1,data : this.alt});
                PubSub.publish("updateGeometry",{type: 1,data: this.alt});
                break;
            case 2:
                PubSub.publish("updateGeometry",{type: 2,data: this.lat});
                
                break;
            case 3:
                PubSub.publish("updateGeometry",{type: 3,data: this.lon});
                break;
            case 4 :
                PubSub.publish("updateGeometry",{type: 4,data : new Cartesian3(this.len,this.wid,this.hei)});
                break;
        }

    }

   
   
}
