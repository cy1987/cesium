import { CMap } from "@/common/map/sdk/map";
import Cesium, {
    Entity,
    ClockRange,
    Cartesian3,
    Math as _Math,
    Cartographic,
    PolygonHierarchy,
    Color,
    CallbackProperty,
    JulianDate,
    SampledPositionProperty,
    LagrangePolynomialApproximation
} from "cesium";

/**
 * @param id the UnneatRadar id
 * @param stTime the init time for unneatRadar to have value
 * @param edTime currently make no sense, edTime = stTime + (sampleNum -5) secs
 * @param levelHeights unneatRadar has different level, in circle shape, can also be discribed as horizontal level
 * @param levelRadius the levels's radius 
 * @param sampleNum how many seconds will the unneatRadar remain in the demo
 * @param oneLevelPointNum  how may points are in each level
 * @param centerPoint where to put the unneat radar
 * @param lineWidth lines's width who construct the range surface
 * @param lineColor i.g: Color.Red
 * @param scanColor?: scan polygon's color
 * @param scanLineWidth?: scan plygon outline's width;
 * @param scanLineColor?: scan plygon outline's color;
 */
interface IUnneatRadarOptions {
    id: string;
    stTime: JulianDate;
    edTime: JulianDate;
    levelHeights?: Array<number>;
    levelRadius?: Array<number>;
    sampleNum: number;
    oneLevelPointNum?: number;
    centerPoint?: Cartographic;
    lineWidth?: number;
    lineColor?: Color;
    scanColor?: Color;
    scanLineWidth?: number;
    scanLineColor?: Color;
}

export class UnneatRadar {

    public drawer: boolean = true;
    public entity!: Entity;
    public show: boolean = true;
    public unneatRadar: Map<string, Entity> = new Map<string, Entity>();    // store the id and its lines
    public levelIds: Array<string> = new Array<string>();
    public verticalIds: Array<string> = new Array<string>();
    public realTimeLevelPoints: Array<Array<SampledPositionProperty>> = new Array<Array<SampledPositionProperty>>();    // sotre the radar's realtime data from the backend
    public id: string = `UnneatRadar-${new Date().getTime().toString()}`; // layer id
    public levelNum: number;
    public oneLevelPointNum: number;
    public renderTime: JulianDate = JulianDate.now(); // the time we render the radar

    public constructor(
        public cmap: CMap,
        public options: IUnneatRadarOptions = {
            id: "",
            stTime: null,
            edTime: null,
            sampleNum: 30
        }
    ) {
        if (!cmap) {
            alert("Map not initiated!");
            return ;
        }
        // cmap.addLayer(this);
    }
    
    /**
     * generate the unneatRadar's all points, each point is samplePositionsProperty, ervery on second we
     * add a sample for each point, so, all the points life time shall be: [stTime, stTime + sampleNum(in sec)]
     * @param stTime the init time for unneatRadar to have value
     * @param levelHeights unneatRadar has different level, in circle shape, can also be discribed as horizontal level
     * @param levelRadius the levels's radius 
     * @param sampleNum how many seconds will the unneatRadar remain in the demo
     * @param oneLevelPointNum  how may points are in each level
     * @param centerPoint 
     * @param unneatPoints 
     */
    public generateLevels(
        stTime: JulianDate,
        levelHeights: Array<number>,
        levelRadius: Array<number>,
        sampleNum: number,
        oneLevelPointNum: number,
        centerPoint: Cartographic,
        unneatPoints: Array<Array<SampledPositionProperty>>
    ) {

        // initialize the unneatPoints
        for(let lIdx = 0; lIdx < levelHeights.length; ++lIdx) {
            let level = new Array<SampledPositionProperty>();
            for(let pIdx = 0; pIdx < oneLevelPointNum; ++pIdx) {
                level.push(new SampledPositionProperty());
            }
            unneatPoints.push(level);
        }
        // every sampleTime we have a unneatRadar‘s points records
        for(let sIdx = 0; sIdx < sampleNum; ++sIdx) {
            let sampleTime = JulianDate.addSeconds(stTime, sIdx, new JulianDate());
            for(let lIdx = 0; lIdx < levelHeights.length; ++lIdx) {
                // calculate one level's circle
                let positions = this.computeCirclularFlight(
                    centerPoint.longitude,
                    centerPoint.latitude,
                    levelRadius[lIdx],
                    levelHeights[lIdx],
                    stTime,
                    sampleTime
                );
                for(let pIdx = 0; pIdx < oneLevelPointNum; ++pIdx) {
                    unneatPoints[lIdx][pIdx].addSample(sampleTime, positions[pIdx]);
                }
            }
        }
    }

