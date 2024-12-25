# Notion Exporter 🛫

A simple CLI tool and TypeScript library for exporting Markdown and CSV files
from any [Notion.so](https://notion.so) page. The tool relies on the export
feature of Notion's web-app, hence you get exactly the Markdown and CSV you'd
get from clicking through: _••• > Export > Markdown & CSV, no subpages, OK._

## CLI

The CLI let's you download pages as part of any script, build step or content
pipeline. For example, you can use Notion as a CMS to write your blog, export
the Markdown in a Github action and build a static Hugo page. 🎉

```bash
npm install -g notion-exporter
notion-exporter 3af0a1e347dd40c5ba0a2c91e234b2a5 -t csv > list.csv
```

For more options, try `notion-exporter --help` and read about the
[needed Cookies](#needed-cookies).

## Library

With the library you can do more elaborate things like directly parse and use
your CSV, inject the Markdown in any React/Next.js/Vue page or interact with the
underlying [`AdmZip`](https://github.com/cthackers/adm-zip) object.

```ts
import NotionExporter from "notion-exporter"

const tokenV2 = ...
const fileToken = ...
const blockId = "3af0a1e347dd40c5ba0a2c91e234b2a5"

await new NotionExporter(tokenV2, fileToken).getMdString(blockId)
```

### API

Check the doc comments in [`NotionExporter.ts`](./src/NotionExporter.ts) for the
most accurate information.

#### Constructor

Provide the [required Cookies](#needed-cookies) as authentification to create a
new exporter client. For configuration options,
[refer to the definition](./src/config.ts).

```ts
const exporter = new NotionExporter(tokenV2: string, fileToken: string, config?: Config)
```

#### Methods

Download and extract the first file of the requested type and return it as
string.

```ts
exporter.getCsvString(blockIdOrUrl: string): Promise<string>
exporter.getMdString(blockIdOrUrl: string): Promise<string>
```

Start an export of the given block and get the exported archive's URL. The
second method also downloads the ZIP and gives full access to the
[`AdmZip`](https://github.com/cthackers/adm-zip) object.

```ts
exporter.getZipUrl(blockIdOrUrl: string): Promise<string>
exporter.getZip(blockIdOrUrl: string): Promise<AdmZip>
```

To get all files of the exported zip use:

```ts
exporter.getMdFiles(blockIdOrUrl: string, folderPath: string): Promise<void>
```

## Needed Cookies

To export anything from Notion, one needs to authenticate oneself with some
Cookies (like a browser would). These cookies are called `token_v2` and
`file_token`. They are set on all requests of a logged in user when using the
Notion web-app.

### How to retrieve the Cookies?

- Go to [notion.so](https://notion.so).
- Log in with your account.
- Open the developer tools of your browser, open Application > Storage > Cookies
  (Chrome); Storage tab (Firefox).
- Copy the value of the Cookies called `token_v2` and `file_token` and paste
  them somewhere safe.

### How to get the block ID of a page?

To download a page or table you need its block ID. The block ID is usually the
last part of its URL. For example on
[this page](https://www.notion.so/Notion-Official-83715d7703ee4b8699b5e659a4712dd8)
with URL:

```
https://www.notion.so/Notion-Official-83715d7703ee4b8699b5e659a4712dd8
```

the ID is `83715d7703ee4b8699b5e659a4712dd8`. So you can get the page as
Markdown by doing `notion-exporter 83715d7703ee4b8699b5e659a4712dd8`.

For tables, the ID is the first of the two long hexadecimal strings. Take
[this gallery](https://www.notion.so/228eea9d563a47f09fc594d0a89a2e18?v=d5bcf2644d2940b1b18a9ba9cc11c9b6)
for example with URL:

```
https://www.notion.so/228eea9d563a47f09fc594d0a89a2e18?v=d5bcf2644d2940b1b18a9ba9cc11c9b6
```

the ID is `228eea9d563a47f09fc594d0a89a2e18`. So, you can get the table as CSV
by doing `notion-exporter 228eea9d563a47f09fc594d0a89a2e18 -t csv`.

## Note on Stability

This tool completely relies on the export/download feature of the official _but
internal_ Notion.so API. The advantage is, that we do not generate any markup
ourselves, just download and extract some ZIPs. While the download feature seems
to be pretty stable, keep in mind that it still is an internal API, so it **may
break anytime**.

## Contributing

Want to help improve this tool, spotted a type or you need to add a new
use-case? Please submit issues and PRs on Github.

### Contributors

- Yann Bolliger, [@yannbolliger](https://github.com/yannbolliger)
- Guillermo C. Martínez, [@telekosmos](https://github.com/telekosmos)

NotionExporter.ts
这个文件实现了一个 NotionExporter 类，用于从 Notion 导出内容。我用中文为您解释主要功能：
核心功能
初始化
需要 Notion 的 token_v2 和 file_token 来认证
使用 axios 创建 HTTP 客户端，连接 Notion API
主要导出方法
getMdFiles: 导出为 Markdown 文件并保存到指定目录
getCsvString: 导出为 CSV 字符串
getMdString: 导出为 Markdown 字符串
getZip: 导出为 ZIP 文件

工作流程
任务创建 (getTaskId)
验证输入的 URL 或 blockId
向 Notion API 发送导出请求
返回任务 ID
任务轮询 (pollTask)
定期检查任务状态
成功时返回导出文件的 URL
失败时抛出错误
文件处理
下载 ZIP 文件
根据需求解压或提取特定文件
支持 CSV 和 Markdown 格式

配置选项
支持递归导出
可配置是否包含文件内容
可自定义轮询间隔
这是一个设计良好的导出工具，提供了灵活的 API 来处理 Notion 内容的导出需求。它使用 Promise 处理异步操作，并提供了多种导出格式的选择。

export NOTION_TOKEN="v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..Z8wtr0scxjKqtKv3I1Y-6A.7ufveykHnGBwsEWI8IUfBO8Ivwxb43cJzTp27RwZbg6UtEI9ocb6J4gLtLsZBskbDuITJIJfW580gACDKryE8jvyWwHA43gwBqvbYqzgPFM1ewxehRDR_XHeRrPTKDjZnNnOXkDzF0yg2IoWzR8r7Fj-IZuBv1JM97OpEtB0zZV0DfTrI1ympKEBSM9lSLaF2z3sDMtF2IXRa30nwWNA5Q-u2H36u5jyXdEd4y_YtBYqP6fu9oqbVsfj6fwR-EeeYJnwGMDUNkVvyeCH4usKcNNNwfDy_u_it5GOe-6pSZsCrWaNFz1ZYAezEa9IQiJJMAleWS151nGdvOyB9zOmm37FJRfeahVCA-mZRDjL_LQ.ldDcBgBtT73I0HRoxHTIfOTWDtp9PCtaoyxoVprc-wI"

export NOTION_FILE_TOKEN="v02%3Afile_token%3A5y0H2z5E71SsPvBQq4SVDh9LbXfkFDy7Ip-0q6siWs28OzP9EF5d0flt-VJQ-ZuW2Rt6HK_u62aCVheomsKZBMNSbixibOekoHrGSMadYiZhL7lTFd6LBkSHG7RciPrjzEOOVZP9R5AXzU5sBTY35WcQhCK7"

现在你可以使用以下命令将 Notion 页面导出为图片：
notion-exporter <page-id> -t image -o output.png

这个新的实现有以下特点：

使用 Puppeteer 将 Markdown 内容渲染为 HTML
提供了多个自定义选项：
template: 可以选择 'Simple' 或 'Full' 模板，或者自定义样式
font: 自定义字体
footer: 添加页脚文本
width: 设置图片宽度
quality: 设置图片质量（1-100）
样式设计：
使用了类似 Notion 的字体和颜色
优化了代码块、表格、引用等元素的样式
响应式布局，可以适应不同的宽度
支持深色文本和浅色背景，确保良好的可读性
技术特点：
使用 marked.js 解析 Markdown
自动调整视口高度以适应内容
2x 设备缩放比例，确保清晰的输出
支持完整的 Markdown 语法，包括表格、代码块等