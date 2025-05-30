# Linking Guidelines for Creative Tech Taxonomy

## Overview
This document establishes rules for adding links to taxonomy entries to ensure consistency, authority, and usefulness while avoiding misrepresentation or promotional bias.

## Core Principles

### 1. Authority Over Promotion
- Prefer neutral, authoritative sources over promotional content
- Avoid links that could be seen as endorsements of specific commercial services
- When in doubt, choose comprehensive overviews over specific examples

### 2. Representation Accuracy  
- Links should represent the full scope of a topic, not just one perspective
- Avoid linking to examples that users might mistake for "the" authority on a topic
- Multiple links should cover different aspects (official, docs, community, etc.)

## Link Categories & Rules

### Specific Tools/Software/Frameworks
**✅ DO:**
- Official website (primary)
- Official documentation 
- GitHub repository (if open source)
- Official community forum/Discord
- Learning resources from the creators

**❌ DON'T:**
- Third-party tutorials (unless officially endorsed)
- Commercial course platforms
- Personal blogs about the tool
- Alternative/competing tools in the same entry

**Example:**
```json
"TouchDesigner": {
  "links": {
    "Official Website": "https://derivative.ca/",
    "Documentation": "https://docs.derivative.ca/", 
    "Community": "https://forum.derivative.ca/"
  }
}
```

### Programming Languages
**✅ DO:**
- Official language website
- Official documentation
- Language specification/standard
- Wikipedia (for historical context)

**❌ DON'T:**
- Learning platforms (Codecademy, etc.)
- Specific IDEs or editors
- Tutorial sites

### Broad Concepts/Fields/Methodologies
**✅ DO:**
- Wikipedia (preferred for general concepts)
- Academic/research institution overviews
- Industry standard organization sites
- Leave empty if no authoritative general source exists

**❌ DON'T:**
- Commercial platforms claiming to represent the field
- Specific examples or implementations
- Personal blogs or opinion pieces
- Startup/company sites claiming authority

**Example:**
```json
"Data Visualization": {
  "links": {
    "Wikipedia": "https://en.wikipedia.org/wiki/Data_visualization"
  }
}
```

### Hardware/Physical Objects
**✅ DO:**
- Manufacturer's official site (if single manufacturer)
- Wikipedia (for categories or standards)
- Industry standards organizations
- Technical specifications

**❌ DON'T:**
- Reseller sites
- Review sites
- Comparison sites

### Historical/Legacy Tools
**✅ DO:**
- Wikipedia (primary choice)
- Archive.org for historical documentation
- Museum or preservation sites
- Original manufacturer sites (if still available)

**❌ DON'T:**
- Modern alternatives claiming to replace them
- Nostalgia or fan sites
- Commercial sites selling legacy versions

### Emerging Technologies/Concepts
**✅ DO:**
- Research institution pages
- Standards body sites
- Wikipedia (if established enough)
- Leave empty if too new/undefined

**❌ DON'T:**
- Startup sites claiming to define the space
- News articles or hype pieces
- Individual research papers (unless foundational)

## Special Cases

### When to Leave Links Empty
- **Very broad concepts** without clear authority (e.g., "creativity")
- **Emerging topics** still being defined
- **Categories that are organizational only** (e.g., "Language Type")
- **Topics where all available links are promotional/biased**

### Multiple Links Strategy
When including multiple links, ensure they serve different purposes:
- **Official** (primary resource)
- **Documentation** (technical reference)  
- **Community** (support/discussion)
- **Wikipedia** (neutral overview)
- **GitHub** (source code)

### Link Naming
- Use descriptive names: "Official Website" not "Website"
- Be specific: "API Documentation" not "Docs"
- Indicate content type: "GitHub" not "Code"
- Use consistent naming across entries

## Quality Checklist

Before adding any link, ask:
- [ ] Is this an authoritative source for this topic?
- [ ] Does this represent the topic comprehensively?
- [ ] Could users mistake this for "the" authority when it's just one example?
- [ ] Is this neutral or promotional in nature?
- [ ] Will this link still be relevant in 2-3 years?
- [ ] Does this link serve a different purpose than the others already included?

## Examples by Category

### ✅ Good Examples
```json
"Processing": {
  "links": {
    "Official Website": "https://processing.org/",
    "Documentation": "https://processing.org/reference/",
    "GitHub": "https://github.com/processing/processing"
  }
}

"Machine Learning": {
  "links": {
    "Wikipedia": "https://en.wikipedia.org/wiki/Machine_learning"
  }
}

"Arduino": {
  "links": {
    "Official Website": "https://www.arduino.cc/",
    "Documentation": "https://docs.arduino.cc/",
    "Community": "https://forum.arduino.cc/"
  }
}
```

### ❌ Bad Examples
```json
"Creative Coding": {
  "links": {
    "Awesome Course": "https://creativecoding-course.com/",
    "Best Tutorial": "https://johnscodingblog.com/creative-coding"
  }
}

"AI in Art": {
  "links": {
    "ArtAI Startup": "https://artai-platform.com/",
    "My AI Art Gallery": "https://myaiart.gallery/"
  }
}
```

## Review Process
1. **Draft links** following these guidelines
2. **Review for authority** - are these the best possible sources?
3. **Check for bias** - do any links seem promotional?
4. **Test longevity** - are these likely to remain stable?
5. **Validate representation** - do these links serve the user's need to understand the topic?

---

*These guidelines should be followed for all taxonomy content enhancement to maintain consistency and quality across the entire project.*