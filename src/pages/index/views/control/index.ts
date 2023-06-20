import { component, autowired, View, watch } from "@egova/flagwind-web";
import "./index.scss";
import CommonList from "@/components/common-list";
import Service from "../service";
import PubSub from "pubsub-js";
import dayjs from "dayjs";
import { webSetting } from "@/settings";
import axios from "axios";
import { StompClient } from "common/map/sdk/stomClient";

import {Button} from 'antd';
import { Card } from "ant-design-vue";
import 'antd/dist/reset.css';


@component({
    template: require("./index.html")
})
export default class Control extends View {

    public speedDefault = '3';
    public loading: boolean = false;
    public show: boolean = false;
    public yearTimeData: number | string = "2020年1月1日";
    public TimeData: number | string = "14:00:00";
    public type = "imagine";
    public viewType: number = 2;
    public status: string = "end";
    public experimentId = localStorage.getItem("experimentId");
    public team: number = 0;
    public socketPath: string = `${webSetting.backendUrl}` + "/stomp-websocket";
    public schedule = "0%";
    public duration = localStorage.getItem("duration");
    public pageStatus: string = "default";
    public speed: number = 1;

    // change icon
    public iconPath: string = '<path class="menu-btn-icon" d="M10,2.47384892 C12.1068,2.47384892 13.9894259,3.30089849 15.3431755,4.73082367 L17.2998007,4.73082367 C15.7197007,2.47384892 13.0100251,0.967748131 10,0.967748131 C6.98997486,0.967748131 4.2802993,2.47384892 2.69802289,4.73082367 L4.65464805,4.73082367 C6.01057405,3.30089849 7.89320005,2.47384892 10,2.47384892 Z M18.7319023,7.74302526 L18.2052023,8.79642523 L18.1290267,9.02277564 L17.5261511,10.1523512 C17.4499755,12.5616772 16.3225763,14.6684772 14.5161259,15.9482276 L14.5161259,14.4421268 L15.9808742,11.5148066 C16.0004623,11.477807 15.9721685,11.4321016 15.930816,11.4321016 L14.5183024,11.4321016 L14.5183024,10.6790512 L16.3639288,10.6790512 C16.3856932,10.6790512 16.4052813,10.6659925 16.4161635,10.6464045 L17.486975,8.50260499 C17.5065631,8.46342896 17.4782693,8.41990003 17.4347403,8.41990003 L14.5161259,8.41990003 L14.5161259,7.74302526 L17.8678531,7.74302526 C17.8896176,7.74302526 17.9092056,7.72996658 17.9200878,7.71255501 L18.9908994,5.56875547 C19.0104874,5.52957944 18.9821936,5.48605051 18.9386647,5.48605051 L14.5161259,5.48605051 C14.5161259,5.48605051 12.936026,4.35647492 10,4.35647492 C7.06397403,4.35647492 5.48387407,5.48605051 5.48387407,5.48605051 L1.06133532,5.48605051 C1.01780639,5.48605051 0.99168904,5.53175588 1.00910061,5.56875547 L2.07991216,7.71255501 C2.08861794,7.73214302 2.1103824,7.74302526 2.13214687,7.74302526 L5.48387407,7.74302526 L5.48387407,8.49607565 L2.56525967,8.49607565 C2.52173074,8.49607565 2.49561339,8.54178102 2.51302496,8.57878061 L3.5838365,10.7225801 C3.59254229,10.7421682 3.61430675,10.7552268 3.63607121,10.7552268 L5.48169762,10.7552268 L5.48169762,11.5082772 L4.06918401,11.5082772 C4.02565509,11.5082772 3.99953773,11.5539826 4.0169493,11.5909822 L5.48169762,14.5183024 L5.48169762,16.0244032 C3.67524725,14.6684772 2.54567165,12.5616772 2.47167248,10.2285269 L1.7947977,8.87260085 L1.49444812,8.26972524 L1.26809771,7.74302526 C1.04392375,8.49607565 0.967748131,9.2469496 0.967748131,10 C0.967748131,14.9688268 5.0333497,19.0322519 10,19.0322519 C14.9688268,19.0322519 19.0322519,14.9666503 19.0322519,10 C19.0322519,9.2469496 18.9560763,8.49607565 18.7319023,7.74302526 Z M7.14450254,8.34590086 C7.14450254,8.34372442 7.14667899,8.34372442 7.14885543,8.34372442 L9.09677481,8.04337484 C9.09895126,8.04337484 9.09895126,8.04337484 9.09895126,8.04119839 L9.99782355,6.2434538 C9.99782355,6.24127735 10,6.24127735 10.0021764,6.24127735 C10.0043529,6.24127735 10.0043529,6.24127735 10.0065293,6.2434538 L10.9054016,8.04119839 C10.9054016,8.04337484 10.9075781,8.04337484 10.9075781,8.04337484 L12.8554975,8.34372442 C12.8598504,8.34372442 12.8598504,8.34807731 12.8576739,8.35025376 L11.4342781,9.77364959 C11.4342781,9.77364959 11.4321016,9.77582604 11.4342781,9.77800248 L11.7346276,11.7237454 C11.7346276,11.7280983 11.7324512,11.7302748 11.7280983,11.7280983 L10.0065293,10.7552268 L10.0021764,10.7552268 L8.20443186,11.6540991 L8.20007896,11.6540991 C8.19790252,11.6540991 8.19790252,11.6519227 8.19790252,11.6497462 L8.4982521,9.70182687 C8.4982521,9.69965042 8.4982521,9.69965042 8.49607565,9.69747397 L7.14885543,8.35025376 C7.14450254,8.35025376 7.14450254,8.34807731 7.14450254,8.34590086 Z M13.0100251,15.7958763 L10.2328797,17.3933879 C10.0870578,17.4760928 9.90858926,17.4760928 9.76494381,17.3933879 L6.98779841,15.7958763 L6.98779841,14.1396007 L9.79106116,15.7501709 C9.91947149,15.8241701 10.0783521,15.8241701 10.2067624,15.7501709 L13.0100251,14.1396007 L13.0100251,15.7958763 L13.0100251,15.7958763 Z" fill="#39d9ff" fill-rule="nonzero"></path>';
    public iconFlag: boolean = false;

