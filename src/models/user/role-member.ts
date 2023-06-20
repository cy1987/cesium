export default interface RoleMember {
    //  id?: string;
    roleId?: String;
    memberId?: String;
    // 0 用户 1角色 2应用
    memberType?: string | number;
    creator?: String;
    createTime?: Date;
    remark?: String;
}
