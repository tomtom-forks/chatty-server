import {render, screen} from "@testing-library/react"
import React, {MutableRefObject} from "react"
import toast from "react-hot-toast"
import useApiService from "@/services/useApiService"
import {OPENAI_DEFAULT_SYSTEM_PROMPT, OPENAI_DEFAULT_TEMPERATURE, TOAST_DURATION_MS} from "@/utils/app/const"
import {FALLBACK_OPENAI_MODEL_ID, OpenAIModels} from "@/types/openai"
import {HomeContextProps, useHomeContext} from "@/pages/api/home/home.context"
import Chat from "@/components/Chat/Chat"
import {useFetchWithUnlockCode, useUnlock} from "@/components/UnlockCode"
import {asMock} from "@/testutils"
import userEvent from "@testing-library/user-event"
import {v4 as uuidv4} from "uuid"

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str
    }
  },
  initReactI18next: {
    type: "3rdParty",
    init: () => {}
  }
}))

jest.mock("@/services/useApiService")
jest.mock("@/pages/api/home/home.context", () => {
  return {
    ...jest.requireActual("@/pages/api/home/home.context"),
    useHomeContext: jest.fn()
  }
})

jest.mock("react-hot-toast")

jest.mock("@/components/UnlockCode", () => {
  return {
    ...jest.requireActual("@/components/UnlockCode"),
    useUnlock: jest.fn(),
    useFetchWithUnlockCode: jest.fn()
  }
})

Element.prototype.scrollIntoView = jest.fn()

function mockResponse(response: Response) {
  asMock(useFetchWithUnlockCode).mockImplementation(() => {
    return {
      async get<T>(): Promise<T> {
        throw new Error("Not implemented")
      },
      async post<T>(): Promise<T> {
        return response as unknown as T
      }
    }
  })
}

describe("<Chat/>", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    asMock(useUnlock).mockReturnValue({
      isProtected: false,
      unlocked: true,
      code: "",
      setCode: () => {},
      invalidCode: false,
      setInvalidCode: () => {}
    })

    asMock(useHomeContext).mockReturnValue({
      state: {
        selectedConversation: {
          id: uuidv4(),
          name: "Test Conversation",
          messages: [],
          modelId: FALLBACK_OPENAI_MODEL_ID,
          prompt: OPENAI_DEFAULT_SYSTEM_PROMPT,
          temperature: OPENAI_DEFAULT_TEMPERATURE
        },
        conversations: [],
        prompts: [],
        models: [OpenAIModels[FALLBACK_OPENAI_MODEL_ID]],
        apiKey: "",
        pluginKeys: [],
        serverSideApiKeyIsSet: true,
        modelError: null,
        loading: false
      },
      handleUpdateConversation: () => {},
      dispatch: () => {}
    } as unknown as HomeContextProps)

    asMock(useApiService).mockReturnValue({
      getModels: () => Promise.resolve([]),
      getEndpoint: () => "stub"
    })
  })

  const stopConversationRef: MutableRefObject<boolean> = {current: false}

  it("should render", () => {
    // expect(container).toMatchSnapshot()
  })

  it("should handle auth error", async () => {
    mockResponse(new Response(JSON.stringify({errorType: "openai_auth_error"}), {status: 401}))

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      "Invalid API Key. Please enter the correct Azure OpenAI key in left menu bar of Chatty.",
      {duration: TOAST_DURATION_MS}
    )
  })

  it("should handle context length error", async () => {
    mockResponse(
      new Response(
        JSON.stringify({
          errorType: "context_length_exceeded",
          limit: 16384,
          requested: 50189
        }),
        {status: 400}
      )
    )

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      "This model's maximum context length is exceeded (16384 tokens but 50189 tokens requested). Please reduce the number of tokens in the request",
      {duration: TOAST_DURATION_MS}
    )
  })

  it("should handle rate limit error", async () => {
    mockResponse(
      new Response(
        JSON.stringify({
          errorType: "rate_limit",
          retryAfter: 26
        }),
        {status: 429}
      )
    )

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledTimes(1)

    expect(toast.error).toHaveBeenCalledWith("Too many requests. Please wait 26 seconds before trying again.", {
      duration: TOAST_DURATION_MS
    })
  })

  it("should handle generic openai error", async () => {
    mockResponse(
      new Response(
        JSON.stringify({
          errorType: "generic_openai_error",
          message: "Some human readable description"
        }),
        {status: 400}
      )
    )

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith("Some human readable description", {
      duration: TOAST_DURATION_MS
    })
  })

  it("should handle openai error", async () => {
    mockResponse(
      new Response(
        JSON.stringify({
          errorType: "openai_error",
          message: "Some human readable description"
        }),
        {status: 500}
      )
    )

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith("Some human readable description", {
      duration: TOAST_DURATION_MS
    })
  })

  it("should handle unknown error", async () => {
    mockResponse(
      new Response(
        JSON.stringify({
          errorType: "unexpected_error",
          message: "Some type error"
        }),
        {status: 500}
      )
    )

    render(<Chat stopConversationRef={stopConversationRef} />)

    await userEvent.type(screen.getByRole("textbox"), "hello there")
    await userEvent.click(screen.getByRole("button", {name: "Send Message"}))

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith("Unexpected server error. Please try again a bit later.", {
      duration: TOAST_DURATION_MS
    })
  })
})
