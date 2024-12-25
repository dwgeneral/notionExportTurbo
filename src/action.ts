import rl from "readline"
import { AxiosError } from "axios"
import fs from "fs"
import path from "path"

import { NotionExporter } from "./NotionExporter"
import { Config } from "./config"

export const FileType = ["md", "csv", "image"] as const
type FileType = (typeof FileType)[number]

const isFileType = (s: string): s is FileType => FileType.includes(s as any)

const askToken = (tokenName: string): Promise<string> => {
  const prompt = rl.createInterface({
    input: process.stdin,
    output: process.stderr,
  })
  const promise = new Promise<string>((resolve) =>
    prompt.question(`Paste your ${tokenName}:\n`, (token) => {
      resolve(token)
      prompt.close()
    })
  )
  return promise
}

const envOrAskToken = async (tokenName: string) =>
  process.env[tokenName] || (await askToken(tokenName))

const action = async (blockId: string, fileType: string, config?: Config & { output?: string }) => {
  console.log(`Exporting ${blockId} as ${fileType}`)
  if (!isFileType(fileType)) {
    console.log(`File type (-t, --type) has to be one of: ${FileType.join(',')}`)
    process.exit(1)
  }

  const tokenV2 = await envOrAskToken("NOTION_TOKEN")
  const fileToken = await envOrAskToken("NOTION_FILE_TOKEN")
  const exporter = new NotionExporter(tokenV2, fileToken, config)

  try {
    const content = await (
      fileType === "csv"
        ? exporter.getCsvString(blockId)
        : fileType === "md"
        ? exporter.getMdString(blockId)
        : exporter.getImage(blockId).then((buffer) => buffer)
    );

    if (config?.output) {
      // 确保输出目录存在
      const outputDir = path.dirname(config.output)
      const absolutePath = path.resolve(config.output)
      console.log(`Writing to absolute path: ${absolutePath}`)
      console.log(`Output directory: ${outputDir}`)
      
      if (!fs.existsSync(outputDir)) {
        console.log(`Creating directory: ${outputDir}`)
        fs.mkdirSync(outputDir, { recursive: true })
      }

      // 写入文件
      if (fileType === 'image' && Buffer.isBuffer(content)) {
        console.log(`Writing image buffer of size: ${content.length} bytes`)
        fs.writeFileSync(absolutePath, content)
      } else if (typeof content === 'string') {
        fs.writeFileSync(absolutePath, content)
      }
      console.log(`Successfully exported to ${absolutePath}`)
    } else {
      // 如果没有指定输出文件，则打印到控制台
      if (fileType === 'image' && Buffer.isBuffer(content)) {
        console.log(content.toString('base64'))
      } else {
        console.log(content)
      }
    }
  } catch (e) {
    if (e?.isAxiosError) {
      const axiosError = e as AxiosError
      console.log(axiosError.message)
      console.log(axiosError.response?.data)
    } else {
      console.log(e)
    }
    process.exit(1)
  }
}

export default action
