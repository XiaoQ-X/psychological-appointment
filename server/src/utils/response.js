function success(res, data = {}, message = "操作成功") {
  return res.json({ success: true, message, data });
}

function fail(res, status = 400, message = "操作失败", error = {}) {
  return res.status(status).json({ success: false, message, error });
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { success, fail, asyncHandler };
