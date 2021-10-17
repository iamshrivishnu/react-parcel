#!/usr/bin/env node
import chalk from 'chalk'
import Commander from 'commander'
import path from 'path'
import validateProjectName from 'validate-npm-package-name'
import { createApp } from './create-app'
import packageJson from './package.json'

let projectPath: string = ''

const validateNpmName = (name: string): { valid: boolean; problems?: string[] } => {
  const nameValidation = validateProjectName(name)
  if (nameValidation.validForNewPackages) {
    return { valid: true }
  }

  return {
    valid: false,
    problems: [
      ...(nameValidation.errors || []),
      ...(nameValidation.warnings || []),
    ],
  }
}

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')}`)
  .action((name) => {
    projectPath = name
  }).parse(process.argv)

async function run(): Promise<void> {
  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim()
  }

  if (!projectPath) {
    console.log()
    console.log('Please specify the project directory:')
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
    )
    console.log()
    console.log('For example:')
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-parcel-app')}`)
    process.exit(1)
  }

  console.log("Path : ",projectPath)
  
  const resolvedProjectPath = path.resolve(projectPath)
  console.log("Resolved Path : ",resolvedProjectPath)
  const projectName = path.basename(resolvedProjectPath)
  console.log("Project Name: ",projectName)
  
  const { valid, problems } = validateNpmName(projectName)
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    )

    problems!.forEach((p) => console.error(`    ${chalk.red.bold('*')} ${p}`))
    process.exit(1)
  }

  try {
    await createApp({
      appPath: resolvedProjectPath
    })
  } catch (reason) {
    throw reason
  }
}

run()
  .then(()=>{
    console.log()
    console.log()
    console.log(chalk.green('Setup Complete'))
    console.log()
  })
  .catch(async (reason) => {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`)
    } else {
      console.log(chalk.red('Unexpected error. Please report it as a bug:'))
      console.log(reason)
    }
    console.log()
    process.exit(1)
  })
