import { component, View, watch } from "@egova/flagwind-web";
import Cesium, {
    Viewer,
    Entity,
    Cartesian3,
    Math as _Math,
    ConstantPositionProperty,
    Color,
    JulianDate,
    VelocityOrientationProperty,
    Cartographic,
    CallbackProperty,
    EllipsoidGeodesic,
    Ellipsoid,
    Cartesian2,
    sampleTerrainMostDetailed,
    ClockRange,
    TimeInterval,
    TimeIntervalCollection,
    SampledPositionProperty,
    PolylineGlowMaterialProperty,
    HorizontalOrigin,
    VerticalOrigin
} from "cesium";
import { webSetting } from "@/settings";
import { resolve } from "dns";
import { property } from "lodash";
import { CMap } from "./sdk/map";

/**
 * @param id vehicle's identifier
 * @param viewer map to add vehicle
 * @param stPos running start position
 * @param endPos running end position
 * @param stTime running start time
 * @param endTime running end time
 * @param timeOfResolution the time between two sampled positions
 * @param modelPath the car model neet to load
 */
interface IGroundVechicleOptions {
    id?: string;
    stPos?: Cartesian3;
    endPos?: Cartesian3;
    stTime?: JulianDate;
    endTime?: JulianDate;
    timeOfResolution?: number;
    modelPath?: string;
}

/**
 * 
 */
export class GroundVehicle {
    private _viewer?: Viewer;
    private _groundVehicles: Map<string, Entity> = new Map<string, Entity>();    // store the id and its vehices
    private _showFlags: Map<string, boolean> = new Map<string, boolean>();       // store id and showFlag
    private _showNameFlags: Map<string, boolean> = new Map<string, boolean>();   // store id and showNameFlag
    private _showPosFlags: Map<string, boolean> = new Map<string, boolean>();    // store id and showPosFlag
    private _isDestroyed: boolean = false;                                       // if layer is destoryed

    // attention, when add a vechicle without id, this variable will be used
    private _addCount: number = 0; // a global variable denote how many times the add func is called
    public isShows?: boolean = false;
    
    // do not modify this var name
    public id: string = `GroundVehicle-${new Date().getTime().toString()}`; // layer id

    public constructor(
        public cmap: CMap,
        public map: Viewer,
        public options: IGroundVechicleOptions = {}
    ) {
        if (!map) {
            alert("Map not initiated!");
            return ;
        }
        this._viewer = map;
    }

