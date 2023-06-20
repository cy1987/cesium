export default interface User {
    id?: String;
    password?: String;
    username?: String;
    departmentId?: String;
    name?: String;
    sex?: number;
    email?: String;
    phone?: String;
    photo?: String;
    creator?: String;
    modifier?: String;
    createTime?: Date;
    modifyTime?: Date;
    remark?: String;
    phonetic?: String;
    userType?: String;
    regionCode?: String;
    deviceType?: String;
    disabled?: number;
    imei?: String;
    imsi?: String;
}
