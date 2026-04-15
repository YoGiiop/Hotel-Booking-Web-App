import User from "../models/User.js";

const getPrimaryEmailFromClaims = (claims = {}) => {
  return claims.email
    || claims.email_address
    || claims.primaryEmailAddress?.emailAddress
    || claims.primary_email_address?.email_address
    || null;
};

const isPlaceholderEmail = (email = "") => email.endsWith("@placeholder.local");

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
    const claimEmail = getPrimaryEmailFromClaims(claims);
    const fallbackEmail = claimEmail || `${userId}@placeholder.local`;
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
      // Always fetch the latest user (in case it was updated elsewhere)
      user = await User.findById(userId);

      if (user) {
        const updates = {};

        if (claimEmail && (isPlaceholderEmail(user.email) || !user.email)) {
          updates.email = claimEmail;
        }

        if (fallbackName && (!user.username || user.username === "User")) {
          updates.username = fallbackName;
        }

        if (Object.keys(updates).length > 0) {
          user = await User.findByIdAndUpdate(userId, updates, { new: true });
        }
      }
    } catch {
      user = fallbackUser;
    }

    req.user = user || fallbackUser;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};