    public title: string = `${webSetting.title}`;

    public command: string = "";
    public leftSselectTitle: string = "";
    public rightSselectTitle: string = "";
    public value11 = [50];
    public speedData: string = "1";
    public deductionStatus = false;
    public signOutStatus = false;
    public signOutStatus2: any = false;
    public signOutConfirmStatus = false;
    public runTime: string = "";
    public speedFlag: number = 2;
    public drawTool: boolean = false;
    public enterStatus: number = 0; 
    public disabledStatus : boolean = false;

    

    public mounted() {
        this.time();
        setInterval(this.time,100)
        this.init();
        // 任意点击关闭退出下拉
        this.clickToCloseAndPullDown();
        PubSub.subscribe("plan", (msg,data) => {
            this.enterStatus = data;
            this.pageStatus = "plan";
            this.rightSelectionBox("");
        })
        PubSub.subscribe("return", (msg,data) => {
            this.pageStatus = "default";
        })
        PubSub.subscribe("order", (msg,data) => {
            if(data === "") {
                this.status = "end";
                this.deductionStatus = false; 
            }
        })
        PubSub.subscribe("draw", (msg,data) => {
            this.drawTool = true;
        })
        PubSub.subscribe("closeDrawTool", (msg,data) => {
            this.drawTool = false;
        })

        PubSub.subscribe("leftClose",(msg,data) => {
            if(data === 0) {
                this.leftSselectTitle = "";
            }
        })
        PubSub.subscribe("rightClose",(msg,data) => {
            if(data === 0) {
                this.rightSselectTitle = "";
            }
        })
        PubSub.subscribe("switchStatus",(msg,data) => {
            if(data === 1) {
                this.disabledStatus = true;
            }else {
                this.disabledStatus = false;
            }
        })
        localStorage.setItem("viewType",String(this.viewType));
    }

    public destroyed() {
        document.removeEventListener("click",this.eventListener);
        PubSub.unsubscribe("time");
        PubSub.unsubscribe("plan");
        PubSub.unsubscribe("return");
        PubSub.unsubscribe("draw");
        PubSub.unsubscribe("closeDrawTool");
        PubSub.unsubscribe("viewType");
    }

    public init() {
        PubSub.subscribe("time", (msg, data) => {
            let time = Number(data.split("@")[1]);
            let rate = Number(data.split("@")[2]);
            this.speed = rate;
            let h = Math.floor(time / 3600000);
            let m = Math.floor((time % 3600000) / 60000);
            let s = Math.floor((time % 60000 ) / 1000);
            this.runTime = this.s(h) + ":" + this.s(m) + ":" + this.s(s);
            
            let schedule = Math.floor(time / Number(this.duration) / 600);
            this.schedule = (schedule > 100 ? 100 : schedule) + "%";
        })


        // this.jtSearch.addEventListener("click",() => this.jtCard.style.visibility = 'visiable');
    }

    public s(num: number) {
        let str = String(num);
        if(str.length === 1) str = "0" + str;
        return str;
    }

    public time() {
        var myDate = new Date();
        let time = myDate.getTime();
        this.yearTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(0,11);
        this.TimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(12,20);
    }

