import { Button, Divider, Form, Input, Link, Typography } from "@arco-design/web-react"
import { IconHome, IconLock, IconUser } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { ofetch } from "ofetch"
import { useEffect, useMemo, useState } from "react"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router"

import useLanguage, { polyglotState } from "@/hooks/useLanguage"
import useTheme from "@/hooks/useTheme"
import { authState, setAuth } from "@/store/authState"
import { settingsState } from "@/store/settingsState"
import isValidAuth from "@/utils/auth"
import { Message, Notification } from "@/utils/feedback"
import { handleEnterKeyToSubmit, validateAndFormatFormFields } from "@/utils/form"
import hideSpinner from "@/utils/loading"
import "./Login.css"

const Login = () => {
  useLanguage()
  useTheme()

  const auth = useStore(authState)
  const { homePage } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const [loginForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const urlParamsObj = useMemo(() => Object.fromEntries(searchParams), [searchParams])
  const [authMethod, setAuthMethod] = useState(urlParamsObj.username ? "user" : "token")
  /* token or user */
  const location = useLocation()
  const navigate = useNavigate()

  const [redirectTo] = useState(() => location.state?.from)

  const performHealthCheck = async (auth) => {
    setLoading(true)
    const { server, token, username, password } = auth
    try {
      const response = await ofetch.raw("v1/me", {
        baseURL: server,
        headers: token
          ? { "X-Auth-Token": token }
          : { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
      })
      if (response.status === 200) {
        Notification.success({
          title: polyglot.t("login.success"),
        })
        setAuth({ server, token, username, password })
        navigate(redirectTo || `/${homePage}`, { replace: true })
      }
    } catch (error) {
      console.error(error)
      Notification.error({
        title: polyglot.t("login.error"),
        content: error.message,
      })
    }
    setLoading(false)
  }

  const handleLogin = async (auth) => {
    if (!isValidAuth(auth)) {
      Message.error(polyglot.t("login.auth_error"))
      return
    }
    await performHealthCheck(auth)
  }

  useEffect(() => {
    hideSpinner()
  }, [])

  useEffect(() => {
    const url = new URL(globalThis.location.href)
    const { server, token, username, password } = Object.fromEntries(url.searchParams)
    if (server) {
      loginForm.setFieldsValue({ server, token, username, password })
      loginForm.submit()
    }
  }, [loginForm, polyglot])

  if (isValidAuth(auth)) {
    return <Navigate to={redirectTo || `/${homePage}`} />
  }

  return (
    polyglot && (
      <div className="page-layout">
        <div className="form-panel">
          <div className="login-form">
            <Typography.Title className="login-title" heading={3}>
              {polyglot.t("login.login_to_your_server")}
            </Typography.Title>
            <Form
              autoComplete="off"
              form={loginForm}
              layout="vertical"
              onSubmit={async () => {
                if (validateAndFormatFormFields(loginForm)) {
                  history.replaceState(history.state, "", "/login")
                  await handleLogin(loginForm.getFieldsValue())
                } else {
                  Message.error(polyglot.t("login.submit_error"))
                }
              }}
            >
              <Form.Item
                field="server"
                label={polyglot.t("login.server_label")}
                rules={[{ required: true }]}
                onKeyDown={(event) => {
                  handleEnterKeyToSubmit(event, loginForm)
                }}
              >
                <Input
                  disabled={loading}
                  placeholder={polyglot.t("login.server_placeholder")}
                  prefix={<IconHome />}
                />
              </Form.Item>
              {authMethod === "token" && (
                <Form.Item
                  field="token"
                  label={polyglot.t("login.token_label")}
                  rules={[{ required: true }]}
                  onKeyDown={(event) => {
                    handleEnterKeyToSubmit(event, loginForm)
                  }}
                >
                  <Input.Password
                    disabled={loading}
                    placeholder={polyglot.t("login.token_placeholder")}
                    prefix={<IconLock />}
                  />
                </Form.Item>
              )}
              {authMethod === "user" && (
                <>
                  <Form.Item
                    field="username"
                    label={polyglot.t("login.username_label")}
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm)
                    }}
                  >
                    <Input
                      disabled={loading}
                      placeholder={polyglot.t("login.username_placeholder")}
                      prefix={<IconUser />}
                    />
                  </Form.Item>
                  <Form.Item
                    field="password"
                    label={polyglot.t("login.password_label")}
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm)
                    }}
                  >
                    <Input.Password
                      disabled={loading}
                      placeholder={polyglot.t("login.password_placeholder")}
                      prefix={<IconLock />}
                    />
                  </Form.Item>
                </>
              )}
            </Form>
            <Button
              long
              className="login-submit"
              loading={loading}
              type="primary"
              onClick={() => loginForm.submit()}
            >
              {polyglot.t("login.login_button")}
            </Button>
            <Divider>{polyglot.t("login.another_login_method")}</Divider>
            <Button
              long
              type="secondary"
              onClick={() => setAuthMethod(authMethod === "token" ? "user" : "token")}
            >
              {authMethod === "token"
                ? polyglot.t("login.another_login_button")
                : polyglot.t("login.token_label")}
            </Button>
            <div className="login-help">
              <Typography.Text disabled>{polyglot.t("login.need_help")}</Typography.Text>
              <Link
                className="login-help-link"
                href="https://miniflux.app/docs/api.html#authentication"
              >
                {polyglot.t("login.miniflux_official_website")}
              </Link>
            </div>
          </div>
        </div>
        <div className="background" />
      </div>
    )
  )
}

export default Login
