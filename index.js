require('dotenv').config();
const express = require('express')
const cors = require("cors");
const routes = require("./src/routes");
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

// const allowedOrigins = process.env.ALLOWED_ORIGINS
//   ? process.env.ALLOWED_ORIGINS.split(',')
//   : ["http://localhost:3000"];

app.use(cors({
  origin: ["http://localhost:3000","http://localhost:3001","http://192.168.1.200","192.168.1.200","http://192.168.1.200:8000","http://192.168.1.200:3002","192.168.1.200:8000","192.168.1.200:3002"],
  credentials:true
}));

let port=process.env.PORT || 8001

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));


app.use("/api", routes);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
