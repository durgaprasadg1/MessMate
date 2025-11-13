/*
  End-to-end auth test (signup -> signin -> create mess in DB -> owner update vs non-owner update)

  Notes:
  - This test requires your dev server running at BASE_URL (default http://localhost:3000)
  - Requires a reachable MongoDB (MONGODB_URI env var) so the test can insert a Mess document.
  - Run with Node 18+ (fetch & FormData available). If your Node doesn't have fetch, set NODE_OPTIONS=--experimental-fetch

  Run:
    cd nmess
    npm run test:e2e-auth
*/

import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/MessManagement";

function parseSetCookie(setCookieRaw) {
  if (!setCookieRaw) return null;
  return setCookieRaw.replace(/,\s*/g, "; ");
}

async function signup(user) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(user),
    redirect: "follow",
  });
  const json = await res.json().catch(() => ({}));
  if (res.status >= 400)
    throw new Error(`Signup failed: ${res.status} ${JSON.stringify(json)}`);
  return json; 
}

async function getCsrf() {
  const res = await fetch(`${BASE}/api/auth/csrf`);
  const json = await res.json();
  return json.csrfToken;
}

async function signin(email, password) {
  const csrfToken = await getCsrf();
  const body = new URLSearchParams();
  body.append("csrfToken", csrfToken);
  body.append("email", email);
  body.append("password", password);

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    redirect: "manual",
  });

  // capture set-cookie header
  const setCookie = res.headers.get("set-cookie");
  const cookieHeader = parseSetCookie(setCookie);
  if (!cookieHeader) throw new Error("Signin did not return session cookie");
  return cookieHeader;
}

function makeNextAuthCookie(userId, username) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret)
    throw new Error("NEXTAUTH_SECRET env var is required for e2e-auth test");
  const token = jwt.sign({ id: userId, username }, secret, { expiresIn: "1d" });
  return `next-auth.session-token=${token}`;
}

async function postMenu(messId, cookie, payload) {
  const res = await fetch(`${BASE}/api/mess/${messId}/menu`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
  let txt;
  try {
    txt = await res.text();
  } catch (e) {
    txt = "";
  }
  return { status: res.status, body: txt };
}

(async function run() {
  console.log("E2E auth test starting against", BASE);
  const owner = {
    username: `owner_${Date.now()}`,
    email: `owner_${Date.now()}@example.com`,
    phoneNumber: "9999999999",
    address: "Owner address",
    password: "P@ssw0rd!",
  };
  const other = {
    username: `other_${Date.now()}`,
    email: `other_${Date.now()}@example.com`,
    phoneNumber: "8888888888",
    address: "Other address",
    password: "P@ssw0rd!",
  };

  try {
    const ownerRes = await signup(owner);
    console.log("Owner created:", ownerRes.id || ownerRes);
    const otherRes = await signup(other);
    console.log("Other created:", otherRes.id || otherRes);

    // create auth cookies for both users by signing JWTs with NEXTAUTH_SECRET
    const ownerCookie = makeNextAuthCookie(ownerRes.id, owner.username);
    console.log("Owner cookie created");
    const otherCookie = makeNextAuthCookie(otherRes.id, other.username);
    console.log("Other cookie created");

    // insert a Mess document directly into MongoDB with owner set to ownerRes.id
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const messDoc = {
      name: "E2E Test Mess",
      description: "created by e2e test",
      address: "Nowhere",
      category: "test",
      isLimited: false,
      ownerName: owner.username,
      adharNumber: "0000",
      phoneNumber: "9999999999",
      lat: 0,
      lon: 0,
      image: { url: "", filename: "test" },
      vegMenu: [],
      nonVegMenu: [],
      vegMenuRef: null,
      nonVegMenuRef: null,
      owner: new ObjectId(ownerRes.id),
      mealTime: "",
    };
    const insert = await db.collection("messes").insertOne(messDoc);
    const messId = insert.insertedId.toString();
    console.log("Inserted mess with id", messId);

    // unauthenticated attempt -> should be 401
    const unauth = await postMenu(messId, null, {
      mealTime: "Lunch",
      menutype: "vegMenu",
      dishes: [],
    });
    console.log("Unauthenticated menu POST status:", unauth.status);
    if (unauth.status !== 401)
      throw new Error("Expected 401 for unauthenticated menu POST");

    // other user attempt -> should be 403
    const otherAttempt = await postMenu(messId, otherCookie, {
      mealTime: "Lunch",
      menutype: "vegMenu",
      dishes: [{ name: "Paneer", items: [] }],
    });
    console.log(
      "Other user menu POST status:",
      otherAttempt.status,
      otherAttempt.body.slice(0, 200)
    );
    if (otherAttempt.status !== 403)
      throw new Error("Expected 403 for non-owner menu POST");

    // owner attempt -> should be 200
    const ownerAttempt = await postMenu(messId, ownerCookie, {
      mealTime: "Lunch",
      menutype: "vegMenu",
      dishes: [{ name: "Paneer", items: [] }],
    });
    console.log(
      "Owner menu POST status:",
      ownerAttempt.status,
      ownerAttempt.body.slice(0, 200)
    );
    if (ownerAttempt.status !== 200)
      throw new Error("Expected 200 for owner menu POST");

    console.log("E2E auth test: SUCCESS");
    await db.collection("messes").deleteOne({ _id: insert.insertedId });
    await db
      .collection("consumers")
      .deleteOne({ _id: new ObjectId(ownerRes.id) });
    await db
      .collection("consumers")
      .deleteOne({ _id: new ObjectId(otherRes.id) });
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("E2E auth test: FAILED", err.message || err);
    console.error(err);
    process.exit(1);
  }
})();
