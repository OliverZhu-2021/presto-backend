require("dotenv").config();
import AsyncLock from "async-lock";
import fs from "fs";
import jwt from "jsonwebtoken";
import { AccessError, InputError } from "./error";
import Admins from "../model/admins";
import emailUtils from "./utils";
import { error } from "console";

const lock = new AsyncLock();

const JWT_SECRET = "llamallamaduck";
const DATABASE_FILE = "./database.json";
const { USE_MONGODB } = process.env;
/***************************************************************
                       State Management
***************************************************************/

let admins;

const sessionTimeouts = {};

const update = async (admins) =>
  new Promise((resolve, reject) => {
    lock.acquire("saveData", async () => {
      try {
        // Store to MongoDB
        await admins.save();
        resolve();
      } catch(error) {
        console.log(error);
        reject(new Error("Writing to database failed"));
      }
    });
  });

export const save = () => update(admins);
export const reset = () => {
  admins.overwrite({});
  save();
};

(async () => {
  try {
    // Load existing data into the admins instance
    admins = await Admins.findOne({});
    
    if(!admins) {
      admins = new Admins({});
      await admins.save();
    }
  } catch(error) {
    console.log("WARNING: No database found, create a new one");
    save();
  }
})();

/***************************************************************
                       Helper Functions
***************************************************************/

export const userLock = (callback) =>
  new Promise((resolve, reject) => {
    lock.acquire("userAuthLock", callback(resolve, reject));
  });

/***************************************************************
                       Auth Functions
***************************************************************/

export const getEmailFromAuthorization = (authorization) => {
  try {
    const token = authorization.replace("Bearer ", "");
    const { email } = jwt.verify(token, JWT_SECRET);
    const emailKey = emailUtils.encodeEmailKey(email);
    if (!(admins.admins.has(emailKey))) {
      throw new AccessError("Invalid Token");
    }
    return email;
  } catch(error) {
    throw new AccessError("Invalid token");
  }
};

export const login = (email, password) =>
  userLock((resolve, reject) => {
    const emailKey = emailUtils.encodeEmailKey(email);
    if (admins.admins.has(emailKey)) {
      if (admins.admins.get(emailKey).password === password) {
        admins.admins.get(emailKey).sessionActive = true;
        resolve(jwt.sign({ email }, JWT_SECRET, { algorithm: "HS256" }));
      }
    }
    reject(new InputError("Invalid username or password"));
  });

export const logout = (email) =>
  userLock((resolve, reject) => {
    const emailKey = emailUtils.encodeEmailKey(email);
    admins.admins.get(emailKey).sessionActive = false;
    resolve();
  });

export const register = (email, password, name) =>
  userLock((resolve, reject) => {
    try {
      const emailKey = emailUtils.encodeEmailKey(email);
      if (admins.admins.has(emailKey)) {
        return reject(new InputError("Email address already registered"));
      }

      admins.admins.set(
        emailKey, 
        {
          name,
          password,
          store: {},
          sessionActive: true
        }
      );

      const token = jwt.sign({ email }, JWT_SECRET, { algorithm: "HS256" });
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });

/***************************************************************
                       Store Functions
***************************************************************/

export const getStore = (email) =>
  userLock((resolve, reject) => {
    const emailKey = emailUtils.encodeEmailKey(email);
    
    // Get data using working Mongoose methods
    const user = admins.admins.get(emailKey);
    if (!user) {
      reject(new Error(`User not found for email: ${email}`));
    }

    // Convert the store (which contains Maps) to plain object
    const store = user.store;
    const plainStore = JSON.parse(JSON.stringify(store, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }));

    resolve(plainStore);
  });

export const setStore = (email, store) =>
  userLock((resolve, reject) => {
    const emailKey = emailUtils.encodeEmailKey(email);
    const user = admins.admins.get(emailKey); // Get user object by email key
    if (user) {
      user.store = store; // Set the store field on the user object
      admins.admins.set(emailKey, user); // Update the user back in the map
    }
    resolve();
  });
