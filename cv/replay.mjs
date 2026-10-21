// Development tool: node cv/replay.mjs path/to/zombie-cv-session-v2.json
import {readFile} from 'node:fs/promises';
import {ProjectileTracker} from './tracker.js';
const path=process.argv[2];if(!path){console.error('Usage: node cv/replay.mjs session.json');process.exit(2);}
const data=JSON.parse(await readFile(path,'utf8')),tracker=new ProjectileTracker(data.config);tracker.calibrate(data.calibration.H,data.calibration.samples,data.calibration.validated);
const events=[];for(const frame of data.measurements||[]){const result=tracker.update(frame.detection,{timestamp:frame.timestamp,frameId:frame.frameId});if(result.event)events.push(result.event);}console.log(JSON.stringify({frames:data.measurements?.length||0,estimatedImpacts:events},null,2));
