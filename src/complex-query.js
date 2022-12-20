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
const solidClient = new solid_aggregator_client_1.SolidClient("http://localhost:3000/pods/00000000000000000102/", cross_fetch_1.default, "http://localhost:3001", "fatal");
const queryString = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
SELECT ?fr (MIN(?distInner) AS ?dist) WHERE {
  <http://localhost:3000/pods/00000000000000000102/profile/card#me> rdf:type snvoc:Person;
    snvoc:id ?rootId, ?rootId.
  ?fr rdf:type snvoc:Person.
  {
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> ((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson)) ?fr.
    BIND(1  AS ?distOneInner)
  }
  UNION
  {
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> (((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))) ?fr.
    BIND(2  AS ?distTwoInner)
  }
  UNION
  { 
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> (((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))) ?fr. 
    BIND(3  AS ?distTwoInner)
  }
  ?fr snvoc:id ?frId.
  FILTER(?frId != ?rootId)
  BIND(IF((COALESCE(?distOneInner, 4 )) < 4 , 1 , IF((COALESCE(?distTwoInner, 4 )) < 4 , 2 , 3 )) AS ?distInner)
}
GROUP BY ?fr
ORDER BY ASC(?dist)
`;
const sources = [
    "http://localhost:3000/pods/00000000000000000102/profile/card#me",
    "http://localhost:3000/pods/00000000000000000296/profile/card#me",
    "http://localhost:3000/pods/00000000000000000318/profile/card#me",
    "http://localhost:3000/pods/00000000000000001355/profile/card#me",
    "http://localhost:3000/pods/00000002199023257239/profile/card#me",
    "http://localhost:3000/pods/00000004398046511587/profile/card#me",
    "http://localhost:3000/pods/00000006597069766678/profile/card#me",
    "http://localhost:3000/pods/00000006597069766725/profile/card#me",
    "http://localhost:3000/pods/00000006597069767242/profile/card#me",
    "http://localhost:3000/pods/00000019791209301454/profile/card#me",
    "http://localhost:3000/pods/00000026388279067534/profile/card#me",
    "http://localhost:3000/pods/00000032985348834375/profile/card#me",
    "http://localhost:3000/pods/00000006597069767341/profile/card#me",
    "http://localhost:3000/pods/00000006597069768275/profile/card#me",
];
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
