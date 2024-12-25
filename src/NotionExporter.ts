import axios, { AxiosInstance } from "axios"
import AdmZip from "adm-zip"
import puppeteer from "puppeteer"
import { validateUuid } from "./blockId"
import { Config, defaultConfig } from "./config"

interface Task {
  id: string
  state: string
  status: { exportURL?: string }
}

interface ImageExportOptions {
  template?: 'Simple' | 'Full' | string;  // 模板样式
  font?: string;                          // 字体
  footer?: string;                        // 页脚文本
  width?: number;                         // 图片宽度
  quality?: number;                       // 图片质量 1-100
}

/** Lightweight client to export ZIP, Markdown or CSV files from a Notion block/page. */
export class NotionExporter {
  protected readonly client: AxiosInstance
  private readonly config: Config

  /**
   * Create a new NotionExporter client. To export any blocks/pages from
   * Notion.so one needs to provide the token of a user who has read access to
   * the corresponding pages.
   *
   * @param tokenV2 – the Notion `token_v2` Cookie value
   * @param fileToken – the Notion `file_token` Cookie value
   */
  constructor(tokenV2: string, fileToken: string, config?: Config) {
    this.client = axios.create({
      baseURL: "https://www.notion.so/api/v3/",
      headers: {
        Cookie: `token_v2=${tokenV2};file_token=${fileToken}`,
      },
    })
    this.config = Object.assign(defaultConfig, config)
  }

  /**
   * Adds a an 'exportBlock' task to the Notion API's queue of tasks.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @returns The task's id
   */
  async getTaskId(idOrUrl: string): Promise<string> {
    const id = validateUuid(idOrUrl)
    if (!id) return Promise.reject(`Invalid blockId: ${idOrUrl}`)

    const { recursive, includeContents, ...config } = this.config
    const res = await this.client.post("enqueueTask", {
      task: {
        eventName: "exportBlock",
        request: {
          block: { id },
          // Recursive needs to be set
          recursive: !!recursive,
          exportOptions: {
            exportType: "markdown",
            includeContents: !includeContents ? "no_files" : undefined,
            ...config,
          },
        },
      },
    })
    return res.data.taskId
  }

  private getTask = async (taskId: string): Promise<Task> => {
    const res = await this.client.post("getTasks", { taskIds: [taskId] })
    return res.data.results.find((t: Task) => t.id === taskId)
  }

