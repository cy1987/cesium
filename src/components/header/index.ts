import { component, View, watch } from "@egova/flagwind-web";
import { webSetting } from "@/settings";
import dayjs from "dayjs";
import PubSub from "pubsub-js";
import "./index.scss";
import { transformWithProjections } from "ol/proj";
@component({
    template: require("./index.html")
})
export default class Header extends View {
    public title: string = `${webSetting.title}`;
    public yearTimeData: number | string = "2020年1月1日";
    public TimeData: number | string = "14:00:00";
    public playbackYearTimeData: number | string = "2020年1月1日";
    public playbackTimeData: number | string = "14:00:00";
    public command: string = "";
    public drawTool: boolean = false;
    public disabledStatus : boolean = false;
    public signOutStatus = false;
    public signOutStatus2: any = false;
    public signOutConfirmStatus = false;
    public page = this.$route.path.split("/")[1];
    public playbackStatus: boolean = false;
    public playbackTime: Date;
    public playbackShowTime: Date;
    public startTime: any;

    public mounted() {
        this.time();
        console.log(this.$route.path.split("/")[1])
        setInterval(this.time,100);
        this.clickToCloseAndPullDown();
        PubSub.subscribe("draw", (msg,data) => {
            this.drawTool = !this.drawTool;
            if(!this.drawTool) setTimeout(() => this.drawTool = true, 100);
        })
        PubSub.subscribe("closeDrawTool", (msg,data) => {
            this.drawTool = false;
        })
        PubSub.subscribe("play", (msg,data) => {
            let numArr = data.match(/\d+/g);
            this.playbackTime = new Date(Number(numArr[0]), Number(numArr[1]) - 1, Number(numArr[2]), Number(numArr[3]), Number(numArr[4]), Number(numArr[5]));
            this.playbackShowTime = new Date(Number(numArr[0]), Number(numArr[1]) - 1, Number(numArr[2]), Number(numArr[3]), Number(numArr[4]), Number(numArr[5]));
            this.startTime = new Date();
            this.playbackStatus = true;
        })
        PubSub.subscribe("closePlay", (msg,data) => {
            this.playbackStatus = false;
        })
        PubSub.subscribe("switchStatus",(msg,data) => {
            if(data === 1) {
                this.disabledStatus = true;
            }else {
                this.disabledStatus = false;
            }
        })
    }

    public destroyed() {
        PubSub.unsubscribe("draw");
        PubSub.unsubscribe("play");
        PubSub.unsubscribe("closePlay");
        PubSub.unsubscribe("closeDrawTool");
        PubSub.unsubscribe("switchStatus");
        document.removeEventListener("click", this.eventListener);
    }

    public time() {
        var myDate: any = new Date();
        let time = myDate.getTime();
        this.yearTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(0,11);
        this.TimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(12,20);
        if(this.playbackStatus) {
            let d = myDate - this.startTime;
            this.playbackShowTime.setSeconds(this.playbackTime.getSeconds() + d % 60000 / 1000);
            this.playbackShowTime.setMinutes(this.playbackTime.getMinutes() + d % 3600000 / 60000);
            this.playbackShowTime.setHours(this.playbackTime.getHours() + d / 3600000);
            time = this.playbackShowTime.getTime();
            console.log(time)
            console.log(this.playbackTime)
            console.log(d)
            this.playbackYearTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(0,11);
            this.playbackTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(12,20);
        }
        else {
            this.playbackYearTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(0,11);
            this.playbackTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(12,20);
        }
    }

    public computeTime() {

    }
    
    public confirm() {
        this.$router.push({name: "login"});
    }

    public toPlan() {
        this.$router.push({name: "plan"});
    }

    public toDesign() {
        this.$router.push({name: "design"});
    }

    public toControl() {
        this.$router.push({name: "control"});
    }

    public activate(shape: string, type: string) {
        this.command = "active " + shape + " " + type;
        
        setTimeout(() => this.command = "", 100);
        this.drawTool = false;
    }

    public mesure(type: string) {
        this.command = "mesure " + type;
        setTimeout(() => this.command = "", 100);
    }

    public clearCommand() {
        this.command = "";
    }

    // 返回首页
    public toHome() {
        this.$router.push({name: "plan"});
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
            signOutBox.style.height = "0.66rem";
            const signOutText = document.getElementById("signOutText");
            signOutText.style.height = "0.2rem";
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
        document.addEventListener("click", this.eventListener);
    }

    public eventListener(e) {
        // 记得在.select-box那边加上ref="selectBox"
        const selectBox = this.$refs.selectBox;
        // console.log(selectBox)
        // 重点来了：selectBox里是否包含点击的元素，不包含点击的元素就隐藏面板
        if (!(<any>selectBox).contains(e.target)) {
            this.userClosureNodeOperation();
        }
    }
    public close() {
        this.signOutConfirmStatus = false;
    }

    @watch("command")
    public commandChange() {
        this.$emit("command", this.command);
    }
}
