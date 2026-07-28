/**
 * 模板表达式解析工具
 * 支持 {{name}} 格式的简单模板
 */

export class TemplateEngine {
  /**
   * 解析模板字符串
   */
  static parse(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      return this.getValueByPath(data, path) ?? match
    })
  }

  /**
   * 通过路径获取值
   */
  private static getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
