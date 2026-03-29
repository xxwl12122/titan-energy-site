# Google Sheets 免费 Webhook

这份模板用于把网站表单提交直接写进 Google Sheets。  
适合“免费优先、先能稳定收表单”的场景。

## 你会得到什么

- 一个免费的 webhook URL
- 网站表单提交后自动进表格
- 收到新提交时自动发内部通知邮件
- 如果联系人填的是邮箱，可自动回一封确认邮件
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
  token: "你自己设的随机口令",
  senderName: "泰坦供能",
  replyTo: "sales@titanenergy.cn",
  notificationRecipients: ["sales@titanenergy.cn"],
  sendInternalNotification: true,
  sendAutoReply: true
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

## 邮件通知怎么工作

- `notificationRecipients`
  - 收到新表单时，内部通知会发到这些邮箱
- `sendInternalNotification`
  - `true` 表示开启内部通知
- `sendAutoReply`
  - `true` 表示如果联系人填的是邮箱，就自动回一封确认邮件
- `replyTo`
  - 用户收到自动邮件后，直接回复会回到这个邮箱

如果联系人填的是手机号而不是邮箱，自动回复会自动跳过，不影响表单入库。

如果当天邮件配额不足，表单仍然会先写入 Google Sheets，只是邮件会跳过。

## 如果你还想让网站后台 `/admin` 显示记录

需要把这份代码重新部署成最新版，因为它现在同时支持：

- `POST`：网站提交表单时写入 Google Sheets
- `GET?action=list`：网站后台读取最近提交记录

更新代码后，请重新执行一次：

1. `部署 -> 管理部署`
2. 找到当前 Web App
3. 选择 `编辑`
4. 重新部署最新版本

## 建议

- `token` 不要用简单字符串
- 表格第一行会自动创建标题
- 如果后面你想加邮件提醒、自动回复，也可以继续在 Apps Script 里扩展