    /**
     * Generate a random circular pattern with varying heights.
     * @param lon center longitute
     * @param lat center latitude
     * @param radius circle radius
     * @param levelHeight circle height
     * @param stTime 
     * @param curTime upward two times mainly serve as a random sector for the result
     * @returns all points of the circle in Cartesian3
     */
    public computeCirclularFlight(lon, lat, radius, levelHeight, stTime, curTime): Array<Cartesian3> {
        // let a = JulianDate.secondsDifference(JulianDate.now(), stTime);
        let positions = Array<Cartesian3>();
        let llhPositions = Array<Cartographic>();

        // let property = new PositionProperty();
        // Generate a random circular pattern with letying heights.
        for (let i = 0; i <= 360; i += 45) {
            let radians = _Math.toRadians(i);
            let time = JulianDate.addSeconds(
                stTime,
                i,
                new JulianDate()
            );

            let tmpPoint = new Cartographic(
                lon + radius * 1.5 * Math.cos(radians),
                lat + radius * Math.sin(radians),
                _Math.nextRandomNumber() * 0.1 * levelHeight + levelHeight +
                    Math.random() * 20 * JulianDate.secondsDifference(curTime, stTime)
            );
            llhPositions.push(tmpPoint);
            positions.push(
                Cartesian3.fromDegrees(
                    tmpPoint.longitude,
                    tmpPoint.latitude,
                    tmpPoint.height
            ));
        }
        positions.push(positions[0]);
        return positions;
    }

    /**
     * using lagrange interpolation, it will interpolate and increase the original size up to 100 times compared with the original data
     * eg: when u have a data: [1, 2, 3, 4], your result will be like: [1, 1.01, ..., 2, 2.01, ...], size change to 400
     * @param positions positions who need interpolating
     * @param times default is 100, mean how many times u want to interpolate
     * @param iptPositions llhPositions's interpolation result is iptPositions, result will be stored here
     * @returns iptPositions
     */
    public interpolateUsingLagrange2(
        positions: Array<any>,
        iptPositions: Array<Cartesian3>,
        times?: number
    ) {
        times = (times) ? times : 100;
        if(positions.length === 0) {
            console.error("positions's length cannot be 0!");
        }
        if(typeof(positions[0].x) === undefined) {
            // from Array<Catographic> to Array<Cartesian3>
            // console.log("from Array<Catographic> to Array<Cartesian3>");
            let xTable = [];        // interpolate at xTable[i]
            for(let ix = 0; ix < positions.length; ++ix) {
                xTable.push(ix * times);
            }
            let yTable = [];        // used to interpolate, in {la1, lon1, h1, l2, lon2, h2}
            for(let iy = 0; iy < positions.length; ++iy) {
                yTable.push(positions[iy].longitude);
                yTable.push(positions[iy].latitude);
                yTable.push(positions[iy].height);
            }
            let yStride = 3;        // 3 dependent vaule in yTable is viewed as one item
            
            for (let ix = 0; ix < xTable[positions.length - 1]; ++ix) {
                let iptRes = [];
                LagrangePolynomialApproximation.interpolateOrderZero(
                    ix,
                    xTable,
                    yTable,
                    yStride,
                    iptRes
                );
                iptPositions.push(
                    Cartesian3.fromDegrees(
                    iptRes[0],
                    iptRes[1],
                    iptRes[2]
                ));
            }
            return  iptPositions;
        } else {
            // from Array<Cartesian3> to Array<Cartesian3>
            // console.log("from Array<Cartesian3> to Array<Cartesian3>");
            if(positions[0].x === undefined) {
                return;
            }
            let xTable = [];        // interpolate at xTable[i]
            for(let ix = 0; ix < positions.length; ++ix) {
                xTable.push(ix * times);
            }
            let yTable = [];        // used to interpolate, in {la1, lon1, h1, l2, lon2, h2}
            for(let iy = 0; iy < positions.length; ++iy) {
                yTable.push(positions[iy].x);
                yTable.push(positions[iy].y);
                yTable.push(positions[iy].z);
            }
            let yStride = 3;        // 3 dependent vaule in yTable is viewed as one item
            
            for (let ix = 0; ix < xTable[positions.length - 1]; ++ix) {
                let iptRes = [];
                LagrangePolynomialApproximation.interpolateOrderZero(
                    ix,
                    xTable,
                    yTable,
                    yStride,
                    iptRes
                );
    
                iptPositions.push(new Cartesian3(iptRes[0], iptRes[1], iptRes[2]));
            }
            return  iptPositions;
        }
    }

