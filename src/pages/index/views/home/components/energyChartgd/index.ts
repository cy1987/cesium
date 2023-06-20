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
   
    public gdData = [
        [145564.00 ,320577.46,0,0,0,0,0,0,0,0,0,0],
        [658635.00 ,	1390417	,0,0,0,0,0,2809280	,2162200	,323840,	922080	,2090240,]
    ]
    public mounted() {
        this.echartsInit();
        PubSub.subscribe("energyChartGd", (msg, data) => { /* 接收弹窗事件,data为传输的数据 */


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
    }

    public updateDataByMonth() {
        this.option.xAxis.data = this.monthData.slice(0,this.monthNum);
        for(let i = 0; i < this.gdData.length; i++) {
            this.option.series[i].data = this.gdData[i].slice(0,this.monthNum);
        }
        this.echartsInit();
    }

    public destroyed() { // 关闭组件时取消订阅事件
        PubSub.unsubscribe("energyChartGd");
    }

    public echartsInit = () => { // 初始化图表
        let myChart = echarts.init(this.$refs.traffic as any,'dark');

        myChart.setOption(this.option);
    };

    public close() {
        this.show = false;
    }

}
