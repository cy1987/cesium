import { component, autowired, View } from "@egova/flagwind-web";
import "./index.scss";
import { CommonService } from "@/services";
import { SkinUtil } from "@/common/utils/skin-utils";
import dayjs from "dayjs";
import { logout } from "store/modules/user/mutations";
import "@/assets/styles/fonts/font.scss";
import { webSetting } from "@/settings";

@component({
    template: require("./index.html")
})
export default class Login extends View {
    @autowired(CommonService)
    private commonService!: CommonService;
    private title: string = webSetting.title;
    // public publicKey: string = "";
    public loading: boolean = false;
    public logging: boolean = false;
    public yearTimeData: number | string = "2020年1月1日";
    public TimeData: number | string = "14:00:00";
    public week: string = "";
    public companyName = webSetting.companyName
    public bg = {
        // backgroundImage: "url(" + require("@/assets/images/login/lvc.png") + ")"
        backgroundImage: "url(" + require("@/assets/images/login/" + webSetting.loginImg +".png") + ")"
    }
    public mounted() {
        // this.getPublicKey();
        // SkinUtil.initSkin();
        this.time();
        setInterval(this.time,100);
        this.getWeekByDay(this.week);
    }
    public formInline: any = {
        username: "",
        password: ""
    };
    public ruleInline = {
        username: [
            { required: true, message: "请输入用户名", trigger: "blur" }
        ],
        password: [
            { required: true, message: "请输入密码", trigger: "blur" },
            { type: "string",min: 6, message: "密码长度不能低于6位", trigger: "blur" }
        ]
    };
    // public async getPublicKey() {
    //     this.loading = true;
    //     let result = await this.commonService.getPublicKey();
    //     this.loading = false;
    //     if (!result) {
    //         this.$message.error("获取公钥失败");
    //         return;
    //     }
    //     this.publicKey = result.result;
    // }

    public validate() {
        if (!this.formInline.username) {
            this.$message.warning("请输入账号!");
            return false;
        }
        if (!this.formInline.password) {
            this.$message.warning("请输入密码!");
            return false;
        }
        return true;
    }

    public clearUser() {
        this.formInline.username = "";
        this.formInline.password = "";
    }

    public time() {
        var myDate = new Date();
        let time = myDate.getTime();
        // console.log(dayjs(time).format('YYYY年MM月DD日 HH:mm:ss'));
        this.week = (dayjs(time).format('YYYY-MM-DD'));
        this.yearTimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(0,11);
        this.TimeData = (dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')).slice(12,20);
    }
    //得到某一天是星期几
    public getWeekByDay(dayValue) { //dayValue=“2014-01-01”
        var day = new Date(Date.parse(dayValue.replace(/-/g, '/'))); //将日期值格式化
        var today = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"); //创建星期数组
        this.week = today[day.getDay()];
    }

    public handleSubmit(name: string | number) {
        this.logging = true;
        (<any>this.$refs[name]).validate((valid: any) => {
            if (valid) {
                this.loading = false;
                this.commonService.login(this.formInline.username,this.formInline.password)
                .then(res => {
                    localStorage.setItem("userName",res.user.username);
                    localStorage.setItem("user",res.access_token);
                    localStorage.setItem("userInfo",res);
                    // this.$store.commit("user/save",res);
                    this.$router.push({name : "control"});
                })
                .catch(error => {
                    if(error) {
                        // console.log(error);
                        
                        this.$message.error("账号或密码错误");
                        this.clearUser();
                    }else {
                        this.$message.error("调用服务异常");
                        this.clearUser();
                    }
                })
                .finally(() => {
                    this.logging = false;
                });
            } else {
                this.$Message.error("验证不通过");
                this.clearUser();
            }
        });
    }
}
