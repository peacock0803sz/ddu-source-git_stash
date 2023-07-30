import { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/kind.ts";
import {
  ActionArguments,
  ActionFlags,
  BaseKind,
  DduItem,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";

type Params = Record<string, unknown>;
type Never = Record<never, never>;

export type ActionData = {
  cwd: string;
  label: string;
  message: string;
};

const getCwd = (item: DduItem): string => {
  return (item.action as ActionData).cwd;
};

const executeGit = (
  args: string[],
  items: DduItem[],
): Promise<Deno.CommandOutput> => {
  const cmd = new Deno.Command("git", {
    args: args,
    cwd: getCwd(items[0]),
  });
  return cmd.output();
};

export class Kind extends BaseKind<Params> {
  override actions: Record<
    string,
    (args: ActionArguments<Never>) => Promise<ActionFlags>
  > = {
    apply: async (args) => {
      const label: string = args.items[0].action?.label; // FIXME: type puzzle
      await executeGit(["stash", "apply", label], args.items);
      return ActionFlags.RefreshItems;
    },
    pop: async (args) => {
      const label: string = args.items[0].action?.label; // FIXME: type puzzle
      await executeGit(["stash", "pop", label], args.items);
      return ActionFlags.RefreshItems;
    },
    drop: async (args) => {
      const label: string = args.items[0].action?.label; // FIXME: type puzzle
      await executeGit(["stash", "drop", label], args.items);
      return ActionFlags.RefreshItems;
    },
    clear: async (args) => {
      const label: string = args.items[0].action?.label; // FIXME: type puzzle
      await executeGit(["stash", "clear", label], args.items);
      return ActionFlags.RefreshItems;
    }
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
