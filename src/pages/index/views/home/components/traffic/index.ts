import { component, View, config, watch } from "@egova/flagwind-web";
import PubSub from "pubsub-js";
import "./index.scss";
import axios from "axios";
import { Method } from "axios";
// import { read, utils } from ''
//import  {export_json_to_excel} from './Excel'
import CAR_timedata from '../../index'


@component({
    template: require("./index.html")
})

export default class ConfirmBox extends View {
    public type: string = "";
    public show: boolean = false;
    public date: any = "";
    public time: any="";
    public webSetting = {
        dataRefreshTime: 5000,
        backendUrl: "http://58.48.37.2:9997/get_parking_space_info/",
    };
    public Excel

    
    public mounted() {
        
        // const testData = {
        //     '日期': 'time',
        //     '手机号': 'mobile',
        //     '姓名': 'username'
        // }
        // const header = Object.keys(testData)
        // const data = res.rows.map(user => {
        //     const userArr = []
        //     for (const key in testData) {
        //         const newKey = testData[key]
        //         userArr.push(user[newKey])
        //     }
        //     return userArr
        // })
        // //把定义好的header和data放进export_json_to_excel的函数里作为参数
        // export_json_to_excel({
        //     header,
        //     data
        // })
        //提供一个简单的测试数据，测试时注意要把上面数据注释掉

        
        PubSub.subscribe("traffic", (msg, data) => { /* 订阅弹窗事件 */
            if (data === "close") {
                this.close(); /* 关闭弹窗 */
            } else if (data === "") {
                // var value,values=[]
                // var options = {
                //     // headers: {'content-type': 'application/json'},
                // }; 
                // this.postCommand("/api/get_park_space_info/", {
                //     "park_id": "10001"
                //     })
                // .then((res)=>{
                //     if(res.response_code==0){
                //         value=res.area_info[0].occupied_parking_space
                //         this.myadd(values,value)
                //         PubSub.publish("heatmap", values)
                //     }
                // })
                
                // const tHeader = ['日期', '时间','空余车位']
                // const filterVal = ['date','time','value']             
                // const data = this.formatJson(filterVal, this.CAR_timedata)
                // export_json_to_excel({
                //     header: tHeader,
                //     data: data,
                //     filename: '停车记录'
                // })
                // this.$message.success('导出数据成功！')
                
                
                // this.CAR_timedata.push({date:"2023-03-24",time:"19:00:00",value:3000})
                // localStorage.setItem("CAR_timedata",JSON.stringify(this.CAR_timedata))
                // this.CAR_timedata=JSON.parse(sessionStorage.getItem('username'))
                this.show = true; /* 显示 */
            } else if (data === "1") {
                this.close();
            }
        });
    }
    
    formatJson(filterVal, jsonData) {
        return jsonData.map(v => filterVal.map(j => {
          return v[j]
        }))
      }

    public destroyed() { //关闭组件时取消订阅事件
        PubSub.unsubscribe("traffic");
    }

    public close() {
        this.show = false;
    }
    public myadd(values:any,value:any){
        values.push(value)
        values.push(value)
        values.push(value)
        values.push(value)
    }
    public async postCommand(
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
    public search() {

        // 这里写搜索事件
        
        // let values=[]
        // let arr = CAR_timedata.filter((i) => {
        //     return (i.date==this.date)&&(this.time.substring(0,2)==i.time.substring(0,2));
        //   });
        //   //&&(i.time.substring(0,1)==this.time.substring(0,1))
        // // console.log(arr+"arr")
        // if(arr.length==0){
        //     this.myadd(values,0)
        // }else{
        //     this.myadd(values,arr[0].value)
        // }
        var data={date:this.date,time:this.time}
        // this.$moment(this.date).format('YYYY/MM/DD')
        PubSub.publish("heatmap", data)
        //PubSub.publish("trafficChart", "888") // 搜索完成后传输数据给图表，第二个参数是需要传输的数据
    }

}
