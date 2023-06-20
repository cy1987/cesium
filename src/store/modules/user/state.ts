import flagwind from "@egova/flagwind-core";
import Type = flagwind.Type;

export default class UserState {
    // 用户id
    public id: string = "";
    // 用户名
    public name: string = "";
    // 用户头像
    public photo: string = "";
    // 用户登录名
    public userName: string = "";
    // 权限列表
    public permissions: {
        menus: Array<string>;
        items: Array<string>;
    } = {
        menus: [],
        items: []
    };
    // 用户详情信息
    public detail: any = {};
    // // 用户关联person信息
    // public person: any = {};
    public user: any = {};
}
