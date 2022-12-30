
export class LinkerNoMethodFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker no method found, detail: ${JSON.stringify(detail)}`)
  }
}