    /**
     * add the radar to the aimed position
     * @param levelPoints the points contained by unneat radar, unneatPoints is a vecotr of [k][360],
     *                     k means how many levels the unneat radar has
     */
    public addToPos(levelPoints: Array<Array<SampledPositionProperty>>) {
        let _this = this;
        // in taiwan
        let showPos = this.options.centerPoint;
        // heights and radius
        let idPrefix = this.options.id;
        let levelHeights = this.options.levelHeights;
        let levelRadius = this.options.levelRadius;
        let sampleNum = this.options.sampleNum;  // every one sec we take a sample to simulate the unneat radar
        let stTime = this.options.stTime;
        let edTime = JulianDate.addSeconds(stTime, sampleNum - 1, new JulianDate());
        let oneLevelPointNum = this.options.oneLevelPointNum;
        let lineColor = (this.options.lineColor) ? this.options.lineColor : Color.BLUE;
        let lineWidth = (this.options.lineWidth) ? this.options.lineWidth : 0.5;
        // Set timeline to simulation bounds, this demo's startTime should always be the time.now()
        this.cmap.viewer.clock.startTime = stTime.clone();
        this.cmap.viewer.clock.stopTime = edTime.clone();
        this.cmap.viewer.clock.currentTime = this.cmap.viewer.clock.startTime.clone();
        this.cmap.viewer.clock.multiplier = 1;
        this.cmap.viewer.clock.clockRange = ClockRange.LOOP_STOP; // Loop at the end
        this.cmap.viewer.timeline.zoomTo(this.cmap.viewer.clock.startTime, this.cmap.viewer.clock.stopTime);
        this.cmap.showClock();

        // get the levelPoints
        if(!levelPoints) {
            // using generated data to demo
            levelPoints = new Array<Array<SampledPositionProperty>>();
            this.generateLevels(
                stTime,
                levelHeights,
                levelRadius,
                sampleNum,
                oneLevelPointNum,
                showPos,
                levelPoints
            );
            // console.log("using generated data!");
        } else {
            oneLevelPointNum = levelPoints[0].length;
        }

        // add the horizontal levels
        for(let lIdx = 0; lIdx < levelPoints.length; ++lIdx) {
            // add every level of unneat radar as polyline
            let levelId = idPrefix + "hori" + lIdx.toString();
            let levelEntity = this.cmap.viewer.entities.add({
                id: levelId,
                polyline: {
                    positions: new CallbackProperty((time, result) => {
                        let levelPositions = new Array<Cartesian3>();
                        let iptLevelPositions = new Array<Cartesian3>();
                        for (let pIdx = 0; pIdx < oneLevelPointNum; ++pIdx) {
                            levelPositions.push(levelPoints[lIdx][pIdx].getValue(time));
                        }
                        return levelPositions;

                    }, false),
                    width: lineWidth,
                    material: lineColor
                }
            });
            this.levelIds.push(levelId);
            this.unneatRadar.set(levelId, levelEntity);
        }
        this.cmap.viewer.zoomTo(this.cmap.viewer.entities.getById(this.levelIds[0]));

        for(let vIdx = 0; vIdx < oneLevelPointNum - 1; ++vIdx) {
            // add vertical lines, each of lines is composited with points of same idx in different levels
            let vertId = idPrefix + "vert" + vIdx.toString();
            let vertEntity = this.cmap.viewer.entities.add({
                id: vertId,
                polyline: {
                    positions: new CallbackProperty((time, result) => {
                        
                        let vertPositions = new Array<Cartesian3>();
                        let iptVertPositions = new Array<Cartesian3>();
                        for (let lIdx = 0; lIdx < levelPoints.length; ++lIdx) {
                            vertPositions.push(Cartesian3.clone(levelPoints[lIdx][vIdx].getValue(time)));
                        }
                        return this.interpolateUsingLagrange2(vertPositions, iptVertPositions, 8);
                    }, false),
                    width: lineWidth,
                    material: lineColor
                }
            });
            this.verticalIds.push(vertId);
            this.unneatRadar.set(vertId, vertEntity);
        }
        // console.log("unneat radar ", this.options.id, " added!");
    }
    
