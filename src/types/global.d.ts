import Vue from "vue";

declare global {
    interface Window {
        __HIDE_HEADER?: boolean;
        __HIDE_SIDE_MENU?: boolean;
        $checkRoute(to: any): boolean;

    }
}

declare module '*.glsl';
declare module '*.json';
declare module '*.js';
