import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let authData;
  let userId;
  try {
    authData = req.auth();
    ({ userId } = authData); // from Clerk
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const claims = authData?.sessionClaims || {};
    const fallbackEmail = claims.email || `${userId}@placeholder.local`;
    const fallbackName = claims.fullName || claims.username || "User";
    const fallbackUser = {
      _id: userId,
      username: fallbackName,
      email: fallbackEmail,
      role: "user",
      recentSearchedCities: [],
    };

    // Atomically provision the user if the Clerk webhook has not created it yet.
    let user;
    try {
      user = await User.findOneAndUpdate(
        { _id: userId },
        {
          $setOnInsert: fallbackUser,
        },
        {
          new: true,
          upsert: true,
        }
      );
    } catch {
      user = fallbackUser;
    }

    req.user = user || fallbackUser;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};