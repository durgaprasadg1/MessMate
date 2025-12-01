import { connectDB } from "../../../../lib/mongodb";
import Mess from "../../../../models/mess";

export default async function handler(req, res) {
    await connectDB();
  const { lat, lon, radius } = req.query;
  if (!lat || !lon || !radius) {
    return res.status(400).json({ error: "lat, lon, radius required" });
  }

  try {
    const meters = parseInt(radius, 10);
    const results = await Mess.find({
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: meters
        }
      },
      isVerified: true,
      isBlocked: false
    }).limit(200);

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
