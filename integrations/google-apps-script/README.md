# Google Sheets 免费 Webhook

这份模板用于把网站表单提交直接写进 Google Sheets。  
适合“免费优先、先能稳定收表单”的场景。

## 你会得到什么

- 一个免费的 webhook URL
- 网站表单提交后自动进表格
- 不需要自己买数据库

## 使用步骤

1. 新建一个 Google Sheet
2. 打开 `扩展程序 -> Apps Script`
3. 把 `Code.gs` 内容全部贴进去
4. 修改下面两个配置：

```javascript
const CONFIG = {
  spreadsheetId: "你的 Google Sheet ID",
  sheetName: "submissions",
  token: "你自己设的随机口令"
};
```

5. 点击 `部署 -> 新建部署 -> Web 应用`
6. `执行身份` 选你自己
7. `谁可以访问` 选 `任何人`
8. 部署后会拿到一个 Web App URL

## 在 Vercel 里要配置什么

把下面这个值填到 `CONTACT_WEBHOOK_URL`：

```text
https://script.google.com/macros/s/你的部署ID/exec?token=你自己设的随机口令
```

配置完成后，网站的 `/api/contact` 就会把表单转发到 Google Sheets。

## 建议

- `token` 不要用简单字符串
- 表格第一行会自动创建标题
- 如果后面你想加邮件提醒、自动回复，也可以继续在 Apps Script 里扩展
