import {SolidClient, QueryContext} from "solid-aggregator-client";
import fetch from "cross-fetch";
import fs from "fs";
import * as readline from "readline";

const queriesFolder = "/home/maarten/Documents/doctoraat/solidbench/small/simple-queries/";
const test = "interactive-short-1.sparql";

const solidClient = new SolidClient(
  "http://localhost:3000/pods/00000000000000000933/",
  fetch,
  "http://localhost:3001",
  "warn"
);

const regex = new RegExp(/<(http:\/\/localhost:3000\/pods\/\d+\/?[^>]*)>/gm);
function checkForSeedSources(str: string): string[] | null {

  let returnArray: string[] = [];
  let match: string[] | null;
  while ((match = regex.exec(str)) != null) {
    for(let index = 1; index < match.length; index += 2) {
      if (!returnArray.includes(match[index])) {
        returnArray.push(match[index]);
      }
    }
  }

  if (returnArray.length == 0) {
    return null;
  }

  return returnArray;
}

function arrayToOneElementTuple(strings: string[]) : [string, ...string[]] {
  const string = strings.pop();
  if (!string) {
    throw new Error("No element in array. At least one is required");
  }
  return [string, ...strings];
}

function doQuery(queryString: string, seedSources: [string, ...string[]]) {
  //console.log(seedSources);

  const queryContext: QueryContext = {
    query: queryString,
    sources: seedSources,
    aggregated: true,
    local: {
      guarded: false
    },
    comunicaVersion: "link-traversal",
    comunicaContext: "link-traversal-solid-default"
  };

  let query = solidClient.makeQuery(queryContext);


  /*
  query.streamBindings((bindings, addition) => {
    console.log("\tbindings: ");
    bindings.forEach((value, key) => {
      console.log("\t\t" + key.value + ": " + value.value);
    });
  });
  */

  query.getBindings().then((bindings) => {
    console.log("Received: ");
    for (const binding of bindings) {
      console.log("\tbindings: ");
      binding.forEach((value, key) => {
        console.log("\t\t" + key.value + ": " + value.value);
      });
    }
    query.delete();
  });
}

fs.readdir(queriesFolder, (err: (NodeJS.ErrnoException | null), files: string[]) => {
  //files = [test];
  //console.log(files);
  for (let file of files.slice(0,1)) {
    file = queriesFolder + file;

    const fileStream = fs.createReadStream(file);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let query = "";

    rl.on("line", (line: string) => {
      if (line === "") {
        const replaceRegex = new RegExp(/(<http:\/\/localhost:3000\/pods\/)(\d+)(\/?[^>]*>)/gm);
        query = query.replace(replaceRegex, (str, begin, number, end) => {
          //12345678901234567890
          //00000017592186045360
          //number = number.padStart(20, "0");
          return begin + number + end;
        });

        let sources = checkForSeedSources(query);
        if(sources == null) {
          console.error("No sources found.", "\nquery: \n" + query);
          return;
        }

        try {
          let temp = arrayToOneElementTuple(sources);
          doQuery(query, temp);
        }
        catch (e) {
          console.error(e, query);
        }

        query = "";
      }
      else {
        query += line + "\n";
      }
    });

    rl.on("close", () => {
      const replaceRegex = new RegExp(/(<http:\/\/localhost:3000\/pods\/)(\d+)(\/?[^>]*>)/gm);
      query = query.replace(replaceRegex, (str, begin, number, end) => {
        //12345678901234567890
        //00000017592186045360
        //number = number.padStart(20, "0");
        return begin + number + end;
      });

      let sources = checkForSeedSources(query);
      if(sources == null) {
        console.error("No sources found.", "\nquery: \n" + query);
        return;
      }

      try {
        let temp = arrayToOneElementTuple(sources);
        doQuery(query, temp);
      }
      catch (e) {
        console.error(e, query);
      }

      query = "";
    });
  }
});


/*
query.streamBindings((bindings, addition) => {
  if (addition) {
    console.log("added bindings: ");
    bindings.forEach((value, key) => {
      console.log("\t" + key.value + ": " + value.value);
    });
  }
  else {
    console.log("removed bindings: ");
    bindings.forEach((value, key) => {
      console.log("\t" + key.value.toString() + ": " + value.value.toString());
    });
  }
});
*/

/*
solidClient.getResource("http://localhost:3000/pods/00000000000000000065/profile/card")
  .then((response: Response) => {

  }
);
*/