    public add(
        options: IGroundVechicleOptions = {}
    ) {
        // store default time
        let times = Array<JulianDate>();
        if (options.stTime === undefined || options.endTime === undefined) {
            times.push(JulianDate.fromIso8601("2018-07-19T15:18:00Z"));
            times.push(JulianDate.fromIso8601("2018-07-19T15:24:00Z"));
        }
        else {
            times.push(options.stTime);
            times.push(options.endTime);
        }
        let stTime = times[0];
        let endTime = times[1];

        this._viewer!.clock.startTime = stTime.clone();
        this._viewer!.clock.stopTime = endTime.clone();
        this._viewer!.clock.currentTime = stTime.clone();
        this._viewer!.clock.clockRange = ClockRange.LOOP_STOP; // Loop at the end
        this._viewer!.clock.multiplier = 30;
        // Set timeline to simulation bounds
        this._viewer!.timeline.zoomTo(stTime, endTime);

        let positions = Array<Cartesian3>();
        if (options.stPos === undefined || options.endPos === undefined) {
            positions.push(new Cartesian3(-2358138.847340281, -3744072.459541374, 4581158.5714175375));
            positions.push(new Cartesian3(-2357231.4925370603, -3745103.7886602185, 4580702.9757762635));
        } else {
            positions.push(options.stPos);
            positions.push(options.endPos);
        }
        let stPos = positions[0];
        let endPos = positions[1];

        // sampled postion's distance in meter
        // let distanceOfResolution = 2;
        // sampled postion's time resolution and model path
        let timeOfResolution = (options.timeOfResolution === undefined) ? 6 : options.timeOfResolution;
        let modelPath = (options.modelPath === undefined) ? `${webSetting.assetsUrl}/map/GroundVehicle.glb` : options.modelPath;

        // generate id
        this._addCount += 1;
        let vehicleID = (options.id === undefined) ? "vechile" + this._addCount : options.id;
        // console.log("vehicleID is ", vehicleID);

        // using sampled property to get sampled data
        let oriSamples = new SampledPositionProperty();
        oriSamples.addSamples(times, positions);
        // get sampled data, ervery "timeOfResolution" seconds passed, we take a sample
        let geodesic = new EllipsoidGeodesic(
            Cartographic.fromCartesian(stPos),
            Cartographic.fromCartesian(endPos)
        );
        let lenInMeters = Math.ceil(geodesic.surfaceDistance); // avoid overflow when take samples
        let samplesNum = Math.floor(
            JulianDate.secondsDifference(endTime, stTime) / timeOfResolution
        );
        // let secondsInterval = Math.floor(JulianDate.secondsDifference(endTime, stTime) / samplesNum);
        // console.log("len: ", lenInMeters, "samplesNum: ", samplesNum, "timeOfResolution: ", timeOfResolution);
        
        // get sampled data, ervery "timeOfResolution" passed, we take a sample
        let sampledPositions = Array<Cartographic>();
        let sampledTimes = Array<JulianDate>();
        for (let i = 0; i < samplesNum + 1; i++)
        {
            let sampleTime =
            JulianDate.addSeconds(
                stTime,
                i * timeOfResolution,
                new JulianDate()
            );
            let tmpPos = oriSamples.getValue(sampleTime);
            sampledPositions.push(Cartographic.fromCartesian(tmpPos));
            // console.log(sampleTime.toString(), " ->-> ", Cartographic.fromCartesian(tmpPos));
            sampledTimes.push(sampleTime);
        }

        // make sampledPositions clampToGround
        let addedPromise = sampleTerrainMostDetailed(
            this._viewer!.terrainProvider,
            sampledPositions
        ).then(() => {
            let carPositionProperty = new SampledPositionProperty();

            // add positions which are clamped to ground to the carPositionProperty
            for (let i = 0; i < samplesNum + 1; i++) {
                // 获取模型高度，如果比地形高度高则更新高度为模型高度
                try {
                    let height = this._viewer.scene.sampleHeight(sampledPositions[i]);
                    if(height !== undefined && height > sampledPositions[i].height) {
                        sampledPositions[i].height = height;
                    }
                }catch(e) {
                    console.log(e);
                }
                carPositionProperty.addSample(
                    sampledTimes[i],
                    Ellipsoid.WGS84.cartographicToCartesian(sampledPositions[i])
                );
                // console.log(sampledTimes[i], " ------->>> ", sampledPositions[i]);
            }

            // set the flags for current added vehicle
            this._showNameFlags.set(vehicleID, true);
            this._showPosFlags.set(vehicleID, true);
            // add the car model
            let vechicleEntity = this._viewer!.entities.add({
                // id: "Vehicle",
                id: vehicleID,
                // Set the entity availability to the same interval as the simulation time.
                availability: new TimeIntervalCollection([
                    new TimeInterval({
                        start: stTime,
                        stop: endTime
                    })
                ]),
                // Use our computed positions
                position: carPositionProperty,
                // Automatically compute orientation based on position movement.
                orientation: new VelocityOrientationProperty(carPositionProperty),
                // Load the Cesium plane model to represent the entity
                model: {
                    uri: modelPath,
                    minimumPixelSize: 64
                },
                // Show the path as a pink line sampled in 1 second increments.
                // this path can dynamical change according to the car position property
                path: {
                    resolution: 1,
                    material: new PolylineGlowMaterialProperty({
                        glowPower: 0.1,
                        color: Color.ORANGE
                    }),
                    width: 10,
                    leadTime: 0,
                    trailTime: 1000 // the path's length to show 
                },
                label: {
                    show: true,
                    showBackground: true,
                    font: "14px Courier New",
                    backgroundColor: new Color(0.9, 0.9, 0.9, 0.6),
                    fillColor: Color.GREEN,
                    horizontalOrigin: HorizontalOrigin.LEFT,
                    verticalOrigin: VerticalOrigin.BASELINE,
                    pixelOffset: new Cartesian2(5, 5),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // text: vehicleID + "\nlong: xx\nlat: xx"
                    // text: new CallbackProperty(this.updatedInfo, false)
                    text: new CallbackProperty((time, result) => {
                        let sampledIdx = Math.floor(JulianDate.secondsDifference(<JulianDate>time, stTime) / timeOfResolution);
                        let pos = sampledPositions[sampledIdx];
                        // result = sampledIdx.toString();
                        result = "";
                        if(this._showNameFlags.get(vehicleID)) {
                            result = result +
                                "\nid    : " + vehicleID;
                        }
                        if(this._showPosFlags.get(vehicleID)) {
                            result = result +
                                "\nlong  : " + pos.latitude +
                                "\nlat   : " + pos.longitude +
                                "\nheight: " + pos.height;
                        }
                        return result;
                    }, false)
                }
            });

            this._groundVehicles.set(vehicleID, vechicleEntity);
            this._showFlags.set(vehicleID, true);

            // console.log("end adding vehicle with id: ", vehicleID, " is added!", this._showFlags.keys());
        });
        return addedPromise;
    }

    /**
     * tracking the entity by the id
     * @param id the corresponding vehicle need to be tracked
     */
    public setTrackingEntity(id?: string | null) {
        switch (typeof(id)) {
            case "undefined": {
                this._viewer!.trackedEntity = undefined;
                break;
            }
            case "object": {     // id is null, tracking nothing 
                this._viewer!.trackedEntity = undefined;
                break;
            }
            default: {
                let showEntity = this._groundVehicles.get(id);
                if(showEntity === undefined) {
                    // console.log("trying to showname for an unexisted entity, add it first!");
                    return ;
                }
                this._viewer!.trackedEntity = showEntity;
                // set the entity to be tracked
                showEntity.viewFrom = new ConstantPositionProperty(new Cartesian3(-2080,-1715,2000));
                // console.log("Tracking id: ", id);
                break;
            }
        }
    }

