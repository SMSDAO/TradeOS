describe('agentic swarm workflow', () => {
  type Agent = {
    id: string;
    execute(task: string): string;
  };

  const initAgent = (id: string): Agent => ({
    id,
    execute: (task: string) => `${id}:${task}:done`,
  });

  const delegateTask = (agent: Agent, task: string): string => agent.execute(task);

  const aggregateResults = (results: string[]): string => results.join('|');

  it('initializes agents, delegates tasks, and aggregates results', () => {
    const agents = [initAgent('agent-a'), initAgent('agent-b')];

    const results = [
      delegateTask(agents[0], 'scan-market'),
      delegateTask(agents[1], 'verify-signature'),
    ];

    expect(results).toEqual(['agent-a:scan-market:done', 'agent-b:verify-signature:done']);
    expect(aggregateResults(results)).toBe('agent-a:scan-market:done|agent-b:verify-signature:done');
  });
});
