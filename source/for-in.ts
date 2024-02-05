/**
 * Iterates over the properties of an object and invokes a callback function for each property.
 *
 * @param obj - The object to iterate over.
 * @param callback - The callback function to invoke for each property. It receives the value and key of the property.
 * @returns void
 */
export default function forIn (obj: any, callback: (value: any, key: string) => void) {
  if (typeof obj !== 'object' || obj === null) {
    return
  }

  const keys = Object.keys(obj)
  for (const key of keys) {
    const value = obj[key]
    callback(value, key)
  }
}
