import type { Denops } from "https://deno.land/x/ddu_vim@v4.1.0/deps.ts";
import * as batch from "https://deno.land/x/denops_std@v6.5.0/batch/batch.ts";

export async function echoerr(denops: Denops, msg: string) {
  await batch.batch(denops, async (denops) => {
    await denops.cmd("echohl Error");
    await denops.cmd(`echomsg msg`, { msg: `[ddu-source-git_stash] ${msg}` });
    await denops.cmd("echohl None");
  });
}

export class ErrorStream extends WritableStream<string> {
  constructor(denops: Denops) {
    super({
      write: async (chunk, _controller) => {
        await echoerr(denops, chunk);
      },
    });
  }
}
