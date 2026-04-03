# KDocs Wiki (金山文档知识库) API 参考文档

> 通过浏览器 Chrome DevTools 实际探索发现的 API 接口，供 CLI 适配器开发使用。

## 基本信息

- **Base URL**: `https://www.kdocs.cn`
- **认证方式**: Cookie (Tier 2)，需要 `wps_sid`、`kso_sid`、`csrf` 等 Cookie
- **CSRF Token**: 写操作需要 `csrfmiddlewaretoken`，值来自 Cookie 中的 `csrf` 字段
- **Content-Type**: 写操作使用 `application/json`（创建知识库使用 `application/x-www-form-urlencoded`）

## ID 说明

| ID 类型 | 格式 | 示例 | 说明 |
|---------|------|------|------|
| space_kuid | `0s_XXXXXXXXX` | `0s_3053257612` | 知识库 ID |
| file_kuid | `0lcXXXXXXXXXX` | `0lcoI049jpH8TY` | 文件/节点 ID |
| group_id | 纯数字 | `2674413330` | 知识库组 ID (用于配置修改) |
| drive_id | 纯数字 | `3053257612` | 驱动器 ID (等于 space_kuid 去掉 `0s_` 前缀) |
| link_id | 字母数字 | `coI049jpH8TY` | 链接 ID (用于 URL 路径) |

## 1. 查询知识库列表 (list)

```
GET /wiki/api/km/space/list?classify=all&page_size=300
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| classify | string | 是 | 分类筛选，`all` 表示全部，`manager` 表示我管理的 |
| page_size | number | 是 | 每页数量 |

**响应** (`code: 0` 表示成功):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "has_more": false,
    "list": [
      {
        "kuid": "0s_3053257612",
        "kuid_type": "space_t",
        "space_name": "测试知识库",
        "cover_img": "https://zl.wpscdn.cn/...",
        "desc": "测试知识库 - AI生成知识库",
        "group_id": "2674413330",
        "drive_id": "3053257612",
        "has_permission": true,
        "utime": 1772720347,
        "follow": false,
        "top": false,
        "square_category": "doclib",
        "member_total": 0,
        "corp_id": 0
      }
    ]
  }
}
```

## 2. 查询知识库详情 (info)

```
GET /wiki/api/km/kuid/meta?kuid={kuid}&is_record=true
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 知识库的 space_kuid 或文件的 file_kuid |
| is_record | boolean | 否 | 是否记录访问 |
| resource | string | 否 | 可选 `permissions`，返回权限信息 |

## 3. 创建个人知识库 (create-space)

```
POST /wiki/api/km/group/create
Content-Type: application/x-www-form-urlencoded
```

**请求体** (form-urlencoded):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识库名称 |
| desc | string | 否 | 知识库描述 |
| cover_img | string | 否 | 封面图片 URL |
| space_type | string | 是 | 空间类型，固定 `"personal"` |
| square_category | string | 是 | 类别，固定 `"doclib"` |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kuid": "0s_3074005481",
    "group_id": "2681479779",
    "drive_id": "3074005481"
  }
}
```

## 4. 修改知识库基础配置 (config)

```
POST /wiki/api/km/group/knowledge_view
Content-Type: application/json
```

**请求体**:
```json
{
  "group_id": "2674413330",
  "name": "新的知识库名称",
  "desc": "新的描述",
  "cover_img": "https://zl.wpscdn.cn/...",
  "status": 1,
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group_id | string | 是 | 知识库的 group_id |
| name | string | 是 | 名称 |
| desc | string | 否 | 描述 |
| cover_img | string | 否 | 封面 URL |
| status | number | 是 | 状态，`1` 表示正常 |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

## 5. 查询文件/文件夹列表 (files)

```
GET /wiki/api/km/file/node/locate?kuid={space_kuid}&page_size=50
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 知识库的 space_kuid |
| page_size | number | 否 | 每页数量，默认 50 |

