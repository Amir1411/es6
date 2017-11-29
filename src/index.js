/* eslint-disable*/
import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import glob from "glob";
import chalk from "chalk";
import config from "config";
import bodyParser from "body-parser";

const app = express();
app.server = http.createServer(app);

// logger
app.use(morgan("dev"));
app.use(cors());

// 3rd party middleware
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'config')));
const initRoutes = (app) => {
    // including all routes
    glob("./routes/*.js", {
        cwd: path.resolve("./src")
    }, (err, routes) => {
        if (err) {
            console.log(chalk.red("Error occured including routes"));
            return;
        }
        routes.forEach((routePath) => {
            require(routePath).default(app); // eslint-disable-line
        });
        console.log(chalk.green("included " + routes.length + " route files"));
    });
};
initRoutes(app);

app.server.listen(process.env.PORT || 3001);
console.log("Started on port " + 3001);
export default app;