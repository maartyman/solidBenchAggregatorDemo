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
            }
        };
        let query = solidClient.makeQuery(queryContext);
        yield query.queryReadyPromise();
        const timeMake = performance.now();
        query.getBindings().then((bindings) => {
            console.log(chalk_1.default.green(`Result client (` + ((performance.now() - timeMake) / 1000).toLocaleString(undefined, { minimumFractionDigits: 3 }) + ` s): `));
            for (const binding of bindings) {
                //console.log(binding);
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
