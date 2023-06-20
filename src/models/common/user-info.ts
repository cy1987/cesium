export default interface UserInfo {
    access_token: string;
    applicationPermissions: Array<{
        application: any;
        resourceMenus: Array<any>;
        resourceItems: Array<any>;
    }>;
    department?: any;
    expires_in?: number;
    loginTime?: string;
    refresh_token: string;
    roles: Array<any>;
    scope?: string;
    token_type?: string;
    user: any;
}
