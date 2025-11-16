
const BASE = process.env.BASE_URL || "http://localhost:3000";

const tests = [
  {
    name: "Menu POST unauthenticated -> 401",
    method: "POST",
    path: "/api/mess/000000000000000000000000/menu",
    body: { mealTime: "Lunch", menutype: "vegMenu", dishes: [] },
    expect: 401,
  },
  {
    name: "Review POST unauthenticated -> 401",
    method: "POST",
    path: "/api/mess/000000000000000000000000/review",
    body: { rating: 5, text: "Nice" },
    expect: 401,
  },
  {
    name: "New Mess POST unauthenticated -> 401",
    method: "POST",
    path: "/api/consumer/000000000000000000000000/new-mess",
    body: { name: "X" },
    expect: 401,
  },
  {
    name: "Mess PATCH unauthenticated -> 401",
    method: "PATCH",
    path: "/api/mess/000000000000000000000000",
    body: { action: "toggleOpen" },
    expect: 401,
  },
  {
    name: "Mess DELETE unauthenticated -> 401",
    method: "DELETE",
    path: "/api/mess/000000000000000000000000",
    expect: 401,
  },
  {
    name: "Review DELETE unauthenticated -> 401",
    method: "DELETE",
    path: "/api/mess/000000000000000000000000/review/000000000000000000000000",
    expect: 401,
  },
];

(async function run() {
  console.log("Running auth protection smoke tests against", BASE);
  let failed = 0;
  for (const t of tests) {
    const url = BASE + t.path;
    const opts = { method: t.method, headers: {} };
    if (t.body) {
      opts.headers["content-type"] = "application/json";
      opts.body = JSON.stringify(t.body);
    }

    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      const ok = res.status === t.expect;
      if (!ok) {
        failed++;
        console.error(`✖ ${t.name}: expected ${t.expect} got ${res.status}`);
        console.error("Response body:", text);
      } else {
        console.log(`✔ ${t.name}: ${res.status}`);
      }
    } catch (err) {
      failed++;
      console.error(`✖ ${t.name}: network error`, err.message || err);
    }
  }

  if (failed) {
    console.error(`${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log("All tests passed (unauthenticated protection checks)");
    process.exit(0);
  }
})();
