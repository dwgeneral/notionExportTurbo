#!/usr/bin/env node

import sade from 'sade';
import { NotionExporter } from './NotionExporter';
import fs from 'fs';
import path from 'path';

const prog = sade('notion-exporter');

// 获取环境变量
const tokenV2 = process.env.NOTION_TOKEN_V2;
const fileToken = process.env.NOTION_FILE_TOKEN || '';

if (!tokenV2) {
  console.error('Error: NOTION_TOKEN_V2 environment variable is not set');
  process.exit(1);
}

prog
  .version('0.6.2')
  .command('export <blockId>')
  .option('-t, --type', 'Export type (md/csv/image)', 'md')
  .option('-o, --output', 'Output file path')
  .option('--current-view', 'Export only the current view for CSV export', false)
  // 图片导出相关选项
  .option('--template', 'Template style for image export (Simple/Full)', 'Simple')
  .option('--width', 'Image width in pixels', '1200')
  .option('--quality', 'Image quality (1-100)', '90')
  .option('--font', 'Custom font family for image export')
  .option('--footer', 'Footer text for image export')
  .action(async (blockId: string, opts: any) => {
    try {
      const exporter = new NotionExporter(tokenV2, fileToken);
      
      const config = {
        recursive: true,
        includeContents: true,
        template: opts.template,
        width: parseInt(opts.width),
        quality: parseInt(opts.quality),
        font: opts.font,
        footer: opts.footer
      };

      if (opts.type === 'md') {
        // 导出为 Markdown
        const content = await exporter.getMdString(blockId);
        await action(blockId, opts.type, { ...config, content });
      } else if (opts.type === 'csv') {
        // 导出为 CSV
        const content = await exporter.getCsvString(blockId, opts.currentView);
        await action(blockId, opts.type, { ...config, content });
      } else if (opts.type === 'image') {
        // 导出为图片
        const imageBuffer = await exporter.getImage(blockId, config);
        await action(blockId, opts.type, { ...config, imageBuffer });
      } else {
        console.error(`Error: Unknown export type: ${opts.type}. Must be one of: md, csv, image`);
        process.exit(1);
      }

      // 如果 action 成功执行，并且指定了输出文件
      if (opts.output) {
        // TODO: 实现文件输出
        console.log(`Successfully exported to ${opts.output}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      process.exit(1);
    }
  });

prog.parse(process.argv);

async function action(blockId: string, type: string, config: any) {
  // TODO: 实现 action 函数
}
