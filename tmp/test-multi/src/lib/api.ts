import { supabase } from "./supabase";

export const api = {
    getTemplateByHash: async (hashValue: string) => {
        const { data, error } = await supabase
            .from('templowcode')
            .select("*")
            .eq('hashValue', hashValue)
            .single()

        if (error) {
            throw error
        }

        return data
    },
    postTemplate: async (template: { hashValue: string, template: any }) => {
        const { data, error } = await supabase
            .from('templowcode')
            .insert([template])
        if (error) {
            throw error
        }

        return data
    },
    // 通用 API 请求方法
    fetchData: async (config: { url: string, suffix?: string, method: string, token?: string }) => {
        console.log(config);

        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        }

        // if (config.token) {
        //     headers['Authorization'] = `Bearer ${config.token}`
        // }

        // 拼接 URL 和 suffix
        let fullUrl = config.suffix ? `${config.url}${config.suffix}` : config.url
        if (config.token) {
            fullUrl += "?token=" + config.token
        }
        console.log(import.meta.env.VITE_CHART_API_URL);
        console.log(fullUrl);

        const response = await fetch(fullUrl, {
            method: config.method || 'GET',
            headers
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
    },
    saveBusinessComponent: async (component:
        {
            name: string,
            type: string,
            icon: string,
            componentData: {
                type: string,
                width: number,
                height: number,
                props: any,
                api: any,
                isBusinessComponent: true
            }
        }
    ) => {
        const { data, error } = await supabase
            .from('tempcomponent')
            .insert([component])
        if (error) {
            throw error
        }
        return data
    },
    getTableData: async (name: string) => {
        const { data, error } = await supabase
            .from('tempchartdata')
            .select("*")
            .eq('name', name)
        if (error) {
            throw error
        }
        return data
    }
}