  private pollTask = (taskId: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const interval = this.config.pollInterval || defaultConfig.pollInterval
      const poll = async () => {
        const task = await this.getTask(taskId)
        if (task.state === "success" && task.status.exportURL)
          resolve(task.status.exportURL)
        else if (task.state === "in_progress" || task.state === "not_started") {
          setTimeout(poll, interval)
        } else {
          console.error(taskId, task)
          reject(`Export task failed: ${taskId}.`)
        }
      }
      setTimeout(poll, interval)
    })

  /**
   * Starts an export of the given block and
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @returns The URL of the exported ZIP archive
   */
  getZipUrl = (idOrUrl: string): Promise<string> =>
    this.getTaskId(idOrUrl).then(this.pollTask)

  /**
   * Downloads the ZIP at the given URL.
   *
   * @returns The ZIP as an 'AdmZip' object
   */
  private downloadZip = async (url: string): Promise<AdmZip> => {
    const res = await this.client.get(url, { responseType: "arraybuffer" })
    return new AdmZip(res.data)
  }

  getZip = (idOrUrl: string): Promise<AdmZip> =>
    this.getZipUrl(idOrUrl).then(this.downloadZip)

  /**
   * Downloads and extracts all files in the exported zip to the given folder.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @param path Folder path where the files are unzipped
   */
  getMdFiles = async (idOrUrl: string, path: string): Promise<void> => {
    const zip = await this.getZip(idOrUrl)
    zip.extractAllTo(path)
  }

  /**
   * Exports the given block as ZIP and downloads it. Returns the matched file
   * in the ZIP as a string.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @param predicate - Returns true for the zip entry to be extracted
   * @returns The matched file as string
   */
  async getFileString(
    idOrUrl: string,
    predicate: (entry: AdmZip.IZipEntry) => boolean
  ): Promise<string> {
    const zip = await this.getZip(idOrUrl)
    const entry = zip.getEntries().find(predicate)
    return (
      entry?.getData().toString().trim() ||
      Promise.reject("Could not find file in ZIP.")
    )
  }

  /**
   * Downloads and extracts the first CSV file of the exported block as string.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @returns The extracted CSV string
   */
  getCsvString = (
    idOrUrl: string,
    onlyCurrentView?: boolean
  ): Promise<string> =>
    this.getFileString(idOrUrl, (e) =>
      e.name.endsWith(onlyCurrentView ? ".csv" : "_all.csv")
    )

  /**
   * Downloads and extracts the first Markdown file of the exported block as string.
   *
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @returns The extracted Markdown string
   */
  getMdString = (idOrUrl: string): Promise<string> =>
    this.getFileString(idOrUrl, (e) => e.name.endsWith(".md"))

  /**
   * Exports the given block as an image with custom styling options.
   * 
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @param options Image export options including template, font, footer etc.
   * @returns The image data as Buffer
   */
  async getImage(idOrUrl: string, options: ImageExportOptions = {}): Promise<Buffer> {
    try {
      // 先获取 Markdown 内容
      const markdown = await this.getMdString(idOrUrl);
      
      // 使用 Puppeteer 渲染并截图
      const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
          width: options.width || 1920,
          height: 1080,
          deviceScaleFactor: 2,
        },
      });

      const page = await browser.newPage();
      
      // 注入 Markdown 样式和内容
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Notion Export</title>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <style>
            body {
              font-family: ${options.font || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'};
              line-height: 1.6;
              max-width: ${options.width ? options.width + 'px' : '90%'};
              margin: 0 auto;
              padding: 20px;
              color: #37352f;
            }
            
            h1, h2, h3, h4, h5, h6 {
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 600;
              line-height: 1.25;
            }
            
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.25em; }
            
            p, ul, ol {
              margin-bottom: 16px;
            }
            
            code {
              background-color: rgba(135,131,120,0.15);
              color: #eb5757;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 85%;
              font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            }
            
            pre code {
              background-color: #f6f8fa;
              color: #333;
              padding: 16px;
              display: block;
              overflow-x: auto;
            }
            
            blockquote {
              margin: 0;
              padding-left: 1em;
              border-left: 3px solid #ddd;
              color: #6a737d;
            }
            
            img {
              max-width: 100%;
              height: auto;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 16px;
            }
            
            th, td {
              padding: 6px 13px;
              border: 1px solid #dfe2e5;
            }
            
            tr:nth-child(2n) {
              background-color: #f6f8fa;
            }
            
            ${options.template === 'Simple' ? `
              body { max-width: 800px; }
              h1 { text-align: center; }
            ` : ''}
            
            ${options.template === 'Full' ? `
              body {
                max-width: 1200px;
                background-color: #ffffff;
              }
              h1 {
                padding: 40px 0;
                text-align: center;
                background-color: #2eaadc;
                color: white;
                margin: -20px -20px 20px -20px;
              }
            ` : ''}
          </style>
        </head>
        <body>
          <div id="content"></div>
          ${options.footer ? `<footer style="text-align: center; margin-top: 40px; color: #666;">${options.footer}</footer>` : ''}
          <script>
            document.getElementById('content').innerHTML = marked.parse(\`${markdown.replace(/`/g, '\\`')}\`);
          </script>
        </body>
        </html>
      `);

      // 等待内容渲染完成
      await page.waitForSelector('#content');
      
      // 获取实际内容高度
      const bodyHandle = await page.$('body');
      if (!bodyHandle) {
        throw new Error('Failed to find body element');
      }
      const boundingBox = await bodyHandle.boundingBox();
      if (!boundingBox) {
        throw new Error('Failed to get body dimensions');
      }
      const { height } = boundingBox;
      await bodyHandle.dispose();
      
      // 调整视口高度以适应内容
      await page.setViewport({
        width: options.width || 1920,
        height: Math.ceil(height),
        deviceScaleFactor: 2,
      });

      // 截图
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
        omitBackground: false,
      });

      await browser.close();
      return Buffer.from(screenshot);
      
    } catch (error) {
      console.error('Export to image failed:', error);
      throw error;
    }
  }

  /**
   * Saves the page as an image file with custom styling options.
   * 
   * @param idOrUrl BlockId or URL of the page/block/DB to export
   * @param filePath Path where to save the image
   * @param options Image export options including template, font, footer etc.
   */
  async saveAsImage(
    idOrUrl: string, 
    filePath: string,
    options: ImageExportOptions = {}
  ): Promise<void> {
    const imageBuffer = await this.getImage(idOrUrl, options)
    const fs = require('fs').promises
    await fs.writeFile(filePath, imageBuffer)
  }
}
