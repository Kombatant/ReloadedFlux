import { ofetch } from "ofetch"

import router from "@/routes"
import { authState } from "@/store/authState"
import { setServerUnreachable } from "@/store/connectionState"
import isValidAuth from "@/utils/auth"

// Reason phrases spelled out because HTTP/2 responses carry an empty statusText.
const GATEWAY_ERROR_STATUSES = new Map([
  [502, "Bad Gateway"],
  [503, "Service Unavailable"],
  [504, "Gateway Timeout"],
])

// 创建 ofetch 实例并设置默认配置
const createApiClient = () => {
  return ofetch.create({
    retry: 3, // 默认重试次数
    onRequest({ _request, options }) {
      const auth = authState.get()
      if (!isValidAuth(auth)) {
        throw new Error("Invalid auth")
      }
      const { server, token, username, password } = auth
      options.baseURL = server
      options.headers = token
        ? { "X-Auth-Token": token }
        : { Authorization: `Basic ${btoa(`${username}:${password}`)}` }
    },
    onResponse({ _request, _options, _response }) {
      // 请求成功，说明服务器可达，清除离线状态
      setServerUnreachable(false)
    },
    onRequestError({ _request, _options, error }) {
      // 网络层错误（连接失败/超时/DNS），视为服务器不可达
      setServerUnreachable(true, { status: null, message: error?.message ?? "" })
      console.error("Request error:", error)
    },
    async onResponseError({ _request, response, _options }) {
      const statusCode = response.status
      if (statusCode === 401) {
        localStorage.removeItem("auth")
        await router.navigate("/login")
      }
      // Only gateway errors mean Miniflux itself is unreachable. A plain 500 is
      // Miniflux answering, often to relay a failure from a third-party site
      // (fetch-content, discover, create/refresh feed), so the caller's own
      // error handling covers it.
      if (GATEWAY_ERROR_STATUSES.has(statusCode)) {
        setServerUnreachable(true, {
          status: statusCode,
          statusText: GATEWAY_ERROR_STATUSES.get(statusCode),
        })
      }
      // 处理响应错误
      const errorMessage = response._data?.error_message ?? response.statusText
      console.error("Response error:", errorMessage)
      throw new Error(errorMessage)
    },
  })
}

const apiClient = createApiClient()
apiClient.get = (url) => apiClient(url, { method: "GET" })
apiClient.post = (url, body) => apiClient(url, { method: "POST", body })
apiClient.put = (url, body) => apiClient(url, { method: "PUT", body })

export default apiClient
