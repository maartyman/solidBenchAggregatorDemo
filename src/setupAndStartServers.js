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
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const decompress_1 = __importDefault(require("decompress"));
const fs_1 = __importDefault(require("fs"));
const community_server_1 = require("@solid/community-server");
const solid_aggregator_client_1 = require("solid-aggregator-client");
const solid_aggregator_server_1 = require("solid-aggregator-server");
function setupAndStartCSS() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs_1.default.existsSync("./SolidBenchServerData")) {
            console.log("Decompressing data. This might take a while!");
            yield (0, decompress_1.default)("./SolidBenchServerData.zip", "SolidBenchServerData");
            console.log("Decompressing finished!");
        }
        else {
            console.log("Decompressing already done, continuing!");
        }
        console.log("Starting CSS.");
        const loaderProperties = {
            mainModulePath: process.cwd() + "/node_modules/@solid/community-server/",
            dumpErrorState: true,
            typeChecking: false,
        };
        const configs = process.cwd() + "/cssConfig.json";
        yield (new community_server_1.AppRunner()).run(loaderProperties, configs, {
            'urn:solid-server:default:variable:rootFilePath': process.cwd() + '/SolidBenchServerData'
        }, {
            "loggingLevel": "warn"
        });
        console.log("CSS started.");
        setupAndStartAggregatorServer();
    });
}
function setupAndStartAggregatorServer() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting Aggregator server.");
        solid_aggregator_server_1.AppRunner.runApp("warn");
        console.log("Aggregator server started.");
        const solidClient = new solid_aggregator_client_1.SolidClient("http://localhost:3000/pods/00000000000000000933/", cross_fetch_1.default, "http://localhost:3001", "warn");
        function makeAggregatedQuery(queryString, sources, comunicaVersion, comunicaContext) {
            return __awaiter(this, void 0, void 0, function* () {
                const queryContext = {
                    query: queryString,
                    sources: sources,
                    aggregated: true,
                    comunicaVersion: comunicaVersion,
                    comunicaContext: comunicaContext
                };
                let query = solidClient.makeQuery(queryContext);
                yield new Promise((resolve, reject) => {
                    query.subscribeOnReady(() => {
                        resolve();
                    });
                });
            });
        }
        //simple and update
        let queryString = `
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>

SELECT ?friend WHERE {
  <http://localhost:3000/pods/00000000000000000933/profile/card#me> snvoc:knows ?n . 
  ?n snvoc:hasPerson ?friend . 
}
`;
        let sources = ["http://localhost:3000/pods/00000000000000000933/profile/card"];
        console.log("Adding simple query.");
        yield makeAggregatedQuery(queryString, sources).then(() => {
            console.log("Simple query added.");
        });
        //complex
        queryString = `
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
        sources = [
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
        console.log("Adding complex query.");
        yield makeAggregatedQuery(queryString, sources).then(() => {
            console.log("Complex query added.");
        });
        //link-traversal
        queryString = `
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
        sources = ["http://localhost:3000/pods/00000000000000000933/"];
        console.log("Adding link-traversal query.");
        yield makeAggregatedQuery(queryString, sources, "link-traversal", "link-traversal-follow-match-query");
        console.log("Link-traversal query added.");
        console.log("Everything is setup and ready for the demo!");
    });
}
setupAndStartCSS();
