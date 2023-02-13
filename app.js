const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());
let db = null;

const intialaizDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("server has started"));
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};
intialaizDbAndServer();

const convertStateDbobjectToAyyay = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictDbObjectToArray = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const covidQuery = `
    SELECT
     *
    FROM
     state;`;
  const dbResponse = await db.all(covidQuery);
  response.send(
    dbResponse.map((eachValue) => convertStateDbobjectToAyyay(eachValue))
  );
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
      *
    FROM
      state
    WHERE 
      state_id= ${stateId};`;
  const dbResponse = await db.get(stateQuery);
  response.send(convertStateDbobjectToAyyay(dbResponse));
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
        SELECT
        *
        FROM
        district
        WHERE
        district_id=${districtId};`;
  const dbResponse = await db.get(districtQuery);
  response.send(convertDistrictDbObjectToArray(dbResponse));
});
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const districtQuery = `
    INSERT INTO
      district (  state_id, district_name, cases, cured, active, deaths)
    VALUES 
      ( ${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(districtQuery);
  response.send("District Successfully Added");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM
      district
    WHERE
     district_id= ${districtId}
    ;`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
    UPDATE
      district
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE
      district_id = ${districtId} ;`;

  await db.run(districtQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const GetQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
     district
    WHERE 
     state_id=${stateId};`;
  const dbResponse = await db.get(GetQuery);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const Query = `
    SELECT
      state_name
    FROM
     district
     NATURAL JOIN
     state
    WHERE
     district_id=${districtId};`;
  const dbResponse = await db.get(Query);
  response.send({
    stateName: dbResponse.state_name,
  });
});
module.exports = app;
