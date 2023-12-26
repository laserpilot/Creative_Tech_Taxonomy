/* -------------------------------------------------------------------------- */
/*                                 set colors                                 */
/* -------------------------------------------------------------------------- */
export const defaultColor = "#ccc"

export const defaultBackgroundColor = "aliceblue"

export function getColor(name) {
  switch (name) {
    case "Creative Code Frameworks":
      return "pink"
    case "Real-time 3D/Game Engines":
      return "deepskyblue"
    case "AI/Machine Learning":
      return "red"
    case "Uncategorized Utilities/DevOps":
      return "firebrick"
    case "Pro AV Hardware and Related Software":
      return "darksalmon"
    case "Optical Tracking":
      return "darkmagenta"
    case "Sensors/Interaction Methods":
      return "darkviolet"
    case "Physical Computing":
      return "lightblue"
    case "Web/Networking Frameworks":
      return "limegreen"
    case "Mobile Technology":
      return "gold"
    case "Asset Creation":
      return "deeppink"
    default:
      return "#ccc"
  }
}
