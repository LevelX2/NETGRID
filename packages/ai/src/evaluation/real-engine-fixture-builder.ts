import type { CardInstanceId, GameState, ServerId } from "@netgrid/shared";

export type RealEngineFixtureMutator = (
  fixture: RealEngineFixtureBuilder,
) => void;

export class RealEngineFixtureBuilder {
  private constructor(private readonly state: GameState) {}

  static forState(state: GameState): RealEngineFixtureBuilder {
    return new RealEngineFixtureBuilder(state);
  }

  withRunnerCredits(credits: number): this {
    this.state.runner.credits = credits;
    return this;
  }

  withCorpCredits(credits: number): this {
    this.state.corp.credits = credits;
    return this;
  }

  withRunnerClicks(clicks: number): this {
    this.state.runner.clicks = clicks;
    return this;
  }

  withRunnerTags(tags: number): this {
    this.state.runner.tags = tags;
    return this;
  }

  withRunnerGripSize(size: number): this {
    this.state.runner.grip = this.state.runner.grip.slice(0, size);
    return this;
  }

  withCorpHqSize(size: number): this {
    this.state.corp.hq = this.state.corp.hq.slice(0, size);
    return this;
  }

  withCorpRemoteAgenda(
    serverId: Exclude<ServerId, "new_remote">,
    advancementCounters: number,
    options: { faceup?: boolean; rezzed?: boolean } = {},
  ): this {
    this.withCorpRootOnServer(serverId, "simple_agenda", advancementCounters, options);
    return this;
  }

  withCorpRemoteRoot(
    serverId: Exclude<ServerId, "new_remote">,
    definitionId: string,
    advancementCounters = 0,
    options: { faceup?: boolean; rezzed?: boolean } = {},
  ): this {
    this.withCorpRootOnServer(serverId, definitionId, advancementCounters, options);
    return this;
  }

  withCorpIceOnServer(
    serverId: Exclude<ServerId, "new_remote">,
    definitionId: string,
  ): this {
    this.ensureServer(serverId);
    const server = this.state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) throw new Error(`Missing server ${serverId}`);
    const id = this.findCard(definitionId);
    this.removeEverywhere(id);
    server.ice.push(id);
    this.state.cardInstances[id] = {
      ...this.state.cardInstances[id]!,
      zone: { side: "corp", zone: "serverIce", serverId },
      faceup: false,
      rezzed: false,
    };
    return this;
  }

  withCorpRezWindow(corpCredits: number): this {
    return this.withCorpIceOnServer("hq", "simple_barrier_ice")
      .withRunnerCredits(6)
      .withCorpCredits(corpCredits);
  }

  ensureServer(serverId: Exclude<ServerId, "new_remote">): this {
    if (this.state.corp.servers.some((server) => server.id === serverId)) {
      return this;
    }
    if (!serverId.startsWith("remote_")) {
      throw new Error(`Missing central server ${serverId}`);
    }
    this.state.corp.servers.push({
      id: serverId,
      kind: "remote",
      label: `Remote ${serverId.slice("remote_".length)}`,
      ice: [],
      root: [],
    });
    return this;
  }

  private withCorpRootOnServer(
    serverId: Exclude<ServerId, "new_remote">,
    definitionId: string,
    advancementCounters: number,
    options: { faceup?: boolean; rezzed?: boolean },
  ): CardInstanceId {
    this.ensureServer(serverId);
    const server = this.state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) throw new Error(`Missing server ${serverId}`);
    const id = this.findCard(definitionId);
    this.removeEverywhere(id);
    server.root.push(id);
    this.state.cardInstances[id] = {
      ...this.state.cardInstances[id]!,
      zone: { side: "corp", zone: "serverRoot", serverId },
      faceup: options.faceup ?? false,
      rezzed: options.rezzed ?? false,
      advancementCounters,
    };
    return id;
  }

  private findCard(definitionId: string): CardInstanceId {
    const entry = Object.entries(this.state.cardInstances).find(
      ([, card]) => card.definitionId === definitionId,
    );
    if (!entry) throw new Error(`Missing ${definitionId}`);
    return entry[0] as CardInstanceId;
  }

  private removeEverywhere(id: string): void {
    this.state.corp.hq = this.state.corp.hq.filter((cardId) => cardId !== id);
    this.state.corp.rd = this.state.corp.rd.filter((cardId) => cardId !== id);
    this.state.corp.archives = this.state.corp.archives.filter(
      (cardId) => cardId !== id,
    );
    this.state.corp.scoreArea = this.state.corp.scoreArea.filter(
      (cardId) => cardId !== id,
    );
    for (const server of this.state.corp.servers) {
      server.ice = server.ice.filter((cardId) => cardId !== id);
      server.root = server.root.filter((cardId) => cardId !== id);
    }
    this.state.runner.grip = this.state.runner.grip.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.stack = this.state.runner.stack.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.heap = this.state.runner.heap.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.scoreArea = this.state.runner.scoreArea.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.rig.programs = this.state.runner.rig.programs.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.rig.hardware = this.state.runner.rig.hardware.filter(
      (cardId) => cardId !== id,
    );
    this.state.runner.rig.resources = this.state.runner.rig.resources.filter(
      (cardId) => cardId !== id,
    );
  }
}
