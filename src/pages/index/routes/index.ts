export const apps = [
    {
        name: "control",
        path: "/control",
        meta: {
            page: "control",
            icon: "md-git-branch",
            title: "运行管制"
        },
        redirect: "/control/default",
        component: () => import("@/pages/index/views/control"),
        children: [
            {
                name: "control_default",
                path: "/control/default",
                meta: {
                    icon: "md-git-branch",
                    title: "运行"
                },
                component: () => import("@/pages/index/views/home")
            },
        ]
    }
];

export const appRouter = {
    name: "main",
    path: "/",
    title: "main",
    meta: {
        page: "index"
    },
    component: () => import("@/components/layout/blank"),
    redirect: "/control",
    children: apps
};

// export const appRouter = {
//     name: "main",
//     path: "/",
//     title: "main",
//     meta: {
//         page: "index"
//     },
//     component: () => import("@/components/layout"),
//     redirect: "/default",
//     children: [
//         {
//             name: "default",
//             path: "default",
//             meta: {
//                 icon: "md-git-branch",
//                 title: "首页"
//             },
//             component: () => import("@/pages/index/views/home")
//         },
//         {
//             name: "design",
//             path: "design",
//             meta: {
//                 icon: "md-git-branch",
//                 title: "想定编辑"
//             },
//             component: () => import("@/pages/index/views/design")
//         },
//         {
//             name: "control",
//             path: "control",
//             meta: {
//                 icon: "md-git-branch",
//                 title: "运行管制"
//             },
//             component: () => import("@/pages/index/views/control")
//         }
//     ]
// };

export const routes = [
    appRouter,
    {
        name: "login",
        path: "/login",
        title: "登录",
        component: () => import("@/views/login")
    },
    {
        name: "401",
        path: "/401",
        component: () => import("@/views/errors/401")
    },
    {
        name: "404",
        path: "/*",
        component: () => import("@/views/errors/404")
    }
];
