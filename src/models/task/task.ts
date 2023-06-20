export default interface Task {
    id?: String;
    name?: String;
    groupName?: String;
    className?: String;
    description?: String;
    status?: String;
    cron?: String;
    disabled?: boolean;
    createTime?: String;
    modifyTime?: String;
}
