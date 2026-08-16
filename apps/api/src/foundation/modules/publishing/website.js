const { getRepository } = require("../../db");
const { renderReleasePage } = require("./website-template");

async function publish(release, upload) {
  const repo = getRepository();
  const html = renderReleasePage(release, upload);
  const integration = (await repo.listIntegrations()).find(i => i.provider === "website");
  const target = integration?.target_id || release.slug;
  const metadata = {
    url: `/releases/${release.slug}`,
    htmlBytes: Buffer.byteLength(html),
    rendered: true
  };
  return {
    status: "SUCCESS",
    provider: "website",
    externalId: target,
    publishedAt: new Date().toISOString(),
    error: null,
    metadata
  };
}

function preview(release, upload) {
  return renderReleasePage(release, upload);
}

module.exports = { publish, preview };