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
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const chalk_1 = __importDefault(require("chalk"));
console.log(chalk_1.default.blue("Aggregated"));
console.log(chalk_1.default.green("Client"));
const solidClient = new solid_aggregator_client_1.SolidClient("http://localhost:3000/pods/00000000000000000933/", cross_fetch_1.default, "http://localhost:3001", "warn");
const queryString = `
PREFIX ldp: <http://www.w3.org/ns/ldp#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?content ?forumName WHERE {
    ?post rdf:type snvoc:Post .
    ?post snvoc:content ?content .
    ?resource1 ldp:contains ?resource2 .
    ?post rdfs:seeAlso ?forum .
    ?forum snvoc:title ?forumName .
}
`;
const sources = ["http://localhost:3000/pods/00000000000000000933/"];
function doAggregatedQuery() {
    return __awaiter(this, void 0, void 0, function* () {
        const queryContext = {
            query: queryString,
            sources: sources,
            aggregated: true,
            comunicaVersion: "link-traversal",
            comunicaContext: "link-traversal-follow-match-query"
        };
        let query = solidClient.makeQuery(queryContext);
        yield query.queryReadyPromise();
        const timeMake = performance.now();
        query.getBindings().then((bindings) => {
            console.log(chalk_1.default.blue(`Result aggregated (` + ((performance.now() - timeMake) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + ` s): `));
            for (const binding of bindings) {
                console.log(chalk_1.default.blue("\tbindings: "));
                binding.forEach((value, key) => {
                    console.log(chalk_1.default.blue("\t\t" + key.value + ": " + value.value));
                });
            }
            query.delete();
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
                guarded: false
            },
            comunicaVersion: "link-traversal",
            comunicaContext: "link-traversal-follow-match-query"
        };
        let query = solidClient.makeQuery(queryContext);
        yield query.queryReadyPromise();
        const timeMake = performance.now();
        yield query.getBindings().then((bindings) => {
            console.log(chalk_1.default.green(`Result client (` + ((performance.now() - timeMake) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + ` s): `));
            for (const binding of bindings) {
                console.log(chalk_1.default.green("\tbindings: "));
                binding.forEach((value, key) => {
                    console.log(chalk_1.default.green("\t\t" + key.value + ": " + value.value));
                });
            }
            query.delete();
        });
    });
}
doAggregatedQuery();
doClientQuery();
