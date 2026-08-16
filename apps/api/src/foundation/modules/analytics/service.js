const { getRepository } = require("../../db");

async function dashboard() {
  const repo = getRepository();
  const [releaseCounts, uploadCounts, publishCounts, customers, users, jobs, auditCount] = await Promise.all([
    repo.countReleasesByStatus(),
    repo.countUploadsByStatus(),
    repo.countPublishingJobsByStatus(),
    repo.countCustomers(),
    repo.listUsers(),
    repo.listJobs({ limit: 100000 }),
    repo.countAuditLogs()
  ]);

  const totalReleases = Object.values(releaseCounts).reduce((a, b) => a + b, 0);
  const totalUploads = Object.values(uploadCounts).reduce((a, b) => a + b, 0);
  const totalPublishingJobs = Object.values(publishCounts).reduce((a, b) => a + b, 0);
  const published = releaseCounts.PUBLISHED || 0;
  const failedPublishing = publishCounts.FAILED || 0;
  const processing = (releaseCounts.PROCESSING || 0) + (releaseCounts.PUBLISHING || 0);

  return {
    totalReleases,
    pendingApproval: releaseCounts.READY_FOR_REVIEW || 0,
    published,
    failed: failedPublishing,
    processing,
    totalUploads,
    activeCustomers: customers,
    activeUsers: users.length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === "QUEUED" || j.status === "PROCESSING").length,
    auditEvents: auditCount,
    publishingJobs: totalPublishingJobs,
    failedPublishingJobs: failedPublishing
  };
}

async function analytics({ days = 30 } = {}) {
  const repo = getRepository();
  const since = new Date(Date.now() - days * 86400000);
  const [uploads, releases, jobs, publishingJobs] = await Promise.all([
    repo.listUploads({ limit: 100000 }),
    repo.listReleases({ limit: 100000 }),
    repo.listJobs({ limit: 100000 }),
    repo.listPublishingJobs({ limit: 100000 })
  ]);

  const countSince = (rows, field) => rows.filter(r => new Date(r[field] || r.created_at) >= since).length;

  const approved = releases.filter(r => r.status === "APPROVED" || r.status === "PUBLISHED").length;
  const published = releases.filter(r => r.status === "PUBLISHED").length;
  const failed = publishingJobs.filter(j => j.status === "FAILED").length;
  const successful = publishingJobs.filter(j => j.status === "SUCCESS").length;
  const total = publishingJobs.length;

  const providerStats = {};
  for (const j of publishingJobs) {
    if (!providerStats[j.provider]) providerStats[j.provider] = { total: 0, success: 0, failed: 0 };
    providerStats[j.provider].total++;
    if (j.status === "SUCCESS") providerStats[j.provider].success++;
    if (j.status === "FAILED") providerStats[j.provider].failed++;
  }

  const durations = [];
  for (const j of publishingJobs) {
    if (j.started_at && j.completed_at) {
      durations.push(new Date(j.completed_at) - new Date(j.started_at));
    }
  }
  const avgJobDurationMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return {
    periodDays: days,
    uploads: countSince(uploads),
    releases: countSince(releases),
    approved,
    published,
    failedPublications: failed,
    publishingJobsTotal: total,
    publishingJobsSuccess: successful,
    providerSuccessRate: providerStats,
    avgJobDurationMs
  };
}

module.exports = { dashboard, analytics };