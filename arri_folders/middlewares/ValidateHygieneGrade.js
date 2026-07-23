function validateHygieneGrade(req, res, next) {
  const { inspectionId, validFrom, validTo } = req.body;

  if (!inspectionId) {
    return res.status(400).json({ error: "inspectionId is required" });
  }
  if (!validFrom || !validTo) {
    return res.status(400).json({ error: "validFrom and validTo are required" });
  }
  if (new Date(validTo) <= new Date(validFrom)) {
    return res.status(400).json({ error: "validTo must be after validFrom" });
  }

  next();
}

module.exports = validateHygieneGrade;