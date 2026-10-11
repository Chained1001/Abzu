import * as fs from 'node:fs'
import * as path from 'node:path'

/** 技能包内文件的绝对路径（packages/bundle/skills/<name>/<rel>）；目录同样适用。 */
export function skillFile(name: string, rel: string): string {
  return path.join(__dirname, '..', 'skills', name, rel)
}

export function skillPath(name: string): string {
  return skillFile(name, 'SKILL.md')
}

export function readSkill(name: string): string {
  return fs.readFileSync(skillPath(name), 'utf8')
}
