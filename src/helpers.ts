/**
 * Retrieves the value of an environment variable.
 * This function looks up an environment variable by its name and returns its value.
 * If the environment variable is not set, it throws an error.
 *
 * @param {string} name - The name of the environment variable to retrieve.
 * @returns {string} The value of the environment variable.
 * @throws {Error} If the environment variable is not set.
 *
 * @example
 * ```
 * try {
 *   const databaseUrl = getEnvVariable('DATABASE_URL');
 *   console.log(databaseUrl);
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export const getEnvVariable = (name: string): string => {
  const value = process.env[name]
  if (value == null) {
    throw new Error(`Environment variable ${name} not set`)
  }
  return value
}

/**
 * Generates a random hexadecimal string of a specified length.
 * This function creates a string composed of random hexadecimal digits.
 * The length of the generated string is determined by the input parameter.
 *
 * @param {number} length - The length of the hexadecimal string to generate.
 * @returns {string} A random hexadecimal string of the specified length.
 *
 * @example
 * ```
 * const randomId = genId(16);
 * console.log(randomId); // Outputs a 16-character hexadecimal string.
 * ```
 */
export const genId = (length: number): string => {
  let result = ''
  for (let i = 0; i < length; i++) {
    // Generate a random number between 0 and 15, then convert it to a hexadecimal string
    const randomHexDigit = Math.floor(Math.random() * 16).toString(16)
    result += randomHexDigit
  }
  return result
}

/**
 * Formats a Date object into a string.
 * This function converts a Date object into a string in the format 'YYYY-MM-DD HH:MM:SS'.
 * The time is formatted to the local timezone.
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string.
 *
 * @example
 * ```
 * const currentDate = new Date();
 * const formattedDate = formatDate(currentDate);
 * console.log(formattedDate); // Outputs the current date and time in 'YYYY-MM-DD HH:MM:SS' format.
 * ```
 */
export const formatDate = (date: Date): string => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}
