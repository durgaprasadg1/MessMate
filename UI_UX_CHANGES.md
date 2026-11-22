# MessMate: UI / UX changes

## Why every click felt like a reload (root causes found)

| Cause | Where | Fix |
|-------|-------|-----|
| Every route change faded the **whole screen** (sidebar included) to opacity 0 and back | `AnimatedLayout` (`AnimatePresence` around the app) | Removed. `app/template.jsx` fades **only the page content**, 160 ms, no layout shift |
| The sidebar was rendered **inside every page**, so it was destroyed, re-created and re-fetched on each navigation | every `page.jsx` | One persistent `AppShell` in the root layout (`Component/Others/AppShell.jsx`, rules in `lib/navRouting.js`) |
| Owner sidebar called `router.refresh()` **every 10 s**; the consumer sidebar re-fetched the profile every 10 s | `OwnerNavbar`, `Navbar` | Polling removed; the profile is one cached SWR request |
| "Login" link did `router.push("/login")` **and then `signIn()`**, which does a full-page navigation | `Navbar` | Plain `<Link>` |
| `window.location.reload()` after taking an order / opening or closing a mess | `OrderActionOwner`, `Panel` | Local state + soft `router.refresh()` + an `order-updated` event |
| Session was fetched in the browser after load, so pages flashed a loading / logged-out state | `SessionProvider` | Root layout reads the session on the server and passes it in (`session` prop); no refetch on window focus |
| `/login` and `/register` rendered, then redirected 2-3 s later | client `useEffect` redirects | Real HTTP 307 in `proxy.ts` straight to the role's dashboard (`/mess`, `/owner`, `/admin`), a server-side check in the pages, and a no-form "redirecting" state as the last fallback. `/` does the same for admins and owners |
| The explore page was blocked by **two** spinners: the data, then the browser's location prompt (up to 12 s) | `app/mess/page.jsx`, `AllMess` | The list shows immediately; distances fill in when the position arrives. Data is cached (SWR) so coming back is instant |
| Whole-page spinners replaced forms while submitting (typed text / selected files lost on error) | login, register, reset, forgot, new-mess | Forms stay mounted; the button shows the progress |
| Server pages called **their own API over HTTP** (`fetch(NEXTAUTH_URL/api/mess/...)`) | mess detail, update-menu, reviews | Read through the same cached service function, no extra hop |
| Search box lost focus on every key press | sidebar component was re-created on each render | Rendered as a function, not as a new component each time |

Also new: a thin orange progress bar at the top the moment a link is clicked, skeleton placeholders (instead of spinners) that keep the page frame in place, and spinners/skeletons that only show up if loading takes longer than ~180 ms.

## Typography
Classic serif families, **self-hosted** (`@fontsource-variable`, nothing is requested from Google): **Playfair Display** for headings, **Lora** for body text, with Georgia / Times as fallback. Colours are unchanged.

## Mess location: OpenStreetMap + Haversine
* **Registration** (`Component/Map/LocationPicker.jsx`): the owner pins the mess on an OpenStreetMap map (click, drag the pin, or search an address via Nominatim). The coordinates are saved; the browser's current-location code was removed. The server refuses a missing / `0,0` location.
* **Nearby search** (`lib/geo.js`): distance from the customer to each mess is computed with the **Haversine formula**, optional radius filter, nearest-first ordering, shown as `850 m` / `1.4 km`. Unit-tested against known distances.
* After submitting, a toast says the application is **under verification**, then the owner lands on "My messes".
* CSP was extended for `tile.openstreetmap.org` (images) and `nominatim.openstreetmap.org` (search).
* Note: the public OSM tile server and Nominatim are free but have a fair-use policy (no heavy traffic). If the app grows, switch the tile URL in `lib/osm.js` to a hosted provider.

## Register = login
After a successful sign-up (consumer or owner) the app signs the new user in automatically and sends them to `/mess` or `/owner`. From the next visit they just log in. If the automatic sign-in ever fails, they are taken to the login page.

## New dependencies
`swr` (cached data), `nextjs-toploader` (progress bar), `leaflet` + `react-leaflet` (map), `@fontsource-variable/lora`, `@fontsource-variable/playfair-display`; dev: `jsdom`, `@testing-library/react`, `@testing-library/user-event`. `npm audit` reports 0 vulnerabilities.

## Tests added (all run in CI)
Haversine, nav routing table, OSM helpers, location validation, proxy redirects, `AppShell` rendering, the map picker (jsdom), the register->auto-login and login-redirect flows, and static guards (no per-page sidebars, no full reloads, no timer-driven `router.refresh`, serif fonts, no geolocation in registration).

## Good to know
* Because the root layout now reads the session, all pages are rendered per request (dynamic). Combined with the loading skeletons this feels faster, but static caching of pages no longer applies.
* The sidebar keeps its search text and radius while you open a mess and come back.
* Pages that never had a sidebar (forgot / reset password, 404, admin profile, edit-profile) still have none.
