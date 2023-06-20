function handImageLoading(el: any, binding: any, vnode: any) {
    let { loadingImg, errorImg, image } = binding.value || {};
    el.src = loadingImg;
    // el.style.backgroundPosition = "center";
    // el.style.backgroundImage = `url("${loadingImg}")`;
    // el.style.backgroundRepeat = "no-repeat";
    // el.style.backgroundSize = "30px 30px";
    el.style.width = "30px";
    el.style.height = "30px";

    let imageElement = new Image();
    imageElement.src = image;
    imageElement.onerror = () => {
        // 图片加载错误时的替换图片
        console.error(`load image failed: ${image}`);
        imageElement.src = errorImg;
        // imageElement.src = require("../../assets/images/error.png");
    };
    imageElement.onload = () => {
        // 图片加载成功后把地址给原来的img
        el.src = imageElement.src;
        el.style = null;
    };
}

export default {
    image: handImageLoading
};