    /**
     * whether to show the name of the vehicle with the "id"
     * @param id the vehicle id
     * @param ctrFlag to control the vehicle's info label to show the name
     */
    public setShowName(id: string, ctrFlag: boolean) {
        let showEntity = this._groundVehicles.get(id);
        if(showEntity === undefined) {
            // console.log("trying to showname for an unexisted entity, add it first!");
            return ;
        }
        this._showNameFlags.set(id, ctrFlag);
    }
    
    /**
     * whether to show the pos of the vehicle with the "id"
     * @param id the vehicle id
     * @param ctrFlag to control the vehicle's info label to show the Position 
     */
    public setShowPos(id: string, ctrFlag: boolean) {
        let showEntity = this._groundVehicles.get(id);
        if(showEntity === undefined) {
            // console.log("trying to showname for an unexisted entity, add it first!");
            return ;
        }
        this._showPosFlags.set(id, ctrFlag);
    }

    /**
     * totally delete the vehicle corresponding to the named id,
     * if id is null or undefined, then all the vehicle should be deleted
     * @param id the car's id
     */
    public delete(id?: string | null) {
        // implement delete vehicle
        switch (typeof(id)) {
            case "undefined": {
                for(let tmpID of this._showFlags.keys()) {
                    this._viewer?.entities.removeById(tmpID);
                }
                this._groundVehicles.clear();
                this._showFlags.clear();
                this._showNameFlags.clear();
                this._showPosFlags.clear();
                // console.log("delete all vehicles success!");
                break;
            }
            case "object": {     // id is null, delete all
                for(let tmpID of this._showFlags.keys()) {
                    this._viewer?.entities.removeById(tmpID);
                }
                this._groundVehicles.clear();
                this._showFlags.clear();
                this._showNameFlags.clear();
                this._showPosFlags.clear();
                break;
            }
            default: {
                // delete the vehicle corresponding to the id
                this._viewer?.entities.removeById(id);
                this._groundVehicles.delete(id);
                this._showFlags.delete(id);
                this._showNameFlags.delete(id);
                this._showPosFlags.delete(id);
                break;
            }
        }
    }

    /**
     * when the vechicle is hided, call this func to show again
     * if id is null or undefined, then show all hided entities
     * @param id the car's id
     */
    public show(id?: string | null) {
        switch (typeof(id)) {
            case "undefined": {
                for(let tmpID of this._showFlags.keys()) {
                    if(!this._showFlags.get(tmpID)) {
                        this._viewer?.entities.add(
                            <Entity>this._groundVehicles.get(tmpID)
                        );
                        this._showFlags.set(tmpID, true);
                    }
                }
                break;
            }
            case "object": {     // id is null, show all
                for(let tmpID of this._showFlags.keys()) {
                    if(!this._showFlags.get(tmpID)) {
                        this._viewer?.entities.add(
                            <Entity>this._groundVehicles.get(tmpID)
                        );
                        this._showFlags.set(tmpID, true);
                    }
                }
                break;
            }
            default: {
                // show the vehicle corresponding to the id
                if(!this._showFlags.get(id)) {
                    let showEntity = this._groundVehicles.get(id);
                    if(showEntity === undefined) {
                        // console.log("trying to show unexisted entity, add it first!");
                        break;
                    }
                    this._viewer?.entities.add(<Entity>showEntity);
                    this._showFlags.set(id, true);
                }
                break;
            }
        }
    }

    /**
     * hide the vehicle, but not delete
     * if id is null or undefined, then hide all entities
     * @param id the car's id
     */
    public hide(id?: string | null) {
        switch (typeof(id)) {
            case "undefined": {
                // console.log("ddd: hide: undefined id!");
                for (let tmpID of this._showFlags.keys()) {
                    if (this._showFlags.get(tmpID)) {
                        this._viewer?.entities.removeById(tmpID);
                        this._showFlags.set(tmpID, false);
                    }
                }
                break;
            }
            case "object": {     // id is null, hide all
                // console.log("ddd: hide: null id!");
                for (let tmpID of this._showFlags.keys()) {
                    if (this._showFlags.get(tmpID)) {
                        this._viewer?.entities.removeById(tmpID);
                        this._showFlags.set(tmpID, false);
                    }
                }
                break;
            }
            default: {
                // hide the vehicle corresponding to the id
                let showEntity = this._groundVehicles.get(id);
                if(showEntity === undefined) {
                    // console.log("trying to show unexisted entity, add it first!");
                    break;
                }
                this._viewer?.entities.removeById(id);
                this._showFlags.set(id, false);
                break;
            }
        }
    }

    /**
     * return the vehicle's id
     */
    public getIDs() {
        let ids: Array<string> = [];
        for(let tmpID of this._showFlags.keys()) {
            ids.push(tmpID);
        }
        return ids;
    }

    /**
     * destroy all the ground vehicles
     */
    public destroy() {
        if (this._isDestroyed) return;
        this._isDestroyed = true;
        this.delete();
    }
}