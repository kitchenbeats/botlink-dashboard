import {
  SiJavascript,
  SiTypescript,
  SiDocker,
  SiPython,
  SiRuby,
  SiGo,
  SiJson,
  SiYaml,
  SiMarkdown,
  SiGnubash,
} from 'react-icons/si'
import { IconType } from 'react-icons/lib'

/**
 * Maps programming language/file type identifiers to their corresponding React icons
 * from the react-icons/si package. Used to display language-specific icons in the Documentation.
 *
 * @example
 * const Icon = IconsMap['typescript'] // Returns SiTypescript icon component
 */
export const IconsMap: Record<string, IconType> = {
  dockerfile: SiDocker,
  javascript: SiJavascript,
  typescript: SiTypescript,
  python: SiPython,
  ruby: SiRuby,
  go: SiGo,
  json: SiJson,
  yaml: SiYaml,
  md: SiMarkdown,
  terminal: SiGnubash,
}
