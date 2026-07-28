import { request } from '../api/request'

interface TemplatePayload {
    hashValue: string
    template: Record<string, unknown>
}

export const api = {
    getTemplateByHash: async (hashValue: string) => {
        return request.get(`/templates/${encodeURIComponent(hashValue)}`)
    },
    postTemplate: async (template: TemplatePayload) => {
        return request.post('/templates', template)
    }
}
