import Cesium, {
    Viewer,
    Cartesian3,
    PolygonGeometry,
    EllipsoidSurfaceAppearance,
    DistanceDisplayConditionGeometryInstanceAttribute,
    PolygonHierarchy,
    GroundPrimitive,
    GeometryInstance,
    Material,
    buildModuleUrl,
    Math as _Math,
    Ion
} from "cesium";
import { merge } from "lodash";

interface IWaterOptions {
    frequency?: number; // 海水波动频度
}

export class Water {

    public constructor(
        public viewer: Viewer,
        public region: any = [
          119.9,24.1,
          119.9,23.9,
          120.1,23.9,
          120.1,24.1
          ],
        public options: IWaterOptions = {frequency: 10000.0}) {
        this.setFrequency();
    }
     
    public setFrequency(options: IWaterOptions = {}) {
      // merge(this.options, options);
      // this.addwater();
    }

    public addwater(options: IWaterOptions = {}) {

        merge(this.options, options);

        let polygon = new PolygonGeometry({
            polygonHierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray(this.region)),
            vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            extrudedHeight: 8
          });
          
        let rivermaterial = new Material({
            fabric: {
                type: "Water",
                uniforms: {
                  normalMap: buildModuleUrl(
                    "Assets/Textures/waterNormals.jpg"
                  ),
                  frequency: this.options.frequency,
                  animationSpeed: 0.01,
                  amplitude: 10.0
                }
            }
          });
          
        let river = new GroundPrimitive({
            geometryInstances: new GeometryInstance({
            geometry: polygon,
            attributes : {
              distanceDisplayCondition : new DistanceDisplayConditionGeometryInstanceAttribute(0,80000)
            }
            }),
            appearance: new EllipsoidSurfaceAppearance({
            aboveGround: true,
            material: rivermaterial,
            fragmentShaderSource: "varying vec3 v_positionMC;\n" +
            "varying vec3 v_positionEC;\n" +
            "varying vec2 v_st;\n" +
            "void main()\n" +
            "{\n" +
            "czm_materialInput materialInput;\n" +
            "vec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));\n" +
            "#ifdef FACE_FORWARD\n" +
            "normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);\n" +
            "#endif\n" +
            "materialInput.s = v_st.s;\n" +
            "materialInput.st = v_st;\n" +
            "materialInput.str = vec3(v_st, 0.0);\n" +
            "materialInput.normalEC = normalEC;\n" +
            "materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);\n" +
            "vec3 positionToEyeEC = -v_positionEC;\n" +
            "materialInput.positionToEyeEC = positionToEyeEC;\n" +
            "czm_material material = czm_getMaterial(materialInput);\n" +
            "#ifdef FLAT\n" +
            "gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);\n" +
            "#else\n" +
            "gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);\n" +
            "gl_FragColor.a=0.85;\n" +
            "#endif\n" +
            "}\n"
          }),
            show: true
          });
        this.viewer?.scene.primitives.add(river);
      }
    }