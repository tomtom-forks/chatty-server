import {OpenAIModel, OpenAIModelID, OpenAIModels} from "@/types/openai"

export const config = {
  runtime: "edge"
}

const STATIC_MODELS = ["gpt-35-turbo", "gpt-35-turbo-16k", "gpt-4", "gpt-4-32k"]
const handler = async (req: Request): Promise<Response> => {
  const models = STATIC_MODELS.map((model) => {
    for (const [key, value] of Object.entries(OpenAIModelID)) {
      if (value === model) {
        return {
          id: model,
          name: OpenAIModels[value].name,
          tokenLimit: OpenAIModels[value].tokenLimit
        }
      }
    }
  })
    .filter(Boolean)
    .filter((obj: any, index: any, self: any) => {
      return index === self.findIndex((other: any) => other.id === obj.id)
    })
  return new Response(JSON.stringify(models), {status: 200})
}

export default handler
