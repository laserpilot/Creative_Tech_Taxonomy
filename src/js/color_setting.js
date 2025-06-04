/* -------------------------------------------------------------------------- */
/*                                 set colors                                 */
/* -------------------------------------------------------------------------- */
export const defaultColor = "#ccc"

export const defaultBackgroundColor = "aliceblue"

export function getColor(name) {
  switch (name) {
    // Main Taxonomy Categories
    case "Creative Code Frameworks":
      return "pink"
    case "Game Engines and Real-Time 3D":
      return "mediumorchid"
    case "Web and Networking Tools":
      return "plum"
    case "Sensors and Interaction Methods":
      return "tomato"
    case "Physical Computing":
      return "khaki"
    case "Display Tech and Video":
      return "darkturquoise"
    case "Professional AV Tools":
      return "skyblue"
    case "AI/Machine Learning":
      return "lightgreen"
    case "Uncategorized Tools and Utilities":
      return "firebrick"
    case "Mobile Technology":
      return "goldenrod"
    case "Asset Creation":
      return "deeppink"
    case "Physical Output and Digital Fabrication":
      return "lightseagreen"

    // Interaction Taxonomy Categories
    case "Interaction Categories":
      return "lightgray"
    case "Observed Body Action":
      return "lightblue"
    case "Physical Interactions":
      return "lightgreen"
    case "Sensor Types":
      return "plum"
    case "Interaction Types":
      return "pink"
    case "Intentional/Active":
      return "forestgreen"
    case "Involuntary/Passive":
      return "dodgerblue"
    case "Inanimate or Environmental Sensing":
      return "teal"

    default:
      return "#ccc"
  }
}
