import chalk from 'chalk'
import cpy from 'cpy'
import fs from 'fs'
import os from 'os'
import path from 'path'
import spawn from 'cross-spawn'

const isWriteable = async (directory: string): Promise<boolean> => {
  try {
    await fs.promises.access(directory, fs.constants.W_OK)
    return true
  } catch (err) {
    return false
  }
}

const install = (
  dependencies: string[] | null,
  devDependencies : boolean
): Promise<void> => {
  /**
   * Return a Promise that resolves once the installation is finished.
   */
  return new Promise((resolve, reject) => {
    let args: string[] = []

    if (dependencies && dependencies.length) {
      /**
       * If there are dependencies, run a variation of `{displayCommand} add`.
       */
        args = ['install', '--save-exact']
        args.push(devDependencies ? '--save-dev' : '--save')
        args.push(...dependencies)
    }
    /**
     * Spawn the installation process.
     */
    const child = spawn('npm', args, {
      stdio: 'inherit',
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject({ command: `npm ${args.join(' ')}` })
        return
      }
      resolve()
    })
  })
}

export async function createApp({
  appPath
}: {
  appPath: string
}): Promise<void> {
  const root = path.resolve(appPath)
  console.log(" Root:  ",root)
  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      'The application path is not writable, please check folder permissions and try again.'
    )
    console.error(
      'It is likely you do not have write permissions for this folder.'
    )
    process.exit(1)
  }

  const appName = path.basename(root)

  await fs.promises.mkdir(root, { recursive: true })
  if (!fs.readdirSync(root)) {
    process.exit(1)
  }
  
  const originalDirectory = process.cwd()

  console.log(`Creating a new React app in ${chalk.green(root)}.`)
  console.log()
  process.chdir(root)

  /**
   * Create a package.json for the new project.
   */
  const packageJson = {
    name: appName,
    version: '1.0.0',
    private: true,
    scripts: {
      "start": "parcel \"./public/index.html\" --open -p 3000",
      "build": "parcel build \"./public/index.html\" --out-dir build",
    },
  }
  /**
   * Write it to disk.
   */
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )
  /**
   * Default dependencies.
   */
  const dependencies = ['react', 'react-dom']
  /**
   * Default devDependencies.
   */
  const devDependencies = ['@babel/preset-env', '@babel/preset-react', 'parcel']
  /**
   * Install package.json dependencies if they exist.
   */
  if (dependencies.length) {
    console.log()
    console.log('Installing dependencies:')
    for (const dependency of dependencies) {
      console.log(`- ${chalk.cyan(dependency)}`)
    }
    console.log()

    await install(dependencies, false)
  }
  /**
   * Install package.json devDependencies if they exist.
   */
  if (devDependencies.length) {
    console.log()
    console.log('Installing devDependencies:')
    for (const devDependency of devDependencies) {
      console.log(`- ${chalk.cyan(devDependency)}`)
    }
    console.log()
    await install(devDependencies, true)
  }
  console.log()
  /**
   * Copy the template files to the target directory.
   */
  await cpy('**', root, {
    parents: true,
    overwrite: true,
    cwd: path.join(__dirname,'..', 'template'),
    rename: (name:any) => {
      switch (name) {
        case 'gitignore':
        case 'eslintrc': {
          return '.'.concat(name)
        }
        case 'README-template.md': {
          return 'README.md'
        }
        default: {
          return name
        }
      }
    },
  })

  let cdpath: string
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName
  } else {
    cdpath = appPath
  }

  console.log(`${chalk.green('Success!')} Created ${appName} at ${appPath}`)
  console.log('Inside that directory, you can run several commands:')
  console.log()
  console.log(chalk.cyan('  npm start'))
  console.log('    Starts the development server.')
  console.log()
  console.log(chalk.cyan('  npm run build'))
  console.log('    Builds the app for production.')
  console.log()
  console.log('We suggest that you begin by typing:')
  console.log()
  console.log(chalk.cyan('  cd'), cdpath)
  console.log(chalk.cyan('  npm start'))
  console.log()
}
