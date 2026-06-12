declare module "@svg-maps/south-korea" {
  type SvgMapLocation = {
    name: string
    id: string
    path: string
  }

  type SvgMap = {
    label: string
    viewBox: string
    locations: SvgMapLocation[]
  }

  const map: SvgMap
  export default map
}
