"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const solid_aggregator_client_1 = require("solid-aggregator-client");
const chalk_1 = __importDefault(require("chalk"));
const allpods_1 = require("./allpods");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const n3_1 = require("n3");
var blankNode = n3_1.DataFactory.blankNode;
const n3_2 = __importDefault(require("n3"));
var literal = n3_1.DataFactory.literal;
var namedNode = n3_1.DataFactory.namedNode;
let changedTime = 0;
console.log(chalk_1.default.blue("Aggregated"));
console.log(chalk_1.default.green("Client"));
const solidClient = new solid_aggregator_client_1.SolidClient("http://localhost:3000/pods/00000000000000000933/", cross_fetch_1.default, "http://localhost:3001", "warn");
const queryString = `
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>

SELECT ?friend WHERE {
  <http://localhost:3000/pods/00000000000000000933/profile/card#me> snvoc:knows ?n . 
  ?n snvoc:hasPerson ?friend . 
}
`;
const sources = ["http://localhost:3000/pods/00000000000000000933/profile/card"];
function doAggregatedQuery() {
    return __awaiter(this, void 0, void 0, function* () {
        const queryContext = {
            query: queryString,
            sources: sources,
            aggregated: true
        };
        let query = solidClient.makeQuery(queryContext);
        query.streamBindings((bindings, addition) => {
            if (addition) {
                console.log(chalk_1.default.blue("added bindings: (" + ((performance.now() - changedTime) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + "s)"));
                bindings.forEach((value, key) => {
                    console.log(chalk_1.default.blue("\t" + key.value.toString() + ": " + value.value.toString()));
                });
            }
            else {
                console.log(chalk_1.default.blue("removed bindings: (" + ((performance.now() - changedTime) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + "s)"));
                bindings.forEach((value, key) => {
                    console.log(chalk_1.default.blue("\t" + key.value.toString() + ": " + value.value.toString()));
                });
            }
        });
    });
}
function doClientQuery() {
    return __awaiter(this, void 0, void 0, function* () {
        const queryContext = {
            query: queryString,
            sources: sources,
            aggregated: false,
            local: {
                guarded: true
            }
        };
        let query = solidClient.makeQuery(queryContext);
        query.streamBindings((bindings, addition) => {
            if (addition) {
                console.log(chalk_1.default.green("added bindings: (" + ((performance.now() - changedTime) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + "s)"));
                bindings.forEach((value, key) => {
                    console.log(chalk_1.default.green("\t" + key.value.toString() + ": " + value.value.toString()));
                });
            }
            else {
                console.log(chalk_1.default.green("removed bindings: (" + ((performance.now() - changedTime) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + "s)"));
                bindings.forEach((value, key) => {
                    console.log(chalk_1.default.green("\t" + key.value.toString() + ": " + value.value.toString()));
                });
            }
        });
    });
}
doAggregatedQuery();
doClientQuery();
function changeStuff() {
    return __awaiter(this, void 0, void 0, function* () {
        let resource = new solid_aggregator_client_1.RDFResource('http://localhost:3000/pods/00000000000000000933/profile/card#me');
        yield solidClient.getResource(resource);
        const pod = allpods_1.allPods[Math.floor(Math.random() * allpods_1.allPods.length)];
        const bn = blankNode();
        if (!resource.data) {
            throw new Error("Couldn't resolve URL");
        }
        if (typeof resource.data !== "string") {
            resource.data.add(new n3_1.Quad(bn, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/creationDate"), literal((new Date()).toISOString(), namedNode("http://www.w3.org/2001/XMLSchema#dateTime"))));
            resource.data.add(new n3_1.Quad(bn, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasPerson"), namedNode(pod)));
            resource.data.add(new n3_1.Quad(namedNode("http://localhost:3000/pods/00000000000000000933/profile/card#me"), namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/knows"), bn));
            console.log("Adding a new friend:", pod);
            yield solidClient.makeResource(resource);
            changedTime = performance.now();
        }
        setTimeout(changeStuff, 2000);
        setTimeout(() => { changeStuffBack(pod); }, 1000);
    });
}
function changeStuffBack(pod) {
    return __awaiter(this, void 0, void 0, function* () {
        let resource = new solid_aggregator_client_1.RDFResource('http://localhost:3000/pods/00000000000000000933/profile/card');
        yield solidClient.getResource(resource);
        if (!resource.data) {
            throw new Error("Couldn't resolve URL");
        }
        if (typeof resource.data !== "string") {
            const hasPerson = resource.data.getQuads(null, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasPerson"), namedNode(pod), new n3_2.default.DefaultGraph);
            resource.data.delete(hasPerson[0]);
            const creationDate = resource.data.getQuads(hasPerson[0].subject, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/creationDate"), null, new n3_2.default.DefaultGraph);
            resource.data.delete(creationDate[0]);
            const knows = resource.data.getQuads(namedNode("http://localhost:3000/pods/00000000000000000933/profile/card#me"), namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/knows"), hasPerson[0].subject, new n3_2.default.DefaultGraph);
            resource.data.delete(knows[0]);
        }
        console.log("Removing friend:", pod);
        yield solidClient.makeResource(resource);
        changedTime = performance.now();
    });
}
setTimeout(changeStuff, 10000);
