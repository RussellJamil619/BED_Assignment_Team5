function validateInspection(req, res, next) {
  const { stallId, officerId, score, remarks } = req.body;

  if (!stallId || !officerId) {
    return res.status(400).json({ error: "stallId and officerId are required" });
  }
  if (score === undefined || score === null) {
    return res.status(400).json({ error: "score is required" });
  }
  if (typeof score !== "number" || score < 0 || score > 100) {
    return res.status(400).json({ error: "score must be a number between 0 and 100" });
  }
  if (remarks && remarks.length > 500) {
    return res.status(400).json({ error: "remarks cannot exceed 500 characters" });
  }

  next();
}

module.exports = validateInspection;