    /**
     * 
     * update the radar's data
     * @param data the radar's data
     * @param time the time corresponding to this ctime
     * @param needInit whether the first time to call this func
     */
    public updateRadarData(data: Array<Array<Array<number>>>, time: JulianDate, needInit: boolean) {
        if(needInit) {
            // init the radar
            this.levelNum = data.length;
            this.oneLevelPointNum = data[0].length;
            // console.log(this.levelNum, " ", this.oneLevelPointNum)
            // initialize the unneatPoints
            for(let lIdx = 0; lIdx < this.levelNum; ++lIdx) {
                let level = new Array<SampledPositionProperty>();
                for(let pIdx = 0; pIdx < this.oneLevelPointNum; ++pIdx) {
                    level.push(new SampledPositionProperty());
                }
                this.realTimeLevelPoints.push(level);
            }

            // add points into unneatPoints
            for(let lIdx = 0; lIdx < this.levelNum; ++lIdx) {
                // lIdx th level's circle
                for(let pIdx = 0; pIdx < this.oneLevelPointNum; ++pIdx) {
                    this.realTimeLevelPoints[lIdx][pIdx].addSample(time,
                        Cartesian3.fromDegrees(
                            data[lIdx][pIdx][0],
                            data[lIdx][pIdx][1],
                            data[lIdx][pIdx][2]
                        )
                    );
                }
                // every level add the start point again
                this.realTimeLevelPoints[lIdx].push(this.realTimeLevelPoints[lIdx][0]);
            }
        } else {
            // add points into unneatPoints
            for(let lIdx = 0; lIdx < this.levelNum; ++lIdx) {
                // lIdx th level's circle
                for(let pIdx = 0; pIdx < this.oneLevelPointNum; ++pIdx) {
                    // console.log("lIdx, pIdx:[lnum, pnum] adding :", lIdx," ", pIdx," [", this.levelNum," ", this.oneLevelPointNum, " ]", data[lIdx][pIdx]);
                    this.realTimeLevelPoints[lIdx][pIdx].addSample(time,
                        Cartesian3.fromDegrees(
                            data[lIdx][pIdx][0],
                            data[lIdx][pIdx][1],
                            data[lIdx][pIdx][2]
                        )
                    );
                }

                // every level add the start point again
                this.realTimeLevelPoints[lIdx][this.oneLevelPointNum].addSample(time,
                    Cartesian3.fromDegrees(
                        data[lIdx][0][0],
                        data[lIdx][0][1],
                        data[lIdx][0][2]
                    )
                );
            }
        }
        this.renderTime = time;
    }

