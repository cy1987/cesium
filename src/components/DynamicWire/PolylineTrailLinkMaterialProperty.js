// import * as Cesium from 'cesium';

const img = require("@/assets/images/dynamicWire/dynamicWire2.png");
function PolylineTrailLinkMaterialProperty(color, duration,d) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    this.color = color;
    this.duration = duration || 3000;
    this._time = (new Date()).getTime();
    this._d=d;
    this.isTranslucent = function () {
        return true;
    }
}
Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
     isConstant: {
        get: function () {
             return false;
        }
    },
    definitionChanged: {
        get: function () {
            return this._definitionChanged;
        }
    },
    color: Cesium.createPropertyDescriptor('color')
});
PolylineTrailLinkMaterialProperty.prototype.getType = function (time) {
    return 'PolylineTrailLink';
}
PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
    if (!Cesium.defined(result)) {
        result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
    result.image = Cesium.Material.PolylineTrailLinkImage;
    result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration*this._d;
    return result;
}
PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
    return this === other ||
        (other instanceof PolylineTrailLinkMaterialProperty &&
            Property.equals(this._color, other._color))
}
// Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
Cesium.Material.PolylineTrailLinkType = 'PolylineTrailLink';
Cesium.Material.PolylineTrailLinkImage = img;
Cesium.Material.PolylineTrailLinkSource = " czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                                                        {\n\
                                                            czm_material material = czm_getDefaultMaterial(materialInput);\n\
                                                            vec2 st = materialInput.st;\n\
                                                            vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
                                                            material.alpha = colorImage.a * color.a;\n\
                                                            material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                                                            return material;\n\
                                                        }";
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailLinkType, {
   fabric: {
        type: Cesium.Material.PolylineTrailLinkType,
        uniforms: {
            color: new Cesium.Color(0.0, 0.0, 1.0, 0.5),
            image: Cesium.Material.PolylineTrailLinkImage,
            time: -20
        },
        source: Cesium.Material.PolylineTrailLinkSource
    },
    translucent: function (material) {
        return true;
    }
});

export default PolylineTrailLinkMaterialProperty;