import { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/kind.ts";
import {
  ActionArguments,
  ActionFlags,
  BaseKind,
  DduItem,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import { Denops } from "https://deno.land/x/denops_core@v5.0.0/mod.ts";

type Params = Record<string, unknown>;
type Never = Record<never, never>;

export type ActionData = {
  cwd: string;
  label: string;
  message: string;
};

async function ensureFirstItem(denops: Denops, items: DduItem[]) {
  if (items.length != 1) {
    await denops.call(
      "ddu#util#print_error",
      "invalid action calling: it can accept only one item",
      "ddu-kind-git_stash",
    );
    return;
  }
  return items[0];
}

const getCwd = (item: DduItem): string => {
  return (item.action as ActionData).cwd;
};

const getHash = (item: DduItem): string => {
  return (item.action as ActionData).label;
}

const executeGit = (
  args: string[],
  item: DduItem,
): Promise<Deno.CommandOutput> => {
  const cmd = new Deno.Command("git", {
    args: [...args, getHash(item)],
    cwd: getCwd(item),
  });
  return cmd.output();
};

export class Kind extends BaseKind<Params> {
  override actions: Record<
    string,
    (args: ActionArguments<Never>) => Promise<ActionFlags>
  > = {
    apply: async (args) => {
      const item = await ensureFirstItem(args.denops, args.items);
      if (!item) return ActionFlags.None;
      await executeGit(["stash", "apply"], item);
      return ActionFlags.RefreshItems;
    },
    pop: async (args) => {
      const item = await ensureFirstItem(args.denops, args.items);
      if (!item) return ActionFlags.None;
      await executeGit(["stash", "pop"], item);
      return ActionFlags.RefreshItems;
    },
    drop: async (args) => {
      const item = await ensureFirstItem(args.denops, args.items);
      if (!item) return ActionFlags.None;
      await executeGit(["stash", "drop"], item);
      return ActionFlags.RefreshItems;
    },
    clear: async (args) => {
      const item = await ensureFirstItem(args.denops, args.items);
      if (!item) return ActionFlags.None;
      await executeGit(["stash", "drop"], item);
      return ActionFlags.RefreshItems;
    },
  };

  getPreviewer(args: GetPreviewerArguments): Promise<Previewer | undefined> {
    const action = args.item.action as ActionData;
    return Promise.resolve({
      kind: "terminal",
      cmds: ["git", "stash", "show", "-p", action.label],
    });
  }

  params(): Params {
    return {};
  }
}
