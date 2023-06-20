import { component, View, config, watch } from "@egova/flagwind-web";
import PubSub from "pubsub-js";
import "./index.scss";
import * as echarts from "echarts";
import { option } from "./option";
import Cofly from "../../index";

@component({
    template: require("./index.html")
})
export default class ConfirmBox extends View {
    public type: string = "";
    public show: boolean = false;
    public date: any = "";
    public option = option;
    public cofly: Cofly;
    public monthNum = 0;
    public monthData = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    public echartsInterval: any;
    public lineData = [
        [643058.83	,473494.44	,51866.58,	0,	0,	0,	0,	0,	0,	0,	34887.11	,572540.58],
        [497305.56	,453222.22,	143361.1	,0,	0,	0,	0,	0	,0	,0,	0	,616545.16],
        [430027.78	,539305.56	,14944.41,	0,	0	,0,	0	,0	,0,	0,	43166.65,	357880.88],
        [97341	,42389	,0	,0,	0	,0,	0,	0,	0,	0	,0	,477970.53],
        [824697.9	,130376,	0,	0,	0,	0	,0	,0,	0,	0	,625976.39	,948673.7],
        [35027.78 	,53694.44 ,	0	,0	,0,	0	,0,	0	,0,	0	,0	,12717.33],
        [0,0,0,0,0,0,0, 0,0,0,0,0],
        [168472.22 	,206361.11 ,	139870.1	,0,	0,	0,	0,	0	,0,	0	,51515.59	,533062.33],
        [454143.33 	,447175.56 ,	47500	,0	,0,	0,	0,	0	,0,	0	,13861.11	,257688.49],
    ]
    public mounted() {
        this.echartsInit();
        PubSub.subscribe("energyChartWarm", (msg, data) => { /* 接收弹窗事件,data为传输的数据 */
        if(data === '1'){
            console.log(data)
            this.show = true;
            this.monthNum = 0;
            if(this.echartsInterval) clearInterval(this.echartsInterval);
            this.updateDataByMonth();
            this.echartsInterval = setInterval(() => {
            
                if(this.monthNum < 12) this.monthNum++;
                this.updateDataByMonth();
            }, 1000);
            // this.option.series[0].data = data   // 接收到传输的数据后替换option里的数据
            this.echartsInit(); // 更新图表
        }
        else if(data === '2'){
            //隐藏组件
            this.show = false;
        }
        });

         //查询数据
         PubSub.subscribe("searchwarm",(msg,data) =>{
            
            PubSub.publish("searchres",this.query(data.from,data.date.substring(5,7)));
        })

    }

    public updateDataByMonth() {
        this.option.xAxis.data = this.monthData.slice(0,this.monthNum);
        for(let i = 0; i < this.lineData.length; i++) {
            this.option.series[i].data = this.lineData[i].slice(0,this.monthNum);
        }
        this.echartsInit();
    }

    public destroyed() { // 关闭组件时取消订阅事件
        PubSub.unsubscribe("energyChartWarm");
    }

    public echartsInit = () => { // 初始化图表
        let myChart = echarts.init(this.$refs.traffic as any,'dark');

        myChart.setOption(this.option);
    };

    public close() {
        this.show = false;
    }


    public query(type, month){
        let row = 0;
        let col = 0;
        switch(type){
            case "zjjd":
                row = 0;
                break;
            case "jrjd":
                row = 1;
                break;
            case "hyzx":
                row = 2;
                break;
            case "zg":
                row = 3;
                break;
            case "ht":
                row = 4;
                break;
            case "glly":
                row = 5;
                break;
            case "srtc":
                row = 6;
                break;
            case "wlsy":
                row = 7;
                break;
            case "hyzw":
                row = 8;
                break;
        }
        switch(month){
            case "01":
                col = 0;
                break;
            case "02":
                col = 1;
                break;
            case "03":
                col = 2;
                break;
            case "04":
                col = 3;
                break;
            case "05":
                col = 4;
                break;
            case "06":
                col = 5;
                break;
            case "07":
                col = 6;
                break;
            case "08":
                col = 7;
                break;
            case "09":
                col = 8;
                break;
            case "10":
                col = 9;
                break;
            case "11":
                col = 10;
                break;
            case "12":
                col = 11;
                break;
        }
        return this.lineData[row][col];
    }

}
