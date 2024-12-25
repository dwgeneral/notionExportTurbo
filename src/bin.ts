#!/usr/bin/env node

import sade from "sade"
import action, { FileType } from "./action"

const pkg = require("../package.json")

sade("notion-exporter <blockId>", true)
  .version(pkg.version)
  .describe(
    `Export a block, page or DB from Notion.so as Markdown, CSV, or Image. 
  The block/page is specified by its UUID or its URL, see examples below.

  To download any page, one has to provide the value of the Cookie 'token_v2'
  of a logged-in user on the official Notion.so website as 'NOTION_TOKEN'
  environment variable or via the prompt of the command.
  The user needs to have at least read access to the block/page to download.

  ${pkg.author}, 2022.`
  )
  .option("-t, --type", `File type to be exported: ${FileType}`, "md")
  .option("-o, --output", "Output file name", "")
  .option("-T, --template", "Template file name", "Simple")
  .option("-w, --width", "Width of exported images", "1200")
  .option("-q, --quality", "Quality of exported images", "90")
  .option("-f, --font", "Font of exported images")
  .option("-F, --footer", "Footer of exported images")
  .option("-r, --recursive", "Export children subpages", false)
  .option(
    "-a, --all-files",
    "Export image and pdf files, not only content",
    false
  )
  .example(
    "notion-exporter https://www.notion.so/Notion-Official-83715d7703ee4b8699b5e659a4712dd8"
  )
  .example("notion-exporter 83715d7703ee4b8699b5e659a4712dd8 -t md")
  .example("notion-exporter 3af0a1e347dd40c5ba0a2c91e234b2a5 -t csv > list.csv")
  .action(async (blockId, opts) => {
    // 检查 blockId 是否是 URL
    let id = blockId;
    if (blockId.startsWith('http')) {
      try {
        const url = new URL(blockId);
        const parts = url.pathname.slice(1).split('-');
        id = parts[parts.length - 1];
      } catch (e) {
        console.error(`Invalid URL: ${blockId}`);
        process.exit(1);
      }
    }

    return action(id, opts.type, {
      includeContents: opts["all-files"],
      recursive: opts.recursive,
      output: opts.output,
      template: opts.template,
      width: parseInt(opts.width),
      quality: parseInt(opts.quality),
      font: opts.font,
      footer: opts.footer
    })
  })
  .parse(process.argv)
