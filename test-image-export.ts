const { NotionExporter } = require("./dist");

// Notion tokens
const TOKEN_V2 = "v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..Z8wtr0scxjKqtKv3I1Y-6A.7ufveykHnGBwsEWI8IUfBO8Ivwxb43cJzTp27RwZbg6UtEI9ocb6J4gLtLsZBskbDuITJIJfW580gACDKryE8jvyWwHA43gwBqvbYqzgPFM1ewxehRDR_XHeRrPTKDjZnNnOXkDzF0yg2IoWzR8r7Fj-IZuBv1JM97OpEtB0zZV0DfTrI1ympKEBSM9lSLaF2z3sDMtF2IXRa30nwWNA5Q-u2H36u5jyXdEd4y_YtBYqP6fu9oqbVsfj6fwR-EeeYJnwGMDUNkVvyeCH4usKcNNNwfDy_u_it5GOe-6pSZsCrWaNFz1ZYAezEa9IQiJJMAleWS151nGdvOyB9zOmm37FJRfeahVCA-mZRDjL_LQ.ldDcBgBtT73I0HRoxHTIfOTWDtp9PCtaoyxoVprc-wI";
const FILE_TOKEN = "v02%3Afile_token%3A5y0H2z5E71SsPvBQq4SVDh9LbXfkFDy7Ip-0q6siWs28OzP9EF5d0flt-VJQ-ZuW2Rt6HK_u62aCVheomsKZBMNSbixibOekoHrGSMadYiZhL7lTFd6LBkSHG7RciPrjzEOOVZP9R5AXzU5sBTY35WcQhCK7";

// Notion page URL
const PAGE_URL = "https://www.notion.so/wtech/Getting-Started-af81a2ddde4f458c8828a82f3a97e662";

async function testImageExport() {
  try {
    const exporter = new NotionExporter(TOKEN_V2, FILE_TOKEN);
    
    console.log("开始导出图片...");
    
    await exporter.saveAsImage(
      PAGE_URL,
      "notion-page.png",
      {
        template: "Simple",
        font: "Default",
        footer: "Notion Exporter / Avatar-Name-Date",
        width: 1920,
        quality: 100
      }
    );
    
    console.log("图片导出成功！保存为 notion-page.png");
  } catch (error) {
    console.error("导出失败:", error);
  }
}

testImageExport();
