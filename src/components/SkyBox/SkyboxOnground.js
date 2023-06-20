//以下代码复制自Cesium源码的SkyBox，然后做了一点点修改。
//SkyBoxOnGround.js

import BoxGeometry from "cesium/Source/Core/BoxGeometry.js";
import Cartesian3 from "cesium/Source/Core/Cartesian3.js";
import defaultValue from "cesium/Source/Core/defaultValue.js";
import defined from "cesium/Source/Core/defined.js";
import destroyObject from "cesium/Source/Core/destroyObject.js";
import DeveloperError from "cesium/Source/Core/DeveloperError.js";
import GeometryPipeline from "cesium/Source/Core/GeometryPipeline.js";
import Matrix4 from "cesium/Source/Core/Matrix4.js";
import VertexFormat from "cesium/Source/Core/VertexFormat.js";
import BufferUsage from "cesium/Source/Renderer/BufferUsage.js";
import CubeMap from "cesium/Source/Renderer/CubeMap.js";
import DrawCommand from "cesium/Source/Renderer/DrawCommand.js";
import loadCubeMap from "cesium/Source/Renderer/loadCubeMap.js";
import RenderState from "cesium/Source/Renderer/RenderState.js";
import ShaderProgram from "cesium/Source/Renderer/ShaderProgram.js";
import ShaderSource from "cesium/Source/Renderer/ShaderSource.js";
import VertexArray from "cesium/Source/Renderer/VertexArray.js";
import SkyBoxFS from "cesium/Source/Shaders/SkyBoxFS.js";
import SkyBoxVS from "./SkyBoxVS.js";
import BlendingState from "cesium/Source/Scene/BlendingState.js";
import SceneMode from "cesium/Source/Scene/SceneMode.js";
import Transforms from "cesium/Source/Core/Transforms";
import Matrix3 from "cesium/Source/Core/Matrix3";


function SkyBoxOnGround(options) {
      /**
       * 近景天空盒
       * @type Object
       * @default undefined
       */
      this.sources = options.sources;
      this._sources = undefined;
  
      /**
       * Determines if the sky box will be shown.
       *
       * @type {Boolean}
       * @default true
       */
      this.show = defaultValue(options.show, true);
  
      this._command = new DrawCommand({
        modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
        owner: this
      });
      this._cubeMap = undefined;
  
      this._attributeLocations = undefined;
      this._useHdr = undefined;
    }
  
    const skyboxMatrix3 = new Matrix3();
    SkyBoxOnGround.prototype.update = function(frameState, useHdr) {
      const that = this;
  
      if (!this.show) {
        return undefined;
      }
  
      if (
        frameState.mode !== SceneMode.SCENE3D &&
        frameState.mode !== SceneMode.MORPHING
      ) {
        return undefined;
      }
  
      if (!frameState.passes.render) {
        return undefined;
      }
  
      const context = frameState.context;
  
      if (this._sources !== this.sources) {
        this._sources = this.sources;
        const sources = this.sources;
  
        if (
          !defined(sources.positiveX) ||
          !defined(sources.negativeX) ||
          !defined(sources.positiveY) ||
          !defined(sources.negativeY) ||
          !defined(sources.positiveZ) ||
          !defined(sources.negativeZ)
        ) {
          throw new DeveloperError(
            "this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties."
          );
        }
  
        if (
          typeof sources.positiveX !== typeof sources.negativeX ||
          typeof sources.positiveX !== typeof sources.positiveY ||
          typeof sources.positiveX !== typeof sources.negativeY ||
          typeof sources.positiveX !== typeof sources.positiveZ ||
          typeof sources.positiveX !== typeof sources.negativeZ
        ) {
          throw new DeveloperError(
            "this.sources properties must all be the same type."
          );
        }
  
        if (typeof sources.positiveX === "string") {
          // Given urls for cube-map images.  Load them.
          loadCubeMap(context, this._sources).then(function(cubeMap) {
            that._cubeMap = that._cubeMap && that._cubeMap.destroy();
            that._cubeMap = cubeMap;
          });
        } else {
          this._cubeMap = this._cubeMap && this._cubeMap.destroy();
          this._cubeMap = new CubeMap({
            context: context,
            source: sources
          });
        }
      }
  
      const command = this._command;
  
      command.modelMatrix = Transforms.eastNorthUpToFixedFrame(
        frameState.camera._positionWC
      );
      if (!defined(command.vertexArray)) {
        command.uniformMap = {
          u_cubeMap: function() {
            return that._cubeMap;
          },
          u_rotateMatrix: function() {
            return Matrix4.getMatrix3(command.modelMatrix, skyboxMatrix3);
          }
        };
  
        const geometry = BoxGeometry.createGeometry(
          BoxGeometry.fromDimensions({
            dimensions: new Cartesian3(2.0, 2.0, 2.0),
            vertexFormat: VertexFormat.POSITION_ONLY
          })
        );
        const attributeLocations = (this._attributeLocations = GeometryPipeline.createAttributeLocations(
          geometry
        ));
  
        command.vertexArray = VertexArray.fromGeometry({
          context: context,
          geometry: geometry,
          attributeLocations: attributeLocations,
          bufferUsage: BufferUsage._DRAW
        });
  
        command.renderState = RenderState.fromCache({
          blending: BlendingState.ALPHA_BLEND
        });
      }
  
      if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
        const fs = new ShaderSource({
          defines: [useHdr ? "HDR" : ""],
          sources: [SkyBoxFS]
        });
        command.shaderProgram = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: SkyBoxVS,
          fragmentShaderSource: fs,
          attributeLocations: this._attributeLocations
        });
        this._useHdr = useHdr;
      }
  
      if (!defined(this._cubeMap)) {
        return undefined;
      }
  
      return command;
    };
    SkyBoxOnGround.prototype.isDestroyed = function() {
      return false;
    };
    SkyBoxOnGround.prototype.destroy = function() {
      const command = this._command;
      command.vertexArray = command.vertexArray && command.vertexArray.destroy();
      command.shaderProgram =
        command.shaderProgram && command.shaderProgram.destroy();
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      return destroyObject(this);
    };
  export default SkyBoxOnGround;