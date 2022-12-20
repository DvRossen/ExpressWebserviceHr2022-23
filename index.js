require("dotenv").config();
const express = require("express");
//import
const buildsRouter = require("./routers/builds-router");
const bodyParser = require("body-parser");
//create webserver
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//import mongoose
const mongoose = require("mongoose");
const mongoDB = "mongodb://127.0.0.1/builds";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//mongoose connect
const db = mongoose.connection;
db.on("error", (...errors) => console.error("dberror", ...errors));

app.use("/builds", buildsRouter);
//start webserver on port 8000
app.listen(8000, () => {
  console.log(`server started ${process.env.BASE_URI}/builds`);
});
