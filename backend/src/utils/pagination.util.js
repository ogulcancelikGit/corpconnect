const getPagination = (page = 1, limit = 10) => {
  const take = parseInt(limit)
  const skip = (parseInt(page) - 1) * take
  return { take, skip }
}

const getPaginationMeta = (total, page = 1, limit = 10) => {
  const totalPages = Math.ceil(total / parseInt(limit))
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNext: parseInt(page) < totalPages,
    hasPrev: parseInt(page) > 1,
  }
}

module.exports = { getPagination, getPaginationMeta }