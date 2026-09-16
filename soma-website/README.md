# SOMA 网站代码交付

当前版本：2026-09-15，包含标题展开、粒子球渐显、三维扰动、自然自转与拖拽交互

## 文件
- index.html：页面内容与结构
- assets/style.css：字体、布局、响应式及开场文字动画
- assets/field.js：Canvas 粒子球、动画、鼠标和触控交互
- assets/Spartan-400.ttf / Spartan-600.ttf：现有字体文件
- assets/soma-logo.png：品牌 Logo

## 本地运行
解压后进入本目录，运行：

    python3 -m http.server 8000

打开 http://localhost:8000
建议通过 HTTP 服务运行，不要直接双击 HTML，因为页面使用 JavaScript module

## 部署
这是纯静态网站，不需要 npm 安装、构建步骤、数据库或 API 密钥
把 index.html 和 assets 文件夹一起上传到任意静态网站托管服务，发布目录设置为此目录
保持 assets 的相对路径即可；域名由负责部署的同事绑定
未打包原托管平台的项目配置、Git 历史或任何凭据

## 交互
刷新播放一次开场；鼠标靠近扰动球面，按住拖动旋转
右下角按钮暂停／继续；系统开启减少动态效果时默认静止
移动端标题改为上下排列

## 交接
将此 ZIP 发给前端开发或负责官网部署的工程师即可
字体和 Logo 沿用项目现有文件，交付包不额外授予素材授权
