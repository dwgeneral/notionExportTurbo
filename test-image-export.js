const axios = require('axios');
const fs = require('fs').promises;

// Notion tokens
const TOKEN_V2 = "v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..Z8wtr0scxjKqtKv3I1Y-6A.7ufveykHnGBwsEWI8IUfBO8Ivwxb43cJzTp27RwZbg6UtEI9ocb6J4gLtLsZBskbDuITJIJfW580gACDKryE8jvyWwHA43gwBqvbYqzgPFM1ewxehRDR_XHeRrPTKDjZnNnOXkDzF0yg2IoWzR8r7Fj-IZuBv1JM97OpEtB0zZV0DfTrI1ympKEBSM9lSLaF2z3sDMtF2IXRa30nwWNA5Q-u2H36u5jyXdEd4y_YtBYqP6fu9oqbVsfj6fwR-EeeYJnwGMDUNkVvyeCH4usKcNNNwfDy_u_it5GOe-6pSZsCrWaNFz1ZYAezEa9IQiJJMAleWS151nGdvOyB9zOmm37FJRfeahVCA-mZRDjL_LQ.ldDcBgBtT73I0HRoxHTIfOTWDtp9PCtaoyxoVprc-wI";

// Notion page URL
const PAGE_URL = "https://www.notion.so/wtech/Getting-Started-af81a2ddde4f458c8828a82f3a97e662";

// 创建 axios 实例
const client = axios.create({
  baseURL: "https://www.notion.so/",
  headers: {
    Cookie: `token_v2=${TOKEN_V2}`,
    'Content-Type': 'application/json',
  },
});

// 从 URL 提取页面 ID
function getPageId(url) {
  const match = url.match(/([a-f0-9]{32})/);
  return match ? match[1] : null;
}

async function exportPageAsMarkdown() {
  try {
    console.log("开始导出 Markdown...");
    
    // 获取页面 ID
    const pageId = getPageId(PAGE_URL);
    if (!pageId) {
      throw new Error("Invalid page URL");
    }
    
    console.log("页面 ID:", pageId);
    
    // 直接下载 Markdown
    console.log("下载 Markdown...");
    const markdownResponse = await client.get(`/export/${pageId}`, {
      params: {
        type: 'markdown',
        recursive: true,
        timeZone: 'Asia/Shanghai',
        locale: 'en'
      },
      responseType: 'arraybuffer'
    });
    
    // 保存文件
    await fs.writeFile('notion-export.zip', Buffer.from(markdownResponse.data));
    console.log("导出成功！保存为 notion-export.zip");
    
  } catch (error) {
    console.error("导出失败:", error.response?.data || error.message || error);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应头:", error.response.headers);
    }
  }
}

exportPageAsMarkdown();
