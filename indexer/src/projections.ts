import type { IndexedAgentEvent, IndexedJobEvent } from "@arclayer/sdk";

export function buildJobProjection(events: IndexedJobEvent[]) {
  return events.reduce<Record<string, IndexedJobEvent[]>>((acc, event) => {
    const key = String(event.jobId ?? "unassigned");
    acc[key] ??= [];
    acc[key].push(event);
    return acc;
  }, {});
}

export function buildAgentEventProjection(events: IndexedJobEvent[]) {
  return events.reduce<Record<string, IndexedJobEvent[]>>((acc, event) => {
    const key = String((event as any).provider ?? (event as any).agentId ?? "unknown").toLowerCase();
    acc[key] ??= [];
    acc[key].push(event);
    return acc;
  }, {});
}

export function projectJobsFromEvents(events: IndexedJobEvent[]) {
  const byJob = buildJobProjection(events);

  return Object.entries(byJob).map(([id, jobEvents]) => {
    const created = jobEvents.find((event) => event.eventName === "JobCreated") as any;
    const latestBudget = [...jobEvents].reverse().find((event) => event.eventName === "BudgetSet") as any;
    const fundedEvents = jobEvents.filter((event) => event.eventName === "JobFunded") as any[];
    const submitted = [...jobEvents].reverse().find((event) => event.eventName === "JobSubmitted") as any;
    const completed = [...jobEvents].reverse().find((event) => event.eventName === "JobCompleted") as any;

    const totalFunded = fundedEvents.reduce((sum, event) => sum + BigInt(event.amount ?? 0), BigInt(0));
    const budget = BigInt(latestBudget?.budget ?? created?.maxBudget ?? 0);
    const status = completed ? 4 : submitted ? 3 : totalFunded > BigInt(0) ? 2 : created ? 1 : 0;

    return {
      id,
      provider: created?.provider ?? "0x0000000000000000000000000000000000000000",
      client: created?.client ?? "0x0000000000000000000000000000000000000000",
      paymentToken: created?.paymentToken ?? "0x0000000000000000000000000000000000000000",
      maxBudget: String(created?.maxBudget ?? budget),
      budget: budget.toString(),
      fundedAmount: totalFunded.toString(),
      metadataURI: created?.metadataURI ?? "",
      submissionURI: submitted?.submissionURI ?? "",
      completionURI: completed?.completionURI ?? "",
      createdAtBlock: String(created?.blockNumber ?? jobEvents[0]?.blockNumber ?? 0),
      updatedAtBlock: String(jobEvents[jobEvents.length - 1]?.blockNumber ?? 0),
      status,
      events: jobEvents,
    };
  });
}

export function projectAgentsFromEvents(events: IndexedAgentEvent[]) {
  const byId = events.reduce<Record<string, IndexedAgentEvent>>((acc, event) => {
    acc[String(event.agentId)] = event;
    return acc;
  }, {});

  return Object.values(byId).map((event) => ({
    agentId: String(event.agentId),
    tokenId: String(event.agentId),
    controller: event.controller,
    metadataURI: event.metadataURI ?? "",
    registeredAtBlock: String(event.blockNumber),
    transactionHash: event.transactionHash,
  }));
}

export async function buildJobsProjection(events: IndexedJobEvent[] = []) {
  return projectJobsFromEvents(events);
}

export async function buildJobDetailProjection(jobId: bigint, events: IndexedJobEvent[] = []) {
  const job = projectJobsFromEvents(events).find((entry) => entry.id === jobId.toString());
  if (!job) return null;
  return { job, proof: null };
}

export async function buildAgentsProjection(agentEvents: IndexedAgentEvent[] = []) {
  return projectAgentsFromEvents(agentEvents);
}

export async function buildAgentDetailProjection(
  agentId: bigint,
  agentEvents: IndexedAgentEvent[] = [],
  jobEvents: IndexedJobEvent[] = [],
) {
  const agent = projectAgentsFromEvents(agentEvents).find((entry) => entry.agentId === agentId.toString());
  if (!agent) return null;

  const jobs = projectJobsFromEvents(jobEvents).filter(
    (job) => job.provider?.toLowerCase() === agent.controller.toLowerCase() || job.client?.toLowerCase() === agent.controller.toLowerCase(),
  );

  return {
    agent,
    jobs,
    proofs: [],
  };
}

export async function buildProofsProjection() {
  // ERC-8183 reference flow does not mint ArcLayer custom WorkProof NFTs.
  return [];
}

export async function buildOverviewProjection(
  jobEvents: IndexedJobEvent[],
  agentEvents: IndexedAgentEvent[] = [],
) {
  const jobs = projectJobsFromEvents(jobEvents);
  const agents = projectAgentsFromEvents(agentEvents);
  const proofs: unknown[] = [];

  const totalBudget = jobs.reduce((sum, job) => sum + BigInt(job.budget), BigInt(0));
  const totalFunded = jobs.reduce((sum, job) => sum + BigInt(job.fundedAmount), BigInt(0));
  const completedJobs = jobs.filter((job) => job.status === 4).length;
  const fundedJobs = jobs.filter((job) => BigInt(job.fundedAmount) > BigInt(0)).length;

  return {
    summary: {
      eventCount: jobEvents.length + agentEvents.length,
      jobs: jobs.length,
      agents: agents.length,
      proofs: proofs.length,
      totalBudget: totalBudget.toString(),
      totalFunded: totalFunded.toString(),
      settledJobs: completedJobs,
      fundedJobs,
    },
    jobs,
    agents,
    proofs,
  };
}
