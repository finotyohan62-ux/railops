function extractPreviewModules(html) {
  return [...new Set(
    [...String(html ?? '').matchAll(/\.\/(v150b2b-[a-z0-9-]+\.js)\?build=/gi)]
      .map(match => match[1])
  )].sort();
}

module.exports = { extractPreviewModules };
