/** Configuration options that are passed to the Notion API. */
export interface Config {
  /** Export embedded image and pdf files, not only the (text) content. Default: false */
  includeContents?: boolean
  /** Export children subpages recursively. Default: false */
  recursive?: boolean
  /** Default: UTC */
  timeZone?: string
  /** Default: en */
  locale?: string
  /** Export all blocks of the DB/page or just the ones in the current view. Default: "all" */
  collectionViewExportType?: "currentView" | "all"
  /** Poll export task finished interval in ms */
  pollInterval?: number
  /** Output file path */
  output?: string
  /** Template style for image export (Simple/Full) */
  template?: string
  /** Image width in pixels */
  width?: number
  /** Image quality (1-100) */
  quality?: number
  /** Custom font family for image export */
  font?: string
  /** Footer text for image export */
  footer?: string
}

export const defaultConfig: Config = {
  timeZone: "UTC",
  locale: "en",
  collectionViewExportType: "all",
  pollInterval: 500,
  template: "Simple",
  width: 1200,
  quality: 90
}
