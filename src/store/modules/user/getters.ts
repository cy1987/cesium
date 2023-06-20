import * as models from "@/models";
import { GetterTree } from "vuex";
import State from "./state";

export function userInfo(state: State): any {
    return state.user;
}

export default <GetterTree<State, any>>{
    userInfo
};
