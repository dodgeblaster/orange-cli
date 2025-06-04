import process from 'node:process'

/**
 * Log Functions
 *
 * In order to understand the console.log functions in this
 * file, it is recommended to read thru this article:
 * https://notes.burke.libbey.me/ansi-escape-codes/
 * This article explains ANSI codes, and what all the weird strings
 * are in this file.
 */
const ANSI_PREFIX = '\x1b[' // also known as a CSI, or Control Sequence Introducer
const HIDE_CURSOR = ANSI_PREFIX + '?25l'
const SHOW_CURSOR = ANSI_PREFIX + '?25h'
const MOVE_CURSOR_TO_NEXT_LINE = ANSI_PREFIX + '1G'
const GREEN_TEXT = ANSI_PREFIX + '32m'
const BLUE_TEXT = ANSI_PREFIX + '34m'
const AQUA_TEXT = ANSI_PREFIX + '36m'
const WHITE_TEXT = ANSI_PREFIX + '37m'
const RED_TEXT = ANSI_PREFIX + '31m'
const DIM_TEXT = ANSI_PREFIX + '2m'
const BRIGHT_TEXT = ANSI_PREFIX + '0m'

export function print(text) {
    console.log(text)
}

export function makeGreenText(text) {
    return `${GREEN_TEXT}${text}${WHITE_TEXT}`
}

export function makeBlueText(text) {
    return `${BLUE_TEXT}${text}${WHITE_TEXT}`
}

export function makeAquaText(text) {
    return `${AQUA_TEXT}${text}${WHITE_TEXT}`
}

export function makeRedText(text) {
    return `${RED_TEXT}${text}${WHITE_TEXT}`
}

export function makeDimText(text) {
    return `${DIM_TEXT}${text}${BRIGHT_TEXT}`
}

export function setTextWidth(text, length) {
    return text.padEnd(length, ' ')
}

export function printInfoMessage(text) {
    print(text)
}

export function printSuccessMessage(text) {
    print(makeGreenText(text))
}

export function printErrorMessage(text) {
    print(makeRedText(text))
}

export function clear() {
    console.clear()
}

export function hideCursor() {
    print(HIDE_CURSOR)
}

export function showCursor() {
    print(SHOW_CURSOR)
}

let loadingInterval
export function startLoadingMessage(text) {
    if (!process.stdout.isTTY) {
        console.log(text)
        return
    }

    const std = process.stdout
    const dots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const spinnerFrames = dots
    let index = 0

    const log = () => {
        let line = spinnerFrames[index]
        if (!line) {
            index = 0
            line = spinnerFrames[index]
        }

        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        std.write(AQUA_TEXT + line + WHITE_TEXT + ' ' + text)

        index = index >= spinnerFrames.length ? 0 : index + 1
    }

    clearInterval(loadingInterval)
    log()
    loadingInterval = setInterval(log, 100)
}

export function endLoadingMessage() {
    clearInterval(loadingInterval)
}

/**
 * CLI Functions
 */
function command(fn) {
    return async (options) => {
        hideCursor()
        clear()
        try {
            await fn(options)
            showCursor()
        } catch (e) {
            console.log(e)
            throw new Error(e)
            printErrorMessage(e.message)
            showCursor()
        }
    }
}

let program = {}

export function addCommand(config) {
    program[config.command] = command(config.action)
}

export function parseArgs(args) {
    const command = args[0];
    const options = {};
    
    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const option = args[i].slice(2);
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                options[option] = args[i + 1];
                i++; // Skip the next argument as it's the value
            } else {
                options[option] = true; // Flag without value
            }
        }
    }
    
    return { command, options };
}

export function runProgram() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);


    if (program[command]) {
        program[command](options);
    } else {
        console.log('Command not found');
    }
}