    // 返回首页
    public toHome() {
        this.$router.push({name: "project"});
    }
    // 点击头像弹出选项框
    public signOut() {
        if(this.signOutStatus2 === false) {
            this.userOpenNodeOperation();
        }else {
            this.userClosureNodeOperation();
        }
        this.signOutStatus2 = !this.signOutStatus2;
    }
    // 展开头像下拉框节点操作
    public userOpenNodeOperation() {
        const signOutBox = document.getElementById("signOutBox");
            signOutBox.style.height = "66px";
            const signOutText = document.getElementById("signOutText");
            signOutText.style.height = "20px";
            setTimeout(() => {
                signOutText.innerText = "退出登录";
            }, 100);
    }
     // 关闭头像下拉框节点操作
    public userClosureNodeOperation() {
        const signOutBox = document.getElementById("signOutBox");
        signOutBox.style.height = "0px";
        const signOutText = document.getElementById("signOutText");
        signOutText.style.height = "0px";
        setTimeout(() => {
            signOutText.innerText = "";
        }, 100);
    }
    // 点击退出登录展示退出确认框
    public signOutConfirmBox() {
        this.userClosureNodeOperation();
        this.signOutConfirmStatus = true
    }
    // 点击用户组件外关闭下拉
    public clickToCloseAndPullDown() {
        document.addEventListener("click",this.eventListener);
    }
    public eventListener(e) {
        // 记得在.select-box那边加上ref="selectBox"
        const selectBox: any = this.$refs.selectBox;
        // 重点来了：selectBox里是否包含点击的元素，不包含点击的元素就隐藏面板
        if (!selectBox.contains(e.target)) {
            this.userClosureNodeOperation();
        }
    } 
    public returnBtn() {
        if(this.enterStatus === 0) {
            PubSub.publish("return",0);
        }else if(this.enterStatus === 1) {
            PubSub.publish("return",1);
        }
    }

    public close() {
        this.signOutConfirmStatus = false;
    }
    public confirm() {
        this.$router.push({name: "login"});
    }
    // 跳转想定页面
    public toImagine() {
        this.$router.push({name: "design"});
        localStorage.setItem("pageStatus","false");
    }

    // 跳转管控页面
    public toRegulation() {
        // this.$router.push({name: "control"});
    }

    // 右侧选择框
    public rightSelectionBox(name) {
        
        //分别考虑交通与能源

        if(name === 'traffic'){
           
              
                

                PubSub.publish("energyChartCold", "2") 
                PubSub.publish("energyChartWarm", "2")
                PubSub.publish("energyChartZq", "2")
                PubSub.publish("energyChartGd", "2")
                PubSub.publish("energyBox1", "2")
                PubSub.publish("energyBox2", "2")

                //打开traffic
                PubSub.publish("traffic","")

                //关掉energy
                PubSub.publish("energy","1")

                this.rightSselectTitle = name;
            
        }
        else if(name === 'energy'){
            

                PubSub.publish("energyChartCold", "1") 
                PubSub.publish("energyChartWarm", "1")
                PubSub.publish("energyChartZq", "1")
                PubSub.publish("energyChartGd", "1")
                PubSub.publish("energyBox1", "1")
                PubSub.publish("energyBox2", "1")
                //关掉traffic
                PubSub.publish("traffic","1")

                //打开energy
                PubSub.publish("energyshow","")
                

                this.rightSselectTitle = name;
            
        }

        // if(this.rightSselectTitle === name) {
            
        // }else {
            
        //     setTimeout(() => PubSub.publish(name,""), 1);
        //     this.rightSselectTitle = name;
          
           
        
           
        // }
    }

    public activate(shape: string, type: string) {
        this.command = "active " + shape + " " + type;
        this.drawTool = false;
    }

    public mesure(type: string) {
        this.command = "mesure " + type;
    }

    public edit() {
        this.command = "edit";
        setTimeout(() => this.command = "", 100);
    }

    public save() {
        this.command = "save";
        setTimeout(() => this.command = "", 100);
    }
    
    public start() {
        if(this.viewType === 2) {
            this.command = "start";
            this.status = "run";
            this.deductionStatus = true;
            setTimeout(() => this.command = "", 100);
        }
    }

    public attendBtn() {
        this.command = "attend";
        this.status = "run";
        this.deductionStatus = true;
        setTimeout(() => this.command = "", 100);
    }

    public stop() {
        if(this.viewType === 2) {
            this.command = "stop";
            this.status = "stop";
            // this.deductionStatus = false;
            setTimeout(() => this.command = "", 100);
        }
    }

    public end() {
        if(this.viewType === 2) {
            this.command = "end";
            this.status = "end";
            this.deductionStatus = false;
            setTimeout(() => this.command = "", 100);
        }
    }

    public accelerate() {
        if(this.viewType === 2 && this.speedFlag !== 9) {
            this.command = "accelerate";
            setTimeout(() => this.command = "", 100);
        }
    }

    public slow() {
        if(this.viewType === 2 && this.speedFlag !== 0) {
            this.command = "slow";
            setTimeout(() => this.command = "", 100);
        }
    }

    public changeView(type: number) {
        this.viewType = type;
        this.command = "changeView " + type;
        setTimeout(() => this.command = "", 100);
    }

    public clearCommand() {
        this.command = "";
    }

    public async getInit(
        initUrl: string
    ) {
        let initData: any;
        await axios.get(initUrl).
            then(response => {
                initData = response.data;
            }).
            catch(error => {
                // console.error("get All situation FAILED! using Url: ", initUrl, "err Code:", error);
            });
        return initData;
    }

    @watch("viewType")
    public viewTypeChange() {
        this.changeView(this.viewType);
        localStorage.setItem("viewType",String(this.viewType));
        PubSub.publish("viewType");
    }
}
