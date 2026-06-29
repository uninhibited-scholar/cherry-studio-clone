export interface TemplateVariable {
  name: string
  defaultValue?: string
}

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g

export function parseVariables(template: string): TemplateVariable[] {
  const seen = new Set<string>()
  const vars: TemplateVariable[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(VARIABLE_REGEX.source, 'g')
  while ((match = re.exec(template)) !== null) {
    const raw = match[1].trim()
    const colonIdx = raw.indexOf(':')
    const name = colonIdx >= 0 ? raw.slice(0, colonIdx).trim() : raw
    const defaultValue = colonIdx >= 0 ? raw.slice(colonIdx + 1).trim() : undefined
    if (!seen.has(name)) {
      seen.add(name)
      vars.push({ name, defaultValue })
    }
  }
  return vars
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(VARIABLE_REGEX, (_match, raw) => {
    const trimmed = raw.trim()
    const colonIdx = trimmed.indexOf(':')
    const name = colonIdx >= 0 ? trimmed.slice(0, colonIdx).trim() : trimmed
    const defaultValue = colonIdx >= 0 ? trimmed.slice(colonIdx + 1).trim() : ''
    return values[name] ?? defaultValue
  })
}
