export default async function handler(req, res) {
  const { lat, lon, radius } = req.query;
  if (!lat || !lon || !radius) {
    return res.status(400).json({ error: "lat, lon, radius required" });
  }

  try {
    const meters = parseInt(radius, 10);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    // Placeholder: bounding-box filter via Supabase
    const degRadius = meters / 111_000; // rough degrees per meter
    const { data: results, error } = await supabase
      .from("mess")
      .select("*")
      .eq("is_verified", true)
      .eq("is_blocked", false)
      .gte("lat", latNum - degRadius)
      .lte("lat", latNum + degRadius)
      .gte("lon", lonNum - degRadius)
      .lte("lon", lonNum + degRadius)
      .limit(200);
    if (error) throw error;

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
