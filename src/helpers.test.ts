/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { getEnvVariable, genId } from './helpers' // Adjust the path

describe('Helper Functions', () => {
  describe('getEnvVariable', () => {
    it('should return the value of a set environment variable', () => {
      const testVar = 'TEST_VARIABLE'
      const testValue = 'value'
      process.env[testVar] = testValue

      expect(getEnvVariable(testVar)).toBe(testValue)

      // Clean up
      delete process.env[testVar]
    })

    it('should throw an error if the environment variable is not set', () => {
      const testVar = 'UNSET_VARIABLE'
      delete process.env[testVar] // Ensure it's not set

      expect(() => getEnvVariable(testVar)).toThrow(`Environment variable ${testVar} not set`)
    })
  })

  describe('genId', () => {
    it('should generate a string of the specified length', () => {
      const length = 10
      const id = genId(length)

      expect(id).toHaveLength(length)
      expect(typeof id).toBe('string')
    })

    it('should generate a string consisting only of hexadecimal characters', () => {
      const length = 10
      const id = genId(length)

      // Regex to match a hexadecimal string
      expect(id).toMatch(/^[0-9a-f]+$/i)
    })
  })
})
