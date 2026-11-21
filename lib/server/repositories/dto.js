/**
 * Output shaping (DTOs). Responses are built from explicit allow-lists, so a
 * new database column can never leak to a client by accident, and password
 * hashes / reset tokens / MFA secrets are structurally impossible to return.
 * Shapes are kept backward compatible with the existing UI.
 */

export const toConsumerDto = (c) =>
  c && {
    id: c.id,
    _id: c.id,
    username: c.username,
    email: c.email,
    address: c.address,
    phone: c.phone,
    is_blocked: c.is_blocked ?? false,
    have_monthly_mess: c.have_monthly_mess ?? false,
  };

/** Admin list row: also exposes the camelCase fields the admin table reads. */
export const toConsumerAdminDto = (c) =>
  c && {
    ...toConsumerDto(c),
    isBlocked: c.is_blocked ?? false,
    reviews: (c.reviews || []).map((r) => ({ id: r.id, _id: r.id, rating: r.rating })),
  };

export const toOwnerDto = (o) =>
  o && {
    id: o.id,
    _id: o.id,
    name: o.name,
    email: o.email,
    upi: o.upi,
    phone_number: o.phone_number,
    phoneNumber: o.phone_number,
    address: o.address,
    mess: o.mess,
    messes: o.mess,
  };

export const toAdminDto = (a) =>
  a && {
    id: a.id,
    _id: a.id,
    name: a.name,
    email: a.email,
    phone_number: a.phone_number,
    phoneNumber: a.phone_number,
    address: a.address,
  };

/** Review as shown on a mess page. Authors expose only id + display name. */
export const toReviewDto = (r) =>
  r && {
    id: r.id,
    _id: r.id,
    rating: r.rating,
    feedback: r.feedback,
    created_at: r.created_at,
    createdAt: r.created_at,
    author: r.author ? { id: r.author.id, _id: r.author.id, username: r.author.username } : null,
  };

const CLEAN = (v) => v ?? null;

/** Public mess list entry (explore page). */
export const toMessListDto = (m) =>
  m && {
    _id: m.id,
    name: m.name,
    ownerName: m.owner_name,
    owner: m.owner_id,
    phoneNumber: m.phone_number,
    category: m.category,
    isOpen: m.is_open,
    isVerified: m.is_verified,
    isBlocked: m.is_blocked,
    isLimited: m.is_limited,
    url: m.image_url,
    lat: m.lat,
    lon: m.lon,
  };

/** Public mess detail. NOTE: no e-mail, UPI, Aadhaar or certificate here. */
export const toMessPublicDto = (m) =>
  m && {
    _id: m.id,
    name: m.name,
    description: m.description,
    monthlyMessFee: Number(m.monthly_mess_fee || 0),
    monthlyMessDuration: Number(m.monthly_mess_duration || 30),
    address: m.address,
    mealTime: m.meal_time,
    vegMenu: m.veg_menu,
    nonVegMenu: m.non_veg_menu,
    vegPrice: m.veg_price,
    nonVegPrice: m.non_veg_price,
    vegMenuRef: m.vegMenuRef ?? null,
    nonVegMenuRef: m.nonVegMenuRef ?? null,
    owner: m.owner_id,
    category: m.category,
    isOpen: m.is_open,
    ownerName: m.owner_name,
    phoneNumber: m.phone_number,
    lat: m.lat,
    lon: m.lon,
    isLimited: m.is_limited,
    isVerified: m.is_verified,
    createdAt: m.created_at,
    image: { url: CLEAN(m.image_url) },
    isBlocked: m.is_blocked,
    alerts: m.alerts,
    reviews: (m.reviews || []).map(toReviewDto),
  };

/** Admin / owner view of a mess (verification queue, owner dashboard). */
export const toMessManagementDto = (m, certUrl = (x) => x.certificate_url) =>
  m && {
    _id: m.id,
    name: m.name,
    ownerName: m.owner_name,
    owner: m.owner_id,
    phoneNumber: m.phone_number,
    category: m.category,
    isOpen: m.is_open,
    isVerified: m.is_verified,
    isBlocked: m.is_blocked,
    isLimited: m.is_limited,
    adharNumber: m.adhar_number,
    lat: m.lat,
    lon: m.lon,
    vegMenu: m.veg_menu,
    nonVegMenu: m.non_veg_menu,
    vegPrice: m.veg_price,
    nonVegPrice: m.non_veg_price,
    image: { url: m.image_url },
    certificate: { url: certUrl(m) },
    createdAt: m.created_at,
  };

export const toPendingMessDto = (m, certUrl = (x) => x.certificate_url) =>
  m && {
    _id: m.id,
    name: m.name,
    ownerName: m.owner_name,
    phoneNumber: m.phone_number,
    category: m.category,
    adharNumber: m.adhar_number,
    isLimited: m.is_limited,
    isVerified: m.is_verified,
    createdAt: m.created_at,
    lat: m.lat,
    lon: m.lon,
    image: { url: m.image_url },
    certificate: { url: certUrl(m) },
  };