    /**
     * add the radar using data from the backend
     */
    public addToPosFrontBack() {
        let _this = this;
        // in taiwan
        let showPos = this.options.centerPoint;
        // heights and radius
        let idPrefix = this.options.id;
        let levelHeights = this.options.levelHeights;
        let levelRadius = this.options.levelRadius;
        let sampleNum = this.options.sampleNum;  // every one sec we take a sample to simulate the unneat radar
        let stTime = this.options.stTime;
        let edTime = JulianDate.addSeconds(stTime, sampleNum - 1, new JulianDate());
        let lineColor = (this.options.lineColor) ? this.options.lineColor : Color.BLUE;
        let lineWidth = (this.options.lineWidth) ? this.options.lineWidth : 1.5;

        // todo: add this to options
        lineWidth = 0.5;
        lineColor = Color.fromAlpha(Color.YELLOW, 0.35);

        // add the horizontal levels
        for(let lIdx = 0; lIdx < this.levelNum; ++lIdx) {
            // add every level of unneat radar as polyline
            let levelId = idPrefix + "hori" + lIdx.toString();
            let levelEntity = this.cmap.viewer.entities.add({
                id: levelId,
                polyline: {
                    positions:
                    new CallbackProperty((time, result) => {
                        let levelPositions = new Array<Cartesian3>();
                        let iptLevelPositions = new Array<Cartesian3>();
                        for (let pIdx = 0; pIdx < this.oneLevelPointNum; ++pIdx) {
                            // levelPositions.push(Cartesian3.clone(this.realTimeLevelPoints[lIdx][pIdx].getValue(time)));
                            levelPositions.push(Cartesian3.clone(this.realTimeLevelPoints[lIdx][pIdx].getValue(this.renderTime)));
                        }
                        // add the first point in the level
                        levelPositions.push(Cartesian3.clone(
                            this.realTimeLevelPoints[lIdx][0].getValue(this.renderTime)
                        ));
                        return levelPositions;

                    }, false),
                    width: lineWidth,
                    material: lineColor,
                    show: new CallbackProperty(function () { return _this.show; }, false)
                }
            });
            this.levelIds.push(levelId);
            this.unneatRadar.set(levelId, levelEntity);
        }

        // add the vertical lines
        for(let vIdx = 0; vIdx < this.oneLevelPointNum; ++vIdx) {
            // add vertical lines, each of lines is composited with points of same idx in different levels
            let vertId = idPrefix + "vert" + vIdx.toString();
            let vertEntity = this.cmap.viewer.entities.add({
                id: vertId,
                polyline: {
                    positions: new CallbackProperty((time, result) => {
                        
                        let vertPositions = new Array<Cartesian3>();
                        let iptVertPositions = new Array<Cartesian3>();
                        for (let lIdx = 0; lIdx < this.levelNum; ++lIdx) {
                            // vertPositions.push(Cartesian3.clone(this.realTimeLevelPoints[lIdx][vIdx].getValue(time)));
                            vertPositions.push(Cartesian3.clone(this.realTimeLevelPoints[lIdx][vIdx].getValue(this.renderTime)));
                        }
                        
                        return vertPositions;
                    }, false),
                    width: lineWidth,
                    material: lineColor,
                    show: new CallbackProperty(function () { return _this.show; }, false)
                }
            });
            this.verticalIds.push(vertId);
            this.unneatRadar.set(vertId, vertEntity);
        }
        // console.log("unneat radar ", this.options.id, " added!");
    }
    
    /**
     * add the scan polygon to the unneat radar
     * @param scanPoints sanner points
     */
    public addPolygon(scanPoints: Array<SampledPositionProperty>) {
        // add polygon as the scanner
        let scanColor = this.options.scanColor ? this.options.scanColor : Color.BLUE.withAlpha(0.5);
        let scanPolygonId = this.options.id + "scanner";
        let scanner = this.cmap.viewer.entities.add({
            id: scanPolygonId,
            polygon: {
                hierarchy: new CallbackProperty((time, result) => {
                    let edgePoints = new Array<Cartesian3>();
                    let iptEdgePoints = new Array<Cartesian3>();
                    for (let pIdx = 0; pIdx < scanPoints.length; ++pIdx) {
                        edgePoints.push(
                            scanPoints[pIdx].getValue(time)
                        );
                    }
                    // return new PolygonHierarchy(edgePoints);
                    return new PolygonHierarchy(this.interpolateUsingLagrange2(edgePoints, iptEdgePoints, 8));
                }, false),
                perPositionHeight: true,
                material: scanColor
            }
        });
        this.unneatRadar.set(scanPolygonId, scanner);
        
        let scanLineColor = (this.options.scanLineColor) ? this.options.scanLineColor : Color.RED;
        let scanLineWidth = (this.options.scanLineWidth) ? this.options.scanLineWidth : 0.5;
        let scanLineId = this.options.id + "scanLine";
        let scanLineEntity = this.cmap.viewer.entities.add({
            id: scanLineId,
            polyline: {
                positions: new CallbackProperty((time, result) => {
                    let edgePoints = new Array<Cartesian3>();
                    let iptEdgePoints = new Array<Cartesian3>();
                    for (let pIdx = 0; pIdx < scanPoints.length; ++pIdx) {
                        edgePoints.push(
                            scanPoints[pIdx].getValue(time)
                        );
                    }
                    // return edgePoints;
                    return this.interpolateUsingLagrange2(edgePoints, iptEdgePoints, 8);
                }, false),
                width: scanLineWidth,
                material: scanLineColor
            }
        });
        this.unneatRadar.set(scanLineId, scanLineEntity);
    }

    public destroy() {
        for (let key of this.unneatRadar.keys()) {
            this.cmap.viewer.entities.removeById(key);
        }
    }
}