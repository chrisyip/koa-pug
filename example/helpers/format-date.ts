const moduleName = 'format'

function moduleBody (input: Date) {
  return `${input.getMonth() + 1}/${input.getDate()}/${input.getFullYear()}`
}

export {
  moduleName,
  moduleBody
}
