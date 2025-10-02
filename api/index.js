import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
import { AccessError, InputError } from "./error";
import {
  getEmailFromAuthorization,
  getStore,
  login,
  logout,
  register,
  save,
  setStore,
} from "./service";
import mongoose from "mongoose";

const { BACKEND_PORT, DB_CONNECTION_STRING } = process.env;

const app = express();

// UPDATED CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://presto-update.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // For now, allow all - you can restrict later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

const catchErrors = (fn) => async (req, res) => {
  try {
    await fn(req, res);
    save();
  } catch (err) {
    if (err instanceof InputError) {
      res.status(400).send({ error: err.message });
    } else if (err instanceof AccessError) {
      res.status(403).send({ error: err.message });
    } else {
      console.log(err);
      res.status(500).send({ error: "A system error ocurred" });
    }
  }
};

mongoose.connect(DB_CONNECTION_STRING);

/***************************************************************
                       Auth Function
***************************************************************/

const authed = (fn) => async (req, res) => {
  const email = getEmailFromAuthorization(req.header("Authorization"));
  await fn(req, res, email);
};

app.post(
  "/admin/auth/login",
  catchErrors(async (req, res) => {
    const { email, password } = req.body;
    const token = await login(email, password);
    return res.json({ token });
  })
);

app.post(
  "/admin/auth/register",
  catchErrors(async (req, res) => {
    const { email, password, name } = req.body;
    const token = await register(email, password, name);
    return res.json({ token });
  })
);

app.post(
  "/admin/auth/logout",
  catchErrors(
    authed(async (req, res, email) => {
      await logout(email);
      return res.json({});
    })
  )
);

/***************************************************************
                       Store Functions
***************************************************************/

app.get(
  "/store",
  catchErrors(
    authed(async (req, res, email) => {
      const store = await getStore(email);
      return res.json({ store });
    })
  )
);

app.put(
  "/store",
  catchErrors(
    authed(async (req, res, email) => {
      await setStore(email, req.body.store);
      return res.json({});
    })
  )
);

/***************************************************************
                       Running Server
***************************************************************/

app.get("/", (req, res) => res.redirect("/docs"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || BACKEND_PORT;

app.listen(port, () => {
  console.log(`For API docs, navigate to http://localhost:${port}`);
});