**响应** (简化):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "title": "目录",
    "child_num": 75,
    "kuid": "0s_3053257612",
    "node_list": [
      {
        "title": "测试文档",
        "doc_type": "w",
        "doc_origin_type": "docx",
        "kuid": "0lcoI049jpH8TY",
        "ctime": 1772720347,
        "space_kuid": "0s_3053257612",
        "link_id": "coI049jpH8TY",
        "file_id": "498688995978",
        "parent_id": "0",
        "shortcut": true,
        "child_num": 0,
        "size": 1,
        "node_list": [],
        "expand": false
      }
    ]
  }
}
```

**doc_type 文档类型**:
| 值 | 说明 |
|----|------|
| `w` | 文字文档 (Word/docx) |
| `s` | 表格 (Sheet/et/xlsx) |
| `p` | 演示 (PowerPoint/pptx) |
| `f` | PDF 文件 |
| `o` | 大纲/脑图 (otl) |
| `pof` | WPS脑图转PPT (pof) |
| `unknown` | 未知类型 |

## 6. 创建文件/文件夹 (create-file)

```
POST /wiki/api/km/file/create
Content-Type: application/json
```

**请求体**:
```json
{
  "kuid": "0s_3053257612",
  "title": "新文件名",
  "doc_type": "w",
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 目标知识库的 space_kuid (创建到根目录) 或父文件夹的 kuid |
| title | string | 是 | 文件名称 |
| doc_type | string | 是 | 文档类型 (`w`/`s`/`p` 等) |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kuid": "0lckAINF1VlB9J",
    "url": "https://www.kdocs.cn/l/ckAINF1VlB9J?source=kmwiki",
    "title": "新文件名"
  }
}
```

## 7. 重命名文件/文件夹 (rename)

```
POST /wiki/api/km/file/operate
Content-Type: application/json
```

**请求体**:
```json
{
  "kuid": "0lcoI049jpH8TY",
  "action": "rename",
  "title": "新名称",
  "operate_kdocs": true,
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 文件的 kuid |
| action | string | 是 | 固定 `"rename"` |
| title | string | 是 | 新名称 |
| operate_kdocs | boolean | 否 | 是否操作云文档，建议 `true` |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

## 8. 移动文件/文件夹 (move)

```
POST /wiki/api/km/file/move
Content-Type: application/json
```

**请求体** (推测，端点已确认存在):
```json
{
  "kuid": "0lcoI049jpH8TY",
  "target_kuid": "0s_3053257612",
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 要移动的文件的 kuid |
| target_kuid | string | 是 | 目标位置的 kuid (知识库或文件夹) |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

> **注意**: 端点已确认存在 (返回 400 业务异常而非 404)，具体参数名可能需要微调。

## 9. 删除知识库文件/文件夹 (delete-file)

```
POST /wiki/api/km/file/delete
Content-Type: application/json
```

**请求体**:
```json
{
  "kuid": "0lcoI049jpH8TY",
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 要删除的文件 kuid |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

**补充**: 删除后会有异步任务，可通过 `GET /wiki/api/km/task/progress?task_id={task_id}` 查询进度。

## 10. 删除知识库 (delete-space)

```
POST /wiki/api/km/space/close
Content-Type: application/json
```

**请求体** (推测，端点已确认存在):
```json
{
  "kuid": "0s_3053257612",
  "csrfmiddlewaretoken": "xxxxx"
}
```

> **注意**: UI 中使用 "关闭知识库" 按钮触发，端点在不同页面上下文下行为可能不同。已确认端点存在 (返回参数错误而非 404)。

## 11. 下载知识库文件/文件夹 (download)

```
GET /api/v3/office/file/{file_id}/download
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file_id | string (路径参数) | 是 | 文件的数字 ID（来自文件列表 API 的 `file_id` 字段） |

**响应**:
```json
{
  "download_url": "https://ksc-bj.ag.kdocs.cn/api/object/2_xxx/compatible?response-content-disposition=attachment%3Bfilename...&KSSAccessKeyId=...&Expires=...&Signature=...",
  "url": "https://ksc-bj.ag.kdocs.cn/api/object/2_xxx/compatible?...",
  "fize": 11669,
  "fver": 1,
  "store": "",
  "status": "finished"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| download_url | string | 签名下载 URL（有时效性） |
| url | string | 同 download_url |
| fize | number | 文件大小（字节） |
| fver | number | 文件版本 |
| status | string | 下载状态，`"finished"` 表示可下载 |

**使用方式**: 先调用此 API 获取 `download_url`，然后直接 GET 该 URL 下载文件二进制内容。

> **注意**: `file_id` 不是 `kuid`，需要先通过文件列表 API (Section 5) 获取文件的 `file_id` 字段。

## 12. 上传文件到知识库 (upload)

上传是一个 **3 步流程**：

### Step 1: 申请上传 (Apply)

```
POST /wiki/api/km/upload/file/apply
Content-Type: application/json
```

**请求体**:
```json
{
  "kuid": "0s_3074005481",
  "name": "test-upload.txt",
  "size": 68,
  "content_sha256": "0488bfbd4ac0e4646231dcf3a3e0786ed2103cf6de5ada5f1b5d16cfb6697fab",
  "from": "",
  "action": null,
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kuid | string | 是 | 目标知识库的 space_kuid |
| name | string | 是 | 文件名 |
| size | number | 是 | 文件大小 (字节) |
| content_sha256 | string | 是 | 文件内容的 SHA-256 哈希值 |
| from | string | 否 | 来源，默认空字符串 |
| action | null | 否 | 操作类型，默认 null |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "7b0266ec3dfb0a13171206d4d838331e",
    "multi_upload": false,
    "request": {
      "body_params": null,
      "headers": [{"name": "Content-Length", "value": "68"}],
      "method": "PUT",
      "url": "https://ksc-bj.ag.kdocs.cn/api/object/1_cb5f020387654a05be8f5eebe77d4dda"
    },
    "response": {
      "body_keys": null,
      "header_keys": null
    }
  }
}
```

关键字段:
- `data.id`: 上传 ID，用于 Step 3 确认
- `data.request.url`: 存储上传 URL
- `data.request.method`: 上传方法 (PUT)
- `data.request.headers`: 需要携带的请求头
- `data.multi_upload`: 是否分片上传

### Step 2: 上传文件到存储 (Upload)

```
PUT {data.request.url}
```

使用 Step 1 返回的 `data.request.url`，将文件二进制内容 PUT 上传：

- **方法**: `data.request.method` (通常为 PUT)
- **URL**: `data.request.url` (如 `https://ksc-bj.ag.kdocs.cn/api/object/1_xxxx` 或 `https://hwc-bj.ag.kdocs.cn/api/object/1_xxxx`)
- **Headers**: 按 `data.request.headers` 设置 (至少包含 `Content-Length`)
- **Body**: 文件的原始二进制内容

### Step 3: 确认上传 (Ack)

```
POST /wiki/api/km/upload/ack
Content-Type: application/json
```

**请求体**:
```json
{
  "store_response": [],
  "id": "7b0266ec3dfb0a13171206d4d838331e",
  "kuid": "0s_3074005481",
  "multi_upload": false,
  "csrfmiddlewaretoken": "xxxxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | Step 1 返回的上传 ID (`data.id`) |
| kuid | string | 是 | 目标知识库的 space_kuid |
| store_response | array | 是 | 存储响应数据，通常为空数组 `[]` |
| multi_upload | boolean | 是 | 与 Step 1 返回的 `data.multi_upload` 保持一致 |
| csrfmiddlewaretoken | string | 是 | CSRF Token |

---

## 辅助 API

### 用户信息
```
GET /wiki/api/km/user/info?kuid={space_kuid}
```

### 文件置顶列表
```
GET /wiki/api/km/file/top/list?kuid={space_kuid}
```

### 权限检查
```
GET /wiki/api/km/kuid/meta?kuid={kuid}&resource=permissions
```

### 任务进度查询
```
GET /wiki/api/km/task/progress?task_id={task_id}
```

### Wiki 权限 (另一域名)
```
GET https://wiki.kdocs.cn/kwiki/api/v1/wiki/{space_kuid}/permissions
```

### 知识库广场状态
```
GET https://wiki.kdocs.cn/kwiki/api/v1/knowledge/square?drive_id={drive_id}
```

---

## Cookie 说明

关键 Cookie:
| 名称 | 说明 |
|------|------|
| `wps_sid` | WPS 登录会话 ID |
| `kso_sid` | KSO 登录会话 ID |
| `csrf` | CSRF Token，需作为 `csrfmiddlewaretoken` 参数传入写操作请求 |
| `uid` | 用户 ID |

## 知识库详情页 URL 格式

```
https://www.kdocs.cn/wiki/l/{kuid}/0
```

其中 `{kuid}` 为 space_kuid，如 `0s_3053257612`。
