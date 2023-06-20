# emulate-infer-web

> 伪真推演验证平台

## 项目结构

```
┌── build                   # webpack脚本
├── config                  # config
├── src                     # main
│    ├── application 		# 程序启动载入处理逻辑
│    ├── assets     		# 可打包资源文件
│    │    ├── images      	# 图片资源
│    │    ├── styles      	# 样式资源
│    ├── common             # common
│    │    ├── mixins      	# vue多页面共用mixins
│    │    └── utils   		# 页面相关样式，页面内单独引用
│    ├── components 		# 项目中共用components
│    ├── models 		    # 项目中模型实体定义
│    ├── routes 		    # vue-router前端路由
│    ├── services 		    # 项目中共用服务定义
│    ├── store              # store
│    │    └── modules      	# 按模块使用
│    ├── types              # d文件定义
│    ├── views              # 业务模块视图定义
│    ├── settings      		# 全局设置
│    └── index.ts           # 入口
│
├── node_modules            # 依赖
├── public                  # 静态文件
│    ├── index.html 		# 程序启动载入处理逻辑
│    └── favicon.ico     	# 程序图标
├── dist                    # 打包之后的文件
├── .editorconfig	        # 通用编辑器配置
├── .gitignore		        # git忽略提交配置
├── .postcssrc.js           # postcss配置
└── package.json            # package info
```

## 注意事项

项目使用 stylelint 对样式进行检查，样式代码需要保持规范，建议开发过程中安装并开启 stylelint 插件：
stylelint 配置文件`.stylelintrc.json`中配置内容有：
`"selector-max-id": 2`, // 限定选择器中 id 选择器个数为 2， 建议只用一个 id 选择器
`"max-nesting-depth": 5` // 选择器嵌套深度不能超过 5 层， 建议最多不超过 3 层
`"selector-max-compound-selectors": 5`, // 复合选择器数量限制为 5
`order/properties-order: [...]` // 限定属性申明的顺序，大致顺序如下

-   1、定位：`position` `z-index` `left` `right` `top` `bottom` `clip`等。
-   2、自身属性：`width` `height` `min-height` `max-height` `min-width` `max-width`等。
-   3、文字样式：`color` `font-size` `letter-spacing`, `color` `text-align`等。
-   4、背景：`background-image` `border`等。
-   5、文本属性: `text-align` `vertical-align` `text-wrap` `text-transform` `text-indent` `text-decoration` `letter-spacing` `word-spacing` `white-space` `text-overflow`等。
-   6、css3 相关属性：`content`、`box-shadow`、`animation`、`border-radius`、`transform`等

_插件会按规则自动调整某些 css 代码。例如：插件会自动按设定的属性顺序代码中书写的顺序_

## 常用命令

-   `npm run dev` 进入调试模式，默认地址为 `http://localhost:8040`
-   `npm run lint` 使用 `tslint` 验证源码
-   `npm run dll` 预打包核心依赖库
-   `npm run build` 生产打包
-   `lint:css` 使用 `stylelint` 验证样式源码规范性
-   `lint:css-fix` 使用 `stylelint` 规范样式源码

# 使用

```
npm run build 打包
```
```
npm run serve 开发
```
