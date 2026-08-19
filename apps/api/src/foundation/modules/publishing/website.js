const { getRepository } = require("../../db");
const { renderReleasePage } = require("./website-template");

async function siteOptions() {
  const repo = getRepository();
  const integration = (await repo.listIntegrations()).find(i => i.provider === "website");
  const config = integration?.config || {};
  return {
    publicDomain: String(config.publicDomain || ""),
    adminPanelUrl: String(config.adminPanelUrl || config.adminUrl || ""),
    siteName: String(config.siteName || "CrowMods"),
    siteDescription: String(config.siteDescription || "")
  };
}

async function publish(release, upload) {
  const repo = getRepository();
  const options = await siteOptions();
  const html = renderReleasePage(release, upload, options);
  const integration = (await repo.listIntegrations()).find(i => i.provider === "website");
  const target = integration?.target_id || release.slug;
  const base = options.publicDomain ? options.publicDomain.replace(/\/+$/, "") : "";
  const metadata = {
    url: base ? `${base}/releases/${release.slug}` : `/releases/${release.slug}`,
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

async function preview(release, upload) {
  return renderReleasePage(release, upload, await siteOptions());
}

module.exports = { publish, preview, siteOptions };
