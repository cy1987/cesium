import { component, View, config, watch } from "@egova/flagwind-web";
import PubSub from "pubsub-js";
import "./index.scss";
import type { DatePickerProps } from 'antd';
import { DatePicker, Space } from 'antd';

@component({
    template: require("./index.html")
})
export default class ConfirmBox extends View {
    public searchres: string = "0";
    public show: boolean = false;
    public date: any = "";
    public gytype: any = "cold"
    public gydw: any = "zjjd"
    //能源供应类型

    //能源供应单位

    public options = [
        {label:"供冷",value:"cold",disabled:false},
        {label:"供热",value:"warm",disabled:false} ,
    ];

    public options1 = [
        {label:"展馆",value:"zg",disabled:false},
        {label:"洲际酒店",value:"zjjd",disabled:false},
        {label:"会议中心",value:"hyzx",disabled:false},
        {label:"薇拉摄影",value:"wlsy",disabled:false},
        {label:"汉阳政务",value:"hyzw",disabled:false},
        {label:"格乐丽雅",value:"glly",disabled:false},
        {label:"假日酒店",value:"jrjd",disabled:false},
        {label:"汉厅",value:"ht",disabled:false},
        {label:"水润天成",value:"srtc",disabled:false},
    ]

    public mounted() {

        
       
        PubSub.subscribe("energy", (msg, data) => { /* 订阅弹窗事件 */
            if (data === "close") {
                this.close(); /* 关闭弹窗 */
            } else if (data === "") {
                
                this.show = true; /* 显示 */
            } else if (data === "1") {
                this.close();
            }
        });

        PubSub.subscribe("searchres",(msg, data) => {
            this.searchres = data;
        })



    }

    public destroyed() { //关闭组件时取消订阅事件
        PubSub.unsubscribe("energy");
    }

    public close() {
        this.show = false;
    }

    public search() {
        // 这里写搜索事件
        //发送一个搜索事件
        //参数：月份，供应单位
       
        switch(this.gytype){
            case"warm": 
                    PubSub.publish("searchwarm",{date: this.date, from: this.gydw});
                    console.log(this.date,this.gydw)
                    break;
            case"cold": 
                    PubSub.publish("searchcold",{date: this.date, from: this.gydw});
                    break;
        }
        //接受一个搜索结果
        
       
        
    }

    handleChange(value,option){
                if(option === 'gylx'){
                    this.gytype = value;
                    
                }
                else if(option === 'gydw'){
                    this.gydw = value;
                 
                }
                
            
            
    }
   
}
