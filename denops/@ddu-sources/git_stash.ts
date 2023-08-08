import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.6/base/source.ts";
import { fn } from "https://deno.land/x/ddu_vim@v3.4.6/deps.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.6/types.ts";
import { TextLineStream } from "https://deno.land/std@0.196.0/streams/text_line_stream.ts";
import * as chunkedStream from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";

import { ActionData } from "../@ddu-kinds/git_stash.ts";
import { ErrorStream } from "../ddu-source-git_stash/stream.ts";

type Params = {
  cwd?: string;
};

function parseLine(cwd: string, line: string): Item<ActionData> {
  const pattern = /(stash@\{\d+\}): (.*)$/;
  const match = line.match(pattern);
  if (!match) throw new Error(`Invalid line: ${line}`);
  const [label, message] = [match[1], match[2]];
  return {
    word: line,
    display: line,
    action: { cwd, label, message },
  };
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "git_stash";

  override gather({ denops, sourceParams }: GatherArguments<Params>) {
    return new ReadableStream<Item<ActionData>[]>({
      async start(controller) {
        const cwd = sourceParams.cwd ?? (await fn.getcwd(denops));
        const { status, stderr, stdout } = new Deno.Command("git", {
          args: ["stash", "list"],
          cwd,
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();
        status.then((code) => {
          if (code.success) return;
          stderr
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new TextLineStream())
            .pipeTo(new ErrorStream(denops));
        });

        stdout
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new TextLineStream())
          .pipeThrough(
            new chunkedStream.ChunkedStream({
              chunkSize: 1000,
            }),
          )
          .pipeTo(
            new WritableStream<string[]>({
              write: (chunk: string[]) => {
                controller.enqueue(chunk.map((line) => parseLine(cwd, line)));
              },
            }),
          )
          .finally(() => controller.close());
      },
    });
  }

  override params(): Params {
    return {};
  }
}
