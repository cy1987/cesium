import Vue, { DirectiveOptions } from "vue";
let view: any = null;
const keyOperate = (el: any, binding: any) => {
    let { value } = binding;
    let { me } = value || {};
    view = (e: any) => {
        if (me.showModal !== undefined) {
            if (!me.showModal) {
                return;
            }
        } else if (me.show !== undefined) {
            if (!me.show) {
                return;
            }
        } else {
            return;
        }
        if (e.keyCode === 37) {
            console.log("按下左键");
            me.onPrevious();
        } else if (e.keyCode === 39) {
            console.log("按下右键");
            me.onNext();
        }
        e.stopPropagation();
    };
    document.addEventListener("keyup", view, false);
};

const keyStroke: DirectiveOptions = {
    bind: (el: any, binding: any) => {
        keyOperate(el, binding);
    },
    // update: (el: any, binding: any) => {
    //     keyOperate(el, binding);
    // },
    unbind: (el: any, binding: any) => {
        document.removeEventListener("keyup", view, false);
    }
};

export const directives = () => {
    Vue.directive("keystroke", keyStroke);
};
