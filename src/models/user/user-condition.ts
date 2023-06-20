import UserType from "./user-type";
import PhoneticName from "./phonetic-name";

export default interface UserCondition {
    id?: String;
    name?: String;
    phonetic?: String;
    username?: String;
    userType?: String;
    regionCode?: String;
    departmentId?: String;
    phoneticName?: PhoneticName;
}
