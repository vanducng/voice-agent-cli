import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createProgram, run } from "./cli";

const retellCommands = [
  "agent",
  "agent-publish",
  "agents",
  "batch-calls",
  "calls",
  "chat-agents",
  "chats",
  "concurrency",
  "exports",
  "flow-components",
  "flows",
  "kb",
  "llms",
  "login",
  "phone-numbers",
  "playground",
  "prompts",
  "tests",
  "tools",
  "transcripts",
  "voices",
].sort();

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe("voice-agent CLI", () => {
  it("exposes the upgrade utility and Retell as the only provider", () => {
    const program = createProgram();

    expect(program.name()).toBe("vac");
    expect(program.commands.map((command) => command.name())).toEqual([
      "upgrade",
      "retell",
    ]);
    expect(program.helpInformation()).toContain("upgrade");
    expect(program.helpInformation()).toContain("retell");
  });

  it("registers every existing command group under Retell", () => {
    const provider = createProgram().commands.find(
      (command) => command.name() === "retell",
    )!;

    expect(provider.name()).toBe("retell");
    expect(provider.commands.map((command) => command.name()).sort()).toEqual(
      retellCommands,
    );
  });

  it("documents paginated agent output and provider-owned prompt defaults", () => {
    const provider = createProgram().commands.find(
      (command) => command.name() === "retell",
    )!;
    const agents = provider.commands.find(
      (command) => command.name() === "agents",
    )!;
    const list = agents.commands.find((command) => command.name() === "list")!;
    const prompts = provider.commands.find(
      (command) => command.name() === "prompts",
    )!;

    let listHelp = "";
    list.configureOutput({ writeOut: (text) => (listHelp += text) });
    list.outputHelp();

    expect(list.options.map((option) => option.long)).toContain(
      "--pagination-key",
    );
    expect(listHelp).toContain("agent_id,agent_name,channel");
    expect(listHelp).toContain(".items[]");
    expect(listHelp).not.toContain("response_engine");

    for (const name of ["pull", "diff", "update"]) {
      const command = prompts.commands.find((entry) => entry.name() === name)!;
      expect(command.options[0].defaultValue).toBe(
        ".voice-agent/retell/prompts",
      );
    }
    const update = prompts.commands.find(
      (command) => command.name() === "update",
    )!;
    let updateHelp = "";
    update.configureOutput({ writeOut: (text) => (updateHelp += text) });
    update.outputHelp();
    expect(updateHelp).toContain("vac retell agents publish");

    const login = provider.commands.find(
      (command) => command.name() === "login",
    )!;
    let loginHelp = "";
    login.configureOutput({ writeOut: (text) => (loginHelp += text) });
    login.outputHelp();
    expect(loginHelp).toContain("$XDG_CONFIG_HOME/voice-agent/config.json");
    expect(loginHelp).toContain("./.voice-agent.json");
  });

  it("registers agent tag inspection and assignment", () => {
    const provider = createProgram().commands.find(
      (command) => command.name() === "retell",
    )!;
    const agents = provider.commands.find(
      (command) => command.name() === "agents",
    )!;
    const tags = agents.commands.find((command) => command.name() === "tags")!;

    expect(tags.commands.map((command) => command.name())).toEqual([
      "get",
      "assign",
    ]);
    expect(
      tags.commands
        .find((command) => command.name() === "assign")!
        .options.map((option) => option.long),
    ).toEqual(["--agent-version", "--dry-run"]);

    const phoneNumbers = provider.commands.find(
      (command) => command.name() === "phone-numbers",
    )!;
    const updatePhoneNumber = phoneNumbers.commands.find(
      (command) => command.name() === "update",
    )!;
    expect(updatePhoneNumber.options.map((option) => option.long)).toEqual(
      expect.arrayContaining([
        "--inbound-agent-version",
        "--outbound-agent-version",
      ]),
    );
  });

  it("rejects former flat commands", async () => {
    const program = createProgram();
    program.exitOverride();
    program.configureOutput({ writeErr: () => undefined });

    await expect(
      program.parseAsync(["node", "voice-agent", "agents"]),
    ).rejects.toMatchObject({ code: "commander.unknownCommand" });
  });

  it("runs through Commander parseAsync", async () => {
    const parseAsync = vi
      .spyOn(Command.prototype, "parseAsync")
      .mockResolvedValueOnce(new Command());

    await run(["node", "voice-agent", "retell"]);

    expect(parseAsync).toHaveBeenCalledWith(["node", "voice-agent", "retell"]);
  });

  it.each([
    [
      ["node", "vac", "unknown"],
      "Unknown command.",
      "Run `vac --help` to list valid options and arguments.",
    ],
    [
      ["node", "vac", "retell", "agents", "info"],
      "A required argument is missing.",
      "Run `vac retell agents info --help` to list valid options and arguments.",
    ],
  ])(
    "returns structured usage errors for %j",
    async (argv, message, nextStep) => {
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await run(argv);

      expect(error).toHaveBeenCalledOnce();
      expect(JSON.parse(String(error.mock.calls[0][0]))).toEqual({
        ok: false,
        error: {
          code: "CLI_USAGE_ERROR",
          message,
          retryable: false,
          next_steps: [expect.any(String)],
        },
      });
      expect(
        JSON.parse(String(error.mock.calls[0][0])).error.next_steps,
      ).toEqual([nextStep]);
      expect(process.exitCode).toBe(1);
    },
  );

  it("does not misclassify non-Commander failures", async () => {
    const failure = Object.assign(new Error("provider failed"), {
      code: "PROVIDER_ERROR",
      exitCode: 0,
    });
    vi.spyOn(Command.prototype, "parseAsync").mockRejectedValueOnce(failure);

    await expect(run(["node", "vac", "retell"])).rejects.toBe(failure);
  });

  it.each([
    ["agents", ["agents", "list", "--limit", "0"]],
    ["flows", ["flows", "list", "--limit", "0"]],
    ["tests", ["tests", "cases", "list", "--type", "invalid"]],
    ["transcripts", ["transcripts", "list", "--limit", "0"]],
    ["numeric flag", ["agents", "list", "--limit", "invalid"]],
  ])("returns structured validation errors for %s", async (_name, command) => {
    const stderr = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await run(["node", "vac", "retell", ...command]);

    expect(JSON.parse(String(stderr.mock.calls[0][0]))).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        retryable: false,
        next_steps: [expect.stringContaining("vac retell --help")],
      },
    });
    expect(exit).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it.each(["--help", "--version"])(
    "keeps %s human-readable and successful",
    async (flag) => {
      const stderr = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await run(["node", "vac", flag]);

      expect(stderr).not.toHaveBeenCalled();
      expect(process.exitCode).not.toBe(1);
    },
  );

  it("routes nested --version flags to the subcommand", async () => {
    const program = createProgram();
    const retell = program.commands.find(
      (command) => command.name() === "retell",
    )!;
    const agents = retell.commands.find(
      (command) => command.name() === "agents",
    )!;
    const publish = agents.commands.find(
      (command) => command.name() === "publish",
    )!;
    const action = vi.fn();
    publish.action(action);

    await program.parseAsync([
      "node",
      "vac",
      "retell",
      "agents",
      "publish",
      "agent_1",
      "--version",
      "0",
    ]);

    expect(action).toHaveBeenCalledWith(
      "agent_1",
      expect.objectContaining({ version: "0" }),
      publish,
    );
  });

  it("does not run the CLI when the entrypoint is imported", async () => {
    const parseAsync = vi.spyOn(Command.prototype, "parseAsync");

    await import("./index");

    expect(parseAsync).not.toHaveBeenCalled();
  });
});
