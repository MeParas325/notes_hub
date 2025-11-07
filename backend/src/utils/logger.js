import chalk from "chalk";

const logger = {

     start: (req) => {
        req._startTime = Date.now();
        // const now = new Date().toLocaleTimeString("en-US", {
        //     hour: "2-digit",
        //     minute: "2-digit",
        //     second: "2-digit",
        //     hour12: true,
        // });
        console.log(
            chalk.bgBlue.cyanBright.bold(
                ` [START]: ${req.method} ${req.originalUrl} at ${new Date().toISOString()} `
            )
        );
    },

    end: (req, res, message = "Done", status = 200) => {
        const duration = Date.now() - (req._startTime || Date.now());
        const color = status >= 400 ? chalk.bgRed.white.bold : chalk.bgGreen.black.bold; // 🟢 success stands out

        console.log(color(` [END]: ${req.method} ${req.originalUrl} → ${message} (status: ${status}) in ${duration}ms`));
    },

    info: (message) => {
        console.log(chalk.blue(`[INFO]: ${message}`));
    },
    error: (message) => {
        console.log(chalk.red(`[WARM]: ${message}`));
    },
     custom: (label, message, color = "white") => {
        const coloredLabel = chalk[color](`[${label.toUpperCase()}]`);
        console.log(`${coloredLabel} ${message}`);
    }
}

export default logger;